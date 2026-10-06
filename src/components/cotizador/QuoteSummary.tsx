import { SERVER_ENABLED } from '../../config/runtime';
import React, { useState } from 'react';
import { MessageCircle, AlertCircle, AlertTriangle, Calendar, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { QuoteConfigState, CalculationBreakdown } from '../../types';
import { formatEventDate, formatMXNCents } from '../../utils/formatters';
import { generateWhatsAppUrl } from '../../utils/whatsapp';
import { isQuoteReady } from '../../utils/validation';
import { BUSINESS_CONFIG } from '../../config/business';
import { ServerRequest } from './ServerRequest';

interface QuoteSummaryProps {
  state: QuoteConfigState;
  breakdown: CalculationBreakdown;
  onProceedToContact?: () => void;
}

export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  state,
  breakdown,
  onProceedToContact
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  const { url, hasValidNumber } = generateWhatsAppUrl(state, breakdown);

  const isFormReadyForWhatsApp = isQuoteReady(state);

  const handleWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFormReadyForWhatsApp) {
      e.preventDefault();
      setShowValidationAlert(true);
      if (onProceedToContact) {
        onProceedToContact();
      }
      return;
    }

    if (!hasValidNumber) {
      e.preventDefault();
      alert('Aviso de configuración: Número de WhatsApp no configurado correctamente en el sistema.');
      return;
    }

    // Opens WhatsApp with message pre-filled. User must manually send.
  };

  return (
    <aside className="quote-summary-sidebar" aria-label="Resumen de presupuesto">
      <div className="quote-summary-card">
        {/* Mobile quick toggle */}
        <button
          type="button"
          className="mobile-summary-toggle"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          aria-expanded={mobileExpanded}
        >
          <div className="mobile-toggle-left">
            <span className="mobile-toggle-title">Presupuesto preliminar:</span>
            <span className="mobile-toggle-total">{formatMXNCents(breakdown.totalEstimatedCents)} MXN</span>
          </div>
          <span className="mobile-toggle-icon">
            {mobileExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </span>
        </button>

        {/* Summary Content Body (Always visible on desktop, toggleable on mobile) */}
        <div className={`summary-content-body ${mobileExpanded ? 'mobile-open' : ''}`}>
          <div className="summary-card-header">
            <span className="summary-card-eyebrow">Desglose de Cotización</span>
            <h4 className="summary-card-title">Resumen Estimado</h4>
          </div>

          {/* Quick Meta Tags */}
          <div className="summary-meta-badges">
            <div className="meta-badge-item">
              <Calendar size={13} />
              <span>{formatEventDate(state.eventDate)}</span>
            </div>
            <div className="meta-badge-item">
              <Users size={13} />
              <span>{state.guestsCount} comensales</span>
            </div>
            <div className="meta-badge-item">
              <MapPin size={13} />
              <span>{breakdown.selectedZone?.name.split('·')[1]?.trim() || breakdown.selectedZone?.name}</span>
            </div>
          </div>

          <div className="summary-divider" />

          {/* Itemized Calculations */}
          <div className="summary-lines">
            {/* 1. Menu base */}
            <div className="summary-line-row">
              <div className="line-label-wrap">
                <span className="line-name">{breakdown.selectedPackage?.name}</span>
                <span className="line-detail">
                  {breakdown.pricePending ? 'Tarifa y unidad de cobro por confirmar' : `${formatMXNCents(breakdown.selectedPackage?.pricePerPersonCents || 0)} × ${state.guestsCount} comensales`}
                </span>
              </div>
              <span className="line-val">{breakdown.pricePending?'Por confirmar':formatMXNCents(breakdown.menuSubtotalCents)}</span>
            </div>

            {/* 2. Extras */}
            {breakdown.extrasItemized.length > 0 && (
              <div className="summary-extras-group">
                <span className="group-label">Extras y complementos:</span>
                {breakdown.extrasItemized.map((item) => (
                  <div key={item.id} className="summary-line-row extra-subrow">
                    <div className="line-label-wrap">
                      <span className="line-name">• {item.name}</span>
                      <span className="line-detail">
                        {item.pricingType === 'per_person' && `${formatMXNCents(item.unitPriceCents)} × ${item.quantity} pers.`}
                        {item.pricingType === 'per_unit' && `${item.quantity} ${item.unitLabel || 'unidades'}`}
                        {item.pricingType === 'fixed' && 'Tarifa única fija'}
                      </span>
                    </div>
                    <span className="line-val">{formatMXNCents(item.totalCents)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Travel fee */}
            <div className="summary-line-row">
              <div className="line-label-wrap">
                <span className="line-name">Logística de Traslado</span>
                <span className="line-detail">{breakdown.selectedZone?.name}</span>
              </div>
              <span className={`line-val ${breakdown.travelRequiresConfirmation ? 'text-pending' : ''}`}>
                {breakdown.travelRequiresConfirmation
                  ? 'Por confirmar'
                  : breakdown.travelFeeCents === 0
                  ? 'Incluido'
                  : formatMXNCents(breakdown.travelFeeCents)}
              </span>
            </div>
          </div>

          <div className="summary-divider" />

          {/* Total Amount */}
          <div className="summary-total-banner">
            <div className="total-label-wrap">
              <span className="total-title">Estimado preliminar</span>
              <span className="total-tax-notice">{breakdown.taxPending?'IVA pendiente; no incluido.':`IVA: ${formatMXNCents(breakdown.taxCents ?? 0)}`}{breakdown.pricePending?' Precio del menú pendiente; no incluido.':''}</span>
            </div>
            <div className="total-amount-wrap">
              <span className="total-amount">{formatMXNCents(breakdown.totalEstimatedCents)}</span>
              <span className="total-currency">MXN</span>
            </div>
          </div>

          {/* Pending items notice */}
          {(breakdown.travelRequiresConfirmation || breakdown.minGuestsWarning) && (
            <div className="summary-pending-box">
              <div className="pending-header">
                <AlertTriangle size={14} className="text-warning" />
                <span>Conceptos a afinar con el chef:</span>
              </div>
              <ul className="pending-list">
                {breakdown.travelRequiresConfirmation && (
                  <li>• Viáticos de traslado foráneo ({breakdown.selectedZone?.name}) a cotizar tras evaluar la cocina en locación.</li>
                )}
                {breakdown.minGuestsWarning && (
                  <li>• Ajuste para grupo menor al mínimo ({breakdown.selectedPackage?.minGuests} personas requeridas).</li>
                )}
              </ul>
            </div>
          )}

          {/* Mandatory Transparent Disclaimer */}
          <div className="summary-mandatory-disclaimer">
            <p>
              {BUSINESS_CONFIG.quoteDisclaimer}
            </p>
          </div>

          {/* Validation Error if user attempts WhatsApp before filling name/date */}
          {showValidationAlert && !isFormReadyForWhatsApp && (
            <div className="summary-alert-error animate-fade-in">
              <AlertCircle size={15} />
              <span>Revisa los campos señalados en el cotizador antes de abrir WhatsApp.</span>
            </div>
          )}

          {/* WhatsApp Primary Action Button */}
          <div className="summary-action-block">
            {SERVER_ENABLED ? <ServerRequest state={state} ready={isFormReadyForWhatsApp} onIncomplete={onProceedToContact}/> : <>
            <a
              href={isFormReadyForWhatsApp && hasValidNumber ? url : '#cotizador'}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-whatsapp summary-whatsapp-btn ${!isFormReadyForWhatsApp ? 'btn-disabled' : ''}`}
              onClick={handleWhatsAppClick}
            >
              <MessageCircle size={18} />
              <span>Consultar disponibilidad por WhatsApp</span>
            </a>

            <p className="whatsapp-help-note">
              Al hacer clic, se abrirá WhatsApp con el mensaje estructurado para que lo envíes. No genera cargos ni reservas automáticas.
            </p>
            </>}
          </div>
        </div>
      </div>
    </aside>
  );
};
