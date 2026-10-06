export type EventStatus='draft'|'hold'|'confirmed'|'blocked'|'cancelled';
export const EVENT_STATUS:Record<EventStatus,string>={draft:'En revisión',hold:'Apartado temporal',confirmed:'Reserva confirmada',blocked:'Descanso / bloqueo',cancelled:'Cancelado'};
export interface EventData {
  date:string;status:EventStatus;holdUntil:string;name:string;phone:string;guests:number;
  address:string;schedule:string;proposal:string;publicNotes:string;internalNotes:string;
  totalCents:number|null;depositCents:number;paymentVerified:boolean;
  tasks:{id:string;text:string;done:boolean}[];
}
export interface OperationEvent {id:string;quoteId:string|null;folio:string;revision:number;data:EventData;proposalVersion:number;published:unknown|null;updatedAt:string;}
export function blankEvent(date=''):EventData {return {date,status:'draft',holdUntil:'',name:'',phone:'',guests:5,address:'',schedule:'',proposal:'',publicNotes:'',internalNotes:'',totalCents:null,depositCents:0,paymentVerified:false,tasks:[{id:'location',text:'Confirmar dirección y condiciones de cocina',done:false},{id:'menu',text:'Cerrar menú y número de invitados',done:false},{id:'payment',text:'Verificar anticipo acordado por WhatsApp',done:false},{id:'logistics',text:'Revisar compras, traslado y horario de llegada',done:false}]};}
