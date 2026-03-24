import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setCfg, seed } from '../lib/db'
import { applyTheme } from '../lib/themes'
import { THEMES } from '../lib/themes'

const MONEDAS = ['ARS — Peso argentino','USD — Dólar','UYU — Peso uruguayo','CLP — Peso chileno','PYG — Guaraní','BRL — Real','MXN — Peso mexicano','EUR — Euro']

export default function Onboarding({ onDone }) {
  const navigate = useNavigate()
  const [step, setStep]   = useState(0)
  const [nombre, setNombre] = useState('')
  const [moneda, setMoneda] = useState('ARS — Peso argentino')
  const [tema,   setTemaState] = useState('minimal')
  const [saving, setSaving]   = useState(false)

  function pickTheme(t) {
    setTemaState(t)
    applyTheme(t)
  }

  async function finish() {
    if (!nombre.trim()) return
    setSaving(true)
    await setCfg('nombreUsuario', nombre.trim())
    await setCfg('moneda',        moneda.split(' ')[0])
    await setCfg('tema',          tema)
    await setCfg('onboardingHecho', true)
    onDone?.()
    navigate('/dashboard', { replace: true })
  }

  const steps = [
    // Step 0 — Bienvenida
    <div key="0" style={styles.card}>
      <div style={styles.emoji}>🚀</div>
      <h2 style={styles.h2}>Bienvenido a Freelow</h2>
      <p style={styles.p}>Tu control de vuelo freelancer. Proyectos, clientes, finanzas y comunicaciones — todo local en tu navegador, sin cuentas ni suscripciones.</p>
      <button className="btn btn-p" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }} onClick={() => setStep(1)}>
        Empezar →
      </button>
    </div>,

    // Step 1 — Nombre
    <div key="1" style={styles.card}>
      <div style={styles.emoji}>👤</div>
      <h2 style={styles.h2}>¿Cómo te llamás?</h2>
      <p style={styles.p}>Así te saludamos en el dashboard.</p>
      <input
        className="form-input"
        style={{ marginTop: 20 }}
        placeholder="Tu nombre o apodo"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && nombre.trim() && setStep(2)}
        autoFocus
      />
      <div style={styles.btnRow}>
        <button className="btn btn-g" onClick={() => setStep(0)}>← Atrás</button>
        <button className="btn btn-p" onClick={() => setStep(2)} disabled={!nombre.trim()}>Siguiente →</button>
      </div>
    </div>,

    // Step 2 — Moneda
    <div key="2" style={styles.card}>
      <div style={styles.emoji}>💰</div>
      <h2 style={styles.h2}>Moneda principal</h2>
      <p style={styles.p}>Se usa como referencia en finanzas y reportes.</p>
      <select className="form-select" style={{ marginTop: 20 }} value={moneda} onChange={e => setMoneda(e.target.value)}>
        {MONEDAS.map(m => <option key={m}>{m}</option>)}
      </select>
      <div style={styles.btnRow}>
        <button className="btn btn-g" onClick={() => setStep(1)}>← Atrás</button>
        <button className="btn btn-p" onClick={() => setStep(3)}>Siguiente →</button>
      </div>
    </div>,

    // Step 3 — Tema
    <div key="3" style={styles.card}>
      <div style={styles.emoji}>🎨</div>
      <h2 style={styles.h2}>Elegí tu tema</h2>
      <p style={styles.p}>Podés cambiarlo cuando quieras desde el sidebar.</p>
      <div style={styles.themeGrid}>
        {THEMES.map(t => (
          <div
            key={t.id}
            onClick={() => pickTheme(t.id)}
            style={{
              ...styles.themeTile,
              border: `2px solid ${tema === t.id ? t.ac : 'var(--br)'}`,
              background: t.bg,
            }}
          >
            <div style={{ width: '100%', height: 28, background: t.ac, borderRadius: 4, marginBottom: 6 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: t.tx }}>{t.lbl}</span>
          </div>
        ))}
      </div>
      <div style={styles.btnRow}>
        <button className="btn btn-g" onClick={() => setStep(2)}>← Atrás</button>
        <button className="btn btn-p" onClick={finish} disabled={saving}>
          {saving ? 'Guardando…' : '¡Listo! Entrar →'}
        </button>
      </div>
    </div>,
  ]

  return (
    <div style={styles.wrap}>
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoMark}>FL</div>
          <span style={styles.logoText}>Freelow</span>
        </div>
        {/* Dots */}
        <div style={styles.dots}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ ...styles.dot, background: i === step ? 'var(--ac)' : 'var(--br)' }} />
          ))}
        </div>
        {/* Step */}
        {steps[step]}
      </div>
    </div>
  )
}

const styles = {
  wrap:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  inner:     { width: '100%', maxWidth: 440 },
  logo:      { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' },
  logoMark:  { width: 36, height: 36, background: 'var(--ac)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acf)', fontWeight: 700 },
  logoText:  { fontSize: 20, fontWeight: 700, color: 'var(--tx)' },
  dots:      { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 },
  dot:       { width: 8, height: 8, borderRadius: '50%', transition: 'background .3s' },
  card:      { background: 'var(--sf)', border: '1px solid var(--br)', borderRadius: 'var(--rc)', padding: 32, boxShadow: 'var(--sh)' },
  emoji:     { fontSize: 40, marginBottom: 12 },
  h2:        { fontSize: 22, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--fdi)', letterSpacing: '-.02em' },
  p:         { fontSize: 14, color: 'var(--tx2)', lineHeight: 1.6 },
  btnRow:    { display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' },
  themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 20, maxHeight: 280, overflowY: 'auto' },
  themeTile: { padding: 10, borderRadius: 8, cursor: 'pointer', textAlign: 'center', transition: 'border-color .15s' },
}
