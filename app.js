/* ═══════════════════════════════════════════════════
   FREELOW — app.js
   SPA: DB · Router · Páginas · Onboarding
═══════════════════════════════════════════════════ */

// ════════════════════════════════════════════════════
//  DB — IndexedDB wrapper
// ════════════════════════════════════════════════════
const DB = (() => {
  const NAME='freelow', VER=3;
  let db=null;

  function open(){
    if(db) return Promise.resolve(db);
    return new Promise((res,rej)=>{
      const req=indexedDB.open(NAME,VER);
      req.onupgradeneeded=e=>{
        const d=e.target.result;
        const defs=[
          ['clientes','id',['nombre']],
          ['proyectos','id',['clienteId','estado','fechaEntregaCliente']],
          ['tareas','id',['proyectoId','colaboradorId']],
          ['colaboradores','id',['nombre']],
          ['alertas','id',['proyectoId','enviada']],
          ['config','clave',[]],
          ['pagos','id',['proyectoId','clienteId','estado']],
          ['comunicaciones','id',['proyectoId','clienteId']],
        ];
        defs.forEach(([name,kp,idxs])=>{
          if(d.objectStoreNames.contains(name)) return;
          const s=d.createObjectStore(name,{keyPath:kp});
          idxs.forEach(i=>s.createIndex(i,i,{unique:false}));
        });
      };
      req.onsuccess=e=>{db=e.target.result;res(db)};
      req.onerror=e=>rej(e.target.error);
    });
  }

  const wrap=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

  async function getAll(s){await open();return wrap(db.transaction(s).objectStore(s).getAll())}
  async function get(s,k){await open();return wrap(db.transaction(s).objectStore(s).get(k))}
  async function del(s,k){await open();return wrap(db.transaction(s,'readwrite').objectStore(s).delete(k))}
  async function put(s,item){
    await open();
    const now=new Date().toISOString();
    const rec={...item,id:item.id||uid(),creadoEn:item.creadoEn||now,actualizadoEn:now};
    await wrap(db.transaction(s,'readwrite').objectStore(s).put(rec));
    return rec;
  }
  async function cfg(k,def=null){
    await open();
    try{const r=await wrap(db.transaction('config').objectStore('config').get(k));return r?r.valor:def}
    catch{return def}
  }
  async function setCfg(k,v){
    await open();
    return wrap(db.transaction('config','readwrite').objectStore('config').put({clave:k,valor:v}));
  }
  async function byIndex(s,idx,val){
    await open();
    return wrap(db.transaction(s).objectStore(s).index(idx).getAll(val));
  }
  async function clear(s){
    await open();
    return wrap(db.transaction(s,'readwrite').objectStore(s).clear());
  }

  async function seed(){
    await open();
    const ex=await getAll('clientes');
    if(ex.length>0) return;
    const hoy=new Date();
    const d=n=>{const dt=new Date(hoy);dt.setDate(dt.getDate()+n);return dt.toISOString().split('T')[0]+'T12:00:00'};
    const now=new Date().toISOString();
    const m=x=>({...x,creadoEn:now,actualizadoEn:now});
    const cs=[
      m({id:'c1',nombre:'Ana Moreno',empresa:'Café Báltico',pais:'Argentina',moneda:'ARS',email:'ana@cafebaltico.com',telefono:'+54 11 4455-6677'}),
      m({id:'c2',nombre:'Diego Ruiz',empresa:'Estudio Forma',pais:'Argentina',moneda:'ARS',email:'diego@forma.com',telefono:'+54 351 555-8899'}),
      m({id:'c3',nombre:'Sofía Castro',empresa:'Fintrack',pais:'Uruguay',moneda:'UYU',email:'sofia@fintrack.io',telefono:'+598 99 123-456'}),
      m({id:'c4',nombre:'Val. Ramos',empresa:'Ropa Libre',pais:'Argentina',moneda:'ARS',email:'vale@ropalibre.com.ar',telefono:'+54 11 5566-7788'}),
      m({id:'c5',nombre:'Familia Ortiz',empresa:'Vivienda privada',pais:'Chile',moneda:'CLP',email:'mortiz@gmail.com',telefono:'+56 9 8765-4321'}),
    ];
    const ps=[
      m({id:'p1',clienteId:'c1',clienteNombre:'Ana Moreno',nombre:'Identidad visual',tipo:'Diseño gráfico',estado:'critico',progreso:75,fechaEntregaCliente:d(1),fechaEntregaInterna:d(0),archivado:false}),
      m({id:'p2',clienteId:'c2',clienteNombre:'Diego Ruiz',nombre:'Rediseño web',tipo:'Desarrollo web',estado:'urgente',progreso:50,fechaEntregaCliente:d(5),fechaEntregaInterna:d(3),archivado:false}),
      m({id:'p3',clienteId:'c3',clienteNombre:'Sofía Castro',nombre:'App móvil MVP',tipo:'Desarrollo web',estado:'atencion',progreso:30,fechaEntregaCliente:d(16),fechaEntregaInterna:d(13),archivado:false}),
      m({id:'p4',clienteId:'c4',clienteNombre:'Val. Ramos',nombre:'Campaña fotos',tipo:'Fotografía',estado:'ok',progreso:15,fechaEntregaCliente:d(29),fechaEntregaInterna:d(26),archivado:false}),
      m({id:'p5',clienteId:'c5',clienteNombre:'Familia Ortiz',nombre:'Planos vivienda',tipo:'Arquitectura',estado:'ok',progreso:8,fechaEntregaCliente:d(42),fechaEntregaInterna:d(38),archivado:false}),
    ];
    const ts=[
      m({id:'t1',proyectoId:'p1',titulo:'Brief y relevamiento',completada:true,orden:1,fechaLimite:d(-12)}),
      m({id:'t2',proyectoId:'p1',titulo:'Moodboard de referencias',completada:true,orden:2,fechaLimite:d(-9)}),
      m({id:'t3',proyectoId:'p1',titulo:'Paleta de colores',completada:true,orden:3,fechaLimite:d(-6)}),
      m({id:'t4',proyectoId:'p1',titulo:'Tipografía seleccionada',completada:true,orden:4,fechaLimite:d(-4)}),
      m({id:'t5',proyectoId:'p1',titulo:'Bocetos de isotipo',completada:true,orden:5,fechaLimite:d(-2)}),
      m({id:'t6',proyectoId:'p1',titulo:'Revisión con cliente',completada:true,orden:6,fechaLimite:d(-1)}),
      m({id:'t7',proyectoId:'p1',titulo:'Diseño final de logotipo',completada:false,orden:7,fechaLimite:d(0)}),
      m({id:'t8',proyectoId:'p1',titulo:'Manual de marca básico',completada:false,orden:8,fechaLimite:d(0)}),
    ];
    for(const c of cs) await wrap(db.transaction('clientes','readwrite').objectStore('clientes').put(c));
    for(const p of ps) await wrap(db.transaction('proyectos','readwrite').objectStore('proyectos').put(p));
    for(const t of ts) await wrap(db.transaction('tareas','readwrite').objectStore('tareas').put(t));
    await setCfg('nombreUsuario','Marcos');
    await setCfg('tema','minimal');
    await setCfg('ultimaExportacion',null);
  }

  return{open,getAll,get,put,del,cfg,setCfg,byIndex,clear,seed};
})();

// ════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════
const THEMES=['minimal','darkpro','colorful','warm','noir','blueprint','y2k','cottagecore','vaporwave','brutalist','terminal','risograph','glass','solarized','harajuku','mushroom'];

