import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../../core/services/theme.service';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../../layout.service';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TooltipModule } from 'primeng/tooltip';
@Component({
  selector: 'app-top',
  templateUrl: './top.component.html',
  styleUrls: ['./top.component.css'],
  imports: [
    TranslateModule,
    RouterModule,
    ButtonModule,
    TieredMenuModule,
    TooltipModule,

  ],
})
export class TopComponent  {
  theme = inject(ThemeService);
  translationService = inject(TranslationService);
  layoutService = inject(LayoutService);

  idiomas = signal([{
    es: [{ label: 'Español', value: 'es' }, { label: 'Inglés', value: 'en' }, { label: 'Chino', value: 'zh' }],
    en: [{ label: 'Spanish', value: 'es' }, { label: 'English', value: 'en' }, { label: 'Chinese', value: 'zh' }],
    zh: [{ label: '西班牙语', value: 'es' }, { label: '英语', value: 'en' }, { label: '中文', value: 'zh' }]
  }]);

  items = computed<any[]>(() => {
    const lang = this.translationService.currentLang()
    const map = this.idiomas()[0] as Record<string, { label: string; value: 'es' | 'en' | 'zh' }[]>;
    return map[lang].map(opt => ({
      label: opt.label,
      icon: 'pi pi-globe',
      command: () => this.onLangChange(opt.value)
    }));
  });


  toggleDarkMode() {
    this.theme.setTheme(this.theme.isDarkTheme() ? 'light' : 'dark');
  }

  onLangChange(lang: 'es' | 'en' | 'zh'): void {
    this.translationService.switchLang(lang);
  }
  

}
