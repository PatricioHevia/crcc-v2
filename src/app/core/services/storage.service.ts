import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface UploadTask {
  /** Ruta completa en almacenamiento */
  path: string;
  /** Porcentaje de subida (0–100) */
  percentage$: Observable<number>;
  /** URL de descarga cuando la subida finalice */
  downloadURL$: Observable<string>;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  /**
   * Sube un único archivo y retorna información de progreso y URL final.
   * @param file Archivo a subir
   * @param path Ruta donde se guardará (p.ej. 'uploads/mi-archivo.png')
   */
  uploadFile(file: File, path: string): UploadTask {
    const storageRef = ref(this.storage, path);
    const task = uploadBytesResumable(storageRef, file);

    const percentage$ = new Observable<number>(observer => {
      task.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          observer.next(percent);
        },
        error => observer.error(error),
        () => observer.complete()
      );
    });

    const downloadURL$ = new Observable<string>(observer => {
      task.on(
        'state_changed',
        null,
        error => observer.error(error),
        () => {
          getDownloadURL(storageRef)
            .then(url => {
              observer.next(url);
              observer.complete();
            })
            .catch(err => observer.error(err));
        }
      );
    });

    return { path, percentage$, downloadURL$ };
  }

  /**
   * Sube múltiples archivos de una ruta base común.
   * @param files Array de archivos
   * @param basePath Carpeta donde guardar (p.ej. 'uploads')
   */
  uploadFiles(files: File[], basePath: string): UploadTask[] {
    return files.map(file => {
      const timestamp = Date.now();
      const filePath = `${basePath}/${timestamp}_${file.name}`;
      return this.uploadFile(file, filePath);
    });
  }
}
