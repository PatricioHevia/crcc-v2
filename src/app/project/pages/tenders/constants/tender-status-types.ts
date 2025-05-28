import { TenderStatus } from '../models/tender-interface';

export const tenderStatusTypes: {
    label: { es: string; en: string; zh: string };
    value: TenderStatus;
  }[] = [
  {
    value: 'En Preparación',
    label: {
      es: 'En Preparación',
      en: 'In Preparation',
      zh: '准备中'
    }
  },
  {
    value: 'Fase de Consultas',
    label: {
      es: 'Fase de Consultas',
      en: 'Inquiry Phase',
      zh: '咨询阶段'
    }
  },
  {
    value: 'Fase de Respuestas',
    label: {
      es: 'Fase de Respuestas',
      en: 'Response Phase',
      zh: '回应阶段'
    }
  },
  {
    value: 'Fase de Ofertas',
    label: {
      es: 'Fase de Ofertas',
      en: 'Bid Phase',
      zh: '投标阶段'
    }
  },
  {
    value: 'Espera de Apertura',
    label: {
      es: 'Espera de Apertura',
      en: 'Awaiting Opening',
      zh: '等待开标'
    }
  },
  {
    value: 'Fase Solicitud de Aclaraciones',
    label: {
      es: 'Fase Solicitud de Aclaraciones',
      en: 'Clarification Request Phase',
      zh: '澄清请求阶段'
    }
  },
  {
    value: 'Fase Respuestas a Aclaraciones',
    label: {
      es: 'Fase Respuestas a Aclaraciones',
      en: 'Clarification Response Phase',
      zh: '澄清回应阶段'
    }
  },
  {
    value: 'Fase de Adjudicación',
    label: {
      es: 'Fase de Adjudicación',
      en: 'Award Phase',
      zh: '评标阶段'
    }
  },
  {
    value: 'Cerrada',
    label: {
      es: 'Cerrada',
      en: 'Closed',
      zh: '已关闭'
    }
  }
];
