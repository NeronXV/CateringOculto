import {useEffect,useState} from 'react';
import {getTodayMinDateString} from '../../utils/formatters';
import './Premium.css';
export function Availability({date,onSelect,detailed=false}:{date:string;onSelect:(date:string)=>void;detailed?:boolean}){
  const [month,setMonth]=useState(date.slice(0,7)||getTodayMinDateString().slice(0,7)),[days,setDays]=useState<Record<string,string>|null>(null),[error,setError]=useState('');
  useEffect(()=>{if(date)setMonth(date.slice(0,7));},[date]);
  useEffect(()=>{let active=true;setDays(null);setError('');if(!/^\d{4}-\d{2}$/.test(month))return;fetch('/api/local-editor/'+(detailed?'events/calendar':'availability')+'?month='+month).then(async r=>{const d=await r.json();if(!r.ok)throw new Error('No se pudo consultar la disponibilidad.');if(active)setDays(d.days);}).catch(()=>{if(active)setError('No se pudo consultar la agenda. Reintenta antes de elegir.');});return()=>{active=false;};},[month,detailed]);
  const [year,m]=month.split('-').map(Number),count=new Date(year,m,0).getDate(),offset=(new Date(year,m-1,1).getDay()+6)%7;
  return <details className="availability"><summary>Ver calendario de disponibilidad</summary><p>Un evento por día para Carlos y Karen Ascencio. Disponible para solicitar; la reserva se acuerda con el chef.</p>
    <label>Mes del calendario<input type="month" value={month} onInput={e=>setMonth(e.currentTarget.value)} onChange={e=>setMonth(e.target.value)}/></label>
    {error && <p role="alert">{error}</p>}{!days && !error && <p role="status">Consultando agenda…</p>}
    {days && <><div className="availability-grid">{['L','M','M','J','V','S','D'].map((d,i)=><span key={'label'+i} aria-hidden="true">{d}</span>)}{Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}{Array.from({length:count},(_,i)=>{const value=month+'-'+String(i+1).padStart(2,'0'),status=days[value]||'available',past=value<getTodayMinDateString(),unavailable=['unavailable','confirmed','blocked'].includes(status),label=({available:'Disponible para solicitar',review:'Sujeta a revisión',hold:'Apartada',blocked:'Bloqueada',confirmed:'Reserva confirmada',unavailable:'No disponible'})[status]??'Disponible para solicitar';return <button type="button" key={value} className={'day-'+status} disabled={past||unavailable} aria-pressed={date===value} aria-label={`${value}: ${past?'Fecha pasada':label}`} onClick={()=>onSelect(value)}>{i+1}</button>;})}</div><p className="availability-legend">{detailed?'Disponible para solicitar · Dorado: apartado vigente · Rojo: confirmada · Gris: bloqueada':'Claro: disponible para solicitar · Dorado: apartado, sujeto a revisión · Tachado: no disponible'}</p></>}
  </details>;
}
