import type { ItineraryEstimate } from '../../../types/itinerary';
import { MEAL_LABELS } from '../../../types/itinerary';
import { formatEventDate, formatMXNCents } from '../../../utils/formatters';
import { ItineraryAmounts } from '../ItineraryAmounts';

export function SimpleSummary({ estimate, onEdit }: { estimate: ItineraryEstimate; onEdit: (step: number) => void }) {
  const pricing = estimate.pricing;
  return <div className="simple-summary-view">
    <div className="simple-step-header">
      <span className="simple-step-tag">Paso 3</span>
      <h3 className="simple-step-title">Tu estimado</h3>
      <p className="simple-step-desc">{estimate.selection.guestsCount} personas · {estimate.summary.dayCount} fechas · {estimate.summary.serviceCount} servicios</p>
      {estimate.selection.location && <p className="simple-step-desc">{estimate.selection.location}</p>}
    </div>
    <div className="summary-edit-actions" aria-label="Corregir selección">
      <button type="button" className="simple-btn-prev" onClick={() => onEdit(1)}>Editar evento</button>
      <button type="button" className="simple-btn-prev" onClick={() => onEdit(2)}>Editar servicios y menús</button>
    </div>
    {estimate.selection.days.map(day => <article className="simple-estimate-day" key={day.date}>
      <h4>{formatEventDate(day.date)}</h4>
      {day.services.map(service => {
        const line = pricing?.lines.find(item => item.date === day.date && item.service === service);
        return <div className="simple-estimate-service" key={service}>
          <div className="simple-estimate-line">
            <div><span className="simple-estimate-meal">{MEAL_LABELS[service]}{line && ` · ${line.requestedTime}`}</span><strong>{line?.menuName ?? MEAL_LABELS[service]}</strong></div>
            <strong className="simple-estimate-amount">{line?.subtotalCents != null ? formatMXNCents(line.subtotalCents) : 'Precio por confirmar'}</strong>
          </div>
          {line?.perPersonCents != null && <p className="simple-menu-note">{estimate.selection.guestsCount} personas × {formatMXNCents(line.perPersonCents)} · antes de IVA</p>}
          {line && <p className="simple-estimate-dishes">{line.dishes.length ? line.dishes.map(d => `${d.group}: ${d.name}`).join(' · ') : 'Platillos por acordar con el chef.'}</p>}
        </div>;
      })}
    </article>)}
    <ItineraryAmounts estimate={estimate}/>
    <p className="simple-estimate-disclaimer">Estimado sujeto a confirmación de disponibilidad y propuesta final del chef.</p>
  </div>;
}
