import { Component, OnInit, OnDestroy, inject, computed, signal, Signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  Tender, 
  TenderStatus, 
  TenderCurrency, 
  TenderModality,
  getTenderStatusLabel,
  getTenderCurrencyLabel,
  getTenderModalityLabel,
  getTenderModalityOptions
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

@Component({
  selector: 'app-tender-list',
  templateUrl: './tender-list.component.html',
  styleUrls: ['./tender-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, TagModule, RouterModule, TranslateModule, ButtonModule, DividerModule, DropdownModule, MultiSelectModule, CardModule, ChipModule]
})
export class TenderListComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public tenderService = inject(TenderService);
  private translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());
  
  // Signals para estado del componente
  private projectId = signal<string>('');
  
  selectedStatuses = signal<TenderStatus[]>([]);
  selectedModalities = signal<TenderModality[]>([]);
  selectedTypes = signal<string[]>([]);
  
  // Computed property simplificado que usa el servicio directamente
  tenders = computed(() => {
    const statusFilters = this.selectedStatuses();
    const typeFilters = this.selectedTypes();
    const modalityFilters = this.selectedModalities();
    
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
  });

  // Options for filters
  statusOptions = computed(() => [
    'En Preparación', 'Fase de Consultas', 'Fase de Respuestas', 'Fase de Ofertas', 
    'Espera de Apertura', 'Fase Solicitud de Aclaraciones', 'Fase Respuestas a Aclaraciones',
    'Fase de Adjudicación', 'Cerrada'
  ].map(status => ({
    label: this.getStatusLabel(status as TenderStatus),
    value: status as TenderStatus
  })));

  // Options for tender modalities - using helper function with translation service  
  modalityOptions = computed(() => {
    return getTenderModalityOptions(this.translationService);
  });

  // Options for tender types - using imported constants with translation service
  typeOptions = computed(() => {
    // Devuelve las opciones usando los valores y claves de traducción
    return tenderTypes.map(type => ({
      value: type.value,
      label: this.translationService.instant(type.translationKey)
    }));
  });

  constructor() { }

  ngOnInit() {
    // Obtener el projectId de la ruta
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.projectId.set(id);
      // Configurar el contexto del proyecto en el servicio
      this.tenderService.setProjectContext(id);
    });
  }

  ngOnDestroy() {
    // El TenderService maneja su propia limpieza, pero podríamos resetear el contexto
    // this.tenderService.setAllProjectsContext();
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
    if (!modality) return this.translationService.instant('TENDER_MODALITY.NOT_APPLICABLE');
    return getTenderModalityLabel(modality, this.lang());
  }

  /**
   * Obtiene la etiqueta traducida para un tipo de licitación
   */
  getTypeLabel(type: string | undefined): string {
    if (!type) return this.translationService.instant('TENDER_TYPES.SERVICE_PROVISION');
    const normalized = this.normalizeString(type);
    const found = tenderTypes.find(t => this.normalizeString(t.value) === normalized);
    return found ? this.translationService.instant(found.translationKey) : this.translationService.instant('TENDER_TYPES.SERVICE_PROVISION');
  }

  /**
   * Método directo para el HTML - sin computed property
   */
  getDisplayTenders(): Tender[] {
    const statusFilters = this.selectedStatuses();
    const typeFilters = this.selectedTypes();
    const modalityFilters = this.selectedModalities();
    
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
   * Obtiene el ID del proyecto actual
   */
  getCurrentProjectId(): string {
    return this.projectId();
  }

  /**
   * Obtiene el severity del tag basado en el estado
   */
  getTagSeverity(status: TenderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'En Preparación':
        return 'secondary';
      case 'Fase de Consultas':
      case 'Fase de Respuestas':
        return 'info';
      case 'Fase de Ofertas':
      case 'Espera de Apertura':
        return 'warn';
      case 'Fase Solicitud de Aclaraciones':
      case 'Fase Respuestas a Aclaraciones':
        return 'info';
      case 'Fase de Adjudicación':
        return 'success';
      case 'Cerrada':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Obtiene el icono basado en el estado
   */
  getStatusIcon(status: TenderStatus): string {
    switch (status) {
      case 'En Preparación':
        return 'pi pi-cog';
      case 'Fase de Consultas':
        return 'pi pi-comments';
      case 'Fase de Respuestas':
        return 'pi pi-reply';
      case 'Fase de Ofertas':
        return 'pi pi-send';
      case 'Espera de Apertura':
        return 'pi pi-clock';
      case 'Fase Solicitud de Aclaraciones':
        return 'pi pi-question-circle';
      case 'Fase Respuestas a Aclaraciones':
        return 'pi pi-info-circle';
      case 'Fase de Adjudicación':
        return 'pi pi-check-circle';
      case 'Cerrada':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-circle';
    }
  }

  /**
   * Obtiene el icono para la modalidad
   */
  getModalityIcon(modality: TenderModality | undefined): string {
    switch (modality) {
      case 'Suma alzada':
        return 'pi pi-calculator';
      case 'Precio unitario':
        return 'pi pi-list';
      case 'No aplica':
        return 'pi pi-minus';
      default:
        return 'pi pi-question';
    }
  }

  /**
   * Obtiene el icono para la moneda
   */
  getCurrencyIcon(currency: TenderCurrency): string {
    switch (currency) {
      case 'CLP':
      case 'USD':
      case 'EUR':
        return 'pi pi-dollar';
      case 'UF':
      case 'UTM':
        return 'pi pi-chart-line';
      case 'CNY':
        return 'pi pi-money-bill';
      default:
        return 'pi pi-dollar';
    }
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
   * Obtiene el icono para el tipo de licitación
   */
  getTypeIcon(type: string): string {
    const typeLC = type.toLowerCase();
    if (typeLC.includes('obra') || typeLC.includes('construcción') || typeLC.includes('infraestructura')) {
      return 'pi pi-home';
    } else if (typeLC.includes('médico') || typeLC.includes('salud') || typeLC.includes('hospital')) {
      return 'pi pi-heart';
    } else if (typeLC.includes('equipo') || typeLC.includes('maquinaria') || typeLC.includes('tecnología')) {
      return 'pi pi-cog';
    } else if (typeLC.includes('servicio') || typeLC.includes('consultoría')) {
      return 'pi pi-briefcase';
    } else if (typeLC.includes('suministro') || typeLC.includes('material')) {
      return 'pi pi-box';
    } else {
      return 'pi pi-file';
    }
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
   * Obtiene la clave de traducción para la modalidad, a partir del valor recibido de la BD
   */
  public getModalityTranslationKey(modality: string | undefined): string {
    if (!modality) return 'TENDER_MODALITY.NOT_APPLICABLE';
    const normalized = this.normalizeString(String(modality));
    const found = tenderModalityTypes.find(m => this.normalizeString(String(m.value)) === normalized);
    return found ? found.translationKey : 'TENDER_MODALITY.NOT_APPLICABLE';
  }

  /**
   * Obtiene la clave de traducción para el tipo de licitación, a partir del valor recibido de la BD
   */
  public getTypeTranslationKey(type: string | undefined): string {
    if (!type) return 'TENDER_TYPES.SERVICE_PROVISION'; // fallback
    const normalized = this.normalizeString(type);
    const found = tenderTypes.find(t => this.normalizeString(t.value) === normalized);
    return found ? found.translationKey : 'TENDER_TYPES.SERVICE_PROVISION';
  }
}
