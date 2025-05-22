// src/app/auth/services/user.service.ts
import { Injectable, inject, signal, computed, WritableSignal, effect, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Auth, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { FirestoreService } from '../../core/services/firestore.service';
import type { Account } from '../models/account-interface';
import { orderBy, QueryConstraint, where } // Importa 'where' para filtrar por organización
from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { OrganizationService } from './organization.service'; // Necesario para verificar tipo de organización

@Injectable({ providedIn: 'root' })
export class UserService {
  private fs = inject(FirestoreService);
  private auth = inject(Auth);
  private orgService = inject(OrganizationService); // Inyecta OrganizationService
  private injector = inject(EnvironmentInjector); // Inyecta EnvironmentInjector


  public usuario = signal<Account | null>(null);
  private userSub?: any;

  public readonly isAdmin = computed(() => {
    const u = this.usuario();
    return !!u && (u.role === 'Admin' || u.role === 'Super Admin');
  });

  public readonly isSuperAdmin = computed(() => { //
    const u = this.usuario();
    return !!u && u.role === 'Super Admin';
  });


  public allUsersForAdmin: WritableSignal<Account[]> = signal([]);
  public allUsersLoading: WritableSignal<boolean> = signal(false);

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
    this.userSub?.unsubscribe?.();
    this.userSub = this.fs.listenOne<Account>('accounts', uid).subscribe(acc => {
      this.usuario.set(acc ?? null);
      // La carga de usuarios ahora dependerá de la lógica en loadUsersBasedOnRoleAndOrganization
      this.loadUsersBasedOnRoleAndOrganization();
    });
  }

  private clearUser() {
    this.userSub?.unsubscribe?.();
    this.usuario.set(null);
    this.allUsersForAdmin.set([]);
    this.allUsersLoading.set(false);
  }

  private async loadUsersBasedOnRoleAndOrganization() {
    const currentUser = this.usuario();
    if (!currentUser) {
      this.allUsersForAdmin.set([]);
      this.allUsersLoading.set(false);
      return;
    }

    this.allUsersLoading.set(true);
    let users: Account[] = [];
    let constraints: QueryConstraint[] = [orderBy('name', 'asc')]; // Ordenamiento base

    try {
      const isCurrentUserAdminOrSuper = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

      if (currentUser.organization) {
        // Usamos runInInjectionContext para poder usar computed properties (isMandante) aquí
        await runInInjectionContext(this.injector, async () => {
          const isMandante = this.orgService.isMandante(currentUser.organization!);
          if ((isCurrentUserAdminOrSuper) && isMandante()) {
            // Admin/SuperAdmin en Org "Mandante" -> Carga TODOS los usuarios
            users = await this.fs.getAll<Account>('accounts', constraints);
          } else if (currentUser.role === 'Admin' && currentUser.organization && !isMandante()) {
            // Admin, NO en Org "Mandante" -> Carga usuarios de SU organización
            constraints.push(where('organization', '==', currentUser.organization));
            users = await this.fs.getAll<Account>('accounts', constraints);
          } else if (this.isSuperAdmin()) {
            // SuperAdmin (independiente de la organización) -> Carga TODOS los usuarios
             users = await this.fs.getAll<Account>('accounts', constraints);
          }
          // Para otros roles o casos, `users` permanecerá vacío o puedes definir otra lógica.
        });
      } else if (this.isSuperAdmin()) {
        // SuperAdmin sin organización (si es posible) -> Carga TODOS los usuarios
         users = await this.fs.getAll<Account>('accounts', constraints);
      }
      // Si no es Admin/SuperAdmin o no cumple las condiciones, `users` podría quedar vacío.
      // O podrías querer cargar solo el usuario actual si no es admin.
      // if (!isCurrentUserAdminOrSuper && !this.isSuperAdmin()) {
      //   users = currentUser ? [currentUser] : [];
      // }


      this.allUsersForAdmin.set(users);
    } catch (error) {
      console.error("Error loading users based on role and organization:", error);
      this.allUsersForAdmin.set([]);
    } finally {
      this.allUsersLoading.set(false);
    }
  }  

  public update(id: string, changes: Partial<Account>) {
    return this.fs.update<Account>('accounts', id, changes);
  }

  public delete(id: string) {
    return this.fs.delete('accounts', id);
  }

  public getById(id: string): Observable<Account | null> {
    return this.fs.listenOne<Account>('accounts', id);
  }
}