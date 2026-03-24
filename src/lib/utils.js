// ─────────────────────────────────────────────────────────────
//  Helpers compartidos
// ─────────────────────────────────────────────────────────────

export function diasHasta(iso) {
  if (!iso) return 999
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const f   = new Date(iso); f.setHours(0, 0, 0, 0)
  return Math.round((f - hoy) / 86400000)
}

export function calcEstado(iso) {
  const d = diasHasta(iso)
  if (d < 0)   return 'vencido'
  if (d <= 1)  return 'critico'
  if (d <= 5)  return 'urgente'
  if (d <= 14) return 'atencion'
  return 'ok'
}

export function fmtFecha(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', opts)
}

export function fmtMonto(monto, moneda = 'ARS') {
  if (monto == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(monto)
}

export function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function relTime(iso) {
  if (!iso) return '—'
  const diff = Math.round((Date.now() - new Date(iso)) / 60000)
  if (diff < 1)     return 'ahora'
  if (diff < 60)    return `hace ${diff} min`
  if (diff < 1440)  return `hace ${Math.round(diff / 60)}h`
  if (diff < 10080) return `hace ${Math.floor(diff / 1440)} días`
  return fmtFecha(iso)
}

export function dLabel(iso) {
  const d = diasHasta(iso)
  if (d < 0)   return `Venció hace ${Math.abs(d)}d`
  if (d === 0) return 'Vence hoy'
  if (d === 1) return 'Mañana'
  return `en ${d} días`
}

export const AVATAR_PALETTES = [
  ['#EEEDFE', '#3C3489'], ['#E1F5EE', '#0F6E56'], ['#FAEEDA', '#854F0B'],
  ['#FCEAEA', '#8B1A1A'], ['#E6F1FB', '#0C447C'], ['#FBF0E8', '#8C4A1A'],
  ['#F0EEFF', '#4A2A8C'], ['#E8F8F0', '#0A5A3A'],
]

export function avatarPalette(index) {
  return AVATAR_PALETTES[Math.abs(index || 0) % AVATAR_PALETTES.length]
}

export const ESTADO_META = {
  critico:   { lbl: 'Crítico',   cls: 'badge-cr',     dot: 'var(--cr-dot)' },
  urgente:   { lbl: 'Urgente',   cls: 'badge-ur',     dot: 'var(--ur-dot)' },
  atencion:  { lbl: 'Atención',  cls: 'badge-wa',     dot: 'var(--wa-dot)' },
  ok:        { lbl: 'A tiempo',  cls: 'badge-ok',     dot: 'var(--ok-dot)' },
  vencido:   { lbl: 'Vencido',   cls: 'badge-cr',     dot: 'var(--cr-dot)' },
  entregado: { lbl: 'Entregado', cls: 'badge-done',   dot: 'var(--ok-dot)' },
}

export const CANALES = [
  { id: 'whatsapp',  nombre: 'WhatsApp',  icon: '💬', color: '#25D366', bg: '#E8FBF0' },
  { id: 'email',     nombre: 'Email',     icon: '📧', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'instagram', nombre: 'Instagram', icon: '📸', color: '#E1306C', bg: '#FEE8EF' },
  { id: 'tiktok',    nombre: 'TikTok',    icon: '🎵', color: '#010101', bg: '#F0F0F0' },
  { id: 'telegram',  nombre: 'Telegram',  icon: '✈️', color: '#2AABEE', bg: '#E8F6FD' },
  { id: 'llamada',   nombre: 'Llamada',   icon: '📞', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'videocall', nombre: 'Video',     icon: '🎥', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'otro',      nombre: 'Otro',      icon: '💭', color: '#6B7280', bg: '#F9FAFB' },
]

export function canalInfo(id) {
  return CANALES.find(c => c.id === id) || CANALES[CANALES.length - 1]
}
