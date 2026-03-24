import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, put, del } from '../lib/db'
import { initials, avatarPalette } from '../lib/utils'
import { Topbar, Modal, Loading, EmptyState, StatCard } from '../components/ui/index.jsx'
import { toast, ToastProvider } from '../components/ui/Toast.jsx'

const PAISES = ['Argentina','Uruguay','Chile','Paraguay','Brasil','México','Colombia','España','Estados Unidos','Otro']
const MONEDAS = ['ARS — Peso argentino','USD — Dólar','UYU — Peso uruguayo','CLP — Peso chileno','PYG — Guaraní','BRL — Real','MXN — Peso mexicano','EUR — Euro']

export default function Clientes() {
  const navigate = useNavigate()
  const [loading,   setLoading]   = useState(true)
  const [clientes,  setClientes]  = useState([])
  const [proyectos, setProyectos] = useState([])
  const [q,         setQ]         = useState('')
  const [filtro,    setFiltro]    = useState('all')
  const [detalle,   setDetalle]   = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [form,      setForm]      = useState({ nombre:'',empresa:'',email:'',telefono:'',pais:'Argentina',moneda:'ARS — Peso argentino' })

  async function load() {
    const [cs, ps] = await Promise.all([getAll('clientes'), getAll('proyectos')])
    setClientes(cs); setProyectos(ps); setLoading(false)
  }
  useEffect(() => { load() }, [])

  function proysOf(c) { return proyectos.filter(p => p.clienteId === c.id) }
  function activosOf(c) { return proysOf(c).filter(p => !p.archivado && p.estado !== 'entregado') }

  function openNew() { setEditando(null); setForm({ nombre:'',empresa:'',email:'',telefono:'',pais:'Argentina',moneda:'ARS — Peso argentino' }); setShowModal(true) }
  function openEdit(c) { setEditando(c); setForm({ nombre:c.nombre,empresa:c.empresa||'',email:c.email||'',telefono:c.telefono||'',pais:c.pais||'Argentina',moneda:c.moneda||'ARS — Peso argentino' }); setShowModal(true) }

  async function guardar() {
    if (!form.nombre.trim()) { toast('El nombre es obligatorio','er'); return }
    await put('clientes', { ...(editando||{}), nombre:form.nombre, empresa:form.empresa||'Sin empresa', email:form.email, telefono:form.telefono, pais:form.pais, moneda:form.moneda.split(' ')[0] })
    setShowModal(false); toast(editando ? '✓ Cliente actualizado' : '✓ Cliente creado'); load()
  }

  async function eliminar(c) {
    if (!confirm(`¿Eliminar a ${c.nombre}? Sus proyectos no se borran.`)) return
    await del('clientes', c.id); load(); setDetalle(null); toast('Cliente eliminado')
  }

  const lista = clientes.filter(c => {
    const ok = !q || [c.nombre, c.empresa].join(' ').toLowerCase().includes(q.toLowerCase())
    const filtOk = filtro === 'all' ? true : filtro === 'active' ? activosOf(c).length > 0 : activosOf(c).length === 0
    return ok && filtOk
  })

  if (loading) return <><Topbar title="Clientes" /><Loading /></>

  return (
    <>
      <ToastProvider />
      <Topbar
        title="Clientes"
        subtitle={`${clientes.length} clientes · ${clientes.filter(c=>activosOf(c).length>0).length} activos`}
        right={<button className="btn btn-p" onClick={openNew}>+ Nuevo cliente</button>}
      />

      <div className="content" style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="👥" value={clientes.length} label="Total clientes" />
          <StatCard icon="🟢" value={clientes.filter(c=>activosOf(c).length>0).length} label="Con proyectos activos" />
          <StatCard icon="📁" value={proyectos.filter(p=>!p.archivado&&p.estado!=='entregado').length} label="Proyectos activos" />
          <StatCard icon="🌍" value={new Set(clientes.map(c=>c.pais).filter(Boolean)).size} label="Países" />
        </div>

        {/* Filtros */}
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          {[{id:'all',lbl:'Todos'},{id:'active',lbl:'Con activos'},{id:'inactive',lbl:'Sin activos'}].map(f=>(
            <button key={f.id} className={`chip${filtro===f.id?' on':''}`} onClick={()=>setFiltro(f.id)}>{f.lbl}</button>
          ))}
          <input className="form-input" style={{width:200,padding:'5px 10px',fontSize:12,marginLeft:'auto'}} placeholder="Buscar…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        {lista.length === 0
          ? <EmptyState icon="👥" title="Sin clientes" sub="Agregá tu primer cliente." action={<button className="btn btn-p" onClick={openNew}>+ Nuevo cliente</button>} />
          : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
              {lista.map((c,i) => (
                <ClienteCard key={c.id} c={c} index={i} activos={activosOf(c).length} total={proysOf(c).length}
                  onClick={() => setDetalle(c)} onEdit={e=>{e.stopPropagation();openEdit(c)}} />
              ))}
            </div>
        }
      </div>

      {/* Panel de detalle */}
      {detalle && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.3)',zIndex:50,display:'flex',justifyContent:'flex-end' }} onClick={()=>setDetalle(null)}>
          <div style={{ width:360,background:'var(--sf)',height:'100%',overflowY:'auto',padding:24,boxShadow:'-4px 0 24px rgba(0,0,0,.12)' }} onClick={e=>e.stopPropagation()}>
            {(() => {
              const [bg,fg] = avatarPalette(clientes.indexOf(detalle))
              const ps = proysOf(detalle)
              const acts = activosOf(detalle)
              return <>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
                  <div style={{width:56,height:56,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>{initials(detalle.nombre)}</div>
                  <button onClick={()=>setDetalle(null)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:20}}>✕</button>
                </div>
                <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{detalle.nombre}</h2>
                <p style={{fontSize:13,color:'var(--tx2)',marginBottom:20}}>{detalle.empresa} · {detalle.pais}</p>
                {[['Email',detalle.email||'—'],['Teléfono',detalle.telefono||'—'],['Moneda',detalle.moneda||'—'],['Activos',acts.length],['Total proyectos',ps.length]].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--br)',fontSize:13}}>
                    <span style={{color:'var(--tx3)'}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
                  </div>
                ))}
                <div style={{marginTop:20,marginBottom:8,fontWeight:600,fontSize:13}}>Proyectos</div>
                {ps.length===0
                  ? <p style={{fontSize:12,color:'var(--tx3)'}}>Sin proyectos todavía.</p>
                  : ps.map(p=>(
                      <div key={p.id} onClick={()=>navigate(`/proyectos/${p.id}`)} style={{padding:'8px 0',borderBottom:'1px solid var(--br)',cursor:'pointer',fontSize:13,display:'flex',gap:8,alignItems:'center'}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:p.estado==='entregado'?'var(--ok-dot)':p.estado==='critico'?'var(--cr-dot)':'var(--wa-dot)',flexShrink:0}}/>
                        <span style={{flex:1}}>{p.nombre}</span>
                      </div>
                    ))
                }
                <div style={{display:'flex',gap:8,marginTop:24}}>
                  <button className="btn btn-g" style={{flex:1}} onClick={()=>openEdit(detalle)}>Editar</button>
                  <button className="btn btn-danger" style={{flex:1}} onClick={()=>eliminar(detalle)}>Eliminar</button>
                </div>
              </>
            })()}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editando?'Editar cliente':'Nuevo cliente'}
        footer={<><button className="btn btn-g" onClick={()=>setShowModal(false)}>Cancelar</button><button className="btn btn-p" onClick={guardar}>Guardar</button></>}>
        <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" autoFocus placeholder="Ana Moreno" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Empresa</label><input className="form-input" placeholder="Sin empresa" value={form.empresa} onChange={e=>setForm(f=>({...f,empresa:e.target.value}))} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Teléfono</label><input className="form-input" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">País</label><select className="form-select" value={form.pais} onChange={e=>setForm(f=>({...f,pais:e.target.value}))}>{PAISES.map(p=><option key={p}>{p}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Moneda</label><select className="form-select" value={form.moneda} onChange={e=>setForm(f=>({...f,moneda:e.target.value}))}>{MONEDAS.map(m=><option key={m}>{m}</option>)}</select></div>
        </div>
      </Modal>
    </>
  )
}

