import { Component, computed, inject } from '@angular/core';
import { ContactoService } from '../contacto.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '../../../../core/services/translation.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-ver-mensajes',
  templateUrl: './ver-mensajes.component.html',
  styleUrls: ['./ver-mensajes.component.css'],
  imports: [CommonModule, TableModule, ButtonModule, TranslateModule, TooltipModule],
})
export class VerMensajesComponent  {
  readonly contactoService = inject(ContactoService);
  readonly translationService = inject(TranslationService);
  lang = computed(() => this.translationService.currentLang());
  loading = false;

  onMarkAsRead(id: string): void {
    this.contactoService.markAsRead(id);
  }

  onMarkAsUnread(id: string): void {
    this.contactoService.markAsUnread(id);
  }

}
