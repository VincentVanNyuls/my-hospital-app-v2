"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../utils/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { PacienteData, UrgenciaData } from '../utils/types';
import { mapDocumentToUrgenciaData, createInitialUrgenciaData, generarEstadisticasUrgencias } from '../utils/firestoreUtils';

export default function UrgenciasPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();

  const [searchApellido1, setSearchApellido1] = useState('');
  const [searchDNI, setSearchDNI] = useState('');
  const [searchSIP, setSearchSIP] = useState('');
  const [searchHistoriaClinica, setSearchHistoriaClinica] = useState('');
  const [searchResults, setSearchResults] = useState<PacienteData[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [urgenciasActivas, setUrgenciasActivas] = useState<UrgenciaData[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loadingUrgencias, setLoadingUrgencias] = useState(true);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (user) {
      cargarUrgenciasActivas();
      cargarEstadisticas();
    }
  }, [user]);

  const cargarUrgenciasActivas = async () => {
    if (!user) return;
    
    setLoadingUrgencias(true);
    try {
      const urgenciasRef = collection(db, "urgencias");
      const q = query(urgenciasRef, where("Estado", "==", "activa"));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => mapDocumentToUrgenciaData(doc));
      setUrgenciasActivas(results);
    } catch (error) {
      console.error("Error al cargar urgencias activas:", error);
    } finally {
      setLoadingUrgencias(false);
    }
  };

  const cargarEstadisticas = async () => {
    if (!user) return;
    
    try {
      const urgenciasRef = collection(db, "urgencias");
      const q = query(urgenciasRef, where("creadoEn", ">=", Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))); // Últimos 30 días
      const querySnapshot = await getDocs(q);
      const todasLasUrgencias = querySnapshot.docs.map(doc => mapDocumentToUrgenciaData(doc));
      const stats = generarEstadisticasUrgencias(todasLasUrgencias);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

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

    if (!user) {
      setSearchError("Debes iniciar sesión para buscar pacientes.");
      return;
    }
    
    if (!searchApellido1.trim() && !searchDNI.trim() && !searchSIP.trim() && !searchHistoriaClinica.trim()) {
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

  const handleCrearUrgencia = async (paciente: PacienteData) => {
    if (!user || !paciente.id) return;

    try {
      // Verificar si ya existe una urgencia activa para este paciente
      const urgenciasRef = collection(db, "urgencias");
      const q = query(
        urgenciasRef, 
        where("Id_Paciente", "==", paciente.id),
        where("Estado", "==", "activa")
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const urgenciaExistente = querySnapshot.docs[0];
        const confirmar = window.confirm(
          `Este paciente ya tiene una urgencia activa (${urgenciaExistente.data().Id_Urgencia}). ¿Desea gestionar la urgencia existente?`
        );
        
        if (confirmar) {
          router.push(`/urgencias/gestion?urgenciaId=${urgenciaExistente.id}`);
        }
        return;
      }

      // Crear nueva urgencia - SIN VALIDACIÓN PARA CREACIÓN INICIAL
      const nuevaUrgencia = createInitialUrgenciaData(paciente.id, user.uid);
      nuevaUrgencia.Medico_responsable = user.email || 'Médico no asignado';

      const docRef = await addDoc(collection(db, "urgencias"), nuevaUrgencia);
      
      // Recargar urgencias activas y estadísticas
      await cargarUrgenciasActivas();
      await cargarEstadisticas();
      
      alert(`Urgencia ${nuevaUrgencia.Id_Urgencia} creada para ${paciente.Nombre} ${paciente.Apellido1}`);
      
      // Redirigir a la gestión de la nueva urgencia
      router.push(`/urgencias/gestion?urgenciaId=${docRef.id}`);
      
    } catch (error) {
      console.error("Error al crear urgencia:", error);
      alert("Error al crear la urgencia. Por favor, intente nuevamente.");
    }
  };

  const handleGestionarUrgencia = (urgenciaId: string) => {
    router.push(`/urgencias/gestion?urgenciaId=${urgenciaId}`);
  };

  const handleLimpiarBusqueda = () => {
    setSearchApellido1('');
    setSearchDNI('');
    setSearchSIP('');
    setSearchHistoriaClinica('');
    setSearchResults([]);
    setSearchError(null);
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
        <p>Cargando módulo de urgencias...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Gestión de Urgencias</h1>
          <p>Atienda y administre los casos de urgencias del hospital</p>
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
        {/* Estadísticas Rápidas */}
        {estadisticas && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Urgencias</h3>
                <div className="stat-number">{estadisticas.total}</div>
                <div className="stat-period">Últimos 30 días</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🟢</div>
              <div className="stat-content">
                <h3>Activas</h3>
                <div className="stat-number">{estadisticas.activas}</div>
                <div className="stat-period">En este momento</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <h3>Duración Promedio</h3>
                <div className="stat-number">{estadisticas.promedioDuracion}</div>
                <div className="stat-period">Tiempo atención</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>Especialidad Más Común</h3>
                <div className="stat-number">{estadisticas.especialidadMasComun}</div>
                <div className="stat-period">Frecuencia</div>
              </div>
            </div>
          </div>
        )}

        {/* Urgencias Activas */}
        {urgenciasActivas.length > 0 && (
          <div className="content-card">
            <div className="card-header">
              <h2>🟢 Urgencias Activas ({urgenciasActivas.length})</h2>
              <button 
                onClick={cargarUrgenciasActivas}
                className="btn btn-outline btn-sm"
                disabled={loadingUrgencias}
              >
                {loadingUrgencias ? '🔄' : '↻'} Actualizar
              </button>
            </div>
            <div className="results-container">
              {urgenciasActivas.map((urgencia) => (
                <div key={urgencia.id} className="urgencia-card">
                  <div className="urgencia-info">
                    <div className="urgencia-header">
                      <h4>{urgencia.Id_Urgencia}</h4>
                      <span className="hora-entrada">🕐 {urgencia.Hora_Entrada}</span>
                    </div>
                    <div className="urgencia-details">
                      <span><strong>Especialidad:</strong> {urgencia.Especialidad}</span>
                      <span><strong>Médico:</strong> {urgencia.Medico_responsable}</span>
                      <span><strong>Motivo:</strong> {urgencia.Motivo_Urgencia}</span>
                    </div>
                  </div>
                  <div className="urgencia-actions">
                    <button 
                      onClick={() => handleGestionarUrgencia(urgencia.id!)}
                      className="btn btn-primary btn-sm"
                    >
                      👨‍⚕️ Gestionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tarjeta de Búsqueda */}
        <div className="content-card">
          <h2>Nueva Urgencia - Buscar Paciente</h2>
          
          <div className="search-grid">
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
            <div className="search-buttons">
              <button 
                onClick={handleSearchPaciente} 
                disabled={searching}
                className="btn btn-primary"
              >
                {searching ? '🔍 Buscando...' : '🔍 Buscar Paciente'}
              </button>
              <button 
                onClick={handleLimpiarBusqueda}
                className="btn btn-outline"
              >
                🗑️ Limpiar
              </button>
            </div>
            
            <div className="action-buttons">
              <Link
                href="/urgencias/informes"
                className="btn btn-secondary"
              >
                📊 Informes de Urgencias
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
                      <span>NHC: <strong>{paciente.NumHistoriaClinica}</strong></span>
                      {paciente.FechaNacimiento && (
                        <span>Edad: <strong>{calcularEdad(paciente.FechaNacimiento)} años</strong></span>
                      )}
                    </div>
                  </div>
                  <div className="patient-actions">
                    <button 
                      onClick={() => handleCrearUrgencia(paciente)}
                      className="btn btn-success btn-sm"
                    >
                      🏥 Crear Urgencia
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado cuando no hay búsquedas */}
        {!searching && searchResults.length === 0 && !searchError && (
          <div className="content-card empty-state">
            <div className="empty-icon">🏥</div>
            <h3>Gestión de Urgencias</h3>
            <p>Busque un paciente para iniciar un nuevo caso de urgencia o gestione las urgencias activas</p>
            <div className="empty-actions">
              <Link href="/pacientes" className="btn btn-primary">
                👥 Ver Todos los Pacientes
              </Link>
            </div>
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

        /* Estadísticas */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-content h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-period {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .content-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .search-buttons {
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
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
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

        .btn-outline {
          background-color: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-outline:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
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

        /* Tarjetas de urgencias activas */
        .urgencia-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background-color: #f0f9ff;
          border-left: 4px solid #3b82f6;
        }

        .urgencia-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .urgencia-header h4 {
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .hora-entrada {
          font-size: 0.875rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .urgencia-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .urgencia-details strong {
          color: #374151;
        }

        .urgencia-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Tarjetas de pacientes */
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

        .empty-actions {
          margin-top: 1.5rem;
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
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .search-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-buttons, .action-buttons {
            flex-direction: column;
          }
          
          .urgencia-card, .patient-result-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .urgencia-actions, .patient-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .patient-details {
            flex-direction: column;
            gap: 0.5rem;
          }

          .urgencia-details {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}