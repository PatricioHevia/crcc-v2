import { Timestamp } from "@angular/fire/firestore";

export interface Account extends basicInfoAccount,
                                 AccountProfileDetails,
                                 AccountActivity,
                                 AccountPreferences,
                                 AccountHR,
                                 AccountAccess  {}
                            
export interface basicInfoAccount {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: RoleAccount;
  active: boolean;
  phone?: string;
  organization?: string; //id
  deleted: boolean;
}

export interface AccountProfileDetails {
  photoURL?: string;
  position?: string;
  gender?: 'Hombre' | 'Mujer';
}


export interface AccountActivity {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface AccountPreferences {
  language?: string;
  theme?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    app?: boolean;
  }
}
  
export interface AccountAccess {
  permissions?: string[];
  offices?: string[];
}

export interface AccountHR {
  hr?: {       // requerimientos publicados
    applicationIds?: string[];      // postulaciones realizadas
    disponibleDesde?: Timestamp; // fecha desde
    curriculum: Curriculum; // url del curriculum
    certificados?: Certificado[]; // certificados
    linkedIn?: string; // link de linkedin
  };
}

export interface Certificado {
  url: string;
  nombre_es: string;
  nombre_en: string;
  nombre_zh: string;
  subidoEn: Timestamp;
}

export interface Curriculum {
  url: string;
  nombre_en: string;
  nombre_es: string;
  nombre_zh: string;
  subidoEn: Timestamp;
}

export interface AccountForm
  extends Omit<Account, 'uid' | 'createdAt' | 'updatedAt' | 'deleted'| 'role'> {}

  export type RoleAccount = 'Usuario Básico' | 'Admin' | 'Super Admin';