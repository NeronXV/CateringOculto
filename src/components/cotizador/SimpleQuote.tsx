import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import type {
  ItineraryDay,
  ItineraryEstimate,
  ItineraryReceipt,
  ItinerarySelection,
  MealService
} from '../../types/itinerary';
import { SimpleDateSelector } from './simple/SimpleDateSelector';
import { SimpleDayServices } from './simple/SimpleDayServices';
import { SimpleGuestCount } from './simple/SimpleGuestCount';
import { SimpleContact } from './simple/SimpleContact';
import { SimpleSummary } from './simple/SimpleSummary';
import { SimpleReceiptView } from './simple/SimpleReceiptView';
import './simple/SimpleQuote.css';

const TOTAL_STEPS = 5;

export const SimpleQuote: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dayServices, setDayServices] = useState<Record<string, MealService[]>>({});
  const [guestsCount, setGuestsCount] = useState<number>(6);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [consent, setConsent] = useState<boolean>(true);

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [estimate, setEstimate] = useState<ItineraryEstimate | null>(null);
  const [receipt, setReceipt] = useState<ItineraryReceipt | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Step 1 handlers
  const handleToggleDate = (dateStr: string) => {
    setSelectedDates(prev => {
      const exists = prev.includes(dateStr);
      let next: string[];
      if (exists) {
        next = prev.filter(d => d !== dateStr);
        setDayServices(curr => {
          const updated = { ...curr };
          delete updated[dateStr];
          return updated;
        });
      } else {
        next = [...prev, dateStr].sort();
        // Default service for newly picked date: comida
        setDayServices(curr => ({
          ...curr,
          [dateStr]: curr[dateStr] || ['comida']
        }));
      }
      return next;
    });
    setStepErrors({});
  };

  const handleClearDate = (dateStr: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
    setDayServices(curr => {
      const updated = { ...curr };
      delete updated[dateStr];
      return updated;
    });
  };

  // Step 2 handlers
  const handleToggleService = (dateStr: string, service: MealService) => {
    setDayServices(curr => {
      const existing = curr[dateStr] || [];
      const hasService = existing.includes(service);
      let updated: MealService[];
      if (hasService) {
        updated = existing.filter(s => s !== service);
      } else {
        updated = [...existing, service];
      }
      return {
        ...curr,
        [dateStr]: updated
      };
    });
    setStepErrors({});
  };

  // Validation
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (selectedDates.length === 0) {
        errs.dates = 'Por favor selecciona al menos una fecha en el calendario.';
      }
    }

    if (step === 2) {
      const missingService = selectedDates.find(d => !(dayServices[d] && dayServices[d].length > 0));
      if (missingService) {
        errs.services = 'Por favor selecciona al menos un servicio (desayuno, comida o cena) para cada fecha.';
      }
    }

    if (step === 3) {
      if (!guestsCount || guestsCount < 1 || guestsCount > 150) {
        errs.guests = 'El número de comensales debe ser entre 1 y 150.';
      }
    }

    if (step === 4) {
      if (!name.trim()) {
        errs.name = 'Por favor ingresa tu nombre completo.';
      }
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        errs.phone = 'Por favor ingresa un número de teléfono o WhatsApp válido de 10 a 15 dígitos.';
      }
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildSelection = (): ItinerarySelection => {
    const days: ItineraryDay[] = selectedDates.map(date => ({
      date,
      services: dayServices[date] || []
    }));
    return {
      guestsCount,
      days
    };
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 4) {
      // Transitioning to Step 5 (Summary): fetch preliminary estimate from server
      setBusy(true);
      setSubmitError('');
      try {
        const selection = buildSelection();
        const res = await fetch('/api/local-editor/quotes/itinerary/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selection)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'No se pudo generar el presupuesto preliminar.');
        }
        setEstimate(data);
        setCurrentStep(5);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Error al conectar con el servidor.');
      } finally {
        setBusy(false);
      }
      return;
    }

    setCurrentStep(prev => Math.min(TOTAL_STEPS, prev + 1));
    const container = document.getElementById('cotizador');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    setStepErrors({});
    setSubmitError('');
  };

  const handleSubmit = async () => {
    if (!estimate) return;
    setBusy(true);
    setSubmitError('');

    try {
      const payload = {
        selection: estimate.selection,
        contact: {
          name: name.trim(),
          phone: phone.trim(),
          dietaryRestrictions: '',
          additionalNotes: notes.trim()
        },
        acceptedVersion: estimate.version,
        idempotencyKey: crypto.randomUUID(),
        consent: true
      };

      const res = await fetch('/api/local-editor/quotes/itinerary/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo guardar la solicitud.');
      }
      setReceipt({
        folio: data.folio,
        createdAt: data.createdAt,
        estimate: data.estimate,
        contact: payload.contact
      });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo guardar la solicitud. Por favor reintenta.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setEstimate(null);
    setCurrentStep(1);
    setSelectedDates([]);
    setDayServices({});
    setGuestsCount(6);
    setName('');
    setPhone('');
    setNotes('');
    setSubmitError('');
    setStepErrors({});
  };

  return (
    <section className="section simple-quote-section" id="cotizador" aria-labelledby="simple-quote-heading">
      <div className="container">
        {/* Section Header */}
        <div className="simple-quote-intro">
          <div className="simple-intro-eyebrow">
            <Sparkles size={14} />
            <span>Chef Privado & Catering</span>
          </div>
          <h2 id="simple-quote-heading" className="simple-intro-title">
            Diseña tu experiencia en La Paz BCS
          </h2>
          <p className="simple-intro-subtitle">
            Indica las fechas de tu estancia, cuántas personas te acompañan y los momentos en que deseas que cocinemos para ti.
          </p>
        </div>

        {/* Success View */}
        {receipt ? (
          <SimpleReceiptView receipt={receipt} onReset={handleReset} />
        ) : (
          <div className="simple-card-container">
            {/* Step Progress Pills */}
            <div className="simple-progress-bar" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
              {[1, 2, 3, 4, 5].map(stepNum => (
                <div
                  key={stepNum}
                  className={`progress-step-pill ${
                    stepNum === currentStep ? 'current' : stepNum < currentStep ? 'completed' : ''
                  }`}
                  aria-label={`Paso ${stepNum}`}
                />
              ))}
            </div>

            {/* Error notifications */}
            {Object.values(stepErrors).length > 0 && (
              <div className="simple-step-error-banner animate-fade-in" role="alert">
                <AlertCircle size={16} />
                <span>{Object.values(stepErrors)[0]}</span>
              </div>
            )}

            {submitError && currentStep !== 5 && (
              <div className="simple-step-error-banner animate-fade-in" role="alert">
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Active Step Content */}
            <div className="simple-step-body animate-fade-in">
              {currentStep === 1 && (
                <SimpleDateSelector
                  selectedDates={selectedDates}
                  onToggleDate={handleToggleDate}
                  onClearDate={handleClearDate}
                />
              )}

              {currentStep === 2 && (
                <SimpleDayServices
                  dates={selectedDates}
                  dayServices={dayServices}
                  onToggleService={handleToggleService}
                />
              )}

              {currentStep === 3 && (
                <SimpleGuestCount
                  guestsCount={guestsCount}
                  onChange={setGuestsCount}
                />
              )}

              {currentStep === 4 && (
                <SimpleContact
                  name={name}
                  phone={phone}
                  notes={notes}
                  errors={stepErrors}
                  onChangeField={(field, val) => {
                    if (field === 'name') setName(val);
                    if (field === 'phone') setPhone(val);
                    if (field === 'notes') setNotes(val);
                    setStepErrors({});
                  }}
                />
              )}

              {currentStep === 5 && (
                <SimpleSummary
                  selection={buildSelection()}
                  contactName={name}
                  contactPhone={phone}
                  contactNotes={notes}
                  references={estimate?.references || []}
                  busy={busy}
                  error={submitError}
                  consent={consent}
                  onConsentChange={setConsent}
                  onSubmit={handleSubmit}
                />
              )}
            </div>

            {/* Step Navigation Buttons */}
            {currentStep < 5 && (
              <div className="simple-nav-actions">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    className="simple-btn-prev"
                    onClick={handlePrev}
                    disabled={busy}
                  >
                    <ArrowLeft size={18} />
                    <span>Anterior</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  className="simple-btn-next"
                  onClick={handleNext}
                  disabled={busy}
                >
                  <span>{currentStep === 4 ? 'Revisar solicitud' : 'Siguiente'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {currentStep === 5 && (
              <div className="simple-nav-back-only">
                <button
                  type="button"
                  className="simple-btn-prev"
                  onClick={handlePrev}
                  disabled={busy}
                >
                  <ArrowLeft size={18} />
                  <span>Modificar datos</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
