// src/app/hospitalizacion/alta/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HospitalizacionService } from '../../../utils/hospitalizacionService';
import { EpisodioHospitalizacion } from '../../../types/hospitalizacion';

const hospitalizacionService = new HospitalizacionService();

export default function AltaMedicaPage() {
  const params = useParams();
  const router = useRouter();
  const episodioId = params.id as string;

  const [episodio, setEpisodio] = useState<EpisodioHospitalizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    diagnostico_final: '',
    resumen_alta: '',
    condicion_alta: 'Bueno',
    instrucciones_seguimiento: '',
    medicamentos_alta: ['']
  });

  useEffect(() => {
    cargarEpisodio();
  }, [episodioId]);

  const cargarEpisodio = async () => {
    try {
      setError(null);
      const episodioData = await hospitalizacionService.getEpisodioById(episodioId);
      
      if (!episodioData) {
        setError(`No se encontró el episodio con ID: ${episodioId}`);
        setLoading(false);
        return;
      }
      
      setEpisodio(episodioData);
      
      // Pre-llenar datos si ya existen
      setFormData({
        diagnostico_final: episodioData.diagnostico_final || '',
        resumen_alta: episodioData.resumen_alta || '',
        condicion_alta: episodioData.condicion_alta || 'Bueno',
        instrucciones_seguimiento: episodioData.instrucciones_seguimiento || '',
        medicamentos_alta: episodioData.medicamentos_alta && episodioData.medicamentos_alta.length > 0 
          ? episodioData.medicamentos_alta 
          : ['']
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando episodio:', error);
      setError('Error al cargar los datos del episodio');
      setLoading(false);
    }
  };

  const generarPDF = async () => {
    if (!episodio) return;
    
    setIsGeneratingPDF(true);
    try {
      const filename = `alta_${episodio.paciente_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      await hospitalizacionService.descargarInformeAlta(episodioId, filename);
      alert('✅ PDF generado y descargado correctamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('❌ Error al generar el PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const previsualizarPDF = async () => {
    if (!episodio) return;
    
    setIsGeneratingPDF(true);
    try {
      await hospitalizacionService.previsualizarInformeAlta(episodioId);
    } catch (error) {
      console.error('Error previsualizando PDF:', error);
      alert('❌ Error al previsualizar el PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.diagnostico_final.trim()) {
      setError('Por favor ingresa el diagnóstico final');
      return;
    }

    if (!formData.resumen_alta.trim()) {
      setError('Por favor ingresa el resumen del alta');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const exito = await hospitalizacionService.darAltaPaciente(episodioId, {
        diagnostico_final: formData.diagnostico_final,
        resumen_alta: formData.resumen_alta,
        condicion_alta: formData.condicion_alta,
        instrucciones_seguimiento: formData.instrucciones_seguimiento,
        medicamentos_alta: formData.medicamentos_alta.filter(med => med.trim() !== '')
      });

      if (exito) {
        alert('✅ Alta médica registrada correctamente');
        router.push('/hospitalizacion/episodios');
      } else {
        throw new Error('No se pudo registrar el alta');
      }
    } catch (error) {
      console.error('Error dando de alta:', error);
      setError('❌ Error al registrar el alta médica');
    } finally {
      setIsSubmitting(false);
    }
  };

  const agregarMedicamento = () => {
    setFormData({
      ...formData,
      medicamentos_alta: [...formData.medicamentos_alta, '']
    });
  };

  const actualizarMedicamento = (index: number, valor: string) => {
    const nuevosMedicamentos = [...formData.medicamentos_alta];
    nuevosMedicamentos[index] = valor;
    setFormData({ ...formData, medicamentos_alta: nuevosMedicamentos });
  };

  const eliminarMedicamento = (index: number) => {
    if (formData.medicamentos_alta.length > 1) {
      const nuevosMedicamentos = formData.medicamentos_alta.filter((_, i) => i !== index);
      setFormData({ ...formData, medicamentos_alta: nuevosMedicamentos });
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

  const calcularDiasEstancia = () => {
    if (!episodio) return 0;
    try {
      const fechaIngreso = new Date(episodio.fecha_ingreso);
      const fechaActual = new Date();
      const diferencia = fechaActual.getTime() - fechaIngreso.getTime();
      return Math.ceil(diferencia / (1000 * 3600 * 24));
    } catch (error) {
      return 0;
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando información del episodio...</p>
      </div>
    );
  }

  // Error al cargar
  if (error && !episodio) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="content-card empty-state">
            <div className="empty-icon">❌</div>
            <h3>Error al cargar el episodio</h3>
            <p>{error}</p>
            <div className="action-buttons">
              <button
                onClick={() => {
                  hospitalizacionService.debugEpisodios();
                  cargarEpisodio();
                }}
                className="btn btn-primary"
              >
                Reintentar
              </button>
              <Link
                href="/hospitalizacion/episodios"
                className="btn btn-secondary"
              >
                Volver a Episodios
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Episodio no encontrado
  if (!episodio) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="content-card empty-state">
            <div className="empty-icon">❌</div>
            <h3>Episodio no encontrado</h3>
            <p>El episodio con ID "{episodioId}" no existe.</p>
            <Link
              href="/hospitalizacion/episodios"
              className="btn btn-primary"
            >
              Volver a la lista de episodios
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Ya tiene alta médica
  if (episodio.fecha_alta) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1>Alta Médica</h1>
            <p>Episodio ya completado - Informe de alta</p>
          </div>
          <div className="header-actions">
            <Link
              href="/hospitalizacion/episodios"
              className="btn btn-secondary"
            >
              ← Volver a Episodios
            </Link>
          </div>
        </div>

        <div className="page-content">
          <div className="content-card empty-state">
            <div className="empty-icon">✅</div>
            <h3>Alta Médica Ya Registrada</h3>
            <p className="status-description">
              Este episodio ya fue dado de alta el {formatFecha(episodio.fecha_alta)}.
            </p>
            <p className="status-description">
              Diagnóstico final: {episodio.diagnostico_final}
            </p>
            
            <div className="action-buttons">
              <button
                onClick={generarPDF}
                disabled={isGeneratingPDF}
                className="btn btn-danger"
              >
                {isGeneratingPDF ? '📄 Generando...' : '📄 Descargar Informe PDF'}
              </button>
              <button
                onClick={previsualizarPDF}
                disabled={isGeneratingPDF}
                className="btn btn-primary"
              >
                {isGeneratingPDF ? '👁️ Generando...' : '👁️ Previsualizar PDF'}
              </button>
            </div>

            <div className="action-buttons">
              <Link
                href={`/hospitalizacion/episodios/${episodioId}`}
                className="btn btn-success"
              >
                Ver Detalles del Episodio
              </Link>
              <Link
                href="/hospitalizacion/episodios"
                className="btn btn-secondary"
              >
                Lista de Episodios
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
          <h1>Alta Médica</h1>
          <p>Registrar informe de alta para el paciente {episodio.paciente_id}</p>
          <div className="header-details">
            <span>ID Episodio: <strong>{episodio.id}</strong></span>
            <span>•</span>
            <span>Ingreso: <strong>{formatFecha(episodio.fecha_ingreso)}</strong></span>
          </div>
        </div>
        <div className="header-actions">
          <Link
            href={`/hospitalizacion/episodios/${episodioId}`}
            className="btn btn-secondary"
          >
            ← Volver al Episodio
          </Link>
        </div>
      </div>

      <div className="page-content">
        <div className="content-grid">
          {/* Formulario Principal */}
          <div className="mi-pagina-content">
            <div className="content-card">
              <h2>Registro de Alta Médica</h2>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-container">
                {/* Información del Episodio */}
                <div className="info-card">
                  <h3>Información del Episodio</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Paciente ID</label>
                      <div className="info-value">{episodio.paciente_id}</div>
                    </div>
                    <div className="info-item">
                      <label>Fecha Ingreso</label>
                      <div className="info-value">{formatFecha(episodio.fecha_ingreso)}</div>
                    </div>
                    <div className="info-item">
                      <label>Médico Tratante</label>
                      <div className="info-value">{episodio.medico_tratante}</div>
                    </div>
                    <div className="info-item">
                      <label>Departamento</label>
                      <div className="info-value">{episodio.departamento}</div>
                    </div>
                    <div className="info-item full-width">
                      <label>Diagnóstico Inicial</label>
                      <div className="info-value">{episodio.diagnostico_inicial}</div>
                    </div>
                    <div className="info-item">
                      <label>Días de Estancia</label>
                      <div className="info-value highlight">{calcularDiasEstancia()} días</div>
                    </div>
                  </div>
                </div>

                {/* Diagnóstico Final */}
                <div className="form-group">
                  <label htmlFor="diagnostico_final">Diagnóstico Final *</label>
                  <input
                    type="text"
                    id="diagnostico_final"
                    value={formData.diagnostico_final}
                    onChange={(e) => setFormData({...formData, diagnostico_final: e.target.value})}
                    placeholder="Ej: Infección bacteriana resuelta"
                    required
                  />
                  <div className="field-description">
                    Diagnóstico definitivo al momento del alta
                  </div>
                </div>

                {/* Condición al Alta */}
                <div className="form-group">
                  <label htmlFor="condicion_alta">Condición al Alta *</label>
                  <select
                    id="condicion_alta"
                    value={formData.condicion_alta}
                    onChange={(e) => setFormData({...formData, condicion_alta: e.target.value})}
                    required
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Grave">Grave</option>
                    <option value="Fallecido">Fallecido</option>
                  </select>
                </div>

                {/* Resumen del Alta */}
                <div className="form-group">
                  <label htmlFor="resumen_alta">Resumen de la Evolución y Alta *</label>
                  <textarea
                    id="resumen_alta"
                    value={formData.resumen_alta}
                    onChange={(e) => setFormData({...formData, resumen_alta: e.target.value})}
                    placeholder="Describa la evolución durante la hospitalización, tratamiento recibido y motivo del alta..."
                    rows={4}
                    required
                  />
                  <div className="field-description">
                    Resumen completo de la evolución hospitalaria
                  </div>
                </div>

                {/* Medicamentos al Alta */}
                <div className="form-group">
                  <label>Medicamentos al Alta</label>
                  <div className="medicamentos-list">
                    {formData.medicamentos_alta.map((medicamento, index) => (
                      <div key={index} className="medicamento-item">
                        <input
                          type="text"
                          value={medicamento}
                          onChange={(e) => actualizarMedicamento(index, e.target.value)}
                          placeholder="Ej: Amoxicilina 500mg cada 8h por 7 días"
                          className="medicamento-input"
                        />
                        {formData.medicamentos_alta.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarMedicamento(index)}
                            className="btn btn-danger btn-sm medicamento-remove"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={agregarMedicamento}
                      className="btn btn-secondary btn-sm"
                    >
                      + Agregar Medicamento
                    </button>
                  </div>
                  <div className="field-description">
                    Especificar medicamento, dosis, frecuencia y duración
                  </div>
                </div>

                {/* Instrucciones de Seguimiento */}
                <div className="form-group">
                  <label htmlFor="instrucciones_seguimiento">Instrucciones de Seguimiento</label>
                  <textarea
                    id="instrucciones_seguimiento"
                    value={formData.instrucciones_seguimiento}
                    onChange={(e) => setFormData({...formData, instrucciones_seguimiento: e.target.value})}
                    placeholder="Ej: Control en 7 días, reposo relativo, dieta blanda..."
                    rows={3}
                  />
                  <div className="field-description">
                    Recomendaciones y citas de seguimiento
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="form-actions">
                  <div className="action-buttons">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-success btn-large"
                    >
                      {isSubmitting ? (
                        <span className="button-loading">
                          <div className="loading-spinner-small"></div>
                          Registrando Alta...
                        </span>
                      ) : (
                        '✅ Registrar Alta Médica'
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={previsualizarPDF}
                      disabled={isGeneratingPDF}
                      className="btn btn-primary"
                    >
                      {isGeneratingPDF ? 'Generando...' : '👁️ Previsualizar'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={generarPDF}
                      disabled={isGeneratingPDF}
                      className="btn btn-danger"
                    >
                      {isGeneratingPDF ? 'Generando...' : '📄 Descargar PDF'}
                    </button>
                  </div>
                  
                  <Link
                    href={`/hospitalizacion/episodios/${episodioId}`}
                    className="btn btn-secondary btn-block"
                  >
                    Cancelar
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Información de Ayuda */}
          <div className="sidebar-content">
            {/* Recordatorio Importante */}
            <div className="content-card warning-card">
              <h3>⚠️ Importante</h3>
              <div className="warning-list">
                <div className="warning-item">
                  <span className="warning-dot"></span>
                  <span>Verificar todos los datos antes de registrar el alta</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot"></span>
                  <span>El alta médica no se puede deshacer</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot"></span>
                  <span>Se generará automáticamente el informe de alta</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot"></span>
                  <span>El episodio pasará a estado "Completado"</span>
                </div>
              </div>
            </div>

            {/* Generación de Documentos */}
            <div className="content-card success-card">
              <h3>📄 Documentos</h3>
              <div className="document-actions">
                <button
                  onClick={previsualizarPDF}
                  disabled={isGeneratingPDF}
                  className="btn btn-outline btn-block"
                >
                  <span className="button-icon">👁️</span>
                  Previsualizar Informe
                </button>
                <button
                  onClick={generarPDF}
                  disabled={isGeneratingPDF}
                  className="btn btn-outline btn-block"
                >
                  <span className="button-icon">📥</span>
                  Descargar PDF
                </button>
              </div>
              <div className="action-description">
                Genera el informe de alta en formato PDF
              </div>
            </div>

            {/* Resumen del Episodio */}
            <div className="content-card">
              <h3>📊 Resumen del Episodio</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Días de estancia</span>
                  <span className="stat-value">{calcularDiasEstancia()} días</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Notas de evolución</span>
                  <span className="stat-value">{episodio.notas_evolucion?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Procedimientos</span>
                  <span className="stat-value">{episodio.procedimientos?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Estado actual</span>
                  <span className="stat-value status-active">Activo</span>
                </div>
              </div>
            </div>

            {/* Plantilla de Ejemplo */}
            <div className="content-card info-card">
              <h3>💡 Ejemplo de Alta</h3>
              <div className="example-content">
                <div className="example-item">
                  <div className="example-label">Diagnóstico Final:</div>
                  <div className="example-text">Neumonía bacteriana resuelta</div>
                </div>
                <div className="example-item">
                  <div className="example-label">Resumen:</div>
                  <div className="example-text">Paciente evolucionó favorablemente con antibioticoterapia...</div>
                </div>
                <div className="example-item">
                  <div className="example-label">Medicamentos:</div>
                  <div className="example-text">Amoxicilina 500mg/8h × 7 días</div>
                </div>
                <div className="example-item">
                  <div className="example-label">Seguimiento:</div>
                  <div className="example-text">Control en 7 días, radiografía de control</div>
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

        /* Cards especiales */
        .warning-card {
          background-color: #fefce8;
          border: 1px solid #fef08a;
        }

        .warning-card h3 {
          color: #854d0e;
        }

        .success-card {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .success-card h3 {
          color: #166534;
        }

        .info-card {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .info-card h3 {
          color: #1e40af;
        }

        /* Formulario */
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
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
        .form-group select, 
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus, 
        .form-group select:focus, 
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .field-description {
          color: #6b7280;
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }

        /* Información del episodio */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
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

        .info-value.highlight {
          color: #dc2626;
          font-weight: 600;
        }

        /* Medicamentos */
        .medicamentos-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .medicamento-item {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .medicamento-input {
          flex: 1;
        }

        .medicamento-remove {
          flex-shrink: 0;
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

        .btn-danger {
          background-color: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #dc2626;
        }

        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }

        .btn-warning:hover:not(:disabled) {
          background-color: #d97706;
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1rem;
        }

        .btn-block {
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
        }

        .btn-outline {
          background-color: transparent;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-outline:hover:not(:disabled) {
          background-color: #f9fafb;
        }

        .form-actions {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .button-icon {
          margin-right: 0.5rem;
        }

        .loading-spinner-small {
          width: 1rem;
          height: 1rem;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .action-description {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        /* Sidebar Styles */
        .warning-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .warning-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #854d0e;
        }

        .warning-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background-color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.375rem;
        }

        .document-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

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
          color: #374151;
          font-size: 0.875rem;
        }

        .stat-value.status-active {
          color: #059669;
        }

        .example-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .example-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .example-label {
          font-weight: 500;
          color: #1e40af;
          font-size: 0.75rem;
        }

        .example-text {
          color: #374151;
          font-size: 0.75rem;
          line-height: 1.4;
        }

        /* Estados */
        .error-message {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .status-description {
          color: #6b7280;
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
          
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .header-details {
            flex-direction: column;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}