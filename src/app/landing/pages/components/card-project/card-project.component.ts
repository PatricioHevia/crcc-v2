import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';
import { Project } from '../../../../admin/models/project-interface';
import { GalleriaModule } from 'primeng/galleria';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { register  } from 'swiper/element/bundle';
import { DividerModule } from 'primeng/divider';
import { PROJECT_PHASE_COLORS, PROJECT_PHASE_TRANSLATION_KEYS } from '../../../../core/constants/phase-projects-keys';

register();


@Component({
  selector: 'app-card-project',
  templateUrl: './card-project.component.html',
  styleUrls: ['./card-project.component.css'],
  imports: [GalleriaModule, TagModule, RouterModule, ButtonModule, ImageModule, TranslateModule, DividerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CardProjectComponent  {
  public project = input.required<Project>();

  // Translation
  public translationService = inject(TranslationService);
  
  lang = computed(() => this.translationService.currentLang());

  public readonly phaseColors = PROJECT_PHASE_COLORS;

  localizedField(field: 'name' | 'description'): string {
    const currentProject = this.project();
    if (!currentProject) return '';

    // Construye la llave específica para el idioma (ej. 'name_es', 'description_zh')
    const key = `${field}_${this.lang()}` as keyof Project;

    // Verifica si esa propiedad existe en el objeto Project y devuelve su valor
    // o un fallback si es necesario (ej. la versión en español)
    if (key in currentProject) {
      return currentProject[key] as string;
    }
    // Fallback a la versión en español si la clave específica no existe
    const fallbackKey = `${field}_es` as keyof Project;
    return currentProject[fallbackKey] as string || '';
  }
  
  getPhaseTranslationKey(): string {
    const currentProject = this.project();
    if (!currentProject || !currentProject.phase) {
      return ''; // Devuelve una cadena vacía o una llave de fallback si no hay fase
    }
    return PROJECT_PHASE_TRANSLATION_KEYS[currentProject.phase] || currentProject.phase; // Fallback al código si la llave no está en el mapa
  }

  // Método para obtener las clases CSS para la etiqueta de fase
  getPhaseTagClasses(): string {
    const currentProject = this.project();
    if (!currentProject || !currentProject.phase) {
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'; // Clase de fallback
    }
    return this.phaseColors[currentProject.phase] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
  }

}
