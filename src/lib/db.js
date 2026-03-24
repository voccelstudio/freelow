// ─────────────────────────────────────────────────────────────
//  FREELOW — IndexedDB wrapper centralizado
//  Una sola fuente de verdad para toda la app
// ─────────────────────────────────────────────────────────────

const NAME = 'freelow'
const VER  = 3

const STORES = [
  ['clientes',       'id',    ['nombre']],
  ['proyectos',      'id',    ['clienteId', 'estado', 'fechaEntregaCliente']],
  ['tareas',         'id',    ['proyectoId', 'colaboradorId']],
  ['colaboradores',  'id',    ['nombre']],
  ['alertas',        'id',    ['proyectoId', 'enviada']],
  ['pagos',          'id',    ['proyectoId', 'clienteId', 'estado']],
  ['comunicaciones', 'id',    ['clienteId', 'canal', 'direccion', 'followup']],
  ['config',         'clave', []],
]

let _db = null

function open() {
  if (_db) return Promise.resolve(_db)
  return new Promise((res, rej) => {
    const req = indexedDB.open(NAME, VER)
    req.onupgradeneeded = e => {
      const d = e.target.result
      STORES.forEach(([name, kp, idxs]) => {
        if (!d.objectStoreNames.contains(name)) {
          const s = d.createObjectStore(name, { keyPath: kp })
          idxs.forEach(i => s.createIndex(i, i, { unique: false }))
        }
      })
    }
    req.onsuccess  = e => { _db = e.target.result; res(_db) }
    req.onerror    = e => rej(e.target.error)
  })
}

const wrap = r => new Promise((res, rej) => {
  r.onsuccess = () => res(r.result)
  r.onerror   = () => rej(r.error)
})

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export async function getAll(store) {
  await open()
  return wrap((_db).transaction(store).objectStore(store).getAll())
}

export async function getOne(store, key) {
  await open()
  return wrap((_db).transaction(store).objectStore(store).get(key))
}

export async function put(store, item) {
  await open()
  const now = new Date().toISOString()
  const rec = { ...item, id: item.id || uid(), creadoEn: item.creadoEn || now, actualizadoEn: now }
  await wrap((_db).transaction(store, 'readwrite').objectStore(store).put(rec))
  return rec
}

export async function del(store, key) {
  await open()
  return wrap((_db).transaction(store, 'readwrite').objectStore(store).delete(key))
}

export async function byIdx(store, idx, val) {
  await open()
  return wrap((_db).transaction(store).objectStore(store).index(idx).getAll(val))
}

export async function getCfg(key, def = null) {
  await open()
  try {
    const r = await wrap((_db).transaction('config').objectStore('config').get(key))
    return r ? r.valor : def
  } catch { return def }
}

export async function setCfg(key, value) {
  await open()
  return wrap((_db).transaction('config', 'readwrite').objectStore('config').put({ clave: key, valor: value }))
}

