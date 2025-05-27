import { Component, inject, model, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { OfertasEmpleoService } from '../../services/ofertas-empleo.service';
import { OfertasEmpleo, TipoTrabajo, Jornada } from '../../models/ofertas-empleo.interface';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-nuevo-empleo',
  standalone: true,
  imports: [
    DrawerModule,
    TranslateModule,
    ButtonModule,
    DividerModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    InputNumberModule,
    MultiSelectModule
  ],
  templateUrl: './nuevo-empleo.component.html',
  styleUrls: ['./nuevo-empleo.component.css']
})
export class NuevoEmpleoComponent {
  visible = model(false);

  themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private ofertasService = inject(OfertasEmpleoService);
  private toastService = inject(ToastService);
  public translationService = inject(TranslationService);

  empleoForm!: FormGroup;
  isLoading = signal(false);
  buttonLabel = signal('ACTIONS.SAVE');
  buttonIcon = signal('pi pi-save');

  // Opciones para los selects
  tipoTrabajoOptions = [
    { label: 'Presencial', value: 'Presencial' as TipoTrabajo },
    { label: 'Híbrido', value: 'Híbrido' as TipoTrabajo },
    { label: 'Remoto', value: 'Remoto' as TipoTrabajo }
  ];

  jornadaOptions = [
    { label: 'Completa', value: 'Completa' as Jornada },
    { label: 'Parcial', value: 'Parcial' as Jornada }
  ];

  requisitosOptions = [
    { label: 'Licenciatura', value: 'Licenciatura' },
    { label: 'Maestría', value: 'Maestría' },
    { label: 'Doctorado', value: 'Doctorado' },
    { label: 'Experiencia mínima 1 año', value: 'Experiencia mínima 1 año' },
    { label: 'Experiencia mínima 3 años', value: 'Experiencia mínima 3 años' },
    { label: 'Experiencia mínima 5 años', value: 'Experiencia mínima 5 años' },
    { label: 'Inglés avanzado', value: 'Inglés avanzado' },
    { label: 'Mandarín básico', value: 'Mandarín básico' },
    { label: 'Disponibilidad para viajar', value: 'Disponibilidad para viajar' }
  ];

  constructor() {
    this.empleoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      proyecto: ['', [Validators.required]],
      lugar: ['', [Validators.required]],
      tipoTrabajo: [null, [Validators.required]],
      tipoJornada: [null, [Validators.required]],
      vacantes: [1, [Validators.required, Validators.min(1)]],
      fechaPublicacion: [new Date(), [Validators.required]],
      fechaCierre: [null, [Validators.required]],
      requisitos: [[], []]
    });
  }

  onCreateEmpleo(): void {
    if (this.empleoForm.invalid) {
      this.toastService.error('COMMON.FORM_INVALID_TITLE', 'COMMON.FORM_INVALID_DETAIL');
      Object.values(this.empleoForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.buttonLabel.set('ACTIONS.CREATING');
    this.buttonIcon.set('pi pi-spin pi-spinner');

    const formValues = this.empleoForm.value;
    
    this.ofertasService.createOfertaWithTranslation(
      formValues.nombre,
      formValues.descripcion,
      formValues.proyecto,
      formValues.lugar,
      formValues.tipoTrabajo,
      formValues.tipoJornada,
      formValues.vacantes,
      formValues.fechaPublicacion,
      formValues.fechaCierre,
      formValues.requisitos || []
    )
      .then(() => {
        this.toastService.success('TOAST.EXITO', 'JOBS.MESSAGES.CREATE_SUCCESS');
        this.resetFormAndClose();
      })
      .catch(error => {
        console.error("Error creating job offer:", error);
        this.toastService.error('TOAST.ERROR', 'JOBS.MESSAGES.CREATE_ERROR');
        this.resetButtonAndLoadingState();
      });
  }

  private resetButtonAndLoadingState(): void {
    this.isLoading.set(false);
    this.buttonLabel.set('ACTIONS.SAVE');
    this.buttonIcon.set('pi pi-save');
  }

  onCancel(): void {
    this.resetFormAndClose();
  }

  private resetFormAndClose(): void {
    this.empleoForm.reset();
    this.empleoForm.patchValue({
      fechaPublicacion: new Date(),
      vacantes: 1,
      requisitos: []
    });
    this.visible.set(false);
    this.resetButtonAndLoadingState();
  }

  // Helper para la plantilla
  get f() { return this.empleoForm.controls; }
}
