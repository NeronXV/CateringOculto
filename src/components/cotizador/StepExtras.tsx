import React from 'react';
import { Check, Plus, Minus } from 'lucide-react';
import { QuoteConfigState, ExtraOption } from '../../types';
import { EXTRAS_CONFIG } from '../../config/extras';
import { DEMO_PACKAGES } from '../../config/packages';
import { formatMXNCents } from '../../utils/formatters';

interface StepExtrasProps {
  state: QuoteConfigState;
  onChange: <K extends keyof QuoteConfigState>(field: K, value: QuoteConfigState[K]) => void;
}

export const StepExtras: React.FC<StepExtrasProps> = ({
  state,
  onChange
}) => {
  const currentPackage = DEMO_PACKAGES.find(p => p.id === state.packageId) || DEMO_PACKAGES[0];
  
  // Filter compatible extras
  const compatibleExtras = EXTRAS_CONFIG.filter(extra => 
    !currentPackage || currentPackage.compatibleExtraIds.includes(extra.id)
  );

  const perPersonExtras = compatibleExtras.filter(e => e.pricingType === 'per_person');
  const perUnitExtras = compatibleExtras.filter(e => e.pricingType === 'per_unit');
  const fixedExtras = compatibleExtras.filter(e => e.pricingType === 'fixed');

  const toggleToggleExtra = (extraId: string) => {
    const currentQty = state.selectedExtras[extraId] || 0;
    const newExtras = { ...state.selectedExtras };
    if (currentQty > 0) {
      delete newExtras[extraId];
    } else {
      newExtras[extraId] = 1;
    }
    onChange('selectedExtras', newExtras);
  };

  const updateQuantity = (extra: ExtraOption, delta: number) => {
    const currentQty = state.selectedExtras[extra.id] || 0;
    const max = extra.maxQuantity || 10;
    const nextQty = Math.max(0, Math.min(max, currentQty + delta));
    const newExtras = { ...state.selectedExtras };
    
    if (nextQty === 0) {
      delete newExtras[extra.id];
    } else {
      newExtras[extra.id] = nextQty;
    }
    onChange('selectedExtras', newExtras);
  };

  return (
    <div className="step-content-pane animate-fade-in">
      <div className="step-pane-header">
        <span className="step-pane-badge">Paso 3 de 4</span>
        <h3 className="step-pane-title">Personalización & Extras</h3>
        <p className="step-pane-subtitle">
          Complementa la experiencia con maridajes, mixología o personal de apoyo. Los importes se calculan según su modelo de cobro específico.
        </p>
      </div>

      {/* 1. Extras Por Persona */}
      {perPersonExtras.length > 0 && (
        <div className="extras-category-block">
          <div className="category-header">
            <h4 className="category-title">Complementos por comensal</h4>
            <span className="category-badge">Calculado por cada uno de tus {state.guestsCount} invitados</span>
          </div>

          <div className="extras-list">
            {perPersonExtras.map((extra) => {
              const isSelected = (state.selectedExtras[extra.id] || 0) > 0;
              const subtotal = extra.priceCents * state.guestsCount;

              return (
                <div
                  key={extra.id}
                  className={`extra-row-card ${isSelected ? 'selected' : ''}`}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleToggleExtra(extra.id);
                    }
                  }}
                  onClick={() => toggleToggleExtra(extra.id)}
                >
                  <div className="extra-checkbox-col">
                    <span className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={12} />}
                    </span>
                  </div>

                  <div className="extra-info-col">
                    <span className="extra-name">{extra.name}</span>
                    <p className="extra-desc">{extra.description}</p>
                    <span className="extra-calc-note">
                      {formatMXNCents(extra.priceCents)} × {state.guestsCount} personas = {formatMXNCents(subtotal)} MXN
                    </span>
                  </div>

                  <div className="extra-price-col">
                    <span className="extra-unit-price">{formatMXNCents(extra.priceCents)}</span>
                    <span className="extra-pricing-model">por comensal</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Extras Por Unidad (meseros, horas extra) */}
      {perUnitExtras.length > 0 && (
        <div className="extras-category-block">
          <div className="category-header">
            <h4 className="category-title">Servicios por unidad o tiempo</h4>
            <span className="category-badge">Selecciona la cantidad requerida</span>
          </div>

          <div className="extras-list">
            {perUnitExtras.map((extra) => {
              const qty = state.selectedExtras[extra.id] || 0;
              const isSelected = qty > 0;
              const subtotal = extra.priceCents * qty;

              return (
                <div
                  key={extra.id}
                  className={`extra-row-card extra-unit-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="extra-info-col">
                    <span className="extra-name">{extra.name}</span>
                    <p className="extra-desc">{extra.description}</p>
                    <span className="extra-price-spec">
                      {formatMXNCents(extra.priceCents)} MXN · {extra.unitLabel || 'por unidad'}
                    </span>
                  </div>

                  <div className="extra-stepper-col">
                    <div className="unit-stepper">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => updateQuantity(extra, -1)}
                        disabled={qty <= 0}
                        aria-label={`Disminuir ${extra.name}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="stepper-value">{qty}</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => updateQuantity(extra, 1)}
                        disabled={qty >= (extra.maxQuantity || 10)}
                        aria-label={`Aumentar ${extra.name}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {qty > 0 && (
                      <span className="extra-unit-total">
                        Total: {formatMXNCents(subtotal)} MXN
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Extras de Tarifa Fija */}
      {fixedExtras.length > 0 && (
        <div className="extras-category-block">
          <div className="category-header">
            <h4 className="category-title">Montajes & Tarifas fijas</h4>
            <span className="category-badge">Monto único por evento</span>
          </div>

          <div className="extras-list">
            {fixedExtras.map((extra) => {
              const isSelected = (state.selectedExtras[extra.id] || 0) > 0;

              return (
                <div
                  key={extra.id}
                  className={`extra-row-card ${isSelected ? 'selected' : ''}`}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleToggleExtra(extra.id);
                    }
                  }}
                  onClick={() => toggleToggleExtra(extra.id)}
                >
                  <div className="extra-checkbox-col">
                    <span className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={12} />}
                    </span>
                  </div>

                  <div className="extra-info-col">
                    <span className="extra-name">{extra.name}</span>
                    <p className="extra-desc">{extra.description}</p>
                    <span className="extra-pricing-model">Tarifa fija por evento</span>
                  </div>

                  <div className="extra-price-col">
                    <span className="extra-unit-price">{formatMXNCents(extra.priceCents)}</span>
                    <span className="extra-pricing-model">pago único</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
