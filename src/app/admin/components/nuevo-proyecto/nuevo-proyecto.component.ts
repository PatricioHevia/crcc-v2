import { Component, inject, model, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ThemeService } from '../../../core/services/theme.service';
import { DividerModule } from 'primeng/divider';
import { FluidModule } from 'primeng/fluid';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { PROJECT_PHASE_TRANSLATION_KEYS } from '../../../core/constants/phase-projects-keys';
import { ProjectService } from '../../services/project.service';

interface SelectOption {
  value: string; // El valor que se guardará en el formulario (ej: 'DESIGN')
  label: string; // La clave de traducción para mostrar (ej: 'projects.phases.design')
}

@Component({
  selector: 'app-nuevo-proyecto',
  templateUrl: './nuevo-proyecto.component.html',
  styleUrls: ['./nuevo-proyecto.component.css'],
  imports: [
    FluidModule,
    ReactiveFormsModule,
    DividerModule,
    DrawerModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    TranslateModule,
    DatePickerModule]

})
export class NuevoProyectoComponent implements OnInit {
  visible = model(false);
  theme = inject(ThemeService);
  fb = inject(FormBuilder);
  ps = inject(ProjectService);

  butonLabel = 'ACTIONS.CREATE';
  butonIcon = 'pi pi-plus';

  phases: SelectOption[] = [];

  projectForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    phase: [null, Validators.required], // null para p-dropdown sin selección
    awardDate: [null, Validators.required] // null para p-calendar sin selección
  });

  ngOnInit(): void {
    this.loadPhasesForSelect();
  }

   loadPhasesForSelect(): void {
    this.phases = Object.keys(PROJECT_PHASE_TRANSLATION_KEYS).map(key => {
      return {
        value: key,                                       // Ej: 'DESIGN'
        label: PROJECT_PHASE_TRANSLATION_KEYS[key]      // Ej: 'projects.phases.design'
      };
    });
  }  

  onCancel() {
    this.projectForm.reset();
    this.visible.set(false);

  }

  onCreateProject() { 
    if (this.projectForm.valid) {
      const projectData = this.projectForm.value;
      console.log('Nuevo proyecto creado:', projectData);
      this.butonLabel = 'ACTIONS.CREATING';
      this.butonIcon = 'pi pi-spin pi-spinner';
      this.ps.createProject( this.projectForm.value.name, this.projectForm.value.description, this.projectForm.value.phase, this.projectForm.value.awardDate)
        .then(() => {
          console.log('Proyecto creado exitosamente');
          this.projectForm.reset();
          this.visible.set(false);
          this.butonLabel = 'ACTIONS.CREATE';
          this.butonIcon = 'pi pi-plus';
        })
        .catch((error) => {
          console.error('Error al crear el proyecto:', error);
          this.butonLabel = 'ACTIONS.CREATE';
          this.butonIcon = 'pi pi-plus';
        });
    } 
  }

}
