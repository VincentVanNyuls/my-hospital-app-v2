// my-hospital-app/src/utils/AuthContext.tsx
"use client"; // Necesario para usar hooks de React y el contexto en el cliente

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // Importamos la instancia de auth que ya creaste

// Define el tipo de datos que el contexto proporcionará
interface AuthContextType {
  user: User | null; // El objeto User de Firebase o null si no hay nadie conectado
  loading: boolean;  // Para saber si Firebase Auth todavía está inicializando
}

// Crea el contexto de React con valores iniciales
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Componente Proveedor que envolverá tu aplicación
interface AuthProviderProps {
  children: ReactNode; // 'children' es donde irá tu aplicación
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Empieza en true porque estamos esperando el estado de auth

  useEffect(() => {
    // 'onAuthStateChanged' es el método de Firebase que escucha cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // Actualiza el estado con el usuario actual (o null)
      setLoading(false);     // La carga inicial ha terminado
    });

    // Limpia la suscripción cuando el componente se desmonte para evitar fugas de memoria
    return () => unsubscribe();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  // El valor que proporcionaremos a todos los componentes hijos
  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para consumir el contexto de autenticación fácilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
