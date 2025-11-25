// src/app/components/InitializeDataComponent.tsx
"use client";

import { useState, useEffect } from 'react';
import { initializeTestData, checkExistingData, InitializeResult } from '../utils/initializeTestData';

export default function InitializeDataComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InitializeResult | null>(null);
  const [hasExistingData, setHasExistingData] = useState<boolean | null>(null);

  useEffect(() => {
    checkDataExistence();
  }, []);

  const checkDataExistence = async () => {
    try {
      const exists = await checkExistingData();
      setHasExistingData(exists);
    } catch (error) {
      console.error("Error checking data existence:", error);
    }
  };

  const handleInitializeData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const initializationResult = await initializeTestData();
      setResult(initializationResult);
      setHasExistingData(initializationResult.success ? true : hasExistingData);
    } catch (error) {
      console.error("Error initializing data:", error);
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        details: { pruebasMedicas: 0, especialidades: 0, facultativos: 0, procedencias: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="initialize-data-component">
      <div className="content-card">
        <h2>🔧 Inicializar Datos de Prueba</h2>
        
        <div className="info-section">
          <p>Este componente creará datos de prueba para:</p>
          <ul>
            <li>📋 <strong>Pruebas Médicas</strong> (8 tipos diferentes)</li>
            <li>🎯 <strong>Especialidades</strong> (8 especialidades médicas)</li>
            <li>👨‍⚕️ <strong>Facultativos</strong> (8 médicos especialistas)</li>
            <li>📍 <strong>Procedencias</strong> (6 tipos de procedencia)</li>
          </ul>
        </div>

        {hasExistingData !== null && (
          <div className={`status-alert ${hasExistingData ? 'warning' : 'info'}`}>
            {hasExistingData 
              ? '⚠️ Ya existen datos en la base de datos. La inicialización no se realizará para evitar duplicados.'
              : '✅ No se detectaron datos existentes. Puede proceder con la inicialización.'
            }
          </div>
        )}

        <div className="actions-section">
          <button 
            onClick={handleInitializeData}
            disabled={loading || hasExistingData === true}
            className="btn btn-primary"
          >
            {loading ? '🔄 Inicializando...' : '🚀 Inicializar Datos de Prueba'}
          </button>

          <button 
            onClick={checkDataExistence}
            disabled={loading}
            className="btn btn-secondary"
          >
            🔍 Verificar Datos
          </button>
        </div>

        {result && (
          <div className={`result-section ${result.success ? 'success' : 'error'}`}>
            <h4>{result.success ? '✅ Éxito' : '❌ Error'}</h4>
            <p>{result.message}</p>
            
            {result.success && (
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Pruebas Médicas:</span>
                  <span className="value">{result.details.pruebasMedicas}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Especialidades:</span>
                  <span className="value">{result.details.especialidades}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Facultativos:</span>
                  <span className="value">{result.details.facultativos}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Procedencias:</span>
                  <span className="value">{result.details.procedencias}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .initialize-data-component {
          max-width: 600px;
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
          margin-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .info-section {
          background-color: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-section p {
          color: #374151;
          margin-bottom: 0.75rem;
          font-weight: 500;
        }

        .info-section ul {
          color: #6b7280;
          padding-left: 1.5rem;
        }

        .info-section li {
          margin-bottom: 0.25rem;
        }

        .status-alert {
          padding: 1rem;
          border-radius: 0.375rem;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .status-alert.warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
        }

        .status-alert.info {
          background-color: #dbeafe;
          border: 1px solid #3b82f6;
          color: #1e40af;
        }

        .actions-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
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

        .result-section {
          padding: 1rem;
          border-radius: 0.375rem;
          border: 1px solid;
        }

        .result-section.success {
          background-color: #d1fae5;
          border-color: #10b981;
          color: #065f46;
        }

        .result-section.error {
          background-color: #fee2e2;
          border-color: #ef4444;
          color: #7f1d1d;
        }

        .result-section h4 {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background-color: rgba(255, 255, 255, 0.5);
          border-radius: 0.25rem;
        }

        .detail-item .label {
          font-weight: 500;
        }

        .detail-item .value {
          font-weight: 600;
          color: #059669;
        }

        @media (max-width: 768px) {
          .actions-section {
            flex-direction: column;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}