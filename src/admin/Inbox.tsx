import { useEffect, useRef, useState } from 'react';
import { SALES_STATUSES, type Followup, type InboxDetail, type InboxItem, type StaffOption } from '../types/inbox';
import './Inbox.css';
import { EVENT_TYPES } from '../config/packages';
import { Qualification } from '../components/cotizador/Qualification';
import {whatsAppDigits} from '../utils/contactPhone';
import {Receipt} from '../components/cotizador/Receipt';

async function api(path:string,body?:unknown) {
  const response=await fetch(`/api/local-editor/inbox${path}`,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
  const result=await response.json();
  if(!response.ok)throw new Error(result.error ?? 'No se pudo completar la operación.');
  return result;
}
const money=(cents:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cents/100);
const dateTime=(value:string)=>new Date(value).toLocaleString('es-MX');
export default function Inbox({onEvent}:{onEvent?:(id:string)=>void}={}) {
  const [items,setItems]=useState<InboxItem[]>([]),[staff,setStaff]=useState<StaffOption[]>([]);
  const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(1),[total,setTotal]=useState(0);
  const [filter,setFilter]=useState({q:'',status:''}),[refresh,setRefresh]=useState(0);
  const [detail,setDetail]=useState<InboxDetail|null>(null),[form,setForm]=useState<Followup|null>(null),[note,setNote]=useState('');
  const [error,setError]=useState(''),[message,setMessage]=useState(''),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
  const [dirty,setDirty]=useState(false);
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{let current=true;setLoading(true);setError('');setItems([]);
    Promise.all([api('?'+new URLSearchParams({...filter,page:String(page)})),api('/staff')]).then(([list,people])=>{if(current){setItems(list.items);setTotal(list.total);setStaff(people);}}).catch(err=>{if(current)setError(err.message);}).finally(()=>{if(current)setLoading(false);});
    return ()=>{current=false;};
  },[filter,page,refresh]);
  useEffect(()=>{if(!dirty)return;const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();};window.addEventListener('beforeunload',guard);return ()=>window.removeEventListener('beforeunload',guard);},[dirty]);
  const load=async(id:string)=>{
    if(dirty && !window.confirm('Hay cambios sin guardar. ¿Descartarlos y abrir el detalle actualizado?'))return;
    setBusy(true);setError('');setMessage('');
    try {const result=await api('/'+id);setDetail(result);setForm(result.followup);setNote('');setDirty(false);requestAnimationFrame(()=>heading.current?.focus());}
    catch(err){setError(err instanceof Error?err.message:'No se pudo abrir la solicitud.');}
    finally{setBusy(false);}
  };
  const change=(patch:Partial<Followup>)=>{setForm(current=>current?{...current,...patch}:current);setDirty(true);setMessage('');};
  return <main className="inbox"><header><a href="/">← Restaurante</a><p>ATENCIÓN COMERCIAL</p><h1>Solicitudes</h1><p>Revisa el evento y registra el siguiente paso. Una solicitud o cambio de estado no confirma una reserva.</p></header>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
    <form className="inbox-filters" onSubmit={event=>{event.preventDefault();setPage(1);setFilter({q:search,status});}}>
      <label>Buscar por nombre o folio<input value={search} maxLength={100} onChange={e=>setSearch(e.target.value)}/></label>
      <label>Estado<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos</option>{Object.entries(SALES_STATUSES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      <button className="admin-primary" disabled={loading}>Buscar</button><button type="button" className="admin-secondary" disabled={loading} onClick={()=>setRefresh(x=>x+1)}>Actualizar lista</button>
    </form>
    <div className="inbox-layout"><section aria-label="Listado de solicitudes" aria-busy={loading}>
      <p role="status">{loading?'Cargando solicitudes…':`${total} solicitudes · Página ${page}`}</p>
      {!loading && !items.length && <p>No hay solicitudes para estos filtros.</p>}
      <div className="inbox-list">{items.map(row=><button type="button" className="inbox-row" key={row.id} disabled={busy} aria-pressed={detail?.id===row.id} onClick={()=>void load(row.id)}><strong>{row.name}</strong><span>{SALES_STATUSES[row.followup.status]} · {row.eventDate} · {row.guests} invitados</span><span>{money(row.totalCents)} · estimado parcial</span><small>{row.folio}</small><small>{row.followup.assigneeId?staff.find(s=>s.id===row.followup.assigneeId)?.name ?? 'Responsable inactivo':'Sin responsable'}{row.followup.nextDate?` · Seguimiento: ${row.followup.nextDate}`:''}</small></button>)}</div>
      <nav className="inbox-pagination" aria-label="Páginas"><button disabled={loading || page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button><button disabled={loading || page*20>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button></nav>
    </section><section className="inbox-detail" aria-label="Detalle de solicitud" aria-busy={busy}>
      {!detail || !form ? <p>Selecciona una solicitud para ver su detalle.</p> : <>
        <h2 ref={heading} tabIndex={-1}>{detail.contact.name}</h2><p className="inbox-folio">{detail.folio}</p><p>Recibida: {dateTime(detail.createdAt)}</p>
        <dl><dt>Teléfono</dt><dd>{detail.contact.phone}</dd><dt>Evento</dt><dd>{EVENT_TYPES.find(type=>type.id===detail.estimate.selection.eventType)?.name ?? 'Evento'} · {detail.eventDate} · {detail.guests} invitados</dd><dt>Menú</dt><dd>{detail.estimate.breakdown.selectedPackage?.name}</dd><dt>Zona</dt><dd>{detail.estimate.breakdown.selectedZone?.name}</dd><dt>Restricciones alimentarias (por revisar)</dt><dd>{detail.contact.dietaryRestrictions || 'Sin información'}</dd><dt>Notas del visitante</dt><dd>{detail.contact.additionalNotes || 'Sin notas'}</dd></dl>
        <h3>Estimado original</h3><p>Menú: {money(detail.estimate.breakdown.menuSubtotalCents)}</p>
        {(detail.estimate.breakdown.dishSummary ?? []).map(d=><p key={d.group}>{d.group}: <strong>{d.name}</strong></p>)}
        <p>IVA: {detail.estimate.breakdown.taxPending!==false?'Por confirmar':money(detail.estimate.breakdown.taxCents ?? 0)}</p>
        <Receipt receipt={{folio:detail.folio,createdAt:detail.createdAt,estimate:detail.estimate,contact:detail.contact}}/>
        <a className="admin-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsAppDigits(detail.contact.phone)}?text=${encodeURIComponent(`Hola ${detail.contact.name}, te contactamos de Catering Oculto sobre tu solicitud ${detail.folio}.`)}`}>Responder por WhatsApp</a>
        {onEvent && <button type="button" className="admin-primary" onClick={()=>onEvent(detail.id)}>Preparar ficha en la agenda</button>}
        <Qualification value={detail.estimate.qualification}/>
        {detail.estimate.breakdown.extrasItemized.map(extra=><p key={extra.id}>{extra.name} · {extra.quantity}: {money(extra.totalCents)}</p>)}
        <p>Traslado: {detail.estimate.breakdown.travelRequiresConfirmation?'Por confirmar':money(detail.estimate.breakdown.travelFeeCents)}</p><p><strong>Total parcial: {money(detail.totalCents)}</strong></p>
        <ul>{detail.estimate.pending.map(p=><li key={p}>{p}</li>)}</ul>
        <form onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');setMessage('');
          try {await api('/'+detail.id,{...form,note});setDirty(false);setNote('');
            // Disable the old revision even if refreshing after the confirmed save fails.
            setForm({...form,revision:form.revision+1});setMessage('Seguimiento guardado.');
            const updated=await api('/'+detail.id);setDetail(updated);setForm(updated.followup);setRefresh(x=>x+1);
          } catch(err){setError(err instanceof Error?err.message:'No se pudo guardar.');}finally{setBusy(false);}
        }}><fieldset disabled={busy}><legend>Seguimiento interno</legend>
          <label>Estado<select value={form.status} onChange={e=>change({status:e.target.value as Followup['status']})}>{Object.entries(SALES_STATUSES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
          <label>Responsable<select value={form.assigneeId ?? ''} onChange={e=>change({assigneeId:e.target.value?Number(e.target.value):null})}><option value="">Sin asignar</option>{form.assigneeId && !staff.some(s=>s.id===form.assigneeId) && <option value={form.assigneeId}>Responsable inactivo · reasignar</option>}{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Próxima acción<input maxLength={500} value={form.nextAction} onChange={e=>change({nextAction:e.target.value})}/></label>
          <label>Fecha de seguimiento<input type="date" value={form.nextDate} onChange={e=>change({nextDate:e.target.value})}/></label>
          <label>Añadir nota interna<textarea rows={4} maxLength={4000} value={note} onChange={e=>{setNote(e.target.value);setDirty(true);setMessage('');}}/></label>
          <small>Las notas quedan en el historial. No se envían al cliente. Cerrada indica fin del seguimiento, no una venta o reserva confirmada.</small>
          <button className="admin-primary" disabled={!dirty}>{busy?'Guardando…':'Guardar seguimiento'}</button><button type="button" className="admin-secondary" onClick={()=>void load(detail.id)}>Recargar detalle</button>
        </fieldset></form>
        <h3>Historial interno</h3>{!detail.activity.length && <p>Aún no hay seguimiento registrado.</p>}
        {detail.activity.map(entry=><article className="inbox-activity" key={entry.id}><strong>{entry.actorName}</strong><small>{dateTime(entry.createdAt)}</small><p>{SALES_STATUSES[entry.change.before.status]} → {SALES_STATUSES[entry.change.after.status]}</p><p>Responsable: {entry.change.after.assigneeId?staff.find(s=>s.id===entry.change.after.assigneeId)?.name ?? `Cuenta ${entry.change.after.assigneeId}`:'Sin asignar'}</p><p>Próxima acción: {entry.change.after.nextAction || 'Sin definir'} {entry.change.after.nextDate}</p>{entry.change.note && <p>{entry.change.note}</p>}</article>)}
      </>}
    </section></div>
  </main>;
}
