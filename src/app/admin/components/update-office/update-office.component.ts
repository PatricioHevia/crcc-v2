import { Component, OnInit, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { Timestamp } from '@angular/fire/firestore';
import { OfficeService } from '../../services/office.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Office } from '../../models/office-interface';

@Component({
  selector: 'app-update-office',
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DividerModule,
    TranslateModule
  ],
  templateUrl: './update-office.component.html',
  styleUrls: ['./update-office.component.css']
})
export class UpdateOfficeComponent implements OnInit, OnChanges {
  @Input() office: Office | null = null;
  @Output() onOfficeSaved = new EventEmitter<void>();
  private fb = inject(FormBuilder);
  private officeService = inject(OfficeService);
  private toastService = inject(ToastService);
  private translationService = inject(TranslationService);
  public themeService = inject(ThemeService);

  officeForm!: FormGroup;
  loading = false;

  constructor() { }

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['office'] && this.office && this.officeForm) {
      this.loadOfficeData();
    }
  }

  private initForm(): void {
    this.officeForm = this.fb.group({
      name_es: ['', [Validators.required, Validators.minLength(2)]],
      name_en: ['', [Validators.required, Validators.minLength(2)]],
      name_zh: ['', [Validators.required, Validators.minLength(2)]]
    });

    if (this.office) {
      this.loadOfficeData();
    }
  }
  private loadOfficeData(): void {
    if (this.office) {
      this.officeForm.patchValue({
        name_es: this.office.name_es || '',
        name_en: this.office.name_en || '',
        name_zh: this.office.name_zh || ''
      });
    }
  }
  async onSubmit(): Promise<void> {
    if (this.officeForm.valid && this.office) {
      this.loading = true;
      try {
        const formData = this.officeForm.value;
        
        const officeData: Partial<Office> = {
          name_es: formData.name_es,
          name_en: formData.name_en,
          name_zh: formData.name_zh,
          name: formData.name_es, // Actualizar el campo name con el valor en español
          updatedAt: Timestamp.now() // Agregar timestamp de actualización
        };
        
        await this.officeService.updateOffice(this.office.id, officeData);
        
        this.toastService.success(
          this.translationService.instant('ADMIN.OFFICES.SUCCESS_UPDATED_TITLE'),
          this.translationService.instant('ADMIN.OFFICES.SUCCESS_UPDATED_DETAIL')
        );
        
        this.onOfficeSaved.emit();
      } catch (error) {
        console.error('Error updating office:', error);
        this.toastService.error(
          this.translationService.instant('COMMON.ERROR_UPDATING_TITLE'),
          this.getErrorMessage(error)
        );
      } finally {
        this.loading = false;
      }
    }
  }

  private getErrorMessage(error: any): string {
    if (error && error.message) {
      return error.message;
    }
    return this.translationService.instant('COMMON.UNEXPECTED_ERROR_DETAIL');
  }

}
