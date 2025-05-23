import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast'; // Import ToastModule
import { ConfirmDialogModule } from 'primeng/confirmdialog'; // Import ConfirmDialogModule

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { OfficeService } from '../../services/office.service';
import { Office, OfficeForm } from '../../models/office-interface';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service'; // Para obtener lang actual si es necesario
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-offices',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToolbarModule,
    TooltipModule,
    RippleModule,
    ToastModule,
    ConfirmDialogModule,
    TranslateModule,
  ],
  templateUrl: './offices.component.html',
  // styleUrls: ['./offices.component.css'], // Descomentar si se añaden estilos específicos
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService] // ToastService y TranslationService son proveídos en root
})
export class OfficesComponent implements OnInit {
  public officeService = inject(OfficeService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  public translationService = inject(TranslationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  lang = computed(() => this.translationService.currentLang);

  // Señales del servicio  

  // Formulario y estado del diálogo
  officeForm!: FormGroup;
  officeDialog: WritableSignal<boolean> = signal(false);
  submitted: WritableSignal<boolean> = signal(false);
  currentOfficeId: WritableSignal<string | null> = signal(null);

  // Título del diálogo computado
  dialogTitle = computed(() => {
    const key = this.currentOfficeId() ? 'ADMIN.OFFICES.EDIT_TITLE' : 'ADMIN.OFFICES.NEW_TITLE';
    return this.translationService.instant(key);
  });

  constructor() {

  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.officeForm = this.fb.group({
      name_es: ['', [Validators.required, Validators.minLength(3)]],
      name_en: ['', [Validators.required, Validators.minLength(3)]],
      name_zh: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  openNew(): void {
    this.submitted.set(false);
    this.currentOfficeId.set(null);
    this.officeForm.reset(); // Limpiar el formulario
    this.officeDialog.set(true);
  }

  async deleteOffice(office: Office): Promise<void> {
    this.confirmationService.confirm({
      message: this.translationService.instant('COMMON.CONFIRM_DELETE_MESSAGE_ITEM'),
      header: this.translationService.instant('COMMON.CONFIRM_DELETE_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translationService.instant('COMMON.YES'),
      rejectLabel: this.translationService.instant('COMMON.NO'),
      accept: async () => {
        try {
          await this.officeService.deleteOffice(office.id);
          this.toastService.success(
            this.translationService.instant('ADMIN.OFFICES.SUCCESS_DELETED_TITLE'),
            this.translationService.instant('ADMIN.OFFICES.SUCCESS_DELETED_DETAIL' )
          );
        } catch (error) {
          console.error('Error deleting office:', error);
          this.toastService.error(
            this.translationService.instant('COMMON.ERROR_DELETING_TITLE'),
            this.getErrorMessage(error)
          );
        }
        this.cdr.detectChanges(); // Forzar detección de cambios si es necesario
      }
    });
  }

  hideDialog(): void {
    this.officeDialog.set(false);
    this.submitted.set(false);
    this.currentOfficeId.set(null);
  }

  async saveOffice(): Promise<void> {
    this.submitted.set(true);
    if (this.officeForm.invalid) {
      this.toastService.error(
        this.translationService.instant('COMMON.FORM_INVALID_TITLE'),
        this.translationService.instant('COMMON.FORM_INVALID_DETAIL')
      );
      // Marcar todos los campos como tocados para mostrar errores
      Object.values(this.officeForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const officeData: any = {
      name_es: this.officeForm.value.name_es.trim(),
      name_en: this.officeForm.value.name_en.trim(),
      name_zh: this.officeForm.value.name_zh.trim()
    };

    try {
      if (this.currentOfficeId()) { // Editando
        await this.officeService.updateOffice(this.currentOfficeId()!, officeData);
        this.toastService.success(
          this.translationService.instant('ADMIN.OFFICES.SUCCESS_UPDATED_TITLE'),
          this.translationService.instant('ADMIN.OFFICES.SUCCESS_UPDATED_DETAIL', )
        );
      } else { // Creando
        await this.officeService.createOffice(officeData);
        this.toastService.error(
          this.translationService.instant('ADMIN.OFFICES.SUCCESS_CREATED_TITLE'),
          this.translationService.instant('ADMIN.OFFICES.SUCCESS_CREATED_DETAIL')
        );
      }
      this.officeDialog.set(false);
      this.currentOfficeId.set(null);
      this.officeForm.reset();
    } catch (error) {
      console.error('Error saving office:', error);
      this.toastService.error(
        this.translationService.instant('COMMON.ERROR_SAVING_TITLE'),
        this.getErrorMessage(error)
      );
    } finally {
      this.submitted.set(false);
      this.cdr.detectChanges(); // Forzar detección de cambios
    }
  }

  private getErrorMessage(error: any): string {
    if (error && error.message) {
      return error.message;
    }
    return this.translationService.instant('COMMON.UNEXPECTED_ERROR_DETAIL');
  }

  // Helpers para acceder a los controles del formulario en la plantilla
  get f() { return this.officeForm.controls; }
}