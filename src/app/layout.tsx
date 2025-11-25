// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './utils/AuthContext'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Hospital Management System',
  description: 'Sistema profesional de gestión hospitalaria para docencia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <div className="app-container">
            {/* Sidebar simplificado integrado */}
            <aside className="sidebar">
              <div className="sidebar-header">
                <div className="hospital-logo">
                  <div className="logo-icon">🏥</div>
                  <div className="logo-text">
                    <h2>HospitalDoc</h2>
                    <span>Sistema de Gestión</span>
                  </div>
                </div>
              </div>
              
              <nav className="sidebar-nav">
                <a href="/" className="nav-item">
                  <span className="nav-icon">📊</span>
                  <span className="nav-text">Dashboard</span>
                </a>
                <a href="/pacientes" className="nav-item">
                  <span className="nav-icon">👥</span>
                  <span className="nav-text">Pacientes</span>
                </a>
                <a href="/urgencias" className="nav-item">
                  <span className="nav-icon">🚑</span>
                  <span className="nav-text">Urgencias</span>
                </a>
                <a href="/consultas-externas" className="nav-item">
                  <span className="nav-icon">🩺</span>
                  <span className="nav-text">Consultas</span>
                </a>
                <a href="/hospitalizacion" className="nav-item">
                  <span className="nav-icon">🏥</span>
                  <span className="nav-text">Hospitalización</span>
                </a>
              </nav>

              <div className="sidebar-footer">
                <div className="user-profile">
                  <div className="user-avatar">👨‍⚕️</div>
                  <div className="user-info">
                    <span className="user-name">Dr. Rodríguez</span>
                    <span className="user-role">Médico General</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* CONTENIDO PRINCIPAL - CORREGIDO */}
            <main className="main-content">
              {/* Header simplificado integrado */}
              <header className="header">
                <div className="breadcrumbs">
                  <span className="breadcrumb-active">Dashboard</span>
                </div>
                <div className="header-actions">
                  <button className="btn-notification">
                    <span>🔔</span>
                    <span className="notification-badge">3</span>
                  </button>
                  <div className="quick-stats">
                    <div className="stat-item">
                      <span className="stat-label">Pacientes Hoy</span>
                      <span className="stat-value-small">24</span>
                    </div>
                  </div>
                </div>
              </header>

              {/* ÁREA DE CONTENIDO - CORREGIDA */}
              <div className="content-area">
                <div className="content-wrapper">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}