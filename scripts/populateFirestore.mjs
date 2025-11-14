// my-hospital-app/scripts/populateFirestore.mjs

// ✅ CORREGIDO: Usando import en lugar de require
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' with { type: 'json' };
import { Timestamp } from 'firebase-admin/firestore';

// Inicializa Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const NUM_PACIENTES = Math.floor(Math.random() * (1000 - 500 + 1)) + 500; // Entre 500 y 1000 pacientes
const BATCH_SIZE = 400; // Máximo 500 operaciones por batch en Firestore

// --- FUNCIONES AUXILIARES PARA GENERAR DATOS FICTICIOS ---

const NOMBRES = ["Ana", "Carlos", "María", "Pedro", "Laura", "Javier", "Sofía", "Miguel", "Isabel", "David", "Elena", "Pablo", "Lucía", "Alejandro", "Carmen", "Daniel", "Paula", "Adrián", "Sara", "Diego", "Clara"];
const APELLIDOS = ["García", "Fernández", "Rodríguez", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Alonso", "Gutierrez", "Navarro"];
const SEXOS = ["Masculino", "Femenino", "Otro"];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDNI() {
  const num = Math.floor(10000000 + Math.random() * 90000000); // 8 dígitos
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
  const letra = letras.charAt(num % 23);
  return `${num}${letra}`;
}

function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRandomPaciente(index) {
  const nombre = getRandomElement(NOMBRES);
  const apellido1 = getRandomElement(APELLIDOS);
  const apellido2 = Math.random() > 0.3 ? getRandomElement(APELLIDOS) : null; // Cambiado a null en lugar de undefined
  const dni = generateDNI();
  const fechaNacimiento = generateRandomDate(new Date(1950, 0, 1), new Date(2005, 11, 31)); // Entre 1950 y 2005
  const sexo = getRandomElement(SEXOS);
  const numHistoriaClinica = `HC-${100000 + index}`; // Simple, pero único para cada paciente
  const sip = Math.random() > 0.5 ? `SIP-${Math.floor(100000000 + Math.random() * 900000000)}` : null; // Cambiado a null
  const numSegSocial = Math.random() > 0.5 ? `SS-${Math.floor(1000000000 + Math.random() * 9000000000)}` : null; // Cambiado a null
  const telefono = Math.random() > 0.5 ? `+346${Math.floor(10000000 + Math.random() * 90000000)}` : null; // Cambiado a null
  const direccion = Math.random() > 0.5 ? `C/ Ficticia ${Math.floor(1 + Math.random() * 100)}, ${Math.floor(1 + Math.random() * 50)} ${Math.random() > 0.5 ? 'A' : 'B'}` : null; // Cambiado a null
  const codigoPostal = Math.random() > 0.5 ? `${Math.floor(10000 + Math.random() * 90000)}` : null; // Cambiado a null

  // Creamos el objeto paciente y eliminamos cualquier campo que sea null
  const paciente = {
    Id_paciente: `ID-${index + 1}`, // Identificador único simple
    Nombre: nombre,
    Apellido1: apellido1,
    Apellido2: apellido2, // Ahora puede ser null
    DNI_NIE: dni,
    FechaNacimiento: Timestamp.fromDate(fechaNacimiento),
    Sexo: sexo,
    SIP: sip, // Ahora puede ser null
    NumSeguridadSocial: numSegSocial, // Ahora puede ser null
    NumHistoriaClinica: numHistoriaClinica,
    Direccion: direccion, // Ahora puede ser null
    CodigoPostal: codigoPostal, // Ahora puede ser null
    Telefono: telefono, // Ahora puede ser null
    creadoPor: "script@example.com", // Usuario ficticio que lo crea
    creadoEn: Timestamp.now(),
  };

  // Filtramos las propiedades que son null antes de enviarlas a Firestore
  Object.keys(paciente).forEach(key => {
    if (paciente[key] === null) {
      delete paciente[key];
    }
  });

  return paciente;
}

// --- FUNCIÓN PRINCIPAL PARA POBLAR FIRESTORE ---

async function populateFirestore() {
  console.log(`Iniciando la carga de ${NUM_PACIENTES} pacientes...`);
  const pacientesCollection = db.collection('pacientes');
  let currentBatch = db.batch();
  let batchCount = 0;
  let totalAdded = 0;

  for (let i = 0; i < NUM_PACIENTES; i++) {
    const paciente = generateRandomPaciente(i);
    const docRef = pacientesCollection.doc(); // Firestore generará un ID automáticamente
    currentBatch.set(docRef, paciente);
    batchCount++;

    if (batchCount === BATCH_SIZE) {
      await currentBatch.commit();
      console.log(`Batch #${totalAdded / BATCH_SIZE + 1} de pacientes commited. Total añadidos: ${totalAdded + batchCount}`);
      totalAdded += batchCount;
      currentBatch = db.batch();
      batchCount = 0;
    }
  }

  // Commit cualquier operación restante en el último batch
  if (batchCount > 0) {
    await currentBatch.commit();
    totalAdded += batchCount;
    console.log(`Último batch de pacientes commited. Total añadidos: ${totalAdded}`);
  }

  console.log(`Carga de ${totalAdded} pacientes completada con éxito.`);
  process.exit(0); // Termina el script
}

// Ejecutar la función principal
populateFirestore().catch(error => {
  console.error("Error al poblar Firestore:", error);
  process.exit(1); // Termina el script con error
});