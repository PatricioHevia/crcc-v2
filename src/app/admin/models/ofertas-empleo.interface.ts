import { Timestamp } from "firebase/firestore";

export interface OfertasEmpleo {
    id: string;
    nombre: string;
    nombre_es: string;
    nombre_en: string;
    nombre_zh: string;
    descripcion: string;
    descripcion_es: string;
    descripcion_en: string;
    descripcion_zh: string;
    fechaPublicacion: Timestamp;
    fechaCierre: Timestamp;
    estado: Estado;
    proyecto: string;
    lugar: string;
    tipoTrabajo: TipoTrabajo;
    tipoJornada: Jornada;
    requisitos: string[];
    fechaCreacion: Timestamp;
    usuarioCreacion: string;
    fechaEliminacion?: Timestamp;
    usuarioEliminacion?: string;
    eliminado?: boolean;
    vacantes: number;
}

export type Jornada = 'Completa' | 'Parcial';
export type TipoTrabajo = 'Presencial' | 'Híbrido' | 'Remoto';
export type Estado = 'Abierto' | 'Cerrado' | 'En revisión' | 'Eliminado';

export interface Postulacion {
    
    id: string;
    idOferta: string;
    idUsuario: string;
    fechaPostulacion: Timestamp;
    estado: EstadoPostulacion;
}

export type EstadoPostulacion = 'Pendiente' | 'Entrevistada' | 'Aceptada' | 'Contratada' | 'Rechazada' | 'Eliminada';
