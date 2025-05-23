import { inject, Injectable, Signal, signal } from '@angular/core';
import {
    Auth,
    createUserWithEmailAndPassword,
    UserCredential,
    deleteUser,
    signInWithEmailAndPassword,
    User,
    onAuthStateChanged,
    browserLocalPersistence,
    browserSessionPersistence
} from '@angular/fire/auth';
import { FirestoreService } from '../../core/services/firestore.service';
import { OrganizationService } from './organization.service';
import { Account } from '../models/account-interface';
import { Timestamp } from '@angular/fire/firestore';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private translation = inject(TranslationService);
    private theme = inject(ThemeService);
    private auth = inject(Auth);
    private fs = inject(FirestoreService);
    private os = inject(OrganizationService);

    // Signals del usuario (auth)
    private userSignal = signal<User | null>(null);
    public readonly user: Signal<User | null> = this.userSignal.asReadonly();

    constructor() {
        // Listener permanente
        onAuthStateChanged(this.auth, user => {
            this.userSignal.set(user);
        });
    }

    // Estado de autenticación
    initAuth(): Promise<void> {
        return new Promise(resolve => {
            const unsubscribe = onAuthStateChanged(this.auth, user => {
                // tu señal ya la actualiza el constructor
                unsubscribe();   // desuscribimos solo esta llamada
                resolve();
            });
        });
    }

    isLoggedIn(): boolean {
        return !!this.userSignal();
    }

    getUid(): string | null {
        return this.userSignal()?.uid ?? null;
    }

    async getIdToken(forceRefresh = false): Promise<string> {
        const u = this.auth.currentUser;
        if (!u) throw new Error('AUTH.USER_NOT_FOUND');
        return await u.getIdToken(forceRefresh);
    }






    /** Crea credenciales en Firebase Auth con manejo de errores */
    private async registerUserAuth(email: string, password: string): Promise<UserCredential> {
        try {
            return await createUserWithEmailAndPassword(this.auth, email, password);
        } catch (err: any) {
            // Errores comunes de Firebase Auth
            switch (err.code) {
                case 'auth/email-already-in-use':
                    throw new Error('AUTH.EMAIL_ALREADY_IN_USE');
                case 'auth/invalid-email':
                    throw new Error('AUTH.INVALID_EMAIL');
                case 'auth/weak-password':
                    throw new Error('AUTH.WEAK_PASSWORD');
                default:
                    throw new Error('AUTH.UNKNOWN_ERROR');
            }
        }
    }

    /**
     * 1) Crea usuario en Auth  
     * 2) Recoge el UID  
     * 3) Arma el objeto Account  
     * 4) Almacena en Firestore con ID = UID  
     * 5) Envía correo de verificación  
     * Manejo de errores en cada paso y rollback si falla Firestore.
     */
    async registerUser(
        name: string,
        email: string,
        password: string,
        organizationId: string
    ): Promise<void> {
        let cred: UserCredential;

        try {
            // 1) Crear en Auth
            cred = await this.registerUserAuth(email, password);
        } catch (err) {
            // Ya es un Error con mensaje amigable
            return Promise.reject(err);
        }

        const uid = cred.user.uid;
        const account: Account = {
            id: uid,
            uid,
            name,
            email,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            active: true,
            deleted: false,
            role: 'Usuario Básico',
            photoURL: 'assets/images/avatars/1.png',
            permissions: [],
            offices: [],
            notifications: { email: true, push: true, app: true },
            language: this.translation.currentLang(),
            theme: this.theme.theme(),
            organization: organizationId,
        };

        try {
            // 2) Guardar en Firestore
            await this.fs.create<Account>('accounts', account, uid);
            // 3) Enviar verificación
            if (organizationId) this.os.incrementUsersCount(organizationId);
        }
        catch (err: any) {            // Rollback: eliminar usuario Auth si falla Firestore
            try {
                await deleteUser(cred.user);
            } catch (delErr) {
            }
            // Distinción de errores de Firestore (aprox.)
            if (err.code === 'permission-denied') {
                throw new Error('AUTH.PERMISSION_DENIED');
            }
            throw new Error('AUTH.UNKNOWN_ERROR');
        }
    }

    /**
     * Login del usuario con correo y contraseña
     * Manejo de errores comunes de Firebase Auth   */

    async login(email: string, password: string, remember: boolean): Promise<UserCredential> {
        const persistence = remember ? browserLocalPersistence : browserSessionPersistence;
        await this.auth.setPersistence(persistence);
        try {
            const cred = await signInWithEmailAndPassword(this.auth, email, password);
            return cred;
        }
        catch (err: any) {
            switch (err.code) {
                case 'auth/user-not-found':
                    throw new Error('AUTH.USER_NOT_FOUND');
                case 'auth/wrong-password':
                    throw new Error('AUTH.WRONG_PASSWORD');
                case 'auth/invalid-email':
                    throw new Error('AUTH.INVALID_EMAIL');
                case 'auth/user-disabled':
                    throw new Error('AUTH.USER_DISABLED');
                case 'auth/too-many-requests':
                    throw new Error('AUTH.TOO_MANY_REQUESTS');
                default:
                    console.error('[AuthService][login]', err);
                    throw new Error('AUTH.UNKNOWN_ERROR');
            }
        }
    }

    // Logout del usuario
    async logout(): Promise<void> {
        try {
            // Eliminar suscripción a eventos de Firestore (PENDIENTE)
            // Eliminar suscripción a eventos de Auth (PENDIENTE)
            await this.auth.signOut();
        } catch (err) {
            console.error('[AuthService][logout]', err);
            throw new Error('AUTH.LOGOUT_ERROR');
        }
    }

}
