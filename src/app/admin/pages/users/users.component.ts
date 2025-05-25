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
import { ToolbarModule } from 'primeng/toolbar';
import { roleTypes } from '../../../core/constants/role-types';
import { UpdateUserComponent } from '../../components/update-user/update-user.component';
import { TooltipModule } from 'primeng/tooltip';

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
    ToolbarModule,
    TooltipModule,
    UpdateUserComponent
  ],
})
export class UsersComponent {
  private userService = inject(UserService);
  private orgSvc = inject(OrganizationService);
  private translationService = inject(TranslationService);

  editVisible = signal(false); // Para el diálogo de edición  
  userToEdit: WritableSignal<Account | null> = signal (null); // Para almacenar el usuario a editar


  lang = computed(() => this.translationService.currentLang());

  // Usamos las señales del servicio que contienen todos los usuarios y el estado de carga
  usuarios: Signal<Account[]> = this.userService.allUsersForAdmin;
  loading: Signal<boolean> = this.userService.allUsersLoading;

  // totalUsers ahora se derivará de la longitud de la lista de usuarios cargada.
  totalUsers: Signal<number> = computed(() => this.usuarios().length);

  pageSize: WritableSignal<number> = signal(10); // Puedes ajustar el tamaño de página por defecto para el cliente

  activeFilterOptions: any[];
  organizationsNames = this.orgSvc.getOrganizationsOptions();  

  isMandante = computed(() => this.userService.isMandante()); 

  // Variable para el filtro global de PrimeNG si decides usarlo
  globalFilterValue: string = '';

  constructor() {
    this.activeFilterOptions = [
      { label: { es: 'Todos', en: 'All', zh: '全部' }, value: null },
      { label: { es: 'Activo', en: 'Active', zh: '激活' }, value: true },
      { label: { es: 'Inactivo', en: 'Inactive', zh: '未激活' }, value: false }
    ];
  }

  roles = roleTypes;

  getOrgName(orgId: string): Signal<string | null> { //
    if (!orgId) return signal('N/A');
    return this.orgSvc.getOrganizationNameById(orgId);
  }

  onEdit(user: Account): void { //
    this.editVisible.set(true);
    this.userToEdit.set(user);
  }
}