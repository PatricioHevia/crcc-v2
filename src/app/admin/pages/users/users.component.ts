// src/app/admin/pages/users/users.component.ts
import { Component, computed, inject, Signal, WritableSignal, signal } from '@angular/core';
import { OrganizationService } from '../../../auth/services/organization.service'; //
import { TranslationService } from '../../../core/services/translation.service'; //
import { UserService } from '../../../auth/services/user.service'; //
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { TooltipModule } from 'primeng/tooltip';
import { UpdateUserComponent } from '../../components/update-user/update-user.component';
import { ConfirmationService } from 'primeng/api';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
    imports: [
    CommonModule,
    TranslateModule,
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
    UpdateUserComponent,
    ConfirmDialogModule,
  ],
})
export class UsersComponent {
  private userService = inject(UserService);
  private orgSvc = inject(OrganizationService);
  private translationService = inject(TranslationService);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);
  editVisible = signal(false); // Para el diálogo de edición  
  userToEdit: WritableSignal<Account | null> = signal (null); // Para almacenar el usuario a editar
  isProcessingToggle = signal(false); // Para evitar múltiples llamadas
  translateService = inject(TranslateService);

  public lang = computed(() => this.translationService.currentLang());

  // Usamos las señales del servicio que contienen todos los usuarios y el estado de carga
  usuarios: Signal<Account[]> = this.userService.allUsersForAdmin;
  loading: Signal<boolean> = this.userService.allUsersLoading;

  // totalUsers ahora se derivará de la longitud de la lista de usuarios cargada.
  totalUsers: Signal<number> = computed(() => this.usuarios().length);

  pageSize: WritableSignal<number> = signal(10); // Puedes ajustar el tamaño de página por defecto para el cliente

  activeFilterOptions: any[];
  organizationsNames = this.orgSvc.getOrganizationsOptions();  

  isMandante = computed(() => this.userService.isMandante()); 
  isSuperAdmin = computed(() => this.userService.isSuperAdmin());

  

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
  }  toggleUserActiveStatus(user: Account, event?: Event): void {
    // Prevenir propagación del evento
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Evitar múltiples llamadas simultáneas
    if (this.isProcessingToggle()) {
      return;
    }
    
    const newStatus = !user.active;
    
    this.confirmationService.confirm({
      message: this.translationService.instant(
        newStatus ? 'ADMIN.USERS.CONFIRM_ACTIVATE_USER' : 'ADMIN.USERS.CONFIRM_DEACTIVATE_USER'
      ),
      header: this.translationService.instant('COMMON.CONFIRMATION_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translationService.instant('COMMON.YES'),
      rejectLabel: this.translationService.instant('COMMON.NO'),
      accept: () => {
        this.isProcessingToggle.set(true);
        this.userService.update(user.uid, { active: newStatus })
          .then(() => {
            const successMessage = this.translationService.instant(
              newStatus ? 'ADMIN.USERS.USER_ACTIVATED_SUCCESS' : 'ADMIN.USERS.USER_DEACTIVATED_SUCCESS'
            );
            this.toastService.success(
              this.translationService.instant('TOAST.EXITO'),
              successMessage
            );
          })
          .catch((error) => {
            console.error('Error updating user status:', error);
            this.toastService.error(
              this.translationService.instant('TOAST.ERROR'),
              this.translationService.instant('ADMIN.USERS.USER_STATUS_UPDATE_ERROR')
            );
          })
          .finally(() => {
            this.isProcessingToggle.set(false);
          });
      },
      reject: () => {
        // No necesitamos resetear el estado aquí ya que no se activó
      }
    });
  }

  
}