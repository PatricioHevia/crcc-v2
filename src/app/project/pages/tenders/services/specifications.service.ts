import { Injectable, inject, Signal } from '@angular/core';
import { Observable, switchMap, of, throwError } from 'rxjs';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { DriveService, DriveUploadResponse, UploadProgress } from '../../../../core/services/drive.service';
import { TenderSpecification, TenderSpecificationType } from '../models/specifications.interface';
import { Timestamp, orderBy } from '@angular/fire/firestore';

export interface CreateSpecificationData {
  idProject: string;
  idTender: string;
  name: string;
  name_es?: string;
  name_en?: string;
  name_zh?: string;
  description: string;
  description_es?: string;
  description_en?: string;
  description_zh?: string;
  type: TenderSpecificationType;
  file: File;
}

@Injectable({
  providedIn: 'root'
})
export class SpecificationsService {
  private fs = inject(FirestoreService);
  private driveService = inject(DriveService);  // ID de la carpeta en Google Drive donde se almacenarán las especificaciones
  // TEMPORAL: undefined para usar la carpeta raíz mientras configuramos la carpeta correcta
  private readonly DRIVE_FOLDER_ID: string | undefined = '1FTmaad5jUEOqJ-vGylYf3eZVzf8hvd3V'; // Cambiar por el ID real de la carpeta
  /**
   * Crea una nueva especificación de licitación.
   * Sube el archivo a Google Drive usando OAuth (tu cuenta personal) y guarda los datos en Firestore.
   * @param data Datos de la especificación a crear
   * @returns Observable que emite el progreso de subida y finalmente la especificación creada
   */
  createSpecification(data: CreateSpecificationData): Observable<UploadProgress | TenderSpecification> {
    if (!data.file) {
      return throwError(() => new Error('No se proporcionó archivo para la especificación.'));
    }

    // Subir archivo a Google Drive usando OAuth (tu cuenta personal)
    return this.driveService.uploadFilesOAuth([data.file], this.DRIVE_FOLDER_ID).pipe(
      switchMap((response) => {
        // Si es progreso, lo emitimos
        if ('percentage' in response) {
          return of(response as UploadProgress);
        }

        // Si es respuesta final, procesamos y guardamos en Firestore
        const uploadResponse = response as DriveUploadResponse;
        if (!uploadResponse.files || uploadResponse.files.length === 0) {
          return throwError(() => new Error('Error al subir archivo a Google Drive.'));
        }

        const uploadedFile = uploadResponse.files[0];
        
        // Crear objeto de especificación
        const specification: Omit<TenderSpecification, 'id'> = {
          idTender: data.idTender,
          name: data.name,
          name_es: data.name_es || '',
          name_en: data.name_en || '',
          name_zh: data.name_zh || '',
          description: data.description,
          description_es: data.description_es || '',
          description_en: data.description_en || '',
          description_zh: data.description_zh || '',
          type: data.type,
          fileSize: this.formatFileSize(data.file.size),
          fileUrl: uploadedFile.url,
          fileType: data.file.type || 'application/octet-stream',
          date: Timestamp.now()
        };

        // Construir la ruta de Firestore: projects/{idProject}/tenders/{idTender}/specifications
        const firestorePath = `projects/${data.idProject}/tenders/${data.idTender}/specifications`;

        // Guardar en Firestore
        return this.fs.create<Omit<TenderSpecification, 'id'>>(firestorePath, specification).then(
          (docId) => {
            const createdSpecification: TenderSpecification = {
              id: docId,
              ...specification
            };
            return createdSpecification;
          }
        );
      })
    );
  }

  /**
   * Obtiene todas las especificaciones de una licitación específica.
   * Retorna un Signal con el array de especificaciones y función de desuscripción.
   * @param idProject ID del proyecto
   * @param idTender ID de la licitación
   * @returns Objeto con data (Signal), loading (Signal) y función unsubscribe
   */
  getAllSpecifications(
    idProject: string, 
    idTender: string
  ): { data: Signal<TenderSpecification[]>; loading: Signal<boolean>; unsubscribe: () => void } {
    const firestorePath = `projects/${idProject}/tenders/${idTender}/specifications`;
    
    // Usar el método del FirestoreService que retorna signals
    return this.fs.listenCollectionWithLoading<TenderSpecification>(
      firestorePath,
      [
        orderBy('date', 'desc') // Ordenar por fecha, más recientes primero
      ]
    );
  }

  /**
   * Obtiene todas las especificaciones de una licitación como Observable.
   * @param idProject ID del proyecto
   * @param idTender ID de la licitación
   * @returns Observable con el array de especificaciones
   */
  getAllSpecificationsObservable(idProject: string, idTender: string): Observable<TenderSpecification[]> {
    const firestorePath = `projects/${idProject}/tenders/${idTender}/specifications`;
    
    return this.fs.listenCollection<TenderSpecification>(
      firestorePath,
      [
        orderBy('date', 'desc')
      ]
    );
  }

  /**
   * Formatea el tamaño del archivo en bytes a una representación legible.
   * @param bytes Tamaño en bytes
   * @returns String formateado (ej: "2.5 MB")
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene una especificación específica por su ID.
   * @param idProject ID del proyecto
   * @param idTender ID de la licitación
   * @param specificationId ID de la especificación
   * @returns Observable con la especificación o null si no existe
   */
  getSpecificationById(
    idProject: string, 
    idTender: string, 
    specificationId: string
  ): Observable<TenderSpecification | null> {
    const firestorePath = `projects/${idProject}/tenders/${idTender}/specifications`;
    return this.fs.listenOne<TenderSpecification>(firestorePath, specificationId);
  }

  /**
   * Elimina una especificación.
   * @param idProject ID del proyecto
   * @param idTender ID de la licitación
   * @param specificationId ID de la especificación
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   */
  async deleteSpecification(
    idProject: string, 
    idTender: string, 
    specificationId: string
  ): Promise<void> {
    const firestorePath = `projects/${idProject}/tenders/${idTender}/specifications`;
    return this.fs.delete(firestorePath, specificationId);
  }
}