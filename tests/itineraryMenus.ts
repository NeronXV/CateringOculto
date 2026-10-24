import assert from 'node:assert/strict';
import { defaultCatalog } from '../src/admin/catalog';
import { clientCatalog } from '../src/admin/clientCatalog';
import { estimateItinerary } from '../server/itineraryEngine';
import { menusForService, selectionIssue } from '../src/utils/itineraryMenus';
import { pruneDishes } from '../src/utils/dishes';
import type { ItinerarySelection } from '../src/types/itinerary';

const catalog = clientCatalog(defaultCatalog());
const now = new Date('2026-10-11T12:00:00Z');
const selection: ItinerarySelection = { guestsCount: 8, days: [
  { date: '2099-11-12', services: ['desayuno'], selections: { desayuno: { menuId: 'desayunos', requestedTime: '09:15', selectedDishes: { desayuno: 'omelette' } } } },
  { date: '2099-11-10', services: ['desayuno', 'comida', 'cena'], selections: {
    desayuno: { menuId: 'desayunos', requestedTime: '08:30', selectedDishes: { desayuno: 'chilaquiles', salsa: 'verde', proteina: 'pollo' } },
    comida: { menuId: 'lunch', requestedTime: '14:00', selectedDishes: { lunch: 'arrachera' } },
    cena: { menuId: 'cena-tres', requestedTime: '20:00', selectedDishes: { entrada: 'ensalada', fuerte: 'short-rib', postre: 'flan' } }
  } }
] };
const estimate = estimateItinerary(catalog, selection, now);
assert.equal(estimate.engineVersion, 'itinerary-v3');
assert.deepEqual(estimate.selection.days.map(d => d.date), ['2099-11-10', '2099-11-12']);
assert.deepEqual(estimate.selection.days[0].selections, selection.days[1].selections);
assert.deepEqual(estimate.selection.days[1].selections, selection.days[0].selections);
assert.equal(estimate.references.find(r => r.service === 'cena')!.fromPerPersonCents, null);
assert.equal('breakdown' in estimate, false, 'Phase 1 must not introduce a new price engine.');
assert.equal(estimate.pricing!.menuSubtotalCents, 2400000);
assert.deepEqual(selection.days.map(d => d.date), ['2099-11-12', '2099-11-10'], 'Engine cannot mutate its input.');
const old = { guestsCount: 8, days: [{ date: '2099-11-10', services: ['desayuno'] }] };
assert.deepEqual(estimateItinerary(catalog, old, now).selection, old);
assert.equal(estimateItinerary(catalog, old, now).engineVersion, 'itinerary-v1');

function invalid(change: (input: any) => void) {
  const input = structuredClone(selection);
  change(input);
  assert.throws(() => estimateItinerary(catalog, input, now));
}
invalid(s => { s.days[1].selections.desayuno.menuId = 'lunch'; });
invalid(s => { s.days[1].selections.cena.menuId = 'removed'; });
for (const time of ['', '24:00', '08:60', '8:00', '08:30Z', 8]) invalid(s => { s.days[1].selections.desayuno.requestedTime = time; });
invalid(s => { delete s.days[1].selections.comida; });
invalid(s => { s.days[0].selections.cena = s.days[1].selections.cena; });
invalid(s => { delete s.days[1].selections.desayuno.selectedDishes.salsa; });
invalid(s => { s.days[1].selections.desayuno.selectedDishes.salsa = 'azul'; });
invalid(s => { s.days[0].selections.desayuno.selectedDishes.salsa = 'verde'; });
invalid(s => { s.days[1].selections.desayuno.selectedDishes.desayuno = ['omelette']; });
invalid(s => { s.days[1].selections.cena.priceCents = 1; });
invalid(s => { s.totalCents = 1; });
const limited = structuredClone(catalog); limited.packages[0].maxGuests = 7;
assert.throws(() => estimateItinerary(limited, selection, now));
assert.equal(selectionIssue(catalog.packages, 'desayuno', selection.days[0].selections!.desayuno), '');
const dinner = catalog.packages.find(p => p.id === 'cena-dos')!;
assert.deepEqual(pruneDishes(dinner, { entrada: 'ensalada', fuerte: 'short-rib', postre: 'flan' }), { entrada: 'ensalada', fuerte: 'short-rib' });
assert.deepEqual(menusForService(catalog.packages, 'cena').map(p => p.id), ['cena-dos', 'cena-tres']);
const renamed = structuredClone(catalog.packages[1]); renamed.id = 'menu-publicado';
assert.equal(menusForService([renamed], 'comida')[0].id, renamed.id);
console.log('OK: phase 1, independent menus/times, variants, invalid inputs, historical itineraries and unchanged price behavior.');
