import assert from 'node:assert/strict';
import { defaultCatalog } from '../src/admin/catalog';
import { estimateItinerary } from '../server/itineraryEngine';
import { itineraryWhatsAppMessage, receiptText } from '../src/utils/receipt';
import type { ItinerarySelection } from '../src/types/itinerary';

const catalog = defaultCatalog();
const now = new Date('2026-10-06T12:00:00Z');

// 1. Solicitud válida multifecha
const validSelection: ItinerarySelection = {
  guestsCount: 12,
  days: [
    { date: '2026-10-21', services: ['comida'] },
    { date: '2026-10-22', services: ['desayuno', 'comida'] },
    { date: '2026-10-25', services: ['desayuno', 'cena'] }
  ]
};

const estimate = estimateItinerary(catalog, validSelection, now);
assert.equal(estimate.kind, 'itinerary');
assert.equal(estimate.selection.guestsCount, 12);
assert.equal(estimate.summary.dayCount, 3);
assert.equal(estimate.summary.serviceCount, 5);
assert.equal(estimate.summary.startDate, '2026-10-21');
assert.equal(estimate.summary.endDate, '2026-10-25');
assert.ok(estimate.version && estimate.version.length === 64);
assert.equal(estimate.zoneStatus, 'pending');

// 2. Ordenamiento automático de fechas
const unorderedSelection: ItinerarySelection = {
  guestsCount: 8,
  days: [
    { date: '2026-10-25', services: ['cena'] },
    { date: '2026-10-21', services: ['desayuno'] }
  ]
};
const sortedEstimate = estimateItinerary(catalog, unorderedSelection, now);
assert.equal(sortedEstimate.selection.days[0].date, '2026-10-21');
assert.equal(sortedEstimate.selection.days[1].date, '2026-10-25');

// 3. Validaciones de error
// Comensales fuera de rango o inválidos
for (const guestsCount of [0, -1, 151, NaN, Infinity, '10' as any, null as any]) {
  assert.throws(() => estimateItinerary(catalog, { ...validSelection, guestsCount }, now));
}

// Fechas inválidas, pasadas o mal formadas
for (const date of ['', '2026-10-05', '2026-10-06', 'invalid-date', '2026-02-30']) {
  assert.throws(() =>
    estimateItinerary(
      catalog,
      {
        guestsCount: 10,
        days: [{ date, services: ['comida'] }]
      },
      now
    )
  );
}

// Fechas duplicadas
assert.throws(() =>
  estimateItinerary(
    catalog,
    {
      guestsCount: 10,
      days: [
        { date: '2026-10-22', services: ['comida'] },
        { date: '2026-10-22', services: ['cena'] }
      ]
    },
    now
  )
);

// Días sin servicios o servicios no permitidos
assert.throws(() =>
  estimateItinerary(
    catalog,
    {
      guestsCount: 10,
      days: [{ date: '2026-10-22', services: [] }]
    },
    now
  )
);
assert.throws(() =>
  estimateItinerary(
    catalog,
    {
      guestsCount: 10,
      days: [{ date: '2026-10-22', services: ['brunch' as any] }]
    },
    now
  )
);

// 4. Generación de mensaje para WhatsApp con folio
const receipt = {
  folio: 'CO-20261021-TEST01',
  createdAt: '2026-10-06T12:00:00Z',
  estimate,
  contact: {
    name: 'Alejandra Valenzuela',
    phone: '6121234567',
    dietaryRestrictions: 'Sin mariscos',
    additionalNotes: 'Villa en El Sargento'
  }
};

const waMessage = itineraryWhatsAppMessage(receipt);
assert.ok(waMessage.includes('Alejandra Valenzuela'));
assert.ok(waMessage.includes('12 personas'));
assert.ok(waMessage.includes('21 de octubre'));
assert.ok(waMessage.includes('Comida'));
assert.ok(waMessage.includes('Desayuno'));
assert.ok(waMessage.includes('Cena'));
assert.ok(waMessage.includes('CO-20261021-TEST01'));
assert.ok(waMessage.includes('Sin mariscos'));

// 5. Generación de recibo formateado
const receiptFormatted = receiptText(receipt);
assert.ok(receiptFormatted.includes('CO-20261021-TEST01'));
assert.ok(receiptFormatted.includes('Alejandra Valenzuela'));
assert.ok(receiptFormatted.includes('2026-10-21: Comida'));
assert.ok(receiptFormatted.includes('2026-10-22: Desayuno · Comida'));

console.log('OK: motor de itinerario, multifechas no consecutivas, servicios diarios, validaciones, WhatsApp y comprobante.');
