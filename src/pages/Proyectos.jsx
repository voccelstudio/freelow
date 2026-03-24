import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, put, del, uid } from '../lib/db'
import { calcEstado, diasHasta, dLabel, fmtFecha, ESTADO_META } from '../lib/utils'
import { Topbar, Modal, Badge, ProgressBar, Loading, EmptyState } from '../components/ui/index.jsx'
import { toast, ToastProvider } from '../components/ui/Toast.jsx'

const TIPOS = ['Diseño gráfico','Desarrollo web','Fotografía','Video','Redacción','Arquitectura','Ilustración','Marketing','Otro']

// ── PLANTILLAS POR TIPO ──────────────────────────────────────
const PLANTILLAS = {
  'Diseño gráfico': [
    { titulo: 'Brief y relevamiento',          horas: 2 },
    { titulo: 'Investigación y referencias',   horas: 3 },
    { titulo: 'Moodboard',                     horas: 2 },
    { titulo: 'Propuesta de concepto',         horas: 4 },
    { titulo: 'Bocetos iniciales',             horas: 6 },
    { titulo: 'Digitalización',               horas: 8 },
    { titulo: 'Primera revisión con cliente',  horas: 1 },
    { titulo: 'Ajustes ronda 1',              horas: 4 },
    { titulo: 'Segunda revisión',             horas: 1 },
    { titulo: 'Ajustes ronda 2',              horas: 2 },
    { titulo: 'Archivos finales y exportación',horas: 2 },
  ],
  'Desarrollo web': [
    { titulo: 'Relevamiento de requerimientos', horas: 3 },
    { titulo: 'Wireframes / estructura',        horas: 6 },
    { titulo: 'Diseño UI',                      horas: 10 },
    { titulo: 'Aprobación de diseño',           horas: 1 },
    { titulo: 'Setup del proyecto',             horas: 2 },
    { titulo: 'Desarrollo frontend',            horas: 20 },
    { titulo: 'Integración backend / CMS',      horas: 10 },
    { titulo: 'Testing y corrección de bugs',   horas: 6 },
    { titulo: 'Revisión con cliente',           horas: 2 },
    { titulo: 'Ajustes finales',               horas: 4 },
    { titulo: 'Deploy y entrega',              horas: 2 },
  ],
  'Fotografía': [
    { titulo: 'Brief y referencias',               horas: 1 },
    { titulo: 'Planificación de sesión',            horas: 2 },
    { titulo: 'Coordinación de locación y equipo', horas: 2 },
    { titulo: 'Sesión de fotos',                   horas: 4 },
    { titulo: 'Selección de tomas',                horas: 3 },
    { titulo: 'Edición y retoque',                 horas: 8 },
    { titulo: 'Revisión con cliente',              horas: 1 },
    { titulo: 'Ajustes de edición',                horas: 2 },
    { titulo: 'Exportación y entrega',             horas: 1 },
  ],
  'Video': [
    { titulo: 'Brief y guión',                     horas: 4 },
    { titulo: 'Storyboard',                        horas: 4 },
    { titulo: 'Planificación de rodaje',           horas: 3 },
    { titulo: 'Rodaje',                            horas: 8 },
    { titulo: 'Descarga y organización de material', horas: 2 },
    { titulo: 'Primer corte',                      horas: 10 },
    { titulo: 'Revisión con cliente',              horas: 1 },
    { titulo: 'Correcciones',                      horas: 4 },
    { titulo: 'Color grading',                     horas: 4 },
    { titulo: 'Sonido y música',                  horas: 3 },
    { titulo: 'Exportación y entrega',             horas: 1 },
  ],
  'Redacción': [
    { titulo: 'Brief y tono de marca',  horas: 2 },
    { titulo: 'Investigación del tema', horas: 4 },
    { titulo: 'Estructura y outline',   horas: 2 },
    { titulo: 'Primer borrador',        horas: 6 },
    { titulo: 'Revisión interna',       horas: 2 },
    { titulo: 'Revisión con cliente',   horas: 1 },
    { titulo: 'Ajustes',               horas: 2 },
    { titulo: 'Corrección final',       horas: 1 },
    { titulo: 'Entrega',               horas: 0.5 },
  ],
  'Arquitectura': [
    { titulo: 'Relevamiento del terreno/espacio', horas: 4 },
    { titulo: 'Brief con el cliente',             horas: 2 },
    { titulo: 'Programa de necesidades',          horas: 3 },
    { titulo: 'Anteproyecto',                     horas: 12 },
    { titulo: 'Revisión con cliente',             horas: 2 },
    { titulo: 'Ajustes de anteproyecto',          horas: 6 },
    { titulo: 'Proyecto ejecutivo',               horas: 20 },
    { titulo: 'Planos técnicos',                 horas: 15 },
    { titulo: 'Revisión final',                  horas: 2 },
    { titulo: 'Entrega de documentación',         horas: 2 },
  ],
  'Ilustración': [
    { titulo: 'Brief y referencias',       horas: 2 },
    { titulo: 'Bocetos a mano',            horas: 4 },
    { titulo: 'Aprobación de boceto',      horas: 1 },
    { titulo: 'Digitalización en limpio',  horas: 8 },
    { titulo: 'Color base',               horas: 4 },
    { titulo: 'Detalle y acabados',       horas: 6 },
    { titulo: 'Revisión con cliente',      horas: 1 },
    { titulo: 'Ajustes',                  horas: 3 },
    { titulo: 'Exportación y entrega',     horas: 1 },
  ],
  'Marketing': [
    { titulo: 'Brief y objetivos',          horas: 2 },
    { titulo: 'Investigación de mercado',   horas: 4 },
    { titulo: 'Estrategia y plan',          horas: 6 },
    { titulo: 'Aprobación de estrategia',   horas: 1 },
    { titulo: 'Producción de contenidos',   horas: 12 },
    { titulo: 'Diseño de piezas',          horas: 8 },
    { titulo: 'Revisión con cliente',       horas: 2 },
    { titulo: 'Ajustes',                   horas: 3 },
    { titulo: 'Implementación',            horas: 6 },
    { titulo: 'Reporte de resultados',      horas: 2 },
  ],
  'Otro': [
    { titulo: 'Relevamiento inicial',    horas: 2 },
    { titulo: 'Propuesta y presupuesto', horas: 2 },
    { titulo: 'Aprobación',             horas: 1 },
    { titulo: 'Desarrollo / ejecución', horas: 10 },
    { titulo: 'Revisión con cliente',    horas: 1 },
    { titulo: 'Ajustes',               horas: 3 },
    { titulo: 'Entrega final',          horas: 1 },
  ],
}

