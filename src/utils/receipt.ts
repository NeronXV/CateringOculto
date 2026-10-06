import type {QuoteReceipt} from '../types/quote';
import {formatMXNCents} from './formatters';
export function receiptText(receipt:QuoteReceipt):string {
  const {estimate:e,contact:c}=receipt,b=e.breakdown;
  return [`SOLICITUD CATERING OCULTO · ${receipt.folio}`,
    `Fecha de emisión: ${receipt.createdAt}`,`Cliente: ${c?.name ?? 'Visitante'}`,`Teléfono: ${c?.phone ?? 'Registrado en la solicitud'}`,
    `Evento: ${e.selection.eventDate} · ${e.selection.guestsCount} invitados`,
    `Zona: ${b.selectedZone?.name ?? e.selection.zoneId}`,`Menú: ${b.selectedPackage?.name ?? e.selection.packageId}`,
    ...(b.dishSummary ?? []).map(d=>`${d.group}: ${d.name}`),
    `Menú: ${b.pricePending?'Por confirmar':formatMXNCents(b.menuSubtotalCents)}`,
    ...b.extrasItemized.map(x=>`${x.name} × ${x.quantity}: ${formatMXNCents(x.totalCents)}`),
    `Traslado: ${b.travelRequiresConfirmation?'Pendiente; no incluido':formatMXNCents(b.travelFeeCents)}`,
    `IVA: ${b.taxPending!==false?'Pendiente; no incluido':formatMXNCents(b.taxCents ?? 0)}`,
    `${e.estimateStatus==='partial'?'Importe parcial conocido':'Total estimado'}: ${formatMXNCents(b.totalEstimatedCents)} MXN`,
    ...(c?.dietaryRestrictions?[`Restricciones a revisar: ${c.dietaryRestrictions}`]:[]),
    ...(c?.additionalNotes?[`Notas: ${c.additionalNotes}`]:[]),
    ...e.pending.map(p=>`Pendiente / condición: ${p}`),
    ...(e.serviceSnapshot?[`Condiciones (${e.serviceSnapshot.conditionsVersion}): ${e.serviceSnapshot.conditions}`]:[]),
    'La solicitud no reserva una fecha. Disponibilidad y contratación se confirman con el equipo.'
  ].join('\n');
}
