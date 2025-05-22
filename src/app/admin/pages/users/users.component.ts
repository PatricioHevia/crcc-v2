import { Component, computed, effect, inject, Signal, signal, OnInit  } from '@angular/core';
import { OrganizationService } from '../../../auth/services/organization.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserService } from '../../../auth/services/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Account } from '../../../auth/models/account-interface';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [TranslateModule, CommonModule, TableModule],
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private orgSvc = inject(OrganizationService);
  private translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());

  usuarios: Signal<Account[]> = this.userService.usuarios;
  loading: Signal<boolean> = this.userService.usuariosLoading;
  
  // CONVERTIR totalUsers A UNA SEÑAL
  totalUsers = signal(6); // Inicializa como señal con valor 0

  organizaciones = computed(() => this.orgSvc.Organizations);

  private isCurrentUserAdmin: Signal<boolean>;

  constructor() {
    this.isCurrentUserAdmin = this.userService.isAdmin;

    // effect(() => {
    //   const isAdmin = this.isCurrentUserAdmin();
    //   console.log('[UsersComponent effect] isAdmin status changed:', isAdmin);

    //   if (isAdmin) {
    //     this.userService.getTotalUsers().then(fetchedTotal => {
    //       console.log('[UsersComponent effect] Total users fetched:', fetchedTotal);
    //       this.totalUsers.set(fetchedTotal); // Actualiza la señal
    //       // this.cdr.detectChanges(); // Probablemente ya no es necesario con señales
    //     });
    //   } else {
    //     console.log('[UsersComponent effect] User not admin or status lost, resetting totalUsers to 0.');
    //     this.totalUsers.set(0); // Actualiza la señal
    //     // this.cdr.detectChanges(); // Probablemente ya no es necesario con señales
    //   }
    // });
  }

  ngOnInit(): void {
    // La carga inicial de la primera página de usuarios ya es manejada por UserService.
    console.log('[UsersComponent ngOnInit] Component initialized.');
    // Es importante que tu UserService.getTotalUsers() no tenga la guarda `if(!this.isAdmin()) return 0;`
   
  }

  getOrgName(id: string): Signal<string | null> {
    return this.orgSvc.getOrganizationNameById(id);
  }

  onEdit(user: Account): void {
    console.log('Edit user:', user);
  }

  onPageChange(event: { first: number, rows: number }): void {
    const currentlyLoadedCount = this.usuarios().length;
    const firstItemRequestedIndex = event.first;

    console.log(
      '[UsersComponent onPageChange] Event:', event,
      'Currently Loaded:', currentlyLoadedCount,
      'Total Users:', this.totalUsers(), // Accede al valor de la señal
      'Loading:', this.loading()
    );

    if (
      firstItemRequestedIndex >= currentlyLoadedCount &&
      !this.loading() &&
      currentlyLoadedCount < this.totalUsers() // Accede al valor de la señal
    ) {
      console.log('[UsersComponent onPageChange] Calling loadNextPage()');
      this.userService.loadNextPage();
    }
  }
}