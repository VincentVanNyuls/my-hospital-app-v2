// src/app/components/consultas-externas/DatosClinicosComponent.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { db } from '../../utils/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { 
  PruebaMedicaFirestoreData,
  ProcedenciaFirestoreData,
  FacultativoFirestoreData,
  OPCIONES_DERIVACION,
  mapDocumentToPruebaMedicaData,
  mapDocumentToProcedenciaData,
  mapDocumentToFacultativoData
} from '../../utils/firestoreUtils';

interface DatosClinicosComponentProps {
  patientId: string;
  consultaId?: string; // Opcional: ID de la consulta existente
}

// Define interfaces extendidas que incluyen el id
interface PruebaMedicaConId extends PruebaMedicaFirestoreData {
  id: string;
}

interface ProcedenciaConId extends ProcedenciaFirestoreData {
  id: string;
}

interface FacultativoConId extends FacultativoFirestoreData {
  id: string;
}

export default function DatosClinicosComponent({ patientId, consultaId }: DatosClinicosComponentProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pruebasMedicas, setPruebasMedicas] = useState<PruebaMedicaConId[]>([]);
  const [procedencias, setProcedencias] = useState<ProcedenciaConId[]>([]);
  const [facultativos, setFacultativos] = useState<FacultativoConId[]>([]);
  const [formData, setFormData] = useState({
    Tipo_Prueba: '',
    Procedencia: '',
    Derivación: '',
    Médico_responsable: '',
    Especialidad: '',
    Visita_médica: ''
  });

  useEffect(() => {
    loadDatosMaestros();
  }, []);

  const loadDatosMaestros = async () => {
    try {
      // Cargar pruebas médicas
      const pruebasRef = collection(db, "pruebas_medicas");
      const qPruebas = query(pruebasRef, where("Activo", "==", true));
      const snapshotPruebas = await getDocs(qPruebas);
      const pruebasData = snapshotPruebas.docs.map(doc => ({
        ...mapDocumentToPruebaMedicaData(doc),
        id: doc.id
      }));
      setPruebasMedicas(pruebasData);

      // Cargar procedencias
      const procedenciasRef = collection(db, "procedencias");
      const qProcedencias = query(procedenciasRef, where("Activo", "==", true));
      const snapshotProcedencias = await getDocs(qProcedencias);
      const procedenciasData = snapshotProcedencias.docs.map(doc => ({
        ...mapDocumentToProcedenciaData(doc),
        id: doc.id
      }));
      setProcedencias(procedenciasData);

      // Cargar facultativos
      const facultativosRef = collection(db, "facultativos");
      const qFacultativos = query(facultativosRef, where("Activo", "==", true));
      const snapshotFacultativos = await getDocs(qFacultativos);
      const facultativosData = snapshotFacultativos.docs.map(doc => ({
        ...mapDocumentToFacultativoData(doc),
        id: doc.id
      }));
      setFacultativos(facultativosData);

    } catch (error) {
      console.error("Error cargando datos maestros:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDatosClinicos = async () => {
    if (!user) {
      alert("Debe iniciar sesión para guardar los datos clínicos");
      return;
    }

    if (!patientId) {
      alert("No hay paciente seleccionado");
      return;
    }

    // Validaciones básicas
    if (!formData.Médico_responsable) {
      alert("El médico responsable es requerido");
      return;
    }

    if (!formData.Especialidad) {
      alert("La especialidad es requerida");
      return;
    }

    setLoading(true);
    try {
      if (consultaId) {
        // Actualizar consulta existente
        const consultaRef = doc(db, "consultas_externas", consultaId);
        await updateDoc(consultaRef, {
          ...formData,
          actualizadoEn: new Date(),
          actualizadoPor: user.uid
        });
        alert("Datos clínicos actualizados correctamente");
      } else {
        // Crear nueva consulta con datos clínicos
        const consultasRef = collection(db, "consultas_externas");
        await addDoc(consultasRef, {
          ...formData,
          Paciente: patientId,
          Estado: 'programada',
          creadoPor: user.uid,
          creadoEn: new Date(),
          actualizadoEn: new Date()
        });
        alert("Datos clínicos guardados correctamente");
      }

      // Limpiar formulario después de guardar
      setFormData({
        Tipo_Prueba: '',
        Procedencia: '',
        Derivación: '',
        Médico_responsable: '',
        Especialidad: '',
        Visita_médica: ''
      });

    } catch (error) {
      console.error("Error guardando datos clínicos:", error);
      alert("Error al guardar los datos clínicos");
    } finally {
      setLoading(false);
    }
  };

  const handleMedicoChange = (medicoId: string) => {
    const medicoSeleccionado = facultativos.find(fac => fac.id === medicoId);
    if (medicoSeleccionado) {
      setFormData(prev => ({
        ...prev,
        Médico_responsable: medicoId,
        Especialidad: medicoSeleccionado.Especialidad
      }));
    }
  };

  return (
    <div className="datos-clinicos">
      <div className="section-header">
        <h4>Datos Clínicos</h4>
        <p>Información clínica y de procedencia de la visita</p>
      </div>

      <div className="form-grid">
        {/* Tipo de Prueba */}
        <div className="form-group">
          <label htmlFor="tipoPrueba">Tipo de Prueba:</label>
          <select 
            id="tipoPrueba"
            value={formData.Tipo_Prueba}
            onChange={(e) => handleInputChange('Tipo_Prueba', e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione tipo de prueba</option>
            {pruebasMedicas.map(prueba => (
              <option key={prueba.id} value={prueba.Descripción}>
                {prueba.Descripción}
              </option>
            ))}
          </select>
        </div>

        {/* Procedencia */}
        <div className="form-group">
          <label htmlFor="procedencia">Procedencia:</label>
          <select 
            id="procedencia"
            value={formData.Procedencia}
            onChange={(e) => handleInputChange('Procedencia', e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione procedencia</option>
            {procedencias.map(proc => (
              <option key={proc.id} value={proc.Procedencia}>
                {proc.Procedencia}
              </option>
            ))}
          </select>
        </div>

        {/* Derivación */}
        <div className="form-group">
          <label htmlFor="derivacion">Derivación:</label>
          <select 
            id="derivacion"
            value={formData.Derivación}
            onChange={(e) => handleInputChange('Derivación', e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione tipo de derivación</option>
            {OPCIONES_DERIVACION.map(opcion => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        {/* Médico Responsable */}
        <div className="form-group">
          <label htmlFor="medicoResponsable">Médico Responsable:</label>
          <select 
            id="medicoResponsable"
            value={formData.Médico_responsable}
            onChange={(e) => handleMedicoChange(e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione médico responsable</option>
            {facultativos.map(fac => (
              <option key={fac.id} value={fac.id}>
                Dr. {fac.Nombre} {fac.Apellido1} {fac.Apellido2} - {fac.Especialidad}
              </option>
            ))}
          </select>
        </div>

        {/* Especialidad */}
        <div className="form-group">
          <label htmlFor="especialidad">Especialidad:</label>
          <input 
            type="text" 
            id="especialidad"
            value={formData.Especialidad}
            onChange={(e) => handleInputChange('Especialidad', e.target.value)}
            className="form-input"
            placeholder="Especialidad médica"
          />
        </div>

        {/* Visita Médica */}
        <div className="form-group">
          <label htmlFor="visitaMedica">Visita Médica:</label>
          <select 
            id="visitaMedica"
            value={formData.Visita_médica}
            onChange={(e) => handleInputChange('Visita_médica', e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione tipo de visita</option>
            <option value="Consulta programada">Consulta programada</option>
            <option value="Revisión">Revisión</option>
            <option value="Control">Control</option>
            <option value="Interconsulta">Interconsulta</option>
            <option value="Urgencia">Urgencia</option>
          </select>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="additional-info">
        <h5>Información Adicional</h5>
        <div className="info-grid">
          <div className="info-item">
            <label>Paciente ID:</label>
            <span>{patientId || 'No seleccionado'}</span>
          </div>
          <div className="info-item">
            <label>Consulta ID:</label>
            <span>{consultaId || 'Nueva consulta'}</span>
          </div>
          <div className="info-item">
            <label>Estado:</label>
            <span className="status-badge programada">Programada</span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          onClick={handleSaveDatosClinicos}
          disabled={loading || !patientId}
          className="btn btn-primary"
        >
          {loading ? '💾 Guardando...' : '💾 Guardar Datos Clínicos'}
        </button>
        
        <button 
          onClick={() => setFormData({
            Tipo_Prueba: '',
            Procedencia: '',
            Derivación: '',
            Médico_responsable: '',
            Especialidad: '',
            Visita_médica: ''
          })}
          className="btn btn-secondary"
        >
          🗑️ Limpiar Formulario
        </button>
      </div>

      <style jsx>{`
        .datos-clinicos {
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
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-select, .form-input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-select:focus, .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .additional-info {
          background-color: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .additional-info h5 {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-item label {
          font-weight: 500;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .info-item span {
          color: #374151;
          font-size: 0.875rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.programada {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #4b5563;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}