import { mergeDraft } from './mergeDraft';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Globe, Plus, Save, Trash2, UtensilsCrossed } from 'lucide-react';
import type { PackageMenu } from '../types';
import type { EditorialState } from '../../server/localStore';
import { validateCatalog, type Catalog } from './catalog';
import ImageField from './ImageField';
import './ChefMenus.css';

async function request(path: string, body?: unknown): Promise<EditorialState> {
  const response = await fetch(`/api/local-editor/${path}`, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  } : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'No se pudo completar la operación.');
  return data;
}

export default function ChefMenus() {
  const [state, setState] = useState<EditorialState | null>(null);
  const [draft, setDraft] = useState<Catalog | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmPublish, setConfirmPublish] = useState(false);

  useEffect(() => {
    request('state')
      .then(data => {
        setState(data);
        setDraft(data.draft);
      })
      .catch(() => setError('No se pudieron cargar los menús. Comprueba la conexión.'));
  }, []);

  const dirty = !!state && JSON.stringify(draft) !== JSON.stringify(state.draft);
  const unpublished = !!state && JSON.stringify(state.draft) !== JSON.stringify(state.published);

  const updateServices = (change: (services: Catalog['sections']['services']) => void) => {
    setDraft(previous => {
      if (!previous) return previous;
      const copy = structuredClone(previous);
      change(copy.sections.services);
      return copy;
    });
    setMessage('');
  };
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const updatePackage = (index: number, patch: Partial<PackageMenu>) => {
    if (!draft) return;
    setDraft((prev: Catalog | null) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      copy.packages[index] = { ...copy.packages[index], ...patch };
      return copy;
    });
    setMessage('');
  };

  const updateCourse = (pkgIndex: number, courseIndex: number, field: 'title' | 'description', value: string) => {
    if (!draft) return;
    setDraft((prev: Catalog | null) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const courses = [...copy.packages[pkgIndex].courses];
      courses[courseIndex] = { ...courses[courseIndex], [field]: value };
      copy.packages[pkgIndex].courses = courses;
      return copy;
    });
    setMessage('');
  };

  const addCourse = (pkgIndex: number) => {
    if (!draft) return;
    setDraft((prev: Catalog | null) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      copy.packages[pkgIndex].courses.push({
        title: 'Nuevo tiempo',
        description: 'Describe el platillo o preparación'
      });
      return copy;
    });
  };

  const removeCourse = (pkgIndex: number, courseIndex: number) => {
    if (!draft) return;
    setDraft((prev: Catalog | null) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      copy.packages[pkgIndex].courses = copy.packages[pkgIndex].courses.filter((_: unknown, i: number) => i !== courseIndex);
      return copy;
    });
  };

  useEffect(()=>{
    const refresh=(event:Event)=>{
      const {source,state:incoming}=(event as CustomEvent<{source:string;state:EditorialState}>).detail;
      if(source==='ChefMenus' || !state || !draft)return;
      const merged=mergeDraft(state.draft,draft,incoming.draft);
      if(!merged){setError('Otra sección cambió el mismo contenido. Tus cambios se conservan; revisa el borrador antes de volver a guardar.');return;}
      setState(incoming);setDraft(merged);
    };
    window.addEventListener('catalog-updated',refresh);
    return ()=>window.removeEventListener('catalog-updated',refresh);
  },[state,draft]);

  const act = async (action: 'draft' | 'publish') => {
    if (!state || !draft) return;
    setBusy(true);
    setError('');
    setMessage('');
    setConfirmPublish(false);
    try {
      const cleanDraft=structuredClone(draft);
      if (action === 'draft') {cleanDraft.sections.services.items.forEach(s=>{s.includes=s.includes.map(v=>v.trim()).filter(Boolean);});validateCatalog(cleanDraft);}
      const result = await request(action, {
        revision: state.revision,
        ...(action === 'draft' ? { draft:cleanDraft } : {})
      });
      window.dispatchEvent(new CustomEvent('catalog-updated',{detail:{source:'ChefMenus',state:result}}));
      setState(result);
      setDraft(result.draft);
      setMessage(action === 'draft' ? 'Cambios guardados en borrador.' : 'Contenido publicado. Recarga la página para ver los cambios.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  if (!state || !draft) {
    return <main className="chef-menus-main">{error?<p role="alert">{error}</p>:<p role="status">Cargando menús de la cocina…</p>}</main>;
  }

  return (
    <main className="chef-menus-main">
      <header className="chef-menus-header">
        <div>
          <div className="chef-menus-eyebrow">
            <UtensilsCrossed size={16} />
            <span>CATERING OCULTO · COCINA</span>
          </div>
          <h1>Menús de la cocina</h1>
          <p>Edita lo que el cliente ve en Desayuno, Comida y Cena. Guarda, revisa y publica cuando esté listo.</p>
        </div>
        <div className="chef-menus-status">
          <span className={`status-pill ${dirty ? 'dirty' : unpublished ? 'unpublished' : 'clean'}`}>
            {dirty ? '● Cambios sin guardar' : unpublished ? '● Borrador por publicar' : '✓ Al día'}
          </span>
        </div>
      </header>

      {error && <div role="alert" className="admin-error">{error}</div>}
      {message && <div role="status" className="admin-success"><Check size={18} />{message}</div>}

      <fieldset disabled={busy} style={{border:0,padding:0,margin:0,minWidth:0}}>
      <section className="chef-menu-card" aria-label="Servicios de la página">
        <div className="chef-menu-card-body">
          <label className="chef-field">Título de la sección<input value={draft.sections.services.title} onChange={e=>updateServices(s=>{s.title=e.target.value;})}/></label>
          <label className="chef-field">Presentación<textarea value={draft.sections.services.description} onChange={e=>updateServices(s=>{s.description=e.target.value;})}/></label>
        </div>
      </section>
      <div className="chef-menus-cards">
        {draft.sections.services.items.map((service,index)=><details className="chef-menu-card" key={service.id} name="public-services" open={index===0}>
          <summary className="chef-menu-card-header"><h2>{service.title}</h2><span>Editar servicio</span></summary>
          <div className="chef-menu-card-body chef-menu-fields-grid">
            <label className="chef-field">Título<input value={service.title} onChange={e=>updateServices(s=>{s.items[index].title=e.target.value;})}/></label>
            <label className="chef-field">Subtítulo<input value={service.subtitle} onChange={e=>updateServices(s=>{s.items[index].subtitle=e.target.value;})}/></label>
            <label className="chef-field full-width">Descripción<textarea value={service.description} onChange={e=>updateServices(s=>{s.items[index].description=e.target.value;})}/></label>
            <div className="chef-field full-width"><span>Fotografía que se ve en la página</span><ImageField id={'service-'+service.id} value={service.image} onChange={image=>updateServices(s=>{s.items[index].image=image;})}/></div>
            <label className="chef-field full-width">{service.id==='desayuno'?'Incluido al centro de la mesa':'Sobre el servicio'} · un elemento por línea<textarea rows={5} value={service.includes.join('\n')} onChange={e=>updateServices(s=>{s.items[index].includes=e.target.value.split('\n');})}/></label>
            <label className="chef-field full-width">Nota para el cliente<textarea value={service.note} onChange={e=>updateServices(s=>{s.items[index].note=e.target.value;})}/></label>
          </div>
        </details>)}
      </div>
      <details className="admin-history">
        <summary>Precios de referencia y menús para acordar con el cliente</summary>
        <p>Estos menús alimentan las referencias de precio de la solicitud. Sus fotografías y platillos no sustituyen las tres tarjetas de arriba. Las cenas de dos y tres tiempos se acuerdan después con el chef.</p>
        <label className="chef-switch-label"><input type="checkbox" checked={draft.service.pricesApproved} onChange={e=>setDraft({...draft,service:{...draft.service,pricesApproved:e.target.checked}})}/>Precios revisados por el negocio: permitir referencias aprobadas</label>
      <div className="chef-menus-cards">
        {draft.packages.map((pkg: PackageMenu, idx: number) => {
          const priceMXN = pkg.pricePerPersonCents ? (pkg.pricePerPersonCents / 100) : 0;

          return (
            <article key={pkg.id} className="chef-menu-card">
              <div className="chef-menu-card-header">
                <div>
                  <span className="chef-menu-card-num">PROPUESTA 0{idx + 1}</span>
                  <h2>{pkg.name}</h2>
                </div>
                <label className="chef-switch-label">
                  <input
                    type="checkbox"
                    checked={pkg.priceApproved !== false}
                    onChange={e => updatePackage(idx, { priceApproved: e.target.checked })}
                  />
                  <span>{pkg.priceApproved !== false ? 'Precio aprobado' : 'Precio por confirmar'}</span>
                </label>
              </div>

              <div className="chef-menu-card-body">
                <div className="chef-menu-fields-grid">
                  <label className="chef-field">
                    <span>Nombre del menú</span>
                    <input
                      type="text"
                      value={pkg.name}
                      maxLength={100}
                      onChange={e => updatePackage(idx, { name: e.target.value })}
                    />
                  </label>

                  <label className="chef-field">
                    <span>Precio por persona (MXN)</span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={priceMXN || ''}
                      onChange={e => updatePackage(idx, { pricePerPersonCents: Math.round(Number(e.target.value) * 100) })}
                      placeholder="Ej. 1650"
                    />
                  </label>

                  <label className="chef-field full-width">
                    <span>Subtítulo o distintivo</span>
                    <input
                      type="text"
                      value={pkg.subtitle}
                      maxLength={200}
                      onChange={e => updatePackage(idx, { subtitle: e.target.value })}
                    />
                  </label>

                  <label className="chef-field full-width">
                    <span>Concepto y filosofía del menú</span>
                    <textarea
                      rows={2}
                      value={pkg.concept}
                      maxLength={800}
                      onChange={e => updatePackage(idx, { concept: e.target.value })}
                    />
                  </label>

                  <div className="chef-field full-width">
                    <span>Fotografía del menú</span>
                    <ImageField
                      id={`img-pkg-${pkg.id}`}
                      value={pkg.image}
                      onChange={url => updatePackage(idx, { image: url })}
                    />
                  </div>
                </div>

                {/* Courses / Platillos */}
                <div className="chef-courses-section">
                  <div className="chef-courses-header">
                    <h3>Tiempos y platillos ({pkg.courses.length})</h3>
                    <button
                      type="button"
                      className="admin-secondary btn-sm"
                      onClick={() => addCourse(idx)}
                    >
                      <Plus size={14} /> Añadir tiempo
                    </button>
                  </div>

                  <div className="chef-courses-list">
                    {pkg.courses.map((course: { title: string; description: string }, cIdx: number) => (
                      <div key={cIdx} className="chef-course-row">
                        <div className="chef-course-inputs">
                          <input
                            type="text"
                            placeholder="Nombre del tiempo (ej. Entrada fría)"
                            value={course.title}
                            maxLength={80}
                            onChange={e => updateCourse(idx, cIdx, 'title', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Descripción del platillo e ingredientes"
                            value={course.description}
                            maxLength={300}
                            onChange={e => updateCourse(idx, cIdx, 'description', e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          className="chef-remove-btn"
                          title="Eliminar platillo"
                          onClick={() => removeCourse(idx, cIdx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      </details>
      </fieldset>
      {/* Floating Action Bar */}
      <footer className="chef-menus-footer-actions">
        <div className="footer-status-text">
          <strong>{dirty ? 'Tienes cambios pendientes por guardar' : 'Cambios guardados en borrador'}</strong>
          <small>{state.publishedAt ? `Última publicación: ${new Date(state.publishedAt).toLocaleString('es-MX')}` : 'Catálogo base'}</small>
        </div>

        <div className="footer-buttons">
          <button
            type="button"
            className="admin-secondary"
            disabled={busy || !dirty}
            onClick={() => void act('draft')}
          >
            <Save size={16} /> Guardar borrador
          </button>

          {!dirty && !busy && (
            <a className="admin-secondary" href="/?preview=1" target="_blank" rel="noreferrer">
              Ver vista previa <ArrowUpRight size={16} />
            </a>
          )}

          <button
            type="button"
            className="admin-primary"
            disabled={busy || dirty || !unpublished}
            onClick={() => setConfirmPublish(true)}
          >
            <Globe size={16} /> Publicar en la página
          </button>
        </div>
      </footer>

      {confirmPublish && (
        <div className="admin-confirm" role="dialog" aria-label="Confirmar publicación">
          <h3>¿Publicar los cambios en la página web?</h3>
          <p>Se publicará el borrador completo: servicios, contenido y referencias de precio. Revisa la vista previa antes de confirmar.</p>
          <button type="button" className="admin-primary" onClick={() => void act('publish')}>
            Confirmar publicación
          </button>
          <button type="button" className="admin-secondary" onClick={() => setConfirmPublish(false)}>
            Seguir revisando
          </button>
        </div>
      )}
    </main>
  );
}
