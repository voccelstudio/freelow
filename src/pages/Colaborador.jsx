import { useState, useEffect } from 'react'
import { getAll, byIdx } from '../lib/db'
import { calcEstado, diasHasta, fmtFecha, ESTADO_META } from '../lib/utils'

// This page works in 2 modes:
// 1. ?data=base64  → show shared project (no DB access needed)
// 2. no param      → generator (reads DB to create shareable link)

export default function Colaborador() {
  const params    = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search)
  const dataParam = params.get('data')

  if (dataParam) return <Viewer dataParam={dataParam} />
  return <Generator />
}

// ── VIEWER ──────────────────────────────────────────────────
function Viewer({ dataParam }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    try {
      setData(JSON.parse(atob(dataParam)))
    } catch { setError(true) }
  }, [dataParam])

  if (error) return (
    <div style={S.center}>
      <div style={{fontSize:40,marginBottom:12}}>🔗</div>
      <h2 style={{fontSize:18,fontWeight:700}}>Link inválido</h2>
      <p style={{fontSize:13,color:'#6B6860',marginTop:4}}>El enlace expiró o fue modificado. Pedile al freelancer que genere uno nuevo.</p>
    </div>
  )
  if (!data) return <div style={S.center}>Cargando…</div>

  const { proyecto, tareas=[], notas } = data
  const m = ESTADO_META[proyecto?.estado] || ESTADO_META.ok
  const done = tareas.filter(t=>t.completada).length
  const pct  = tareas.length ? Math.round(done/tareas.length*100) : 0

  return (
    <div style={{maxWidth:640,margin:'0 auto',padding:'24px 16px',fontFamily:'\'DM Sans\',sans-serif',color:'#1A1916'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28}}>
        <div style={{width:30,height:30,background:'#1A1916',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:12}}>FL</div>
        <span style={{fontWeight:700,fontSize:15}}>Freelow</span>
        <span style={{marginLeft:8,fontSize:11,background:'#E4E2DA',padding:'2px 8px',borderRadius:10,color:'#6B6860'}}>Vista colaborador</span>
      </div>

      <h1 style={{fontSize:24,fontWeight:700,marginBottom:4}}>{proyecto?.nombre}</h1>
      <p style={{fontSize:13,color:'#6B6860',marginBottom:24}}>{proyecto?.clienteNombre} · {proyecto?.tipo}</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
        {[['Estado',m.lbl],['Entrega',fmtFecha(proyecto?.fechaEntregaCliente,{day:'numeric',month:'short',year:'numeric'})],['Progreso',`${proyecto?.progreso||0}%`]].map(([l,v])=>(
          <div key={l} style={{background:'#F7F6F3',border:'1px solid #E4E2DA',borderRadius:10,padding:12}}>
            <div style={{fontSize:10,fontWeight:600,color:'#A09E98',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{l}</div>
            <div style={{fontWeight:700,fontSize:15}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{height:8,background:'#E4E2DA',borderRadius:10,marginBottom:24,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${proyecto?.progreso||0}%`,background:m.dot,borderRadius:10}}/>
      </div>

      {tareas.length>0&&(
        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:14,fontWeight:700,marginBottom:12}}>Tareas ({done}/{tareas.length})</h2>
          {tareas.map(t=>(
            <div key={t.id} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #E4E2DA',alignItems:'center'}}>
              <span>{t.completada?'✅':'⬜'}</span>
              <span style={{flex:1,fontSize:13,textDecoration:t.completada?'line-through':'none',color:t.completada?'#A09E98':'#1A1916'}}>{t.titulo}</span>
              {t.fechaLimite&&<span style={{fontSize:11,color:'#A09E98'}}>{fmtFecha(t.fechaLimite,{day:'numeric',month:'short'})}</span>}
            </div>
          ))}
        </div>
      )}

      {notas&&(
        <div style={{background:'#F7F6F3',border:'1px solid #E4E2DA',borderRadius:10,padding:16,marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:700,color:'#A09E98',marginBottom:6}}>NOTAS</div>
          <div style={{fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{notas}</div>
        </div>
      )}

      <p style={{fontSize:11,color:'#A09E98',textAlign:'center'}}>Generado con Freelow · {new Date().toLocaleDateString('es-AR')}</p>
    </div>
  )
}

// ── GENERATOR ───────────────────────────────────────────────
function Generator() {
  const [proyectos, setProyectos] = useState([])
  const [selId,     setSelId]     = useState('')
  const [incTareas, setIncTareas] = useState(true)
  const [incNotas,  setIncNotas]  = useState(false)
  const [url,       setUrl]       = useState('')
  const [copied,    setCopied]    = useState(false)

  useEffect(()=>{
    getAll('proyectos').then(ps=>{
      const activos=ps.filter(p=>!p.archivado)
      setProyectos(activos)
      if(activos.length) setSelId(activos[0].id)
    })
  },[])

  async function generar() {
    const p = proyectos.find(x=>x.id===selId); if(!p) return
    const tareas = incTareas ? await byIdx('tareas','proyectoId',p.id) : []
    const payload = { proyecto:p, tareas, notas: incNotas?p.notas:undefined }
    const b64 = btoa(JSON.stringify(payload))
    const base = window.location.href.split('?')[0]
    setUrl(`${base}?data=${b64}`)
    setCopied(false)
  }

  function copiar() {
    navigator.clipboard.writeText(url).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000) })
  }

  return (
    <div style={{maxWidth:480,margin:'0 auto',padding:'24px 16px',fontFamily:'\'DM Sans\',sans-serif',color:'#1A1916'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28}}>
        <div style={{width:30,height:30,background:'#1A1916',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:12}}>FL</div>
        <span style={{fontWeight:700,fontSize:15}}>Freelow</span>
      </div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Compartir proyecto</h1>
      <p style={{fontSize:13,color:'#6B6860',marginBottom:24}}>Generá un enlace de solo lectura para tu cliente o colaborador. No requiere cuenta ni app.</p>

      <div style={{background:'white',border:'1px solid #E4E2DA',borderRadius:14,padding:20}}>
        <div style={{marginBottom:14}}>
          <label style={S.fl}>Proyecto</label>
          <select style={S.fi} value={selId} onChange={e=>setSelId(e.target.value)}>
            {proyectos.map(p=><option key={p.id} value={p.id}>{p.nombre}{p.clienteNombre?` — ${p.clienteNombre}`:''}</option>)}
          </select>
        </div>
        <div style={{marginBottom:14}}>
          <label style={S.fl}>¿Qué incluir?</label>
          <label style={{display:'flex',gap:8,alignItems:'center',fontSize:13,marginBottom:8,cursor:'pointer'}}>
            <input type="checkbox" checked={incTareas} onChange={e=>setIncTareas(e.target.checked)} style={{accentColor:'#1A1916'}} />
            Lista de tareas y progreso
          </label>
          <label style={{display:'flex',gap:8,alignItems:'center',fontSize:13,cursor:'pointer'}}>
            <input type="checkbox" checked={incNotas} onChange={e=>setIncNotas(e.target.checked)} style={{accentColor:'#1A1916'}} />
            Notas del proyecto
          </label>
        </div>
        <button onClick={generar} style={{width:'100%',padding:'10px',background:'#1A1916',color:'white',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
          Generar enlace
        </button>

        {url&&(
          <div style={{background:'#F0EFE9',border:'1.5px solid #1D9E75',borderRadius:10,padding:14,marginTop:16}}>
            <div style={{fontSize:11,fontFamily:'monospace',wordBreak:'break-all',marginBottom:10,color:'#1A1916'}}>{url}</div>
            <button onClick={copiar} style={{background:'none',border:'none',color:'#0B5E3F',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
              {copied?'✓ Copiado':'📋 Copiar enlace'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  center: { display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',padding:40,textAlign:'center',fontFamily:'\'DM Sans\',sans-serif' },
  fl:     { display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#A09E98',marginBottom:6 },
  fi:     { width:'100%',padding:'9px 12px',border:'1.5px solid #E4E2DA',borderRadius:9,background:'#F7F6F3',color:'#1A1916',fontSize:13,outline:'none',fontFamily:'\'DM Sans\',sans-serif',marginBottom:14 },
}
