import { Component, computed, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { SkeletonModule } from 'primeng/skeleton';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ImageCropperComponent } from 'ngx-image-cropper';
import { ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';

import { ProjectService } from '../../../admin/services/project.service';
import { Project, GalleryImageFirestore } from '../../../admin/models/project-interface';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastService } from '../../../core/services/toast.service';
import { PROJECT_PHASE_COLORS, PROJECT_PHASE_TRANSLATION_KEYS } from '../../../core/constants/phase-projects-keys';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-ficha-general',
  templateUrl: './ficha-general.component.html',
  styleUrls: ['./ficha-general.component.css'],
  standalone: true,  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    DividerModule,
    PanelModule,
    TagModule,
    ImageModule,
    SkeletonModule,
    MessagesModule,
    MessageModule,
    ProgressSpinnerModule,
    TooltipModule,
    ConfirmDialogModule,
    ImageCropperComponent
  ]
})
export class FichaGeneralComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private translationService = inject(TranslationService);
  private translateService = inject(TranslateService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  lang = computed(() => this.translationService.currentLang());

  // Señales reactivas
  projectId = signal<string>('');
  project = signal<Project | null>(null);
  loading = signal<boolean>(true);
  notFound = signal<boolean>(false);

  // Señales para gestión de galería
  uploadLoading = signal<boolean>(false);
    // Variables para el cropper - simplificado solo para aspect ratio 16:9
  imageChangedEvent: Event | null = null;
  croppedImage: string = '';
  showCropper = false;
  currentImageFile: File | null = null;
  croppedFile: File | null = null;

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
  }  // Método para volver a la lista de proyectos
  goBack(): void {
    this.router.navigate(['/app/projects']);
  }

  // Métodos para gestión de galería
  openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file && this.validateFile(file)) {
      this.currentImageFile = file;
      this.imageChangedEvent = event;
      this.showCropper = false; // Reset cropper state
    }
  }  validateFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      this.toastService.error(
        'COMMON.ERROR',
        'PROJECT.GALLERY_MANAGEMENT.INVALID_FORMAT'
      );
      return false;
    }

    return true;
  }  imageCropped(event: ImageCroppedEvent): void {
    if (event.blob) {
      const file = new File([event.blob], `recorte_${Date.now()}.png`, { type: 'image/png' });
      this.croppedFile = file;
      this.croppedImage = URL.createObjectURL(file);
    } else {
      this.toastService.error(
        'COMMON.ERROR',
        'PROJECT.GALLERY_MANAGEMENT.CROP_ERROR'
      );
    }
  }

  imageLoaded(): void {
    this.showCropper = true;
  }

  cropperReady(): void {
    // Cropper is ready
  }  loadImageFailed(): void {
    this.toastService.error(
      'COMMON.ERROR',
      'PROJECT.GALLERY_MANAGEMENT.LOAD_ERROR'
    );
  }  async applyCrop(): Promise<void> {
    if (!this.croppedFile || !this.currentImageFile) {
      this.toastService.error(
        'COMMON.ERROR',
        'PROJECT.GALLERY_MANAGEMENT.NO_CROPPED_IMAGE'
      );
      return;
    }

    this.uploadLoading.set(true);
    try {
      // Upload the cropped image
      const projectId = this.projectId();
      const { uploadTasks, complete } = this.projectService.updateGalleryImages(projectId, [this.croppedFile], false);
      
      // Wait for upload to complete
      await complete;
      
      // Get updated project data from the projects signal
      const projects = this.projectService.projects();
      const updatedProject = projects.find(p => p.id === projectId);
      if (updatedProject) {
        this.project.set(updatedProject);
      }

      this.toastService.success(
        'COMMON.SUCCESS',
        'PROJECT.GALLERY_MANAGEMENT.UPLOAD_SUCCESS'
      );
      
      this.resetCropper();
    } catch (error) {
      console.error('Error uploading image:', error);
      this.toastService.error(
        'COMMON.ERROR',
        'PROJECT.GALLERY_MANAGEMENT.UPLOAD_ERROR'
      );
    } finally {
      this.uploadLoading.set(false);
    }
  }
  cancelCrop(): void {
    this.resetCropper();
  }
  resetCropper(): void {
    this.imageChangedEvent = null;
    this.croppedImage = '';
    this.showCropper = false;
    this.currentImageFile = null;
    this.croppedFile = null;
    
    // Clean up object URL to prevent memory leaks
    if (this.croppedImage) {
      URL.revokeObjectURL(this.croppedImage);
    }
  }  deleteImage(image: GalleryImageFirestore): void {
    this.confirmationService.confirm({
      message: this.translateService.instant('PROJECT.GALLERY_MANAGEMENT.DELETE_CONFIRM_MESSAGE'),
      header: this.translateService.instant('PROJECT.GALLERY_MANAGEMENT.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.performDeleteImage(image);
      }
    });
  }async performDeleteImage(image: GalleryImageFirestore): Promise<void> {
    try {
      const projectId = this.projectId();
      await this.projectService.removeGalleryImage(projectId, image.url);
      
      // Get updated project data from the projects signal
      const projects = this.projectService.projects();
      const updatedProject = projects.find(p => p.id === projectId);
      if (updatedProject) {
        this.project.set(updatedProject);
      }

      this.toastService.success(
        'COMMON.SUCCESS',
        'PROJECT.GALLERY_MANAGEMENT.DELETE_SUCCESS'
      );
    } catch (error) {
      console.error('Error deleting image:', error);
      this.toastService.error(
        'COMMON.ERROR',
        'PROJECT.GALLERY_MANAGEMENT.DELETE_ERROR'
      );
    }
  }
}
