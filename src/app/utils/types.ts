import { Timestamp } from 'firebase/firestore';

export interface PacienteData {
  id?: string;
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  DNI_NIE: string;
  FechaNacimiento: Timestamp | any;
  Sexo: string;
  SIP: string;
  NumSeguridadSocial?: string;
  NumHistoriaClinica: string;
  Direccion?: string;
  CodigoPostal?: string;
  Telefono: string;
  creadoPor?: string;
  creadoEn?: Timestamp | any;
}

export interface PacienteFormData {
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2: string;
  DNI_NIE: string;
  FechaNacimiento: string;
  Sexo: string;
  SIP: string;
  NumSeguridadSocial: string;
  NumHistoriaClinica: string;
  Direccion: string;
  CodigoPostal: string;
  Telefono: string;
}

// Interfaces para Urgencias
export interface UrgenciaData {
  id?: string;
  Id_Urgencia: string;
  Id_Paciente: string;
  Cobertura_SS: string;
  Tipo_Acreditacion: string;
  Fecha_entrada: Timestamp | any;
  Fecha_salida?: Timestamp | any;
  Hora_Entrada: string;
  Hora_salida?: string;
  Especialidad: string;
  Motivo_Urgencia: string;
  Lesion?: string;
  Entidad?: string;
  Destino?: string;
  Medico_responsable: string;
  Motivo_alta?: string;
  Fecha_alta?: Timestamp | any;
  Estado: 'activa' | 'alta' | 'derivada';
  creadoPor?: string;
  creadoEn?: Timestamp | any;
  actualizadoEn?: Timestamp | any;
}

export interface UrgenciaCreate {
  Id_Urgencia: string;
  Id_Paciente: string;
  Cobertura_SS: string;
  Tipo_Acreditacion: string;
  Fecha_entrada: Timestamp | any;
  Hora_Entrada: string;
  Especialidad: string;
  Motivo_Urgencia: string;
  Medico_responsable: string;
  Estado: 'activa' | 'alta' | 'derivada';
  creadoPor?: string;
}

export interface UrgenciaReporte {
  id: string;
  Id_Urgencia: string;
  Id_Paciente: string;
  NombrePaciente: string;
  Apellido1: string;
  Fecha_entrada: Timestamp | any;
  Hora_Entrada: string;
  Hora_salida?: string;
  Especialidad: string;
  Motivo_Urgencia: string;
  Medico_responsable: string;
  Estado: string;
  Motivo_alta?: string;
}

// Interfaces para Hospitalización
export interface EpisodioHospitalizacion {
  id: string;
  paciente_id: string;
  fecha_ingreso: string;
  fecha_alta?: string;
  medico_tratante: string;
  departamento: string;
  motivo_ingreso: string;
  diagnostico_inicial: string;
  diagnostico_final?: string;
  resumen_alta?: string;
  condicion_alta?: string;
  instrucciones_seguimiento?: string;
  habitacion: string;
  cama: string;
  signos_vitales: SignosVitales[];
  resultados_laboratorio: ResultadoLaboratorio[];
  estudios_imagen: EstudioImagen[];
  notas_evolucion: NotaEvolucion[];
  tratamientos: Tratamiento[];
  procedimientos: Procedimiento[];
  medicamentos_alta: string[];
  medicamentos_actuales: string[];
  alergias: string[];
  antecedentes_medicos: string;
}

export interface NotaEvolucion {
  fecha: string;
  medico: string;
  subjetivo: string;
  objetivo: string;
  evaluacion: string;
  plan: string;
}

export interface SignosVitales {
  fecha: string;
  presion_arterial: string;
  frecuencia_cardiaca: number;
  frecuencia_respiratoria: number;
  temperatura: number;
  saturacion_oxigeno: number;
}

export interface ResultadoLaboratorio {
  fecha: string;
  tipo: string;
  resultado: string;
  unidades?: string;
  valores_referencia?: string;
  observaciones?: string;
}

export interface EstudioImagen {
  fecha: string;
  tipo: string;
  area_estudiada: string;
  hallazgos: string;
  interpretacion: string;
  medico_radiologo: string;
}

export interface Tratamiento {
  fecha: string;
  tipo: string;
  descripcion: string;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  medico_prescriptor: string;
}

export interface Procedimiento {
  fecha: string;
  tipo: string;
  descripcion: string;
  medico_realizador: string;
  anestesia?: string;
  complicaciones?: string;
}

export interface InformeAlta {
  nombre_hospital: string;
  titulo_informe: string;
  info_paciente: {
    nombre: string;
    id: string;
    edad: number;
    genero: string;
  };
  info_episodio: {
    fecha_ingreso: string;
    fecha_alta: string;
    dias_estancia: number;
    medico_tratante: string;
    departamento: string;
  };
  info_clinica: {
    motivo_ingreso: string;
    diagnostico_inicial: string;
    diagnostico_final: string;
    procedimientos_realizados: Procedimiento[];
    evolucion_hospitalaria: string;
    condicion_alta: string;
    medicamentos_alta: string[];
    instrucciones_seguimiento: string;
  };
}

// Interfaces para Urgencias (compatibles con las existentes)
export interface EpisodioUrgencias {
  id: string;
  paciente_id: string;
  fecha_ingreso: string;
  triaje: Triaje;
  motivo_consulta: string;
  diagnostico: string;
  tratamiento: string;
  destino: 'alta' | 'hospitalizacion' | 'observacion';
  fecha_alta?: string;
}

export interface Triaje {
  nivel: 1 | 2 | 3 | 4 | 5;
  signos_vitales: SignosVitales;
  sintomas_principales: string[];
}

// Interface para el contexto de autenticación
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'medico' | 'enfermero' | 'administrativo';
  departamento?: string;
  especialidad?: string;
}

// Interface para búsquedas
export interface SearchFilters {
  pacienteId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  departamento?: string;
  estado?: 'activo' | 'completado' | 'activa' | 'alta' | 'derivada';
  especialidad?: string;
  medico?: string;
}

// Interfaces adicionales para mejor organización
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Alias para compatibilidad
export type Urgencia = UrgenciaData;