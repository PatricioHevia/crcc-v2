import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, input, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngIf, *ngFor
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; // Asumo que usas TranslateService así

// PrimeNG Modules
import { GalleriaModule } from 'primeng/galleria'; // Aunque no la usas directamente para el slider, la tenías importada
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image'; // Para p-image si lo usas, no es necesario para <img> estándar
import { DividerModule } from 'primeng/divider';

// Swiper
import { register } from 'swiper/element/bundle'; // Registra Swiper Elements

// Tus tipos e interfaces (ajusta la ruta de importación según sea necesario)
import { Project, GalleryImageFirestore } from '../../../../admin/models/project-interface';
import { TranslationService } from '../../../../core/services/translation.service'; // Tu servicio de traducción
import { PROJECT_PHASE_COLORS, PROJECT_PHASE_TRANSLATION_KEYS } from '../../../../core/constants/phase-projects-keys';
import { SkeletonModule } from 'primeng/skeleton';

register(); // Llama a register para los elementos de Swiper

// Interfaz para el estado de la imagen en el cliente
interface GalleryImageState {
  url: string;
  name: string;
  loading: boolean;
  error: boolean;
  originalData: GalleryImageFirestore; // Guardar el objeto original de Firestore
}

@Component({
  selector: 'app-card-project',
  templateUrl: './card-project.component.html',
  styleUrls: ['./card-project.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    GalleriaModule,
    TagModule,
    ButtonModule,
    ImageModule,
    DividerModule,
    SkeletonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Para <swiper-container> y <swiper-slide>
})
export class CardProjectComponent {
  public project = input.required<Project>();

  // Servicios Inyectados
  public translationCoreService = inject(TranslationService); // Tu servicio de idioma personalizado
  public translate = inject(TranslateService); // Servicio de ngx-translate

  // Signals y Computed para internacionalización y estado
  currentLang = computed(() => this.translationCoreService.currentLang());

  public processedGalleryImages: WritableSignal<GalleryImageState[]> = signal([]);

  // Colores y llaves de traducción para las fases del proyecto
  public readonly phaseColors = PROJECT_PHASE_COLORS;
  public readonly phaseTranslationKeys = PROJECT_PHASE_TRANSLATION_KEYS;

  constructor() {
    effect(() => {
      const currentProject = this.project();
      if (currentProject?.galleryImages && currentProject.galleryImages.length > 0) {
        this.prepareImageStates(currentProject.galleryImages);
      } else {
        this.processedGalleryImages.set([]);
      }
    });
  }

  private prepareImageStates(originalFirestoreImages: GalleryImageFirestore[]): void {
    const imageStates: GalleryImageState[] = originalFirestoreImages.map(imgFirestore => ({
      url: imgFirestore.url,
      name: imgFirestore.name || 'Imagen de galería', // Fallback por si el nombre no viene
      loading: true,
      error: false,
      originalData: imgFirestore
    }));
    this.processedGalleryImages.set(imageStates);
    // console.log('Processed Gallery Images Initialized:', this.processedGalleryImages());
  }

  onImageLoad(index: number): void {
    const images = this.processedGalleryImages();
    if (images[index] && images[index].loading) { // Solo actuar si estaba cargando
      // console.log(`ÉXITO: Imagen en índice ${index} CARGADA. URL: ${images[index].url}`);
      this.processedGalleryImages.update(currentImages =>
        currentImages.map((img, i) =>
          i === index ? { ...img, loading: false, error: false } : img
        )
      );
    }
  }

  onImageError(index: number): void {
    const images = this.processedGalleryImages();
    if (images[index] && images[index].loading) { // Solo actuar si estaba cargando
      // console.log(`ERROR: Imagen en índice ${index} FALLÓ al cargar. URL: ${images[index].url}`);
      this.processedGalleryImages.update(currentImages =>
        currentImages.map((img, i) =>
          i === index ? { ...img, loading: false, error: true } : img
        )
      );
    }
  }

  // Función trackBy para el *ngFor de la galería
  trackByImageState(index: number, imgState: GalleryImageState): string {
    return imgState.url + '-' + index; // Una URL única o combinación con índice
  }

  // Método para manejar la actualización de Swiper
  public handleSwiperUpdate(event: Event | CustomEvent): void {
    const swiperContainerElement = event.target as HTMLElement & { swiper?: any };
    if (swiperContainerElement && typeof swiperContainerElement.swiper?.update === 'function') {
      try {
        swiperContainerElement.swiper.update();
      } catch (e) {
        console.error('Error updating Swiper instance:', e);
      }
    }
  }

  // Métodos para obtener campos localizados y clases de fase (ya los tenías)
  localizedField(field: 'name' | 'description'): string {
    const currentProject = this.project();
    if (!currentProject) return '';
    const langKey = this.currentLang(); // 'es', 'en', 'zh'
    const key = `${field}_${langKey}` as keyof Project;
    if (key in currentProject && currentProject[key]) {
      return currentProject[key] as string;
    }
    const fallbackKey = `${field}_es` as keyof Project; // Fallback a español
    return (currentProject[fallbackKey] as string) || '';
  }

  getPhaseTranslationKey(): string {
    const currentProject = this.project();
    if (!currentProject?.phase) return '';
    return this.phaseTranslationKeys[currentProject.phase] || currentProject.phase;
  }

  getPhaseTagClasses(): string {
    const currentProject = this.project();
    if (!currentProject?.phase) {
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
    }
    return this.phaseColors[currentProject.phase] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
  }
}