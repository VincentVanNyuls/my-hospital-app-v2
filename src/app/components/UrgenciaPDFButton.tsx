"use client";

import { useState } from 'react';
import { PDFService } from '../utils/pdfService';
import { PacienteData, UrgenciaData } from '../utils/types'; // ← Cambiar aquí

interface UrgenciaPDFButtonProps {
  urgencia: UrgenciaData; // ← Usar UrgenciaData
  paciente: PacienteData; // ← Usar PacienteData
  className?: string;
  variant?: 'primary' | 'success' | 'outline';
}

export default function UrgenciaPDFButton({ 
  urgencia, 
  paciente, 
  className = '',
  variant = 'success'
}: UrgenciaPDFButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      await PDFService.generarYDescargarInformeUrgencia(urgencia, paciente);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setGenerating(false);
    }
  };

  const getButtonClass = () => {
    const baseClass = 'btn';
    switch (variant) {
      case 'primary':
        return `${baseClass} btn-primary ${className}`;
      case 'outline':
        return `${baseClass} btn-outline ${className}`;
      default:
        return `${baseClass} btn-success ${className}`;
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      disabled={generating}
      className={getButtonClass()}
      title="Generar informe en PDF"
    >
      {generating ? '📄 Generando...' : '📄 Informe PDF'}
    </button>
  );
}