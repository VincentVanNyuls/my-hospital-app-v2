import { 
  HospitalAdmission, 
  NursingCare, 
  MedicalCare, 
  Discharge,
  AdmissionFormData,
  HospitalAdmissionWithPatient
} from '../types/hospitalizacion';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  getDoc 
} from 'firebase/firestore';
import { PacienteService } from './pacienteService';

export class HospitalizationService {
  
  // ADMISIONES
  static async admitPatient(admissionData: AdmissionFormData): Promise<string> {
    try {
      const admission: Omit<HospitalAdmission, 'id'> = {
        ...admissionData,
        admissionDate: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'hospitalAdmissions'), admission);
      return docRef.id;
    } catch (error) {
      console.error('Error admitting patient:', error);
      throw new Error('No se pudo ingresar al paciente');
    }
  }

  static async getPatientAdmissions(patientId: string): Promise<HospitalAdmission[]> {
    try {
      const q = query(
        collection(db, 'hospitalAdmissions'),
        where('patientId', '==', patientId),
        orderBy('admissionDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HospitalAdmission));
    } catch (error) {
      console.error('Error getting admissions:', error);
      return [];
    }
  }

  static async getActiveAdmissions(): Promise<HospitalAdmission[]> {
    try {
      const q = query(
        collection(db, 'hospitalAdmissions'),
        where('status', '==', 'active'),
        orderBy('admissionDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HospitalAdmission));
    } catch (error) {
      console.error('Error getting active admissions:', error);
      return [];
    }
  }

  static async getAdmissionById(admissionId: string): Promise<HospitalAdmission | null> {
    try {
      const docRef = doc(db, 'hospitalAdmissions', admissionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as HospitalAdmission;
      }
      return null;
    } catch (error) {
      console.error('Error getting admission:', error);
      return null;
    }
  }

  // CUIDADOS DE ENFERMERÍA
  static async addNursingCare(careData: Omit<NursingCare, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'nursingCare'), {
        ...careData,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding nursing care:', error);
      throw new Error('No se pudo registrar el cuidado de enfermería');
    }
  }

  static async getNursingCareByAdmission(admissionId: string): Promise<NursingCare[]> {
    try {
      const q = query(
        collection(db, 'nursingCare'),
        where('admissionId', '==', admissionId),
        orderBy('dateTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NursingCare));
    } catch (error) {
      console.error('Error getting nursing care:', error);
      return [];
    }
  }

  // ATENCIÓN MÉDICA
  static async addMedicalCare(careData: Omit<MedicalCare, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'medicalCare'), {
        ...careData,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding medical care:', error);
      throw new Error('No se pudo registrar la atención médica');
    }
  }

  static async getMedicalCareByAdmission(admissionId: string): Promise<MedicalCare[]> {
    try {
      const q = query(
        collection(db, 'medicalCare'),
        where('admissionId', '==', admissionId),
        orderBy('dateTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MedicalCare));
    } catch (error) {
      console.error('Error getting medical care:', error);
      return [];
    }
  }

  // ALTAS
  static async dischargePatient(dischargeData: Omit<Discharge, 'id'>): Promise<string> {
    try {
      // Registrar el alta
      const docRef = await addDoc(collection(db, 'discharges'), {
        ...dischargeData,
        createdAt: new Date().toISOString()
      });

      // Actualizar el estado del ingreso
      const admissionRef = doc(db, 'hospitalAdmissions', dischargeData.admissionId);
      await updateDoc(admissionRef, {
        status: 'discharged',
        updatedAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error discharging patient:', error);
      throw new Error('No se pudo dar de alta al paciente');
    }
  }

  static async getDischargeByAdmissionId(admissionId: string): Promise<Discharge | null> {
    try {
      const q = query(
        collection(db, 'discharges'),
        where('admissionId', '==', admissionId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Discharge;
    } catch (error) {
      console.error('Error getting discharge:', error);
      return null;
    }
  }

  // MÉTODOS INTEGRADOS CON PACIENTES
  static async getAdmissionWithPatientData(admissionId: string): Promise<HospitalAdmissionWithPatient | null> {
    try {
      const admission = await this.getAdmissionById(admissionId);
      if (!admission) return null;

      const patient = await PacienteService.getPatientById(admission.patientId);
      
      return {
        ...admission,
        patientData: patient
      };
    } catch (error) {
      console.error('Error getting admission with patient data:', error);
      return null;
    }
  }

  static async getActiveAdmissionsWithPatientData(): Promise<HospitalAdmissionWithPatient[]> {
    try {
      const admissions = await this.getActiveAdmissions();
      
      const admissionsWithPatientData = await Promise.all(
        admissions.map(async (admission) => {
          const patient = await PacienteService.getPatientById(admission.patientId);
          return {
            ...admission,
            patientData: patient
          } as HospitalAdmissionWithPatient;
        })
      );
      
      return admissionsWithPatientData;
    } catch (error) {
      console.error('Error getting admissions with patient data:', error);
      return [];
    }
  }
}