// src/components/InformeAltaPDF.tsx
import { InformeAlta } from '../types/hospitalizacion';

interface InformeAltaPDFProps {
  informe: InformeAlta;
}

export default function InformeAltaPDF({ informe }: InformeAltaPDFProps) {
  const handleImprimir = () => {
    window.print();
  };

  const formatearFecha = (fecha: string | Date) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // Validación básica
  if (!informe) {
    return <div className="p-8 text-center text-red-500">No hay datos del informe</div>;
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
      {/* Botón de imprimir - solo visible en pantalla */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={handleImprimir}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          aria-label="Imprimir informe"
        >
          Imprimir Informe
        </button>
      </div>

      {/* Contenido del Informe */}
      <div className="border-2 border-gray-800 p-8 print:border-0 print:p-0">
        {/* Encabezado */}
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold">{informe.nombre_hospital}</h1>
          <h2 className="text-xl font-semibold mt-2">{informe.titulo_informe}</h2>
        </div>

        {/* Información del Paciente */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b pb-1">
            DATOS DEL PACIENTE
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Nombre:</strong> {informe.info_paciente.nombre}</p>
              <p><strong>ID:</strong> {informe.info_paciente.id}</p>
            </div>
            <div>
              <p><strong>Edad:</strong> {informe.info_paciente.edad} años</p>
              <p><strong>Género:</strong> {informe.info_paciente.genero}</p>
            </div>
          </div>
        </section>

        {/* Información del Episodio */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b pb-1">
            INFORMACIÓN DEL EPISODIO
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Fecha de Ingreso:</strong> {formatearFecha(informe.info_episodio.fecha_ingreso)}</p>
              <p><strong>Fecha de Alta:</strong> {formatearFecha(informe.info_episodio.fecha_alta)}</p>
            </div>
            <div>
              <p><strong>Días de Estancia:</strong> {informe.info_episodio.dias_estancia}</p>
              <p><strong>Médico Tratante:</strong> {informe.info_episodio.medico_tratante}</p>
              <p><strong>Departamento:</strong> {informe.info_episodio.departamento}</p>
            </div>
          </div>
        </section>

        {/* Información Clínica */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b pb-1">
            INFORMACIÓN CLÍNICA
          </h3>
          
          <div className="mb-4">
            <p><strong>Motivo de Ingreso:</strong></p>
            <p className="ml-4 whitespace-pre-line">{informe.info_clinica.motivo_ingreso}</p>
          </div>

          <div className="mb-4">
            <p><strong>Diagnóstico Inicial:</strong></p>
            <p className="ml-4 whitespace-pre-line">{informe.info_clinica.diagnostico_inicial}</p>
          </div>

          <div className="mb-4">
            <p><strong>Diagnóstico Final:</strong></p>
            <p className="ml-4 whitespace-pre-line">{informe.info_clinica.diagnostico_final}</p>
          </div>

          <div className="mb-4">
            <p><strong>Evolución Hospitalaria:</strong></p>
            <p className="ml-4 whitespace-pre-line">{informe.info_clinica.evolucion_hospitalaria}</p>
          </div>

          {informe.info_clinica.procedimientos_realizados?.length > 0 && (
            <div className="mb-4">
              <p><strong>Procedimientos Realizados:</strong></p>
              <ul className="ml-8 list-disc">
                {informe.info_clinica.procedimientos_realizados.map((proc, index) => (
                  <li key={index}>
                    {proc.tipo} - {proc.descripcion} - {formatearFecha(proc.fecha)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4">
            <p><strong>Condición al Alta:</strong> {informe.info_clinica.condicion_alta}</p>
          </div>

          {informe.info_clinica.medicamentos_alta?.length > 0 && (
            <div className="mb-4">
              <p><strong>Medicamentos al Alta:</strong></p>
              <ul className="ml-8 list-disc">
                {informe.info_clinica.medicamentos_alta.map((med, index) => (
                  <li key={index}>{med}</li>
                ))}
              </ul>
            </div>
          )}

          {informe.info_clinica.instrucciones_seguimiento && (
            <div className="mb-4">
              <p><strong>Instrucciones de Seguimiento:</strong></p>
              <p className="ml-4 whitespace-pre-line">{informe.info_clinica.instrucciones_seguimiento}</p>
            </div>
          )}
        </section>

        {/* Firma */}
        <div className="mt-12 text-center">
          <div className="border-t border-black w-64 mx-auto pt-2">
            <p>Firma del Médico Tratante</p>
            <p className="font-semibold">{informe.info_episodio.medico_tratante}</p>
          </div>
        </div>

        {/* Pie de página */}
        <footer className="mt-8 text-center text-sm text-gray-600">
          <p>Informe generado el {formatearFecha(new Date())}</p>
        </footer>
      </div>
    </div>
  );
}