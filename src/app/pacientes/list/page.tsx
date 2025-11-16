// my-hospital-app/src/app/pacientes/list/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import { db } from '../../utils/firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, where, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'; 

// --- IMPORTACIONES DE jsPDF Y AUTOTABLE ---
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interfaz para los datos del paciente.
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

// Interfaz para los datos crudos de Firestore (sin el id)
interface RawPacienteData {
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

// Interfaz para los datos de página en autoTable
interface AutoTableData {
  pageNumber: number;
}

const ITEMS_PER_PAGE = 10; // Cantidad de pacientes a mostrar por página

export default function PacientesListPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();

  // --- ESTADOS para la UI (causan re-render cuando se actualizan) ---
  const [pacientes, setPacientes] = useState<PacienteData[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [errorPacientes, setErrorPacientes] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [displayedCurrentPage, setDisplayedCurrentPage] = useState(1);

  // --- ESTADOS PARA LOS FILTROS ---
  const [filterSexo, setFilterSexo] = useState(''); // 'Masculino', 'Femenino', 'Otro', '' (todos)
  const [filterEdadMin, setFilterEdadMin] = useState(''); // Edad mínima en años
  const [filterEdadMax, setFilterEdadMax] = useState(''); // Edad máxima en años

  // --- NUEVOS ESTADOS para el conteo total y el estado de exportación ---
  const [totalFilteredCount, setTotalFilteredCount] = useState<number | null>(null); // Total de registros que cumplen el filtro
  const [exportingCSV, setExportingCSV] = useState(false); // Estado para el botón de exportar CSV
  const [exportingPDF, setExportingPDF] = useState(false); // Estado para el botón de exportar PDF

  // --- REFS para la lógica interna de paginación (NO causan re-render cuando se actualizan) ---
  const lastVisibleRef = useRef<QueryDocumentSnapshot | null>(null);
  const pagesVisitedRef = useRef<QueryDocumentSnapshot[]>([]);
  const currentPageRef = useRef(1);

  // --- PROTECCIÓN DE RUTA ---
  useEffect(() => {
    if (!loadingAuth && !user) {
      console.log("PacientesListPage: Usuario no autenticado, redirigiendo a /login.");
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  // --- FUNCIÓN PARA CONSTRUIR LA CONSULTA DE FILTRO DE EDAD ---
  const getAgeFilterDates = useCallback(() => {
    const today = new Date();
    let dateMin: Date | undefined;
    let dateMax: Date | undefined;

    if (filterEdadMax) {
      const maxAge = parseInt(filterEdadMax);
      if (!isNaN(maxAge)) {
        dateMin = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
      }
    }
    if (filterEdadMin) {
      const minAge = parseInt(filterEdadMin);
      if (!isNaN(minAge)) {
        dateMax = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
      }
    }
    // Firestore compara Timestamps, así que convertimos las fechas a Timestamp
    return {
      dateMinTimestamp: dateMin ? Timestamp.fromDate(dateMin) : undefined,
      dateMaxTimestamp: dateMax ? Timestamp.fromDate(dateMax) : undefined,
    };
  }, [filterEdadMin, filterEdadMax]);

  // --- FUNCIÓN PARA CONSTRUIR LA CONSULTA BASE CON FILTROS ---
  const buildBaseQuery = useCallback(() => {
    let baseQuery = query(collection(db, "pacientes"));

    if (filterSexo) {
      baseQuery = query(baseQuery, where("Sexo", "==", filterSexo));
    }
    const { dateMinTimestamp, dateMaxTimestamp } = getAgeFilterDates();
    if (dateMaxTimestamp) {
      baseQuery = query(baseQuery, where("FechaNacimiento", "<=", dateMaxTimestamp));
    }
    if (dateMinTimestamp) {
      baseQuery = query(baseQuery, where("FechaNacimiento", ">=", dateMinTimestamp));
    }
    // Siempre ordenar por un campo para la paginación basada en cursor
    baseQuery = query(baseQuery, orderBy("creadoEn", "desc"));
    return baseQuery;
  }, [filterSexo, getAgeFilterDates]);

  // --- FUNCIÓN PARA CARGAR EL CONTEO TOTAL DE PACIENTES FILTRADOS ---
  const fetchTotalFilteredCount = useCallback(async () => {
    if (loadingAuth || !user) return;
    try {
      const baseQ = buildBaseQuery();
      const countSnapshot = await getDocs(query(baseQ)); // Consulta sin limit ni startAfter
      setTotalFilteredCount(countSnapshot.docs.length);
    } catch (err) {
      console.error("Error al obtener el conteo total:", err);
      setTotalFilteredCount(null);
    }
  }, [loadingAuth, user, buildBaseQuery]);

  // --- FUNCIÓN PARA CARGAR PACIENTES CON PAGINACIÓN Y FILTROS ---
  const fetchPacientes = useCallback(async (direction: 'next' | 'prev' | 'first' = 'first', resetPagination: boolean = false) => {
    console.log(`fetchPacientes: Iniciando carga de página ${direction}. Usuario:`, user ? user.email : 'N/A', `Auth Loading: ${loadingAuth}`);

    if (loadingAuth || !user) {
      console.log("PacientesListPage: No se puede cargar, autenticación no lista o usuario no logueado.");
      setLoadingPacientes(false);
      return;
    }

    setLoadingPacientes(true);
    setErrorPacientes(null);

    try {
      const baseQ = buildBaseQuery(); // Obtenemos la consulta base con filtros

      let q;
      let currentLastVisible = lastVisibleRef.current;
      let currentPagesVisited = pagesVisitedRef.current;
      let currentCurrentPage = currentPageRef.current;

      if (resetPagination || direction === 'first') { // Reiniciar si se aplican filtros o es la primera carga
        q = query(baseQ, limit(ITEMS_PER_PAGE));
        currentPagesVisited = [];
        currentCurrentPage = 1;
        console.log("fetchPacientes: Consulta para la primera página (con filtros).");
        fetchTotalFilteredCount(); // También actualizamos el conteo total
      } else if (direction === 'next' && currentLastVisible) {
        q = query(baseQ, startAfter(currentLastVisible), limit(ITEMS_PER_PAGE));
        currentPagesVisited = [...currentPagesVisited, currentLastVisible];
        currentCurrentPage++;
        console.log("fetchPacientes: Consulta para la siguiente página (con filtros).");
      } else if (direction === 'prev' && currentPagesVisited.length > 0) {
        currentPagesVisited = currentPagesVisited.slice(0, currentPagesVisited.length - 1);
        currentCurrentPage = currentCurrentPage > 1 ? currentCurrentPage - 1 : 1;

        if (currentPagesVisited.length === 0) {
          q = query(baseQ, limit(ITEMS_PER_PAGE));
          currentLastVisible = null;
          console.log("fetchPacientes: Consulta para la página anterior (volviendo a la primera con filtros).");
          fetchTotalFilteredCount(); // También actualizamos el conteo total si volvemos a la primera
        } else {
          const startDocForPrevPage = currentPagesVisited[currentPagesVisited.length - 1];
          q = query(baseQ, startAfter(startDocForPrevPage), limit(ITEMS_PER_PAGE));
          console.log("fetchPacientes: Consulta para la página anterior (con filtros).");
        }
      } else { // Fallback, cargar primera página
        q = query(baseQ, limit(ITEMS_PER_PAGE));
        currentPagesVisited = [];
        currentCurrentPage = 1;
        console.log("fetchPacientes: Consulta por defecto (primera página con filtros).");
        fetchTotalFilteredCount(); // También actualizamos el conteo total
      }
      
      const documentSnapshots = await getDocs(q);
      console.log(`fetchPacientes: getDocs encontró ${documentSnapshots.docs.length} documentos.`);

      const pacientesList: PacienteData[] = documentSnapshots.docs.map(doc => {
        const rawData = doc.data() as RawPacienteData; // ✅ CORREGIDO: Cast a tipo conocido
        return {
          id: doc.id,
          Id_paciente: rawData.Id_paciente,
          Nombre: rawData.Nombre,
          Apellido1: rawData.Apellido1,
          Apellido2: rawData.Apellido2,
          DNI_NIE: rawData.DNI_NIE,
          FechaNacimiento: convertToFirestoreTimestamp(rawData.FechaNacimiento),
          Sexo: rawData.Sexo,
          SIP: rawData.SIP, // ✅ NUEVO CAMPO
          NumSeguridadSocial: rawData.NumSeguridadSocial,
          NumHistoriaClinica: rawData.NumHistoriaClinica,
          Direccion: rawData.Direccion,
          CodigoPostal: rawData.CodigoPostal,
          Telefono: rawData.Telefono,
          creadoPor: rawData.creadoPor,
          creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
        };
      });
      setPacientes(pacientesList);
      console.log("fetchPacientes: Pacientes cargados y procesados:", pacientesList);

      setHasMore(documentSnapshots.docs.length >= ITEMS_PER_PAGE);
      
      lastVisibleRef.current = documentSnapshots.docs.length > 0 ? documentSnapshots.docs[documentSnapshots.docs.length - 1] : null;
      pagesVisitedRef.current = currentPagesVisited;
      currentPageRef.current = currentCurrentPage;

      setDisplayedCurrentPage(currentCurrentPage);

    } catch (err: unknown) {
      console.error("fetchPacientes: Error al cargar pacientes:", err);
      setErrorPacientes("No se pudieron cargar los pacientes desde la base de datos.");
    } finally {
      setLoadingPacientes(false);
    }
  }, [user, loadingAuth, buildBaseQuery, fetchTotalFilteredCount]);

  // Efecto para la carga inicial y cuando cambian los filtros
  useEffect(() => {
    if (!loadingAuth && user) {
        fetchPacientes('first', true); // Llamar a fetchPacientes con resetPagination = true
    } else if (!loadingAuth && !user) {
        setPacientes([]);
        setLoadingPacientes(false);
        setErrorPacientes("Debes iniciar sesión para ver los pacientes.");
    }
  }, [fetchPacientes, user, loadingAuth]);

  // --- MANEJADOR PARA APLICAR FILTROS ---
  const handleApplyFilters = () => {
    fetchPacientes('first', true); // Siempre reiniciar la paginación al aplicar filtros y recalcular conteo
  };

  // --- MANEJADOR PARA LIMPIAR FILTROS ---
  const handleClearFilters = () => {
    setFilterSexo('');
    setFilterEdadMin('');
    setFilterEdadMax('');
    // El useEffect con las dependencias de los filtros llamará a fetchPacientes y recalculará el conteo.
  };

  // --- MANEJADOR PARA SELECCIONAR UN PACIENTE ---
  const handleSelectPaciente = (paciente: PacienteData) => {
    localStorage.setItem('selectedPatient', JSON.stringify(paciente));
    alert(`Paciente ${paciente.Nombre} ${paciente.Apellido1} (DNI: ${paciente.DNI_NIE}) seleccionado.`);
  };

  // --- MANEJADOR PARA EXPORTAR A CSV ---
  const handleExportCSV = async () => {
    if (loadingAuth || !user) {
      alert("Debes iniciar sesión para exportar pacientes.");
      return;
    }

    setExportingCSV(true);
    try {
      const baseQ = buildBaseQuery(); // Obtenemos la consulta base con filtros
      const fullSnapshot = await getDocs(query(baseQ)); // ¡Obtenemos TODOS los documentos que cumplen el filtro, sin límite!
      const allFilteredPatients: PacienteData[] = fullSnapshot.docs.map(doc => {
        const rawData = doc.data() as RawPacienteData; // ✅ CORREGIDO: Cast a tipo conocido
        return {
          id: doc.id,
          Id_paciente: rawData.Id_paciente,
          Nombre: rawData.Nombre,
          Apellido1: rawData.Apellido1,
          Apellido2: rawData.Apellido2,
          DNI_NIE: rawData.DNI_NIE,
          FechaNacimiento: convertToFirestoreTimestamp(rawData.FechaNacimiento),
          Sexo: rawData.Sexo,
          SIP: rawData.SIP, // ✅ NUEVO CAMPO
          NumSeguridadSocial: rawData.NumSeguridadSocial,
          NumHistoriaClinica: rawData.NumHistoriaClinica,
          Direccion: rawData.Direccion,
          CodigoPostal: rawData.CodigoPostal,
          Telefono: rawData.Telefono,
          creadoPor: rawData.creadoPor,
          creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
        };
      });

      if (allFilteredPatients.length === 0) {
        alert("No hay pacientes para exportar con los filtros actuales.");
        setExportingCSV(false);
        return;
      }

      // ✅ ACTUALIZADO: Definir los encabezados del CSV incluyendo SIP
      const headers = [
        "ID Paciente", "Nombre", "Apellido 1", "Apellido 2", "SIP", "DNI/NIE",
        "Fecha Nacimiento", "Sexo", "Nº Seguridad Social",
        "Nº Historia Clinica", "Direccion", "Codigo Postal", "Telefono",
        "Creado Por", "Creado En"
      ];

      // Mapear los datos de los pacientes a un formato CSV
      const csvRows = allFilteredPatients.map(p => {
        // Formatear las fechas de Timestamp a un formato legible
        const fechaNacimientoStr = p.FechaNacimiento instanceof Timestamp
          ? p.FechaNacimiento.toDate().toLocaleDateString()
          : 'N/A';
        const creadoEnStr = p.creadoEn instanceof Timestamp
          ? p.creadoEn.toDate().toLocaleString() // Fecha y hora
          : 'N/A';

        return [
          p.Id_paciente,
          p.Nombre,
          p.Apellido1,
          p.Apellido2 || '', // Si es undefined, usar string vacío
          p.SIP || '', // ✅ NUEVO CAMPO SIP
          p.DNI_NIE,
          fechaNacimientoStr,
          p.Sexo,
          p.NumSeguridadSocial || '',
          p.NumHistoriaClinica,
          p.Direccion || '',
          p.CodigoPostal || '',
          p.Telefono || '',
          p.creadoPor,
          creadoEnStr
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Escapar comillas dobles y unir con comas
      });

      // Unir encabezados y filas
      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Crear un Blob (Binary Large Object) con el contenido CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Crear un enlace de descarga y simular un clic
      const link = document.createElement('a');
      if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pacientes_listado_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Liberar el objeto URL
      } else {
        alert("Tu navegador no soporta la descarga directa de archivos. Por favor, copia el contenido de la tabla manualmente.");
      }
    } catch (error) {
      console.error("Error al exportar pacientes CSV:", error);
      alert("Hubo un error al exportar los pacientes a CSV.");
    } finally {
      setExportingCSV(false);
    }
  };

 // --- MANEJADOR PARA EXPORTAR A PDF CORREGIDO ---
const handleExportPDF = async () => {
  if (loadingAuth || !user) {
    alert("Debes iniciar sesión para exportar pacientes.");
    return;
  }

  setExportingPDF(true);
  try {
    const baseQ = buildBaseQuery();
    const fullSnapshot = await getDocs(query(baseQ));
    const allFilteredPatients: PacienteData[] = fullSnapshot.docs.map(doc => {
      const rawData = doc.data() as RawPacienteData;
      return {
        id: doc.id,
        Id_paciente: rawData.Id_paciente,
        Nombre: rawData.Nombre,
        Apellido1: rawData.Apellido1,
        Apellido2: rawData.Apellido2,
        DNI_NIE: rawData.DNI_NIE,
        FechaNacimiento: convertToFirestoreTimestamp(rawData.FechaNacimiento),
        Sexo: rawData.Sexo,
        SIP: rawData.SIP,
        NumSeguridadSocial: rawData.NumSeguridadSocial,
        NumHistoriaClinica: rawData.NumHistoriaClinica,
        Direccion: rawData.Direccion,
        CodigoPostal: rawData.CodigoPostal,
        Telefono: rawData.Telefono,
        creadoPor: rawData.creadoPor,
        creadoEn: convertToFirestoreTimestamp(rawData.creadoEn),
      };
    });

    if (allFilteredPatients.length === 0) {
      alert("No hay pacientes para exportar a PDF con los filtros actuales.");
      setExportingPDF(false);
      return;
    }

    // Crear PDF en ORIENTACIÓN HORIZONTAL
    const doc = new jsPDF('landscape');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const headerHeight = 25;
    const footerHeight = 15;

    // Encabezados de la tabla para incluir SIP
    const tableColumn = [
      "ID", "Nombre", "Apellido 1", "Apellido 2", "SIP", "DNI/NIE", "Nacimiento",
      "Sexo", "Nº Seg. Social", "Nº HC", "Dirección", "C.P.", "Teléfono"
    ];
    
    // Mapear los datos de los pacientes para incluir SIP
    const tableRows = allFilteredPatients.map(p => {
      const fechaNacimientoStr = p.FechaNacimiento instanceof Timestamp
        ? p.FechaNacimiento.toDate().toLocaleDateString()
        : 'N/A';
      return [
        p.Id_paciente,
        p.Nombre,
        p.Apellido1,
        p.Apellido2 || '',
        p.SIP || '',
        p.DNI_NIE,
        fechaNacimientoStr,
        p.Sexo,
        p.NumSeguridadSocial || '',
        p.NumHistoriaClinica,
        p.Direccion || '',
        p.CodigoPostal || '',
        p.Telefono || ''
      ];
    });

    // ✅ CORRECCIÓN: Usar un número fijo de filas por página
    const rowsPerPage = 20; // Número fijo que funciona bien en landscape
    const totalPages = Math.ceil(tableRows.length / rowsPerPage);

    // Función para agregar encabezado a cada página
    const addHeader = () => {
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("Hospital LL", pageWidth / 2, margin + 8, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Listado de Pacientes", pageWidth / 2, margin + 16, { align: 'center' });
    };

    // Función para agregar pie de página a cada página
    const addFooter = (pageNum: number, totalPages: number) => {
      const currentDateTime = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      
      // Texto izquierdo: Fecha de extracción
      doc.text(`Fecha: ${currentDateTime}`, margin, pageHeight - margin - 5);
      
      // Texto centro: Información del hospital
      const hospitalInfo = 'HospitalDoc - Sistema de Gestión';
      doc.text(hospitalInfo, pageWidth / 2, pageHeight - margin - 5, { align: 'center' });
      
      // Texto derecha: Numeración CORRECTA de páginas
      const pageText = `Página ${pageNum} de ${totalPages}`;
      doc.text(pageText, pageWidth - margin - doc.getTextWidth(pageText), pageHeight - margin - 5);
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, pageHeight - margin - 8, pageWidth - margin, pageHeight - margin - 8);
    };

    // Generar cada página manualmente
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) {
        doc.addPage();
      }

      // Agregar encabezado
      addHeader();

      // Calcular qué filas van en esta página
      const startRow = pageNum * rowsPerPage;
      const endRow = Math.min(startRow + rowsPerPage, tableRows.length);
      const pageData = tableRows.slice(startRow, endRow);

      // Generar tabla para esta página
      autoTable(doc, {
        head: [tableColumn],
        body: pageData,
        startY: margin + headerHeight,
        margin: { top: headerHeight + margin, bottom: footerHeight + margin, left: margin, right: margin },
        styles: { 
          fontSize: 7,
          cellPadding: 2, 
          overflow: 'linebreak',
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [22, 160, 133], 
          textColor: 255, 
          fontStyle: 'bold',
          lineWidth: 0.1
        },
        alternateRowStyles: { 
          fillColor: [240, 240, 240] 
        },
        // Desactivar el didDrawPage interno de autoTable ya que manejamos el footer manualmente
        didDrawPage: () => {} // Función vacía
      });

      // Agregar pie de página
      addFooter(pageNum + 1, totalPages);
    }

    doc.save(`pacientes_listado_${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (error) {
    console.error("Error al exportar pacientes PDF:", error);
    alert("Hubo un error al exportar los pacientes a PDF.");
  } finally {
    setExportingPDF(false);
  }
};
  // --- RENDERIZADO DEL COMPONENTE ---
  if (loadingAuth) {
    return <p>Verificando autenticación...</p>;
  }

  if (!user) {
    return <p>Acceso denegado. Por favor, inicie sesión.</p>;
  }

  console.log("RENDER: Estado actual de pacientes:", pacientes, "Loading:", loadingPacientes, "Error:", errorPacientes);

  return (
    <div style={{ padding: '20px', maxWidth: '100%', margin: 'auto' }}>
      <h1>Listado Completo de Pacientes</h1>
      <button onClick={() => router.push('/pacientes')} style={{ marginBottom: '20px' }}>Volver a Gestión de Pacientes</button>

      {/* --- SECCIÓN DE FILTROS --- */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid var(--border-color, #ddd)', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2>Filtrar y Exportar Pacientes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label htmlFor="filterSexo" style={{ fontSize: '0.9em' }}>Sexo:</label>
            <select id="filterSexo" value={filterSexo} onChange={(e) => setFilterSexo(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '0.9em' }}>
              <option value="">Todos</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterEdadMin" style={{ fontSize: '0.9em' }}>Edad Mínima:</label>
            <input type="number" id="filterEdadMin" value={filterEdadMin} onChange={(e) => setFilterEdadMin(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '0.9em' }} min="0" />
          </div>
          <div>
            <label htmlFor="filterEdadMax" style={{ fontSize: '0.9em' }}>Edad Máxima:</label>
            <input type="number" id="filterEdadMax" value={filterEdadMax} onChange={(e) => setFilterEdadMax(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '0.9em' }} min="0" />
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button onClick={handleApplyFilters} disabled={loadingPacientes} style={{ padding: '8px 15px', fontSize: '0.9em' }}>Aplicar Filtros</button>
          <button onClick={handleClearFilters} disabled={loadingPacientes} style={{ padding: '8px 15px', fontSize: '0.9em', backgroundColor: 'var(--secondary-color, #6c757d)' }}>Limpiar Filtros</button>
          <button onClick={handleExportCSV} disabled={exportingCSV || loadingPacientes} style={{ padding: '8px 15px', fontSize: '0.9em', backgroundColor: 'var(--accent-color, #28a745)' }}>
            {exportingCSV ? 'Exportando CSV...' : 'Exportar a CSV'}
          </button>
          {/* BOTÓN DE EXPORTAR A PDF */}
          <button onClick={handleExportPDF} disabled={exportingPDF || loadingPacientes} style={{ padding: '8px 15px', fontSize: '0.9em', backgroundColor: 'var(--danger-color, #dc3545)' }}> {/* Color de botón diferente para PDF */}
            {exportingPDF ? 'Generando PDF...' : 'Exportar a PDF'}
          </button>
        </div>
        {totalFilteredCount !== null && (
            <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
                Registros encontrados con filtros: <strong>{totalFilteredCount}</strong>
            </p>
        )}
      </div>
      {/* --- FIN SECCIÓN DE FILTROS Y EXPORTACIÓN --- */}

      {loadingPacientes && !errorPacientes ? (
        <p>Cargando pacientes...</p>
      ) : errorPacientes ? (
        <p style={{ color: 'red' }}>Error: {errorPacientes}</p>
      ) : pacientes.length === 0 ? (
        <p>No hay pacientes registrados en Firebase Firestore que coincidan con los filtros.</p>
      ) : (
        <> 
          <div style={{ overflowX: 'auto', marginTop: '20px', border: '1px solid var(--border-color, #ddd)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}> {/* ✅ Aumentado minWidth por nueva columna */}
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={tableHeaderStyle}>ID Paciente</th>
                  <th style={tableHeaderStyle}>Nombre</th>
                  <th style={tableHeaderStyle}>Apellidos</th>
                  <th style={tableHeaderStyle}>SIP</th> {/* ✅ NUEVA COLUMNA SIP */}
                  <th style={tableHeaderStyle}>DNI/NIE</th>
                  <th style={tableHeaderStyle}>NHC</th> {/* ✅ CAMBIO: "Nº HC" por "NHC" */}
                  <th style={tableHeaderStyle}>Nacimiento</th>
                  <th style={tableHeaderStyle}>Sexo</th>
                  <th style={tableHeaderStyle}>Nº Seg. Social</th>
                  <th style={tableHeaderStyle}>Dirección</th>
                  <th style={tableHeaderStyle}>C.P.</th>
                  <th style={tableHeaderStyle}>Teléfono</th>
                  <th style={tableActionHeaderStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((paciente) => (
                  <tr key={paciente.id}>
                    <td style={tableCellStyle}>{paciente.Id_paciente}</td>
                    <td style={tableCellStyle}>{paciente.Nombre}</td>
                    <td style={tableCellStyle}>{paciente.Apellido1} {paciente.Apellido2}</td>
                    <td style={tableCellStyle}>{paciente.SIP || 'N/A'}</td> {/* ✅ NUEVA COLUMNA SIP */}
                    <td style={tableCellStyle}>{paciente.DNI_NIE}</td>
                    <td style={tableCellStyle}>{paciente.NumHistoriaClinica}</td>
                    <td style={tableCellStyle}>{paciente.FechaNacimiento instanceof Timestamp ? paciente.FechaNacimiento.toDate().toLocaleDateString() : 'N/A'}</td>
                    <td style={tableCellStyle}>{paciente.Sexo}</td>
                    <td style={tableCellStyle}>{paciente.NumSeguridadSocial || 'N/A'}</td>
                    <td style={tableCellStyle}>{paciente.Direccion || 'N/A'}</td>
                    <td style={tableCellStyle}>{paciente.CodigoPostal || 'N/A'}</td>
                    <td style={tableCellStyle}>{paciente.Telefono || 'N/A'}</td>
                    <td style={tableActionCellStyle}>
                      <button onClick={() => handleSelectPaciente(paciente)} style={{ backgroundColor: 'var(--success-color)', padding: '5px 8px', fontSize: '0.8em', marginRight: '5px', minWidth: '75px' }}>Seleccionar</button>
                      <button onClick={() => router.push(`/pacientes/edit/${paciente.id}`)} style={{ backgroundColor: 'var(--primary-color)', padding: '5px 8px', fontSize: '0.8em', minWidth: '60px' }}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => fetchPacientes('prev')} disabled={displayedCurrentPage === 1 || loadingPacientes}>
              Anterior
            </button>
            <span>Página {displayedCurrentPage}</span>
            <button onClick={() => fetchPacientes('next')} disabled={!hasMore || loadingPacientes}>
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Función auxiliar para convertir cualquier objeto de tipo Timestamp de Firestore
function convertToFirestoreTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }
  if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    const timestampLike = value as { seconds: number; nanoseconds: number };
    return new Timestamp(timestampLike.seconds, timestampLike.nanoseconds);
  }
  console.warn("Formato de Timestamp inválido encontrado, devolviendo Timestamp(0,0):", value);
  return new Timestamp(0, 0);
}

// --- ESTILOS BÁSICOS PARA LA TABLA ---
const tableHeaderStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '6px 4px',
  textAlign: 'left',
  backgroundColor: '#f2f2f2',
  whiteSpace: 'nowrap',
  fontSize: '0.85em',
};

const tableCellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '6px 4px',
  textAlign: 'left',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '120px',
  fontSize: '0.85em',
};

const tableActionHeaderStyle: React.CSSProperties = {
  ...tableHeaderStyle,
  minWidth: '180px',
  textAlign: 'center',
};

const tableActionCellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '6px 4px',
  textAlign: 'center',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  minWidth: '180px',
  fontSize: '0.85em',
};