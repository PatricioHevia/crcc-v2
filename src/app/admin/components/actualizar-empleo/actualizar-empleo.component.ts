import { Component, effect, inject, input, model, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { OfertasEmpleoService } from '../../services/ofertas-empleo.service';
import { OfertasEmpleo, TipoTrabajo, Jornada } from '../../models/ofertas-empleo.interface';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-actualizar-empleo',
  standalone: true,
  imports: [
    DrawerModule,
    TranslateModule,
    ButtonModule,
    DividerModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    InputNumberModule,
    MultiSelectModule
  ],
  templateUrl: './actualizar-empleo.component.html',
  styleUrls: ['./actualizar-empleo.component.css']
})
export class ActualizarEmpleoComponent {
  visible = model(false);
  empleoToUpdate = input<OfertasEmpleo | null>(null);

  themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private ofertasService = inject(OfertasEmpleoService);
  private toastService = inject(ToastService);
  public translationService = inject(TranslationService);

  empleoForm!: FormGroup;
  isLoading = signal(false);
  buttonLabel = signal('ACTIONS.SAVE');
  buttonIcon = signal('pi pi-save');

  // Opciones para los selects
  tipoTrabajoOptions = [
    { label: 'Presencial', value: 'Presencial' as TipoTrabajo },
    { label: 'Híbrido', value: 'Híbrido' as TipoTrabajo },
    { label: 'Remoto', value: 'Remoto' as TipoTrabajo }
  ];

  jornadaOptions = [
    { label: 'Completa', value: 'Completa' as Jornada },
    { label: 'Parcial', value: 'Parcial' as Jornada }
  ];

  requisitosOptions = [
    { label: 'Licenciatura', value: 'Licenciatura' },
    { label: 'Maestría', value: 'Maestría' },
    { label: 'Doctorado', value: 'Doctorado' },
    { label: 'Experiencia mínima 1 año', value: 'Experiencia mínima 1 año' },
    { label: 'Experiencia mínima 3 años', value: 'Experiencia mínima 3 años' },
    { label: 'Experiencia mínima 5 años', value: 'Experiencia mínima 5 años' },
    { label: 'Inglés avanzado', value: 'Inglés avanzado' },
    { label: 'Mandarín básico', value: 'Mandarín básico' },
    { label: 'Disponibilidad para viajar', value: 'Disponibilidad para viajar' }
  ];

  constructor() {
    this.empleoForm = this.fb.group({
      nombre_es: ['', [Validators.required, Validators.minLength(3)]],
      nombre_en: ['', [Validators.required, Validators.minLength(3)]],
      nombre_zh: ['', [Validators.required, Validators.minLength(3)]],
      descripcion_es: ['', [Validators.required, Validators.minLength(10)]],
      descripcion_en: ['', [Validators.required, Validators.minLength(10)]],
      descripcion_zh: ['', [Validators.required, Validators.minLength(10)]],
      proyecto: ['', [Validators.required]],
      lugar: ['', [Validators.required]],
      tipoTrabajo: [null, [Validators.required]],
      tipoJornada: [null, [Validators.required]],
      vacantes: [1, [Validators.required, Validators.min(1)]],
      fechaPublicacion: [null, [Validators.required]],
      fechaCierre: [null, [Validators.required]],
      requisitos: [[], []]
    });

    effect(() => {
      const empleo = this.empleoToUpdate();
      if (empleo) {
        this.empleoForm.patchValue({
          nombre_es: empleo.nombre_es || '',
          nombre_en: empleo.nombre_en || '',
          nombre_zh: empleo.nombre_zh || '',
          descripcion_es: empleo.descripcion_es || '',
          descripcion_en: empleo.descripcion_en || '',
          descripcion_zh: empleo.descripcion_zh || '',
          proyecto: empleo.proyecto || '',
          lugar: empleo.lugar || '',
          tipoTrabajo: empleo.tipoTrabajo || null,
          tipoJornada: empleo.tipoJornada || null,
          vacantes: empleo.vacantes || 1,
          fechaPublicacion: empleo.fechaPublicacion ? (empleo.fechaPublicacion as any).toDate ? (empleo.fechaPublicacion as any).toDate() : new Date(empleo.fechaPublicacion as any) : null,
          fechaCierre: empleo.fechaCierre ? (empleo.fechaCierre as any).toDate ? (empleo.fechaCierre as any).toDate() : new Date(empleo.fechaCierre as any) : null,
          requisitos: empleo.requisitos || []
        });
      } else {
        this.empleoForm.reset();
      }
    });
  }