function ClienteCard({ c, index, activos, total, onClick, onEdit }) {
  const [bg, fg] = avatarPalette(index)
  return (
    <div className="card" onClick={onClick} style={{ padding:16, cursor:'pointer', transition:'box-shadow .15s' }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--sh)'}
    >
      <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>{initials(c.nombre)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nombre}</div>
          <div style={{fontSize:12,color:'var(--tx2)',marginTop:1}}>{c.empresa}</div>
          <div style={{fontSize:11,color:'var(--tx3)',marginTop:1}}>{c.pais} · {(c.moneda||'').split(' ')[0]}</div>
        </div>
        <button onClick={onEdit} className="btn btn-g" style={{padding:'3px 7px',fontSize:11}}>✏️</button>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,borderTop:'1px solid var(--br)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:18,fontWeight:700,color:'var(--ac)'}}>{activos}</div>
          <div style={{fontSize:10,color:'var(--tx3)'}}>Activos</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:18,fontWeight:700}}>{total}</div>
          <div style={{fontSize:10,color:'var(--tx3)'}}>Total</div>
        </div>
        <div style={{textAlign:'center'}}>
          <span style={{fontSize:12,fontWeight:600,padding:'2px 8px',borderRadius:10,background:activos>0?'var(--ok-bg)':'var(--sf2)',color:activos>0?'var(--ok-tx)':'var(--tx3)'}}>
            {activos>0?`${activos} activo${activos!==1?'s':''}`:'Sin activos'}
          </span>
        </div>
      </div>
    </div>
  )
}
