# Sistema de Tipado para Tenders

Este documento explica cómo usar el sistema de tipado TypeScript y las funciones de traducción para los campos con valores predefinidos en los tenders.

## Arquitectura

El sistema incluye:

### 1. Tipos TypeScript
- `TenderStatus`: Estado del tender
- `TenderCurrency`: Moneda del tender  
- `TenderModality`: Modalidad del tender

### 2. Constantes con traducciones
- `tenderStatusTypes`: Array con todos los estados y sus traducciones
- `tenderCurrencyTypes`: Array con todas las monedas y sus traducciones
- `tenderModalityTypes`: Array con todas las modalidades y sus traducciones

### 3. Funciones helper
- `getTenderStatusLabel()`: Obtiene la etiqueta traducida de un estado
- `getTenderCurrencyLabel()`: Obtiene la etiqueta traducida de una moneda
- `getTenderModalityLabel()`: Obtiene la etiqueta traducida de una modalidad
- `getTenderStatusOptions()`: Obtiene todos los estados como opciones para dropdowns
- `getTenderCurrencyOptions()`: Obtiene todas las monedas como opciones para dropdowns
- `getTenderModalityOptions()`: Obtiene todas las modalidades como opciones para dropdowns

## Uso en Componentes

### Importar desde el índice
```typescript
import { 
  Tender, 
  TenderStatus, 
  TenderCurrency, 
  TenderModality,
  getTenderStatusLabel,
  getTenderCurrencyLabel,
  getTenderModalityLabel,
  getTenderStatusOptions,
  getTenderCurrencyOptions,
  getTenderModalityOptions
} from '../index';
```

### Mostrar etiquetas traducidas
```typescript
export class TenderListComponent {
  tenders: Tender[] = [];

  getStatusLabel(status: TenderStatus): string {
    return getTenderStatusLabel(status);
  }

  getCurrencyLabel(currency: TenderCurrency): string {
    return getTenderCurrencyLabel(currency);
  }

  getModalityLabel(modality: TenderModality): string {
    return getTenderModalityLabel(modality);
  }
}
```

### Uso en formularios con dropdowns
```typescript
export class TenderFormComponent {
  statusOptions = getTenderStatusOptions();
  currencyOptions = getTenderCurrencyOptions();
  modalityOptions = getTenderModalityOptions();
}
```

### En templates HTML
```html
<!-- Mostrar etiqueta traducida -->
<span>{{ getStatusLabel(tender.tenderStatus) }}</span>

<!-- Dropdown con opciones traducidas -->
<p-dropdown 
  [options]="statusOptions" 
  optionLabel="label" 
  optionValue="value"
  [(ngModel)]="tender.tenderStatus">
</p-dropdown>
```

## Estructura de archivos

```
tenders/
├── models/
│   ├── tender-interface.ts          # Interface principal con tipos exportados
│   ├── meet-interface.ts
│   └── encryptation.interface.ts
├── constants/
│   ├── tender-status-types.ts       # Constantes para estados
│   ├── tender-currency-types.ts     # Constantes para monedas
│   ├── tender-modality-types.ts     # Constantes para modalidades
│   └── tender-helpers.ts            # Funciones helper
└── index.ts                         # Exportaciones centralizadas
```

## Idiomas soportados

El sistema soporta tres idiomas:
- `es`: Español (por defecto)
- `en`: Inglés
- `zh`: Chino

Las traducciones se obtienen automáticamente según el idioma activo en el `TranslationService`.

## Extensión del sistema

Para agregar nuevos valores:

1. Actualizar el tipo correspondiente en `tender-interface.ts`
2. Agregar la nueva opción al array de constantes correspondiente
3. Las funciones helper funcionarán automáticamente con los nuevos valores

Para agregar nuevos idiomas:

1. Agregar las claves del idioma a cada objeto `label` en las constantes
2. Actualizar el tipo en las funciones helper si es necesario
