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
  name: string; // Nombre de la oficina - campo computado para mostrar según idioma actual
  name_es: string; // Nombre en español
  name_en: string; // Nombre en inglés
  name_zh: string; // Nombre en chino
  members?: OfficeMember[];

  // Campos de Auditoría
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OfficeForm 
  extends Omit<Office,  'id' | 'createdAt' | 'updatedAt' | 'members' > {
    
}