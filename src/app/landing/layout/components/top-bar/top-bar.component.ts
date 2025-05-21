import { Component, signal, computed, inject, WritableSignal, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TieredMenu, TieredMenuModule } from 'primeng/tieredmenu';


// Your Custom Modules/Services (ensure paths are correct)
import { ThemeService, ThemeOption } from '../../../../core/services/theme.service';
import { TranslationService } from '../../../../core/services/translation.service';

// Translation
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Auth
import { AuthService } from '../../../../auth/services/auth.service';


// Define MenuItem interface
export interface MenuItem {
  id: string; // Unique ID for tracking and DOM references
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  items?: MenuItem[]; // Sub-items are also MenuItems
  isParent?: boolean;
  tooltip?: string; // Tooltip text for the item
  // For managing custom dropdown/accordion visibility
  showSubmenuSignal?: WritableSignal<boolean>;
}

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    // PrimeNG
    DrawerModule,
    ButtonModule,
    RippleModule,
    SelectModule,
    IftaLabelModule, // Ensure this is correctly imported if used
    TooltipModule,
    TieredMenuModule,
    // Translation
    TranslateModule,
  ],
  templateUrl: './top-bar.component.html',
  // If IftaLabelModule is local or custom, ensure it's correctly provided or imported
  // For example, if it's another standalone component:
  // imports: [..., IftaLabelModule]
})
export default class TopBarComponent {

  private router = inject(Router);
  private auth = inject(AuthService);
  private themeService = inject(ThemeService);
  public translation = inject(TranslationService); // Your custom translation service
  private translatePipe = inject(TranslateService); // ngx-translate service for programmatic translation

  // User
  public readonly isLoggedIn = computed(() => this.auth.isLoggedIn());
  // Sidebar móvil
  sidebarOpen = signal(false);

  // Idiomas (Assuming structure from your original code)
  idiomas = signal([{
    es: [{ label: 'Español', value: 'es' }, { label: 'Inglés', value: 'en' }, { label: 'Chino', value: 'zh' }],
    en: [{ label: 'Spanish', value: 'es' }, { label: 'English', value: 'en' }, { label: 'Chinese', value: 'zh' }],
    zh: [{ label: '西班牙语', value: 'es' }, { label: '英语', value: 'en' }, { label: '中文', value: 'zh' }]
  }]);

  items = computed<any[]>(() => {
    const lang = this.translation.currentLang()
    const map = this.idiomas()[0] as Record<string, { label: string; value: 'es' | 'en' | 'zh' }[]>;
    return map[lang].map(opt => ({
      label: opt.label,
      icon: 'pi pi-globe',
      command: () => this.onLangChange(opt.value)
    }));
  });



  languageOptions = computed(() => {
    const lang = this.translation.currentLang();
    const map = this.idiomas()[0] as Record<string, { label: string, value: string }[]>;
    return map[lang] || [];
  });

  onLangChange(lang: 'es' | 'en' | 'zh'): void {
    this.translation.switchLang(lang);
  }

  // Theme
  isDark = computed(() => this.themeService.effectiveTheme() === 'dark');

  toggleTheme(): void {
    const curr = this.themeService.effectiveTheme();
    const next: ThemeOption = curr === 'dark' ? 'light' : 'dark';
    this.themeService.setTheme(next);
  }

  // Items de menú
  private baseRoutes = signal<MenuItem[]>([
    { id: 'home', label: 'TOPBAR.INICIO', icon: 'pi pi-home', route: '/' },
    { id: 'proyectos', label: 'TOPBAR.PROYECTOS', icon: 'pi pi-building', route: '/proyectos' },
    {
      id: 'participa',
      label: 'TOPBAR.PARTICIPA',
      icon: 'pi pi-users',
      isParent: true,
      showSubmenuSignal: signal(false),
      items: [
        { id: 'licitaciones', label: 'TOPBAR.LICITACIONES', icon: 'pi pi-briefcase', route: '/licitaciones' },
        { id: 'concursos', label: 'TOPBAR.CONCURSOS', icon: 'pi pi-star', route: '/concursos' }
      ]
    },
    {
      id: 'ayuda',
      label: 'TOPBAR.AYUDA',
      icon: 'pi pi-info-circle',
      isParent: true,
      showSubmenuSignal: signal(false),
      items: [
        { id: 'faq', label: 'TOPBAR.FAQ', icon: 'pi pi-question-circle', route: '/faq' },
        { id: 'contacto', label: 'TOPBAR.CONTACTO', icon: 'pi pi-envelope', route: '/contacto' }
      ]
    },
  ]);


  // Navigation items for the main bar
  public readonly navMenuItems = computed<MenuItem[]>(() => {
    const items = [...this.baseRoutes()];
    // Add the language selector to the menu items
    
    if (this.isLoggedIn()) {
      items.push({
        id: 'logout',
        label: 'AUTH.LOGOUT',
        icon: 'pi pi-sign-out',
        action: async () => {
          await this.auth.logout();
          this.router.navigate(['/login']);
        }
      });
    } else {
      items.push({
        id: 'login',
        label: 'AUTH.LOGIN',
        icon: 'pi pi-sign-in',
        route: '/auth/login'
      });
    }
    return items;
  });

  // Theme toggle item configuration
  themeToggleConfig = computed<MenuItem>(() => ({
    id: 'themeToggle',
    icon: this.isDark() ? 'pi pi-sun' : 'pi pi-moon',
    action: () => this.toggleTheme(),
    // Get translated tooltip text programmatically
    label: this.translatePipe.instant(this.isDark() ? 'TOPBAR.MODO_CLARO' : 'TOPBAR.MODO_OSCURO')
  }));

  toggleSubmenu(item: MenuItem, event?: MouseEvent): void {
    event?.stopPropagation(); // Prevent event bubbling if needed
    if (item.isParent && item.showSubmenuSignal) {
      const currentState = item.showSubmenuSignal();
      // Close all other submenus first
      this.navMenuItems().forEach(menuItem => {
        if (menuItem.id !== item.id && menuItem.isParent && menuItem.showSubmenuSignal) {
          menuItem.showSubmenuSignal.set(false);
        }
      });
      // Then toggle the current one
      item.showSubmenuSignal.set(!currentState);

    }
  }

  closeAllSubmenus(): void {
    this.navMenuItems().forEach(menuItem => {
      if (menuItem.isParent && menuItem.showSubmenuSignal) {
        menuItem.showSubmenuSignal.set(false);
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
    if (!this.sidebarOpen()) { // If sidebar is closing
      this.closeAllSubmenus();
    }
  }

  // Handle submenu item click (e.g., to close sidebar/dropdown)
  handleMenuItemClick() {
    this.closeAllSubmenus();
    if (this.sidebarOpen() && window.innerWidth < 1024) { // Close mobile sidebar if open (lg breakpoint)
      this.sidebarOpen.set(false);
    }
  }

  // You might need a host listener to close dropdowns when clicking outside
  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: MouseEvent): void {
  //   // Logic to check if the click was outside all open submenus and their triggers
  //   // This can be complex to implement correctly without a library.
  //   // For now, submenus will close if another menu item is clicked or on navigation.
  // }
}