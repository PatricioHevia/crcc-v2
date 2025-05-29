import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '../../layout.service';
import { UserService } from '../../../auth/services/user.service';
import { ProjectService } from '../../../admin/services/project.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MenuItem } from 'primeng/api';
import { Project } from '../../../admin/models/project-interface';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  imports:[
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    TooltipModule,
    DividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent  {

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

    // Sección de Administración
    if (adminItemsResult.length > 0) {
      finalMenu.push({
        label: 'SIDEBAR.ADMINISTRATION', // Llave para el título de la sección
        icon: 'pi pi-cog',
        items: adminItemsResult,
        styleClass: 'menu-section-title' // Para que se vea como un título de sección
      });
    }

    // Sección de Proyectos
    if (projectsList && projectsList.length > 0) {
      const projectMenuItems: MenuItem[] = [];
      
      // Crear un item del menú para cada proyecto
      projectsList.forEach((project: Project) => {
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
            projectName = project.name_es; // Fallback al español
        }        projectMenuItems.push({
          label: projectName,
          icon: 'pi pi-folder',
          routerLink: ['/app/project', project.id], // Navegación a la información general del proyecto
          styleClass: 'text-sm',
          tooltip: projectName,
          tooltipPosition: 'right',
          expanded: true, // Hacer que el submenú esté siempre expandido
          items: [ // Estructura para futuros submenús            // Botón de licitaciones
            { label: 'SIDEBAR.TENDERS', icon: 'fas fa-gavel', routerLink: ['/app/project', project.id, 'tenders'], styleClass: 'text-xs', tooltip: 'SIDEBAR.TENDERS', tooltipPosition: 'right' },
            // Placeholder para documentos
            // { label: 'SIDEBAR.DOCUMENTS', icon: 'pi pi-file', routerLink: ['/project', project.id, 'documents'] },
          ]
        });
      });      // Agregar la sección de Proyectos con header clickeable
      finalMenu.push({
        label: 'SIDEBAR.PROJECTS', // Llave para el título de la sección
        icon: 'pi pi-sitemap',
        routerLink: ['/app/projects'], // Header clickeable que navega a la lista de proyectos
        items: projectMenuItems,
        styleClass: 'menu-section-title',
        tooltip: 'SIDEBAR.PROJECTS',
        tooltipPosition: 'right'
      });
    }

    return finalMenu;
  });

}
