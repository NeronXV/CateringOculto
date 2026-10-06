import {MenuHelper} from './MenuHelper';
import React from 'react';
import { Users, AlertTriangle, Check, Minus, Plus } from 'lucide-react';
import { QuoteConfigState } from '../../types';
import { DEMO_PACKAGES } from '../../config/packages';
import { formatMXNCents } from '../../utils/formatters';
import {activeDishGroups,pruneDishes} from '../../utils/dishes';

interface StepMenuSelectionProps {
  state: QuoteConfigState;
  onChange: <K extends keyof QuoteConfigState>(field: K, value: QuoteConfigState[K]) => void;
  errors: Record<string, string>;
}

export const StepMenuSelection: React.FC<StepMenuSelectionProps> = ({
  state,
  onChange,
  errors
}) => {
  const currentPackage = DEMO_PACKAGES.find(p => p.id === state.packageId) || DEMO_PACKAGES[0];
  const minGuests = currentPackage ? currentPackage.minGuests : 4;
  const maxGuests = Math.min(150, currentPackage.maxGuests ?? 150);
  const isBelowMin = state.guestsCount < minGuests;

  const handlePackageChange = (packageId: string) => {
    onChange('packageId', packageId);

  };

  const handleGuestsCountChange = (value: number) => {
    const val = Math.max(1, Math.min(maxGuests, Math.floor(Number.isFinite(value) ? value : 1)));
    onChange('guestsCount', val);
  };

  return (
    <div className="step-content-pane animate-fade-in">
      <div className="step-pane-header">
        <span className="step-pane-badge">Paso 2 de 4</span>
        <h3 className="step-pane-title">Menú & Número de Comensales</h3>
        <p className="step-pane-subtitle">
          Selecciona la propuesta culinaria y especifica cuántos invitados disfrutarán de la experiencia.
        </p>
      </div>

      <MenuHelper onChoose={id=>onChange('packageId',id)}/>
      {/* 1. Selector de Menú */}
      <div className="form-group">
        <label className="form-label">
          <span>Propuesta de Menú</span>
          <span className="required-star">*</span>
        </label>
        <div className="package-selection-cards">
          {DEMO_PACKAGES.map((pkg) => {
            const isSelected = state.packageId === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`package-select-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handlePackageChange(pkg.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePackageChange(pkg.id);
                  }
                }}
              >
                <div className="package-card-top">
                  <div className="package-card-title-wrap">
                    <span className="package-card-name">{pkg.name}</span>
                    <span className="package-card-sub">{pkg.subtitle}</span>
                  </div>
                  <div className="package-card-radio">
                    <span className={`radio-dot ${isSelected ? 'active' : ''}`} />
                  </div>
                </div>

                <div className="package-card-price-row">
                  <div className="price-tag-wrap">
                    <span className="price-num">{pkg.priceApproved===false?'Precio por confirmar':formatMXNCents(pkg.pricePerPersonCents)}</span>
                    <span className="price-unit">{pkg.priceApproved===false?'Unidad de cobro pendiente':'MXN por persona · antes de IVA'}</span>
                  </div>
                  <span className="min-guests-pill">Mínimo: {pkg.minGuests} comensales</span>
                </div>

                <p className="package-card-concept">{pkg.concept}</p>

                <div className="package-card-courses-summary">
                  <span className="courses-summary-label">Incluye {pkg.courses.length} tiempos:</span>
                  <ul className="courses-bullets">
                    {pkg.courses.map((c, i) => (
                      <li key={i}>{c.title}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
        {errors.packageId && (
          <div className="field-error-msg">
            <AlertTriangle size={14} />
            <span>{errors.packageId}</span>
          </div>
        )}
      </div>

      {activeDishGroups(currentPackage,state.selectedDishes).map(group=><div className="form-group" key={group.id}>
        <label className="form-label" htmlFor={`dish-${group.id}`}>{group.name}{group.required?' *':' · preferencia opcional'}</label>
        {group.note && <p className="field-hint">{group.note}</p>}
        <select className="form-input" id={`dish-${group.id}`} value={state.selectedDishes?.[group.id] ?? ''} onChange={event=>onChange('selectedDishes',pruneDishes(currentPackage,{...state.selectedDishes,[group.id]:event.target.value}))}>
          <option value="">{group.required?'Selecciona una opción':'Prefiero confirmarlo con el chef'}</option>
          {group.options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <p className="field-hint">{group.options.find(o=>o.id===state.selectedDishes?.[group.id])?.description}</p>
      </div>)}
      {errors.selectedDishes && <p className="field-error-msg" role="alert">{errors.selectedDishes}</p>}

      {/* 2. Número de Comensales */}
      <div className="form-group">
        <label htmlFor="guests-count-input" className="form-label">
          <Users size={15} className="label-icon" />
          <span>Número de comensales / invitados</span>
          <span className="required-star">*</span>
        </label>
        
        <div className="guests-counter-control">
          <button
            type="button"
            className="counter-btn"
            onClick={() => handleGuestsCountChange(state.guestsCount - 1)}
            disabled={state.guestsCount <= 1}
            aria-label="Disminuir comensales"
          >
            <Minus size={16} />
          </button>

          <input
            id="guests-count-input"
            type="number"
            min="1"
            max={maxGuests}
            value={state.guestsCount || ''}
            onChange={(e) => handleGuestsCountChange(parseInt(e.target.value) || 1)}
            className="counter-input"
            aria-describedby="min-guests-hint"
          />

          <button
            type="button"
            className="counter-btn"
            onClick={() => handleGuestsCountChange(state.guestsCount + 1)}
            disabled={state.guestsCount >= maxGuests}
            aria-label="Aumentar comensales"
          >
            <Plus size={16} />
          </button>
        </div>

        <div id="min-guests-hint">
          <p>{currentPackage.maxGuests?`Capacidad indicada: ${maxGuests} personas.`:'Capacidad por confirmar con el chef. El formulario admite hasta 150 invitados para revisión.'}</p>
          {isBelowMin ? (
            <div className="min-guests-alert animate-fade-in">
              <AlertTriangle size={16} className="alert-icon" />
              <div>
                <strong>Nota de capacidad mínima:</strong> Este menú contempla un mínimo de <strong>{minGuests} personas</strong> para el montaje y logística del equipo. Para grupos menores ({state.guestsCount} personas), el Chef Carlos confirmará personalmente la viabilidad o ajuste de tarifa por comensal vía WhatsApp.
              </div>
            </div>
          ) : (
            <div className="min-guests-valid">
              <Check size={14} className="text-olive" />
              <span>Cumple con el mínimo de {minGuests} personas requerido para {currentPackage.name}.</span>
            </div>
          )}
        </div>

        {errors.guestsCount && (
          <div className="field-error-msg">
            <AlertTriangle size={14} />
            <span>{errors.guestsCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};
