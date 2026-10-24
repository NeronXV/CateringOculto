import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {Pool} from 'mysql2/promise';
import {clientCatalog} from '../src/admin/clientCatalog';
import {ItineraryStore} from '../server/itineraryStore';
type Request=(route:string,body?:unknown,cookie?:string,origin?:string)=>Promise<Response>;
export async function testPremiumIntegration(pool:Pool,request:Request,owner:string) {
  const state=await (await request('/state',undefined,owner)).json(),draft=clientCatalog(state.draft);
  assert.equal((await request('/draft',{revision:state.revision,draft},owner)).status,200);
  assert.equal((await request('/publish',{revision:state.revision+1},owner)).status,200);
  const selection={eventType:'cena_privada',eventDate:'2099-07-16',zoneId:draft.zones[0].id,packageId:'desayunos',guestsCount:8,selectedExtras:{},selectedDishes:{desayuno:'chilaquiles',salsa:'verde',proteina:'pollo'}};
  const response=await request('/quotes/estimate',selection);assert.equal(response.status,200);
  const estimate=await response.json();assert.equal(estimate.breakdown.dishSummary.length,3);
  const payload={selection,contact:{name:'Prueba de platillos',phone:'+52 612 000 0000',dietaryRestrictions:'',additionalNotes:'Ensayo aislado'},acceptedVersion:estimate.version,idempotencyKey:randomUUID(),consent:true};
  const submitted=await request('/quotes/submit',payload);assert.equal(submitted.status,201);const receipt=await submitted.json();
  const [rows]=await pool.query<any[]>('SELECT consent_version FROM quote_requests WHERE folio=?',[receipt.folio]);assert.equal(rows[0].consent_version,'quote-consent-v1');
  const list=await (await request('/inbox?q='+receipt.folio,undefined,owner)).json();assert.equal(list.total,1);
  const detail=await (await request('/inbox/'+list.items[0].id,undefined,owner)).json();assert.deepEqual(detail.estimate,estimate);
  const legacyPrepared=await (await request('/events/prepare/'+list.items[0].id,undefined,owner)).json();
  assert.deepEqual(legacyPrepared.data.dates,[selection.eventDate]);
  assert.match(legacyPrepared.data.proposal,/Chilaquiles/);assert.match(legacyPrepared.data.proposal,/Verde/);
  assert.equal(legacyPrepared.data.totalCents,null);
  // Phase 1 contract: real SQL preserves independent selections; submit does not occupy days.
  const itinerarySelection={guestsCount:8,days:[
    {date:'2099-11-10',services:['desayuno','cena'],selections:{
      desayuno:{menuId:'desayunos',requestedTime:'08:30',selectedDishes:{desayuno:'chilaquiles',salsa:'verde',proteina:'pollo'}},
      cena:{menuId:'cena-tres',requestedTime:'20:00',selectedDishes:{entrada:'ensalada',fuerte:'short-rib',postre:'flan'}}}},
    {date:'2099-11-12',services:['desayuno'],selections:{desayuno:{menuId:'desayunos',requestedTime:'09:00',selectedDishes:{desayuno:'omelette'}}}}
  ]};
  const bad=structuredClone(itinerarySelection);bad.days[0].selections.desayuno.menuId='lunch';
  assert.equal((await request('/quotes/itinerary/estimate',bad)).status,400);
  const itineraryEstimate=await (await request('/quotes/itinerary/estimate',itinerarySelection)).json();
  assert.equal(itineraryEstimate.engineVersion,'itinerary-v3');
  assert.equal(itineraryEstimate.pricing.menuSubtotalCents,1520000);
  assert.equal(itineraryEstimate.pricing.lines.find((line:any)=>line.service==='cena').subtotalCents,null);
  const itineraryPayload={...payload,selection:itinerarySelection,acceptedVersion:itineraryEstimate.version,idempotencyKey:randomUUID()};
  const [beforeEvents]=await pool.query<any[]>('SELECT COUNT(*) AS total FROM service_events');
  // Exercise SQL concurrency directly; keep the HTTP suite below its real rate limit.
  const itineraryStore=new ItineraryStore(pool);
  const duplicates=await Promise.all([itineraryStore.submit(itineraryPayload),itineraryStore.submit(itineraryPayload)]);
  const itineraryReceipt=duplicates[0];assert.equal(duplicates[1].folio,itineraryReceipt.folio);
  const itineraryList=await (await request('/inbox?q='+itineraryReceipt.folio,undefined,owner)).json();assert.equal(itineraryList.total,1);
  const itineraryDetail=await (await request('/inbox/'+itineraryList.items[0].id,undefined,owner)).json();
  assert.deepEqual(itineraryDetail.estimate.selection,itinerarySelection);
  assert.deepEqual(itineraryDetail.estimate.pricing,itineraryEstimate.pricing);
  assert.equal(itineraryList.items[0].subtotalCents,1520000);assert.equal(itineraryList.items[0].totalCents,null);
  assert.equal(itineraryList.items[0].hasPendingAmounts,true);
  assert.deepEqual(itineraryList.items[0].eventDates,itinerarySelection.days.map(day=>day.date));
  const [afterEvents]=await pool.query<any[]>('SELECT COUNT(*) AS total FROM service_events');assert.equal(afterEvents[0].total,beforeEvents[0].total);
  const requestId=itineraryDetail.id;
  assert.equal((await request('/events/prepare/'+requestId)).status,401);
  const prepResponse=await request('/events/prepare/'+requestId,undefined,owner);assert.equal(prepResponse.status,200);
  const prepared=await prepResponse.json();
  assert.equal(prepared.data.status,'draft');assert.equal(prepared.data.totalCents,null);
  assert.equal(prepared.data.paymentVerified,false);assert.equal(prepared.data.depositCents,0);
  assert.match(prepared.data.schedule,/08:30/);assert.match(prepared.data.schedule,/09:00/);
  assert.match(prepared.data.proposal,/20:00/);assert.match(prepared.data.proposal,/Cena de tres tiempos/);
  assert.match(prepared.data.proposal,/Chilaquiles/);assert.match(prepared.data.proposal,/Verde/);assert.match(prepared.data.proposal,/Pollo/);
  assert.deepEqual(prepared.sourceRequest.estimate,itineraryEstimate);
  const createPayload={quoteId:requestId,data:prepared.data};
  assert.equal((await request('/events',createPayload)).status,401);
  assert.equal((await request('/events',createPayload,owner,'https://outside.test')).status,403);
  assert.equal((await request('/events',{...createPayload,sourceRequest:{estimate:'alterado'}},owner)).status,400);
  const created=await request('/events',createPayload,owner);assert.equal(created.status,201);
  const eventId=(await created.json()).id;
  assert.equal((await request('/events',createPayload,owner)).status,409);
  let ficha=await (await request('/events/'+eventId,undefined,owner)).json();
  assert.deepEqual(ficha.data,prepared.data);assert.deepEqual(ficha.sourceRequest.estimate,itineraryEstimate);
  assert.equal((await (await request('/availability?month=2099-11')).json()).days['2099-11-10'],undefined);
  assert.equal((await request('/events/'+eventId,{revision:0,data:ficha.data,publish:true},owner)).status,400,'Subtotal is not a final proposal');
  const agreed={...ficha.data,totalCents:1800000,proposal:ficha.data.proposal+'\nAjuste acordado por el chef.'};
  assert.equal((await request('/events/'+eventId,{revision:0,data:agreed,publish:true},owner)).status,200);
  assert.equal((await request('/events/'+eventId,{revision:0,data:agreed,publish:false},owner)).status,409);
  ficha=await (await request('/events/'+eventId,undefined,owner)).json();
  assert.equal(ficha.published.proposal,agreed.proposal);assert.equal(ficha.published.schedule,prepared.data.schedule);
  assert.deepEqual(ficha.published.dates,itinerarySelection.days.map(day=>day.date));
  assert.equal(ficha.data.status,'draft');assert.deepEqual(ficha.sourceRequest.estimate,itineraryEstimate);
  assert.equal(ficha.sourceRequest.contact.additionalNotes,payload.contact.additionalNotes);
  const updated=await (await request('/state',undefined,owner)).json();updated.draft.packages[0].choiceGroups[0].options[1].name='Nuevo nombre';
  assert.equal((await request('/draft',{revision:updated.revision,draft:updated.draft},owner)).status,200);
  assert.equal((await request('/publish',{revision:updated.revision+1},owner)).status,200);
  assert.equal((await request('/quotes/submit',{...payload,idempotencyKey:randomUUID()})).status,409);
  assert.deepEqual(await (await request('/quotes/submit',payload)).json(),receipt);
  await assert.rejects(itineraryStore.submit({...itineraryPayload,idempotencyKey:randomUUID()}),(error:any)=>error.status===409);
  assert.deepEqual(await itineraryStore.submit(itineraryPayload),itineraryReceipt);
  const sourceAfter=await (await request('/events/'+eventId,undefined,owner)).json();
  assert.deepEqual(sourceAfter.sourceRequest.estimate,itineraryEstimate);
  assert.equal(sourceAfter.data.proposal,agreed.proposal);
  console.log('OK: MariaDB real; catálogo cliente, platillos, consentimiento, bandeja y snapshot estable tras editar opciones.');
}
