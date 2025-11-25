// src/app/hospitalizacion/episodios/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HospitalizacionService } from '../../../utils/hospitalizacionService';
import { EpisodioHospitalizacion, NotaEvolucion } from '../../../types/hospitalizacion';

const hospitalizacionService = new HospitalizacionService();

export default function DetallesEpisodioPage() {
  const params = useParams();
  const router = useRouter();
  const episodioId = params.id as string;

  const [episodio, setEpisodio] = useState<EpisodioHospitalizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarFormNota, setMostrarFormNota] = useState(false);
  const [nuevaNota, setNuevaNota] = useState({
    medico: '',
    subjetivo: '',
    objetivo: '',
    evaluacion: '',
    plan: ''
  });

  useEffect(() => {
    cargarEpisodio();
  }, [episodioId]);

  const cargarEpisodio = async () => {
    try {
      setLoading(true);
      const episodioData = await hospitalizacionService.getEpisodioById(episodioId);
      setEpisodio(episodioData);
    } catch (error) {
      console.error('Error cargando episodio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevaNota.medico || !nuevaNota.subjetivo || !nuevaNota.objetivo) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      await hospitalizacionService.agregarNotaEvolucion(episodioId, nuevaNota);
      
      // Recargar episodio para ver la nueva nota
      await cargarEpisodio();
      
      // Resetear formulario
      setNuevaNota({
        medico: '',
        subjetivo: '',
        objetivo: '',
        evaluacion: '',
        plan: ''
      });
      setMostrarFormNota(false);
      
      alert('✅ Nota de evolución agregada correctamente');
    } catch (error) {
      console.error('Error agregando nota:', error);
      alert('❌ Error al agregar la nota');
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando información del episodio...</p>
      </div>
    );
  }

  if (!episodio) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="content-card empty-state">
            <div className="empty-icon">❌</div>
            <h3>Episodio no encontrado</h3>
            <p>El episodio con ID "{episodioId}" no existe o ha sido eliminado.</p>
            <div className="action-buttons">
              <Link
                href="/hospitalizacion"
                className="btn btn-primary"
              >
                Volver a Hospitalización
              </Link>
              <Link
                href="/hospitalizacion/episodios"
                className="btn btn-secondary"
              >
                Ver todos los episodios
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header IDÉNTICO a gestión de pacientes */}
      <div className="page-header">
        <div className="header-content">
          <h1>Detalles del Episodio</h1>
          <p>Información completa del episodio de hospitalización</p>
          <div className="header-details">
            <span>ID: <strong>{episodio.id}</strong></span>
            <span>•</span>
            <span>Paciente: <strong>{episodio.paciente_id}</strong></span>
          </div>
        </div>
        <div className="header-actions">
          {!episodio.fecha_alta && (
            <Link
              href={`/hospitalizacion/alta/${episodio.id}`}
              className="btn btn-success"
            >
              🏥 Dar Alta
            </Link>
          )}
          <Link
            href="/hospitalizacion/episodios"
            className="btn btn-secondary"
          >
            ← Volver a Episodios
          </Link>
        </div>
      </div>

      <div className="page-content">
        <div className="content-grid">
          {/* Contenido Principal */}
          <div className="mi-pagina-content">
            {/* Tarjeta de Estado */}
            <div className={`content-card status-card ${
              episodio.fecha_alta ? 'status-completed' : 'status-active'
            }`}>
              <div className="status-header">
                <div className="status-icon">
                  {episodio.fecha_alta ? '✅' : '🏥'}
                </div>
                <div className="status-content">
                  <h2>
                    {episodio.fecha_alta ? 'Episodio Completado' : 'Episodio Activo'}
                  </h2>
                  <p className="status-description">
                    {episodio.fecha_alta 
                      ? `Alta médica el ${formatFecha(episodio.fecha_alta)}`
                      : 'Paciente actualmente hospitalizado'
                    }
                  </p>
                </div>
                <div className="status-date">
                  <p className="date-label">Fecha de ingreso</p>
                  <p className="date-value">{formatFecha(episodio.fecha_ingreso)}</p>
                </div>
              </div>
            </div>

            {/* Información del Paciente y Médico */}
            <div className="info-grid">
              <div className="content-card">
                <h3>👤 Información del Paciente</h3>
                <div className="info-list">
                  <div className="info-item">
                    <label>ID Paciente</label>
                    <div className="info-value">{episodio.paciente_id}</div>
                  </div>
                  <div className="info-item">
                    <label>Habitación</label>
                    <div className="info-value">
                      {episodio.habitacion || 'No asignada'} - Cama {episodio.cama || 'No asignada'}
                    </div>
                  </div>
                  {episodio.antecedentes_medicos && (
                    <div className="info-item">
                      <label>Antecedentes Médicos</label>
                      <div className="info-value">{episodio.antecedentes_medicos}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="content-card">
                <h3>👨‍⚕️ Información Médica</h3>
                <div className="info-list">
                  <div className="info-item">
                    <label>Médico Tratante</label>
                    <div className="info-value">{episodio.medico_tratante}</div>
                  </div>
                  <div className="info-item">
                    <label>Departamento</label>
                    <div className="info-value">{episodio.departamento}</div>
                  </div>
                  {episodio.alergias && episodio.alergias.length > 0 && (
                    <div className="info-item">
                      <label>Alergias</label>
                      <div className="tags-list">
                        {episodio.alergias.map((alergia, index) => (
                          <span key={index} className="tag tag-danger">
                            {alergia}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnóstico y Motivo */}
            <div className="content-card">
              <h3>📋 Diagnóstico</h3>
              <div className="diagnostico-grid">
                <div className="diagnostico-item">
                  <label>Motivo de Ingreso</label>
                  <div className="diagnostico-value">{episodio.motivo_ingreso}</div>
                </div>
                <div className="diagnostico-item">
                  <label>Diagnóstico Inicial</label>
                  <div className="diagnostico-value">{episodio.diagnostico_inicial}</div>
                </div>
                {episodio.diagnostico_final && (
                  <div className="diagnostico-item">
                    <label>Diagnóstico Final</label>
                    <div className="diagnostico-value highlight">{episodio.diagnostico_final}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Notas de Evolución */}
            <div className="content-card">
              <div className="section-header">
                <h3>📝 Notas de Evolución</h3>
                {!episodio.fecha_alta && (
                  <button
                    onClick={() => setMostrarFormNota(true)}
                    className="btn btn-primary"
                  >
                    + Agregar Nota
                  </button>
                )}
              </div>

              {/* Formulario para nueva nota */}
              {mostrarFormNota && (
                <div className="form-card">
                  <h4>Nueva Nota de Evolución</h4>
                  <form onSubmit={handleAgregarNota} className="form-container">
                    <div className="form-group">
                      <label htmlFor="medico">Médico *</label>
                      <input
                        type="text"
                        id="medico"
                        value={nuevaNota.medico}
                        onChange={(e) => setNuevaNota({...nuevaNota, medico: e.target.value})}
                        placeholder="Nombre del médico"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="subjetivo">Subjetivo *</label>
                      <textarea
                        id="subjetivo"
                        value={nuevaNota.subjetivo}
                        onChange={(e) => setNuevaNota({...nuevaNota, subjetivo: e.target.value})}
                        placeholder="Lo que el paciente refiere..."
                        rows={3}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="objetivo">Objetivo *</label>
                      <textarea
                        id="objetivo"
                        value={nuevaNota.objetivo}
                        onChange={(e) => setNuevaNota({...nuevaNota, objetivo: e.target.value})}
                        placeholder="Hallazgos objetivos, signos vitales..."
                        rows={3}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="evaluacion">Evaluación</label>
                      <textarea
                        id="evaluacion"
                        value={nuevaNota.evaluacion}
                        onChange={(e) => setNuevaNota({...nuevaNota, evaluacion: e.target.value})}
                        placeholder="Interpretación de los hallazgos..."
                        rows={2}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="plan">Plan</label>
                      <textarea
                        id="plan"
                        value={nuevaNota.plan}
                        onChange={(e) => setNuevaNota({...nuevaNota, plan: e.target.value})}
                        placeholder="Plan de tratamiento y seguimiento..."
                        rows={2}
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn-success"
                      >
                        💾 Guardar Nota
                      </button>
                      <button
                        type="button"
                        onClick={() => setMostrarFormNota(false)}
                        className="btn btn-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de notas */}
              <div className="notas-list">
                {(!episodio.notas_evolucion || episodio.notas_evolucion.length === 0) ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h4>No hay notas de evolución</h4>
                    <p>
                      {!episodio.fecha_alta 
                        ? 'Agrega la primera nota de evolución del paciente'
                        : 'No se registraron notas de evolución durante este episodio'
                      }
                    </p>
                  </div>
                ) : (
                  [...episodio.notas_evolucion].reverse().map((nota, index) => (
                    <div key={index} className="nota-card">
                      <div className="nota-header">
                        <div className="nota-info">
                          <div className="nota-medico">{nota.medico}</div>
                          <div className="nota-fecha">{formatFecha(nota.fecha)}</div>
                        </div>
                      </div>
                      <div className="nota-content">
                        <div className="nota-section">
                          <div className="nota-label">Subjetivo</div>
                          <div className="nota-text">{nota.subjetivo}</div>
                        </div>
                        <div className="nota-section">
                          <div className="nota-label">Objetivo</div>
                          <div className="nota-text">{nota.objetivo}</div>
                        </div>
                        {nota.evaluacion && (
                          <div className="nota-section">
                            <div className="nota-label">Evaluación</div>
                            <div className="nota-text">{nota.evaluacion}</div>
                          </div>
                        )}
                        {nota.plan && (
                          <div className="nota-section">
                            <div className="nota-label">Plan</div>
                            <div className="nota-text">{nota.plan}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Información Adicional */}
          <div className="sidebar-content">
            {/* Resumen de Datos */}
            <div className="content-card">
              <h3>📊 Resumen del Episodio</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Notas de evolución</span>
                  <span className="stat-value">{episodio.notas_evolucion?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Procedimientos</span>
                  <span className="stat-value">{episodio.procedimientos?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Tratamientos</span>
                  <span className="stat-value">{episodio.tratamientos?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Estudios de imagen</span>
                  <span className="stat-value">{episodio.estudios_imagen?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Medicamentos Actuales */}
            <div className="content-card">
              <h3>💊 Medicamentos Actuales</h3>
              <div className="medicamentos-list">
                {(!episodio.medicamentos_actuales || episodio.medicamentos_actuales.length === 0) ? (
                  <p className="no-data">No hay medicamentos registrados</p>
                ) : (
                  episodio.medicamentos_actuales.map((medicamento, index) => (
                    <div key={index} className="medicamento-item">
                      <span className="medicamento-dot">•</span>
                      <span className="medicamento-text">{medicamento}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="content-card">
              <h3>🚀 Acciones</h3>
              <div className="quick-actions">
                {!episodio.fecha_alta && (
                  <Link
                    href={`/hospitalizacion/alta/${episodio.id}`}
                    className="btn btn-success btn-block"
                  >
                    🏥 Registrar Alta
                  </Link>
                )}
                <button
                  onClick={() => hospitalizacionService.descargarInformeAlta(episodio.id)}
                  className="btn btn-primary btn-block"
                >
                  📄 Generar Informe PDF
                </button>
                <Link
                  href="/hospitalizacion/episodios"
                  className="btn btn-secondary btn-block"
                >
                  📋 Volver a Episodios
                </Link>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="content-card">
              <h3>📞 Información de Contacto</h3>
              <div className="contact-list">
                <div className="contact-item">
                  <span className="contact-label">Médico Tratante</span>
                  <span className="contact-value">{episodio.medico_tratante}</span>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Departamento</span>
                  <span className="contact-value">{episodio.departamento}</span>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Habitación</span>
                  <span className="contact-value">
                    {episodio.habitacion || 'N/A'} - {episodio.cama || 'N/A'}
                  </span>
                </div>
              </div>
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

        .header-details {
          display: flex;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .header-details strong {
          color: #374151;
        }

        .header-actions {
          flex-shrink: 0;
          display: flex;
          gap: 0.75rem;
        }

        .page-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        .content-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .content-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
        }

        /* Tarjeta de Estado */
        .status-card {
          border-left: 4px solid;
        }

        .status-active {
          border-left-color: #10b981;
          background-color: #f0fdf4;
        }

        .status-completed {
          border-left-color: #8b5cf6;
          background-color: #faf5ff;
        }

        .status-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .status-icon {
          font-size: 2rem;
        }

        .status-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .status-description {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .status-date {
          text-align: right;
        }

        .date-label {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .date-value {
          font-weight: 600;
          color: #1f2937;
        }

        /* Grid de información */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-item label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .info-value {
          color: #6b7280;
          font-size: 0.875rem;
        }

        /* Tags */
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .tag-danger {
          background-color: #fef2f2;
          color: #dc2626;
        }

        /* Diagnóstico */
        .diagnostico-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .diagnostico-item {
          display: flex;
          flex-direction: column;
        }

        .diagnostico-item label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .diagnostico-value {
          color: #6b7280;
        }

        .diagnostico-value.highlight {
          color: #1f2937;
          font-weight: 600;
        }

        /* Secciones */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        /* Formulario */
        .form-card {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-card h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 1rem;
        }

        .form-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
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
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus, 
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        /* Notas de evolución */
        .notas-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .nota-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          background-color: #f9fafb;
          transition: all 0.2s;
        }

        .nota-card:hover {
          background-color: white;
          border-color: #d1d5db;
        }

        .nota-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .nota-info {
          display: flex;
          flex-direction: column;
        }

        .nota-medico {
          font-weight: 600;
          color: #1f2937;
          font-size: 1rem;
        }

        .nota-fecha {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .nota-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .nota-section {
          display: flex;
          flex-direction: column;
        }

        .nota-label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .nota-text {
          color: #6b7280;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        /* Sidebar Styles */
        .stats-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .stat-value {
          font-weight: 600;
          color: #1f2937;
          font-size: 1rem;
        }

        .medicamentos-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .medicamento-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .medicamento-dot {
          color: #3b82f6;
          font-size: 1.25rem;
          line-height: 1;
          margin-top: 0.125rem;
        }

        .medicamento-text {
          color: #374151;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .no-data {
          color: #9ca3af;
          font-size: 0.875rem;
          text-align: center;
          padding: 1rem;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .contact-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .contact-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .contact-label {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .contact-value {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
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

        .btn-block {
          width: 100%;
          margin-bottom: 0.5rem;
        }

        /* Estados */
        .empty-state {
          text-align: center;
          padding: 2rem 1rem;
        }

        .empty-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .empty-state h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #6b7280;
          font-size: 0.875rem;
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

        .action-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          
          .header-actions {
            width: 100%;
            justify-content: flex-start;
          }
          
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .status-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .status-date {
            text-align: left;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}