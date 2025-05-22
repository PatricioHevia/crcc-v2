// src/app/admin/pages/users/users.component.ts
import { Component, computed, inject, OnInit, Signal, WritableSignal, signal } from '@angular/core';
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
    FormsModule
  ],
})
export class UsersComponent implements OnInit {
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

  activeFilterOptions: SelectOption[];
  organizationFilterOptions: WritableSignal<SelectOption[]> = signal([]);

  // Variable para el filtro global de PrimeNG si decides usarlo
  globalFilterValue: string = '';

  constructor() {
    this.activeFilterOptions = [
      { label: 'Todos', value: null },
      { label: 'Activo', value: true },
      { label: 'Inactivo', value: false }
    ];
    this.loadOrganizationsForFilter();
  }

  ngOnInit(): void {
    // El UserService se encarga de llamar a loadAllUsersForAdmin si el usuario es admin.
    // No se necesita hacer nada más aquí para la carga inicial.
  }

  private async loadOrganizationsForFilter() {
    try {
      // Usamos el método de OrganizationService que devuelve una promesa
      const orgs = await this.orgSvc.getAllOrganizationsPromise(); //
      const options = orgs.map(org => ({ label: org.name, value: org.id }));
      this.organizationFilterOptions.set([{ label: 'Todas', value: null }, ...options]);
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

  // Ya no necesitas loadUsers(event: TableLazyLoadEvent) porque PrimeNG manejará
  // la paginación, filtrado y ordenamiento en el cliente sobre los datos de this.usuarios().
  // Los (click)="$event.stopPropagation()" en los filtros del HTML son importantes.
}