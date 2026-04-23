// src/app/core/models/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

export interface Project {
  id: string;
  nome: string;
  descrizione: string;
  tipologia: string;
  area: string;
  businessUnit: string;
  fornitore: string;
  owner: string;
  stato: string;
  dataInizio: string;
  dataFine: string;
  completamento: number;
  documentazione: 'parziale' | 'totale' | 'non necessaria';
  priorita: string;
  repositoryUrl: string;
}

export interface Task {
  id: string;
  nome: string;
  dataInizio: string;
  dataFine: string;
  stato: string;
  projectId: string;
}

export interface ChecklistItem {
  id: string;
  documento: string;
  completato: boolean;
  linkUrl: string;
  projectId: string;
}

export interface Ticket {
  id: string;
  titolo: string;
  descrizione: string;
  stato: string;
  priorita: string;
  riferimentoSD: string;
  dataApertura: string;
  dataChiusura: string;
  note: string;
  projectId: string;
}

export interface AppConfig {
  tipologie: string[];
  aree: string[];
  businessUnits: string[];
  fornitori: string[];
  statiProgetto: string[];
  statiTask: string[];
  priorita: string[];
  statiTicket: string[];
  docFields: string[];
}

export interface CurrentUser extends User {
  token?: string;
}

export interface SubTask {
  id: string;
  nome: string;
  dataInizio: string;
  dataFine: string;
  owner: string;
  stato: string;
  taskId: string;
  projectId: string;
}

// Nomi fissi dei task in sequenza
export const TASK_SEQUENCE = [
  'REQUISITI',
  'TEMPI E STIME',
  'SVILUPPO',
  'COLLAUDO LDT',
  'COLLAUDO BU',
  'PRODUZIONE',
  'ADOPTION'
] as const;

export type TaskName = typeof TASK_SEQUENCE[number];
