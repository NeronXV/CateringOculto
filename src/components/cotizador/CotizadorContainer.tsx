import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { QuoteConfigState } from '../../types';
import { calculateQuote } from '../../utils/calculator';
import { getStepErrors, isQuoteReady } from '../../utils/validation';
import { StepIndicator } from './StepIndicator';
import { StepEventDetails } from './StepEventDetails';
import { StepMenuSelection } from './StepMenuSelection';
import { StepExtras } from './StepExtras';
import { StepContactNotes } from './StepContactNotes';
import { QuoteSummary } from './QuoteSummary';
import './Cotizador.css';

interface CotizadorContainerProps {
  state: QuoteConfigState;
  onChange: <K extends keyof QuoteConfigState>(field: K, value: QuoteConfigState[K]) => void;
  onReset: () => void;
  notice: string;
  storageStatus: 'saved' | 'unavailable';
}

export const CotizadorContainer: React.FC<CotizadorContainerProps> = ({
  state, onChange, onReset, notice, storageStatus
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = <K extends keyof QuoteConfigState>(
    field: K,
    value: QuoteConfigState[K]
  ) => {
    onChange(field, value);
    // Clear error for that field if resolved
    if (errors[field as string]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  // Validation function per step
  const validateStep = (stepNumber: number): boolean => {
    const newErrors = getStepErrors(state, stepNumber);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(4, prev + 1));
      // Smooth scroll to top of configurator on mobile
      const el = document.getElementById('cotizador');
      if (el && window.innerWidth < 960) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas reiniciar la configuración del cotizador?')) {
      onReset();
      setCurrentStep(1);
      setErrors({});
    }
  };

  // Real-time pure calculation
  const breakdown = calculateQuote(state);

  return (
    <section className="section cotizador-section" id="cotizador" aria-labelledby="cotizador-title">
      <div className="container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="eyebrow">
            <Sparkles size={14} />
            <span>Configuración Personalizada</span>
          </div>
          <h2 id="cotizador-title" className="section-title">
            Cotiza y diseña tu experiencia culinaria
          </h2>
          <p className="section-description">
            Personaliza cada aspecto de tu mesa. Los cálculos son transparentes e instantáneos para que conozcas la inversión estimada antes de conversar directamente con el Chef Carlos.
          </p>
        </div>

        <div className="draft-status" aria-live="polite">
          <p>{storageStatus === 'saved'
            ? 'Tu selección se guarda en este navegador durante 7 días. Los datos personales no se guardan en el navegador; al confirmar una solicitud se guardan en la base de datos.'
            : 'El guardado en este navegador no está disponible. Puedes continuar, pero la selección se perderá al recargar.'}</p>
          {notice && <p className="draft-notice">{notice}</p>}
        </div>

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={4}
          onSelectStep={(step) => {
            if (step < currentStep || validateStep(currentStep)) {
              setCurrentStep(step);
            }
          }}
          isStepValid={(step) => Object.keys(getStepErrors(state, step)).length === 0}
        />

        {/* Main Grid: Form Steps + Real-Time Sticky Summary */}
        <div className="cotizador-workspace-grid">
          {/* Left Column: Multi-Step Interactive Form */}
          <div className="cotizador-form-container">
            <div className="cotizador-form-card">
              {currentStep === 1 && (
                <StepEventDetails
                  state={state}
                  onChange={handleFieldChange}
                  errors={errors}
                />
              )}

              {currentStep === 2 && (
                <StepMenuSelection
                  state={state}
                  onChange={handleFieldChange}
                  errors={errors}
                />
              )}

              {currentStep === 3 && (
                <StepExtras
                  state={state}
                  onChange={handleFieldChange}
                />
              )}

              {currentStep === 4 && (
                <StepContactNotes
                  state={state}
                  onChange={handleFieldChange}
                  errors={errors}
                />
              )}

              {/* Form Navigation Action Buttons */}
              <div className="cotizador-form-actions">
                <div className="actions-left">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-back"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft size={16} />
                      <span>Anterior</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-text-reset"
                    onClick={handleReset}
                    title="Reiniciar cotizador"
                  >
                    <RefreshCw size={14} />
                    <span>Reiniciar</span>
                  </button>
                </div>

                <div className="actions-right">
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-next"
                      onClick={handleNextStep}
                    >
                      <span>Siguiente paso</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <span className="step-final-badge">
                      {isQuoteReady(state) ? '✓ Revisa el estimado en el resumen' : 'Completa tus datos para consultar disponibilidad'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Sidebar Summary */}
          <div className="cotizador-summary-container">
            <QuoteSummary
              state={state}
              breakdown={breakdown}
              onProceedToContact={() => {
                const invalidStep = [1, 2, 4].find(step => Object.keys(getStepErrors(state, step)).length > 0);
                if (invalidStep) {
                  setErrors(getStepErrors(state, invalidStep));
                  setCurrentStep(invalidStep);
                  document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
