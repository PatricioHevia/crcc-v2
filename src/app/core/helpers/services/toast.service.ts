import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TranslationService } from './translation.service';

@Injectable({ providedIn: 'root' })
export class ToastService {

  constructor(
    private messageService: MessageService,
    private translationService: TranslationService
  ) {}

  show(
    key: string,
    type: 'success' | 'info' | 'warn' | 'error',
    summaryKey: string,
    detailKey?: string,
    life = 3000
  ) {
    const summary = this.translationService.instant(summaryKey);
    const detail  = detailKey
      ? this.translationService.instant(detailKey)
      : undefined;

    this.messageService.add({
      severity: type,
      summary,
      detail,
      life,
      key: key
    });
  }

  success(summaryKey: string, detailKey?: string, life?: number) {
    this.show('global','success', summaryKey, detailKey, life);
  }

  info(summaryKey: string, detailKey?: string, life?: number) {
    this.show('global','info', summaryKey, detailKey, life);
  }

  warn(summaryKey: string, detailKey?: string, life?: number) {
    this.show('global','warn', summaryKey, detailKey, life);
  }

  error(summaryKey: string, detailKey?: string, life?: number) {
    this.show('global','error', summaryKey, detailKey, life);
  }
}
