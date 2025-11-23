// src/types/hospitalizacion.ts
export interface EpisodioHospitalizacion {
  id: string;
  paciente_id: string;
  fecha_ingreso: string;
  fecha_alta?: string;
  motivo_ingreso: string;
  diagnostico_inicial: string;
  diagnostico_final?: string;
  medico_tratante: string;
  departamento: string;
  habitacion: string;
  cama: string;
  
  // Datos clínicos
  antecedentes_medicos: string;
  medicamentos_actuales: string[];
  alergias: string[];
  signos_vitales: SignosVitales[];
  resultados_laboratorio: ResultadoLaboratorio[];
  estudios_imagen: EstudioImagen[];
  
  // Evolución
  notas_evolucion: NotaEvolucion[];
  tratamientos: Tratamiento[];
  procedimientos: Procedimiento[];
  
  // Alta médica
  resumen_alta?: string;
  condicion_alta?: string;
  instrucciones_seguimiento?: string;
  medicamentos_alta: string[];
}

export interface SignosVitales {
  fecha: string;
  presion_arterial: string;
  frecuencia_cardiaca: number;
  frecuencia_respiratoria: number;
  temperatura: number;
  saturacion_oxigeno: number;
}

// CORREGIDO: Cambiar nombres para que coincidan con el servicio
export interface ResultadoLaboratorio {
  fecha: string;
  tipo: string;                    // Cambiado de 'nombre_prueba'
  resultado: string;              // Cambiado de 'resultados'
  unidades?: string;
  valores_referencia?: string;    // Cambiado de 'rango_referencia'
  observaciones?: string;         // Cambiado de 'interpretacion'
}

// CORREGIDO: Cambiar nombres para que coincidan con el servicio
export interface EstudioImagen {
  fecha: string;
  tipo: string;                   // Cambiado de 'tipo_estudio'
  area_estudiada: string;         // Nuevo campo requerido
  hallazgos: string;
  interpretacion: string;         // Cambiado de 'impresion'
  medico_radiologo: string;       // Nuevo campo requerido
}

export interface NotaEvolucion {
  fecha: string;
  medico: string;
  subjetivo: string;
  objetivo: string;
  evaluacion: string;
  plan: string;
}

// CORREGIDO: Cambiar nombres para que coincidan con el servicio
export interface Tratamiento {
  fecha: string;
  tipo: string;                   // Cambiado de 'medicamento'
  descripcion: string;            // Cambiado de combinación de campos
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  medico_prescriptor: string;     // Nuevo campo requerido
}

// CORREGIDO: Cambiar nombres para que coincidan con el servicio
export interface Procedimiento {
  fecha: string;
  tipo: string;                   // Cambiado de 'nombre_procedimiento'
  descripcion: string;            // Cambiado de 'hallazgos'
  medico_realizador: string;      // Cambiado de 'medico'
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