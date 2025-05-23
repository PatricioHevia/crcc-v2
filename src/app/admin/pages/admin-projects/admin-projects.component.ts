import { Component, computed, inject, Signal, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule,  } from '@ngx-translate/core';
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
    InputIconModule
  ],
  templateUrl: './admin-projects.component.html',
  // styleUrls: ['./admin-projects.component.css']
})
export class AdminProjectsComponent {
  private projectService = inject(ProjectService);
  private translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());

  phaseFilterOptions?: any[];

  proyectos: Signal<Project[]> = computed(() => this.projectService.getAdminProjects()());
  loading: Signal<boolean> = computed(() => this.projectService.isAdminProjectsLoading()()); // Asumiendo que tienes una señal de carga así

  totalProjects: Signal<number> = computed(() => this.proyectos().length);
  pageSize: WritableSignal<number> = signal(10);
  globalFilterValue: string = '';

  public readonly phaseColors = PROJECT_PHASE_COLORS;

  getPhaseClasses(phaseCode: ProjectPhaseCode): string {
    return this.phaseColors[phaseCode] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'; // Fallback
  }

  constructor() {
    // Aquí podrías llamar a projectService para que inicie la carga si no se hace automáticamente
    // this.projectService.projects(); // Esto activará el listener si no está activo
    this.phaseFilterOptions = PROJECT_PHASE_CODES.map(code => ({
      label: this.translationService.instant(PROJECT_PHASE_TRANSLATION_KEYS[code]), // Traduce la etiqueta para mostrar en el dropdown
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
    console.log('Edit project:', project);
    // Lógica para editar proyecto (ej. abrir un diálogo o navegar a otra ruta)
  }

  onDeleteProject(project: Project): void {
    console.log('Delete project:', project);
    // Lógica para eliminar proyecto (confirmación y llamada al servicio)
    // this.projectService.deleteProject(project.id); // Necesitarás este método en el servicio
  }

  onCreateNewProject(): void {
    console.log('Create new project');
    // Lógica para crear un nuevo proyecto
  }
}