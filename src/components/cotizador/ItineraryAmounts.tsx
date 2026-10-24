import type { ItineraryEstimate } from '../../types/itinerary';
import { itineraryPresentation } from '../../utils/itineraryPresentation';
import './ItineraryAmounts.css';

export function ItineraryAmounts({ estimate }: { estimate: ItineraryEstimate }) {
  const summary = itineraryPresentation(estimate);
  return <div className="itinerary-amounts" role="group" aria-label="Importes de la solicitud">
    <dl className="itinerary-amounts-rows">
      {summary.rows.map(row => <div key={row.key}>
        <dt>{row.label}</dt><dd data-amount={row.key}>{row.value}</dd>
      </div>)}
    </dl>
    <p className="itinerary-amounts-note">{summary.note}</p>
    {summary.pending.length > 0 && <div className="itinerary-amounts-pending">
      <h4>Por cotizar o confirmar</h4>
      <ul>{summary.pending.map(text => <li key={text}>{text}</li>)}</ul>
    </div>}
    {summary.extrasNote && <p className="itinerary-amounts-note">{summary.extrasNote}</p>}
  </div>;
}
