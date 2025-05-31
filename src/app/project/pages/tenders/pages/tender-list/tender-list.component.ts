import { Component, OnInit, OnDestroy, inject, computed, signal, Signal, effect } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { 
  Tender, 
  TenderStatus, 
  TenderCurrency, 
  TenderModality,
  getTenderStatusLabel,
  getTenderCurrencyLabel,
  TenderCardComponent,
  NewTenderComponent
} from '../../index';
import { TenderService } from '../../services/tender.service';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '../../../../../core/services/translation.service';
import { tenderModalityTypes } from '../../constants/tender-modality-types';
import { tenderTypes } from '../../../../../core/constants/tender-types';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UserService } from '../../../../../auth/services/user.service';

@Component({
  selector: 'app-tender-list',
  templateUrl: './tender-list.component.html',
  styleUrls: ['./tender-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, TagModule, RouterModule, TranslateModule, ButtonModule, DividerModule, DropdownModule, MultiSelectModule, CardModule, ChipModule, ProgressSpinnerModule, TenderCardComponent, NewTenderComponent],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('50ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query(':leave', [
          stagger('30ms', [
            animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class TenderListComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public tenderService = inject(TenderService);
  private translationService = inject(TranslationService);
  private userService = inject(UserService);

  isSuperAdmin = computed(() => this.userService.isSuperAdmin());
  lang = computed(() => this.translationService.currentLang());
    // Signals para estado del componente
  private projectId = signal<string>('');
  selectedStatuses = signal<TenderStatus[]>([]);
  selectedModalities = signal<TenderModality[]>([]);
  selectedTypes = signal<string[]>([]);
  
  // Drawer visibility
  isNewTenderDrawerVisible = signal<boolean>(false);
  
  // Timing para el loading
  private showLoadingWithDelay = signal<boolean>(true);
  private loadingTimeout: any;

  // Agregar computed signal para verificar si los datos están listos
  isDataReady = computed(() => this.tenderService.isReady());

  // Computed property simplificado que usa el servicio directamente
  tenders = computed(() => {
    // Si el servicio no está listo, devolver array vacío
    if (!this.isDataReady()) {
      return [];
    }

    const statusFilters = this.selectedStatuses() || [];
    const typeFilters = this.selectedTypes() || [];
    const modalityFilters = this.selectedModalities() || [];
    
    // Obtener todos los tenders primero
    const allTenders = this.tenderService.getAllTenders();
    
    // Si no hay filtros, devolver todos
    if (statusFilters.length === 0 && typeFilters.length === 0 && modalityFilters.length === 0) {
      return allTenders;
    }
    
    // Aplicar filtros manualmente para mayor control
    let filteredTenders = allTenders;
    
    // Filtrar por estados
    if (statusFilters.length > 0) {
      filteredTenders = filteredTenders.filter(tender => statusFilters.includes(tender.tenderStatus));
    }
    
    // Filtrar por tipos
    if (typeFilters.length > 0) {
      filteredTenders = filteredTenders.filter(tender => typeFilters.includes(tender.tenderType));
    }
    
    // Filtrar por modalidades con comparación robusta
    if (modalityFilters.length > 0) {
      filteredTenders = filteredTenders.filter(tender => {
        if (!tender.tenderModality) {
          return false;
        }
        
        // Usar normalización para comparación robusta
        const normalizeString = (str: string): string => {
          return str.normalize('NFD')
                   .replace(/[\u0300-\u036f]/g, '')
                   .trim()
                   .toLowerCase()
                   .replace(/\s+/g, '');
        };
        
        const normalizedTenderModality = normalizeString(tender.tenderModality);
        const matchFound = modalityFilters.some(modality => {
          const normalizedFilterModality = normalizeString(modality);
          return normalizedFilterModality === normalizedTenderModality;
        });
        
        return matchFound;
      });
    }
    
    return filteredTenders;
  });

  // Options for filters
  statusOptions = computed(() => [
    'En Preparación', 'Fase de Consultas', 'Fase de Respuestas', 'Fase de Ofertas', 
    'Espera de Apertura', 'Fase Solicitud de Aclaraciones', 'Fase Respuestas a Aclaraciones',
    'Fase de Adjudicación', 'Cerrada'
  ].map(status => ({
    label: this.getStatusLabel(status as TenderStatus),
    value: status as TenderStatus
  })));  // Options for tender modalities - using dynamic translation with lang signal
  modalityOptions = computed(() => {
    const lang = this.lang();
    const options = tenderModalityTypes.map(modality => ({
      value: modality.value,
      label: modality.label[lang as keyof typeof modality.label]
    }));
    return options;
  });

  // Options for tender types - using dynamic translation with lang signal  
  typeOptions = computed(() => {
    const lang = this.lang();
    return tenderTypes.map(type => ({
      value: type.value,
      label: type.label[lang as keyof typeof type.label]
    }));
  });

  constructor() {
    // Agregar un effect para monitorear cambios en el projectId
    effect(() => {
      const currentProjectId = this.projectId();
      if (currentProjectId) {
        // Limpiar los filtros cuando cambia el proyecto
        this.clearFilters();
        // Forzar actualización del contexto cuando cambia el projectId
        this.tenderService.setProjectContext(currentProjectId);
      }
    });

    // Effect para manejar el timing del loading
    effect(() => {
      const isLoading = !this.isDataReady() || this.tenderService.loading();
      
      if (isLoading) {
        // Si está cargando, mostrar inmediatamente
        this.showLoadingWithDelay.set(true);
      } else {
        // Si terminó de cargar, agregar delay de 200ms
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
        }
        this.loadingTimeout = setTimeout(() => {
          this.showLoadingWithDelay.set(false);
        }, 200);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Cambiar a suscripción continua de los parámetros de ruta
    this.route.params.subscribe(params => {
      const id = params['id'];
      
      // Actualizar el signal del projectId
      this.projectId.set(id);
      
      // El effect se encargará de actualizar el contexto del servicio
    });
  }

  ngOnDestroy() {
    // Limpiar timeout si existe
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  /**
   * Obtiene la etiqueta traducida para un estado de tender
   */
  getStatusLabel(status: TenderStatus): string {
    return getTenderStatusLabel(status, this.lang());
  }

  /**
   * Obtiene la etiqueta traducida para una moneda de tender
   */
  getCurrencyLabel(currency: TenderCurrency): string {
    return getTenderCurrencyLabel(currency, this.lang());
  }
  /**
   * Obtiene la etiqueta traducida para una modalidad de tender
   */
  getModalityLabel(modality: TenderModality | undefined): string {
    if (!modality) {
      const lang = this.lang();
      const defaultModality = tenderModalityTypes.find(m => m.value === 'No aplica');
      return defaultModality ? defaultModality.label[lang as keyof typeof defaultModality.label] : 'No aplica';
    }
    
    const lang = this.lang();
    const normalized = this.normalizeString(String(modality));
    const found = tenderModalityTypes.find(m => this.normalizeString(String(m.value)) === normalized);
    
    if (found) {
      return found.label[lang as keyof typeof found.label];
    }
    
    // Fallback a la modalidad original si no se encuentra
    return String(modality);
  }
  /**
   * Obtiene la etiqueta traducida para un tipo de licitación
   */
  getTypeLabel(type: string | undefined): string {
    if (!type) {
      const lang = this.lang();
      const defaultType = tenderTypes.find(t => t.value === 'Prestación de Servicios');
      return defaultType ? defaultType.label[lang as keyof typeof defaultType.label] : type || '';
    }
    
    const lang = this.lang();
    const normalized = this.normalizeString(type);
    const found = tenderTypes.find(t => this.normalizeString(t.value) === normalized);
    
    if (found) {
      return found.label[lang as keyof typeof found.label];
    }
    
    // Fallback al tipo original si no se encuentra
    return type;
  }
  /**
   * Método directo para el HTML - sin computed property
   */
  getDisplayTenders(): Tender[] {
    const statusFilters = this.selectedStatuses() || [];
    const typeFilters = this.selectedTypes() || [];
    const modalityFilters = this.selectedModalities() || [];
    
    // Si no hay filtros, devolver todos
    if (statusFilters.length === 0 && typeFilters.length === 0 && modalityFilters.length === 0) {
      return this.tenderService.getAllTenders();
    }
    
    // Usar el método de filtros múltiples del servicio
    return this.tenderService.getTendersWithMultipleFilters(
      statusFilters.length > 0 ? statusFilters : undefined,
      typeFilters.length > 0 ? typeFilters : undefined,
      modalityFilters.length > 0 ? modalityFilters : undefined
    );
  }

  /**
   * Getter para que el HTML acceda a los tenders filtrados
   */
  get filteredTenders(): Tender[] {
    return this.tenders();
  }

  /**
   * Getter para que el HTML acceda a todos los tenders sin filtros
   */
  get allTenders(): Tender[] {
    return this.tenderService.getAllTenders();
  }

  /**
   * Método para obtener tenders con filtros específicos (para usar en HTML)
   */
  getTendersForDisplay(): Tender[] {
    return this.tenders();
  }

  /**
   * Obtiene tenders por estado específico (delegado al servicio)
   */
  getTendersByStatus(status: TenderStatus): Tender[] {
    return this.tenderService.getTenders(status);
  }

  /**
   * Obtiene tenders por tipo específico
   */
  getTendersByType(type: string): Tender[] {
    return this.tenderService.getTenders(undefined, type);
  }

  /**
   * Obtiene tenders por modalidad específica
   */
  getTendersByModality(modality: TenderModality): Tender[] {
    return this.tenderService.getTenders(undefined, undefined, modality);
  }

  /**
   * Obtiene tenders con filtros múltiples
   */
  getTendersWithFilters(status?: TenderStatus, type?: string, modality?: TenderModality): Tender[] {
    return this.tenderService.getTenders(status, type, modality);
  }

  /**
   * Obtiene un tender específico por ID (delegado al servicio)
   */
  getTenderById(id: string): Tender | undefined {
    return this.tenderService.getTenderById(id);
  }

  /**
   * Obtiene el ID del proyecto currente
   */
  getCurrentProjectId(): string {
    return this.projectId();
  }


  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.selectedStatuses.set([]);
    this.selectedModalities.set([]);
    this.selectedTypes.set([]);
  }


  /**
   * Normaliza un string: minúsculas, sin tildes, sin espacios
   */
  private normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
  }
  /**
   * Obtiene la etiqueta traducida para la modalidad, a partir del valor recibido de la BD
   */
  public getModalityTranslationKey(modality: string | undefined): string {
    if (!modality) {
      const lang = this.lang();
      const defaultModality = tenderModalityTypes.find(m => m.value === 'No aplica');
      return defaultModality ? defaultModality.label[lang as keyof typeof defaultModality.label] : 'No aplica';
    }
    
    const lang = this.lang();
    const normalized = this.normalizeString(String(modality));
    const found = tenderModalityTypes.find(m => this.normalizeString(String(m.value)) === normalized);
    return found ? found.label[lang as keyof typeof found.label] : String(modality);
  }

  /**
   * Obtiene la etiqueta traducida para el tipo de licitación, a partir del valor recibido de la BD
   */
  public getTypeTranslationKey(type: string | undefined): string {
    if (!type) {
      const lang = this.lang();
      const defaultType = tenderTypes.find(t => t.value === 'Prestación de Servicios');
      return defaultType ? defaultType.label[lang as keyof typeof defaultType.label] : 'Prestación de Servicios';
    }
    
    const lang = this.lang();
    const normalized = this.normalizeString(type);
    const found = tenderTypes.find(t => this.normalizeString(t.value) === normalized);
    return found ? found.label[lang as keyof typeof found.label] : type;
  }

  /**
   * Obtiene la longitud segura de selectedStatuses
   */
  getSelectedStatusesLength(): number {
    return this.selectedStatuses()?.length || 0;
  }

  /**
   * Obtiene la longitud segura de selectedModalities
   */
  getSelectedModalitiesLength(): number {
    return this.selectedModalities()?.length || 0;
  }

  /**
   * Obtiene la longitud segura de selectedTypes
   */
  getSelectedTypesLength(): number {
    return this.selectedTypes()?.length || 0;
  }  /**
   * Verifica si hay filtros activos
   */
  hasActiveFilters(): boolean {
    return this.getSelectedStatusesLength() > 0 || 
           this.getSelectedModalitiesLength() > 0 || 
           this.getSelectedTypesLength() > 0;
  }
  /**
   * Método para debug - actualizar modalidades seleccionadas
   */
  updateSelectedModalities(modalities: TenderModality[]): void {
    this.selectedModalities.set(modalities);
  }

  /**
   * Abre el drawer para crear una nueva licitación
   */
  openNewTenderDrawer(): void {
    this.isNewTenderDrawerVisible.set(true);
  }

  /**
   * Cierra el drawer de nueva licitación
   */
  closeNewTenderDrawer(): void {
    this.isNewTenderDrawerVisible.set(false);
  }  /**
   * Maneja la creación exitosa de una nueva licitación
   */
  onTenderCreated(): void {
    // El drawer se cerrará automáticamente desde el componente new-tender
    // Los datos se actualizarán automáticamente debido a la reactividad del servicio
  }

  /**
   * Modificar loading para incluir el estado de preparación y timing
   */
  loading(): boolean {
    return this.showLoadingWithDelay();
  }
}
