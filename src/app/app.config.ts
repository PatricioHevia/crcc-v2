import { ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
// Rutas
import { routes } from './app.routes';

// Firebase

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { environment } from '../environments/environment';

// Translation
import { TranslateLoader, TranslateModule, TranslateService } from "@ngx-translate/core";
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';
import localeZh from '@angular/common/locales/zh';



// PrimeNG
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { ToastModule } from 'primeng/toast';

registerLocaleData(localeEs, 'es');
registerLocaleData(localeEn, 'en');
registerLocaleData(localeZh, 'zh');


const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (http: HttpClient) =>
  new TranslateHttpLoader(http, 'assets/i18n/', '.json')
import { ConfirmationService, MessageService } from 'primeng/api';

const MyPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          50:  '#e6eef9',
          100: '#cce0f3',
          200: '#99c1e7',
          300: '#66a3db',
          400: '#3384cf',
          500: '#3567ad', // Base light
          600: '#2e5a93',
          700: '#284e7a',
          800: '#213360',
          900: '#1b2a50',
          950: '#161f3f'
        }
      },
      dark: {
        primary: {
          50:  '#e0f3fb',
          100: '#c1e7f7',
          200: '#83cff0',
          300: '#46b8e9',
          400: '#08a1e2',
          500: '#0c7bb5', // Base dark
          600: '#0a6b9f',
          700: '#085b89',
          800: '#074a73',
          900: '#053958',
          950: '#042a45'
        }
      }
    }
  }
});


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom(ToastModule),
    MessageService,
    ConfirmationService,
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode'
        }
      },
      inputVariant: 'filled'
    }),
    {
      provide: LOCALE_ID,
      deps: [TranslateService],
      useFactory: (ts: TranslateService) => ts.currentLang
    },
    importProvidersFrom([TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
      
    })]),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage()),
    provideAuth(() => getAuth()),
    provideFunctions(() => getFunctions()),
    provideMessaging(() => getMessaging()),
    
  ],
};
