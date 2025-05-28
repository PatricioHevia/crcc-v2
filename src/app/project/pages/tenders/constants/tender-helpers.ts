import { inject } from '@angular/core';
import { TranslationService } from '../../../../core/services/translation.service';
import { tenderStatusTypes } from './tender-status-types';
import { tenderCurrencyTypes } from './tender-currency-types';
import { tenderModalityTypes } from './tender-modality-types';
import { TenderStatus, TenderCurrency, TenderModality } from '../models/tender-interface';

/**
 * Funciones helper para obtener etiquetas traducidas de los campos de tender
 */

/**
 * Obtiene la etiqueta traducida para un estado de tender
 */
export function getTenderStatusLabel(status: TenderStatus, lang: 'es' | 'en' | 'zh'): string {
  const statusType = tenderStatusTypes.find(type => type.value === status);
  if (!statusType) return status;
  return statusType.label[lang] || statusType.label.es;
}

/**
 * Obtiene la etiqueta traducida para una moneda de tender
 */
export function getTenderCurrencyLabel(currency: TenderCurrency, lang: 'es' | 'en' | 'zh'): string {
  const currencyType = tenderCurrencyTypes.find(type => type.value === currency);
  if (!currencyType) return currency;
  return currencyType.label[lang] || currencyType.label.es;
}

/**
 * Obtiene la etiqueta traducida para una modalidad de tender usando el servicio de traducción
 */
export function getTenderModalityLabel(modality: TenderModality,  lang: 'es' | 'en' | 'zh'): string {
  const modalityType = tenderModalityTypes.find(type => type.value === modality);
  if (!modalityType) return modality; 
  return modalityType.label[lang] || modalityType.label.es;
 
}

/**
 * Obtiene todos los tipos de estado disponibles con sus etiquetas traducidas
 */
export function getTenderStatusOptions(lang: 'es' | 'en' | 'zh') {
  return tenderStatusTypes.map(type => ({
    value: type.value,
    label: type.label[lang] || type.label.es
  }));
}

/**
 * Obtiene todos los tipos de moneda disponibles con sus etiquetas traducidas
 */
export function getTenderCurrencyOptions(lang: 'es' | 'en' | 'zh') {
  return tenderCurrencyTypes.map(type => ({
    value: type.value,
    label: type.label[lang] || type.label.es
  }));
}

/**
 * Obtiene todos los tipos de modalidad disponibles con sus etiquetas traducidas
 */
export function getTenderModalityOptions(translationService: TranslationService) {
  return tenderModalityTypes.map(type => ({
    value: type.value,
    label: translationService.instant(type.translationKey)
  }));
}
