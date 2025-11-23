// app/urgencias/gestion/page.tsx
import { Suspense } from 'react'
import GestionUrgenciaContent from './GestionUrgenciaContent'
export default function GestionUrgenciaPage() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando gestión de urgencia...</p>
      </div>
    }>
      <GestionUrgenciaContent />
    </Suspense>
  )
}