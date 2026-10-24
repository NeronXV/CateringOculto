import assert from 'node:assert/strict';
import type {Pool} from 'mysql2/promise';
import {blankEvent} from '../src/types/operations';
import {validateEvent} from '../server/operations';
type Request=(route:string,body?:unknown,cookie?:string,origin?:string)=>Promise<Response>;
export async function testOperations(pool:Pool,request:Request,admin:string,editor:string){
  const base={...blankEvent('2099-09-01'),name:'Cliente ficticio',phone:'+52 612 000 0000',status:'hold' as const,holdUntil:'2099-09-02T12:00:00.000Z',internalNotes:'PRIVADO no publicar',address:'DIRECCION PRIVADA'};
  assert.throws(()=>validateEvent({...base,totalCents:1.5}));assert.throws(()=>validateEvent({...base,date:'2099-02-30'}));
  assert.throws(()=>validateEvent({...base,status:'confirmed'}));
  assert.equal((await request('/events?month=2099-09')).status,401);
  const competing=await Promise.all([request('/events',{data:base,quoteId:null},admin),request('/events',{data:base,quoteId:null},editor)]);
  assert.deepEqual(competing.map(r=>r.status).sort(),[201,409]);
  const id=(await competing.find(r=>r.status===201)!.json()).id;
  const avail=await (await request('/availability?month=2099-09')).json();assert.equal(avail.days['2099-09-01'],'review');assert.ok(!JSON.stringify(avail).includes('Cliente'));
  let detail=await (await request('/events/'+id,undefined,editor)).json();
  let proposal={...detail.data,totalCents:100000,depositCents:50000,paymentVerified:true,proposal:'Menú final acordado',publicNotes:'Condiciones acordadas'};
  assert.equal((await request('/events/'+id,{revision:detail.revision,data:{...proposal,status:'confirmed'},publish:false},editor)).status,400);
  assert.equal((await request('/events/'+id,{revision:detail.revision,data:proposal,publish:true},editor)).status,200);
  assert.equal((await request('/events/'+id,{revision:detail.revision,data:proposal,publish:true},admin)).status,409);
  detail=await (await request('/events/'+id,undefined,editor)).json();
  let result=await request('/events/'+id+'/link',{revision:detail.revision},editor);assert.equal(result.status,200);const first=(await result.json()).token;
  const publicView=await (await request('/tracking/read',{token:first})).json();
  assert.equal(publicView.proposal.proposal,'Menú final acordado');assert.ok(!JSON.stringify(publicView).includes('PRIVADO'));assert.ok(!JSON.stringify(publicView).includes('DIRECCION'));
  detail=await (await request('/events/'+id,undefined,editor)).json();
  assert.equal((await request('/events/'+id,{revision:detail.revision,data:{...proposal,status:'confirmed'},publish:false},editor)).status,200);
  assert.equal((await (await request('/availability?month=2099-09')).json()).days['2099-09-01'],'unavailable');
  const selection={eventType:'cena_privada',eventDate:'2099-09-01',zoneId:'zona-0',packageId:'desayunos',guestsCount:8,selectedExtras:{},selectedDishes:{desayuno:'omelette'}};
  const estimate=await (await request('/quotes/estimate',selection)).json();
  assert.equal((await request('/quotes/submit',{selection,acceptedVersion:estimate.version,consent:true,idempotencyKey:crypto.randomUUID(),contact:{name:'Ensayo de fecha ocupada',phone:'+52 612 000 0000',dietaryRestrictions:'',additionalNotes:''}})).status,409);
  assert.equal((await (await request('/tracking/read',{token:first})).json()).depositCents,50000);
  detail=await (await request('/events/'+id,undefined,editor)).json();
  assert.equal((await request('/events/'+id,{revision:detail.revision,data:{...proposal,status:'confirmed',proposal:'Cambio no publicado'},publish:false},editor)).status,400);
  result=await request('/events/'+id+'/link',{revision:detail.revision},admin);const second=(await result.json()).token;
  assert.equal((await request('/tracking/read',{token:first})).status,404);
  assert.equal((await request('/tracking/read',{token:second})).status,200);
  const [hashes]=await pool.query<any[]>('SELECT tracking_hash FROM service_events');assert.ok(hashes.every(h=>h.tracking_hash!==second));
  assert.equal((await request('/events',{data:{...base,date:'2099-09-05'},quoteId:null},editor)).status,201);
  await pool.query("UPDATE service_events SET hold_until='2000-01-01T00:00:00.000Z' WHERE event_date='2099-09-05'");
  assert.equal((await (await request('/availability?month=2099-09')).json()).days['2099-09-05'],undefined);
  assert.equal((await request('/events',{data:{...base,date:'2099-09-05'},quoteId:null},editor)).status,201);
  // A single request spans nonconsecutive dates and months; all dates participate in locking.
  const requestedDays=[{date:'2099-10-21',services:['comida']},{date:'2099-10-25',services:['desayuno','cena']},{date:'2099-11-02',services:['desayuno']}];
  const itinSelection={guestsCount:12,days:requestedDays};
  const itinEstimate=await (await request('/quotes/itinerary/estimate',itinSelection)).json();
  const body={selection:itinSelection,acceptedVersion:itinEstimate.version,consent:true,idempotencyKey:crypto.randomUUID(),contact:{name:'Multifecha ficticia',phone:'+52 612 000 0000',dietaryRestrictions:'Alergia informada para revisar',additionalNotes:'Lugar o alojamiento: Villa de prueba'}};
  const submitted=await request('/quotes/itinerary/submit',body);assert.equal(submitted.status,201);
  const receipt=await submitted.json();
  const retry=await (await request('/quotes/itinerary/submit',body)).json();assert.equal(retry.folio,receipt.folio);
  const [quoteRows]=await pool.execute<any[]>('SELECT id,estimate_snapshot FROM quote_requests WHERE folio=?',[receipt.folio]);
  const quoteId=quoteRows[0].id, snapshotBefore=JSON.stringify(quoteRows[0].estimate_snapshot);
  const legacyItinerary=await (await request('/events/prepare/'+quoteId,undefined,editor)).json();
  assert.deepEqual(legacyItinerary.data.dates,requestedDays.map(day=>day.date));
  assert.match(legacyItinerary.data.proposal,/Menú por acordar/);
  assert.match(legacyItinerary.data.internalNotes,/Alergia informada/);
  assert.equal(legacyItinerary.data.totalCents,null);
  const multi={...base,date:requestedDays[0].date,holdUntil:'2099-12-01T12:00:00.000Z'};
  // Even an older caller with only the first date is upgraded from the immutable request.
  const created=await request('/events',{data:multi,quoteId},editor);assert.equal(created.status,201);
  const multiId=(await created.json()).id;
  assert.equal((await (await request('/events/by-request/'+quoteId,undefined,editor)).json()).id,multiId);
  assert.equal((await request('/events/by-request/'+quoteId)).status,401);
  let multiDetail=await (await request('/events/'+multiId,undefined,editor)).json();
  assert.deepEqual(multiDetail.data.dates,requestedDays.map(d=>d.date));
  assert.deepEqual(multiDetail.requestedDates,requestedDays.map(d=>d.date));
  const october=await (await request('/availability?month=2099-10')).json();
  assert.equal(october.days['2099-10-21'],'review');assert.equal(october.days['2099-10-25'],'review');assert.equal(october.days['2099-10-24'],undefined);
  assert.ok((await (await request('/events?month=2099-11',undefined,editor)).json()).some((e:any)=>e.id===multiId));
  assert.equal((await request('/events',{data:{...base,date:'2099-11-02'},quoteId:null},admin)).status,409);
  const finalData={...multiDetail.data,totalCents:100000,depositCents:50000,paymentVerified:true,proposal:'Servicios acordados por fecha'};
  assert.equal((await request('/events/'+multiId,{revision:multiDetail.revision,data:finalData,publish:true},editor)).status,200);
  multiDetail=await (await request('/events/'+multiId,undefined,editor)).json();
  assert.equal((await request('/events/'+multiId,{revision:multiDetail.revision,data:{...finalData,status:'confirmed'},publish:false},editor)).status,200);
  assert.equal((await (await request('/availability?month=2099-11')).json()).days['2099-11-02'],'unavailable');
  assert.equal((await request('/quotes/itinerary/submit',{...body,idempotencyKey:crypto.randomUUID()})).status,409);
  const legacySelection={...selection,eventDate:'2099-11-02'};
  const legacyEstimate=await (await request('/quotes/estimate',legacySelection)).json();
  assert.equal((await request('/quotes/submit',{...body,selection:legacySelection,acceptedVersion:legacyEstimate.version,idempotencyKey:crypto.randomUUID()})).status,409);
  multiDetail=await (await request('/events/'+multiId,undefined,editor)).json();
  assert.equal((await request('/events/'+multiId,{revision:multiDetail.revision,data:{...finalData,status:'confirmed',dates:['2099-10-21','2099-11-03']},publish:false},editor)).status,400);
  assert.equal((await request('/events/'+multiId,{revision:multiDetail.revision,data:{...finalData,status:'cancelled'},publish:false},editor)).status,200);
  assert.equal((await (await request('/availability?month=2099-11')).json()).days['2099-11-02'],undefined);
  const [quoteAfter]=await pool.execute<any[]>('SELECT estimate_snapshot FROM quote_requests WHERE id=?',[quoteId]);assert.equal(JSON.stringify(quoteAfter[0].estimate_snapshot),snapshotBefore);
  // Concurrent partial overlaps: one transaction wins, with no orphan date rows.
  const overlap=await Promise.all([
    request('/events',{quoteId:null,data:{...base,date:'2099-12-10',dates:['2099-12-10','2099-12-12']}},admin),
    request('/events',{quoteId:null,data:{...base,date:'2099-12-11',dates:['2099-12-11','2099-12-12']}},editor)
  ]);
  assert.deepEqual(overlap.map(r=>r.status).sort(),[201,409]);
  const [dateRows]=await pool.query<any[]>("SELECT COUNT(*) AS n FROM service_event_dates WHERE service_date BETWEEN '2099-12-10' AND '2099-12-12'");assert.equal(dateRows[0].n,2);
  for(const dates of [[],['2099-09-01','2099-09-01'],['2099-02-30'],['2099-09-03']])assert.throws(()=>validateEvent({...base,dates}));
  // The original quote is immutable; published final proposals have separate versions.
  const [versions]=await pool.query<any[]>('SELECT document FROM event_proposals WHERE event_id=?',[id]);assert.equal(versions.length,1);
  const [audits]=await pool.query<any[]>('SELECT COUNT(*) AS total FROM event_activity');assert.ok(audits[0].total>=6);
  console.log('OK: agenda MariaDB; concurrencia, dinero, publicación, privacidad, enlaces revocables, vencimiento y auditoría.');
}
