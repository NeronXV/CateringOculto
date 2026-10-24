import { useEffect, useRef, useState } from 'react';
import { SALES_STATUSES, type Followup, type InboxDetail, type InboxItem, type StaffOption, type SalesStatus } from '../types/inbox';
import './Inbox.css';
import { whatsAppDigits } from '../utils/contactPhone';
import { Receipt } from '../components/cotizador/Receipt';
import { isItineraryEstimate } from '../types/itinerary';
import RequestSummary from './RequestSummary';
import { formatEventDate, formatMXNCents } from '../utils/formatters';
import {AVAILABILITY_LABELS,availabilityMessage} from '../types/availability';
import {visibleFolio} from '../utils/folio';
import { MessageCircle, Phone, Calendar, ArrowRight, User, AlertTriangle, ChevronDown, Check } from 'lucide-react';

async function api(path: string, body?: unknown) {
  const response = await fetch(`/api/local-editor/inbox${path}`, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  } : undefined);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'No se pudo completar la operación.');
  return result;
}

const dateTime = (value: string) => new Date(value).toLocaleString('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const STATUS_MAP: Record<SalesStatus, { label: string; badgeClass: string; dot: string }> = {
  nueva: { label: 'Nueva', badgeClass: 'status-new', dot: '🔴' },
  contactada: { label: 'En conversación', badgeClass: 'status-progress', dot: '🟡' },
  en_revision: { label: 'En revisión', badgeClass: 'status-progress', dot: '🟡' },
  cerrada: { label: 'Archivada', badgeClass: 'status-closed', dot: '⚪' }
};

