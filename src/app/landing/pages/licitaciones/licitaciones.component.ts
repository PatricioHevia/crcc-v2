import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenderService } from '../../../project/pages/tenders/services/tender.service';
import { TenderCardComponent, Tender } from '../../../project/pages/tenders/index';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-licitaciones',
  templateUrl: './licitaciones.component.html',
  styleUrls: ['./licitaciones.component.css'],
  standalone: true,
  imports: [CommonModule, TenderCardComponent, TranslateModule, CardModule, ProgressSpinnerModule]
})
export class LicitacionesComponent implements OnInit {
  
  public tenderService = inject(TenderService);

  // Computed para obtener el estado de carga de las licitaciones activas
  loading = computed(() => {
    return this.tenderService.getLandingTendersLoading();
  });

  // Computed para obtener todas las licitaciones activas (ya filtradas desde Firestore)
  activeTenders = computed(() => {
    console.log('🔍 [DEBUG] Getting active tenders from landing service...');
    const activeTenders = this.tenderService.getActiveTendersForLanding();
    console.log('🔍 [DEBUG] Active tenders from service:', activeTenders.length);
    console.log('🔍 [DEBUG] Active tenders:', activeTenders.map(t => ({ name: t.name, status: t.tenderStatus })));
    return activeTenders;
  });

  constructor() { }

  ngOnInit() {
    // Inicializar el listener específico para el landing
    console.log('🚀 [DEBUG] Initializing landing tenders listener...');
    this.tenderService.initializeLandingTendersListener();
  }

  /**
   * Getter para acceso desde el template (similar al patrón de tender-list)
   */
  get filteredActiveTenders(): Tender[] {
    return this.activeTenders();
  }

  /**
   * TrackBy function para optimizar el rendering de la lista
   */
  trackByTenderId(index: number, tender: Tender): string {
    return tender.id;
  }

}
