import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';

import { OfertasEmpleoService } from '../../services/ofertas-empleo.service';
import { UserService } from '../../../auth/services/user.service';
import { OfertasEmpleo, Estado, TipoTrabajo, Jornada } from '../../models/ofertas-empleo.interface';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NuevoEmpleoComponent } from '../../components/nuevo-empleo/nuevo-empleo.component';
import { ActualizarEmpleoComponent } from '../../components/actualizar-empleo/actualizar-empleo.component';
import { ProjectService } from '../../services/project.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-ofertas-empleo',
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    ProgressSpinnerModule,
    InputTextModule,
    SelectModule,
    TooltipModule,
    ToolbarModule,
    FluidModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    BadgeModule,
    ConfirmDialogModule,
    ToastModule,
    CheckboxModule,
    NuevoEmpleoComponent,
    ActualizarEmpleoComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './ofertas-empleo.component.html',
  styleUrls: ['./ofertas-empleo.component.css']
})
export class OfertasEmpleoComponent {
  private ofertasService = inject(OfertasEmpleoService);
  private userService = inject(UserService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private projectService = inject(ProjectService);
  private translationService = inject(TranslationService);

  // Señales reactivas
  ofertas = computed(() => this.ofertasService.ofertas());
  loading = computed(() => this.ofertasService.ofertasLoading());
  
  // Para obtener el idioma actual y nombres de proyectos
  lang = computed(() => this.translationService.currentLang());
  projectNames = computed(() => this.projectService.projectNames());
  
  // Permisos del usuario
  canCreate = computed(() => this.userService.isSuperAdmin() || (this.userService.isAdmin() && this.userService.isMandante()));
  canEdit = computed(() => this.userService.isSuperAdmin() || (this.userService.isAdmin() && this.userService.isMandante()));
  canDelete = computed(() => this.userService.isSuperAdmin() || (this.userService.isAdmin() && this.userService.isMandante()));

  // Estado local del componente
  selectedOfertas = signal<OfertasEmpleo[]>([]);
  globalFilterValue = signal<string>('');

  // Opciones para filtros
  estadoOptions = [
    { label: 'Abierto', value: 'Abierto' },
    { label: 'Cerrado', value: 'Cerrado' },
    { label: 'En revisión', value: 'En revisión' },
    { label: 'Eliminado', value: 'Eliminado' }
  ];

  tipoTrabajoOptions = [
    { label: 'Presencial', value: 'Presencial' },
    { label: 'Híbrido', value: 'Híbrido' },
    { label: 'Remoto', value: 'Remoto' }
  ];

  jornadaOptions = [
    { label: 'Completa', value: 'Completa' },
    { label: 'Parcial', value: 'Parcial' }
  ];

  // Drawer/Dialog states
  showCreateDrawer = signal<boolean>(false);
  showEditDrawer = signal<boolean>(false);
  selectedOferta = signal<OfertasEmpleo | null>(null);

  constructor() {}

  // --- Métodos de filtrado ---
  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue.set(value);
  }

  clear(table: any) {
    table.clear();
    this.globalFilterValue.set('');
  }

  // --- Métodos CRUD ---
  
  createOferta() {
    this.selectedOferta.set(null);
    this.showCreateDrawer.set(true);
  }

