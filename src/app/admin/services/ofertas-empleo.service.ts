import { Injectable, inject, Signal, OnDestroy, computed } from '@angular/core';
import { OfertasEmpleo, Postulacion, Estado, EstadoPostulacion, TipoTrabajo, Jornada } from '../models/ofertas-empleo.interface';
import { FirestoreService } from '../../core/services/firestore.service';
import { UserService } from '../../auth/services/user.service';
import { TranslationService } from '../../core/services/translation.service';
import { Timestamp, QueryConstraint, orderBy, where } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class OfertasEmpleoService implements OnDestroy {
    private readonly fs = inject(FirestoreService);
    private readonly userService = inject(UserService);
    private readonly translationService = inject(TranslationService);

    // Listener para ofertas de empleo
    private ofertasListener: {
        data: Signal<OfertasEmpleo[]>;
        loading: Signal<boolean>;
        unsubscribe: () => void;
    } | null = null;

    // Listener para postulaciones
    private postulacionesListener: {
        data: Signal<Postulacion[]>;
        loading: Signal<boolean>;
        unsubscribe: () => void;
    } | null = null;

    /** Inicia el listener de ofertas una sola vez */
    private startOfertasListening(): void {
        if (!this.ofertasListener) {
            const constraints: QueryConstraint[] = [
                orderBy('fechaCreacion', 'desc')
            ];
            this.ofertasListener = this.fs.listenCollectionWithLoading<OfertasEmpleo>(
                'ofertas-empleo',
                constraints
            );
        }
    }

    /** Inicia el listener de postulaciones una sola vez */
    private startPostulacionesListening(): void {
        if (!this.postulacionesListener) {
            const constraints: QueryConstraint[] = [
                orderBy('fechaPostulacion', 'desc')
            ];
            this.postulacionesListener = this.fs.listenCollectionWithLoading<Postulacion>(
                'postulaciones',
                constraints
            );
        }
    }

    /** Señal con las ofertas de empleo; arranca la escucha al invocar */
    ofertas(): OfertasEmpleo[] {
        this.startOfertasListening();
        return this.ofertasListener!.data();
    }

    /** Señal de loading para ofertas; arranca la escucha al invocar */
    ofertasLoading(): boolean {
        this.startOfertasListening();
        return this.ofertasListener!.loading();
    }

    /** Señal con las postulaciones; arranca la escucha al invocar */
    postulaciones(): Postulacion[] {
        this.startPostulacionesListening();
        return this.postulacionesListener!.data();
    }

    /** Señal de loading para postulaciones; arranca la escucha al invocar */
    postulacionesLoading(): boolean {
        this.startPostulacionesListening();
        return this.postulacionesListener!.loading();
    }

    // --- Métodos CRUD para Ofertas de Empleo ---

    /**
     * Crea una nueva oferta de empleo.
     * Solo usuarios con permisos adecuados pueden crear ofertas.
     * @param ofertaData Datos de la oferta a crear (sin ID)
     */
    public async createOferta(ofertaData: Omit<OfertasEmpleo, 'id'>): Promise<string> {
        this.checkPermissions('create');
        
        const currentUser = this.userService.usuario();
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        const ofertaCompleta: Omit<OfertasEmpleo, 'id'> = {
            ...ofertaData,
            fechaCreacion: Timestamp.now(),
            usuarioCreacion: currentUser.id,
            eliminado: false
        };

        console.log(`OfertasEmpleoService: Creando nueva oferta de empleo`);
        return this.fs.create<Omit<OfertasEmpleo, 'id'>>('ofertas-empleo', ofertaCompleta);
    }    /**
     * Crea una nueva oferta de empleo con traducción automática.
     * Similar al patrón usado en ProjectService.createProject
     * @param nombre Nombre de la oferta
     * @param descripcion Descripción de la oferta
     * @param proyecto Proyecto asociado
     * @param lugar Ubicación de la oferta
     * @param tipoTrabajo Tipo de trabajo
     * @param tipoJornada Tipo de jornada
     * @param vacantes Número de vacantes
     * @param fechaPublicacion Fecha de publicación
     * @param fechaCierre Fecha de cierre
     * @param requisitos Requisitos opcionales
     */
    public async createOfertaWithTranslation(
        nombre: string,
        descripcion: string,
        proyecto: string,
        lugar: string,
        tipoTrabajo: TipoTrabajo,
        tipoJornada: Jornada,
        vacantes: number,
        fechaPublicacion: Date,
        fechaCierre: Date,
        requisitos: string[] = []
    ): Promise<string> {
        this.checkPermissions('create');
        
        const currentUser = this.userService.usuario();
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Crear objeto base sin traducir
            const ofertaBase: Omit<OfertasEmpleo, 'id'> = {
                nombre,
                nombre_es: '',
                nombre_en: '',
                nombre_zh: '',
                descripcion,
                descripcion_es: '',
                descripcion_en: '',
                descripcion_zh: '',
                proyecto,
                lugar,
                tipoTrabajo,
                tipoJornada,
                vacantes,
                fechaPublicacion: Timestamp.fromDate(fechaPublicacion),
                fechaCierre: Timestamp.fromDate(fechaCierre),
                requisitos,
                estado: 'Abierto',
                fechaCreacion: Timestamp.now(),
                usuarioCreacion: currentUser.id,
                eliminado: false
            };

            // Traducir usando el servicio de traducción
            const ofertaTraducida = await this.translationService.translateJson(ofertaBase);
            
            // Asegurar que las fechas se mantengan como Timestamp
            ofertaTraducida.fechaPublicacion = Timestamp.fromDate(fechaPublicacion);
            ofertaTraducida.fechaCierre = Timestamp.fromDate(fechaCierre);
            ofertaTraducida.fechaCreacion = Timestamp.now();

            console.log('OfertasEmpleoService: Creando nueva oferta con traducción automática');
            return this.fs.create<Omit<OfertasEmpleo, 'id'>>('ofertas-empleo', ofertaTraducida);
        } catch (error) {
            console.error('Error al crear oferta con traducción:', error);
            throw error;
        }
    }

    /**
     * Actualiza una oferta de empleo existente.
     * @param id ID de la oferta a actualizar
     * @param ofertaData Datos parciales de la oferta a actualizar
     */
    public async updateOferta(id: string, ofertaData: Partial<OfertasEmpleo>): Promise<void> {
        this.checkPermissions('update');
        
        console.log(`OfertasEmpleoService: Actualizando oferta ${id}`);
        return this.fs.update<OfertasEmpleo>('ofertas-empleo', id, ofertaData);
    }

    /**
     * Elimina una oferta de empleo (borrado lógico).
     * @param id ID de la oferta a eliminar
     */
    public async deleteOferta(id: string): Promise<void> {
        this.checkPermissions('delete');
        
        const currentUser = this.userService.usuario();
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        const deleteData: Partial<OfertasEmpleo> = {
            eliminado: true,
            fechaEliminacion: Timestamp.now(),
            usuarioEliminacion: currentUser.id,
            estado: 'Eliminado'
        };

        console.log(`OfertasEmpleoService: Eliminando oferta ${id} (borrado lógico)`);
        return this.fs.update<OfertasEmpleo>('ofertas-empleo', id, deleteData);
    }

    /**
     * Elimina una oferta de empleo físicamente de la base de datos.
     * Solo super admins pueden realizar borrado físico.
     * @param id ID de la oferta a eliminar físicamente
     */
    public async hardDeleteOferta(id: string): Promise<void> {
        if (!this.userService.isSuperAdmin()) {
            throw new Error('Permisos insuficientes para eliminación física');
        }

        console.log(`OfertasEmpleoService: Eliminación física de oferta ${id}`);
        return this.fs.delete('ofertas-empleo', id);
    }

    /**
     * Obtiene una oferta de empleo por su ID.
     * @param id ID de la oferta
     */
    public async getOfertaById(id: string): Promise<OfertasEmpleo | undefined> {
        return this.fs.readOne<OfertasEmpleo>('ofertas-empleo', id);
    }

    /**
     * Cambia el estado de una oferta de empleo.
     * @param id ID de la oferta
     * @param nuevoEstado Nuevo estado a asignar
     */
    public async cambiarEstadoOferta(id: string, nuevoEstado: Estado): Promise<void> {
        this.checkPermissions('update');
        
        console.log(`OfertasEmpleoService: Cambiando estado de oferta ${id} a ${nuevoEstado}`);
        return this.fs.update<OfertasEmpleo>('ofertas-empleo', id, { estado: nuevoEstado });
    }

    // --- Métodos CRUD para Postulaciones ---

    /**
     * Crea una nueva postulación.
     * @param postulacionData Datos de la postulación a crear (sin ID)
     */
    public async createPostulacion(postulacionData: Omit<Postulacion, 'id'>): Promise<string> {
        const postulacionCompleta: Omit<Postulacion, 'id'> = {
            ...postulacionData,
            fechaPostulacion: Timestamp.now(),
            estado: 'Pendiente'
        };

        console.log(`OfertasEmpleoService: Creando nueva postulación para oferta ${postulacionData.idOferta}`);
        return this.fs.create<Omit<Postulacion, 'id'>>('postulaciones', postulacionCompleta);
    }

    /**
     * Actualiza una postulación existente.
     * @param id ID de la postulación a actualizar
     * @param postulacionData Datos parciales de la postulación a actualizar
     */
    public async updatePostulacion(id: string, postulacionData: Partial<Postulacion>): Promise<void> {
        this.checkPermissions('update');
        
        console.log(`OfertasEmpleoService: Actualizando postulación ${id}`);
        return this.fs.update<Postulacion>('postulaciones', id, postulacionData);
    }

    /**
     * Cambia el estado de una postulación.
     * @param id ID de la postulación
     * @param nuevoEstado Nuevo estado a asignar
     */
    public async cambiarEstadoPostulacion(id: string, nuevoEstado: EstadoPostulacion): Promise<void> {
        this.checkPermissions('update');
        
        console.log(`OfertasEmpleoService: Cambiando estado de postulación ${id} a ${nuevoEstado}`);
        return this.fs.update<Postulacion>('postulaciones', id, { estado: nuevoEstado });
    }

    /**
     * Elimina una postulación.
     * @param id ID de la postulación a eliminar
     */
    public async deletePostulacion(id: string): Promise<void> {
        this.checkPermissions('delete');
        
        console.log(`OfertasEmpleoService: Eliminando postulación ${id}`);
        return this.fs.delete('postulaciones', id);
    }

    /**
     * Obtiene postulaciones por oferta.
     * @param idOferta ID de la oferta
     */
    public async getPostulacionesByOferta(idOferta: string): Promise<Postulacion[]> {
        const constraints: QueryConstraint[] = [
            where('idOferta', '==', idOferta),
            orderBy('fechaPostulacion', 'desc')
        ];
        return this.fs.readCollection<Postulacion>('postulaciones', constraints);
    }

    /**
     * Obtiene postulaciones por usuario.
     * @param idUsuario ID del usuario
     */
    public async getPostulacionesByUsuario(idUsuario: string): Promise<Postulacion[]> {
        const constraints: QueryConstraint[] = [
            where('idUsuario', '==', idUsuario),
            orderBy('fechaPostulacion', 'desc')
        ];
        return this.fs.readCollection<Postulacion>('postulaciones', constraints);
    }

    // --- Métodos de utilidad ---

    /**
     * Obtiene ofertas activas (no eliminadas y con estado "Abierto").
     */
    public getOfertasActivas(): OfertasEmpleo[] {
        const todasLasOfertas = this.ofertas();
        return todasLasOfertas.filter(oferta => 
            !oferta.eliminado && 
            oferta.estado === 'Abierto' && 
            oferta.fechaCierre.toDate() > new Date()
        );
    }

    /**
     * Signal computada con ofertas para opciones de select.
     */
    public ofertasOptionsSignal = computed(() => {
        this.startOfertasListening();
        const ofertasData = this.ofertasListener?.data() || [];
        return ofertasData
            .filter(oferta => !oferta.eliminado)
            .map(oferta => ({
                label: oferta.nombre || oferta.nombre_es || oferta.nombre_en || oferta.nombre_zh,
                value: oferta.id
            }));
    });

    // --- Verificación de permisos ---

    /**
     * Verifica si el usuario actual tiene permisos para realizar la operación.
     * @param operation Tipo de operación a verificar
     */
    private checkPermissions(operation: 'create' | 'update' | 'delete'): void {
        const currentUser = this.userService.usuario();
        
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        // Super Admin puede hacer todo
        if (this.userService.isSuperAdmin()) {
            return;
        }

        // Admin de organización mandante puede hacer todo
        if (this.userService.isAdmin() && this.userService.isMandante()) {
            return;
        }

        // Verificar permisos específicos
        const hasPermission = currentUser.permissions?.includes('CONCURSOS') || false;
        
        if (!hasPermission) {
            throw new Error(`Permisos insuficientes para ${operation} ofertas de empleo`);
        }
    }

    // --- Cleanup ---

    ngOnDestroy(): void {
        if (this.ofertasListener && typeof this.ofertasListener.unsubscribe === 'function') {
            this.ofertasListener.unsubscribe();
            this.ofertasListener = null;
            console.log('OfertasEmpleoService: Firestore listener para ofertas detenido.');
        }

        if (this.postulacionesListener && typeof this.postulacionesListener.unsubscribe === 'function') {
            this.postulacionesListener.unsubscribe();
            this.postulacionesListener = null;
            console.log('OfertasEmpleoService: Firestore listener para postulaciones detenido.');
        }
    }
}
