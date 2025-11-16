// my-hospital-app/src/app/pacientes/create/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import { db } from '../../utils/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

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
  SIP: string; // ✅ NUEVO CAMPO
  NumSeguridadSocial?: string;
  NumHistoriaClinica: string;
  Direccion?: string;
  CodigoPostal?: string;
  Telefono?: string;
  creadoPor: string;
  creadoEn: Timestamp;
}

// Interfaz para el formulario
interface PacienteFormData {
  Id_paciente: string;
  Nombre: string;
  Apellido1: string;
  Apellido2: string;
  DNI_NIE: string;
  FechaNacimiento: string;
  Sexo: string;
  SIP: string; // ✅ NUEVO CAMPO
  NumSeguridadSocial: string;
  NumHistoriaClinica: string;
  Direccion: string;
  CodigoPostal: string;
  Telefono: string;
}

export default function CreatePacientePage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();

  // --- ESTADO DEL FORMULARIO DE CREACIÓN DE PACIENTES ---
  const [formData, setFormData] = useState<PacienteFormData>({
    Id_paciente: '',
    Nombre: '',
    Apellido1: '',
    Apellido2: '',
    DNI_NIE: '',
    FechaNacimiento: '',
    Sexo: '',
    SIP: '', // ✅ NUEVO CAMPO
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

  // --- MANEJADOR PARA AÑADIR NUEVO PACIENTE ---
  const handleAddPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      setSubmitError("Debes iniciar sesión para añadir pacientes.");
      return;
    }

    // ✅ ACTUALIZADO: Validación que incluye SIP
    if (!formData.Id_paciente || !formData.Nombre || !formData.Apellido1 || !formData.DNI_NIE || !formData.FechaNacimiento || !formData.Sexo || !formData.SIP || !formData.NumHistoriaClinica) {
      setSubmitError("Por favor, rellena todos los campos requeridos (*).");
      return;
    }

    // ✅ NUEVA VALIDACIÓN: SIP debe tener 7 dígitos
    if (!/^\d{7}$/.test(formData.SIP)) {
      setSubmitError("El SIP debe tener exactamente 7 dígitos numéricos.");
      return;
    }

    setSubmittingPaciente(true);

    try {
      const pacientesRef = collection(db, "pacientes");

      // --- VERIFICAR UNICIDAD DE CAMPOS ---
      // Verificación Id_paciente
      const qIdPaciente = query(pacientesRef, where("Id_paciente", "==", formData.Id_paciente));
      const idPacienteSnapshot = await getDocs(qIdPaciente);
      if (!idPacienteSnapshot.empty) {
        setSubmitError("Error: El ID de paciente ya existe. Por favor, usa uno diferente.");
        setSubmittingPaciente(false);
        return;
      }

      // ✅ NUEVA VERIFICACIÓN: SIP único
      const qSIP = query(pacientesRef, where("SIP", "==", formData.SIP));
      const sipSnapshot = await getDocs(qSIP);
      if (!sipSnapshot.empty) {
        setSubmitError("Error: El SIP ya existe. Por favor, usa uno diferente.");
        setSubmittingPaciente(false);
        return;
      }

      // Verificación NumHistoriaClinica
      const qNumHistoriaClinica = query(pacientesRef, where("NumHistoriaClinica", "==", formData.NumHistoriaClinica));
      const numHistoriaClinicaSnapshot = await getDocs(qNumHistoriaClinica);
      if (!numHistoriaClinicaSnapshot.empty) {
        setSubmitError("Error: El Número de Historia Clínica ya existe. Por favor, usa uno diferente.");
        setSubmittingPaciente(false);
        return;
      }

      // Convertir la fecha de string a Timestamp
      const fechaNacimientoTimestamp = Timestamp.fromDate(new Date(formData.FechaNacimiento));

      // Crear objeto con solo propiedades definidas (Firestore no acepta undefined)
      const newPatientData: Partial<PacienteData> = {
        Id_paciente: formData.Id_paciente,
        Nombre: formData.Nombre,
        Apellido1: formData.Apellido1,
        DNI_NIE: formData.DNI_NIE,
        FechaNacimiento: fechaNacimientoTimestamp,
        Sexo: formData.Sexo,
        SIP: formData.SIP, // ✅ NUEVO CAMPO
        NumHistoriaClinica: formData.NumHistoriaClinica,
        creadoPor: user.email!,
        creadoEn: Timestamp.now(),
      };
      
      // Agregar campos opcionales solo si tienen valor
      if (formData.Apellido2) newPatientData.Apellido2 = formData.Apellido2;
      if (formData.NumSeguridadSocial) newPatientData.NumSeguridadSocial = formData.NumSeguridadSocial;
      if (formData.Direccion) newPatientData.Direccion = formData.Direccion;
      if (formData.CodigoPostal) newPatientData.CodigoPostal = formData.CodigoPostal;
      if (formData.Telefono) newPatientData.Telefono = formData.Telefono;

      await addDoc(pacientesRef, newPatientData);
      setSubmitSuccess("Paciente añadido exitosamente.");

      // Limpiar formulario
      setFormData({
        Id_paciente: '',
        Nombre: '',
        Apellido1: '',
        Apellido2: '',
        DNI_NIE: '',
        FechaNacimiento: '',
        Sexo: '',
        SIP: '', // ✅ NUEVO CAMPO
        NumSeguridadSocial: '',
        NumHistoriaClinica: '',
        Direccion: '',
        CodigoPostal: '',
        Telefono: ''
      });

    } catch (err: unknown) {
      console.error("Error al añadir paciente:", err);
      
      // Manejo seguro del error
      if (err instanceof Error) {
        setSubmitError(`Error al añadir paciente: ${err.message}`);
      } else {
        setSubmitError('Ocurrió un error desconocido al añadir el paciente');
      }
    } finally {
      setSubmittingPaciente(false);
    }
  };

  // --- RENDERIZADO ---
  if (loadingAuth || !user) {
    return <p>Cargando gestión de pacientes...</p>;
  }

  const {
    Id_paciente,
    Nombre,
    Apellido1,
    Apellido2,
    DNI_NIE,
    FechaNacimiento,
    Sexo,
    SIP, // ✅ NUEVO CAMPO
    NumSeguridadSocial,
    NumHistoriaClinica,
    Direccion,
    CodigoPostal,
    Telefono
  } = formData;

  return (
    <div className="pacientes-container">
      <h1>Añadir Nuevo Paciente</h1>
      <button onClick={() => router.push('/pacientes')} style={{ marginBottom: '20px' }}>Volver a Búsqueda de Pacientes</button>

      <div style={{ flex: 1 }}>
        <form onSubmit={handleAddPaciente}>
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
            {/* ✅ NUEVO CAMPO SIP */}
            <div>
              <label htmlFor="SIP">SIP (*):</label>
              <input 
                type="text" 
                id="SIP" 
                value={SIP} 
                onChange={handleInputChange} 
                required 
                disabled={submittingPaciente}
                maxLength={7}
                pattern="[0-9]{7}"
                title="El SIP debe tener exactamente 7 dígitos numéricos"
                placeholder="1234567"
              />
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
            {submittingPaciente ? 'Añadiendo...' : 'Añadir Paciente'}
          </button>
          {submitError && <p style={{ color: 'red', marginTop: '10px' }}>Error: {submitError}</p>}
          {submitSuccess && <p style={{ color: 'green', marginTop: '10px' }}>{submitSuccess}</p>}
        </form>
      </div>
    </div>
  );
}