import { Timestamp } from "@angular/fire/firestore";
import { ProjectPhaseCode } from "../../core/constants/phase-projects-keys";

export interface Project {
    id              : string;
    name_es         : string;
    name_en         : string;
    name_zh         : string;
    description_es  : string;
    description_en  : string;
    description_zh  : string;
    image?          : string;
    galleryImages?  : string [];
    adwardDate?     : Timestamp;
    phase          : ProjectPhaseCode;
    url             : string;
}

export interface ProjectForm
  extends Omit<Project, 'id' | 'image' | 'galleryImages' > {
    // Si ProjectForm tenía los phase_xx, elimínalos.
    // Asegúrate que el formulario ahora capture o maneje 'phase: ProjectPhaseCode'
    phase: ProjectPhaseCode; // El formulario también debería manejar el código de fase
  }


