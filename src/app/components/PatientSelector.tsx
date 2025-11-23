// src/app/components/PatientSelector.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PacienteData } from '../types/paciente';
import { PacienteService } from '../utils/pacienteService';

interface PatientSelectorProps {
  onPatientSelect: (patientId: string, patientData?: PacienteData) => void;
  selectedPatientId?: string;
}

export default function PatientSelector({ onPatientSelect, selectedPatientId }: PatientSelectorProps) {
  const [patients, setPatients] = useState<PacienteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const patientList = await PacienteService.getAllPatients();
      setPatients(patientList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading patients:', error);
      setLoading(false);
    }
  };

  // Filtrado más inteligente
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients.slice(0, 10);
    
    return patients.filter(patient =>
      `${patient.Nombre} ${patient.Apellido1} ${patient.Apellido2 || ''} ${patient.DNI_NIE} ${patient.SIP} ${patient.NumHistoriaClinica}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ).slice(0, 15);
  }, [patients, searchTerm]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('es-ES');
      }
      return new Date(timestamp).toLocaleDateString('es-ES');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const handlePatientClick = (patient: PacienteData) => {
    onPatientSelect(patient.Id_paciente, patient);
    setSearchTerm(`${patient.Nombre} ${patient.Apellido1} ${patient.Apellido2 || ''}`);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    onPatientSelect('');
    setSearchTerm('');
    setShowDropdown(true);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        <div className="text-sm text-gray-500 text-center">Cargando pacientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Campo de búsqueda con dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar y Seleccionar Paciente *
        </label>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Escribe nombre, apellidos, DNI, SIP o número de historia..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          />
          
          {selectedPatientId && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {showDropdown && filteredPatients.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedPatientId === patient.Id_paciente ? 'bg-blue-100 border-blue-300' : ''
                }`}
                onClick={() => handlePatientClick(patient)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center">
                      {patient.Nombre} {patient.Apellido1} {patient.Apellido2 || ''}
                      {selectedPatientId === patient.Id_paciente && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">DNI:</span> {patient.DNI_NIE} | 
                      <span className="font-medium ml-2">SIP:</span> {patient.SIP || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">HC:</span> {patient.NumHistoriaClinica} | 
                      <span className="font-medium ml-2">Nac:</span> {formatDate(patient.FechaNacimiento)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap ml-2 text-right">
                    <div>ID: {patient.Id_paciente}</div>
                    <div>{patient.Sexo}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {showDropdown && searchTerm && filteredPatients.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
            No se encontraron pacientes con "{searchTerm}"
          </div>
        )}
      </div>

      {/* Información del paciente seleccionado */}
      {selectedPatientId && patients.find(p => p.Id_paciente === selectedPatientId) && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-green-800 mb-2">✅ Paciente Seleccionado</h4>
              <div className="text-sm text-green-700 space-y-1">
                <div>
                  <strong>Nombre completo:</strong> {
                    patients.find(p => p.Id_paciente === selectedPatientId)?.Nombre + ' ' +
                    patients.find(p => p.Id_paciente === selectedPatientId)?.Apellido1 + ' ' +
                    (patients.find(p => p.Id_paciente === selectedPatientId)?.Apellido2 || '')
                  }
                </div>
                <div>
                  <strong>DNI/NIE:</strong> {patients.find(p => p.Id_paciente === selectedPatientId)?.DNI_NIE}
                </div>
                <div>
                  <strong>SIP:</strong> {patients.find(p => p.Id_paciente === selectedPatientId)?.SIP || 'N/A'}
                </div>
                <div>
                  <strong>Historia Clínica:</strong> {patients.find(p => p.Id_paciente === selectedPatientId)?.NumHistoriaClinica}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

   {/* Estadísticas rápidas */}
<div className="bg-blue-50 border border-blue-200 rounded-md p-3">
  <div className="text-sm text-blue-700">
    <strong>Total de pacientes en sistema:</strong> {patients.length}
    {searchTerm && (
      <span className="ml-2">
        • <strong>Encontrados:</strong> {filteredPatients.length}
      </span>
    )}
  </div>
  <div className="text-xs text-blue-600 mt-1">
    💡 <strong>Consejo:</strong> Busca por nombre, apellidos, DNI, SIP o número de historia clínica
  </div>
</div>
    </div>
  );
}