// Distribuye fechas límite hacia atrás desde la fecha de entrega
function calcFechasTareas(tareas, fechaEntregaStr) {
  if (!fechaEntregaStr) return tareas.map(t => ({ ...t, fechaLimite: '' }))
  const entrega    = new Date(fechaEntregaStr + 'T12:00:00')
  const totalHoras = tareas.reduce((a, t) => a + (t.horas || 0), 0)
  const totalDias  = Math.ceil(totalHoras / 6) // 6h productivas por día
  let cursor = new Date(entrega)
  const result = []
  for (let i = tareas.length - 1; i >= 0; i--) {
    const t    = tareas[i]
    const dias = Math.max(1, Math.round((t.horas / totalHoras) * totalDias))
    result.unshift({ ...t, fechaLimite: cursor.toISOString().split('T')[0] })
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() - dias)
  }
  return result
}

const FILTROS = [
  { id: 'all',       lbl: 'Todos' },
  { id: 'critico',   lbl: '🔴 Críticos' },
  { id: 'urgente',   lbl: '🟡 Urgentes' },
  { id: 'atencion',  lbl: '🔵 Atención' },
  { id: 'ok',        lbl: '✅ A tiempo' },
  { id: 'entregado', lbl: '📦 Entregados' },
  { id: 'archivado', lbl: '🗃 Archivados' },
]

