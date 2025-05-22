// In src/app/auth/services/user.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
// QueryDocumentSnapshot might still be needed if you manage cursors for startAfter
import { DocumentData, QueryDocumentSnapshot } from '@angular/fire/firestore';
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

  constructor() { //
    onAuthStateChanged(this.auth, (user: FirebaseUser | null) => {
      if (user) {
        this.initUser(user.uid);
      } else {
        this.clearUser();
      }
    });
  }

  private initUser(uid: string) { //
    this.userSub?.unsubscribe();
    this.userSub = this.fs.listenOne<Account>('accounts', uid).subscribe(acc => {
      this.usuario.set(acc ?? null);
    });
  }

  private clearUser() { //
    this.userSub?.unsubscribe();
    this.usuario.set(null);
  }

  public async getTotalUsers(): Promise<number> { //
    if (!this.isAdmin()) return 0;
    return this.fs.getCount('accounts'); // Asegúrate que tu fs tiene getCount
  }

  public async fetchUsersPage(
    pageSize: number,
    orderByField: string = 'createdAt', // Default sort
    sortDir: 'asc' | 'desc' = 'desc',
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ items: Account[]; newLastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null }> {
    if (!this.isAdmin()) {
      return { items: [], newLastDocSnapshot: null };
    }

    const result = await this.fs.getPaginatedCollectionAdvanced<Account>(
      'accounts',
      orderByField,
      sortDir,
      pageSize,
      startAfterDoc
    );
    return { items: result.data, newLastDocSnapshot: result.lastDocSnapshot };
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