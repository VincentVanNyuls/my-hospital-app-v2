// src/app/consultas-externas/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../utils/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import DatosIdentificativosComponent from '../components/consultas-externas/DatosIdentificativosTab';
import AtencionComponent from '../components/consultas-externas/AtencionTab';
import DatosClinicosComponent from '../components/consultas-externas/DatosClinicosTab';
import ProgramacionComponent from '../components/consultas-externas/ProgramacionTab';
interface PacienteData {
  id?: string;
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  DNI_NIE: string;
  FechaNacimiento: Timestamp;
  Sexo: string;
  SIP: string;
  NumSeguridadSocial?: string;
  NumHistoriaClinica: string;
}

interface ConsultaExternaData {
  id?: string;
  Id_CEX: string;
  Paciente: string; // ID del paciente
  Prioridad: string;
  Tipo_visita: string;
  Llegada: boolean;
  Fecha: Timestamp;
  Hora: Timestamp;
  Especialidad: string;
  Tipo_Prueba?: string;
  Procedencia?: string;
  Derivación?: string;
  Médico_responsable?: string;
  Visita_médica?: string;
  Cobertura_SS?: boolean;
  Entidad?: string;
  Tipo_Acreditación?: string;
}

export default function ConsultasExternasPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();

  const [searchApellido1, setSearchApellido1] = useState('');
  const [searchDNI, setSearchDNI] = useState('');
  const [searchSIP, setSearchSIP] = useState('');
  const [searchNSS, setSearchNSS] = useState('');
  const [searchResults, setSearchResults] = useState<PacienteData[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('datos-identificativos');

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    const storedPatient = localStorage.getItem('selectedPatientCEX');
    if (storedPatient) {
      try {
        const patient: PacienteData = JSON.parse(storedPatient);
        if (patient.id) {
          setSelectedPatientId(patient.id);
        }
      } catch (e) {
        console.error("Error parsing selected patient from localStorage", e);
        localStorage.removeItem('selectedPatientCEX');
        setSelectedPatientId(null);
      }
    }
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    switch (id) {
      case 'searchApellido1':
        setSearchApellido1(value);
        break;
      case 'searchDNI':
        setSearchDNI(value);
        break;
      case 'searchSIP':
        setSearchSIP(value);
        break;
      case 'searchNSS':
        setSearchNSS(value);
        break;
      default:
        break;
    }
  };

  const handleSearchPaciente = async () => {
    setSearchError(null);
    setSearchResults([]);
    setSelectedPatientId(null);
    localStorage.removeItem('selectedPatientCEX');

    if (!user) {
      setSearchError("Debes iniciar sesión para buscar pacientes.");
      return;
    }
    
    if (!searchApellido1.trim() && !searchDNI.trim() && !searchSIP.trim() && !searchNSS.trim()) {
      setSearchError("Por favor, introduce al menos un criterio de búsqueda.");
      return;
    }

    setSearching(true);
    try {
      const pacientesRef = collection(db, "pacientes");
      let q;

      if (searchDNI.trim()) {
        q = query(pacientesRef, where("DNI_NIE", "==", searchDNI.trim()));
      } else if (searchSIP.trim()) {
        q = query(pacientesRef, where("SIP", "==", searchSIP.trim()));
      } else if (searchNSS.trim()) {
        q = query(pacientesRef, where("NumSeguridadSocial", "==", searchNSS.trim()));
      } else if (searchApellido1.trim()) {
        q = query(pacientesRef, where("Apellido1", "==", searchApellido1.trim()));
      } else {
        setSearchError("Criterio de búsqueda no válido.");
        setSearching(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      const results: PacienteData[] = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as Omit<PacienteData, 'id'>) 
      }));
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError("No se encontraron pacientes con los criterios especificados.");
      }

    } catch (err: unknown) {
      console.error("Error al buscar paciente:", err);
      if (err instanceof Error) {
        setSearchError(`Error al buscar paciente: ${err.message}`);
      } else {
        setSearchError('Ocurrió un error desconocido al buscar pacientes');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPaciente = (paciente: PacienteData) => {
    localStorage.setItem('selectedPatientCEX', JSON.stringify(paciente));
    setSelectedPatientId(paciente.id || null);
    setActiveTab('atencion');
  };

  const handleClearFilters = () => {
    setSearchApellido1('');
    setSearchDNI('');
    setSearchSIP('');
    setSearchNSS('');
    setSearchResults([]);
    setSearchError(null);
    setSelectedPatientId(null);
    localStorage.removeItem('selectedPatientCEX');
  };

  if (loadingAuth || !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando consultas externas...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Consultas Externas</h1>
          <p>Gestión de consultas externas y programación de visitas</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/')}
          >
            ← Volver al Dashboard
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Tarjeta de Búsqueda */}
        <div className="content-card">
          <h2>Buscar Paciente para Consulta Externa</h2>
          
          <div className="search-grid">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="searchApellido1">Primer Apellido:</label>
                <input 
                  type="text" 
                  id="searchApellido1" 
                  value={searchApellido1} 
                  onChange={handleSearchInputChange}
                  placeholder="Ej: García"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="searchDNI">DNI/NIE:</label>
                <input 
                  type="text" 
                  id="searchDNI" 
                  value={searchDNI} 
                  onChange={handleSearchInputChange}
                  placeholder="Ej: 12345678A"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="searchSIP">SIP:</label>
                <input 
                  type="text" 
                  id="searchSIP" 
                  value={searchSIP} 
                  onChange={handleSearchInputChange}
                  placeholder="Ej: 1234567"
                  maxLength={7}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="searchNSS">N.S.S:</label>
                <input 
                  type="text" 
                  id="searchNSS" 
                  value={searchNSS} 
                  onChange={handleSearchInputChange}
                  placeholder="Número Seguridad Social"
                />
              </div>
            </div>
          </div>

          <div className="search-actions">
            <div className="action-buttons-left">
              <button 
                onClick={handleSearchPaciente} 
                disabled={searching}
                className="btn btn-primary"
              >
                {searching ? '🔍 Buscando...' : '🔍 Buscar Paciente'}
              </button>
              
              <button 
                onClick={handleClearFilters}
                className="btn btn-secondary"
              >
                🗑️ Borrar Filtros
              </button>
            </div>
            
            <div className="action-buttons">
              <Link 
                href="/consultas-externas/initialize-data"
                className="btn btn-warning"
              >
                🔧 Inicializar Datos
              </Link>
              
              <Link 
                href="/consultas-externas/informes"
                className="btn btn-info"
              >
                📊 Informes
              </Link>
              
              <Link 
                href="/consultas-externas/agenda"
                className="btn btn-success"
              >
                📅 Agenda
              </Link>
              
              <Link 
                href="/pruebas-diagnosticas"
                className="btn btn-warning"
              >
                🧪 Pruebas Diagnósticas
              </Link>
            </div>
          </div>

          {searchError && (
            <div className="error-message">
              {searchError}
            </div>
          )}
        </div>

        {/* Resultados de Búsqueda */}
        {searchResults.length > 0 && (
          <div className="content-card">
            <h3>Resultados de la Búsqueda ({searchResults.length})</h3>
            <div className="results-container">
              {searchResults.map((paciente) => (
                <div key={paciente.id} className="patient-result-card">
                  <div className="patient-info">
                    <h4>{paciente.Nombre} {paciente.Apellido1} {paciente.Apellido2}</h4>
                    <div className="patient-details">
                      <span>DNI: <strong>{paciente.DNI_NIE}</strong></span>
                      <span>SIP: <strong>{paciente.SIP}</strong></span>
                      <span>NSS: <strong>{paciente.NumSeguridadSocial || 'N/A'}</strong></span>
                    </div>
                  </div>
                  <div className="patient-actions">
                    <button 
                      onClick={() => handleSelectPaciente(paciente)}
                      className="btn btn-success btn-sm"
                    >
                      Seleccionar para Consulta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario de Consulta Externa */}
        {selectedPatientId && (
          <div className="content-card">
            <h3>Consulta Externa - Paciente Seleccionado</h3>
            
            {/* Pestañas */}
            <div className="tabs-container">
              <div className="tabs-header">
                <button 
                  className={`tab-btn ${activeTab === 'datos-identificativos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('datos-identificativos')}
                >
                  Datos Identificativos
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'atencion' ? 'active' : ''}`}
                  onClick={() => setActiveTab('atencion')}
                >
                  Atención
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'datos-clinicos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('datos-clinicos')}
                >
                  Datos Clínicos
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'programacion' ? 'active' : ''}`}
                  onClick={() => setActiveTab('programacion')}
                >
                  Programación
                </button>
              </div>

              <div className="tab-content">
  {activeTab === 'datos-identificativos' && (
    <DatosIdentificativosComponent patientId={selectedPatientId} />
  )}
  {activeTab === 'atencion' && (
    <AtencionComponent patientId={selectedPatientId} />
  )}
  {activeTab === 'datos-clinicos' && (
    <DatosClinicosComponent patientId={selectedPatientId} />
  )}
  {activeTab === 'programacion' && (
    <ProgramacionComponent patientId={selectedPatientId} />
  )}
</div>
            </div>
          </div>
        )}

        {/* Estado cuando no hay búsquedas */}
        {!searching && searchResults.length === 0 && !searchError && !selectedPatientId && (
          <div className="content-card empty-state">
            <div className="empty-icon">🏥</div>
            <h3>Consultas Externas</h3>
            <p>Busque un paciente para comenzar una consulta externa</p>
          </div>
        )}
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
        }

        .header-actions {
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

        .content-card h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .search-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
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

        .form-group input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .search-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .action-buttons-left {
          display: flex;
          gap: 0.75rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
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

        .btn-success {
          background-color: #10b981;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background-color: #059669;
        }

        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }

        .btn-warning:hover:not(:disabled) {
          background-color: #d97706;
        }

        .btn-info {
          background-color: #06b6d4;
          color: white;
        }

        .btn-info:hover:not(:disabled) {
          background-color: #0891b2;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
        }

        .results-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .patient-result-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background-color: #f9fafb;
        }

        .patient-info h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .patient-details {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .patient-details strong {
          color: #374151;
        }

        .patient-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Tabs */
        .tabs-container {
          margin-top: 1rem;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 1.5rem;
        }

        .tab-btn {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: #374151;
        }

        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-content {
          min-height: 300px;
        }

        .error-message {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 0.375rem;
          margin-top: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          
          .form-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .search-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .action-buttons-left,
          .action-buttons {
            justify-content: center;
          }
          
          .patient-result-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .patient-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .tabs-header {
            flex-wrap: wrap;
          }

          .tab-btn {
            flex: 1;
            min-width: 120px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

// Componentes de las pestañas (implementaciones básicas)
function DatosIdentificativosTab({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    // Cargar datos del paciente
    const loadPatient = async () => {
      // Implementar carga de datos del paciente
    };
    loadPatient();
  }, [patientId]);

  return (
    <div>
      <h4>Datos Identificativos del Paciente</h4>
      <p>Información básica del paciente seleccionado...</p>
      {/* Formulario con datos del paciente */}
    </div>
  );
}

function AtencionTab({ patientId }: { patientId: string }) {
  return (
    <div>
      <h4>Atención en Consulta Externa</h4>
      <p>Formulario de atención CEX...</p>
      {/* Formulario de atención */}
    </div>
  );
}

function DatosClinicosTab({ patientId }: { patientId: string }) {
  return (
    <div>
      <h4>Datos Clínicos</h4>
      <p>Información clínica de la visita...</p>
      {/* Formulario de datos clínicos */}
    </div>
  );
}

function ProgramacionTab({ patientId }: { patientId: string }) {
  return (
    <div>
      <h4>Programación de Citas</h4>
      <p>Acceso a la agenda de consultas externas...</p>
      <button className="btn btn-primary">
        📅 Abrir Agenda de Consultas
      </button>
    </div>
  );
}