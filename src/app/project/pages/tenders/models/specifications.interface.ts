import { Timestamp } from "@angular/fire/firestore";

export interface TenderSpecification {
    id?: string;
    idTender: string;
    name: string;
    name_es?: string;
    name_en?: string;
    name_zh?: string;
    description: string;
    description_es?: string;
    description_en?: string;
    description_zh?: string;
    type: string;
    fileSize: string;
    fileUrl: string;
    fileType: string;
    date?: Timestamp;
}
