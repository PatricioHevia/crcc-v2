import { Tender } from '../models/tender-interface';

// Extraer el tipo de moneda de la interfaz Tender
export type TenderCurrency = Tender['tenderCurrency'];

export const tenderCurrencyTypes: {
    label: { es: string; en: string; zh: string };
    value: TenderCurrency;
  }[] = [
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
      en: 'Unit of Development (UF)',
      zh: '发展单位 (UF)'
    }
  },
  {
    value: 'UTM',
    label: {
      es: 'Unidad Tributaria Mensual (UTM)',
      en: 'Monthly Tax Unit (UTM)',
      zh: '月度税收单位 (UTM)'
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
