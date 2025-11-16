import { Timestamp } from 'firebase/firestore';

export interface PacienteData {
  id?: string;
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  DNI_NIE: string;
  FechaNacimiento: Timestamp;
  Sexo: string;
  SIP: string; // ✅ NUEVO CAMPO - 7 dígitos únicos
  NumSeguridadSocial?: string;
  NumHistoriaClinica: string;
  Direccion?: string;
  CodigoPostal?: string;
  Telefono?: string;
  creadoPor: string;
  creadoEn: Timestamp;
}

export interface PacienteFormData {
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2: string;
  DNI_NIE: string;
  FechaNacimiento: string;
  Sexo: string;
  SIP: string; // ✅ NUEVO CAMPO
  NumSeguridadSocial: string;
  NumHistoriaClinica: string;
  Direccion: string;
  CodigoPostal: string;
  Telefono: string;
}