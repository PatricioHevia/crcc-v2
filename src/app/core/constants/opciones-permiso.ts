import { PermissionType } from "../../auth/models/account-interface";


export const permissionTypes: {
    label: { es: string; en: string; zh: string };
    value: PermissionType;
  }[] = [
  {
    value: 'LICITACIONES_EQM',
    label: {
      es: 'Licitaciones EQM (Equipos Médicos)',
      en: 'Medical Equipment Tenders (EQM)',
      zh: '医疗设备招标 (EQM)'
    }
  },
  {
    value: 'LICITACIONES_OBRAS_SERVICIOS',
    label: {
      es: 'Licitaciones de Obras y Servicios',
      en: 'Works and Services Tenders',
      zh: '工程与服务招标'
    }
  },
  {
    value: 'CONTROL_INVENTARIO',
    label: {
      es: 'Control de Inventario',
      en: 'Inventory Control',
      zh: '库存控制'
    }
  },
  {
    value: 'FLUJOS_APROBACION',
    label: {
      es: 'Flujos de Aprobación',
      en: 'Approval Workflows',
      zh: '审批流程'
    }
  },
  {
    value: 'CONCURSOS',
    label: {
      es: 'Concursos',
      en: 'Contests/Competitions', // "Competitions" o "Bids" dependiendo del contexto exacto
      zh: '竞赛/招标'
    }
  },
  {
    value: 'CONTACTO', // Podría referirse a la gestión de contactos o a la sección de contacto
    label: {
      es: 'Contacto',
      en: 'Contact Management', // O "Contact Section"
      zh: '联系人管理' // 或 "联系部分"
    }
  },
  {
    value: 'DOCUMENTOS', // Gestión documental
    label: {
      es: 'Documentos',
      en: 'Document Management',
      zh: '文件管理'
    }
  }
];