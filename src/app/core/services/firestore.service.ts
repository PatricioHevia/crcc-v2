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
} from '@angular/fire/firestore';
import { SortMeta } from 'primeng/api';
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

  // firestore.service.ts
  async fetchPage<T>(
    collectionName: string,
    pageSize = 20,
    lastSnapshot?: QueryDocumentSnapshot<T>,
    queryFn?: (ref: CollectionReference<T>) => Query<T>
  ): Promise<{
    items: T[];
    lastSnapshot: QueryDocumentSnapshot<T> | null;
  }> {
    const collRef = collection(this.firestore, collectionName) as CollectionReference<T>;

    // Si te pasan un queryFn, úsalo; si no, fallback a createdAt
    let q: Query<T> = queryFn
      ? query(queryFn(collRef), limit(pageSize))
      : query(collRef, orderBy('createdAt', 'desc'), limit(pageSize));

    if (lastSnapshot) {
      q = query(q, startAfter(lastSnapshot));
    }

    const snap = await getDocs(q);
    const items = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as T & { id: string }));
    const last = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
    return { items, lastSnapshot: last };
  }

  async getCount<T>(
    collectionName: string,
    queryFn?: (ref: CollectionReference<T>) => Query<T>
  ): Promise<number> {
    const collRef = collection(this.firestore, collectionName) as CollectionReference<T>;
    // Aplica filtro si se entrega, o usa la colección completa
    const q = queryFn ? query(queryFn(collRef)) : query(collRef);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }

  private buildFilterConstraints<T>(filters: TableLazyLoadEvent['filters']): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];
    if (!filters) {
      return constraints;
    }

    for (const field in filters) {
      const filterMetadata = filters[field];
      if (filterMetadata) {
        const activeFilters = Array.isArray(filterMetadata) ? filterMetadata : [filterMetadata];
        for (const f of activeFilters) {
          if (f.value !== null && f.value !== undefined && f.value !== '') {
            // This needs to be adapted based on f.matchMode.
            // Firestore has limitations (e.g., no direct 'contains' for strings).
            // Example for 'equals':
            if (f.matchMode === 'equals') {
              constraints.push(where(field, '==', f.value));
            } else if (f.matchMode === 'startsWith') {
              constraints.push(where(field, '>=', f.value));
              constraints.push(where(field, '<=', f.value + '\uf8ff'));
            }
            // TODO: Add more matchModes as needed: notEquals, lt, lte, gt, gte, in, etc.
            // For date fields, ensure f.value is a Firebase Timestamp or convert it.
          }
        }
      }
    }
    return constraints;
  }

  public async fetchLazyData<T extends { id: string }>(
    collectionName: string,
    event: TableLazyLoadEvent,
    defaultSortField: string = 'createdAt',
    defaultSortOrder: 'desc' | 'asc' = 'desc'
  ): Promise<{ items: T[]; totalRecords: number }> {
    const collRef = collection(this.firestore, collectionName) as CollectionReference<T>;
    const baseQueryConstraints: QueryConstraint[] = [];

    // Apply filters first (for both count and data queries if filters affect total)
    const filterConstraints = this.buildFilterConstraints<T>(event.filters);
    baseQueryConstraints.push(...filterConstraints);

    // 1. Get total records matching filters
    const countQuery = query(collRef, ...baseQueryConstraints);
    const totalRecordsSnap = await getCountFromServer(countQuery);
    const totalRecords = totalRecordsSnap.data().count;

    // 2. Build query for data slice
    const dataQueryConstraints: QueryConstraint[] = [...baseQueryConstraints];

    // Sorting
    let sortField = event.sortField || defaultSortField;
    let sortOrderDirection: 'asc' | 'desc' = (event.sortOrder === 1 ? 'asc' : (event.sortOrder === -1 ? 'desc' : defaultSortOrder));

    if (Array.isArray(event.multiSortMeta) && event.multiSortMeta.length > 0) {
      // Handle multi-sort if needed, Firestore supports multiple orderBy clauses
      for (const meta of event.multiSortMeta as SortMeta[]) {
        dataQueryConstraints.push(orderBy(meta.field, meta.order === 1 ? 'asc' : 'desc'));
      }
    } else if (sortField && typeof sortField === 'string') {
      dataQueryConstraints.push(orderBy(sortField, sortOrderDirection));
    }

    // Pagination (Limit)
    const rows = event.rows || 10; // Default to 10 rows if not provided
    dataQueryConstraints.push(limit(rows));


    let finalQuery = query(collRef, ...dataQueryConstraints);


    const dataSnap = await getDocs(finalQuery);
    const items = dataSnap.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id, _snapshot: docSnap } as T & { _snapshot?: QueryDocumentSnapshot<DocumentData> }));
    // Storing _snapshot temporarily if needed for next page cursor

    return { items, totalRecords };
  }

}
