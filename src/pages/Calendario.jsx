import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll } from '../lib/db'
import { calcEstado, diasHasta, ESTADO_META, fmtFecha } from '../lib/utils'
import { Topbar, Loading } from '../components/ui/index.jsx'

const DIAS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const VISTAS = [{id:'month',lbl:'Mes'},{id:'agenda',lbl:'Agenda'}]

export default function Calendario() {
  const navigate = useNavigate()
  const [loading,    setLoading]    = useState(true)
  const [proyectos,  setProyectos]  = useState([])
  const [cursor,     setCursor]     = useState(new Date())
  const [selected,   setSelected]   = useState(null)
  const [vista,      setVista]      = useState('month')

  useEffect(() => {
    getAll('proyectos').then(ps => { setProyectos(ps); setLoading(false) })
  }, [])

  // Build a map of date → array of projects with deliveries on that day
  function buildMap() {
    const map = {}
    proyectos.filter(p=>!p.archivado).forEach(p => {
      if (p.fechaEntregaCliente) {
        const k = p.fechaEntregaCliente.split('T')[0]
        if (!map[k]) map[k] = []
        map[k].push({ ...p, _tipo:'cliente' })
      }
      if (p.fechaEntregaInterna) {
        const k = p.fechaEntregaInterna.split('T')[0]
        if (!map[k]) map[k] = []
        map[k].push({ ...p, _tipo:'interna' })
      }
    })
    return map
  }

  function prev() { const d=new Date(cursor); d.setMonth(d.getMonth()-1); setCursor(d) }
  function next() { const d=new Date(cursor); d.setMonth(d.getMonth()+1); setCursor(d) }

  if (loading) return <><Topbar title="Calendario" /><Loading /></>

  const map = buildMap()
  const y = cursor.getFullYear(), m = cursor.getMonth()
  const firstDay = new Date(y,m,1).getDay()
  const daysInMonth = new Date(y,m+1,0).getDate()
  const daysInPrev  = new Date(y,m,0).getDate()
  const HOY_STR = new Date().toISOString().split('T')[0]

  const dayEvents = selected ? (map[selected]||[]) : []

  return (
    <>
      <Topbar
        title="Calendario"
        subtitle={`${MESES[m]} ${y}`}
        right={
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {VISTAS.map(v=><button key={v.id} className={`chip${vista===v.id?' on':''}`} onClick={()=>setVista(v.id)}>{v.lbl}</button>)}
            <button className="btn btn-g" onClick={prev}>←</button>
            <button className="btn btn-g" onClick={()=>setCursor(new Date())}>Hoy</button>
            <button className="btn btn-g" onClick={next}>→</button>
          </div>
        }
      />

      <div className="content">
        {vista === 'month'
          ? <div style={{display:'grid',gridTemplateColumns:selected?'1fr 300px':'1fr',gap:20}}>
              <div>
                {/* Weekday headers */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,marginBottom:4}}>
                  {DIAS.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:600,color:'var(--tx3)',padding:'4px 0'}}>{d}</div>)}
                </div>
                {/* Grid */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1}}>
                  {/* prev month days */}
                  {Array.from({length:firstDay},(_,i)=>{
                    const day=daysInPrev-firstDay+i+1
                    const k=`${m===0?y-1:y}-${String(m===0?12:m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    return <DayCell key={'p'+i} dayNum={day} iso={k} other evs={map[k]||[]} selected={selected} onSelect={setSelected} hoy={HOY_STR} />
                  })}
                  {/* this month */}
                  {Array.from({length:daysInMonth},(_,i)=>{
                    const day=i+1
                    const k=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    return <DayCell key={day} dayNum={day} iso={k} evs={map[k]||[]} selected={selected} onSelect={setSelected} hoy={HOY_STR} />
                  })}
                  {/* next month */}
                  {Array.from({length:(7-((firstDay+daysInMonth)%7))%7},(_,i)=>{
                    const day=i+1
                    const k=`${m===11?y+1:y}-${String(m===11?1:m+2).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    return <DayCell key={'n'+i} dayNum={day} iso={k} other evs={map[k]||[]} selected={selected} onSelect={setSelected} hoy={HOY_STR} />
                  })}
                </div>
              </div>
              {/* Side panel */}
              {selected && (
                <div className="card" style={{padding:16,alignSelf:'start',position:'sticky',top:20}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15}}>{new Date(selected+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'}).replace(/^./,c=>c.toUpperCase())}</div>
                      <div style={{fontSize:12,color:'var(--tx3)'}}>{dayEvents.length} entrega{dayEvents.length!==1?'s':''}</div>
                    </div>
                    <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:16}}>✕</button>
                  </div>
                  {dayEvents.length===0
                    ? <p style={{fontSize:12,color:'var(--tx3)'}}>Sin entregas este día.</p>
                    : dayEvents.map(p=>{
                        const m=ESTADO_META[p.estado]||ESTADO_META.ok
                        return (
                          <div key={p.id+p._tipo} onClick={()=>navigate(`/proyectos/${p.id}`)} style={{padding:'10px 0',borderBottom:'1px solid var(--br)',cursor:'pointer',borderLeft:`3px solid ${m.dot}`,paddingLeft:10,marginBottom:6}}>
                            <div style={{fontWeight:600,fontSize:13}}>{p.nombre}</div>
                            <div style={{fontSize:11,color:'var(--tx2)',marginTop:2}}>{p.clienteNombre}</div>
                            <div style={{display:'flex',gap:6,marginTop:4}}>
                              <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'var(--sf2)',color:'var(--tx3)'}}>{p._tipo==='interna'?'Interna':'Cliente'}</span>
                              <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:m.dot+'22',color:m.dot,fontWeight:600}}>{m.lbl}</span>
                            </div>
                          </div>
                        )
                      })
                  }
                </div>
              )}
            </div>
          : <AgendaView map={map} navigate={navigate} />
        }
      </div>
    </>
  )
}

