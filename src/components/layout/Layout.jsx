import { NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { THEMES }   from '../../lib/themes'

const NAV = [
  {
    section: 'Principal',
    items: [
      { to: '/dashboard',       label: 'Inicio',          icon: <DashIcon /> },
      { to: '/proyectos',       label: 'Proyectos',       icon: <ProjIcon /> },
      { to: '/clientes',        label: 'Clientes',        icon: <ClientIcon /> },
      { to: '/comunicaciones',  label: 'Comunicaciones',  icon: <CommIcon /> },
      { to: '/calendario',      label: 'Calendario',      icon: <CalIcon /> },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { to: '/finanzas',        label: 'Finanzas',        icon: <FinIcon /> },
      { to: '/analisis',        label: 'Análisis',        icon: <AnalIcon /> },
      { to: '/notificaciones',  label: 'Alertas',         icon: <BellIcon /> },
      { to: '/reporte',         label: 'Reporte',         icon: <DocIcon /> },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { to: '/configuracion',   label: 'Config',          icon: <GearIcon /> },
    ],
  },
]

export default function Layout({ children }) {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className="sb">
        <div className="sb-logo" onClick={() => navigate('/dashboard')} style={{ textDecoration: 'none' }}>
          <div className="logo-m">FL</div>
          <div>
            <div className="logo-t">Freelow</div>
            <div className="logo-s">control de vuelo</div>
          </div>
        </div>

        <nav className="sb-nav">
          {NAV.map(group => (
            <div key={group.section}>
              <div className="nav-sec">{group.section}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => 'nav-it' + (isActive ? ' active' : '')}
                >
                  <span className="ni">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sb-themes">
          <div className="th-label">Tema</div>
          <div className="th-grid">
            {THEMES.map(t => (
              <div
                key={t.id}
                className={'th-dot' + (theme === t.id ? ' on' : '')}
                data-t={t.id}
                title={t.lbl}
                onClick={() => setTheme(t.id)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="app-main">
        {children}
      </div>
    </div>
  )
}

/* ── SVG Icons ── */
function DashIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg> }
function ProjIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="11" rx="2"/><path d="M5 3V1M11 3V1M1 7h14"/></svg> }
function ClientIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg> }
function CommIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 2 3-2h3a1 1 0 001-1V3a1 1 0 00-1-1z"/><path d="M4 6h8M4 9h5" strokeLinecap="round"/></svg> }
function CalIcon()    { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 4v4l3 2"/></svg> }
function FinIcon()    { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 4h14M1 8h9M1 12h6"/><circle cx="13" cy="11" r="2.5"/><path d="M13 9V8M15 13h1"/></svg> }
function AnalIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1,11 5,6 9,8 15,2"/><path d="M1 15h14"/></svg> }
function BellIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a5 5 0 015 5v3l1.5 2.5H1.5L3 9V6a5 5 0 015-5z"/><path d="M6 13a2 2 0 004 0"/></svg> }
function DocIcon()    { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M5 6h6M5 9h4"/></svg> }
function GearIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M3.1 12.9l1.1-1.1M11.8 4.2l1.1-1.1"/></svg> }
