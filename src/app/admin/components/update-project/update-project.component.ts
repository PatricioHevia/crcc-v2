import { Component, effect, inject, input, model, signal } from '@angular/core';
import { Project, ProjectForm } from '../../models/project-interface';
import { DrawerModule } from 'primeng/drawer';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../core/services/theme.service';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { PROJECT_PHASE_CODES, PROJECT_PHASE_TRANSLATION_KEYS } from '../../../core/constants/phase-projects-keys';
import { Timestamp } from '@angular/fire/firestore';
import { SelectModule } from 'primeng/select';
import {  DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-update-project',
  templateUrl: './update-project.component.html',
  styleUrls: ['./update-project.component.css'],
  imports: [
    DrawerModule,
    TranslateModule,
    ButtonModule,
    DividerModule,
    SelectModule,
    DatePickerModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule
  ],
})
export class UpdateProjectComponent {
  visible = model(false);
  projectToUpdate = input<Project | null>(null);

  themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  public translationService = inject(TranslationService);
  private translate = inject(TranslateService);

  projectForm!: FormGroup;
  isLoading = signal(false);
  buttonLabel = signal('ACTIONS.SAVE');
  buttonIcon = signal('pi pi-save');

  projectPhases = PROJECT_PHASE_CODES.map(code => ({
    label: this.translationService.instant(PROJECT_PHASE_TRANSLATION_KEYS[code]), // Traduce la etiqueta para mostrar en el dropdown
    value: code // El valor del filtro será el código
  }));

  constructor() {
    this.projectForm = this.fb.group({
      name_es: ['', [Validators.required, Validators.minLength(3)]],
      name_en: ['', [Validators.required, Validators.minLength(3)]],
      name_zh: ['', [Validators.required, Validators.minLength(3)]],
      description_es: ['', [Validators.required, Validators.minLength(10)]],
      description_en: ['', [Validators.required, Validators.minLength(10)]],
      description_zh: ['', [Validators.required, Validators.minLength(10)]],
      awardDate: [null, [Validators.required]],
      phase: [null, [Validators.required]],
    });

    effect(() => {
      const project = this.projectToUpdate();
      if (project) {
        this.projectForm.patchValue({
          name_es: project.name_es || '',
          name_en: project.name_en || '',
          name_zh: project.name_zh || '',
          description_es: project.description_es || '',
          description_en: project.description_en || '',
          description_zh: project.description_zh || '',
          awardDate: project.awardDate ? (project.awardDate as any).toDate ? (project.awardDate as any).toDate() : new Date(project.awardDate as any) : null,
          phase: project.phase || null,
        });
      } else {
        this.projectForm.reset();
      }
    });
  }

  onUpdateProject(): void {
    if (this.projectForm.invalid) {
      this.toastService.error('COMMON.FORM_INVALID_TITLE', 'COMMON.FORM_INVALID_DETAIL');
      Object.values(this.projectForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const currentProject = this.projectToUpdate();
    if (!currentProject) return;

    this.isLoading.set(true);
    this.buttonLabel.set('ACTIONS.UPDATING');
    this.buttonIcon.set('pi pi-spin pi-spinner');

    const formValues = this.projectForm.value;
    // Usar Partial<Project> está bien, ya que tu modelo Project ahora tiene los campos aplanados.
    const projectChanges: Partial<Project> = {};

    // Nombres
    if (formValues.name_es !== currentProject.name_es) projectChanges.name_es = formValues.name_es;
    if (formValues.name_en !== currentProject.name_en) projectChanges.name_en = formValues.name_en;
    if (formValues.name_zh !== currentProject.name_zh) projectChanges.name_zh = formValues.name_zh;

    // Descripciones
    if (formValues.description_es !== currentProject.description_es) projectChanges.description_es = formValues.description_es;
    if (formValues.description_en !== currentProject.description_en) projectChanges.description_en = formValues.description_en;
    if (formValues.description_zh !== currentProject.description_zh) projectChanges.description_zh = formValues.description_zh;

    // Award Date - Comparamos correctamente las fechas
    const formAwardDate = formValues.awardDate ? new Date(formValues.awardDate) : null;
    const currentAwardDateObject = currentProject.awardDate; // Puede ser Timestamp o Date
    let currentAwardDateTime: number | null = null;

    if (currentAwardDateObject) {
      if ((currentAwardDateObject as any).toDate) { // Es un Timestamp de Firestore
        currentAwardDateTime = (currentAwardDateObject as any).toDate().getTime();
      } else if (currentAwardDateObject instanceof Date) { // Es un objeto Date
        currentAwardDateTime = currentAwardDateObject.getTime();
      } else { // Intentar parsear si es string (aunque el modelo debería ser Timestamp | Date)
        try {
          currentAwardDateTime = new Date(currentAwardDateObject as any).getTime();
        } catch (e) { /* no hacer nada, se considerará diferente si formAwardDate existe */ }
      }
    }

    const formAwardDateTime = formAwardDate ? formAwardDate.getTime() : null;

    if (formAwardDateTime !== currentAwardDateTime) {
      projectChanges.awardDate = Timestamp.fromDate(formAwardDate!); // Enviar el objeto Date, el servicio lo convertirá a Timestamp
    }

    // Phase
    if (formValues.phase !== currentProject.phase) projectChanges.phase = formValues.phase;

    if (Object.keys(projectChanges).length === 0) {
      this.toastService.info('TOAST.INFO', 'PROJECTS.ACTIONS.NO_CHANGES_DETECTED');
      this.resetButtonAndLoadingState();
      this.visible.set(false);
      return;
    }

    // Llamada al servicio. Asume que ProjectService.updateProject toma (id, data, mainImage?, galleryImages?)
    // y que si mainImage y galleryImages son undefined, solo actualiza los datos.
    this.projectService.update(currentProject.id, projectChanges)
      .then(() => {
        this.toastService.success('TOAST.EXITO', 'PROJECTS.ACTIONS.UPDATE_SUCCESS_DETAIL');
        this.resetFormAndClose();
      })
      .catch(error => {
        console.error("Error updating project:", error);
        this.toastService.error('TOAST.ERROR', 'COMMON.UNEXPECTED_ERROR_DETAIL'); // O un error más específico
        this.resetButtonAndLoadingState();
      });
  }

  private resetButtonAndLoadingState(): void {
    this.isLoading.set(false);
    this.buttonLabel.set('ACTIONS.SAVE');
    this.buttonIcon.set('pi pi-save');
  }

  onCancel(): void {
    this.resetFormAndClose();
  }

  private resetFormAndClose(): void {
    this.projectForm.reset();
    this.visible.set(false);
    this.isLoading.set(false);
    this.buttonLabel.set('ACTIONS.SAVE');
    this.buttonIcon.set('pi pi-save');
  }

  // Helper para la plantilla
  get f() { return this.projectForm.controls; }
}