function diasHasta(iso){
  if(!iso) return 999;
  const hoy=new Date();hoy.setHours(0,0,0,0);
  const f=new Date(iso);f.setHours(0,0,0,0);
  return Math.round((f-hoy)/86400000);
}
function calcEstado(iso){
  const d=diasHasta(iso);
  if(d<0) return 'vencido';
  if(d<=1) return 'critico';
  if(d<=5) return 'urgente';
  if(d<=14) return 'atencion';
  return 'ok';
}
function dLabel(iso){
  const d=diasHasta(iso);
  if(d<0) return 'Venció';
  if(d===0) return 'Hoy';
  if(d===1) return 'Mañana';
  return new Date(iso).toLocaleDateString('es-AR',{day:'numeric',month:'short'});
}
function fmtFecha(iso){
  if(!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'short'});
}
function fmtMonto(n,cur){
  return new Intl.NumberFormat('es-AR',{style:'currency',currency:cur||'ARS',maximumFractionDigits:0}).format(n||0);
}
function initials(name){
  return (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
}
const sMeta={
  critico: {lbl:'Crítico',cls:'b-cr',dot:'var(--cr-dot)',prog:'var(--cr-dot)'},
  urgente: {lbl:'Urgente',cls:'b-ur',dot:'var(--ur-dot)',prog:'var(--ur-dot)'},
  atencion:{lbl:'Atención',cls:'b-wa',dot:'var(--wa-dot)',prog:'var(--wa-dot)'},
  ok:      {lbl:'A tiempo',cls:'b-ok',dot:'var(--ok-dot)',prog:'var(--ok-dot)'},
  vencido: {lbl:'Vencido',cls:'b-cr',dot:'var(--cr-dot)',prog:'var(--cr-dot)'},
};
const PALETAS=[['#E8D5F0','#4A1A6A'],['#D5E8FF','#1A3A6A'],['#D5F0E8','#1A4A3A'],['#F0E8D5','#4A3A1A'],['#FFE0D5','#6A2A1A'],['#E0FFD5','#2A4A1A']];

function toast(msg,tipo='ok'){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className=`toast toast-${tipo} show`;
  setTimeout(()=>t.classList.remove('show'),3000);
}

function pcardHTML(p){
  const e=calcEstado(p.fechaEntregaCliente);
  const m=sMeta[e]||sMeta.ok;
  return `<div class="pcard" onclick="nav('proyecto-detalle','${p.id}')">
    <div class="pdot" style="background:${m.dot}"></div>
    <div>
      <div class="pname">${p.nombre}${p.clienteNombre?' — '+p.clienteNombre:''}</div>
      <div class="pmeta">${p.tipo||''} · ${fmtFecha(p.fechaEntregaCliente)}</div>
    </div>
    <div class="pr">
      <span class="badge ${m.cls}">${m.lbl} · ${dLabel(p.fechaEntregaCliente)}</span>
      <div class="prog-w">
        <div class="prog-b"><div class="prog-f" style="width:${p.progreso||0}%;background:${m.prog}"></div></div>
        <span class="prog-p">${p.progreso||0}%</span>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════
//  TEMA
// ════════════════════════════════════════════════════
async function setTheme(name){
  document.body.setAttribute('data-theme',name);
  document.querySelectorAll('.th-dot,.ob-th-dot').forEach(d=>d.classList.toggle('on',d.dataset.t===name));
  await DB.setCfg('tema',name);
}

function buildThemePicker(gridId='th-grid'){
  const grid=document.getElementById(gridId);
  if(!grid) return;
  grid.innerHTML=THEMES.map(t=>`<div class="th-dot" data-t="${t}" title="${t}" onclick="setTheme('${t}')"></div>`).join('');
  const current=document.body.getAttribute('data-theme')||'minimal';
  grid.querySelectorAll('.th-dot').forEach(d=>d.classList.toggle('on',d.dataset.t===current));
}

// ════════════════════════════════════════════════════
//  ROUTER
// ════════════════════════════════════════════════════
let _currentPage='',_currentParam='';

function nav(page,param=''){
  _currentPage=page;_currentParam=param;
  // Actualizar nav activo
  document.querySelectorAll('.nav-it').forEach(el=>el.classList.toggle('on',el.dataset.page===page));
  // Renderizar página
  const root=document.getElementById('page-root');
  root.innerHTML='<div class="loading"><div class="spin"></div> Cargando…</div>';
  const pages={dashboard:pageDashboard,proyectos:pageProyectos,clientes:pageClientes,finanzas:pageFinanzas,comunicaciones:pageComunicaciones,calendario:pageCalendario,notificaciones:pageNotificaciones,analisis:pageAnalisis,reporte:pageReporte,configuracion:pageConfiguracion,'proyecto-detalle':pageProyectoDetalle};
  const fn=pages[page];
  if(fn) fn(param).catch(e=>{root.innerHTML=`<div class="loading" style="color:var(--cr-dot)">Error: ${e.message}</div>`});
  else root.innerHTML='<div class="loading">Página no encontrada</div>';
}

// ════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════
async function pageDashboard(){
  const [proyectos,clientes,nombre,ultimaExp]=await Promise.all([
    DB.getAll('proyectos'),DB.getAll('clientes'),
    DB.cfg('nombreUsuario','vos'),DB.cfg('ultimaExportacion',null),
  ]);
  const activos=proyectos.filter(p=>!p.archivado&&p.estado!=='entregado');
  const hoy=new Date();hoy.setHours(0,0,0,0);
  const en7=new Date(hoy);en7.setDate(en7.getDate()+7);
  const criticos=activos.filter(p=>{const e=calcEstado(p.fechaEntregaCliente);return e==='critico'||e==='vencido';}).length;
  const estaSemana=activos.filter(p=>{const f=new Date(p.fechaEntregaCliente);return f>=hoy&&f<=en7;}).length;
  const cliActivos=new Set(activos.map(p=>p.clienteId)).size;
  const completados=proyectos.filter(p=>{
    if(p.estado!=='entregado') return false;
    const f=new Date(p.actualizadoEn);
    return f.getMonth()===hoy.getMonth()&&f.getFullYear()===hoy.getFullYear();
  }).length;
  const h=new Date().getHours();
  const saludo=h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';
  const fechaStr=new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
  const urgentes=activos.filter(p=>{const e=calcEstado(p.fechaEntregaCliente);return e==='critico'||e==='urgente'||e==='vencido';});
  const atiempo=activos.filter(p=>{const e=calcEstado(p.fechaEntregaCliente);return e==='atencion'||e==='ok';});
  const sorted=[...activos].sort((a,b)=>new Date(a.fechaEntregaCliente)-new Date(b.fechaEntregaCliente)).slice(0,6);
  const bannerHTML=!ultimaExp?
    `<div class="banner show" id="ban">
      <span><strong>Nunca exportaste tus datos.</strong> Si borrás el caché del browser, perdés todo.</span>
      <button class="ban-btn" onclick="doExportJSON()">Exportar ahora</button>
      <button class="ban-x" onclick="this.closest('.banner').classList.remove('show')">×</button>
    </div>`:
    (Math.round((Date.now()-new Date(ultimaExp))/86400000)>=30?
    `<div class="banner show" id="ban">
      <span><strong>Hace ${Math.round((Date.now()-new Date(ultimaExp))/86400000)} días sin backup.</strong></span>
      <button class="ban-btn" onclick="doExportJSON()">Exportar</button>
      <button class="ban-x" onclick="this.closest('.banner').classList.remove('show')">×</button>
    </div>`:'');
  if(criticos>0){const nb=document.getElementById('nb');if(nb){nb.style.display='inline';nb.textContent=criticos;}}
  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div><h1 id="greeting">${saludo}, ${nombre}</h1><p id="subline">${fechaStr.charAt(0).toUpperCase()+fechaStr.slice(1)} · ${activos.length} proyecto${activos.length!==1?'s':''} activo${activos.length!==1?'s':''}</p></div>
      <div class="topbar-r">
        <button class="btn btn-g" onclick="doExportJSON()">↑ Exportar</button>
        <button class="btn btn-p" onclick="dashOpenModal()">+ Nuevo proyecto</button>
      </div>
    </div>
    <div class="content">
      ${bannerHTML}
      <div class="stats">
        <div class="sc"><div class="sc-lbl">Críticos / Vencidos</div><div class="sc-val" style="color:var(--cr-dot)">${criticos}</div><div class="sc-sub">requieren acción hoy</div></div>
        <div class="sc"><div class="sc-lbl">Esta semana</div><div class="sc-val">${estaSemana}</div><div class="sc-sub">entregas próximas</div></div>
        <div class="sc"><div class="sc-lbl">Clientes activos</div><div class="sc-val">${cliActivos||clientes.length}</div><div class="sc-sub">con proyectos en curso</div></div>
        <div class="sc"><div class="sc-lbl">Entregados este mes</div><div class="sc-val" style="color:var(--ok-dot)">${completados}</div><div class="sc-sub">completados</div></div>
      </div>
      <div class="section">
        <div class="sec-hd"><span class="sec-tt">⚠ Urgentes y críticos</span><span class="sec-lk" onclick="nav('proyectos')">Ver todos →</span></div>
        <div class="plist">${urgentes.length?urgentes.map(pcardHTML).join(''):'<div class="empty">Sin proyectos urgentes 🎉</div>'}</div>
      </div>
      <div class="section">
        <div class="sec-hd"><span class="sec-tt">✓ A tiempo</span></div>
        <div class="plist">${atiempo.length?atiempo.map(pcardHTML).join(''):'<div class="empty">Todos los proyectos requieren atención.</div>'}</div>
      </div>
      <div class="section">
        <div class="sec-hd"><span class="sec-tt">Próximas entregas</span></div>
        <div class="ulist">${sorted.map(p=>{
          const e=calcEstado(p.fechaEntregaCliente);const m=sMeta[e]||sMeta.ok;
          return `<div class="uit" onclick="nav('proyecto-detalle','${p.id}')">
            <span class="ud">${new Date(p.fechaEntregaCliente).toLocaleDateString('es-AR',{day:'numeric',month:'short'})}</span>
            <span class="un">${p.nombre}</span><span class="uc">${p.clienteNombre||''}</span>
            <span class="badge ${m.cls}">${dLabel(p.fechaEntregaCliente)}</span>
          </div>`;
        }).join('')}</div>
      </div>
    </div>
    <div class="modal-bg" id="dash-modal">
      <div class="modal">
        <h2>Nuevo proyecto</h2><div class="modal-sub">Completá los datos básicos para empezar.</div>
        <div class="fg"><label class="fl">Nombre del proyecto</label><input class="fi" id="d-fn" placeholder="ej: Identidad visual…"></div>
        <div class="fg"><label class="fl">Cliente</label><input class="fi" id="d-fc" placeholder="Nombre del cliente"></div>
        <div class="fr">
          <div class="fg"><label class="fl">Tipo</label><select class="fi" id="d-ft"><option>Diseño gráfico</option><option>Desarrollo web</option><option>Fotografía</option><option>Arquitectura</option><option>Ilustración</option><option>Video</option><option>Otro</option></select></div>
          <div class="fg"><label class="fl">Progreso %</label><input class="fi" type="number" id="d-fp" value="0" min="0" max="100"></div>
        </div>
        <div class="fr">
          <div class="fg"><label class="fl">Entrega al cliente</label><input class="fi" type="date" id="d-fdc"></div>
          <div class="fg"><label class="fl">Entrega interna</label><input class="fi" type="date" id="d-fdi"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-g" onclick="document.getElementById('dash-modal').classList.remove('open')">Cancelar</button>
          <button class="btn btn-p" onclick="dashCrearProyecto()">Crear proyecto</button>
        </div>
      </div>
    </div>`;
}

function dashOpenModal(){document.getElementById('dash-modal').classList.add('open');}
async function dashCrearProyecto(){
  const nombre=document.getElementById('d-fn').value.trim();
  const cliente=document.getElementById('d-fc').value.trim();
  if(!nombre||!cliente){toast('Nombre y cliente son obligatorios','er');return}
  const dc=document.getElementById('d-fdc').value;
  const di=document.getElementById('d-fdi').value;
  await DB.put('proyectos',{
    nombre,clienteNombre:cliente,tipo:document.getElementById('d-ft').value,
    progreso:parseInt(document.getElementById('d-fp').value)||0,
    estado:calcEstado(dc?dc+'T12:00:00':null),
    fechaEntregaCliente:dc?dc+'T12:00:00':null,
    fechaEntregaInterna:di?di+'T12:00:00':null,
    archivado:false,
  });
  document.getElementById('dash-modal').classList.remove('open');
  toast('✓ Proyecto creado');
  pageDashboard();
}

// ════════════════════════════════════════════════════
//  PROYECTOS
// ════════════════════════════════════════════════════
let _proyFiltro='all',_proySearch='';

async function pageProyectos(){
  const proyectos=await DB.getAll('proyectos');
  _proyFiltro='all';_proySearch='';
  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div><h1>Proyectos</h1><p>${proyectos.length} proyectos en total</p></div>
      <div class="topbar-r">
        <button class="btn btn-p" onclick="proyOpenModal()">+ Nuevo</button>
      </div>
    </div>
    <div class="toolbar">
      <div class="search-wrap" style="flex:1;max-width:300px">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5"/></svg>
        <input class="search-in" type="text" placeholder="Buscar proyectos…" oninput="_proySearch=this.value;renderProyList()">
      </div>
      <div class="chips">
        <div class="chip active" onclick="proySetFiltro('all',this)">Todos</div>
        <div class="chip" onclick="proySetFiltro('active',this)">Activos</div>
        <div class="chip" onclick="proySetFiltro('crit',this)">Críticos</div>
        <div class="chip" onclick="proySetFiltro('done',this)">Entregados</div>
        <div class="chip" onclick="proySetFiltro('arch',this)">Archivados</div>
      </div>
    </div>
    <div class="content" id="proy-list" style="padding-top:16px"></div>
    <div class="modal-bg" id="proy-modal">
      <div class="modal">
        <h2>Nuevo proyecto</h2><div class="modal-sub">Completá los datos básicos.</div>
        <div class="fg"><label class="fl">Nombre</label><input class="fi" id="pn-nom" placeholder="Nombre del proyecto"></div>
        <div class="fg"><label class="fl">Cliente</label><input class="fi" id="pn-cli" placeholder="Nombre del cliente"></div>
        <div class="fr">
          <div class="fg"><label class="fl">Tipo</label><select class="fi" id="pn-tipo"><option>Diseño gráfico</option><option>Desarrollo web</option><option>Fotografía</option><option>Arquitectura</option><option>Ilustración</option><option>Video</option><option>Otro</option></select></div>
          <div class="fg"><label class="fl">Progreso %</label><input class="fi" type="number" id="pn-prog" value="0" min="0" max="100"></div>
        </div>
        <div class="fr">
          <div class="fg"><label class="fl">Entrega cliente</label><input class="fi" type="date" id="pn-dc"></div>
          <div class="fg"><label class="fl">Entrega interna</label><input class="fi" type="date" id="pn-di"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-g" onclick="document.getElementById('proy-modal').classList.remove('open')">Cancelar</button>
          <button class="btn btn-p" onclick="proyCrear()">Crear</button>
        </div>
      </div>
    </div>`;
  renderProyList();
}

async function renderProyList(){
  const proyectos=await DB.getAll('proyectos');
  const q=(_proySearch||'').toLowerCase();
  let list=proyectos.filter(p=>{
    const matchQ=!q||(p.nombre||'').toLowerCase().includes(q)||(p.clienteNombre||'').toLowerCase().includes(q);
    if(!matchQ) return false;
    if(_proyFiltro==='all') return true;
    if(_proyFiltro==='active') return !p.archivado&&p.estado!=='entregado';
    if(_proyFiltro==='crit'){const e=calcEstado(p.fechaEntregaCliente);return e==='critico'||e==='vencido';}
    if(_proyFiltro==='done') return p.estado==='entregado';
    if(_proyFiltro==='arch') return p.archivado;
    return true;
  });
  list.sort((a,b)=>new Date(a.fechaEntregaCliente||'9999')-new Date(b.fechaEntregaCliente||'9999'));
  const el=document.getElementById('proy-list');
  if(!el) return;
  el.innerHTML=list.length
    ?`<div class="plist">${list.map(pcardHTML).join('')}</div>`
    :'<div class="empty">Sin proyectos para mostrar.</div>';
}

function proySetFiltro(f,el){
  _proyFiltro=f;
  document.querySelectorAll('#page-root .chip').forEach(c=>c.classList.toggle('active',c===el));
  renderProyList();
}
function proyOpenModal(){document.getElementById('proy-modal').classList.add('open');}
async function proyCrear(){
  const nombre=document.getElementById('pn-nom').value.trim();
  const cliente=document.getElementById('pn-cli').value.trim();
  if(!nombre||!cliente){toast('Nombre y cliente son obligatorios','er');return}
  const dc=document.getElementById('pn-dc').value;
  const di=document.getElementById('pn-di').value;
  await DB.put('proyectos',{
    nombre,clienteNombre:cliente,tipo:document.getElementById('pn-tipo').value,
    progreso:parseInt(document.getElementById('pn-prog').value)||0,
    estado:calcEstado(dc?dc+'T12:00:00':null),
    fechaEntregaCliente:dc?dc+'T12:00:00':null,
    fechaEntregaInterna:di?di+'T12:00:00':null,
    archivado:false,
  });
  document.getElementById('proy-modal').classList.remove('open');
  toast('✓ Proyecto creado');
  renderProyList();
}

// ════════════════════════════════════════════════════
//  PROYECTO DETALLE
// ════════════════════════════════════════════════════
async function pageProyectoDetalle(id){
  const [p,tareas]=await Promise.all([DB.get('proyectos',id),DB.byIndex('tareas','proyectoId',id)]);
  if(!p){document.getElementById('page-root').innerHTML='<div class="loading">Proyecto no encontrado.</div>';return}
  const e=calcEstado(p.fechaEntregaCliente);
  const m=sMeta[e]||sMeta.ok;
  const completadas=tareas.filter(t=>t.completada).length;
  const progTareas=tareas.length?Math.round(completadas/tareas.length*100):p.progreso||0;
  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div>
        <div style="font-size:12px;color:var(--tx3);cursor:pointer;margin-bottom:4px" onclick="nav('proyectos')">← Proyectos</div>
        <h1>${p.nombre}</h1>
        <p>${p.clienteNombre||''} ${p.tipo?' · '+p.tipo:''}</p>
      </div>
      <div class="topbar-r">
        <span class="badge ${m.cls}">${m.lbl}</span>
        <button class="btn btn-g" onclick="detEditarProgreso('${p.id}')">Actualizar progreso</button>
        <button class="btn btn-g" onclick="detArchivar('${p.id}',${!p.archivado})">${p.archivado?'Desarchivar':'Archivar'}</button>
      </div>
    </div>
    <div class="content">
      <div class="det-grid">
        <div class="det-main">
          <div class="card-box">
            <h3>Tareas <span style="font-size:11px;font-weight:400">${completadas}/${tareas.length}</span></h3>
            <div style="margin-bottom:12px">
              <div class="prog-b" style="width:100%;height:6px"><div class="prog-f" style="width:${progTareas}%;background:${m.prog}"></div></div>
            </div>
            <div id="task-list">
              ${tareas.sort((a,b)=>a.orden-b.orden).map(t=>`
                <div class="task-item">
                  <div class="task-cb ${t.completada?'done':''}" onclick="detToggleTask('${p.id}','${t.id}',${!t.completada})">
                    ${t.completada?'<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2"><path d="M2 6l3 3 5-5"/></svg>':''}
                  </div>
                  <span class="task-txt ${t.completada?'done':''}">${t.titulo}</span>
                  ${t.fechaLimite?`<span style="font-size:10px;color:var(--tx3)">${new Date(t.fechaLimite).toLocaleDateString('es-AR',{day:'numeric',month:'short'})}</span>`:''}
                </div>`).join('')}
            </div>
            <div style="margin-top:12px;display:flex;gap:8px">
              <input class="fi" id="new-task-in" placeholder="Nueva tarea…" style="flex:1" onkeydown="if(event.key==='Enter')detAddTask('${p.id}')">
              <button class="btn btn-g" onclick="detAddTask('${p.id}')">+ Agregar</button>
            </div>
          </div>
        </div>
        <div class="det-side">
          <div class="card-box">
            <h3>Información</h3>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
              <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Estado</span><span class="badge ${m.cls}">${m.lbl}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Progreso</span><span>${p.progreso||0}%</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Entrega cliente</span><span>${fmtFecha(p.fechaEntregaCliente)}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Entrega interna</span><span>${fmtFecha(p.fechaEntregaInterna)}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Tipo</span><span>${p.tipo||'—'}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Cliente</span><span>${p.clienteNombre||'—'}</span></div>
            </div>
          </div>
          <div class="card-box">
            <h3>Acciones rápidas</h3>
            <div style="display:flex;flex-direction:column;gap:6px">
              <button class="btn btn-g" style="width:100%;justify-content:center" onclick="detMarcarEntregado('${p.id}')">✓ Marcar como entregado</button>
              <button class="btn btn-g" style="width:100%;justify-content:center" onclick="detRegistrarPago('${p.id}','${p.clienteNombre||''}')">$ Registrar pago</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

async function detToggleTask(proyId,taskId,done){
  const t=await DB.get('tareas',taskId);
  if(!t) return;
  await DB.put('tareas',{...t,completada:done});
  await pageProyectoDetalle(proyId);
}
async function detAddTask(proyId){
  const in_=document.getElementById('new-task-in');
  const titulo=in_.value.trim();
  if(!titulo) return;
  const existentes=await DB.byIndex('tareas','proyectoId',proyId);
  await DB.put('tareas',{proyectoId:proyId,titulo,completada:false,orden:existentes.length+1});
  in_.value='';
  await pageProyectoDetalle(proyId);
}
async function detArchivar(id,arch){
  const p=await DB.get('proyectos',id);
  if(!p) return;
  await DB.put('proyectos',{...p,archivado:arch});
  toast(arch?'Proyecto archivado':'Proyecto desarchivado');
  await pageProyectoDetalle(id);
}
async function detMarcarEntregado(id){
  const p=await DB.get('proyectos',id);
  if(!p) return;
  await DB.put('proyectos',{...p,estado:'entregado',progreso:100});
  toast('✓ Proyecto marcado como entregado');
  await pageProyectoDetalle(id);
}
async function detEditarProgreso(id){
  const nuevo=prompt('Ingresá el nuevo progreso (0-100):');
  if(nuevo===null) return;
  const n=parseInt(nuevo);
  if(isNaN(n)||n<0||n>100){toast('Valor inválido','er');return}
  const p=await DB.get('proyectos',id);
  if(!p) return;
  await DB.put('proyectos',{...p,progreso:n,estado:calcEstado(p.fechaEntregaCliente)});
  toast(`✓ Progreso actualizado: ${n}%`);
  await pageProyectoDetalle(id);
}
async function detRegistrarPago(proyId,clienteNombre){
  const monto=prompt(`Registrar pago para ${clienteNombre}.\nMonto:`);
  if(!monto) return;
  const moneda=prompt('Moneda (ARS/USD/UYU/etc):','ARS');
  if(!moneda) return;
  await DB.put('pagos',{proyectoId:proyId,clienteNombre,monto:parseFloat(monto)||0,moneda,estado:'pendiente'});
  toast('✓ Pago registrado');
}

// ════════════════════════════════════════════════════
//  CLIENTES
// ════════════════════════════════════════════════════
let _cliSearch='';

async function pageClientes(){
  _cliSearch='';
  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div><h1>Clientes</h1><p id="cli-sub">Cargando…</p></div>
      <div class="topbar-r"><button class="btn btn-p" onclick="cliOpenModal()">+ Nuevo cliente</button></div>
    </div>
    <div class="toolbar">
      <div class="search-wrap" style="flex:1;max-width:300px">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5"/></svg>
        <input class="search-in" type="text" placeholder="Buscar clientes…" oninput="_cliSearch=this.value;renderClientes()">
      </div>
    </div>
    <div class="content" id="cli-grid-wrap"></div>
    <div class="modal-bg" id="cli-modal">
      <div class="modal">
        <h2>Nuevo cliente</h2>
        <div class="fg"><label class="fl">Nombre</label><input class="fi" id="cn-nom" placeholder="Nombre completo"></div>
        <div class="fg"><label class="fl">Empresa</label><input class="fi" id="cn-emp" placeholder="Nombre de empresa"></div>
        <div class="fr">
          <div class="fg"><label class="fl">Email</label><input class="fi" type="email" id="cn-email" placeholder="correo@ejemplo.com"></div>
          <div class="fg"><label class="fl">Teléfono</label><input class="fi" id="cn-tel" placeholder="+54 11 ..."></div>
        </div>
        <div class="fr">
          <div class="fg"><label class="fl">País</label><select class="fi" id="cn-pais">
            <option>Paraguay</option><option>Argentina</option><option>Uruguay</option><option>Chile</option><option>Bolivia</option><option>Brasil</option><option>Colombia</option><option>México</option><option>España</option><option>Otro</option>
          </select></div>
          <div class="fg"><label class="fl">Moneda</label><select class="fi" id="cn-moneda">
            <option>PYG</option><option>ARS</option><option>UYU</option><option>CLP</option><option>USD</option><option>EUR</option><option>BRL</option>
          </select></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-g" onclick="document.getElementById('cli-modal').classList.remove('open')">Cancelar</button>
          <button class="btn btn-p" onclick="cliCrear()">Guardar cliente</button>
        </div>
      </div>
    </div>`;
  renderClientes();
}

async function renderClientes(){
  const [clientes,proyectos]=await Promise.all([DB.getAll('clientes'),DB.getAll('proyectos')]);
  const q=(_cliSearch||'').toLowerCase();
  const list=clientes.filter(c=>!q||(c.nombre||'').toLowerCase().includes(q)||(c.empresa||'').toLowerCase().includes(q));
  const sub=document.getElementById('cli-sub');
  if(sub) sub.textContent=`${clientes.length} clientes · ${clientes.filter(c=>proyectos.some(p=>p.clienteId===c.id&&!p.archivado&&p.estado!=='entregado')).length} activos`;
  const wrap=document.getElementById('cli-grid-wrap');
  if(!wrap) return;
  if(!list.length){wrap.innerHTML='<div class="empty">Sin clientes todavía. ¡Agregá uno!</div>';return}
  wrap.innerHTML=`<div class="cli-grid">${list.map((c,i)=>{
    const pal=PALETAS[i%PALETAS.length];
    const activos=proyectos.filter(p=>p.clienteId===c.id&&!p.archivado&&p.estado!=='entregado').length;
    const total=proyectos.filter(p=>p.clienteId===c.id).length;
    return `<div class="cli-card" onclick="cliDetalle('${c.id}')">
      <div class="cli-top">
        <div class="cli-av" style="background:${pal[0]};color:${pal[1]}">${initials(c.nombre||'?')}</div>
        <div><div class="cli-nm">${c.nombre||'Sin nombre'}</div><div class="cli-co">${c.empresa||'Sin empresa'}</div><div class="cli-co">${c.pais||'—'} · ${c.moneda||'—'}</div></div>
      </div>
      <div class="cli-stats">
        <div class="cstat"><div class="cstat-v" style="color:var(--ac)">${activos}</div><div class="cstat-l">Activos</div></div>
        <div class="cstat"><div class="cstat-v">${total}</div><div class="cstat-l">Total</div></div>
        <div class="cstat"><div class="cstat-v" style="color:var(--tx3);font-size:12px">${(c.email||'—').slice(0,12)}…</div><div class="cstat-l">Email</div></div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function cliOpenModal(){document.getElementById('cli-modal').classList.add('open');}
async function cliCrear(){
  const nombre=document.getElementById('cn-nom').value.trim();
  if(!nombre){toast('El nombre es obligatorio','er');return}
  await DB.put('clientes',{
    nombre,
    empresa:document.getElementById('cn-emp').value.trim()||'',
    email:document.getElementById('cn-email').value.trim(),
    telefono:document.getElementById('cn-tel').value.trim(),
    pais:document.getElementById('cn-pais').value,
    moneda:document.getElementById('cn-moneda').value,
  });
  document.getElementById('cli-modal').classList.remove('open');
  toast('✓ Cliente guardado');
  renderClientes();
}
function cliDetalle(id){nav('proyecto-detalle',null);/* simple: navegar a proyectos del cliente */
  nav('proyectos');
  setTimeout(()=>{_proySearch=id;},100);
}

// ════════════════════════════════════════════════════
//  FINANZAS
// ════════════════════════════════════════════════════
async function pageFinanzas(){
  const [pagos,clientes,proyectos]=await Promise.all([DB.getAll('pagos'),DB.getAll('clientes'),DB.getAll('proyectos')]);
  const pend=pagos.filter(p=>p.estado==='pendiente');
  const cobr=pagos.filter(p=>p.estado==='cobrado');
  const hoy=new Date();
  const mes=cobr.filter(p=>{if(!p.fechaCobro)return false;const f=new Date(p.fechaCobro);return f.getMonth()===hoy.getMonth()&&f.getFullYear()===hoy.getFullYear();});
  const topMonto=lista=>{
    const totals={};
    lista.forEach(p=>{totals[p.moneda]=(totals[p.moneda]||0)+(p.monto||0)});
    const top=Object.entries(totals).sort((a,b)=>b[1]-a[1])[0];
    return top?fmtMonto(top[1],top[0]):'—';
  };
  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div><h1>Finanzas</h1><p>${clientes.length} clientes · ${pagos.length} pagos</p></div>
      <div class="topbar-r"><button class="btn btn-p" onclick="finOpenModal()">+ Registrar pago</button></div>
    </div>
    <div class="content">
      <div class="stats">
        <div class="sc"><div class="sc-lbl">Por cobrar</div><div class="sc-val">${topMonto(pend)}</div><div class="sc-sub">${pend.length} pago${pend.length!==1?'s':''}</div></div>
        <div class="sc"><div class="sc-lbl">Cobrado total</div><div class="sc-val" style="color:var(--ok-dot)">${topMonto(cobr)}</div><div class="sc-sub">${cobr.length} pago${cobr.length!==1?'s':''}</div></div>
        <div class="sc"><div class="sc-lbl">Este mes</div><div class="sc-val">${topMonto(mes)}</div><div class="sc-sub">${hoy.toLocaleDateString('es-AR',{month:'long'})}</div></div>
        <div class="sc"><div class="sc-lbl">Total registrado</div><div class="sc-val">${pagos.length}</div><div class="sc-sub">pagos</div></div>
      </div>
      <div class="section">
        <div class="sec-hd"><span class="sec-tt">Todos los pagos</span></div>
        ${pagos.length?`<div style="display:flex;flex-direction:column;gap:6px">${pagos.map(p=>{
          const cli=clientes.find(c=>c.id===p.clienteId);
          const proy=proyectos.find(pr=>pr.id===p.proyectoId);
          return `<div class="pago-row">
            <div style="width:8px;height:8px;border-radius:50%;background:${p.estado==='cobrado'?'var(--ok-dot)':'var(--wa-dot)'}"></div>
            <div class="pago-monto">${fmtMonto(p.monto,p.moneda)}</div>
            <div class="pago-cli">${p.clienteNombre||cli?.nombre||'—'}<br>${proy?.nombre||'—'}</div>
            <div class="pago-fecha">${p.fechaVencimiento?new Date(p.fechaVencimiento).toLocaleDateString('es-AR',{day:'numeric',month:'short'}):'—'}</div>
            <span class="badge ${p.estado==='cobrado'?'b-ok':'b-wa'}">${p.estado==='cobrado'?'Cobrado':'Pendiente'}</span>
            ${p.estado!=='cobrado'?`<button class="btn btn-g" style="padding:5px 10px;font-size:11px" onclick="finMarcarCobrado('${p.id}')">✓ Cobrar</button>`:''}
          </div>`;
        }).join('')}</div>`:'<div class="empty">Sin pagos registrados todavía.</div>'}
      </div>
    </div>
    <div class="modal-bg" id="fin-modal">
      <div class="modal">
        <h2>Registrar pago</h2>
        <div class="fr">
          <div class="fg"><label class="fl">Monto</label><input class="fi" type="number" id="fp-monto" placeholder="0"></div>
          <div class="fg"><label class="fl">Moneda</label><select class="fi" id="fp-moneda"><option>PYG</option><option>ARS</option><option>USD</option><option>UYU</option><option>CLP</option><option>EUR</option></select></div>
        </div>
        <div class="fg"><label class="fl">Cliente</label><select class="fi" id="fp-cli">${clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Proyecto</label><select class="fi" id="fp-proy"><option value="">Sin proyecto</option>${proyectos.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join('')}</select></div>
        <div class="fr">
          <div class="fg"><label class="fl">Vencimiento</label><input class="fi" type="date" id="fp-venc"></div>
          <div class="fg"><label class="fl">Descripción</label><input class="fi" id="fp-desc" placeholder="Ej: 50% anticipo"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-g" onclick="document.getElementById('fin-modal').classList.remove('open')">Cancelar</button>
          <button class="btn btn-p" onclick="finCrearPago()">Guardar</button>
        </div>
      </div>
    </div>`;
}

function finOpenModal(){document.getElementById('fin-modal').classList.add('open');}
async function finCrearPago(){
  const monto=parseFloat(document.getElementById('fp-monto').value)||0;
  if(!monto){toast('Ingresá un monto','er');return}
  const cliId=document.getElementById('fp-cli').value;
  const cli=await DB.get('clientes',cliId);
  const proyId=document.getElementById('fp-proy').value;
  const venc=document.getElementById('fp-venc').value;
  await DB.put('pagos',{
    monto,moneda:document.getElementById('fp-moneda').value,
    clienteId:cliId,clienteNombre:cli?.nombre||'',
    proyectoId:proyId||null,
    descripcion:document.getElementById('fp-desc').value,
    fechaVencimiento:venc?venc+'T12:00:00':null,
    estado:'pendiente',
  });
  document.getElementById('fin-modal').classList.remove('open');
  toast('✓ Pago registrado');
  pageFinanzas();
}
async function finMarcarCobrado(id){
  const p=await DB.get('pagos',id);
  if(!p) return;
  await DB.put('pagos',{...p,estado:'cobrado',fechaCobro:new Date().toISOString()});
  toast('✓ Pago marcado como cobrado');
  pageFinanzas();
}

// ════════════════════════════════════════════════════
//  COMUNICACIONES
// ════════════════════════════════════════════════════
async function pageComunicaciones(){
  const [comms,proyectos,clientes]=await Promise.all([DB.getAll('comunicaciones'),DB.getAll('proyectos'),DB.getAll('clientes')]);
  const sorted=[...comms].sort((a,b)=>new Date(b.fecha||b.creadoEn)-new Date(a.fecha||a.creadoEn));
  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div><h1>Comunicaciones</h1><p>${comms.length} registros</p></div>
      <div class="topbar-r"><button class="btn btn-p" onclick="commOpenModal()">+ Registrar</button></div>
    </div>
    <div class="content">
      <div class="card-box" style="background:var(--sf);border:1px solid var(--br);border-radius:var(--rc);padding:16px">
        ${sorted.length?sorted.map(c=>{
          const p=proyectos.find(pr=>pr.id===c.proyectoId);
          return `<div class="comm-item">
            <div class="comm-dot" style="background:${c.tipo==='email'?'var(--ac)':c.tipo==='llamada'?'var(--ok-dot)':'var(--wa-dot)'}"></div>
            <div class="comm-body">
              <div class="comm-meta">${new Date(c.fecha||c.creadoEn).toLocaleDateString('es-AR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · ${c.tipo||'Nota'}</div>
              <div class="comm-txt">${c.descripcion||c.texto||'—'}</div>
              ${p?`<div class="comm-proj">📁 ${p.nombre}</div>`:''}
            </div>
          </div>`;
        }).join(''):'<div class="empty">Sin comunicaciones registradas.</div>'}
      </div>
    </div>
    <div class="modal-bg" id="comm-modal">
      <div class="modal">
        <h2>Registrar comunicación</h2>
        <div class="fg"><label class="fl">Tipo</label><select class="fi" id="cm-tipo"><option>Email</option><option>Llamada</option><option>Reunión</option><option>WhatsApp</option><option>Nota interna</option></select></div>
        <div class="fg"><label class="fl">Proyecto</label><select class="fi" id="cm-proy"><option value="">Sin proyecto</option>${proyectos.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Descripción</label><textarea class="fi" id="cm-desc" rows="3" placeholder="Resumen de la comunicación…" style="resize:vertical"></textarea></div>
        <div class="fg"><label class="fl">Fecha</label><input class="fi" type="datetime-local" id="cm-fecha" value="${new Date().toISOString().slice(0,16)}"></div>
        <div class="modal-footer">
          <button class="btn btn-g" onclick="document.getElementById('comm-modal').classList.remove('open')">Cancelar</button>
          <button class="btn btn-p" onclick="commCrear()">Guardar</button>
        </div>
      </div>
    </div>`;
}
function commOpenModal(){document.getElementById('comm-modal').classList.add('open');}
async function commCrear(){
  const desc=document.getElementById('cm-desc').value.trim();
  if(!desc){toast('Agregá una descripción','er');return}
  const proyId=document.getElementById('cm-proy').value;
  const proy=proyId?await DB.get('proyectos',proyId):null;
  await DB.put('comunicaciones',{
    tipo:document.getElementById('cm-tipo').value,
    proyectoId:proyId||null,
    proyectoNombre:proy?.nombre||'',
    descripcion:desc,
    fecha:document.getElementById('cm-fecha').value,
  });
  document.getElementById('comm-modal').classList.remove('open');
  toast('✓ Comunicación registrada');
  pageComunicaciones();
}

// ════════════════════════════════════════════════════
//  CALENDARIO
// ════════════════════════════════════════════════════
let _calYear=new Date().getFullYear(),_calMonth=new Date().getMonth();

async function pageCalendario(){
  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div><h1>Calendario</h1><p>Entregas y eventos</p></div>
      <div class="topbar-r">
        <button class="btn btn-g" onclick="_calMonth--;if(_calMonth<0){_calMonth=11;_calYear--}renderCal()">← Anterior</button>
        <button class="btn btn-g" onclick="_calYear=new Date().getFullYear();_calMonth=new Date().getMonth();renderCal()">Hoy</button>
        <button class="btn btn-g" onclick="_calMonth++;if(_calMonth>11){_calMonth=0;_calYear++}renderCal()">Siguiente →</button>
      </div>
    </div>
    <div class="content" id="cal-wrap"></div>`;
  renderCal();
}

async function renderCal(){
  const proyectos=await DB.getAll('proyectos');
  const wrap=document.getElementById('cal-wrap');
  if(!wrap) return;
  const year=_calYear,month=_calMonth;
  const mesNombre=new Date(year,month,1).toLocaleDateString('es-AR',{month:'long',year:'numeric'});
  const primerDia=new Date(year,month,1).getDay();
  const diasMes=new Date(year,month+1,0).getDate();
  const today=new Date();today.setHours(0,0,0,0);
  // Mapa de entregas por fecha
  const byDate={};
  proyectos.filter(p=>!p.archivado&&p.estado!=='entregado').forEach(p=>{
    if(!p.fechaEntregaCliente) return;
    const k=p.fechaEntregaCliente.split('T')[0];
    if(!byDate[k]) byDate[k]=[];
    byDate[k].push(p);
  });
  let html=`<div style="font-size:16px;font-weight:700;margin-bottom:16px;font-family:var(--fdi)">${mesNombre.charAt(0).toUpperCase()+mesNombre.slice(1)}</div>
  <div class="cal-grid" style="margin-bottom:8px">
    ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d=>`<div style="font-size:11px;font-weight:600;color:var(--tx3);text-align:center;padding:6px 0">${d}</div>`).join('')}
  </div>
  <div class="cal-grid">`;
  // Días previos
  for(let i=0;i<primerDia;i++){
    const d=new Date(year,month,1-primerDia+i);
    html+=`<div class="cal-day other"><div class="cal-day-num">${d.getDate()}</div></div>`;
  }
  for(let d=1;d<=diasMes;d++){
    const dt=new Date(year,month,d);dt.setHours(0,0,0,0);
    const iso=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday=dt.getTime()===today.getTime();
    const eventos=byDate[iso]||[];
    html+=`<div class="cal-day${isToday?' today':''}">
      <div class="cal-day-num">${d}</div>
      ${eventos.slice(0,2).map(p=>{const e=calcEstado(p.fechaEntregaCliente);const m=sMeta[e]||sMeta.ok;
        return `<div class="cal-dot" style="background:${m.dot};color:white" onclick="nav('proyecto-detalle','${p.id}')" title="${p.nombre}">${p.nombre.slice(0,8)}…</div>`;
      }).join('')}
      ${eventos.length>2?`<div style="font-size:9px;color:var(--tx3)">+${eventos.length-2} más</div>`:''}
    </div>`;
  }
  html+='</div>';
  wrap.innerHTML=html;
}

// ════════════════════════════════════════════════════
//  NOTIFICACIONES
// ════════════════════════════════════════════════════
async function pageNotificaciones(){
  const proyectos=await DB.getAll('proyectos');
  const activos=proyectos.filter(p=>!p.archivado&&p.estado!=='entregado');
  const alertas=activos.map(p=>{
    const e=calcEstado(p.fechaEntregaCliente);
    const d=diasHasta(p.fechaEntregaCliente);
    if(e==='vencido') return {p,tipo:'critico',msg:`Entrega vencida hace ${Math.abs(d)} día${Math.abs(d)!==1?'s':''}`};
    if(e==='critico') return {p,tipo:'critico',msg:`Entrega hoy${d===1?' o mañana':''}`};
    if(e==='urgente') return {p,tipo:'urgente',msg:`Entrega en ${d} día${d!==1?'s':''}`};
    if(e==='atencion') return {p,tipo:'atencion',msg:`Entrega en ${d} días`};
    return null;
  }).filter(Boolean).sort((a,b)=>(['critico','urgente','atencion'].indexOf(a.tipo))-(['critico','urgente','atencion'].indexOf(b.tipo)));

  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div><h1>Alertas</h1><p>${alertas.length} alertas activas</p></div>
    </div>
    <div class="content">
      ${alertas.length?alertas.map(a=>{
        const m=sMeta[a.tipo]||sMeta.ok;
        return `<div class="notif-item ${a.tipo==='critico'?'unread':''}" onclick="nav('proyecto-detalle','${a.p.id}')">
          <div class="notif-ic"><div style="width:8px;height:8px;border-radius:50%;background:${m.dot}"></div></div>
          <div class="notif-tx">
            <div class="notif-title">${a.p.nombre}</div>
            <div class="notif-sub">${a.msg} · ${a.p.clienteNombre||'Sin cliente'}</div>
          </div>
          <span class="badge ${m.cls}">${m.lbl}</span>
        </div>`;
      }).join(''):'<div class="empty">🎉 Sin alertas por ahora. Todo bajo control.</div>'}
    </div>`;
}

// ════════════════════════════════════════════════════
//  ANÁLISIS
// ════════════════════════════════════════════════════
async function pageAnalisis(){
  const proyectos=await DB.getAll('proyectos');
  const activos=proyectos.filter(p=>!p.archivado);
  // Por estado
  const porEstado={ok:0,atencion:0,urgente:0,critico:0,vencido:0,entregado:0};
  activos.forEach(p=>{
    const e=p.estado==='entregado'?'entregado':calcEstado(p.fechaEntregaCliente);
    porEstado[e]=(porEstado[e]||0)+1;
  });
  // Por tipo
  const porTipo={};
  activos.forEach(p=>{const t=p.tipo||'Otro';porTipo[t]=(porTipo[t]||0)+1});
  const maxTipo=Math.max(...Object.values(porTipo),1);
  // Por cliente
  const porCliente={};
  activos.filter(p=>p.clienteNombre).forEach(p=>{porCliente[p.clienteNombre]=(porCliente[p.clienteNombre]||0)+1});
  const topClientes=Object.entries(porCliente).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // Progreso promedio
  const promedioProgreso=activos.length?Math.round(activos.reduce((a,p)=>a+(p.progreso||0),0)/activos.length):0;

  document.getElementById('page-root').innerHTML=`
    <div class="topbar"><div><h1>Análisis</h1><p>${activos.length} proyectos analizados</p></div></div>
    <div class="content">
      <div class="stats">
        <div class="sc"><div class="sc-lbl">Total proyectos</div><div class="sc-val">${proyectos.length}</div><div class="sc-sub">registrados</div></div>
        <div class="sc"><div class="sc-lbl">Activos</div><div class="sc-val">${activos.filter(p=>p.estado!=='entregado').length}</div><div class="sc-sub">en progreso</div></div>
        <div class="sc"><div class="sc-lbl">Progreso promedio</div><div class="sc-val">${promedioProgreso}%</div><div class="sc-sub">todos los activos</div></div>
        <div class="sc"><div class="sc-lbl">Entregados</div><div class="sc-val" style="color:var(--ok-dot)">${porEstado.entregado}</div><div class="sc-sub">completados</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="card-box" style="background:var(--sf);border:1px solid var(--br);border-radius:var(--rc);padding:16px">
          <h3 style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">Por estado</h3>
          ${Object.entries(porEstado).map(([e,n])=>{
            const m=sMeta[e]||{dot:'var(--tx3)',lbl:e,cls:'b-ok'};
            return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <div style="width:8px;height:8px;border-radius:50%;background:${m.dot}"></div>
              <span style="flex:1;font-size:13px;color:var(--tx)">${m.lbl||e}</span>
              <div class="prog-b" style="width:80px"><div class="prog-f" style="width:${activos.length?n/activos.length*100:0}%;background:${m.dot}"></div></div>
              <span style="font-size:12px;font-weight:700;color:var(--tx);min-width:20px;text-align:right">${n}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="card-box" style="background:var(--sf);border:1px solid var(--br);border-radius:var(--rc);padding:16px">
          <h3 style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">Por tipo de trabajo</h3>
          ${Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([t,n])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="flex:1;font-size:13px;color:var(--tx)">${t}</span>
              <div class="prog-b" style="width:80px"><div class="prog-f" style="width:${n/maxTipo*100}%;background:var(--ac)"></div></div>
              <span style="font-size:12px;font-weight:700;color:var(--tx);min-width:20px;text-align:right">${n}</span>
            </div>`).join('')}
        </div>
        <div class="card-box" style="background:var(--sf);border:1px solid var(--br);border-radius:var(--rc);padding:16px">
          <h3 style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">Top clientes</h3>
          ${topClientes.map(([nombre,n],i)=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:${PALETAS[i%PALETAS.length][0]};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${PALETAS[i%PALETAS.length][1]}">${initials(nombre)}</div>
              <span style="flex:1;font-size:13px;color:var(--tx)">${nombre}</span>
              <span style="font-size:13px;font-weight:700;color:var(--ac)">${n} proy.</span>
            </div>`).join('')}
        </div>
        <div class="card-box" style="background:var(--sf);border:1px solid var(--br);border-radius:var(--rc);padding:16px">
          <h3 style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">Próximas entregas (30d)</h3>
          ${activos.filter(p=>{if(!p.fechaEntregaCliente||p.estado==='entregado') return false;const d=diasHasta(p.fechaEntregaCliente);return d>=0&&d<=30;}).sort((a,b)=>new Date(a.fechaEntregaCliente)-new Date(b.fechaEntregaCliente)).slice(0,5).map(p=>{
            const e=calcEstado(p.fechaEntregaCliente);const m=sMeta[e]||sMeta.ok;
            return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;cursor:pointer" onclick="nav('proyecto-detalle','${p.id}')">
              <div style="width:6px;height:6px;border-radius:50%;background:${m.dot}"></div>
              <span style="flex:1;font-size:12px;color:var(--tx)">${p.nombre}</span>
              <span style="font-size:11px;color:var(--tx3)">${dLabel(p.fechaEntregaCliente)}</span>
            </div>`;
          }).join('')||'<div class="empty">Sin entregas en 30 días.</div>'}
        </div>
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════
//  REPORTE
// ════════════════════════════════════════════════════
async function pageReporte(){
  const [proyectos,clientes]=await Promise.all([DB.getAll('proyectos'),DB.getAll('clientes')]);
  const sorted=[...proyectos].filter(p=>!p.archivado).sort((a,b)=>new Date(a.fechaEntregaCliente||'9999')-new Date(b.fechaEntregaCliente||'9999'));
  document.getElementById('page-root').innerHTML=`
    <div class="topbar">
      <div><h1>Reporte de proyectos</h1><p>${sorted.length} proyectos</p></div>
      <div class="topbar-r">
        <button class="btn btn-g" onclick="repExportCSV()">↓ Exportar CSV</button>
      </div>
    </div>
    <div class="content">
      <div class="card-box" style="background:var(--sf);border:1px solid var(--br);border-radius:var(--rc);padding:0;overflow:hidden">
        <table class="rep-table">
          <thead><tr>
            <th>Proyecto</th><th>Cliente</th><th>Estado</th><th>Progreso</th><th>Entrega cliente</th><th>Tipo</th>
          </tr></thead>
          <tbody>${sorted.map(p=>{
            const e=p.estado==='entregado'?'ok':calcEstado(p.fechaEntregaCliente);
            const m=sMeta[e]||sMeta.ok;
            return `<tr onclick="nav('proyecto-detalle','${p.id}')" style="cursor:pointer">
              <td><strong>${p.nombre}</strong></td>
              <td style="color:var(--tx2)">${p.clienteNombre||'—'}</td>
              <td><span class="badge ${m.cls}">${p.estado==='entregado'?'Entregado':m.lbl}</span></td>
              <td><div class="prog-w"><div class="prog-b"><div class="prog-f" style="width:${p.progreso||0}%;background:${m.prog}"></div></div><span class="prog-p">${p.progreso||0}%</span></div></td>
              <td style="color:var(--tx2)">${fmtFecha(p.fechaEntregaCliente)}</td>
              <td style="color:var(--tx3)">${p.tipo||'—'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
}

async function repExportCSV(){
  const [proyectos,clientes]=await Promise.all([DB.getAll('proyectos'),DB.getAll('clientes')]);
  const headers=['Nombre','Cliente','Estado','Progreso%','Entrega cliente','Entrega interna','Tipo','Creado'];
  const rows=proyectos.map(p=>[
    `"${p.nombre||''}"`,`"${p.clienteNombre||''}"`,
    p.estado||'',p.progreso||0,
    p.fechaEntregaCliente?p.fechaEntregaCliente.split('T')[0]:'',
    p.fechaEntregaInterna?p.fechaEntregaInterna.split('T')[0]:'',
    `"${p.tipo||''}"`,p.creadoEn?p.creadoEn.split('T')[0]:'',
  ]);
  const csv=[headers.join(','),...rows.map(r=>r.join(','))].join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`freelow-proyectos-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();URL.revokeObjectURL(a.href);
  toast('✓ CSV exportado');
}

// ════════════════════════════════════════════════════
//  CONFIGURACIÓN
// ════════════════════════════════════════════════════
async function pageConfiguracion(){
  const [nombre,moneda,buffer,alertasInApp,diasCrit,exportReminder,ultimaExp,cl,pr,ta]=await Promise.all([
    DB.cfg('nombreUsuario',''),DB.cfg('moneda','ARS'),DB.cfg('bufferDias',3),
    DB.cfg('alertasInApp',true),DB.cfg('diasCritico',2),DB.cfg('exportReminder',30),
    DB.cfg('ultimaExportacion',null),
    DB.getAll('clientes'),DB.getAll('proyectos'),DB.getAll('tareas'),
  ]);
  const diasSin=ultimaExp?Math.round((Date.now()-new Date(ultimaExp))/86400000):null;
  const backupOk=diasSin!==null&&diasSin<=(exportReminder||30);
  document.getElementById('page-root').innerHTML=`
    <div class="topbar"><div><h1>Configuración</h1><p>Preferencias y datos</p></div></div>
    <div class="content" style="max-width:640px">
      <div class="cfg-section">
        <h3>Perfil</h3>
        <div class="cfg-row">
          <div><div class="cfg-label">Nombre</div><div class="cfg-desc">Cómo te saluda Freelow</div></div>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="fi" id="cfg-nombre" value="${nombre}" style="width:160px">
            <button class="btn btn-g" onclick="cfgGuardarNombre()">Guardar</button>
          </div>
        </div>
        <div class="cfg-row">
          <div><div class="cfg-label">Moneda principal</div></div>
          <select class="fi" id="cfg-moneda" style="width:120px" onchange="cfgGuardarMoneda()">
            ${['PYG','ARS','USD','UYU','CLP','EUR','BRL'].map(m=>`<option${m===moneda?' selected':''}>${m}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="cfg-section">
        <h3>Alertas de proyectos</h3>
        <div class="cfg-row">
          <div><div class="cfg-label">Buffer de días</div><div class="cfg-desc">Días de margen antes de la entrega al cliente</div></div>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="fi" type="number" id="cfg-buffer" value="${buffer}" min="0" max="30" style="width:70px">
            <button class="btn btn-g" onclick="cfgGuardarBuffer()">Guardar</button>
          </div>
        </div>
        <div class="cfg-row">
          <div><div class="cfg-label">Umbral crítico (días)</div><div class="cfg-desc">A partir de cuántos días antes se marca crítico</div></div>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="fi" type="number" id="cfg-dias-crit" value="${diasCrit}" min="1" max="7" style="width:70px">
            <button class="btn btn-g" onclick="cfgGuardarDiasCrit()">Guardar</button>
          </div>
        </div>
      </div>
      <div class="cfg-section">
        <h3>Temas</h3>
        <div class="ob-theme-grid" id="cfg-th-grid">
          ${THEMES.map(t=>`<div class="ob-th-dot th-dot" data-t="${t}" title="${t}" onclick="setTheme('${t}')" style="width:28px;height:28px"></div>`).join('')}
        </div>
      </div>
      <div class="cfg-section">
        <h3>Backup y datos</h3>
        <div class="backup-status ${backupOk?'ok':'warn'}">
          <div class="backup-dot" style="background:${backupOk?'var(--ok-dot)':'#E8950A'}"></div>
          ${diasSin===null?'Nunca exportaste tus datos. Recomendamos hacerlo ahora.':`Último backup hace ${diasSin} día${diasSin!==1?'s':''}`}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
          <div class="card-box" style="background:var(--sf2);border:1px solid var(--br);border-radius:var(--rc);padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:700">${cl.length}</div>
            <div style="font-size:11px;color:var(--tx3)">Clientes</div>
          </div>
          <div class="card-box" style="background:var(--sf2);border:1px solid var(--br);border-radius:var(--rc);padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:700">${pr.length}</div>
            <div style="font-size:11px;color:var(--tx3)">Proyectos</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="btn btn-p" onclick="doExportJSON()">↑ Exportar backup JSON</button>
          <button class="btn btn-g" onclick="doExportCSV()">↑ Exportar CSV</button>
          <label class="btn btn-g" style="cursor:pointer">↓ Importar JSON<input type="file" accept=".json" style="display:none" onchange="doImport(this)"></label>
        </div>
      </div>
      <div class="cfg-section">
        <h3 style="color:var(--cr-tx)">Zona de peligro</h3>
        <div class="danger-box">
          <p>Elimina todos los datos de Freelow de este navegador. Esta acción no se puede deshacer. Exportá un backup primero.</p>
          <button class="btn" style="background:var(--cr-dot);color:white" onclick="cfgResetTodo()">Borrar todos los datos</button>
        </div>
      </div>
    </div>`;
  buildThemePicker('cfg-th-grid');
}

async function cfgGuardarNombre(){const v=document.getElementById('cfg-nombre').value.trim();if(!v){toast('Escribí tu nombre','er');return}await DB.setCfg('nombreUsuario',v);toast('✓ Nombre guardado')}
async function cfgGuardarMoneda(){await DB.setCfg('moneda',document.getElementById('cfg-moneda').value);toast('✓ Moneda actualizada')}
async function cfgGuardarBuffer(){await DB.setCfg('bufferDias',parseInt(document.getElementById('cfg-buffer').value)||3);toast('✓ Buffer actualizado')}
async function cfgGuardarDiasCrit(){await DB.setCfg('diasCritico',parseInt(document.getElementById('cfg-dias-crit').value)||2);toast('✓ Umbral actualizado')}
async function cfgResetTodo(){
  if(!confirm('¿Estás seguro? Se borrarán TODOS tus datos. Esta acción es irreversible.')) return;
  const stores=['clientes','proyectos','tareas','colaboradores','alertas','config','pagos','comunicaciones'];
  for(const s of stores){try{await DB.clear(s)}catch(e){}}
  toast('✓ Datos eliminados. Recargando…');
  setTimeout(()=>location.reload(),1500);
}

// ════════════════════════════════════════════════════
//  EXPORT / IMPORT GLOBALES
// ════════════════════════════════════════════════════
async function doExportJSON(){
  const stores=['clientes','proyectos','tareas','colaboradores','alertas','comunicaciones','pagos'];
  const data={version:'1.0.0',exportadoEn:new Date().toISOString(),app:'Freelow'};
  for(const s of stores){try{data[s]=await DB.getAll(s)}catch{data[s]=[]}}
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`freelow-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();URL.revokeObjectURL(a.href);
  await DB.setCfg('ultimaExportacion',new Date().toISOString());
  toast('✓ Backup exportado');
}
async function doExportCSV(){
  const [proyectos]=await Promise.all([DB.getAll('proyectos')]);
  const headers=['Nombre','Cliente','Estado','Progreso%','Entrega cliente','Tipo'];
  const rows=proyectos.map(p=>[`"${p.nombre||''}"`,`"${p.clienteNombre||''}"`,p.estado||'',p.progreso||0,p.fechaEntregaCliente?p.fechaEntregaCliente.split('T')[0]:'',`"${p.tipo||''}"`]);
  const csv=[headers.join(','),...rows.map(r=>r.join(','))].join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`freelow-${new Date().toISOString().split('T')[0]}.csv`;a.click();URL.revokeObjectURL(a.href);
  toast('✓ CSV exportado');
}
async function doImport(input){
  if(!input.files[0]) return;
  try{
    const text=await input.files[0].text();
    const data=JSON.parse(text);
    if(!data.version||!data.clientes) throw new Error('Formato no reconocido');
    const stores=['clientes','proyectos','tareas','colaboradores','alertas','comunicaciones','pagos'];
    for(const s of stores){
      if(!data[s]) continue;
      for(const item of data[s]) await DB.put(s,item);
    }
    toast(`✓ Importados: ${data.clientes.length} clientes, ${data.proyectos.length} proyectos`);
    nav(_currentPage||'dashboard');
  }catch(e){toast('Error: '+e.message,'er')}
  input.value='';
}

// ════════════════════════════════════════════════════
//  ONBOARDING
// ════════════════════════════════════════════════════
const ob={step:0,data:{nombre:'',moneda:'PYG',clienteNombre:'',proyectoNombre:''},tema:'minimal'};
const OB_TEMAS=[...THEMES];

function obSetTheme(t){
  ob.tema=t;
  document.body.setAttribute('data-theme',t);
  document.querySelectorAll('#ob-th-grid .ob-th-dot').forEach(d=>d.classList.toggle('on',d.dataset.t===t));
}

function obRender(){
  const panel=document.getElementById('ob-panel');
  const renders=[obStep0,obStep1,obStep2,obStep3];
  panel.innerHTML=renders[ob.step]();
  // focus primer input
  const first=panel.querySelector('input[type=text],input[type=email]');
  if(first&&ob.step<3) setTimeout(()=>first.focus(),100);
}

function obStep0(){
  return `
    <div class="ob-dots">${[0,1,2,3].map(i=>`<div class="ob-dot${i===0?' on':''}"></div>`).join('')}</div>
    <div class="ob-eyebrow">Paso 1 de 4</div>
    <div class="ob-title">Hola, ¿cómo te llamás?</div>
    <div class="ob-sub">Freelow es tu control de vuelo freelance. Guardamos todo localmente en tu browser, sin servidores ni cuentas.</div>
    <div class="fg"><label class="fl">Tu nombre</label><input class="fi" id="ob-nombre" placeholder="ej: Marcos" value="${ob.data.nombre}" oninput="ob.data.nombre=this.value"></div>
    <div class="fg"><label class="fl">Moneda principal</label><select class="fi" id="ob-moneda">
      ${['PYG','ARS','USD','UYU','CLP','EUR','BRL'].map(m=>`<option${m===ob.data.moneda?' selected':''}>${m}</option>`).join('')}
    </select></div>
    <div class="fg"><label class="fl">Tema visual</label>
      <div class="ob-theme-grid" id="ob-th-grid">
        ${OB_TEMAS.map(t=>`<div class="ob-th-dot${t===ob.tema?' on':''}" data-t="${t}" title="${t}" onclick="obSetTheme('${t}')"></div>`).join('')}
      </div>
    </div>
    <div class="ob-btn-row" style="margin-top:20px">
      <button class="btn btn-p" style="width:100%;justify-content:center" onclick="obGo1()">Siguiente →</button>
    </div>`;
}

function obStep1(){
  return `
    <div class="ob-dots">${[0,1,2,3].map(i=>`<div class="ob-dot${i===1?' on':''}"></div>`).join('')}</div>
    <div class="ob-eyebrow">Paso 2 de 4</div>
    <div class="ob-title">¿Tenés un cliente en mente?</div>
    <div class="ob-sub">Si tenés uno activo, cargalo ahora. Podés saltear y cargarlo después desde la sección de Clientes.</div>
    <div class="fg"><label class="fl">Nombre del cliente</label><input class="fi" id="ob-cli" placeholder="ej: Café Báltico" value="${ob.data.clienteNombre}" oninput="ob.data.clienteNombre=this.value"></div>
    <div class="ob-btn-row">
      <button class="btn-skip" onclick="ob.data.clienteNombre='';ob.step=2;obRender()">Saltear →</button>
      <button class="btn-back" onclick="ob.step=0;obRender()">← Volver</button>
      <button class="btn btn-p" onclick="ob.step=2;obRender()">Siguiente →</button>
    </div>`;
}

function obStep2(){
  const hoy=new Date();const enMes=new Date(hoy);enMes.setDate(enMes.getDate()+30);
  const fmt=d=>d.toISOString().split('T')[0];
  return `
    <div class="ob-dots">${[0,1,2,3].map(i=>`<div class="ob-dot${i===2?' on':''}"></div>`).join('')}</div>
    <div class="ob-eyebrow">Paso 3 de 4</div>
    <div class="ob-title">¿Cuál es tu proyecto más urgente?</div>
    <div class="ob-sub">El que más te preocupa ahora. Podés agregar el resto después.</div>
    <div class="fg"><label class="fl">Nombre del proyecto</label><input class="fi" id="ob-pnom" placeholder="ej: Identidad visual" value="${ob.data.proyectoNombre}" oninput="ob.data.proyectoNombre=this.value"></div>
    <div class="fr">
      <div class="fg"><label class="fl">Tipo</label><select class="fi" id="ob-ptipo"><option>Diseño gráfico</option><option>Desarrollo web</option><option>Fotografía</option><option>Arquitectura</option><option>Ilustración</option><option>Video</option><option>Otro</option></select></div>
      <div class="fg"><label class="fl">Progreso %</label><input class="fi" type="number" id="ob-pprog" value="0" min="0" max="100"></div>
    </div>
    <div class="fr">
      <div class="fg"><label class="fl">Entrega al cliente</label><input class="fi" type="date" id="ob-pdc" value="${fmt(enMes)}"></div>
      <div class="fg"><label class="fl">Entrega interna</label><input class="fi" type="date" id="ob-pdi" value="${fmt(hoy)}"></div>
    </div>
    ${ob.data.clienteNombre?`<div style="font-size:11px;color:var(--tx3);margin-top:-4px">Cliente: <strong style="color:var(--tx)">${ob.data.clienteNombre}</strong></div>`:''}
    <div class="ob-btn-row">
      <button class="btn-skip" onclick="ob.data.proyectoNombre='';obFinish()">Saltear →</button>
      <button class="btn-back" onclick="ob.step=1;obRender()">← Volver</button>
      <button class="btn btn-p" onclick="obSaveProyecto()">Crear y finalizar →</button>
    </div>`;
}

function obStep3(){
  const items=[];
  items.push({icon:'👤',title:'Perfil creado',sub:`${ob.data.nombre} · ${ob.data.moneda}`});
  if(ob.data.clienteNombre) items.push({icon:'🏢',title:'Cliente guardado',sub:ob.data.clienteNombre});
  if(ob.data.proyectoNombre) items.push({icon:'📁',title:'Proyecto creado',sub:ob.data.proyectoNombre});
  return `
    <div class="ob-dots">${[0,1,2,3].map(i=>`<div class="ob-dot${i===3?' on':''}"></div>`).join('')}</div>
    <div class="ob-success"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12l5 5L20 6"/></svg></div>
    <div class="ob-eyebrow" style="text-align:center">Todo listo</div>
    <div class="ob-title" style="text-align:center">Bienvenido a Freelow, ${ob.data.nombre||'freelancer'}.</div>
    <div class="ob-sub" style="text-align:center">Tu control de vuelo está listo.</div>
    ${items.map(i=>`<div class="ob-summary"><span style="font-size:20px">${i.icon}</span><div><strong>${i.title}</strong><span>${i.sub}</span></div></div>`).join('')}
    <div class="ob-tip"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3M8 11v.5"/></svg><span>Tus datos viven solo en este browser. Exportá un backup desde Configuración cada 30 días.</span></div>
    <button class="btn btn-p" style="width:100%;justify-content:center;margin-top:20px" onclick="obEntrar()">Entrar al dashboard →</button>`;
}

async function obGo1(){
  try{
    const el=document.getElementById("ob-nombre");
    const nombre=(el?el.value:ob.data.nombre||"").trim();
    if(!nombre){obShake();toast("Escribí tu nombre primero","er");return}
    const monSel=document.getElementById("ob-moneda");
    const moneda=monSel?monSel.value:(ob.data.moneda||"PYG");
    ob.data.nombre=nombre;
    ob.data.moneda=moneda;
    await DB.setCfg("nombreUsuario",nombre);
    await DB.setCfg("moneda",moneda);
    ob.step=1;obRender();
  }catch(e){toast("Error: "+e.message,"er");console.error(e);}
}

async function obSaveProyecto(){
  const nombre=document.getElementById('ob-pnom').value.trim();
  if(!nombre){obShake();return}
  ob.data.proyectoNombre=nombre;
  let clienteId=null;
  if(ob.data.clienteNombre){
    const c=await DB.put('clientes',{nombre:ob.data.clienteNombre,moneda:ob.data.moneda});
    clienteId=c.id;
  }
  const dc=document.getElementById('ob-pdc').value;
  const di=document.getElementById('ob-pdi').value;
  await DB.put('proyectos',{
    nombre,clienteId,clienteNombre:ob.data.clienteNombre||'',
    tipo:document.getElementById('ob-ptipo').value,
    progreso:parseInt(document.getElementById('ob-pprog').value)||0,
    fechaEntregaCliente:dc?dc+'T12:00:00':null,
    fechaEntregaInterna:di?di+'T12:00:00':null,
    estado:calcEstado(dc?dc+'T12:00:00':null),
    archivado:false,
  });
  obFinish();
}

async function obFinish(){ob.step=3;obRender();}

async function obEntrar(){
  await DB.setCfg('onboardingHecho',true);
  await DB.setCfg('tema',ob.tema);
  showApp();
}

function obShake(){
  const card=document.getElementById('ob-card');
  card.style.transition='transform .1s ease';
  card.style.transform='translateX(-8px)';
  setTimeout(()=>card.style.transform='translateX(8px)',100);
  setTimeout(()=>card.style.transform='translateX(-4px)',200);
  setTimeout(()=>{card.style.transform='translateX(0)';card.style.transition=''},300);
}

// ════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════
function showApp(){
  document.getElementById('onboarding').style.display='none';
  document.getElementById('app').style.display='grid';
  buildThemePicker();
  nav('dashboard');
}

async function init(){
  await DB.open();
  const tema=await DB.cfg('tema','minimal');
  document.body.setAttribute('data-theme',tema);
  ob.tema=tema;
  const hecho=await DB.cfg('onboardingHecho',false);
  if(!hecho){
    document.getElementById('onboarding').style.display='block';
    obRender();
    return;
  }
  await DB.seed();
  showApp();
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-bg.open').forEach(m=>m.classList.remove('open'));
  }
});

init().catch(err=>{
  document.body.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:red;font-family:sans-serif">Error al iniciar: ${err.message}</div>`;
});
