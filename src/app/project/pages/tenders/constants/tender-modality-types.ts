import { Tender } from '../models/tender-interface';

// Extraer el tipo de modalidad de la interfaz Tender
export type TenderModality = Tender['tenderModality'];

export const tenderModalityTypes: {
    label: { es: string; en: string; zh: string };
    value: TenderModality;
    translationKey: string;
  }[] = [  {
    value: 'Suma Alzada',
    translationKey: 'TENDER_MODALITY.LUMP_SUM',
    label: {
      es: 'Suma Alzada',
      en: 'Lump Sum',
      zh: '总价合同'
    }
  },
  {
    value: 'Precio Unitario',
    translationKey: 'TENDER_MODALITY.UNIT_PRICE',
    label: {
      es: 'Precio Unitario',
      en: 'Unit Price',
      zh: '单价合同'
    }
  },
  {
    value: 'No aplica',
    translationKey: 'TENDER_MODALITY.NOT_APPLICABLE',
    label: {
      es: 'No Aplica',
      en: 'Not Applicable',
      zh: '不适用'
    }
  }
];
