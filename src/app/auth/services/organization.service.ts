import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { StorageService } from '../../core/services/storage.service';
import { Organization, OrganizationForm } from '../models/organization-interface';
import { Timestamp } from 'firebase/firestore';
import { ProjectService } from '../../core/services/project.service';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
    private readonly fs = inject(FirestoreService);
    private readonly storage = inject(StorageService);

    // Aquí guardamos el listener SOLO tras arrancarlo cuando un usuario es administrador
    private listener: { data: Signal<Organization[]>; loading: Signal<boolean>; } | null = null;

    // Aqui guardamos el listener de una sola organización se ejecuta cuando el estado del usuario cambia.
    private organizationUser = signal<Organization | null>(null);


    // meotodo para crear una organización
    crearOrganizacion(organizacionForm: OrganizationForm): Promise<void> {
        // volcamos los datos que faltan sin la id
        const organization: Omit<Organization, 'id'> = {
            ...organizacionForm,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            usersCount: 0,
            active: true,
            deleted: false,
        };
        return this.fs.create<Omit<Organization, 'id'>>('organizations', organization);
    }

    startListening() {
        if (!this.listener) {
            this.listener = this.fs.listenCollectionWithLoading<Organization>(
                'organizations'
            );
        }
    }

    /** Señal con los contactos; arranca la escucha al invocar */
    Organizations(): Organization[] {
        this.startListening();
        return this.listener!.data();
    }

    /** Señal de loading; arranca la escucha al invocar */
    loading(): boolean {
        this.startListening();
        return this.listener!.loading();
    }

    /** Meotodo para actualizar informacion de una organizacion  */
    updateOrganization(id: string, organization: Partial<Organization>): Promise<void> {
        return this.fs.update<Organization>('organizations', id, organization);
    }

    // Obtiene el nombre de la organización por su ID filtrando la lista de organizaciones computada
    getOrganizationNameById(id: string): Signal<string | null> {
        this.startListening();
        return computed(() => {
            const orgs = this.listener!.data();
            const org = orgs.find(o => o.id === id);
            return org ? org.name : null;
        });
    }

    // Obtiene un objeto de orgnizaciones y nombres computed
    getOrganizationsNames(): Signal<{ [id: string]: string }> {
        this.startListening(); // asegura que listener esté activo
        return computed(() => {
            const orgs = this.listener!.data();
            const names: Record<string, string> = {};
            orgs.forEach(org => {
                names[org.id] = org.name;
            });
            return names;
        });
    }

    // obtiene una organizacion por su id computada
    getOrganizationById(id: string): Signal<Organization | null> {
        this.startListening();
        return computed(() => {
            const orgs = this.listener!.data();
            return orgs.find(o => o.id === id) ?? null;
        });
    }

    getOrganizationsByProject(idProject: string): Signal<Organization[]> {
        this.startListening(); // asegúrate de que el listener esté activo
        return computed(() => {
            const orgs = this.listener!.data();
            return orgs.filter(org => org.projects.includes(idProject));
        });
    }
}



