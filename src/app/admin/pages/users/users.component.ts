// In src/app/admin/pages/users/users.component.ts
import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { OrganizationService } from '../../../auth/services/organization.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserService } from '../../../auth/services/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TableModule, TableLazyLoadEvent } from 'primeng/table'; // Import TableLazyLoadEvent
import { Account } from '../../../auth/models/account-interface';
import { ButtonModule } from 'primeng/button'; // For pButton
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // For loading indicator
import { QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore'; // For snapshot typing

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
export class UsersComponent implements OnInit { // OnInit might be optional
  private userService = inject(UserService);
  private orgSvc = inject(OrganizationService);
  private translationService = inject(TranslationService);

  lang = computed(() => this.translationService.currentLang());

  // Signals for table data and state
  usuarios = signal<Account[]>([]);
  totalUsers = signal(0);
  loading = signal(false);
  
  pageSize = signal(2); // Default page size, matches your current [rows]

  // To store the snapshot of the last document of the current page, for 'next page' type logic
  // This is a simplified cursor management. For true random access with `startAfter` from `event.first`,
  // the logic in `WorkspaceLazyData` or here would need to be more advanced.
  private lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | undefined;
  private firstDocSnapshot: QueryDocumentSnapshot<DocumentData> | undefined;


  organizaciones = computed(() => this.orgSvc.Organizations);

  constructor() {}

  ngOnInit(): void {
    // The p-table with lazy=true will call onLazyLoad on initialization.
    // No explicit call to loadUsers needed here typically.
    // If you wanted to ensure totalUsers is known early for other UI elements,
    // you could fetch it separately, but onLazyLoad will provide it anyway.
  }

  async loadUsers(event: TableLazyLoadEvent) {
    this.loading.set(true);
    console.log('LazyLoad Event:', event);

    // Set rows from event or default from component's pageSize signal
    event.rows = event.rows || this.pageSize();

    // Simplistic snapshot management for sequential paging with `startAfter`.
    // `event.first` gives an offset. Translating offset to Firestore cursors without `offset()` is tricky.
    // This example doesn't fully implement `startAfter` from `event.first` for random jumps
    // without a more complex cursor retrieval strategy in the service.
    // The `WorkspaceLazyData` currently doesn't use `startAfter` based on `event.first`.
    // It would fetch the "first page" according to sort/filter and limit.
    // To truly paginate with `startAfter` for page 2, 3, etc., you need the snapshot of the
    // last item of the *previous* page. `event.first` makes this harder.

    // If your `WorkspaceLazyData` is modified to accept a startAfterDocument snapshot:
    // if (event.first !== 0 && this.lastDocSnapshot) {
    //   (event as any).snapshotForStartAfter = this.lastDocSnapshot;
    // }


    try {
      const result = await this.userService.getUsersLazy(event);
      
      // Store snapshots if your service provides them and you want to implement more precise cursor pagination
      // This depends on `WorkspaceLazyData` returning items with their snapshots
      const itemsWithSnapshots = result.items as (Account & { _snapshot?: QueryDocumentSnapshot<DocumentData> })[];
      this.usuarios.set(itemsWithSnapshots.map(item => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _snapshot, ...rest } = item; // Exclude snapshot from stored user data if not needed directly
        return rest as Account;
      }));
      
      if (itemsWithSnapshots.length > 0) {
        this.firstDocSnapshot = itemsWithSnapshots[0]._snapshot;
        this.lastDocSnapshot = itemsWithSnapshots[itemsWithSnapshots.length - 1]._snapshot;
      } else {
        this.firstDocSnapshot = undefined;
        this.lastDocSnapshot = undefined;
      }

      this.totalUsers.set(result.totalRecords);
    } catch (error) {
      console.error('Error loading users:', error);
      this.usuarios.set([]);
      this.totalUsers.set(0);
      // Consider showing a toast message here
    } finally {
      this.loading.set(false);
    }
  }

  getOrgName(id: string): Signal<string | null> {
    return this.orgSvc.getOrganizationNameById(id);
  }

  onEdit(user: Account): void {
    console.log('Edit user:', user);
    // Implement edit logic
  }
}