export default function Inbox({ onEvent, active=true }: { onEvent?: (id: string) => void; active?:boolean } = {}) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ q: '', status: '' });
  const [refresh, setRefresh] = useState(0);
  const [detail, setDetail] = useState<InboxDetail | null>(null);
  const [form, setForm] = useState<Followup | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshingDetail,setRefreshingDetail]=useState(false);
  const [dirty, setDirty] = useState(false);
  const [declining,setDeclining]=useState(false);
  const [availabilityNote,setAvailabilityNote]=useState('');
  const [privateLink,setPrivateLink]=useState('');
  const [responseHours,setResponseHours]=useState(24);
  const [hoursInput,setHoursInput]=useState(24);
  const hasUnsaved=dirty||(declining&&!!availabilityNote.trim());
  const unsavedRef=useRef(hasUnsaved);unsavedRef.current=hasUnsaved;
  const working=busy||refreshingDetail;
  const heading = useRef<HTMLHeadingElement>(null);
  const followupNote = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    Promise.all([
      api('?' + new URLSearchParams({ ...filter, page: String(page) })),
      api('/staff'),api('/settings')
    ])
      .then(([list, people, settings]) => {
        if (current) {
          setItems(list.items);
          setTotal(list.total);
          setStaff(people);
          setResponseHours(settings.responseHours);setHoursInput(previous=>previous===responseHours?settings.responseHours:previous);
        }
      })
      .catch(err => {
        if (current) setError(err.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [filter, page, refresh]);

  useEffect(() => {
    if (!hasUnsaved) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [hasUnsaved]);
  useEffect(()=>{const timer=setInterval(()=>setRefresh(value=>value+1),60000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    if(!active||!detail||busy)return;
    let current=true;setRefreshingDetail(true);
    void api('/'+detail.id).then(updated=>{if(current){setDetail(updated);if(!unsavedRef.current)setForm(updated.followup);}}).catch(error=>{if(current)setError(error.message);}).finally(()=>{if(current)setRefreshingDetail(false);});
    return()=>{current=false;setRefreshingDetail(false);};
  },[active,refresh]);

  const load = async (id: string) => {
    if (hasUnsaved && !window.confirm('Hay notas sin guardar. ¿Descartar y abrir la solicitud?')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api('/' + id);
      setDetail(result);
      setForm(result.followup);
      setNote('');
      setDirty(false);
      setDeclining(false);setAvailabilityNote('');setPrivateLink('');
      requestAnimationFrame(() => heading.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la solicitud.');
    } finally {
      setBusy(false);
    }
  };

  const availabilityAction=async(path:string,body:unknown)=>{
    if(!detail)return;setBusy(true);setError('');setMessage('');
    try {
      const result=await api('/'+detail.id+path,body);
      const updated=await api('/'+detail.id);setDetail(updated);
      setForm(previous=>dirty&&previous?{...previous,revision:updated.followup.revision}:updated.followup);
      if(path==='/link')setPrivateLink(location.origin+'/seguimiento#'+result.token);
      else {setDeclining(false);setAvailabilityNote('');setMessage('Decisión registrada. Puedes compartir el mensaje por WhatsApp.');}
      setRefresh(value=>value+1);
    }catch(error){setError((error as Error).message);}finally{setBusy(false);}
  };
  const decisionStatus=detail?.availability?.status??'pending';
  const clientMessage=detail?availabilityMessage(detail.contact.name,detail.folio,detail.eventDates??[detail.eventDate],decisionStatus,privateLink,detail.reservationStatus):'';
  const contactAction=detail&&<a className="btn-whatsapp-prominent" aria-disabled={working} onClick={event=>{if(working)event.preventDefault();}} target="_blank" rel="noreferrer" href={`https://wa.me/${whatsAppDigits(detail.contact.phone)}?text=${encodeURIComponent(clientMessage)}`}><MessageCircle size={18}/><span>Contactar al cliente</span></a>;



  const quickSaveStatus = async (newStatus: SalesStatus) => {
    if (!detail || !form) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('/' + detail.id, { ...form, status: newStatus, note: note.trim() });
      setDirty(false);
      setNote('');
      setMessage(`Estado actualizado a "${STATUS_MAP[newStatus].label}".`);
      const updated = await api('/' + detail.id);
      setDetail(updated);
      setForm(updated.followup);
      setRefresh(x => x + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setBusy(false);
    }
  };

  const saveFollowup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail || !form) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('/' + detail.id, { ...form, note: note.trim() });
      setDirty(false);
      setNote('');
      setForm({ ...form, revision: form.revision + 1 });
      setMessage('Seguimiento guardado correctamente.');
      const updated = await api('/' + detail.id);
      setDetail(updated);
      setForm(updated.followup);
      setRefresh(x => x + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="inbox">
      <header className="inbox-header">
        <div>
          <span className="inbox-eyebrow">ATENCIÓN DIARIA</span>
          <h1>Solicitudes de clientes</h1>
          <p>Atiende las solicitudes nuevas y prepara propuestas. Una solicitud no confirma una reservación.</p>
        </div>
      </header>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {message && <div className="admin-success" role="status"><Check size={16} /> {message}</div>}
      <details className="inbox-response-settings"><summary>Plazo de atención: {responseHours} horas</summary>
        <form onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{const settings=await api('/settings',{responseHours:hoursInput,expectedHours:responseHours});setResponseHours(settings.responseHours);setRefresh(value=>value+1);setMessage('Plazo de atención actualizado.');}catch(error){setError((error as Error).message);}finally{setBusy(false);}}}>
          <label>Horas para decidir disponibilidad<input aria-label="Horas para decidir disponibilidad" type="number" min={1} max={720} required value={hoursInput} onChange={event=>setHoursInput(Number(event.target.value))}/></label>
          <p>Solo destaca solicitudes pendientes. No aparta ni cancela fechas.</p>
          <button type="submit" className="admin-secondary btn-touch" disabled={working||hoursInput===responseHours}>Guardar plazo</button>
        </form>
      </details>

      {/* Filtros rápidos */}
      <form className="inbox-filters-bar" onSubmit={e => { e.preventDefault(); setPage(1); setFilter({ q: search, status }); }}>
        <input
          type="text"
          placeholder="Buscar por nombre o folio…"
          value={search}
          maxLength={100}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); setFilter({ q: search, status: e.target.value }); }}>
          <option value="">Todos los estados</option>
          <option value="nueva">🔴 Nuevas</option>
          <option value="contactada">🟡 En conversación</option>
          <option value="en_revision">🟡 En revisión</option>
          <option value="cerrada">⚪ Archivadas</option>
        </select>
        <button type="submit" className="admin-primary btn-touch" disabled={loading}>Buscar</button>
        <button type="button" className="admin-secondary btn-touch" disabled={loading} onClick={() => setRefresh(x => x + 1)}>Actualizar</button>
      </form>

      <div className="inbox-grid">
        {/* COLUMNA IZQUIERDA: Tarjetas apiladas */}
        <section className="inbox-cards-column" aria-label="Listado de solicitudes" aria-busy={loading}>
          <div className="inbox-count-badge">
            {loading ? 'Cargando solicitudes…' : `${total} solicitudes en total`}
          </div>

          {!loading && !items.length && (
            <div className="inbox-empty-card">
              <p>No hay solicitudes para este filtro.</p>
            </div>
          )}

          <div className="inbox-cards-list">
            {items.map(row => {
              const st = STATUS_MAP[row.followup.status] || { label: row.followup.status, badgeClass: 'status-new', dot: '●' };
              const isSelected = detail?.id === row.id;

              return (
                <article
                  key={row.id}
                  className={`inbox-card ${isSelected ? 'selected' : ''} ${row.attention?.overdue?'needs-attention':''}`}
                  onClick={() => {if(!working)void load(row.id);}}
                >
                  <div className="inbox-card-top">
                    <div>
                      <strong className="inbox-card-name">{row.name}</strong>
                      <span className="inbox-card-guests">{visibleFolio(row.folio)}</span>
                      <span className="inbox-card-guests">👥 {row.guests} comensales</span>
                    </div>
                    <span className={`inbox-status-pill ${st.badgeClass}`}>
                      {st.dot} {st.label}
                    </span>
                  </div>

                  <div className="inbox-card-dates">
                    <Calendar size={14} className="icon-gold" />
                    <span><strong>{row.eventDates?.length ? row.eventDates.slice(0,2).map(formatEventDate).join(' · ') : row.eventDate}</strong>{row.eventDates && row.eventDates.length > 2 && <small> y otras {row.eventDates.length - 2} fechas</small>}</span>
                  </div>
                  <div className="inbox-card-amount">
                    {row.subtotalCents != null && <strong>Subtotal: {formatMXNCents(row.subtotalCents)} MXN</strong>}
                    {row.hasPendingAmounts && <span>Importes por confirmar</span>}
                  </div>
                  <span className="request-availability-label">{AVAILABILITY_LABELS[row.availability?.status??'pending']}</span>
                  {row.attention?.overdue&&<strong className="request-overdue">Atención pendiente · más de {row.attention.responseHours} h</strong>}

                  <div className="inbox-card-actions">
                    <button
                      type="button"
                      className="admin-secondary btn-touch"
                      disabled={working}
                      onClick={(e) => { e.stopPropagation(); void load(row.id); }}
                    >
                      {isSelected ? 'Viendo detalle' : 'Ver detalle'} <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <nav className="inbox-pagination" aria-label="Páginas">
            <button className="admin-secondary btn-touch" disabled={loading || page === 1} onClick={() => setPage(p => p - 1)}>
              Anterior
            </button>
            <span>Página {page}</span>
            <button className="admin-secondary btn-touch" disabled={loading || page * 20 >= total} onClick={() => setPage(p => p + 1)}>
              Siguiente
            </button>
          </nav>
        </section>

        {/* COLUMNA DERECHA: Detalle en 3 bloques claros */}
        <section className="inbox-detail-column" aria-label="Detalle de solicitud" aria-busy={working}>
          {!detail || !form ? (
            <div className="inbox-detail-placeholder">
              <User size={32} />
              <h3>Selecciona una solicitud</h3>
              <p>Haz clic en cualquier cliente de la izquierda para ver su estancia, teléfono y opciones de contacto.</p>
            </div>
          ) : (
            <div className="inbox-detail-sheet">
              {/* BLOQUE 1: Cliente & Contacto */}
              <div className="detail-block block-client">
                <div className="block-client-header">
                  <div>
                    <h2 ref={heading} tabIndex={-1}>{detail.contact.name}</h2>
                    <p>Folio: {visibleFolio(detail.folio)}</p>
                    <span className="block-guests-tag">👥 {detail.guests} personas</span>
                  </div>
                  <div className="block-client-buttons">
                    {detail.contact.phone && (
                      <a
                        className="btn-call-touch"
                        href={`tel:${detail.contact.phone}`}
                        title="Llamar directamente"
                      >
                        <Phone size={16} />
                        <span>{detail.contact.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
                <p className={`inbox-status-pill ${STATUS_MAP[detail.followup.status].badgeClass}`}>{STATUS_MAP[detail.followup.status].label} · Solicitud</p>
                <p><strong>Ubicación:</strong> {isItineraryEstimate(detail.estimate) ? detail.estimate.selection.location || 'Por confirmar' : detail.estimate.breakdown.selectedZone?.name || 'Por confirmar'}</p>
              </div>

              {/* BLOQUE 2: Servicio e Itinerario */}
              <div className="detail-block block-services">
                <RequestSummary request={detail} />

                {/* Restricciones alimentarias (alerta destacada si existen) */}
                {detail.contact.dietaryRestrictions ? (
                  <div className="dietary-warning-box">
                    <AlertTriangle size={18} className="icon-warning" />
                    <div>
                      <strong>Restricciones alimentarias / Alergias informadas:</strong>
                      <p>{detail.contact.dietaryRestrictions}</p>
                    </div>
                  </div>
                ) : (
                  <p className="dietary-ok-note">Sin información en el campo de alergias. Revisa también las notas y confírmalo con el cliente.</p>
                )}

                {/* Notas adicionales */}
                {detail.contact.additionalNotes && (
                  <div className="client-notes-box">
                    <strong>Notas del cliente:</strong>
                    <p>{detail.contact.additionalNotes}</p>
                  </div>
                )}
              </div>

              <section className="detail-block availability-decision" aria-label="Decidir disponibilidad">
                <h3>Disponibilidad</h3>
                <strong>{AVAILABILITY_LABELS[decisionStatus]}</strong>
                {(detail.reservationStatus==='confirmed'||detail.reservationStatus==='hold')&&<p>Esta solicitud ya tiene {detail.reservationStatus==='confirmed'?'una reserva confirmada':'un apartado vigente'} en Agenda. La decisión no cambia ese acuerdo.</p>}
                {(detail.attention?.overdue||items.find(row=>row.id===detail.id)?.attention?.overdue)&&decisionStatus==='pending'&&<p className="request-overdue">Atención pendiente: supera el plazo de {responseHours} horas.</p>}
                {detail.availability?.decidedAt&&<p>{detail.availability.actorName} · {dateTime(detail.availability.decidedAt)}</p>}
                {detail.availability?.note&&<p className="availability-observation">Observación interna: {detail.availability.note}</p>}
                <p>Revisa también los compromisos externos. Esta decisión no reserva ni aparta fechas; se vuelve a revisar al contratar.</p>
                <div className="availability-actions">
                  <button type="button" className="admin-primary btn-touch" disabled={working} onClick={()=>void availabilityAction('/availability',{revision:form.revision,status:'available',note:''})}>Disponible para continuar</button>
                  <button type="button" className="admin-secondary btn-touch" disabled={working} onClick={()=>setDeclining(true)}>No disponible</button>
                  {contactAction}
                </div>
                {declining&&<form onSubmit={event=>{event.preventDefault();void availabilityAction('/availability',{revision:form.revision,status:'unavailable',note:availabilityNote});}}>
                  <label>Observación breve · opcional<textarea aria-label="Observación de disponibilidad" rows={2} maxLength={500} value={availabilityNote} disabled={working} onChange={event=>setAvailabilityNote(event.target.value)}/></label>
                  <div className="availability-actions"><button className="admin-primary btn-touch" disabled={working}>Guardar no disponibilidad</button><button type="button" className="admin-secondary btn-touch" disabled={working} onClick={()=>{setDeclining(false);setAvailabilityNote('');}}>Volver</button></div>
                </form>}
                <details className="availability-communication"><summary>Mensaje y seguimiento para el cliente</summary>
                  <p>«Contactar al cliente» abre WhatsApp con este texto. El envío es manual.</p>
                  <textarea aria-label="Mensaje preparado para el cliente" rows={5} readOnly value={clientMessage}/>
                  <button type="button" className="admin-secondary btn-touch" disabled={working||hasUnsaved} onClick={()=>void availabilityAction('/link',{revision:form.revision})}>{privateLink?'Renovar enlace privado':'Generar enlace privado'}</button>
                  {privateLink&&<><label>Enlace privado<input aria-label="Enlace privado de la solicitud" readOnly value={privateLink}/></label><p>Incluido en el mensaje. Renovarlo deja sin acceso al enlace anterior.</p><a href={privateLink} target="_blank" rel="noreferrer" className="admin-secondary btn-touch">Ver estado del cliente</a></>}
                </details>
              </section>

              {/* BLOQUE 3: Acciones rápidas y Agenda */}
              <div className="detail-block block-actions">
                <h3>Seguimiento</h3>

                <div className="chef-actions-bar">
                  {onEvent && (
                    <button
                      type="button"
                      className="admin-primary btn-touch-lg"
                      disabled={working}
                      onClick={() => { if (!hasUnsaved || window.confirm('Hay seguimiento sin guardar. ¿Abrir la propuesta sin guardarlo?')) onEvent(detail.id); }}
                    >
                      <Calendar size={18} />
                      <span>Preparar propuesta</span>
                    </button>
                  )}
                  <button type="button" disabled={working} className="admin-secondary btn-touch" onClick={() => followupNote.current?.focus()}>Registrar seguimiento</button>
                </div>

                <label className="quick-status-panel attention-state">
                  <span>Estado de atención</span>
                  <select aria-label="Estado de atención" value={form.status} disabled={working} onChange={e => void quickSaveStatus(e.target.value as SalesStatus)}>
                    {Object.entries(STATUS_MAP).map(([status, value]) => <option key={status} value={status}>{value.label}</option>)}
                  </select>
                </label>

                {/* Nota interna y seguimiento */}
                <form className="followup-form" onSubmit={saveFollowup}>
                  <fieldset disabled={working}>
                    <label>
                      <span>Añadir nota interna (solo para Carlos y Karen Ascencio):</span>
                      <textarea
                        ref={followupNote}
                        aria-label="Nota de seguimiento"
                        rows={2}
                        maxLength={4000}
                        placeholder="Ej. Prefieren mariscos el primer día, pendiente acordar horario…"
                        value={note}
                        onChange={e => { setNote(e.target.value); setDirty(true); }}
                      />
                    </label>
                    <details className="followup-planning">
                      <summary>Responsable y próximo contacto</summary>
                      <label><span>Responsable</span><select aria-label="Responsable" value={form.assigneeId ?? ''} onChange={e => {setForm({...form,assigneeId:e.target.value?Number(e.target.value):null});setDirty(true);}}><option value="">Sin asignar</option>{staff.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
                      <label><span>Próxima acción</span><input maxLength={500} value={form.nextAction} onChange={e=>{setForm({...form,nextAction:e.target.value});setDirty(true);}} /></label>
                      <label><span>Fecha de seguimiento</span><input type="date" value={form.nextDate} onChange={e=>{setForm({...form,nextDate:e.target.value});setDirty(true);}} /></label>
                    </details>

                    <div className="followup-form-footer">
                      <button className="admin-secondary btn-touch" type="submit" disabled={!dirty || working}>
                        {busy ? 'Guardando…' : 'Guardar seguimiento'}
                      </button>
                    </div>
                  </fieldset>
                </form>
              </div>

              {/* DETALLES TÉCNICOS COLAPSADOS (Cerrados por defecto) */}
              <details className="inbox-tech-details">
                <summary>
                  <span>Historial y comprobante</span>
                  <ChevronDown size={16} />
                </summary>

                <div className="tech-details-body">
                  <div className="tech-metadata-grid">
                    <div><strong>Folio interno:</strong> <code>{detail.folio}</code></div>
                    <div><strong>Recibida:</strong> {dateTime(detail.createdAt)}</div>
                    <div><strong>Responsable:</strong> {detail.followup.assigneeId ? (staff.find(s => s.id === detail.followup.assigneeId)?.name ?? 'Inactivo') : 'Sin asignar'}</div>
                  </div>

                  {isItineraryEstimate(detail.estimate) ? (
                    <Receipt receipt={{ folio: detail.folio, createdAt: detail.createdAt, estimate: detail.estimate, contact: detail.contact }} />
                  ) : (
                    <Receipt receipt={{ folio: detail.folio, createdAt: detail.createdAt, estimate: detail.estimate, contact: detail.contact }} />
                  )}

                  {detail.activity.length > 0 && (
                    <div className="tech-activity-list">
                      <h4>Historial de cambios internos</h4>
                      {detail.activity.map(entry => (
                        <div key={entry.id} className="tech-activity-item">
                          <small>{dateTime(entry.createdAt)} · {entry.actorName}</small>
                          <p>{entry.change.kind==='availability'&&entry.change.decision?AVAILABILITY_LABELS[entry.change.decision.status]:entry.change.kind==='tracking-link'?'Enlace privado renovado':`${SALES_STATUSES[entry.change.before.status]} → ${SALES_STATUSES[entry.change.after.status]}`}</p>
                          {entry.change.note && <p className="activity-note">"{entry.change.note}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
