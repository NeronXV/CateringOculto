import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {Pool} from 'mysql2/promise';
import {clientCatalog} from '../src/admin/clientCatalog';
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
  const updated=await (await request('/state',undefined,owner)).json();updated.draft.packages[0].choiceGroups[0].options[1].name='Nuevo nombre';
  assert.equal((await request('/draft',{revision:updated.revision,draft:updated.draft},owner)).status,200);
  assert.equal((await request('/publish',{revision:updated.revision+1},owner)).status,200);
  assert.equal((await request('/quotes/submit',{...payload,idempotencyKey:randomUUID()})).status,409);
  assert.deepEqual(await (await request('/quotes/submit',payload)).json(),receipt);
  console.log('OK: MariaDB real; catálogo cliente, platillos, consentimiento, bandeja y snapshot estable tras editar opciones.');
}
