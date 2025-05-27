import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardProjectComponent } from '../../../landing/pages/components/card-project/card-project.component';
import { ProjectService } from '../../../admin/services/project.service';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ProgressSpinnerModule,
    CardProjectComponent,
    DividerModule,
    ButtonModule
  ]
})
export class ProjectsListComponent {
  
  public projectService = inject(ProjectService);
  
  // Computed para obtener la cantidad de proyectos
  projectCount = computed(() => this.projectService.projects().length);
  
  constructor() { }

  /**
   * Scroll suave hasta la sección de proyectos
   */
  scrollToProjects(): void {
    const element = document.getElementById('projects-section');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

}
