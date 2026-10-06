import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, Building2, Check, FileText, Globe, MapPin, Save, Sparkles, UtensilsCrossed } from 'lucide-react';
import {validateCatalog,type Catalog} from './catalog';
import type { EditorialState } from '../../server/localStore';
import './Admin.css';
import ImageField from './ImageField';
import {clientCatalog} from './clientCatalog';

const sections = [
  {id:'service',label:'Precios y contacto',icon:FileText,subtitle:'Impuestos, traslado, condiciones y correo. Aprueba reglas solamente después de confirmarlas con el chef.'},
  {id:'rules',label:'Reglas de cotización',icon:FileText,subtitle:'Anticipación, vigencia y requisitos del lugar. Activa cada aprobación después de confirmarla con el negocio.'},
  {id: 'editorial', label: 'Portada', icon: Sparkles, subtitle: 'La primera impresión de tu cocina.'},
  {id: 'sections', label: 'Galería y experiencias', icon: BookOpen, subtitle: 'Fotografías, experiencias y filosofía de nuestra cocina.'},
  {id: 'business', label: 'Datos del negocio', icon: Building2, subtitle: 'Contacto, identidad y avisos para tus visitantes.'},
  {id: 'packages', label: 'Menús', icon: UtensilsCrossed, subtitle: 'Propuestas, fotografías, platillos e inversión por persona.'},
  {id: 'extras', label: 'Servicios y extras', icon: BookOpen, subtitle: 'Complementos que hacen especial cada evento.'},
  {id: 'zones', label: 'Zonas de servicio', icon: MapPin, subtitle: 'Cobertura y costos de traslado.'},
  {id: 'faqs', label: 'Preguntas y políticas', icon: FileText, subtitle: 'Respuestas claras antes de iniciar una conversación.'}
] as const;
const labels: Record<string, string> = {
  pricesApproved:'Precios del catálogo revisados',priceApproved:'Precio por persona confirmado (desactiva si falta confirmarlo)',taxApproved:'Tasa y conceptos de IVA confirmados',taxRateBps:'IVA · porcentaje',taxOnTravel:'Aplicar IVA también al traslado',travelMode:'Cómo calcular el traslado',travelApproved:'Fórmula por bloques confirmada',travelBlockGuests:'Invitados por bloque de traslado',travelBlockCents:'Costo por bloque · MXN',contactEmail:'Correo que recibirá solicitudes',conditions:'Condiciones que verá el visitante',conditionsVersion:'Versión de condiciones',depositPercent:'Anticipo informativo · porcentaje',balanceDays:'Días antes del evento para liquidar',choiceGroups:'Opciones de platillos',options:'Platillos o variantes',required:'Selección obligatoria',note:'Nota sobre esta selección',
  leadTimes:'Anticipación por menú',approved:'Anticipación aprobada por el negocio',days:'Días mínimos de anticipación',validityApproved:'Vigencia aprobada por el negocio',validityDays:'Días de vigencia (inactivo hasta aprobar)',requirementsApproved:'Requisitos aprobados por el negocio',requirementsText:'Requisitos de cocina, acceso y montaje',
  gallery:'Galería', experiences:'Experiencias', philosophy:'Nuestra filosofía', items:'Elementos', photos:'Fotografías', pillars:'Principios de nuestra cocina', caption:'Categoría de la fotografía', notice:'Aviso de la galería', idealFor:'Capacidad sugerida y ocasión', imageAlt:'Descripción accesible de la fotografía', demoNote:'Nota de la experiencia', photoNote:'Nota de las fotografías', teamBio:'Biografía del equipo', teamNote:'Nota del equipo',
  useVideo:'Mostrar el video de portada (desactiva para mostrar la fotografía)',
  brandName:'Nombre del negocio', tagline:'Descripción de marca', location:'Ubicación', region:'Región',
  whatsAppPhoneDisplay:'Teléfono como se muestra en la página', whatsAppPhoneIntl:'Teléfono internacional', whatsAppNumberDigits:'WhatsApp con código de país (solo dígitos)',
  quoteDisclaimer:'Condiciones del presupuesto', taxNotice:'Aviso de impuestos', demoNotice:'Aviso del catálogo', socialLinks:'Redes sociales', instagram:'Instagram', facebook:'Facebook',
  title:'Título', titleAccent:'Segunda línea del título', description:'Descripción', buttonText:'Texto del botón principal', image:'Fotografía (enlace HTTPS o archivo público)',
  name:'Nombre', subtitle:'Subtítulo', concept:'Concepto del menú', pricePerPersonCents:'Precio por persona · MXN', minGuests:'Mínimo de invitados', maxGuests:'Máximo de invitados', highlight:'Distintivo', courses:'Tiempos del menú', includedServices:'Servicios incluidos', demoLabel:'Nota de presentación',
  priceCents:'Precio · MXN', unitLabel:'Unidad de cobro', defaultQuantity:'Cantidad inicial', maxQuantity:'Cantidad máxima', travelFeeCents:'Costo de traslado · MXN', requiresConfirmation:'Traslado pendiente de confirmar', notes:'Notas', question:'Pregunta', answer:'Respuesta'
};
const hidden = new Set(['id','schemaVersion','aspect','currency','currencySymbol','category','compatibleExtraIds','dependsOnGroup','dependsOnOption']);
type Path = (string | number)[];

