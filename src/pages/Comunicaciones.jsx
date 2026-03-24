import { useState, useEffect } from 'react'
import { getAll, put, del } from '../lib/db'
import { CANALES, canalInfo, initials, avatarPalette, relTime, fmtFecha } from '../lib/utils'
import { Topbar, Modal, Loading, EmptyState, StatCard } from '../components/ui/index.jsx'
import { toast, ToastProvider } from '../components/ui/Toast.jsx'

export default function Comunicaciones() {
  const [loading,   setLoading]   = useState(true)
  const [comms,     setComms]     = useState([])
  const [clientes,  setClientes]  = useState([])
  const [proyectos, setProyectos] = useState([])
  const [q,         setQ]         = useState('')
  const [canalF,    setCanalF]    = useState('all')
  const [clienteF,  setClienteF]  = useState('all')
  const [dirF,      setDirF]      = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [expanded,  setExpanded]  = useState(new Set())
  const [form,      setForm]      = useState({ canal:'', direccion:'in', clienteId:'', proyectoId:'', fecha:'', hora:'', resumen:'', detalle:'', tags:'', followup:false })

  async function load() {
    const [cs, ps, cms] = await Promise.all([getAll('clientes'), getAll('proyectos'), getAll('comunicaciones')])
    cms.sort((a,b) => new Date(b.fecha||b.creadoEn) - new Date(a.fecha||a.creadoEn))
    setClientes(cs); setProyectos(ps); setComms(cms); setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() {
    setEditando(null)
    const hoy = new Date().toISOString().split('T')[0]
    setForm({ canal:'', direccion:'in', clienteId:'', proyectoId:'', fecha:hoy, hora:'', resumen:'', detalle:'', tags:'', followup:false })
    setShowModal(true)
  }

  function openEdit(c) {
    setEditando(c)
    setForm({ canal:c.canal, direccion:c.direccion, clienteId:c.clienteId, proyectoId:c.proyectoId||'', fecha:c.fecha?.split('T')[0]||'', hora:c.hora||'', resumen:c.resumen, detalle:c.detalle||'', tags:(c.tags||[]).join(', '), followup:c.followup||false })
    setShowModal(true)
  }

  async function guardar() {
    if (!form.canal)         { toast('Seleccioná un canal','er'); return }
    if (!form.clienteId)     { toast('Seleccioná un cliente','er'); return }
    if (!form.resumen.trim()){ toast('El resumen es obligatorio','er'); return }
    const tags = form.tags.split(',').map(t=>t.trim()).filter(Boolean)
    await put('comunicaciones', {
      ...(editando ? { id: editando.id } : {}),
      canal: form.canal, direccion: form.direccion, clienteId: form.clienteId,
      proyectoId: form.proyectoId || null,
      fecha: form.fecha ? form.fecha + 'T12:00:00' : new Date().toISOString(),
      hora: form.hora || null, resumen: form.resumen, detalle: form.detalle || null,
      tags, followup: form.followup,
      followupDone: editando ? (editando.followupDone || false) : false,
    })
    setShowModal(false); toast(editando ? '✓ Actualizado' : '✓ Comunicación registrada'); load()
  }

  async function toggleFollowup(c, e) {
    e.stopPropagation()
    await put('comunicaciones', { ...c, followupDone: !c.followupDone })
    toast(c.followupDone ? '⏰ Follow-up pendiente' : '✓ Follow-up marcado como hecho')
    load()
  }

  async function eliminar(c, e) {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta comunicación?')) return
    await del('comunicaciones', c.id); toast('Eliminada'); load()
  }

  function toggleExpand(id) {
    setExpanded(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return s })
  }

  function exportCsv() {
    if (!comms.length) { toast('Sin datos para exportar','er'); return }
    const h = ['Fecha','Hora','Cliente','Canal','Dirección','Proyecto','Resumen','Tags','Follow-up']
    const rows = comms.map(c => {
      const cl = clientes.find(x=>x.id===c.clienteId)
      const pr = proyectos.find(x=>x.id===c.proyectoId)
      return [c.fecha?.split('T')[0]||'',c.hora||'',cl?.nombre||'',canalInfo(c.canal).nombre,c.direccion==='in'?'Recibida':'Enviada',pr?.nombre||'',`"${(c.resumen||'').replace(/"/g,'""')}"`,  (c.tags||[]).join(';'),c.followup?(c.followupDone?'Hecho':'Pendiente'):''].join(',')
    })
    const blob = new Blob(['\ufeff'+[h.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8;'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`freelow-comms-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    toast('✓ CSV exportado')
  }

  // Filters
  const usedCanales  = [...new Set(comms.map(c=>c.canal).filter(Boolean))]
  const usedClientes = clientes.filter(c => comms.some(cm=>cm.clienteId===c.id))
  const pending = comms.filter(c=>c.followup&&!c.followupDone)

  const lista = comms.filter(c => {
    if (canalF   !== 'all' && c.canal     !== canalF)   return false
    if (clienteF !== 'all' && c.clienteId !== clienteF) return false
    if (dirF     !== 'all' && c.direccion !== dirF)     return false
    if (q) {
      const cl = clientes.find(x=>x.id===c.clienteId)
      const hay = [c.resumen,c.detalle,cl?.nombre,cl?.empresa,c.canal,...(c.tags||[])].join(' ').toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  })

  // Group by date
  const groups = {}
  lista.forEach(c => {
    const k = (c.fecha||c.creadoEn).split('T')[0]
    if (!groups[k]) groups[k] = []
    groups[k].push(c)
  })
  const groupKeys = Object.keys(groups).sort((a,b)=>b.localeCompare(a))

  function dateLabel(iso) {
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate()-1)
    const d = new Date(iso+'T12:00:00'); d.setHours(0,0,0,0)
    if (d.getTime()===hoy.getTime())  return 'Hoy'
    if (d.getTime()===ayer.getTime()) return 'Ayer'
    return new Date(iso+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})
  }

  const proyectosCliente = proyectos.filter(p => p.clienteId === form.clienteId && !p.archivado)

  if (loading) return <><Topbar title="Comunicaciones" /><Loading /></>

  return (
    <>
      <ToastProvider />
      <Topbar
        title="Comunicaciones"
        subtitle={`${comms.length} registros · ${clientes.length} clientes`}
        right={<>
          <button className="btn btn-g" onClick={exportCsv}>↓ CSV</button>
          <button className="btn btn-p" onClick={openNew}>+ Registrar</button>
        </>}
      />

      <div className="content" style={{display:'flex',flexDirection:'column',gap:16}}>

        {/* Follow-up banner */}
        {pending.length > 0 && (
          <div style={{background:'var(--wa-bg)',border:'1px solid var(--wa-dot)',borderRadius:'var(--rc)',padding:'12px 16px',display:'flex',gap:12,alignItems:'flex-start'}}>
            <span style={{fontSize:20}}>⏰</span>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:'var(--wa-tx)',marginBottom:4}}>Follow-ups pendientes ({pending.length})</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {pending.map(c=>{const cl=clientes.find(x=>x.id===c.clienteId);return(
                  <span key={c.id} style={{padding:'3px 10px',background:'var(--sf)',border:'1px solid var(--wa-dot)',borderRadius:10,fontSize:11,color:'var(--wa-tx)',cursor:'pointer'}}
                    onClick={()=>{const el=document.getElementById('comm-'+c.id);el?.scrollIntoView({behavior:'smooth',block:'center'})}}>
                    {canalInfo(c.canal).icon} {cl?.nombre||'Cliente'} — {c.resumen?.slice(0,30)}
                  </span>
                )})}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="💬" value={comms.length} label="Total registradas" />
          <StatCard icon="📥" value={comms.filter(c=>c.direccion==='in').length} label="Recibidas" color="var(--ok-dot)" />
          <StatCard icon="📤" value={comms.filter(c=>c.direccion==='out').length} label="Enviadas" color="var(--wa-dot)" />
          <StatCard icon="🔔" value={pending.length} label="Follow-ups pend." color="var(--ur-dot)" />
        </div>

        {/* Canal filter */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <button className={`chip${canalF==='all'?' on':''}`} onClick={()=>setCanalF('all')}>Todos</button>
          {CANALES.filter(ch=>usedCanales.includes(ch.id)).map(ch=>(
            <button key={ch.id} className={`chip${canalF===ch.id?' on':''}`} onClick={()=>setCanalF(ch.id)}>{ch.icon} {ch.nombre}</button>
          ))}
          <input className="form-input" style={{width:180,padding:'5px 10px',fontSize:12,marginLeft:'auto'}} placeholder="Buscar…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        {/* Client + dir filter */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <button className={`chip${clienteF==='all'?' on':''}`} onClick={()=>setClienteF('all')}>Todos los clientes</button>
          {usedClientes.map(c=>(
            <button key={c.id} className={`chip${clienteF===c.id?' on':''}`} onClick={()=>setClienteF(c.id)}>{c.nombre}</button>
          ))}
          <select className="form-select" value={dirF} onChange={e=>setDirF(e.target.value)} style={{width:160,padding:'5px 10px',fontSize:12,marginLeft:'auto'}}>
            <option value="all">Recibida + Enviada</option>
            <option value="in">Solo recibidas</option>
            <option value="out">Solo enviadas</option>
          </select>
        </div>

        {/* Timeline */}
        {lista.length === 0
          ? <EmptyState icon="💬" title="Sin comunicaciones" sub='Registrá tu primer intercambio con un cliente.' action={<button className="btn btn-p" onClick={openNew}>+ Registrar comunicación</button>} />
          : groupKeys.map(dateKey => (
              <div key={dateKey}>
                <div style={{display:'flex',alignItems:'center',gap:12,margin:'8px 0',position:'sticky',top:-4,background:'var(--bg)',zIndex:5,padding:'4px 0'}}>
                  <div style={{flex:1,height:1,background:'var(--br)'}}/>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.1em',padding:'3px 10px',background:'var(--sf2)',borderRadius:20,border:'1px solid var(--br)',whiteSpace:'nowrap'}}>{dateLabel(dateKey)}</div>
                  <div style={{flex:1,height:1,background:'var(--br)'}}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:0}}>
                  {groups[dateKey].map((c,idx) => <CommItem key={c.id} c={c} idx={idx} clientes={clientes} proyectos={proyectos} expanded={expanded.has(c.id)} onExpand={()=>toggleExpand(c.id)} onEdit={()=>openEdit(c)} onDelete={e=>eliminar(c,e)} onFollowup={e=>toggleFollowup(c,e)} />)}
                </div>
              </div>
            ))
        }
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editando?'Editar comunicación':'Registrar comunicación'}
        footer={<><button className="btn btn-g" onClick={()=>setShowModal(false)}>Cancelar</button><button className="btn btn-p" onClick={guardar}>Guardar</button></>}
        wide
      >
        {/* Canal */}
        <div className="form-group">
          <label className="form-label">Canal</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {CANALES.map(ch=>{const sel=form.canal===ch.id;return(
              <div key={ch.id} onClick={()=>setForm(f=>({...f,canal:ch.id}))} style={{padding:'10px 6px',borderRadius:'var(--rc)',border:`2px solid ${sel?ch.color:'var(--br)'}`,background:sel?ch.bg:'var(--sf)',textAlign:'center',cursor:'pointer',transition:'all .15s'}}>
                <div style={{fontSize:20,marginBottom:4}}>{ch.icon}</div>
                <div style={{fontSize:10,fontWeight:700,color:'var(--tx2)'}}>{ch.nombre}</div>
              </div>
            )})}
          </div>
        </div>
        {/* Dirección */}
        <div className="form-group">
          <label className="form-label">Dirección</label>
          <div style={{display:'flex',gap:8}}>
            {[{id:'in',lbl:'📥 Recibida'},{id:'out',lbl:'📤 Enviada'}].map(d=>(
              <button key={d.id} onClick={()=>setForm(f=>({...f,direccion:d.id}))} style={{flex:1,padding:8,border:`2px solid ${form.direccion===d.id?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rc)',background:form.direccion===d.id?'var(--ac)':'var(--sf)',color:form.direccion===d.id?'var(--acf)':'var(--tx2)',fontFamily:'var(--fui)',fontWeight:600,fontSize:13,cursor:'pointer',transition:'all .15s'}}>{d.lbl}</button>
            ))}
          </div>
        </div>
        {/* Cliente / Proyecto */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select className="form-select" value={form.clienteId} onChange={e=>setForm(f=>({...f,clienteId:e.target.value,proyectoId:''}))}>
              <option value="">— Seleccioná —</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Proyecto (opcional)</label>
            <select className="form-select" value={form.proyectoId} onChange={e=>setForm(f=>({...f,proyectoId:e.target.value}))}>
              <option value="">— Sin proyecto —</option>
              {proyectosCliente.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>
        {/* Fecha/hora */}
        <div className="form-row">
          <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Hora (opcional)</label><input className="form-input" type="time" value={form.hora} onChange={e=>setForm(f=>({...f,hora:e.target.value}))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Resumen / Tema</label><input className="form-input" placeholder="ej: Revisión de diseño, aprobó cambios" value={form.resumen} onChange={e=>setForm(f=>({...f,resumen:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Detalle (opcional)</label><textarea className="form-textarea" placeholder="Notas, acuerdos, próximos pasos…" value={form.detalle} onChange={e=>setForm(f=>({...f,detalle:e.target.value}))} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Etiquetas (coma sep.)</label><input className="form-input" placeholder="aprobación, urgente" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} /></div>
          <div className="form-group" style={{display:'flex',alignItems:'flex-end',paddingBottom:4}}>
            <label style={{display:'flex',gap:8,alignItems:'center',cursor:'pointer',fontSize:13,color:'var(--tx2)'}}>
              <input type="checkbox" checked={form.followup} onChange={e=>setForm(f=>({...f,followup:e.target.checked}))} style={{width:14,height:14,accentColor:'var(--ac)'}} />
              Follow-up pendiente
            </label>
          </div>
        </div>
      </Modal>
    </>
  )
}

function CommItem({ c, idx, clientes, proyectos, expanded, onExpand, onEdit, onDelete, onFollowup }) {
  const cl = clientes.find(x=>x.id===c.clienteId)
  const pr = proyectos.find(x=>x.id===c.proyectoId)
  const ch = canalInfo(c.canal)
  const [bg,fg] = avatarPalette(clientes.indexOf(cl))
  const iso = c.fecha || c.creadoEn

  return (
    <div id={'comm-'+c.id} style={{display:'flex',gap:14,padding:'10px 0',position:'relative'}}>
      {/* Timeline line */}
      <div style={{position:'absolute',left:19,top:44,bottom:-10,width:1,background:'var(--br)'}}/>
      {/* Avatar */}
      <div style={{position:'relative',flexShrink:0,zIndex:1}}>
        <div style={{width:38,height:38,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13}}>
          {initials(cl?.nombre||'?')}
        </div>
        <div style={{position:'absolute',bottom:-2,right:-2,width:16,height:16,borderRadius:'50%',background:ch.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,border:'2px solid var(--bg)'}}>
          {ch.icon.slice(0,2)}
        </div>
      </div>
      {/* Card */}
      <div onClick={onExpand} className="card" style={{flex:1,padding:'12px 16px',cursor:'pointer'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:6}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontWeight:600,fontSize:13}}>{cl?.nombre||'?'}</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:ch.bg,color:ch.color}}>{ch.icon} {ch.nombre}</span>
            <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:10,background:c.direccion==='in'?'var(--ok-bg)':'var(--wa-bg)',color:c.direccion==='in'?'var(--ok-tx)':'var(--wa-tx)'}}>{c.direccion==='in'?'📥 Recibida':'📤 Enviada'}</span>
            {pr && <span style={{fontSize:10,color:'var(--tx3)',background:'var(--sf2)',padding:'2px 7px',borderRadius:10,border:'1px solid var(--br)'}}>📁 {pr.nombre}</span>}
          </div>
          <span style={{fontSize:11,color:'var(--tx3)',fontFamily:'var(--font-mono)',whiteSpace:'nowrap',flexShrink:0}}>{relTime(iso)}{c.hora?` · ${c.hora}`:''}</span>
        </div>
        <div style={{fontSize:13,color:'var(--tx2)'}}>{c.resumen}</div>
        {expanded && c.detalle && (
          <div style={{fontSize:12,color:'var(--tx2)',marginTop:8,paddingTop:8,borderTop:'1px solid var(--br)',lineHeight:1.6}}>
            {c.detalle.split('\n').map((line,i)=><p key={i}>{line}</p>)}
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10,flexWrap:'wrap'}}>
          {(c.tags||[]).map(t=><span key={t} style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'var(--sf2)',color:'var(--tx3)',border:'1px solid var(--br)'}}>{t}</span>)}
          {c.followup && (
            <button onClick={onFollowup} style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:10,border:'none',cursor:'pointer',fontFamily:'var(--fui)',background:c.followupDone?'var(--ok-bg)':'var(--ur-bg)',color:c.followupDone?'var(--ok-tx)':'var(--ur-tx)'}}>
              {c.followupDone?'✓ Hecho':'⏰ Follow-up'}
            </button>
          )}
          <div style={{marginLeft:'auto',display:'flex',gap:4}}>
            <button onClick={e=>{e.stopPropagation();onEdit()}} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',padding:'2px 6px',borderRadius:4,fontSize:12}} title="Editar">✏️</button>
            <button onClick={onDelete} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',padding:'2px 6px',borderRadius:4,fontSize:12}} title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  )
}
