import { Timestamp } from "@angular/fire/firestore";

export interface Project {
    id              : string;
    name_es         : string;
    name_en         : string;
    name_zh         : string;
    description_es  : string;
    description_en  : string;
    description_zh  : string;
    image?          : string;
    galleryImages?  : string[];
    adwardDate?     : Timestamp;
    phase_en        : string;
    phase_zh        : string;
    phase_es        : string;
    url             : string;
}

export interface ProjectForm extends Omit<Project, 'id'> { }



