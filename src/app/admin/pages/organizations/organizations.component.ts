// src/app/admin/pages/organizations/organizations.component.ts
import { Component, computed, inject, Signal, WritableSignal, signal } from '@angular/core';
import { OrganizationService } from '../../../auth/services/organization.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserService } from '../../../auth/services/user.service'; // Necesario para el contexto del rol y org del usuario
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Organization } from '../../../auth/models/organization-interface';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select'; // Para p-select
import { MultiSelectModule } from 'primeng/multiselect'; // Para p-multiselect
import { FormsModule } from '@angular/forms'; // Para ngModel
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  // styleUrls: ['./organizations.component.css'], // Si tienes estilos específicos
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    TableModule,
    ButtonModule,
    ProgressSpinnerModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
  ],
})
export class OrganizationsComponent {
  private organizationService = inject(OrganizationService);
  private translationService = inject(TranslationService);
  private userService = inject(UserService); // Inyectado para posible lógica futura, aunque la carga la maneja el servicio

  lang = computed(() => this.translationService.currentLang());

  // Señales corregidas usando computed para obtener los valores de los métodos del servicio
  organizaciones: Signal<Organization[]> = computed(() => this.organizationService.Organizations());
  loading: Signal<boolean> = computed(() => this.organizationService.loading());

  totalOrganizations: Signal<number> = computed(() => this.organizaciones().length);
  pageSize: WritableSignal<number> = signal(10);
  globalFilterValue: string = '';

  // Opciones para filtros (ejemplo, adaptar según necesidad)
  typeFilterOptions: WritableSignal<SelectOption[]> = signal([]); // Para filtrar por tipo de organización
  activeFilterOptions: any[];

  constructor() {
    // Considera cargar los tipos de organización para el filtro si es necesario
    // this.loadOrganizationTypesForFilter();

    this.activeFilterOptions = [
      { label: { es: 'Todas', en: 'All', zh: '全部' }, value: null },
      { label: { es: 'Activa', en: 'Active', zh: '激活' }, value: true },
      { label: { es: 'Inactiva', en: 'Inactive', zh: '未激活' }, value: false },
    ];
  }

  /**
   * Método ejemplo para cargar tipos de organización para el filtro.
   * Deberías adaptarlo para obtener los tipos desde tu servicio o una constante.
   */
  private async loadOrganizationTypesForFilter() {
    // Ejemplo: Si tienes un método en OrganizationService para obtener tipos únicos
    // const types = await this.organizationService.getDistinctOrganizationTypes();
    // this.typeFilterOptions.set(
    //   types.map(type => ({ label: this.translateOrganizationType(type), value: type }))
    // );
    // O si los tienes en una constante, como en `organizationTypes.ts`
    // import { organizationTypes } from '../../../core/constants/organizationTypes';
    // const currentLang = this.lang();
    // this.typeFilterOptions.set(
    //   organizationTypes.map(type => ({ label: type.name[currentLang] || type.name.es, value: type.id }))
    // );
  }

  /**
   * Ejemplo de cómo podrías traducir un tipo de organización si no viene pre-traducido.
   * (Esto es solo un placeholder, adapta a tu estructura)
   */
  private translateOrganizationType(typeKey: string): string {
    // Lógica para traducir, posiblemente usando ngx-translate si tienes claves para tipos
    // Por ejemplo: return this.translationService.instant(`ORG_TYPES.${typeKey}`);
    return typeKey; // Placeholder
  }


  onEdit(organization: Organization): void {
    console.log('Edit organization:', organization);
    // Aquí implementarías la lógica para la edición.
    // Podrías usar un diálogo de PrimeNG (DialogService) o navegar a una ruta de edición.
  }

  onDelete(organization: Organization): void {
    console.log('Delete organization:', organization);
    // Implementa la lógica para eliminar (preferiblemente borrado lógico).
    // Podrías mostrar un diálogo de confirmación (ConfirmDialog).
    // this.organizationService.deleteOrganization(organization.id); // Asumiendo que tienes este método
  }

  // El filtrado global se maneja con (input)="orgTable.filterGlobal(globalFilterValue, 'contains')" en el HTML.
  // Los filtros de columna se definen directamente en las columnas de la tabla.

  // Opcional: Lógica para limpiar filtros si añades botones específicos
  clearFilters(table: any): void {
    table.clear();
    this.globalFilterValue = '';
    // También resetea los modelos de los filtros de columna si los tienes bindeados
  }
}