// my-hospital-app/src/app/pacientes/edit/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../utils/AuthContext';
import { db } from '../../../utils/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

// ✅ ELIMINADA: Función convertToFirestoreTimestamp no utilizada

// Interfaz para los datos del paciente
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

// Interfaz para el formulario de edición
interface PacienteFormData {
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2: string;
  DNI_NIE: string;
  FechaNacimiento: string;
  Sexo: string;
  SIP: string;
  NumSeguridadSocial: string;
  NumHistoriaClinica: string;
  Direccion: string;
  CodigoPostal: string;
  Telefono: string;
}

export default function EditPacientePage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const params = useParams(); // Hook para obtener los parámetros de la URL
  const pacienteId = params.id as string; // Obtenemos el ID del paciente de la URL

  // --- ESTADOS DEL FORMULARIO DE EDICIÓN DE PACIENTES ---
  const [paciente, setPaciente] = useState<PacienteData | null>(null);
  const [loadingPaciente, setLoadingPaciente] = useState(true);

  // Estado unificado del formulario
  const [formData, setFormData] = useState<PacienteFormData>({
    Id_paciente: '',
    Nombre: '',
    Apellido1: '',
    Apellido2: '',
    DNI_NIE: '',
    FechaNacimiento: '',
    Sexo: '',
    SIP: '',
    NumSeguridadSocial: '',
    NumHistoriaClinica: '',
    Direccion: '',
    CodigoPostal: '',
    Telefono: ''
  });

  const [submittingPaciente, setSubmittingPaciente] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // --- PROTECCIÓN DE RUTA ---
  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  // --- MANEJADOR DE CAMBIOS EN EL FORMULARIO ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // --- CARGAR DATOS DEL PACIENTE AL MONTAR EL COMPONENTE ---
  useEffect(() => {
    if (!pacienteId || loadingAuth || !user) return;

    const fetchPacienteData = async () => {
      setLoadingPaciente(true);
      try {
        const docRef = doc(db, "pacientes", pacienteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<PacienteData, 'id'>;
          setPaciente({ id: docSnap.id, ...data });

          // Formatear Timestamp a 'YYYY-MM-DD' para input type="date"
          const fechaNacDate = data.FechaNacimiento instanceof Timestamp ? data.FechaNacimiento.toDate() : new Date();
          const formattedDate = fechaNacDate.toISOString().split('T')[0];

          // Rellenar el formulario con los datos del paciente
          setFormData({
            Id_paciente: data.Id_paciente,
            Nombre: data.Nombre,
            Apellido1: data.Apellido1,
            Apellido2: data.Apellido2 || '',
            DNI_NIE: data.DNI_NIE,
            FechaNacimiento: formattedDate,
            Sexo: data.Sexo,
            SIP: data.SIP || '',
            NumSeguridadSocial: data.NumSeguridadSocial || '',
            NumHistoriaClinica: data.NumHistoriaClinica,
            Direccion: data.Direccion || '',
            CodigoPostal: data.CodigoPostal || '',
            Telefono: data.Telefono || ''
          });

        } else {
          console.error("No se encontró el paciente.");
          setSubmitError("No se pudo cargar el paciente. ID no encontrado.");
        }
      } catch (err: unknown) {
        console.error("Error al cargar datos del paciente:", err);
        
        if (err instanceof Error) {
          setSubmitError(`Error al cargar datos del paciente: ${err.message}`);
        } else {
          setSubmitError('Ocurrió un error desconocido al cargar los datos del paciente');
        }
      } finally {
        setLoadingPaciente(false);
      }
    };

    fetchPacienteData();
  }, [pacienteId, user, loadingAuth]);

  // --- MANEJADOR PARA GUARDAR CAMBIOS DEL PACIENTE ---
  const handleUpdatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user || !pacienteId) {
      setSubmitError("No se puede actualizar sin usuario autenticado o ID de paciente.");
      return;
    }

    // Validación básica de campos requeridos
    if (!formData.Id_paciente || !formData.Nombre || !formData.Apellido1 || !formData.DNI_NIE || !formData.FechaNacimiento || !formData.Sexo || !formData.NumHistoriaClinica) {
      setSubmitError("Por favor, rellena todos los campos requeridos (*).");
      return;
    }

    setSubmittingPaciente(true);

    try {
      const pacientesRef = collection(db, "pacientes");

      // --- VERIFICAR UNICIDAD DE DNI/NIE Y NUM_HISTORIA_CLINICA (excepto para el paciente actual) ---
      // Verificación DNI/NIE
      const qDNI_NIE = query(pacientesRef, where("DNI_NIE", "==", formData.DNI_NIE));
      const dniSnapshot = await getDocs(qDNI_NIE);
      if (!dniSnapshot.empty && dniSnapshot.docs[0].id !== pacienteId) {
        setSubmitError("Error: El DNI/NIE ya pertenece a otro paciente.");
        setSubmittingPaciente(false);
        return;
      }

      // Verificación NumHistoriaClinica
      const qNumHistoriaClinica = query(pacientesRef, where("NumHistoriaClinica", "==", formData.NumHistoriaClinica));
      const numHistoriaClinicaSnapshot = await getDocs(qNumHistoriaClinica);
      if (!numHistoriaClinicaSnapshot.empty && numHistoriaClinicaSnapshot.docs[0].id !== pacienteId) {
        setSubmitError("Error: El Número de Historia Clínica ya pertenece a otro paciente.");
        setSubmittingPaciente(false);
        return;
      }

      // Convertir la fecha de string a Timestamp
      const fechaNacimientoTimestamp = Timestamp.fromDate(new Date(formData.FechaNacimiento));

      // Crear objeto con solo propiedades definidas (Firestore no acepta undefined)
      const updatedPatientData: Record<string, unknown> = {
        Id_paciente: formData.Id_paciente,
        Nombre: formData.Nombre,
        Apellido1: formData.Apellido1,
        DNI_NIE: formData.DNI_NIE,
        FechaNacimiento: fechaNacimientoTimestamp,
        Sexo: formData.Sexo,
        NumHistoriaClinica: formData.NumHistoriaClinica,
      };

      // Agregar campos opcionales solo si tienen valor, eliminar si están vacíos
      if (formData.Apellido2.trim()) {
        updatedPatientData.Apellido2 = formData.Apellido2;
      } else {
        updatedPatientData.Apellido2 = null;
      }
      
      if (formData.SIP.trim()) {
        updatedPatientData.SIP = formData.SIP;
      } else {
        updatedPatientData.SIP = null;
      }
      
      if (formData.NumSeguridadSocial.trim()) {
        updatedPatientData.NumSeguridadSocial = formData.NumSeguridadSocial;
      } else {
        updatedPatientData.NumSeguridadSocial = null;
      }
      
      if (formData.Direccion.trim()) {
        updatedPatientData.Direccion = formData.Direccion;
      } else {
        updatedPatientData.Direccion = null;
      }
      
      if (formData.CodigoPostal.trim()) {
        updatedPatientData.CodigoPostal = formData.CodigoPostal;
      } else {
        updatedPatientData.CodigoPostal = null;
      }
      
      if (formData.Telefono.trim()) {
        updatedPatientData.Telefono = formData.Telefono;
      } else {
        updatedPatientData.Telefono = null;
      }

      // Referencia al documento del paciente
      const docRef = doc(db, "pacientes", pacienteId);
      await updateDoc(docRef, updatedPatientData);
      
      setSubmitSuccess("Paciente actualizado exitosamente.");

    } catch (err: unknown) {
      console.error("Error al actualizar paciente:", err);
      
      if (err instanceof Error) {
        setSubmitError(`Error al actualizar paciente: ${err.message}`);
      } else {
        setSubmitError('Ocurrió un error desconocido al actualizar el paciente');
      }
    } finally {
      setSubmittingPaciente(false);
    }
  };

  // --- RENDERIZADO ---
  if (loadingAuth || !user || loadingPaciente) {
    return <p>Cargando datos del paciente...</p>;
  }

  if (submitError && submitError.includes("ID no encontrado") && !loadingPaciente) {
    return (
      <div className="pacientes-container">
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{submitError}</p>
        <button onClick={() => router.push('/pacientes')}>Volver a Búsqueda de Pacientes</button>
      </div>
    );
  }
  
  const {
    Id_paciente,
    Nombre,
    Apellido1,
    Apellido2,
    DNI_NIE,
    FechaNacimiento,
    Sexo,
    SIP,
    NumSeguridadSocial,
    NumHistoriaClinica,
    Direccion,
    CodigoPostal,
    Telefono
  } = formData;

  return (
    <div className="pacientes-container">
      <h1>Editar Paciente: {paciente?.Nombre} {paciente?.Apellido1}</h1>
      <button onClick={() => router.push('/pacientes/list')} style={{ marginBottom: '20px', marginRight: '10px' }}>Volver al Listado</button>
      <button onClick={() => router.push('/pacientes')} style={{ marginBottom: '20px' }}>Volver a Búsqueda</button>

      <div style={{ flex: 1 }}>
        <form onSubmit={handleUpdatePaciente}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="Id_paciente">ID Paciente (*):</label>
              <input type="text" id="Id_paciente" value={Id_paciente} onChange={handleInputChange} required disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="Nombre">Nombre (*):</label>
              <input type="text" id="Nombre" value={Nombre} onChange={handleInputChange} required disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="Apellido1">Apellido 1 (*):</label>
              <input type="text" id="Apellido1" value={Apellido1} onChange={handleInputChange} required disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="Apellido2">Apellido 2:</label>
              <input type="text" id="Apellido2" value={Apellido2} onChange={handleInputChange} disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="DNI_NIE">DNI/NIE (*):</label>
              <input type="text" id="DNI_NIE" value={DNI_NIE} onChange={handleInputChange} required disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="FechaNacimiento">Fecha Nacimiento (*):</label>
              <input type="date" id="FechaNacimiento" value={FechaNacimiento} onChange={handleInputChange} required disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="Sexo">Sexo (*):</label>
              <select id="Sexo" value={Sexo} onChange={handleInputChange} required disabled={submittingPaciente}>
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="SIP">SIP:</label>
              <input type="text" id="SIP" value={SIP} onChange={handleInputChange} disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="NumSeguridadSocial">Nº Seguridad Social:</label>
              <input type="text" id="NumSeguridadSocial" value={NumSeguridadSocial} onChange={handleInputChange} disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="NumHistoriaClinica">Nº Historia Clínica (*):</label>
              <input type="text" id="NumHistoriaClinica" value={NumHistoriaClinica} onChange={handleInputChange} required disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="Direccion">Dirección:</label>
              <input type="text" id="Direccion" value={Direccion} onChange={handleInputChange} disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="CodigoPostal">Código Postal:</label>
              <input type="text" id="CodigoPostal" value={CodigoPostal} onChange={handleInputChange} disabled={submittingPaciente} />
            </div>
            <div>
              <label htmlFor="Telefono">Teléfono:</label>
              <input type="text" id="Telefono" value={Telefono} onChange={handleInputChange} disabled={submittingPaciente} />
            </div>
          </div>
          <button type="submit" disabled={submittingPaciente} style={{ marginTop: '20px' }}>
            {submittingPaciente ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          {submitError && <p style={{ color: 'red', marginTop: '10px' }}>Error: {submitError}</p>}
          {submitSuccess && <p style={{ color: 'green', marginTop: '10px' }}>{submitSuccess}</p>}
        </form>
      </div>
    </div>
  );
}