import { useEffect, useState } from 'react';
import { blankEvent, EVENT_STATUS, type EventData, type OperationEvent, type EventStatus } from '../types/operations';
import './Operations.css';
import { Availability } from '../components/cotizador/Availability';
import { whatsAppDigits } from '../utils/contactPhone';
import { MessageCircle, Phone, Plus, Trash2, ChevronDown, Check } from 'lucide-react';

export async function opsApi(path: string, body?: unknown) {
  const r = await fetch('/api/local-editor/' + path, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  } : undefined);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'No se pudo completar la operación.');
  return d;
}

function cents(value: string): number | null {
  if (!value.trim()) return null;
  if (!/^\d{1,7}(\.\d{0,2})?$/.test(value)) throw new Error('Escribe un importe en pesos con hasta dos decimales.');
  const [whole, decimal = ''] = value.split('.');
  return Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
}

const localTime = (value: string) => {
  if (!value) return '';
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const HUMAN_EVENT_STATUS: Record<EventStatus, { label: string; badge: string }> = {
  draft: { label: 'En revisión', badge: 'op-status-draft' },
  hold: { label: 'Apartado temporal', badge: 'op-status-hold' },
  confirmed: { label: 'Confirmada', badge: 'op-status-confirmed' },
  blocked: { label: 'Bloqueado / Descanso', badge: 'op-status-blocked' },
  cancelled: { label: 'Cancelado', badge: 'op-status-cancelled' }
};

export default function Operations({ quoteId }: { quoteId: string | null }) {
  const [month, setMonth] = useState(new Date().toLocaleDateString('en-CA').slice(0, 7));
  const [items, setItems] = useState<OperationEvent[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [data, setData] = useState<EventData>(blankEvent());
  const [source, setSource] = useState<string | null>(null);
  const [total, setTotal] = useState('');
  const [deposit, setDeposit] = useState('0');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);

  const load = async () => setItems(await opsApi('events?month=' + month));

  useEffect(() => {
    void load().catch(e => setError(e.message));
  }, [month]);

  const setForm = (e: any) => {
    setSelected(e);
    setData(e.data);
    setSource(e.quoteId);
    setTotal(e.data.totalCents === null ? '' : String(e.data.totalCents / 100));
    setDeposit(String(e.data.depositCents / 100));
    setDirty(false);
    setLink('');
  };

  useEffect(() => {
    if (!quoteId) return;
    setBusy(true);
    void opsApi('inbox/' + quoteId)
      .then(q => {
        const isItinerary = q.estimate?.kind === 'itinerary';
        const mainDate = isItinerary ? (q.estimate.summary?.startDate || q.estimate.selection?.days?.[0]?.date || q.eventDate) : q.eventDate;
        const d = blankEvent(mainDate);
        d.name = q.contact.name;
        d.phone = q.contact.phone;
        d.guests = q.guests;
        if (isItinerary) {
          d.proposal = [
            `Itinerario (${q.estimate.summary?.dayCount || 0} días):`,
            ...(q.estimate.selection?.days || []).map((day: any) => `• ${day.date}: ${day.services.join(', ')}`)
          ].join('\n');
        } else {
          d.proposal = [q.estimate?.breakdown?.selectedPackage?.name, ...(q.estimate?.breakdown?.dishSummary ?? []).map((v: any) => v.group + ': ' + v.name)].filter(Boolean).join('\n');
        }
        d.internalNotes = [q.contact.dietaryRestrictions, q.contact.additionalNotes].filter(Boolean).join('\n');
        setForm({ data: d, quoteId, id: null, folio: q.folio });
        setMonth(mainDate.slice(0, 7));
        setDirty(true);
      })
      .catch(e => setError(e.message))
      .finally(() => setBusy(false));
  }, [quoteId]);

  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const patch = (p: Partial<EventData>) => {
    setData(d => ({ ...d, ...p }));
    setDirty(true);
    setMessage('');
  };

  const open = async (id: string) => {
    if (dirty && !confirm('Hay cambios sin guardar. ¿Descartarlos?')) return;
    setBusy(true);
    setError('');
    try {
      setForm(await opsApi('events/' + id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (publish = false) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const final = { ...data, totalCents: cents(total), depositCents: cents(deposit) ?? 0 };
      if (!selected?.id) {
        if (publish) throw new Error('Guarda primero la ficha.');
        const result = await opsApi('events', { data: final, quoteId: source });
        setForm(await opsApi('events/' + result.id));
      } else {
        await opsApi('events/' + selected.id, { revision: selected.revision, data: final, publish });
        setForm(await opsApi('events/' + selected.id));
      }
      setMessage(publish ? 'Propuesta publicada y lista para compartir.' : 'Ficha guardada correctamente.');
      if (month !== final.date.slice(0, 7)) setMonth(final.date.slice(0, 7));
      else await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const newEvent = () => {
    if (dirty && !confirm('Hay cambios sin guardar. ¿Descartarlos?')) return;
    setForm({ id: null, data: blankEvent(month + '-01'), quoteId: null, folio: 'Evento directo / externo' });
  };

  const wa = () => `https://wa.me/${whatsAppDigits(data.phone)}?text=${encodeURIComponent(`Hola ${data.name}, te compartimos el seguimiento de tu evento en Catering Oculto: ${link}. Revisaremos los acuerdos directamente por aquí.`)}`;

  return (
    <main className="operations">
      <header className="operations-header">
        <div>
          <span className="operations-eyebrow">AGENDA OPERATIVA</span>
          <h1>Agenda y calendario de eventos</h1>
          <p>Carlos y Karen · Un evento principal por día. Revisa disponibilidad, estancias e información para la cocina.</p>
        </div>
      </header>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {message && <div className="admin-success" role="status"><Check size={16} /> {message}</div>}

      <div className="operations-actions-bar">
        <label className="month-picker-label">
          <span>Mes:</span>
          <input
            type="month"
            value={month}
            onInput={e => setMonth(e.currentTarget.value)}
            onChange={e => setMonth(e.target.value)}
          />
        </label>
        <button className="admin-primary btn-touch" disabled={busy} onClick={newEvent}>
          <Plus size={16} /> Registrar evento o bloqueo
        </button>
        <button className="admin-secondary btn-touch" disabled={busy} onClick={() => void load().catch(e => setError(e.message))}>
          Actualizar calendario
        </button>
      </div>

      <div className="operations-layout">
        {/* COLUMNA IZQUIERDA: Calendario y lista de eventos */}
        <section className="operations-sidebar" aria-label="Eventos del mes">
          <div className="calendar-card-wrap">
            <h2>Disponibilidad del mes</h2>
            <Availability key={month + items.map(e => e.revision).join('-')} date={month + '-01'} onSelect={date => patch({ date })} />
          </div>

          <div className="events-month-list">
            <h3>Eventos programados ({items.length})</h3>
            {!items.length && <p className="no-events-hint">No hay eventos registrados este mes.</p>}
            {items.map(e => {
              const st = HUMAN_EVENT_STATUS[e.data.status] || { label: e.data.status, badge: 'op-status-draft' };
              const isSelected = selected?.id === e.id;

              return (
                <button
                  type="button"
                  className={`event-card ${isSelected ? 'selected' : ''}`}
                  key={e.id}
                  onClick={() => void open(e.id)}
                  disabled={busy}
                >
                  <div className="event-card-top">
                    <strong>{e.data.date} · {e.data.name || 'Bloqueo / Descanso'}</strong>
                    <span className={`op-badge ${st.badge}`}>{st.label}</span>
                  </div>
                  <div className="event-card-meta">
                    <span>👥 {e.data.guests} comensales</span>
                    <span>✓ {e.data.tasks.filter(t => !t.done).length} pendientes</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* COLUMNA DERECHA: Ficha operativa */}
        <section className="operations-form-sheet" aria-label="Ficha del evento">
          <div className="form-sheet-header">
            <div>
              <h2>{selected?.id ? `Ficha de ${data.name || 'Evento'}` : 'Nueva ficha operativa'}</h2>
              <span className="sheet-folio">{selected?.folio || 'Registra un evento recibido fuera de la página'}</span>
            </div>
          </div>

          {/* WhatsApp Directo y Plantillas Rápidas */}
          {data.phone && (
            <div className="quick-wa-panel">
              <div className="quick-wa-header">
                <div className="wa-contact-info">
                  <a
                    className="btn-whatsapp-prominent"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://wa.me/${whatsAppDigits(data.phone)}?text=${encodeURIComponent(`Hola ${data.name}, te contactamos Carlos y Karen de Catering Oculto sobre tu evento del ${data.date}.`)}`}
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp con {data.name}</span>
                  </a>

                  <a className="btn-call-touch" href={`tel:${data.phone}`}>
                    <Phone size={14} />
                    <span>{data.phone}</span>
                  </a>
                </div>
              </div>

              <div className="wa-quick-templates">
                <span>Mensajes rápidos para WhatsApp:</span>
                <div className="templates-chips">
                  {[
                    ['Confirmar datos', `Hola ${data.name}, para cerrar tu propuesta del ${data.date}, ¿nos confirmas dirección, número de invitados y requerimientos de tu evento?`],
                    ['Proponer otra fecha', `Hola ${data.name}, revisamos tu solicitud. ¿Qué otros días te funcionarían en caso de ajustar la fecha?`],
                    ['Seguimiento de anticipo', `Hola ${data.name}, damos seguimiento al anticipo de tu evento del ${data.date}. Confírmanos por aquí cuando quede listo.`],
                    ['Revisar propuesta', `Hola ${data.name}, ya tenemos tu propuesta de Catering Oculto. Revisemos juntos el menú y horarios antes de confirmar.`]
                  ].map(([title, text]) => (
                    <a
                      key={title}
                      className="template-chip"
                      href={`https://wa.me/${whatsAppDigits(data.phone)}?text=${encodeURIComponent(text)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); void save(); }}>
            <fieldset disabled={busy}>
              {/* BLOQUE 1: Datos principales del evento */}
              <div className="op-section-box">
                <h3>1. Información del Evento</h3>
                <div className="operations-fields">
                  <label>
                    <span>Fecha del evento *</span>
                    <input
                      type="date"
                      required
                      value={data.date}
                      onInput={e => patch({ date: e.currentTarget.value })}
                      onChange={e => patch({ date: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>Estado del evento</span>
                    <select value={data.status} onChange={e => patch({ status: e.target.value as EventStatus })}>
                      {Object.entries(EVENT_STATUS).map(([id, label]) => (
                        <option key={id} value={id}>{HUMAN_EVENT_STATUS[id as EventStatus]?.label || label}</option>
                      ))}
                    </select>
                  </label>

                  {data.status === 'hold' && (
                    <label>
                      <span>Vencimiento del apartado</span>
                      <input
                        type="datetime-local"
                        value={localTime(data.holdUntil)}
                        onInput={e => patch({ holdUntil: e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : '' })}
                        onChange={e => patch({ holdUntil: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      />
                    </label>
                  )}

                  <label>
                    <span>Nombre del cliente</span>
                    <input
                      maxLength={100}
                      required={data.status !== 'blocked'}
                      value={data.name}
                      onChange={e => patch({ name: e.target.value })}
                      placeholder="Ej. Alejandra García"
                    />
                  </label>

                  <label>
                    <span>Teléfono</span>
                    <input
                      type="tel"
                      maxLength={30}
                      value={data.phone}
                      onChange={e => patch({ phone: e.target.value })}
                      placeholder="+52 612 000 0000"
                    />
                  </label>

                  <label>
                    <span>Número de comensales *</span>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      required
                      value={data.guests}
                      onChange={e => patch({ guests: Number(e.target.value) })}
                    />
                  </label>

                  <label>
                    <span>Horario de servicio</span>
                    <input
                      maxLength={100}
                      value={data.schedule}
                      onChange={e => patch({ schedule: e.target.value })}
                      placeholder="Ej. Llegada 13:00 · Comida 14:30"
                    />
                  </label>
                </div>

                <label className="full-field">
                  <span>Dirección, villa o locación</span>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={data.address}
                    onChange={e => patch({ address: e.target.value })}
                    placeholder="Villa, privada o condominio donde se cocinará…"
                  />
                </label>
              </div>

              {/* BLOQUE 2: Menú e Itinerario acordado */}
              <div className="op-section-box">
                <h3>2. Menú & Alcance Acordado</h3>
                <label className="full-field">
                  <span>Propuesta de menú / Itinerario acordado:</span>
                  <textarea
                    rows={5}
                    maxLength={8000}
                    value={data.proposal}
                    onChange={e => patch({ proposal: e.target.value })}
                    placeholder="Detalla los tiempos, platillos acordados o fechas del itinerario…"
                  />
                </label>

                <label className="full-field">
                  <span>Notas internas para cocina (alergias, requerimientos del lugar):</span>
                  <textarea
                    rows={2}
                    maxLength={8000}
                    value={data.internalNotes}
                    onChange={e => patch({ internalNotes: e.target.value })}
                    placeholder="Detalles clave para el servicio de Carlos y Karen…"
                  />
                </label>
              </div>

              {/* BLOQUE 3: Tareas de Preparación */}
              <div className="op-section-box">
                <div className="tasks-header">
                  <h3>3. Preparación y Pendientes ({data.tasks.filter(t => !t.done).length} por hacer)</h3>
                  <button
                    type="button"
                    className="admin-secondary btn-touch"
                    onClick={() => {
                      const text = prompt('¿Qué falta preparar?');
                      if (text?.trim()) patch({ tasks: [...data.tasks, { id: crypto.randomUUID(), text: text.trim(), done: false }] });
                    }}
                  >
                    <Plus size={14} /> Añadir tarea
                  </button>
                </div>

                <div className="tasks-list">
                  {data.tasks.map(t => (
                    <div className="task-row" key={t.id}>
                      <label className="task-check">
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={e => patch({ tasks: data.tasks.map(x => x.id === t.id ? { ...x, done: e.target.checked } : x) })}
                        />
                        <span className={t.done ? 'task-done' : ''}>{t.text}</span>
                      </label>
                      <button
                        type="button"
                        className="task-del-btn"
                        onClick={() => patch({ tasks: data.tasks.filter(x => x.id !== t.id) })}
                        title="Eliminar tarea"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE 4: Importe y Anticipo */}
              <div className="op-section-box">
                <h3>4. Presupuesto & Anticipo</h3>
                <div className="operations-fields">
                  <label>
                    <span>Importe total acordado (MXN)</span>
                    <input
                      inputMode="decimal"
                      value={total}
                      onChange={e => { setTotal(e.target.value); patch({ paymentVerified: false }); }}
                      placeholder="Total en pesos"
                    />
                  </label>

                  <label>
                    <span>Anticipo recibido (MXN)</span>
                    <input
                      inputMode="decimal"
                      value={deposit}
                      onChange={e => { setDeposit(e.target.value); patch({ paymentVerified: false }); }}
                      placeholder="Monto de anticipo"
                    />
                  </label>
                </div>

                <label className="verified-check">
                  <input
                    type="checkbox"
                    checked={data.paymentVerified}
                    onChange={e => patch({ paymentVerified: e.target.checked })}
                  />
                  <span>Anticipo verificado en cuenta</span>
                </label>
              </div>

              {/* Botones de Guardado */}
              <div className="op-save-actions">
                <button className="admin-primary btn-touch-lg" type="submit" disabled={busy}>
                  {busy ? 'Guardando…' : 'Guardar ficha de evento'}
                </button>
                {selected?.id && (
                  <button className="admin-secondary btn-touch-lg" type="button" onClick={() => void save(true)} disabled={busy}>
                    Guardar y publicar propuesta para cliente
                  </button>
                )}
              </div>
            </fieldset>
          </form>

          {/* Enlace privado de seguimiento */}
          {selected?.id && (
            <div className="private-link-box">
              <h3>Enlace privado para el cliente</h3>
              <p>Envía este enlace por WhatsApp al cliente para que consulte su menú acordado y estado de servicio.</p>
              <button
                className="admin-secondary btn-touch"
                disabled={busy || dirty}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    const result = await opsApi('events/' + selected.id + '/link', { revision: selected.revision });
                    setSelected(await opsApi('events/' + selected.id));
                    setLink(location.origin + '/seguimiento#' + result.token);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Generar enlace privado
              </button>

              {link && (
                <div className="generated-link-row">
                  <input readOnly value={link} />
                  <a className="admin-secondary btn-touch" href={link} target="_blank" rel="noreferrer">
                    Ver seguimiento
                  </a>
                  {data.phone && (
                    <a className="btn-whatsapp-prominent" href={wa()} target="_blank" rel="noreferrer">
                      Enviar por WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Historial colapsado */}
          {selected?.activity?.length > 0 && (
            <details className="op-history-details">
              <summary>
                <span>Historial de cambios internos</span>
                <ChevronDown size={14} />
              </summary>
              <div className="op-history-body">
                {selected.activity.map((a: any, i: number) => (
                  <p key={i}>{a.actor} · {a.action} · {new Date(a.createdAt).toLocaleString('es-MX')}</p>
                ))}
              </div>
            </details>
          )}
        </section>
      </div>
    </main>
  );
}