function DayCell({ dayNum, iso, other, evs, selected, onSelect, hoy }) {
  const isToday    = iso === hoy
  const isSel      = iso === selected
  const hasEv      = evs.length > 0
  return (
    <div onClick={()=>onSelect(iso===selected?null:iso)} style={{
      minHeight:80,padding:6,background:isSel?'var(--sf2)':isToday?'var(--ac)':other?'transparent':'var(--sf)',
      border:`1px solid ${isToday?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rc)',cursor:'pointer',transition:'background .15s',
    }}>
      <div style={{fontWeight:isToday||isSel?700:400,fontSize:12,color:isToday?'var(--acf)':other?'var(--tx3)':'var(--tx)',marginBottom:4}}>{dayNum}</div>
      {evs.slice(0,3).map((p,i)=>{
        const m=ESTADO_META[p.estado]||ESTADO_META.ok
        return <div key={i} style={{fontSize:10,lineHeight:1.3,marginBottom:2,padding:'1px 4px',borderRadius:3,background:m.dot+'22',color:m.dot,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{p.nombre}</div>
      })}
      {evs.length>3&&<div style={{fontSize:9,color:'var(--tx3)'}}>+{evs.length-3} más</div>}
    </div>
  )
}

function AgendaView({ map, navigate }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const upcoming = Object.entries(map)
    .filter(([k])=>new Date(k+'T12:00:00')>=today)
    .sort(([a],[b])=>a.localeCompare(b))
    .slice(0,20)

  if (!upcoming.length) return <div style={{textAlign:'center',padding:60,color:'var(--tx3)'}}>Sin entregas próximas.</div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      {upcoming.map(([k,evs])=>{
        const d=new Date(k+'T12:00:00')
        const isHoy=k===new Date().toISOString().split('T')[0]
        return (
          <div key={k} style={{display:'flex',gap:16,padding:'12px 0',borderBottom:'1px solid var(--br)'}}>
            <div style={{width:60,flexShrink:0,textAlign:'right'}}>
              <div style={{fontSize:24,fontWeight:700,color:isHoy?'var(--ac)':'var(--tx)'}}>{d.getDate()}</div>
              <div style={{fontSize:11,color:'var(--tx3)'}}>{DIAS[d.getDay()]}</div>
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {evs.map(p=>{
                const m=ESTADO_META[p.estado]||ESTADO_META.ok
                return (
                  <div key={p.id+p._tipo} onClick={()=>navigate(`/proyectos/${p.id}`)} className="card" style={{padding:'10px 14px',cursor:'pointer',borderLeft:`4px solid ${m.dot}`}}>
                    <div style={{fontWeight:600,fontSize:13}}>{p.nombre}</div>
                    <div style={{fontSize:11,color:'var(--tx2)',marginTop:2}}>{p.clienteNombre} · {p._tipo==='interna'?'Fecha interna':'Entrega cliente'}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
