import type {QuoteReceipt} from '../types/quote';
import type {ItineraryReceipt} from '../types/itinerary';
import {MEAL_LABELS} from '../types/itinerary';
import {formatEventDate, formatMXNCents} from './formatters';

export function itineraryWhatsAppMessage(receipt: ItineraryReceipt): string {
  const {estimate: e, contact: c} = receipt;
  const name = c?.name?.trim() || 'un cliente';
  const guests = e.selection.guestsCount;

  const lines: string[] = [
    `Hola, soy *${name}*.`,
    '',
    `Quisiera consultar disponibilidad para:`,
    '',
    `👥 *${guests} personas*`,
    ''
  ];

  for (const day of e.selection.days) {
    const dateFormatted = formatEventDate(day.date);
    lines.push(`📅 *${dateFormatted}*`);
    for (const service of day.services) {
      lines.push(`• ${MEAL_LABELS[service]}`);
    }
    lines.push('');
  }

  if (c?.dietaryRestrictions?.trim()) {
    lines.push(`🌱 *Alergias o notas de menú:* ${c.dietaryRestrictions.trim()}`);
    lines.push('');
  }

  if (c?.additionalNotes?.trim()) {
    lines.push(`📝 *Notas adicionales:* ${c.additionalNotes.trim()}`);
    lines.push('');
  }

  lines.push(`Folio: *${receipt.folio}*`);
  lines.push('');
  lines.push('_Quedo atento a su respuesta para conocer disponibilidad y detalles. ¡Muchas gracias!_');

  return lines.join('\n');
}

export function receiptText(receipt: QuoteReceipt | ItineraryReceipt): string {
  if (receipt.estimate && 'kind' in receipt.estimate && receipt.estimate.kind === 'itinerary') {
    const itinerary = receipt as ItineraryReceipt;
    const {estimate: e, contact: c} = itinerary;
    const lines: string[] = [
      `SOLICITUD CATERING OCULTO · ${receipt.folio}`,
      `Fecha de emisión: ${receipt.createdAt}`,
      `Cliente: ${c?.name ?? 'Visitante'}`,
      `Teléfono: ${c?.phone ?? 'Registrado en la solicitud'}`,
      `Invitados: ${e.selection.guestsCount} personas`,
      `Fechas solicitadas (${e.summary.dayCount} días, ${e.summary.serviceCount} servicios):`
    ];

    for (const day of e.selection.days) {
      lines.push(`  • ${day.date}: ${day.services.map(s => MEAL_LABELS[s]).join(' · ')}`);
    }

    lines.push('Presupuesto: Por confirmar con el chef (itinerario personalizado)');
    if (c?.dietaryRestrictions) lines.push(`Restricciones a revisar: ${c.dietaryRestrictions}`);
    if (c?.additionalNotes) lines.push(`Notas: ${c.additionalNotes}`);
    for (const p of e.pending) lines.push(`Pendiente / condición: ${p}`);
    if (e.serviceSnapshot) lines.push(`Condiciones (${e.serviceSnapshot.conditionsVersion}): ${e.serviceSnapshot.conditions}`);
    lines.push('La solicitud no reserva una fecha. Disponibilidad y contratación se confirman con el equipo.');
    return lines.join('\n');
  }

  const legacy = receipt as QuoteReceipt;
  const {estimate:e,contact:c}=legacy,b=e.breakdown;
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
