// my-hospital-app/src/app/register/page.tsx
"use client";

import { useState } from 'react';
// IMPORTANTE: La ruta '../utils/firebase' es la correcta para tu estructura de carpetas.
import { auth } from '../utils/firebase'; // <--- ¡Esta es la importación correcta de 'auth'!
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Interfaz para el formulario de registro
interface RegisterFormData {
  email: string;
  password: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
      router.push('/login');
    } catch (err: unknown) {
      console.error("Error durante el registro:", err);
      
      // Manejo seguro del error
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error desconocido durante el registro');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const { email, password } = formData;

  return (
    <div>
      <h1>Registrarse</h1>
      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">Registrar</button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </form>
      <p>¿Ya tienes una cuenta? <button onClick={() => router.push('/login')}>Iniciar Sesión</button></p>
    </div>
  );
}