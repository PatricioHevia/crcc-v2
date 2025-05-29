import { Component, OnInit, OnDestroy, inject, computed, signal, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TenderService } from '../../services/tender.service';
import { TranslationService } from '../../../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { tenderStatusTypes } from '../../constants/tender-status-types';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TenderStatus } from '../../models/tender-interface';
import { Timestamp } from '@angular/fire/firestore';

interface PhaseInfo {
  key: string;
  translationKey: string;
  order: number;
  date?: Date;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Mapeo de fases a estados del tender para transiciones automáticas
interface PhaseToStatusMapping {
  phaseKey: string;
  newStatus: TenderStatus;
}

@Component({
  selector: 'app-tender',
  templateUrl: './tender.component.html',
  styleUrls: ['./tender.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    ImageCropperComponent,
    ProgressSpinnerModule
  ]
})
export class TenderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public tenderService = inject(TenderService);
  private translation = inject(TranslationService);
  
  // Signals para estado del componente - patrón simple como en tender-list
  private projectId = signal<string>('');
  public tenderId = signal<string>('');
    // Banner image loading state
  bannerImageLoading = signal<boolean>(false);
  
  // Timer related signals
  private timerInterval: any;
  countdownTime = signal<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  currentPhase = signal<PhaseInfo | null>(null);
  nextPhase = signal<PhaseInfo | null>(null);
  
  // Computed properties simples basadas en el servicio
  lang = computed(() => this.translation.currentLang());
  
  // Get tender status types for display
  statusTypes = tenderStatusTypes;
  
  // Computed simplificado que usa el servicio directamente como en tender-list
  tender = computed(() => {
    const tenderId = this.tenderId();
    if (tenderId) {
      return this.tenderService.getTenderById(tenderId);
    }
    return undefined;
  });

  @ViewChild('bannerImageFileInput') bannerImageFileInput!: ElementRef;
  // Cropper variables
  showCropper = false;
  imageChangedEvent: any = null;
  croppedImage: string = '';
  croppedFile: File | null = null;
  cropperLoading = false;
  uploadLoading = signal<boolean>(false);

  // Variables para control de transición automática
  private statusTransitionInProgress = false;
  private statusTransitionTimeout: any = null;
  
  // Mapeo de fases a estados para transiciones automáticas
  private readonly phaseToStatusMap: PhaseToStatusMapping[] = [
    { phaseKey: 'tenderStartDate', newStatus: 'Fase de Consultas' },
    { phaseKey: 'inquiryDeadline', newStatus: 'Fase de Respuestas' },
    { phaseKey: 'answerDeadline', newStatus: 'Fase de Ofertas' },
    { phaseKey: 'submissionDeadline', newStatus: 'Espera de Apertura' },
    { phaseKey: 'openOfferDeadline', newStatus: 'Fase Solicitud de Aclaraciones' },
    { phaseKey: 'aclarationsDeadline', newStatus: 'Fase Respuestas a Aclaraciones' },
    { phaseKey: 'answerAclarationsDeadline', newStatus: 'Fase de Adjudicación' },
    { phaseKey: 'awardDate', newStatus: 'Cerrada' }
  ];

