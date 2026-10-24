import type { ItineraryEstimate } from '../types/itinerary';
import { formatMXNCents } from './formatters';

// Presentation only: read the saved estimate; never calculate tax or consult today's catalog.
export function itineraryPresentation(estimate: ItineraryEstimate) {
  const pricing = estimate.pricing;
  const taxApproved = estimate.taxPending === false && estimate.serviceSnapshot?.taxApproved === true;
  const subtotal = pricing?.menuSubtotalCents ?? null;
  const tax = taxApproved && subtotal !== null ? pricing?.taxCents ?? null : null;
  const knownWithTax = tax !== null ? pricing?.knownAmountCents ?? null : null;
  const amount = (cents: number | null) => cents === null ? 'Por confirmar' : `${formatMXNCents(cents)} MXN`;
  const pendingMenus = [...new Set(pricing?.lines.filter(line => line.subtotalCents === null).map(line => line.menuName) ?? [])];
  const pending: string[] = [];
  if (!pricing) pending.push('Esta solicitud no contiene un desglose de servicios guardado.');
  if (pendingMenus.length) pending.push(`Servicios con precio por confirmar: ${pendingMenus.join(', ')}.`);
  if (!taxApproved) pending.push('IVA por confirmar. No incluido en el subtotal.');
  else if (tax === null || pendingMenus.length) pending.push('IVA de los servicios todavía sin precio.');
  if (!pricing || pricing.travelStatus === 'pending' || estimate.zoneStatus === 'pending') pending.push('Traslado y logística por confirmar.');
  return {
    rows: [
      { key: 'subtotal', label: 'Subtotal de servicios cotizados', value: amount(subtotal) },
      { key: 'tax', label: 'IVA de servicios cotizados', value: amount(tax) },
      { key: 'knownWithTax', label: 'Importe conocido con IVA', value: amount(knownWithTax) }
    ],
    note: 'Importe parcial: faltan conceptos para calcular el total definitivo.',
    pending,
    extrasNote: pricing?.extrasStatus === 'not_selected' ? 'No se han añadido cargos por extras.' : ''
  };
}
