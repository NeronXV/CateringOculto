import assert from 'node:assert/strict';
import { clientCatalog } from '../src/admin/clientCatalog';
import { defaultCatalog } from '../src/admin/catalog';
import { estimateItinerary } from '../server/itineraryEngine';
import { itineraryPresentation } from '../src/utils/itineraryPresentation';
import { receiptText } from '../src/utils/receipt';
import type { ItineraryEstimate, ItinerarySelection } from '../src/types/itinerary';

const catalog = clientCatalog(defaultCatalog());
const input: ItinerarySelection = { guestsCount: 8, days: [
  { date: '2099-11-10', services: ['desayuno', 'comida'], selections: {
    desayuno: { menuId: 'desayunos', requestedTime: '08:30', selectedDishes: { desayuno: 'omelette' } },
    comida: { menuId: 'lunch', requestedTime: '14:00', selectedDishes: {} }
  } },
  { date: '2099-11-12', services: ['desayuno', 'cena'], selections: {
    desayuno: { menuId: 'desayunos', requestedTime: '09:00', selectedDishes: { desayuno: 'croissant' } },
    cena: { menuId: 'cena-dos', requestedTime: '20:00', selectedDishes: {} }
  } }
] };
const now = new Date('2026-10-21T12:00:00Z');
const pending = estimateItinerary(catalog, input, now);
const pendingBefore = JSON.stringify(pending);
const view = itineraryPresentation(pending);
assert.deepEqual(view.rows.map(row => row.value), ['$24,000 MXN', 'Por confirmar', 'Por confirmar']);
assert.ok(view.pending.some(text => text.includes('IVA por confirmar')));
assert.ok(view.pending.some(text => text.includes('Cena de dos tiempos')));

// Synthetic approval only; this does not approve any business tax policy.
const approved = structuredClone(catalog);
approved.service.taxApproved = true;
approved.service.taxRateBps = 1600;
const taxed = estimateItinerary(approved, input, now);
assert.deepEqual(itineraryPresentation(taxed).rows.map(row => row.value), ['$24,000 MXN', '$3,840 MXN', '$27,840 MXN']);
assert.ok(itineraryPresentation(taxed).pending.some(text => text.includes('todavía sin precio')));
approved.service.taxRateBps = 0;
const zero = estimateItinerary(approved, input, now);
assert.deepEqual(itineraryPresentation(zero).rows.map(row => row.value), ['$24,000 MXN', '$0 MXN', '$24,000 MXN']);

const dinner = estimateItinerary(approved, { guestsCount: 8, days: [input.days[1]].map(day => ({ ...day, services: ['cena'], selections: { cena: day.selections!.cena } })) }, now);
assert.deepEqual(itineraryPresentation(dinner).rows.map(row => row.value), ['Por confirmar', 'Por confirmar', 'Por confirmar']);
assert.ok(!JSON.stringify(itineraryPresentation(dinner)).includes('$0'));

const history: ItineraryEstimate[] = [
  { ...pending, engineVersion: 'itinerary-v1', pricing: undefined },
  { ...pending, engineVersion: 'itinerary-v2', pricing: undefined }
];
for (const old of history) {
  assert.deepEqual(itineraryPresentation(old).rows.map(row => row.value), ['Por confirmar', 'Por confirmar', 'Por confirmar']);
  assert.ok(itineraryPresentation(old).pending.some(text => text.includes('no contiene un desglose')));
}
// An unapproved/unknown tax policy must never be inferred from an amount alone.
const unapproved = { ...taxed, taxPending: true };
assert.equal(itineraryPresentation(unapproved).rows[1].value, 'Por confirmar');
assert.equal(itineraryPresentation(unapproved).rows[2].value, 'Por confirmar');

for (const estimate of [pending, taxed, zero, dinner]) {
  const before = JSON.stringify(estimate);
  Object.freeze(estimate);
  const printed = receiptText({ folio: 'CO-PRESENTATION-TEST', createdAt: now.toISOString(), estimate });
  const summary = itineraryPresentation(estimate);
  for (const row of summary.rows) assert.ok(printed.includes(`${row.label}: ${row.value}`));
  assert.ok(printed.includes(summary.note));
  assert.equal(JSON.stringify(estimate), before);
}
catalog.service.taxApproved = true;
catalog.service.taxRateBps = 2000;
catalog.packages[0].pricePerPersonCents = 999999;
assert.equal(JSON.stringify(pending), pendingBefore);
assert.deepEqual(itineraryPresentation(pending), view);
console.log('OK: presentation and receipt agree; approved/pending/zero tax, partial multi-day estimates, pending dinners, v1/v2 history and immutable snapshots. No DB.');
