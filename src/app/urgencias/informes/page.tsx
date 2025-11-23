"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import { db } from '../../utils/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy, getDoc, doc } from 'firebase/firestore';
import { UrgenciaReporte, UrgenciaData, PacienteData } from '../../utils/types';

export default function InformesUrgenciasPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoReporte, setTipoReporte] = useState('altas');
  const [generando, setGenerando] = useState(false);
  const [reporteData, setReporteData] = useState<UrgenciaReporte[]>([]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  const generarReporte = async () => {
    if (!user) return;

    if (!fechaInicio || !fechaFin) {
      alert("Por favor, seleccione ambas fechas");
      return;
    }

    setGenerando(true);
    try {
      const urgenciasRef = collection(db, "urgencias");
      let q;

      const inicio = Timestamp.fromDate(new Date(fechaInicio));
      const fin = Timestamp.fromDate(new Date(fechaFin + 'T23:59:59'));

      if (tipoReporte === 'altas') {
        q = query(
          urgenciasRef,
          where("Fecha_alta", ">=", inicio),
          where("Fecha_alta", "<=", fin),
          orderBy("Fecha_alta", "desc")
        );
      } else {
        q = query(
          urgenciasRef,
          where("Fecha_entrada", ">=", inicio),
          where("Fecha_entrada", "<=", fin),
          orderBy("Fecha_entrada", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const resultados: UrgenciaReporte[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const urgencia = docSnapshot.data() as UrgenciaData;
        
        // Obtener datos del paciente usando getDoc
        const pacienteDoc = await getDoc(doc(db, "pacientes", urgencia.Id_Paciente));

        let nombrePaciente = 'Paciente no encontrado';
        let apellido1 = '';

        if (pacienteDoc.exists()) {
          const pacienteData = pacienteDoc.data() as PacienteData;
          nombrePaciente = pacienteData.Nombre;
          apellido1 = pacienteData.Apellido1;
        }

        resultados.push({
          id: docSnapshot.id,
          Id_Urgencia: urgencia.Id_Urgencia,
          Id_Paciente: urgencia.Id_Paciente,
          NombrePaciente: nombrePaciente,
          Apellido1: apellido1,
          Fecha_entrada: urgencia.Fecha_entrada,
          Hora_Entrada: urgencia.Hora_Entrada,
          Hora_salida: urgencia.Hora_salida,
          Especialidad: urgencia.Especialidad,
          Motivo_Urgencia: urgencia.Motivo_Urgencia,
          Medico_responsable: urgencia.Medico_responsable,
          Estado: urgencia.Estado,
          Motivo_alta: urgencia.Motivo_alta
        });
      }

      setReporteData(resultados);
    } catch (error) {
      console.error("Error al generar reporte:", error);
      alert("Error al generar el reporte");
    } finally {
      setGenerando(false);
    }
  };

  const exportarPDF = () => {
    // Aquí puedes integrar con una librería como jsPDF o html2pdf
    alert("Funcionalidad de exportación PDF - Próximamente");
  };

  // Función para formatear fecha de Firestore
  const formatFecha = (fecha: any) => {
    if (!fecha) return 'N/A';
    try {
      if (fecha.toDate && typeof fecha.toDate === 'function') {
        return fecha.toDate().toLocaleDateString('es-ES');
      }
      return 'Formato inválido';
    } catch (error) {
      return 'Error fecha';
    }
  };

  if (loadingAuth || !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando informes...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Informes de Urgencias</h1>
          <p>Genere reportes de actividad del servicio de urgencias</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/urgencias')}
          >
            ← Volver a Urgencias
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="content-card">
          <h2>Configurar Reporte</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Tipo de Reporte:</label>
              <select 
                value={tipoReporte}
                onChange={(e) => setTipoReporte(e.target.value)}
              >
                <option value="altas">Altas de Urgencias</option>
                <option value="todas">Todas las Urgencias</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Fecha Inicio:</label>
              <input 
                type="date" 
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Fecha Fin:</label>
              <input 
                type="date" 
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          <div className="search-actions">
            <button 
              onClick={generarReporte}
              disabled={generando}
              className="btn btn-primary"
            >
              {generando ? '📊 Generando...' : '📊 Generar Reporte'}
            </button>
            
            {reporteData.length > 0 && (
              <button 
                onClick={exportarPDF}
                className="btn btn-success"
              >
                📄 Exportar PDF
              </button>
            )}
          </div>
        </div>

        {reporteData.length > 0 && (
          <div className="content-card">
            <h3>
              Reporte de {tipoReporte === 'altas' ? 'Altas' : 'Urgencias'} 
              ({fechaInicio} a {fechaFin}) - {reporteData.length} registros
            </h3>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Urgencia</th>
                    <th>Paciente</th>
                    <th>Fecha Entrada</th>
                    <th>Hora Entrada</th>
                    <th>Hora Salida</th>
                    <th>Especialidad</th>
                    <th>Médico</th>
                    <th>Estado</th>
                    {tipoReporte === 'altas' && <th>Motivo Alta</th>}
                  </tr>
                </thead>
                <tbody>
                  {reporteData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.Id_Urgencia}</td>
                      <td>{item.NombrePaciente} {item.Apellido1}</td>
                      <td>{formatFecha(item.Fecha_entrada)}</td>
                      <td>{item.Hora_Entrada}</td>
                      <td>{item.Hora_salida || '-'}</td>
                      <td>{item.Especialidad}</td>
                      <td>{item.Medico_responsable}</td>
                      <td>
                        <span className={`estado ${item.Estado}`}>
                          {item.Estado}
                        </span>
                      </td>
                      {tipoReporte === 'altas' && (
                        <td>{item.Motivo_alta || '-'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!generando && reporteData.length === 0 && fechaInicio && fechaFin && (
          <div className="content-card empty-state">
            <div className="empty-icon">📋</div>
            <h3>No hay datos para el período seleccionado</h3>
            <p>Intente con otro rango de fechas o tipo de reporte</p>
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

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
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
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .search-actions {
          display: flex;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
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

        .table-container {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .data-table th,
        .data-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .data-table th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #374151;
        }

        .data-table tr:hover {
          background-color: #f9fafb;
        }

        .estado {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .estado.activa {
          background-color: #dcfce7;
          color: #166534;
        }

        .estado.alta {
          background-color: #fef3c7;
          color: #92400e;
        }

        .estado.derivada {
          background-color: #dbeafe;
          color: #1e40af;
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

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .search-actions {
            flex-direction: column;
          }
          
          .table-container {
            font-size: 0.75rem;
          }
          
          .data-table th,
          .data-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}