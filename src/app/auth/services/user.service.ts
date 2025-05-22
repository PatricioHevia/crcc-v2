// src/app/auth/services/user.service.ts
import { Injectable, inject, signal, computed, WritableSignal } from '@angular/core';
import { Auth, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { FirestoreService } from '../../core/services/firestore.service';
import type { Account } from '../models/account-interface';
import { orderBy, QueryConstraint } from '@angular/fire/firestore'; // Importa orderBy y QueryConstraint
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private fs = inject(FirestoreService);
  private auth = inject(Auth);

  public usuario = signal<Account | null>(null); //
  private userSub?: any; // Puede ser Unsubscribe de RxJS o de Firestore

  public readonly isAdmin = computed(() => { //
    const u = this.usuario();
    return !!u && (u.role === 'Admin' || u.role === 'Super Admin');
  });

  

  // Señales para la lista completa de usuarios y estado de carga
  public allUsersForAdmin: WritableSignal<Account[]> = signal([]);
  public allUsersLoading: WritableSignal<boolean> = signal(false);

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
    this.userSub?.unsubscribe?.(); // Si userSub es una suscripción RxJS o de Firestore
    this.userSub = this.fs.listenOne<Account>('accounts', uid).subscribe(acc => {
      this.usuario.set(acc ?? null);
      if (this.isAdmin()) {
        this.loadAllUsersForAdmin(); // Cargar todos los usuarios si es admin
      } else {
        this.allUsersForAdmin.set([]); // Limpiar si no es admin
      }
    });
  }

  private clearUser() { //
    this.userSub?.unsubscribe?.();
    this.usuario.set(null);
    this.allUsersForAdmin.set([]);
    this.allUsersLoading.set(false);
  }

  private async loadAllUsersForAdmin() {
    if (!this.isAdmin()) {
      this.allUsersForAdmin.set([]);
      return;
    }
    this.allUsersLoading.set(true);
    try {
      // Ordenar por un campo, ej. 'name' o 'createdAt', para consistencia inicial
      const constraints: QueryConstraint[] = [orderBy('name', 'asc')];
      const users = await this.fs.getAll<Account>('accounts', constraints);
      this.allUsersForAdmin.set(users);
    } catch (error) {
      console.error("Error loading all users for admin:", error);
      this.allUsersForAdmin.set([]); // En caso de error, lista vacía
    } finally {
      this.allUsersLoading.set(false);
    }
  }
  
  // getTotalUsers ya no es necesario para el paginador si cargas todos,
  // pero puede ser útil para otros propósitos.
  public async getTotalUsers(): Promise<number> { //
    if (!this.isAdmin()) return 0;
    return this.fs.getCount('accounts');
  }

  // getUsersLazy y fetchUsersPage ya no serían necesarios para esta tabla
  // Mantenemos update, delete, getById
  public update(id: string, changes: Partial<Account>) { //
    return this.fs.update<Account>('accounts', id, changes);
  }

  public delete(id: string) { //
    return this.fs.delete('accounts', id);
  }

  public getById(id: string): Observable<Account | null> { //
    return this.fs.listenOne<Account>('accounts', id);
  }
}