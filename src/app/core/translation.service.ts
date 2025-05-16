import { Injectable, signal, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  /** Idiomas soportados */
  readonly langs = ['es', 'en', 'cn'];

  /** Signal que mantiene el idioma actual */
  currentLang = signal<string>(
    localStorage.getItem('lang') || 'en'
  );

  constructor(
    private translate: TranslateService,
    private primeng: PrimeNG
  ) {
    // Registrar idiomas en ngx-translate
    this.translate.addLangs(this.langs);
    this.translate.setDefaultLang(this.currentLang());

    // Efecto: aplicar traducciones y persistir cada vez que cambie currentLang
    effect(() => {
      const lang = this.currentLang();
      // Persistir la preferencia
      localStorage.setItem('lang', lang);
      // Cambiar título de ngx-translate
      this.translate.use(lang).subscribe(() => {
        // Extraer y aplicar traducciones de PrimeNG
        const primengLabels = this.translate.instant('primeng');
        this.primeng.setTranslation(primengLabels);
      });
    });
  }

  /** Cambia el idioma de la aplicación */
  switchLang(lang: string): void {
    if (this.langs.includes(lang)) {
      this.currentLang.set(lang);
    }
  }
}
