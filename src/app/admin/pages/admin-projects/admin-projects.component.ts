import { Component, computed, inject, Signal, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService, } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
// Asumiendo que tienes un ProjectService y una interfaz Project

import { Project } from '../../models/project-interface';
import { TranslationService } from '../../../core/services/translation.service';
import { PROJECT_PHASE_CODES, PROJECT_PHASE_COLORS, PROJECT_PHASE_TRANSLATION_KEYS, ProjectPhaseCode } from '../../../core/constants/phase-projects-keys';
import { ProjectService } from '../../services/project.service';
import { NuevoProyectoComponent } from '../../components/nuevo-proyecto/nuevo-proyecto.component';
import { ToolbarModule } from 'primeng/toolbar';
import { UpdateProjectComponent } from '../../components/update-project/update-project.component';
import { ConfirmationService } from 'primeng/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
    ToolbarModule,
    NuevoProyectoComponent,
    UpdateProjectComponent
  ],
  templateUrl: './admin-projects.component.html',
  // styleUrls: ['./admin-projects.component.css']
})
export class AdminProjectsComponent {
  private projectService = inject(ProjectService);
  private translationService = inject(TranslationService);
  private translateService = inject(TranslateService); // Inyectar TranslationService
  private confirmationService = inject(ConfirmationService); // Inyectar ConfirmationService
  private toastService = inject(ToastService);

  // Update signals for project management 
  editProjectVisible = signal(false);
  projectToEdit: WritableSignal<Project | null> = signal(null);

  //Drawer para crear un nuevo proyecto
  newProjectVisible = signal(false);

  lang = computed(() => this.translationService.currentLang());
  phaseFilterOptions?: any[];
  // Carga de datos
  proyectos: Signal<Project[]> = computed(() => this.projectService.projects());
  loading: Signal<boolean> = computed(() => this.projectService.loading()); // Asumiendo que tienes una señal de carga así


  public readonly phaseColors = PROJECT_PHASE_COLORS;

  getPhaseClasses(phaseCode: ProjectPhaseCode): string {
    return this.phaseColors[phaseCode] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'; // Fallback
  }

  constructor() {
    // Aquí podrías llamar a projectService para que inicie la carga si no se hace automáticamente
    // this.projectService.projects(); // Esto activará el listener si no está activo
    this.phaseFilterOptions = PROJECT_PHASE_CODES.map(code => ({
      label: this.translateService.instant(PROJECT_PHASE_TRANSLATION_KEYS[code]), // Traduce la etiqueta para mostrar en el dropdown
      value: code // El valor del filtro será el código
    }));
  }

  getProjectName(project: Project): string {
    const lang = this.lang();
    const key = `name_${lang}` as 'name_es' | 'name_en' | 'name_zh';
    return project[key] || project.name_es;
  }
  getProjectDescription(project: Project): string {
    const lang = this.lang();
    const key = `description_${lang}` as 'description_es' | 'description_en' | 'description_zh';
    return project[key] || project.description_es;
  }


  onEditProject(project: Project): void {
    this.projectToEdit.set(project);
    this.editProjectVisible.set(true);
  }

  onDeleteProject(project: Project): void {
    const translatedProjectName = this.getProjectName(project); // Nombre traducido para el mensaje

    this.confirmationService.confirm({
      message: this.translateService.instant('COMMON.CONFIRM_DELETE_MESSAGE_ITEM', { item: translatedProjectName }),
      header: this.translateService.instant('COMMON.CONFIRM_DELETE_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.translateService.instant('COMMON.NO'),
        icon: 'pi pi-times',
        class: 'p-button-text'
      },
      acceptButtonProps: {
        label: this.translateService.instant('COMMON.YES'),
        icon: 'pi pi-trash',
        severity: 'danger' // O p-button-text p-button-danger
      },
      accept: async () => {
        try {
          await this.projectService.deleteProject(project.id);
          this.toastService.success(
            this.translateService.instant('PROJECTS.ACTIONS.DELETE_PROJECT'), // Podrías crear una llave específica
            this.translateService.instant('ADMIN.PROJECT.SUCCESS_DELETED_DETAIL', { name: translatedProjectName }) // Reutilizando una llave o crea una nueva
          );
          // La tabla se actualizará automáticamente gracias a las Signals si el servicio emite los cambios correctamente.
        } catch (error: any) {
          console.error('Error al eliminar proyecto:', error);
          this.toastService.error(
            this.translateService.instant('COMMON.ERROR_DELETING_TITLE'),
            error.message || this.translateService.instant('COMMON.UNEXPECTED_ERROR_DETAIL')
          );
        }
      },
      reject: () => {
        // Opcional: Notificar que la acción fue cancelada
        this.toastService.info('COMMON.CANCEL_DELETE', 'ADMIN.PROJECT.CANCEL_DELETE_DETAIL');
      }
    });
  }

  onCreateNewProject(): void {
    this.newProjectVisible.set(true)
  }


}