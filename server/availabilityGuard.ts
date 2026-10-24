import type {PoolConnection,RowDataPacket} from 'mysql2/promise';
import {QuoteError} from './quoteEngine';
export async function lockAgenda(conn:PoolConnection){await conn.query('SELECT id FROM editorial_state WHERE id=1 FOR UPDATE');}
export async function checkDates(conn:PoolConnection,dates:string[],own:string|null,now=new Date().toISOString()) {
  const [rows]=await conn.execute<RowDataPacket[]>(`SELECT e.id FROM service_events e JOIN service_event_dates d ON d.event_id=e.id WHERE d.service_date IN (${dates.map(()=>'?').join(',')}) AND (? IS NULL OR e.id<>?) AND (e.status IN ('confirmed','blocked') OR (e.status='hold' AND e.hold_until>?))`,[...dates,own,own,now]);
  if(rows.length)throw new QuoteError('Una de las fechas ya tiene una reserva, apartado vigente o bloqueo. Revisa la Agenda antes de continuar.',409);
}
export async function checkRejected(conn:PoolConnection,quoteId:string|null) {
  if(!quoteId)return;
  const [rows]=await conn.execute<RowDataPacket[]>('SELECT availability_status FROM quote_followup WHERE quote_id=?',[quoteId]);
  if(rows[0]?.availability_status==='unavailable')throw new QuoteError('Esta solicitud se marcó como no disponible. Revisa y cambia explícitamente la decisión antes de apartar o confirmar.',409);
}
