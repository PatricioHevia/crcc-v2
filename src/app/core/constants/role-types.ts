import { RoleAccount } from "../../auth/models/account-interface";

export const roleTypes:{
    label: { es: string; en: string; zh: string };
    value: RoleAccount;
  }[] = [
  {
    value: 'Usuario Básico',
    label: {
      es: 'Usuario Básico',
      en: 'Basic User',
      zh: '基本用户'
    }
  },
  {
    value: 'Admin',
    label: {
      es: 'Administrador de Organización',
      en: 'Organization Administrator',
      zh: '组织管理员'
    }
  },
  {
    value: 'Super Admin',
    label: {
      es: 'Administrador General',
      en: 'General Administrator',
      zh: '总管理员'
    }
  },  
];