import {visibleFolio} from '../utils/folio';
export const AVAILABILITY_LABELS = {pending:'Pendiente de decisión',available:'Disponible para continuar',unavailable:'No disponible'} as const;
export type AvailabilityStatus = keyof typeof AVAILABILITY_LABELS;
export interface AvailabilityDecision {status:AvailabilityStatus;actorId?:number;actorName?:string;decidedAt?:string;note?:string;}
export interface Attention {overdue:boolean;deadlineAt:string;responseHours:number;}
export function attention(createdAt:string,status:AvailabilityStatus,hours:number,now=Date.now()):Attention {
  const deadline=Date.parse(createdAt)+hours*3600000;
  return {overdue:status==='pending'&&now>=deadline,deadlineAt:new Date(deadline).toISOString(),responseHours:hours};
}
export function availabilityMessage(name:string,folio:string,dates:string[],status:AvailabilityStatus,link='',reservationStatus='draft') {
  const readableDates=dates.map(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)?date.split('-').reverse().join('/'):date);
  const greeting=`Hola ${name}, somos Carlos y Karen de Catering Oculto. Sobre tu solicitud ${visibleFolio(folio)} para ${readableDates.join(' · ')}: `;
  const message=status==='available'?'tenemos disponibilidad para continuar con la propuesta. La fecha aún no está reservada ni apartada; confirmaremos los acuerdos y requisitos de contratación contigo.':status==='unavailable'?'por ahora no tenemos disponibilidad para atender estas fechas. Con gusto podemos dar seguimiento y buscar otras alternativas contigo.':'estamos revisando la disponibilidad y te contactaremos para continuar. Tu solicitud aún no reserva una fecha.';
  const booking=reservationStatus==='confirmed'?'tu reservación está confirmada conforme a los acuerdos registrados con el equipo.':reservationStatus==='hold'?'hay un apartado temporal registrado para estas fechas. Este apartado aún no equivale a una reservación confirmada.':message;
  return greeting+booking+(link?` Puedes consultar el estado aquí: ${link}`:'');
}
