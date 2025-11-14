// my-hospital-app/src/app/pacientes/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Interfaz para los datos del paciente (debe coincidir con la definida en pacientes/create/page.tsx)
interface PacienteData {
  id?: string;
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  DNI_NIE: string;
  FechaNacimiento: Timestamp;
  Sexo: string;
  SIP?: string;
  NumSeguridadSocial?: string;
  NumHistoriaClinica: string;
  Direccion?: string;
  CodigoPostal?: string;
  Telefono?: string;
  creadoPor: string;
  creadoEn: Timestamp;
}

export default function PacientesPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();

  // --- ESTADOS DEL BUSCADOR DE PACIENTES ---
  const [searchApellido1, setSearchApellido1] = useState('');
  const [searchDNI, setSearchDNI] = useState('');
  const [searchHistoriaClinica, setSearchHistoriaClinica] = useState('');
  const [searchResults, setSearchResults] = useState<PacienteData[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null); // Para habilitar el botón de editar

  // --- PROTECCIÓN DE RUTA ---
  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  // Cargar paciente seleccionado de localStorage al montar el componente
  useEffect(() => {
    const storedPatient = localStorage.getItem('selectedPatient');
    if (storedPatient) {
      try {
        const patient: PacienteData = JSON.parse(storedPatient);
        if (patient.id) {
          setSelectedPatientId(patient.id);
        }
      } catch (e) {
        console.error("Error parsing selected patient from localStorage", e);
        localStorage.removeItem('selectedPatient'); // Limpiar item corrupto
        setSelectedPatientId(null);
      }
    }
  }, []);

  // --- MANEJADOR PARA BUSCAR PACIENTES ---
  const handleSearchPaciente = async () => {
    setSearchError(null);
    setSearchResults([]);
    setSelectedPatientId(null); // Resetear selección al buscar
    localStorage.removeItem('selectedPatient'); // Limpiar selección previa

    if (!user) {
      setSearchError("Debes iniciar sesión para buscar pacientes.");
      return;
    }
    if (!searchApellido1.trim() && !searchDNI.trim() && !searchHistoriaClinica.trim()) {
      setSearchError("Por favor, introduce al menos un criterio de búsqueda (Apellido 1, DNI/NIE o Nº Historia Clínica).");
      return;
    }

    setSearching(true);
    try {
      const pacientesRef = collection(db, "pacientes");
      let q;

      if (searchDNI.trim()) {
        q = query(pacientesRef, where("DNI_NIE", "==", searchDNI.trim()));
      } else if (searchHistoriaClinica.trim()) {
        q = query(pacientesRef, where("NumHistoriaClinica", "==", searchHistoriaClinica.trim()));
      } else if (searchApellido1.trim()) {
        // En una aplicación real, para búsqueda por texto parcial ("starts with"),
        // Firestore requiere indexación específica y consultas más complejas.
        // Esto es una búsqueda exacta. Para "contiene", se usarían otras técnicas (ej. Algolia, full-text search).
        q = query(pacientesRef, where("Apellido1", "==", searchApellido1.trim()));
      } else {
        setSearchError("Criterio de búsqueda no válido.");
        setSearching(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      const results: PacienteData[] = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as Omit<PacienteData, 'id'>) 
      }));
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError("No se encontraron pacientes con los criterios especificados.");
      }

    } catch (err: unknown) {
      console.error("Error al buscar paciente:", err);
      
      // Manejo seguro del error
      if (err instanceof Error) {
        setSearchError(`Error al buscar paciente: ${err.message}`);
      } else {
        setSearchError('Ocurrió un error desconocido al buscar pacientes');
      }
    } finally {
      setSearching(false);
    }
  };

  // --- MANEJADOR PARA SELECCIONAR UN PACIENTE ---
  const handleSelectPaciente = (paciente: PacienteData) => {
    localStorage.setItem('selectedPatient', JSON.stringify(paciente));
    setSelectedPatientId(paciente.id || null); // Guarda el ID del paciente seleccionado para habilitar edición
    alert(`Paciente ${paciente.Nombre} ${paciente.Apellido1} (DNI: ${paciente.DNI_NIE}) seleccionado.`);
  };

  // --- MANEJADORES DE CAMBIO DE INPUT ---
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    switch (id) {
      case 'searchApellido1':
        setSearchApellido1(value);
        break;
      case 'searchDNI':
        setSearchDNI(value);
        break;
      case 'searchHistoriaClinica':
        setSearchHistoriaClinica(value);
        break;
      default:
        break;
    }
  };

  // --- RENDERIZADO ---
  if (loadingAuth || !user) {
    return <p>Cargando gestión de pacientes...</p>;
  }

  return (
    // Contenedor general más compacto y centrado
    <div className="pacientes-container" style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <h1>Gestión de Pacientes</h1>
      <button onClick={() => router.push('/home')} style={{ marginBottom: '15px' }}>Volver al Menú Principal</button> {/* Margen reducido */}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}> {/* Espaciado reducido */}
        {/* Sección de Búsqueda */}
        <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}> {/* Padding reducido */}
          <h2>Buscar Paciente</h2>
          {/* Grid más adaptable y espaciado reducido para los inputs de búsqueda */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
            <div>
              <label htmlFor="searchApellido1" style={{ fontSize: '0.9em' }}>Buscar por Apellido 1:</label>
              <input 
                type="text" 
                id="searchApellido1" 
                value={searchApellido1} 
                onChange={handleSearchInputChange} 
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label htmlFor="searchDNI" style={{ fontSize: '0.9em' }}>Buscar por DNI/NIE:</label>
              <input 
                type="text" 
                id="searchDNI" 
                value={searchDNI} 
                onChange={handleSearchInputChange} 
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label htmlFor="searchHistoriaClinica" style={{ fontSize: '0.9em' }}>Buscar por Nº Historia Clínica:</label>
              <input 
                type="text" 
                id="searchHistoriaClinica" 
                value={searchHistoriaClinica} 
                onChange={handleSearchInputChange} 
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} 
              />
            </div>
          </div>
          {/* Margen y espaciado reducido para los botones, flexWrap para pantallas pequeñas */}
          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button onClick={handleSearchPaciente} disabled={searching} style={{ padding: '8px 12px', fontSize: '0.9em' }}>
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
            <button onClick={() => router.push('/pacientes/create')} style={{ padding: '8px 12px', fontSize: '0.9em' }}>Crear Nuevo Paciente</button>
            <button onClick={() => router.push('/pacientes/list')} style={{ padding: '8px 12px', fontSize: '0.9em' }}>Ver Todos los Pacientes</button>
            <button 
              onClick={() => router.push(`/pacientes/edit/${selectedPatientId}`)} 
              disabled={!selectedPatientId} 
              style={{ padding: '8px 12px', fontSize: '0.9em' }}
            >
              Editar Paciente Seleccionado
            </button>
          </div>
          {searchError && <p style={{ color: 'red', marginTop: '10px', fontSize: '0.9em' }}>Error: {searchError}</p>}

          {/* Área de resultados de búsqueda con scroll interno y altura reducida */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: '15px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '5px' }}>
              <h3>Resultados de la Búsqueda:</h3>
              <ul>
                {searchResults.map((paciente) => (
                  <li key={paciente.id} style={{ marginBottom: '8px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '5px', backgroundColor: '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9em' }}> {/* Estilo más compacto */}
                    <div>
                      <strong>{paciente.Nombre} {paciente.Apellido1} {paciente.Apellido2}</strong><br/>
                      DNI: {paciente.DNI_NIE} | H.C.: {paciente.NumHistoriaClinica}
                    </div>
                    <button onClick={() => handleSelectPaciente(paciente)} style={{ marginLeft: '10px', backgroundColor: 'var(--success-color)', padding: '6px 10px', fontSize: '0.85em' }}>Seleccionar</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}