// my-hospital-app/src/app/utils/firestoreUtils.ts
import { QueryDocumentSnapshot, DocumentData, Timestamp } from 'firebase/firestore';

// Interfaz para objetos que tienen la estructura de Timestamp de Firestore
interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
}

// Función para verificar si un objeto tiene la estructura de Timestamp de Firestore
function isFirestoreTimestampLike(obj: any): obj is FirestoreTimestampLike {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.seconds === 'number' &&
    typeof obj.nanoseconds === 'number'
  );
}

// Interfaz para los datos del paciente tal como se almacenan en Firestore
export interface PacienteFirestoreData {
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  DNI_NIE: string;
  FechaNacimiento: Timestamp;
  Sexo: string;
  SIP?: string;
  NumSeguridadSocial?: string;
  NumHistoriaClinica: string;
  Direccion?: string;
  CodigoPostal?: string;
  Telefono?: string;
  creadoPor: string;
  creadoEn: Timestamp;
}

// Interfaz para los datos de Urgencia tal como se almacenan en Firestore
export interface UrgenciaFirestoreData {
  Id_Urgencia: string;
  Id_Paciente: string;
  Cobertura_SS: string;
  Tipo_Acreditacion: string;
  Fecha_entrada: Timestamp;
  Fecha_salida?: Timestamp;
  Hora_Entrada: string;
  Hora_salida?: string;
  Especialidad: string;
  Motivo_Urgencia: string;
  Lesion?: string;
  Entidad?: string;
  Destino?: string;
  Medico_responsable: string;
  Motivo_alta?: string;
  Fecha_alta?: Timestamp;
  Estado: 'activa' | 'alta' | 'derivada';
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

// Función auxiliar para convertir cualquier objeto de tipo Timestamp de Firestore
export function convertToFirestoreTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }
  if (isFirestoreTimestampLike(value)) {
    return new Timestamp(value.seconds, value.nanoseconds);
  }
  if (value === null || value === undefined) {
    return Timestamp.now();
  }
  console.warn("Formato de Timestamp inválido encontrado, devolviendo Timestamp actual:", value);
  return Timestamp.now();
}

// Función para mapear un QueryDocumentSnapshot a PacienteData con tipado seguro
export function mapDocumentToPacienteData(doc: QueryDocumentSnapshot<DocumentData>): PacienteFirestoreData & { id: string } {
    const rawData = doc.data();

    return {
        id: doc.id,
        Id_paciente: rawData.Id_paciente || '',
        Nombre: rawData.Nombre || '',
        Apellido1: rawData.Apellido1 || '',
        Apellido2: rawData.Apellido2 || '',
        DNI_NIE: rawData.DNI_NIE || '',
        FechaNacimiento: convertToFirestoreTimestamp(rawData.FechaNacimiento),
        Sexo: rawData.Sexo || '',
        SIP: rawData.SIP || '',
        NumSeguridadSocial: rawData.NumSeguridadSocial || '',
        NumHistoriaClinica: rawData.NumHistoriaClinica || '',
        Direccion: rawData.Direccion || '',
        CodigoPostal: rawData.CodigoPostal || '',
        Telefono: rawData.Telefono || '',
        creadoPor: rawData.creadoPor || 'sistema',
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
    };
}

// Función para mapear un QueryDocumentSnapshot a UrgenciaData con tipado seguro
export function mapDocumentToUrgenciaData(doc: QueryDocumentSnapshot<DocumentData>): UrgenciaFirestoreData & { id: string } {
    const rawData = doc.data();

    return {
        id: doc.id,
        Id_Urgencia: rawData.Id_Urgencia || `URG-${doc.id}`,
        Id_Paciente: rawData.Id_Paciente || '',
        Cobertura_SS: rawData.Cobertura_SS || 'Público',
        Tipo_Acreditacion: rawData.Tipo_Acreditacion || 'Urgencia',
        Fecha_entrada: convertToFirestoreTimestamp(rawData.Fecha_entrada),
        Fecha_salida: rawData.Fecha_salida ? convertToFirestoreTimestamp(rawData.Fecha_salida) : undefined,
        Hora_Entrada: rawData.Hora_Entrada || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        Hora_salida: rawData.Hora_salida || undefined,
        Especialidad: rawData.Especialidad || 'Urgencias',
        Motivo_Urgencia: rawData.Motivo_Urgencia || 'Por determinar',
        Lesion: rawData.Lesion || undefined,
        Entidad: rawData.Entidad || undefined,
        Destino: rawData.Destino || undefined,
        Medico_responsable: rawData.Medico_responsable || '',
        Motivo_alta: rawData.Motivo_alta || undefined,
        Fecha_alta: rawData.Fecha_alta ? convertToFirestoreTimestamp(rawData.Fecha_alta) : undefined,
        Estado: rawData.Estado || 'activa',
        creadoPor: rawData.creadoPor || 'sistema',
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
        actualizadoEn: convertToFirestoreTimestamp(rawData.actualizadoEn),
    };
}

