import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '../../../../../core/services/translation.service';
import { 
  Tender, 
  TenderStatus, 
  TenderCurrency, 
  TenderModality,
  getTenderStatusLabel,
  getTenderCurrencyLabel
} from '../../index';
import { tenderModalityTypes } from '../../constants/tender-modality-types';
import { tenderTypes } from '../../../../../core/constants/tender-types';

@Component({
  selector: 'app-tender-card',
  templateUrl: './tender-card.component.html',
  styleUrls: ['./tender-card.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    TagModule, 
    ButtonModule, 
    DividerModule, 
    TranslateModule
  ]
})
export class TenderCardComponent {
  @Input() tender!: Tender;
  @Input() showProject: boolean = false; // Nueva propiedad para mostrar el proyecto
  @Input() projectId?: string; // ID del proyecto (opcional, se puede inferir del tender)

  private translationService = inject(TranslationService);
  
  lang = computed(() => this.translationService.currentLang());

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
  getModalityTranslationKey(modality: string | undefined): string {
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
   * Obtiene la etiqueta traducida para el tipo de licitación
   */
  getTypeTranslationKey(type: string | undefined): string {
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
   * Obtiene el icono para el estado
   */
  getStatusIcon(status: TenderStatus): string {
    switch (status) {
      case 'En Preparación':
        return 'fas fa-clock';
      case 'Fase de Consultas':
        return 'fas fa-question-circle';
      case 'Fase de Respuestas':
        return 'fas fa-reply';
      case 'Fase de Ofertas':
        return 'fas fa-paper-plane';
      case 'Espera de Apertura':
        return 'fas fa-hourglass-half';
      case 'Fase Solicitud de Aclaraciones':
        return 'fas fa-exclamation-triangle';
      case 'Fase Respuestas a Aclaraciones':
        return 'fas fa-info-circle';
      case 'Fase de Adjudicación':
        return 'fas fa-trophy';
      case 'Cerrada':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-circle';
    }
  }  /**
   * Obtiene el icono para el tipo de licitación
   */
  getTypeIcon(type: string): string {
    const normalized = this.normalizeString(type);
    switch (normalized) {
      case this.normalizeString('Equipamiento Médico y Mobiliario Clínico y No Clínico'):
        return 'fas fa-stethoscope';
      case this.normalizeString('Obra'):
        return 'fas fa-hard-hat';
      case this.normalizeString('Ingeniería'):
        return 'fas fa-drafting-compass';
      case this.normalizeString('Prestación de Servicios'):
        return 'fas fa-handshake';
      // Casos legacy para compatibilidad
      case this.normalizeString('Obras'):
        return 'fas fa-hard-hat';
      case this.normalizeString('Consultoría'):
        return 'fas fa-users';
      case this.normalizeString('Suministros'):
        return 'fas fa-boxes';
      case this.normalizeString('Servicios'):
        return 'fas fa-cogs';
      default:
        return 'fas fa-file-contract';
    }
  }
  /**
   * Obtiene el icono para la modalidad
   */
  getModalityIcon(modality: string | undefined): string {
    if (!modality) return 'fas fa-minus';
    
    const normalized = this.normalizeString(String(modality));
    switch (normalized) {
      case this.normalizeString('Suma Alzada'):
        return 'fas fa-calculator';
      case this.normalizeString('Precio Unitario'):
        return 'fas fa-list-ul';
      case this.normalizeString('No aplica'):
        return 'fas fa-minus';
      default:
        return 'fas fa-money-bill-wave';
    }
  }
  /**
   * Obtiene el icono para la moneda
   */
  getCurrencyIcon(currency: TenderCurrency): string {
    switch (currency) {
      case 'CLP':
        return 'fas fa-dollar-sign';
      case 'USD':
        return 'fas fa-dollar-sign';
      case 'EUR':
        return 'fas fa-euro-sign';
      case 'CNY':
        return 'fas fa-yen-sign';
      case 'UF':
      case 'UTM':
        return 'fas fa-chart-line';
      default:
        return 'fas fa-money-bill-wave';
    }
  }

  /**
   * Obtiene la ruta para ver los detalles del tender
   */
  getDetailRoute(): string[] {
    const projectIdToUse = this.projectId || this.tender.idProject || '';
    return ['/app/project', projectIdToUse, 'tender', this.tender.id];
  }

  /**
   * Normaliza un string: minúsculas, sin tildes, sin espacios
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }
}
