import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from './core/services/translation.service';
import { PrimeNG } from 'primeng/config';
import { ThemeService } from './core/services/theme.service';
import { ToastModule } from 'primeng/toast';
import { UserService } from './auth/services/user.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonModule,
    TranslateModule,
    ToastModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  private primengConfig = inject(PrimeNG);
  private translationService = inject(TranslationService);
  private themeService = inject(ThemeService);
  private userService = inject(UserService);

  //Cargo el usuario desde el servicio
  public  isLoadingApp = computed(() => !this.userService.isUserAccountResolved());

  isDark = computed(() => this.themeService.isDarkTheme());
  

  ngOnInit(): void {
    console.log('AppComponent ngOnInit');  
  }

 
  switchLang(lang: 'es' | 'en' | 'zh'): void {
    this.translationService.switchLang(lang);
  }
}
