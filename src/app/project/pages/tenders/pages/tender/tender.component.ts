import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Tender } from '../../models/tender-interface';
import { TenderService } from '../../services/tender.service';

@Component({
  selector: 'app-tender',
  templateUrl: './tender.component.html',
  styleUrls: ['./tender.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class TenderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tenderService = inject(TenderService);
  
  // Signals para estado del componente
  private projectId = signal<string>('');
  private tenderId = signal<string>('');
  tender = signal<Tender | undefined>(undefined);
  
  // Computed properties basadas en el servicio
  loading = computed(() => this.tenderService.loading());

  constructor() { }

  ngOnInit() {
    // Obtener los parámetros de la ruta
    this.route.params.subscribe(params => {
      const projectId = params['id'];
      const tenderId = params['tenderId'];
      
      this.projectId.set(projectId);
      this.tenderId.set(tenderId);
      
      // Configurar el contexto del proyecto en el servicio
      this.tenderService.setProjectContext(projectId);
      
      // Buscar el tender específico
      this.loadTender(tenderId);
    });
  }

  ngOnDestroy() {
    // El TenderService maneja su propia limpieza
  }

  /**
   * Carga un tender específico por ID
   */
  private loadTender(tenderId: string): void {
    const foundTender = this.tenderService.getTenderById(tenderId);
    this.tender.set(foundTender);
  }

  /**
   * Navega de vuelta a la lista de tenders
   */
  goBack(): void {
    const projectId = this.projectId();
    this.router.navigate(['/app/project', projectId, 'tenders']);
  }
}
