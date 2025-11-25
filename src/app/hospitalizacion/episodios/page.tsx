// src/app/hospitalizacion/episodios/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HospitalizacionService } from '../../utils/hospitalizacionService';
import { EpisodioHospitalizacion } from '../../types/hospitalizacion';

const hospitalizacionService = new HospitalizacionService();

export default function EpisodiosPage() {
  const router = useRouter();
  
  const [episodios, setEpisodios] = useState<EpisodioHospitalizacion[]>([]);
  const [episodiosFiltrados, setEpisodiosFiltrados] = useState<EpisodioHospitalizacion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para búsqueda - igual que en pacientes
  const [searchPacienteId, setSearchPacienteId] = useState('');
  const [searchMedico, setSearchMedico] = useState('');
  const [searchEstado, setSearchEstado] = useState('todos');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    cargarEpisodios();
  }, []);

  useEffect(() => {
    filtrarEpisodios();
  }, [episodios, searchEstado, searchPacienteId, searchMedico]);

  const cargarEpisodios = async () => {
    try {
      setLoading(true);
      setSearchError(null);
      const todosEpisodios = await hospitalizacionService.getEpisodios();
      setEpisodios(todosEpisodios || []);
    } catch (error) {
      console.error('Error cargando episodios:', error);
      setEpisodios([]);
      setSearchError('Error al cargar los episodios');
    } finally {
      setLoading(false);
    }
  };

  const filtrarEpisodios = () => {
    if (!episodios || !Array.isArray(episodios)) {
      setEpisodiosFiltrados([]);
      return;
    }

    let filtrados = [...episodios];

    // Filtro por estado
    if (searchEstado === 'activos') {
      filtrados = filtrados.filter(ep => !ep.fecha_alta);
    } else if (searchEstado === 'completados') {
      filtrados = filtrados.filter(ep => ep.fecha_alta);
    }

    // Filtro por paciente ID
    if (searchPacienteId.trim()) {
      filtrados = filtrados.filter(ep => 
        ep.paciente_id?.toLowerCase().includes(searchPacienteId.toLowerCase())
      );
    }

    // Filtro por médico
    if (searchMedico.trim()) {
      filtrados = filtrados.filter(ep => 
        ep.medico_tratante?.toLowerCase().includes(searchMedico.toLowerCase())
      );
    }

    setEpisodiosFiltrados(filtrados);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    switch (id) {
      case 'searchPacienteId':
        setSearchPacienteId(value);
        break;
      case 'searchMedico':
        setSearchMedico(value);
        break;
      case 'searchEstado':
        setSearchEstado(value);
        break;
      default:
        break;
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const calcularDiasEstancia = (fechaIngreso: string, fechaAlta?: string) => {
    try {
      const ingreso = new Date(fechaIngreso);
      const alta = fechaAlta ? new Date(fechaAlta) : new Date();
      const diffTime = Math.abs(alta.getTime() - ingreso.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  };

  const getEstadisticas = () => {
    if (!episodios || !Array.isArray(episodios)) {
      return { total: 0, activos: 0, completados: 0 };
    }

    const activos = episodios.filter(ep => !ep.fecha_alta).length;
    const completados = episodios.filter(ep => ep.fecha_alta).length;
    
    return { total: episodios.length, activos, completados };
  };

  const estadisticas = getEstadisticas();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando episodios de hospitalización...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header IDÉNTICO a gestión de pacientes */}
      <div className="page-header">
        <div className="header-content">
          <h1>Gestión de Episodios</h1>
          <p>Ver y gestionar todos los episodios de hospitalización del hospital</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/hospitalizacion')}
          >
            ← Volver a Hospitalización
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Tarjeta de Estadísticas - Mismo estilo */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">📊</div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.total}</div>
              <div className="stat-title">Total Episodios</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-green">🏥</div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.activos}</div>
              <div className="stat-title">Pacientes Activos</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-purple">✅</div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.completados}</div>
              <div className="stat-title">Altas Médicas</div>
            </div>
          </div>
        </div>

        {/* Tarjeta de Búsqueda - IDÉNTICA a gestión de pacientes */}
        <div className="content-card">
          <h2>Buscar Episodios</h2>
          
          <div className="search-grid">
            {/* Primera fila */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="searchPacienteId">ID Paciente:</label>
                <input 
                  type="text" 
                  id="searchPacienteId" 
                  value={searchPacienteId} 
                  onChange={handleSearchInputChange}
                  placeholder="Ej: P-001"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="searchMedico">Médico Tratante:</label>
                <input 
                  type="text" 
                  id="searchMedico" 
                  value={searchMedico} 
                  onChange={handleSearchInputChange}
                  placeholder="Ej: Dr. García"
                />
              </div>
            </div>
            
            {/* Segunda fila */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="searchEstado">Estado:</label>
                <select 
                  id="searchEstado"
                  value={searchEstado} 
                  onChange={handleSearchInputChange}
                  className="form-select"
                >
                  <option value="todos">Todos los episodios</option>
                  <option value="activos">Solo activos</option>
                  <option value="completados">Solo completados</option>
                </select>
              </div>
              
              <div className="form-group">
                {/* Espacio para futuros campos de búsqueda */}
                <label>&nbsp;</label>
                <div style={{height: '42px'}}></div>
              </div>
            </div>
          </div>

          <div className="search-actions">
            <div className="action-buttons">
              <Link
                href="/hospitalizacion/admision"
                className="btn btn-success"
              >
                ➕ Crear Nuevo Ingreso
              </Link>
              
              <button 
                onClick={cargarEpisodios}
                className="btn btn-primary"
              >
                🔄 Actualizar Lista
              </button>

              <Link
                href="/hospitalizacion"
                className="btn btn-secondary"
              >
                🏠 Volver al Dashboard
              </Link>
            </div>
          </div>

          {searchError && (
            <div className="error-message">
              {searchError}
            </div>
          )}
        </div>

        {/* Resultados de Búsqueda - Mismo estilo que pacientes */}
        {episodiosFiltrados.length > 0 && (
          <div className="content-card">
            <div className="results-header">
              <h3>Episodios Encontrados ({episodiosFiltrados.length})</h3>
              <div className="filters-summary">
                {(searchPacienteId || searchMedico || searchEstado !== 'todos') && (
                  <div className="active-filters">
                    <span className="filters-label">Filtros aplicados:</span>
                    {searchPacienteId && (
                      <span className="filter-tag">Paciente: "{searchPacienteId}"</span>
                    )}
                    {searchMedico && (
                      <span className="filter-tag">Médico: "{searchMedico}"</span>
                    )}
                    {searchEstado !== 'todos' && (
                      <span className="filter-tag">Estado: {searchEstado}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="results-container">
              {episodiosFiltrados.map((episodio) => (
                <div key={episodio.id} className="patient-result-card">
                  <div className="patient-info">
                    <div className="patient-header">
                      <h4>Paciente: {episodio.paciente_id}</h4>
                      <span className={`status-badge ${
                        episodio.fecha_alta ? 'status-completed' : 'status-active'
                      }`}>
                        {episodio.fecha_alta ? 'Completado' : 'Activo'}
                      </span>
                    </div>
                    
                    <div className="patient-details">
                      <span>👨‍⚕️ <strong>{episodio.medico_tratante}</strong></span>
                      <span>🏥 <strong>{episodio.departamento}</strong></span>
                      <span>📅 <strong>{formatFecha(episodio.fecha_ingreso)}</strong></span>
                      {episodio.habitacion && (
                        <span>🚪 <strong>Hab. {episodio.habitacion}-{episodio.cama}</strong></span>
                      )}
                      <span>⏱️ <strong>{calcularDiasEstancia(episodio.fecha_ingreso, episodio.fecha_alta)} días</strong></span>
                    </div>
                    
                    <div className="episodio-details">
                      <p className="detail-item">
                        <strong>Motivo:</strong> {episodio.motivo_ingreso}
                      </p>
                      <p className="detail-item">
                        <strong>Diagnóstico:</strong> {episodio.diagnostico_inicial}
                      </p>
                      {episodio.fecha_alta && (
                        <p className="detail-item">
                          <strong>Alta:</strong> {formatFecha(episodio.fecha_alta)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="patient-actions">
                    <Link
                      href={`/hospitalizacion/episodios/${episodio.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Ver Detalles
                    </Link>
                    
                    {!episodio.fecha_alta && (
                      <Link
                        href={`/hospitalizacion/alta/${episodio.id}`}
                        className="btn btn-success btn-sm"
                      >
                        Dar Alta
                      </Link>
                    )}
                    
                    {episodio.fecha_alta && (
                      <button
                        onClick={() => hospitalizacionService.descargarInformeAlta(episodio.id)}
                        className="btn btn-warning btn-sm"
                      >
                        📄 PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado cuando no hay búsquedas */}
        {!searching && episodiosFiltrados.length === 0 && !searchError && (
          <div className="content-card empty-state">
            <div className="empty-icon">📋</div>
            <h3>
              {episodios.length === 0 ? 'No hay episodios registrados' : 'No se encontraron episodios'}
            </h3>
            <p>
              {episodios.length === 0 
                ? 'Comienza admitiendo un paciente desde la página de admisión.'
                : 'Intenta ajustar los filtros de búsqueda para encontrar más resultados.'
              }
            </p>
            {episodios.length === 0 && (
              <Link
                href="/hospitalizacion/admision"
                className="btn btn-success"
              >
                ➕ Admitir Primer Paciente
              </Link>
            )}
          </div>
        )}

        {/* Resumen de Estadísticas */}
        <div className="content-card">
          <h3>Resumen del Sistema</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-label">Total en sistema</div>
              <div className="summary-value">{estadisticas.total} episodios</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Pacientes activos</div>
              <div className="summary-value summary-active">{estadisticas.activos} pacientes</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Altas médicas</div>
              <div className="summary-value summary-completed">{estadisticas.completados} altas</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Mostrando</div>
              <div className="summary-value">{episodiosFiltrados.length} de {episodios.length}</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ESTILOS EXACTAMENTE IGUALES A GESTIÓN DE PACIENTES */
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

        .content-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
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

        .form-group input, .form-select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus, .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
        }

        /* Resultados */
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .filters-summary {
          display: flex;
          align-items: center;
        }

        .active-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filters-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-right: 0.5rem;
        }

        .filter-tag {
          background-color: #eff6ff;
          color: #1d4ed8;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
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

        .patient-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .patient-info h4 {
          font-weight: 600;
          color: #1f2937;
        }

        .patient-details {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .patient-details strong {
          color: #374151;
        }

        .episodio-details {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .detail-item {
          margin-bottom: 0.25rem;
        }

        .detail-item strong {
          color: #374151;
        }

        .patient-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-active {
          background-color: #fef3c7;
          color: #d97706;
        }

        .status-completed {
          background-color: #d1fae5;
          color: #065f46;
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
          width: 4rem;
          height: 4rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .stat-icon-blue { background-color: #dbeafe; color: #1d4ed8; }
        .stat-icon-green { background-color: #d1fae5; color: #065f46; }
        .stat-icon-purple { background-color: #f3e8ff; color: #7e22ce; }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-title {
          color: #6b7280;
          font-size: 0.875rem;
        }

        /* Resumen */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .summary-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
        }

        .summary-active {
          color: #059669;
        }

        .summary-completed {
          color: #7e22ce;
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

          .patient-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .results-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .patient-details {
            flex-direction: column;
            gap: 0.5rem;
          }

          .patient-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}