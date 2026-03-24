import { useState, useEffect } from 'react'
import { getAll, put, getCfg, setCfg } from '../lib/db'
import { THEMES } from '../lib/themes'
import { useTheme } from '../hooks/useTheme'
import { Topbar } from '../components/ui/index.jsx'
import { toast, ToastProvider } from '../components/ui/Toast.jsx'

const STORES = ['clientes','proyectos','tareas','colaboradores','alertas','pagos','comunicaciones']

export default function Configuracion() {
  const { theme, setTheme } = useTheme()
  const [nombre,    setNombre]    = useState('')
  const [moneda,    setMoneda]    = useState('ARS')
  const [ultimaExp, setUltimaExp] = useState(null)

  useEffect(()=>{
    Promise.all([getCfg('nombreUsuario',''),getCfg('moneda','ARS'),getCfg('ultimaExportacion',null)]).then(([n,m,ue])=>{
      setNombre(n||''); setMoneda(m||'ARS'); setUltimaExp(ue)
    })
  },[])

  async function guardarPerfil() {
    await setCfg('nombreUsuario', nombre)
    await setCfg('moneda', moneda)
    toast('✓ Configuración guardada')
  }

  async function exportarBackup() {
    const data = { version:'2.0.0', app:'Freelow', exportadoEn: new Date().toISOString() }
    for (const s of STORES) { data[s] = await getAll(s) }
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `freelow-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    await setCfg('ultimaExportacion', new Date().toISOString())
    setUltimaExp(new Date().toISOString())
    toast('✓ Backup exportado')
  }

  function importarBackup(e) {
    const file = e.target.files?.[0]; if(!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.version || !data.clientes) throw new Error('Formato inválido')
        for (const s of STORES) {
          if (!data[s]) continue
          for (const item of data[s]) await put(s, item)
        }
        toast(`✓ Importado: ${data.clientes.length} clientes, ${data.proyectos?.length||0} proyectos`)
      } catch(err) {
        toast('Error al importar: '+err.message,'er')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const diasDesdeExp = ultimaExp ? Math.round((Date.now()-new Date(ultimaExp))/86400000) : null

  return (
    <>
      <ToastProvider />
      <Topbar title="Configuración" />
      <div className="content" style={{maxWidth:640,display:'flex',flexDirection:'column',gap:20}}>

        {/* Perfil */}
        <section className="card" style={{padding:20}}>
          <h3 style={{fontSize:13,fontWeight:700,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:16}}>Perfil</h3>
          <div className="form-group"><label className="form-label">Tu nombre</label><input className="form-input" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Tu nombre" /></div>
          <div className="form-group"><label className="form-label">Moneda principal</label>
            <select className="form-select" value={moneda} onChange={e=>setMoneda(e.target.value)}>
              {['ARS','USD','UYU','CLP','PYG','BRL','MXN','EUR'].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <button className="btn btn-p" onClick={guardarPerfil}>Guardar cambios</button>
        </section>

        {/* Temas */}
        <section className="card" style={{padding:20}}>
          <h3 style={{fontSize:13,fontWeight:700,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:16}}>Tema visual ({THEMES.length} disponibles)</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {THEMES.map(t=>(
              <div key={t.id} onClick={()=>setTheme(t.id)} style={{padding:10,borderRadius:'var(--rc)',border:`2px solid ${theme===t.id?t.ac:'var(--br)'}`,cursor:'pointer',transition:'border-color .15s',background:t.bg}}>
                <div style={{height:24,borderRadius:4,background:t.ac,marginBottom:6}}/>
                <div style={{fontSize:10,fontWeight:700,color:t.tx}}>{t.lbl}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Backup */}
        <section className="card" style={{padding:20}}>
          <h3 style={{fontSize:13,fontWeight:700,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Backup y restauración</h3>
          <div style={{fontSize:12,color:'var(--tx2)',marginBottom:16,lineHeight:1.6}}>
            {diasDesdeExp===null ? '⚠️ Nunca exportaste un backup. Hacelo regularmente por si borrás el caché del navegador.' : diasDesdeExp > 30 ? `⚠️ Tu último backup tiene ${diasDesdeExp} días. Exportá uno nuevo.` : `✓ Último backup hace ${diasDesdeExp} día${diasDesdeExp!==1?'s':''}.`}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p" onClick={exportarBackup}>↓ Exportar backup</button>
            <label className="btn btn-g" style={{cursor:'pointer'}}>
              ↑ Importar backup
              <input type="file" accept=".json" style={{display:'none'}} onChange={importarBackup} />
            </label>
          </div>
          <p style={{fontSize:11,color:'var(--tx3)',marginTop:12}}>El backup incluye clientes, proyectos, tareas, pagos y comunicaciones. Se guarda en tu dispositivo como JSON.</p>
        </section>

        {/* Danger zone */}
        <section className="card" style={{padding:20,borderColor:'var(--cr-dot)'}}>
          <h3 style={{fontSize:13,fontWeight:700,color:'var(--cr-tx)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Zona de peligro</h3>
          <p style={{fontSize:12,color:'var(--tx2)',marginBottom:12}}>Estas acciones son irreversibles. Exportá un backup antes de proceder.</p>
          <button className="btn btn-danger" onClick={async ()=>{
            if (!confirm('¿Resetear TODO Freelow? Perdés todos tus datos.')) return
            if (!confirm('Última confirmación: ¿borrar TODO?')) return
            for (const s of STORES) {
              const items = await getAll(s)
              for (const item of items) { try { const { del } = await import('../lib/db'); await del(s, item.id||item.clave) } catch{} }
            }
            await setCfg('onboardingHecho',false)
            window.location.reload()
          }}>Reset completo</button>
        </section>

      </div>
    </>
  )
}
