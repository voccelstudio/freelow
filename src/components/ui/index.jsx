// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, wide }) {
  if (!open) return null
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={wide ? { maxWidth: 680 } : {}}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────
const BADGE_CLS = {
  ok:      'badge-ok',
  wa:      'badge-wa',
  ur:      'badge-ur',
  cr:      'badge-cr',
  done:    'badge-done',
  critico: 'badge-cr',
  urgente: 'badge-ur',
  atencion:'badge-wa',
  vencido: 'badge-cr',
  entregado:'badge-done',
}
export function Badge({ tipo, children, style }) {
  return <span className={`badge ${BADGE_CLS[tipo] || 'badge-ok'}`} style={style}>{children}</span>
}

// ── ProgressBar ────────────────────────────────────────────
export function ProgressBar({ pct, color, height = 6 }) {
  return (
    <div className="progress-track" style={{ height }}>
      <div
        className="progress-fill"
        style={{ width: `${Math.min(100, Math.max(0, pct || 0))}%`, background: color || 'var(--ac)' }}
      />
    </div>
  )
}

// ── StatCard ───────────────────────────────────────────────
export function StatCard({ icon, value, label, color }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={{ background: color ? color + '22' : 'var(--sf2)' }}>{icon}</div>
      <div>
        <div className="stat-val" style={color ? { color } : {}}>{value}</div>
        <div className="stat-lbl">{label}</div>
      </div>
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

// ── LoadingSpinner ─────────────────────────────────────────
export function Loading({ text = 'Cargando…' }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      {text}
    </div>
  )
}

// ── Topbar ─────────────────────────────────────────────────
export function Topbar({ title, subtitle, right }) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {right && <div className="topbar-r">{right}</div>}
    </div>
  )
}

// ── Avatar ─────────────────────────────────────────────────
import { initials, avatarPalette } from '../../lib/utils'

export function Avatar({ name, index = 0, size = 36 }) {
  const [bg, fg] = avatarPalette(index)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  )
}
