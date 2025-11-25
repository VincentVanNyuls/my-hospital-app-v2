// src/app/utils/initializeTestData.ts
import { db } from './firebase';
import { collection, addDoc, getDocs, Timestamp, query, where } from 'firebase/firestore';

export interface InitializeResult {
  success: boolean;
  message: string;
  details: {
    pruebasMedicas: number;
    especialidades: number;
    facultativos: number;
    procedencias: number;
  };
}

export async function initializeTestData(): Promise<InitializeResult> {
  const agendaSnapshot = await getDocs(collection(db, "agenda_consultas"));
  const result: InitializeResult = {
    success: true,
    message: 'Datos inicializados correctamente',
    details: {
      pruebasMedicas: 0,
      especialidades: 0,
      facultativos: 0,
      procedencias: 0
    }
    
  };
  try {
    // Verificar si ya existen datos para no duplicar
    const [pruebasSnapshot, especialidadesSnapshot, facultativosSnapshot, procedenciasSnapshot] = await Promise.all([
      getDocs(collection(db, "pruebas_medicas")),
      getDocs(collection(db, "especialidades")),
      getDocs(collection(db, "facultativos")),
      getDocs(collection(db, "procedencias"))
    ]);

    // Solo inicializar si no hay datos existentes
    if (pruebasSnapshot.size > 0 || especialidadesSnapshot.size > 0 || 
    facultativosSnapshot.size > 0 || procedenciasSnapshot.size > 0 ||
    agendaSnapshot.size > 0) {
      result.success = false;
      result.message = 'Ya existen datos en la base de datos. No se inicializaron nuevos datos.';
      return result;
    }

    // Datos de Pruebas Médicas
    const pruebasMedicas = [
      {
        Id_PRU: "PRU-001",
        Descripción: "Analítica sanguínea completa",
        Categoría: "Laboratorio",
        Duración_estimada: 15,
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRU: "PRU-002",
        Descripción: "Radiografía de tórax",
        Categoría: "Imagen",
        Duración_estimada: 30,
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRU: "PRU-003",
        Descripción: "Electrocardiograma",
        Categoría: "Cardiología",
        Duración_estimada: 20,
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRU: "PRU-004",
        Descripción: "Ecografía abdominal",
        Categoría: "Imagen",
        Duración_estimada: 45,
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRU: "PRU-005",
        Descripción: "Tomografía computarizada",
        Categoría: "Imagen",
        Duración_estimada: 60,
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRU: "PRU-006",
        Descripción: "Resonancia magnética",
        Categoría: "Imagen",
        Duración_estimada: 90,
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRU: "PRU-007",
        Descripción: "Endoscopia digestiva",
        Categoría: "Digestivo",
        Duración_estimada: 60,
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRU: "PRU-008",
        Descripción: "Prueba de esfuerzo",
        Categoría: "Cardiología",
        Duración_estimada: 45,
        Activo: true,
        creadoEn: Timestamp.now()
      }
    ];

    // Datos de Especialidades
    const especialidades = [
      {
        Id_ESP: "ESP-001",
        Nombre: "Cardiología",
        Descripción: "Especialidad en enfermedades del corazón y sistema cardiovascular",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_ESP: "ESP-002",
        Nombre: "Dermatología",
        Descripción: "Especialidad en enfermedades de la piel",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_ESP: "ESP-003",
        Nombre: "Endocrinología",
        Descripción: "Especialidad en trastornos hormonales y metabólicos",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_ESP: "ESP-004",
        Nombre: "Gastroenterología",
        Descripción: "Especialidad en enfermedades del aparato digestivo",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_ESP: "ESP-005",
        Nombre: "Neurología",
        Descripción: "Especialidad en enfermedades del sistema nervioso",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_ESP: "ESP-006",
        Nombre: "Oftalmología",
        Descripción: "Especialidad en enfermedades de los ojos",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_ESP: "ESP-007",
        Nombre: "Traumatología",
        Descripción: "Especialidad en lesiones del sistema musculoesquelético",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_ESP: "ESP-008",
        Nombre: "Pediatría",
        Descripción: "Especialidad en salud infantil",
        Activo: true,
        creadoEn: Timestamp.now()
      }
    ];

    // Datos de Facultativos
    const facultativos = [
      {
        Id_FAC: "FAC-001",
        Nombre: "Ana",
        Apellido1: "García",
        Apellido2: "López",
        Especialidad: "Cardiología",
        NumColegiado: "28475",
        Telefono: "+34 912 345 678",
        Email: "ana.garcia@hospitalrenacer.es",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_FAC: "FAC-002",
        Nombre: "Carlos",
        Apellido1: "Martínez",
        Apellido2: "Rodríguez",
        Especialidad: "Dermatología",
        NumColegiado: "32981",
        Telefono: "+34 912 345 679",
        Email: "carlos.martinez@hospitalrenacer.es",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_FAC: "FAC-003",
        Nombre: "Elena",
        Apellido1: "Fernández",
        Apellido2: "Sánchez",
        Especialidad: "Endocrinología",
        NumColegiado: "45623",
        Telefono: "+34 912 345 680",
        Email: "elena.fernandez@hospitalrenacer.es",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_FAC: "FAC-004",
        Nombre: "David",
        Apellido1: "Pérez",
        Apellido2: "Gómez",
        Especialidad: "Gastroenterología",
        NumColegiado: "51289",
        Telefono: "+34 912 345 681",
        Email: "david.perez@hospitalrenacer.es",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_FAC: "FAC-005",
        Nombre: "Laura",
        Apellido1: "Hernández",
        Apellido2: "Díaz",
        Especialidad: "Neurología",
        NumColegiado: "63457",
        Telefono: "+34 912 345 682",
        Email: "laura.hernandez@hospitalrenacer.es",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_FAC: "FAC-006",
        Nombre: "Javier",
        Apellido1: "Jiménez",
        Apellido2: "Ruiz",
        Especialidad: "Oftalmología",
        NumColegiado: "74512",
        Telefono: "+34 912 345 683",
        Email: "javier.jimenez@hospitalrenacer.es",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_FAC: "FAC-007",
        Nombre: "María",
        Apellido1: "Torres",
        Apellido2: "Moreno",
        Especialidad: "Traumatología",
        NumColegiado: "85634",
        Telefono: "+34 912 345 684",
        Email: "maria.torres@hospitalrenacer.es",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_FAC: "FAC-008",
        Nombre: "Roberto",
        Apellido1: "Navarro",
        Apellido2: "Alonso",
        Especialidad: "Pediatría",
        NumColegiado: "96745",
        Telefono: "+34 912 345 685",
        Email: "roberto.navarro@hospitalrenacer.es",
        Activo: true,
        creadoEn: Timestamp.now()
      }
    ];

    // Datos de Procedencias
    const procedencias = [
      {
        Id_PRO: "PRO-001",
        Procedencia: "Atención Primaria",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRO: "PRO-002",
        Procedencia: "Urgencias Hospitalarias",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRO: "PRO-003",
        Procedencia: "Derivación de otra especialidad",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRO: "PRO-004",
        Procedencia: "Consulta privada",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRO: "PRO-005",
        Procedencia: "Mutua laboral",
        Activo: true,
        creadoEn: Timestamp.now()
      },
      {
        Id_PRO: "PRO-006",
        Procedencia: "Auto-derivación",
        Activo: true,
        creadoEn: Timestamp.now()
      }
    ];

    // Insertar todos los datos
    const promises = [
      ...pruebasMedicas.map(data => addDoc(collection(db, "pruebas_medicas"), data)),
      ...especialidades.map(data => addDoc(collection(db, "especialidades"), data)),
      ...facultativos.map(data => addDoc(collection(db, "facultativos"), data)),
      ...procedencias.map(data => addDoc(collection(db, "procedencias"), data))
    ];

    await Promise.all(promises);

    // Actualizar contadores
    result.details = {
      pruebasMedicas: pruebasMedicas.length,
      especialidades: especialidades.length,
      facultativos: facultativos.length,
      procedencias: procedencias.length
    };

    return result;

  } catch (error) {
    console.error("Error inicializando datos de prueba:", error);
    result.success = false;
    result.message = `Error al inicializar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    return result;
  }
}

// Función para verificar si existen datos
export async function checkExistingData(): Promise<boolean> {
  try {
    const [pruebasSnapshot, especialidadesSnapshot, facultativosSnapshot, procedenciasSnapshot] = await Promise.all([
      getDocs(collection(db, "pruebas_medicas")),
      getDocs(collection(db, "especialidades")),
      getDocs(collection(db, "facultativos")),
      getDocs(collection(db, "procedencias"))
    ]);

    return pruebasSnapshot.size > 0 || 
           especialidadesSnapshot.size > 0 || 
           facultativosSnapshot.size > 0 || 
           procedenciasSnapshot.size > 0;
  } catch (error) {
    console.error("Error verificando datos existentes:", error);
    return false;
  }
}