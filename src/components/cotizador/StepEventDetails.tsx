import {Availability} from './Availability';
import {SERVER_ENABLED} from '../../config/runtime';
import React from 'react';
import { Calendar, MapPin, AlertCircle } from 'lucide-react';
import { QuoteConfigState, EventType } from '../../types';
import { EVENT_TYPES } from '../../config/packages';
import { ZONES_CONFIG } from '../../config/zones';
import { getTodayMinDateString, formatMXNCents } from '../../utils/formatters';

interface StepEventDetailsProps {
  state: QuoteConfigState;
  onChange: <K extends keyof QuoteConfigState>(field: K, value: QuoteConfigState[K]) => void;
  errors: Record<string, string>;
}

export const StepEventDetails: React.FC<StepEventDetailsProps> = ({
  state,
  onChange,
  errors
}) => {
  const minDate = getTodayMinDateString();

  return (
    <div className="step-content-pane animate-fade-in">
      <div className="step-pane-header">
        <span className="step-pane-badge">Paso 1 de 4</span>
        <h3 className="step-pane-title">Cuéntanos sobre tu evento en La Paz</h3>
        <p className="step-pane-subtitle">
          Elige el formato de hospitalidad, la fecha tentativa y la zona donde se llevará a cabo.
        </p>
      </div>

      {/* 1. Tipo de Evento */}
      <div className="form-group">
        <label className="form-label">
          <span>Tipo de experiencia gastronómica</span>
          <span className="required-star">*</span>
        </label>
        <div className="event-type-grid">
          {EVENT_TYPES.map((type) => {
            const isSelected = state.eventType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                className={`event-type-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onChange('eventType', type.id as EventType)}
              >
                <div className="event-type-card-header">
                  <span className="event-type-name">{type.name}</span>
                  {isSelected && <span className="type-check-dot" />}
                </div>
                <p className="event-type-desc">{type.shortDescription}</p>
                <span className="event-type-tag">{type.tagline}</span>
              </button>
            );
          })}
        </div>
        {errors.eventType && (
          <div className="field-error-msg">
            <AlertCircle size={14} />
            <span>{errors.eventType}</span>
          </div>
        )}
      </div>

      {SERVER_ENABLED && <Availability date={state.eventDate} onSelect={date=>onChange('eventDate',date)}/>} 
      {/* 2. Fecha del Evento */}
      <div className="form-group">
        <label htmlFor="event-date-input" className="form-label">
          <Calendar size={15} className="label-icon" />
          <span>Fecha tentativa del servicio</span>
          <span className="required-star">*</span>
        </label>
        <div className="date-input-wrapper">
          <input
            id="event-date-input"
            type="date"
            min={minDate}
            value={state.eventDate}
            onInput={(e) => onChange('eventDate', e.currentTarget.value)}
            onChange={(e) => onChange('eventDate', e.target.value)}
            className={`form-input date-input ${errors.eventDate ? 'input-error' : ''}`}
            required
          />
        </div>
        <p className="field-hint">
          La fecha es tentativa. El equipo confirmará disponibilidad y la anticipación necesaria antes de reservar.
        </p>
        {errors.eventDate && (
          <div className="field-error-msg">
            <AlertCircle size={14} />
            <span>{errors.eventDate}</span>
          </div>
        )}
      </div>

      {/* 3. Zona de La Paz BCS */}
      <div className="form-group">
        <label htmlFor="event-zone-select" className="form-label">
          <MapPin size={15} className="label-icon" />
          <span>Ubicación o zona del evento</span>
          <span className="required-star">*</span>
        </label>
        <div className="zones-selector-list">
          {ZONES_CONFIG.map((zone) => {
            const isSelected = state.zoneId === zone.id;
            return (
              <label
                key={zone.id}
                className={`zone-radio-card ${isSelected ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="zone-selection"
                  value={zone.id}
                  checked={isSelected}
                  onChange={() => onChange('zoneId', zone.id)}
                  className="sr-only"
                />
                <div className="zone-card-radio-indicator">
                  <span className={`radio-dot ${isSelected ? 'active' : ''}`} />
                </div>
                <div className="zone-card-content">
                  <div className="zone-name-row">
                    <span className="zone-name">{zone.name}</span>
                    <span className={`zone-fee-badge ${zone.requiresConfirmation ? 'fee-pending' : ''}`}>
                      {zone.requiresConfirmation
                        ? 'Traslado por confirmar'
                        : zone.travelFeeCents === 0
                        ? 'Zona local incluida'
                        : `+ ${formatMXNCents(zone.travelFeeCents)} logística`}
                    </span>
                  </div>
                  <p className="zone-desc">{zone.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        {errors.zoneId && (
          <div className="field-error-msg">
            <AlertCircle size={14} />
            <span>{errors.zoneId}</span>
          </div>
        )}
      </div>
    </div>
  );
};
