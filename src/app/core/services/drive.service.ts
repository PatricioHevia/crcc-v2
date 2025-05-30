// src/app/services/drive.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators'; // Necesitaremos operadores de RxJS

export interface UploadedFileResponse {
  filename: string;
  url: string;
  id: string;
  folderId?: string;
}

export interface DriveUploadResponse {
  message: string;
  files: UploadedFileResponse[];
  targetFolderId?: string;
}

// Nueva interfaz para el evento de progreso
export interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DriveService {

  private uploadFunctionUrl = 'https://us-central1-pp-pruebas.cloudfunctions.net/uploadFileToDrive';
  private uploadFunctionOAuthUrl = 'https://us-central1-pp-pruebas.cloudfunctions.net/uploadFileToDriveOAuth';

  constructor(private http: HttpClient) { }

  /**
   * Sube uno o más archivos a Google Drive usando cuenta de servicio y reporta el progreso.
   * @param files Array de objetos File a subir.
   * @param targetFolderId Opcional. El ID de la carpeta de Google Drive.
   * @returns Un Observable que emite eventos de progreso (UploadProgress) o la respuesta final (DriveUploadResponse).
   */
  uploadFiles(files: File[], targetFolderId?: string): Observable<UploadProgress | DriveUploadResponse> {
    return this.uploadFilesInternal(files, targetFolderId, this.uploadFunctionUrl);
  }

  /**
   * Sube uno o más archivos a Google Drive usando OAuth (tu cuenta personal) y reporta el progreso.
   * @param files Array de objetos File a subir.
   * @param targetFolderId Opcional. El ID de la carpeta de Google Drive.
   * @returns Un Observable que emite eventos de progreso (UploadProgress) o la respuesta final (DriveUploadResponse).
   */
  uploadFilesOAuth(files: File[], targetFolderId?: string): Observable<UploadProgress | DriveUploadResponse> {
    return this.uploadFilesInternal(files, targetFolderId, this.uploadFunctionOAuthUrl);
  }

  /**
   * Método interno para manejar la subida de archivos.
   */
  private uploadFilesInternal(files: File[], targetFolderId: string | undefined, url: string): Observable<UploadProgress | DriveUploadResponse> {
    if (!files || files.length === 0) {
      throw new Error('No se proporcionaron archivos para subir.');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('selectedFiles', file, file.name);
    });

    if (targetFolderId) {
      formData.append('targetFolderId', targetFolderId);
    }

    // Creamos una HttpRequest para poder reportar el progreso
    const req = new HttpRequest('POST', url, formData, {
      reportProgress: true // ¡Esto es clave para obtener eventos de progreso!
    });

    return this.http.request<DriveUploadResponse>(req).pipe(
      map(event => this.getEventMessage(event)), // Mapeamos los eventos a nuestro formato
      filter(message => message !== null) // Filtramos eventos que no nos interesan (como Sent)
    ) as Observable<UploadProgress | DriveUploadResponse>; // Aseguramos el tipo de salida
  }

  private getEventMessage(event: HttpEvent<DriveUploadResponse>): UploadProgress | DriveUploadResponse | null {
    switch (event.type) {
      case HttpEventType.Sent:
        // El request ha sido enviado. Podrías loguear esto o ignorarlo.
        console.log('Request enviado al servidor.');
        return null; // O un objeto específico si quieres notificar esto

      case HttpEventType.UploadProgress:
        // Evento de progreso de subida
        if (event.total) {
          const percentage = Math.round(100 * event.loaded / event.total);
          const progress: UploadProgress = {
            percentage: percentage,
            loaded: event.loaded,
            total: event.total
          };
          // console.log(`Progreso de subida: ${percentage}% (${event.loaded} de ${event.total} bytes)`);
          return progress;
        }
        return null; // No podemos calcular el porcentaje si event.total no está definido

      case HttpEventType.ResponseHeader:
        // Se han recibido las cabeceras de la respuesta.
        console.log(`Respuesta recibida con estado: ${event.status}`);
        return null; // O un objeto específico

      case HttpEventType.DownloadProgress:

        return null;

      case HttpEventType.Response:
        // La respuesta completa ha sido recibida.
        console.log('Respuesta completa recibida del servidor.');
        return event.body as DriveUploadResponse; 

      default:
        return null;
    }
  }
}