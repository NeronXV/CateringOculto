import { useEffect, useRef, useState } from 'react';
import type { QuoteConfigState } from '../../types';
import { quoteSelection, type QuoteReceipt, type ServerEstimate } from '../../types/quote';
import { formatMXNCents } from '../../utils/formatters';
import { BUSINESS_CONFIG } from '../../config/business';
import { QUOTE_RULES } from '../../config/quoteRules';
import { Qualification } from './Qualification';
import type { CommercialAnswers } from '../../types/quote';
import {SERVICE_SETTINGS} from '../../config/service';
import {receiptText} from '../../utils/receipt';
import {Receipt} from './Receipt';

export function ServerRequest({state,ready,onIncomplete}:{state:QuoteConfigState;ready:boolean;onIncomplete?:()=>void}) {
  const [phone,setPhone]=useState('');
  const [investment,setInvestment]=useState<CommercialAnswers['investment']>('pending');
  const [requirements,setRequirements]=useState<CommercialAnswers['requirements']>('pending');
  const [estimate,setEstimate]=useState<{key:string;value:ServerEstimate}|null>(null);
  const [accepted,setAccepted]=useState('');
  const [receipt,setReceipt]=useState<{key:string;value:QuoteReceipt}|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const selection={...quoteSelection(state),commercial:{investment,requirements,dietaryReview:!!state.dietaryRestrictions.trim()}};
  const selectionKey=JSON.stringify(selection);
  const formKey=JSON.stringify({state,phone,investment,requirements});
  const current=useRef(formKey);current.current=formKey;
  useEffect(()=>{setAccepted('');setError('');},[formKey]);
  const inFlight=useRef(false);
  const attempt=useRef<{payload:string;id:string}|null>(null);
  const activeEstimate=estimate?.key===selectionKey ? estimate.value : null;
  const saved=receipt?.value;
  async function post(route:string,body:unknown) {
    const response=await fetch(`/api/local-editor/quotes/${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error || 'No se pudo completar la solicitud.');
    return result;
  }
  async function calculate() {
    if(!ready){onIncomplete?.();setError('Completa la fecha, el menú y tu nombre antes de revisar.');return;}
    if(inFlight.current)return;
    inFlight.current=true;setBusy(true);setError('');setAccepted('');
    try {
      const value:ServerEstimate=await post('estimate',selection);
      if(current.current===formKey)setEstimate({key:selectionKey,value});
    } catch(e){if(current.current===formKey)setError(e instanceof Error?e.message:'No se pudo calcular.');}
    finally {inFlight.current=false;setBusy(false);}
  }
  async function submit() {
    if(!activeEstimate || accepted!==formKey || inFlight.current)return;
    const payload={selection,contact:{name:state.clientName,phone,dietaryRestrictions:state.dietaryRestrictions,additionalNotes:state.additionalNotes},acceptedVersion:activeEstimate.version,consent:true};
    const encoded=JSON.stringify(payload);
    if(attempt.current?.payload!==encoded)attempt.current={payload:encoded,id:crypto.randomUUID()};
    inFlight.current=true;setBusy(true);setError('');
    try {
      const value:QuoteReceipt=await post('submit',{...payload,idempotencyKey:attempt.current.id});
      // A successful save must stay visible even if the user edited another step while waiting.
      setReceipt({key:formKey,value:{...value,contact:structuredClone(payload.contact)}});
    } catch(e){if(current.current===formKey){setError(e instanceof Error?e.message:'No se pudo guardar. Puedes reintentar.');setAccepted('');}}
    finally {inFlight.current=false;setBusy(false);}
  }
  const message=saved?receiptText(saved):'';
  const wa=saved ? `https://wa.me/${BUSINESS_CONFIG.whatsAppNumberDigits}?text=${encodeURIComponent(message)}` : '';
  const email=saved?.estimate.serviceSnapshot?.contactEmail || SERVICE_SETTINGS.contactEmail;
  const mail=saved && email?`mailto:${email}?subject=${encodeURIComponent(`Solicitud ${saved.folio} · Catering Oculto`)}&body=${encodeURIComponent(message)}`:'';
  return <div className="server-request">
    <p className="field-hint">Tu solicitud llegará a la bandeja del equipo. Después podrás compartir el resumen por WhatsApp o correo. No confirma una reserva.</p>
    {!saved && <>
      <label className="form-label" htmlFor="quote-phone">Teléfono de contacto</label>
      <input id="quote-phone" className="form-input" type="tel" autoComplete="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Ej. +52 612 000 0000" disabled={busy}/>
      <label className="form-label" htmlFor="quote-investment">¿El importe preliminar encaja con tu inversión?</label>
      <select id="quote-investment" className="form-input" value={investment} disabled={busy} onChange={e=>setInvestment(e.target.value as CommercialAnswers['investment'])}><option value="pending">Aún no lo sé</option><option value="fits">Sí, encaja</option><option value="review">Necesito ajustar la propuesta</option></select>
      {QUOTE_RULES.requirementsApproved && <><p>{QUOTE_RULES.requirementsText}</p><label className="form-label" htmlFor="quote-requirements">¿El lugar cumple estos requisitos?</label><select id="quote-requirements" className="form-input" value={requirements} disabled={busy} onChange={e=>setRequirements(e.target.value as CommercialAnswers['requirements'])}><option value="pending">Por confirmar</option><option value="yes">Sí</option><option value="no">No; necesito orientación</option></select></>}
      <button className="btn btn-primary" type="button" onClick={calculate} disabled={busy}>{busy?'Procesando…':'Revisar estimado actualizado'}</button>
      {activeEstimate && <div className="server-estimate" aria-live="polite">
        <h4>{activeEstimate.estimateStatus==='partial'?'Estimado parcial revisado':'Estimado revisado'}</h4>
        <p>{activeEstimate.breakdown.selectedPackage?.name}: {activeEstimate.breakdown.pricePending?'Precio por confirmar':formatMXNCents(activeEstimate.breakdown.menuSubtotalCents)}</p>
        {(activeEstimate.breakdown.dishSummary ?? []).map(d=><p key={d.group}>{d.group}: {d.name}</p>)}
        {activeEstimate.breakdown.extrasItemized.map(item=><p key={item.id}>{item.name} × {item.quantity}: {formatMXNCents(item.totalCents)}</p>)}
        <p>Traslado: {activeEstimate.breakdown.travelRequiresConfirmation?'Por confirmar':formatMXNCents(activeEstimate.breakdown.travelFeeCents)}</p>
        <p>IVA: {activeEstimate.breakdown.taxPending?'Por confirmar':formatMXNCents(activeEstimate.breakdown.taxCents ?? 0)}</p>
        <strong>{formatMXNCents(activeEstimate.breakdown.totalEstimatedCents)} MXN</strong>
        <ul>{activeEstimate.pending.map(item=><li key={item}>{item}</li>)}</ul>
        <Qualification value={activeEstimate.qualification}/>
        <details><summary>Condiciones antes de solicitar</summary><p>{activeEstimate.serviceSnapshot?.conditions}</p><p>Se guardarán tu nombre, teléfono, selección y notas para que el equipo atienda este evento. Comparte solo la información necesaria.</p></details>
        <label className="request-consent"><input type="checkbox" checked={accepted===formKey} disabled={busy} onChange={e=>setAccepted(e.target.checked?formKey:'')}/><span>He revisado el estimado y sus conceptos pendientes. Autorizo guardar mis datos para atender esta solicitud. Entiendo que no reserva una fecha.</span></label>
        <button className="btn btn-primary" type="button" disabled={busy || accepted!==formKey || !phone.trim()} onClick={submit}>{busy?'Guardando…':'Guardar solicitud con folio'}</button>
      </div>}
    </>}
    {error && <p className="field-error-msg" role="alert">{error}</p>}
    {saved && <div className="server-estimate" role="status"><h4>Solicitud guardada</h4><p className="request-folio">Folio: <strong>{saved.folio}</strong></p><p>{saved.estimate.estimateStatus==='partial'?'Importe parcial conocido':'Total estimado'}: {formatMXNCents(saved.estimate.breakdown.totalEstimatedCents)} MXN. Conserva tu folio; la disponibilidad sigue pendiente.</p><p>{saved.estimate.selection.eventDate} · {saved.estimate.selection.guestsCount} invitados · {saved.estimate.breakdown.selectedPackage?.name}</p>{receipt.key!==formKey && <p>Has cambiado el formulario. Este folio conserva la configuración enviada.</p>}<Receipt receipt={saved}/><a className="btn btn-whatsapp" target="_blank" rel="noopener noreferrer" href={wa}>Enviar resumen por WhatsApp</a>{mail && <a className="btn btn-secondary" href={mail}>Abrir correo con mi presupuesto</a>}<p className="field-hint">WhatsApp y correo se abren con el resumen preparado. Debes confirmar el envío en tu aplicación; la solicitud ya está guardada en la bandeja del equipo.</p><button className="btn btn-secondary" type="button" onClick={()=>{setReceipt(null);setEstimate(null);setAccepted('');attempt.current=null;}}>Preparar otra solicitud</button></div>}
  </div>;
}
