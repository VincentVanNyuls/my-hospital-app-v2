// src/app/components/SelectPacienteSimple.tsx (VERSIÓN COMPLETA TODO EN UNO)
'use client';
import { useState, useEffect } from 'react';

// Interfaces locales - TODO EN UNO
interface PacienteLocal {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  DNI_NIE?: string;
  SIP?: string;
  NumHistoriaClinica?: string;
  alergias: string[];
  medicamentos: string[];
  enfermedadesCronicas: string[];
  genero: string;
  email: string;
  fechaNacimiento: string;
}

interface SelectPacienteSimpleProps {
  onPacienteSelect: (paciente: PacienteLocal) => void;
  value?: string;
}

// Servicio local - TODO EN UNO
class PacienteServiceLocal {
  private storageKey = 'pacientes';

  getPacientes(): PacienteLocal[] {
    if (typeof window === 'undefined') return [];
    const pacientes = localStorage.getItem(this.storageKey);
    return pacientes ? JSON.parse(pacientes) : [];
  }

  getPacienteById(id: string): PacienteLocal | null {
    const pacientes = this.getPacientes();
    return pacientes.find(p => p.id === id) || null;
  }

  buscarPacientes(termino: string): PacienteLocal[] {
    const pacientes = this.getPacientes();
    const terminoLower = termino.toLowerCase();
    
    return pacientes.filter(paciente =>
      paciente.nombre.toLowerCase().includes(terminoLower) ||
      paciente.apellido.toLowerCase().includes(terminoLower) ||
      paciente.id.toLowerCase().includes(terminoLower) ||
      (paciente.DNI_NIE && paciente.DNI_NIE.toLowerCase().includes(terminoLower)) ||
      (paciente.SIP && paciente.SIP.includes(termino)) ||
      (paciente.NumHistoriaClinica && paciente.NumHistoriaClinica.includes(termino))
    );
  }
}

const pacienteService = new PacienteServiceLocal();

export default function SelectPacienteSimple({ onPacienteSelect, value }: SelectPacienteSimpleProps) {
  const [pacientes, setPacientes] = useState<PacienteLocal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarLista, setMostrarLista] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteLocal | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPacientes();
  }, []);

  useEffect(() => {
    if (value) {
      const paciente = pacienteService.getPacienteById(value);
      if (paciente) {
        setPacienteSeleccionado(paciente);
        setBusqueda(`${paciente.nombre} ${paciente.apellido}`);
      }
    }
  }, [value]);

  const cargarPacientes = () => {
    try {
      const todosPacientes = pacienteService.getPacientes();
      setPacientes(todosPacientes);
      setCargando(false);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      setCargando(false);
    }
  };

  const pacientesFiltrados = pacientes.filter(paciente =>
    `${paciente.nombre} ${paciente.apellido} ${paciente.DNI_NIE || ''} ${paciente.SIP || ''} ${paciente.id}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  ).slice(0, 10);

  const handlePacienteClick = (paciente: PacienteLocal) => {
    setPacienteSeleccionado(paciente);
    setBusqueda(`${paciente.nombre} ${paciente.apellido}`);
    setMostrarLista(false);
    onPacienteSelect(paciente);
  };

  const limpiarSeleccion = () => {
    setPacienteSeleccionado(null);
    setBusqueda('');
    setMostrarLista(true);
    onPacienteSelect(null as any);
  };

  if (cargando) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        <div className="text-sm text-gray-500 text-center">Cargando pacientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Campo de búsqueda */}
      <div className="relative">
        <label className="block text-sm font-medium mb-1">Buscar Paciente *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setMostrarLista(true);
            }}
            onFocus={() => setMostrarLista(true)}
            placeholder="Buscar por nombre, apellido, DNI, SIP o ID..."
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {pacienteSeleccionado && (
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="bg-red-500 text-white px-3 rounded hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Lista de resultados */}
        {mostrarLista && pacientesFiltrados.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {pacientesFiltrados.map(paciente => (
              <div
                key={paciente.id}
                onClick={() => handlePacienteClick(paciente)}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
              >
                <div className="font-semibold text-gray-900">
                  {paciente.nombre} {paciente.apellido}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {paciente.DNI_NIE && <span className="font-medium">DNI: {paciente.DNI_NIE} | </span>}
                  {paciente.SIP && <span className="font-medium">SIP: {paciente.SIP} | </span>}
                  <span>Tel: {paciente.telefono}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <span>ID: {paciente.id}</span>
                  {paciente.NumHistoriaClinica && <span> | HC: {paciente.NumHistoriaClinica}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje sin resultados */}
        {mostrarLista && busqueda && pacientesFiltrados.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
            No se encontraron pacientes con "{busqueda}"
          </div>
        )}
      </div>

      {/* Información del paciente seleccionado */}
      {pacienteSeleccionado && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-green-800">✅ Paciente Seleccionado</h4>
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Cambiar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
            <div>
              <strong>Nombre completo:</strong> {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
            </div>
            <div>
              <strong>ID:</strong> {pacienteSeleccionado.id}
            </div>
            {pacienteSeleccionado.DNI_NIE && (
              <div>
                <strong>DNI/NIE:</strong> {pacienteSeleccionado.DNI_NIE}
              </div>
            )}
            {pacienteSeleccionado.SIP && (
              <div>
                <strong>SIP:</strong> {pacienteSeleccionado.SIP}
              </div>
            )}
            <div>
              <strong>Teléfono:</strong> {pacienteSeleccionado.telefono}
            </div>
            {pacienteSeleccionado.NumHistoriaClinica && (
              <div>
                <strong>Historia Clínica:</strong> {pacienteSeleccionado.NumHistoriaClinica}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información del sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-700">
          <strong>Total de pacientes en sistema:</strong> {pacientes.length}
          {busqueda && (
            <span className="ml-2">
              • <strong>Encontrados:</strong> {pacientesFiltrados.length}
            </span>
          )}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          💡 <strong>Consejo:</strong> Busca por nombre, apellidos, DNI, SIP o ID del paciente
        </div>
      </div>
    </div>
  );
}
// Al final de SelectPacienteSimple.tsx, fuera del componente
// Datos de prueba temporales
if (typeof window !== 'undefined') {
  const pacientesExistentes = new PacienteServiceLocal().getPacientes();
  if (pacientesExistentes.length === 0) {
    const pacientesPrueba: PacienteLocal[] = [
      {
        id: 'PAC-001',
        nombre: 'María',
        apellido: 'García López',
        telefono: '600123456',
        DNI_NIE: '12345678A',
        SIP: '1234567890',
        NumHistoriaClinica: 'HC-001',
        alergias: ['Penicilina', 'Mariscos'],
        medicamentos: ['Enalapril 20mg'],
        enfermedadesCronicas: ['Hipertensión'],
        genero: 'Femenino',
        email: 'maria.garcia@email.com',
        fechaNacimiento: '1985-03-15'
      },
      {
        id: 'PAC-002',
        nombre: 'Carlos',
        apellido: 'Rodríguez Martín', 
        telefono: '600987654',
        DNI_NIE: '87654321B',
        SIP: '0987654321',
        NumHistoriaClinica: 'HC-002',
        alergias: [],
        medicamentos: ['Metformina 850mg'],
        enfermedadesCronicas: ['Diabetes tipo 2'],
        genero: 'Masculino',
        email: 'carlos.rodriguez@email.com',
        fechaNacimiento: '1978-07-22'
      }
    ];
    
    localStorage.setItem('pacientes', JSON.stringify(pacientesPrueba));
    console.log('Datos de prueba cargados');
  }
}