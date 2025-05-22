// src/app/services/theme.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeOption = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'theme';

  /** Señal: el tema elegido por el usuario */
  theme = signal<ThemeOption>(
    (localStorage.getItem(this.storageKey) as ThemeOption) || 'system'
  );

  // señal booleana: si el tema es 'dark' true, si es 'light' false
  public isDarkTheme = computed(() => this.theme() === 'dark');

  /** Señal: preferencia de sistema (dark-mode) */
  private systemPrefersDark = signal<boolean>(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  /** Tema efectivo: si es 'system' usa preferencia del sistema */
  effectiveTheme = computed<'light'|'dark'>(() => {
    const t = this.theme();
    return t === 'system'
      ? (this.systemPrefersDark() ? 'dark' : 'light')
      : t;
  });

  constructor() {
    // Escucha cambios en la preferencia del sistema
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', e => this.systemPrefersDark.set(e.matches));

    // Efecto: aplicar clase 'dark-mode' y persistir elección de usuario
    effect(() => {
      const mode = this.effectiveTheme();
      document.documentElement.classList.toggle('dark-mode', mode === 'dark');
      // Persistimos solo la selección del usuario, no la detección
      localStorage.setItem(this.storageKey, this.theme());
    });
  }

  /** Cambia el tema: 'light', 'dark' o 'system' */
  setTheme(option: ThemeOption): void {
    if (['light', 'dark', 'system'].includes(option)) {
      this.theme.set(option);
    }
  }
}