export default function Proyectos() {
  const navigate = useNavigate()
  const [loading,          setLoading]          = useState(true)
  const [proyectos,        setProyectos]        = useState([])
  const [clientes,         setClientes]         = useState([])
  const [filtro,           setFiltro]           = useState('all')
  const [vista,            setVista]            = useState('list')
  const [q,                setQ]                = useState('')
  const [showModal,        setShowModal]        = useState(false)
  const [editando,         setEditando]         = useState(null)
  const [step,             setStep]             = useState(1) // 1=datos, 2=tareas
  const [form,             setForm]             = useState({ nombre:'', cliente:'', tipo:'Diseño gráfico', fechaCliente:'', fechaInterna:'' })
  const [tareasPlantilla,  setTareasPlantilla]  = useState([])

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
    setStep(1)
    setForm({ nombre:'', cliente:'', tipo:'Diseño gráfico', fechaCliente:'', fechaInterna:'' })
    setShowModal(true)
  }

  function openEdit(p, e) {
    e.stopPropagation()
    setEditando(p)
    setStep(1)
    setForm({
      nombre: p.nombre, cliente: p.clienteNombre,
      tipo: p.tipo || 'Diseño gráfico',
      fechaCliente: p.fechaEntregaCliente?.split('T')[0] || '',
      fechaInterna: p.fechaEntregaInterna?.split('T')[0] || '',
    })
    setShowModal(true)
  }

  function avanzarATareas() {
    if (!form.nombre.trim() || !form.cliente.trim()) { toast('Nombre y cliente son obligatorios', 'er'); return }
    const base      = PLANTILLAS[form.tipo] || PLANTILLAS['Otro']
    const conFechas = calcFechasTareas(base, form.fechaCliente || form.fechaInterna)
    setTareasPlantilla(conFechas.map((t, i) => ({ ...t, id: uid(), activa: true, orden: i + 1 })))
    setStep(2)
  }

  function toggleTarea(idx)          { setTareasPlantilla(p => p.map((t,i) => i===idx ? {...t, activa:!t.activa} : t)) }
  function editTitulo(idx, val)      { setTareasPlantilla(p => p.map((t,i) => i===idx ? {...t, titulo:val} : t)) }
  function editFecha(idx, val)       { setTareasPlantilla(p => p.map((t,i) => i===idx ? {...t, fechaLimite:val} : t)) }
  function editHoras(idx, val)       { setTareasPlantilla(p => p.map((t,i) => i===idx ? {...t, horas:parseFloat(val)||0} : t)) }
  function eliminarTarea(idx)        { setTareasPlantilla(p => p.filter((_,i) => i!==idx)) }
  function agregarTarea()            { setTareasPlantilla(p => [...p, { id:uid(), titulo:'', horas:1, activa:true, fechaLimite:'', orden:p.length+1 }]) }
  function activarTodas()            { setTareasPlantilla(p => p.map(t => ({...t, activa:true}))) }
  function desactivarTodas()         { setTareasPlantilla(p => p.map(t => ({...t, activa:false}))) }

  async function crearProyecto(conTareas) {
    if (!form.nombre.trim() || !form.cliente.trim()) { toast('Nombre y cliente son obligatorios', 'er'); return }
    const base = editando || {}
    const proyecto = await put('proyectos', {
      ...base,
      nombre: form.nombre, clienteNombre: form.cliente, tipo: form.tipo,
      estado: base.estado === 'entregado' ? 'entregado' : calcEstado(form.fechaInterna || form.fechaCliente),
      progreso: base.progreso || 0, archivado: base.archivado || false,
      fechaEntregaCliente: form.fechaCliente ? form.fechaCliente + 'T12:00:00' : null,
      fechaEntregaInterna: form.fechaInterna ? form.fechaInterna + 'T12:00:00' : null,
    })
    if (!editando && conTareas) {
      const activas = tareasPlantilla.filter(t => t.activa && t.titulo.trim())
      for (let i = 0; i < activas.length; i++) {
        await put('tareas', {
          proyectoId: proyecto.id,
          titulo:     activas[i].titulo,
          horas:      activas[i].horas,
          fechaLimite: activas[i].fechaLimite ? activas[i].fechaLimite + 'T12:00:00' : null,
          completada: false,
          orden:      i + 1,
        })
      }
      toast(`✓ Proyecto creado con ${activas.length} tarea${activas.length !== 1 ? 's' : ''}`)
    } else {
      toast(editando ? '✓ Proyecto actualizado' : '✓ Proyecto creado')
    }
    setShowModal(false)
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
  }).filter(p => !q || [p.nombre, p.clienteNombre, p.tipo].join(' ').toLowerCase().includes(q.toLowerCase()))

  const horasActivas = tareasPlantilla.filter(t => t.activa).reduce((a, t) => a + (t.horas || 0), 0)
  const tareasActivas = tareasPlantilla.filter(t => t.activa).length

  if (loading) return <><Topbar title="Proyectos" /><Loading /></>

  return (
    <>
      <ToastProvider />
      <Topbar
        title="Proyectos"
        subtitle={`${proyectos.filter(p => !p.archivado && p.estado !== 'entregado').length} activos · ${proyectos.length} total`}
        right={<>
          <button className="btn btn-g" onClick={() => setVista(v => v === 'list' ? 'kanban' : 'list')}>
            {vista === 'list' ? '⊞ Kanban' : '☰ Lista'}
          </button>
          <button className="btn btn-p" onClick={openNew}>+ Nuevo</button>
        </>}
      />

      <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTROS.map(f => (
            <button key={f.id} className={`chip${filtro === f.id ? ' on' : ''}`} onClick={() => setFiltro(f.id)}>{f.lbl}</button>
          ))}
          <input className="form-input" style={{ width: 200, padding: '5px 10px', fontSize: 12, marginLeft: 'auto' }}
            placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        {list.length === 0
          ? <EmptyState icon="📁" title="Sin proyectos" sub="Creá tu primer proyecto con el botón de arriba."
              action={<button className="btn btn-p" onClick={openNew}>+ Nuevo proyecto</button>} />
          : vista === 'list'
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map(p => (
                  <ProyectoRow key={p.id} p={p}
                    onOpen={() => navigate(`/proyectos/${p.id}`)}
                    onEdit={e => openEdit(p, e)}
                    onArchive={e => archivar(p, e)}
                    onDeliver={e => marcarEntregado(p, e)}
                    onDelete={e => eliminar(p, e)}
                  />
                ))}
              </div>
            : <KanbanView proyectos={list} onOpen={p => navigate(`/proyectos/${p.id}`)} />
        }
      </div>

      {/* ── MODAL ── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        wide={step === 2}
        title={
          editando       ? 'Editar proyecto' :
          step === 1     ? 'Nuevo proyecto' :
                           `Plantilla de tareas — ${form.tipo}`
        }
        footer={
          step === 1 ? (
            <>
              <button className="btn btn-g" onClick={() => setShowModal(false)}>Cancelar</button>
              {editando
                ? <button className="btn btn-p" onClick={() => crearProyecto(false)}>Guardar</button>
                : <>
                    <button className="btn btn-g" onClick={() => crearProyecto(false)}>Crear sin tareas</button>
                    <button className="btn btn-p" onClick={avanzarATareas}>Elegir tareas →</button>
                  </>
              }
            </>
          ) : (
            <>
              <button className="btn btn-g" onClick={() => setStep(1)}>← Atrás</button>
              <button className="btn btn-g" onClick={() => crearProyecto(false)}>Crear sin tareas</button>
              <button className="btn btn-p" onClick={() => crearProyecto(true)}>
                Crear con {tareasActivas} tarea{tareasActivas !== 1 ? 's' : ''}
              </button>
            </>
          )
        }
      >

        {/* STEP 1 — datos del proyecto */}
        {step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-input" autoFocus placeholder="ej: Identidad visual"
                value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <input className="form-input" placeholder="Nombre del cliente"
                value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} list="cl-list" />
              <datalist id="cl-list">{clientes.map(c => <option key={c.id} value={c.nombre} />)}</datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Entrega cliente</label>
                <input className="form-input" type="date" value={form.fechaCliente}
                  onChange={e => setForm(f => ({ ...f, fechaCliente: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Entrega interna</label>
                <input className="form-input" type="date" value={form.fechaInterna}
                  onChange={e => setForm(f => ({ ...f, fechaInterna: e.target.value }))} />
              </div>
            </div>
            {!editando && (
              <div style={{ fontSize: 12, color: 'var(--tx3)', padding: '8px 12px', background: 'var(--sf2)', borderRadius: 'var(--rc)', marginTop: 4 }}>
                💡 Al hacer "Elegir tareas" vas a ver la plantilla de <strong>{form.tipo}</strong> con {(PLANTILLAS[form.tipo] || PLANTILLAS['Otro']).length} tareas y tiempos estimados. Podés editar, quitar o agregar antes de crear.
              </div>
            )}
          </>
        )}

        {/* STEP 2 — plantilla de tareas */}
        {step === 2 && (
          <>
            {/* Resumen */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
                <strong>{tareasActivas}</strong> tareas activas ·{' '}
                <strong>{horasActivas}h</strong> estimadas ·{' '}
                ~{Math.ceil(horasActivas / 6)} día{Math.ceil(horasActivas / 6) !== 1 ? 's' : ''} de trabajo
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-g" style={{ fontSize: 11, padding: '3px 8px' }} onClick={activarTodas}>Todas</button>
                <button className="btn btn-g" style={{ fontSize: 11, padding: '3px 8px' }} onClick={desactivarTodas}>Ninguna</button>
              </div>
            </div>

            {/* Lista de tareas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, overflowY: 'auto', paddingRight: 2 }}>
              {tareasPlantilla.map((t, idx) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  background: t.activa ? 'var(--sf)' : 'var(--sf2)',
                  border: `1px solid ${t.activa ? 'var(--br)' : 'transparent'}`,
                  borderRadius: 'var(--rc)', opacity: t.activa ? 1 : 0.45, transition: 'all .15s',
                }}>
                  {/* Checkbox */}
                  <div onClick={() => toggleTarea(idx)} style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                    border: `2px solid ${t.activa ? 'var(--ac)' : 'var(--br)'}`,
                    background: t.activa ? 'var(--ac)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {t.activa && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--acf)" strokeWidth="2.5"><path d="M2 6l3 3 5-5" /></svg>}
                  </div>

                  {/* Número */}
                  <span style={{ fontSize: 10, color: 'var(--tx3)', minWidth: 16, textAlign: 'right', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{idx + 1}.</span>

                  {/* Título */}
                  <input value={t.titulo} onChange={e => editTitulo(idx, e.target.value)}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--tx)', fontFamily: 'var(--fui)', minWidth: 0 }} />

                  {/* Horas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <input type="number" value={t.horas} min="0.5" step="0.5"
                      onChange={e => editHoras(idx, e.target.value)}
                      style={{ width: 44, fontSize: 11, textAlign: 'right', background: 'var(--sf2)', border: '1px solid var(--br)', borderRadius: 6, padding: '2px 4px', color: 'var(--tx2)', fontFamily: 'var(--font-mono)' }} />
                    <span style={{ fontSize: 10, color: 'var(--tx3)' }}>h</span>
                  </div>

                  {/* Fecha límite */}
                  <input type="date" value={t.fechaLimite || ''} onChange={e => editFecha(idx, e.target.value)}
                    style={{ fontSize: 11, color: 'var(--tx3)', background: 'none', border: '1px solid var(--br)', borderRadius: 6, padding: '2px 6px', fontFamily: 'var(--fui)', width: 126, flexShrink: 0 }} />

                  {/* Eliminar */}
                  <button onClick={() => eliminarTarea(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', padding: '2px 4px', fontSize: 13, lineHeight: 1, flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>

            <button className="btn btn-g" style={{ marginTop: 10, width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={agregarTarea}>
              + Agregar tarea
            </button>
          </>
        )}
      </Modal>
    </>
  )
}

// ── ProyectoRow ──────────────────────────────────────────────
function ProyectoRow({ p, onOpen, onEdit, onArchive, onDeliver, onDelete }) {
  const m = ESTADO_META[p.estado] || ESTADO_META.ok
  return (
    <div className="card" onClick={onOpen}
      style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--sh)'}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>{p.clienteNombre} · {p.tipo}</div>
        <div style={{ marginTop: 8 }}><ProgressBar pct={p.progreso} color={m.dot} /></div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <Badge tipo={p.estado}>{m.lbl}</Badge>
        <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>{dLabel(p.fechaEntregaCliente)}</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
        <button className="btn btn-g" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onEdit}>✏️</button>
        {p.estado !== 'entregado' && <button className="btn btn-g" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onDeliver} title="Marcar entregado">✓</button>}
        <button className="btn btn-g" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onArchive} title={p.archivado ? 'Restaurar' : 'Archivar'}>{p.archivado ? '↩' : '🗃'}</button>
        <button className="btn btn-g" style={{ padding: '4px 8px', fontSize: 11, color: 'var(--cr-tx)' }} onClick={onDelete}>🗑</button>
      </div>
    </div>
  )
}

// ── KanbanView ───────────────────────────────────────────────
const COLS = [
  { id: 'critico',   lbl: '🔴 Crítico' },
  { id: 'urgente',   lbl: '🟡 Urgente' },
  { id: 'atencion',  lbl: '🔵 Atención' },
  { id: 'ok',        lbl: '✅ A tiempo' },
  { id: 'entregado', lbl: '📦 Entregado' },
]
function KanbanView({ proyectos, onOpen }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, overflowX: 'auto' }}>
      {COLS.map(col => {
        const items = proyectos.filter(p => p.estado === col.id)
        const m     = ESTADO_META[col.id]
        return (
          <div key={col.id}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: 'var(--tx2)' }}>
              {col.lbl} <span style={{ color: 'var(--tx3)' }}>({items.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(p => (
                <div key={p.id} className="card" onClick={() => onOpen(p)}
                  style={{ padding: 12, cursor: 'pointer', borderLeft: `3px solid ${m.dot}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 8 }}>{p.clienteNombre}</div>
                  <ProgressBar pct={p.progreso} color={m.dot} />
                  <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>{p.progreso || 0}%</div>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--tx3)', padding: 12, textAlign: 'center', border: '1px dashed var(--br)', borderRadius: 'var(--rc)' }}>—</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
