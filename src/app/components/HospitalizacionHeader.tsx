'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HospitalizacionHeader() {
  const pathname = usePathname();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { href: '/hospitalizacion', label: 'Hospitalización' },
  ];

  // Añadir breadcrumbs dinámicos según la ruta
  if (pathname.includes('/episodios')) {
    breadcrumbs.push({ href: '/hospitalizacion/episodios', label: 'Episodios' });
  }
  if (pathname.includes('/alta')) {
    breadcrumbs.push({ href: '#', label: 'Alta Médica' });
  }

  return (
    <div className="header">
      <div className="breadcrumbs">
        {breadcrumbs.map((breadcrumb, index) => (
          <span key={breadcrumb.href} className="flex items-center gap-2">
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {breadcrumb.href !== '#' ? (
              <Link href={breadcrumb.href} className="breadcrumb">
                {breadcrumb.label}
              </Link>
            ) : (
              <span className="breadcrumb-active">{breadcrumb.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="header-actions">
        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-label">Pacientes Activos</span>
            <span className="stat-value-small">12</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Altas Hoy</span>
            <span className="stat-value-small">3</span>
          </div>
        </div>
        
        <button className="btn-notification">
          <span>🔔</span>
          <span className="notification-badge">2</span>
        </button>
      </div>
    </div>
  );
}