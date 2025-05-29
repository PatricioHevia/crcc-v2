import { Timestamp } from "@angular/fire/firestore";
import { Account } from "../../../../auth/models/account-interface";
import { Meet } from "./meet-interface";
import { Encryption } from "./encryptation.interface";

// Tipos específicos para los campos con valores predefinidos
export type TenderStatus = 'En Preparación' | 'Fase de Consultas' | 'Fase de Respuestas' | 'Fase de Ofertas' | 'Espera de Apertura' | 'Fase Solicitud de Aclaraciones' | 'Fase Respuestas a Aclaraciones' | 'Fase de Adjudicación' | 'Cerrada';
export type TenderCurrency = "CLP" | "USD" | "EUR" | "UF" | "UTM" | "CNY";
export type TenderModality = 'Suma Alzada' | 'Precio Unitario' | 'No aplica';
export type TenderType = 'Prestación de Servicios' | 'Obra' | 'Equipamiento Médico y Mobiliario Clínico y No Clínico' | 'Ingeniería';

export interface Tender {
    id: string;
    name: string;
    name_es?: string;
    name_en?: string;
    name_zh?: string;
    description: string;
    description_es?: string;
    description_en?: string;
    description_zh?: string;
    imageUrl?: string;
    userCreator: Account;
    dateCreated: Timestamp;
    lastModification: Timestamp;
    tenderStartDate: Timestamp;
    inquiryDeadline: Timestamp;
    answerDeadline: Timestamp;
    submissionDeadline: Timestamp;
    aclarationsDeadline: Timestamp;
    answerAclarationsDeadline: Timestamp;
    openOfferDeadline?: Timestamp;
    awardDate: Timestamp;
    tenderType: TenderType;
    tenderStatus: TenderStatus;
    OrganizationAccess: string[];
    OrganizationRequestAccess?: string[];
    tenderCurrency: TenderCurrency;
    meet?: Meet;
    tenderModality?: TenderModality;    encryption?: Encryption[];
    project?: string;
    idProject?: string;
}