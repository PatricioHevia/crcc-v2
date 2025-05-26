import { Injectable, computed, inject, Signal, } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Project, GalleryImageFirestore } from '../../admin/models/project-interface';
import { FirestoreService } from '../../core/services/firestore.service';
import { StorageService, UploadTask } from '../../core/services/storage.service';
import { parseUrl, removeAccents } from '../../core/helpers/remove-acents';
import { ProjectForm } from '../models/project-interface';
import { ProjectPhaseCode } from '../../core/constants/phase-projects-keys';
import { TranslationService } from '../../core/services/translation.service';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private fs = inject(FirestoreService);
  private storageService = inject(StorageService);
  private translationService = inject(TranslationService);

  private listener: {
    data: Signal<Project[]>;
    loading: Signal<boolean>;
    unsubscribe: () => void;
  } | null = null;

  /** Inicia el listener una sola vez */
  private startListening(): void {
    if (!this.listener) {
      this.listener = this.fs.listenCollectionWithLoading<Project>(
        'projects'
        // Aquí podrías añadir QueryConstraints si necesitas ordenar, por ejemplo:
        // [orderBy('name_es', 'asc')]
      );
    }
  }

  /** Señal con los contactos; arranca la escucha al invocar */
  projects(): Project[] {
    this.startListening();
    return this.listener!.data();
  }

  /** Señal de loading; arranca la escucha al invocar */
  loading(): boolean {
    this.startListening();
    return this.listener!.loading();
  }

  // Mapa id → nombres multilenguaje
  public projectNames = computed(() => {
    const list = this.projects();
    const map: Record<string, { es: string; en: string; zh: string }> = {};
    list.forEach(p => {
      map[p.id] = { es: p.name_es, en: p.name_en, zh: p.name_zh };
    });
    return map;
  });



  /** Sube la imagen principal y retorna la tarea */
  uploadMainImage(file: File, projectId: string): UploadTask {
    const filename = `${Date.now()}_${file.name}`;
    const path = `projects/${projectId}/main/${filename}`;
    return this.storageService.uploadFile(file, path);
  }

  /** Sube varias imágenes de galería y retorna las tareas */
  uploadGalleryImages(files: File[], projectId: string): UploadTask[] {
    const basePath = `projects/${projectId}/gallery`;
    return this.storageService.uploadFiles(files, basePath);
  }

  /**
   * Actualiza la imagen principal de un proyecto
   * @param projectId ID del proyecto
   * @param newImageFile Nueva imagen
   * @param deleteOldImage Si debe eliminar la imagen anterior
   * @returns Objeto con la tarea de subida y promesa de completado
   */
  updateMainImage(
    projectId: string, 
    newImageFile: File, 
    deleteOldImage: boolean = true
  ): { uploadTask: UploadTask; complete: Promise<void> } {
    const uploadTask = this.uploadMainImage(newImageFile, projectId);
    
    const complete = (async () => {
      try {        // Obtener datos actuales del proyecto si necesitamos eliminar la imagen anterior
        let currentProject: Project | null = null;
        if (deleteOldImage) {
          const projectData = await this.fs.readOne<Project>('projects', projectId);
          currentProject = projectData || null;
        }

        // Esperar a que termine la subida y obtener la URL
        const newImageUrl = await firstValueFrom(uploadTask.downloadURL$);
        
        // Eliminar imagen anterior si existe y se solicitó
        if (deleteOldImage && currentProject?.image) {
          try {
            await this.storageService.deleteFileByUrl(currentProject.image);
          } catch (error) {
            console.warn('No se pudo eliminar la imagen anterior:', error);
          }
        }

        // Actualizar el proyecto en Firestore
        await this.update(projectId, { image: newImageUrl });
        
      } catch (error) {
        console.error('Error al actualizar imagen principal:', error);
        throw error;
      }
    })();

    return { uploadTask, complete };
  }

  /**
   * Actualiza las imágenes de galería de un proyecto
   * @param projectId ID del proyecto
   * @param newImages Nuevas imágenes para la galería
   * @param replaceAll Si debe reemplazar todas las imágenes o añadir a las existentes
   * @returns Objeto con las tareas de subida y promesa de completado
   */
  updateGalleryImages(
    projectId: string,
    newImages: File[],
    replaceAll: boolean = false
  ): { uploadTasks: UploadTask[]; complete: Promise<void> } {
    const uploadTasks = this.uploadGalleryImages(newImages, projectId);
    
    const complete = (async () => {
      try {        // Obtener datos actuales del proyecto
        const projectData = await this.fs.readOne<Project>('projects', projectId);
        const currentProject = projectData || null;
        
        // Si replaceAll es true, eliminar imágenes existentes
        if (replaceAll && currentProject?.galleryImages?.length) {
          for (const img of currentProject.galleryImages) {
            try {
              await this.storageService.deleteFileByUrl(img.url);
            } catch (error) {
              console.warn('No se pudo eliminar imagen de galería:', img.url, error);
            }
          }
        }

        // Esperar a que terminen todas las subidas
        const newImageUrls = await Promise.all(
          uploadTasks.map(task => firstValueFrom(task.downloadURL$))
        );

        // Crear objetos GalleryImageFirestore
        const newGalleryImages: GalleryImageFirestore[] = newImages.map((file, index) => ({
          url: newImageUrls[index],
          name: file.name
        }));

        // Determinar las imágenes finales de la galería
        const finalGalleryImages = replaceAll 
          ? newGalleryImages 
          : [...(currentProject?.galleryImages || []), ...newGalleryImages];

        // Actualizar el proyecto en Firestore
        await this.update(projectId, { galleryImages: finalGalleryImages });
        
      } catch (error) {
        console.error('Error al actualizar imágenes de galería:', error);
        throw error;
      }
    })();

    return { uploadTasks, complete };
  }

  /**
   * Elimina una imagen específica de la galería
   * @param projectId ID del proyecto
   * @param imageUrl URL de la imagen a eliminar
   */
  async removeGalleryImage(projectId: string, imageUrl: string): Promise<void> {
    try {      // Obtener proyecto actual
      const projectData = await this.fs.readOne<Project>('projects', projectId);
      const project = projectData || null;
      if (!project?.galleryImages) return;

      // Filtrar la imagen a eliminar
      const updatedGallery = project.galleryImages.filter(img => img.url !== imageUrl);

      // Eliminar archivo del storage
      await this.storageService.deleteFileByUrl(imageUrl);

      // Actualizar proyecto en Firestore
      await this.update(projectId, { galleryImages: updatedGallery });

    } catch (error) {
      console.error('Error al eliminar imagen de galería:', error);
      throw error;
    }
  }

  /**
   * Obtiene el progreso combinado de múltiples tareas de subida
   * @param uploadTasks Array de tareas de subida
   * @returns Observable con el progreso promedio (0-100)
   */  getCombinedProgress(uploadTasks: UploadTask[]): Observable<number> {
    if (uploadTasks.length === 0) {
      return new Observable<number>((observer) => {
        observer.next(100);
        observer.complete();
      });
    }

    return new Observable<number>((observer) => {
      const progresses: number[] = new Array(uploadTasks.length).fill(0);
      let completedTasks = 0;

      uploadTasks.forEach((task, index) => {
        task.percentage$.subscribe({
          next: (progress) => {
            progresses[index] = progress;
            const averageProgress = progresses.reduce((sum, p) => sum + p, 0) / uploadTasks.length;
            observer.next(Math.round(averageProgress));
          },
          complete: () => {
            completedTasks++;
            if (completedTasks === uploadTasks.length) {
              observer.complete();
            }
          },
          error: (error) => observer.error(error)
        });
      });
    });
  }

  async createProject(name: string, description: string, phase: ProjectPhaseCode, adwardDate: Date) {
    const adwardDateAsFirestoreTimestamp: Timestamp = Timestamp.fromDate(adwardDate)
    try {
      const project: Omit<Project, 'id'> = {
        name,
        name_es: '',
        name_en: '',
        name_zh: '',
        description,
        description_es: '',
        description_en: '',
        description_zh: '',
        phase,
        image: '',
        galleryImages: [],
        url: '',
        awardDate: adwardDateAsFirestoreTimestamp
      }
      const traducido = await this.translationService.translateJson(project);
      traducido.url = parseUrl(removeAccents(traducido.name_es));
      const proyecto: Project = {
        ...traducido,
        id: traducido.url,
        awardDate: adwardDateAsFirestoreTimestamp
      }
      return await this.fs.create<Project>('projects', proyecto, traducido.url);
    } catch (error) {
      console.error('Error al crear el proyecto:', error);
      throw error; // Re-lanza el error para manejarlo en el componente
    }
  }

  // --- Métodos DESDE ADMIN PANEL ---
  public update(id: string, changes: Partial<Project>) {
    return this.fs.update<Project>('projects', id, changes);
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const project = await this.fs.readOne<Project>('projects', projectId);
      if (project?.image) {
        await this.storageService.deleteFileByUrl(project.image);
      }
      if (project?.galleryImages && project.galleryImages.length > 0) {
        for (const img of project.galleryImages) {
          await this.storageService.deleteFileByUrl(img.url);
        }
      }

      await this.fs.delete('projects', projectId);
      console.log(`Proyecto con ID: ${projectId} eliminado exitosamente.`);
    } catch (error) {
      console.error(`Error al eliminar el proyecto ${projectId}:`, error);
      // Asegúrate de que el error sea propagado para que el componente pueda manejarlo (e.g., mostrar un toast de error)
      throw error;
    }
  }

  // --- Métodos de limpieza ---

  ngOnDestroy(): void {
    if (this.listener && typeof this.listener.unsubscribe === 'function') {
      this.listener.unsubscribe(); // Llama a la función de desuscripción
      this.listener = null; // Limpia la referencia (opcional, buena práctica)
      console.log('ProjectService: Firestore listener unsubscribed.'); // Para verificar en consola
    }
  }


  


}
