import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { Organization, OrganizationForm } from '../../../auth/models/organization-interface';
import { ThemeService } from '../../../core/services/theme.service';
import { OrganizationService } from '../../../auth/services/organization.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { orgTypes } from '../../../core/constants/organizationTypes';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-update-organization',
  standalone: true, // Asumiendo que es standalone basado en tus otros componentes
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DrawerModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    ToggleSwitchModule
  ],
  templateUrl: './update-organization.component.html',
  styleUrls: ['./update-organization.component.css'] // Si tienes estilos específicos
})
export class UpdateOrganizationComponent {
  visible = model(false);
  organizationToUpdate = input<Organization | null>(null);

  // Inyecciones
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private organizationService = inject(OrganizationService);
  private toastService = inject(ToastService);
  public translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());

  // Formulario y estado
  organizationForm!: FormGroup;

  isLoading = signal(false);
  buttonLabel = signal('ACTIONS.SAVE');
  buttonIcon = signal('pi pi-save');



  // Opciones para selects
  orgTypeOptions = orgTypes;



  constructor() {
    this.organizationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      tin: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(3)]],
      type: [null, Validators.required], // Usar null para que el placeholder del p-select se muestre
      active: [true, Validators.required],
      phone: [''],
      website: [''],
      legalRepresentative: [''],
      // No incluimos 'logoURL' aquí, se manejará por separado
    });

    // Efecto para rellenar el formulario cuando organizationToUpdate cambie
    effect(() => {
      const org = this.organizationToUpdate();
      if (org) {
        this.organizationForm.patchValue({
          name: org.name,
          email: org.email || '',
          tin: org.tin || '',
          address: org.address || '',
          type: org.type || null,
          active: org.active === undefined ? true : org.active,
          phone: org.phone || '',
          website: org.website || '',
          legalRepresentative: org.legalRepresentative || ''
        });
      } else {
        this.organizationForm.reset({ active: true });
      }
    });
  }


  async onUpdateOrganization() {
    if (this.organizationForm.invalid) {
      this.toastService.error('COMMON.FORM_INVALID_TITLE', 'COMMON.FORM_INVALID_DETAIL');
      Object.values(this.organizationForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const org = this.organizationToUpdate();
    if (!org) return;

    this.isLoading.set(true);
    this.buttonLabel.set('ACTIONS.UPDATING');
    this.buttonIcon.set('pi pi-spin pi-spinner');

    const formValues = this.organizationForm.value;
    const changes: Partial<OrganizationForm> = {}; // Usamos OrganizationForm para los datos a enviar

    // Comparamos cada campo con el valor original para enviar solo lo que cambió
    if (formValues.name !== org.name) changes.name = formValues.name;
    if (formValues.email !== (org.email || '')) changes.email = formValues.email;
    if (formValues.tin !== (org.tin || '')) changes.tin = formValues.tin;
    if (formValues.address !== (org.address || '')) changes.address = formValues.address;
    if (formValues.type !== (org.type || null)) changes.type = formValues.type;
    if (formValues.active !== (org.active === undefined ? true : org.active)) changes.active = formValues.active;
    if (formValues.phone !== (org.phone || '')) changes.phone = formValues.phone;
    if (formValues.website !== (org.website || '')) changes.website = formValues.website;
    if (formValues.legalRepresentative !== (org.legalRepresentative || '')) changes.legalRepresentative = formValues.legalRepresentative;

    // Si no hay cambios en los datos del formulario Y no se seleccionó un nuevo logo
    if (Object.keys(changes).length === 0) {
      this.toastService.info('TOAST.INFO', 'ADMIN.USERS.NO_CHANGES_DETECTED'); // Podrías necesitar una traducción específica para organizaciones
      this.resetButtonAndLoadingState();
      this.visible.set(false);
      return;
    }
    // Llamada al servicio
    await this.organizationService.update(org.id, changes).then(() => {
      this.toastService.success('TOAST.EXITO', 'ADMIN.ORGANIZATIONS.DELETE_SUCCESS_TITLE'); // Ajusta la llave de traducción
      this.resetFormAndClose();
    })
      .catch(error => {
        console.error('Error updating organization:', error);
        this.toastService.error('TOAST.ERROR', this.getErrorMessage(error));
      })
      .finally(() => {
        this.resetButtonAndLoadingState();
      });
  }

  private resetButtonAndLoadingState(): void {
    this.isLoading.set(false);
    this.buttonLabel.set('ACTIONS.SAVE');
    this.buttonIcon.set('pi pi-save');
  }

  private getErrorMessage(error: any): string {
    if (error && error.message) {
      return error.message; // O una llave de traducción específica
    }
    return 'COMMON.UNEXPECTED_ERROR_DETAIL';
  }

  onCancel(): void {
    this.resetFormAndClose();
    const org = this.organizationToUpdate();
    if (!org) return;
    this.organizationForm.patchValue({
      name: org.name,
      email: org.email || '',
      tin: org.tin || '',
      address: org.address || '',
      type: org.type || null,
      active: org.active === undefined ? true : org.active,
      phone: org.phone || '',
      website: org.website || '',
      legalRepresentative: org.legalRepresentative || ''
    });
    this.resetButtonAndLoadingState();
  }

  private resetFormAndClose(): void {
    this.organizationForm.reset({ active: true }); // Resetea y asegura que 'active' sea true
    this.visible.set(false);
    this.isLoading.set(false);
    this.buttonLabel.set('ACTIONS.SAVE');
    this.buttonIcon.set('pi pi-save');
  }
  // Helper para la plantilla (opcional, puedes acceder directamente en el template)
  get f() { return this.organizationForm.controls; }
}