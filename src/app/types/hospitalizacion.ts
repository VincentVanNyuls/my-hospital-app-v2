// src/app/types/hospitalizacion.ts
import { PacienteData } from './paciente';

export type AdmissionType = 'programada' | 'urgente';
export type AdmissionStatus = 'active' | 'discharged' | 'transferred';
export type DischargeType = 'alta_voluntaria' | 'alta_medica' | 'fallecimiento' | 'traslado';

export interface HospitalAdmission {
  id: string;
  patientId: string;
  admissionDate: Date | string;
  admissionType: AdmissionType;
  service: string;
  room: string;
  bed: string;
  diagnosis: string;
  doctorId: string;
  nurseId: string;
  status: AdmissionStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface HospitalAdmissionWithPatient extends HospitalAdmission {
  patientData?: PacienteData;
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
}

export interface MedicationAdministered {
  medicationId: string;
  name: string;
  dosage: string;
  route: string;
  time: Date | string;
}

export interface NursingCare {
  id: string;
  admissionId: string;
  dateTime: Date | string;
  nurseId: string;
  vitalSigns: VitalSigns;
  observations: string;
  careProvided: string[];
  medicationsAdministered: MedicationAdministered[];
}

export interface Prescription {
  medicationId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface MedicalCare {
  id: string;
  admissionId: string;
  dateTime: Date | string;
  doctorId: string;
  assessment: string;
  diagnosis: string;
  treatmentPlan: string;
  prescriptions: Prescription[];
  procedures: string[];
}

export interface Discharge {
  id: string;
  admissionId: string;
  dischargeDate: Date | string;
  dischargeType: DischargeType;
  finalDiagnosis: string;
  treatmentRecommendations: string;
  followUpInstructions: string;
  dischargeSummary: string;
}

export interface AdmissionFormData {
  patientId: string;
  admissionType: AdmissionType;
  service: string;
  room: string;
  bed: string;
  diagnosis: string;
  doctorId: string;
  nurseId: string;
}

export interface AdmissionFormDataWithPatient {
  patientId: string;
  admissionType: AdmissionType;
  service: string;
  room: string;
  bed: string;
  diagnosis: string;
  doctorId: string;
  nurseId: string;
  patientData?: PacienteData;
}