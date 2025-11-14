// my-hospital-app/src/app/hospitalizacion/page.tsx)
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/AuthContext'; // Asegúrate de que la ruta sea correcta

export default function HospitalizacionPage() { // Cambia el nombre de la función según la página
  const { user, loading } = useAuth();
  const router = useRouter();

  // Protección de ruta: si no está logueado, redirige al login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <p>Cargando sección...</p>;
  }

  return (
    <div>
      <h1>Hospitalización</h1> {/* Cambia este título según la página */}
      <p>Contenido futuro para la gestión de hospitalización.</p>
      <button onClick={() => router.push('/home')}>Volver al Menú Principal</button>
    </div>
  );
}