function Fields({value, path, onChange}: {value: unknown; path: Path; onChange: (path: Path, value: unknown) => void}) {
  const key = String(path[path.length - 1]);
  if (key === 'pricingType' || key==='travelMode') return <label className="admin-field">{key==='pricingType'?'Forma de cobro':labels[key]}<select value={String(value)} onChange={e=>onChange(path,e.target.value)}>{Object.entries(key==='pricingType'?{per_person:'Por persona',per_unit:'Por unidad',fixed:'Fijo por evento'}:{zones:'Importe por zona',blocks:'Bloques completos de invitados (redondeo hacia arriba)'}).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>;
  if (key === 'whatsAppPhoneIntl') return null;
  if (hidden.has(key)) return null;
  if (['gallery','experiences','philosophy'].includes(key) && value && typeof value==='object') return <fieldset className="admin-item admin-wide"><legend>{labels[key]}</legend><div className="admin-fields">{Object.entries(value).map(([k,v])=><Fields key={k} value={v} path={[...path,k]} onChange={onChange}/>)}</div></fieldset>;
  if (Array.isArray(value)) {
    const editable=!['leadTimes','photos','pillars'].includes(key) && !(key==='items' && path.includes('experiences'));
    const makeItem=()=>{
      const id=`item-${crypto.randomUUID().slice(0,12)}`;
      const fallback:Record<string,unknown>={packages:{id,name:'Nuevo menú',subtitle:'Descripción breve',concept:'Describe tu propuesta',pricePerPersonCents:0,priceApproved:false,minGuests:5,courses:[],includedServices:[],compatibleExtraIds:[],choiceGroups:[],image:'/logo-catering-oculto.png',demoLabel:'Por revisar'},extras:{id,name:'Nuevo complemento',description:'Describe el servicio',priceCents:0,pricingType:'fixed',category:'servicio',defaultQuantity:1,maxQuantity:10},choiceGroups:{id,name:'Nuevo tiempo',required:false,note:'Preferencia sujeta a confirmación',dependsOnGroup:'',dependsOnOption:'',options:[{id:'opcion',name:'Nueva opción',description:'Describe el platillo'}]},options:{id,name:'Nuevo platillo',description:'Describe el platillo'},courses:{title:'Nuevo tiempo',description:'Describe el tiempo'},includedServices:'Nuevo servicio',faqs:{category:'politicas',question:'Nueva pregunta',answer:'Escribe la respuesta'},zones:{id,name:'Nueva zona',description:'Describe la cobertura',travelFeeCents:0,requiresConfirmation:true}};
      const galleryItem={id,image:'/logo-catering-oculto.png',title:'Nueva fotografía',caption:'Describe esta fotografía',aspect:'landscape'};
      const item=structuredClone(key==='items' && path.includes('gallery')?galleryItem:fallback[key] ?? value[0] ?? 'Nuevo elemento');
      if(item && typeof item==='object' && 'id' in item)item.id=id;
      return item;
    };
    return <div className="admin-collection">{value.map((item, index) => <fieldset className="admin-item" key={typeof item==='object' && item.id?item.id:index}>
    <legend>{typeof item === 'object' ? (item.name ?? item.question ?? item.title ?? `Elemento ${index + 1}`) : `${labels[key] ?? 'Elemento'} ${index + 1}`}</legend>
    <Fields value={item} path={[...path, index]} onChange={onChange}/>
    {editable && <div className="admin-row-actions"><button type="button" className="admin-secondary" disabled={index===0} onClick={()=>{const list=[...value];[list[index-1],list[index]]=[list[index],list[index-1]];onChange(path,list);}}>Subir</button><button type="button" className="admin-secondary" disabled={index===value.length-1} onClick={()=>{const list=[...value];[list[index+1],list[index]]=[list[index],list[index+1]];onChange(path,list);}}>Bajar</button><button type="button" className="admin-secondary" disabled={['packages','zones','options'].includes(key) && value.length===1} onClick={()=>{if(window.confirm('¿Retirar este elemento del borrador? Las cotizaciones guardadas conservarán su información.'))onChange(path,value.filter((_,i)=>i!==index));}}>Retirar</button></div>}
  </fieldset>)}{editable && <button type="button" className="admin-secondary" onClick={()=>onChange(path,[...value,makeItem()])}>Añadir {labels[key]?.toLowerCase() ?? 'elemento'}</button>}</div>;
  }
  if (value !== null && typeof value === 'object') return <div className="admin-fields">{Object.entries(value).map(([k,v]) => <Fields key={k} value={v} path={[...path,k]} onChange={onChange}/>)}</div>;
  const id = `edit-${path.join('-')}`;
  if(key==='image') return <ImageField key={id} id={id} value={String(value)} onChange={url=>onChange(path,url)}/>;
  const label = labels[key] ?? (typeof path[path.length - 1] === 'number' ? 'Contenido' : key);
  if (typeof value === 'boolean') return <label className="admin-check" htmlFor={id}><input id={id} type="checkbox" checked={value} onChange={e=>onChange(path,e.target.checked)}/>{label}</label>;
  if (typeof value === 'number') {const decimal=key.endsWith('Cents') || key==='taxRateBps';return <label className="admin-field" htmlFor={id}>{label}<input id={id} type="number" min={decimal || key==='depositPercent' ? 0 : 1} max={key.endsWith('Cents') ? 1000000 : key==='taxRateBps' || key==='depositPercent'?100:150} step={decimal ? '0.01' : '1'} required value={Number.isNaN(value) ? '' : decimal ? value / 100 : value} onChange={e=>onChange(path,e.target.value === '' ? NaN : decimal ? Math.round(Number(e.target.value)*100) : Number(e.target.value))}/></label>;}
  const text = String(value ?? '');
  const multiline = ['description','concept','answer','quoteDisclaimer','taxNotice','demoNotice','notes','conditions','note'].includes(key);
  return <label className={`admin-field ${multiline || key === 'image' ? 'admin-wide' : ''}`} htmlFor={id}>{label}
    {multiline ? <textarea id={id} rows={4} value={text} maxLength={5000} required={key!=='note'} onChange={e=>onChange(path,e.target.value)}/> : <input id={id} type={key==='contactEmail'?'email':'text'} value={text} maxLength={5000} required={key!=='contactEmail'} onChange={e=>onChange(path,e.target.value)}/>}
  </label>;
}

async function request(path: string, body?: unknown): Promise<EditorialState> {
  const response = await fetch(`/api/local-editor/${path}`, body ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)} : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'No se pudo completar la operación.');
  return data;
}
export default function Admin() {
  const [state, setState] = useState<EditorialState | null>(null);
  const [draft, setDraft] = useState<Catalog | null>(null);
  const [section, setSection] = useState<keyof Catalog>('editorial');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [confirmPublish,setConfirmPublish] = useState(false);
  const dirty = !!state && JSON.stringify(draft) !== JSON.stringify(state.draft);
  const unpublished = !!state && JSON.stringify(state.draft) !== JSON.stringify(state.published);
  const current = sections.find(item=>item.id === section)!;
  useEffect(()=>{ request('state').then(data=>{setState(data);setDraft(data.draft);}).catch(()=>setError('No se pudo abrir el editor. Comprueba la conexión y vuelve a iniciar sesión.')); },[]);
  useEffect(()=>{
    const warn = (event: BeforeUnloadEvent) => {if(dirty){event.preventDefault();event.returnValue = '';}};
    window.addEventListener('beforeunload',warn); return ()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  const change = (path: Path, value: unknown) => {
    setDraft(previous=>{
      const copy = structuredClone(previous!);
      let node = copy as unknown as Record<string | number, unknown>;
      for (const part of path.slice(0,-1)) node = node[part] as Record<string | number, unknown>;
      node[path[path.length-1]] = value;
      copy.packages.forEach(p=>{p.compatibleExtraIds=p.compatibleExtraIds.filter(id=>copy.extras.some(e=>e.id===id));});
      copy.rules.leadTimes=copy.packages.map(p=>copy.rules.leadTimes.find(r=>r.id===p.id) ?? {id:p.id,name:p.name,approved:false,days:1});
      return copy;
    }); setMessage(''); setConfirmPublish(false);
  };
  const act = async (action: 'draft' | 'publish' | 'restore') => {
    setBusy(true);setError('');setMessage('');setConfirmPublish(false);
    try {
      if(action==='draft')validateCatalog(draft);
      const result = await request(action,{revision:state!.revision,...(action === 'draft' ? {draft} : {})});
      setState(result);setDraft(result.draft);
      setMessage(action === 'draft' ? 'Borrador guardado. La página conserva la versión publicada.' : action === 'publish' ? 'Publicado en la página. Recarga para ver los cambios.' : 'Versión anterior recuperada como borrador. Revísala antes de publicar.');
    } catch(err){setError(err instanceof Error ? err.message : 'No se pudo guardar.');}
    finally{setBusy(false);}
  };
  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><img src="/logo-catering-oculto.png" alt=""/><span>Catering Oculto<small>ESTUDIO DE CONTENIDO</small></span></a>
      <p className="admin-nav-label">ADMINISTRAR</p><nav aria-label="Secciones de administración">{sections.map(({id,label,icon:Icon})=><button key={id} aria-current={section===id ? 'page' : undefined} onClick={()=>setSection(id)}><Icon size={18}/>{label}</button>)}</nav>
      <div className="admin-local"><span/> Panel privado<p>Guarda y revisa tu borrador. Publicar actualiza la página para todos los visitantes.</p></div>
      <a className="admin-site-link" href="/" target="_blank" rel="noreferrer">Ver página publicada <ArrowUpRight size={17}/></a>
    </aside>
    <main className="admin-main"><header className="admin-top"><span>Tu cocina, tu contenido</span><span className="admin-badge">ADMINISTRACIÓN</span></header>
      <div className="admin-heading"><div><p className="admin-eyebrow">CATERING OCULTO / {current.label.toUpperCase()}</p><h1>{current.label}</h1><p>{current.subtitle}</p></div><span className="admin-status">{dirty ? '● Cambios sin guardar' : unpublished ? '● Borrador por publicar' : '✓ Al día'}</span></div>
      <div className="admin-workflow"><div><span>01</span><strong>Edita</strong><p>Ajusta el contenido a tu negocio.</p></div><div><span>02</span><strong>Revisa</strong><p>Guarda y abre la vista previa.</p></div><div><span>03</span><strong>Publica</strong><p>Actualiza la página cuando esté listo.</p></div></div>
      {error && <div role="alert" className="admin-error">{error}</div>}{message && <div role="status" className="admin-success"><Check size={18}/>{message}</div>}
      {state && draft ? <form onSubmit={e=>{e.preventDefault();void act('draft');}}>
        <details className="admin-history"><summary>Contenido recibido del cliente</summary><p>Cargar el Word como borrador reemplaza menús, extras, zonas, preguntas y condiciones del borrador. IVA y traslado quedan pendientes; las cenas conservan precio por confirmar.</p><button type="button" className="admin-secondary" disabled={busy} onClick={()=>{if(window.confirm('¿Preparar el catálogo del documento en el borrador? Revisa los cambios antes de guardar o publicar.')){setDraft(clientCatalog(draft));setConfirmPublish(false);setMessage('Documento preparado como borrador. Revisa precios, fotografías y reglas.');}}}>Cargar menús del documento</button></details>
        <div className="admin-editor"><div className="admin-editor-title"><h2>Contenido de {current.label.toLowerCase()}</h2><span>Revisión {state.revision}</span></div>
          <fieldset disabled={busy} className="admin-inputs"><Fields value={draft[section]} path={[section]} onChange={change}/></fieldset>
          {section==='packages' && <section className="admin-item"><h3>Complementos disponibles por menú</h3>{draft.packages.map((pkg,i)=><fieldset key={pkg.id}><legend>{pkg.name}</legend>{draft.extras.length?draft.extras.map(extra=><label key={extra.id} className="admin-check"><input type="checkbox" checked={pkg.compatibleExtraIds.includes(extra.id)} onChange={e=>change(['packages',i,'compatibleExtraIds'],e.target.checked?[...pkg.compatibleExtraIds,extra.id]:pkg.compatibleExtraIds.filter(id=>id!==extra.id))}/>{extra.name}</label>):<p>Añade complementos en Servicios y extras para ofrecerlos aquí.</p>}</fieldset>)}</section>}
        </div>
        <footer className="admin-actions"><div><strong>{dirty ? 'Tienes cambios pendientes' : 'Borrador guardado'}</strong><small>{state.publishedAt ? `Última publicación: ${new Date(state.publishedAt).toLocaleString('es-MX')}` : 'Catálogo inicial de demostración'}</small></div>
          <button className="admin-secondary" type="submit" disabled={busy || !dirty}><Save size={16}/>Guardar borrador</button>
          {!dirty && !busy ? <a className="admin-secondary" href="/?preview=1" target="_blank" rel="noreferrer">Vista previa <ArrowUpRight size={16}/></a> : <span className="admin-hint">Guarda para previsualizar</span>}
          <button className="admin-primary" type="button" disabled={busy || dirty || !unpublished} onClick={()=>setConfirmPublish(true)}><Globe size={16}/>Publicar</button>
        </footer>
        {confirmPublish && <div className="admin-confirm" role="region" aria-label="Confirmar publicación"><h3>¿Publicar este borrador en la página?</h3><p>Se actualizarán los textos y precios de todo el catálogo. La versión anterior quedará disponible para recuperar.</p><button type="button" className="admin-primary" onClick={()=>void act('publish')}>Confirmar publicación</button><button type="button" className="admin-secondary" onClick={()=>setConfirmPublish(false)}>Seguir revisando</button></div>}
        {state.previous && <div className="admin-history"><h2>Historial editorial</h2><p>Puedes recuperar la publicación anterior como borrador sin cambiar lo que ven los visitantes.</p><button type="button" className="admin-secondary" disabled={busy || dirty} onClick={()=>void act('restore')}>Recuperar versión anterior</button></div>}
      </form> : !error && <p role="status">Cargando tu espacio de trabajo…</p>}
    </main>
  </div>;
}
