import assert from 'node:assert/strict';
import {clientCatalog} from '../src/admin/clientCatalog';
import {defaultCatalog} from '../src/admin/catalog';
import {estimateItinerary} from '../server/itineraryEngine';
import {prepareRequest,requestAmounts,requestDays} from '../src/utils/requestSummary';
import {validateEvent} from '../server/operations';
const catalog=clientCatalog(defaultCatalog());
const breakfast={menuId:'desayunos',requestedTime:'08:30',selectedDishes:{desayuno:'chilaquiles',salsa:'verde',proteina:'pollo'}};
const dinner={menuId:'cena-tres',requestedTime:'20:00',selectedDishes:{entrada:'ensalada',fuerte:'short-rib',postre:'flan'}};
const estimate=estimateItinerary(catalog,{guestsCount:8,location:'Villa ficticia',days:[
  {date:'2099-05-10',services:['desayuno','cena'],selections:{desayuno:breakfast,cena:dinner}},
  {date:'2099-05-12',services:['desayuno'],selections:{desayuno:{menuId:'desayunos',requestedTime:'09:30',selectedDishes:{desayuno:'omelette'}}}}
]});
const source={id:'00000000-0000-0000-0000-000000000000',folio:'CO-TEST',estimate,contact:{name:'Cliente ficticio',phone:'+52 612 000 0000',dietaryRestrictions:'Alergia informada',additionalNotes:'Nota privada'}};
const before=JSON.stringify(source), prepared=prepareRequest(source);
assert.equal(prepared.data.status,'draft');assert.deepEqual(prepared.data.dates,['2099-05-10','2099-05-12']);
assert.equal(prepared.data.address,'Villa ficticia');assert.equal(prepared.data.totalCents,null);
assert.equal(requestAmounts(estimate).subtotalCents,1520000);assert.equal(requestAmounts(estimate).pending,true);
const days=requestDays(estimate);assert.equal(days[0].services[1].subtotalCents,null);
assert.ok(days[0].services[0].dishes.some(d=>d.name==='Verde'));
assert.ok(!days[1].services[0].dishes.some(d=>d.name==='Verde'));
assert.match(prepared.data.proposal,/08:30/);assert.match(prepared.data.proposal,/09:30/);assert.match(prepared.data.proposal,/Cena de tres tiempos/);
assert.match(prepared.data.proposal,/Verde/);assert.match(prepared.data.internalNotes,/Alergia informada/);
assert.match(prepared.data.internalNotes,/Nota privada/);assert.equal(prepared.data.publicNotes,'');
prepared.data.proposal+='\nAjuste autorizado';assert.equal(JSON.stringify(source),before);
validateEvent(prepared.data);
const onlyDinner=estimateItinerary(catalog,{guestsCount:8,days:[{date:'2099-05-10',services:['cena'],selections:{cena:dinner}}]});
assert.equal(requestAmounts(onlyDinner).subtotalCents,null);assert.equal(requestDays(onlyDinner)[0].services[0].subtotalCents,null);
const old=estimateItinerary(catalog,{guestsCount:8,days:[{date:'2099-05-10',services:['desayuno','cena']}]});
assert.equal(requestDays(old)[0].services[0].menu,'Menú por acordar');assert.equal(requestAmounts(old).subtotalCents,null);
const phase1={...estimate,engineVersion:'itinerary-v2' as const,pricing:undefined};
assert.equal(requestDays(phase1)[0].services[0].menu,'Desayunos');assert.ok(requestDays(phase1)[0].services[0].dishes.some(d=>d.name==='Verde'));
// The complete supported 31-day itinerary fits the editable proposal without truncation.
const long=estimateItinerary(catalog,{guestsCount:8,days:Array.from({length:31},(_,i)=>({date:`2099-05-${String(i+1).padStart(2,'0')}`,services:['desayuno','comida','cena'],selections:{desayuno:breakfast,comida:{menuId:'lunch',requestedTime:'14:00',selectedDishes:{lunch:'pescado'}},cena:dinner}}))});
const longPrepared=prepareRequest({...source,estimate:long});validateEvent(longPrepared.data);
assert.equal(longPrepared.data.dates.length,31);assert.equal((longPrepared.data.proposal.match(/20:00/g)??[]).length,31);
assert.equal((longPrepared.data.schedule.match(/14:00/g)??[]).length,31);
assert.equal(JSON.stringify(longPrepared.sourceRequest.estimate),JSON.stringify(long));
console.log('OK: snapshot → ficha; fechas, servicios, variantes independientes, ubicación, notas, desconocidos nulos, itinerarios v1/v2/v3 y 31 días sin truncamiento.');
