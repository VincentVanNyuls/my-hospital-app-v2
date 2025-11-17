// src/app/hospitalizacion/admitir/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Importaciones corregidas según la estructura
import { AdmissionFormData } from '../../types/hospitalizacion';
import { HospitalizationService } from '../../utils/hospitalizacionService';
import { PacienteData } from '../../types/paciente';
import PatientSelector from '../../components/PatientSelector';

export default function AdmitirPacientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PacienteData | null>(null);
  const [formData, setFormData] = useState<AdmissionFormData>({
    patientId: '',
    admissionType: 'programada',
    service: '',
    room: '',
    bed: '',
    diagnosis: '',
    doctorId: '',
    nurseId: ''
  });

  const handlePatientSelect = (patientId: string, patientData?: PacienteData) => {
    setFormData(prev => ({ ...prev, patientId }));
    setSelectedPatient(patientData || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      alert('Por favor, seleccione un paciente');
      return;
    }

    setLoading(true);
    try {
      await HospitalizationService.admitPatient(formData);
      alert('Paciente ingresado correctamente');
      router.push('/hospitalizacion');
    } catch (error) {
      console.error('Error admitting patient:', error);
      alert('Error al ingresar paciente. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const services = [
    'Medicina Interna',
    'Cirugía General',
    'Pediatría',
    'Ginecología',
    'Traumatología',
    'Cardiología',
    'Neurología',
    'Oncología',
    'Urología',
    'Oftalmología',
    'Neumología',
    'Nefrología',
    'Dermatología',
    'Psiquiatría',
    'Rehabilitación'
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/hospitalizacion"
          className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
        >
          &larr; Volver a Hospitalización
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Ingresar Paciente</h1>
        <p className="text-gray-600 mt-2">
          Complete el formulario para ingresar un nuevo paciente al área de hospitalización
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Selección de Paciente */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Selección del Paciente
            </h2>
            <PatientSelector
              onPatientSelect={handlePatientSelect}
              selectedPatientId={formData.patientId}
            />
          </div>

          {/* Información de Hospitalización */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Información de Hospitalización
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ingreso *
                </label>
                <select
                  name="admissionType"
                  value={formData.admissionType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="programada">Programada</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servicio *
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione un servicio</option>
                  {services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habitación *
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    required
                    placeholder="Ej: 301"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cama *
                  </label>
                  <input
                    type="text"
                    name="bed"
                    value={formData.bed}
                    onChange={handleChange}
                    required
                    placeholder="Ej: A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico Principal *
                </label>
                <textarea
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Describa el diagnóstico del paciente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Personal Médico */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Personal Médico Asignado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Médico Responsable *
                </label>
                <input
                  type="text"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  placeholder="Ej: DOC001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Identificador del médico responsable
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Enfermero/a Responsable *
                </label>
                <input
                  type="text"
                  name="nurseId"
                  value={formData.nurseId}
                  onChange={handleChange}
                  required
                  placeholder="Ej: NUR001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Identificador del enfermero/a responsable
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !formData.patientId}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando...
              </span>
            ) : (
              'Ingresar Paciente'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Información importante:</h3>
        <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
          <li>Seleccione un paciente del sistema usando el buscador</li>
          <li>Los campos marcados con * son obligatorios</li>
          <li>El paciente será asignado automáticamente al área de hospitalización</li>
          <li>Podrá registrar cuidados de enfermería una vez ingresado el paciente</li>
          <li>Verifique que la habitación y cama estén disponibles</li>
        </ul>
      </div>
    </div>
  );
}