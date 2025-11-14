// my-hospital-app/src/app/urgencias/page.tsx
"use client"; // Esta directiva es crucial y DEBE ir al principio del archivo.

import { useEffect, useState, useCallback } from 'react'; // Agregamos useCallback
import { db } from '../utils/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../utils/AuthContext';
import { useRouter } from 'next/navigation';

// Interfaz para los datos de urgencia
interface UrgenciaData {
  id: string;
  Nombre: string;
  Diagnóstico: string;
  Fecha: Timestamp;
  creadoPor?: string;
  creadoEn: Timestamp;
}

// Interfaz para el formulario de nueva urgencia
interface NuevaUrgenciaFormData {
  patientName: string;
  diagnosis: string;
  date: string;
}

// Definición del componente principal de la página de Urgencias
export default function UrgenciasPage() {
  // --------------------------------------------------------------------------------
  // --- DECLARACIÓN DE ESTADOS Y HOOKS ---
  // --------------------------------------------------------------------------------

  const [urgencias, setUrgencias] = useState<UrgenciaData[]>([]);
  const [loadingUrgencias, setLoadingUrgencias] = useState(true);
  const [errorUrgencias, setErrorUrgencias] = useState<string | null>(null);

  // Estado unificado para el formulario de nueva urgencia
  const [formData, setFormData] = useState<NuevaUrgenciaFormData>({
    patientName: '',
    diagnosis: '',
    date: ''
  });
  const [submittingUrgencia, setSubmittingUrgencia] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();

  // --------------------------------------------------------------------------------
  // --- EFECTOS Y LÓGICA DE PROTECCIÓN DE RUTA ---
  // --------------------------------------------------------------------------------

  // Protección de ruta: si no está logueado, redirige al login
  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  // --------------------------------------------------------------------------------
  // --- FUNCIONES ASÍNCRONAS Y MANEJADORES ---
  // --------------------------------------------------------------------------------

  // Función para cargar las urgencias desde Firestore
  const fetchUrgencias = useCallback(async () => {
    if (!loadingAuth && user) {
      try {
        setLoadingUrgencias(true);
        setErrorUrgencias(null);
        const querySnapshot = await getDocs(collection(db, "urgencias"));
        const urgenciasList: UrgenciaData[] = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data()
        } as UrgenciaData));
        setUrgencias(urgenciasList);
      } catch (err: unknown) {
        console.error("Error al cargar urgencias:", err);
        
        // Manejo seguro del error
        if (err instanceof Error) {
          setErrorUrgencias(`No se pudieron cargar las urgencias: ${err.message}`);
        } else {
          setErrorUrgencias("No se pudieron cargar las urgencias debido a un error desconocido.");
        }
      } finally {
        setLoadingUrgencias(false);
      }
    } else if (!loadingAuth && !user) {
      setLoadingUrgencias(false);
    }
  }, [user, loadingAuth]);

  // useEffect para llamar a la función de carga cuando el usuario o el estado de autenticación cambian
  useEffect(() => {
    fetchUrgencias();
  }, [fetchUrgencias]);

  // Manejador de cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Función para añadir una nueva urgencia a Firestore
  const handleAddUrgencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSubmitError("Debes iniciar sesión para añadir urgencias.");
      return;
    }
    if (!formData.patientName || !formData.diagnosis || !formData.date) {
      setSubmitError("Por favor, rellena todos los campos.");
      return;
    }

    setSubmittingUrgencia(true);
    setSubmitError(null);

    try {
      // Convertir la fecha de string a objeto Timestamp de Firestore
      const dateObj = new Date(formData.date);
      const firestoreTimestamp = Timestamp.fromDate(dateObj);

      await addDoc(collection(db, "urgencias"), {
        Nombre: formData.patientName,
        Diagnóstico: formData.diagnosis,
        Fecha: firestoreTimestamp, // Guardar como Timestamp
        creadoPor: user.email,     // Opcional: podrías guardar quién creó la urgencia
        creadoEn: Timestamp.now()
      });

      // Limpiar formulario
      setFormData({
        patientName: '',
        diagnosis: '',
        date: ''
      });

      // Recargar la lista de urgencias para que la nueva aparezca
      await fetchUrgencias();
      alert('¡Urgencia añadida exitosamente!');

    } catch (err: unknown) {
      console.error("Error al añadir urgencia:", err);
      
      // Manejo seguro del error
      if (err instanceof Error) {
        setSubmitError(`Error al añadir urgencia: ${err.message}`);
      } else {
        setSubmitError('Ocurrió un error desconocido al añadir la urgencia');
      }
    } finally {
      setSubmittingUrgencia(false);
    }
  };

  // --------------------------------------------------------------------------------
  // --- RENDERIZADO CONDICIONAL DEL COMPONENTE ---
  // --------------------------------------------------------------------------------

  // Renderizado condicional basado en el estado de autenticación (protección UI)
  if (loadingAuth || !user) {
    return <p>Cargando Urgencias...</p>;
  }

  const { patientName, diagnosis, date } = formData;

  // Renderizado del componente si el usuario está autenticado y los datos de urgencia están cargados
  return (
    <div>
      <h1>Gestión de Urgencias</h1>

      <button onClick={() => router.push('/home')}>Volver al Menú Principal</button>

      {/* Formulario para añadir nueva urgencia */}
      <h2 style={{ marginTop: '20px' }}>Añadir Nueva Urgencia</h2>
      <form onSubmit={handleAddUrgencia}>
        <div>
          <label htmlFor="patientName">Nombre del Paciente:</label>
          <input
            type="text"
            id="patientName"
            value={patientName}
            onChange={handleInputChange}
            required
            disabled={submittingUrgencia}
          />
        </div>
        <div>
          <label htmlFor="diagnosis">Diagnóstico:</label>
          <input
            type="text"
            id="diagnosis"
            value={diagnosis}
            onChange={handleInputChange}
            required
            disabled={submittingUrgencia}
          />
        </div>
        <div>
          <label htmlFor="date">Fecha:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={handleInputChange}
            required
            disabled={submittingUrgencia}
          />
        </div>
        <button type="submit" disabled={submittingUrgencia}>
          {submittingUrgencia ? 'Añadiendo...' : 'Añadir Urgencia'}
        </button>
        {submitError && <p style={{ color: 'red' }}>Error: {submitError}</p>}
      </form>

      {/* Lista de Urgencias Existentes */}
      <h2 style={{ marginTop: '30px' }}>Urgencias Activas:</h2>
      {loadingUrgencias ? (
        <p>Cargando información de urgencias...</p>
      ) : errorUrgencias ? (
        <p style={{ color: 'red' }}>Error: {errorUrgencias}</p>
      ) : urgencias.length === 0 ? (
        <p>No hay urgencias registradas en Firebase Firestore. ¡Añade algunas usando el formulario de arriba!</p>
      ) : (
        <ul>
          {urgencias.map((urgencia) => (
            <li key={urgencia.id}>
              <strong>Paciente: {urgencia.Nombre || "Desconocido"}</strong> -
              Diagnóstico: {urgencia.Diagnóstico || "N/A"} -
              Fecha: {urgencia.Fecha ? new Date(urgencia.Fecha.seconds * 1000).toLocaleDateString() : "N/A"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}