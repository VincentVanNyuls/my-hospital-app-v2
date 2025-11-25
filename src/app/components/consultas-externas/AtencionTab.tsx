// src/app/components/consultas-externas/AtencionTab.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { db } from '../../utils/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { 
  ConsultaExternaFirestoreData, 
  EspecialidadFirestoreData,
  FacultativoFirestoreData,
  createInitialConsultaExternaData,
  validarDatosConsultaExterna,
  OPCIONES_PRIORIDAD,
  OPCIONES_TIPO_VISITA,
  mapDocumentToEspecialidadData,
  mapDocumentToFacultativoData
} from '../../utils/firestoreUtils';

interface AtencionTabProps {
  patientId: string;
}

// Define interfaces extendidas que incluyen el id
interface EspecialidadConId extends EspecialidadFirestoreData {
  id: string;
}

interface FacultativoConId extends FacultativoFirestoreData {
  id: string;
}

export default function AtencionTab({ patientId }: AtencionTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState<EspecialidadConId[]>([]);
  const [facultativos, setFacultativos] = useState<FacultativoConId[]>([]);
  const [formData, setFormData] = useState<Partial<ConsultaExternaFirestoreData>>({});

  useEffect(() => {
    loadEspecialidades();
    loadFacultativos();
  }, []);

  useEffect(() => {
    if (patientId && user) {
      const now = new Date();
      setFormData({
        ...createInitialConsultaExternaData(patientId, user.uid),
        Fecha: Timestamp.fromDate(now),
        Hora: Timestamp.fromDate(now)
      });
    }
  }, [patientId, user]);

  const loadEspecialidades = async () => {
    try {
      const especialidadesRef = collection(db, "especialidades");
      const q = query(especialidadesRef, where("Activo", "==", true));
      const snapshot = await getDocs(q);
      const especialidadesData = snapshot.docs.map(doc => ({
        ...mapDocumentToEspecialidadData(doc),
        id: doc.id
      }));
      setEspecialidades(especialidadesData);
    } catch (error) {
      console.error("Error cargando especialidades:", error);
    }
  };

  const loadFacultativos = async () => {
    try {
      const facultativosRef = collection(db, "facultativos");
      const q = query(facultativosRef, where("Activo", "==", true));
      const snapshot = await getDocs(q);
      const facultativosData = snapshot.docs.map(doc => ({
        ...mapDocumentToFacultativoData(doc),
        id: doc.id
      }));
      setFacultativos(facultativosData);
    } catch (error) {
      console.error("Error cargando facultativos:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveConsulta = async () => {
    if (!user) {
      alert("Debe iniciar sesión para guardar la consulta");
      return;
    }

    const errores = validarDatosConsultaExterna(formData);
    if (errores.length > 0) {
      alert(`Errores de validación:\n${errores.join('\n')}`);
      return;
    }

    setLoading(true);
    try {
      const consultasRef = collection(db, "consultas_externas");
      await addDoc(consultasRef, {
        ...formData,
        creadoPor: user.uid,
        creadoEn: Timestamp.now(),
        actualizadoEn: Timestamp.now()
      });

      alert("Consulta externa guardada correctamente");
      // Limpiar formulario
      const now = new Date();
      setFormData({
        ...createInitialConsultaExternaData(patientId, user.uid),
        Fecha: Timestamp.fromDate(now),
        Hora: Timestamp.fromDate(now)
      });
    } catch (error) {
      console.error("Error guardando consulta externa:", error);
      alert("Error al guardar la consulta externa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="atencion-tab">
      <div className="section-header">
        <h4>Atención en Consulta Externa</h4>
        <p>Complete los datos de la atención médica</p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="prioridad">Prioridad:</label>
          <select 
            id="prioridad"
            value={formData.Prioridad || ''}
            onChange={(e) => handleInputChange('Prioridad', e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione prioridad</option>
            {OPCIONES_PRIORIDAD.map(opcion => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tipoVisita">Tipo de Visita:</label>
          <select 
            id="tipoVisita"
            value={formData.Tipo_visita || ''}
            onChange={(e) => handleInputChange('Tipo_visita', e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione tipo de visita</option>
            {OPCIONES_TIPO_VISITA.map(opcion => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="especialidad">Especialidad:</label>
          <select 
            id="especialidad"
            value={formData.Especialidad || ''}
            onChange={(e) => handleInputChange('Especialidad', e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione especialidad</option>
            {especialidades.map(esp => (
              <option key={esp.id} value={esp.Nombre}>
                {esp.Nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="medicoResponsable">Médico Responsable:</label>
          <select 
            id="medicoResponsable"
            value={formData.Médico_responsable || ''}
            onChange={(e) => handleInputChange('Médico_responsable', e.target.value)}
            className="form-select"
          >
            <option value="">Seleccione médico</option>
            {facultativos.map(fac => (
              <option key={fac.id} value={fac.id}>
                {fac.Nombre} {fac.Apellido1} {fac.Apellido2} - {fac.Especialidad}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Fecha:</label>
          <input 
            type="date" 
            id="fecha"
            value={formData.Fecha ? new Date(formData.Fecha.seconds * 1000).toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = new Date(e.target.value);
              handleInputChange('Fecha', Timestamp.fromDate(date));
            }}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="hora">Hora:</label>
          <input 
            type="time" 
            id="hora"
            value={formData.Hora ? new Date(formData.Hora.seconds * 1000).toTimeString().slice(0,5) : ''}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(':');
              const date = new Date();
              date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              handleInputChange('Hora', Timestamp.fromDate(date));
            }}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={formData.Llegada || false}
              onChange={(e) => handleInputChange('Llegada', e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Paciente ha llegado</span>
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={formData.Cobertura_SS || false}
              onChange={(e) => handleInputChange('Cobertura_SS', e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Cobertura Seguridad Social</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button 
          onClick={handleSaveConsulta}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? '💾 Guardando...' : '💾 Guardar Consulta'}
        </button>
        
        <button 
          onClick={() => {
            if (user) {
              const now = new Date();
              setFormData({
                ...createInitialConsultaExternaData(patientId, user.uid),
                Fecha: Timestamp.fromDate(now),
                Hora: Timestamp.fromDate(now)
              });
            }
          }}
          className="btn btn-secondary"
        >
          🗑️ Limpiar Formulario
        </button>
      </div>

      <style jsx>{`
        .atencion-tab {
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

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          margin-top: 1.75rem;
        }

        .checkbox-input {
          width: 1rem;
          height: 1rem;
        }

        .checkbox-text {
          font-weight: normal;
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

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}