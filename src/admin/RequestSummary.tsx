import type { InboxDetail } from '../types/inbox';
import { isItineraryEstimate } from '../types/itinerary';
import { requestAmounts, requestDays } from '../utils/requestSummary';
import { formatEventDate, formatMXNCents } from '../utils/formatters';
import { ItineraryAmounts } from '../components/cotizador/ItineraryAmounts';
import './RequestSummary.css';

export default function RequestSummary({ request }: { request: Pick<InboxDetail, 'estimate' | 'contact'> }) {
  const estimate = request.estimate, amounts = requestAmounts(estimate);
  return <div className="request-summary">
    <section aria-label="Itinerario gastronómico">
      <h3>Itinerario gastronómico</h3>
      {requestDays(estimate).map(day => <article className="request-day" key={day.date}>
        <h4>{formatEventDate(day.date)}</h4>
        {day.services.map((service, index) => <div className="request-service" key={index}>
          <div className="request-service-heading"><strong>{service.label}</strong><span>{service.time || 'Horario por acordar'}</span></div>
          <p>{service.menu}</p>
          {service.dishes.length > 0 && <ul>{service.dishes.map((dish, i) => <li key={i}><span>{dish.group}:</span> {dish.name}</li>)}</ul>}
          <div className="request-service-price">{service.subtotalCents === null ? 'Precio por confirmar' : <>{formatMXNCents(service.subtotalCents)} MXN{service.perPersonCents !== null && <small>{formatMXNCents(service.perPersonCents)} por persona · {estimate.selection.guestsCount} personas</small>}</>}</div>
        </div>)}
      </article>)}
      {!isItineraryEstimate(estimate) && estimate.breakdown.extrasItemized.length > 0 && <div className="request-day"><h4>Extras solicitados</h4>{estimate.breakdown.extrasItemized.map(extra => <p key={extra.id}>{extra.name} · {extra.quantity} · {estimate.demo ? 'Precio por confirmar' : `${formatMXNCents(extra.totalCents)} MXN`}</p>)}</div>}
    </section>
    <section className="request-estimate" aria-label="Cotización estimada">
      <h3>Cotización estimada</h3>
      {isItineraryEstimate(estimate) ? <ItineraryAmounts estimate={estimate}/> : <>
      <div className="request-subtotal"><span>Subtotal conocido</span><strong>{amounts.subtotalCents === null ? 'Por confirmar' : `${formatMXNCents(amounts.subtotalCents)} MXN`}</strong></div>
      <p>Estimado guardado: {estimate.demo || (estimate.breakdown.pricePending && !amounts.subtotalCents) ? 'Por confirmar' : `${formatMXNCents(estimate.breakdown.totalEstimatedCents)} MXN`}</p>
      {amounts.pending && <><strong className="request-pending">Conceptos pendientes por confirmar</strong><ul>{estimate.pending.map((text, index) => <li key={index}>{text}</li>)}</ul></>}
      </>}
      <p className="request-disclaimer">Estimado sujeto a confirmación de disponibilidad y propuesta final del chef.</p>
      <p className="request-disclaimer">Esta solicitud no confirma una reservación.</p>
    </section>
  </div>;
}
