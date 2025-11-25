// src/app/components/consultas-externas/DatosIdentificativosTab.tsx
"use client";

import { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PacienteFirestoreData, mapDocumentToPacienteData } from '../../utils/firestoreUtils';

interface DatosIdentificativosTabProps {
  patientId: string;
}

export default function DatosIdentificativosTab({ patientId }: DatosIdentificativosTabProps) {
  const [patient, setPatient] = useState<(PacienteFirestoreData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const patientDoc = await getDoc(doc(db, "pacientes", patientId));
        if (patientDoc.exists()) {
          setPatient(mapDocumentToPacienteData(patientDoc as any));
        }
      } catch (error) {
        console.error("Error cargando datos del paciente:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del paciente...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="error-message">
        No se pudieron cargar los datos del paciente.
      </div>
    );
  }

  return (
    <div className="datos-identificativos">
      <div className="section-header">
        <h4>Datos Identificativos del Paciente</h4>
        <p>Información básica del paciente seleccionado</p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>ID Paciente:</label>
          <input type="text" value={patient.Id_paciente} readOnly className="readonly" />
        </div>

        <div className="form-group">
          <label>Nombre:</label>
          <input type="text" value={patient.Nombre} readOnly className="readonly" />
        </div>

        <div className="form-group">
          <label>Primer Apellido:</label>
          <input type="text" value={patient.Apellido1} readOnly className="readonly" />
        </div>

        <div className="form-group">
          <label>Segundo Apellido:</label>
          <input 
            type="text" 
            value={patient.Apellido2 || 'No especificado'} 
            readOnly 
            className="readonly" 
          />
        </div>

        <div className="form-group">
          <label>DNI/NIE:</label>
          <input type="text" value={patient.DNI_NIE} readOnly className="readonly" />
        </div>

        <div className="form-group">
          <label>SIP:</label>
          <input type="text" value={patient.SIP || 'No asignado'} readOnly className="readonly" />
        </div>

        <div className="form-group">
          <label>Número Seguridad Social:</label>
          <input 
            type="text" 
            value={patient.NumSeguridadSocial || 'No asignado'} 
            readOnly 
            className="readonly" 
          />
        </div>

        <div className="form-group">
          <label>Nº Historia Clínica:</label>
          <input type="text" value={patient.NumHistoriaClinica} readOnly className="readonly" />
        </div>

        <div className="form-group">
          <label>Fecha de Nacimiento:</label>
          <input 
            type="text" 
            value={patient.FechaNacimiento?.toDate().toLocaleDateString('es-ES')} 
            readOnly 
            className="readonly" 
          />
        </div>

        <div className="form-group">
          <label>Sexo:</label>
          <input type="text" value={patient.Sexo} readOnly className="readonly" />
        </div>

        <div className="form-group full-width">
          <label>Dirección:</label>
          <input 
            type="text" 
            value={patient.Direccion || 'No especificada'} 
            readOnly 
            className="readonly" 
          />
        </div>

        <div className="form-group">
          <label>Código Postal:</label>
          <input 
            type="text" 
            value={patient.CodigoPostal || 'No especificado'} 
            readOnly 
            className="readonly" 
          />
        </div>

        <div className="form-group">
          <label>Teléfono:</label>
          <input 
            type="text" 
            value={patient.Telefono || 'No especificado'} 
            readOnly 
            className="readonly" 
          />
        </div>
      </div>

      <style jsx>{`
        .datos-identificativos {
          padding: 1rem 0;
        }

        .section-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .section-header h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .section-header p {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-group input.readonly {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background-color: #f9fafb;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 1rem;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-message {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 0.375rem;
          text-align: center;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}