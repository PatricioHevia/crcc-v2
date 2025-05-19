import { inject, Injectable, signal, Signal } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  collectionData,
  docData,
  query as firestoreQuery,
  QueryConstraint,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirestoreService {

  private firestore = inject(Firestore);


  async create<T>(path: string, data: T, id?: string): Promise<void> {
    try {
      if (id) {
        const ref: DocumentReference<T> = doc(this.firestore, path, id) as DocumentReference<T>;
        await setDoc(ref, data);
      } else {
        const col: CollectionReference<T> = collection(this.firestore, path) as CollectionReference<T>;
        await addDoc(col, data);
      }
    } catch (error) {
      console.error(`[FirestoreService][create] Error en ruta ${path}${id ? '/' + id : ''}:`, error);
      throw new Error(`create(${path}${id ? '/' + id : ''}) falló: ${error}`);
    }
  }

  /**
   * Obtiene una vez un documento por su ID.
   */
  async readOne<T>(path: string, id: string): Promise<T | undefined> {
    try {
      const ref = doc(this.firestore, path, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as T;
      } else {
        console.warn(`[FirestoreService][readOne] No existe documento en ${path}/${id}`);
        return undefined;
      }
    } catch (error) {
      console.error(`[FirestoreService][readOne] Error en ruta ${path}/${id}:`, error);
      throw new Error(`readOne(${path}/${id}) falló: ${error}`);
    }
  }

  /**
   * Obtiene una vez todos los documentos de una colección, con opcionales restricciones de consulta.
   */
  async readCollection<T>(
    path: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const colRef = collection(this.firestore, path) as CollectionReference<T>;
      const q = constraints.length
        ? firestoreQuery(colRef, ...constraints)
        : colRef;
      const snap = await getDocs(q);
      return snap.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as T) }));
    } catch (error) {
      console.error(`[FirestoreService][readCollection] Error en ruta ${path}:`, error);
      throw new Error(`readCollection(${path}) falló: ${error}`);
    }
  }

  /**
   * Actualiza partes de un documento (merge).
   */
  async update<T>(
    path: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, path, id);
      await firestoreUpdateDoc(ref, data as any);
    } catch (error) {
      console.error(`[FirestoreService][update] Error en ruta ${path}/${id}:`, error);
      throw new Error(`update(${path}/${id}) falló: ${error}`);
    }
  }

  /**
   * Elimina un documento por su ID.
   */
  async delete(path: string, id: string): Promise<void> {
    try {
      const ref = doc(this.firestore, path, id);
      await firestoreDeleteDoc(ref);
    } catch (error) {
      console.error(`[FirestoreService][delete] Error en ruta ${path}/${id}:`, error);
      throw new Error(`delete(${path}/${id}) falló: ${error}`);
    }
  }

  /**
   * Escucha cambios en un documento como Observable.
   */
  listenOne<T>(path: string, id: string): Observable<T | undefined> {
    try {
      const ref = doc(this.firestore, path, id) as DocumentReference<T>;
      return docData<T>(ref, { idField: 'id' as keyof T });
    } catch (error) {
      console.error(`[FirestoreService][listenOne] Error al escuchar ${path}/${id}:`, error);
      throw new Error(`listenOne(${path}/${id}) falló: ${error}`);
    }
  }

  /**
   * Escucha cambios en una colección como Observable.
   */
  listenCollection<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = []
  ): Observable<T[]> {
    try {
      const colRef = collection(this.firestore, path) as CollectionReference<T>;
      const q = constraints.length
        ? firestoreQuery(colRef, ...constraints)
        : colRef;
      return collectionData<T>(q, { idField: 'id' as keyof T });
    } catch (error) {
      console.error(`[FirestoreService][listenCollection] Error al escuchar ${path}:`, error);
      throw new Error(`listenCollection(${path}) falló: ${error}`);
    }
  }

  listenCollectionWithLoading<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = []
  ): { data: Signal<T[]>; loading: Signal<boolean> } {
    const data = signal<T[]>([]);
    const loading = signal<boolean>(true);

    this.listenCollection<T>(path, constraints).subscribe({
      next: (items) => {
        data.set(items);
        loading.set(false);
      },
      error: (err) => {
        console.error(`[FirestoreService][listenCollectionWithLoading] ${path}`, err);
        loading.set(false);
      }
    });

    return { data: data.asReadonly(), loading: loading.asReadonly() };
  }
}
