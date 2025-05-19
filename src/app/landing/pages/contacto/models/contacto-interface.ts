import { Timestamp } from "firebase/firestore";


export interface Contacto {
    id: string;
    email: string;
    empresa?: string;
    fecha: Timestamp;
    leido: boolean;
    mensaje_es: string;
    mensaje_en: string;
    mensaje_zh: string;
    asunto_es: string;
    asunto_en: string;
    asunto_zh: string;
    nombre: string;
}