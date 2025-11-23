'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HospitalizacionService } from '../../../utils/hospitalizacionService';
import { EpisodioHospitalizacion } from '../../../types/hospitalizacion';
import Link from 'next/link';

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
    console.log('Cargando episodio con ID:', episodioId);
    cargarEpisodio();
  }, [episodioId]);

  const cargarEpisodio = async () => {
    try {
      setError(null);
      const episodioData = await hospitalizacionService.getEpisodioById(episodioId);
      
      console.log('Datos del episodio encontrado:', episodioData);
      
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

  // FUNCIONES PARA PDF
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
      alert('Por favor ingresa el diagnóstico final');
      return;
    }

    if (!formData.resumen_alta.trim()) {
      alert('Por favor ingresa el resumen del alta');
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
      <div className="main-content">
        <div className="content-area">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando información del episodio...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error al cargar
  if (error && !episodio) {
    return (
      <div className="main-content">
        <div className="content-area">
          <div className="empty-state">
            <div className="empty-icon">❌</div>
            <h3>Error al cargar el episodio</h3>
            <p>{error}</p>
            <div className="action-buttons mt-4">
              <button
                onClick={() => {
                  hospitalizacionService.debugEpisodios();
                  cargarEpisodio();
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reintentar
              </button>
              <Link
                href="/hospitalizacion/episodios"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
      <div className="main-content">
        <div className="content-area">
          <div className="empty-state">
            <div className="empty-icon">❌</div>
            <h3>Episodio no encontrado</h3>
            <p>El episodio con ID "{episodioId}" no existe.</p>
            <Link
              href="/hospitalizacion/episodios"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-4 inline-block"
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
      <div className="main-content">
        <div className="content-area">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>Alta Médica Ya Registrada</h3>
            <p className="text-gray-600 mb-2">
              Este episodio ya fue dado de alta el {formatFecha(episodio.fecha_alta)}.
            </p>
            <p className="text-gray-600 mb-6">
              Diagnóstico final: {episodio.diagnostico_final}
            </p>
            
            {/* Botones de PDF para episodios ya dados de alta */}
            <div className="action-buttons mb-6">
              <button
                onClick={generarPDF}
                disabled={isGeneratingPDF}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed font-medium"
              >
                {isGeneratingPDF ? '📄 Generando...' : '📄 Descargar Informe PDF'}
              </button>
              <button
                onClick={previsualizarPDF}
                disabled={isGeneratingPDF}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
              >
                {isGeneratingPDF ? '👁️ Generando...' : '👁️ Previsualizar PDF'}
              </button>
            </div>

            <div className="action-buttons">
              <Link
                href={`/hospitalizacion/episodios/${episodioId}`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Ver Detalles del Episodio
              </Link>
              <Link
                href="/hospitalizacion/episodios"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
    <div className="main-content">
      <div className="content-area">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Alta Médica</h1>
            <p className="text-gray-600">Registrar informe de alta para {episodio.paciente_id}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>ID Episodio: {episodio.id}</span>
              <span>•</span>
              <span>Ingreso: {formatFecha(episodio.fecha_ingreso)}</span>
            </div>
          </div>
          <Link
            href={`/hospitalizacion/episodios/${episodioId}`}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            ← Volver al Episodio
          </Link>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error: </strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            <div className="content-card">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información del Episodio */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 mb-4 text-lg">Información del Episodio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-blue-700 text-sm font-medium">Paciente ID</p>
                      <p className="font-semibold text-gray-800">{episodio.paciente_id}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 text-sm font-medium">Fecha Ingreso</p>
                      <p className="font-semibold text-gray-800">{formatFecha(episodio.fecha_ingreso)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 text-sm font-medium">Médico Tratante</p>
                      <p className="font-semibold text-gray-800">{episodio.medico_tratante}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 text-sm font-medium">Departamento</p>
                      <p className="font-semibold text-gray-800">{episodio.departamento}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 text-sm font-medium">Diagnóstico Inicial</p>
                      <p className="font-semibold text-gray-800 text-sm">{episodio.diagnostico_inicial}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 text-sm font-medium">Días de Estancia</p>
                      <p className="font-semibold text-gray-800">{calcularDiasEstancia()} días</p>
                    </div>
                  </div>
                </div>

                {/* Diagnóstico Final */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnóstico Final *
                  </label>
                  <input
                    type="text"
                    value={formData.diagnostico_final}
                    onChange={(e) => setFormData({...formData, diagnostico_final: e.target.value})}
                    placeholder="Ej: Infección bacteriana resuelta"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Diagnóstico definitivo al momento del alta
                  </p>
                </div>

                {/* Condición al Alta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condición al Alta *
                  </label>
                  <select
                    value={formData.condicion_alta}
                    onChange={(e) => setFormData({...formData, condicion_alta: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resumen de la Evolución y Alta *
                  </label>
                  <textarea
                    value={formData.resumen_alta}
                    onChange={(e) => setFormData({...formData, resumen_alta: e.target.value})}
                    placeholder="Describa la evolución durante la hospitalización, tratamiento recibido y motivo del alta..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Resumen completo de la evolución hospitalaria
                  </p>
                </div>

                {/* Medicamentos al Alta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicamentos al Alta
                  </label>
                  <div className="space-y-3">
                    {formData.medicamentos_alta.map((medicamento, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={medicamento}
                          onChange={(e) => actualizarMedicamento(index, e.target.value)}
                          placeholder="Ej: Amoxicilina 500mg cada 8h por 7 días"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formData.medicamentos_alta.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarMedicamento(index)}
                            className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={agregarMedicamento}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      + Agregar Medicamento
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Especificar medicamento, dosis, frecuencia y duración
                  </p>
                </div>

                {/* Instrucciones de Seguimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones de Seguimiento
                  </label>
                  <textarea
                    value={formData.instrucciones_seguimiento}
                    onChange={(e) => setFormData({...formData, instrucciones_seguimiento: e.target.value})}
                    placeholder="Ej: Control en 7 días, reposo relativo, dieta blanda..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Recomendaciones y citas de seguimiento
                  </p>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-col gap-4 pt-6 border-t border-gray-200">
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed font-medium text-lg"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Registrando Alta...
                        </span>
                      ) : (
                        '✅ Registrar Alta Médica'
                      )}
                    </button>
                    
                    {/* Botones de PDF */}
                    <button
                      type="button"
                      onClick={previsualizarPDF}
                      disabled={isGeneratingPDF}
                      className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
                    >
                      {isGeneratingPDF ? 'Generando...' : '👁️ Previsualizar'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={generarPDF}
                      disabled={isGeneratingPDF}
                      className="bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed font-medium"
                    >
                      {isGeneratingPDF ? 'Generando...' : '📄 Descargar PDF'}
                    </button>
                  </div>
                  
                  <Link
                    href={`/hospitalizacion/episodios/${episodioId}`}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium text-center"
                  >
                    Cancelar
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Información de Ayuda */}
          <div className="space-y-6">
            {/* Recordatorio Importante */}
            <div className="content-card bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Importante</h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Verificar todos los datos antes de registrar el alta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>El alta médica no se puede deshacer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Se generará automáticamente el informe de alta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>El episodio pasará a estado "Completado"</span>
                </li>
              </ul>
            </div>

            {/* Generación de Documentos */}
            <div className="content-card bg-green-50 border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-3">📄 Documentos</h3>
              <div className="space-y-3">
                <button
                  onClick={previsualizarPDF}
                  disabled={isGeneratingPDF}
                  className="w-full bg-white text-green-800 p-3 rounded-lg border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">👁️</span>
                    <span>Previsualizar Informe</span>
                  </span>
                </button>
                <button
                  onClick={generarPDF}
                  disabled={isGeneratingPDF}
                  className="w-full bg-white text-green-800 p-3 rounded-lg border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">📥</span>
                    <span>Descargar PDF</span>
                  </span>
                </button>
              </div>
              <p className="text-xs text-green-600 mt-3">
                Genera el informe de alta en formato PDF
              </p>
            </div>

            {/* Resumen del Episodio */}
            <div className="content-card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumen del Episodio</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Días de estancia</span>
                  <span className="font-semibold text-gray-800">{calcularDiasEstancia()} días</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Notas de evolución</span>
                  <span className="font-semibold text-gray-800">{episodio.notas_evolucion?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Procedimientos</span>
                  <span className="font-semibold text-gray-800">{episodio.procedimientos?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado actual</span>
                  <span className="font-semibold text-green-600">Activo</span>
                </div>
              </div>
            </div>

            {/* Plantilla de Ejemplo */}
            <div className="content-card bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Ejemplo de Alta</h3>
              <div className="text-sm text-blue-700 space-y-3">
                <div>
                  <p className="font-medium">Diagnóstico Final:</p>
                  <p>Neumonía bacteriana resuelta</p>
                </div>
                <div>
                  <p className="font-medium">Resumen:</p>
                  <p>Paciente evolucionó favorablemente con antibioticoterapia...</p>
                </div>
                <div>
                  <p className="font-medium">Medicamentos:</p>
                  <p>Amoxicilina 500mg/8h × 7 días</p>
                </div>
                <div>
                  <p className="font-medium">Seguimiento:</p>
                  <p>Control en 7 días, radiografía de control</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}