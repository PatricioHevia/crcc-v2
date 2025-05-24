import { Injectable, signal, computed, effect, inject, Signal, runInInjectionContext, Injector } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, Observable } from 'rxjs';
import { orderBy, Timestamp } from '@angular/fire/firestore';
import { GalleryImageFirestore, Project, ProjectForm } from '../../admin/models/project-interface';
import { FirestoreService } from '../../core/services/firestore.service';
import { StorageService, UploadTask } from '../../core/services/storage.service';
import { removeAccents } from '../../core/helpers/remove-acents';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private fs = inject(FirestoreService);
  private storageService = inject(StorageService);

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
  createProject(
    form: ProjectForm,
    imageFile?: File,
    galleryFiles?: File[]
  ): {
    mainTask?: UploadTask;
    galleryTasks?: UploadTask[];
    complete: Promise<void>;
  } {
    // 1) Prepara datos base
    const projectData: Partial<Project> = { ...form };
    projectData.url = removeAccents(form.name_es).replaceAll(' ', '-').toLowerCase();
    if (form.adwardDate) {
      projectData.adwardDate = Timestamp.fromDate(form.adwardDate as any);
    }

    const id = projectData.url!;
    let mainTask: UploadTask | undefined;
    let galleryTasks: UploadTask[] | undefined;

    // 2) Inicia subidas
    if (imageFile) {
      mainTask = this.uploadMainImage(imageFile, id);
    }
    if (galleryFiles?.length) {
      galleryTasks = this.uploadGalleryImages(galleryFiles, id);
    }

    // 3) Promesa que espera URLs y luego escribe en Firestore
    const complete = (async () => {
      if (mainTask) {
        projectData.image = await firstValueFrom(mainTask.downloadURL$);
      }

      // --- MODIFICACIÓN AQUÍ para galleryImages ---
      if (galleryTasks && galleryTasks.length > 0 && galleryFiles && galleryFiles.length === galleryTasks.length) {
        // Asumimos que el orden de galleryTasks corresponde al de galleryFiles
        // y que quieres guardar la URL y el nombre original del archivo.
        const galleryImageObjects: GalleryImageFirestore[] = await Promise.all(
          galleryTasks.map(async (task, index) => {
            const url = await firstValueFrom(task.downloadURL$);
            const originalFile = galleryFiles[index]; // Accedemos al archivo original por índice
            return {
              url: url,
              name: originalFile.name,
            };
          })
        );
        projectData.galleryImages = galleryImageObjects;
      } else if (galleryTasks && galleryTasks.length > 0) {
        console.warn('[createProject] galleryFiles no disponible o longitud no coincide con galleryTasks. Guardando solo URLs para galleryImages.');
        projectData.galleryImages = await Promise.all(
          galleryTasks.map(async (task) => {
            const url = await firstValueFrom(task.downloadURL$);
            return {
              url: url,
              name: 'unknown_filename' // O algún valor por defecto o dejarlo undefined si es opcional
            };
          })
        );
      } else {
        projectData.galleryImages = []; // O undefined, si galleryImages es opcional y prefieres no tener el campo.
      }
      await this.fs.create<Project>('projects', projectData as Project, id);
    })();

    return { mainTask, galleryTasks, complete };
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
