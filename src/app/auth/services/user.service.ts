import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { QueryDocumentSnapshot } from '@angular/fire/firestore';
import { FirestoreService } from '../../core/services/firestore.service';
import type { Account } from '../models/account-interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private fs = inject(FirestoreService);
  private auth = inject(Auth);

  /** Señal del usuario autenticado (Account o null) */
  public usuario = signal<Account | null>(null);
  private userSub?: { unsubscribe: () => void };

  /** Computed que indica si el usuario actual es Admin o Super Admin */
  public readonly isAdmin = computed(() => {
    const u = this.usuario();
    return !!u && (u.role === 'Admin' || u.role === 'Super Admin');
  });

  /** Parámetros de paginación */
  private lastSnapshot?: QueryDocumentSnapshot<Account>;
  public pageSize = signal<number>(2);

  /** Señal con la lista de usuarios cargados hasta ahora */
  public usuarios = signal<Account[]>([]);
  /** Señal de estado de carga para paginación */
  public usuariosLoading = signal(false);

  constructor() {
    onAuthStateChanged(this.auth, (user: FirebaseUser | null) => {
      if (user) {
        this.initUser(user.uid);
      } else {
        this.clearUser();
      }
    });
  }

  /** Inicializa la carga del usuario actual y la primera página si es admin */
  private initUser(uid: string) {
    this.userSub?.unsubscribe();
    this.userSub = this.fs.listenOne<Account>('accounts', uid).subscribe(acc => {
      this.usuario.set(acc ?? null);
      if (this.isAdmin()) {
        this.resetPagination();
        this.loadNextPage();
      } else {
        this.resetPagination();
      }
    });
  }

  /** Limpia la señal de usuario y reinicia paginación */
  private clearUser() {
    this.userSub?.unsubscribe();
    this.usuario.set(null);
    this.resetPagination();
  }

  /** Reinicia estado de paginación */
  private resetPagination() {
    this.usuarios.set([]);
    this.lastSnapshot = undefined;
    this.usuariosLoading.set(false);
  }

  /** Carga la siguiente página de usuarios */
  public async loadNextPage() {
    if (!this.isAdmin()) return;
    this.usuariosLoading.set(true);
    try {
      const { items, lastSnapshot: next } = await this.fs.fetchPage<Account>(
        'accounts',
        this.pageSize(),
        this.lastSnapshot    // ahora puede ser 'undefined', que sí acepta la firma
      );
      this.usuarios.update(current => [...current, ...items]);
      this.lastSnapshot = next ?? undefined;

    } finally {
      this.usuariosLoading.set(false);
    }
  }

  public setPageSize(size: number) {
    if (size === this.pageSize()) return;    // si no cambió, no haces nada
    this.pageSize.set(size);                 // o this.pageSize = size; si es campo normal
    this.resetPagination();
    this.loadNextPage();
  }

  // carga la cantidad total de usuarios
  async getTotalUsers(): Promise<number> {
     return this.fs.getCount<Account>('accounts');
  }

  /** Actualiza un usuario existente */
  public update(id: string, changes: Partial<Account>) {
    return this.fs.update<Account>('accounts', id, changes);
  }

  /** Elimina un usuario por ID */
  public delete(id: string) {
    return this.fs.delete('accounts', id);
  }

  /** Obtiene un usuario por ID */
  public getById(id: string) {
    return this.fs.listenOne<Account>('accounts', id);
  }
}
