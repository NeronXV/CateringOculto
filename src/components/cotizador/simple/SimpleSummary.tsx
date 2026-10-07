import React from 'react';
import { Calendar, Users, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ItinerarySelection, MealService, ServiceReference } from '../../../types/itinerary';
import { MEAL_LABELS } from '../../../types/itinerary';
import { formatEventDate, formatMXNCents } from '../../../utils/formatters';

interface SimpleSummaryProps {
  selection: ItinerarySelection;
  contactName: string;
  contactPhone: string;
  contactNotes: string;
  references: ServiceReference[];
  busy: boolean;
  error: string;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  onSubmit: () => void;
}

export const SimpleSummary: React.FC<SimpleSummaryProps> = ({
  selection,
  contactName,
  contactPhone,
  contactNotes,
  references,
  busy,
  error,
  consent,
  onConsentChange,
  onSubmit
}) => {
  const serviceCount = selection.days.reduce((acc, d) => acc + d.services.length, 0);

  // Group references by meal for clean display
  const getPriceBadge = (service: MealService) => {
    const ref = references.find(r => r.service === service);
    if (ref && ref.status === 'approved' && ref.fromPerPersonCents) {
      return `Desde ${formatMXNCents(ref.fromPerPersonCents)} / pers.`;
    }
    return 'Por confirmar con el chef';
  };

  return (
    <div className="simple-summary-view">
      <div className="simple-step-header">
        <span className="simple-step-tag">Paso 5</span>
        <h3 className="simple-step-title">Tu experiencia personalizada</h3>
        <p className="simple-step-desc">
          Revisa el itinerario antes de enviar tu solicitud. Generaremos un folio único para atenderte directamente.
        </p>
      </div>

      <div className="summary-card-overview">
        <div className="overview-header-row">
          <div className="overview-item">
            <Users size={16} className="overview-icon" />
            <span className="overview-value">{selection.guestsCount} personas</span>
          </div>
          <div className="overview-item">
            <Calendar size={16} className="overview-icon" />
            <span className="overview-value">
              {selection.days.length} {selection.days.length === 1 ? 'fecha' : 'fechas'} · {serviceCount} servicios
            </span>
          </div>
        </div>

        <div className="overview-itinerary-table">
          <span className="overview-table-title">Itinerario por día</span>
          {selection.days.map(d => (
            <div key={d.date} className="overview-day-row">
              <span className="overview-day-date">{formatEventDate(d.date)}</span>
              <div className="overview-day-services">
                {d.services.map(s => (
                  <span key={s} className="overview-service-chip">
                    <span className="service-name">{MEAL_LABELS[s]}</span>
                    <span className="service-note">({getPriceBadge(s)})</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="overview-contact-block">
          <span className="overview-table-title">Datos de contacto</span>
          <p className="overview-contact-line">
            <strong>{contactName}</strong> · WhatsApp: {contactPhone}
          </p>
          {contactNotes.trim() && (
            <p className="overview-notes-line">
              <em>Notas: {contactNotes.trim()}</em>
            </p>
          )}
        </div>

        <div className="overview-price-notice">
          <div className="notice-inner">
            <ShieldCheck size={18} className="notice-icon" />
            <div>
              <strong>Sin cargos inmediatos:</strong> El presupuesto final, logística de traslado y detalles de cada platillo se acuerdan personalmente con Carlos y Karen Ascencio. No se cobra nada en este sitio web.
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="summary-error-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="summary-consent-block">
        <label className="simple-consent-label">
          <input
            type="checkbox"
            className="simple-checkbox"
            checked={consent}
            onChange={e => onConsentChange(e.target.checked)}
            disabled={busy}
          />
          <span>
            Autorizo guardar esta solicitud para que el equipo de Catering Oculto me contacte por WhatsApp. Entiendo que no reserva una fecha automáticamente.
          </span>
        </label>
      </div>

      <div className="summary-submit-actions">
        <button
          type="button"
          className="btn-submit-itinerary"
          disabled={busy || !consent}
          onClick={onSubmit}
        >
          <Send size={18} />
          <span>{busy ? 'Generando folio y registrando...' : 'Consultar disponibilidad'}</span>
        </button>
      </div>
    </div>
  );
};
