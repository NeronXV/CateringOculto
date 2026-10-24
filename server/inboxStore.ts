import type { Pool, RowDataPacket } from 'mysql2/promise';
import {jsonDocument} from './jsonDocument';
import { exactKeys, object, QuoteError, textField } from './quoteEngine';
import { SALES_STATUSES, type Followup, type InboxItem } from '../src/types/inbox';
import { requestAmounts, requestDays } from '../src/utils/requestSummary';
import {randomBytes,createHash} from 'node:crypto';
import {attention, type AvailabilityDecision} from '../src/types/availability';
import {lockAgenda,checkDates} from './availabilityGuard';
import {folioSearchPattern} from '../src/utils/folio';

function followup(row:RowDataPacket):Followup {
  return {revision:Number(row.revision ?? 0),status:row.status ?? 'nueva',assigneeId:row.assignee_id==null?null:Number(row.assignee_id),nextAction:row.next_action ?? '',nextDate:row.next_date ?? ''};
}
function decision(row:RowDataPacket):AvailabilityDecision {return row.availability_document?jsonDocument(row.availability_document):{status:row.availability_status??'pending'};}
function item(row:RowDataPacket,hours=24):InboxItem {
  const estimate=jsonDocument(row.estimate_snapshot),contact=jsonDocument(row.contact_document);
  const isItinerary = estimate && estimate.kind === 'itinerary';
  const eventDate = isItinerary
    ? (estimate.summary?.startDate ? `${estimate.summary.startDate}${estimate.summary.dayCount > 1 ? ` (${estimate.summary.dayCount} días)` : ''}` : 'Itinerario')
    : estimate.selection?.eventDate || '';
  const guests = estimate.selection?.guestsCount ?? 0;
  const amounts = requestAmounts(estimate);
  const availability=decision(row);
  return {id:row.id,folio:row.folio,createdAt:row.created_at,name:contact.name,eventDate,guests,totalCents:amounts.totalCents,eventDates:requestDays(estimate).map(day=>day.date),subtotalCents:amounts.subtotalCents,hasPendingAmounts:amounts.pending,availability,attention:attention(row.created_at,availability.status,hours),followup:followup(row)};
}
const joined='SELECT q.*,f.revision,f.status,f.assignee_id,f.next_action,f.next_date,f.availability_status,f.availability_document FROM quote_requests q LEFT JOIN quote_followup f ON f.quote_id=q.id';
function quoteId(id:string) {if(!/^[a-f0-9-]{36}$/.test(id))throw new QuoteError('Solicitud no encontrada.',404);return id;}
export class InboxStore {
  constructor(private pool:Pool) {}
  async settings(){const [rows]=await this.pool.query<RowDataPacket[]>('SELECT response_hours FROM editorial_state WHERE id=1');return {responseHours:Number(rows[0]?.response_hours??24)};}
  async setSettings(input:unknown){
    const b=object(input);exactKeys(b,['responseHours','expectedHours']);
    if(!Number.isSafeInteger(b.responseHours)||Number(b.responseHours)<1||Number(b.responseHours)>720||!Number.isSafeInteger(b.expectedHours))throw new QuoteError('Indica un plazo entre 1 y 720 horas.');
    const [result]=await this.pool.execute<any>('UPDATE editorial_state SET response_hours=? WHERE id=1 AND response_hours=?',[Number(b.responseHours),Number(b.expectedHours)]);
    if(!result.affectedRows)throw new QuoteError('Otra persona cambió el plazo. Recarga antes de guardar.',409);
    return this.settings();
  }
  async staff() {
    const [rows]=await this.pool.query<RowDataPacket[]>("SELECT id,name FROM staff_users WHERE active=TRUE AND role IN ('admin','editor') ORDER BY name,id");
    return rows.map(row=>({id:Number(row.id),name:row.name}));
  }
  async list(query:Record<string,unknown>) {
    if(Object.keys(query).some(key=>!['q','status','page'].includes(key)))throw new QuoteError('Filtro inválido.');
    const search=textField(query.q ?? '',100),status=query.status ?? '';
    if(typeof status!=='string' || (status && !Object.hasOwn(SALES_STATUSES,status)))throw new QuoteError('Estado inválido.');
    const page=Number(query.page ?? 1);
    if(!Number.isSafeInteger(page) || page<1 || page>100000)throw new QuoteError('Página inválida.');
    // LOCATE keeps ordinary wildcard searches literal. Alias patterns are derived, not raw input.
    const alias = folioSearchPattern(search) ?? '';
    const where=" WHERE (?='' OR LOCATE(?,q.folio)>0 OR LOCATE(?,JSON_UNQUOTE(JSON_EXTRACT(q.contact_document,'$.name')))>0 OR (?<>'' AND q.folio LIKE ?)) AND (?='' OR COALESCE(f.status,'nueva')=?)";
    const args=[search,search,search,alias,alias,status,status];
    const {responseHours}=await this.settings();
    const [count]=await this.pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM quote_requests q LEFT JOIN quote_followup f ON f.quote_id=q.id'+where,args);
    const cutoff=new Date(Date.now()-responseHours*3600000).toISOString();
    const [rows]=await this.pool.query<RowDataPacket[]>(joined+where+" ORDER BY CASE WHEN COALESCE(f.availability_status,'pending')='pending' AND q.created_at<=? THEN 0 WHEN COALESCE(f.availability_status,'pending')='pending' THEN 1 ELSE 2 END,CASE COALESCE(f.status,'nueva') WHEN 'nueva' THEN 0 WHEN 'en_revision' THEN 1 WHEN 'contactada' THEN 2 ELSE 3 END,q.created_at DESC,q.id DESC LIMIT 20 OFFSET ?",[...args,cutoff,(page-1)*20]);
    return {items:rows.map(row=>item(row,responseHours)),total:Number(count[0].total),page};
  }
  async detail(id:string) {
    const [rows]=await this.pool.execute<RowDataPacket[]>(joined+' WHERE q.id=?',[quoteId(id)]);
    if(!rows.length)throw new QuoteError('Solicitud no encontrada.',404);
    const [activity]=await this.pool.execute<RowDataPacket[]>('SELECT id,actor_name,created_at,document FROM quote_activity WHERE quote_id=? ORDER BY id DESC',[id]);
    const [events]=await this.pool.execute<RowDataPacket[]>('SELECT status,hold_until FROM service_events WHERE quote_id=?',[id]);
    const activeHold=events[0]?.status==='hold'&&events[0].hold_until>new Date().toISOString();
    return {...item(rows[0],(await this.settings()).responseHours),reservationStatus:events[0]?.status==='hold'&&!activeHold?'draft':events[0]?.status??'draft',reservationHoldUntil:activeHold?events[0].hold_until:'',estimate:jsonDocument(rows[0].estimate_snapshot),contact:jsonDocument(rows[0].contact_document),activity:activity.map(row=>({id:Number(row.id),actorName:row.actor_name,createdAt:row.created_at,change:jsonDocument(row.document)}))};
  }
  async decide(id:string,input:unknown,actor:{id:number;name:string}) {
    quoteId(id);const b=object(input);exactKeys(b,['revision','status','note']);
    if(!Number.isSafeInteger(b.revision)||typeof b.status!=='string'||!['available','unavailable'].includes(b.status))throw new QuoteError('Decisión inválida.');
    const note=textField(b.note,500),conn=await this.pool.getConnection();
    try {
      await conn.beginTransaction();await lockAgenda(conn);
      const [quotes]=await conn.execute<RowDataPacket[]>('SELECT estimate_snapshot FROM quote_requests WHERE id=? FOR UPDATE',[id]);
      if(!quotes.length)throw new QuoteError('Solicitud no encontrada.',404);
      const [rows]=await conn.execute<RowDataPacket[]>('SELECT * FROM quote_followup WHERE quote_id=?',[id]);const before=followup(rows[0]??{} as RowDataPacket);
      if(before.revision!==b.revision)throw new QuoteError('Otra persona cambió esta solicitud. Recarga el detalle antes de decidir.',409);
      const [own]=await conn.execute<RowDataPacket[]>('SELECT id,status,hold_until FROM service_events WHERE quote_id=?',[id]);
      if(b.status==='available')await checkDates(conn,requestDays(jsonDocument(quotes[0].estimate_snapshot)).map(day=>day.date),own[0]?.status==='blocked'?null:own[0]?.id??null);
      else if(own[0]&&(own[0].status==='confirmed'||(own[0].status==='hold'&&own[0].hold_until>new Date().toISOString())))throw new QuoteError('Esta solicitud tiene una reserva o apartado vigente. Revisa primero su ficha; esta acción no cancela acuerdos.',409);
      const result={status:b.status,actorId:actor.id,actorName:actor.name,decidedAt:new Date().toISOString(),note};
      await conn.execute('INSERT INTO quote_followup (quote_id,revision,availability_status,availability_document) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE revision=VALUES(revision),availability_status=VALUES(availability_status),availability_document=VALUES(availability_document)',[id,before.revision+1,b.status,JSON.stringify(result)]);
      await conn.execute('INSERT INTO quote_activity (quote_id,actor_id,actor_name,created_at,document) VALUES (?,?,?,?,?)',[id,actor.id,actor.name,result.decidedAt,JSON.stringify({kind:'availability',before,after:{...before,revision:before.revision+1},note,decision:result,previousDecision:rows[0]?decision(rows[0]):{status:'pending'}})]);
      await conn.commit();return {ok:true};
    }catch(error){await conn.rollback();throw error;}finally{conn.release();}
  }
  async issueLink(id:string,input:unknown,actor:{id:number;name:string}) {
    quoteId(id);const b=object(input);exactKeys(b,['revision']);if(!Number.isSafeInteger(b.revision))throw new QuoteError('Revisión inválida.');
    const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex'),conn=await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [quotes]=await conn.execute<RowDataPacket[]>('SELECT id FROM quote_requests WHERE id=? FOR UPDATE',[id]);if(!quotes.length)throw new QuoteError('Solicitud no encontrada.',404);
      const [rows]=await conn.execute<RowDataPacket[]>('SELECT * FROM quote_followup WHERE quote_id=?',[id]);const before=followup(rows[0]??{} as RowDataPacket);
      if(before.revision!==b.revision)throw new QuoteError('Recarga la solicitud antes de generar el enlace.',409);
      await conn.execute('INSERT INTO quote_followup (quote_id,revision,tracking_hash) VALUES (?,?,?) ON DUPLICATE KEY UPDATE revision=VALUES(revision),tracking_hash=VALUES(tracking_hash)',[id,before.revision+1,hash]);
      await conn.execute('INSERT INTO quote_activity (quote_id,actor_id,actor_name,created_at,document) VALUES (?,?,?,?,?)',[id,actor.id,actor.name,new Date().toISOString(),JSON.stringify({kind:'tracking-link',before,after:{...before,revision:before.revision+1},note:''})]);
      await conn.commit();return {token};
    }catch(error){await conn.rollback();throw error;}finally{conn.release();}
  }
  async tracking(token:string) {
    if(!/^[a-f0-9]{64}$/.test(token))throw new QuoteError('Enlace no disponible.',404);
    const [rows]=await this.pool.execute<RowDataPacket[]>('SELECT q.id,q.folio,q.estimate_snapshot,f.availability_status FROM quote_requests q JOIN quote_followup f ON f.quote_id=q.id WHERE f.tracking_hash=?',[createHash('sha256').update(token).digest('hex')]);
    if(!rows.length)throw new QuoteError('Enlace no disponible.',404);
    const [linked]=await this.pool.execute<RowDataPacket[]>('SELECT status,hold_until FROM service_events WHERE quote_id=?',[rows[0].id]);
    const e=linked[0],activeHold=e?.status==='hold'&&e.hold_until>new Date().toISOString();
    return {kind:'request',folio:rows[0].folio,dates:requestDays(jsonDocument(rows[0].estimate_snapshot)).map(day=>day.date),availability:rows[0].availability_status,status:e?.status==='hold'&&!activeHold?'draft':e?.status??'draft',holdUntil:activeHold?e.hold_until:''};
  }
  async update(id:string,input:unknown,actor:{id:number;name:string}) {
    quoteId(id);
    const body=object(input);exactKeys(body,['revision','status','assigneeId','nextAction','nextDate','note']);
    if(!Number.isSafeInteger(body.revision) || Number(body.revision)<0 || typeof body.status!=='string' || !Object.hasOwn(SALES_STATUSES,body.status))throw new QuoteError('Estado o revisión inválidos.');
    if(body.assigneeId!==null && (!Number.isSafeInteger(body.assigneeId) || Number(body.assigneeId)<1))throw new QuoteError('Responsable inválido.');
    const assigneeId=body.assigneeId===null?null:Number(body.assigneeId);
    const nextAction=textField(body.nextAction,500),nextDate=textField(body.nextDate,10),note=textField(body.note,4000);
    if(nextDate && (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate) || !Number.isFinite(Date.parse(nextDate+'T12:00:00Z')) || new Date(nextDate+'T12:00:00Z').toISOString().slice(0,10)!==nextDate || !nextAction))throw new QuoteError('Escribe una próxima acción y una fecha válida.');
    const conn=await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [quotes]=await conn.execute<RowDataPacket[]>('SELECT id FROM quote_requests WHERE id=? FOR UPDATE',[id]);
      if(!quotes.length)throw new QuoteError('Solicitud no encontrada.',404);
      const [rows]=await conn.execute<RowDataPacket[]>('SELECT * FROM quote_followup WHERE quote_id=?',[id]);
      const before=followup(rows[0] ?? {} as RowDataPacket);
      if(before.revision!==body.revision)throw new QuoteError('Otra persona actualizó esta solicitud. Recarga el detalle antes de guardar; conserva tus notas.',409);
      if(assigneeId!==null) {
        const [staff]=await conn.execute<RowDataPacket[]>("SELECT id FROM staff_users WHERE id=? AND active=TRUE AND role IN ('admin','editor') LOCK IN SHARE MODE",[assigneeId]);
        if(!staff.length)throw new QuoteError('El responsable debe ser propietario o comercial activo.');
      }
      const after={revision:before.revision+1,status:body.status,assigneeId,nextAction,nextDate};
      await conn.execute('INSERT INTO quote_followup (quote_id,revision,status,assignee_id,next_action,next_date) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE revision=VALUES(revision),status=VALUES(status),assignee_id=VALUES(assignee_id),next_action=VALUES(next_action),next_date=VALUES(next_date)',[id,after.revision,after.status,after.assigneeId,nextAction,nextDate]);
      await conn.execute('UPDATE quote_requests SET sales_status=? WHERE id=?',[after.status,id]);
      await conn.execute('INSERT INTO quote_activity (quote_id,actor_id,actor_name,created_at,document) VALUES (?,?,?,?,?)',[id,actor.id,actor.name,new Date().toISOString(),JSON.stringify({before,after,note})]);
      await conn.commit();
      return {ok:true};
    } catch(error){await conn.rollback();throw error;} finally{conn.release();}
  }
}
