import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAll, getOne, put, del, byIdx } from '../lib/db'
import { calcEstado, diasHasta, dLabel, fmtFecha, ESTADO_META, initials, avatarPalette } from '../lib/utils'
import { Modal, Badge, ProgressBar, Loading, EmptyState } from '../components/ui/index.jsx'
import { toast, ToastProvider } from '../components/ui/Toast.jsx'

const TABS = ['tareas','notas','equipo','actividad','comunicaciones']

export default function ProyectoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading,    setLoading]    = useState(true)
  const [proyecto,   setProyecto]   = useState(null)
  const [tareas,     setTareas]     = useState([])
  const [colabs,     setColabs]     = useState([])
  const [comms,      setComms]      = useState([])
  const [clientes,   setClientes]   = useState([])
  const [tab,        setTab]        = useState('tareas')
  const [showModal,  setShowModal]  = useState(null) // 'tarea'|'colab'|'edit'|'progreso'
  const [form,       setForm]       = useState({})
  const [nota,       setNota]       = useState('')
  const notaTimer                   = useRef(null)
  const activityKey                 = `activity_p_${id}`

  async function load() {
    const [ps, cs, ts, col, cms] = await Promise.all([
      getAll('proyectos'), getAll('clientes'),
      byIdx('tareas','proyectoId', id || ''),
      getAll('colaboradores'),
      byIdx('comunicaciones','clienteId', ''), // loaded after we know clienteId
    ])
    let p = ps.find(x => x.id === id) || ps.find(x => !x.archivado) || ps[0]
    if (!p) { setLoading(false); return }
    if (!p.archivado && p.estado !== 'entregado') {
      const nuevo = calcEstado(p.fechaEntregaCliente)
      if (nuevo !== p.estado) { p.estado = nuevo; await put('proyectos', p) }
    }
    const projTareas = await byIdx('tareas','proyectoId', p.id)
    projTareas.sort((a,b)=>(a.orden||0)-(b.orden||0))
    const projComms = p.clienteId ? await byIdx('comunicaciones','clienteId', p.clienteId) : []
    const projCommsFilt = projComms.filter(c => !c.proyectoId || c.proyectoId === p.id)
    setProyecto(p); setTareas(projTareas); setColabs(col); setComms(projCommsFilt); setClientes(cs)
    setNota(p.notas || '')
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  function addActivity(msg) {
    const log = JSON.parse(localStorage.getItem(activityKey)||'[]')
    log.unshift({ msg, ts: new Date().toISOString() })
    if (log.length > 30) log.pop()
    localStorage.setItem(activityKey, JSON.stringify(log))
  }
  function getActivity() {
    try { return JSON.parse(localStorage.getItem(activityKey)||'[]') } catch { return [] }
  }

  async function toggleTarea(t) {
    await put('tareas', { ...t, completada: !t.completada })
    addActivity(t.completada ? `Reabrió tarea: ${t.titulo}` : `Completó tarea: ${t.titulo}`)
    const nuevas = tareas.map(x => x.id === t.id ? { ...x, completada: !t.completada } : x)
    setTareas(nuevas)
    const pct = Math.round(nuevas.filter(x=>x.completada).length / nuevas.length * 100) || 0
    const updated = { ...proyecto, progreso: pct }
    await put('proyectos', updated)
    setProyecto(updated)
  }

  async function crearTarea() {
    if (!form.titulo?.trim()) { toast('La descripción es obligatoria','er'); return }
    const nueva = await put('tareas', { proyectoId: proyecto.id, titulo: form.titulo, fechaLimite: form.fechaLimite ? form.fechaLimite+'T12:00:00' : null, completada: false, orden: tareas.length + 1 })
    addActivity(`Creó tarea: ${form.titulo}`)
    setShowModal(null); setForm({})
    setTareas(prev=>[...prev, nueva])
    toast('✓ Tarea creada')
  }

  async function eliminarTarea(t) {
    await del('tareas', t.id)
    setTareas(prev => prev.filter(x=>x.id !== t.id))
    toast('Tarea eliminada')
  }

  async function crearColab() {
    if (!form.nombre?.trim()) { toast('El nombre es obligatorio','er'); return }
    await put('colaboradores', { nombre: form.nombre, rol: form.rol, email: form.email })
    setShowModal(null); setForm({})
    const col = await getAll('colaboradores')
    setColabs(col)
    toast('✓ Colaborador agregado')
  }

  async function guardarEdicion() {
    const updated = {
      ...proyecto, nombre: form.nombre, clienteNombre: form.cliente, tipo: form.tipo,
      fechaEntregaCliente: form.fechaCliente ? form.fechaCliente+'T12:00:00' : proyecto.fechaEntregaCliente,
      fechaEntregaInterna: form.fechaInterna ? form.fechaInterna+'T12:00:00' : proyecto.fechaEntregaInterna,
    }
    await put('proyectos', updated)
    setProyecto(updated); setShowModal(null)
    toast('✓ Proyecto actualizado')
  }

  async function guardarProgreso() {
    const updated = { ...proyecto, progreso: parseInt(form.progreso) || 0, estado: form.estado || proyecto.estado }
    await put('proyectos', updated); setProyecto(updated); setShowModal(null)
    toast('✓ Progreso actualizado')
  }

  function saveNota(val) {
    setNota(val)
    clearTimeout(notaTimer.current)
    notaTimer.current = setTimeout(async () => {
      await put('proyectos', { ...proyecto, notas: val })
    }, 800)
  }

  async function marcarEntregado() {
    const updated = { ...proyecto, estado: 'entregado', progreso: 100 }
    await put('proyectos', updated); setProyecto(updated)
    addActivity('Marcó el proyecto como entregado')
    toast('✓ Proyecto entregado')
  }

  if (loading) return <Loading />
  if (!proyecto) return <div className="content"><EmptyState icon="📁" title="Proyecto no encontrado" sub="El proyecto no existe o fue eliminado." action={<button className="btn btn-p" onClick={()=>navigate('/proyectos')}>← Volver a proyectos</button>} /></div>

  const m = ESTADO_META[proyecto.estado] || ESTADO_META.ok
  const completadas = tareas.filter(t=>t.completada).length

  return (
    <>
      <ToastProvider />
      {/* Topbar */}
      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--tx3)'}}>
          <span style={{cursor:'pointer',color:'var(--tx2)'}} onClick={()=>navigate('/proyectos')}>Proyectos</span>
          <span>›</span>
          <span style={{color:'var(--tx)',fontWeight:600}}>{proyecto.nombre}</span>
        </div>
        <div className="topbar-r">
          {proyecto.estado !== 'entregado' && <button className="btn btn-g" onClick={marcarEntregado}>✓ Entregar</button>}
          <button className="btn btn-g" onClick={()=>{setForm({nombre:proyecto.nombre,cliente:proyecto.clienteNombre,tipo:proyecto.tipo||'',fechaCliente:proyecto.fechaEntregaCliente?.split('T')[0]||'',fechaInterna:proyecto.fechaEntregaInterna?.split('T')[0]||''});setShowModal('edit')}}>✏️ Editar</button>
        </div>
      </div>

      {/* Header del proyecto */}
      <div style={{background:'var(--sf)',borderBottom:'1px solid var(--br)',padding:'20px 28px 0'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:16}}>
          <div style={{width:12,height:12,borderRadius:'50%',background:m.dot,flexShrink:0,marginTop:6}}/>
          <div style={{flex:1}}>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:'-.03em'}}>{proyecto.nombre}</h1>
            <div style={{fontSize:13,color:'var(--tx2)',marginTop:4,display:'flex',gap:10,alignItems:'center'}}>
              <span>{proyecto.clienteNombre}</span>
              <span style={{background:'var(--sf2)',padding:'1px 8px',borderRadius:10,fontSize:10,fontWeight:600,color:'var(--tx3)',border:'1px solid var(--br)'}}>{proyecto.tipo}</span>
              <Badge tipo={proyecto.estado}>{m.lbl}</Badge>
            </div>
          </div>
          <div style={{textAlign:'right',cursor:'pointer'}} onClick={()=>{setForm({progreso:proyecto.progreso||0,estado:proyecto.estado});setShowModal('progreso')}}>
            <div style={{fontSize:24,fontWeight:700,color:m.dot}}>{proyecto.progreso||0}%</div>
            <div style={{fontSize:11,color:'var(--tx3)'}}>progreso · editar</div>
          </div>
        </div>

        {/* Meta row */}
        <div style={{display:'flex',gap:0,borderTop:'1px solid var(--br)',fontSize:12}}>
          {[
            { lbl:'Entrega cliente', val: fmtFecha(proyecto.fechaEntregaCliente,{day:'numeric',month:'short',year:'numeric'}) },
            { lbl:'Entrega interna', val: fmtFecha(proyecto.fechaEntregaInterna,{day:'numeric',month:'short'}) },
            { lbl:'Tiempo restante', val: dLabel(proyecto.fechaEntregaCliente), color: m.dot },
            { lbl:'Tareas',          val: `${completadas}/${tareas.length}` },
          ].map((item,i) => (
            <div key={i} style={{padding:'10px 20px 10px 0',marginRight:20,borderRight:i<3?'1px solid var(--br)':'none'}}>
              <div style={{fontSize:10,fontWeight:600,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>{item.lbl}</div>
              <div style={{fontWeight:500,fontFamily:'var(--font-mono)',color:item.color||'var(--tx)'}}>{item.val}</div>
            </div>
          ))}
        </div>

        <ProgressBar pct={proyecto.progreso} color={m.dot} height={4} />

        {/* Tabs */}
        <div style={{display:'flex',gap:0,marginTop:4}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 16px',background:'none',border:'none',borderBottom:`2px solid ${tab===t?'var(--ac)':'transparent'}`,color:tab===t?'var(--tx)':'var(--tx3)',fontWeight:tab===t?600:400,cursor:'pointer',fontSize:13,fontFamily:'var(--fui)',textTransform:'capitalize',transition:'color .15s'}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="content">
        {tab==='tareas' && <TabTareas tareas={tareas} onToggle={toggleTarea} onDelete={eliminarTarea} onNew={()=>{setForm({});setShowModal('tarea')}} />}
        {tab==='notas' && <TabNotas nota={nota} onChange={saveNota} />}
        {tab==='equipo' && <TabEquipo colabs={colabs} onNew={()=>{setForm({});setShowModal('colab')}} />}
        {tab==='actividad' && <TabActividad getActivity={getActivity} />}
        {tab==='comunicaciones' && <TabComms comms={comms} onNew={()=>navigate('/comunicaciones')} />}
      </div>

      {/* Modales */}
      <Modal open={showModal==='tarea'} onClose={()=>setShowModal(null)} title="Nueva tarea"
        footer={<><button className="btn btn-g" onClick={()=>setShowModal(null)}>Cancelar</button><button className="btn btn-p" onClick={crearTarea}>Crear</button></>}>
        <div className="form-group"><label className="form-label">Descripción</label><input className="form-input" autoFocus placeholder="ej: Diseño final del logotipo" value={form.titulo||''} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Fecha límite (opcional)</label><input className="form-input" type="date" value={form.fechaLimite||''} onChange={e=>setForm(f=>({...f,fechaLimite:e.target.value}))} /></div>
      </Modal>

      <Modal open={showModal==='colab'} onClose={()=>setShowModal(null)} title="Agregar colaborador"
        footer={<><button className="btn btn-g" onClick={()=>setShowModal(null)}>Cancelar</button><button className="btn btn-p" onClick={crearColab}>Agregar</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nombre</label><input className="form-input" autoFocus placeholder="Ana García" value={form.nombre||''} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Rol</label><input className="form-input" placeholder="Diseñador, Dev…" value={form.rol||''} onChange={e=>setForm(f=>({...f,rol:e.target.value}))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Email (opcional)</label><input className="form-input" type="email" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
      </Modal>

      <Modal open={showModal==='edit'} onClose={()=>setShowModal(null)} title="Editar proyecto"
        footer={<><button className="btn btn-g" onClick={()=>setShowModal(null)}>Cancelar</button><button className="btn btn-p" onClick={guardarEdicion}>Guardar</button></>}>
        <div className="form-group"><label className="form-label">Nombre</label><input className="form-input" autoFocus value={form.nombre||''} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Cliente</label><input className="form-input" value={form.cliente||''} onChange={e=>setForm(f=>({...f,cliente:e.target.value}))} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Entrega cliente</label><input className="form-input" type="date" value={form.fechaCliente||''} onChange={e=>setForm(f=>({...f,fechaCliente:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Entrega interna</label><input className="form-input" type="date" value={form.fechaInterna||''} onChange={e=>setForm(f=>({...f,fechaInterna:e.target.value}))} /></div>
        </div>
      </Modal>

      <Modal open={showModal==='progreso'} onClose={()=>setShowModal(null)} title="Actualizar progreso"
        footer={<><button className="btn btn-g" onClick={()=>setShowModal(null)}>Cancelar</button><button className="btn btn-p" onClick={guardarProgreso}>Guardar</button></>}>
        <div className="form-group"><label className="form-label">Progreso ({form.progreso||0}%)</label>
          <input type="range" min="0" max="100" value={form.progreso||0} onChange={e=>setForm(f=>({...f,progreso:e.target.value}))} style={{width:'100%'}} />
        </div>
        <div className="form-group"><label className="form-label">Estado</label>
          <select className="form-select" value={form.estado||proyecto.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
            {Object.entries(ESTADO_META).map(([k,v])=><option key={k} value={k}>{v.lbl}</option>)}
          </select>
        </div>
      </Modal>
    </>
  )
}

function TabTareas({ tareas, onToggle, onDelete, onNew }) {
  const done = tareas.filter(t=>t.completada).length
  const pct  = tareas.length ? Math.round(done/tareas.length*100) : 0
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{flex:1,marginRight:16}}>
          <ProgressBar pct={pct} height={8} />
          <div style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>{done}/{tareas.length} tareas · {pct}%</div>
        </div>
        <button className="btn btn-p" onClick={onNew}>+ Tarea</button>
      </div>
      {tareas.length===0
        ? <EmptyState icon="✅" title="Sin tareas" sub="Agregá la primera tarea del proyecto." />
        : <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {tareas.map(t=>(
              <div key={t.id} className="card" style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:12,opacity:t.completada?.7:1}}>
                <div onClick={()=>onToggle(t)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${t.completada?'var(--ok-dot)':'var(--br)'}`,background:t.completada?'var(--ok-dot)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {t.completada && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5"><path d="M2 6l3 3 5-5"/></svg>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,textDecoration:t.completada?'line-through':'none',color:t.completada?'var(--tx3)':'var(--tx)'}}>{t.titulo}</div>
                  {t.fechaLimite && <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{fmtFecha(t.fechaLimite,{day:'numeric',month:'short'})}</div>}
                </div>
                <button onClick={()=>onDelete(t)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',padding:'2px 4px',borderRadius:4,fontSize:12}} title="Eliminar">✕</button>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

function TabNotas({ nota, onChange }) {
  return (
    <div>
      <textarea
        className="form-textarea"
        style={{minHeight:300,fontSize:14,lineHeight:1.7}}
        placeholder="Anotá ideas, acuerdos, referencias, lo que necesites…"
        value={nota}
        onChange={e=>onChange(e.target.value)}
      />
      <div style={{fontSize:11,color:'var(--tx3)',marginTop:6}}>Se guarda automáticamente</div>
    </div>
  )
}

function TabEquipo({ colabs, onNew }) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <button className="btn btn-p" onClick={onNew}>+ Colaborador</button>
      </div>
      {colabs.length===0
        ? <EmptyState icon="👥" title="Sin colaboradores" sub="Agregá personas que trabajan en este proyecto." />
        : <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {colabs.map((c,i)=>{
              const [bg,fg]=avatarPalette(i)
              return (
                <div key={c.id} className="card" style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13}}>{initials(c.nombre)}</div>
                  <div><div style={{fontWeight:600,fontSize:14}}>{c.nombre}</div><div style={{fontSize:12,color:'var(--tx2)'}}>{c.rol||'—'}{c.email?` · ${c.email}`:''}</div></div>
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}

function TabActividad({ getActivity }) {
  const log = getActivity()
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {log.length===0
        ? <EmptyState icon="📋" title="Sin actividad" sub="Las acciones en el proyecto se registran acá." />
        : log.map((a,i)=>{
            const dt = new Date(a.ts)
            const rel = (()=>{const d=Math.round((Date.now()-dt)/60000);if(d<1)return'ahora';if(d<60)return`hace ${d} min`;if(d<1440)return`hace ${Math.round(d/60)}h`;return dt.toLocaleDateString('es-AR',{day:'numeric',month:'short'})})()
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--br)'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'var(--ac)',flexShrink:0}}/>
                <div style={{flex:1,fontSize:13}}>{a.msg}</div>
                <div style={{fontSize:11,color:'var(--tx3)',whiteSpace:'nowrap'}}>{rel}</div>
              </div>
            )
          })
      }
    </div>
  )
}

function TabComms({ comms, onNew }) {
  const CANAL_ICONS = {whatsapp:'💬',email:'📧',instagram:'📸',tiktok:'🎵',telegram:'✈️',llamada:'📞',videocall:'🎥',otro:'💭'}
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <button className="btn btn-p" onClick={onNew}>+ Registrar comunicación</button>
      </div>
      {comms.length===0
        ? <EmptyState icon="💬" title="Sin comunicaciones" sub="Registrá las comunicaciones con el cliente desde la sección Comunicaciones." action={<button className="btn btn-g" onClick={onNew}>→ Ir a Comunicaciones</button>} />
        : <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {comms.slice().sort((a,b)=>new Date(b.fecha||b.creadoEn)-new Date(a.fecha||a.creadoEn)).map(c=>(
              <div key={c.id} className="card" style={{padding:'12px 16px'}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <span style={{fontSize:20}}>{CANAL_ICONS[c.canal]||'💭'}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{c.resumen}</div>
                    <div style={{fontSize:11,color:'var(--tx3)'}}>{c.direccion==='in'?'📥 Recibida':'📤 Enviada'} · {c.fecha?.split('T')[0]||''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
