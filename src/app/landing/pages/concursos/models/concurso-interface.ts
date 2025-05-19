import { Timestamp } from "firebase/firestore";

export interface ConcursoData {
  banner: string; // imagen
  conten_top_es: string; // texto
  conten_top_en: string; // texto
  conten_top_zh: string; // texto
  content_Left_es: string; // texto
  content_Left_en: string; // texto
  content_Left_zh: string; // texto
  content_right_es: string; // texto
  content_right_en: string; // texto
  content_right_zh: string; // texto
  content_bottom_es:string;
  content_bottom_en:string;
  content_bottom_zh:string;
  dateCreation: Timestamp; // Fecha
  gallery: Array<{  
    title_es: string; // text 
    title_en: string; // text
    title_zh: string; // text
    urlImage: string; // url
  }>;
  imageUrl: string; // url
  name_es: string; // text
  name_en: string; // text
  name_zh: string; // text
  proyecto_es?: string; // texto
  proyecto_en?: string; // texto
  proyecto_zh?: string; // texto
  published: boolean; 
  status_es: string;
  status_en: string; // texto
  status_zh: string; // texto
  type_es: string; // texto
  type_en: string; // texto
  type_zh: string; // texto
}
