// src/app/page.tsx
import React from 'react'

const stats = [
  {
    title: 'Pacientes Hoy',
    value: '24',
    change: '+12%',
    trend: 'up',
    icon: '👥',
    color: 'blue'
  },
  {
    title: 'Urgencias Activas',
    value: '8',
    change: '-2%',
    trend: 'down',
    icon: '🚑',
    color: 'red'
  },
  {
    title: 'Camas Ocupadas',
    value: '64%',
    change: '+5%',
    trend: 'up',
    icon: '🏥',
    color: 'green'
  },
  {
    title: 'Consultas Programadas',
    value: '18',
    change: '+3%',
    trend: 'up',
    icon: '🩺',
    color: 'purple'
  }
]

export default function Home() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel de Control Hospitalario</h1>
        <p>Bienvenido al sistema de gestión hospitalaria para docencia</p>
      </div>

      {/* Stats Grid integrado */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <div className={`stat-icon stat-icon-${stat.color}`}>
                {stat.icon}
              </div>
              <div className={`stat-trend stat-trend-${stat.trend}`}>
                {stat.change}
              </div>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="dashboard-content">
        <div className="content-card">
          <h2>Actividad Reciente del Hospital</h2>
          <div className="recent-activity">
            <div className="activity-item">
              <span className="activity-icon">🆕</span>
              <div className="activity-info">
                <p>Nuevo paciente registrado en Urgencias</p>
                <span className="activity-time">Hace 5 minutos</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📋</span>
              <div className="activity-info">
                <p>Consulta completada en Cardiología</p>
                <span className="activity-time">Hace 15 minutos</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🏥</span>
              <div className="activity-info">
                <p>Paciente dado de alta de Hospitalización</p>
                <span className="activity-time">Hace 1 hora</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h2>Módulos del Sistema</h2>
          <div className="modules-grid">
            <a href="/pacientes" className="module-card">
              <div className="module-icon">👥</div>
              <h3>Gestión de Pacientes</h3>
              <p>Administre historiales médicos y datos de pacientes</p>
            </a>
            <a href="/urgencias" className="module-card">
              <div className="module-icon">🚑</div>
              <h3>Módulo de Urgencias</h3>
              <p>Triage y gestión de casos de emergencia</p>
            </a>
            <a href="/consultas-externas" className="module-card"> {/* ✅ CORREGIDO */}
              <div className="module-icon">🩺</div>
              <h3>Consultas Externas</h3>
              <p>Agenda y gestión de consultas médicas</p>
            </a>
            <a href="/hospitalizacion" className="module-card">
              <div className="module-icon">🏥</div>
              <h3>Hospitalización</h3>
              <p>Control de camas y pacientes internados</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}