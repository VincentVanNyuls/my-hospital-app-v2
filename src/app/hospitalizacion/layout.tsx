import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Hospitalización - Hospital Simulación',
  description: 'Sistema de gestión de hospitalización y episodios médicos',
};

export default function HospitalizacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}