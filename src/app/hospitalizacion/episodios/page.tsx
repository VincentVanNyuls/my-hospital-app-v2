'use client';

import { useState, useEffect } from 'react';
import { HospitalizacionService } from '../../utils/hospitalizacionService';
import { EpisodioHospitalizacion } from '../../types/hospitalizacion';
import Link from 'next/link';

const hospitalizacionService = new HospitalizacionService();

export default function EpisodiosPage() {
  const [episodios, setEpisodios] = useState<EpisodioHospitalizacion[]>([]);
  const [episodiosFiltrados, setEpisodiosFiltrados] = useState<EpisodioHospitalizacion[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'completados'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEpisodios();
  }, []);

  useEffect(() => {
    filtrarEpisodios();
  }, [episodios, filtroEstado, busqueda]);

  const cargarEpisodios = async () => {
    try {
      setLoading(true);
      const todosEpisodios = await hospitalizacionService.getEpisodios();
      console.log('📋 Episodios cargados:', todosEpisodios);
      setEpisodios(todosEpisodios || []);
    } catch (error) {
      console.error('Error cargando episodios:', error);
      setEpisodios([]);
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

    if (filtroEstado === 'activos') {
      filtrados = filtrados.filter(ep => !ep.fecha_alta);
    } else if (filtroEstado === 'completados') {
      filtrados = filtrados.filter(ep => ep.fecha_alta);
    }

    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      filtrados = filtrados.filter(ep =>
        ep.paciente_id?.toLowerCase().includes(termino) ||
        ep.medico_tratante?.toLowerCase().includes(termino) ||
        ep.departamento?.toLowerCase().includes(termino) ||
        ep.motivo_ingreso?.toLowerCase().includes(termino) ||
        ep.habitacion?.toLowerCase().includes(termino)
      );
    }

    setEpisodiosFiltrados(filtrados);
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
    // ✅ SOLO este div - ELIMINA los contenedores duplicados
    <div className="episodios-content">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Gestión de Episodios</h1>
        <p>Ver y gestionar todos los episodios de hospitalización</p>
      </div>

      {/* Estadísticas - Mismo estilo que gestión de pacientes */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-blue">
              <span>📊</span>
            </div>
            <span className="stat-trend stat-trend-up">+12%</span>
          </div>
          <div className="stat-value">{estadisticas.total}</div>
          <div className="stat-title">Total Episodios</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-green">
              <span>🏥</span>
            </div>
            <span className="stat-trend stat-trend-up">+5%</span>
          </div>
          <div className="stat-value">{estadisticas.activos}</div>
          <div className="stat-title">Pacientes Activos</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-purple">
              <span>✅</span>
            </div>
            <span className="stat-trend stat-trend-up">+8%</span>
          </div>
          <div className="stat-value">{estadisticas.completados}</div>
          <div className="stat-title">Altas Médicas</div>
        </div>
      </div>

      {/* Filtros y Búsqueda - Mismo diseño que gestión de pacientes */}
      <div className="content-card">
        <h2>Buscar y Filtrar Episodios</h2>
        
        <div className="search-grid">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar episodios
            </label>
            <input
              type="text"
              placeholder="Buscar por paciente, médico, departamento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado del episodio
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
            >
              <option value="todos">Todos los episodios</option>
              <option value="activos">Solo activos</option>
              <option value="completados">Solo completados</option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="search-actions">
            <div className="action-buttons">
              <Link
                href="/hospitalizacion/admision"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ➕ Nuevo Ingreso
              </Link>
              <button 
                onClick={cargarEpisodios}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Episodios - Mismo estilo que gestión de pacientes */}
      <div className="content-card">
        <div className="flex justify-between items-center mb-6">
          <h2>Lista de Episodios</h2>
          <span className="text-sm text-gray-500">
            {episodiosFiltrados.length} de {episodios.length} episodios
          </span>
        </div>

        {episodiosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>
              {episodios.length === 0 ? 'No hay episodios registrados' : 'No se encontraron resultados'}
            </h3>
            <p>
              {episodios.length === 0 
                ? 'Comienza admitiendo un paciente desde la página de admisión.'
                : 'Intenta con otros términos de búsqueda o cambia el filtro.'
              }
            </p>
            {episodios.length === 0 && (
              <Link
                href="/hospitalizacion/admision"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-4 inline-block"
              >
                ➕ Admitir Primer Paciente
              </Link>
            )}
          </div>
        ) : (
          <div className="results-container">
            {episodiosFiltrados.map((episodio) => (
              <div key={episodio.id} className="patient-result-card">
                <div className="patient-info">
                  <div className="flex items-center gap-3 mb-2">
                    <h4>Paciente: {episodio.paciente_id}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      episodio.fecha_alta 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {episodio.fecha_alta ? 'Completado' : 'Activo'}
                    </span>
                  </div>
                  
                  <div className="patient-details">
                    <span>👨‍⚕️ {episodio.medico_tratante}</span>
                    <span>🏥 {episodio.departamento}</span>
                    <span>📅 Ingreso: {formatFecha(episodio.fecha_ingreso)}</span>
                    {episodio.habitacion && (
                      <span>🚪 Hab. {episodio.habitacion}-{episodio.cama}</span>
                    )}
                    <span>⏱️ {calcularDiasEstancia(episodio.fecha_ingreso, episodio.fecha_alta)} días</span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Motivo:</strong> {episodio.motivo_ingreso}</p>
                    <p><strong>Diagnóstico:</strong> {episodio.diagnostico_inicial}</p>
                    {episodio.fecha_alta && (
                      <p><strong>Alta:</strong> {formatFecha(episodio.fecha_alta)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/hospitalizacion/episodios/${episodio.id}`}
                    className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Ver Detalles
                  </Link>
                  {!episodio.fecha_alta && (
                    <Link
                      href={`/hospitalizacion/alta/${episodio.id}`}
                      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm font-medium"
                    >
                      Dar Alta
                    </Link>
                  )}
                  {episodio.fecha_alta && (
                    <button
                      onClick={() => hospitalizacionService.descargarInformeAlta(episodio.id)}
                      className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm font-medium"
                    >
                      📄 PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen de Filtros Aplicados */}
      <div className="content-card">
        <h3>Resumen de Filtros</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="bg-blue-50 px-3 py-2 rounded-lg">
            <span className="font-medium text-blue-700">Total en sistema:</span>
            <span className="ml-2 text-blue-600">{estadisticas.total} episodios</span>
          </div>
          <div className="bg-green-50 px-3 py-2 rounded-lg">
            <span className="font-medium text-green-700">Activos:</span>
            <span className="ml-2 text-green-600">{estadisticas.activos} pacientes</span>
          </div>
          <div className="bg-purple-50 px-3 py-2 rounded-lg">
            <span className="font-medium text-purple-700">Completados:</span>
            <span className="ml-2 text-purple-600">{estadisticas.completados} altas</span>
          </div>
          {(busqueda || filtroEstado !== 'todos') && (
            <div className="bg-yellow-50 px-3 py-2 rounded-lg">
              <span className="font-medium text-yellow-700">Filtros aplicados:</span>
              <span className="ml-2 text-yellow-600">
                {busqueda && `"${busqueda}"`} 
                {busqueda && filtroEstado !== 'todos' && ' + '}
                {filtroEstado !== 'todos' && `${filtroEstado}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}