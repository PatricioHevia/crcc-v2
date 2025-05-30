import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface DownloadItem {
  url: string;
  filename?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MultidownloadService {

  constructor(private http: HttpClient) { }

  /**
   * Descarga múltiples archivos y los comprime en un ZIP
   * @param items Array de URLs o objetos con URL y nombre de archivo
   * @param zipFilename Nombre del archivo ZIP resultante
   */
  downloadAndZip(items: (string | DownloadItem)[], zipFilename: string = 'archivos.zip'): Observable<void> {
    const downloadItems = this.normalizeItems(items);
    
    return forkJoin(
      downloadItems.map(item => this.downloadFile(item))
    ).pipe(
      switchMap(files => this.createZip(files, zipFilename))
    );
  }

  /**
   * Descarga múltiples archivos con progreso
   * @param items Array de URLs o objetos con URL y nombre de archivo
   * @param zipFilename Nombre del archivo ZIP resultante
   * @param onProgress Callback para el progreso
   */
  downloadAndZipWithProgress(
    items: (string | DownloadItem)[],
    zipFilename: string = 'archivos.zip',
    onProgress?: (progress: number) => void
  ): Observable<void> {
    const downloadItems = this.normalizeItems(items);
    let downloadedCount = 0;
    
    return forkJoin(
      downloadItems.map(item => 
        this.downloadFile(item).pipe(
          map(file => {
            downloadedCount++;
            if (onProgress) {
              onProgress((downloadedCount / downloadItems.length) * 100);
            }
            return file;
          })
        )
      )
    ).pipe(
      switchMap(files => this.createZip(files, zipFilename))
    );
  }

  /**
   * Normaliza los items de entrada a DownloadItem
   */
  private normalizeItems(items: (string | DownloadItem)[]): DownloadItem[] {
    return items.map((item, index) => {
      if (typeof item === 'string') {
        return {
          url: item,
          filename: this.getFilenameFromUrl(item) || `archivo_${index + 1}`
        };
      }
      return {
        ...item,
        filename: item.filename || this.getFilenameFromUrl(item.url) || `archivo_${index + 1}`
      };
    });
  }

  /**
   * Descarga un archivo individual
   */
  private downloadFile(item: DownloadItem): Observable<{ filename: string; data: Blob }> {
    return this.http.get(item.url, { responseType: 'blob' }).pipe(
      map(blob => ({
        filename: item.filename!,
        data: blob
      }))
    );
  }

  /**
   * Crea un archivo ZIP con los archivos descargados
   */
  private createZip(files: { filename: string; data: Blob }[], zipFilename: string): Observable<void> {
    return from(this.generateZip(files, zipFilename));
  }

  /**
   * Genera el archivo ZIP y lo guarda
   */
  private async generateZip(files: { filename: string; data: Blob }[], zipFilename: string): Promise<void> {
    const zip = new JSZip();
    
    // Agregar cada archivo al ZIP
    for (const file of files) {
      zip.file(file.filename, file.data);
    }
    
    // Generar el ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Guardar el archivo
    saveAs(content, zipFilename);
  }

  /**
   * Extrae el nombre del archivo de una URL
   */
  private getFilenameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      return filename || null;
    } catch {
      return null;
    }
  }

  /**
   * Descarga archivos con opciones avanzadas de compresión
   */
  downloadAndZipAdvanced(
    items: (string | DownloadItem)[],
    options: {
      zipFilename?: string;
      compressionLevel?: number;
      onProgress?: (progress: number) => void;
      onFileDownloaded?: (filename: string) => void;
    } = {}
  ): Observable<void> {
    const {
      zipFilename = 'archivos.zip',
      compressionLevel = 6,
      onProgress,
      onFileDownloaded
    } = options;

    const downloadItems = this.normalizeItems(items);
    let downloadedCount = 0;
    
    return forkJoin(
      downloadItems.map(item => 
        this.downloadFile(item).pipe(
          map(file => {
            downloadedCount++;
            if (onProgress) {
              onProgress((downloadedCount / downloadItems.length) * 100);
            }
            if (onFileDownloaded) {
              onFileDownloaded(file.filename);
            }
            return file;
          })
        )
      )
    ).pipe(
      switchMap(files => from(this.generateZipAdvanced(files, zipFilename, compressionLevel)))
    );
  }

  /**
   * Genera ZIP con opciones avanzadas
   */
  private async generateZipAdvanced(
    files: { filename: string; data: Blob }[],
    zipFilename: string,
    compressionLevel: number
  ): Promise<void> {
    const zip = new JSZip();
    
    for (const file of files) {
      zip.file(file.filename, file.data, {
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel }
      });
    }
    
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: compressionLevel }
    });
    
    saveAs(content, zipFilename);
  }
}
