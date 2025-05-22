// src/app/admin/pages/users/users.component.ts
import { Component, computed, inject, Signal, WritableSignal, signal } from '@angular/core';
import { OrganizationService } from '../../../auth/services/organization.service'; //
import { TranslationService } from '../../../core/services/translation.service'; //
import { UserService } from '../../../auth/services/user.service'; //
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table'; // No necesitas TableLazyLoadEvent aquí
import { Account } from '../../../auth/models/account-interface'; //
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
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
  ],
})
export class UsersComponent {
  private userService = inject(UserService);
  private orgSvc = inject(OrganizationService);
  private translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());

  // Usamos las señales del servicio que contienen todos los usuarios y el estado de carga
  usuarios: Signal<Account[]> = this.userService.allUsersForAdmin;
  loading: Signal<boolean> = this.userService.allUsersLoading;

  // totalUsers ahora se derivará de la longitud de la lista de usuarios cargada.
  totalUsers: Signal<number> = computed(() => this.usuarios().length);

  pageSize: WritableSignal<number> = signal(10); // Puedes ajustar el tamaño de página por defecto para el cliente

  activeFilterOptions: any[];
  organizationFilterOptions: WritableSignal<SelectOption[]> = signal([]);

  // Variable para el filtro global de PrimeNG si decides usarlo
  globalFilterValue: string = '';

  constructor() {
    this.activeFilterOptions = [
      { label: { es: 'Todos', en: 'All', zh: '全部' }, value: null },
      { label: { es: 'Activo', en: 'Active', zh: '激活' }, value: true },
      { label: { es: 'Inactivo', en: 'Inactive', zh: '未激活' }, value: false }
    ];
    this.loadOrganizationsForFilter();
  }


  private async loadOrganizationsForFilter() {
    try {
      const orgs = await this.orgSvc.getAllOrganizationsPromise();
      const options = orgs.map(org => ({ label: org.name, value: org.id }));

      // construye el label según el idioma actual
      const noneLabelMap: Record<string, string> = {
        es: 'Sin organización',
        en: 'No organization',
        zh: '无组织'
      };
      const noneOption: SelectOption = {
        value: '',
        label: noneLabelMap[this.lang()] || noneLabelMap["es"]
      };

      // pon primero “Sin organización” y luego el resto
      this.organizationFilterOptions.set([noneOption, ...options]);
    } catch (error) {
      console.error("Error loading organizations for filter:", error);
      this.organizationFilterOptions.set([{ label: 'Error al cargar', value: null }]);
    }
  }


  getOrgName(orgId: string): Signal<string | null> { //
    if (!orgId) return signal('N/A');
    return this.orgSvc.getOrganizationNameById(orgId);
  }

  onEdit(user: Account): void { //
    console.log('Edit user:', user);
  }

}