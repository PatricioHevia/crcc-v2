import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { Account } from '../../../auth/models/account-interface';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { UserService } from '../../../auth/services/user.service';
import { ThemeService } from '../../../core/services/theme.service';
import { OrganizationService } from '../../../auth/services/organization.service';
import { OfficeService } from '../../services/office.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { roleTypes } from '../../../core/constants/role-types';
import { permissionTypes } from '../../../core/constants/opciones-permiso';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css'],
  imports: [CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DrawerModule,
    SelectModule,
    ButtonModule,
    SelectModule,
    ToggleSwitchModule,
    MultiSelectModule,
    DividerModule,
    TooltipModule]
})
export class UpdateUserComponent {
  visible = model(false);
  userToUpdate = input<Account | null>(null); // Para almacenar el usuario a actualizar
  // Inyecciones de servicios
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private organizationService = inject(OrganizationService);
  private officeService = inject(OfficeService);
  private toastService = inject(ToastService);
  private translation = inject(TranslationService); // Para obtener idioma actual

  // FORMULARIO Y BOTONES
  updateUserForm!: FormGroup;
  isLoading = signal(false);
  buttonLabel = signal('ACTIONS.SAVE');
  buttonIcon = signal('pi pi-save');

  organizationsOptions = computed(() => {
    const noOrganizationLabel = this.translation.instant('COMMON.NO_ORGANIZATION');
    const noOrganizationOption = {
      label: noOrganizationLabel,
      value: '' 
    }; 
    const organizations = this.organizationService.Organizations(); 
    const actualOrgOptions = organizations.map(org => ({
      label: org.name, 
      value: org.id    
    }));

    return [noOrganizationOption, ...actualOrgOptions];
  });



  rolesOptions = roleTypes;
  permissionsOptions = permissionTypes;

  officesOptions = this.officeService.officeOptionsSignal; // Asigna directamente la señal
  isOfficeDataLoading = computed(() => this.officeService.loading());

  readonly lang = computed(() => this.translation.currentLang());
  readonly isAdmin = computed(() => this.userService.isAdmin());
  readonly isSuperAdmin = computed(() => this.userService.isSuperAdmin());
  readonly isMandante = computed(() => this.userService.isMandante());


  constructor() {
    this.updateUserForm = this.fb.group({
      name: [{ value: '', disabled: true }], // No editable
      email: [{ value: '', disabled: true }], // No editable
      organization: [Validators.required],
      active: [false, Validators.required],
      role: [null, Validators.required],
      permissions: [[]],
      offices: [[]]
    });

    // Effect para rellenar el formulario cuando userToUpdate cambie
    effect(() => {
      const user = this.userToUpdate();
      if (user) {
        this.updateUserForm.patchValue({
          name: user.name,
          email: user.email,
          organization: user.organization || null,
          active: user.active,
          role: user.role,
          permissions: user.permissions || [],
          offices: user.offices || []
        });
        // Lógica para deshabilitar campos según el rol del administrador
        this.disableFieldsBasedOnAdminRole(user);
      } else {
        this.updateUserForm.reset();
      }
    });

  }

  private disableFieldsBasedOnAdminRole(editingUser: Account): void {
    const isSuper = this.isAdmin();

    if (!isSuper) {
      this.updateUserForm.get('organization')?.disable();
      this.updateUserForm.get('role')?.disable(); // Un Admin no puede cambiar roles

      // Un Admin solo puede cambiar active, permissions y offices (de su propia organización)
      if (this.userService.usuario()?.organization !== editingUser.organization) {
        this.updateUserForm.disable(); // Si no es su organización, deshabilita todo
        this.updateUserForm.get('name')?.enable(); // Mantenemos los campos de solo lectura visibles
        this.updateUserForm.get('email')?.enable();
      } else {
        this.updateUserForm.get('name')?.disable();
        this.updateUserForm.get('email')?.disable();
        this.updateUserForm.get('active')?.enable();
        this.updateUserForm.get('permissions')?.enable();
        this.updateUserForm.get('offices')?.enable();
      }
    } else {
      // Super Admin puede editar todo
      this.updateUserForm.get('organization')?.enable();
      this.updateUserForm.get('role')?.enable();
      this.updateUserForm.get('active')?.enable();
      this.updateUserForm.get('permissions')?.enable();
      this.updateUserForm.get('offices')?.enable();
    }
  }

  onUpdateUser() {
    if (this.updateUserForm.invalid) {
      this.toastService.error('COMMON.FORM_INVALID_TITLE', 'COMMON.FORM_INVALID_DETAIL');
      Object.values(this.updateUserForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const user = this.userToUpdate();
    if (!user) return;
    this.isLoading.set(true);
    this.buttonLabel.set('ACTIONS.UPDATING');
    this.buttonIcon.set('pi pi-spin pi-spinner');

    const initialValues = {
      organization: user.organization,
      active: user.active,
      role: user.role,
      permissions: user.permissions || [],
      offices: user.offices || [],
    };

    const formValues = this.updateUserForm.getRawValue();
    const changes: Partial<Account> = {};

    if (this.isSuperAdmin()) {
      if (formValues.organization !== initialValues.organization) {
        changes.organization = formValues.organization;
      }
      if (formValues.role !== initialValues.role) {
        changes.role = formValues.role;
      }
    }

    if (formValues.active !== initialValues.active) {
      changes.active = formValues.active;
    }

    if (JSON.stringify(formValues.permissions.sort()) !== JSON.stringify(initialValues.permissions.sort())) {
      changes.permissions = formValues.permissions;
    }
    if (JSON.stringify(formValues.offices.sort()) !== JSON.stringify(initialValues.offices.sort())) {
      changes.offices = formValues.offices;
    }

    if (Object.keys(changes).length === 0) {
      this.toastService.info('TOAST.INFO', 'ADMIN.USERS.NO_CHANGES_DETECTED');
      this.resetButtonState();
      this.isLoading.set(false);
      this.visible.set(false);
      return;
    }
    this.userService.update(user.uid, changes)
      .then(() => {
        this.toastService.success('TOAST.EXITO', 'ADMIN.USERS.SUCCESS_UPDATED_DETAIL');
        this.resetFormAndClose();
      })
      .catch(error => {
        console.error('Error updating user:', error);
        this.toastService.error('TOAST.ERROR', this.getErrorMessage(error));
      })
      .finally(() => {
        this.resetButtonState();
        this.isLoading.set(false);
      });
  }

  private getErrorMessage(error: any): string {
    // Aquí puedes mapear códigos de error de Firebase/Firestore a tus llaves de traducción
    if (error && error.message) {
      return error.message; // O una llave de traducción si la tienes
    }
    return 'COMMON.UNEXPECTED_ERROR_DETAIL';
  }

  private resetButtonState(): void {
    this.buttonLabel.set('ACTIONS.SAVE');
    this.buttonIcon.set('pi pi-save');
  }

  private resetFormAndClose(): void {
    this.updateUserForm.reset();
    this.visible.set(false);
  }

  onCancel(): void {
    this.resetFormAndClose();
  }

}


