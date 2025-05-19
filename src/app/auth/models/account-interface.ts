import { Timestamp } from "@angular/fire/firestore";

export type UserRole = 'Usuario Básico' | 'Admin' | 'Super Admin';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'deleted';
export type Gender = 'male' | 'female';
export type Theme = 'light' | 'dark';
export type Language = 'es' | 'en' | 'zh';
export type PermissionKey =
  | 'inventory.read' | 'inventory.write'
  | 'tenders.view' | 'tenders.manage'
  | 'hr.view' | 'hr.post' | /* …otros permisos… */ string;


export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface NotionIntegrationConfig {
  enabled: boolean;
  integrationId?: string;
  defaultDatabaseId?: string;
}

export interface Account {
  // ————————————————————————————————————————————————————————————————
  // 1. Identidad y estado
  // ————————————————————————————————————————————————————————————————
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  organizationId: string; // id de la organización

  // ————————————————————————————————————————————————————————————————
  // 2. Perfil
  // ————————————————————————————————————————————————————————————————
  profile: {
    photoURL: string;
    position: string;
    gender: Gender;
    phone?: string;
  };

  // ————————————————————————————————————————————————————————————————
  // 3. Auditoría / actividad
  // ————————————————————————————————————————————————————————————————
  activity: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt?: Timestamp;
    passwordChangedAt?: Timestamp;
  };

  // ————————————————————————————————————————————————————————————————
  // 4. Preferencias de usuario
  // ————————————————————————————————————————————————————————————————
  preferences: {
    theme: Theme;
    language: Language;
    notifications: NotificationSettings;
    timezone?: string;
    dateFormat?: string;     // p. ej. 'dd/MM/yyyy'
    defaultPage?: string;    // p. ej. 'dashboard'
  };

  // ————————————————————————————————————————————————————————————————
  // 5. Accesos y permisos
  // ————————————————————————————————————————————————————————————————
  access: {
    permissions: PermissionKey[];
    officeIds: string[];
    tenderAdminProjectIds: string[];
  };

  // ————————————————————————————————————————————————————————————————
  // 6. Integraciones externas
  // ————————————————————————————————————————————————————————————————
  integrations?: {
    notion?: NotionIntegrationConfig;
    // …en el futuro: slack, ms-teams, etc.
  };

  // ————————————————————————————————————————————————————————————————
  // 7. Inventario
  // ————————————————————————————————————————————————————————————————
  inventory?: {
    defaultWarehouseId?: string;
    canManage: boolean;
  };

  // ————————————————————————————————————————————————————————————————
  // 8. RRHH / postulaciones
  // ————————————————————————————————————————————————————————————————
  hr?: {
    postedJobRequestIds?: string[];  // requisitos que subió
    appliedJobIds?: string[];        // plazas a las que postuló
  };

  // ————————————————————————————————————————————————————————————————
  // 9. Calendarios y Hitos
  // ————————————————————————————————————————————————————————————————
  calendar?: {
    calendarIds?: string[];
    milestoneIds?: string[];
  };

  // ————————————————————————————————————————————————————————————————
  // 10. Concursos
  // ————————————————————————————————————————————————————————————————
  contests?: {
    contestIds?: string[];
    participation?: { contestId: string; joinedAt: Timestamp }[];
  };
}
