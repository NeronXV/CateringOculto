import React from 'react';
import { CheckCircle2, MessageCircle, RotateCcw } from 'lucide-react';
import type { ItineraryReceipt } from '../../../types/itinerary';
import { MEAL_LABELS } from '../../../types/itinerary';
import { formatEventDate } from '../../../utils/formatters';
import { itineraryWhatsAppMessage } from '../../../utils/receipt';
import { BUSINESS_CONFIG } from '../../../config/business';
import { Receipt } from '../Receipt';

interface SimpleReceiptViewProps {
  receipt: ItineraryReceipt;
  onReset: () => void;
}

export const SimpleReceiptView: React.FC<SimpleReceiptViewProps> = ({ receipt, onReset }) => {
  const { estimate, contact } = receipt;
  const message = itineraryWhatsAppMessage(receipt);
  const waDigits = BUSINESS_CONFIG.whatsAppNumberDigits.replace(/\D/g, '');
  const waUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}`;

  return (
    <div className="simple-receipt-view animate-fade-in">
      <div className="receipt-success-banner">
        <div className="receipt-success-icon-wrap">
          <CheckCircle2 size={40} className="receipt-success-icon" />
        </div>
        <span className="receipt-eyebrow">Solicitud Registrada con Éxito</span>
        <h3 className="receipt-folio-display">
          Folio: <strong>{receipt.folio}</strong>
        </h3>
        <p className="receipt-success-subtitle">
          Tu solicitud fue guardada en la bandeja del equipo. Para agilizar la respuesta y afinar los platillos con el chef, continúa por WhatsApp.
        </p>
      </div>

      <div className="receipt-summary-card">
        <h4 className="receipt-card-title">Resumen de tu experiencia</h4>
        <div className="receipt-card-meta">
          <span>👥 {estimate.selection.guestsCount} comensales</span>
          <span>📅 {estimate.summary.dayCount} días solicitados</span>
          <span>🍽️ {estimate.summary.serviceCount} momentos gastronómicos</span>
        </div>

        <div className="receipt-itinerary-list">
          {estimate.selection.days.map(d => (
            <div key={d.date} className="receipt-itinerary-row">
              <span className="itinerary-date-col">{formatEventDate(d.date)}</span>
              <span className="itinerary-services-col">
                {d.services.map(s => MEAL_LABELS[s]).join(' · ')}
              </span>
            </div>
          ))}
        </div>

        {contact?.name && (
          <div className="receipt-client-tag">
            <span>A nombre de: <strong>{contact.name}</strong></span>
            {contact.phone && <span> · Tel: {contact.phone}</span>}
          </div>
        )}
      </div>

      <div className="receipt-actions-box">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp-primary"
        >
          <MessageCircle size={20} />
          <span>Continuar por WhatsApp</span>
        </a>
        <p className="receipt-wa-note">
          Se abrirá WhatsApp con el mensaje y tu folio preparados para enviar directamente a Carlos y Karen.
        </p>

        <div className="receipt-secondary-actions">
          <Receipt receipt={receipt as any} />
          <button type="button" className="receipt-reset-btn" onClick={onReset}>
            <RotateCcw size={15} />
            <span>Preparar otra solicitud</span>
          </button>
        </div>
      </div>
    </div>
  );
};
