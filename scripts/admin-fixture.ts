// Ephemeral UI review only. No SQL, environment credentials, outbound requests or notifications.
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {clientCatalog} from '../src/admin/clientCatalog';
import {defaultCatalog} from '../src/admin/catalog';
import {estimateItinerary} from '../server/itineraryEngine';
import {estimateQuote,QuoteError,object,exactKeys,textField} from '../server/quoteEngine';
import {validateEvent} from '../server/operations';
import {prepareRequest,requestAmounts,requestDays} from '../src/utils/requestSummary';
import {SALES_STATUSES,type InboxDetail} from '../src/types/inbox';
import {eventDates,blankEvent,expiredHold} from '../src/types/operations';
import {attention} from '../src/types/availability';

export function adminFixture() {
  const catalog=clientCatalog(defaultCatalog()), requests=new Map<string,InboxDetail>(), events=new Map<string,any>();
  const links=new Map<string,{kind:'request'|'event';id:string}>();let responseHours=24;
  const breakfast={menuId:'desayunos',requestedTime:'08:30',selectedDishes:{desayuno:'chilaquiles',salsa:'verde',proteina:'pollo'}};
  const dinner={menuId:'cena-tres',requestedTime:'20:00',selectedDishes:{entrada:'ensalada',fuerte:'short-rib',postre:'flan'}};
  const start=new Date();start.setMonth(start.getMonth()+2);start.setDate(10);
  const date=(day:number)=>`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const samples=[
    {name:'Andrea · ficticia',estimate:estimateItinerary(catalog,{guestsCount:8,location:'Villa de prueba, La Paz',days:[
      {date:date(10),services:['desayuno','comida'],selections:{desayuno:breakfast,comida:{menuId:'lunch',requestedTime:'14:00',selectedDishes:{lunch:'pescado'}}}},
      {date:date(12),services:['desayuno','cena'],selections:{desayuno:{menuId:'desayunos',requestedTime:'09:00',selectedDishes:{desayuno:'omelette'}},cena:dinner}}
    ]})},
    {name:'Carla · ficticia',estimate:estimateItinerary(catalog,{guestsCount:10,days:[{date:date(16),services:['cena'],selections:{cena:dinner}}]})},
    {name:'Miguel · itinerario anterior',estimate:estimateItinerary(catalog,{guestsCount:12,days:[{date:date(20),services:['desayuno','comida']},{date:date(21),services:['cena']}]})},
    {name:'Diego · solicitud anterior',estimate:estimateQuote(catalog,{eventType:'cena_privada',eventDate:date(24),zoneId:'zona-0',packageId:'desayunos',guestsCount:8,selectedExtras:{},selectedDishes:{desayuno:'omelette'}})}
  ];
  samples.forEach((sample,index)=>{
    const id=`00000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`,amounts=requestAmounts(sample.estimate);
    requests.set(id,{id,folio:`CO-FICTICIO-00${index+1}`,createdAt:new Date(Date.now()-index*3600000).toISOString(),name:sample.name,
      eventDate:requestDays(sample.estimate)[0].date,eventDates:requestDays(sample.estimate).map(day=>day.date),guests:sample.estimate.selection.guestsCount,
      totalCents:amounts.totalCents,subtotalCents:amounts.subtotalCents,hasPendingAmounts:amounts.pending,
      availability:{status:'pending'},
      followup:{revision:0,status:index===3?'cerrada':'nueva',assigneeId:null,nextAction:'',nextDate:''},estimate:sample.estimate,
      contact:{name:sample.name,phone:'+52 612 000 0000',dietaryRestrictions:index===0?'Alergia a nueces: el chef debe revisar los ingredientes.':'',additionalNotes:index===0?'Celebración familiar. Revisar acceso a cocina.':''},activity:[]});
  });
  const first=[...requests.values()][0];first.createdAt=new Date(Date.now()-25*3600000).toISOString();
  for(const [day,status,title,holdUntil] of [
    [16,'hold','Apartado ficticio',new Date(Date.now()+2*86400000).toISOString()],
    [20,'hold','Apartado vencido ficticio',new Date(Date.now()-3600000).toISOString()],
    [21,'blocked','Compromiso del restaurante',''],[24,'confirmed','Evento confirmado ficticio','']
  ] as const){const id=randomUUID();const data={...blankEvent(date(day)),status,name:title,holdUntil,totalCents:status==='confirmed'?200000:null,depositCents:status==='confirmed'?100000:0,paymentVerified:status==='confirmed',proposal:'Acuerdo ficticio'};events.set(id,{id,quoteId:null,folio:'EV-FICTICIO-'+day,data,revision:0,proposalVersion:0,published:null,activity:[],proposals:[]});}
  const request=(id:string)=>{const q=requests.get(id);if(!q)throw new QuoteError('Solicitud ficticia no encontrada.',404);return q;};
  const check=(dates:string[],own:string|null)=>{if([...events.values()].some(e=>e.id!==own&&(e.data.status==='confirmed'||e.data.status==='blocked'||(e.data.status==='hold'&&!expiredHold(e.data)))&&eventDates(e.data).some(day=>dates.includes(day))))throw new QuoteError('Una de las fechas ya tiene una reserva, apartado vigente o bloqueo. Revisa la Agenda antes de continuar.',409);};
  const guard=(data:any,own:string|null,quoteId:string|null)=>{if(['hold','confirmed'].includes(data.status)&&quoteId&&request(quoteId).availability?.status==='unavailable')throw new QuoteError('Esta solicitud se marcó como no disponible. Revisa y cambia explícitamente la decisión antes de apartar o confirmar.',409);if(['hold','confirmed','blocked'].includes(data.status))check(eventDates(data),own);};
  const ficha=(id:string)=>{const e=events.get(id);if(!e)throw new QuoteError('Ficha ficticia no encontrada.',404);return {...e,sourceRequest:e.quoteId?request(e.quoteId):null,requestedDates:e.quoteId?requestDays(request(e.quoteId).estimate).map(day=>day.date):[]};};
  return {requests,events,catalog,handle(path:string,method:string,body:unknown,query:URLSearchParams){
    if(method==='GET') {
      if(path==='published')return catalog;
      if(path==='mode')return {authentication:true};
      if(path==='auth/status')return {setupRequired:false,user:{name:'Chef · prueba local',email:'chef@example.test',role:'admin'}};
      if(path==='state' || path==='draft')return path==='draft'?catalog:{revision:0,draft:catalog,published:catalog,previous:null,publishedAt:null};
      if(path==='availability'||path==='events/calendar'){const days:Record<string,string>={};for(const e of events.values())if(e.data.status==='blocked'||e.data.status==='confirmed'||(e.data.status==='hold'&&!expiredHold(e.data)))for(const day of eventDates(e.data))if(day.startsWith(query.get('month')??''))days[day]=path==='events/calendar'?e.data.status:e.data.status==='hold'?'review':'unavailable';return {days,month:query.get('month')};}
      if(path==='inbox/staff')return [{id:1,name:'Carlos · ficticio'},{id:2,name:'Karen · ficticia'}];
      if(path==='inbox/settings')return {responseHours};
      if(path==='inbox') {
        for(const q of requests.values())q.attention=attention(q.createdAt,q.availability?.status??'pending',responseHours);
        const priority={nueva:0,en_revision:1,contactada:2,cerrada:3},search=(query.get('q')??'').toLocaleLowerCase();
        const all=[...requests.values()].filter(q=>(!query.get('status')||q.followup.status===query.get('status'))&&`${q.name} ${q.folio}`.toLocaleLowerCase().includes(search)).sort((a,b)=>Number(!!b.attention?.overdue)-Number(!!a.attention?.overdue)||Number(b.availability?.status==='pending')-Number(a.availability?.status==='pending')||priority[a.followup.status]-priority[b.followup.status]||b.createdAt.localeCompare(a.createdAt));
        const page=Number(query.get('page')??1);
        return {items:all.slice((page-1)*20,page*20).map(({estimate,contact,activity,...card})=>card),total:all.length,page};
      }
      if(path.startsWith('inbox/')){const q=request(path.slice(6)),e=[...events.values()].find(e=>e.quoteId===q.id);q.attention=attention(q.createdAt,q.availability?.status??'pending',responseHours);q.reservationStatus=e?(expiredHold(e.data)?'draft':e.data.status):'draft';q.reservationHoldUntil=e?.data.status==='hold'&&!expiredHold(e.data)?e.data.holdUntil:'';return q;}
      if(path.startsWith('events/prepare/'))return prepareRequest(request(path.slice(15)));
      if(path.startsWith('events/by-request/'))return {id:[...events.values()].find(e=>e.quoteId===path.slice(18))?.id??null};
      if(path==='events')return [...events.values()].filter(e=>eventDates(e.data).some(day=>day.startsWith(query.get('month')??'')));
      if(/^events\/[a-f0-9-]{36}$/.test(path))return ficha(path.slice(7));
    }
    if(method==='POST') {
      if(path==='inbox/settings'){const b=object(body);exactKeys(b,['responseHours','expectedHours']);if(b.expectedHours!==responseHours)throw new QuoteError('Otra persona cambió el plazo. Recarga antes de guardar.',409);if(!Number.isSafeInteger(b.responseHours)||Number(b.responseHours)<1||Number(b.responseHours)>720)throw new QuoteError('Indica un plazo entre 1 y 720 horas.');responseHours=Number(b.responseHours);return {responseHours};}
      if(path==='tracking/read'){const b=object(body);exactKeys(b,['token']);if(typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))throw new QuoteError('Enlace no disponible.',404);const link=links.get(createHash('sha256').update(b.token).digest('hex'));if(!link)throw new QuoteError('Enlace no disponible.',404);if(link.kind==='request'){const q=request(link.id),e=[...events.values()].find(e=>e.quoteId===q.id);return {kind:'request',folio:q.folio,dates:requestDays(q.estimate).map(day=>day.date),availability:q.availability?.status??'pending',status:e?(expiredHold(e.data)?'draft':e.data.status):'draft',holdUntil:e?.data.status==='hold'&&!expiredHold(e.data)?e.data.holdUntil:''};}const e=events.get(link.id);return {folio:e.folio,status:expiredHold(e.data)?'draft':e.data.status,holdUntil:e.data.status==='hold'&&!expiredHold(e.data)?e.data.holdUntil:'',proposal:e.published,depositCents:e.data.status==='confirmed'?e.data.depositCents:0};}
      const decisionMatch=path.match(/^inbox\/([a-f0-9-]{36})\/availability$/);
      if(decisionMatch){const q=request(decisionMatch[1]),b=object(body);exactKeys(b,['revision','status','note']);if(b.revision!==q.followup.revision)throw new QuoteError('Otra persona cambió esta solicitud. Recarga antes de decidir.',409);if(typeof b.status!=='string'||!['available','unavailable'].includes(b.status))throw new QuoteError('Decisión inválida.');const note=textField(b.note,500),e=[...events.values()].find(e=>e.quoteId===q.id);if(b.status==='available')check(requestDays(q.estimate).map(day=>day.date),e?.data.status==='blocked'?null:e?.id??null);else if(e&&(e.data.status==='confirmed'||(e.data.status==='hold'&&!expiredHold(e.data))))throw new QuoteError('Esta solicitud tiene una reserva o apartado vigente. Revisa primero su ficha.',409);const before={...q.followup};q.followup.revision++;q.availability={status:b.status as 'available'|'unavailable',actorId:1,actorName:'Chef · prueba local',decidedAt:new Date().toISOString(),note};q.activity.unshift({id:q.activity.length+1,actorName:'Chef · prueba local',createdAt:q.availability.decidedAt!,change:{kind:'availability',before,after:{...q.followup},note,decision:q.availability}});return {ok:true};}
      const linkMatch=path.match(/^(inbox|events)\/([a-f0-9-]{36})\/link$/);
      if(linkMatch){const b=object(body);exactKeys(b,['revision']);const kind=linkMatch[1]==='inbox'?'request':'event',id=linkMatch[2],e=kind==='request'?request(id):events.get(id);if(!e)throw new QuoteError('Enlace no disponible.',404);const revision=kind==='request'?e.followup.revision:e.revision;if(b.revision!==revision)throw new QuoteError('Recarga antes de generar el enlace.',409);for(const [hash,value]of links)if(value.id===id&&value.kind===kind)links.delete(hash);const token=randomBytes(32).toString('hex');links.set(createHash('sha256').update(token).digest('hex'),{id,kind});if(kind==='request')e.followup.revision++;else e.revision++;return {token};}
      if(path.startsWith('inbox/')) {
        const q=request(path.slice(6)),b=object(body);exactKeys(b,['revision','status','assigneeId','nextAction','nextDate','note']);
        if(b.revision!==q.followup.revision)throw new QuoteError('Recarga el detalle antes de guardar.',409);
        if(typeof b.status!=='string'||!Object.hasOwn(SALES_STATUSES,b.status)||![null,1,2].includes(b.assigneeId as any))throw new QuoteError('Seguimiento inválido.');
        const nextAction=textField(b.nextAction,500),nextDate=textField(b.nextDate,10);
        if(nextDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)||!nextAction))throw new QuoteError('Escribe la próxima acción y su fecha.');
        const before={...q.followup};q.followup={revision:before.revision+1,status:b.status as keyof typeof SALES_STATUSES,assigneeId:b.assigneeId as number|null,nextAction,nextDate};
        q.activity.unshift({id:q.activity.length+1,actorName:'Chef · prueba local',createdAt:new Date().toISOString(),change:{before,after:{...q.followup},note:textField(b.note,4000)}});return {ok:true};
      }
      if(path==='events') {
        const b=object(body);exactKeys(b,['data','quoteId']);const data=validateEvent(b.data);
        if(data.status==='confirmed')throw new QuoteError('Publica la propuesta antes de confirmar.');
        if(b.quoteId!==null&&typeof b.quoteId!=='string')throw new QuoteError('Solicitud inválida.');
        const q=b.quoteId?request(b.quoteId as string):null;if(q&&[...events.values()].some(e=>e.quoteId===q.id))throw new QuoteError('Esta solicitud ya tiene ficha.',409);
        guard(data,null,q?.id??null);
        const id=randomUUID();events.set(id,{id,quoteId:q?.id??null,folio:q?.folio??'EV-FICTICIO',data,revision:0,proposalVersion:0,published:null,activity:[],proposals:[]});return {id};
      }
      if(/^events\/[a-f0-9-]{36}$/.test(path)) {
        const e=events.get(path.slice(7));if(!e)throw new QuoteError('Ficha no encontrada.',404);
        const b=object(body);exactKeys(b,['revision','data','publish']);if(b.revision!==e.revision)throw new QuoteError('Recarga la ficha.',409);
        const data=validateEvent(b.data);guard(data,e.id,e.quoteId);
        if(data.status==='confirmed'&&!b.publish&&(!e.published||['date','guests','schedule','proposal','totalCents'].some(key=>e.published[key]!==data[key])||JSON.stringify(e.published.dates)!==JSON.stringify(eventDates(data))))throw new QuoteError('Publica la propuesta final antes de confirmar.');
        if(b.publish&&(!data.proposal||data.totalCents===null))throw new QuoteError('Completa el importe acordado antes de publicar la propuesta ficticia.');
        e.data=data;e.revision++;
        if(b.publish){e.proposalVersion++;e.published={folio:e.folio,version:e.proposalVersion,date:data.date,dates:eventDates(data),guests:data.guests,schedule:data.schedule,proposal:data.proposal,notes:data.publicNotes,totalCents:data.totalCents};e.proposals.push(e.published);}return {ok:true};
      }
    }
    throw new QuoteError('Acción deshabilitada en la vista ficticia. No se envían mensajes, enlaces ni solicitudes reales.',403);
  }};
}
