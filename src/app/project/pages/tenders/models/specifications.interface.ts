import { Timestamp } from "@angular/fire/firestore";

export interface TenderSpecification {
    id: string;
    idTender: string;
    name: string;
    name_es?: string;
    name_en?: string;
    name_zh?: string;
    description: string;
    description_es?: string;
    description_en?: string;
    description_zh?: string;
    type: TenderSpecificationType;
    fileSize: string;
    fileUrl: string;
    fileType: string;
    date?: Timestamp;
}

export type TenderSpecificationType = 'Bases Administrativas' | 'Bases Técnicas' | 'Bases Económicas' | 'Bases de Concurso' | 'Bases de Licitación' | 'Anexo' | 'Otro';