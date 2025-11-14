// my-hospital-app/src/app/utils/firestoreUtils.ts

import { QueryDocumentSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { isFirestoreTimestampLike } from './types'; // Asegúrate de que esta ruta sea correcta

// Interfaz para los datos del paciente tal como se almacenan en Firestore
// donde FechaNacimiento y creadoEn son Timestamps
export interface PacienteFirestoreData {
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  DNI_NIE: string;
  FechaNacimiento: Timestamp; // En Firestore es Timestamp
  Sexo: string;
  SIP?: string;
  NumSeguridadSocial?: string;
  NumHistoriaClinica: string;
  Direccion?: string;
  CodigoPostal?: string;
  Telefono?: string;
  creadoPor: string;
  creadoEn: Timestamp; // En Firestore es Timestamp
}

// Función auxiliar para convertir cualquier objeto de tipo Timestamp de Firestore
export function convertToFirestoreTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }
  if (isFirestoreTimestampLike(value)) {
    return new Timestamp(value.seconds, value.nanoseconds);
  }
  console.warn("Formato de Timestamp inválido encontrado, devolviendo Timestamp(0,0):", value);
  return new Timestamp(0, 0);
}


// Función para mapear un QueryDocumentSnapshot a PacienteData con tipado seguro
export function mapDocumentToPacienteData(doc: QueryDocumentSnapshot<DocumentData>): PacienteFirestoreData & { id: string } {
    const rawData = doc.data() as PacienteFirestoreData; // Assert para el contenido del documento

    return {
        id: doc.id,
        Id_paciente: rawData.Id_paciente,
        Nombre: rawData.Nombre,
        Apellido1: rawData.Apellido1,
        Apellido2: rawData.Apellido2,
        DNI_NIE: rawData.DNI_NIE,
        FechaNacimiento: convertToFirestoreTimestamp(rawData.FechaNacimiento),
        Sexo: rawData.Sexo,
        SIP: rawData.SIP,
        NumSeguridadSocial: rawData.NumSeguridadSocial,
        NumHistoriaClinica: rawData.NumHistoriaClinica,
        Direccion: rawData.Direccion,
        CodigoPostal: rawData.CodigoPostal,
        Telefono: rawData.Telefono,
        creadoPor: rawData.creadoPor,
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
    };
}

// Interfaz para los datos de Urgencia tal como se almacenan en Firestore
export interface UrgenciaFirestoreData {
    Nombre: string;
    Diagnóstico: string;
    Fecha: Timestamp;
    creadoPor: string;
    creadoEn: Timestamp;
}

// Función para mapear un QueryDocumentSnapshot a UrgenciaData con tipado seguro
export function mapDocumentToUrgenciaData(doc: QueryDocumentSnapshot<DocumentData>): UrgenciaFirestoreData & { id: string } {
    const rawData = doc.data() as UrgenciaFirestoreData;

    return {
        id: doc.id,
        Nombre: rawData.Nombre,
        Diagnóstico: rawData.Diagnóstico,
        Fecha: convertToFirestoreTimestamp(rawData.Fecha),
        creadoPor: rawData.creadoPor,
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
    };
}
