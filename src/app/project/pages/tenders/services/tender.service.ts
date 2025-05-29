import { effect, inject, Injectable, signal, Signal, OnDestroy } from '@angular/core';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { Tender, TenderStatus, TenderModality } from '../models/tender-interface';
import { orderBy, QueryConstraint, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class TenderService implements OnDestroy {  private readonly fs = inject(FirestoreService);

  private currentProjectId = signal<string | undefined>(undefined);

  public tenderListener: { data: Signal<Tender[]>; loading: Signal<boolean>; unsubscribe: () => void } | null = null;
  
  // Listener separado para el landing que siempre usa collection group
  public landingTenderListener: { data: Signal<Tender[]>; loading: Signal<boolean>; unsubscribe: () => void } | null = null;

  

  constructor() {

    effect(() => {
      const projectId = this.currentProjectId();
      this._initializeTenderListener(projectId);
    });
  }

  /**
   * Inicializa o actualiza el listener de licitaciones basado en el projectId.
   */
  private _initializeTenderListener(projectId?: string): void {
    // Limpiar listener anterior si existe
    if (this.tenderListener) {
      this.tenderListener.unsubscribe();
      this.tenderListener = null;
    }

    const constraints: QueryConstraint[] = [
      orderBy('name') // Ordena las licitaciones por nombre, ajusta según necesites
    ];    if (projectId) {
      const path = `projects/${projectId}/tenders`;
      this.tenderListener = this.fs.listenCollectionWithLoading<Tender>(path, constraints);
    } else {
      // Para obtener tenders de todos los proyectos usando collection group
      this.tenderListener = this.fs.listenCollectionGroupWithLoading<Tender>('tenders', constraints);
    }
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

  tenders(): Tender[] {
    if (!this.tenderListener) {
      // Esta lógica de inicialización aquí es una salvaguarda, pero el `effect` es el principal responsable.
      // Considera si esta inicialización ad-hoc es realmente necesaria o si puede causar problemas de timing.
      this._initializeTenderListener(this.currentProjectId());
      console.warn('TenderService: Licitaciones accedidas antes de que el listener estuviera completamente listo por el effect, inicializando ad-hoc...');
    }
    // `this.tenderListener` es reactualizado por el `effect`, así que siempre debería
    // tener el listener correcto para el `currentProjectId` actual.
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
      console.warn('TenderService: Landing tenders listener no estaba inicializado, inicializando ahora...');
    }
    return this.landingTenderListener ? this.landingTenderListener.data() : [];
  }

  /**
   * Obtiene el estado de carga para el landing
   */
  getLandingTendersLoading(): boolean {
    return this.landingTenderListener?.loading() ?? true;
  }
}
