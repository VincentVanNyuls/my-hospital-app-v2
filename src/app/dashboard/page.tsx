// my-hospital-app/src/app/dashboard/page.tsx
"use client"; // ¡Necesario para usar hooks de React y el router!

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Para redirigir
import { useAuth } from '../utils/AuthContext'; // Importamos nuestro hook de autenticación

export default function DashboardPage() {
  const { user, loading } = useAuth(); // Obtenemos el usuario y el estado de carga de autenticación
  const router = useRouter(); // Instanciamos el router

  useEffect(() => {
    // Si no está cargando la autenticación y no hay usuario, redirigimos al login
    if (!loading && !user) {
      router.push('/login'); // Redirige al usuario a la página de login
    }
  }, [user, loading, router]); // Se re-ejecuta cuando user, loading o router cambian

  // Mientras se carga la autenticación, o si el usuario no está logueado (y esperando redirección)
  if (loading || !user) {
    return <p>Cargando dashboard...</p>; // O un spinner, etc.
  }

  // Si llegamos aquí, significa que el usuario está logueado.
  return (
    <div>
      <h1>Bienvenido al Dashboard Privado</h1>
      <p>Solo usuarios autenticados pueden ver esto.</p>
      <p>Usuario actual: <strong>{user.email}</strong></p>
      {/* Aquí podrías poner enlaces a otras secciones protegidas o datos específicos */}
      <button onClick={() => router.push('/')}>Volver a la página principal</button>
    </div>
  );
}
