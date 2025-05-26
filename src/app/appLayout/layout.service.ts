// layout.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  showMenu = signal(true);
  showDrawer = signal(false);
  
  onMenuToggle() {
    this.showMenu.update(v => !v);
  }

  ondrawerToggle() {
    console.log('Drawer toggled');
    this.showDrawer.update(v => !v);
    console.log('Drawer state:', this.showDrawer());
  }
    
}
