import { Injectable, inject, Signal } from '@angular/core';
import { Office, } from '../models/office-interface';
import { FirestoreService } from '../../core/services/firestore.service';

@Injectable({
    providedIn: 'root'
})
export class OfficeService {
    private readonly fs = inject(FirestoreService);

    // Aquí guardamos el listener SOLO tras arrancarlo
    private listener: { data: Signal<Office[]>; loading: Signal<boolean>; } | null = null;

    /** Inicia el listener una sola vez */
    private startListening(): void {
        if (!this.listener) {
            console.log('OfficeService: Iniciando escucha de oficinas');
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


    deleteOffice(id: string){

    }

    updateOffice(id: string, office: Office){
        return this.fs.update<Office>('offices', id, office);
    }

    createOffice(office: Office){
        return this.fs.create<Office>('offices', office);
    }

    

}
