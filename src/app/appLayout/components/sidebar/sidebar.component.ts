import { Component, inject, computed, ChangeDetectionStrategy, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // RouterModule no es necesario si usas RouterLink/Active directamente
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';

// Tus Servicios
import { LayoutService } from '../../layout.service';
import { UserService } from '../../../auth/services/user.service';
import { OrganizationService } from '../../../auth/services/organization.service';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; // Importa TranslateService

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  // styleUrls: ['./sidebar.component.css'], // Si tienes estilos específicos
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    TooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  layoutService = inject(LayoutService);
  userService = inject(UserService);
  organizationService = inject(OrganizationService);
  translateService = inject(TranslateService); // Inyecta TranslateService
  private injector = inject(EnvironmentInjector);

  private currentUser = this.userService.usuario; // Señal del Account actual

  // Señal para saber si el usuario es Admin (Admin o Super Admin)
  private isUserAdmin = computed(() => {
    const user = this.currentUser();
    return !!user && (user.role === 'Admin'); // Solo Admin, Super Admin se trata por separado
  });

  private isUserSuperAdmin = computed(() => {
    const user = this.currentUser();
    return !!user && user.role === 'Super Admin';
  });

  // Señal para saber si la organización del usuario (si es Admin) es de tipo "Mandante"
  private isUserOrganizationMandante = computed(() => {
    const user = this.currentUser();
    // Solo evaluamos si es Admin y tiene organización
    if (!user || user.role !== 'Admin' || !user.organization) {
      return false;
    }
    // runInInjectionContext es necesario si isMandante() usa computed internamente y se llama desde otro computed
    // Si isMandante es una simple función que devuelve una señal, esto es correcto.
    return runInInjectionContext(this.injector, () =>
      this.organizationService.isMandante(user.organization!)() // Accede al valor de la señal devuelta por isMandante
    );
  });

  // Define los items base del menú de administración con sus llaves de traducción y rutas
  private allAdminBaseItems: { translationKey: string, icon?: string, faIcon?: string, route: string[], name: string }[] = [
    { name: 'dashboard', translationKey: 'SIDEBAR.DASHBOARD', icon: 'pi pi-th-large', route: ['/admin/dashboard'] },
    { name: 'users', translationKey: 'SIDEBAR.USERS', icon: 'pi pi-users', route: ['/admin/users'] },
    { name: 'organizations', translationKey: 'SIDEBAR.ORGANIZATIONS', icon: 'pi pi-sitemap', route: ['/admin/organizations'] },
    { name: 'projects', translationKey: 'SIDEBAR.PROJECTS', faIcon: 'fa-regular fa-hospital', route: ['/admin/projects'] },
    { name: 'offices', translationKey: 'SIDEBAR.OFFICES', icon: 'pi pi-building', route: ['/admin/offices'] },
    { name: 'jobs', translationKey: 'SIDEBAR.JOBS', icon: 'pi pi-briefcase', route: ['/admin/jobs-offers'] },
  ];

  // Computed property para generar los items del menú de administración
  public adminMenuItems = computed<MenuItem[]>(() => {
    const user = this.currentUser();
    // Asegurarse de que el usuario y su estado de cuenta estén resueltos antes de construir el menú
    if (!user || !this.userService.isUserAccountResolved()) {
      return []; // Devuelve un array vacío si el usuario no está listo
    }

    const itemsConfig: { name: string, condition: boolean }[] = [
      { name: 'dashboard', condition: this.isUserSuperAdmin() || (this.isUserAdmin() && this.isUserOrganizationMandante()) },
      { name: 'users', condition: this.isUserSuperAdmin() || this.isUserAdmin() }, // Admin (cualquiera) o SuperAdmin
      { name: 'organizations', condition: this.isUserSuperAdmin() || (this.isUserAdmin() && this.isUserOrganizationMandante()) },
      { name: 'projects', condition: this.isUserSuperAdmin() },
      { name: 'offices', condition: this.isUserSuperAdmin() },
      { name: 'jobs', condition: this.isUserSuperAdmin() || (this.isUserAdmin() && this.isUserOrganizationMandante()) },
    ];

    const visibleItems: MenuItem[] = [];
    this.allAdminBaseItems.forEach(baseItem => {
      const config = itemsConfig.find(c => c.name === baseItem.name);
      if (config && config.condition) {
        visibleItems.push({
          label: baseItem.translationKey, // Esta es la LLAVE de traducción
          icon: baseItem.icon,
          faIcon: baseItem.faIcon,
          routerLink: baseItem.route,
          styleClass: 'text-sm',
          tooltip: baseItem.translationKey, // También la LLAVE para el tooltip
          tooltipPosition: 'right'
          // routerLinkActiveOptions si necesitas especificarlos para algún item
        });
      }
    });

    return visibleItems;
  });

  // Modelo final para el template.
  public menuModel = computed<MenuItem[]>(() => {
    const adminItems = this.adminMenuItems();
    const finalMenu: MenuItem[] = [];

    if (adminItems.length > 0) {
      finalMenu.push({
        label: 'SIDEBAR.ADMINISTRATION', // Llave para el título de la sección
        icon: 'pi pi-cog',
        items: adminItems,
        styleClass: 'menu-section-title'
      });
    }

    // Ejemplo de cómo añadir una sección "General" que siempre es visible (si el usuario está logueado)
    // if (this.currentUser()) { // O una condición más específica
    //    finalMenu.push({
    //        label: 'SIDEBAR.GENERAL', // Llave
    //        icon: 'pi pi-home',
    //        items: [
    //            { label: 'SIDEBAR.PROFILE', icon: 'pi pi-user', routerLink: ['/profile'], styleClass: 'text-sm', tooltip: 'SIDEBAR.PROFILE' },
    //        ],
    //        styleClass: 'menu-section-title'
    //    });
    // }

    return finalMenu;
  });

  // Método para colapsar/expandir el sidebar (si lo necesitas para interactuar con LayoutService)
  toggleSidebar() {
    this.layoutService.onMenuToggle();
  }
}