  onUpdateEmpleo(): void {
    if (this.empleoForm.invalid) {
      this.toastService.error('COMMON.FORM_INVALID_TITLE', 'COMMON.FORM_INVALID_DETAIL');
      Object.values(this.empleoForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const currentEmpleo = this.empleoToUpdate();
    if (!currentEmpleo) return;

    this.isLoading.set(true);
    this.buttonLabel.set('ACTIONS.UPDATING');
    this.buttonIcon.set('pi pi-spin pi-spinner');

    const formValues = this.empleoForm.value;
    const empleoChanges: Partial<OfertasEmpleo> = {};

    // Comparar campos y solo incluir los que han cambiado
    if (formValues.nombre_es !== currentEmpleo.nombre_es) empleoChanges.nombre_es = formValues.nombre_es;
    if (formValues.nombre_en !== currentEmpleo.nombre_en) empleoChanges.nombre_en = formValues.nombre_en;
    if (formValues.nombre_zh !== currentEmpleo.nombre_zh) empleoChanges.nombre_zh = formValues.nombre_zh;
    if (formValues.descripcion_es !== currentEmpleo.descripcion_es) empleoChanges.descripcion_es = formValues.descripcion_es;
    if (formValues.descripcion_en !== currentEmpleo.descripcion_en) empleoChanges.descripcion_en = formValues.descripcion_en;
    if (formValues.descripcion_zh !== currentEmpleo.descripcion_zh) empleoChanges.descripcion_zh = formValues.descripcion_zh;
    if (formValues.proyecto !== currentEmpleo.proyecto) empleoChanges.proyecto = formValues.proyecto;
    if (formValues.lugar !== currentEmpleo.lugar) empleoChanges.lugar = formValues.lugar;
    if (formValues.tipoTrabajo !== currentEmpleo.tipoTrabajo) empleoChanges.tipoTrabajo = formValues.tipoTrabajo;
    if (formValues.tipoJornada !== currentEmpleo.tipoJornada) empleoChanges.tipoJornada = formValues.tipoJornada;
    if (formValues.vacantes !== currentEmpleo.vacantes) empleoChanges.vacantes = formValues.vacantes;

    // Comparar fechas
    const formFechaPublicacion = formValues.fechaPublicacion ? new Date(formValues.fechaPublicacion) : null;
    const currentFechaPublicacion = currentEmpleo.fechaPublicacion;
    let currentFechaPublicacionTime: number | null = null;

    if (currentFechaPublicacion) {
      if ((currentFechaPublicacion as any).toDate) {
        currentFechaPublicacionTime = (currentFechaPublicacion as any).toDate().getTime();
      } else if (currentFechaPublicacion instanceof Date) {
        currentFechaPublicacionTime = currentFechaPublicacion.getTime();
      }
    }

    const formFechaPublicacionTime = formFechaPublicacion ? formFechaPublicacion.getTime() : null;
    if (formFechaPublicacionTime !== currentFechaPublicacionTime) {
      empleoChanges.fechaPublicacion = Timestamp.fromDate(formFechaPublicacion!);
    }

    const formFechaCierre = formValues.fechaCierre ? new Date(formValues.fechaCierre) : null;
    const currentFechaCierre = currentEmpleo.fechaCierre;
    let currentFechaCierreTime: number | null = null;

    if (currentFechaCierre) {
      if ((currentFechaCierre as any).toDate) {
        currentFechaCierreTime = (currentFechaCierre as any).toDate().getTime();
      } else if (currentFechaCierre instanceof Date) {
        currentFechaCierreTime = currentFechaCierre.getTime();
      }
    }

    const formFechaCierreTime = formFechaCierre ? formFechaCierre.getTime() : null;
    if (formFechaCierreTime !== currentFechaCierreTime) {
      empleoChanges.fechaCierre = Timestamp.fromDate(formFechaCierre!);
    }

    // Comparar requisitos
    const currentRequisitos = currentEmpleo.requisitos || [];
    const formRequisitos = formValues.requisitos || [];
    if (JSON.stringify(currentRequisitos.sort()) !== JSON.stringify(formRequisitos.sort())) {
      empleoChanges.requisitos = formRequisitos;
    }

    // Actualizar campos computados si es necesario
    if (empleoChanges.nombre_es) empleoChanges.nombre = empleoChanges.nombre_es;
    if (empleoChanges.descripcion_es) empleoChanges.descripcion = empleoChanges.descripcion_es;

    if (Object.keys(empleoChanges).length === 0) {
      this.toastService.info('TOAST.INFO', 'JOBS.MESSAGES.NO_CHANGES_DETECTED');
      this.resetButtonAndLoadingState();
      this.visible.set(false);
      return;
    }

    this.ofertasService.updateOferta(currentEmpleo.id, empleoChanges)
      .then(() => {
        this.toastService.success('TOAST.EXITO', 'JOBS.MESSAGES.UPDATE_SUCCESS');
        this.resetFormAndClose();
      })
      .catch(error => {
        console.error("Error updating job offer:", error);
        this.toastService.error('TOAST.ERROR', 'JOBS.MESSAGES.UPDATE_ERROR');
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
    this.empleoForm.reset();
    this.visible.set(false);
    this.resetButtonAndLoadingState();
  }

  // Helper para la plantilla
  get f() { return this.empleoForm.controls; }
}
