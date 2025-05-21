import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { Router, RouterModule } from '@angular/router';

interface LoginStorage {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
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
    ReactiveFormsModule,
    DialogModule,
    ProgressSpinnerModule,
    RouterModule
  ]
})
export class LoginComponent implements OnInit {
  private theme = inject(ThemeService);
  public translation = inject(TranslationService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  dialogVisible = signal(false);
  loading = signal(false);
  loginSuccess = signal<boolean | null>(null);
  feedbackMessage = signal('');


  loginForm!: FormGroup;

  ngOnInit() {
    // 1) Crear el form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // 2) Cargar datos guardados si existen
    const saved = localStorage.getItem('loginData');
    if (saved) {
      const data: LoginStorage = JSON.parse(saved);
      this.loginForm.setValue({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      });
    }
  }

  isDark = computed(() => this.theme.effectiveTheme() === 'dark');

  hasError(field: string, errorCode: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!(ctrl?.hasError(errorCode) && ctrl.touched);
  }

  remeberMe() {
    // Implement remember me functionality


  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    if (rememberMe) {
      const toSave: LoginStorage = { email, password, rememberMe };
      localStorage.setItem('loginData', JSON.stringify(toSave));
    } else {
      localStorage.removeItem('loginData');
    }

    // Abrimos diálogo con spinner
    this.dialogVisible.set(true);
    this.loading.set(true);
    this.loginSuccess.set(null);

    this.auth.login(email, password, rememberMe)
      .then(() => {
        // Éxito
        this.loading.set(false);
        this.loginSuccess.set(true);
        this.feedbackMessage.set(this.translation.instant('AUTH.LOGIN_SUCCESS'));

        // Cerramos diálogo y navegamos al '/' tras 2s
        setTimeout(() => {
          this.dialogVisible.set(false);
          this.router.navigate(['/']);
        }, 2000);
      })
      .catch(err => {
        // Error
        this.loading.set(false);
        this.loginSuccess.set(false);
        this.feedbackMessage.set(err.message);

        // Cerramos solo el diálogo tras 2s
        setTimeout(() => this.dialogVisible.set(false), 2000);
      });
  }

}
