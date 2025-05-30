import { TenderCurrency } from '../models/tender-interface';

export interface TenderCurrencyType {
  value: TenderCurrency;
  label: {
    es: string;
    en: string;
    zh: string;
  };
}

export const tenderCurrencyTypes: TenderCurrencyType[] = [
  {
    value: 'CLP',
    label: {
      es: 'Peso Chileno (CLP)',
      en: 'Chilean Peso (CLP)',
      zh: '智利比索 (CLP)'
    }
  },
  {
    value: 'USD',
    label: {
      es: 'Dólar Estadounidense (USD)',
      en: 'US Dollar (USD)',
      zh: '美元 (USD)'
    }
  },
  {
    value: 'EUR',
    label: {
      es: 'Euro (EUR)',
      en: 'Euro (EUR)',
      zh: '欧元 (EUR)'
    }
  },
  {
    value: 'UF',
    label: {
      es: 'Unidad de Fomento (UF)',
      en: 'Development Unit (UF)',
      zh: '发展单位 (UF)'
    }
  },
  {
    value: 'UTM',
    label: {
      es: 'Unidad Tributaria Mensual (UTM)',
      en: 'Monthly Tax Unit (UTM)',
      zh: '月税单位 (UTM)'
    }
  },
  {
    value: 'CNY',
    label: {
      es: 'Yuan Chino (CNY)',
      en: 'Chinese Yuan (CNY)',
      zh: '人民币 (CNY)'
    }
  }
];
