// my-hospital-app/src/utils/types.ts

// Type Guard para objetos que parecen un error de Firebase (con code y message)
export interface FirebaseErrorLike {
  code: string;
  message: string;
}

export function isFirebaseErrorLike(error: unknown): error is FirebaseErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

// Type Guard para objetos que parecen un Timestamp de Firestore (con seconds y nanoseconds)
export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
}

export function isFirestoreTimestampLike(value: unknown): value is FirestoreTimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds: unknown }).seconds === 'number' &&
    'nanoseconds' in value &&
    typeof (value as { nanoseconds: unknown }).nanoseconds === 'number'
  );
}

// Puedes añadir más interfaces o type guards aquí si los necesitas en el futuro.
// Tipus principal de dades d'un pacient en Firestore
export interface PacienteFirestoreData {
  id?: string;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  DNI_NIE: string;
  FechaNacimiento?: Date | string;
  Telefono?: string;
  Email?: string;
  Direccion?: string;
  CodigoPostal?: string;
  Poblacion?: string;
  Provincia?: string;
  Sexo?: 'H' | 'M' | 'Otro';
  NSS?: string;
  CIP?: string;
  MedicoAsignado?: string;
  Observaciones?: string;
  FechaAlta?: Date | string;
  FechaBaja?: Date | string | null;
}
