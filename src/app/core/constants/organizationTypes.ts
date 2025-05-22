import { OrganizationType } from "../../auth/models/organization-interface";

export const orgTypes:{
    label: { es: string; en: string; zh: string };
    value: OrganizationType;
  }[] = [
  {
    value: 'Consultor de Diseño e Ingenierías',
    label: {
      es: 'Consultor de Diseño e Ingenierías',
      en: 'Design and Engineering Consultant',
      zh: '设计和工程顾问'
    }
  },
  {
    value: 'Proveedor de Materiales o Equipos',
    label: {
      es: 'Proveedor de Materiales o Equipos',
      en: 'Materials or Equipment Supplier',
      zh: '材料或设备供应商'
    }
  },
  {
    value: 'Proveedor de Equipamiento Médico y Mobiliario',
    label: {
      es: 'Proveedor de Equipamiento Médico y Mobiliario',
      en: 'Medical Equipment and Furniture Supplier',
      zh: '医疗设备和家具供应商'
    }
  },
  {
    value: 'Subcontratista de Obra',
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
  }
];