import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { SkeletonModule } from 'primeng/skeleton';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';

import { ProjectService } from '../../../admin/services/project.service';
import { Project } from '../../../admin/models/project-interface';
import { TranslationService } from '../../../core/services/translation.service';
import { PROJECT_PHASE_COLORS, PROJECT_PHASE_TRANSLATION_KEYS } from '../../../core/constants/phase-projects-keys';

@Component({
  selector: 'app-ficha-general',
  templateUrl: './ficha-general.component.html',
  styleUrls: ['./ficha-general.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    DividerModule,
    PanelModule,
    TagModule,
    ImageModule,
    SkeletonModule,
    MessagesModule,
    MessageModule
  ]
})
export class FichaGeneralComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());

  // Señales reactivas
  projectId = signal<string>('');
  project = signal<Project | null>(null);
  loading = signal<boolean>(true);
  notFound = signal<boolean>(false);

  // Señales computadas
  currentLang = computed(() => this.translationService.currentLang());
  
  // Colores de fase
  public readonly phaseColors = PROJECT_PHASE_COLORS;

  constructor() {
    // Obtener el ID del proyecto desde la ruta
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.projectId.set(id);
      this.loadProject(id);
    });
  }

  private loadProject(id: string): void {
    this.loading.set(true);
    this.notFound.set(false);

    // Buscar el proyecto en la señal projects() del servicio
    const projects = this.projectService.projects();
    const foundProject = projects.find(p => p.id === id || p.url === id);

    if (foundProject) {
      this.project.set(foundProject);
      this.loading.set(false);
    } else {
      // Si no se encuentra el proyecto, mostrar mensaje de advertencia
      this.notFound.set(true);
      this.loading.set(false);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        this.router.navigate(['/app/projects']);
      }, 3000);
    }
  }

  // Métodos para obtener contenido localizado
  getProjectName(): string {
    const currentProject = this.project();
    if (!currentProject) return '';
    
    const lang = this.currentLang();
    const key = `name_${lang}` as 'name_es' | 'name_en' | 'name_zh';
    return currentProject[key] || currentProject.name_es || currentProject.name || '';
  }

  getProjectDescription(): string {
    const currentProject = this.project();
    if (!currentProject) return '';
    
    const lang = this.currentLang();
    const key = `description_${lang}` as 'description_es' | 'description_en' | 'description_zh';
    return currentProject[key] || currentProject.description_es || currentProject.description || '';
  }

  getPhaseTranslationKey(): string {
    const currentProject = this.project();
    if (!currentProject?.phase) return '';
    return PROJECT_PHASE_TRANSLATION_KEYS[currentProject.phase] || '';
  }

  getPhaseTagClasses(): string {
    const currentProject = this.project();
    if (!currentProject?.phase) {
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
    }
    return this.phaseColors[currentProject.phase] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
  }

  // Método para volver a la lista de proyectos
  goBack(): void {
    this.router.navigate(['/app/projects']);
  }
}
