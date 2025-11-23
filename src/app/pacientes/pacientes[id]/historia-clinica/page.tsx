'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HospitalizacionService } from '../../../utils/hospitalizacionService';
import { PacienteService } from '../../../utils/pacienteService';

// Función para calcular la edad
const calcularEdad = (fechaNacimiento: any): number => {
  let birthDate;
  
  // Manejar tanto Timestamp de Firebase como Date/string
  if (fechaNacimiento?.toDate) {
    birthDate = fechaNacimiento.toDate();
  } else if (fechaNacimiento instanceof Date) {
    birthDate = fechaNacimiento;
  } else if (fechaNacimiento) {
    birthDate = new Date(fechaNacimiento);
  } else {
    return 0;
  }
  
  const hoy = new Date();
  let edad = hoy.getFullYear() - birthDate.getFullYear();
  const mes = hoy.getMonth() - birthDate.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < birthDate.getDate())) {
    edad--;
  }
  
  return edad;
};

export default function HistoriaClinicaPage() {
  const params = useParams();
  const router = useRouter();
  const pacienteId = params.id as string;
  
  const [historiaClinica, setHistoriaClinica] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarHistoriaClinica();
  }, [pacienteId]);

  const cargarHistoriaClinica = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Crear instancias de los servicios
      const pacienteService = new PacienteService();
      const hospitalizacionService = new HospitalizacionService();
      
      console.log('🔄 Cargando paciente ID:', pacienteId);
      const paciente = await pacienteService.obtenerPacientePorId(pacienteId);
      console.log('📋 Paciente obtenido:', paciente);
      
      if (!paciente) {
        setError('Paciente no encontrado');
        setLoading(false);
        return;
      }

      console.log('🔄 Generando historia clínica...');
      // ✅ USAR EL MÉTODO QUE YA EXISTE EN EL SERVICIO
      const historia = await hospitalizacionService.generarHistoriaClinica(pacienteId, paciente);
      console.log('📄 Historia clínica generada:', historia);
      
      if (!historia) {
        setError('No se pudo generar la historia clínica');
        setLoading(false);
        return;
      }
      
      setHistoriaClinica(historia);
    } catch (err) {
      console.error('❌ Error cargando historia clínica:', err);
      setError('Error al cargar la historia clínica');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleVolver = () => {
    router.push(`/pacientes/${pacienteId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando historia clínica...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={cargarHistoriaClinica}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
          >
            Reintentar
          </button>
          <button
            onClick={handleVolver}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!historiaClinica) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontró la historia clínica</p>
          <button
            onClick={handleVolver}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Volver al paciente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:p-0">
      {/* Header con acciones - oculto en impresión */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={handleVolver}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
        >
          ← Volver al Paciente
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleImprimir}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-white p-8 rounded-lg shadow print:shadow-none print:p-0 max-w-6xl mx-auto">
        {/* Encabezado del documento */}
        <div className="text-center mb-8 border-b pb-4 print:border-b-2">
          <h1 className="text-3xl font-bold text-gray-900">Historia Clínica</h1>
          <p className="text-gray-600 mt-2">Documento médico confidencial</p>
        </div>

        {/* Información del Paciente */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6 print:bg-white print:border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos del Paciente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p><strong className="text-gray-700">Nombre:</strong> {historiaClinica.paciente.nombre} {historiaClinica.paciente.apellido}</p>
              <p><strong className="text-gray-700">ID:</strong> {historiaClinica.paciente.id}</p>
              <p><strong className="text-gray-700">Edad:</strong> {calcularEdad(historiaClinica.paciente.fechaNacimiento)} años</p>
            </div>
            <div className="space-y-2">
              <p><strong className="text-gray-700">Género:</strong> {historiaClinica.paciente.genero}</p>
              <p><strong className="text-gray-700">Teléfono:</strong> {historiaClinica.paciente.telefono || 'No registrado'}</p>
              {historiaClinica.paciente.tipoSangre && (
                <p><strong className="text-gray-700">Tipo de Sangre:</strong> {historiaClinica.paciente.tipoSangre}</p>
              )}
            </div>
            <div className="space-y-2">
              {historiaClinica.paciente.email && (
                <p><strong className="text-gray-700">Email:</strong> {historiaClinica.paciente.email}</p>
              )}
              {historiaClinica.paciente.contactoEmergencia && (
                <p><strong className="text-gray-700">Contacto Emergencia:</strong> {historiaClinica.paciente.contactoEmergencia}</p>
              )}
            </div>
          </div>
        </div>

        {/* Antecedentes Médicos */}
        {(historiaClinica.paciente.alergias?.length > 0 || historiaClinica.paciente.enfermedadesCronicas?.length > 0) && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Antecedentes Médicos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {historiaClinica.paciente.alergias?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg border-b pb-2 text-gray-700">Alergias</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {historiaClinica.paciente.alergias.map((alergia: string, index: number) => (
                      <li key={index} className="text-gray-700">{alergia}</li>
                    ))}
                  </ul>
                </div>
              )}
              {historiaClinica.paciente.enfermedadesCronicas?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg border-b pb-2 text-gray-700">Enfermedades Crónicas</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {historiaClinica.paciente.enfermedadesCronicas.map((enfermedad: string, index: number) => (
                      <li key={index} className="text-gray-700">{enfermedad}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hospitalizaciones */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Episodios de Hospitalización ({historiaClinica.episodiosHospitalizacion?.length || 0})
          </h2>
          
          {!historiaClinica.episodiosHospitalizacion || historiaClinica.episodiosHospitalizacion.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">
              <p className="text-gray-500">No hay episodios de hospitalización registrados</p>
            </div>
          ) : (
            <div className="space-y-6">
              {historiaClinica.episodiosHospitalizacion.map((episodio: any, index: number) => (
                <div key={episodio.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 print:break-inside-avoid">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-800">Episodio {index + 1}</h3>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      episodio.fecha_alta ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {episodio.fecha_alta ? 'Completado' : 'Activo'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                    <div className="space-y-1">
                      <p><strong className="text-gray-700">Fechas:</strong> {new Date(episodio.fecha_ingreso).toLocaleDateString('es-ES')} 
                        {episodio.fecha_alta && ` - ${new Date(episodio.fecha_alta).toLocaleDateString('es-ES')}`}
                      </p>
                      <p><strong className="text-gray-700">Médico tratante:</strong> {episodio.medico_tratante}</p>
                    </div>
                    <div className="space-y-1">
                      <p><strong className="text-gray-700">Departamento:</strong> {episodio.departamento}</p>
                      {episodio.habitacion && <p><strong className="text-gray-700">Habitación:</strong> {episodio.habitacion}</p>}
                      {episodio.cama && <p><strong className="text-gray-700">Cama:</strong> {episodio.cama}</p>}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <p><strong className="text-gray-700">Motivo de ingreso:</strong> {episodio.motivo_ingreso}</p>
                    <p><strong className="text-gray-700">Diagnóstico inicial:</strong> {episodio.diagnostico_inicial}</p>
                    {episodio.diagnostico_final && (
                      <p><strong className="text-gray-700">Diagnóstico final:</strong> {episodio.diagnostico_final}</p>
                    )}
                    
                    {episodio.procedimientos?.length > 0 && (
                      <div>
                        <strong className="text-gray-700">Procedimientos ({episodio.procedimientos.length}):</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          {episodio.procedimientos.map((proc: any, procIndex: number) => (
                            <li key={procIndex} className="text-gray-700">
                              {proc.nombre_procedimiento} - {new Date(proc.fecha).toLocaleDateString('es-ES')}
                              {proc.medico && ` (${proc.medico})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {episodio.notas_evolucion?.length > 0 && (
                      <div>
                        <strong className="text-gray-700">Notas de Evolución ({episodio.notas_evolucion.length}):</strong>
                        <div className="mt-2 space-y-2">
                          {episodio.notas_evolucion.slice(0, 3).map((nota: any, notaIndex: number) => (
                            <div key={notaIndex} className="text-xs bg-white p-2 rounded border">
                              <p><strong>{new Date(nota.fecha).toLocaleDateString('es-ES')}:</strong> {nota.contenido}</p>
                              {nota.medico && <p className="text-gray-500">Por: {nota.medico}</p>}
                            </div>
                          ))}
                          {episodio.notas_evolucion.length > 3 && (
                            <p className="text-gray-500 text-xs">... y {episodio.notas_evolucion.length - 3} notas más</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie de página */}
        <div className="mt-12 text-center text-sm text-gray-500 print:mt-8">
          <p>Documento generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}</p>
          <p className="mt-2">Historia clínica electrónica - Sistema Hospitalario</p>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body {
            font-size: 12pt;
            line-height: 1.4;
            background: white !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}