import {randomUUID,randomBytes,createHash} from 'node:crypto';
import type {Express} from 'express';
import type {Pool,RowDataPacket,PoolConnection,ExecuteValues} from 'mysql2/promise';
import {rateLimit} from 'express-rate-limit';
import {object,exactKeys,textField,QuoteError} from './quoteEngine';
import {jsonDocument} from './jsonDocument';
import {InboxStore} from './inboxStore';
import {prepareRequest} from '../src/utils/requestSummary';
import {lockAgenda as lock,checkDates,checkRejected} from './availabilityGuard';
import {blankEvent,eventDates,EVENT_STATUS,type EventData,type OperationEvent} from '../src/types/operations';
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
export function validDate(value:unknown):value is string {return typeof value==='string' && /^20\d{2}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T12:00:00Z')) && new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function validateEvent(input:unknown):EventData {
  const d=object(input);exactKeys(d,[...Object.keys(blankEvent()),...('dates' in d?['dates']:[])]);
  const dates=d.dates===undefined?[d.date]:d.dates;
  if(!Array.isArray(dates) || !dates.length || dates.length>31 || dates.some(v=>!validDate(v)) || new Set(dates).size!==dates.length || !dates.includes(d.date))throw new QuoteError('Revisa las fechas: entre 1 y 31 días distintos, incluyendo la fecha principal.');
  const sortedDates=[...dates].sort() as string[];
  if(!validDate(d.date) || typeof d.status!=='string' || !Object.hasOwn(EVENT_STATUS,d.status))throw new QuoteError('Fecha o estado del evento inválidos.');
  if(!Number.isSafeInteger(d.guests) || Number(d.guests)<1 || Number(d.guests)>150)throw new QuoteError('Indica entre 1 y 150 invitados para revisión.');
  for(const field of ['totalCents','depositCents'])if(!(field==='totalCents' && d[field]===null) && (!Number.isSafeInteger(d[field]) || Number(d[field])<0 || Number(d[field])>100_000_000))throw new QuoteError('Importes inválidos. Usa centavos enteros.');
  if(d.depositCents && (d.totalCents===null || Number(d.depositCents)>Number(d.totalCents)))throw new QuoteError('El anticipo no puede superar el importe acordado.');
  if(typeof d.paymentVerified!=='boolean')throw new QuoteError('Verifica el estado del anticipo.');
  const holdUntil=textField(d.holdUntil,30);
  if(holdUntil && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(holdUntil) || !Number.isFinite(Date.parse(holdUntil))))throw new QuoteError('El vencimiento debe ser una fecha y hora válidas.');
  if(d.status==='hold' && (!holdUntil || Date.parse(holdUntil)<=Date.now()))throw new QuoteError('El apartado necesita un vencimiento futuro.');
  if(d.status==='confirmed' && (!d.paymentVerified || !Number(d.depositCents) || !Number(d.totalCents)))throw new QuoteError('Para confirmar, registra el importe final y el anticipo que verificaste fuera de la página.');
  if(!Array.isArray(d.tasks) || d.tasks.length>40)throw new QuoteError('Demasiadas tareas.');
  const tasks=d.tasks.map(raw=>{const t=object(raw);exactKeys(t,['id','text','done']);if(typeof t.id!=='string' || !/^[a-zA-Z0-9-]{1,50}$/.test(t.id) || typeof t.done!=='boolean')throw new QuoteError('Tarea inválida.');return {id:t.id,text:textField(t.text,300,true),done:t.done};});
  if(new Set(tasks.map(t=>t.id)).size!==tasks.length)throw new QuoteError('Hay tareas duplicadas.');
  const phone=textField(d.phone,30);if(phone && (!/^\+?[\d ()-]+$/.test(phone) || phone.replace(/\D/g,'').length<10 || phone.replace(/\D/g,'').length>15))throw new QuoteError('Teléfono inválido.');
  return {...d,date:sortedDates[0],dates:sortedDates,name:textField(d.name,100,d.status!=='blocked'),phone,address:textField(d.address,1000),schedule:textField(d.schedule,4000),proposal:textField(d.proposal,200000),publicNotes:textField(d.publicNotes,4000),internalNotes:textField(d.internalNotes,8000),holdUntil,tasks} as unknown as EventData;
}
function event(row:RowDataPacket):OperationEvent {return {id:row.id,quoteId:row.quote_id,folio:row.folio,revision:Number(row.revision),data:jsonDocument(row.document),proposalVersion:Number(row.proposal_version),published:row.published?jsonDocument(row.published):null,updatedAt:row.updated_at};}
function id(value:string){if(!/^[a-f0-9-]{36}$/.test(value))throw new QuoteError('Evento no encontrado.',404);return value;}
function month(value:unknown){if(typeof value!=='string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(value))throw new QuoteError('Mes inválido.');return value;}
function publicProposal(e:OperationEvent){return {folio:e.folio,version:e.proposalVersion+1,date:e.data.date,dates:eventDates(e.data),guests:e.data.guests,schedule:e.data.schedule,proposal:e.data.proposal,notes:e.data.publicNotes,totalCents:e.data.totalCents};}
export class Operations {
  constructor(private pool:Pool){}
  async prepare(value:string){const source=await new InboxStore(this.pool).detail(id(value));const prepared=prepareRequest(source);validateEvent(prepared.data);return prepared;}
  async availability(value:unknown,detailed=false){const m=month(value);const [rows]=await this.pool.execute<RowDataPacket[]>("SELECT DATE_FORMAT(d.service_date,'%Y-%m-%d') AS day,status,hold_until FROM service_events e JOIN service_event_dates d ON d.event_id=e.id WHERE d.service_date>=? AND d.service_date<LAST_DAY(?)+INTERVAL 1 DAY AND (status IN ('confirmed','blocked') OR (status='hold' AND hold_until>?))",[m+'-01',m+'-01',new Date().toISOString()]);const days:Record<string,string>={};for(const row of rows){if(detailed){const priority:Record<string,number>={hold:1,blocked:2,confirmed:3};if((priority[row.status]??0)>(priority[days[row.day]]??0))days[row.day]=row.status;}else days[row.day]=row.status==='hold' && days[row.day]!=='unavailable'?'review':'unavailable';}return {month:m,days};}
  async list(value:unknown){const m=month(value);const [rows]=await this.pool.execute<RowDataPacket[]>("SELECT DISTINCT e.* FROM service_events e JOIN service_event_dates d ON d.event_id=e.id WHERE d.service_date>=? AND d.service_date<LAST_DAY(?)+INTERVAL 1 DAY ORDER BY e.event_date,e.id",[m+'-01',m+'-01']);return rows.map(event);}
  async forRequest(value:string){const [rows]=await this.pool.execute<RowDataPacket[]>('SELECT id FROM service_events WHERE quote_id=?',[id(value)]);return {id:rows[0]?.id ?? null};}
  async detail(value:string){
    const [rows]=await this.pool.execute<RowDataPacket[]>('SELECT * FROM service_events WHERE id=?',[id(value)]);
    if(!rows.length)throw new QuoteError('Evento no encontrado.',404);
    const [activity]=await this.pool.execute<RowDataPacket[]>('SELECT actor_name,action,created_at,document FROM event_activity WHERE event_id=? ORDER BY id DESC LIMIT 100',[value]);
    const [proposals]=await this.pool.execute<RowDataPacket[]>('SELECT version,document FROM event_proposals WHERE event_id=? ORDER BY version DESC',[value]);
    const sourceRequest=rows[0].quote_id?await new InboxStore(this.pool).detail(rows[0].quote_id):null;
    const requestedDates=sourceRequest?prepareRequest(sourceRequest).requestedDates:[];
    return {...event(rows[0]),requestedDates,sourceRequest,activity:activity.map(a=>({actor:a.actor_name,action:a.action,createdAt:a.created_at,change:jsonDocument(a.document)})),proposals:proposals.map(p=>jsonDocument(p.document))};
  }
  async create(input:unknown,actor:{id:number;name:string}){const b=object(input);exactKeys(b,['data','quoteId']);let data=validateEvent(b.data);if(data.status==='confirmed')throw new QuoteError('Crea la ficha, publica la propuesta y después confirma la reserva.');if(b.quoteId!==null && typeof b.quoteId!=='string')throw new QuoteError('Solicitud inválida.');const conn=await this.pool.getConnection();try{await conn.beginTransaction();await lock(conn);let folio='EV-'+randomBytes(8).toString('hex').toUpperCase();if(b.quoteId){const [q]=await conn.execute<RowDataPacket[]>('SELECT folio,contact_document,estimate_snapshot FROM quote_requests WHERE id=?',[id(String(b.quoteId))]);if(!q.length)throw new QuoteError('Solicitud no encontrada.',404);folio=q[0].folio;const snapshot=jsonDocument(q[0].estimate_snapshot) as any;if(snapshot.kind==='itinerary' && !(b.data as any).dates){const dates=snapshot.selection.days.map((day:any)=>day.date);data=validateEvent({...data,date:dates[0],dates});}}
    await this.checkDay(conn,data,null,b.quoteId as string|null);const value=randomUUID(),now=new Date().toISOString();await conn.execute('INSERT INTO service_events (id,quote_id,folio,event_date,status,hold_until,document,updated_at) VALUES (?,?,?,?,?,?,?,?)',[value,b.quoteId,folio,data.date,data.status,data.holdUntil,JSON.stringify(data),now] as ExecuteValues);await this.saveDates(conn,value,data);await this.audit(conn,value,actor,'create',{data});await conn.commit();return {id:value};}catch(error){await conn.rollback();if((error as {code?:string}).code==='ER_DUP_ENTRY')throw new QuoteError('Esta solicitud ya tiene una ficha en la agenda.',409);throw error;}finally{conn.release();}}
  private async saveDates(conn:PoolConnection,value:string,data:EventData){
    await conn.execute('DELETE FROM service_event_dates WHERE event_id=?',[value]);
    for(const date of eventDates(data))await conn.execute('INSERT INTO service_event_dates (event_id,service_date) VALUES (?,?)',[value,date]);
  }
  private async checkDay(conn:PoolConnection,data:EventData,own:string|null,quoteId:string|null){
    if(!['confirmed','blocked','hold'].includes(data.status))return;
    if(data.status==='hold'||data.status==='confirmed')await checkRejected(conn,quoteId);
    await checkDates(conn,eventDates(data),own);
  }
  private async audit(conn:PoolConnection,value:string,actor:{id:number;name:string},action:string,document:unknown){await conn.execute('INSERT INTO event_activity (event_id,actor_id,actor_name,action,document,created_at) VALUES (?,?,?,?,?,?)',[value,actor.id,actor.name,action,JSON.stringify(document),new Date().toISOString()]);}
  async update(value:string,input:unknown,actor:{id:number;name:string}){id(value);const b=object(input);exactKeys(b,['revision','data','publish']);const data=validateEvent(b.data);if(!Number.isSafeInteger(b.revision) || typeof b.publish!=='boolean')throw new QuoteError('Revisión inválida.');if(b.publish && (!data.proposal.trim() || data.totalCents===null || data.status==='blocked'))throw new QuoteError('Completa la propuesta y el importe acordado antes de compartir.');const conn=await this.pool.getConnection();try{await conn.beginTransaction();await lock(conn);const [rows]=await conn.execute<RowDataPacket[]>('SELECT * FROM service_events WHERE id=? FOR UPDATE',[value]);if(!rows.length)throw new QuoteError('Evento no encontrado.',404);const before=event(rows[0]);if(eventDates(before.data).length>1 && !(b.data as any).dates)throw new QuoteError('Esta ficha tiene varias fechas. Recarga el panel antes de guardar.',409);if(before.revision!==b.revision)throw new QuoteError('Otra persona cambió esta ficha. Recarga antes de guardar.',409);await this.checkDay(conn,data,value,before.quoteId);
    const candidate=publicProposal({...before,data});
    if(data.status==='confirmed' && !b.publish && (!before.published || ['date','dates','guests','schedule','proposal','notes','totalCents'].some(key=>JSON.stringify((candidate as any)[key])!==JSON.stringify(key==='dates'?((before.published as any).dates ?? [(before.published as any).date]):(before.published as any)[key]))))throw new QuoteError('Publica la propuesta final actualizada antes de confirmar la reserva.');
    const next={...before,data};const published=b.publish?publicProposal(next):before.published,version=before.proposalVersion+(b.publish?1:0);if(b.publish)await conn.execute('INSERT INTO event_proposals (event_id,version,document,created_at) VALUES (?,?,?,?)',[value,version,JSON.stringify(published),new Date().toISOString()]);await conn.execute('UPDATE service_events SET revision=revision+1,event_date=?,status=?,hold_until=?,document=?,proposal_version=?,published=?,updated_at=? WHERE id=?',[data.date,data.status,data.holdUntil,JSON.stringify(data),version,published?JSON.stringify(published):null,new Date().toISOString(),value]);await this.saveDates(conn,value,data);await this.audit(conn,value,actor,b.publish?'publish':'update',{before:before.data,after:data,proposalVersion:version,paymentVerifiedBy:data.paymentVerified?actor.name:null});await conn.commit();return {ok:true};}catch(error){await conn.rollback();throw error;}finally{conn.release();}}
  async issue(value:string,revision:unknown,actor:{id:number;name:string}){id(value);if(!Number.isSafeInteger(revision))throw new QuoteError('Revisión inválida.');const token=randomBytes(32).toString('hex'),conn=await this.pool.getConnection();try{await conn.beginTransaction();await lock(conn);const [rows]=await conn.execute<RowDataPacket[]>('SELECT revision,status,published FROM service_events WHERE id=? FOR UPDATE',[value]);if(!rows.length)throw new QuoteError('Evento no encontrado.',404);if(Number(rows[0].revision)!==revision)throw new QuoteError('Recarga la ficha antes de generar el enlace.',409);if(rows[0].status==='blocked')throw new QuoteError('Los bloqueos no tienen enlace para clientes.');await conn.execute('UPDATE service_events SET tracking_hash=?,revision=revision+1 WHERE id=?',[sha(token),value]);await this.audit(conn,value,actor,'tracking-link',{});await conn.commit();return {token};}catch(error){await conn.rollback();throw error;}finally{conn.release();}}
  async tracking(input:unknown){const b=object(input);exactKeys(b,['token']);if(typeof b.token!=='string' || !/^[a-f0-9]{64}$/.test(b.token))throw new QuoteError('Enlace no disponible.',404);const [rows]=await this.pool.execute<RowDataPacket[]>('SELECT folio,status,hold_until,published,document FROM service_events WHERE tracking_hash=?',[sha(b.token)]);if(!rows.length)return new InboxStore(this.pool).tracking(b.token);const row=rows[0],d=jsonDocument(row.document) as EventData;return {folio:row.folio,status:row.status==='hold' && row.hold_until<=new Date().toISOString()?'draft':row.status,holdUntil:row.status==='hold' && row.hold_until>new Date().toISOString()?row.hold_until:'',proposal:row.published?jsonDocument(row.published):null,depositCents:row.status==='confirmed'?d.depositCents:0};}
}
export function registerPublicOperations(app:Express,ops:Operations){const limit=rateLimit({windowMs:60_000,limit:60,legacyHeaders:false});app.get('/availability',limit,async(req,res)=>res.json(await ops.availability(req.query.month)));app.post('/tracking/read',limit,async(req,res)=>{res.setHeader('Cache-Control','no-store');res.json(await ops.tracking(req.body));});}
export function registerPrivateOperations(app:Express,ops:Operations){
  app.use('/events',(_req,res,next)=>{if(!['admin','editor'].includes(res.locals.user?.role)){res.status(403).json({error:'Tu cuenta no tiene permiso para administrar eventos.'});return;}next();});
  app.get('/events',async(req,res)=>res.json(await ops.list(req.query.month)));
  app.get('/events/calendar',async(req,res)=>res.json(await ops.availability(req.query.month,true)));
  app.get('/events/by-request/:quoteId',async(req,res)=>res.json(await ops.forRequest(String(req.params.quoteId))));
  app.get('/events/prepare/:quoteId',async(req,res)=>res.json(await ops.prepare(String(req.params.quoteId))));
  app.get('/events/:id',async(req,res)=>res.json(await ops.detail(String(req.params.id))));
  app.post('/events',async(req,res)=>res.status(201).json(await ops.create(req.body,res.locals.user)));
  app.post('/events/:id',async(req,res)=>res.json(await ops.update(String(req.params.id),req.body,res.locals.user)));
  app.post('/events/:id/link',async(req,res)=>res.json(await ops.issue(String(req.params.id),req.body?.revision,res.locals.user)));
}
