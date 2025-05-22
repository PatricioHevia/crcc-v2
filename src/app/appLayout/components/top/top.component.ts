import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../../core/services/theme.service';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../../layout.service';

@Component({
  selector: 'app-top',
  templateUrl: './top.component.html',
  styleUrls: ['./top.component.css'],
  imports: [
    TranslateModule,
    RouterModule,
    ButtonModule,

  ],
})
export class TopComponent  {
  theme = inject(ThemeService);
  translationService = inject(TranslationService);
  layoutService = inject(LayoutService);


  toggleDarkMode() {
    this.theme.setTheme(this.theme.isDarkTheme() ? 'light' : 'dark');
  }
  

}
