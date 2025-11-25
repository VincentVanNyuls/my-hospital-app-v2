'use client';

import { useState } from 'react';
import PatientSelector from '../../components/PatientSelector';
import { HospitalizacionService } from '../../utils/hospitalizacionService';
import { useRouter } from 'next/navigation';
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
    } else {
      setPacienteSeleccionado(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 === INICIANDO ADMISIÓN REAL ===');
    
    // Validaciones
    if (!pacienteSeleccionado) {
      alert('❌ Por favor selecciona un paciente');
      return;
    }

    const camposRequeridos = ['medico_tratante', 'departamento', 'motivo_ingreso', 'diagnostico_inicial', 'habitacion', 'cama'];
    const camposVacios = camposRequeridos.filter(campo => !formData[campo as keyof typeof formData]);
    
    if (camposVacios.length > 0) {
      alert(`❌ Por favor completa todos los campos requeridos: ${camposVacios.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🟡 Creando datos de episodio...');
      
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

      console.log('📦 Enviando a Firestore:', datosEpisodio);

      // ✅ LLAMADA REAL AL SERVICIO
      const nuevoEpisodio = await hospitalizacionService.admitirPaciente(datosEpisodio);

      console.log('✅ Respuesta de Firestore:', nuevoEpisodio);

      if (!nuevoEpisodio) {
        throw new Error('No se recibió respuesta de Firestore');
      }

      const episodioId = nuevoEpisodio.id;
      
      if (!episodioId) {
        console.error('❌ No ID en respuesta:', nuevoEpisodio);
        throw new Error('No se pudo obtener el ID del episodio creado');
      }

      console.log('🎯 Episodio creado con ID:', episodioId);
      
      // ✅ REDIRECCIÓN
      const rutaDestino = `/hospitalizacion/episodios/${episodioId}`;
      console.log('🔄 Redirigiendo a:', rutaDestino);
      
      // Redirección con pequeño delay para estabilidad
      setTimeout(() => {
        router.push(rutaDestino);
        console.log('✅ Redirección ejecutada');
      }, 100);
      
    } catch (error) {
      console.error('❌ ERROR en admisión:', error);
      
      let mensajeError = 'Error al admitir paciente';
      if (error instanceof Error) {
        mensajeError += `: ${error.message}`;
      }
      
      alert(mensajeError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ✅ SOLO este contenedor - ELIMINA los duplicados
    <div className="admision-content">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Admisión de Pacientes</h1>
        <p>Registrar nuevo ingreso hospitalario</p>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-2">
          <div className="content-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Paso 1: Selección de Paciente */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Seleccionar Paciente</h2>
                </div>
                
                <PatientSelector onPatientSelect={handlePatientSelect} />
                
                {pacienteSeleccionado && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-green-600 text-xl">✅</div>
                      <div>
                        <p className="font-semibold text-green-800 text-lg">
                          {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-green-600 mt-1">
                          <span>ID: {pacienteSeleccionado.id}</span>
                          {pacienteSeleccionado.DNI_NIE && <span>DNI: {pacienteSeleccionado.DNI_NIE}</span>}
                          {pacienteSeleccionado.SIP && <span>SIP: {pacienteSeleccionado.SIP}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Paso 2: Datos de Admisión */}
              {pacienteSeleccionado && (
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Datos de Admisión</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Médico Tratante */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Médico Tratante *
                      </label>
                      <input
                        type="text"
                        value={formData.medico_tratante}
                        onChange={(e) => setFormData({...formData, medico_tratante: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Departamento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento *
                      </label>
                      <select
                        value={formData.departamento}
                        onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                    {/* Habitación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Habitación *
                      </label>
                      <input
                        type="text"
                        value={formData.habitacion}
                        onChange={(e) => setFormData({...formData, habitacion: e.target.value})}
                        placeholder="Ej: 201"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Cama */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cama *
                      </label>
                      <input
                        type="text"
                        value={formData.cama}
                        onChange={(e) => setFormData({...formData, cama: e.target.value})}
                        placeholder="Ej: A"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Motivo de Ingreso */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo de Ingreso *
                      </label>
                      <textarea
                        value={formData.motivo_ingreso}
                        onChange={(e) => setFormData({...formData, motivo_ingreso: e.target.value})}
                        placeholder="Describa el motivo del ingreso hospitalario..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                      />
                    </div>

                    {/* Diagnóstico Inicial */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diagnóstico Inicial *
                      </label>
                      <input
                        type="text"
                        value={formData.diagnostico_inicial}
                        onChange={(e) => setFormData({...formData, diagnostico_inicial: e.target.value})}
                        placeholder="Ej: Sospecha de infección bacteriana"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Botón de Envío */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed font-medium text-lg w-full"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Admitiendo Paciente...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          ✅ Admitir Paciente
                        </span>
                      )}
                    </button>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      El paciente será ingresado y redirigido a la página de detalles del episodio.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar - Información y Ayuda */}
        <div className="space-y-6">
          {/* Información del Proceso */}
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Proceso de Admisión</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Seleccionar Paciente</p>
                  <p className="text-sm text-gray-600">Busca y selecciona un paciente existente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">Completar Datos</p>
                  <p className="text-sm text-gray-600">Ingresa la información de admisión</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">Confirmar Ingreso</p>
                  <p className="text-sm text-gray-600">El paciente será admitido al sistema</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información Importante */}
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">⚠️ Información Importante</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Verifica que el paciente no tenga episodios activos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>Completa todos los campos obligatorios (*)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Asigna habitación y cama disponibles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>El diagnóstico puede actualizarse posteriormente</span>
              </li>
            </ul>
          </div>

          {/* Departamentos Disponibles */}
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🏥 Departamentos</h3>
            <div className="space-y-2 text-sm">
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
                <div key={depto} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">{depto}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🚀 Acciones Rápidas</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/pacientes')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-left"
              >
                👥 Gestionar Pacientes
              </button>
              <button
                onClick={() => router.push('/hospitalizacion/episodios')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium text-left"
              >
                📋 Ver Episodios
              </button>
              <button
                onClick={() => router.push('/hospitalizacion')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium text-left"
              >
                🏠 Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}