// src/app/components/consultas-externas/AgendaComponent.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { db } from '../../utils/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy,
  updateDoc,
  doc 
} from 'firebase/firestore';
import { 
  AgendaConsultaFirestoreData,
  EspecialidadFirestoreData,
  FacultativoFirestoreData,
  createInitialAgendaData,
  mapDocumentToEspecialidadData,
  mapDocumentToFacultativoData,
  mapDocumentToAgendaConsultaData
} from '../../utils/firestoreUtils';

interface AgendaComponentProps {
  patientId?: string;
  consultaId?: string;
  onCitaSeleccionada?: (citaId: string) => void;
}

interface EspecialidadConId extends EspecialidadFirestoreData {
  id: string;
}

interface FacultativoConId extends FacultativoFirestoreData {
  id: string;
}

interface CitaConId extends AgendaConsultaFirestoreData {
  id: string;
}

type VistaAgenda = 'semana' | 'mes' | 'dia';

export default function AgendaComponent({ patientId, consultaId, onCitaSeleccionada }: AgendaComponentProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState<EspecialidadConId[]>([]);
  const [facultativos, setFacultativos] = useState<FacultativoConId[]>([]);
  const [citas, setCitas] = useState<CitaConId[]>([]);
  const [vista, setVista] = useState<VistaAgenda>('semana');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [filtros, setFiltros] = useState({
    especialidad: '',
    facultativo: '',
    estado: 'disponible'
  });

  // Estados para nueva cita
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaCita, setNuevaCita] = useState({
    facultativo: '',
    especialidad: '',
    fecha: new Date(),
    horaInicio: '09:00',
    horaFin: '09:30',
    consulta: ''
  });

  useEffect(() => {
    loadDatosMaestros();
    loadCitas();
  }, [filtros, fechaSeleccionada]);

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

  const loadCitas = async () => {
    try {
      setLoading(true);
      const citasRef = collection(db, "agenda_consultas");
      
      // Construir query basada en filtros
      let q = query(citasRef, orderBy('Fecha', 'asc'));
      
      if (filtros.especialidad) {
        q = query(q, where('Especialidad', '==', filtros.especialidad));
      }
      
      if (filtros.facultativo) {
        q = query(q, where('Facultativo', '==', filtros.facultativo));
      }
      
      if (filtros.estado) {
        q = query(q, where('Estado', '==', filtros.estado));
      }

      const snapshot = await getDocs(q);
      const citasData = snapshot.docs.map(doc => ({
        ...mapDocumentToAgendaConsultaData(doc),
        id: doc.id
      }));
      
      setCitas(citasData);
    } catch (error) {
      console.error("Error cargando citas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleNuevaCitaChange = (campo: string, valor: any) => {
    setNuevaCita(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleCrearCita = async () => {
    if (!user) {
      alert("Debe iniciar sesión para crear citas");
      return;
    }

    // Validaciones
    if (!nuevaCita.facultativo || !nuevaCita.especialidad) {
      alert("Seleccione facultativo y especialidad");
      return;
    }

    setLoading(true);
    try {
      const [horasInicio, minutosInicio] = nuevaCita.horaInicio.split(':').map(Number);
      const [horasFin, minutosFin] = nuevaCita.horaFin.split(':').map(Number);

      const fechaInicio = new Date(nuevaCita.fecha);
      fechaInicio.setHours(horasInicio, minutosInicio, 0, 0);

      const fechaFin = new Date(nuevaCita.fecha);
      fechaFin.setHours(horasFin, minutosFin, 0, 0);

      const citaData = createInitialAgendaData(
        nuevaCita.facultativo,
        nuevaCita.especialidad,
        Timestamp.fromDate(fechaInicio),
        Timestamp.fromDate(fechaInicio),
        Timestamp.fromDate(fechaFin),
        nuevaCita.consulta || 'Consulta programada',
        user.uid
      );

      const agendaRef = collection(db, "agenda_consultas");
      await addDoc(agendaRef, citaData);

      alert("Cita creada correctamente");
      setMostrarModal(false);
      setNuevaCita({
        facultativo: '',
        especialidad: '',
        fecha: new Date(),
        horaInicio: '09:00',
        horaFin: '09:30',
        consulta: ''
      });
      loadCitas();
    } catch (error) {
      console.error("Error creando cita:", error);
      alert("Error al crear la cita");
    } finally {
      setLoading(false);
    }
  };

  const handleReservarCita = async (citaId: string) => {
    if (!user || !patientId) {
      alert("Seleccione un paciente primero");
      return;
    }

    setLoading(true);
    try {
      const citaRef = doc(db, "agenda_consultas", citaId);
      await updateDoc(citaRef, {
        Estado: 'reservada',
        Paciente: patientId,
        Consulta_externa: consultaId,
        actualizadoEn: Timestamp.now(),
        actualizadoPor: user.uid
      });

      alert("Cita reservada correctamente");
      if (onCitaSeleccionada) {
        onCitaSeleccionada(citaId);
      }
      loadCitas();
    } catch (error) {
      console.error("Error reservando cita:", error);
      alert("Error al reservar la cita");
    } finally {
      setLoading(false);
    }
  };

  // Funciones para navegación del calendario
  const avanzarFecha = () => {
    const nuevaFecha = new Date(fechaSeleccionada);
    if (vista === 'semana') nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    else if (vista === 'mes') nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    else nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    setFechaSeleccionada(nuevaFecha);
  };

  const retrocederFecha = () => {
    const nuevaFecha = new Date(fechaSeleccionada);
    if (vista === 'semana') nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    else if (vista === 'mes') nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
    else nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    setFechaSeleccionada(nuevaFecha);
  };

  const hoy = () => {
    setFechaSeleccionada(new Date());
  };

  // Obtener citas para la fecha seleccionada
  const citasFiltradas = citas.filter(cita => {
    const citaFecha = cita.Fecha.toDate();
    const seleccionada = fechaSeleccionada;
    
    if (vista === 'dia') {
      return citaFecha.toDateString() === seleccionada.toDateString();
    } else if (vista === 'semana') {
      const inicioSemana = new Date(seleccionada);
      inicioSemana.setDate(seleccionada.getDate() - seleccionada.getDay());
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      
      return citaFecha >= inicioSemana && citaFecha <= finSemana;
    }
    // vista mes
    return citaFecha.getMonth() === seleccionada.getMonth() && 
           citaFecha.getFullYear() === seleccionada.getFullYear();
  });

  return (
    <div className="agenda-component">
      {/* Header de la Agenda */}
      <div className="agenda-header">
        <div className="header-controls">
          <button onClick={retrocederFecha} className="btn btn-secondary">←</button>
          <button onClick={hoy} className="btn btn-secondary">Hoy</button>
          <button onClick={avanzarFecha} className="btn btn-secondary">→</button>
          
          <h3>
            {fechaSeleccionada.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>

        <div className="view-controls">
          <button 
            className={`view-btn ${vista === 'dia' ? 'active' : ''}`}
            onClick={() => setVista('dia')}
          >
            Día
          </button>
          <button 
            className={`view-btn ${vista === 'semana' ? 'active' : ''}`}
            onClick={() => setVista('semana')}
          >
            Semana
          </button>
          <button 
            className={`view-btn ${vista === 'mes' ? 'active' : ''}`}
            onClick={() => setVista('mes')}
          >
            Mes
          </button>
        </div>

        <button 
          onClick={() => setMostrarModal(true)}
          className="btn btn-primary"
        >
          + Nueva Cita
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Especialidad:</label>
            <select 
              value={filtros.especialidad}
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
            <label>Facultativo:</label>
            <select 
              value={filtros.facultativo}
              onChange={(e) => handleFiltroChange('facultativo', e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos los facultativos</option>
              {facultativos.map(fac => (
                <option key={fac.id} value={fac.id}>
                  Dr. {fac.Nombre} {fac.Apellido1}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Estado:</label>
            <select 
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="filtro-select"
            >
              <option value="disponible">Disponible</option>
              <option value="reservada">Reservada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
              <option value="">Todos los estados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vista de Citas */}
      <div className="citas-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando citas...</p>
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h4>No hay citas programadas</h4>
            <p>No se encontraron citas con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="citas-grid">
            {citasFiltradas.map(cita => {
              const facultativo = facultativos.find(f => f.id === cita.Facultativo);
              return (
                <div key={cita.id} className={`cita-card ${cita.Estado}`}>
                  <div className="cita-header">
                    <span className="cita-hora">
                      {cita.Hora_inicio.toDate().toLocaleTimeString('es-ES', { 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                    <span className={`cita-estado ${cita.Estado}`}>
                      {cita.Estado}
                    </span>
                  </div>
                  
                  <div className="cita-content">
                    <h5>{cita.Consulta}</h5>
                    <p className="cita-especialidad">{cita.Especialidad}</p>
                    {facultativo && (
                      <p className="cita-medico">
                        Dr. {facultativo.Nombre} {facultativo.Apellido1}
                      </p>
                    )}
                    {cita.Paciente && (
                      <p className="cita-paciente">📋 Paciente asignado</p>
                    )}
                  </div>

                  <div className="cita-actions">
                    {cita.Estado === 'disponible' && patientId && (
                      <button 
                        onClick={() => handleReservarCita(cita.id)}
                        className="btn btn-success btn-sm"
                      >
                        Reservar
                      </button>
                    )}
                    {cita.Estado === 'reservada' && (
                      <span className="reservada-badge">✅ Reservada</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para nueva cita */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Nueva Cita en Agenda</h4>
              <button 
                onClick={() => setMostrarModal(false)}
                className="btn-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Facultativo:</label>
                  <select 
                    value={nuevaCita.facultativo}
                    onChange={(e) => handleNuevaCitaChange('facultativo', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Seleccione facultativo</option>
                    {facultativos.map(fac => (
                      <option key={fac.id} value={fac.id}>
                        Dr. {fac.Nombre} {fac.Apellido1} - {fac.Especialidad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Especialidad:</label>
                  <select 
                    value={nuevaCita.especialidad}
                    onChange={(e) => handleNuevaCitaChange('especialidad', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Seleccione especialidad</option>
                    {especialidades.map(esp => (
                      <option key={esp.id} value={esp.Nombre}>{esp.Nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha:</label>
                  <input 
                    type="date"
                    value={nuevaCita.fecha.toISOString().split('T')[0]}
                    onChange={(e) => handleNuevaCitaChange('fecha', new Date(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Hora Inicio:</label>
                  <input 
                    type="time"
                    value={nuevaCita.horaInicio}
                    onChange={(e) => handleNuevaCitaChange('horaInicio', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Hora Fin:</label>
                  <input 
                    type="time"
                    value={nuevaCita.horaFin}
                    onChange={(e) => handleNuevaCitaChange('horaFin', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Consulta/Motivo:</label>
                  <input 
                    type="text"
                    value={nuevaCita.consulta}
                    onChange={(e) => handleNuevaCitaChange('consulta', e.target.value)}
                    placeholder="Ej: Consulta de revisión, Primera visita..."
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleCrearCita}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Creando...' : 'Crear Cita'}
              </button>
              <button 
                onClick={() => setMostrarModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .agenda-component {
          padding: 1rem 0;
        }

        .agenda-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-controls h3 {
          margin: 0 1rem;
          color: #374151;
          font-size: 1.25rem;
        }

        .view-controls {
          display: flex;
          background: #f3f4f6;
          border-radius: 0.375rem;
          padding: 0.25rem;
        }

        .view-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .view-btn.active {
          background: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .filtros-section {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .filtros-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
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

        .filtro-select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .citas-container {
          min-height: 400px;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .citas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .cita-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .cita-card.disponible {
          border-left: 4px solid #10b981;
        }

        .cita-card.reservada {
          border-left: 4px solid #3b82f6;
        }

        .cita-card.completada {
          border-left: 4px solid #6b7280;
        }

        .cita-card.cancelada {
          border-left: 4px solid #ef4444;
        }

        .cita-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .cita-hora {
          font-weight: 600;
          color: #374151;
        }

        .cita-estado {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .cita-estado.disponible {
          background: #d1fae5;
          color: #065f46;
        }

        .cita-estado.reservada {
          background: #dbeafe;
          color: #1e40af;
        }

        .cita-content h5 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1rem;
        }

        .cita-especialidad, .cita-medico, .cita-paciente {
          margin: 0.25rem 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .cita-actions {
          margin-top: 1rem;
          display: flex;
          justify-content: flex-end;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
        }

        .reservada-badge {
          font-size: 0.75rem;
          color: #059669;
          font-weight: 500;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 0.5rem;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h4 {
          margin: 0;
          color: #374151;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-select, .form-input {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .agenda-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-controls {
            justify-content: center;
          }

          .filtros-grid {
            grid-template-columns: 1fr;
          }

          .citas-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}