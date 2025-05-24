import { Timestamp } from "@angular/fire/firestore";

export interface Organization {
  id: string;
  name: string;
  tin?: string;               // NIT o CIF
  description?: string;             // descripción larga de la organización
  email?: string;
  phone?: string;
  website?: string;
  address: string;                 // dirección principal
  type: OrganizationType;
  projects: string[];
  active: boolean;
  deleted?: boolean;                // para borrado lógico
  createdAt: Timestamp;
  updatedAt: Timestamp;
  logoURL?: string;
  legalRepresentative?: string;     // nombre de representante legal
  usersCount: number; 
  catalogs?: Catalogo[];  // para almacenar los archivos subidos           
}

export interface Catalogo {
    id: string;
    name_es: string;
    name_en: string;
    name_zh: string;
    description_en?: string;
    description_es?: string;
    description_zh?: string;
    fileType: string;
    size: string; 
    url: string;              
}

export type OrganizationType = 
'DESIGN_ENGINEERING_CONSULTANT'  |
'MATERIALS_EQUIPMENT_SUPPLIER' |
'MEDICAL_EQUIPMENT_FURNITURE_SUPPLIER' |
'CONSTRUCTION_SUBCONTRACTOR' |
'CTAR' | 'MANDANTE' | 'LEGAL_ADVISOR'

export interface OrganizationForm
  extends Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'usersCount' | 'deleted'> {}
