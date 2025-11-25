// src/app/hospitalizacion/admision/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PatientSelector from '../../components/PatientSelector';
import { HospitalizacionService } from '../../utils/hospitalizacionService';
import { PacienteData } from '../../types/paciente';

interface PacienteSeleccionado {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  DNI_NIE?: string;
  SIP?: string;
  NumHistoriaClinica?: string;
}

const hospitalizacionService = new HospitalizacionService();

export default function AdmisionPage() {
  const router = useRouter();
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteSeleccionado | null>(null);
  const [formData, setFormData] = useState({
    medico_tratante: 'Dr. García',
    departamento: 'Medicina Interna',
    motivo_ingreso: 'Fiebre alta y malestar general',
    diagnostico_inicial: 'Sospecha de infección bacteriana',
    habitacion: '201',
    cama: 'A'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePatientSelect = (patientId: string, patientData?: PacienteData) => {
    if (patientData) {
      setPacienteSeleccionado({
        id: patientData.Id_paciente,
        nombre: patientData.Nombre,
        apellido: `${patientData.Apellido1} ${patientData.Apellido2 || ''}`.trim(),
        telefono: patientData.Telefono || '',
        DNI_NIE: patientData.DNI_NIE,
        SIP: patientData.SIP,
        NumHistoriaClinica: patientData.NumHistoriaClinica
      });
      setError(null);
    } else {
      setPacienteSeleccionado(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!pacienteSeleccionado) {
      setError('❌ Por favor selecciona un paciente');
      return;
    }

    const camposRequeridos = ['medico_tratante', 'departamento', 'motivo_ingreso', 'diagnostico_inicial', 'habitacion', 'cama'];
    const camposVacios = camposRequeridos.filter(campo => !formData[campo as keyof typeof formData]);
    
    if (camposVacios.length > 0) {
      setError(`❌ Por favor completa todos los campos requeridos: ${camposVacios.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const datosEpisodio = {
        paciente_id: pacienteSeleccionado.id,
        fecha_ingreso: new Date().toISOString(),
        medico_tratante: formData.medico_tratante,
        departamento: formData.departamento,
        motivo_ingreso: formData.motivo_ingreso,
        diagnostico_inicial: formData.diagnostico_inicial,
        habitacion: formData.habitacion,
        cama: formData.cama,
        signos_vitales: [],
        resultados_laboratorio: [],
        estudios_imagen: [],
        notas_evolucion: [],
        tratamientos: [],
        procedimientos: [],
        medicamentos_alta: [],
        medicamentos_actuales: [],
        alergias: [],
        antecedentes_medicos: ''
      };

      const nuevoEpisodio = await hospitalizacionService.admitirPaciente(datosEpisodio);

      if (!nuevoEpisodio) {
        throw new Error('No se recibió respuesta de Firestore');
      }

      const episodioId = nuevoEpisodio.id;
      
      if (!episodioId) {
        throw new Error('No se pudo obtener el ID del episodio creado');
      }

      // Redirección con pequeño delay para estabilidad
      setTimeout(() => {
        router.push(`/hospitalizacion/episodios/${episodioId}`);
      }, 100);
      
    } catch (error) {
      console.error('❌ ERROR en admisión:', error);
      
      let mensajeError = 'Error al admitir paciente';
      if (error instanceof Error) {
        mensajeError += `: ${error.message}`;
      }
      
      setError(mensajeError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header IDÉNTICO a gestión de pacientes */}
      <div className="page-header">
        <div className="header-content">
          <h1>Admisión de Pacientes</h1>
          <p>Registrar nuevo ingreso hospitalario en el sistema</p>
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
        <div className="content-grid">
          {/* Formulario Principal */}
          <div className="mi-pagina-content">
            <div className="content-card">
              <h2>Proceso de Admisión</h2>
              
              <form onSubmit={handleSubmit} className="form-container">
                {/* Paso 1: Selección de Paciente */}
                <div className="form-section">
                  <div className="section-header">
                    <div className="step-number">1</div>
                    <h3>Seleccionar Paciente</h3>
                  </div>
                  
                  <PatientSelector onPatientSelect={handlePatientSelect} />
                  
                  {pacienteSeleccionado && (
                    <div className="success-message">
                      <div className="success-icon">✅</div>
                      <div className="success-content">
                        <div className="success-title">
                          {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
                        </div>
                        <div className="success-details">
                          <span>ID: <strong>{pacienteSeleccionado.id}</strong></span>
                          {pacienteSeleccionado.DNI_NIE && <span>DNI: <strong>{pacienteSeleccionado.DNI_NIE}</strong></span>}
                          {pacienteSeleccionado.SIP && <span>SIP: <strong>{pacienteSeleccionado.SIP}</strong></span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Paso 2: Datos de Admisión */}
                {pacienteSeleccionado && (
                  <div className="form-section">
                    <div className="section-header">
                      <div className="step-number">2</div>
                      <h3>Datos de Admisión</h3>
                    </div>
                    
                    <div className="form-grid">
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="medico_tratante">Médico Tratante *</label>
                          <input
                            type="text"
                            id="medico_tratante"
                            value={formData.medico_tratante}
                            onChange={(e) => setFormData({...formData, medico_tratante: e.target.value})}
                            placeholder="Ej: Dr. García López"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="departamento">Departamento *</label>
                          <select
                            id="departamento"
                            value={formData.departamento}
                            onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                            required
                          >
                            <option value="Medicina Interna">Medicina Interna</option>
                            <option value="Cirugía General">Cirugía General</option>
                            <option value="Pediatría">Pediatría</option>
                            <option value="Ginecología">Ginecología</option>
                            <option value="Traumatología">Traumatología</option>
                            <option value="Cardiología">Cardiología</option>
                            <option value="Neurología">Neurología</option>
                            <option value="Oncología">Oncología</option>
                            <option value="UCI">Unidad de Cuidados Intensivos</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="habitacion">Habitación *</label>
                          <input
                            type="text"
                            id="habitacion"
                            value={formData.habitacion}
                            onChange={(e) => setFormData({...formData, habitacion: e.target.value})}
                            placeholder="Ej: 201"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="cama">Cama *</label>
                          <input
                            type="text"
                            id="cama"
                            value={formData.cama}
                            onChange={(e) => setFormData({...formData, cama: e.target.value})}
                            placeholder="Ej: A"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="motivo_ingreso">Motivo de Ingreso *</label>
                        <textarea
                          id="motivo_ingreso"
                          value={formData.motivo_ingreso}
                          onChange={(e) => setFormData({...formData, motivo_ingreso: e.target.value})}
                          placeholder="Describa el motivo del ingreso hospitalario..."
                          rows={3}
                          required
                        />
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="diagnostico_inicial">Diagnóstico Inicial *</label>
                        <input
                          type="text"
                          id="diagnostico_inicial"
                          value={formData.diagnostico_inicial}
                          onChange={(e) => setFormData({...formData, diagnostico_inicial: e.target.value})}
                          placeholder="Ej: Sospecha de infección bacteriana"
                          required
                        />
                      </div>
                    </div>

                    {/* Botón de Envío */}
                    <div className="form-actions">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-success btn-large"
                      >
                        {isSubmitting ? (
                          <span className="button-loading">
                            <div className="loading-spinner-small"></div>
                            Admitiendo Paciente...
                          </span>
                        ) : (
                          <span className="button-content">
                            ✅ Admitir Paciente
                          </span>
                        )}
                      </button>
                      <p className="action-description">
                        El paciente será ingresado y redirigido a la página de detalles del episodio.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Sidebar - Información y Ayuda */}
          <div className="sidebar-content">
            {/* Información del Proceso */}
            <div className="content-card">
              <h3>📋 Proceso de Admisión</h3>
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon info-icon-blue">1</div>
                  <div className="info-content">
                    <div className="info-title">Seleccionar Paciente</div>
                    <div className="info-description">Busca y selecciona un paciente existente</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon info-icon-green">2</div>
                  <div className="info-content">
                    <div className="info-title">Completar Datos</div>
                    <div className="info-description">Ingresa la información de admisión</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon info-icon-purple">3</div>
                  <div className="info-content">
                    <div className="info-title">Confirmar Ingreso</div>
                    <div className="info-description">El paciente será admitido al sistema</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Importante */}
            <div className="content-card">
              <h3>⚠️ Información Importante</h3>
              <div className="warning-list">
                <div className="warning-item">
                  <span className="warning-dot warning-dot-red"></span>
                  <span>Verifica que el paciente no tenga episodios activos</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot warning-dot-yellow"></span>
                  <span>Completa todos los campos obligatorios (*)</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot warning-dot-blue"></span>
                  <span>Asigna habitación y cama disponibles</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot warning-dot-green"></span>
                  <span>El diagnóstico puede actualizarse posteriormente</span>
                </div>
              </div>
            </div>

            {/* Departamentos Disponibles */}
            <div className="content-card">
              <h3>🏥 Departamentos</h3>
              <div className="departments-list">
                {[
                  'Medicina Interna',
                  'Cirugía General', 
                  'Pediatría',
                  'Ginecología',
                  'Traumatología',
                  'Cardiología',
                  'Neurología',
                  'Oncología',
                  'UCI'
                ].map((depto) => (
                  <div key={depto} className="department-item">
                    <div className="department-dot"></div>
                    <span>{depto}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="content-card">
              <h3>🚀 Acciones Rápidas</h3>
              <div className="quick-actions">
                <Link href="/pacientes" className="btn btn-primary btn-block">
                  👥 Gestionar Pacientes
                </Link>
                <Link href="/hospitalizacion/episodios" className="btn btn-secondary btn-block">
                  📋 Ver Episodios
                </Link>
                <Link href="/hospitalizacion" className="btn btn-warning btn-block">
                  🏠 Volver al Dashboard
                </Link>
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

        /* Formulario */
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-section {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          background-color: #f9fafb;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .step-number {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background-color: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.875rem;
        }

        .form-section:nth-child(2) .step-number {
          background-color: #10b981;
        }

        .section-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
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

        /* Mensajes de éxito */
        .success-message {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background-color: #d1fae5;
          border: 1px solid #a7f3d0;
          border-radius: 0.375rem;
          margin-top: 1rem;
        }

        .success-icon {
          font-size: 1.25rem;
        }

        .success-title {
          font-weight: 600;
          color: #065f46;
          font-size: 1.125rem;
        }

        .success-details {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #047857;
          margin-top: 0.25rem;
        }

        .success-details strong {
          color: #064e3b;
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

        .form-actions {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          text-align: center;
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
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .info-icon {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .info-icon-blue { background-color: #dbeafe; color: #1d4ed8; }
        .info-icon-green { background-color: #d1fae5; color: #065f46; }
        .info-icon-purple { background-color: #f3e8ff; color: #7e22ce; }

        .info-title {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .info-description {
          color: #6b7280;
          font-size: 0.75rem;
          margin-top: 0.125rem;
        }

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
          color: #6b7280;
        }

        .warning-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 0.375rem;
        }

        .warning-dot-red { background-color: #ef4444; }
        .warning-dot-yellow { background-color: #f59e0b; }
        .warning-dot-blue { background-color: #3b82f6; }
        .warning-dot-green { background-color: #10b981; }

        .departments-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .department-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #374151;
        }

        .department-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          background-color: #3b82f6;
          flex-shrink: 0;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
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