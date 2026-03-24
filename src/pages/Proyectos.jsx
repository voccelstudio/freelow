import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, put, del } from '../lib/db'
import { calcEstado, diasHasta, dLabel, fmtFecha, ESTADO_META } from '../lib/utils'
import { Topbar, Modal, Badge, ProgressBar, Loading, EmptyState } from '../components/ui/index.jsx'
import { toast, ToastProvider } from '../components/ui/Toast.jsx'

const TIPOS = ['Diseño gráfico','Desarrollo web','Fotografía','Video','Redacción','Arquitectura','Ilustración','Marketing','Otro']
const FILTROS = [
  { id: 'all',      lbl: 'Todos' },
  { id: 'critico',  lbl: '🔴 Críticos' },
  { id: 'urgente',  lbl: '🟡 Urgentes' },
  { id: 'atencion', lbl: '🔵 Atención' },
  { id: 'ok',       lbl: '✅ A tiempo' },
  { id: 'entregado',lbl: '📦 Entregados' },
  { id: 'archivado',lbl: '🗃 Archivados' },
]

export default function Proyectos() {
  const navigate = useNavigate()
  const [loading,   setLoading]   = useState(true)
  const [proyectos, setProyectos] = useState([])
  const [clientes,  setClientes]  = useState([])
  const [filtro,    setFiltro]    = useState('all')
  const [vista,     setVista]     = useState('list') // list | kanban
  const [q,         setQ]         = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [form,      setForm]      = useState({ nombre:'', cliente:'', tipo:'Diseño gráfico', fechaCliente:'', fechaInterna:'' })

  async function load() {
    const [ps, cs] = await Promise.all([getAll('proyectos'), getAll('clientes')])
    for (const p of ps) {
      if (!p.archivado && p.estado !== 'entregado') {
        const nuevo = calcEstado(p.fechaEntregaCliente)
        if (nuevo !== p.estado) { p.estado = nuevo; await put('proyectos', p) }
      }
    }
    setProyectos(ps); setClientes(cs); setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditando(null)
    setForm({ nombre:'', cliente:'', tipo:'Diseño gráfico', fechaCliente:'', fechaInterna:'' })
    setShowModal(true)
  }

  function openEdit(p, e) {
    e.stopPropagation()
    setEditando(p)
    setForm({
      nombre: p.nombre, cliente: p.clienteNombre,
      tipo: p.tipo || 'Diseño gráfico',
      fechaCliente: p.fechaEntregaCliente?.split('T')[0] || '',
      fechaInterna: p.fechaEntregaInterna?.split('T')[0] || '',
    })
    setShowModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.cliente.trim()) { toast('Nombre y cliente son obligatorios','er'); return }
    const base = editando || {}
    await put('proyectos', {
      ...base,
      nombre: form.nombre, clienteNombre: form.cliente, tipo: form.tipo,
      estado: base.estado === 'entregado' ? 'entregado' : calcEstado(form.fechaInterna || form.fechaCliente),
      progreso: base.progreso || 0, archivado: base.archivado || false,
      fechaEntregaCliente: form.fechaCliente ? form.fechaCliente + 'T12:00:00' : null,
      fechaEntregaInterna: form.fechaInterna ? form.fechaInterna + 'T12:00:00' : null,
    })
    setShowModal(false)
    toast(editando ? '✓ Proyecto actualizado' : '✓ Proyecto creado')
    load()
  }

  async function archivar(p, e) {
    e.stopPropagation()
    await put('proyectos', { ...p, archivado: !p.archivado })
    toast(p.archivado ? '✓ Proyecto restaurado' : '✓ Proyecto archivado')
    load()
  }

  async function marcarEntregado(p, e) {
    e.stopPropagation()
    await put('proyectos', { ...p, estado: 'entregado', progreso: 100 })
    toast('✓ Proyecto marcado como entregado')
    load()
  }

  async function eliminar(p, e) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    await del('proyectos', p.id)
    toast('Proyecto eliminado')
    load()
  }

  const list = proyectos.filter(p => {
    if (filtro === 'archivado') return p.archivado
    if (p.archivado) return false
    if (filtro === 'all') return true
    return p.estado === filtro
  }).filter(p => {
    if (!q) return true
    return [p.nombre, p.clienteNombre, p.tipo].join(' ').toLowerCase().includes(q.toLowerCase())
  })

  if (loading) return <><Topbar title="Proyectos" /><Loading /></>

  return (
    <>
      <ToastProvider />
      <Topbar
        title="Proyectos"
        subtitle={`${proyectos.filter(p => !p.archivado && p.estado !== 'entregado').length} activos · ${proyectos.length} total`}
        right={<>
          <button className={'btn btn-g'} onClick={() => setVista(v => v === 'list' ? 'kanban' : 'list')}>
            {vista === 'list' ? '⊞ Kanban' : '☰ Lista'}
          </button>
          <button className="btn btn-p" onClick={openNew}>+ Nuevo</button>
        </>}
      />

      <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTROS.map(f => (
            <button key={f.id} className={`chip${filtro === f.id ? ' on' : ''}`} onClick={() => setFiltro(f.id)}>{f.lbl}</button>
          ))}
          <input
            className="form-input" style={{ width: 200, padding: '5px 10px', fontSize: 12, marginLeft: 'auto' }}
            placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)}
          />
        </div>

        {list.length === 0
          ? <EmptyState icon="📁" title="Sin proyectos" sub="Creá tu primer proyecto con el botón de arriba." action={<button className="btn btn-p" onClick={openNew}>+ Nuevo proyecto</button>} />
          : vista === 'list'
            ? <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {list.map(p => <ProyectoRow key={p.id} p={p} onOpen={() => navigate(`/proyectos/${p.id}`)} onEdit={e => openEdit(p,e)} onArchive={e => archivar(p,e)} onDeliver={e => marcarEntregado(p,e)} onDelete={e => eliminar(p,e)} />)}
              </div>
            : <KanbanView proyectos={list} onOpen={p => navigate(`/proyectos/${p.id}`)} />
        }
      </div>

      <Modal
        open={showModal} onClose={() => setShowModal(false)}
        title={editando ? 'Editar proyecto' : 'Nuevo proyecto'}
        footer={<>
          <button className="btn btn-g" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn btn-p" onClick={guardar}>Guardar</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input className="form-input" placeholder="ej: Identidad visual" autoFocus value={form.nombre} onChange={e => setForm(f=>({...f, nombre:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Cliente</label>
          <input className="form-input" placeholder="Nombre del cliente" value={form.cliente} onChange={e => setForm(f=>({...f,cliente:e.target.value}))} list="cl-list" />
          <datalist id="cl-list">{clientes.map(c=><option key={c.id} value={c.nombre}/>)}</datalist>
        </div>
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
            {TIPOS.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Entrega cliente</label><input className="form-input" type="date" value={form.fechaCliente} onChange={e=>setForm(f=>({...f,fechaCliente:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Entrega interna</label><input className="form-input" type="date" value={form.fechaInterna} onChange={e=>setForm(f=>({...f,fechaInterna:e.target.value}))}/></div>
        </div>
      </Modal>
    </>
  )
}

function ProyectoRow({ p, onOpen, onEdit, onArchive, onDeliver, onDelete }) {
  const m = ESTADO_META[p.estado] || ESTADO_META.ok
  return (
    <div className="card" onClick={onOpen} style={{ padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--sh)'}
    >
      <div style={{width:10,height:10,borderRadius:'50%',background:m.dot,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nombre}</div>
        <div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>{p.clienteNombre} · {p.tipo}</div>
        <div style={{marginTop:8}}><ProgressBar pct={p.progreso} color={m.dot} /></div>
      </div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <Badge tipo={p.estado}>{m.lbl}</Badge>
        <div style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>{dLabel(p.fechaEntregaCliente)}</div>
      </div>
      <div style={{display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>
        <button className="btn btn-g" style={{padding:'4px 8px',fontSize:11}} onClick={onEdit}>✏️</button>
        {p.estado !== 'entregado' && <button className="btn btn-g" style={{padding:'4px 8px',fontSize:11}} onClick={onDeliver} title="Marcar entregado">✓</button>}
        <button className="btn btn-g" style={{padding:'4px 8px',fontSize:11}} onClick={onArchive} title={p.archivado?'Restaurar':'Archivar'}>{p.archivado?'↩':'🗃'}</button>
        <button className="btn btn-g" style={{padding:'4px 8px',fontSize:11,color:'var(--cr-tx)'}} onClick={onDelete}>🗑</button>
      </div>
    </div>
  )
}

const COLS = [
  { id:'critico',   lbl:'🔴 Crítico' },
  { id:'urgente',   lbl:'🟡 Urgente' },
  { id:'atencion',  lbl:'🔵 Atención' },
  { id:'ok',        lbl:'✅ A tiempo' },
  { id:'entregado', lbl:'📦 Entregado' },
]
function KanbanView({ proyectos, onOpen }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, overflowX:'auto' }}>
      {COLS.map(col => {
        const items = proyectos.filter(p => p.estado === col.id)
        const m = ESTADO_META[col.id]
        return (
          <div key={col.id}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:8,color:'var(--tx2)'}}>{col.lbl} <span style={{color:'var(--tx3)'}}>({items.length})</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {items.map(p=>(
                <div key={p.id} className="card" onClick={()=>onOpen(p)} style={{padding:12,cursor:'pointer',borderLeft:`3px solid ${m.dot}`}}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>{p.nombre}</div>
                  <div style={{fontSize:11,color:'var(--tx3)',marginBottom:8}}>{p.clienteNombre}</div>
                  <ProgressBar pct={p.progreso} color={m.dot} />
                  <div style={{fontSize:10,color:'var(--tx3)',marginTop:4}}>{p.progreso||0}%</div>
                </div>
              ))}
              {items.length===0&&<div style={{fontSize:12,color:'var(--tx3)',padding:12,textAlign:'center',border:'1px dashed var(--br)',borderRadius:'var(--rc)'}}>—</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
