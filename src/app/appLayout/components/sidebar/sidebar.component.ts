// src/app/appLayout/components/sidebar/sidebar.component.ts
import { Component, inject, computed, ChangeDetectionStrategy, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router'; // Asegúrate de tener RouterModule o RouterLink/RouterLinkActive
import { CommonModule } from '@angular/common'; // Para @if y @for (si no usas la nueva sintaxis directamente)
import { MenuItem } from 'primeng/api'; // Ya la usas

// Tus Servicios
import { LayoutService } from '../../layout.service';
import { UserService } from '../../../auth/services/user.service';
import { OrganizationService } from '../../../auth/services/organization.service';
import { TooltipModule } from 'primeng/tooltip'; // Para tooltips si los quieres
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  // styleUrls: ['./sidebar.component.css'], // Si tienes estilos específicos
  standalone: true,
  imports: [
    CommonModule, // Necesario para @if, @for si no usas la sintaxis más nueva que no lo requiere. Por seguridad lo dejamos.
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    TooltipModule // Añadido para tooltips
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  layoutService = inject(LayoutService);
  userService = inject(UserService);
  organizationService = inject(OrganizationService);
  private injector = inject(EnvironmentInjector);

  private currentUser = this.userService.usuario;

  private isUserAdminOrSuper = computed(() => {
    const user = this.currentUser();
    return !!user && (user.role === 'Admin' || user.role === 'Super Admin');
  });

  private isUserSuperAdmin = computed(() => {
    const user = this.currentUser();
    return !!user && user.role === 'Super Admin';
  });

  private isUserOrganizationMandante = computed(() => {
    const user = this.currentUser();
    if (!user || !user.organization) {
      return false;
    }
    return runInInjectionContext(this.injector, () =>
      this.organizationService.isMandante(user.organization!)()
    );
  });

  // adminMenuItems permanece igual, ya que define la estructura lógica de los items
  public adminMenu = computed<MenuItem[]>(() => {
    const user = this.currentUser();
    if (!user) return [];

    const isAdminOrSuper = this.isUserAdminOrSuper();
    const isSuperAdmin = this.isUserSuperAdmin();
    const isMandante = this.isUserOrganizationMandante();

    const baseAdminItems: MenuItem[] = [];

    if (isSuperAdmin || (isAdminOrSuper && isMandante)) {
      baseAdminItems.push(
        // Usamos las llaves de traducción
        { label: 'SIDEBAR.DASHBOARD', icon: 'pi pi-th-large', routerLink: ['/admin/dashboard'], styleClass: 'text-sm' },
        { label: 'SIDEBAR.USERS', icon: 'pi pi-users', routerLink: ['/admin/users'], styleClass: 'text-sm' },
        { label: 'SIDEBAR.PROJECTS', icon: 'pi pi-briefcase', routerLink: ['/admin/projects'], styleClass: 'text-sm' },
        { label: 'SIDEBAR.OFFICES', icon: 'pi pi-building', routerLink: ['/admin/offices'], styleClass: 'text-sm' },
        { label: 'SIDEBAR.ORGANIZATIONS', icon: 'pi pi-sitemap', routerLink: ['/admin/organizations'], styleClass: 'text-sm' }
      );
    } else if (isAdminOrSuper && !isMandante) {
      baseAdminItems.push(
        { label: 'SIDEBAR.USERS', icon: 'pi pi-users', routerLink: ['/admin/users'], styleClass: 'text-sm' }
      );
    }

    if (baseAdminItems.length > 0) {
      return [{
        label: 'SIDEBAR.ADMINISTRATION', // Llave para el título de la sección
        icon: 'pi pi-cog',
        items: baseAdminItems,
        styleClass: 'menu-section-title'
      }];
    }
    return [];
  });

  // El modelo final para el template, puedes añadir otras secciones aquí
  // como 'General' si es necesario, cada una siendo un MenuItem con sub-items.
  public menuModel = computed<MenuItem[]>(() => { // Renombrado a public
    return [
      ...this.adminMenu(),
      // Puedes añadir más secciones aquí, por ejemplo:
      // {
      //   label: 'General',
      //   items: [
      //     { label: 'Inicio', icon: 'pi pi-home', routerLink: ['/dashboard/general'], styleClass: 'text-sm' },
      //     { label: 'Perfil', icon: 'pi pi-user', routerLink: ['/profile'], styleClass: 'text-sm' }
      //   ],
      //  styleClass: 'menu-section-title'
      // }
    ];
  });
}