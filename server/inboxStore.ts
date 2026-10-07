import type { Pool, RowDataPacket } from 'mysql2/promise';
import {jsonDocument} from './jsonDocument';
import { exactKeys, object, QuoteError, textField } from './quoteEngine';
import { SALES_STATUSES, type Followup, type InboxItem } from '../src/types/inbox';

function followup(row:RowDataPacket):Followup {
  return {revision:Number(row.revision ?? 0),status:row.status ?? 'nueva',assigneeId:row.assignee_id==null?null:Number(row.assignee_id),nextAction:row.next_action ?? '',nextDate:row.next_date ?? ''};
}
function item(row:RowDataPacket):InboxItem {
  const estimate=jsonDocument(row.estimate_snapshot),contact=jsonDocument(row.contact_document);
  const isItinerary = estimate && estimate.kind === 'itinerary';
  const eventDate = isItinerary
    ? (estimate.summary?.startDate ? `${estimate.summary.startDate}${estimate.summary.dayCount > 1 ? ` (${estimate.summary.dayCount} días)` : ''}` : 'Itinerario')
    : estimate.selection?.eventDate || '';
  const guests = estimate.selection?.guestsCount ?? 0;
  const totalCents = isItinerary ? 0 : (estimate.breakdown?.totalEstimatedCents ?? 0);
  return {id:row.id,folio:row.folio,createdAt:row.created_at,name:contact.name,eventDate,guests,totalCents,followup:followup(row)};
}
const joined='SELECT q.*,f.revision,f.status,f.assignee_id,f.next_action,f.next_date FROM quote_requests q LEFT JOIN quote_followup f ON f.quote_id=q.id';
function quoteId(id:string) {if(!/^[a-f0-9-]{36}$/.test(id))throw new QuoteError('Solicitud no encontrada.',404);return id;}
export class InboxStore {
  constructor(private pool:Pool) {}
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
    // LOCATE treats wildcard characters literally and parameters never become SQL.
    const where=" WHERE (?='' OR LOCATE(?,q.folio)>0 OR LOCATE(?,JSON_UNQUOTE(JSON_EXTRACT(q.contact_document,'$.name')))>0) AND (?='' OR COALESCE(f.status,'nueva')=?)";
    const args=[search,search,search,status,status];
    const [count]=await this.pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM quote_requests q LEFT JOIN quote_followup f ON f.quote_id=q.id'+where,args);
    const [rows]=await this.pool.query<RowDataPacket[]>(joined+where+' ORDER BY q.created_at DESC,q.id DESC LIMIT 20 OFFSET ?',[...args,(page-1)*20]);
    return {items:rows.map(item),total:Number(count[0].total),page};
  }
  async detail(id:string) {
    const [rows]=await this.pool.execute<RowDataPacket[]>(joined+' WHERE q.id=?',[quoteId(id)]);
    if(!rows.length)throw new QuoteError('Solicitud no encontrada.',404);
    const [activity]=await this.pool.execute<RowDataPacket[]>('SELECT id,actor_name,created_at,document FROM quote_activity WHERE quote_id=? ORDER BY id DESC',[id]);
    return {...item(rows[0]),estimate:jsonDocument(rows[0].estimate_snapshot),contact:jsonDocument(rows[0].contact_document),activity:activity.map(row=>({id:Number(row.id),actorName:row.actor_name,createdAt:row.created_at,change:jsonDocument(row.document)}))};
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
