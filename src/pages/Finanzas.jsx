import { useState, useEffect } from 'react'
import { getAll, put, del } from '../lib/db'
import { initials, avatarPalette, fmtFecha, fmtMonto, diasHasta } from '../lib/utils'
import { Topbar, Modal, Loading, EmptyState, StatCard } from '../components/ui/index.jsx'
import { toast, ToastProvider } from '../components/ui/Toast.jsx'

export default function Finanzas() {
  const [loading,   setLoading]   = useState(true)
  const [clientes,  setClientes]  = useState([])
  const [proyectos, setProyectos] = useState([])
  const [pagos,     setPagos]     = useState([])
  const [openCli,   setOpenCli]   = useState(new Set())
  const [openProj,  setOpenProj]  = useState(new Set())
  const [filtro,    setFiltro]    = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState({ proyectoId:'', clienteId:'', concepto:'', monto:'', moneda:'ARS', fechaVencimiento:'', notas:'' })

  async function load() {
    const [cs,ps,pgs] = await Promise.all([getAll('clientes'),getAll('proyectos'),getAll('pagos')])
    setClientes(cs); setProyectos(ps); setPagos(pgs); setLoading(false)
  }
  useEffect(()=>{load()},[])

  function isVencido(p) { return p.estado!=='cobrado' && p.fechaVencimiento && diasHasta(p.fechaVencimiento) < 0 }

  async function agregarPago() {
    if (!form.proyectoId||!form.monto) { toast('Proyecto y monto son obligatorios','er'); return }
    await put('pagos',{ proyectoId:form.proyectoId, clienteId:form.clienteId, concepto:form.concepto, monto:parseFloat(form.monto), moneda:form.moneda, fechaVencimiento:form.fechaVencimiento?form.fechaVencimiento+'T12:00:00':null, notas:form.notas, estado:'pendiente' })
    setShowModal(false); toast('✓ Pago agregado'); load()
  }

  async function marcarCobrado(id) {
    const p = pagos.find(x=>x.id===id); if(!p) return
    await put('pagos',{...p,estado:'cobrado'}); toast('✓ Marcado como cobrado'); load()
  }

  async function eliminarPago(id) {
    if (!confirm('¿Eliminar este pago?')) return
    await del('pagos',id); toast('Pago eliminado'); load()
  }

  function toggleCli(id) { setOpenCli(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n}) }
  function toggleProj(id){ setOpenProj(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n}) }

  // Stats
  const totalCobrado = pagos.filter(p=>p.estado==='cobrado').reduce((a,p)=>a+(p.monto||0),0)
  const totalPendiente = pagos.filter(p=>p.estado!=='cobrado'&&!isVencido(p)).reduce((a,p)=>a+(p.monto||0),0)
  const totalVencido   = pagos.filter(p=>isVencido(p)).reduce((a,p)=>a+(p.monto||0),0)

  // Group pagos by cliente > proyecto
  const clientesConPagos = clientes.filter(c => proyectos.some(p=>p.clienteId===c.id&&pagos.some(pg=>pg.proyectoId===p.id)))

  const allProjsForModal = proyectos.filter(p=>!p.archivado)

  if (loading) return <><Topbar title="Finanzas" /><Loading /></>

  return (
    <>
      <ToastProvider />
      <Topbar
        title="Finanzas"
        subtitle={`${pagos.length} pagos registrados`}
        right={<button className="btn btn-p" onClick={()=>{setForm({proyectoId:'',clienteId:'',concepto:'',monto:'',moneda:'ARS',fechaVencimiento:'',notas:''});setShowModal(true)}}>+ Agregar pago</button>}
      />
      <div className="content" style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="stats-grid">
          <StatCard icon="✅" value={`$${totalCobrado.toLocaleString('es-AR')}`} label="Cobrado" color="var(--ok-dot)" />
          <StatCard icon="⏳" value={`$${totalPendiente.toLocaleString('es-AR')}`} label="Por cobrar" color="var(--wa-dot)" />
          <StatCard icon="⚠️" value={`$${totalVencido.toLocaleString('es-AR')}`}  label="Vencido"    color="var(--cr-dot)" />
          <StatCard icon="💳" value={pagos.length} label="Total pagos" />
        </div>

        <div style={{display:'flex',gap:6}}>
          {[{id:'all',lbl:'Todos'},{id:'pendiente',lbl:'Pendientes'},{id:'vencido',lbl:'Vencidos'},{id:'cobrado',lbl:'Cobrados'}].map(f=>(
            <button key={f.id} className={`chip${filtro===f.id?' on':''}`} onClick={()=>setFiltro(f.id)}>{f.lbl}</button>
          ))}
        </div>

        {clientesConPagos.length===0
          ? <EmptyState icon="💰" title="Sin pagos registrados" sub="Agregá el primer pago de un proyecto." action={<button className="btn btn-p" onClick={()=>setShowModal(true)}>+ Agregar pago</button>} />
          : clientesConPagos.map((c,ci)=>{
              const [bg,fg]=avatarPalette(ci)
              const cProjs=proyectos.filter(p=>p.clienteId===c.id)
              const cPagos=pagos.filter(pg=>cProjs.some(p=>p.id===pg.proyectoId))
              const filtrados = filtro==='all'?cPagos:cPagos.filter(p=>filtro==='vencido'?isVencido(p):filtro==='cobrado'?p.estado==='cobrado':p.estado==='pendiente'&&!isVencido(p))
              if (!filtrados.length) return null
              const cobrado=cPagos.filter(p=>p.estado==='cobrado').reduce((a,p)=>a+(p.monto||0),0)
              const pendiente=cPagos.filter(p=>p.estado!=='cobrado'&&!isVencido(p)).reduce((a,p)=>a+(p.monto||0),0)
              const vencido=cPagos.filter(p=>isVencido(p)).reduce((a,p)=>a+(p.monto||0),0)
              const isOpen=openCli.has(c.id)
              return (
                <div key={c.id} className="card" style={{overflow:'hidden'}}>
                  <div onClick={()=>toggleCli(c.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',cursor:'pointer',background:'var(--sf)'}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,flexShrink:0}}>{initials(c.nombre)}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>{c.nombre}</div>
                      <div style={{fontSize:12,color:'var(--tx2)'}}>{c.empresa}</div>
                    </div>
                    <div style={{display:'flex',gap:16,fontSize:13,textAlign:'right'}}>
                      {cobrado>0&&<div><div style={{fontWeight:600,color:'var(--ok-dot)'}}>+${cobrado.toLocaleString('es-AR')}</div><div style={{fontSize:10,color:'var(--tx3)'}}>cobrado</div></div>}
                      {pendiente>0&&<div><div style={{fontWeight:600,color:'var(--wa-dot)'}}>${pendiente.toLocaleString('es-AR')}</div><div style={{fontSize:10,color:'var(--tx3)'}}>pendiente</div></div>}
                      {vencido>0&&<div><div style={{fontWeight:600,color:'var(--cr-dot)'}}>${vencido.toLocaleString('es-AR')}</div><div style={{fontSize:10,color:'var(--tx3)'}}>vencido</div></div>}
                    </div>
                    <span style={{color:'var(--tx3)',fontSize:12}}>{isOpen?'▲':'▼'}</span>
                  </div>
                  {isOpen && (
                    <div style={{borderTop:'1px solid var(--br)'}}>
                      {cProjs.map(proj=>{
                        const pProj=pagos.filter(pg=>pg.proyectoId===proj.id)
                        const pFilt=filtro==='all'?pProj:pProj.filter(p=>filtro==='vencido'?isVencido(p):filtro==='cobrado'?p.estado==='cobrado':p.estado==='pendiente'&&!isVencido(p))
                        if(!pFilt.length) return null
                        const isOpen2=openProj.has(proj.id)
                        return (
                          <div key={proj.id}>
                            <div onClick={()=>toggleProj(proj.id)} style={{display:'flex',gap:12,padding:'10px 16px 10px 52px',cursor:'pointer',background:'var(--sf2)',alignItems:'center'}}>
                              <div style={{flex:1,fontWeight:500,fontSize:13}}>{proj.nombre}</div>
                              <div style={{fontSize:11,color:'var(--tx3)'}}>{pProj.length} pago{pProj.length!==1?'s':''}</div>
                              <button className="btn btn-g" style={{padding:'3px 8px',fontSize:11}} onClick={e=>{e.stopPropagation();setForm({proyectoId:proj.id,clienteId:c.id,concepto:'',monto:'',moneda:c.moneda||'ARS',fechaVencimiento:'',notas:''});setShowModal(true)}}>+ Pago</button>
                              <span style={{color:'var(--tx3)',fontSize:11}}>{isOpen2?'▲':'▼'}</span>
                            </div>
                            {isOpen2&&pProj.map((pg,pi)=>{
                              const venc=isVencido(pg)
                              const estado=venc?'vencido':pg.estado
                              const col=estado==='cobrado'?'var(--ok-dot)':estado==='vencido'?'var(--cr-dot)':'var(--wa-dot)'
                              return(
                                <div key={pg.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px 10px 68px',borderTop:'1px solid var(--br)'}}>
                                  <span style={{color:'var(--tx3)',fontSize:12,minWidth:20}}>{pi+1}.</span>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:13}}>{pg.concepto||'Pago'}</div>
                                    {pg.notas&&<div style={{fontSize:11,color:'var(--tx3)'}}>{pg.notas}</div>}
                                  </div>
                                  <div style={{fontSize:11,color:'var(--tx3)'}}>{pg.fechaVencimiento?fmtFecha(pg.fechaVencimiento,{day:'numeric',month:'short'}):'—'}</div>
                                  <div style={{textAlign:'right'}}>
                                    <div style={{fontWeight:600,color:col}}>${(pg.monto||0).toLocaleString('es-AR')} {pg.moneda}</div>
                                    <div style={{fontSize:10,marginTop:2}}><span style={{padding:'1px 6px',borderRadius:8,background:col+'22',color:col,fontWeight:600}}>{estado==='cobrado'?'Cobrado':estado==='vencido'?'Vencido':'Pendiente'}</span></div>
                                  </div>
                                  <div style={{display:'flex',gap:4}}>
                                    {pg.estado!=='cobrado'&&<button className="btn btn-g" style={{padding:'3px 8px',fontSize:11}} onClick={()=>marcarCobrado(pg.id)} title="Cobrado">✓</button>}
                                    <button className="btn btn-g" style={{padding:'3px 8px',fontSize:11,color:'var(--cr-tx)'}} onClick={()=>eliminarPago(pg.id)}>✕</button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
        }
      </div>

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Agregar pago"
        footer={<><button className="btn btn-g" onClick={()=>setShowModal(false)}>Cancelar</button><button className="btn btn-p" onClick={agregarPago}>Agregar</button></>}>
        <div className="form-group"><label className="form-label">Proyecto *</label>
          <select className="form-select" value={form.proyectoId} onChange={e=>{const p=proyectos.find(x=>x.id===e.target.value);setForm(f=>({...f,proyectoId:e.target.value,clienteId:p?.clienteId||''}))}}>
            <option value="">— Seleccioná —</option>
            {allProjsForModal.map(p=><option key={p.id} value={p.id}>{p.nombre} – {p.clienteNombre}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Concepto</label><input className="form-input" placeholder="ej: Anticipo 50%, Entrega final" value={form.concepto} onChange={e=>setForm(f=>({...f,concepto:e.target.value}))} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Monto *</label><input className="form-input" type="number" placeholder="0" value={form.monto} onChange={e=>setForm(f=>({...f,monto:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={form.moneda} onChange={e=>setForm(f=>({...f,moneda:e.target.value}))}>
              {['ARS','USD','UYU','CLP','PYG','BRL','EUR'].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Fecha vencimiento</label><input className="form-input" type="date" value={form.fechaVencimiento} onChange={e=>setForm(f=>({...f,fechaVencimiento:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Notas</label><input className="form-input" placeholder="Condiciones, recordatorio…" value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))} /></div>
      </Modal>
    </>
  )
}
