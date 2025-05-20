import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { StorageService, UploadTask } from './storage.service';
import { Timestamp } from '@angular/fire/firestore';
import { Project, ProjectForm } from '../models/project-interface';
import { removeAccents } from '../helpers/remove-acents';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private fs = inject(FirestoreService);
  private storageService = inject(StorageService);

  // Señal reactiva de lista de proyectos
  private projects$ = this.fs.listenCollection<Project>('projects');
  public projects = toSignal(this.projects$, { initialValue: [] as Project[] });

  // Mapa id → nombres multilenguaje
  public projectNames = computed(() => {
    const list = this.projects();
    const map: Record<string, { es: string; en: string; zh: string }> = {};
    list.forEach(p => {
      map[p.id] = { es: p.name_es, en: p.name_en, zh: p.name_zh };
    });
    return map;
  });

  constructor() {
    // disparador para inicializar la escucha
    effect(() => { this.projects(); });
  }

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
    if (galleryTasks) {
      projectData.galleryImages = await Promise.all(
        galleryTasks.map(t => firstValueFrom(t.downloadURL$))
      );
    }
    // Usa Project (incluye image y galleryImages) como tipo en Firestore
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


}
