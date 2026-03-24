import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll } from '../lib/db'
import { diasHasta, fmtFecha } from '../lib/utils'
import { Topbar, Loading } from '../components/ui/index.jsx'

function uid() { return Math.random().toString(36).slice(2) }
const READ_KEY = 'freelow_notifs_leidas'
function getLeidas() { try { return new Set(JSON.parse(localStorage.getItem(READ_KEY)||'[]')) } catch { return new Set() } }
function saveLeida(id) { const s=getLeidas(); s.add(id); localStorage.setItem(READ_KEY,JSON.stringify([...s])) }
function saveAllLeidas(ids) { localStorage.setItem(READ_KEY,JSON.stringify(ids)) }

export default function Notificaciones() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifs,  setNotifs]  = useState([])
  const [filtro,  setFiltro]  = useState('todas')

  useEffect(()=>{
    Promise.all([getAll('proyectos'),getAll('pagos'),getAll('tareas')]).then(([ps,pgs,ts])=>{
      setNotifs(generar(ps,pgs,ts)); setLoading(false)
    })
  },[])

  function generar(ps,pgs,ts) {
    const lista = []
    ps.filter(p=>!p.archivado&&p.estado!=='entregado').forEach(p=>{
      const d=diasHasta(p.fechaEntregaCliente)
      if (d<0) lista.push({id:`pv-${p.id}`,tipo:'proyectos',prio:'alta',icon:'⚠️',titulo:`"${p.nombre}" venció hace ${Math.abs(d)}d`,desc:`Entrega: ${fmtFecha(p.fechaEntregaCliente,{day:'numeric',month:'short'})}. Marcá como entregado o actualizá la fecha.`,pid:p.id})
      else if(d<=1) lista.push({id:`pc-${p.id}`,tipo:'proyectos',prio:'alta',icon:'🔴',titulo:`Entrega crítica: "${p.nombre}"`,desc:`Vence ${d===0?'hoy':'mañana'}. Progreso: ${p.progreso||0}%.`,pid:p.id})
      else if(d<=5) lista.push({id:`pu-${p.id}`,tipo:'proyectos',prio:'media',icon:'🟡',titulo:`Entrega en ${d}d: "${p.nombre}"`,desc:`Fecha: ${fmtFecha(p.fechaEntregaCliente,{day:'numeric',month:'short'})}. Progreso: ${p.progreso||0}%.`,pid:p.id})
      else if(d<=14) lista.push({id:`pa-${p.id}`,tipo:'proyectos',prio:'baja',icon:'📅',titulo:`"${p.nombre}" entrega en ${d}d`,desc:`Entrega: ${fmtFecha(p.fechaEntregaCliente,{day:'numeric',month:'short'})}.`,pid:p.id})
      if(p.fechaEntregaInterna){const di=diasHasta(p.fechaEntregaInterna);if(di>=0&&di<=3) lista.push({id:`pi-${p.id}`,tipo:'proyectos',prio:'media',icon:'⏰',titulo:`Fecha interna en ${di===0?'hoy':`${di}d`}: "${p.nombre}"`,desc:`Tu fecha interna: ${di===0?'hoy':fmtFecha(p.fechaEntregaInterna,{day:'numeric',month:'short'})}.`,pid:p.id})}
      if(d>0&&d<=14&&(p.progreso||0)<30) lista.push({id:`pp-${p.id}`,tipo:'proyectos',prio:'media',icon:'📊',titulo:`Progreso bajo en "${p.nombre}"`,desc:`Solo ${p.progreso||0}% con ${d}d restantes.`,pid:p.id})
    })
    pgs.filter(p=>p.estado!=='cobrado').forEach(pg=>{
      const d=diasHasta(pg.fechaVencimiento)
      if(d<0) lista.push({id:`pgv-${pg.id}`,tipo:'pagos',prio:'alta',icon:'💸',titulo:`Pago vencido: ${pg.concepto||'pago'}`,desc:`Venció hace ${Math.abs(d)} días.`})
      else if(d<=3) lista.push({id:`pgu-${pg.id}`,tipo:'pagos',prio:'media',icon:'💰',titulo:`Cobro en ${d===0?'hoy':`${d}d`}: ${pg.concepto||'pago'}`,desc:`Vence ${d===0?'hoy':fmtFecha(pg.fechaVencimiento,{day:'numeric',month:'short'})}.`})
    })
    const tareasPend=ts.filter(t=>!t.completada&&t.fechaLimite&&diasHasta(t.fechaLimite)<=0)
    if(tareasPend.length) lista.push({id:'tv',tipo:'tareas',prio:'media',icon:'✅',titulo:`${tareasPend.length} tarea${tareasPend.length!==1?'s':''} vencida${tareasPend.length!==1?'s':''}`,desc:'Revisá tus proyectos para actualizarlas.'})
    return lista
  }

  function marcarLeida(id) { saveLeida(id); setNotifs(prev=>prev.map(n=>n.id===id?{...n,leida:true}:n)) }
  function marcarTodasLeidas() { saveAllLeidas(notifs.map(n=>n.id)); setNotifs(prev=>prev.map(n=>({...n,leida:true}))) }

  const leidas  = getLeidas()
  const lista   = notifs.map(n=>({...n,leida:leidas.has(n.id)}))
  const unread  = lista.filter(n=>!n.leida).length
  const visible = filtro==='todas'?lista:lista.filter(n=>n.tipo===filtro)
  const TIPOS   = [{id:'todas',lbl:'Todas'},{id:'proyectos',lbl:'Proyectos'},{id:'pagos',lbl:'Pagos'},{id:'tareas',lbl:'Tareas'}]

  if (loading) return <><Topbar title="Alertas" /><Loading /></>

  return (
    <>
      <Topbar
        title="Alertas"
        subtitle={`${unread} sin leer`}
        right={unread>0?<button className="btn btn-g" onClick={marcarTodasLeidas}>✓ Marcar todas</button>:null}
      />
      <div className="content" style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',gap:6}}>
          {TIPOS.map(t=><button key={t.id} className={`chip${filtro===t.id?' on':''}`} onClick={()=>setFiltro(t.id)}>{t.lbl}</button>)}
        </div>
        {visible.length===0
          ? <div style={{textAlign:'center',padding:60,color:'var(--tx3)'}}><div style={{fontSize:40,marginBottom:12}}>🎉</div><div style={{fontSize:14,fontWeight:600,color:'var(--tx2)'}}>Todo al día</div><div style={{fontSize:12,marginTop:4}}>No hay alertas activas.</div></div>
          : visible.map(n=>(
              <div key={n.id} className="card" style={{padding:'14px 16px',borderLeft:`4px solid ${n.prio==='alta'?'var(--cr-dot)':n.prio==='media'?'var(--wa-dot)':'var(--ok-dot)'}`,opacity:n.leida?.6:1,transition:'opacity .2s'}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <span style={{fontSize:22,flexShrink:0}}>{n.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{n.titulo}</div>
                    <div style={{fontSize:12,color:'var(--tx2)'}}>{n.desc}</div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    {n.pid&&<button className="btn btn-g" style={{padding:'3px 8px',fontSize:11}} onClick={()=>navigate(`/proyectos/${n.pid}`)}>Ver →</button>}
                    {!n.leida&&<button className="btn btn-g" style={{padding:'3px 8px',fontSize:11}} onClick={()=>marcarLeida(n.id)}>✓</button>}
                  </div>
                </div>
              </div>
            ))
        }
      </div>
    </>
  )
}
