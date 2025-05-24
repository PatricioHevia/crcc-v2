import { OrganizationType } from "../../auth/models/organization-interface";

export const orgTypes:{
    label: { es: string; en: string; zh: string };
    value: OrganizationType;
  }[] = [
  {
    value: 'DESIGN_ENGINEERING_CONSULTANT',
    label: {
      es: 'Consultor de Diseño e Ingenierías',
      en: 'Design and Engineering Consultant',
      zh: '设计和工程顾问'
    }
  },
  {
    value: 'MATERIALS_EQUIPMENT_SUPPLIER',
    label: {
      es: 'Proveedor de Materiales o Equipos',
      en: 'Materials or Equipment Supplier',
      zh: '材料或设备供应商'
    }
  },
  {
    value: 'MEDICAL_EQUIPMENT_FURNITURE_SUPPLIER',
    label: {
      es: 'Proveedor de Equipamiento Médico y Mobiliario',
      en: 'Medical Equipment and Furniture Supplier',
      zh: '医疗设备和家具供应商'
    }
  },
  {
    value: 'CONSTRUCTION_SUBCONTRACTOR',
    label: {
      es: 'Subcontratista de Obra',
      en: 'Construction Subcontractor',
      zh: '建筑分包商'
    }
  },
  {
    value: 'CTAR',
    label: {
      es: 'CTAR',
      en: 'CTAR',
      zh: 'CTAR'
    }
  },
  {
    value: 'LEGAL_ADVISOR',
    label: {
      es: 'Asesor Legal',
      en: 'Legal Advisor',
      zh: '法律顾问'
    }
  },
];