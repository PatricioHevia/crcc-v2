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
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { SpecificationsService, CreateSpecificationData } from '../../services/specifications.service';
import { TenderSpecification, TenderSpecificationType } from '../../models/specifications.interface';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../../../core/services/translation.service';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-specifications',
  templateUrl: './specifications.component.html',
  styleUrls: ['./specifications.component.css'],
  standalone: true,  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule,
    FormsModule,
    TranslateModule,
    FileUploadModule
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
  isDownloadingAll = signal(false);

  lang = computed(() => this.translation.currentLang());
  // Datos del formulario
  uploadFormData = signal({
    name: '',
    description: '',
    type: 'Bases Administrativas' as TenderSpecificationType,
    file: null as File | null
  });  // Opciones para el dropdown de tipos (se actualizan en ngOnInit)
  typeOptions: { label: string; value: TenderSpecificationType }[] = [];

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
    
    // Actualizar las opciones de tipos cuando cambie el idioma
    this.updateTypeOptions();
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
  onFileSelected(event: any): void {
    // Cambiar de event.files a event.target.files para el input nativo
    const file = event.target?.files?.[0];
    if (file) {
      this.uploadFormData.update(current => ({
        ...current,
        file: file
      }));
    }
  }

  clearFile(): void {
    this.uploadFormData.update(current => ({
      ...current,
      file: null
    }));
    // Limpiar el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  async uploadSpecification() {
    const formData = this.uploadFormData();
    console.log('Datos del formulario:', formData);
    
    if (!formData.file || !formData.name.trim() || !formData.description.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translation.instant('TENDERS.SPECIFICATIONS.REQUIRED_FIELDS'),
        detail: this.translation.instant('TENDERS.SPECIFICATIONS.COMPLETE_FIELDS')
      });
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    try {
      // Crear objeto base para traducción
      const specificationBase = {
        name: formData.name.trim(),
        name_es: '',
        name_en: '',
        name_zh: '',
        description: formData.description.trim(),
        description_es: '',
        description_en: '',
        description_zh: ''
      };

      console.log('🌐 Iniciando traducción automática...');
      // Traducir automáticamente usando el servicio
      const specificationTranslated = await this.translation.translateJson(specificationBase);
      console.log('✅ Traducción completada:', specificationTranslated);

      const createData: CreateSpecificationData = {
        idProject: this.idProject(),
        idTender: this.idTender(),
        name: specificationTranslated.name,
        name_es: specificationTranslated.name_es,
        name_en: specificationTranslated.name_en,
        name_zh: specificationTranslated.name_zh,
        description: specificationTranslated.description,
        description_es: specificationTranslated.description_es,
        description_en: specificationTranslated.description_en,
        description_zh: specificationTranslated.description_zh,
        type: formData.type,
        file: formData.file
      };    this.specificationsService.createSpecification(createData).subscribe({
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
            summary: this.translation.instant('TENDERS.SPECIFICATIONS.SUCCESS'),
            detail: this.translation.instant('TENDERS.SPECIFICATIONS.UPLOAD_SUCCESS')
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
        
        let errorMessage = this.translation.instant('TENDERS.SPECIFICATIONS.UPLOAD_ERROR');
        if (error.status === 500) {
          errorMessage = this.translation.instant('TENDERS.SPECIFICATIONS.SERVER_ERROR');
        } else if (error.status === 0) {
          errorMessage = this.translation.instant('TENDERS.SPECIFICATIONS.CONNECTION_ERROR');
        } else if (error.error && error.error.error) {
          errorMessage = error.error.error;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: this.translation.instant('TENDERS.SPECIFICATIONS.ERROR'),
          detail: errorMessage
        });
        this.isUploading.set(false);
      }
    });
  } catch (translationError) {
    console.error('Error en la traducción:', translationError);
    this.messageService.add({
      severity: 'error',
      summary: this.translation.instant('TENDERS.SPECIFICATIONS.ERROR'),
      detail: this.translation.instant('TENDERS.SPECIFICATIONS.TRANSLATION_ERROR')
    });
    this.isUploading.set(false);
  }
  }
  downloadSpecification(specification: TenderSpecification) {
    window.open(specification.fileUrl, '_blank');
  }
  /**
   * Descarga todas las especificaciones disponibles
   */
  async downloadAllSpecifications() {
    const specs = this.specifications();
    if (specs.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translation.instant('TENDERS.SPECIFICATIONS.ERROR'),
        detail: 'No hay documentos para descargar'
      });
      return;
    }

    this.isDownloadingAll.set(true);
    
    try {
      // Mostrar mensaje de inicio
      this.messageService.add({
        severity: 'info',
        summary: this.translation.instant('TENDERS.SPECIFICATIONS.DOWNLOADING_ALL'),
        detail: `Iniciando descarga de ${specs.length} documento(s)...`
      });

      // Usar el servicio para manejar las descargas
      await this.specificationsService.downloadAllSpecifications(specs);

      // Mensaje de éxito
      this.messageService.add({
        severity: 'success',
        summary: this.translation.instant('TENDERS.SPECIFICATIONS.SUCCESS'),
        detail: this.translation.instant('TENDERS.SPECIFICATIONS.DOWNLOAD_ALL_SUCCESS')
      });

    } catch (error) {
      console.error('Error al descargar documentos:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translation.instant('TENDERS.SPECIFICATIONS.ERROR'),
        detail: this.translation.instant('TENDERS.SPECIFICATIONS.DOWNLOAD_ALL_ERROR')
      });
    } finally {
      this.isDownloadingAll.set(false);
    }
  }
  // Métodos helper para mostrar contenido traducido
  getSpecificationName(spec: TenderSpecification): string {
    const lang = this.lang();
    const key = `name_${lang}` as 'name_es' | 'name_en' | 'name_zh';
    return spec[key] || spec.name_es || spec.name || '';
  }
  getSpecificationDescription(spec: TenderSpecification): string {
    const lang = this.lang();
    const key = `description_${lang}` as 'description_es' | 'description_en' | 'description_zh';
    return spec[key] || spec.description_es || spec.description || '';
  }

  getSpecificationType(type: string): string {
    // Mapear el tipo de especificación a su clave de traducción
    const typeMap: { [key: string]: string } = {
      'Bases Administrativas': 'TENDERS.SPECIFICATIONS.TYPES.ADMINISTRATIVE_BASES',
      'Bases Técnicas': 'TENDERS.SPECIFICATIONS.TYPES.TECHNICAL_BASES',
      'Bases Económicas': 'TENDERS.SPECIFICATIONS.TYPES.ECONOMIC_BASES',
      'Bases de Concurso': 'TENDERS.SPECIFICATIONS.TYPES.CONTEST_BASES',
      'Bases de Licitación': 'TENDERS.SPECIFICATIONS.TYPES.TENDER_BASES',
      'Anexo': 'TENDERS.SPECIFICATIONS.TYPES.ANNEX',
      'Otro': 'TENDERS.SPECIFICATIONS.TYPES.OTHER'
    };

    const translationKey = typeMap[type];
    return translationKey ? this.translation.instant(translationKey) : type;
  }

  // Actualizar las opciones de tipos con traducciones
  private updateTypeOptions() {
    this.typeOptions = [
      { label: this.translation.instant('TENDERS.SPECIFICATIONS.TYPES.ADMINISTRATIVE_BASES'), value: 'Bases Administrativas' },
      { label: this.translation.instant('TENDERS.SPECIFICATIONS.TYPES.TECHNICAL_BASES'), value: 'Bases Técnicas' },
      { label: this.translation.instant('TENDERS.SPECIFICATIONS.TYPES.ECONOMIC_BASES'), value: 'Bases Económicas' },
      { label: this.translation.instant('TENDERS.SPECIFICATIONS.TYPES.CONTEST_BASES'), value: 'Bases de Concurso' },
      { label: this.translation.instant('TENDERS.SPECIFICATIONS.TYPES.TENDER_BASES'), value: 'Bases de Licitación' },
      { label: this.translation.instant('TENDERS.SPECIFICATIONS.TYPES.ANNEX'), value: 'Anexo' },
      { label: this.translation.instant('TENDERS.SPECIFICATIONS.TYPES.OTHER'), value: 'Otro' }
    ];
  }
}
