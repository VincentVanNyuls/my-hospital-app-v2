// src/app/consultas-externas/initialize-data/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import InitializeDataComponent from '../../components/InitializeDataComponent';

export default function InitializeDataPage() {
  const router = useRouter();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Inicializar Datos de Prueba</h1>
          <p>Configuración inicial del sistema de consultas externas</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/consultas-externas')}
          >
            ← Volver a Consultas
          </button>
        </div>
      </div>

      <div className="page-content">
        <InitializeDataComponent />
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
          max-width: 800px;
          margin: 0 auto;
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

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #4b5563;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}