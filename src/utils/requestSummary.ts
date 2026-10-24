import type { InboxDetail } from '../types/inbox';
import type { ServerEstimate } from '../types/quote';
import { isItineraryEstimate, MEAL_LABELS, type ItineraryEstimate } from '../types/itinerary';
import { blankEvent } from '../types/operations';

type Estimate = ServerEstimate | ItineraryEstimate;
const readable = (value: string) => value.replace(/[-_]/g, ' ').replace(/^./, letter => letter.toUpperCase());
export function requestAmounts(estimate: Estimate) {
  if (isItineraryEstimate(estimate)) return {
    subtotalCents: estimate.pricing?.menuSubtotalCents ?? null,
    totalCents: null,
    pending: !estimate.pricing || estimate.pricing.travelStatus === 'pending' || estimate.pricing.taxCents === null || estimate.pricing.lines.some(line => line.subtotalCents === null)
  };
  return {
    subtotalCents: estimate.breakdown.pricePending || estimate.demo ? (estimate.breakdown.extrasSubtotalCents > 0 && !estimate.demo ? estimate.breakdown.extrasSubtotalCents : null) : estimate.breakdown.menuSubtotalCents + estimate.breakdown.extrasSubtotalCents,
    totalCents: estimate.breakdown.pricePending && !estimate.breakdown.totalEstimatedCents ? null : estimate.breakdown.totalEstimatedCents ?? null,
    pending: estimate.demo || !!estimate.breakdown.totalIsPartial || !!estimate.breakdown.pricePending || !!estimate.breakdown.taxPending || estimate.breakdown.travelRequiresConfirmation
  };
}

// Read only the saved snapshot. A catalog edit must never rewrite a received request.
export function requestDays(estimate: Estimate) {
  if (!isItineraryEstimate(estimate)) return [{ date: estimate.selection.eventDate, services: [{
    label: 'Servicio solicitado', menu: estimate.breakdown.selectedPackage?.name ?? 'Menú por acordar',
    time: '', dishes: estimate.breakdown.dishSummary ?? [],
    subtotalCents: estimate.breakdown.pricePending || estimate.demo ? null : estimate.breakdown.menuSubtotalCents,
    perPersonCents: estimate.breakdown.pricePending || estimate.demo ? null : estimate.breakdown.selectedPackage?.pricePerPersonCents ?? null
  }] }];
  return estimate.selection.days.map(day => ({ date: day.date, services: day.services.map(service => {
    const chosen = day.selections?.[service];
    const line = estimate.pricing?.lines.find(value => value.date === day.date && value.service === service);
    const savedName = estimate.references.find(ref => ref.service === service)?.menus.find(menu => menu.id === chosen?.menuId)?.name;
    return { label: MEAL_LABELS[service], menu: line?.menuName ?? savedName ?? (chosen ? readable(chosen.menuId) : 'Menú por acordar'),
      time: line?.requestedTime ?? chosen?.requestedTime ?? '',
      dishes: line?.dishes ?? Object.entries(chosen?.selectedDishes ?? {}).map(([group, name]) => ({ group: readable(group), name: readable(name), description: '' })),
      subtotalCents: line?.subtotalCents ?? null, perPersonCents: line?.perPersonCents ?? null };
  }) }));
}

export function prepareRequest(q: Pick<InboxDetail, 'id' | 'folio' | 'estimate' | 'contact'>) {
  const days = requestDays(q.estimate);
  const data = blankEvent(days[0].date);
  data.dates = days.map(day => day.date);
  data.name = q.contact.name;
  data.phone = q.contact.phone;
  data.guests = q.estimate.selection.guestsCount;
  data.address = isItineraryEstimate(q.estimate) ? q.estimate.selection.location ?? '' : '';
  data.schedule = days.map(day => `${day.date}: ${day.services.map(service => `${service.label} ${service.time || 'horario por acordar'}`).join(' · ')}`).join('\n');
  data.proposal = days.map(day => [day.date, ...day.services.flatMap(service => [
    `${service.label} · ${service.time || 'Horario por acordar'} · ${service.menu}`,
    ...service.dishes.map(dish => `${dish.group}: ${dish.name}${dish.description ? ` · ${dish.description}` : ''}`)
  ])].join('\n')).join('\n\n');
  if (!isItineraryEstimate(q.estimate) && q.estimate.breakdown.extrasItemized.length) data.proposal += '\n\nExtras solicitados:\n' + q.estimate.breakdown.extrasItemized.map(extra => `${extra.name} · ${extra.quantity}`).join('\n');
  data.internalNotes = [q.contact.dietaryRestrictions && `Alergias y restricciones informadas: ${q.contact.dietaryRestrictions}`, q.contact.additionalNotes && `Notas del cliente: ${q.contact.additionalNotes}`].filter(Boolean).join('\n');
  // A partial estimate is never a final agreed amount, deposit or reservation.
  return { id: null, quoteId: q.id, folio: q.folio, data, requestedDates: data.dates, sourceRequest: q };
}
