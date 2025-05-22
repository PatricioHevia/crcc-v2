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
  increment,
  QueryDocumentSnapshot,
  Query,
  query,
  limit,
  orderBy,
  startAfter,
  getCountFromServer,
  where,
  DocumentData,
  onSnapshot,
} from '@angular/fire/firestore';
import { FilterMetadata, SortMeta } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirestoreService {

  private firestore = inject(Firestore);


  async create<T>(path: string, data: T, id?: string): Promise<string> {
    try {
      if (id) {
        // Si ya tienes un id, usas setDoc y devuelves el mismo
        const ref: DocumentReference<T> = doc(this.firestore, path, id) as DocumentReference<T>;
        await setDoc(ref, data);
        return id;
      } else {
        // Si no, usas addDoc y capturas el DocumentReference que devuelve
        const col: CollectionReference<T> = collection(this.firestore, path) as CollectionReference<T>;
        const docRef = await addDoc(col, data);
        return docRef.id;
      }
    } catch (error: any) {
      console.error(`[FirestoreService][create] Error en ruta ${path}${id ? '/' + id : ''}:`, error);
      throw new Error(`create(${path}${id ? '/' + id : ''}) falló: ${error.message}`);
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
  listenOne<T extends { id: string }>(collectionName: string, documentId: string): Observable<T | null> { // Modified from your "working example" to fit your current structure
    const ref = doc(this.firestore, collectionName, documentId);
    return new Observable<T | null>(subscriber => {
      const unsub = onSnapshot(
        ref,
        snap => {
          if (snap.exists()) {
            subscriber.next({ ...(snap.data() as T), id: snap.id });
          } else {
            console.warn(`[FirestoreService] Documento no encontrado en observable: ${collectionName}/${documentId}`);
            subscriber.next(null);
          }
        },
        error => {
          console.error(`[FirestoreService] Error en listenOne (observable) -> ${collectionName}/${documentId}`, error);
          subscriber.error(error);
        }
      );
      return () => unsub();
    });
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

  // Incrementa un campo numérico en un documento.
  async incrementField<T>(
    path: string,
    id: string,
    field: keyof T,
    amount = 1
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, path, id);
      await firestoreUpdateDoc(ref, { [field]: increment(amount) } as any);
    } catch (error) {
      console.error(
        `[FirestoreService][incrementField] Error en ${path}/${id} > ${String(field)}`,
        error
      );
      throw new Error(
        `incrementField(${path}/${id}.${String(field)}) falló: ${error}`
      );
    }
  }

  public async getAll<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = [] // Para ordenamiento u otros filtros iniciales si fueran necesarios
  ): Promise<T[]> {
    const collRef = collection(this.firestore, path) as CollectionReference<T>;
    const finalQuery = query(collRef, ...constraints);
    try {
      const querySnapshot = await getDocs(finalQuery);
      return querySnapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id } as T));
    } catch (error) {
      console.error(`[FirestoreService] Error en getAll -> ${path}`, error);
      throw error;
    }
  } 

  // Mantén tu método getCount (o countCollection del ejemplo que funciona)
  public async getCount(collectionName: string): Promise<number> { //
    const collRef = collection(this.firestore, collectionName);
    const snapshot = await getCountFromServer(query(collRef));
    return snapshot.data().count;
  }
}
