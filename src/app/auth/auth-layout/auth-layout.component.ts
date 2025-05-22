import { Component, computed, inject, signal } from '@angular/core';
import { ThemeOption, ThemeService } from '../../core/services/theme.service';
import { TranslationService } from '../../core/services/translation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { MenuItem } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';



@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css'],
  imports: [ 
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
    TieredMenuModule,
    TranslateModule
   
  ]
})
export class AuthLayoutComponent {
  private theme = inject(ThemeService);
  public translation = inject(TranslationService);

 
  // Idiomas
  idiomas = signal([{
    es: [
      { label: 'Español', value: 'es' },
      { label: 'Inglés',   value: 'en' },
      { label: 'Chino',    value: 'zh' }
    ],
    en: [
      { label: 'Spanish', value: 'es' },
      { label: 'English', value: 'en' },
      { label: 'Chinese', value: 'zh' }
    ],
    zh: [
      { label: '西班牙语', value: 'es' },
      { label: '英语',    value: 'en' },
      { label: '中文',    value: 'zh' }
    ]
  }]);


  currentLang = computed(() => this.translation.currentLang());

  items = computed<MenuItem[]>(() => {
    const lang = this.currentLang();
    const map = this.idiomas()[0] as Record<string, { label: string; value: 'es' | 'en' | 'zh' }[]>;
    return map[lang].map(opt => ({
      label: opt.label,
      icon: 'pi pi-globe',
      command: () => this.onLangChange(opt.value)
    }));
  });


  onLangChange(lang: 'es' | 'en' | 'zh'): void {
    this.translation.switchLang(lang);
  }

  // Tema
  isDark = computed(() => this.theme.effectiveTheme() === 'dark');

  public lightStyle = {
    'border-radius': '56px',
    'padding':       '0.35rem',
    'background':    'linear-gradient(180deg, #3567ad 10%, rgba(33,150,243,0) 40%)'
  };

  public darkStyle = {
    'border-radius': '56px',
    'padding':       '0.35rem',
    'background':    'linear-gradient(180deg, #08a1e2 10%, rgba(33,150,243,0) 40%)'
  };

  toggleTheme(): void {
    const curr = this.theme.effectiveTheme();
    const next: ThemeOption = curr === 'dark' ? 'light' : 'dark';
    this.theme.setTheme(next);
  }
}
