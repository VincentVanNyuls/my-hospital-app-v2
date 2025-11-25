// src/app/hospitalizacion/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HospitalizacionService } from '../utils/hospitalizacionService';
import { EpisodioHospitalizacion } from '../types/hospitalizacion';

const hospitalizacionService = new HospitalizacionService();

export default function HospitalizacionPage() {
  const router = useRouter();
  
  const [episodios, setEpisodios] = useState<EpisodioHospitalizacion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para búsqueda - igual que en pacientes
  const [searchPacienteId, setSearchPacienteId] = useState('');
  const [searchMedico, setSearchMedico] = useState('');
  const [searchEstado, setSearchEstado] = useState('todos');
  const [searchResults, setSearchResults] = useState<EpisodioHospitalizacion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [estadisticas, setEstadisticas] = useState({
    totalEpisodios: 0,
    activos: 0,
    completados: 0,
    promedioEstancia: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const todosEpisodios = await hospitalizacionService.getEpisodios();
      
      if (todosEpisodios && Array.isArray(todosEpisodios)) {
        const recientes = todosEpisodios
          .sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime())
          .slice(0, 5);
        
        setEpisodios(recientes);
        setSearchResults(recientes);
        
        const activos = todosEpisodios.filter(ep => !ep.fecha_alta).length;
        const completados = todosEpisodios.filter(ep => ep.fecha_alta).length;
        
        const episodiosCompletados = todosEpisodios.filter(ep => ep.fecha_alta);
        const promedioEstancia = episodiosCompletados.length > 0 
          ? episodiosCompletados.reduce((sum, ep) => {
              const ingreso = new Date(ep.fecha_ingreso);
              const alta = new Date(ep.fecha_alta!);
              const dias = Math.ceil((alta.getTime() - ingreso.getTime()) / (1000 * 3600 * 24));
              return sum + dias;
            }, 0) / episodiosCompletados.length
          : 0;

        setEstadisticas({
          totalEpisodios: todosEpisodios.length,
          activos,
          completados,
          promedioEstancia: Math.round(promedioEstancia * 10) / 10
        });
      } else {
        setEpisodios([]);
        setSearchResults([]);
        setEstadisticas({
          totalEpisodios: 0,
          activos: 0,
          completados: 0,
          promedioEstancia: 0
        });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setEpisodios([]);
      setSearchResults([]);
      setSearchError('Error al cargar los datos de hospitalización');
    } finally {
      setLoading(false);
    }
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

  const handleSearchEpisodios = async () => {
    setSearchError(null);
    setSearching(true);

    try {
      let resultadosFiltrados = [...episodios];

      if (searchPacienteId.trim()) {
        resultadosFiltrados = resultadosFiltrados.filter(ep => 
          ep.paciente_id.toLowerCase().includes(searchPacienteId.toLowerCase())
        );
      }

      if (searchMedico.trim()) {
        resultadosFiltrados = resultadosFiltrados.filter(ep => 
          ep.medico_tratante.toLowerCase().includes(searchMedico.toLowerCase())
        );
      }

      if (searchEstado !== 'todos') {
        resultadosFiltrados = resultadosFiltrados.filter(ep => 
          searchEstado === 'activos' ? !ep.fecha_alta : ep.fecha_alta
        );
      }

      setSearchResults(resultadosFiltrados);

      if (resultadosFiltrados.length === 0) {
        setSearchError("No se encontraron episodios con los criterios especificados.");
      }

    } catch (err: unknown) {
      console.error("Error al buscar episodios:", err);
      setSearchError('Ocurrió un error al buscar episodios');
    } finally {
      setSearching(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos de hospitalización...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header IDÉNTICO a gestión de pacientes */}
      <div className="page-header">
        <div className="header-content">
          <h1>Gestión de Hospitalización</h1>
          <p>Busque y administre los episodios de hospitalización del hospital</p>
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
        {/* Tarjeta de Estadísticas - Mismo estilo */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">🏥</div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.totalEpisodios}</div>
              <div className="stat-title">Total Episodios</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-green">🛌</div>
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

          <div className="stat-card">
            <div className="stat-icon stat-icon-red">📅</div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.promedioEstancia}</div>
              <div className="stat-title">Días Promedio</div>
            </div>
          </div>
        </div>

        {/* Tarjeta de Búsqueda - IDÉNTICA a gestión de pacientes */}
        <div className="content-card">
          <h2>Buscar Episodio</h2>
          
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
            <button 
              onClick={handleSearchEpisodios} 
              disabled={searching}
              className="btn btn-primary"
            >
              {searching ? '🔍 Buscando...' : '🔍 Buscar Episodios'}
            </button>
            
            <div className="action-buttons">
              <Link
                href="/hospitalizacion/admision"
                className="btn btn-success"
              >
                ➕ Crear Nuevo Ingreso
              </Link>
              
              <Link
                href="/hospitalizacion/episodios"
                className="btn btn-secondary"
              >
                📋 Ver Todos los Episodios
              </Link>
              
              <Link
                href="/pacientes"
                className="btn btn-warning"
              >
                👥 Gestionar Pacientes
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
        {searchResults.length > 0 && (
          <div className="content-card">
            <h3>Episodios Encontrados ({searchResults.length})</h3>
            <div className="results-container">
              {searchResults.map((episodio) => (
                <div key={episodio.id} className="patient-result-card">
                  <div className="patient-info">
                    <h4>Paciente: {episodio.paciente_id}</h4>
                    <div className="patient-details">
                      <span>👨‍⚕️ <strong>{episodio.medico_tratante}</strong></span>
                      <span>🏥 <strong>{episodio.departamento}</strong></span>
                      <span>📅 <strong>{formatFecha(episodio.fecha_ingreso)}</strong></span>
                      {episodio.habitacion && (
                        <span>🚪 <strong>Hab. {episodio.habitacion}-{episodio.cama}</strong></span>
                      )}
                    </div>
                    <p className="diagnostico-text">
                      {episodio.diagnostico_inicial}
                    </p>
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
                    
                    <span className={`status-badge ${
                      episodio.fecha_alta ? 'status-completed' : 'status-active'
                    }`}>
                      {episodio.fecha_alta ? 'Completado' : 'Activo'}
                    </span>
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
            <h3>Buscar Episodios de Hospitalización</h3>
            <p>Utilice los campos de búsqueda para encontrar episodios en el sistema</p>
          </div>
        )}

        {/* Módulos Adicionales */}
        <div className="content-card">
          <h2>Módulos de Hospitalización</h2>
          <div className="modules-grid">
            <Link href="/hospitalizacion/episodios" className="module-card">
              <div className="module-icon">📋</div>
              <h3>Gestión de Episodios</h3>
              <p>Administra todos los episodios de hospitalización activos y completados</p>
            </Link>

            <Link href="/hospitalizacion/admision" className="module-card">
              <div className="module-icon">➕</div>
              <h3>Admisión de Pacientes</h3>
              <p>Registra nuevos ingresos hospitalarios y asigna recursos</p>
            </Link>

            <Link href="/hospitalizacion/altas" className="module-card">
              <div className="module-icon">📄</div>
              <h3>Informes de Alta</h3>
              <p>Genera y gestiona informes de alta médica</p>
            </Link>

            <Link href="/hospitalizacion/reportes" className="module-card">
              <div className="module-icon">📊</div>
              <h3>Reportes y Estadísticas</h3>
              <p>Analiza datos de hospitalización y métricas</p>
            </Link>
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
          margin-bottom: 0.5rem;
        }

        .patient-details strong {
          color: #374151;
        }

        .diagnostico-text {
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
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
        .stat-icon-red { background-color: #fee2e2; color: #dc2626; }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-title {
          color: #6b7280;
          font-size: 0.875rem;
        }

        /* Módulos */
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .module-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }

        .module-card:hover {
          background: white;
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .module-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .module-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .module-card p {
          color: #6b7280;
          font-size: 0.875rem;
          line-height: 1.4;
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

          .modules-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}