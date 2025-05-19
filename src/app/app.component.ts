import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from './core/services/translation.service';
import { PrimeNG } from 'primeng/config';
import { ThemeService } from './core/services/theme.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonModule,
    TranslateModule,
    ToastModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    public ts: TranslationService,
    private config: PrimeNG,
    public themeService: ThemeService
  ) {}
  
  ngOnInit(): void {
    this.config.ripple.set(true); // Activar el efecto de "ripple" en PrimeNG
  }

 switchLang(lang: 'es' | 'en' |'zh'): void {
    this.ts.switchLang(lang);
  }
}
