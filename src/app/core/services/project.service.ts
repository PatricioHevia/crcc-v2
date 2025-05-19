import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FirestoreService } from './firestore.service';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Timestamp } from '@angular/fire/firestore';
import { Project, ProjectForm } from '../models/project-interface';
import { removeAccents } from '../helpers/remove-acents';

@Injectable({ providedIn: 'root' })
export class ProjectService {
    private fs = inject(FirestoreService);
    private storage= inject(Storage);
  /** Observable interna de proyectos en tiempo real */
  private projects$ = this.fs.listenCollection<Project>('projects');

  /** Signal con la lista de proyectos, inicializada en vacío */
  public projects = toSignal(this.projects$, { initialValue: [] as Project[] });

  /** Signal que indica si la carga inicial está en progreso */
  

  /** Computed que mapea id -> nombre de proyecto */
  public projectNames = computed(() => {
    const list = this.projects();
    const map: Record<string, { es: string; en: string; zh: string }> = {};
    list.forEach(p => {
        map[p.id] = {
            es: p.name_es,
            en: p.name_en,
            zh: p.name_zh
        };
    });
    return map;
});

  constructor(
    
  ) {
    // effect para desactivar loading tras recibir primeros datos
    effect(() => {
      const projects = this.projects();
    
    });
  }

  /** Crea un proyecto con imagen y fecha opcional */
  async createProject(form: ProjectForm, imageFile?: File): Promise<void> {
    try {
      const project: ProjectForm = { ...form };
      if (imageFile) {
        project.image = await this.uploadImage(imageFile);
      }
      project.url = removeAccents(project.name_es)
        .replaceAll(' ', '-')
        .toLowerCase();
      if (form.adwardDate) {
        project.adwardDate = Timestamp.fromDate(form.adwardDate as any);
      }
      const id = project.url;
      await this.fs.create<ProjectForm>('projects', project, id);
    } catch (error) {
      console.error('[ProjectService][createProject] Error:', error);
      throw error;
    }
  }

  /** Obtiene proyectos una sola vez */
  async getProjectsOnce(): Promise<Project[]> {
    try {
      return await this.fs.readCollection<Project>('projects');
    } catch (error) {
      console.error('[ProjectService][getProjectsOnce] Error:', error);
      throw error;
    }
  }

  /** Actualiza un proyecto, opcionalmente con nueva imagen */
  async updateProject(
    id: string,
    data: Partial<ProjectForm>,
    imageFile?: File
  ): Promise<void> {
    try {
      if (imageFile) {
        data.image = await this.uploadImage(imageFile);
      }
      await this.fs.update<ProjectForm>('projects', id, data);
    } catch (error) {
      console.error('[ProjectService][updateProject] Error:', error);
      throw error;
    }
  }

  /** Sube imagen y devuelve URL pública */
  private uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const path = `projects/${file.name}`;
      const storageRef = ref(this.storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {},
        error => {
          console.error('[ProjectService][uploadImage] Error al cargar:', error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(storageRef);
            resolve(url);
          } catch (e) {
            console.error('[ProjectService][uploadImage] Error al obtener URL:', e);
            reject(e);
          }
        }
      );
    });
  }

}
