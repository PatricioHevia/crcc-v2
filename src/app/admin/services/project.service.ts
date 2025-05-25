import { Injectable, computed, inject, Signal, } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Project } from '../../admin/models/project-interface';
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
   * Crea un proyecto:
   * - devuelve mainTask y galleryTasks para mostrar progreso
   * - la promesa `complete` espera a que todo se suba y luego escribe Firestore
   */
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
        adwardDate: adwardDateAsFirestoreTimestamp 
      }
      const traducido = await this.translationService.translateJson(project);
      traducido.url = parseUrl(removeAccents(traducido.name_es));
      const proyecto: Project = {
        ...traducido,
        id: traducido.url,
        adwardDate: adwardDateAsFirestoreTimestamp
      }
      return await this.fs.create<Project>('projects', proyecto, traducido.url);
    } catch (error) {
      console.error('Error al crear el proyecto:', error);
      throw error; // Re-lanza el error para manejarlo en el componente
    }
  }

  /**
   * Actualiza un proyecto:
   * - idéntico patrón: devuelve tareas y promesa final
   */
  updateProject(
    id: string,
    data: Partial<ProjectForm>,
    imageFile?: File,
    galleryFiles?: File[]
  ): {
    mainTask?: UploadTask;
    galleryTasks?: UploadTask[];
    complete: Promise<void>;
  } {
    const updateData = { ...data, image: undefined, galleryImages: undefined } as any;

    let mainTask: UploadTask | undefined;
    let galleryTasks: UploadTask[] | undefined;

    if (imageFile) {
      mainTask = this.uploadMainImage(imageFile, id);
    }
    if (galleryFiles?.length) {
      galleryTasks = this.uploadGalleryImages(galleryFiles, id);
    }

    const complete = (async () => {
      if (mainTask) {
        updateData.image = await firstValueFrom(mainTask.downloadURL$);
      }
      if (galleryTasks) {
        updateData.galleryImages = await Promise.all(
          galleryTasks.map(t => firstValueFrom(t.downloadURL$))
        );
      }
      await this.fs.update<ProjectForm>('projects', id, updateData);
    })();

    return { mainTask, galleryTasks, complete };
  }

  ngOnDestroy(): void {
    if (this.listener && typeof this.listener.unsubscribe === 'function') {
      this.listener.unsubscribe(); // Llama a la función de desuscripción
      this.listener = null; // Limpia la referencia (opcional, buena práctica)
      console.log('ProjectService: Firestore listener unsubscribed.'); // Para verificar en consola
    }
  }


}
