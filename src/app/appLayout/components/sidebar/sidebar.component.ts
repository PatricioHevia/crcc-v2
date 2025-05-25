import { Component, inject, computed, ChangeDetectionStrategy, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // RouterModule no es necesario si usas RouterLink/Active directamente
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';

// Tus Servicios
import { LayoutService } from '../../layout.service';
import { UserService } from '../../../auth/services/user.service';
import { TooltipModule } from 'primeng/tooltip';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core'; // Importa TranslateService
import { ProjectService } from '../../../admin/services/project.service';
import { Project } from '../../../admin/models/project-interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { DividerModule } from 'primeng/divider';

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
    TooltipModule,
    DividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  layoutService = inject(LayoutService);
  userService = inject(UserService);
  translateService = inject(TranslateService); // Inyecta TranslateService
  projectService = inject(ProjectService); // Inyecta el servicio de organización


  // Señal para saber si el usuario es Admin (Admin o Super Admin)
  private isUserAdmin =  computed(() => this.userService.isAdmin());  
  private isUserSuperAdmin =  computed(() => this.userService.isSuperAdmin());
  private isUserMandante =  computed(() => this.userService.isMandante());
  private projects = computed(() => this.projectService.projects());
 
  // Asumiendo que tienes un servicio de traducción
  private languageChangedEvent = toSignal(
    this.translateService.onLangChange,
    {
      // Proporciona un valor inicial que refleje el estado actual del idioma.
      // Esto es importante para que la señal menuModel tenga un valor coherente al inicio.
      initialValue: {
        lang: this.translateService.currentLang || this.translateService.defaultLang,
        translations: {} // translations puede ser un objeto vacío para el valor inicial
      } as LangChangeEvent
    }
  );
  

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
   
    // Asegurarse de que el usuario y su estado de cuenta estén resueltos antes de construir el menú
    if (!this.userService.isUserAccountResolved()) {
      return []; // Devuelve un array vacío si el usuario no está listo
    }

    const itemsConfig: { name: string, condition: boolean }[] = [
      { name: 'dashboard', condition: this.isUserSuperAdmin() || (this.isUserAdmin() && this.isUserMandante()) },
      { name: 'users', condition: this.isUserSuperAdmin() || this.isUserAdmin() }, // Admin (cualquiera) o SuperAdmin
      { name: 'organizations', condition: this.isUserSuperAdmin() || (this.isUserAdmin() && this.isUserMandante()) },
      { name: 'projects', condition: this.isUserSuperAdmin() },
      { name: 'offices', condition: this.isUserSuperAdmin() },
      { name: 'jobs', condition: this.isUserSuperAdmin() || (this.isUserAdmin() && this.isUserMandante()) },
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

    this.languageChangedEvent();

    // 2. Obtener el idioma actual directamente desde el servicio.
    // TranslateService actualiza 'currentLang' después de un cambio de idioma.
    const currentLang = this.translateService.currentLang || this.translateService.defaultLang;

    const adminItemsResult = this.adminMenuItems();
    const projectsList = this.projects();
    const finalMenu: MenuItem[] = [];

    // Sección de Administración (como ya la tienes)
    if (adminItemsResult.length > 0) {
      finalMenu.push({
        label: 'SIDEBAR.ADMINISTRATION', // Llave para el título de la sección
        icon: 'pi pi-cog',
        items: adminItemsResult,
        styleClass: 'menu-section-title' // Para que se vea como un título de sección
      });
    }

    // Nuevas secciones, una por cada proyecto
    if (projectsList && projectsList.length > 0) {
      projectsList.forEach((project: Project) => { // Especificar el tipo Project
        let projectName = '';
        // Seleccionar el nombre del proyecto según el idioma actual
        switch (currentLang) {
          case 'es':
            projectName = project.name_es;
            break;
          case 'en':
            projectName = project.name_en;
            break;
          case 'zh':
            projectName = project.name_zh;
            break;
          default:
            projectName = 'Prueba'; // Fallback al español o tu idioma por defecto
        }

        finalMenu.push({
          label: projectName, // El nombre del proyecto ya traducido
          // icon: 'pi pi-folder', // Icono de PrimeNG si lo deseas
          faIcon: 'fa-solid fa-diagram-project', // Icono de FontAwesome para proyectos
          items: [], // Aquí irán los subítems del proyecto en el futuro
          styleClass: 'menu-section-title project-title', // Clase para estilo de título
          // Opcional: si quieres que el título del proyecto sea un enlace:
          // routerLink: ['/admin/projects', project.id], // Asegúrate que project.id exista y la ruta sea correcta
          // Opcional: tooltip si el nombre es muy largo y se corta
          // tooltip: projectName,
          // tooltipPosition: 'right',
        });
      });
    }

    return finalMenu;
  });

 
}