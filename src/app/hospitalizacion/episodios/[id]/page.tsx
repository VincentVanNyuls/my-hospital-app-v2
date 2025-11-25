'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HospitalizacionService } from '../../../utils/hospitalizacionService';
import { EpisodioHospitalizacion, NotaEvolucion } from '../../../types/hospitalizacion';
import Link from 'next/link';

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

  // ✅ CORREGIDO: Función async con await
  const cargarEpisodio = async () => {
    try {
      setLoading(true);
      console.log('🟡 Cargando episodio:', episodioId);
      
      const episodioData = await hospitalizacionService.getEpisodioById(episodioId);
      console.log('✅ Episodio cargado:', episodioData);
      
      setEpisodio(episodioData);
    } catch (error) {
      console.error('❌ Error cargando episodio:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREGIDO: Función async con await
  const handleAgregarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevaNota.medico || !nuevaNota.subjetivo || !nuevaNota.objetivo) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      console.log('🟡 Agregando nota...');
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
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <h3>Episodio no encontrado</h3>
        <p>El episodio con ID "{episodioId}" no existe o ha sido eliminado.</p>
        <div className="action-buttons mt-4">
          <Link
            href="/hospitalizacion"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Volver a Hospitalización
          </Link>
          <Link
            href="/hospitalizacion/episodios"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Ver todos los episodios
          </Link>
        </div>
      </div>
    );
  }

  return (
    // ✅ SOLO este contenedor - ELIMINA los duplicados
    <div className="detalles-episodio-content">
      {/* Header con acciones */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detalles del Episodio</h1>
          <p className="text-gray-600">Información completa del episodio de hospitalización</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>ID: {episodio.id}</span>
            <span>•</span>
            <span>Paciente: {episodio.paciente_id}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!episodio.fecha_alta && (
            <Link
              href={`/hospitalizacion/alta/${episodio.id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              🏥 Dar Alta
            </Link>
          )}
          <Link
            href="/hospitalizacion/episodios"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            ← Volver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Estado */}
          <div className={`p-6 rounded-lg border ${
            episodio.fecha_alta 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`text-2xl ${
                  episodio.fecha_alta ? 'text-purple-600' : 'text-green-600'
                }`}>
                  {episodio.fecha_alta ? '✅' : '🏥'}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {episodio.fecha_alta ? 'Episodio Completado' : 'Episodio Activo'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {episodio.fecha_alta 
                      ? `Alta médica el ${formatFecha(episodio.fecha_alta)}`
                      : 'Paciente actualmente hospitalizado'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Fecha de ingreso</p>
                <p className="font-semibold">{formatFecha(episodio.fecha_ingreso)}</p>
              </div>
            </div>
          </div>

          {/* Información del Paciente y Médico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="content-card">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">👤 Información del Paciente</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ID Paciente</p>
                  <p className="font-medium text-gray-800">{episodio.paciente_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Habitación</p>
                  <p className="font-medium text-gray-800">
                    {episodio.habitacion || 'No asignada'} - Cama {episodio.cama || 'No asignada'}
                  </p>
                </div>
                {episodio.antecedentes_medicos && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Antecedentes Médicos</p>
                    <p className="text-gray-700 text-sm">{episodio.antecedentes_medicos}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="content-card">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">👨‍⚕️ Información Médica</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Médico Tratante</p>
                  <p className="font-medium text-gray-800">{episodio.medico_tratante}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Departamento</p>
                  <p className="font-medium text-gray-800">{episodio.departamento}</p>
                </div>
                {episodio.alergias.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Alergias</p>
                    <div className="flex flex-wrap gap-1">
                      {episodio.alergias.map((alergia, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
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
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Diagnóstico</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Motivo de Ingreso</p>
                <p className="text-gray-800">{episodio.motivo_ingreso}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Diagnóstico Inicial</p>
                <p className="text-gray-800">{episodio.diagnostico_inicial}</p>
              </div>
              {episodio.diagnostico_final && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Diagnóstico Final</p>
                  <p className="text-gray-800 font-medium">{episodio.diagnostico_final}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notas de Evolución */}
          <div className="content-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">📝 Notas de Evolución</h3>
              {!episodio.fecha_alta && (
                <button
                  onClick={() => setMostrarFormNota(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  + Agregar Nota
                </button>
              )}
            </div>

            {/* Formulario para nueva nota */}
            {mostrarFormNota && (
              <div className="mb-6 p-6 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-semibold mb-4 text-blue-800 text-lg">Nueva Nota de Evolución</h4>
                <form onSubmit={handleAgregarNota} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Médico *</label>
                    <input
                      type="text"
                      value={nuevaNota.medico}
                      onChange={(e) => setNuevaNota({...nuevaNota, medico: e.target.value})}
                      placeholder="Nombre del médico"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subjetivo *</label>
                    <textarea
                      value={nuevaNota.subjetivo}
                      onChange={(e) => setNuevaNota({...nuevaNota, subjetivo: e.target.value})}
                      placeholder="Lo que el paciente refiere..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo *</label>
                    <textarea
                      value={nuevaNota.objetivo}
                      onChange={(e) => setNuevaNota({...nuevaNota, objetivo: e.target.value})}
                      placeholder="Hallazgos objetivos, signos vitales..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evaluación</label>
                    <textarea
                      value={nuevaNota.evaluacion}
                      onChange={(e) => setNuevaNota({...nuevaNota, evaluacion: e.target.value})}
                      placeholder="Interpretación de los hallazgos..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                    <textarea
                      value={nuevaNota.plan}
                      onChange={(e) => setNuevaNota({...nuevaNota, plan: e.target.value})}
                      placeholder="Plan de tratamiento y seguimiento..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      💾 Guardar Nota
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarFormNota(false)}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de notas */}
            <div className="space-y-4">
              {episodio.notas_evolucion.length === 0 ? (
                <div className="empty-state py-8">
                  <div className="empty-icon">📝</div>
                  <h3>No hay notas de evolución</h3>
                  <p>
                    {!episodio.fecha_alta 
                      ? 'Agrega la primera nota de evolución del paciente'
                      : 'No se registraron notas de evolución durante este episodio'
                    }
                  </p>
                </div>
              ) : (
                [...episodio.notas_evolucion].reverse().map((nota, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">{nota.medico}</p>
                        <p className="text-sm text-gray-500">{formatFecha(nota.fecha)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Subjetivo</p>
                        <p className="text-gray-600 leading-relaxed">{nota.subjetivo}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Objetivo</p>
                        <p className="text-gray-600 leading-relaxed">{nota.objetivo}</p>
                      </div>
                      {nota.evaluacion && (
                        <div className="md:col-span-2">
                          <p className="font-medium text-gray-700 mb-2">Evaluación</p>
                          <p className="text-gray-600 leading-relaxed">{nota.evaluacion}</p>
                        </div>
                      )}
                      {nota.plan && (
                        <div className="md:col-span-2">
                          <p className="font-medium text-gray-700 mb-2">Plan</p>
                          <p className="text-gray-600 leading-relaxed">{nota.plan}</p>
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
        <div className="space-y-6">
          {/* Resumen de Datos */}
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Resumen del Episodio</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Notas de evolución</span>
                <span className="font-medium text-lg">{episodio.notas_evolucion.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Procedimientos</span>
                <span className="font-medium text-lg">{episodio.procedimientos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tratamientos</span>
                <span className="font-medium text-lg">{episodio.tratamientos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estudios de imagen</span>
                <span className="font-medium text-lg">{episodio.estudios_imagen.length}</span>
              </div>
            </div>
          </div>

          {/* Medicamentos Actuales */}
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">💊 Medicamentos Actuales</h3>
            <div className="space-y-3">
              {episodio.medicamentos_actuales.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay medicamentos registrados</p>
              ) : (
                episodio.medicamentos_actuales.map((medicamento, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700 text-sm">{medicamento}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🚀 Acciones</h3>
            <div className="space-y-3">
              {!episodio.fecha_alta && (
                <Link
                  href={`/hospitalizacion/alta/${episodio.id}`}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium block text-center"
                >
                  🏥 Registrar Alta
                </Link>
              )}
              <button
                onClick={() => hospitalizacionService.descargarInformeAlta(episodio.id)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📄 Generar Informe PDF
              </button>
              <Link
                href="/hospitalizacion/episodios"
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium block text-center"
              >
                📋 Volver a Episodios
              </Link>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📞 Información de Contacto</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Médico Tratante</span>
                <span className="font-medium">{episodio.medico_tratante}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Departamento</span>
                <span className="font-medium">{episodio.departamento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Habitación</span>
                <span className="font-medium">
                  {episodio.habitacion || 'N/A'} - {episodio.cama || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}