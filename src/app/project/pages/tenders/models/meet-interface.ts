import { Timestamp } from "@angular/fire/firestore";

export interface Meet {
    title: string;
    title_es?: string;
    title_en?: string;
    title_zh?: string;
    date: Timestamp;
    link: string;
    visible: boolean;
}