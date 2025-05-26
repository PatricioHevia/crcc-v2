import { Component, inject, signal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { MenuComponent } from '../menu/menu.component';
import { LayoutService } from '../../layout.service';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../core/services/theme.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.css'],
  imports:[ DrawerModule, MenuComponent, TranslateModule, ButtonModule ]
})
export class DrawerComponent  {
  // Para controlar la visibilidad del drawer
  public layoutService = inject(LayoutService);
  public theme = inject(ThemeService);
  
  

}
