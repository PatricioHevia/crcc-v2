// En: patriciohevia/crcc-v2/crcc-v2-71976733b498679b24ddd825706a5eae8f47bd2c/src/app/admin/pages/users/users.component.ts
import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { OrganizationService } from '../../../auth/services/organization.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserService } from '../../../auth/services/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Account } from '../../../auth/models/account-interface';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore'; // Importa esto

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [
    TranslateModule,
    CommonModule,
    TableModule,
    ButtonModule,
    ProgressSpinnerModule,
  ],
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private orgSvc = inject(OrganizationService);
  private translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());

  usuarios = signal<Account[]>([]);
  totalUsers = signal(0);
  loading = signal(false);
  pageSize = signal(2); // O el valor que desees por defecto

  // Mapa para guardar el último snapshot de cada página (clave: número de página (0-indexado))
  private pageSnapshots = new Map<number, QueryDocumentSnapshot<DocumentData> | undefined>();
  
  // Almacena el snapshot del último documento de la última página cargada
  private lastFetchedSnapshotForNextPage: QueryDocumentSnapshot<DocumentData> | undefined;


  organizaciones = computed(() => this.orgSvc.Organizations); //

  constructor() {}

  ngOnInit(): void {
    // onLazyLoad se disparará automáticamente al inicio
  }

  async loadUsers(event: TableLazyLoadEvent) {
    this.loading.set(true);
    console.log('LazyLoad Event:', event);

    const first = event.first || 0;
    const rows = event.rows || this.pageSize();
    const currentPageNum = Math.floor(first / rows); // Página actual (0-indexada)
    
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0] || 'createdAt'
      : event.sortField || 'createdAt';
    const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    let cursor: QueryDocumentSnapshot<DocumentData> | undefined;

    if (currentPageNum === 0) {
      // Primera página, no hay cursor
      this.pageSnapshots.clear(); // Limpiar snapshots al volver a la primera página
      cursor = undefined;
    } else {
      // Para páginas subsiguientes, intenta obtener el cursor de la página anterior
      cursor = this.pageSnapshots.get(currentPageNum - 1);
      if (!cursor) {
          
          console.warn(`No snapshot found for page ${currentPageNum - 1}. Fetching from beginning for page ${currentPageNum}. Consider fetching page by page or using offset if available.`);
          
          if (first > 0 && this.lastFetchedSnapshotForNextPage && first === this.usuarios().length) { // Asume que event.first coincide con el final de los datos actuales para "siguiente página"
             cursor = this.lastFetchedSnapshotForNextPage;
          } else {
            // Si no es una carga secuencial clara o es la primera página
            this.lastFetchedSnapshotForNextPage = undefined; // Reinicia el cursor para la llamada
            cursor = undefined;
          }
      }
    }
     console.log(`Requesting page ${currentPageNum} with cursor:`, cursor ? `Doc ID: ${cursor.id}`: 'None');


    try {
      // Obtener el total de usuarios (podrías optimizar para no llamarlo siempre)
      if (this.totalUsers() === 0 || event.first === 0) { // Solo obtener total al inicio o si no se tiene
        const total = await this.userService.getTotalUsers();
        this.totalUsers.set(total);
      }

      const result = await this.userService.fetchUsersPage(
        rows,
        sortField,
        sortOrder,
        cursor // Pasa el cursor correcto
      );
      
      this.usuarios.set(result.items);
      this.lastFetchedSnapshotForNextPage = result.newLastDocSnapshot || undefined;

      // Guardar el snapshot para la página actual si se quiere intentar soportar "página anterior"
      if (result.newLastDocSnapshot) {
        this.pageSnapshots.set(currentPageNum, result.newLastDocSnapshot);
      }
      
    } catch (error) {
      console.error('Error loading users:', error);
      // Considera resetear o mostrar un mensaje de error
    } finally {
      this.loading.set(false);
    }
  }

  getOrgName(id: string): Signal<string | null> { //
    return this.orgSvc.getOrganizationNameById(id);
  }

  onEdit(user: Account): void { //
    console.log('Edit user:', user);
  }
}