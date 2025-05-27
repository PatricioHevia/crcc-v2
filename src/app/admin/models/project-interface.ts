import { Timestamp } from "@angular/fire/firestore";
import { ProjectPhaseCode } from "../../core/constants/phase-projects-keys";

export type ImagePosition = 
  | 'center center'    // Por defecto
  | 'center top'       // Mostrar la parte superior
  | 'center bottom'    // Mostrar la parte inferior  
  | 'left center'      // Mostrar la parte izquierda
  | 'right center';    // Mostrar la parte derecha

export interface Project {
    id              : string;
    name            : string;
    name_es         : string;
    name_en         : string;
    name_zh         : string;
    description     : string;
    description_es  : string;
    description_en  : string;
    description_zh  : string;
    image?          : string;
    imagePosition?  : ImagePosition; // Nueva propiedad para controlar la posición de la imagen
    galleryImages?  : GalleryImageFirestore [];
    awardDate?     : Timestamp;
    phase          : ProjectPhaseCode;
    url             : string;
}

export interface ProjectForm
  extends Omit<Project, 'id' | 'image' | 'galleryImages' > {
    // Si ProjectForm tenía los phase_xx, elimínalos.
    // Asegúrate que el formulario ahora capture o maneje 'phase: ProjectPhaseCode'
    phase: ProjectPhaseCode; // El formulario también debería manejar el código de fase
  }


export interface GalleryImageFirestore {
  url: string;
  name: string; // Nombre original del archivo, por ejemplo

}
