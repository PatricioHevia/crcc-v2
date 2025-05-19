// contacto.service.ts
import { Injectable, inject, Signal, signal } from '@angular/core';
import { Contacto } from './models/contacto-interface';
import { FirestoreService } from '../../../core/services/firestore.service';

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private readonly fs = inject(FirestoreService);

  // Aquí guardamos el listener SOLO tras arrancarlo
  private listener: {
    data: Signal<Contacto[]>;
    loading: Signal<boolean>;
  } | null = null;

  /** Inicia el listener una sola vez */
  private startListening(): void {
    if (!this.listener) {
      this.listener = this.fs.listenCollectionWithLoading<Contacto>(
        'contactos'
      );
    }
  }

  /** Señal con los contactos; arranca la escucha al invocar */
  contactos(): Contacto[] {
    this.startListening();
    return this.listener!.data();
  }

  /** Señal de loading; arranca la escucha al invocar */
  loading(): boolean {
    this.startListening();
    return this.listener!.loading();
  }

  /** Sólo crea/actualiza, sin tocar listener */
  crearMensaje(nuevo: Partial<Contacto>): Promise<void> {
    return this.fs.create<Contacto>('contactos', nuevo as Contacto);
  }

  markAsRead(id: string): Promise<void> {
    return this.fs.update<Contacto>('contactos', id, { leido: true });
  }
  markAsUnread(id: string): Promise<void> {
    return this.fs.update<Contacto>('contactos', id, { leido: false });
  }
}
