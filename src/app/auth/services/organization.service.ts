import { EnvironmentInjector, Injectable, Signal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { StorageService, UploadTask } from '../../core/services/storage.service';
import { Organization, OrganizationForm, OrganizationType } from '../models/organization-interface';
import { firstValueFrom } from 'rxjs';
import { orderBy, QueryConstraint, Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
    private readonly fs = inject(FirestoreService);
    private readonly storage = inject(StorageService);
    private readonly injector = inject(EnvironmentInjector); // Inyecta EnvironmentInjector


    // Aquí guardamos el listener SOLO tras arrancarlo cuando un usuario es administrador
    private listener: { data: Signal<Organization[]>; loading: Signal<boolean>; } | null = null;

    // meotodo para crear una organización
    async crearOrganizacion(
        name: string,
        email: string,
        tin: string,
        address: string,
        type: OrganizationType
    ): Promise<string> {
        const organization: Omit<Organization, 'id'> = {
            name,
            email,
            tin,
            address,
            type,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            usersCount: 0,
            active: true,
            deleted: false,
            projects: []
        };

        try {
            const newId = await this.fs.create<Omit<Organization, 'id'>>('organizations', organization);
            return newId;
        } catch (error: any) {
            console.error('Error creando organización:', error);
            throw new Error('No fue posible crear la organización: ' + error.message);
        }
    }

    startListening() {
        if (!this.listener) {
            const constraints: QueryConstraint[] = [
                orderBy('name')
            ];
            this.listener = this.fs.listenCollectionWithLoading<Organization>(
                'organizations',
                constraints
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
    getOrganizationsOptions(): Signal<{ value: string; label: string }[]> {
        this.startListening(); // asegura que el listener esté activo
        return computed(() => {
            const orgs = this.listener!.data();
            // mapeamos a {value, label}, luego ordenamos por label
            return orgs
                .map(org => ({
                    value: org.id,
                    label: org.name
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
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

    uploadLogo(file: File, organizationId: string): UploadTask {
        const filename = `${Date.now()}_${file.name}`;
        const path = `organizations/${organizationId}/main/${filename}`;
        return this.storage.uploadFile(file, path);
    }

    updateOrganization(
        id: string,
        data: Partial<OrganizationForm>,
        logoFile?: File
    ): { uploadTask?: UploadTask; complete: Promise<void> } {
        // Prepara datos de actualización
        const updateData: Partial<Organization> = { ...data };
        let uploadTask: UploadTask | undefined;

        // Si hay un archivo de logo, inicia la subida
        if (logoFile) {
            uploadTask = this.uploadLogo(logoFile, id);
        }

        // Promesa que espera a que termine la subida (si aplica),
        // asigna la URL y luego actualiza Firestore
        const complete = (async () => {
            if (uploadTask) {
                updateData.logoURL = await firstValueFrom(uploadTask.downloadURL$);
            }
            updateData.updatedAt = Timestamp.now();
            await this.fs.update<Organization>('organizations', id, updateData);
        })();

        return { uploadTask, complete };
    }

    public incrementUsersCount(organizationId: string): Promise<void> {
        return this.fs.incrementField<Organization>(
            'organizations',
            organizationId,
            'usersCount',
            1
        );
    }

    getAllOrganizationsPromise(): Promise<Organization[]> {
        this.startListening(); // Asegura que el listener esté activo y la carga haya comenzado

        // Si el listener no se pudo inicializar (ej. fs.listenCollectionWithLoading no existe o falló)
        if (!this.listener) {
            console.error('[OrganizationService] El listener no está inicializado. No se pueden obtener las organizaciones.');
            return Promise.resolve([]); // O Promise.reject(new Error('Listener not initialized'));
        }

        return new Promise<Organization[]>((resolve) => {
            runInInjectionContext(this.injector, () => {
                const effectRef = effect(() => {
                    const isLoading = this.listener!.loading(); // Accede al valor de la señal de carga

                    if (!isLoading) {
                        const organizations = this.listener!.data(); // Accede al valor de la señal de datos
                        // Una vez que loading es false, la señal de datos debería tener el estado actual.
                        // Se resuelve la promesa con los datos disponibles.
                        effectRef.destroy(); // Limpia el efecto una vez que ha cumplido su propósito
                        resolve(organizations);
                    }
                });
            });
        });
    }
}



