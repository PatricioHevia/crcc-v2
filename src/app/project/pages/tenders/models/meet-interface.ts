import { Timestamp } from "@angular/fire/firestore";

export interface Meet {
    title: string;
    date: Timestamp;
    link: string;
    visible: boolean;
}