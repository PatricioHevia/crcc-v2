import { Injectable, inject, Signal, OnDestroy, computed } from '@angular/core'; // 1. Importa OnDestroy
import { Office } from '../models/office-interface';
import { FirestoreService } from '../../core/services/firestore.service';

@Injectable({
    providedIn: 'root'
})
export class OfficeService implements OnDestroy { // 2. Implementa OnDestroy
    private readonly fs = inject(FirestoreService);

    // 3. Actualiza el tipo de 'listener' para incluir la función 'unsubscribe'
    private listener: {
        data: Signal<Office[]>;
        loading: Signal<boolean>;
        unsubscribe: () => void; // <-- Añade esto
    } | null = null;

    /** Inicia el listener una sola vez */
    private startListening(): void {
        if (!this.listener) {
            this.listener = this.fs.listenCollectionWithLoading<Office>(
                'offices'
            );
        }
    }

    /** Señal con los Offices; arranca la escucha al invocar */
    offices(): Office[] {
        this.startListening();
        return this.listener!.data();
    }

    /** Señal de loading; arranca la escucha al invocar */
    loading(): boolean {
        this.startListening();
        return this.listener!.loading();
    }

    /**
     * Crea una nueva oficina.
     * El ID puede ser autogenerado por Firestore si no se provee en officeData.
     * @param officeData Datos de la oficina a crear.
     */
    public createOffice(officeData: Omit<Office, 'id'>): Promise<string> {
        return this.fs.create<Omit<Office, 'id'>>('offices', officeData);
    }

    /**
     * Actualiza una oficina existente.
     * @param id ID de la oficina a actualizar.
     * @param officeData Datos parciales de la oficina a actualizar.
     */
    public updateOffice(id: string, officeData: Partial<Office>): Promise<void> {
        return this.fs.update<Office>('offices', id, officeData);
    }

    /**
     * Elimina una oficina (borrado físico).
     * @param id ID de la oficina a eliminar.
     */
    public deleteOffice(id: string): Promise<void> {
        console.log(`OfficeService: Solicitando eliminación de oficina ${id}`);
        return this.fs.delete('offices', id);
    }

    /**
     * Obtiene una oficina por su ID.
     * Este método realiza una lectura única, no es un listener.
     * @param id ID de la oficina.
     */
    public getOfficeById(id: string): Promise<Office | undefined> {
        return this.fs.readOne<Office>('offices', id);
    }

    // 4. Añade el método ngOnDestroy
    ngOnDestroy(): void {
        if (this.listener && typeof this.listener.unsubscribe === 'function') {
            this.listener.unsubscribe(); // Llama a la función de desuscripción
            this.listener = null; // Limpia la referencia
            console.log('OfficeService: Firestore listener para oficinas detenido.');
        }
    }

    // Geter de nombre en label y id en value desde la señal de oficinas
    public officeOptionsSignal = computed(() => {
        this.startListening(); // Asegura que el listener esté activo e inicializado
        const officesData = this.listener?.data() || []; // Obtiene los datos de las oficinas
        return officesData.map(office => ({
            label: office.name, // Ajusta 'name' si la propiedad es diferente
            value: office.id
        }));
    });
}