  constructor() { }
  ngOnInit() {
    // Obtener los parámetros de la ruta
    this.route.params.subscribe(params => {
      const projectId = params['id'];
      const tenderId = params['tenderId'];
      
      // Configurar el contexto del proyecto en el servicio PRIMERO
      this.tenderService.setProjectContext(projectId);
      
      // Luego establecer los signals
      this.projectId.set(projectId);
      this.tenderId.set(tenderId);
      
      // Iniciar el timer cuando tengamos los datos
      setTimeout(() => this.startTimer(), 100);
    });
  }
  ngOnDestroy(): void {
    this.clearTimer();
    
    // Limpiar timeouts de transición de estado
    if (this.statusTransitionTimeout) {
      clearTimeout(this.statusTransitionTimeout);
      this.statusTransitionTimeout = null;
    }
    
    // Resetear flag de transición
    this.statusTransitionInProgress = false;
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private startTimer(): void {
    this.clearTimer();
    this.updatePhases();
    this.updateCountdown();
    
    this.timerInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private updatePhases(): void {
    const tender = this.tender();
    if (!tender) return;

    const phases = this.getOrderedPhases();
    const now = new Date();
    
    let currentPhase: PhaseInfo | null = null;
    let nextPhase: PhaseInfo | null = null;

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      if (phase.date && phase.date > now) {
        nextPhase = phase;
        if (i > 0) {
          currentPhase = phases[i - 1];
        }
        break;
      }
    }

    // Si no hay próxima fase, significa que estamos en la última o después
    if (!nextPhase && phases.length > 0) {
      currentPhase = phases[phases.length - 1];
    }

    this.currentPhase.set(currentPhase);
    this.nextPhase.set(nextPhase);
  }  private updateCountdown(): void {
    const nextPhase = this.nextPhase();
    if (!nextPhase || !nextPhase.date) {
      this.countdownTime.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const now = new Date();
    const timeDiff = nextPhase.date.getTime() - now.getTime();

    if (timeDiff <= 0) {
      this.countdownTime.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      
      // Intentar transición automática de estado
      this.attemptStatusTransition(nextPhase.key);
      
      // Recalcular fases después de un breve delay para permitir que la actualización se propague
      // y luego recalcular el countdown para la nueva fase
      setTimeout(() => {
        this.updatePhases();
        // Recalcular countdown inmediatamente después de actualizar las fases
        setTimeout(() => {
          this.updateCountdown();
        }, 100);
      }, 1000);
      
      return;
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    this.countdownTime.set({ days, hours, minutes, seconds });
  }

  private getOrderedPhases(): PhaseInfo[] {
    const tender = this.tender();
    if (!tender) return [];    // Orden corregido de las fases
    const orderedPhaseKeys = [
      { key: 'tenderStartDate', translationKey: 'TENDERS.DETAIL.PHASES.TENDER_START', order: 1 },
      { key: 'inquiryDeadline', translationKey: 'TENDERS.DETAIL.PHASES.INQUIRY_DEADLINE', order: 2 },
      { key: 'answerDeadline', translationKey: 'TENDERS.DETAIL.PHASES.ANSWER_DEADLINE', order: 3 },
      { key: 'submissionDeadline', translationKey: 'TENDERS.DETAIL.PHASES.SUBMISSION_DEADLINE', order: 4 },
      { key: 'openOfferDeadline', translationKey: 'TENDERS.DETAIL.PHASES.OPEN_OFFER_DEADLINE', order: 5 },
      { key: 'aclarationsDeadline', translationKey: 'TENDERS.DETAIL.PHASES.CLARIFICATIONS_DEADLINE', order: 6 },
      { key: 'answerAclarationsDeadline', translationKey: 'TENDERS.DETAIL.PHASES.ANSWER_CLARIFICATIONS_DEADLINE', order: 7 },
      { key: 'awardDate', translationKey: 'TENDERS.DETAIL.PHASES.AWARD_DATE', order: 8 }
    ];

    return orderedPhaseKeys
      .map(phase => ({
        ...phase,
        date: this.getTenderDateValue(phase.key)
      }))
      .filter(phase => phase.date !== null)
      .map(phase => ({
        ...phase,
        date: phase.date!
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Navega de vuelta a la lista de tenders
   */
  goBack(): void {
    const projectId = this.projectId();
    this.router.navigate(['/app/project', projectId, 'tenders']);
  }

  /**
   * Obtiene el nombre del tender según el idioma activo
   */
  getTenderName(): string {
    const currentTender = this.tender();
    if (!currentTender) return '';
    
    const currentLang = this.lang();
    
    switch (currentLang) {
      case 'es':
        return currentTender.name_es || currentTender.name;
      case 'en':
        return currentTender.name_en || currentTender.name;
      case 'zh':
        return currentTender.name_zh || currentTender.name;
      default:
        return currentTender.name;
    }
  }

  /**
   * Obtiene la descripción del tender según el idioma activo
   */
  getTenderDescription(): string {
    const currentTender = this.tender();
    if (!currentTender) return '';
    
    const currentLang = this.lang();
    
    switch (currentLang) {
      case 'es':
        return currentTender.description_es || currentTender.description;
      case 'en':
        return currentTender.description_en || currentTender.description;
      case 'zh':
        return currentTender.description_zh || currentTender.description;
      default:
        return currentTender.description;
    }
  }

  /**
   * Obtiene la severidad del tag según el estado
   */
  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 'En Preparación':
        return 'secondary';
      case 'Fase de Consultas':
      case 'Fase de Respuestas':
      case 'Fase Solicitud de Aclaraciones':
      case 'Fase Respuestas a Aclaraciones':
        return 'info';
      case 'Fase de Ofertas':
      case 'Espera de Apertura':
        return 'warn';
      case 'Fase de Adjudicación':
        return 'success';
      case 'Cerrada':
        return 'danger';
      default:
        return 'info';
    }
  }

  /**
   * Obtiene el texto del estado para mostrar
   */
  getStatusText(status: string): string {
    const statusType = this.statusTypes.find(s => s.value === status);
    if (!statusType) return status;

    const currentLang = this.lang();
    switch (currentLang) {
      case 'es':
        return statusType.label.es;
      case 'en':
        return statusType.label.en;
      case 'zh':
        return statusType.label.zh;
      default:
        return statusType.label.es;
    }
  }

  /**
   * Obtiene la severidad del tag para el estado actual del tender
   */
  getCurrentStatusSeverity(): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const currentTender = this.tender();
    if (!currentTender) return 'info';
    return this.getStatusSeverity(currentTender.tenderStatus);
  }

  /**
   * Obtiene el texto del estado para el tender actual
   */
  getCurrentStatusText(): string {
    const currentTender = this.tender();
    if (!currentTender) return '';
    return this.getStatusText(currentTender.tenderStatus);
  }

  /**
   * Maneja cuando la imagen del banner termina de cargar exitosamente
   */
  onBannerImageLoadSuccess(): void {
    this.bannerImageLoading.set(false);
  }

  /**
   * Maneja cuando hay un error al cargar la imagen del banner
   */
  onBannerImageLoadError(): void {
    this.bannerImageLoading.set(false);
  }

  /**
   * Inicia la carga de la imagen del banner
   */
  onBannerImageLoadStart(): void {
    this.bannerImageLoading.set(true);
  }

  // Método para abrir el selector de archivo
  openBannerImageSelector(): void {
    this.bannerImageFileInput.nativeElement.value = '';
    this.bannerImageFileInput.nativeElement.click();
  }

  // Maneja la selección de archivo
  onBannerImageFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.imageChangedEvent = event;
      this.showCropper = true;
    }
  }

  // Recibe el recorte
  imageCropped(event: any): void {
    if (event.blob) {
      this.croppedFile = new File([event.blob], `banner_${Date.now()}.png`, { type: 'image/png' });
      this.croppedImage = event.base64 || '';
    }
  }

  async applyCrop(): Promise<void> {
    if (!this.croppedFile) return;
    this.uploadLoading.set(true);
    try {
      const tenderId = this.tenderId();
      await this.tenderService.updateTenderBannerImage(tenderId, this.croppedFile);
      this.showCropper = false;
      this.imageChangedEvent = null;
      this.croppedImage = '';
      this.croppedFile = null;
    } catch (error) {
      console.error('Error al subir la imagen del banner:', error);
    } finally {
      this.uploadLoading.set(false);
    }
  }

  cancelCrop(): void {
    this.showCropper = false;
    this.imageChangedEvent = null;
    this.croppedImage = '';
  }  tenderDateKeys = [
    { key: 'tenderStartDate', translationKey: 'TENDERS.DETAIL.PHASES.TENDER_START' },
    { key: 'inquiryDeadline', translationKey: 'TENDERS.DETAIL.PHASES.INQUIRY_DEADLINE' },
    { key: 'answerDeadline', translationKey: 'TENDERS.DETAIL.PHASES.ANSWER_DEADLINE' },
    { key: 'submissionDeadline', translationKey: 'TENDERS.DETAIL.PHASES.SUBMISSION_DEADLINE' },
    { key: 'openOfferDeadline', translationKey: 'TENDERS.DETAIL.PHASES.OPEN_OFFER_DEADLINE' },
    { key: 'aclarationsDeadline', translationKey: 'TENDERS.DETAIL.PHASES.CLARIFICATIONS_DEADLINE' },
    { key: 'answerAclarationsDeadline', translationKey: 'TENDERS.DETAIL.PHASES.ANSWER_CLARIFICATIONS_DEADLINE' },
    { key: 'awardDate', translationKey: 'TENDERS.DETAIL.PHASES.AWARD_DATE' }
  ];

  getTenderDateValue(key: string): Date | null {
    const tender = this.tender();
    if (!tender) return null;
    const value = (tender as any)[key];
    if (value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    return null;
  }

  /**
   * Determina si una fase está en el pasado (completada)
   */
  isPastPhase(phaseKey: string): boolean {
    const phaseDate = this.getTenderDateValue(phaseKey);
    if (!phaseDate) return false;
    return phaseDate < new Date();
  }

  /**
   * Determina si una fase es la actual
   */
  isCurrentPhase(phaseKey: string): boolean {
    const currentPhase = this.currentPhase();
    return currentPhase?.key === phaseKey;
  }

  /**
   * Determina si una fase está en el futuro
   */
  isFuturePhase(phaseKey: string): boolean {
    const phaseDate = this.getTenderDateValue(phaseKey);
    if (!phaseDate) return false;
    const now = new Date();
    const currentPhase = this.currentPhase();
    
    // Si es una fecha futura y no es la fase actual
    return phaseDate > now && currentPhase?.key !== phaseKey;
  }

  /**
   * Obtiene el tiempo restante hasta una fase específica
   */
  getTimeUntilPhase(phaseKey: string): string | null {
    const phaseDate = this.getTenderDateValue(phaseKey);
    if (!phaseDate) return null;
    
    const now = new Date();
    const timeDiff = phaseDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) return null;
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} día${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} min`;
    }  }

  /**
   * Intenta realizar una transición automática de estado cuando una fase expira
   * Implementa debouncing para evitar múltiples actualizaciones simultáneas
   */
  private attemptStatusTransition(expiredPhaseKey: string): void {
    // Evitar múltiples transiciones simultáneas
    if (this.statusTransitionInProgress) {
      console.log('🔄 Transición de estado ya en progreso, ignorando...');
      return;
    }

    const tender = this.tender();
    if (!tender) {
      console.warn('⚠️ No se puede realizar transición: tender no encontrado');
      return;
    }

    // Verificar si el tender ya está cerrado
    if (tender.tenderStatus === 'Cerrada') {
      console.log('📝 Tender ya está cerrado, no se requiere transición');
      return;
    }

    // Buscar el nuevo estado para la fase expirada
    const mapping = this.phaseToStatusMap.find(m => m.phaseKey === expiredPhaseKey);
    if (!mapping) {
      console.warn(`⚠️ No se encontró mapeo de estado para la fase: ${expiredPhaseKey}`);
      return;
    }

    // Verificar si ya está en el estado correcto
    if (tender.tenderStatus === mapping.newStatus) {
      console.log(`✅ Tender ya está en el estado correcto: ${mapping.newStatus}`);
      return;
    }

    console.log(`🔄 Iniciando transición automática de estado:`, {
      currentStatus: tender.tenderStatus,
      newStatus: mapping.newStatus,
      expiredPhase: expiredPhaseKey,
      tenderId: tender.id
    });

    // Marcar transición en progreso
    this.statusTransitionInProgress = true;

    // Limpiar timeout anterior si existe
    if (this.statusTransitionTimeout) {
      clearTimeout(this.statusTransitionTimeout);
    }

    // Realizar la actualización con un pequeño delay para evitar condiciones de carrera
    this.statusTransitionTimeout = setTimeout(() => {
      this.performStatusUpdate(tender.id, mapping.newStatus);
    }, 1500); // 1.5 segundos de delay para evitar múltiples requests
  }

  /**
   * Realiza la actualización del estado en la base de datos
   */
  private performStatusUpdate(tenderId: string, newStatus: TenderStatus): void {
    console.log(`📝 Actualizando estado del tender ${tenderId} a: ${newStatus}`);

    const updateData = {
      tenderStatus: newStatus,
      lastModification: Timestamp.now()
    };

    this.tenderService.updateTender(tenderId, updateData).subscribe({
      next: (result) => {
        console.log('✅ Estado del tender actualizado exitosamente:', {
          tenderId,
          newStatus,
          result
        });
        
        // Resetear flag de transición
        this.statusTransitionInProgress = false;
        
        // Limpiar timeout
        if (this.statusTransitionTimeout) {
          clearTimeout(this.statusTransitionTimeout);
          this.statusTransitionTimeout = null;
        }
      },
      error: (error) => {
        console.error('❌ Error al actualizar estado del tender:', {
          tenderId,
          newStatus,
          error
        });
        
        // Resetear flag incluso en caso de error para no bloquear futuras transiciones
        this.statusTransitionInProgress = false;
        
        // Limpiar timeout
        if (this.statusTransitionTimeout) {
          clearTimeout(this.statusTransitionTimeout);
          this.statusTransitionTimeout = null;
        }
        
        // Reintentar después de un delay más largo en caso de error
        setTimeout(() => {
          console.log('🔄 Reintentando actualización de estado...');
          this.performStatusUpdate(tenderId, newStatus);
        }, 5000); // Reintentar después de 5 segundos
      }
    });
  }
}
