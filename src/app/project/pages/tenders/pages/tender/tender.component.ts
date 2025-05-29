import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Tender } from '../../models/tender-interface';
import { TenderService } from '../../services/tender.service';
import { TranslationService } from '../../../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tender',
  templateUrl: './tender.component.html',
  styleUrls: ['./tender.component.css'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class TenderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public tenderService = inject(TenderService);
  private translation = inject(TranslationService);
  
  // Signals para estado del componente - patrón simple como en tender-list
  private projectId = signal<string>('');
  public tenderId = signal<string>('');
  
  // Computed properties simples basadas en el servicio
  lang = computed(() => this.translation.currentLang());
  
  // Computed simplificado que usa el servicio directamente como en tender-list
  tender = computed(() => {
    const tenderId = this.tenderId();
    if (tenderId) {
      return this.tenderService.getTenderById(tenderId);
    }
    return undefined;
  });

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
    });
  }

  ngOnDestroy() {
    // El TenderService maneja su propia limpieza
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
}
