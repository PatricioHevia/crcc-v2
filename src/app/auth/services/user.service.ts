// In src/app/auth/services/user.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
// QueryDocumentSnapshot might still be needed if you manage cursors for startAfter
import { QueryDocumentSnapshot } from '@angular/fire/firestore'; 
import { FirestoreService } from '../../core/services/firestore.service';
import type { Account } from '../models/account-interface';
import { TableLazyLoadEvent } from 'primeng/table'; // Import PrimeNG type

@Injectable({ providedIn: 'root' })
export class UserService {
  private fs = inject(FirestoreService);
  private auth = inject(Auth);

  public usuario = signal<Account | null>(null);
  private userSub?: { unsubscribe: () => void };

  public readonly isAdmin = computed(() => {
    const u = this.usuario();
    // Updated role check based on your file
    return !!u && (u.role === 'Admin' || u.role === 'Super Admin'); //
  });

  // Remove old pagination signals and methods if UsersComponent now handles its own state
  // public pageSize = signal<number>(2); // This can be a default in the component
  // public usuarios = signal<Account[]>([]); // Component will manage this signal
  // public usuariosLoading = signal(false); // Component will manage this signal
  // private lastSnapshot?: QueryDocumentSnapshot<Account>; // Cursor management will change

  constructor() {
    onAuthStateChanged(this.auth, (user: FirebaseUser | null) => {
      if (user) {
        this.initUser(user.uid);
      } else {
        this.clearUser();
      }
    });
  }

  private initUser(uid: string) {
    this.userSub?.unsubscribe();
    this.userSub = this.fs.listenOne<Account>('accounts', uid).subscribe(acc => {
      this.usuario.set(acc ?? null);
      // No automatic user list loading for admin here;
      // UsersComponent will trigger its load via onLazyLoad.
    });
  }

  private clearUser() {
    this.userSub?.unsubscribe();
    this.usuario.set(null);
  }

  // This method might still be useful if needed elsewhere, or for the initial totalRecords.
  public async getTotalUsers(): Promise<number> {
     if (!this.isAdmin()) return 0; // Guard it if called independently
     return this.fs.getCount<Account>('accounts'); //
  }

  // NEW method for lazy loading users
  public async getUsersLazy(
    event: TableLazyLoadEvent
  ): Promise<{ items: Account[]; totalRecords: number }> {
    if (!this.isAdmin()) {
      return { items: [], totalRecords: 0 };
    }
    // Pass the event to the FirestoreService. Default sort can be set here or in FirestoreService.
    // The `_snapshot` field added in firestore.service can be used by the component
    // to manage cursors for `startAfter` if you build that more advanced pagination.
    return this.fs.fetchLazyData<Account>('accounts', event, 'createdAt', 'desc');
  }

  // update, delete, getById methods from your existing service...
  public update(id: string, changes: Partial<Account>) { //
    return this.fs.update<Account>('accounts', id, changes);
  }

  public delete(id: string) { //
    return this.fs.delete('accounts', id);
  }

  public getById(id: string) { //
    return this.fs.listenOne<Account>('accounts', id);
  }
}