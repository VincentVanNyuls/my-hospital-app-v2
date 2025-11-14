// my-hospital-app/src/app/layout.tsx
// Esto es un Server Component por defecto, y solo envolverá a los Children.
// Los Children que usen 'use client' podrán consumir el contexto.

import { Inter } from 'next/font/google';
import './globals.css'; // Si tienes un archivo CSS global

// IMPORTANTE: ¡Ruta CORREGIDA!
import { AuthProvider } from './utils/AuthContext'; // <--- ¡AQUÍ ESTÁ EL CAMBIO!

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hospital LL App',
  description: 'Aplicación de gestión hospitalaria para docencia CFGS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider> {/* <--- Aquí envolvemos toda la aplicación */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

