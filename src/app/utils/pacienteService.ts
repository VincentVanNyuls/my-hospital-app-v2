// src/app/utils/pacienteService.ts
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PacienteData } from '../types/paciente';
import { mapDocumentToPacienteData } from './firestoreUtils';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export class PacienteService {
  static async getAllPatients(): Promise<PacienteData[]> {
    try {
      const q = query(
        collection(db, 'pacientes'),
        orderBy('Nombre', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const pacienteData = mapDocumentToPacienteData(doc as QueryDocumentSnapshot<DocumentData>);
        // Convertir a la interfaz PacienteData
        return {
          id: pacienteData.id,
          Id_paciente: pacienteData.Id_paciente,
          Nombre: pacienteData.Nombre,
          Apellido1: pacienteData.Apellido1,
          Apellido2: pacienteData.Apellido2,
          DNI_NIE: pacienteData.DNI_NIE,
          FechaNacimiento: pacienteData.FechaNacimiento,
          Sexo: pacienteData.Sexo,
          SIP: pacienteData.SIP,
          NumSeguridadSocial: pacienteData.NumSeguridadSocial,
          NumHistoriaClinica: pacienteData.NumHistoriaClinica,
          Direccion: pacienteData.Direccion,
          CodigoPostal: pacienteData.CodigoPostal,
          Telefono: pacienteData.Telefono,
          creadoPor: pacienteData.creadoPor,
          creadoEn: pacienteData.creadoEn
        } as PacienteData;
      });
    } catch (error) {
      console.error('Error getting patients:', error);
      return [];
    }
  }

  static async getPatientById(patientId: string): Promise<PacienteData | null> {
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('Id_paciente', '==', patientId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      const pacienteData = mapDocumentToPacienteData(doc as QueryDocumentSnapshot<DocumentData>);
      
      return {
        id: pacienteData.id,
        Id_paciente: pacienteData.Id_paciente,
        Nombre: pacienteData.Nombre,
        Apellido1: pacienteData.Apellido1,
        Apellido2: pacienteData.Apellido2,
        DNI_NIE: pacienteData.DNI_NIE,
        FechaNacimiento: pacienteData.FechaNacimiento,
        Sexo: pacienteData.Sexo,
        SIP: pacienteData.SIP,
        NumSeguridadSocial: pacienteData.NumSeguridadSocial,
        NumHistoriaClinica: pacienteData.NumHistoriaClinica,
        Direccion: pacienteData.Direccion,
        CodigoPostal: pacienteData.CodigoPostal,
        Telefono: pacienteData.Telefono,
        creadoPor: pacienteData.creadoPor,
        creadoEn: pacienteData.creadoEn
      } as PacienteData;
    } catch (error) {
      console.error('Error getting patient:', error);
      return null;
    }
  }

  static async getPatientByDocumentId(documentId: string): Promise<PacienteData | null> {
    try {
      const docRef = doc(db, 'pacientes', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      const pacienteData = mapDocumentToPacienteData(docSnap as QueryDocumentSnapshot<DocumentData>);
      
      return {
        id: pacienteData.id,
        Id_paciente: pacienteData.Id_paciente,
        Nombre: pacienteData.Nombre,
        Apellido1: pacienteData.Apellido1,
        Apellido2: pacienteData.Apellido2,
        DNI_NIE: pacienteData.DNI_NIE,
        FechaNacimiento: pacienteData.FechaNacimiento,
        Sexo: pacienteData.Sexo,
        SIP: pacienteData.SIP,
        NumSeguridadSocial: pacienteData.NumSeguridadSocial,
        NumHistoriaClinica: pacienteData.NumHistoriaClinica,
        Direccion: pacienteData.Direccion,
        CodigoPostal: pacienteData.CodigoPostal,
        Telefono: pacienteData.Telefono,
        creadoPor: pacienteData.creadoPor,
        creadoEn: pacienteData.creadoEn
      } as PacienteData;
    } catch (error) {
      console.error('Error getting patient by document ID:', error);
      return null;
    }
  }
}