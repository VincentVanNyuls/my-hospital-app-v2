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

// Interfaz para los datos de Consulta Externa tal como se almacenan en Firestore
export interface ConsultaExternaFirestoreData {
  Id_CEX: string;
  Paciente: string; // ID del paciente
  Prioridad: 'Ordinaria' | 'Preferente' | 'Urgente';
  Tipo_visita: 'Primera visita' | 'Visita sucesiva';
  Llegada: boolean;
  Fecha: Timestamp;
  Hora: Timestamp;
  Especialidad: string;
  Tipo_Prueba?: string;
  Procedencia?: string;
  Derivación?: string;
  Médico_responsable?: string;
  Visita_médica?: string;
  Cobertura_SS?: boolean;
  Entidad?: string;
  Tipo_Acreditación?: string;
  Estado: 'programada' | 'en_curso' | 'completada' | 'cancelada';
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

// Interfaz para Especialidades
export interface EspecialidadFirestoreData {
  Id_ESP: string;
  Nombre: string;
  Descripción?: string;
  Activo: boolean;
  creadoEn: Timestamp;
}

// Interfaz para Pruebas Médicas
export interface PruebaMedicaFirestoreData {
  Id_PRU: string;
  Descripción: string;
  Categoría?: string;
  Duración_estimada?: number; // en minutos
  Activo: boolean;
  creadoEn: Timestamp;
}

// Interfaz para Procedencias
export interface ProcedenciaFirestoreData {
  Id_PRO: string;
  Procedencia: string;
  Activo: boolean;
  creadoEn: Timestamp;
}

// Interfaz para Facultativos
export interface FacultativoFirestoreData {
  Id_FAC: string;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  Especialidad: string;
  NumColegiado: string;
  Telefono?: string;
  Email?: string;
  Activo: boolean;
  creadoEn: Timestamp;
}

// Interfaz para Agenda de Consultas
export interface AgendaConsultaFirestoreData {
  Id_AGENDA: string;
  Facultativo: string;
  Especialidad: string;
  Fecha: Timestamp;
  Hora_inicio: Timestamp;
  Hora_fin: Timestamp;
  Consulta: string;
  Estado: 'disponible' | 'reservada' | 'completada' | 'cancelada';
  Paciente?: string;
  Consulta_externa?: string;
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

// Función para mapear un QueryDocumentSnapshot a ConsultaExternaData con tipado seguro
export function mapDocumentToConsultaExternaData(doc: QueryDocumentSnapshot<DocumentData>): ConsultaExternaFirestoreData & { id: string } {
    const rawData = doc.data();

    return {
        id: doc.id,
        Id_CEX: rawData.Id_CEX || `CEX-${doc.id}`,
        Paciente: rawData.Paciente || '',
        Prioridad: rawData.Prioridad || 'Ordinaria',
        Tipo_visita: rawData.Tipo_visita || 'Primera visita',
        Llegada: rawData.Llegada || false,
        Fecha: convertToFirestoreTimestamp(rawData.Fecha),
        Hora: convertToFirestoreTimestamp(rawData.Hora),
        Especialidad: rawData.Especialidad || '',
        Tipo_Prueba: rawData.Tipo_Prueba || undefined,
        Procedencia: rawData.Procedencia || undefined,
        Derivación: rawData.Derivación || undefined,
        Médico_responsable: rawData.Médico_responsable || undefined,
        Visita_médica: rawData.Visita_médica || undefined,
        Cobertura_SS: rawData.Cobertura_SS || true,
        Entidad: rawData.Entidad || undefined,
        Tipo_Acreditación: rawData.Tipo_Acreditación || undefined,
        Estado: rawData.Estado || 'programada',
        creadoPor: rawData.creadoPor || 'sistema',
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
        actualizadoEn: convertToFirestoreTimestamp(rawData.actualizadoEn),
    };
}

// Función para mapear un QueryDocumentSnapshot a EspecialidadData
export function mapDocumentToEspecialidadData(doc: QueryDocumentSnapshot<DocumentData>): EspecialidadFirestoreData & { id: string } {
    const rawData = doc.data();

    return {
        id: doc.id,
        Id_ESP: rawData.Id_ESP || `ESP-${doc.id}`,
        Nombre: rawData.Nombre || '',
        Descripción: rawData.Descripción || '',
        Activo: rawData.Activo !== undefined ? rawData.Activo : true,
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
    };
}

// Función para mapear un QueryDocumentSnapshot a PruebaMedicaData
export function mapDocumentToPruebaMedicaData(doc: QueryDocumentSnapshot<DocumentData>): PruebaMedicaFirestoreData & { id: string } {
    const rawData = doc.data();

    return {
        id: doc.id,
        Id_PRU: rawData.Id_PRU || `PRU-${doc.id}`,
        Descripción: rawData.Descripción || '',
        Categoría: rawData.Categoría || 'General',
        Duración_estimada: rawData.Duración_estimada || 30,
        Activo: rawData.Activo !== undefined ? rawData.Activo : true,
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
    };
}

// Función para mapear un QueryDocumentSnapshot a ProcedenciaData
export function mapDocumentToProcedenciaData(doc: QueryDocumentSnapshot<DocumentData>): ProcedenciaFirestoreData & { id: string } {
    const rawData = doc.data();

    return {
        id: doc.id,
        Id_PRO: rawData.Id_PRO || `PRO-${doc.id}`,
        Procedencia: rawData.Procedencia || '',
        Activo: rawData.Activo !== undefined ? rawData.Activo : true,
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
    };
}

// Función para mapear un QueryDocumentSnapshot a FacultativoData
export function mapDocumentToFacultativoData(doc: QueryDocumentSnapshot<DocumentData>): FacultativoFirestoreData & { id: string } {
    const rawData = doc.data();

    return {
        id: doc.id,
        Id_FAC: rawData.Id_FAC || `FAC-${doc.id}`,
        Nombre: rawData.Nombre || '',
        Apellido1: rawData.Apellido1 || '',
        Apellido2: rawData.Apellido2 || '',
        Especialidad: rawData.Especialidad || '',
        NumColegiado: rawData.NumColegiado || '',
        Telefono: rawData.Telefono || '',
        Email: rawData.Email || '',
        Activo: rawData.Activo !== undefined ? rawData.Activo : true,
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
    };
}

// Función para mapear un QueryDocumentSnapshot a AgendaConsultaData
export function mapDocumentToAgendaConsultaData(doc: QueryDocumentSnapshot<DocumentData>): AgendaConsultaFirestoreData & { id: string } {
    const rawData = doc.data();

    return {
        id: doc.id,
        Id_AGENDA: rawData.Id_AGENDA || `AG-${doc.id}`,
        Facultativo: rawData.Facultativo || '',
        Especialidad: rawData.Especialidad || '',
        Fecha: convertToFirestoreTimestamp(rawData.Fecha),
        Hora_inicio: convertToFirestoreTimestamp(rawData.Hora_inicio),
        Hora_fin: convertToFirestoreTimestamp(rawData.Hora_fin),
        Consulta: rawData.Consulta || '',
        Estado: rawData.Estado || 'disponible',
        Paciente: rawData.Paciente || undefined,
        Consulta_externa: rawData.Consulta_externa || undefined,
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

// Función para crear datos iniciales de consulta externa
export function createInitialConsultaExternaData(pacienteId: string, usuarioId: string): Omit<ConsultaExternaFirestoreData, 'id'> {
  const now = Timestamp.now();
  return {
    Id_CEX: `CEX-${Date.now()}`,
    Paciente: pacienteId,
    Prioridad: 'Ordinaria',
    Tipo_visita: 'Primera visita',
    Llegada: false,
    Fecha: now,
    Hora: now,
    Especialidad: '',
    Estado: 'programada',
    Cobertura_SS: true,
    creadoPor: usuarioId,
    creadoEn: now,
    actualizadoEn: now,
  };
}

// Función para crear datos iniciales de agenda
export function createInitialAgendaData(
  facultativoId: string, 
  especialidad: string, 
  fecha: Timestamp, 
  horaInicio: Timestamp, 
  horaFin: Timestamp, 
  consulta: string,
  usuarioId: string
): Omit<AgendaConsultaFirestoreData, 'id'> {
  return {
    Id_AGENDA: `AG-${Date.now()}`,
    Facultativo: facultativoId,
    Especialidad: especialidad,
    Fecha: fecha,
    Hora_inicio: horaInicio,
    Hora_fin: horaFin,
    Consulta: consulta,
    Estado: 'disponible',
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

// Función para validar datos de consulta externa antes de guardar
export function validarDatosConsultaExterna(consultaData: Partial<ConsultaExternaFirestoreData>): string[] {
  const errores: string[] = [];

  if (!consultaData.Paciente) {
    errores.push('El paciente es requerido');
  }

  if (!consultaData.Especialidad) {
    errores.push('La especialidad es requerida');
  }

  if (!consultaData.Fecha) {
    errores.push('La fecha es requerida');
  }

  if (!consultaData.Hora) {
    errores.push('La hora es requerida');
  }

  if (!consultaData.Prioridad) {
    errores.push('La prioridad es requerida');
  }

  if (!consultaData.Tipo_visita) {
    errores.push('El tipo de visita es requerido');
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

// Función para formatear solo la hora de un Timestamp
export function formatFirestoreTime(timestamp: Timestamp): string {
  if (!timestamp) return 'Hora no disponible';
  try {
    return timestamp.toDate().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando hora:', error);
    return 'Hora inválida';
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

// Función para calcular la duración de una consulta en minutos
export function calcularDuracionConsulta(horaInicio: Timestamp, horaFin: Timestamp): number {
  try {
    const inicio = horaInicio.toDate();
    const fin = horaFin.toDate();
    const diffMs = fin.getTime() - inicio.getTime();
    return Math.floor(diffMs / (1000 * 60));
  } catch (error) {
    console.error('Error calculando duración de consulta:', error);
    return 0;
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

// Función para generar estadísticas de consultas externas
export interface EstadisticasConsultasExternas {
  total: number;
  programadas: number;
  en_curso: number;
  completadas: number;
  canceladas: number;
  primera_visita: number;
  visita_sucesiva: number;
  especialidadMasComun: string;
  promedioDuracion: number; // en minutos
}

export function generarEstadisticasConsultasExternas(
  consultas: (ConsultaExternaFirestoreData & { id: string })[],
  agenda: (AgendaConsultaFirestoreData & { id: string })[]
): EstadisticasConsultasExternas {
  const estadisticas: EstadisticasConsultasExternas = {
    total: consultas.length,
    programadas: 0,
    en_curso: 0,
    completadas: 0,
    canceladas: 0,
    primera_visita: 0,
    visita_sucesiva: 0,
    especialidadMasComun: 'N/A',
    promedioDuracion: 0
  };

  if (consultas.length === 0) {
    return estadisticas;
  }

  // Contar por estado y tipo de visita
  consultas.forEach(consulta => {
    switch (consulta.Estado) {
      case 'programada':
        estadisticas.programadas++;
        break;
      case 'en_curso':
        estadisticas.en_curso++;
        break;
      case 'completada':
        estadisticas.completadas++;
        break;
      case 'cancelada':
        estadisticas.canceladas++;
        break;
    }

    if (consulta.Tipo_visita === 'Primera visita') {
      estadisticas.primera_visita++;
    } else {
      estadisticas.visita_sucesiva++;
    }
  });

  // Calcular especialidad más común
  const especialidadesCount: { [key: string]: number } = {};
  consultas.forEach(consulta => {
    especialidadesCount[consulta.Especialidad] = (especialidadesCount[consulta.Especialidad] || 0) + 1;
  });

  const especialidadMasComun = Object.entries(especialidadesCount)
    .sort(([, a], [, b]) => b - a)[0];
  
  if (especialidadMasComun) {
    estadisticas.especialidadMasComun = especialidadMasComun[0];
  }

  // Calcular duración promedio (solo para consultas completadas con agenda)
  const consultasCompletadas = consultas.filter(c => c.Estado === 'completada');
  if (consultasCompletadas.length > 0) {
    let totalDuracion = 0;
    let contadorDuracion = 0;

    consultasCompletadas.forEach(consulta => {
      const citaAgenda = agenda.find(a => a.Consulta_externa === consulta.id);
      if (citaAgenda && citaAgenda.Hora_inicio && citaAgenda.Hora_fin) {
        const duracion = calcularDuracionConsulta(citaAgenda.Hora_inicio, citaAgenda.Hora_fin);
        totalDuracion += duracion;
        contadorDuracion++;
      }
    });

    if (contadorDuracion > 0) {
      estadisticas.promedioDuracion = Math.round(totalDuracion / contadorDuracion);
    }
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

// Función para buscar consultas externas con filtros
export interface FiltrosConsultaExterna {
  estado?: 'programada' | 'en_curso' | 'completada' | 'cancelada';
  fechaInicio?: Timestamp;
  fechaFin?: Timestamp;
  especialidad?: string;
  prioridad?: 'Ordinaria' | 'Preferente' | 'Urgente';
  tipoVisita?: 'Primera visita' | 'Visita sucesiva';
  pacienteId?: string;
}

export function filtrarConsultasExternas(
  consultas: (ConsultaExternaFirestoreData & { id: string })[], 
  filtros: FiltrosConsultaExterna
): (ConsultaExternaFirestoreData & { id: string })[] {
  return consultas.filter(consulta => {
    if (filtros.estado && consulta.Estado !== filtros.estado) {
      return false;
    }

    if (filtros.fechaInicio && consulta.Fecha < filtros.fechaInicio) {
      return false;
    }

    if (filtros.fechaFin && consulta.Fecha > filtros.fechaFin) {
      return false;
    }

    if (filtros.especialidad && consulta.Especialidad !== filtros.especialidad) {
      return false;
    }

    if (filtros.prioridad && consulta.Prioridad !== filtros.prioridad) {
      return false;
    }

    if (filtros.tipoVisita && consulta.Tipo_visita !== filtros.tipoVisita) {
      return false;
    }

    if (filtros.pacienteId && consulta.Paciente !== filtros.pacienteId) {
      return false;
    }

    return true;
  });
}

// Función para buscar disponibilidad en agenda
export interface FiltrosAgenda {
  fecha?: Timestamp;
  especialidad?: string;
  facultativo?: string;
  estado?: 'disponible' | 'reservada' | 'completada' | 'cancelada';
}

export function filtrarAgenda(
  agenda: (AgendaConsultaFirestoreData & { id: string })[], 
  filtros: FiltrosAgenda
): (AgendaConsultaFirestoreData & { id: string })[] {
  return agenda.filter(cita => {
    if (filtros.fecha) {
      const citaFecha = cita.Fecha.toDate();
      const filtroFecha = filtros.fecha.toDate();
      if (citaFecha.toDateString() !== filtroFecha.toDateString()) {
        return false;
      }
    }

    if (filtros.especialidad && cita.Especialidad !== filtros.especialidad) {
      return false;
    }

    if (filtros.facultativo && cita.Facultativo !== filtros.facultativo) {
      return false;
    }

    if (filtros.estado && cita.Estado !== filtros.estado) {
      return false;
    }

    return true;
  });
}

// Función para obtener opciones para dropdowns
export const OPCIONES_PRIORIDAD = [
  { value: 'Ordinaria', label: 'Ordinaria' },
  { value: 'Preferente', label: 'Preferente' },
  { value: 'Urgente', label: 'Urgente' }
];

export const OPCIONES_TIPO_VISITA = [
  { value: 'Primera visita', label: 'Primera Visita' },
  { value: 'Visita sucesiva', label: 'Visita Sucesiva' }
];

export const OPCIONES_DERIVACION = [
  { value: 'Visita sucesiva de control', label: 'Visita sucesiva de control' },
  { value: 'Primera visita con otra especialidad', label: 'Primera visita con otra especialidad' },
  { value: 'Intervención quirúrgica en el centro', label: 'Intervención quirúrgica en el centro' },
  { value: 'Visita médica en otro centro', label: 'Visita médica en otro centro' },
  { value: 'Intervención quirúrgica en otro centro', label: 'Intervención quirúrgica en otro centro' },
  { value: 'Alta con derivación a AP', label: 'Alta con derivación a AP' }
];