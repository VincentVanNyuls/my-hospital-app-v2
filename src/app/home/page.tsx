// my-hospital-app/src/app/home/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';

export default function HomePageAuthenticated() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Protección de ruta: si no está logueado, redirige al login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert('Has cerrado sesión exitosamente.');
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Hubo un error al cerrar sesión.');
    }
  };

  // Si aún está cargando la autenticación o no hay usuario (y está esperando redirección)
  if (loading || !user) {
    return <p>Cargando menú principal...</p>;
  }

  // Si el usuario está logueado, muestra el menú
  return (
    // Contenedor principal con estilos para centrar el contenido, limitar el ancho y reducir padding
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto' }}>
      <h1 style={{ marginBottom: '15px' }}>Menú Principal del Hospital LL</h1>
      <p style={{ marginBottom: '15px', fontSize: '1.1em' }}>Bienvenido, <strong>{user.email}</strong>!</p>
      <button onClick={handleLogout} style={{ marginBottom: '20px', padding: '8px 15px', fontSize: '0.95em' }}>Cerrar Sesión</button>

      <nav style={{ marginTop: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Secciones:</h2>
        {/* Usamos flexbox en la lista (ul) para distribuir los botones, permitiendo que se envuelvan si no caben */}
        <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <li><button onClick={() => router.push('/pacientes')} style={menuButtonStyle}>Gestión de Pacientes</button></li>
          <li><button onClick={() => router.push('/consultas')} style={menuButtonStyle}>Consultas Externas</button></li>
          <li><button onClick={() => router.push('/urgencias')} style={menuButtonStyle}>Urgencias</button></li>
          <li><button onClick={() => router.push('/hospitalizacion')} style={menuButtonStyle}>Hospitalización</button></li>
          {/* BOTONES NUEVOS */}
          <li><button onClick={() => router.push('/solicitudes')} style={menuButtonStyle}>Solicitudes</button></li>
          <li><button onClick={() => router.push('/informes')} style={menuButtonStyle}>Informes</button></li>
          {/* El botón de Dashboard General ha sido eliminado */}
        </ul>
      </nav>
    </div>
  );
}

// Estilo para los botones del menú, para consistencia y compacidad
const menuButtonStyle: React.CSSProperties = {
  padding: '10px 15px', // Padding reducido
  fontSize: '0.95em',    // Tamaño de fuente ligeramente menor
  minWidth: '170px',    // Asegura un ancho mínimo para cada botón, ajustado
  textAlign: 'center',
  // Aquí se heredarían otros estilos de botones generales (colores, bordes) que puedas tener en globals.css
};
