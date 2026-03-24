import { useState, useEffect } from 'react'
import { getAll } from '../lib/db'
import { calcEstado, diasHasta, ESTADO_META, fmtFecha, initials, avatarPalette } from '../lib/utils'
import { Topbar, Loading, StatCard } from '../components/ui/index.jsx'

export default function Analisis() {
  const [loading,   setLoading]   = useState(true)
  const [proyectos, setProyectos] = useState([])
  const [clientes,  setClientes]  = useState([])
  const [tareas,    setTareas]    = useState([])
  const [pagos,     setPagos]     = useState([])

  useEffect(()=>{
    Promise.all([getAll('proyectos'),getAll('clientes'),getAll('tareas'),getAll('pagos')]).then(([ps,cs,ts,pgs])=>{
      setProyectos(ps);setClientes(cs);setTareas(ts);setPagos(pgs);setLoading(false)
    })
  },[])

  if (loading) return <><Topbar title="Análisis" /><Loading /></>

  const activos    = proyectos.filter(p=>!p.archivado&&p.estado!=='entregado')
  const entregados = proyectos.filter(p=>p.estado==='entregado')
  const vencidos   = activos.filter(p=>p.estado==='vencido')
  const tasaComp   = tareas.length ? Math.round(tareas.filter(t=>t.completada).length/tareas.length*100) : 0
  const totalCobrado = pagos.filter(p=>p.estado==='cobrado').reduce((a,p)=>a+(p.monto||0),0)

  const estadoCount = {}
  activos.forEach(p=>{ estadoCount[p.estado]=(estadoCount[p.estado]||0)+1 })

  // Proyectos por cliente
  const porCliente = clientes.map((c,i)=>({
    c, i, total:proyectos.filter(p=>p.clienteId===c.id).length,
    activos:activos.filter(p=>p.clienteId===c.id).length,
  })).filter(x=>x.total>0).sort((a,b)=>b.total-a.total)

  const maxProj = Math.max(...porCliente.map(x=>x.total),1)

  return (
    <>
      <Topbar title="Análisis" subtitle="Métricas de tu actividad freelance" />
      <div className="content" style={{display:'flex',flexDirection:'column',gap:24}}>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="📁" value={activos.length}    label="Proyectos activos" />
          <StatCard icon="📦" value={entregados.length} label="Entregados" color="var(--ok-dot)" />
          <StatCard icon="⚠️" value={vencidos.length}  label="Vencidos"   color="var(--cr-dot)" />
          <StatCard icon="✅" value={`${tasaComp}%`}    label="Tareas completadas" />
          <StatCard icon="👥" value={clientes.length}   label="Clientes" />
          <StatCard icon="💰" value={`$${totalCobrado.toLocaleString('es-AR')}`} label="Total cobrado" color="var(--ok-dot)" />
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          {/* Estado de proyectos */}
          <div className="card" style={{padding:20}}>
            <h3 style={{fontSize:13,fontWeight:700,color:'var(--tx2)',marginBottom:16,textTransform:'uppercase',letterSpacing:'.06em'}}>Estado de proyectos</h3>
            {Object.entries(ESTADO_META).map(([k,m])=>{
              const count=(estadoCount[k]||0)
              if (!count) return null
              const pct=Math.round(count/activos.length*100)
              return(
                <div key={k} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                    <span style={{fontWeight:500}}>{m.lbl}</span>
                    <span style={{color:'var(--tx3)'}}>{count} ({pct}%)</span>
                  </div>
                  <div style={{height:6,background:'var(--sf2)',borderRadius:10,overflow:'hidden'}}>
                    <div style={{height:'100%',width:pct+'%',background:m.dot,borderRadius:10,transition:'width .4s'}}/>
                  </div>
                </div>
              )
            })}
            {activos.length===0&&<p style={{fontSize:12,color:'var(--tx3)'}}>Sin proyectos activos.</p>}
          </div>

          {/* Carga por cliente */}
          <div className="card" style={{padding:20}}>
            <h3 style={{fontSize:13,fontWeight:700,color:'var(--tx2)',marginBottom:16,textTransform:'uppercase',letterSpacing:'.06em'}}>Proyectos por cliente</h3>
            {porCliente.slice(0,8).map(({c,i,total,activos:acts})=>{
              const [bg,fg]=avatarPalette(i)
              return(
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11,flexShrink:0}}>{initials(c.nombre)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,marginBottom:3}}>{c.nombre}</div>
                    <div style={{height:5,background:'var(--sf2)',borderRadius:10,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${Math.round(total/maxProj*100)}%`,background:'var(--ac)',borderRadius:10}}/>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:'var(--tx3)',minWidth:30,textAlign:'right'}}>{total}</div>
                </div>
              )
            })}
            {porCliente.length===0&&<p style={{fontSize:12,color:'var(--tx3)'}}>Sin datos todavía.</p>}
          </div>
        </div>

        {/* Próximas entregas */}
        <div className="card" style={{padding:20}}>
          <h3 style={{fontSize:13,fontWeight:700,color:'var(--tx2)',marginBottom:16,textTransform:'uppercase',letterSpacing:'.06em'}}>Próximas entregas</h3>
          {activos.filter(p=>p.fechaEntregaCliente).sort((a,b)=>diasHasta(a.fechaEntregaCliente)-diasHasta(b.fechaEntregaCliente)).slice(0,8).map(p=>{
            const m=ESTADO_META[p.estado]||ESTADO_META.ok
            const dias=diasHasta(p.fechaEntregaCliente)
            return(
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid var(--br)'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:m.dot,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{p.nombre}</div>
                  <div style={{fontSize:11,color:'var(--tx2)'}}>{p.clienteNombre}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,fontWeight:600,color:m.dot}}>{dias<0?'Vencido':dias===0?'Hoy':dias===1?'Mañana':`${dias}d`}</div>
                  <div style={{fontSize:10,color:'var(--tx3)'}}>{fmtFecha(p.fechaEntregaCliente,{day:'numeric',month:'short'})}</div>
                </div>
                <div style={{width:60}}>
                  <div style={{height:4,background:'var(--sf2)',borderRadius:10,overflow:'hidden'}}><div style={{height:'100%',width:`${p.progreso||0}%`,background:m.dot,borderRadius:10}}/></div>
                  <div style={{fontSize:10,color:'var(--tx3)',marginTop:2,textAlign:'center'}}>{p.progreso||0}%</div>
                </div>
              </div>
            )
          })}
          {activos.length===0&&<p style={{fontSize:12,color:'var(--tx3)'}}>Sin proyectos activos.</p>}
        </div>

      </div>
    </>
  )
}
