// my-hospital-app/src/app/page.tsx

"use client";


import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from './utils/AuthContext'; // Asegúrate de que la ruta sea correcta


export default function RootPage() {

  const { user, loading } = useAuth();

  const router = useRouter();


  useEffect(() => {

    // Mientras la autenticación está cargando, no hacemos nada

    if (loading) {

      return;

    }


    // Si no hay usuario, redirigir a la página de login

    if (!user) {

      router.push('/login');

    } else {

      // Si hay usuario, redirigir a la nueva página principal de navegación

      router.push('/home');

    }

  }, [user, loading, router]);


  // Mostrar un mensaje de carga mientras se determina el estado de autenticación y se redirige

  return <p>Cargando aplicación...</p>;

}
