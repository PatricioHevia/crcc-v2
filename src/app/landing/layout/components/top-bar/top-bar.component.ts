// src/app/layout/top-bar/top-bar.component.ts
import { Component, computed, inject } from '@angular/core';
import { MenubarModule }      from 'primeng/menubar';
import { MenuItem }           from 'primeng/api';
import { ThemeService, ThemeOption } from '../../../../core/theme.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [MenubarModule],
  templateUrl: './top-bar.component.html',
})
export default class TopBarComponent {
  private themeService = inject(ThemeService);
  isDark = computed(() => this.themeService.effectiveTheme() === 'dark');

  items = computed<MenuItem[]>(() => [
    { label: 'Proyectos',      icon: 'pi pi-folder',      routerLink: '/projects' },
    { label: 'Participa',      icon: 'pi pi-users',       routerLink: '/participa' },
    { label: 'Ayuda',          icon: 'pi pi-info-circle', routerLink: '/ayuda' },
    { label: 'Administración', icon: 'pi pi-cog',         routerLink: '/admin' },
    { label: 'Cerrar Sesión',  icon: 'pi pi-sign-out',    routerLink: '/logout' },
    { separator: true },
    {
      icon: this.isDark() ? 'pi pi-sun' : 'pi pi-moon',
      command: () => this.toggleTheme(),
      title: 'Cambiar tema'
    }
  ]);

  toggleTheme(): void {
    const curr = this.themeService.effectiveTheme();
    const next: ThemeOption = curr === 'dark' ? 'light' : 'dark';
    this.themeService.setTheme(next);
  }
}
