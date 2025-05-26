import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
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
  selector: 'app-nueva-oficina',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DividerModule,
    TranslateModule
  ],
  templateUrl: './nueva-oficina.component.html',
  styleUrls: ['./nueva-oficina.component.css']
})
export class NuevaOficinaComponent implements OnInit {
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

  private initForm(): void {
    this.officeForm = this.fb.group({
      name_es: ['', [Validators.required, Validators.minLength(2)]],
      name_en: ['', [Validators.required, Validators.minLength(2)]],
      name_zh: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.officeForm.valid) {
      this.loading = true;
      try {
        const formData = this.officeForm.value;
        const currentTime = Timestamp.now();
        
        const officeData: Omit<Office, 'id'> = {
          name_es: formData.name_es,
          name_en: formData.name_en,
          name_zh: formData.name_zh,
          name: formData.name_es, // Por defecto usar español
          createdAt: currentTime,
          updatedAt: currentTime
        };
        
        await this.officeService.createOffice(officeData);
        
        this.toastService.success(
          this.translationService.instant('ADMIN.OFFICES.SUCCESS_CREATED_TITLE'),
          this.translationService.instant('ADMIN.OFFICES.SUCCESS_CREATED_DETAIL')
        );
        
        this.officeForm.reset();
        this.onOfficeSaved.emit();
      } catch (error) {
        console.error('Error creating office:', error);
        this.toastService.error(
          this.translationService.instant('COMMON.ERROR_CREATING_TITLE'),
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
