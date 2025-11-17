// src/app/pacientes/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

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
  Direccion?: string;
  CodigoPostal?: string;
  Telefono?: string;
  creadoPor: string;
  creadoEn: Timestamp;
}

export default function PacientesPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();

  const [searchApellido1, setSearchApellido1] = useState('');
  const [searchDNI, setSearchDNI] = useState('');
  const [searchSIP, setSearchSIP] = useState('');
  const [searchHistoriaClinica, setSearchHistoriaClinica] = useState('');
  const [searchResults, setSearchResults] = useState<PacienteData[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    const storedPatient = localStorage.getItem('selectedPatient');
    if (storedPatient) {
      try {
        const patient: PacienteData = JSON.parse(storedPatient);
        if (patient.id) {
          setSelectedPatientId(patient.id);
        }
      } catch (e) {
        console.error("Error parsing selected patient from localStorage", e);
        localStorage.removeItem('selectedPatient');
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
      case 'searchHistoriaClinica':
        setSearchHistoriaClinica(value);
        break;
      default:
        break;
    }
  };

  const handleSearchPaciente = async () => {
    setSearchError(null);
    setSearchResults([]);
    setSelectedPatientId(null);
    localStorage.removeItem('selectedPatient');

    if (!user) {
      setSearchError("Debes iniciar sesión para buscar pacientes.");
      return;
    }
    
    if (!searchApellido1.trim() && !searchDNI.trim() && !searchSIP.trim() && !searchHistoriaClinica.trim()) {
      setSearchError("Por favor, introduce al menos un criterio de búsqueda (Apellido 1, DNI/NIE, SIP o NHC).");
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
      } else if (searchHistoriaClinica.trim()) {
        q = query(pacientesRef, where("NumHistoriaClinica", "==", searchHistoriaClinica.trim()));
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
    localStorage.setItem('selectedPatient', JSON.stringify(paciente));
    setSelectedPatientId(paciente.id || null);
    alert(`Paciente ${paciente.Nombre} ${paciente.Apellido1} (DNI: ${paciente.DNI_NIE}) seleccionado.`);
  };

  if (loadingAuth || !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando gestión de pacientes...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Gestión de Pacientes</h1>
          <p>Busque y administre la información de pacientes del hospital</p>
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
          <h2>Buscar Paciente</h2>
          
          <div className="search-grid">
            {/* Primera fila - Apellido1 y DNI */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="searchApellido1">Apellido 1:</label>
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
            
            {/* Segunda fila - SIP y NHC */}
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
                <label htmlFor="searchHistoriaClinica">NHC:</label>
                <input 
                  type="text" 
                  id="searchHistoriaClinica" 
                  value={searchHistoriaClinica} 
                  onChange={handleSearchInputChange}
                  placeholder="Número Historia Clínica"
                />
              </div>
            </div>
          </div>

          <div className="search-actions">
            <button 
              onClick={handleSearchPaciente} 
              disabled={searching}
              className="btn btn-primary"
            >
              {searching ? '🔍 Buscando...' : '🔍 Buscar Paciente'}
            </button>
            
            <div className="action-buttons">
              <button 
                onClick={() => router.push('/pacientes/create')}
                className="btn btn-success"
              >
                ＋ Crear Nuevo Paciente
              </button>
              
              <button 
                onClick={() => router.push('/pacientes/list')}
                className="btn btn-secondary"
              >
                📋 Ver Todos los Pacientes
              </button>
              
              <button 
                onClick={() => router.push(`/pacientes/edit/${selectedPatientId}`)} 
                disabled={!selectedPatientId} 
                className="btn btn-warning"
              >
                ✏️ Editar Paciente Seleccionado
              </button>
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
                      <span>NHC: <strong>{paciente.NumHistoriaClinica}</strong></span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelectPaciente(paciente)}
                    className="btn btn-success btn-sm"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado cuando no hay búsquedas */}
        {!searching && searchResults.length === 0 && !searchError && (
          <div className="content-card empty-state">
            <div className="empty-icon">👥</div>
            <h3>Buscar Pacientes</h3>
            <p>Utilice los campos de búsqueda para encontrar pacientes en el sistema</p>
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
          justify-content: between;
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

        /* Grid de búsqueda mejorado */
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
          ring: 2px;
          ring-color: #3b82f6;
          border-color: #3b82f6;
        }

        .form-group input::placeholder {
          color: #9ca3af;
        }

        /* Acciones de búsqueda */
        .search-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* Botones */
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

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
        }

        /* Resultados */
        .results-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .patient-result-card {
          display: flex;
          justify-content: between;
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

        /* Estados */
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

        /* Responsive */
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          
          .form-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .patient-result-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}