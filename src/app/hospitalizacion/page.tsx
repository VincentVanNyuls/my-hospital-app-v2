'use client';

import { useState, useEffect } from 'react';
import { HospitalizacionService } from '../utils/hospitalizacionService';
import { EpisodioHospitalizacion } from '../types/hospitalizacion';
import Link from 'next/link';

const hospitalizacionService = new HospitalizacionService();

export default function HospitalizacionPage() {
  const [episodios, setEpisodios] = useState<EpisodioHospitalizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalEpisodios: 0,
    activos: 0,
    completados: 0,
    promedioEstancia: 0
  });

  // Estados para búsqueda - usando propiedades existentes
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

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
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filtrar episodios basado en los filtros - usando propiedades existentes
  const episodiosFiltrados = episodios.filter(episodio => {
    const coincidePaciente = episodio.paciente_id.toLowerCase().includes(filtroPaciente.toLowerCase());
    const coincideMedico = episodio.medico_tratante.toLowerCase().includes(filtroMedico.toLowerCase());
    const coincideEstado = 
      filtroEstado === 'todos' || 
      (filtroEstado === 'activos' && !episodio.fecha_alta) ||
      (filtroEstado === 'completados' && episodio.fecha_alta);
    
    return coincidePaciente && coincideMedico && coincideEstado;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos de hospitalización...</p>
      </div>
    );
  }

  return (
    // SOLO este div - ELIMINA los contenedores duplicados
    <div className="hospitalizacion-content">
      {/* Header - Exactamente igual a gestión de pacientes */}
      <div className="dashboard-header">
        <h1>Hospitalización</h1>
        <p>Busque y administre los episodios de hospitalización</p>
      </div>

      {/* Tarjetas de Estadísticas - Mismo estilo que gestión de pacientes */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-blue">
              <span>🏥</span>
            </div>
            <span className="stat-trend stat-trend-up">+12%</span>
          </div>
          <div className="stat-value">{estadisticas.totalEpisodios}</div>
          <div className="stat-title">Total Episodios</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-green">
              <span>🛌</span>
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

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-red">
              <span>📅</span>
            </div>
            <span className="stat-trend stat-trend-down">-2%</span>
          </div>
          <div className="stat-value">{estadisticas.promedioEstancia}</div>
          <div className="stat-title">Días Promedio</div>
        </div>
      </div>

      {/* Sección de Búsqueda - Mismo diseño que gestión de pacientes */}
      <div className="content-card">
        <h2>Buscar Episodio</h2>
        
        <div className="search-grid">
          {/* Paciente ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente ID
            </label>
            <input
              type="text"
              placeholder="Ej: P-001"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroPaciente}
              onChange={(e) => setFiltroPaciente(e.target.value)}
            />
          </div>

          {/* Médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Médico
            </label>
            <input
              type="text"
              placeholder="Ej: Dr. García"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroMedico}
              onChange={(e) => setFiltroMedico(e.target.value)}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los episodios</option>
              <option value="activos">Solo activos</option>
              <option value="completados">Solo completados</option>
            </select>
          </div>

          {/* Botón de búsqueda */}
          <div className="search-actions">
            <div className="action-buttons">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                🔍 Buscar Episodios
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción - Mismo estilo que gestión de pacientes */}
      <div className="content-card">
        <h2>Acciones Rápidas</h2>
        <div className="action-buttons">
          <Link
            href="/hospitalizacion/admision"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            ➕ Crear Nuevo Ingreso
          </Link>
          <Link
            href="/hospitalizacion/episodios"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📋 Ver Todos los Episodios
          </Link>
          <Link
            href="/pacientes"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            👥 Gestionar Pacientes
          </Link>
        </div>
      </div>

      {/* Lista de Episodios Recientes - Mismo estilo que gestión de pacientes */}
      <div className="content-card">
        <div className="flex justify-between items-center mb-6">
          <h2>Episodios Recientes</h2>
          <span className="text-sm text-gray-500">
            {episodiosFiltrados.length} de {episodios.length} episodios
          </span>
        </div>

        {episodiosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏥</div>
            <h3>No se encontraron episodios</h3>
            <p>
              {filtroPaciente || filtroMedico || filtroEstado !== 'todos' 
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'No hay episodios de hospitalización recientes'
              }
            </p>
            <Link
              href="/hospitalizacion/admision"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-4 inline-block"
            >
              ➕ Crear Nuevo Ingreso
            </Link>
          </div>
        ) : (
          <div className="results-container">
            {episodiosFiltrados.map((episodio) => (
              <div key={episodio.id} className="patient-result-card">
                <div className="patient-info">
                  <h4>Paciente: {episodio.paciente_id}</h4>
                  <div className="patient-details">
                    <span>👨‍⚕️ {episodio.medico_tratante}</span>
                    <span>🏥 {episodio.departamento}</span>
                    <span>📅 {formatFecha(episodio.fecha_ingreso)}</span>
                    {episodio.habitacion && (
                      <span>🚪 Hab. {episodio.habitacion}-{episodio.cama}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {episodio.diagnostico_inicial}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    episodio.fecha_alta 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {episodio.fecha_alta ? 'Completado' : 'Activo'}
                  </span>
                  
                  <Link
                    href={`/hospitalizacion/episodios/${episodio.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Ver Detalles
                  </Link>
                  
                  {!episodio.fecha_alta && (
                    <Link
                      href={`/hospitalizacion/alta/${episodio.id}`}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm font-medium"
                    >
                      Dar Alta
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer con enlace para ver todos */}
        {episodiosFiltrados.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link
              href="/hospitalizacion/episodios"
              className="text-blue-600 hover:text-blue-800 font-medium text-lg"
            >
              Ver todos los episodios →
            </Link>
          </div>
        )}
      </div>

      {/* Módulos Adicionales - Como en gestión de pacientes */}
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
  );
}