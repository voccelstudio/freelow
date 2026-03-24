import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCfg, seed } from './lib/db'
import { applyTheme } from './lib/themes'

import Layout       from './components/layout/Layout'
import Onboarding   from './pages/Onboarding'
import Dashboard    from './pages/Dashboard'
import Proyectos    from './pages/Proyectos'
import ProyectoDetalle from './pages/ProyectoDetalle'
import Clientes     from './pages/Clientes'
import Comunicaciones from './pages/Comunicaciones'
import Calendario   from './pages/Calendario'
import Finanzas     from './pages/Finanzas'
import Analisis     from './pages/Analisis'
import Notificaciones from './pages/Notificaciones'
import Reporte      from './pages/Reporte'
import Colaborador  from './pages/Colaborador'
import Configuracion from './pages/Configuracion'

export default function App() {
  const [ready,        setReady]        = useState(false)
  const [onboardingOk, setOnboardingOk] = useState(false)

  useEffect(() => {
    async function boot() {
      // Apply theme before anything renders
      const tema = await getCfg('tema', 'minimal')
      applyTheme(tema || 'minimal')
      // Seed demo data if first time
      await seed()
      const done = await getCfg('onboardingHecho', false)
      setOnboardingOk(!!done)
      setReady(true)
    }
    boot()
  }, [])

  if (!ready) return null   // blank while IndexedDB initializes

  return (
    <HashRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding onDone={() => setOnboardingOk(true)} />} />
        <Route path="/colaborador" element={<Colaborador />} />
        <Route
          path="/*"
          element={
            onboardingOk
              ? <Layout>
                  <Routes>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard"      element={<Dashboard />} />
                    <Route path="proyectos"      element={<Proyectos />} />
                    <Route path="proyectos/:id"  element={<ProyectoDetalle />} />
                    <Route path="clientes"       element={<Clientes />} />
                    <Route path="comunicaciones" element={<Comunicaciones />} />
                    <Route path="calendario"     element={<Calendario />} />
                    <Route path="finanzas"       element={<Finanzas />} />
                    <Route path="analisis"       element={<Analisis />} />
                    <Route path="notificaciones" element={<Notificaciones />} />
                    <Route path="reporte"        element={<Reporte />} />
                    <Route path="configuracion"  element={<Configuracion />} />
                    <Route path="*"              element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              : <Navigate to="/onboarding" replace />
          }
        />
      </Routes>
    </HashRouter>
  )
}
