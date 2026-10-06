import assert from 'node:assert/strict';
import {jsonDocument} from '../server/jsonDocument';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'mysql2/promise';
type Request=(route:string,body?:unknown,cookie?:string,origin?:string)=>Promise<Response>;
export async function testQuoteIntegration(pool:Pool,request:Request,owner:string) {
  const catalog=await (await request('/published')).json();
  const selection={eventType:'cena_privada',eventDate:'2099-06-15',zoneId:catalog.zones[0].id,packageId:catalog.packages[0].id,guestsCount:8,selectedExtras:{}};
  assert.equal((await request('/quotes/estimate',{...selection,totalEstimatedCents:1})).status,400);
  assert.equal((await request('/quotes/estimate',selection,undefined,'https://outside.test')).status,403);
  const response=await request('/quotes/estimate',selection);assert.equal(response.status,200);
  const estimate=await response.json();
  const payload={selection,contact:{name:'Persona de prueba',phone:'+52 612 000 0000',dietaryRestrictions:'Nota ficticia',additionalNotes:''},acceptedVersion:estimate.version,idempotencyKey:randomUUID(),consent:true};
  assert.equal((await request('/quotes/submit',{...payload,consent:false})).status,400);
  assert.equal((await request('/quotes/submit',{...payload,contact:{...payload.contact,phone:'abc'}})).status,400);
  const duplicate=await Promise.all([request('/quotes/submit',payload),request('/quotes/submit',payload)]);
  assert.deepEqual(duplicate.map(r=>r.status),[201,201]);
  const a=await duplicate[0].json(),b=await duplicate[1].json();assert.equal(a.folio,b.folio);
  assert.match(a.folio,/^CO-\d{8}-[A-F0-9]{32}$/);assert.equal(a.contact,undefined);
  assert.equal(a.estimate.breakdown.totalEstimatedCents,estimate.breakdown.totalEstimatedCents);
  assert.equal((await request('/quotes/submit',{...payload,contact:{...payload.contact,name:'Otra persona'}})).status,409);
  // Publishing after the estimate must require new acceptance, but replaying an already saved request is stable.
  const state=await (await request('/state',undefined,owner)).json();
  state.draft=structuredClone(state.published);state.draft.packages[0].pricePerPersonCents+=100;
  assert.equal((await request('/draft',{revision:state.revision,draft:state.draft},owner)).status,200);
  assert.equal((await request('/publish',{revision:state.revision+1},owner)).status,200);
  assert.equal((await request('/quotes/submit',{...payload,idempotencyKey:randomUUID()})).status,409);
  const retry=await (await request('/quotes/submit',payload)).json();assert.deepEqual(retry,a);
  const [rows]=await pool.query<any[]>('SELECT estimate_snapshot,contact_document,consent_version FROM quote_requests');
  assert.equal(rows.length,1);assert.deepEqual(jsonDocument(rows[0].estimate_snapshot),estimate);
  assert.equal(jsonDocument(rows[0].contact_document).name,'Persona de prueba');assert.equal(rows[0].consent_version,'local-demo-v1');
  // Folio is never a public read credential. No public request listing exists.
  assert.equal((await request(`/quotes/${a.folio}`)).status,401);
  assert.equal((await request('/quotes')).status,401);
  const updated=await (await request('/quotes/estimate',selection)).json();
  assert.equal((await request('/quotes/submit',{...payload,idempotencyKey:randomUUID(),acceptedVersion:updated.version})).status,201);
  const commercialSelection={...selection,commercial:{investment:'fits',requirements:'pending',dietaryReview:true}};
  const commercialEstimate=await (await request('/quotes/estimate',commercialSelection)).json();
  assert.equal(commercialEstimate.qualification.status,'clarify');
  const mismatch=await request('/quotes/submit',{...payload,selection:commercialSelection,contact:{...payload.contact,dietaryRestrictions:''},acceptedVersion:commercialEstimate.version,idempotencyKey:randomUUID()});
  assert.equal(mismatch.status,400);
  // Do not add another row: existing inbox tests intentionally use two requests.
  const current=await (await request('/state',undefined,owner)).json();
  current.draft=structuredClone(current.published);current.draft.rules.validityDays=12;
  assert.equal((await request('/draft',{revision:current.revision,draft:current.draft},owner)).status,200);
  assert.equal((await request('/publish',{revision:current.revision+1},owner)).status,200);
  assert.equal((await request('/quotes/submit',{...payload,selection:commercialSelection,acceptedVersion:commercialEstimate.version,idempotencyKey:randomUUID()})).status,409);
  console.log('OK: MariaDB real; folio, doble envío concurrente, snapshot, cambio de tarifas, consentimiento y privacidad.');
}