// Función para crear datos iniciales de urgencia
export function createInitialUrgenciaData(pacienteId: string, usuarioId: string): Omit<UrgenciaFirestoreData, 'id'> {
  return {
    Id_Urgencia: `URG-${Date.now()}`,
    Id_Paciente: pacienteId,
    Cobertura_SS: 'Público',
    Tipo_Acreditacion: 'Urgencia',
    Fecha_entrada: Timestamp.now(),
    Hora_Entrada: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    Especialidad: 'Urgencias',
    Motivo_Urgencia: 'Por determinar',
    Medico_responsable: '',
    Estado: 'activa',
    creadoPor: usuarioId,
    creadoEn: Timestamp.now(),
    actualizadoEn: Timestamp.now(),
  };
}

// Función para validar datos de urgencia antes de guardar
export function validarDatosUrgencia(urgenciaData: Partial<UrgenciaFirestoreData>, esAlta: boolean = false): string[] {
  const errores: string[] = [];

  if (!urgenciaData.Id_Paciente) {
    errores.push('El ID del paciente es requerido');
  }

  // Solo requerir motivo de urgencia específico si estamos dando de alta
  if (esAlta && (!urgenciaData.Motivo_Urgencia || urgenciaData.Motivo_Urgencia === 'Por determinar')) {
    errores.push('El motivo de urgencia es requerido');
  }

  if (!urgenciaData.Medico_responsable) {
    errores.push('El médico responsable es requerido');
  }

  // Estas validaciones solo aplican cuando se da de alta
  if (esAlta) {
    if (urgenciaData.Estado === 'alta' && !urgenciaData.Motivo_alta) {
      errores.push('El motivo del alta es requerido cuando el estado es "alta"');
    }

    if (urgenciaData.Estado === 'alta' && !urgenciaData.Destino) {
      errores.push('El destino es requerido cuando el estado es "alta"');
    }
  }

  return errores;
}

// Función utilitaria para convertir Timestamp a string legible
export function formatFirestoreTimestamp(timestamp: Timestamp): string {
  if (!timestamp) return 'Fecha no disponible';
  try {
    return timestamp.toDate().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando timestamp:', error);
    return 'Fecha inválida';
  }
}

// Función para formatear solo la fecha de un Timestamp
export function formatFirestoreDate(timestamp: Timestamp): string {
  if (!timestamp) return 'Fecha no disponible';
  try {
    return timestamp.toDate().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha inválida';
  }
}

// Función para obtener la diferencia en días entre dos Timestamps
export function getDaysBetweenTimestamps(start: Timestamp, end: Timestamp): number {
  try {
    const startDate = start.toDate();
    const endDate = end.toDate();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculando diferencia de días:', error);
    return 0;
  }
}

