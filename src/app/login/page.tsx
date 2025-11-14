// my-hospital-app/src/app/login/page.tsx

"use client"; // ¡Esta directiva es crucial!

import { useState } from 'react';
// IMPORTANTE: La ruta '../utils/firebase' es la correcta para tu estructura de carpetas.
import { auth } from '../utils/firebase'; // <--- ¡Esta es la importación correcta de 'auth'!
import { signInWithEmailAndPassword } from 'firebase/auth'; // Función para iniciar sesión
import { useRouter } from 'next/navigation'; // Para redirigir al usuario

// Interfaz para el formulario de login
interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      alert('¡Inicio de sesión exitoso!');
      router.push('/');
    } catch (err: unknown) {
      console.error("Error durante el inicio de sesión:", err);
      
      // Manejo seguro del error
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error desconocido durante el inicio de sesión');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const { email, password } = formData;

  return (
    <div>
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
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
            name="password"
            value={password}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">Iniciar Sesión</button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </form>
      <p>¿No tienes una cuenta? <button onClick={() => router.push('/register')}>Regístrate</button></p>
    </div>
  );
}