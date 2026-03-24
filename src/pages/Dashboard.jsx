import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, put, getCfg } from '../lib/db'
import { calcEstado, diasHasta, dLabel, fmtFecha, ESTADO_META } from '../lib/utils'
import { Topbar, StatCard, Loading, Badge, ProgressBar, Modal, EmptyState } from '../components/ui/index.jsx'
import { toast, ToastProvider } from '../components/ui/Toast.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading,    setLoading]    = useState(true)
  const [proyectos,  setProyectos]  = useState([])
  const [clientes,   setClientes]   = useState([])
  const [nombre,     setNombre]     = useState('vos')
  const [ultimaExp,  setUltimaExp]  = useState(null)
  const [showModal,  setShowModal]  = useState(false)
  const [form,       setForm]       = useState({ nombre: '', cliente: '', tipo: 'Diseño gráfico', fechaCliente: '', fechaInterna: '' })

  async function load() {
    const [ps, cs, n, ue] = await Promise.all([
      getAll('proyectos'), getAll('clientes'),
      getCfg('nombreUsuario', 'vos'), getCfg('ultimaExportacion', null),
    ])
    // recalculate states
    for (const p of ps) {
      if (!p.archivado && p.estado !== 'entregado') {
        const nuevo = calcEstado(p.fechaEntregaCliente)
        if (nuevo !== p.estado) { p.estado = nuevo; await put('proyectos', p) }
      }
    }
    setProyectos(ps); setClientes(cs); setNombre(n || 'vos'); setUltimaExp(ue)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const activos     = proyectos.filter(p => !p.archivado && p.estado !== 'entregado')
  const criticos    = activos.filter(p => ['critico','urgente','vencido'].includes(p.estado))
  const pendPago    = proyectos.filter(p => p.montoPendiente > 0).length
  const h           = new Date().getHours()
  const saludo      = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  const hoy         = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const diasDesdeExp = ultimaExp ? Math.round((Date.now() - new Date(ultimaExp)) / 86400000) : null

  async function crearProyecto() {
    if (!form.nombre.trim() || !form.cliente.trim()) { toast('Nombre y cliente son obligatorios', 'er'); return }
    await put('proyectos', {
      nombre: form.nombre, clienteNombre: form.cliente, tipo: form.tipo,
      estado: calcEstado(form.fechaInterna || form.fechaCliente),
      progreso: 0, archivado: false,
      fechaEntregaCliente: form.fechaCliente ? form.fechaCliente + 'T12:00:00' : null,
      fechaEntregaInterna: form.fechaInterna ? form.fechaInterna + 'T12:00:00' : null,
    })
    setShowModal(false)
    setForm({ nombre: '', cliente: '', tipo: 'Diseño gráfico', fechaCliente: '', fechaInterna: '' })
    toast('✓ Proyecto creado')
    load()
  }

  if (loading) return <><Topbar title="Dashboard" /><Loading /></>

  return (
    <>
      <ToastProvider />
      <Topbar
        title={`${saludo}, ${nombre}`}
        subtitle={`${hoy.charAt(0).toUpperCase() + hoy.slice(1)} · ${activos.length} proyecto${activos.length !== 1 ? 's' : ''} activo${activos.length !== 1 ? 's' : ''}`}
        right={<button className="btn btn-p" onClick={() => setShowModal(true)}>+ Nuevo proyecto</button>}
      />

      <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Backup warning */}
        {(diasDesdeExp === null || diasDesdeExp > 30) && (
          <div style={{ background: 'var(--wa-bg)', border: '1px solid var(--wa-dot)', borderRadius: 'var(--rc)', padding: '12px 16px', fontSize: 13, color: 'var(--wa-tx)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠️</span>
            <span>{diasDesdeExp === null ? 'Nunca exportaste un backup.' : `Tu último backup tiene ${diasDesdeExp} días.`} Exportá desde <strong onClick={() => navigate('/configuracion')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Configuración</strong>.</span>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="📁" value={activos.length}   label="Proyectos activos" />
          <StatCard icon="👥" value={clientes.length}  label="Clientes" />
          <StatCard icon="🔴" value={criticos.length}  label="Urgentes/críticos" color="var(--cr-dot)" />
          <StatCard icon="💰" value={pendPago}         label="Con cobro pendiente" color="var(--wa-dot)" />
        </div>

        {/* Proyectos urgentes/críticos */}
        {criticos.length > 0 && (
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>🔴 Requieren atención</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {criticos.map(p => <ProyectoCard key={p.id} p={p} onClick={() => navigate(`/proyectos/${p.id}`)} />)}
            </div>
          </section>
        )}

        {/* Todos los activos */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Proyectos activos</h3>
            <button className="btn btn-g" style={{ fontSize: 11 }} onClick={() => navigate('/proyectos')}>Ver todos →</button>
          </div>
          {activos.length === 0
            ? <EmptyState icon="📁" title="Sin proyectos activos" sub="Creá tu primer proyecto con el botón de arriba." />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activos.slice(0, 6).map(p => <ProyectoCard key={p.id} p={p} onClick={() => navigate(`/proyectos/${p.id}`)} />)}
              </div>
          }
        </section>

      </div>

      {/* Modal nuevo proyecto */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo proyecto"
        footer={<>
          <button className="btn btn-g" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn btn-p" onClick={crearProyecto}>Crear proyecto</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Nombre del proyecto</label>
          <input className="form-input" placeholder="ej: Identidad visual" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Cliente</label>
          <input className="form-input" placeholder="Nombre del cliente" value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} list="clientes-list" />
          <datalist id="clientes-list">{clientes.map(c => <option key={c.id} value={c.nombre} />)}</datalist>
        </div>
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
            {['Diseño gráfico','Desarrollo web','Fotografía','Video','Redacción','Arquitectura','Ilustración','Marketing','Otro'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Entrega al cliente</label>
            <input className="form-input" type="date" value={form.fechaCliente} onChange={e => setForm(f => ({ ...f, fechaCliente: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Entrega interna</label>
            <input className="form-input" type="date" value={form.fechaInterna} onChange={e => setForm(f => ({ ...f, fechaInterna: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </>
  )
}

function ProyectoCard({ p, onClick }) {
  const m = ESTADO_META[p.estado] || ESTADO_META.ok
  return (
    <div className="card" onClick={onClick} style={{ padding: '14px 16px', cursor: 'pointer', transition: 'box-shadow .15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--sh)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.dot, flexShrink: 0, marginTop: 4 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)' }}>{p.clienteNombre} · {p.tipo}</div>
        </div>
        <Badge tipo={p.estado}>{m.lbl}</Badge>
        <div style={{ fontSize: 11, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{dLabel(p.fechaEntregaCliente)}</div>
      </div>
      <ProgressBar pct={p.progreso} color={m.dot} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--tx3)' }}>
        <span>{p.progreso || 0}%</span>
        <span>{fmtFecha(p.fechaEntregaCliente, { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}
