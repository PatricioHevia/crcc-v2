import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  /** Idiomas soportados */
  readonly langs = ['es', 'en', 'zh'];


  /** Signal que mantiene el idioma actual */
  public currentLang = signal<'es' | 'en' | 'zh'>(
    (['es', 'en', 'zh'].includes(localStorage.getItem('lang') || '')
      ? localStorage.getItem('lang')
      : 'es') as 'es' | 'en' | 'zh'
  );

  // URL Functions base
  base = 'https://us-central1-pp-pruebas.cloudfunctions.net';

  constructor(
    public translate: TranslateService,
    private http: HttpClient,
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

  instant(key: string): any {
    return this.translate.instant(key);
  }

  /** Cambia el idioma de la aplicación */
  switchLang(lang: 'es' | 'en' | 'zh'): void {
    if (this.langs.includes(lang)) {
      this.currentLang.set(lang);
    }
  }

  translateJson<T>(payload: T): Promise<T> {
    const url = `${this.base}/translateJson`;
    // Angular ya parsea JSON cuando la respuesta viene con content-type: application/json
    return firstValueFrom(this.http.post<T>(url, payload));
  }
}
