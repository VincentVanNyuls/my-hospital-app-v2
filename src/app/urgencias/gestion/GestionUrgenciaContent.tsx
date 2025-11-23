// app/urgencias/gestion/GestionUrgenciaContent.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import { db } from '../../utils/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { PacienteData, UrgenciaData } from '../../utils/types';
import { validarDatosUrgencia } from '../../utils/firestoreUtils';
import UrgenciaPDFButton from '../../components/UrgenciaPDFButton';

// Importar React explícitamente
import React from 'react';

// Componente memoizado para campos de texto
const TextField = React.memo(({ label, value, onSave, disabled, placeholder, multiline = false }: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      {multiline ? (
        <textarea
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder={placeholder}
        />
      )}
    </div>
  );
});

TextField.displayName = 'TextField';

// Componente memoizado para selects
const SelectField = React.memo(({ label, value, onSave, disabled, options }: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  disabled?: boolean;
  options: { value: string; label: string }[];
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSave(e.target.value);
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <select 
        value={value}
        onChange={handleChange}
        disabled={disabled}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

SelectField.displayName = 'SelectField';

// Componente memoizado para cada pestaña
const IdentificacionTab = React.memo(({ paciente }: { paciente: PacienteData }) => (
  <div className="form-section">
    <h3>📋 Datos de Identificación</h3>
    <div className="form-grid">
      <div className="form-group">
        <label>Nombre:</label>
        <input type="text" value={paciente.Nombre} readOnly className="read-only" />
      </div>
      <div className="form-group">
        <label>Apellido 1:</label>
        <input type="text" value={paciente.Apellido1} readOnly className="read-only" />
      </div>
      <div className="form-group">
        <label>Apellido 2:</label>
        <input type="text" value={paciente.Apellido2 || ''} readOnly className="read-only" />
      </div>
      <div className="form-group">
        <label>DNI/NIE:</label>
        <input type="text" value={paciente.DNI_NIE} readOnly className="read-only" />
      </div>
      <div className="form-group">
        <label>SIP:</label>
        <input type="text" value={paciente.SIP} readOnly className="read-only" />
      </div>
      <div className="form-group">
        <label>NHC:</label>
        <input type="text" value={paciente.NumHistoriaClinica} readOnly className="read-only" />
      </div>
      <div className="form-group">
        <label>Fecha Nacimiento:</label>
        <input 
          type="text" 
          value={paciente.FechaNacimiento?.toDate?.().toLocaleDateString('es-ES') || 'No disponible'} 
          readOnly 
          className="read-only" 
        />
      </div>
      <div className="form-group">
        <label>Sexo:</label>
        <input type="text" value={paciente.Sexo} readOnly className="read-only" />
      </div>
    </div>
  </div>
));

IdentificacionTab.displayName = 'IdentificacionTab';

const AtencionTab = React.memo(({ formData, onFieldChange, saving }: {
  formData: any;
  onFieldChange: (field: string, value: string) => void;
  saving: boolean;
}) => (
  <div className="form-section">
    <h3>🏥 Datos de Atención</h3>
    <div className="form-grid">
      <SelectField
        label="Cobertura SS:"
        value={formData.Cobertura_SS}
        onSave={(value) => onFieldChange('Cobertura_SS', value)}
        disabled={saving}
        options={[
          { value: 'Público', label: 'Público' },
          { value: 'Privado', label: 'Privado' },
          { value: 'Concertado', label: 'Concertado' }
        ]}
      />
      <SelectField
        label="Especialidad:"
        value={formData.Especialidad}
        onSave={(value) => onFieldChange('Especialidad', value)}
        disabled={saving}
        options={[
          { value: 'Urgencias', label: 'Urgencias' },
          { value: 'Traumatología', label: 'Traumatología' },
          { value: 'Cardiología', label: 'Cardiología' },
          { value: 'Pediatría', label: 'Pediatría' },
          { value: 'Medicina Interna', label: 'Medicina Interna' },
          { value: 'Cirugía General', label: 'Cirugía General' },
          { value: 'Ginecología', label: 'Ginecología' }
        ]}
      />
      <TextField
        label="Médico Responsable:"
        value={formData.Medico_responsable}
        onSave={(value) => onFieldChange('Medico_responsable', value)}
        disabled={saving}
        placeholder="Nombre del médico responsable"
      />
      <SelectField
        label="Tipo Acreditación:"
        value={formData.Tipo_Acreditacion}
        onSave={(value) => onFieldChange('Tipo_Acreditacion', value)}
        disabled={saving}
        options={[
          { value: 'Ordinaria', label: 'Ordinaria' },
          { value: 'Preferente', label: 'Preferente' },
          { value: 'Urgente', label: 'Urgente' }
        ]}
      />
    </div>
  </div>
));

AtencionTab.displayName = 'AtencionTab';

const ClinicosTab = React.memo(({ formData, onFieldChange, saving }: {
  formData: any;
  onFieldChange: (field: string, value: string) => void;
  saving: boolean;
}) => (
  <div className="form-section">
    <h3>🩺 Datos Clínicos</h3>
    <div className="form-grid">
      <TextField
        label="Motivo de Urgencia:"
        value={formData.Motivo_Urgencia}
        onSave={(value) => onFieldChange('Motivo_Urgencia', value)}
        disabled={saving}
        placeholder="Describa el motivo principal de la consulta..."
        multiline
      />
      <TextField
        label="Lesión/Diagnóstico:"
        value={formData.Lesion}
        onSave={(value) => onFieldChange('Lesion', value)}
        disabled={saving}
        placeholder="Describa la lesión o diagnóstico encontrado..."
        multiline
      />
      <TextField
        label="Entidad Nosológica:"
        value={formData.Entidad}
        onSave={(value) => onFieldChange('Entidad', value)}
        disabled={saving}
        placeholder="Especifique la entidad nosológica si es aplicable..."
        multiline
      />
    </div>
  </div>
));

ClinicosTab.displayName = 'ClinicosTab';

const IngresoTab = React.memo(({ formData, onFieldChange, saving }: {
  formData: any;
  onFieldChange: (field: string, value: string) => void;
  saving: boolean;
}) => (
  <div className="form-section">
    <h3>📝 Motivo de Ingreso/Alta</h3>
    <div className="form-grid">
      <SelectField
        label="Destino:"
        value={formData.Destino}
        onSave={(value) => onFieldChange('Destino', value)}
        disabled={saving}
        options={[
          { value: '', label: 'Seleccionar...' },
          { value: 'Alta', label: 'Alta' },
          { value: 'Hospitalización', label: 'Hospitalización' },
          { value: 'Observación', label: 'Observación' },
          { value: 'Derivación', label: 'Derivación' }
        ]}
      />
      <SelectField
        label="Motivo del Alta:"
        value={formData.Motivo_alta}
        onSave={(value) => onFieldChange('Motivo_alta', value)}
        disabled={saving}
        options={[
          { value: '', label: 'Seleccionar...' },
          { value: 'Curación', label: 'Curación' },
          { value: 'Mejoría', label: 'Mejoría' },
          { value: 'Traslado', label: 'Traslado' },
          { value: 'Voluntaria', label: 'Voluntaria' },
          { value: 'Fallecimiento', label: 'Fallecimiento' }
        ]}
      />
    </div>
  </div>
));

IngresoTab.displayName = 'IngresoTab';

export default function GestionUrgenciaContent() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('identificacion');
  const [paciente, setPaciente] = useState<PacienteData | null>(null);
  const [urgencia, setUrgencia] = useState<UrgenciaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado local separado para los campos del formulario
  const [formData, setFormData] = useState({
    Cobertura_SS: '',
    Tipo_Acreditacion: '',
    Especialidad: '',
    Medico_responsable: '',
    Motivo_Urgencia: '',
    Lesion: '',
    Entidad: '',
    Destino: '',
    Motivo_alta: ''
  });

  const pacienteId = searchParams.get('pacienteId');
  const urgenciaId = searchParams.get('urgenciaId');

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    cargarDatos();
  }, [pacienteId, urgenciaId, user]);

  const cargarDatos = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (urgenciaId) {
        const urgenciaDoc = await getDoc(doc(db, "urgencias", urgenciaId));
        if (urgenciaDoc.exists()) {
          const urgenciaData = { id: urgenciaDoc.id, ...urgenciaDoc.data() } as UrgenciaData;
          setUrgencia(urgenciaData);
          
          // Actualizar formData con los datos de la urgencia
          setFormData({
            Cobertura_SS: urgenciaData.Cobertura_SS || '',
            Tipo_Acreditacion: urgenciaData.Tipo_Acreditacion || '',
            Especialidad: urgenciaData.Especialidad || '',
            Medico_responsable: urgenciaData.Medico_responsable || '',
            Motivo_Urgencia: urgenciaData.Motivo_Urgencia || '',
            Lesion: urgenciaData.Lesion || '',
            Entidad: urgenciaData.Entidad || '',
            Destino: urgenciaData.Destino || '',
            Motivo_alta: urgenciaData.Motivo_alta || ''
          });
          
          const pacienteDoc = await getDoc(doc(db, "pacientes", urgenciaData.Id_Paciente));
          if (pacienteDoc.exists()) {
            setPaciente({ id: pacienteDoc.id, ...pacienteDoc.data() } as PacienteData);
          }
        }
      } else if (pacienteId) {
        const pacienteDoc = await getDoc(doc(db, "pacientes", pacienteId));
        if (pacienteDoc.exists()) {
          setPaciente({ id: pacienteDoc.id, ...pacienteDoc.data() } as PacienteData);
          
          const urgenciasRef = collection(db, "urgencias");
          const q = query(
            urgenciasRef, 
            where("Id_Paciente", "==", pacienteId),
            where("Estado", "==", "activa")
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const urgenciaDoc = querySnapshot.docs[0];
            const urgenciaData = { id: urgenciaDoc.id, ...urgenciaDoc.data() } as UrgenciaData;
            setUrgencia(urgenciaData);
            
            setFormData({
              Cobertura_SS: urgenciaData.Cobertura_SS || '',
              Tipo_Acreditacion: urgenciaData.Tipo_Acreditacion || '',
              Especialidad: urgenciaData.Especialidad || '',
              Medico_responsable: urgenciaData.Medico_responsable || '',
              Motivo_Urgencia: urgenciaData.Motivo_Urgencia || '',
              Lesion: urgenciaData.Lesion || '',
              Entidad: urgenciaData.Entidad || '',
              Destino: urgenciaData.Destino || '',
              Motivo_alta: urgenciaData.Motivo_alta || ''
            });
          } else {
            alert("No se encontró una urgencia activa para este paciente.");
            router.push('/urgencias');
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Error al cargar los datos de la urgencia");
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar cambios - memoizada
  const guardarCampo = useCallback(async (campo: string, valor: string) => {
    if (!urgencia?.id || !user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "urgencias", urgencia.id), {
        [campo]: valor,
        actualizadoEn: Timestamp.now()
      });
      
      // Actualizar el estado de urgencia
      setUrgencia(prev => prev ? { ...prev, [campo]: valor } : null);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }, [urgencia, user]);

  // Manejar cambios en los campos - memoizada
  const handleFieldChange = useCallback((campo: string, valor: string) => {
    // Actualizar estado local inmediatamente
    setFormData(prev => ({ ...prev, [campo]: valor }));
    
    // Guardar en Firestore
    guardarCampo(campo, valor);
  }, [guardarCampo]);

  const handleDarAlta = async () => {
    if (!urgencia?.id || !user) return;

    // Crear objeto combinado con los datos actuales
    const urgenciaActualizada = {
      ...urgencia,
      ...formData
    };

    const errores = validarDatosUrgencia(urgenciaActualizada, true);
    if (errores.length > 0) {
      alert(`Complete los siguientes campos antes de dar de alta:\n${errores.join('\n')}`);
      return;
    }

    try {
      await updateDoc(doc(db, "urgencias", urgencia.id), {
        Estado: 'alta',
        Fecha_salida: Timestamp.now(),
        Hora_salida: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        Fecha_alta: Timestamp.now(),
        actualizadoEn: Timestamp.now()
      });

      alert("Alta registrada correctamente");
      router.push('/urgencias');
    } catch (error) {
      console.error("Error al dar de alta:", error);
      alert("Error al registrar el alta");
    }
  };

  const calcularEdad = (fechaNacimiento: any): number => {
    if (!fechaNacimiento) return 0;
    try {
      const nacimiento = fechaNacimiento.toDate();
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    } catch (error) {
      return 0;
    }
  };

  if (loadingAuth || !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando gestión de urgencia...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del paciente...</p>
      </div>
    );
  }

  if (!paciente || !urgencia) {
    return (
      <div className="page-container">
        <div className="error-message">
          No se pudo cargar la información del paciente o la urgencia.
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identificacion':
        return <IdentificacionTab paciente={paciente} />;
      case 'atencion':
        return <AtencionTab formData={formData} onFieldChange={handleFieldChange} saving={saving} />;
      case 'clinicos':
        return <ClinicosTab formData={formData} onFieldChange={handleFieldChange} saving={saving} />;
      case 'ingreso':
        return <IngresoTab formData={formData} onFieldChange={handleFieldChange} saving={saving} />;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>👨‍⚕️ Gestión de Urgencia</h1>
          <p>Complete la información de la urgencia del paciente</p>
          {urgencia && paciente && (
            <div className="patient-urgencia-info">
              <div className="info-item">
                <strong>Paciente:</strong> {paciente.Nombre} {paciente.Apellido1} {paciente.Apellido2}
              </div>
              <div className="info-item">
                <strong>Urgencia:</strong> {urgencia.Id_Urgencia}
              </div>
              <div className="info-item">
                <strong>Entrada:</strong> {urgencia.Hora_Entrada}
              </div>
              <div className="info-item">
                <strong>Estado:</strong> 
                <span className={`estado-badge ${urgencia.Estado}`}>
                  {urgencia.Estado === 'activa' ? '🟢 Activa' : urgencia.Estado === 'alta' ? '🔴 Alta' : '🟡 Derivada'}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/urgencias')}
          >
            ← Volver a Urgencias
          </button>
          {urgencia && urgencia.Estado === 'activa' && (
            <button 
              className="btn btn-warning"
              onClick={handleDarAlta}
              disabled={saving}
            >
              {saving ? '🔄 Guardando...' : '📝 Dar Alta'}
            </button>
          )}
          {urgencia && paciente && (
            <UrgenciaPDFButton
              urgencia={urgencia}
              paciente={paciente}
              variant="success"
            />
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="content-card">
          <div className="tabs-container">
            <div className="tabs">
              {[
                { id: 'identificacion', label: '📋 Identificación', icon: '📋' },
                { id: 'atencion', label: '🏥 Atención', icon: '🏥' },
                { id: 'clinicos', label: '🩺 Datos Clínicos', icon: '🩺' },
                { id: 'ingreso', label: '📝 Ingreso/Alta', icon: '📝' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Información de la urgencia */}
        <div className="content-card">
          <h3>📊 Información de la Urgencia</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>ID Urgencia:</strong> {urgencia.Id_Urgencia}
            </div>
            <div className="info-item">
              <strong>Fecha Entrada:</strong> {urgencia.Fecha_entrada?.toDate?.().toLocaleDateString('es-ES')}
            </div>
            <div className="info-item">
              <strong>Hora Entrada:</strong> {urgencia.Hora_Entrada}
            </div>
            <div className="info-item">
              <strong>Creado por:</strong> {urgencia.creadoPor || 'Sistema'}
            </div>
            {urgencia.Fecha_salida && (
              <div className="info-item">
                <strong>Fecha Salida:</strong> {urgencia.Fecha_salida?.toDate?.().toLocaleDateString('es-ES')}
              </div>
            )}
            {urgencia.Hora_salida && (
              <div className="info-item">
                <strong>Hora Salida:</strong> {urgencia.Hora_salida}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background-color: #f8fafc;
          padding: 1rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 1rem;
        }

        .header-content h1 {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .header-content p {
          color: #6b7280;
          font-size: 1.125rem;
          margin-bottom: 1rem;
        }

        .patient-urgencia-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          background: #f0f9ff;
          padding: 1rem;
          border-radius: 0.5rem;
          border-left: 4px solid #3b82f6;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-item strong {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .estado-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }

        .estado-badge.activa {
          background-color: #dcfce7;
          color: #166534;
        }

        .estado-badge.alta {
          background-color: #fef3c7;
          color: #92400e;
        }

        .estado-badge.derivada {
          background-color: #e0e7ff;
          color: #3730a3;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .page-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .content-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .content-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .tabs-container {
          display: flex;
          flex-direction: column;
        }

        .tabs {
          display: flex;
          background-color: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0.5rem 0.5rem 0 0;
          overflow-x: auto;
        }

        .tab {
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab:hover {
          color: #374151;
          background-color: #f1f5f9;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background-color: white;
        }

        .tab-content {
          padding: 2rem 0;
        }

        .form-section h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
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

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .form-group input.read-only {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        .form-group input:disabled,
        .form-group select:disabled,
        .form-group textarea:disabled {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-group textarea::placeholder {
          color: #9ca3af;
          font-style: italic;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-grid .info-item {
          padding: 0.75rem;
          background-color: #f9fafb;
          border-radius: 0.375rem;
          border-left: 3px solid #3b82f6;
        }

        .info-grid .info-item strong {
          color: #374151;
          margin-right: 0.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #4b5563;
        }

        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }

        .btn-warning:hover:not(:disabled) {
          background-color: #d97706;
        }

        .btn-success {
          background-color: #10b981;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background-color: #059669;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
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
          padding: 2rem;
          border-radius: 0.5rem;
          text-align: center;
          margin: 2rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          
          .header-actions {
            width: 100%;
            justify-content: stretch;
          }
          
          .header-actions .btn {
            flex: 1;
          }
          
          .tabs {
            flex-direction: column;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .patient-urgencia-info {
            grid-template-columns: 1fr;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}