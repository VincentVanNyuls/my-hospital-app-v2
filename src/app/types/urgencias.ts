import { Timestamp } from 'firebase/firestore';

export interface Urgencia {
  id: string;
  pacienteId: string;
  fechaIngreso: Timestamp;
  triage: 'Rojo' | 'Naranja' | 'Amarillo' | 'Verde' | 'Azul';
  sintomas: string;
  diagnostico?: string;
  medicoId: string;
  estado: 'En espera' | 'En atención' | 'Atendido' | 'Derivado';
  creadoPor?: string;
  creadoEn?: Timestamp;
}

export interface UrgenciaCreate {
  pacienteId: string;
  triage: string;
  sintomas: string;
  medicoId: string;
  creadoPor?: string;
}