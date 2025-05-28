import { inject, Injectable, signal, Signal, NgZone } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  collectionGroup,
  doc,
  DocumentReference,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  query as firestoreQuery,
  QueryConstraint,
  increment,
  // query, // Ya está importado como firestoreQuery para evitar colisión de nombres
  getCountFromServer,
  onSnapshot,
  QuerySnapshot,
  DocumentSnapshot,
  docData,
  collectionData,
  Unsubscribe, // Importar el tipo Unsubscribe
} from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs'; // Importar Subscription
import { map } from 'rxjs/operators';

// Interfaz para eventos de colección con metadatos
export interface FirestoreCollectionEvent<T> {
  items: T[];
  fromCache: boolean;
  hasPendingWrites: boolean;
}

// Interfaz para eventos de documento con metadatos
export interface FirestoreDocumentEvent<T> {
  item: T | null;
  fromCache: boolean;
  hasPendingWrites: boolean;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);
  private zone = inject(NgZone); // Inyectar NgZone

  // --- Métodos CRUD (Create, ReadOne, ReadCollection, Update, Delete) ---
  // (Estos métodos no cambian, se mantienen como los tienes)
  async create<T>(path: string, data: T, id?: string): Promise<string> {
    try {
      if (id) {
        const ref: DocumentReference<T> = doc(this.firestore, path, id) as DocumentReference<T>;
        await setDoc(ref, data);
        return id;
      } else {
        const col: CollectionReference<T> = collection(this.firestore, path) as CollectionReference<T>;
        const docRef = await addDoc(col, data);
        return docRef.id;
      }
    } catch (error: any) {
      console.error(`[FirestoreService][create] Error en ruta ${path}${id ? '/' + id : ''}:`, error);
      throw new Error(`create(${path}${id ? '/' + id : ''}) falló: ${error.message}`);
    }
  }

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

  async delete(path: string, id: string): Promise<void> {
    try {
      const ref = doc(this.firestore, path, id);
      await firestoreDeleteDoc(ref);
    } catch (error) {
      console.error(`[FirestoreService][delete] Error en ruta ${path}/${id}:`, error);
      throw new Error(`delete(${path}/${id}) falló: ${error}`);
    }
  }


  // --- Métodos Listener con Metadatos y NgZone ---

  public listenOneWithMetadata<T extends { id?: string }>(
    path: string,
    documentId: string
  ): Observable<FirestoreDocumentEvent<T>> {
    const documentRef = doc(this.firestore, path, documentId) as DocumentReference<T>;
    return new Observable(subscriber => {
      const unsubscribe: Unsubscribe = onSnapshot(documentRef, // onSnapshot devuelve Unsubscribe
        (snapshot: DocumentSnapshot<T>) => {
          this.zone.run(() => {
            const metadata = snapshot.metadata;
            if (snapshot.exists()) {
              subscriber.next({
                item: { id: snapshot.id, ...snapshot.data() } as T,
                fromCache: metadata.fromCache,
                hasPendingWrites: metadata.hasPendingWrites,
              });
            } else {
              subscriber.next({
                item: null,
                fromCache: metadata.fromCache,
                hasPendingWrites: metadata.hasPendingWrites,
              });
            }
          });
        },
        (error) => {
          this.zone.run(() => {
            console.error(`[FirestoreService][listenOneWithMetadata][${path}/${documentId}]`, error);
            subscriber.error(error);
          });
        }
      );
      return () => unsubscribe(); // Esto es lo que se retorna para desuscribirse del Observable
    });
  }

  public listenOneWithLoading<T extends { id?: string }>(
    path: string,
    documentId: string
  ): { data: Signal<T | null>; loading: Signal<boolean>; unsubscribe: () => void } { // 1. Actualiza el tipo de retorno
    const dataSignal = signal<T | null>(null);
    const loadingSignal = signal<boolean>(true);

    // Nos suscribimos al Observable que ya maneja onSnapshot y NgZone
    const subscription: Subscription = this.listenOneWithMetadata<T>(path, documentId).subscribe({
      next: (event: FirestoreDocumentEvent<T>) => {
        dataSignal.set(event.item);
        if (loadingSignal()) {
          loadingSignal.set(false);
        }
        // ... (tu lógica de logging se mantiene) ...
        if (event.item === null && !event.fromCache) {
          console.warn(`[FirestoreService][listenOneWithLoading][${path}/${documentId}] Documento no encontrado en el servidor.`);
        } else if (event.item) {
          if (event.fromCache) {
            let logMessage = `[FirestoreService][listenOneWithLoading][${path}/${documentId}] Datos cargados desde la CACHÉ.`;
            if (event.hasPendingWrites) {
              logMessage += ' (Tiene escrituras locales pendientes)';
            }
            console.log(logMessage);
          } else {
            console.log(`[FirestoreService][listenOneWithLoading][${path}/${documentId}] Datos cargados desde el SERVIDOR.`);
          }
        }
      },
      error: (err) => {
        console.error(`[FirestoreService][listenOneWithLoading][${path}/${documentId}]`, err);
        loadingSignal.set(false);
      }
    });

    // La función de desuscripción simplemente se desuscribe de la suscripción de RxJS
    const unsubscribeFunction = () => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
        // console.log(`FirestoreService: Unsubscribed from one ${path}/${documentId}`);
      }
    };

    return {
      data: dataSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      unsubscribe: unsubscribeFunction // 2. Retorna la función de desuscripción
    };
  }

  public listenCollectionWithMetadata<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = []
  ): Observable<FirestoreCollectionEvent<T>> {
    const collectionRef = collection(this.firestore, path);
    const q = firestoreQuery(collectionRef, ...constraints); // Usar firestoreQuery para evitar colisión

    return new Observable(subscriber => {
      const unsubscribe: Unsubscribe = onSnapshot( // onSnapshot devuelve Unsubscribe
        q,
        (querySnapshot: QuerySnapshot) => {
          this.zone.run(() => {
            const items = querySnapshot.docs.map(d =>
              ({ id: d.id, ...d.data() } as T)
            );
            const metadata = querySnapshot.metadata;
            subscriber.next({
              items,
              fromCache: metadata.fromCache,
              hasPendingWrites: metadata.hasPendingWrites
            });
          });
        },
        error => {
          this.zone.run(() => {
            console.error(
              `[FirestoreService][listenCollectionWithMetadata][${path}]`,
              error
            );
            subscriber.error(error);
          });
        }
      );
      return () => unsubscribe(); // Esto es lo que se retorna para desuscribirse del Observable
    });
  }

  /**
   * Escucha cambios en una colección, devuelve Signals para data y loading,
   * e incluye la función de desuscripción.
   */
  public listenCollectionWithLoading<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = []
  ): { data: Signal<T[]>; loading: Signal<boolean>; unsubscribe: () => void } { // 1. Actualiza el tipo de retorno
    const dataSignal = signal<T[]>([]);
    const loadingSignal = signal<boolean>(true);
    let hasLoggedInitial = false;

    // Nos suscribimos al Observable que ya maneja onSnapshot y NgZone
    const subscription: Subscription = this.listenCollectionWithMetadata<T>(path, constraints).subscribe({
      next: event => {
        dataSignal.set(event.items);
        if (loadingSignal()) {
          loadingSignal.set(false);
        }
        // ... (tu lógica de logging se mantiene) ...
        if (!hasLoggedInitial) {
          if (event.fromCache) {
            console.log(
              `[FirestoreService][${path}] Datos iniciales desde la CACHÉ.`
            );
          } else {
            console.log(
              `[FirestoreService][${path}] Datos iniciales desde el SERVIDOR.`
            );
          }
          hasLoggedInitial = true;
        } else if (!event.fromCache) {
          console.log(
            `[FirestoreService][${path}] Datos actualizados desde el SERVIDOR.`
          );
        }
      },
      error: err => {
        console.error(
          `[FirestoreService][listenCollectionWithLoading][${path}]`,
          err
        );
        loadingSignal.set(false);
      }
    });

    // La función de desuscripción simplemente se desuscribe de la suscripción de RxJS
    const unsubscribeFunction = () => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
        // console.log(`FirestoreService: Unsubscribed from collection ${path}`);
      }
    };

    return {
      data: dataSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      unsubscribe: unsubscribeFunction // 2. Retorna la función de desuscripción
    };  }

  public listenCollectionGroupWithMetadata<T extends { id: string }>(
    collectionId: string,
    constraints: QueryConstraint[] = []
  ): Observable<FirestoreCollectionEvent<T>> {
    const collectionGroupRef = collectionGroup(this.firestore, collectionId);
    const q = firestoreQuery(collectionGroupRef, ...constraints);

    return new Observable(subscriber => {
      const unsubscribe: Unsubscribe = onSnapshot(
        q,
        (querySnapshot: QuerySnapshot) => {
          this.zone.run(() => {
            const items = querySnapshot.docs.map(d =>
              ({ id: d.id, ...d.data() } as T)
            );
            const metadata = querySnapshot.metadata;
            subscriber.next({
              items,
              fromCache: metadata.fromCache,
              hasPendingWrites: metadata.hasPendingWrites
            });
          });
        },
        error => {
          this.zone.run(() => {
            console.error(
              `[FirestoreService][listenCollectionGroupWithMetadata][collectionGroup:${collectionId}]`,
              error
            );
            subscriber.error(error);
          });
        }
      );
      return () => unsubscribe();
    });
  }

  /**
   * Escucha cambios en un collection group, devuelve Signals para data y loading,
   * e incluye la función de desuscripción.
   */
  public listenCollectionGroupWithLoading<T extends { id: string }>(
    collectionId: string,
    constraints: QueryConstraint[] = []
  ): { data: Signal<T[]>; loading: Signal<boolean>; unsubscribe: () => void } {
    const dataSignal = signal<T[]>([]);
    const loadingSignal = signal<boolean>(true);
    let hasLoggedInitial = false;    // Nos suscribimos al Observable que ya maneja onSnapshot y NgZone
    const subscription: Subscription = this.listenCollectionGroupWithMetadata<T>(collectionId, constraints).subscribe({
      next: (event: FirestoreCollectionEvent<T>) => {
        dataSignal.set(event.items);
        if (loadingSignal()) {
          loadingSignal.set(false);
        }
        // Logging de carga inicial y actualizaciones
        if (!hasLoggedInitial) {
          if (event.fromCache) {
            console.log(
              `[FirestoreService][collectionGroup:${collectionId}] Datos iniciales desde la CACHÉ.`
            );
          } else {
            console.log(
              `[FirestoreService][collectionGroup:${collectionId}] Datos iniciales desde el SERVIDOR.`
            );
          }
          hasLoggedInitial = true;
        } else if (!event.fromCache) {
          console.log(
            `[FirestoreService][collectionGroup:${collectionId}] Datos actualizados desde el SERVIDOR.`
          );
        }
      },
      error: (err: any) => {
        console.error(
          `[FirestoreService][listenCollectionGroupWithLoading][collectionGroup:${collectionId}]`,
          err
        );
        loadingSignal.set(false);
      }
    });

    // La función de desuscripción simplemente se desuscribe de la suscripción de RxJS
    const unsubscribeFunction = () => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
        // console.log(`FirestoreService: Unsubscribed from collection group ${collectionId}`);
      }
    };

    return {
      data: dataSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      unsubscribe: unsubscribeFunction
    };
  }

  // --- Métodos que usan collectionData/docData de @angular/fire ---
  // Estos ya devuelven Observables, y la desuscripción se maneja típicamente
  // en el componente/servicio que los consume (ej. con async pipe o takeUntilDestroyed).
  // No necesitan retornar una función 'unsubscribe' explícita de la misma manera.

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
      // Considera devolver un Observable que emita un error en lugar de lanzar.
      // import { throwError } from 'rxjs'; return throwError(() => new Error(...));
      throw new Error(`listenCollection(${path}) falló: ${error}`);
    }
  }

  listenOne<T extends { id?: string }>(path: string, documentId: string): Observable<T | null> {
    const documentRef = doc(this.firestore, path, documentId) as DocumentReference<T>;
    return docData<T>(documentRef, { idField: 'id' as keyof T }).pipe(
      map(data => data === undefined ? null : data) // Asegura que se emita null si no hay datos
    );
  }

  // --- Otros Métodos (incrementField, getAll, getCount) ---
  // (Se mantienen como los tienes)
  async incrementField<K extends string, T extends { [key in K]?: number }>(
    path: string,
    id: string,
    field: K, // Ahora 'field' es un tipo genérico K
    amount = 1
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, path, id);
      // Aseguramos que el objeto de actualización tenga la clave correcta
      const updateData: { [key in K]?: any } = {};
      updateData[field] = increment(amount);
      await firestoreUpdateDoc(ref, updateData);
    } catch (error) {
      console.error(`[FirestoreService][incrementField] Error en ${path}/${id} > ${String(field)}`, error);
      throw new Error(`incrementField(${path}/${id}.${String(field)}) falló: ${error}`);
    }
  }


  public async getAll<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    const collRef = collection(this.firestore, path) as CollectionReference<T>;
    const finalQuery = firestoreQuery(collRef, ...constraints); // Usar firestoreQuery
    try {
      const querySnapshot = await getDocs(finalQuery);
      return querySnapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id } as T));
    } catch (error) {
      console.error(`[FirestoreService] Error en getAll -> ${path}`, error);
      throw error; // Re-lanzar para que el llamador pueda manejarlo
    }
  }

  public async getCount(collectionName: string): Promise<number> {
    const collRef = collection(this.firestore, collectionName);
    const snapshot = await getCountFromServer(firestoreQuery(collRef)); // Usar firestoreQuery
    return snapshot.data().count;
  }
}