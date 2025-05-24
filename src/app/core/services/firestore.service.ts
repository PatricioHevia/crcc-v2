import { inject, Injectable, signal, Signal, NgZone } from '@angular/core'; // NgZone importado
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
  // collectionData, // Comentado si vamos a preferir el método manual para metadata
  query as firestoreQuery,
  QueryConstraint,
  increment,
  query, // query ya está importado arriba
  getCountFromServer,
  onSnapshot,
  QuerySnapshot,
  DocumentSnapshot, // Importar DocumentSnapshot
  docData,
  collectionData, // Alternativa para listenOne si no se necesita tanta personalización
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Necesario para docData si se usa con transformaciones

// Interfaz para eventos de colección con metadatos
interface FirestoreCollectionEvent<T> {
  items: T[];
  fromCache: boolean;
  hasPendingWrites: boolean;
}

// Interfaz para eventos de documento con metadatos
interface FirestoreDocumentEvent<T> {
  item: T | null; // Puede ser null si el documento no existe
  fromCache: boolean;
  hasPendingWrites: boolean;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);
  private zone = inject(NgZone); // Inyectar NgZone

  // --- Métodos CRUD (Create, ReadOne, ReadCollection, Update, Delete) ---
  // Estos métodos son async y no usan onSnapshot, por lo que NgZone no es
  // el problema principal aquí. El warning era sobre onSnapshot.
  // Los he dejado como estaban para brevedad, pero el foco son los listeners.

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
      // Log de metadatos para getDoc (opcional, pero ilustrativo)
      // console.log(`[FirestoreService][readOne][${path}/${id}] Source: ${snap.metadata.fromCache ? 'CACHE' : 'SERVER'}`);
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
      // Log de metadatos para getDocs (opcional)
      // console.log(`[FirestoreService][readCollection][${path}] Source: ${snap.metadata.fromCache ? 'CACHE (info agregada)' : 'SERVER (info agregada)'}`);
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

  /**
   * Escucha cambios en un documento y provee metadatos (fromCache, hasPendingWrites).
   * Resuelve warnings de NgZone.
   */
  private listenOneWithMetadata<T extends { id?: string }>( // id opcional en T para el caso de que no exista
    path: string,
    documentId: string
  ): Observable<FirestoreDocumentEvent<T>> {
    const documentRef = doc(this.firestore, path, documentId) as DocumentReference<T>;
    return new Observable(subscriber => {
      const unsubscribe = onSnapshot(documentRef,
        (snapshot: DocumentSnapshot<T>) => {
          this.zone.run(() => { // Ejecutar dentro de NgZone
            const metadata = snapshot.metadata;
            if (snapshot.exists()) {
              subscriber.next({
                item: { id: snapshot.id, ...snapshot.data() } as T,
                fromCache: metadata.fromCache,
                hasPendingWrites: metadata.hasPendingWrites,
              });
            } else {
              // Sigue emitiendo un evento para que el 'loading' se maneje,
              // pero con item nulo.
              subscriber.next({
                item: null,
                fromCache: metadata.fromCache,
                hasPendingWrites: metadata.hasPendingWrites,
              });
            }
          });
        },
        (error) => {
          this.zone.run(() => { // Ejecutar dentro de NgZone
            console.error(`[FirestoreService][listenOneWithMetadata][${path}/${documentId}]`, error);
            subscriber.error(error);
          });
        }
      );
      return () => unsubscribe();
    });
  }

  /**
   * Escucha cambios en un documento, devuelve Signals para data y loading,
   * e incluye logs de fuente de datos.
   */
  listenOneWithLoading<T extends { id?: string }>(
    path: string,
    documentId: string
  ): { data: Signal<T | null>; loading: Signal<boolean> } {
    const dataSignal = signal<T | null>(null);
    const loadingSignal = signal<boolean>(true);

    this.listenOneWithMetadata<T>(path, documentId).subscribe({
      next: (event: FirestoreDocumentEvent<T>) => {
        // NgZone ya está manejado dentro de listenOneWithMetadata
        dataSignal.set(event.item); // event.item ya es T | null
        if (loadingSignal()) {
          loadingSignal.set(false);
        }

        if (event.item === null && !event.fromCache) { // Solo loguear si no existe y vino del servidor (no es un falso negativo de caché)
            console.warn(`[FirestoreService][listenOneWithLoading][${path}/${documentId}] Documento no encontrado en el servidor.`);
        } else if (event.item) { // Solo loguear si el item existe
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
        // Si event.item es null y fromCache es true, puede ser un estado intermedio o un doc que no existe en caché.
        // Podrías añadir un log específico si lo deseas, pero el de "no encontrado en servidor" es más definitivo.

      },
      error: (err) => {
        // NgZone ya está manejado
        console.error(`[FirestoreService][listenOneWithLoading][${path}/${documentId}]`, err);
        loadingSignal.set(false);
      }
    });
    return { data: dataSignal.asReadonly(), loading: loadingSignal.asReadonly() };
  }

  /**
   * Escucha cambios en una colección y provee metadatos (fromCache, hasPendingWrites).
   * Resuelve warnings de NgZone.
   * (Este es tu método ya existente, ahora con NgZone)
   */
  private listenCollectionWithMetadata<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = []
  ): Observable<FirestoreCollectionEvent<T>> {
    const collectionRef = collection(this.firestore, path);
    const q = query(collectionRef, ...constraints);

    return new Observable(subscriber => {
      const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot) => {
        this.zone.run(() => { // Ejecutar dentro de NgZone
            const items = querySnapshot.docs.map(docDef => ({ id: docDef.id, ...docDef.data() } as T));
            const metadata = querySnapshot.metadata;
            subscriber.next({
            items: items,
            fromCache: metadata.fromCache,
            hasPendingWrites: metadata.hasPendingWrites
            });
        });
      }, (error) => {
        this.zone.run(() => { // Ejecutar dentro de NgZone
            console.error(`[FirestoreService][listenCollectionWithMetadata][${path}]`, error);
            subscriber.error(error);
        });
      });
      return () => unsubscribe();
    });
  }

  /**
   * Escucha cambios en una colección, devuelve Signals para data y loading,
   * e incluye logs de fuente de datos.
   * (Este es tu método ya existente, que usa el listenCollectionWithMetadata ahora con NgZone)
   */
  listenCollectionWithLoading<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = []
  ): { data: Signal<T[]>; loading: Signal<boolean> } {
    const dataSignal = signal<T[]>([]);
    const loadingSignal = signal<boolean>(true);

    this.listenCollectionWithMetadata<T>(path, constraints).subscribe({
      next: (event: FirestoreCollectionEvent<T>) => {
        // NgZone ya está manejado dentro de listenCollectionWithMetadata
        dataSignal.set(event.items);
        if (loadingSignal()) {
          loadingSignal.set(false);
        }
        if (event.fromCache) {
          let logMessage = `[FirestoreService][listenCollectionWithLoading][${path}] Datos cargados desde la CACHÉ.`;
          if (event.hasPendingWrites) {
            logMessage += ' (Tiene escrituras locales pendientes)';
          }
          console.log(logMessage);
        } else {
          console.log(`[FirestoreService][listenCollectionWithLoading][${path}] Datos cargados desde el SERVIDOR.`);
        }
      },
      error: (err) => {
        // NgZone ya está manejado
        console.error(`[FirestoreService][listenCollectionWithLoading][${path}]`, err);
        loadingSignal.set(false);
      }
    });
    return { data: dataSignal.asReadonly(), loading: loadingSignal.asReadonly() };
  }


  /**
   * Escucha cambios en una colección como Observable usando collectionData de @angular/fire.
   * Este método es más simple pero NO da acceso a los metadatos fromCache.
   * Generalmente, @angular/fire maneja NgZone internamente para estos observables.
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
      // collectionData de @angular/fire es conveniente pero no expone metadata.fromCache fácilmente.
      // Si necesitas el log de CACHE/SERVIDOR para este, deberías usar listenCollectionWithMetadata
      // y luego mapear solo los items si no necesitas la señal de loading.
      // Ejemplo: return this.listenCollectionWithMetadata<T>(path, constraints).pipe(map(event => event.items));
      // Por ahora, lo dejo usando collectionData como lo tenías, que es más simple si no necesitas el log.
      // Si el warning de "outside injection context" también aparecía por este método, entonces
      // @angular/fire podría no estar manejando el zone como se espera en todos los casos,
      // o el warning que viste era exclusivamente de tus implementaciones manuales de onSnapshot.
      return collectionData<T>(q, { idField: 'id' as keyof T });
    } catch (error) {
      console.error(`[FirestoreService][listenCollection] Error al escuchar ${path}:`, error);
      throw new Error(`listenCollection(${path}) falló: ${error}`);
    }
  }

  /**
   * Escucha cambios en un documento como Observable usando docData de @angular/fire.
   * Similar a listenCollection, es más simple pero no da acceso directo a todos los metadatos de snapshot.
   */
  listenOne<T extends { id?: string }>(path: string, documentId: string): Observable<T | null> {
    // docData de @angular/fire es conveniente para escuchar un documento.
    // No expone metadata.fromCache tan directamente como onSnapshot manual.
    // Si necesitas el log CACHE/SERVIDOR para este, deberías usar listenOneWithMetadata y mapear.
    // Ejemplo: return this.listenOneWithMetadata<T>(path, documentId).pipe(map(event => event.item));
    // Por ahora, lo dejo usando docData.
    const documentRef = doc(this.firestore, path, documentId) as DocumentReference<T>;
    return docData<T>(documentRef, { idField: 'id' as keyof T }).pipe(
      map(data => data === undefined ? null : data)
    );
  }


  // --- Otros Métodos (incrementField, getAll, getCount) ---
  // Estos no usan onSnapshot, así que no son el foco del warning de NgZone.
  // Los he dejado como estaban para brevedad.
  async incrementField<T>(
    path: string,
    id: string,
    field: keyof T, // Esto debería ser keyof T, no string, para seguridad de tipos
    amount = 1
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, path, id);
      await firestoreUpdateDoc(ref, { [field]: increment(amount) } as any); // Usar { [field as string]: ...} si field es keyof T
    } catch (error) {
      console.error(`[FirestoreService][incrementField] Error en ${path}/${id} > ${String(field)}`,error);
      throw new Error(`incrementField(${path}/${id}.${String(field)}) falló: ${error}`);
    }
  }

  public async getAll<T extends { id: string }>(
    path: string,
    constraints: QueryConstraint[] = []
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

  public async getCount(collectionName: string): Promise<number> {
    const collRef = collection(this.firestore, collectionName);
    const snapshot = await getCountFromServer(query(collRef));
    return snapshot.data().count;
  }
}