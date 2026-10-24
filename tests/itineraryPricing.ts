import assert from 'node:assert/strict';
import { clientCatalog } from '../src/admin/clientCatalog';
import { defaultCatalog } from '../src/admin/catalog';
import { estimateItinerary } from '../server/itineraryEngine';
import { receiptText } from '../src/utils/receipt';
import type { ItinerarySelection } from '../src/types/itinerary';

const catalog = clientCatalog(defaultCatalog());
const now = new Date('2026-10-11T12:00:00Z');
const input: ItinerarySelection = { guestsCount: 8, location: 'Villa ficticia', days: [
  { date: '2099-11-10', services: ['desayuno', 'comida', 'cena'], selections: {
    desayuno: { menuId: 'desayunos', requestedTime: '08:30', selectedDishes: { desayuno: 'chilaquiles', salsa: 'verde', proteina: 'pollo' } },
    comida: { menuId: 'lunch', requestedTime: '14:00', selectedDishes: { lunch: 'arrachera' } },
    cena: { menuId: 'cena-dos', requestedTime: '20:00', selectedDishes: { entrada: 'ensalada', fuerte: 'short-rib' } }
  } },
  { date: '2099-11-12', services: ['desayuno', 'cena'], selections: {
    desayuno: { menuId: 'desayunos', requestedTime: '09:30', selectedDishes: { desayuno: 'omelette' } },
    cena: { menuId: 'cena-tres', requestedTime: '21:00', selectedDishes: { postre: 'flan' } }
  } }
] };
const before = structuredClone(input);
const estimate = estimateItinerary(catalog, input, now), pricing = estimate.pricing!;
assert.deepEqual(input, before);
assert.deepEqual(pricing.lines.map(line => line.subtotalCents), [760000,880000,null,760000,null]);
assert.equal(pricing.menuSubtotalCents,2400000);
assert.equal(pricing.knownAmountCents,2400000);
assert.equal(pricing.taxCents,null); assert.equal(pricing.totalCents,null);
assert.equal(pricing.extrasStatus,'not_selected'); assert.equal(pricing.travelStatus,'pending');
assert.equal(pricing.lines[0].dishes.find(d=>d.group==='Salsa de chilaquiles')!.name,'Verde');
assert.equal(estimate.selection.location,'Villa ficticia');
const onlyDinner: ItinerarySelection = { guestsCount:8,days:[{date:'2099-11-10',services:['cena'],selections:{cena:input.days[0].selections!.cena!}}] };
const dinner=estimateItinerary(catalog,onlyDinner,now).pricing!;
assert.equal(dinner.menuSubtotalCents,null);assert.equal(dinner.knownAmountCents,null);
assert.equal(dinner.lines[0].perPersonCents,null);
const disabled=structuredClone(catalog);disabled.service.pricesApproved=false;
assert.equal(estimateItinerary(disabled,input,now).pricing!.menuSubtotalCents,null);
disabled.service.pricesApproved=true;disabled.packages[0].priceApproved=false;
assert.equal(estimateItinerary(disabled,input,now).pricing!.menuSubtotalCents,880000);
// Reference amounts remain unknown even if stored numerically on an unapproved menu.
disabled.packages[2].pricePerPersonCents=130000;
assert.equal(estimateItinerary(disabled,onlyDinner,now).pricing!.knownAmountCents,null);
const edited=structuredClone(input);edited.days[0].selections!.desayuno!.requestedTime='10:30';
assert.deepEqual(estimateItinerary(catalog,edited,now).pricing!.lines.slice(3),pricing.lines.slice(3));
assert.notEqual(estimateItinerary(catalog,edited,now).version,estimate.version);
const fewer=structuredClone(input);fewer.guestsCount=5;
assert.equal(estimateItinerary(catalog,fewer,now).pricing!.menuSubtotalCents,1500000);
const synthetic=structuredClone(catalog);synthetic.service.taxApproved=true;synthetic.service.taxRateBps=1600;
synthetic.service.travelMode='blocks';synthetic.service.travelApproved=true;
const taxed=estimateItinerary(synthetic,input,now).pricing!;
assert.equal(taxed.taxCents,384000);assert.equal(taxed.knownAmountCents,2784000);
assert.equal(taxed.travelStatus,'pending');assert.equal(taxed.totalCents,null,'Never apply a block per meal/day without an agreed rule.');
synthetic.packages[0].pricePerPersonCents=3;
const cents:ItinerarySelection={guestsCount:1,days:['2099-11-10','2099-11-11','2099-11-12'].map(date=>({date,services:['desayuno'],selections:{desayuno:input.days[1].selections!.desayuno!}}))};
const rounded=estimateItinerary(synthetic,cents,now).pricing!;
assert.equal(rounded.menuSubtotalCents,9);assert.equal(rounded.taxCents,1);assert.equal(rounded.knownAmountCents,10);
for(const price of [0.5,-1,Number.MAX_SAFE_INTEGER]){const bad=structuredClone(catalog);bad.packages[0].pricePerPersonCents=price;assert.throws(()=>estimateItinerary(bad,input,now));}
for(const inputOverride of [{...input,totalCents:1},{...input,pricing:{knownAmountCents:1}},{...input,location:'x'.repeat(501)},{...input,location:42}])assert.throws(()=>estimateItinerary(catalog,inputOverride,now));
const old={guestsCount:8,days:[{date:'2099-11-10',services:['desayuno']}]};
assert.equal(estimateItinerary(catalog,old,now).pricing,undefined);
assert.equal(estimateItinerary(catalog,old,now).engineVersion,'itinerary-v1');
const printed=receiptText({folio:'CO-TEST',createdAt:now.toISOString(),estimate});
assert.match(printed,/Subtotal de servicios cotizados: \$24,000/);assert.match(printed,/Precio por confirmar/);assert.ok(!printed.includes('Cena de dos tiempos: $0'));
console.log('OK: authoritative itinerary pricing, approved/pending menus, cents and aggregate rounding, no invented travel/extras, historical compatibility and receipt.');
