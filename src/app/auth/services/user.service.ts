// src/app/auth/services/user.service.ts

import { Injectable, inject, signal, computed, effect, WritableSignal, Signal, NgZone } from '@angular/core'; // NgZone ya no es necesaria aquí si FirestoreService la maneja
import { Auth, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { FirestoreCollectionEvent, FirestoreService } from '../../core/services/firestore.service'; // Asumiendo que FirestoreCollectionEvent está exportada o definida aquí
import { orderBy, where, QueryConstraint } from '@angular/fire/firestore';
import type { Account } from '../models/account-interface';
import type { Organization } from '../models/organization-interface';
import { Subscription, Observable } from 'rxjs';
import { TranslationService } from '../../core/services/translation.service';

// Definimos FirestoreCollectionEvent aquí si no está exportada desde firestore.service
// interface FirestoreCollectionEvent<T> {
//   items: T[];
//   fromCache: boolean;
//   hasPendingWrites: boolean;
// }


@Injectable({ providedIn: 'root' })
export class UserService {
  private fs = inject(FirestoreService);
  private auth = inject(Auth);
  private translationService = inject(TranslationService);
  // private zone = inject(NgZone); // No es necesario aquí si FirestoreService ya usa NgZone en sus métodos internos de onSnapshot

  // --- señales internas ---
  private isLoadingAccount = signal<boolean>(false);
  private authStateDetermined = signal<boolean>(false);

  // --- estado del usuario autenticado ---
  public usuario = signal<Account | null>(null);
  public orgUsuario = signal<Organization | null>(null);

  // --- lista de usuarios para admins ---
  public allUsersForAdmin = signal<Account[]>([]);
  public allUsersLoading = signal<boolean>(false);

  // Suscripción para el listener de allUsersForAdmin
  private allUsersListenerSubscription: Subscription | null = null;
  // Suscripciones para los listeners de usuario y organización en initUser
  private userSubscription: Subscription | null = null;
  private orgUserSubscription: Subscription | null = null;


  // --- getters reactivos ---
  public readonly isAdmin = computed(() => {
    const u = this.usuario();
    return !!u && (u.role === 'Admin' || u.role === 'Super Admin');
  });

  public readonly isSuperAdmin = computed(() => {
    const u = this.usuario();
    return !!u && u.role === 'Super Admin';
  });

  public readonly isMandante = computed(() => {
    const o = this.orgUsuario();
    return !!o && o.type === 'MANDANTE';
  });

  public readonly isUserAccountResolved = computed(() => {
    if (!this.authStateDetermined()) return false;
    // Si no hay usuario autenticado y no estamos cargando la cuenta (ya se intentó y falló o es anónimo)
    if (this.auth.currentUser === null && !this.isLoadingAccount()) return true;
    // Si hay usuario autenticado y ya no estamos cargando su info de 'accounts' y 'organizations'
    if (this.auth.currentUser !== null && this.usuario() !== null && !this.isLoadingAccount()) return true;
    return false;
  });

  constructor() {
    onAuthStateChanged(this.auth, (user: FirebaseUser | null) => {
      if (user) {
        this.initUser(user.uid);
        this.authStateDetermined.set(true);
      } else {
        this.clearUser();
        this.authStateDetermined.set(true);
      }
    });    effect((onCleanup) => {
      const isAdminUser = this.isAdmin();
      const isSuperAdminUser = this.isSuperAdmin();
      const currentUserOrg = this.orgUsuario(); // Para obtener el ID para el filtro
      const isCurrentUserMandante = this.isMandante();

      onCleanup(() => {
        this.allUsersListenerSubscription?.unsubscribe();
        this.allUsersListenerSubscription = null;
      });

      if (!isAdminUser) {
        this.allUsersForAdmin.set([]);
        this.allUsersLoading.set(false);
        return; // Salir si no es admin, la limpieza ya se registró.
      }

      // --- Lógica para Admin ---
      this.allUsersLoading.set(true); // Indicar que estamos cargando la lista de usuarios.

      // Super Admin siempre ve todos los usuarios, independiente de si es Mandante o no
      // Mandante (que no sea Super Admin) también ve todos los usuarios
      // Admin regular solo ve usuarios de su organización
      const filtros: QueryConstraint[] = (isSuperAdminUser || isCurrentUserMandante)
        ? [orderBy('name')]
        : [
          where('organization', '==', currentUserOrg?.id ?? '__NO_ORG_ID_PLACEHOLDER__'),
          orderBy('name')
        ];
      this.allUsersListenerSubscription = this.fs.listenCollectionWithMetadata<Account>('accounts', filtros).subscribe({  
        next: (event: FirestoreCollectionEvent<Account>) => {
          this.allUsersForAdmin.set(event.items);
          if (this.allUsersLoading()) { // Solo poner loading a false en la primera emisión de datos
            this.allUsersLoading.set(false);
          }
        },
        error: (err) => {
          this.allUsersForAdmin.set([]);
          this.allUsersLoading.set(false);
        }
      });
    });
  }

  private initUser(uid: string) {
    this.userSubscription?.unsubscribe();
    this.orgUserSubscription?.unsubscribe();
    this.isLoadingAccount.set(true);
    this.usuario.set(null); // Limpiar datos previos mientras carga
    this.orgUsuario.set(null);

    this.userSubscription = this.fs.listenOneWithMetadata<Account>('accounts', uid).subscribe({
      next: userEvent => { // userEvent es FirestoreDocumentEvent<Account>
        this.usuario.set(userEvent.item);

        // Log para la fuente de datos del usuario
        if (userEvent.item) {
          const sourceMsg = userEvent.fromCache ? 'CACHÉ' + (userEvent.hasPendingWrites ? ' (escrituras pendientes)' : '') : 'SERVIDOR';
        } else if (!userEvent.fromCache) { // Documento no existe y la info es del servidor
        }

        const orgId = userEvent.item?.organization ?? '';
        if (orgId) {
          this.orgUserSubscription?.unsubscribe(); // Limpiar subscripción previa de org
          this.orgUserSubscription = this.fs.listenOneWithMetadata<Organization>('organizations', orgId).subscribe({
            next: orgEvent => { // orgEvent es FirestoreDocumentEvent<Organization>
              this.orgUsuario.set(orgEvent.item);

              // Log para la fuente de datos de la organización
              if (orgEvent.item) {
                const sourceMsg = orgEvent.fromCache ? 'CACHÉ' + (orgEvent.hasPendingWrites ? ' (escrituras pendientes)' : '') : 'SERVIDOR';
              } else if (!orgEvent.fromCache) {
              }
              this.isLoadingAccount.set(false); // Se considera cargado después de intentar cargar la org
            },
            error: (err) => {
              this.orgUsuario.set(null);
              this.isLoadingAccount.set(false);
            }
          });
        } else {
          this.orgUsuario.set(null);
          this.isLoadingAccount.set(false); // No hay org, se termina la carga
        }
      },
      error: (err) => {
        this.usuario.set(null);
        this.orgUsuario.set(null);
        this.isLoadingAccount.set(false);
      }
    });
  }

  private clearUser() {
    this.userSubscription?.unsubscribe();
    this.userSubscription = null;
    this.orgUserSubscription?.unsubscribe();
    this.orgUserSubscription = null;
    // La suscripción de allUsersListenerSubscription se limpiará por el onCleanup del effect cuando isAdmin() cambie a false.

    this.usuario.set(null);
    this.orgUsuario.set(null);
    this.allUsersForAdmin.set([]);
    this.allUsersLoading.set(false);
    this.isLoadingAccount.set(false);
    this.authStateDetermined.set(false); // Resetear para el próximo flujo de autenticación
  }

  // --- Métodos CRUD ---
  public update(id: string, changes: Partial<Account>) {
    return this.fs.update<Account>('accounts', id, changes);
  }

  public delete(id: string) {
    return this.fs.delete('accounts', id);
  }

  public getById(id: string): Observable<Account | null> {
    return this.fs.listenOne<Account>('accounts', id);
  }

  // --- Métodos del Dashboard ---
  public async getDashboardSummary() {
    try {      // Obtener todos los usuarios para los cálculos del dashboard
      const allUsers = this.allUsersForAdmin();
      
      // Si no hay datos de usuarios disponibles, retornar datos vacíos
      if (!allUsers || allUsers.length === 0) {
        return {
          overview: {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            totalOrganizations: 0,
            newUsersThisMonth: 0
          },
          recentUsers: [],
          monthlyData: this.generateEmptyMonthlyData(),
          roleDistribution: []
        };
      }
      
      // Calcular estadísticas generales
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(user => user.active === true).length;
      const inactiveUsers = totalUsers - activeUsers;
      
      // Obtener conteo de organizaciones (simplificado - puede que necesites obtenerlo de una colección separada)
      const totalOrganizations = new Set(allUsers.map(user => user.organization).filter(Boolean)).size;
      
      // Calcular nuevos usuarios este mes
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();      const newUsersThisMonth = allUsers.filter(user => {
        if (!user.createdAt) return false;
        const userDate = user.createdAt.toDate();
        return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
      }).length;      // Obtener usuarios recientes (últimos 10)
      const recentUsers = allUsers
        .filter(user => user.createdAt)
        .sort((a, b) => b.createdAt!.toMillis() - a.createdAt!.toMillis())
        .slice(0, 10)
        .map(user => ({
          id: parseInt(user.id || '0'),
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'USER',
          createdAt: user.createdAt!.toDate().toISOString()
        }));      // Generar datos mensuales para los últimos 6 meses
      const monthlyData = [];
      const currentLang = this.translationService.currentLang();
      
      // Mapeo de idiomas a locales
      const localeMap: Record<'es' | 'en' | 'zh', string> = {
        'es': 'es-ES',
        'en': 'en-US', 
        'zh': 'zh-CN'
      };
      
      const locale = localeMap[currentLang] || 'es-ES';
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthName = date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
        
        const usersInMonth = allUsers.filter(user => {
          if (!user.createdAt) return false;
          const userDate = user.createdAt.toDate();
          return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear();
        }).length;
        
        monthlyData.push({
          month: monthName,
          users: usersInMonth
        });
      }

      // Calcular distribución por rol
      const roleCounts = allUsers.reduce((acc, user) => {
        const role = user.role || 'USER';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const roleDistribution = Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count
      }));

      return {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalOrganizations,
          newUsersThisMonth
        },
        recentUsers,
        monthlyData,
        roleDistribution
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      throw error;
    }
  }

  private generateEmptyMonthlyData() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      monthlyData.push({
        month: monthName,
        users: 0
      });
    }
    
    return monthlyData;
  }
}