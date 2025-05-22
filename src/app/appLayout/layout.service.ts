// layout.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  showMenu = signal(true);
  
  onMenuToggle() {
    this.showMenu.update(v => !v);
  }

  
}
