import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

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
import { Office } from '../../models/office-interface';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service'; // Para obtener lang actual si es necesario
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

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
    ProgressSpinnerModule
  ],
  templateUrl: './offices.component.html',
  // styleUrls: ['./offices.component.css'], // Descomentar si se añaden estilos específicos
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficesComponent {
  public officeService = inject(OfficeService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  public translationService = inject(TranslationService);
  public translateService = inject(TranslateService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  lang = computed(() => this.translationService.currentLang);

 
  offices: Signal<Office[]> = computed(() => this.officeService.offices());
  loading: Signal<boolean> = computed(() => this.officeService.loading());




  openNew(): void {

  }

  async deleteOffice(office: Office): Promise<void> {
    this.confirmationService.confirm({
      message: this.translateService.instant('COMMON.CONFIRM_DELETE_MESSAGE_ITEM', { item: office.name }),
      header: this.translationService.instant('COMMON.CONFIRM_DELETE_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translationService.instant('COMMON.YES'),
      rejectLabel: this.translationService.instant('COMMON.NO'),
      accept: async () => {
        try {
          await this.officeService.deleteOffice(office.id);
          this.toastService.success(
            this.translationService.instant('ADMIN.OFFICES.SUCCESS_DELETED_TITLE'),
            this.translateService.instant('ADMIN.OFFICES.SUCCESS_DELETED_DETAIL', { item: office.name } )
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

  private getErrorMessage(error: any): string {
    if (error && error.message) {
      return error.message;
    }
    return this.translationService.instant('COMMON.UNEXPECTED_ERROR_DETAIL');
  }

}