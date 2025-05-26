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
import { ToolbarModule } from 'primeng/toolbar';
import { FluidModule } from 'primeng/fluid';
import { orgTypes } from '../../../core/constants/organizationTypes';
import { ConfirmationService } from 'primeng/api';
import { ToastService } from '../../../core/services/toast.service';
import { UpdateOrganizationComponent } from '../../components/update-organization/update-organization.component';

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
    ToolbarModule,
    FluidModule,
    UpdateOrganizationComponent
  ],
})
export class OrganizationsComponent {
  private organizationService = inject(OrganizationService);
  private translationService = inject(TranslationService);
  private userService = inject(UserService);
  private confirmationService = inject(ConfirmationService); // Para confirmaciones de acciones
  private toastService = inject(ToastService);

  editOrgVisible = signal(false);
  organizationToEdit: WritableSignal<Organization | null> = signal(null);

  lang = computed(() => this.translationService.currentLang());

  // Señales corregidas usando computed para obtener los valores de los métodos del servicio
  organizaciones: Signal<Organization[]> = computed(() => this.organizationService.Organizations());
  loading: Signal<boolean> = computed(() => this.organizationService.loading());

  totalOrganizations: Signal<number> = computed(() => this.organizaciones().length);
  pageSize: WritableSignal<number> = signal(10);
  globalFilterValue: string = '';

  orgTypes = orgTypes;

  isAdmin = computed(() => this.userService.isAdmin()); // Verifica si el usuario es administrador
  isSuperAdmin = computed(() => this.userService.isSuperAdmin()); // Verifica si el usuario es super administrador
  isMandante = computed(() => this.userService.isMandante()); // Verifica si el usuario es mandante


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




  onEdit(organization: Organization): void {
    this.organizationToEdit.set(organization);
    this.editOrgVisible.set(true);
  }

  onDelete(organization: Organization): void {
    if (!this.isAdmin() && !this.isSuperAdmin() && !this.isMandante()) {
      this.toastService.error('ADMIN.ORGANIZATIONS.NO_PERMISSION_DELETE_TITLE', 'ADMIN.ORGANIZATIONS.NO_PERMISSION_DELETE_DETAIL');
      return;
    }
    this.confirmationService.confirm({
      message: this.translationService.instant('ADMIN.ORGANIZATIONS.CONFIRM_DELETE_MESSAGE' ).replace('{name}', organization.name),
      header: this.translationService.instant('COMMON.CONFIRMATION_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.translationService.instant('ACTIONS.CANCEL'),
        icon: 'pi pi-times',
        class: 'p-button-text',
        severity: 'secondary',
        size: 'small'
      },
      acceptButtonProps: {
        label: this.translationService.instant('ACTIONS.DELETE'),
        icon: 'pi pi-check',
        severity: 'danger',
        size: 'small'
      },
      accept: () => {
        this.organizationService.delete(organization.id)
          .then(() => {
            this.toastService.success('ADMIN.ORGANIZATIONS.DELETE_SUCCESS_TITLE', 
               this.translationService.instant('ADMIN.ORGANIZATIONS.DELETE_SUCCESS_DETAIL' ));
          }
          ).catch(error => {
            console.error('Error deleting organization:', error);
            this.toastService.error(
              'ADMIN.ORGANIZATIONS.DELETE_ERROR_TITLE',
              this.translationService.instant('ADMIN.ORGANIZATIONS.DELETE_ERROR_DETAIL') + (error?.message ? `: ${error.message}` : '')
            );
          }
          );
      },
      reject: () => {
        this.toastService.info('ADMIN.ORGANIZATIONS.DELETE_CANCELLED_TITLE','ADMIN.ORGANIZATIONS.DELETE_CANCELLED_DETAIL');
      }
    });
  }
  // Opcional: Lógica para limpiar filtros si añades botones específicos
  clearFilters(table: any): void {
    table.clear();
    this.globalFilterValue = '';
    // También resetea los modelos de los filtros de columna si los tienes bindeados
  }


}