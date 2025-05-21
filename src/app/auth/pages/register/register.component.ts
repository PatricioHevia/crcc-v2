import { Component, computed, inject,  signal } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PasswordModule } from 'primeng/password';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { Router, RouterModule } from '@angular/router';
import { StepperModule } from 'primeng/stepper';
import { ReactiveFormsModule } from '@angular/forms';



@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    ButtonModule,
    CommonModule,
    InputTextModule,
    CheckboxModule,
    FluidModule,
    IconFieldModule,
    InputIconModule,
    PasswordModule,
    TranslateModule,
    DialogModule,
    ProgressSpinnerModule,
    RouterModule,
    StepperModule
  ]
})
export class RegisterComponent  {
private theme = inject(ThemeService);
  public translation = inject(TranslationService);

  dialogVisible = signal(false);
  loading = signal(false);
  loginSuccess = signal<boolean | null>(null);
  feedbackMessage = signal('');

  isDark = computed(() => this.theme.effectiveTheme() === 'dark');



}
