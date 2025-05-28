import { TranslationService } from '../services/translation.service';

export const tenderTypes: {
    label: { es: string; en: string; zh: string };
    value: string;
    translationKey: string;
  }[] = [
  {
    value: 'Equipamiento Médico y Mobiliario Clínico y No Clínico',
    translationKey: 'TENDER_TYPES.MEDICAL_EQUIPMENT',
    label: {
      es: 'Equipamiento Médico y Mobiliario Clínico y No Clínico',
      en: 'Medical Equipment and Clinical and Non-Clinical Furniture',
      zh: '医疗设备和临床及非临床家具'
    }
  },
  {
    value: 'Obra',
    translationKey: 'TENDER_TYPES.CONSTRUCTION_WORK',
    label: {
      es: 'Obra',
      en: 'Construction Work',
      zh: '建筑工程'
    }
  },
  {
    value: 'Ingeniería',
    translationKey: 'TENDER_TYPES.ENGINEERING',
    label: {
      es: 'Ingeniería',
      en: 'Engineering',
      zh: '工程设计'
    }
  },
  {
    value: 'Prestación de Servicios',
    translationKey: 'TENDER_TYPES.SERVICE_PROVISION',
    label: {
      es: 'Prestación de Servicios',
      en: 'Service Provision',
      zh: '服务提供'
    }
  }
];

/**
 * Obtiene la etiqueta traducida para un tipo de licitación usando el servicio de traducción
 * @param type - El tipo de licitación
 * @param translationService - El servicio de traducción
 * @returns La etiqueta traducida o el tipo original si no se encuentra
 */
export function getTenderTypeLabel(type: string, translationService: TranslationService): string {
  const tenderType = tenderTypes.find(t => t.value === type);
  
  if (tenderType) {
    return translationService.instant(tenderType.translationKey);
  }
  
  return type;
}

/**
 * Obtiene todos los tipos de tender disponibles con sus etiquetas traducidas
 */
export function getTenderTypeOptions(translationService: TranslationService) {
  return tenderTypes.map(type => ({
    value: type.value,
    label: translationService.instant(type.translationKey)
  }));
}
