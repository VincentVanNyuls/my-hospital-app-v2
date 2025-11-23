// src/app/utils/pacienteService.ts
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { PacienteData } from '../types/paciente';

export class PacienteService {
  
  // Función auxiliar para convertir datos de Firestore
  private static convertFirestoreData(doc: QueryDocumentSnapshot<DocumentData>): PacienteData {
    const data = doc.data();
    
    return {
      id: doc.id,
      Id_paciente: data.Id_paciente || '',
      Nombre: data.Nombre || '',
      Apellido1: data.Apellido1 || '',
      Apellido2: data.Apellido2 || '',
      DNI_NIE: data.DNI_NIE || '',
      FechaNacimiento: data.FechaNacimiento || Timestamp.now(),
      Sexo: data.Sexo || '',
      SIP: data.SIP || '',
      NumSeguridadSocial: data.NumSeguridadSocial || '',
      NumHistoriaClinica: data.NumHistoriaClinica || '',
      Direccion: data.Direccion || '',
      CodigoPostal: data.CodigoPostal || '',
      Telefono: data.Telefono || '',
      creadoPor: data.creadoPor || 'sistema',
      creadoEn: data.creadoEn || Timestamp.now()
    } as PacienteData;
  }

  // Obtener todos los pacientes
  static async getAllPatients(): Promise<PacienteData[]> {
    try {
      console.log('🔥 Obteniendo pacientes de Firestore...');
      const q = query(
        collection(db, 'pacientes'),
        orderBy('Nombre', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const pacientes = querySnapshot.docs.map(doc => this.convertFirestoreData(doc));
      
      console.log(`✅ ${pacientes.length} pacientes obtenidos de Firestore`);
      return pacientes;
    } catch (error) {
      console.error('❌ Error getting patients:', error);
      // Fallback a datos mock para desarrollo
      return this.getMockPatients();
    }
  }

  // Datos mock para desarrollo - USANDO TIMESTAMP
  private static getMockPatients(): PacienteData[] {
    console.log('🔄 Usando datos mock para desarrollo');
    return [
      {
        id: '1',
        Id_paciente: 'P001',
        Nombre: 'Adrián',
        Apellido1: 'Sánchez',
        Apellido2: 'Ruiz',
        DNI_NIE: '12345678A',
        FechaNacimiento: Timestamp.fromDate(new Date('1985-05-15')),
        Sexo: 'Masculino',
        SIP: '123456789',
        NumHistoriaClinica: 'HC001',
        Telefono: '612345678',
        creadoPor: 'sistema',
        creadoEn: Timestamp.now()
      },
      {
        id: '2',
        Id_paciente: 'P002',
        Nombre: 'María',
        Apellido1: 'González',
        Apellido2: 'López',
        DNI_NIE: '87654321B',
        FechaNacimiento: Timestamp.fromDate(new Date('1990-08-20')),
        Sexo: 'Femenino',
        SIP: '987654321',
        NumHistoriaClinica: 'HC002',
        Telefono: '600123456',
        creadoPor: 'sistema',
        creadoEn: Timestamp.now()
      }
    ];
  }

  // Obtener paciente por ID personalizado
  static async getPatientById(patientId: string): Promise<PacienteData | null> {
    try {
      console.log('🔍 Buscando paciente por ID:', patientId);
      const q = query(
        collection(db, 'pacientes'),
        where('Id_paciente', '==', patientId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log('❌ Paciente no encontrado:', patientId);
        return null;
      }
      
      const paciente = this.convertFirestoreData(querySnapshot.docs[0]);
      console.log('✅ Paciente encontrado:', paciente.Nombre);
      return paciente;
    } catch (error) {
      console.error('Error getting patient:', error);
      return null;
    }
  }

  // Obtener paciente por document ID de Firestore
  static async getPatientByDocumentId(documentId: string): Promise<PacienteData | null> {
    try {
      console.log('🔍 Buscando paciente por document ID:', documentId);
      const docRef = doc(db, 'pacientes', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('❌ Documento no encontrado:', documentId);
        return null;
      }
      
      const paciente = this.convertFirestoreData(docSnap as QueryDocumentSnapshot<DocumentData>);
      console.log('✅ Paciente encontrado por document ID:', paciente.Nombre);
      return paciente;
    } catch (error) {
      console.error('Error getting patient by document ID:', error);
      return null;
    }
  }

  // Alias para mantener compatibilidad
  static async obtenerPaciente(documentId: string): Promise<PacienteData | null> {
    return this.getPatientByDocumentId(documentId);
  }

  // Buscar pacientes por múltiples criterios
  static async searchPatients(criteria: {
    nombre?: string;
    apellido1?: string;
    dni?: string;
    sip?: string;
    nhc?: string;
  }): Promise<PacienteData[]> {
    try {
      console.log('🔍 Buscando pacientes con criterios:', criteria);
      
      let q = query(collection(db, 'pacientes'));
      const conditions = [];

      if (criteria.nombre) {
        conditions.push(where('Nombre', '>=', criteria.nombre));
        conditions.push(where('Nombre', '<=', criteria.nombre + '\uf8ff'));
      }
      
      if (criteria.apellido1) {
        conditions.push(where('Apellido1', '>=', criteria.apellido1));
        conditions.push(where('Apellido1', '<=', criteria.apellido1 + '\uf8ff'));
      }
      
      if (criteria.dni) {
        conditions.push(where('DNI_NIE', '==', criteria.dni));
      }
      
      if (criteria.sip) {
        conditions.push(where('SIP', '==', criteria.sip));
      }
      
      if (criteria.nhc) {
        conditions.push(where('NumHistoriaClinica', '==', criteria.nhc));
      }

      if (conditions.length > 0) {
        q = query(collection(db, 'pacientes'), ...conditions);
      }

      const querySnapshot = await getDocs(q);
      const pacientes = querySnapshot.docs.map(doc => this.convertFirestoreData(doc));
      
      console.log(`✅ ${pacientes.length} pacientes encontrados en búsqueda`);
      return pacientes;
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }

  // Crear nuevo paciente
  static async createPatient(pacienteData: Omit<PacienteData, 'id' | 'creadoEn'>): Promise<string | null> {
    try {
      console.log('📝 Creando nuevo paciente...');
      const docRef = await addDoc(collection(db, 'pacientes'), {
        ...pacienteData,
        creadoEn: Timestamp.now()
      });
      console.log('✅ Paciente creado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating patient:', error);
      return null;
    }
  }

  // Actualizar paciente existente
  static async updatePatient(documentId: string, updateData: Partial<PacienteData>): Promise<boolean> {
    try {
      console.log('📝 Actualizando paciente:', documentId);
      const docRef = doc(db, 'pacientes', documentId);
      
      // Remover campos que no deberían actualizarse
      const { id, creadoEn, ...cleanUpdateData } = updateData;
      
      await updateDoc(docRef, {
        ...cleanUpdateData,
        fechaActualizacion: Timestamp.now()
      });
      
      console.log('✅ Paciente actualizado:', documentId);
      return true;
    } catch (error) {
      console.error('❌ Error updating patient:', error);
      return false;
    }
  }

  // Eliminar paciente
  static async deletePatient(documentId: string): Promise<boolean> {
    try {
      console.log('🗑️ Eliminando paciente:', documentId);
      const docRef = doc(db, 'pacientes', documentId);
      await deleteDoc(docRef);
      console.log('✅ Paciente eliminado:', documentId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting patient:', error);
      return false;
    }
  }

  // Verificar si existe un paciente con DNI/NIE
  static async checkDniExists(dni: string, excludePatientId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('DNI_NIE', '==', dni)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (excludePatientId) {
        return querySnapshot.docs.some(doc => doc.id !== excludePatientId);
      }
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking DNI:', error);
      return false;
    }
  }

  // Verificar si existe un paciente con SIP
  static async checkSipExists(sip: string, excludePatientId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('SIP', '==', sip)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (excludePatientId) {
        return querySnapshot.docs.some(doc => doc.id !== excludePatientId);
      }
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking SIP:', error);
      return false;
    }
  }

  // Verificar si existe un paciente con NHC
  static async checkNhcExists(nhc: string, excludePatientId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('NumHistoriaClinica', '==', nhc)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (excludePatientId) {
        return querySnapshot.docs.some(doc => doc.id !== excludePatientId);
      }
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking NHC:', error);
      return false;
    }
  }

  // Obtener estadísticas de pacientes
  static async getPatientStats(): Promise<{
    total: number;
    byGender: { [key: string]: number };
    byAgeGroup: { [key: string]: number };
  }> {
    try {
      const pacientes = await this.getAllPatients();
      const total = pacientes.length;
      
      const byGender = pacientes.reduce((acc, paciente) => {
        const gender = paciente.Sexo || 'No especificado';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const byAgeGroup = pacientes.reduce((acc, paciente) => {
        const age = this.calculateAge(paciente.FechaNacimiento);
        let group = 'Mayor';
        if (age < 18) group = 'Pediatría';
        else if (age < 30) group = 'Joven';
        else if (age < 50) group = 'Adulto';
        else if (age < 65) group = 'Adulto Mayor';
        
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      return { total, byGender, byAgeGroup };
    } catch (error) {
      console.error('Error getting patient stats:', error);
      return { total: 0, byGender: {}, byAgeGroup: {} };
    }
  }

  // Calcular edad desde fecha de nacimiento (Timestamp)
  private static calculateAge(fechaNacimiento: Timestamp): number {
    const birthDate = fechaNacimiento.toDate();
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Obtener pacientes recientes (últimos 30 días)
  static async getRecentPatients(limit: number = 10): Promise<PacienteData[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'pacientes'),
        where('creadoEn', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('creadoEn', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const pacientes = querySnapshot.docs.map(doc => this.convertFirestoreData(doc));

      return pacientes.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent patients:', error);
      return [];
    }
  }

  // Método para poblar datos de prueba en Firestore
  static async crearDatosPrueba(): Promise<void> {
    try {
      console.log('📝 Creando datos de prueba en Firestore...');
      
      const pacientesPrueba = [
        {
          Id_paciente: 'P001',
          Nombre: 'María',
          Apellido1: 'González',
          Apellido2: 'López',
          DNI_NIE: '12345678A',
          FechaNacimiento: Timestamp.fromDate(new Date('1985-05-15')),
          Sexo: 'Femenino',
          SIP: '1234567',
          NumHistoriaClinica: 'HC001',
          Telefono: '600123456',
          creadoPor: 'sistema',
          creadoEn: Timestamp.now()
        },
        {
          Id_paciente: 'P002', 
          Nombre: 'Carlos',
          Apellido1: 'Rodríguez',
          Apellido2: 'Martínez',
          DNI_NIE: '87654321B',
          FechaNacimiento: Timestamp.fromDate(new Date('1978-12-03')),
          Sexo: 'Masculino',
          SIP: '7654321',
          NumHistoriaClinica: 'HC002',
          Telefono: '600654321',
          creadoPor: 'sistema',
          creadoEn: Timestamp.now()
        }
      ];

      for (const paciente of pacientesPrueba) {
        await addDoc(collection(db, 'pacientes'), paciente);
      }

      console.log('✅ Datos de prueba creados en Firestore');
    } catch (error) {
      console.error('❌ Error creando datos de prueba:', error);
    }
  }
  async obtenerPacientePorId(id: string): Promise<any> {
  // Tu implementación para obtener un paciente por ID
}
}