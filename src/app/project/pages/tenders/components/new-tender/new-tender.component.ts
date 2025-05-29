import { Component, Input, Output, EventEmitter, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

// PrimeNG Modules
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';

// Services and Models
import { TenderService } from '../../services/tender.service';
import { Tender, TenderStatus, TenderModality, TenderCurrency } from '../../models/tender-interface';
import { tenderTypes } from '../../../../../core/constants/tender-types';
import { tenderModalityTypes } from '../../constants/tender-modality-types';
import { tenderStatusTypes } from '../../constants/tender-status-types';
import { tenderCurrencyTypes } from '../../constants/tender-currency-types';
import { TranslationService } from '../../../../../core/services/translation.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Timestamp } from '@angular/fire/firestore';
import { UserService } from '../../../../../auth/services/user.service';

@Component({
  selector: 'app-new-tender',
  templateUrl: './new-tender.component.html',
  styleUrls: ['./new-tender.component.css'],
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DrawerModule,
    ButtonModule,
    DividerModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule
  ]
})
export class NewTenderComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() projectId: string = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() tenderCreated = new EventEmitter<void>();  private fb = inject(FormBuilder);
  private tenderService = inject(TenderService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);
  private userService = inject(UserService);

  tenderForm!: FormGroup;
  loading = signal(false);

  user = computed(() => this.userService.usuario());

  // Options for selects
  tenderTypes = tenderTypes;
  tenderModalityTypes = tenderModalityTypes;
  tenderStatusTypes = tenderStatusTypes;
  tenderCurrencyTypes = tenderCurrencyTypes;

  ngOnInit() {
    this.initializeForm();
  }  private initializeForm() {
    this.tenderForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      tenderType: ['', Validators.required],
      tenderModality: ['', Validators.required],
      tenderStatus: ['En Preparación', Validators.required],
      tenderCurrency: ['USD', Validators.required],
      tenderStartDate: [null, Validators.required],
      inquiryDeadline: [null],
      answerDeadline: [null],
      submissionDeadline: [null, Validators.required],
      aclarationsDeadline: [null],
      answerAclarationsDeadline: [null],
      openOfferDeadline: [null, Validators.required],
      awardDate: [null]
    }, { validators: this.dateOrderValidator });

    // Agregar listener para validar fechas cuando cambien
    this.tenderForm.valueChanges.subscribe(() => {
      this.tenderForm.updateValueAndValidity();
    });
  }

  closeDrawer() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }  resetForm() {
    this.tenderForm.reset();
    this.tenderForm.patchValue({
      tenderStatus: 'En Preparación',
      tenderCurrency: 'USD'
    });
  }
  async onSubmit() {
    if (this.tenderForm.valid && this.projectId) {
      console.log('📋 Iniciando creación de licitación...', {
        formValue: this.tenderForm.value,
        projectId: this.projectId
      });
      
      this.loading.set(true);
      
      try {
        const formValue = this.tenderForm.value;
        console.log('📝 Datos del formulario:', formValue);
        
        // Crear objeto base para traducir
        const tenderBase = {
          name: formValue.name,
          name_es: '',
          name_en: '',
          name_zh: '',
          description: formValue.description,
          description_es: '',
          description_en: '',
          description_zh: '',
          tenderType: formValue.tenderType,
          tenderModality: formValue.tenderModality as TenderModality,
          tenderStatus: formValue.tenderStatus as TenderStatus,
          tenderCurrency: formValue.tenderCurrency as TenderCurrency,
          idProject: this.projectId
        };

        console.log('🌐 Iniciando traducción automática...');
        // Traducir automáticamente usando el servicio
        const tenderTranslated = await this.translationService.translateJson(tenderBase);
        console.log('✅ Traducción completada:', tenderTranslated);
          // Crear objeto final con todas las fechas como Timestamp
        const newTender: Omit<Tender, 'id'> = {
          ...tenderTranslated,
          tenderStartDate: formValue.tenderStartDate ? Timestamp.fromDate(new Date(formValue.tenderStartDate)) : Timestamp.now(),
          inquiryDeadline: formValue.inquiryDeadline ? Timestamp.fromDate(new Date(formValue.inquiryDeadline)) : Timestamp.now(),
          answerDeadline: formValue.answerDeadline ? Timestamp.fromDate(new Date(formValue.answerDeadline)) : Timestamp.now(),
          submissionDeadline: formValue.submissionDeadline ? Timestamp.fromDate(new Date(formValue.submissionDeadline)) : Timestamp.now(),          aclarationsDeadline: formValue.aclarationsDeadline ? Timestamp.fromDate(new Date(formValue.aclarationsDeadline)) : Timestamp.now(),
          answerAclarationsDeadline: formValue.answerAclarationsDeadline ? Timestamp.fromDate(new Date(formValue.answerAclarationsDeadline)) : Timestamp.now(),
          openOfferDeadline: Timestamp.fromDate(new Date(formValue.openOfferDeadline)),
          awardDate: formValue.awardDate ? Timestamp.fromDate(new Date(formValue.awardDate)) : Timestamp.now(),
          userCreator: this.user()!, // Se asignará en el servicio
          dateCreated: Timestamp.now(),
          lastModification: Timestamp.now(),
          OrganizationAccess: [],
        };console.log('💾 Guardando licitación en la base de datos...', newTender);
        
        // Convertir Observable a Promise para usar con await
        const createResult = await firstValueFrom(this.tenderService.createTender(newTender));
        
        console.log('🎉 ¡Licitación creada exitosamente!', createResult);
        this.toastService.success(
          'TOAST.EXITO',
          'TENDERS.MESSAGES.CREATE_SUCCESS'
        );
        
        this.tenderCreated.emit();
        this.closeDrawer();
      } catch (error) {
        console.error('❌ Error creating tender:', error);
        this.toastService.error(
          'TOAST.ERROR',
          'TENDERS.MESSAGES.CREATE_ERROR'
        );
      } finally {
        this.loading.set(false);
      }
    } else {
      console.warn('⚠️ Formulario inválido o falta projectId:', {
        formValid: this.tenderForm.valid,
        projectId: this.projectId,
        formErrors: this.getFormErrors()
      });
      
      this.toastService.error(
        'COMMON.FORM_INVALID_TITLE',
        'COMMON.FORM_INVALID_DETAIL'
      );
      
      // Marcar todos los campos como tocados para mostrar errores
      Object.values(this.tenderForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tenderForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }  getFieldError(fieldName: string): string {
    const field = this.tenderForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return this.translationService.instant('TENDERS.FORM.REQUIRED_FIELD');
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo ${requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `El valor mínimo es ${field.errors['min'].min}`;
      }
      if (field.errors['dateOrder']) {
        return field.errors['dateOrder'];
      }
    }
    return '';
  }

  private getFormErrors(): any {
    let formErrors: any = {};
    Object.keys(this.tenderForm.controls).forEach(key => {
      const controlErrors = this.tenderForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }

  /**
   * Validador personalizado para verificar el orden cronológico de las fechas
   */
  private dateOrderValidator = (group: FormGroup) => {
    const tenderStartDate = group.get('tenderStartDate')?.value;
    const inquiryDeadline = group.get('inquiryDeadline')?.value;
    const answerDeadline = group.get('answerDeadline')?.value;
    const submissionDeadline = group.get('submissionDeadline')?.value;
    const openOfferDeadline = group.get('openOfferDeadline')?.value;
    const aclarationsDeadline = group.get('aclarationsDeadline')?.value;
    const answerAclarationsDeadline = group.get('answerAclarationsDeadline')?.value;
    const awardDate = group.get('awardDate')?.value;

    const errors: any = {};

    // Convertir fechas a objetos Date para comparación
    const dates = {
      start: tenderStartDate ? new Date(tenderStartDate) : null,
      inquiry: inquiryDeadline ? new Date(inquiryDeadline) : null,
      answer: answerDeadline ? new Date(answerDeadline) : null,
      submission: submissionDeadline ? new Date(submissionDeadline) : null,
      openOffer: openOfferDeadline ? new Date(openOfferDeadline) : null,
      clarifications: aclarationsDeadline ? new Date(aclarationsDeadline) : null,
      answerClarifications: answerAclarationsDeadline ? new Date(answerAclarationsDeadline) : null,
      award: awardDate ? new Date(awardDate) : null
    };

    // Verificar orden cronológico: inicio < consultas < respuestas < ofertas < apertura < aclaraciones < respuestas aclaraciones < adjudicación
    
    // 1. Inicio debe ser antes que todo lo demás
    if (dates.start) {
      if (dates.inquiry && dates.start >= dates.inquiry) {
        errors.inquiryDeadline = { dateOrder: 'Las consultas deben ser después del inicio' };
      }
      if (dates.answer && dates.start >= dates.answer) {
        errors.answerDeadline = { dateOrder: 'Las respuestas deben ser después del inicio' };
      }
      if (dates.submission && dates.start >= dates.submission) {
        errors.submissionDeadline = { dateOrder: 'La presentación debe ser después del inicio' };
      }
      if (dates.openOffer && dates.start >= dates.openOffer) {
        errors.openOfferDeadline = { dateOrder: 'La apertura debe ser después del inicio' };
      }
      if (dates.award && dates.start >= dates.award) {
        errors.awardDate = { dateOrder: 'La adjudicación debe ser después del inicio' };
      }
    }

    // 2. Consultas antes que respuestas
    if (dates.inquiry && dates.answer && dates.inquiry >= dates.answer) {
      errors.answerDeadline = { dateOrder: 'Las respuestas deben ser después de las consultas' };
    }

    // 3. Respuestas antes que presentación de ofertas
    if (dates.answer && dates.submission && dates.answer >= dates.submission) {
      errors.submissionDeadline = { dateOrder: 'La presentación debe ser después de las respuestas' };
    }

    // 4. Presentación antes que apertura
    if (dates.submission && dates.openOffer && dates.submission >= dates.openOffer) {
      errors.openOfferDeadline = { dateOrder: 'La apertura debe ser después de la presentación' };
    }

    // 5. Aclaraciones (si existen) deben tener orden lógico
    if (dates.clarifications) {
      if (dates.submission && dates.clarifications <= dates.submission) {
        errors.aclarationsDeadline = { dateOrder: 'Las aclaraciones deben ser después de la presentación' };
      }
      if (dates.answerClarifications && dates.clarifications >= dates.answerClarifications) {
        errors.answerAclarationsDeadline = { dateOrder: 'Las respuestas a aclaraciones deben ser después de las aclaraciones' };
      }
    }

    // 6. Adjudicación debe ser la última
    if (dates.award) {
      if (dates.openOffer && dates.award <= dates.openOffer) {
        errors.awardDate = { dateOrder: 'La adjudicación debe ser después de la apertura' };
      }
      if (dates.answerClarifications && dates.award <= dates.answerClarifications) {
        errors.awardDate = { dateOrder: 'La adjudicación debe ser después de las respuestas a aclaraciones' };
      }
    }

    // Establecer errores en los controles individuales
    Object.keys(errors).forEach(field => {
      const control = group.get(field);
      if (control) {
        control.setErrors({ ...control.errors, ...errors[field] });
      }
    });

    return Object.keys(errors).length > 0 ? errors : null;
  };
}