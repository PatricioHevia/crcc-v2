import { Component, computed, inject, Signal, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
// Asumiendo que tienes un ProjectService y una interfaz Project
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project-interface';
import { TranslationService } from '../../../core/services/translation.service';

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

  proyectos: Signal<Project[]> = computed(() => this.projectService.getAdminProjects()());
  loading: Signal<boolean> = computed(() => this.projectService.isAdminProjectsLoading()()); // Asumiendo que tienes una señal de carga así

  totalProjects: Signal<number> = computed(() => this.proyectos().length);
  pageSize: WritableSignal<number> = signal(10);
  globalFilterValue: string = '';

  constructor() {
    // Aquí podrías llamar a projectService para que inicie la carga si no se hace automáticamente
    // this.projectService.projects(); // Esto activará el listener si no está activo
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