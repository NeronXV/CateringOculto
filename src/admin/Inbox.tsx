import { useEffect, useRef, useState } from 'react';
import { SALES_STATUSES, type Followup, type InboxDetail, type InboxItem, type StaffOption, type SalesStatus } from '../types/inbox';
import './Inbox.css';
import { EVENT_TYPES } from '../config/packages';
import { whatsAppDigits } from '../utils/contactPhone';
import { Receipt } from '../components/cotizador/Receipt';
import { MEAL_LABELS, isItineraryEstimate } from '../types/itinerary';
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
  en_revision: { label: 'En conversación', badgeClass: 'status-progress', dot: '🟡' },
  cerrada: { label: 'Archivada', badgeClass: 'status-closed', dot: '⚪' }
};

export default function Inbox({ onEvent }: { onEvent?: (id: string) => void } = {}) {
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
  const [dirty, setDirty] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    setItems([]);
    Promise.all([
      api('?' + new URLSearchParams({ ...filter, page: String(page) })),
      api('/staff')
    ])
      .then(([list, people]) => {
        if (current) {
          setItems(list.items);
          setTotal(list.total);
          setStaff(people);
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
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const load = async (id: string) => {
    if (dirty && !window.confirm('Hay notas sin guardar. ¿Descartar y abrir la solicitud?')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api('/' + id);
      setDetail(result);
      setForm(result.followup);
      setNote('');
      setDirty(false);
      requestAnimationFrame(() => heading.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la solicitud.');
    } finally {
      setBusy(false);
    }
  };



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
          <p>Revisa solicitudes nuevas, responde directamente por WhatsApp y pasa eventos confirmados a la agenda.</p>
        </div>
      </header>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {message && <div className="admin-success" role="status"><Check size={16} /> {message}</div>}

      {/* Filtros rápidos */}
      <form className="inbox-filters-bar" onSubmit={e => { e.preventDefault(); setPage(1); setFilter({ q: search, status }); }}>
        <input
          type="text"
          placeholder="Buscar por nombre o comensales…"
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
                  className={`inbox-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => void load(row.id)}
                >
                  <div className="inbox-card-top">
                    <div>
                      <strong className="inbox-card-name">{row.name}</strong>
                      <span className="inbox-card-guests">👥 {row.guests} comensales</span>
                    </div>
                    <span className={`inbox-status-pill ${st.badgeClass}`}>
                      {st.dot} {st.label}
                    </span>
                  </div>

                  <div className="inbox-card-dates">
                    <Calendar size={14} className="icon-gold" />
                    <span>Fecha: <strong>{row.eventDate}</strong></span>
                  </div>

                  <div className="inbox-card-actions">
                    <button
                      type="button"
                      className="admin-secondary btn-touch"
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
        <section className="inbox-detail-column" aria-label="Detalle de solicitud" aria-busy={busy}>
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
                    <span className="block-guests-tag">👥 {detail.guests} personas</span>
                  </div>
                  <div className="block-client-buttons">
                    <a
                      className="btn-whatsapp-prominent"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://wa.me/${whatsAppDigits(detail.contact.phone)}?text=${encodeURIComponent(`Hola ${detail.contact.name}, te contactamos Carlos y Karen Ascencio de Catering Oculto sobre tu solicitud de servicio.`)}`}
                    >
                      <MessageCircle size={18} />
                      <span>Abrir WhatsApp</span>
                    </a>

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
              </div>

              {/* BLOQUE 2: Servicio e Itinerario */}
              <div className="detail-block block-services">
                <h3>Itinerario y servicios solicitados</h3>

                {isItineraryEstimate(detail.estimate) ? (() => {
                  const itin = detail.estimate;
                  return (
                    <div className="itinerary-summary-box">
                      <div className="itinerary-metrics">
                        <span>📅 {itin.summary.dayCount} días</span>
                        <span>🍽️ {itin.summary.serviceCount} servicios en total</span>
                      </div>

                      <div className="itinerary-days-list">
                        {itin.selection.days.map(d => (
                          <div key={d.date} className="itinerary-day-row">
                            <span className="day-date">{d.date}</span>
                            <div className="day-meals">
                              {d.services.map(s => (
                                <span key={s} className="meal-tag">{MEAL_LABELS[s]}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })() : (() => {
                  const legacy = detail.estimate;
                  return (
                    <div className="legacy-summary-box">
                      <p><strong>Evento:</strong> {EVENT_TYPES.find(t => t.id === legacy.selection.eventType)?.name ?? 'Evento'} · {detail.eventDate}</p>
                      <p><strong>Menú:</strong> {legacy.breakdown.selectedPackage?.name}</p>
                    </div>
                  );
                })()}

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
                  <p className="dietary-ok-note">✓ Sin restricciones alimentarias reportadas.</p>
                )}

                {/* Notas adicionales */}
                {detail.contact.additionalNotes && (
                  <div className="client-notes-box">
                    <strong>Notas del cliente:</strong>
                    <p>{detail.contact.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* BLOQUE 3: Acciones rápidas y Agenda */}
              <div className="detail-block block-actions">
                <h3>Acciones del Chef</h3>

                <div className="chef-actions-bar">
                  {onEvent && (
                    <button
                      type="button"
                      className="admin-primary btn-touch-lg"
                      onClick={() => onEvent(detail.id)}
                    >
                      <Calendar size={18} />
                      <span>Pasar a Agenda / Bloquear fecha</span>
                    </button>
                  )}
                </div>

                {/* Cambio rápido de estado */}
                <div className="quick-status-panel">
                  <span>Estado actual: <strong>{STATUS_MAP[form.status]?.label || form.status}</strong></span>
                  <div className="status-quick-buttons">
                    <button
                      type="button"
                      className={`btn-status-pill ${form.status === 'nueva' ? 'active' : ''}`}
                      onClick={() => void quickSaveStatus('nueva')}
                    >
                      🔴 Nueva
                    </button>
                    <button
                      type="button"
                      className={`btn-status-pill ${form.status === 'contactada' ? 'active' : ''}`}
                      onClick={() => void quickSaveStatus('contactada')}
                    >
                      🟡 En conversación
                    </button>
                    <button
                      type="button"
                      className={`btn-status-pill ${form.status === 'cerrada' ? 'active' : ''}`}
                      onClick={() => void quickSaveStatus('cerrada')}
                    >
                      ⚪ Archivada
                    </button>
                  </div>
                </div>

                {/* Nota interna y seguimiento */}
                <form className="followup-form" onSubmit={saveFollowup}>
                  <fieldset disabled={busy}>
                    <label>
                      <span>Añadir nota interna (solo para Carlos y Karen Ascencio):</span>
                      <textarea
                        rows={2}
                        maxLength={4000}
                        placeholder="Ej. Prefieren mariscos el primer día, pendiente acordar horario…"
                        value={note}
                        onChange={e => { setNote(e.target.value); setDirty(true); }}
                      />
                    </label>

                    <div className="followup-form-footer">
                      <button className="admin-secondary btn-touch" type="submit" disabled={!dirty || busy}>
                        {busy ? 'Guardando…' : 'Guardar nota'}
                      </button>
                    </div>
                  </fieldset>
                </form>
              </div>

              {/* DETALLES TÉCNICOS COLAPSADOS (Cerrados por defecto) */}
              <details className="inbox-tech-details">
                <summary>
                  <span>Detalles técnicos, recibo y auditoría</span>
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
                          <p>{SALES_STATUSES[entry.change.before.status]} → {SALES_STATUSES[entry.change.after.status]}</p>
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
