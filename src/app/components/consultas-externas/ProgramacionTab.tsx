// src/app/components/consultas-externas/ProgramacionTab.tsx
"use client";

import { useState } from 'react';
import AgendaComponent from './AgendaComponent';

interface ProgramacionTabProps {
  patientId: string;
  consultaId?: string;
}

export default function ProgramacionTab({ patientId, consultaId }: ProgramacionTabProps) {
  const [citaSeleccionada, setCitaSeleccionada] = useState<string | null>(null);

  const handleCitaSeleccionada = (citaId: string) => {
    setCitaSeleccionada(citaId);
    alert(`Cita ${citaId} reservada para el paciente`);
  };

  return (
    <div className="programacion-tab">
      <div className="section-header">
        <h4>Programación de Citas</h4>
        <p>Agende citas para el paciente seleccionado</p>
      </div>

      {citaSeleccionada && (
        <div className="success-alert">
          ✅ Cita reservada correctamente. ID: {citaSeleccionada}
        </div>
      )}

      {patientId ? (
        <AgendaComponent 
          patientId={patientId}
          consultaId={consultaId}
          onCitaSeleccionada={handleCitaSeleccionada}
        />
      ) : (
        <div className="warning-alert">
          ⚠️ Seleccione un paciente primero para poder agendar citas
        </div>
      )}

      <style jsx>{`
        .programacion-tab {
          padding: 1rem 0;
        }

        .section-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .section-header h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .section-header p {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .success-alert {
          background: #d1fae5;
          border: 1px solid #10b981;
          color: #065f46;
          padding: 1rem;
          border-radius: 0.375rem;
          margin-bottom: 1.5rem;
        }

        .warning-alert {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 2rem;
          text-align: center;
          border-radius: 0.5rem;
          font-size: 1.125rem;
        }
      `}</style>
    </div>
  );
}