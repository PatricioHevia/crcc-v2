import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';
import { Project } from '../../../../core/models/project-interface';
import { GalleriaModule } from 'primeng/galleria';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { TranslationService } from '../../../../core/helpers/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { register  } from 'swiper/element/bundle';
import { DividerModule } from 'primeng/divider';

register();


@Component({
  selector: 'app-card-project',
  templateUrl: './card-project.component.html',
  styleUrls: ['./card-project.component.css'],
  imports: [GalleriaModule, TagModule, RouterModule, ButtonModule, ImageModule, TranslateModule, DividerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CardProjectComponent  {
  public project = input.required<Project>();

  // Translation
  public translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());

  localizedField( field: string): string {
    const key = `${field}_${this.lang()}` as keyof Project;
    return this.project()[key] as string;
  }



}
