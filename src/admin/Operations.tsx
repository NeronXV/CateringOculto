import {useEffect,useState} from 'react';
import {blankEvent,EVENT_STATUS,type EventData,type OperationEvent,type EventStatus} from '../types/operations';
import {formatMXNCents} from '../utils/formatters';
import './Operations.css';
import {Availability} from '../components/cotizador/Availability';
import {whatsAppDigits} from '../utils/contactPhone';
export async function opsApi(path:string,body?:unknown){const r=await fetch('/api/local-editor/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);const d=await r.json();if(!r.ok)throw new Error(d.error || 'No se pudo completar la operación.');return d;}
function cents(value:string):number|null {if(!value.trim())return null;if(!/^\d{1,7}(\.\d{0,2})?$/.test(value))throw new Error('Escribe un importe en pesos con hasta dos decimales.');const [whole,decimal='']=value.split('.');return Number(whole)*100+Number(decimal.padEnd(2,'0'));}
const localTime=(value:string)=>{if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export default function Operations({quoteId}:{quoteId:string|null}) {
  const [month,setMonth]=useState(new Date().toLocaleDateString('en-CA').slice(0,7)),[items,setItems]=useState<OperationEvent[]>([]),[selected,setSelected]=useState<any>(null);
  const [data,setData]=useState<EventData>(blankEvent()),[source,setSource]=useState<string|null>(null),[total,setTotal]=useState(''),[deposit,setDeposit]=useState('0'),[link,setLink]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[dirty,setDirty]=useState(false);
  const load=async()=>setItems(await opsApi('events?month='+month));
  useEffect(()=>{void load().catch(e=>setError(e.message));},[month]);
  const setForm=(e:any)=>{setSelected(e);setData(e.data);setSource(e.quoteId);setTotal(e.data.totalCents===null?'':String(e.data.totalCents/100));setDeposit(String(e.data.depositCents/100));setDirty(false);setLink('');};
  useEffect(()=>{if(!quoteId)return;setBusy(true);void opsApi('inbox/'+quoteId).then(q=>{
    const d=blankEvent(q.eventDate);d.name=q.contact.name;d.phone=q.contact.phone;d.guests=q.guests;d.proposal=[q.estimate.breakdown.selectedPackage?.name,...(q.estimate.breakdown.dishSummary ?? []).map((v:any)=>v.group+': '+v.name)].filter(Boolean).join('\n');
    d.internalNotes=[q.contact.dietaryRestrictions,q.contact.additionalNotes].filter(Boolean).join('\n');setForm({data:d,quoteId,id:null,folio:q.folio});setMonth(q.eventDate.slice(0,7));setDirty(true);
  }).catch(e=>setError(e.message)).finally(()=>setBusy(false));},[quoteId]);
  useEffect(()=>{if(!dirty)return;const guard=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[dirty]);
  const patch=(p:Partial<EventData>)=>{setData(d=>({...d,...p}));setDirty(true);setMessage('');};
  const open=async(id:string)=>{if(dirty && !confirm('Hay cambios sin guardar. ¿Descartarlos?'))return;setBusy(true);setError('');try{setForm(await opsApi('events/'+id));}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const save=async(publish=false)=>{setBusy(true);setError('');setMessage('');try{
    const final={...data,totalCents:cents(total),depositCents:cents(deposit) ?? 0};
    if(!selected?.id){if(publish)throw new Error('Guarda primero la ficha.');const result=await opsApi('events',{data:final,quoteId:source});setForm(await opsApi('events/'+result.id));}
    else {await opsApi('events/'+selected.id,{revision:selected.revision,data:final,publish});setForm(await opsApi('events/'+selected.id));}
    setMessage(publish?'Propuesta publicada para el cliente.':'Ficha guardada.');if(month!==final.date.slice(0,7))setMonth(final.date.slice(0,7));else await load();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const newEvent=()=>{if(dirty && !confirm('Hay cambios sin guardar. ¿Descartarlos?'))return;setForm({id:null,data:blankEvent(month+'-01'),quoteId:null,folio:'Evento recibido por WhatsApp o teléfono'});};
  const wa=()=>`https://wa.me/${whatsAppDigits(data.phone)}?text=${encodeURIComponent(`Hola ${data.name}, te compartimos el seguimiento de tu evento en Catering Oculto: ${link}. Revisaremos los acuerdos y el pago directamente por WhatsApp.`)}`;
  return <main className="operations"><h1>Agenda y eventos</h1><p>Carlos y Karen · Una agenda compartida, un evento por día. Los apartados vencidos liberan disponibilidad automáticamente.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
    <div className="operations-actions"><label>Mes de la agenda<input type="month" value={month} onInput={e=>setMonth(e.currentTarget.value)} onChange={e=>setMonth(e.target.value)}/></label><button className="admin-secondary" disabled={busy} onClick={newEvent}>Registrar evento o bloqueo</button><button className="admin-secondary" disabled={busy} onClick={()=>void load().catch(e=>setError(e.message))}>Actualizar agenda</button></div>
    <div className="operations-layout"><section aria-label="Eventos del mes"><h2>Agenda del mes</h2><Availability key={month+items.map(e=>e.revision).join('-')} date={month+'-01'} onSelect={date=>patch({date})}/>{!items.length && <p>No hay eventos registrados este mes.</p>}{items.map(e=><button className="event-card" key={e.id} onClick={()=>void open(e.id)} disabled={busy}><strong>{e.data.date} · {e.data.name || 'Descanso / bloqueo'}</strong><span>{EVENT_STATUS[e.data.status]}{e.data.status==='hold' && Date.parse(e.data.holdUntil)<=Date.now()?' · Vencido':''}</span><small>{e.folio} · {e.data.tasks.filter(t=>!t.done).length} tareas pendientes</small>{e.data.status==='hold' && <small>Vence: {new Date(e.data.holdUntil).toLocaleString('es-MX')}</small>}</button>)}</section>
    <section aria-label="Ficha del evento"><h2>{selected?.id?'Ficha operativa':'Nuevo evento'}</h2><p>{selected?.folio || 'Registra también los eventos recibidos fuera de la página.'}</p>
      <form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy}><div className="operations-fields">
        <label>Fecha del evento<input type="date" required value={data.date} onInput={e=>patch({date:e.currentTarget.value})} onChange={e=>patch({date:e.target.value})}/></label>
        <label>Estado del evento<select value={data.status} onChange={e=>patch({status:e.target.value as EventStatus})}>{Object.entries(EVENT_STATUS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label>Vencimiento del apartado<input type="datetime-local" value={localTime(data.holdUntil)} onInput={e=>patch({holdUntil:e.currentTarget.value?new Date(e.currentTarget.value).toISOString():''})} onChange={e=>patch({holdUntil:e.target.value?new Date(e.target.value).toISOString():''})}/></label>
        <label>Nombre del cliente<input maxLength={100} required={data.status!=='blocked'} value={data.name} onChange={e=>patch({name:e.target.value})}/></label>
        <label>Teléfono del cliente<input type="tel" maxLength={30} value={data.phone} onChange={e=>patch({phone:e.target.value})}/></label>
        <label>Invitados<input type="number" min={1} max={150} required value={data.guests} onChange={e=>patch({guests:Number(e.target.value)})}/></label>
        <label>Importe final acordado (MXN)<input inputMode="decimal" value={total} onChange={e=>{setTotal(e.target.value);patch({paymentVerified:false});}} placeholder="Pendiente de acordar"/></label>
        <label>Anticipo recibido (MXN)<input inputMode="decimal" value={deposit} onChange={e=>{setDeposit(e.target.value);patch({paymentVerified:false});}}/></label>
      </div><label className="operation-check"><input type="checkbox" checked={data.paymentVerified} onChange={e=>patch({paymentVerified:e.target.checked})}/>He verificado el anticipo recibido fuera de la página</label>
      <label>Dirección y logística interna<textarea maxLength={1000} value={data.address} onChange={e=>patch({address:e.target.value})}/></label>
      <label>Horarios del servicio (visibles al publicar)<textarea maxLength={500} value={data.schedule} onChange={e=>patch({schedule:e.target.value})}/></label>
      <label>Propuesta final: menú, servicios y alcance<textarea rows={6} maxLength={8000} value={data.proposal} onChange={e=>patch({proposal:e.target.value})}/></label>
      <label>Condiciones y notas para el cliente<textarea rows={3} maxLength={4000} value={data.publicNotes} onChange={e=>patch({publicNotes:e.target.value})}/></label>
      <label>Notas internas de preparación<textarea rows={3} maxLength={8000} value={data.internalNotes} onChange={e=>patch({internalNotes:e.target.value})}/></label>
      <h3>Preparación del evento</h3>{data.tasks.map(t=><div className="operation-task" key={t.id}><label className="operation-check"><input type="checkbox" checked={t.done} onChange={e=>patch({tasks:data.tasks.map(x=>x.id===t.id?{...x,done:e.target.checked}:x)})}/><span>{t.text}</span></label><button type="button" className="admin-secondary" onClick={()=>patch({tasks:data.tasks.filter(x=>x.id!==t.id)})}>Retirar tarea</button></div>)}
      <button type="button" className="admin-secondary" onClick={()=>{const text=prompt('¿Qué falta preparar?');if(text?.trim())patch({tasks:[...data.tasks,{id:crypto.randomUUID(),text:text.trim(),done:false}]});}}>Añadir tarea</button>
      <p>El pago se acuerda por WhatsApp. La confirmación requiere propuesta publicada, importe final y anticipo verificado. Guardar una ficha en revisión no bloquea el día.</p>
      <div className="operations-actions"><button className="admin-primary" type="submit">{busy?'Guardando…':'Guardar ficha'}</button>{selected?.id && <><button className="admin-secondary" type="button" onClick={()=>void save(true)}>Guardar y publicar propuesta final</button><button type="button" className="admin-secondary" onClick={()=>void open(selected.id)}>Recargar ficha</button></>}</div>
      </fieldset></form>
      {selected?.id && <section><h3>Seguimiento privado del cliente</h3><p>Quien tenga el enlace podrá consultar el estado y la última propuesta publicada. Generar otro enlace invalida el anterior. Guarda la ficha antes de compartir.</p><button className="admin-secondary" disabled={busy || dirty} onClick={async()=>{setBusy(true);setError('');try{const result=await opsApi('events/'+selected.id+'/link',{revision:selected.revision});setSelected(await opsApi('events/'+selected.id));setLink(location.origin+'/seguimiento#'+result.token);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Generar o reemplazar enlace privado</button>{link && <><label>Enlace para compartir<input readOnly value={link}/></label><a className="admin-secondary" href={link} target="_blank" rel="noreferrer">Ver seguimiento</a>{data.phone && <a className="admin-secondary" href={wa()} target="_blank" rel="noreferrer">Preparar WhatsApp con enlace</a>}</>}</section>}
      {selected?.proposals?.length>0 && <details><summary>Propuestas publicadas ({selected.proposals.length})</summary>{selected.proposals.map((p:any)=><article key={p.version}><h3>Versión {p.version} · {p.date}</h3><p className="operation-text">{p.proposal}</p><p>{formatMXNCents(p.totalCents)} MXN</p></article>)}</details>}
      {data.phone && <details><summary>Respuestas preparadas para WhatsApp</summary><p>Abre el mensaje y revísalo antes de enviarlo.</p>{[
        ['Confirmar datos',`Hola ${data.name}, para cerrar tu propuesta del ${data.date}, ¿nos confirmas dirección, número de invitados y necesidades de tu evento?`],
        ['Proponer otra fecha',`Hola ${data.name}, revisamos tu solicitud. Podemos buscar una fecha alternativa contigo. ¿Qué otros días te funcionarían?`],
        ['Seguimiento del anticipo',`Hola ${data.name}, damos seguimiento al anticipo de tu evento del ${data.date}. Confírmanos por aquí el pago acordado para que podamos verificarlo.`],
        ['Revisar la propuesta',`Hola ${data.name}, ya tenemos tu propuesta de Catering Oculto. Revisemos juntos el menú, los horarios y las condiciones antes de confirmar.`]
      ].map(([title,text])=><a key={title} className="admin-secondary" href={`https://wa.me/${whatsAppDigits(data.phone)}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">{title}</a>)}</details>}
      {selected?.activity?.length>0 && <details><summary>Historial interno</summary>{selected.activity.map((a:any,i:number)=><p key={i}>{a.actor} · {a.action} · {new Date(a.createdAt).toLocaleString('es-MX')}</p>)}</details>}
    </section></div></main>;
}