  editOferta(oferta: OfertasEmpleo) {
    this.selectedOferta.set(oferta);
    this.showEditDrawer.set(true);
  }  async deleteOferta(oferta: OfertasEmpleo) {
    this.confirmationService.confirm({
      message: this.translateService.instant('JOBS.CONFIRM.DELETE_MESSAGE', { name: oferta.nombre }),
      header: this.translateService.instant('JOBS.CONFIRM.DELETE_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translateService.instant('JOBS.CONFIRM.DELETE_ACCEPT'),
      rejectLabel: this.translateService.instant('JOBS.CONFIRM.DELETE_REJECT'),
      accept: async () => {
        try {
          await this.ofertasService.deleteOferta(oferta.id);
          this.messageService.add({
            severity: 'success',
            summary: this.translateService.instant('JOBS.MESSAGES.SUCCESS_TITLE'),
            detail: this.translateService.instant('JOBS.MESSAGES.DELETE_SUCCESS')
          });
        } catch (error: any) {
          console.error('Error al eliminar oferta:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translateService.instant('JOBS.MESSAGES.ERROR_TITLE'),
            detail: error.message || this.translateService.instant('JOBS.MESSAGES.DELETE_ERROR')
          });
        }
      }
    });
  }
  async deleteSelectedOfertas() {
    const selectedOfertasList = this.selectedOfertas();
    if (selectedOfertasList.length === 0) return;

    this.confirmationService.confirm({
      message: this.translateService.instant('JOBS.CONFIRM.DELETE_MULTIPLE_MESSAGE', { count: selectedOfertasList.length }),
      header: this.translateService.instant('JOBS.CONFIRM.DELETE_MULTIPLE_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translateService.instant('JOBS.CONFIRM.DELETE_ACCEPT'),
      rejectLabel: this.translateService.instant('JOBS.CONFIRM.DELETE_REJECT'),
      accept: async () => {
        try {
          const deletePromises = selectedOfertasList.map(oferta => 
            this.ofertasService.deleteOferta(oferta.id)
          );
          
          await Promise.all(deletePromises);
          
          this.selectedOfertas.set([]);
          this.messageService.add({
            severity: 'success',
            summary: this.translateService.instant('JOBS.MESSAGES.SUCCESS_TITLE'),
            detail: this.translateService.instant('JOBS.MESSAGES.DELETE_MULTIPLE_SUCCESS', { count: selectedOfertasList.length })
          });
        } catch (error: any) {
          console.error('Error al eliminar ofertas:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translateService.instant('JOBS.MESSAGES.ERROR_TITLE'),
            detail: error.message || this.translateService.instant('JOBS.MESSAGES.DELETE_MULTIPLE_ERROR')
          });
        }
      }
    });
  }
  async cambiarEstado(oferta: OfertasEmpleo, nuevoEstado: Estado) {
    try {
      await this.ofertasService.cambiarEstadoOferta(oferta.id, nuevoEstado);
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('JOBS.MESSAGES.SUCCESS_TITLE'),
        detail: this.translateService.instant('JOBS.MESSAGES.STATUS_CHANGE_SUCCESS', { status: nuevoEstado })
      });
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('JOBS.MESSAGES.ERROR_TITLE'),
        detail: error.message || this.translateService.instant('JOBS.MESSAGES.STATUS_CHANGE_ERROR')
      });
    }
  }
  // --- Métodos de utilidad ---
  
  // Métodos helper para mostrar contenido traducido
  getOfertaName(oferta: OfertasEmpleo): string {
    const lang = this.lang();
    const key = `nombre_${lang}` as 'nombre_es' | 'nombre_en' | 'nombre_zh';
    return oferta[key] || oferta.nombre_es || oferta.nombre || '';
  }

  getOfertaDescription(oferta: OfertasEmpleo): string {
    const lang = this.lang();
    const key = `descripcion_${lang}` as 'descripcion_es' | 'descripcion_en' | 'descripcion_zh';
    return oferta[key] || oferta.descripcion_es || oferta.descripcion || '';
  }

  getProjectName(projectId: string): string {
    const projectNamesMap = this.projectNames();
    const lang = this.lang();
    
    if (projectNamesMap[projectId]) {
      const names = projectNamesMap[projectId];
      switch (lang) {
        case 'es': return names.es;
        case 'en': return names.en;
        case 'zh': return names.zh;
        default: return names.es;
      }
    }
    return projectId; // Fallback al ID si no se encuentra el proyecto
  }

  getSeverity(estado: Estado): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    switch (estado) {
      case 'Abierto': return 'success';
      case 'Cerrado': return 'secondary';
      case 'En revisión': return 'warning';
      case 'Eliminado': return 'danger';
      default: return 'info';
    }
  }

  getTranslatedEstado(estado: Estado): string {
    switch (estado) {
      case 'Abierto': return this.translateService.instant('JOBS.STATUS.OPEN');
      case 'Cerrado': return this.translateService.instant('JOBS.STATUS.CLOSED');
      case 'En revisión': return this.translateService.instant('JOBS.STATUS.UNDER_REVIEW');
      case 'Eliminado': return this.translateService.instant('JOBS.STATUS.DELETED');
      default: return estado;
    }
  }

  isOfertaActive(oferta: OfertasEmpleo): boolean {
    return !oferta.eliminado && 
           oferta.estado === 'Abierto' && 
           oferta.fechaCierre.toDate() > new Date();
  }
  

  isDateExpired(timestamp: any): boolean {
    if (!timestamp) return false;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date < new Date();
  }

  // --- Eventos de drawer ---
  
  onOfertaSaved() {
    this.showCreateDrawer.set(false);
    this.showEditDrawer.set(false);
    this.selectedOferta.set(null);
  }

  closeCreateDrawer() {
    this.showCreateDrawer.set(false);
    this.selectedOferta.set(null);
  }

  closeEditDrawer() {
    this.showEditDrawer.set(false);
    this.selectedOferta.set(null);
  }
}