// ─────────────────────────────────────────────────────────────
//  SEED — datos de ejemplo (solo primera vez)
// ─────────────────────────────────────────────────────────────
export async function seed() {
  await open()
  const existing = await getAll('clientes')
  if (existing.length > 0) return

  const now = new Date().toISOString()
  const hoy = new Date()
  const d = n => {
    const dt = new Date(hoy)
    dt.setDate(dt.getDate() + n)
    return dt.toISOString().split('T')[0] + 'T12:00:00'
  }
  const m = x => ({ ...x, creadoEn: now, actualizadoEn: now })

  const cs = [
    m({ id: 'c1', nombre: 'Ana Moreno',     empresa: 'Café Báltico',     pais: 'Argentina', moneda: 'ARS', email: 'ana@cafebaltico.com',    telefono: '+54 11 4455-6677' }),
    m({ id: 'c2', nombre: 'Diego Ruiz',     empresa: 'Estudio Forma',    pais: 'Argentina', moneda: 'ARS', email: 'diego@forma.com',         telefono: '+54 351 555-8899' }),
    m({ id: 'c3', nombre: 'Sofía Castro',   empresa: 'Fintrack',         pais: 'Uruguay',   moneda: 'UYU', email: 'sofia@fintrack.io',       telefono: '+598 99 123-456' }),
    m({ id: 'c4', nombre: 'Val. Ramos',     empresa: 'Ropa Libre',       pais: 'Argentina', moneda: 'ARS', email: 'vale@ropalibre.com.ar',   telefono: '+54 11 5566-7788' }),
    m({ id: 'c5', nombre: 'Familia Ortiz',  empresa: 'Vivienda privada', pais: 'Chile',     moneda: 'CLP', email: 'mortiz@gmail.com',        telefono: '+56 9 8765-4321' }),
  ]
  const ps = [
    m({ id: 'p1', clienteId: 'c1', clienteNombre: 'Ana Moreno',    nombre: 'Identidad visual',  tipo: 'Diseño gráfico',  estado: 'critico',  progreso: 75, fechaEntregaCliente: d(1),  fechaEntregaInterna: d(0),  archivado: false }),
    m({ id: 'p2', clienteId: 'c2', clienteNombre: 'Diego Ruiz',    nombre: 'Rediseño web',      tipo: 'Desarrollo web',  estado: 'urgente',  progreso: 50, fechaEntregaCliente: d(5),  fechaEntregaInterna: d(3),  archivado: false }),
    m({ id: 'p3', clienteId: 'c3', clienteNombre: 'Sofía Castro',  nombre: 'App móvil MVP',     tipo: 'Desarrollo web',  estado: 'atencion', progreso: 30, fechaEntregaCliente: d(16), fechaEntregaInterna: d(13), archivado: false }),
    m({ id: 'p4', clienteId: 'c4', clienteNombre: 'Val. Ramos',    nombre: 'Campaña fotos',     tipo: 'Fotografía',      estado: 'ok',       progreso: 15, fechaEntregaCliente: d(29), fechaEntregaInterna: d(26), archivado: false }),
    m({ id: 'p5', clienteId: 'c5', clienteNombre: 'Familia Ortiz', nombre: 'Planos vivienda',   tipo: 'Arquitectura',    estado: 'ok',       progreso: 8,  fechaEntregaCliente: d(42), fechaEntregaInterna: d(38), archivado: false }),
  ]
  const ts = [
    m({ id: 't1', proyectoId: 'p1', titulo: 'Brief y relevamiento',       completada: true,  orden: 1, fechaLimite: d(-12) }),
    m({ id: 't2', proyectoId: 'p1', titulo: 'Moodboard de referencias',   completada: true,  orden: 2, fechaLimite: d(-9) }),
    m({ id: 't3', proyectoId: 'p1', titulo: 'Paleta de colores',          completada: true,  orden: 3, fechaLimite: d(-6) }),
    m({ id: 't4', proyectoId: 'p1', titulo: 'Tipografía seleccionada',    completada: true,  orden: 4, fechaLimite: d(-4) }),
    m({ id: 't5', proyectoId: 'p1', titulo: 'Bocetos de isotipo',         completada: true,  orden: 5, fechaLimite: d(-2) }),
    m({ id: 't6', proyectoId: 'p1', titulo: 'Revisión con cliente',       completada: true,  orden: 6, fechaLimite: d(-1) }),
    m({ id: 't7', proyectoId: 'p1', titulo: 'Diseño final de logotipo',   completada: false, orden: 7, fechaLimite: d(0) }),
    m({ id: 't8', proyectoId: 'p1', titulo: 'Manual de marca básico',     completada: false, orden: 8, fechaLimite: d(0) }),
  ]
  const comms = [
    m({ id: 'cm1', canal: 'whatsapp',  direccion: 'in',  clienteId: 'c1', proyectoId: 'p1', fecha: d(-1), hora: '09:30', resumen: 'Pidió revisar la paleta de colores', tags: ['revisión'], followup: false }),
    m({ id: 'cm2', canal: 'email',     direccion: 'out', clienteId: 'c1', proyectoId: 'p1', fecha: d(-1), hora: '11:00', resumen: 'Enviada propuesta de identidad visual con PDF', tags: ['propuesta'], followup: true, followupDone: false }),
    m({ id: 'cm3', canal: 'instagram', direccion: 'in',  clienteId: 'c4', proyectoId: 'p4', fecha: d(-2), hora: '16:45', resumen: 'DM: preguntó por fecha de sesión de fotos', tags: ['sesión'], followup: true, followupDone: false }),
    m({ id: 'cm4', canal: 'videocall', direccion: 'in',  clienteId: 'c2', proyectoId: 'p2', fecha: d(-3), hora: '10:00', resumen: 'Reunión de kickoff del rediseño web — 45 min', tags: ['kickoff'], followup: false }),
    m({ id: 'cm5', canal: 'llamada',   direccion: 'out', clienteId: 'c3', proyectoId: 'p3', fecha: d(-5), hora: '14:30', resumen: 'Llamé para confirmar requerimientos del MVP', tags: ['mvp'], followup: false }),
  ]

  for (const c of cs)    await put('clientes', c)
  for (const p of ps)    await put('proyectos', p)
  for (const t of ts)    await put('tareas', t)
  for (const cm of comms) await put('comunicaciones', cm)

  await setCfg('nombreUsuario', 'Marcos')
  await setCfg('tema', 'minimal')
  await setCfg('moneda', 'ARS')
  await setCfg('onboardingHecho', false)
}

export default { open, getAll, getOne, put, del, byIdx, getCfg, setCfg, seed, uid }
