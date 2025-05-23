import { Timestamp } from '@angular/fire/firestore'; // Para fechas de creación/actualización

// Roles específicos dentro de una oficina para el sistema de inventario/solicitudes
export type OfficeMemberRole = 
  | 'approver_level_1'    // Aprobador de nivel 1
  | 'approver_level_2'    // Aprobador de nivel 2
  | 'deliverer'           // Persona que entrega/despacha materiales
  | 'inventory_manager';  // Encargado de gestionar el stock de esta oficina

export interface OfficeMember {
  userId: string;          
  roles: OfficeMemberRole[]; 
}

export interface Office {
  id: string;               
  name_es: string;              
  name_en: string;              
  name_zh: string;
  members?: OfficeMember[];

  // Campos de Auditoría
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OfficeForm 
  extends Omit<Office,  'id' | 'createdAt' | 'updatedAt' | 'members' | 'name_es' | 'name_en' | 'name_zh'> {
    name: string; // Nombre de la oficina
}