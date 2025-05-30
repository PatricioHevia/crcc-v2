import { effect, inject, Injectable, signal, Signal, OnDestroy } from '@angular/core';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { Tender, TenderStatus, TenderModality } from '../models/tender-interface';
import { orderBy, QueryConstraint, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { StorageService } from '../../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class TenderService implements OnDestroy {
  private readonly fs = inject(FirestoreService);
  private readonly storageService = inject(StorageService);

  private currentProjectId = signal<string | undefined>(undefined);
  private isListenerReady = signal<boolean>(false);

  public tenderListener: { data: Signal<Tender[]>; loading: Signal<boolean>; unsubscribe: () => void } | null = null;
  
  // Listener separado para el landing que siempre usa collection group
  public landingTenderListener: { data: Signal<Tender[]>; loading: Signal<boolean>; unsubscribe: () => void } | null = null;

  

  constructor() {

    effect(() => {
      const projectId = this.currentProjectId();
      this._initializeTenderListener(projectId);
    });
  }

  public setProjectContext(projectId: string): void {
    if (this.currentProjectId() !== projectId) {
      this.currentProjectId.set(projectId);
    }
  }

  public setAllProjectsContext(): void {
    if (this.currentProjectId() !== undefined) {
      this.currentProjectId.set(undefined);
    }
  }

  /**
   * Inicializa o actualiza el listener de licitaciones basado en el projectId.
   */
  private _initializeTenderListener(projectId?: string): void {
    // Marcar como no listo mientras se inicializa
    this.isListenerReady.set(false);
    
    // Limpiar listener anterior si existe
    if (this.tenderListener) {
      this.tenderListener.unsubscribe();
      this.tenderListener = null;
    }

    const constraints: QueryConstraint[] = [
      orderBy('name')
    ];
    
    if (projectId) {
      const path = `projects/${projectId}/tenders`;
      this.tenderListener = this.fs.listenCollectionWithLoading<Tender>(path, constraints);
    } else {
      this.tenderListener = this.fs.listenCollectionGroupWithLoading<Tender>('tenders', constraints);
    }
    
    // Marcar como listo después de un pequeño delay para asegurar que el listener esté completamente inicializado
    setTimeout(() => {
      this.isListenerReady.set(true);
    }, 100);
  }

  tenders(): Tender[] {
    // Si el listener no está listo, devolver array vacío para evitar errores de cambio de expresión
    if (!this.isListenerReady()) {
      return [];
    }
    
    if (!this.tenderListener) {
      this._initializeTenderListener(this.currentProjectId());
      return [];
    }
    
    return this.tenderListener ? this.tenderListener.data() : [];
  }

  /**
   * Obtiene todas las licitaciones sin filtros
   */
  getAllTenders(): Tender[] {
    return this.tenders();
  }

  /**
   * Obtiene licitaciones filtradas por arrays de estado, tipo y modalidad
   * Si algún array es vacío, no se aplica ese filtro
   */
  getTendersWithMultipleFilters(
    statuses?: TenderStatus[], 
    types?: string[], 
    modalities?: TenderModality[]
  ): Tender[] {
    let filteredTenders = this.tenders();

    if (statuses && statuses.length > 0) {
      filteredTenders = filteredTenders.filter(tender => statuses.includes(tender.tenderStatus));
    }

    if (types && types.length > 0) {
      filteredTenders = filteredTenders.filter(tender => types.includes(tender.tenderType));
    }

    if (modalities && modalities.length > 0) {
      filteredTenders = filteredTenders.filter(tender => 
        tender.tenderModality && modalities.includes(tender.tenderModality)
      );
    }

    return filteredTenders;
  }

  /**
   * Obtiene licitaciones filtradas por estado, tipo y modalidad
   * Si algún parámetro es vacío o undefined, no se aplica ese filtro
   */
  getTenders(status?: TenderStatus, type?: string, modality?: TenderModality): Tender[] {
    let filteredTenders = this.tenders();

    if (status) {
      filteredTenders = filteredTenders.filter(tender => tender.tenderStatus === status);
    }

    if (type) {
      filteredTenders = filteredTenders.filter(tender => tender.tenderType === type);
    }

    if (modality) {
      filteredTenders = filteredTenders.filter(tender => tender.tenderModality === modality);
    }

    return filteredTenders;
  }

  /**
   * Obtiene una licitación específica por ID
   */
  getTenderById(id: string): Tender | undefined {
    return this.tenders().find(tender => tender.id === id);
  }
  /**
   * Obtiene el contexto actual del proyecto
   */
  getCurrentProjectId(): string | undefined {
    return this.currentProjectId();
  }

  // Cambia la señal computada por un método como en OrganizationService
  loading(): boolean {
    return this.tenderListener?.loading() ?? true;
  }
  ngOnDestroy(): void {
    if (this.tenderListener) {
      this.tenderListener.unsubscribe();
      this.tenderListener = null;
    }
    if (this.landingTenderListener) {
      this.landingTenderListener.unsubscribe();
      this.landingTenderListener = null;
    }
  }

  /**
   * Inicializa el listener específico para el landing con filtro de fases activas
   * Este método usa collection group y filtra directamente en Firestore las fases activas
   */
  public initializeLandingTendersListener(): void {
    // Limpiar listener anterior si existe
    if (this.landingTenderListener) {
      this.landingTenderListener.unsubscribe();
      this.landingTenderListener = null;
    }

    // Filtrar solo las fases activas directamente en Firestore
    const constraints: QueryConstraint[] = [
      where('tenderStatus', 'in', ['Fase de Consultas', 'Fase de Respuestas', 'Fase de Ofertas']),
      orderBy('name')
    ];

    // Usar collection group para obtener tenders de todos los proyectos
    this.landingTenderListener = this.fs.listenCollectionGroupWithLoading<Tender>('tenders', constraints);
  }

  /**
   * Obtiene las licitaciones activas para el landing (ya filtradas)
   */
  getActiveTendersForLanding(): Tender[] {
    if (!this.landingTenderListener) {
      this.initializeLandingTendersListener();
    }
    return this.landingTenderListener ? this.landingTenderListener.data() : [];
  }

  /**
   * Obtiene el estado de carga para el landing
   */
  getLandingTendersLoading(): boolean {
    return this.landingTenderListener?.loading() ?? true;
  }
  /**
   * Crea una nueva licitación
   */
  createTender(tenderData: Partial<Tender>): Observable<any> {
    const projectId = this.currentProjectId();
    
    if (!projectId) {
      const error = new Error('No se ha establecido el contexto del proyecto');
      throw error;
    }
    
    const path = `projects/${projectId}/tenders`;
    
    return new Observable(observer => {
      try {
        this.fs.create(path, tenderData)
          .then(result => {
            observer.next(result);
            observer.complete();
          })
          .catch(error => {
            observer.error(error);
          });
      } catch (syncError) {
        observer.error(syncError);
      }
    });
  }

  /**
   * Actualiza una licitación existente
   */
  updateTender(tenderId: string, tenderData: Partial<Tender>): Observable<any> {
    const projectId = this.currentProjectId();
    if (!projectId) {
      throw new Error('No se ha establecido el contexto del proyecto');
    }
    
    const path = `projects/${projectId}/tenders`;
    return new Observable(observer => {
      this.fs.update(path, tenderId, tenderData).then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Elimina una licitación
   */
  deleteTender(tenderId: string): Observable<any> {
    const projectId = this.currentProjectId();
    if (!projectId) {
      throw new Error('No se ha establecido el contexto del proyecto');
    }
    
    const path = `projects/${projectId}/tenders`;
    return new Observable(observer => {
      this.fs.delete(path, tenderId).then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Sube y actualiza la imagen del banner de una licitación
   */
  async updateTenderBannerImage(tenderId: string, file: File): Promise<string> {
    const projectId = this.currentProjectId();
    if (!projectId) throw new Error('No se ha establecido el contexto del proyecto');
    const path = `projects/${projectId}/tenders/${tenderId}/banner/${Date.now()}_${file.name}`;
    const uploadTask = this.storageService.uploadFile(file, path);
    const imageUrl = await uploadTask.downloadURL$.toPromise();
    if (!imageUrl) throw new Error('No se pudo obtener la URL de la imagen subida');
    await this.fs.update(`projects/${projectId}/tenders`, tenderId, { imageUrl });
    return imageUrl;
  }

  // Método para verificar si el listener está listo
  isReady(): boolean {
    return this.isListenerReady();
  }
}