// Función para calcular la duración de una urgencia en horas y minutos
export function calcularDuracionUrgencia(
  fechaEntrada: Timestamp, 
  horaEntrada: string, 
  fechaSalida?: Timestamp, 
  horaSalida?: string
): string {
  try {
    if (!fechaSalida || !horaSalida) {
      return 'En curso';
    }

    const entrada = new Date(fechaEntrada.toDate());
    const [horasEntrada, minutosEntrada] = horaEntrada.split(':').map(Number);
    entrada.setHours(horasEntrada, minutosEntrada, 0, 0);

    const salida = new Date(fechaSalida.toDate());
    const [horasSalida, minutosSalida] = horaSalida.split(':').map(Number);
    salida.setHours(horasSalida, minutosSalida, 0, 0);

    const diffMs = salida.getTime() - entrada.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHoras}h ${diffMinutos}m`;
  } catch (error) {
    console.error('Error calculando duración de urgencia:', error);
    return 'Error en cálculo';
  }
}

// Función para generar estadísticas de urgencias
export interface EstadisticasUrgencias {
  total: number;
  activas: number;
  altas: number;
  derivadas: number;
  promedioDuracion: string;
  especialidadMasComun: string;
}

export function generarEstadisticasUrgencias(urgencias: (UrgenciaFirestoreData & { id: string })[]): EstadisticasUrgencias {
  const estadisticas: EstadisticasUrgencias = {
    total: urgencias.length,
    activas: 0,
    altas: 0,
    derivadas: 0,
    promedioDuracion: '0h 0m',
    especialidadMasComun: 'N/A'
  };

  if (urgencias.length === 0) {
    return estadisticas;
  }

  // Contar por estado
  urgencias.forEach(urgencia => {
    switch (urgencia.Estado) {
      case 'activa':
        estadisticas.activas++;
        break;
      case 'alta':
        estadisticas.altas++;
        break;
      case 'derivada':
        estadisticas.derivadas++;
        break;
    }
  });

  // Calcular especialidad más común
  const especialidadesCount: { [key: string]: number } = {};
  urgencias.forEach(urgencia => {
    especialidadesCount[urgencia.Especialidad] = (especialidadesCount[urgencia.Especialidad] || 0) + 1;
  });

  const especialidadMasComun = Object.entries(especialidadesCount)
    .sort(([, a], [, b]) => b - a)[0];
  
  if (especialidadMasComun) {
    estadisticas.especialidadMasComun = especialidadMasComun[0];
  }

  // Calcular duración promedio (solo para urgencias completadas)
  const urgenciasCompletadas = urgencias.filter(u => 
    u.Estado === 'alta' && u.Fecha_salida && u.Hora_salida
  );

  if (urgenciasCompletadas.length > 0) {
    const totalMinutos = urgenciasCompletadas.reduce((total, urgencia) => {
      const duracion = calcularDuracionUrgencia(
        urgencia.Fecha_entrada,
        urgencia.Hora_Entrada,
        urgencia.Fecha_salida!,
        urgencia.Hora_salida!
      );
      
      if (duracion !== 'En curso' && duracion !== 'Error en cálculo') {
        const [horas, minutos] = duracion.split('h ').map(part => parseInt(part));
        return total + (horas * 60 + minutos);
      }
      return total;
    }, 0);

    const promedioMinutos = totalMinutos / urgenciasCompletadas.length;
    const promedioHoras = Math.floor(promedioMinutos / 60);
    const promedioMinutosResto = Math.round(promedioMinutos % 60);

    estadisticas.promedioDuracion = `${promedioHoras}h ${promedioMinutosResto}m`;
  }

  return estadisticas;
}

// Función para buscar urgencias con filtros
export interface FiltrosUrgencia {
  estado?: 'activa' | 'alta' | 'derivada';
  fechaInicio?: Timestamp;
  fechaFin?: Timestamp;
  especialidad?: string;
  medico?: string;
}

export function filtrarUrgencias(
  urgencias: (UrgenciaFirestoreData & { id: string })[], 
  filtros: FiltrosUrgencia
): (UrgenciaFirestoreData & { id: string })[] {
  return urgencias.filter(urgencia => {
    if (filtros.estado && urgencia.Estado !== filtros.estado) {
      return false;
    }

    if (filtros.fechaInicio && urgencia.Fecha_entrada < filtros.fechaInicio) {
      return false;
    }

    if (filtros.fechaFin && urgencia.Fecha_entrada > filtros.fechaFin) {
      return false;
    }

    if (filtros.especialidad && urgencia.Especialidad !== filtros.especialidad) {
      return false;
    }

    if (filtros.medico && !urgencia.Medico_responsable.includes(filtros.medico)) {
      return false;
    }

    return true;
  });
}