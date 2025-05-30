import { Component, OnInit, OnDestroy, AfterViewInit, input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { SpecificationsService, CreateSpecificationData } from '../../services/specifications.service';
import { TenderSpecification, TenderSpecificationType } from '../../models/specifications.interface';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../../../core/services/translation.service';

@Component({
  selector: 'app-specifications',
  templateUrl: './specifications.component.html',
  styleUrls: ['./specifications.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule,
    FormsModule,
    TranslateModule
  ],
  providers: [MessageService]
})
export class SpecificationsComponent implements OnInit, OnDestroy, AfterViewInit {
  // Inputs del componente padre
  idProject = input.required<string>();
  idTender = input.required<string>();

  private specificationsService = inject(SpecificationsService);
  private messageService = inject(MessageService);
  private translation = inject(TranslationService);

  // Signals para el estado del componente
  showUploadModal = signal(false);
  isUploading = signal(false);
  uploadProgress = signal(0);

  lang = computed(() => this.translation.currentLang());
  // Datos del formulario
  uploadFormData = signal({
    name: '',
    description: '',
    type: 'Bases Administrativas' as TenderSpecificationType,
    file: null as File | null
  });

  // Opciones para el dropdown de tipos
  typeOptions = [
    { label: 'Bases Administrativas', value: 'Bases Administrativas' },
    { label: 'Bases Técnicas', value: 'Bases Técnicas' },
    { label: 'Bases Económicas', value: 'Bases Económicas' },
    { label: 'Bases de Concurso', value: 'Bases de Concurso' },
    { label: 'Bases de Licitación', value: 'Bases de Licitación' },
    { label: 'Anexo', value: 'Anexo' },
    { label: 'Otro', value: 'Otro' }
  ];

  // Signals para las especificaciones
  private specificationsData = signal<{ data: any; loading: any; unsubscribe: () => void } | null>(null);
  private lastLoadedProject: string | null = null;
  private lastLoadedTender: string | null = null;
  
  // Computed signals para exponer los datos
  specifications = computed(() => this.specificationsData()?.data() || []);
  isLoadingSpecifications = computed(() => this.specificationsData()?.loading() ?? true);

  constructor() {
    // No hacer nada en el constructor para evitar bucles infinitos
  }

  ngOnInit() {
    // Cargar especificaciones una vez al inicializar
    this.checkAndLoadSpecifications();
  }

  ngAfterViewInit() {
    // También verificar después de que la vista se inicialice
    setTimeout(() => this.checkAndLoadSpecifications(), 0);
  }

  ngOnDestroy() {
    // Limpiar suscripción a especificaciones
    const currentData = this.specificationsData();
    if (currentData) {
      currentData.unsubscribe();
    }
  }

  private checkAndLoadSpecifications() {
    const idProject = this.idProject();
    const idTender = this.idTender();
    
    // Solo cargar si los IDs están disponibles y han cambiado
    if (idProject && idTender && 
        (idProject !== this.lastLoadedProject || idTender !== this.lastLoadedTender)) {
      this.lastLoadedProject = idProject;
      this.lastLoadedTender = idTender;
      this.loadSpecifications();
    }
  }

  private loadSpecifications() {
    // Limpiar suscripción anterior si existe
    const currentData = this.specificationsData();
    if (currentData) {
      currentData.unsubscribe();
    }
    
    const serviceResponse = this.specificationsService.getAllSpecifications(
      this.idProject(),
      this.idTender()
    );

    // Guardar la respuesta del servicio en un signal
    this.specificationsData.set(serviceResponse);
  }

  openUploadModal() {
    this.resetForm();
    this.showUploadModal.set(true);
  }

  closeUploadModal() {
    this.showUploadModal.set(false);
    this.resetForm();
  }

  resetForm() {
    this.uploadFormData.set({
      name: '',
      description: '',
      type: 'Bases Administrativas',
      file: null
    });
    this.isUploading.set(false);
    this.uploadProgress.set(0);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.uploadFormData.update(data => ({ ...data, file }));
    }
  }

  uploadSpecification() {
    const formData = this.uploadFormData();
    console.log('Datos del formulario:', formData);
    
    if (!formData.file || !formData.name.trim() || !formData.description.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    const createData: CreateSpecificationData = {
      idProject: this.idProject(),
      idTender: this.idTender(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      file: formData.file
    };

    this.specificationsService.createSpecification(createData).subscribe({
      next: (response) => {
        console.log('Respuesta del servicio:', response);
        if ('percentage' in response) {
          // Es progreso de subida
          this.uploadProgress.set(response.percentage);
          console.log(`Progreso: ${response.percentage}%`);
        } else {
          // Es la especificación creada
          console.log('Especificación creada exitosamente:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Especificación subida correctamente'
          });
          this.closeUploadModal();
        }
      },
      error: (error) => {
        console.error('Error completo al subir especificación:', error);
        console.error('Status:', error.status);
        console.error('StatusText:', error.statusText);
        console.error('Error body:', error.error);
        console.error('Message:', error.message);
        
        let errorMessage = 'Error al subir la especificación';
        if (error.status === 500) {
          errorMessage = 'Error interno del servidor. Verifique la configuración de Google Drive.';
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else if (error.error && error.error.error) {
          errorMessage = error.error.error;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
        this.isUploading.set(false);
      }
    });
  }

  downloadSpecification(specification: TenderSpecification) {
    window.open(specification.fileUrl, '_blank');
  }
}
