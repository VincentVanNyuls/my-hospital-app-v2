// my-hospital-app/scripts/populateFirestore.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// --- IMPORTANTE: CONFIGURACIÓN DE TU SERVICE ACCOUNT ---
// Asegúrate de que 'serviceAccountKey.json' esté en la raíz de tu proyecto 'my-hospital-app'
// O ajusta la ruta si lo tienes en otra carpeta.
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Error: El archivo de la clave de la cuenta de servicio no se encuentra en ${serviceAccountPath}`);
    console.error("Por favor, descarga 'serviceAccountKey.json' desde la consola de Firebase");
    console.error("y colócalo en la raíz de tu proyecto ('my-hospital-app/').");
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function populateFirestore() {
  try {
    console.log("Iniciando la carga de datos de pacientes ficticios...");

    const pacientesRef = db.collection('pacientes');

    // Eliminar todos los documentos existentes en la colección para evitar duplicados en cada ejecución
    const snapshot = await pacientesRef.get();
    if (!snapshot.empty) {
      console.log(`Eliminando ${snapshot.docs.length} documentos existentes...`);
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log("Documentos existentes eliminados.");
    }

    const pacientes = [];
    for (let i = 1; i <= 1000; i++) { // Generar 1000 pacientes
      const gender = Math.random() < 0.5 ? 'Masculino' : 'Femenino';
      const dob = new Date(1950 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1); // Nacidos entre 1950 y 1999
      
      pacientes.push({
        Id_paciente: `PAC${String(i).padStart(4, '0')}`,
        Nombre: `Paciente${i}`,
        Apellido1: `ApellidoA${i}`,
        Apellido2: `ApellidoB${i}`,
        DNI_NIE: `12345678${String(i).padStart(2, '0')}X`.substring(0, 9), // DNI ficticio
        FechaNacimiento: dob,
        Sexo: gender,
        SIP: `SIP-${String(i).padStart(7, '0')}`,
        NumSeguridadSocial: `NSS-${String(i).padStart(8, '0')}`,
        NumHistoriaClinica: `HC-${String(i).padStart(6, '0')}`,
        Direccion: `Calle Ficticia ${i}`,
        CodigoPostal: `123${String(i).padStart(2, '0')}`,
        Telefono: `600123${String(i).padStart(3, '0')}`,
        creadoPor: 'admin@hospital.com',
        creadoEn: new Date(),
      });
    }

    console.log(`Añadiendo ${pacientes.length} pacientes...`);
    const batchSize = 500; // Firebase Batch permite hasta 500 operaciones
    for (let i = 0; i < pacientes.length; i += batchSize) {
      const batch = db.batch();
      const chunk = pacientes.slice(i, i + batchSize);
      chunk.forEach(paciente => {
        const docRef = pacientesRef.doc(); // Firestore genera un ID único
        batch.set(docRef, paciente);
      });
      await batch.commit();
      console.log(`Chunk ${i / batchSize + 1} de ${Math.ceil(pacientes.length / batchSize)} commiteado.`);
    }

    console.log("Carga de datos de pacientes ficticios completada.");
  } catch (error: unknown) { // Usamos 'unknown' aquí
      if (error instanceof Error) {
        console.error("Error al cargar datos de pacientes:", error.message);
      } else {
        console.error("Error desconocido al cargar datos de pacientes:", error);
      }
  }
}

populateFirestore().catch(error => {
  console.error("Fallo grave en populateFirestore:", error);
  process.exit(1);
});

