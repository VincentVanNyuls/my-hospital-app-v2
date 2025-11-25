// src/app/components/consultas-externas/InformesComponent.tsx
"use client";

import { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy 
} from 'firebase/firestore';
import { 
  ConsultaExternaFirestoreData,
  EspecialidadFirestoreData,
  FacultativoFirestoreData,
  AgendaConsultaFirestoreData,
  generarEstadisticasConsultasExternas,
  filtrarConsultasExternas,
  FiltrosConsultaExterna,
  mapDocumentToConsultaExternaData,
  mapDocumentToEspecialidadData,
  mapDocumentToFacultativoData,
  mapDocumentToAgendaConsultaData
} from '../../utils/firestoreUtils';

interface InformesComponentProps {
  pacienteId?: string;
}

interface EspecialidadConId extends EspecialidadFirestoreData {
  id: string;
}

interface FacultativoConId extends FacultativoFirestoreData {
  id: string;
}

interface ConsultaConId extends ConsultaExternaFirestoreData {
  id: string;
}

interface CitaConId extends AgendaConsultaFirestoreData {
  id: string;
}

type TipoInforme = 'general' | 'especialidades' | 'medicos' | 'temporal' | 'pacientes';

export default function InformesComponent({ pacienteId }: InformesComponentProps) {
  const [loading, setLoading] = useState(false);
  const [consultas, setConsultas] = useState<ConsultaConId[]>([]);
  const [citas, setCitas] = useState<CitaConId[]>([]);
  const [especialidades, setEspecialidades] = useState<EspecialidadConId[]>([]);
  const [facultativos, setFacultativos] = useState<FacultativoConId[]>([]);
  const [tipoInforme, setTipoInforme] = useState<TipoInforme>('general');
  const [filtros, setFiltros] = useState<FiltrosConsultaExterna>({
    fechaInicio: undefined,
    fechaFin: undefined,
    especialidad: '',
    estado: undefined
  });

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState<any>(null);

  useEffect(() => {
    loadDatosMaestros();
  }, []);

  useEffect(() => {
    if (consultas.length > 0 || citas.length > 0) {
      generarEstadisticas();
    }
  }, [consultas, citas, filtros]);

  const loadDatosMaestros = async () => {
    try {
      // Cargar especialidades
      const especialidadesRef = collection(db, "especialidades");
      const qEspecialidades = query(especialidadesRef, where("Activo", "==", true));
      const snapshotEspecialidades = await getDocs(qEspecialidades);
      const especialidadesData = snapshotEspecialidades.docs.map(doc => ({
        ...mapDocumentToEspecialidadData(doc),
        id: doc.id
      }));
      setEspecialidades(especialidadesData);

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

  const cargarDatosInforme = async () => {
    setLoading(true);
    try {
      // Cargar consultas
      const consultasRef = collection(db, "consultas_externas");
      let qConsultas = query(consultasRef, orderBy('Fecha', 'desc'));

      if (filtros.fechaInicio && filtros.fechaFin) {
        qConsultas = query(
          qConsultas, 
          where('Fecha', '>=', filtros.fechaInicio),
          where('Fecha', '<=', filtros.fechaFin)
        );
      }

      if (filtros.especialidad) {
        qConsultas = query(qConsultas, where('Especialidad', '==', filtros.especialidad));
      }

      if (filtros.estado) {
        qConsultas = query(qConsultas, where('Estado', '==', filtros.estado));
      }

      if (pacienteId) {
        qConsultas = query(qConsultas, where('Paciente', '==', pacienteId));
      }

      const snapshotConsultas = await getDocs(qConsultas);
      const consultasData = snapshotConsultas.docs.map(doc => ({
        ...mapDocumentToConsultaExternaData(doc),
        id: doc.id
      }));
      setConsultas(consultasData);

      // Cargar citas de agenda
      const agendaRef = collection(db, "agenda_consultas");
      const qAgenda = query(agendaRef, orderBy('Fecha', 'desc'));
      const snapshotAgenda = await getDocs(qAgenda);
      const agendaData = snapshotAgenda.docs.map(doc => ({
        ...mapDocumentToAgendaConsultaData(doc),
        id: doc.id
      }));
      setCitas(agendaData);

    } catch (error) {
      console.error("Error cargando datos para informe:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarEstadisticas = () => {
    const consultasFiltradas = filtrarConsultasExternas(consultas, filtros);
    const stats = generarEstadisticasConsultasExternas(consultasFiltradas, citas);
    setEstadisticas(stats);
  };

  const handleFiltroChange = (campo: string, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor === '' ? undefined : valor
    }));
  };

  const handleGenerarInforme = () => {
    cargarDatosInforme();
  };

  const exportarAExcel = () => {
    if (consultas.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    // Simulación de exportación - en una implementación real usarías una librería como xlsx
    const datosExportar = consultas.map(consulta => ({
      'ID Consulta': consulta.Id_CEX,
      'Fecha': consulta.Fecha.toDate().toLocaleDateString('es-ES'),
      'Especialidad': consulta.Especialidad,
      'Prioridad': consulta.Prioridad,
      'Tipo Visita': consulta.Tipo_visita,
      'Estado': consulta.Estado,
      'Médico': consulta.Médico_responsable || 'No asignado'
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + [
        Object.keys(datosExportar[0]).join(','),
        ...datosExportar.map(row => Object.values(row).join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `informe_consultas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para calcular distribución por especialidad
  const getDistribucionEspecialidades = () => {
    const distribucion: { [key: string]: number } = {};
    consultas.forEach(consulta => {
      distribucion[consulta.Especialidad] = (distribucion[consulta.Especialidad] || 0) + 1;
    });
    return Object.entries(distribucion).map(([nombre, count]) => ({ nombre, count }));
  };

  // Función para calcular distribución por estado
  const getDistribucionEstados = () => {
    const distribucion: { [key: string]: number } = {};
    consultas.forEach(consulta => {
      distribucion[consulta.Estado] = (distribucion[consulta.Estado] || 0) + 1;
    });
    return Object.entries(distribucion).map(([estado, count]) => ({ estado, count }));
  };

  // Función para calcular distribución por prioridad
  const getDistribucionPrioridades = () => {
    const distribucion: { [key: string]: number } = {};
    consultas.forEach(consulta => {
      distribucion[consulta.Prioridad] = (distribucion[consulta.Prioridad] || 0) + 1;
    });
    return Object.entries(distribucion).map(([prioridad, count]) => ({ prioridad, count }));
  };

  return (
    <div className="informes-component">
      {/* Header y Filtros */}
      <div className="informes-header">
        <h3>📊 Sistema de Informes - Consultas Externas</h3>
        <p>Genere reportes y estadísticas de las consultas médicas</p>
      </div>

      <div className="filtros-section">
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Tipo de Informe:</label>
            <select 
              value={tipoInforme}
              onChange={(e) => setTipoInforme(e.target.value as TipoInforme)}
              className="filtro-select"
            >
              <option value="general">Informe General</option>
              <option value="especialidades">Por Especialidad</option>
              <option value="medicos">Por Médico</option>
              <option value="temporal">Evolución Temporal</option>
              <option value="pacientes">Estadísticas de Pacientes</option>
            </select>
          </div>

          <div className="filtro-group">
            <label>Fecha Inicio:</label>
            <input 
              type="date"
              onChange={(e) => handleFiltroChange('fechaInicio', e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined)}
              className="filtro-input"
            />
          </div>

          <div className="filtro-group">
            <label>Fecha Fin:</label>
            <input 
              type="date"
              onChange={(e) => handleFiltroChange('fechaFin', e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined)}
              className="filtro-input"
            />
          </div>

          <div className="filtro-group">
            <label>Especialidad:</label>
            <select 
              value={filtros.especialidad || ''}
              onChange={(e) => handleFiltroChange('especialidad', e.target.value)}
              className="filtro-select"
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map(esp => (
                <option key={esp.id} value={esp.Nombre}>{esp.Nombre}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Estado:</label>
            <select 
              value={filtros.estado || ''}
              onChange={(e) => handleFiltroChange('estado', e.target.value || undefined)}
              className="filtro-select"
            >
              <option value="">Todos los estados</option>
              <option value="programada">Programada</option>
              <option value="en_curso">En Curso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="acciones-filtros">
          <button 
            onClick={handleGenerarInforme}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '🔄 Generando...' : '📈 Generar Informe'}
          </button>

          {consultas.length > 0 && (
            <button 
              onClick={exportarAExcel}
              className="btn btn-success"
            >
              📥 Exportar a Excel
            </button>
          )}

          <button 
            onClick={() => setFiltros({ 
              fechaInicio: undefined, 
              fechaFin: undefined, 
              especialidad: '', 
              estado: undefined 
            })}
            className="btn btn-secondary"
          >
            🗑️ Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Resumen Estadístico */}
      {estadisticas && (
        <div className="resumen-estadistico">
          <h4>📋 Resumen Estadístico</h4>
          <div className="estadisticas-grid">
            <div className="estadistica-card total">
              <div className="estadistica-icon">🩺</div>
              <div className="estadistica-content">
                <h5>Total Consultas</h5>
                <p className="estadistica-valor">{estadisticas.total}</p>
              </div>
            </div>

            <div className="estadistica-card programadas">
              <div className="estadistica-icon">📅</div>
              <div className="estadistica-content">
                <h5>Programadas</h5>
                <p className="estadistica-valor">{estadisticas.programadas}</p>
              </div>
            </div>

            <div className="estadistica-card completadas">
              <div className="estadistica-icon">✅</div>
              <div className="estadistica-content">
                <h5>Completadas</h5>
                <p className="estadistica-valor">{estadisticas.completadas}</p>
              </div>
            </div>

            <div className="estadistica-card primera-visita">
              <div className="estadistica-icon">👥</div>
              <div className="estadistica-content">
                <h5>Primera Visita</h5>
                <p className="estadistica-valor">{estadisticas.primera_visita}</p>
              </div>
            </div>

            <div className="estadistica-card visita-sucesiva">
              <div className="estadistica-icon">🔄</div>
              <div className="estadistica-content">
                <h5>Visita Sucesiva</h5>
                <p className="estadistica-valor">{estadisticas.visita_sucesiva}</p>
              </div>
            </div>

            <div className="estadistica-card duracion-promedio">
              <div className="estadistica-icon">⏱️</div>
              <div className="estadistica-content">
                <h5>Duración Promedio</h5>
                <p className="estadistica-valor">{estadisticas.promedioDuracion} min</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos y Distribuciones */}
      {estadisticas && consultas.length > 0 && (
        <div className="graficos-section">
          <div className="graficos-grid">
            {/* Distribución por Especialidad */}
            <div className="grafico-card">
              <h5>📊 Distribución por Especialidad</h5>
              <div className="grafico-barras">
                {getDistribucionEspecialidades().map((item, index) => (
                  <div key={item.nombre} className="barra-item">
                    <div className="barra-label">{item.nombre}</div>
                    <div className="barra-container">
                      <div 
                        className="barra-fill"
                        style={{ 
                          width: `${(item.count / estadisticas.total) * 100}%`,
                          backgroundColor: `hsl(${index * 40}, 70%, 50%)`
                        }}
                      ></div>
                      <span className="barra-count">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución por Estado */}
            <div className="grafico-card">
              <h5>📈 Distribución por Estado</h5>
              <div className="grafico-torta">
                {getDistribucionEstados().map((item, index) => (
                  <div key={item.estado} className="torta-item">
                    <div 
                      className="torta-color"
                      style={{ 
                        backgroundColor: `hsl(${index * 90}, 70%, 50%)` 
                      }}
                    ></div>
                    <span className="torta-label">{item.estado}</span>
                    <span className="torta-count">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución por Prioridad */}
            <div className="grafico-card">
              <h5>🎯 Distribución por Prioridad</h5>
              <div className="grafico-barras-horizontal">
                {getDistribucionPrioridades().map((item, index) => (
                  <div key={item.prioridad} className="barra-h-item">
                    <div className="barra-h-label">{item.prioridad}</div>
                    <div className="barra-h-container">
                      <div 
                        className="barra-h-fill"
                        style={{ 
                          width: `${(item.count / estadisticas.total) * 100}%`,
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                        }}
                      ></div>
                      <span className="barra-h-count">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Especialidad Más Común */}
            <div className="grafico-card">
              <h5>⭐ Especialidad Más Solicitada</h5>
              <div className="especialidad-destacada">
                <div className="destacada-icon">🏆</div>
                <div className="destacada-content">
                  <h6>{estadisticas.especialidadMasComun}</h6>
                  <p>Especialidad con más consultas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista Detallada de Consultas */}
      {consultas.length > 0 && (
        <div className="detalle-consultas">
          <h5>📋 Lista Detallada de Consultas ({consultas.length})</h5>
          <div className="consultas-table">
            <div className="table-header">
              <div>ID</div>
              <div>Fecha</div>
              <div>Especialidad</div>
              <div>Prioridad</div>
              <div>Tipo</div>
              <div>Estado</div>
            </div>
            {consultas.slice(0, 10).map(consulta => (
              <div key={consulta.id} className="table-row">
                <div>{consulta.Id_CEX}</div>
                <div>{consulta.Fecha.toDate().toLocaleDateString('es-ES')}</div>
                <div>{consulta.Especialidad}</div>
                <div>
                  <span className={`badge-prioridad ${consulta.Prioridad.toLowerCase()}`}>
                    {consulta.Prioridad}
                  </span>
                </div>
                <div>{consulta.Tipo_visita}</div>
                <div>
                  <span className={`badge-estado ${consulta.Estado}`}>
                    {consulta.Estado}
                  </span>
                </div>
              </div>
            ))}
            {consultas.length > 10 && (
              <div className="table-footer">
                Mostrando 10 de {consultas.length} consultas
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && consultas.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4>No hay datos para mostrar</h4>
          <p>Utilice los filtros y genere un informe para ver las estadísticas</p>
        </div>
      )}

      <style jsx>{`
        .informes-component {
          padding: 1rem 0;
        }

        .informes-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .informes-header h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .informes-header p {
          color: #6b7280;
        }

        .filtros-section {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .filtros-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .filtro-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filtro-group label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .filtro-select, .filtro-input {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .acciones-filtros {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .resumen-estadistico {
          margin-bottom: 2rem;
        }

        .resumen-estadistico h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
        }

        .estadisticas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .estadistica-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .estadistica-card.total {
          border-left: 4px solid #3b82f6;
        }

        .estadistica-card.programadas {
          border-left: 4px solid #f59e0b;
        }

        .estadistica-card.completadas {
          border-left: 4px solid #10b981;
        }

        .estadistica-card.primera-visita {
          border-left: 4px solid #8b5cf6;
        }

        .estadistica-card.visita-sucesiva {
          border-left: 4px solid #06b6d4;
        }

        .estadistica-card.duracion-promedio {
          border-left: 4px solid #ef4444;
        }

        .estadistica-icon {
          font-size: 2rem;
        }

        .estadistica-content h5 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .estadistica-valor {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
        }

        .graficos-section {
          margin-bottom: 2rem;
        }

        .graficos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .grafico-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .grafico-card h5 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }

        .grafico-barras {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .barra-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .barra-label {
          width: 120px;
          font-size: 0.875rem;
          color: #374151;
        }

        .barra-container {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .barra-fill {
          height: 20px;
          border-radius: 4px;
          transition: width 0.3s ease;
          min-width: 20px;
        }

        .barra-count {
          font-size: 0.75rem;
          color: #6b7280;
          min-width: 20px;
        }

        .grafico-torta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .torta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .torta-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .torta-label {
          font-size: 0.875rem;
          color: #374151;
          flex: 1;
        }

        .torta-count {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .grafico-barras-horizontal {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .barra-h-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .barra-h-label {
          width: 100px;
          font-size: 0.875rem;
          color: #374151;
        }

        .barra-h-container {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .barra-h-fill {
          height: 16px;
          border-radius: 8px;
          transition: width 0.3s ease;
          min-width: 20px;
        }

        .barra-h-count {
          font-size: 0.75rem;
          color: #6b7280;
          min-width: 20px;
        }

        .especialidad-destacada {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f0f9ff;
          border-radius: 0.5rem;
        }

        .destacada-icon {
          font-size: 2rem;
        }

        .destacada-content h6 {
          margin: 0 0 0.25rem 0;
          font-size: 1.125rem;
          color: #0369a1;
        }

        .destacada-content p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .detalle-consultas {
          margin-bottom: 2rem;
        }

        .detalle-consultas h5 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
        }

        .consultas-table {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
          background: #f8fafc;
          padding: 1rem;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-footer {
          padding: 1rem;
          text-align: center;
          background: #f8fafc;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .badge-prioridad, .badge-estado {
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .badge-prioridad.urgente {
          background: #fee2e2;
          color: #dc2626;
        }

        .badge-prioridad.preferente {
          background: #fef3c7;
          color: #d97706;
        }

        .badge-prioridad.ordinaria {
          background: #d1fae5;
          color: #059669;
        }

        .badge-estado.programada {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .badge-estado.en_curso {
          background: #fef3c7;
          color: #d97706;
        }

        .badge-estado.completada {
          background: #d1fae5;
          color: #047857;
        }

        .badge-estado.cancelada {
          background: #fecaca;
          color: #dc2626;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
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

        .btn-success {
          background-color: #10b981;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background-color: #059669;
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #4b5563;
        }

        @media (max-width: 768px) {
          .filtros-grid {
            grid-template-columns: 1fr;
          }

          .acciones-filtros {
            flex-direction: column;
          }

          .estadisticas-grid {
            grid-template-columns: 1fr;
          }

          .graficos-grid {
            grid-template-columns: 1fr;
          }

          .table-header, .table-row {
            grid-template-columns: 1fr 1fr;
            font-size: 0.75rem;
          }

          .table-header div:nth-child(n+3),
          .table-row div:nth-child(n+3) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}