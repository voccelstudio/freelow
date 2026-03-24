import { useState, useEffect } from 'react'
import { getAll, byIdx } from '../lib/db'
import { fmtFecha, diasHasta, ESTADO_META } from '../lib/utils'
import { Topbar, Loading } from '../components/ui/index.jsx'

export default function Reporte() {
  const [loading,   setLoading]   = useState(true)
  const [proyectos, setProyectos] = useState([])
  const [tareas,    setTareas]    = useState([])
  const [pagos,     setPagos]     = useState([])
  const [selId,     setSelId]     = useState('')
  const [modo,      setModo]      = useState('completo')
  const [tuNombre,  setTuNombre]  = useState('')
  const [tuSlogan,  setTuSlogan]  = useState('')
  const [tuEmail,   setTuEmail]   = useState('')
  const [tuTel,     setTuTel]     = useState('')
  const [logoB64,   setLogoB64]   = useState(null)
  const [presItems, setPresItems] = useState([{desc:'',monto:''}])
  const [presMoneda,setPresMoneda]= useState('ARS')
  const [presNota,  setPresNota]  = useState('')

  useEffect(()=>{
    Promise.all([getAll('proyectos'),getAll('tareas'),getAll('pagos')]).then(([ps,ts,pgs])=>{
      const activos=ps.filter(p=>!p.archivado)
      setProyectos(activos); setTareas(ts); setPagos(pgs)
      if(activos.length) setSelId(activos[0].id)
      setLoading(false)
    })
  },[])

  const proyecto = proyectos.find(p=>p.id===selId)
  const tareasProy = tareas.filter(t=>t.proyectoId===selId)
  const pagosProy  = pagos.filter(p=>p.proyectoId===selId)
  const m = ESTADO_META[proyecto?.estado]||ESTADO_META.ok
  const done=tareasProy.filter(t=>t.completada).length
  const total=tareasProy.length
  const presTotal=presItems.reduce((a,i)=>a+(parseFloat(i.monto)||0),0)

  function handleLogo(e) {
    const f=e.target.files?.[0]; if(!f) return
    const r=new FileReader(); r.onload=ev=>setLogoB64(ev.target.result); r.readAsDataURL(f)
  }

  if (loading) return <><Topbar title="Reporte" /><Loading /></>

  return (
    <>
      <Topbar title="Reporte" subtitle="Generá un PDF para compartir con el cliente" right={<button className="btn btn-p" onClick={()=>window.print()}>🖨 Imprimir / PDF</button>} />
      <div className="content">
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:24}}>
          {/* Controls */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div className="card" style={{padding:16}}>
              <div style={{fontWeight:700,fontSize:12,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:12}}>Contenido</div>
              <div className="form-group"><label className="form-label">Proyecto</label>
                <select className="form-select" value={selId} onChange={e=>setSelId(e.target.value)}>
                  {proyectos.map(p=><option key={p.id} value={p.id}>{p.nombre} – {p.clienteNombre}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Incluir</label>
                <select className="form-select" value={modo} onChange={e=>setModo(e.target.value)}>
                  <option value="completo">Reporte completo</option>
                  <option value="progreso">Solo progreso y tareas</option>
                  <option value="pagos">Solo pagos</option>
                  <option value="presupuesto">Solo presupuesto</option>
                </select>
              </div>
            </div>
            <div className="card" style={{padding:16}}>
              <div style={{fontWeight:700,fontSize:12,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:12}}>Tu información</div>
              <div className="form-group"><label className="form-label">Nombre / Estudio</label><input className="form-input" placeholder="Tu nombre" value={tuNombre} onChange={e=>setTuNombre(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Especialidad</label><input className="form-input" placeholder="Diseño & branding" value={tuSlogan} onChange={e=>setTuSlogan(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={tuEmail} onChange={e=>setTuEmail(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Teléfono</label><input className="form-input" value={tuTel} onChange={e=>setTuTel(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Logo (opcional)</label>
                <label className="btn btn-g" style={{width:'100%',justifyContent:'center',cursor:'pointer'}}>
                  {logoB64?'✓ Logo cargado':'📎 Subir logo'}
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={handleLogo} />
                </label>
                {logoB64&&<button className="btn btn-g" style={{width:'100%',justifyContent:'center',marginTop:4,fontSize:11}} onClick={()=>setLogoB64(null)}>✕ Quitar</button>}
              </div>
            </div>
            {(modo==='completo'||modo==='presupuesto')&&(
              <div className="card" style={{padding:16}}>
                <div style={{fontWeight:700,fontSize:12,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:12}}>Presupuesto</div>
                {presItems.map((item,i)=>(
                  <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
                    <input className="form-input" placeholder="Concepto" value={item.desc} onChange={e=>setPresItems(prev=>prev.map((x,j)=>j===i?{...x,desc:e.target.value}:x))} style={{flex:2}} />
                    <input className="form-input" type="number" placeholder="0" value={item.monto} onChange={e=>setPresItems(prev=>prev.map((x,j)=>j===i?{...x,monto:e.target.value}:x))} style={{flex:1}} />
                    <button onClick={()=>setPresItems(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',padding:'0 4px'}}>✕</button>
                  </div>
                ))}
                <button className="btn btn-g" style={{width:'100%',justifyContent:'center',fontSize:11,marginBottom:8}} onClick={()=>setPresItems(prev=>[...prev,{desc:'',monto:''}])}>+ Ítem</button>
                <div style={{display:'flex',gap:6}}>
                  <select className="form-select" value={presMoneda} onChange={e=>setPresMoneda(e.target.value)} style={{flex:1}}>
                    {['ARS','USD','UYU','CLP','PYG','BRL','EUR'].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{fontWeight:700,fontSize:14,marginTop:8,color:'var(--tx)'}}>Total: {presTotal.toLocaleString('es-AR')} {presMoneda}</div>
                <div className="form-group" style={{marginTop:8}}><label className="form-label">Notas</label><input className="form-input" placeholder="Validez, condiciones…" value={presNota} onChange={e=>setPresNota(e.target.value)} /></div>
              </div>
            )}
          </div>

          {/* Preview */}
          {proyecto && (
            <div style={{background:'#f0efe9',padding:20,borderRadius:'var(--rc)'}}>
              <div style={{background:'white',maxWidth:680,margin:'0 auto',padding:48,borderRadius:8,boxShadow:'0 4px 32px rgba(0,0,0,.12)',fontFamily:'sans-serif',color:'#1A1916',fontSize:13}}>
                {/* Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32,paddingBottom:24,borderBottom:'2px solid #1A1916'}}>
                  <div>
                    {logoB64&&<img src={logoB64} alt="logo" style={{maxHeight:40,maxWidth:160,objectFit:'contain',marginBottom:8,display:'block'}} />}
                    <div style={{fontSize:18,fontWeight:700}}>{tuNombre||'Tu nombre'}</div>
                    {tuSlogan&&<div style={{fontSize:12,color:'#6B6860',marginTop:2}}>{tuSlogan}</div>}
                    <div style={{fontSize:11,color:'#6B6860',marginTop:4}}>{tuEmail} {tuTel&&`· ${tuTel}`}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:'#A09E98',marginBottom:4}}>REPORTE DE PROYECTO</div>
                    <div style={{fontSize:11,color:'#A09E98'}}>{new Date().toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})}</div>
                  </div>
                </div>
                {/* Project info */}
                <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>{proyecto.nombre}</h1>
                <div style={{fontSize:13,color:'#6B6860',marginBottom:20}}>Cliente: <strong>{proyecto.clienteNombre}</strong> · {proyecto.tipo}</div>
                {(modo==='completo'||modo==='progreso')&&(
                  <>
                    <div style={{display:'flex',gap:20,marginBottom:20}}>
                      {[['Entrega',fmtFecha(proyecto.fechaEntregaCliente,{day:'numeric',month:'short',year:'numeric'})],['Estado',m.lbl],['Progreso',`${proyecto.progreso||0}%`]].map(([l,v])=>(
                        <div key={l}><div style={{fontSize:10,fontWeight:700,color:'#A09E98',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>{l}</div><div style={{fontWeight:700}}>{v}</div></div>
                      ))}
                    </div>
                    <div style={{height:8,background:'#E4E2DA',borderRadius:10,marginBottom:24,overflow:'hidden'}}><div style={{height:'100%',width:`${proyecto.progreso||0}%`,background:'#1A1916',borderRadius:10}}/></div>
                    {tareasProy.length>0&&(
                      <>
                        <h2 style={{fontSize:14,fontWeight:700,marginBottom:10,borderBottom:'1px solid #E4E2DA',paddingBottom:6}}>Tareas ({done}/{total})</h2>
                        {tareasProy.map(t=>(
                          <div key={t.id} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid #F0EFE9',fontSize:12}}>
                            <span>{t.completada?'✅':'⬜'}</span>
                            <span style={{flex:1,textDecoration:t.completada?'line-through':'none',color:t.completada?'#A09E98':'#1A1916'}}>{t.titulo}</span>
                            {t.fechaLimite&&<span style={{color:'#A09E98'}}>{fmtFecha(t.fechaLimite,{day:'numeric',month:'short'})}</span>}
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
                {(modo==='completo'||modo==='pagos')&&pagosProy.length>0&&(
                  <div style={{marginTop:24}}>
                    <h2 style={{fontSize:14,fontWeight:700,marginBottom:10,borderBottom:'1px solid #E4E2DA',paddingBottom:6}}>Pagos</h2>
                    {pagosProy.map(pg=>(
                      <div key={pg.id} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid #F0EFE9',fontSize:12}}>
                        <span style={{flex:1}}>{pg.concepto||'Pago'}</span>
                        <span style={{fontWeight:600}}>${(pg.monto||0).toLocaleString('es-AR')} {pg.moneda}</span>
                        <span style={{padding:'1px 6px',borderRadius:8,fontSize:10,fontWeight:600,background:pg.estado==='cobrado'?'#E1F5EE':'#FCEAEA',color:pg.estado==='cobrado'?'#0B5E3F':'#8B1A1A'}}>{pg.estado==='cobrado'?'Cobrado':'Pendiente'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(modo==='completo'||modo==='presupuesto')&&presItems.some(i=>i.desc||i.monto)&&(
                  <div style={{marginTop:24}}>
                    <h2 style={{fontSize:14,fontWeight:700,marginBottom:10,borderBottom:'1px solid #E4E2DA',paddingBottom:6}}>Presupuesto</h2>
                    {presItems.filter(i=>i.desc||i.monto).map((item,i)=>(
                      <div key={i} style={{display:'flex',padding:'6px 0',borderBottom:'1px solid #F0EFE9',fontSize:12}}>
                        <span style={{flex:1}}>{item.desc}</span>
                        <span style={{fontWeight:600}}>{(parseFloat(item.monto)||0).toLocaleString('es-AR')} {presMoneda}</span>
                      </div>
                    ))}
                    <div style={{display:'flex',padding:'10px 0',fontWeight:700}}>
                      <span style={{flex:1}}>TOTAL</span>
                      <span>{presTotal.toLocaleString('es-AR')} {presMoneda}</span>
                    </div>
                    {presNota&&<div style={{fontSize:11,color:'#6B6860',marginTop:4,fontStyle:'italic'}}>{presNota}</div>}
                  </div>
                )}
                <div style={{marginTop:40,paddingTop:16,borderTop:'1px solid #E4E2DA',fontSize:10,color:'#A09E98',textAlign:'center'}}>
                  Generado con Freelow · {new Date().toLocaleDateString('es-AR')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
