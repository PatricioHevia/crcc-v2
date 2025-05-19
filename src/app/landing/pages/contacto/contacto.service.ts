import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from '../../../core/helpers/services/firestore.service';
import { Contacto } from './models/contacto-interface';

@Injectable({ providedIn: 'root' })
export class ContactoService {
    private readonly firestoreService = inject(FirestoreService);
    private readonly path = 'contactos';

    public contactos = signal<Contacto[]>([]);

    createContacto(data: Omit<Contacto, 'id'>): Promise<void> {
        return this.firestoreService.create(this.path, data);
    }


    updateContacto(id: string, updates: Partial<Contacto>): Promise<void> {
        return this.firestoreService.update(this.path, id, updates);
    }


    deleteContacto(id: string): Promise<void> {
        return this.firestoreService.delete(this.path, id);
    }


    markAsRead(id: string): Promise<void> {
        return this.updateContacto(id, { leido: true });
    }

    getContactos(): void {
        if (this.contactos().length > 0) {
            return;
        }
        this.firestoreService.listenCollection(this.path).subscribe((contactos) => {
            // Map or cast each item to Contacto type, assuming you have default values or handle missing fields
            const contactosTyped = contactos.map((c: any) => ({
                id: c.id,
                email: c.email ?? '',
                fecha: c.fecha ?? '',
                leido: c.leido ?? false,
                mensaje_es: c.mensaje_es ?? '',
                mensaje_en: c.mensaje_en ?? '',
                mensaje_zh: c.mensaje_zh ?? '',
                asunto_es: c.asunto_es ?? '',
                asunto_en: c.asunto_en ?? '',
                asunto_zh: c.asunto_zh ?? '',
                empresa: c.empresa ?? '',
                nombre: c.nombre ?? ''
            } as Contacto));
            this.contactos.set(contactosTyped);
        });
    }
}
