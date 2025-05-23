import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleriaModule } from 'primeng/galleria';
import { CardProjectComponent } from '../components/card-project/card-project.component';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProjectService } from '../../../admin/services/project.service';

@Component({
  selector: 'app-proyectos',
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.css'],
  imports: [CommonModule, GalleriaModule, CardProjectComponent, TranslateModule, ProgressSpinnerModule],
})
export class ProyectosComponent  {
  
  public projectService = inject(ProjectService);
  


}
