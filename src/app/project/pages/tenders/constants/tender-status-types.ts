import { TenderStatus } from '../models/tender-interface';

export const tenderStatusTypes: Array<{
  label: { es: string; en: string; zh: string };
  value: TenderStatus;
  severity: "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined;
}> = [
  {
    label: {
      es: 'En Preparación',
      en: 'In Preparation',
      zh: '准备中'
    },
    value: 'En Preparación',
    severity: 'secondary'
  },
  {
    label: {
      es: 'Fase de Consultas',
      en: 'Inquiry Phase',
      zh: '咨询阶段'
    },
    value: 'Fase de Consultas',
    severity: 'info'
  },
  {
    label: {
      es: 'Fase de Respuestas',
      en: 'Response Phase',
      zh: '回应阶段'
    },
    value: 'Fase de Respuestas',
    severity: 'info'
  },
  {
    label: {
      es: 'Fase de Ofertas',
      en: 'Bid Phase',
      zh: '投标阶段'
    },
    value: 'Fase de Ofertas',
    severity: 'warn'
  },
  {
    label: {
      es: 'Espera de Apertura',
      en: 'Awaiting Opening',
      zh: '等待开标'
    },
    value: 'Espera de Apertura',
    severity: 'warn'
  },
  {
    label: {
      es: 'Fase Solicitud de Aclaraciones',
      en: 'Clarification Request Phase',
      zh: '澄清请求阶段'
    },
    value: 'Fase Solicitud de Aclaraciones',
    severity: 'info'
  },
  {
    label: {
      es: 'Fase Respuestas a Aclaraciones',
      en: 'Clarification Response Phase',
      zh: '澄清回应阶段'
    },
    value: 'Fase Respuestas a Aclaraciones',
    severity: 'info'
  },
  {
    label: {
      es: 'Fase de Adjudicación',
      en: 'Award Phase',
      zh: '评标阶段'
    },
    value: 'Fase de Adjudicación',
    severity: 'success'
  },
  {
    label: {
      es: 'Cerrada',
      en: 'Closed',
      zh: '已关闭'
    },
    value: 'Cerrada',
    severity: 'danger'
  }
];
