import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, AlertCircle, Send } from 'lucide-react';
import type {
  ItineraryDay,
  ItineraryEstimate,
  ItineraryReceipt,
  ItinerarySelection,
  MealService,
  ServiceMenuSelection
} from '../../types/itinerary';
import { SimpleDateSelector } from './simple/SimpleDateSelector';
import { SimpleDayServices, type DayMenuSelections } from './simple/SimpleDayServices';
import { DEMO_PACKAGES } from '../../config/packages';
import { menusForService, selectionIssue } from '../../utils/itineraryMenus';
import { SimpleGuestCount } from './simple/SimpleGuestCount';
import { SimpleContact } from './simple/SimpleContact';
import { SimpleSummary } from './simple/SimpleSummary';
import { SimpleReceiptView } from './simple/SimpleReceiptView';
import './simple/SimpleQuote.css';

const STEPS = ['Tu evento', 'Servicios y menús', 'Tu estimado', 'Enviar solicitud'];
const TOTAL_STEPS = STEPS.length;

export const SimpleQuote: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dayServices, setDayServices] = useState<Record<string, MealService[]>>({});
  const [menuSelections, setMenuSelections] = useState<DayMenuSelections>({});
  const [guestsCount, setGuestsCount] = useState<number>(6);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [consent, setConsent] = useState<boolean>(false);
  const [dietary, setDietary] = useState('');
  const [location, setLocation] = useState('');
  const submission = useRef<{fingerprint:string;key:string}|null>(null);
  const stepBody = useRef<HTMLDivElement>(null);
  const lastStep = useRef(currentStep);
  useEffect(()=>{if(lastStep.current!==currentStep){lastStep.current=currentStep;stepBody.current?.focus();}},[currentStep]);
  const contactNotes = [location.trim() ? `Lugar o alojamiento: ${location.trim()}` : '', notes.trim()].filter(Boolean).join('\n');

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
        setMenuSelections(current => Object.fromEntries(Object.entries(current).filter(([date]) => date !== dateStr)));
        setDayServices(curr => {
          const updated = { ...curr };
          delete updated[dateStr];
          return updated;
        });
      } else {
        next = [...prev, dateStr].sort();
        // Services are chosen explicitly for each date.
        setDayServices(curr => ({
          ...curr,
          [dateStr]: curr[dateStr] || []
        }));
      }
      return next;
    });
    setStepErrors({});
  };

  const handleClearDate = (dateStr: string) => {
    setMenuSelections(current => Object.fromEntries(Object.entries(current).filter(([date]) => date !== dateStr)));
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
    setDayServices(curr => {
      const updated = { ...curr };
      delete updated[dateStr];
      return updated;
    });
  };

  // Step 2 handlers
  const handleToggleService = (dateStr: string, service: MealService) => {
    const menus = menusForService(DEMO_PACKAGES, service);
    setMenuSelections(current => current[dateStr]?.[service] ? current : {
      ...current, [dateStr]: { ...current[dateStr], [service]: { menuId: menus.length === 1 ? menus[0].id : '', requestedTime: '', selectedDishes: {} } }
    });
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

  const handleChangeSelection = (date: string, service: MealService, selection: ServiceMenuSelection) => {
    setMenuSelections(current => ({ ...current, [date]: { ...current[date], [service]: selection } }));
    setStepErrors({});
  };

  const handleCopySelection = (date: string, service: MealService, target: string) => {
    const selection = menuSelections[date]?.[service];
    if (!selection || !selectedDates.includes(target) || !menusForService(DEMO_PACKAGES, service).some(p => p.id === selection.menuId)) return;
    handleChangeSelection(target, service, structuredClone(selection));
    setDayServices(current => ({ ...current, [target]: [...new Set([...(current[target] || []), service])] }));
  };

  // Validation
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (selectedDates.length === 0) {
        errs.dates = 'Por favor selecciona al menos una fecha en el calendario.';
      }
      if (!Number.isSafeInteger(guestsCount) || guestsCount < 1 || guestsCount > 150) errs.guests = 'Indica entre 1 y 150 invitados.';
    }

    if (step === 2) {
      const missingService = selectedDates.find(d => !(dayServices[d] && dayServices[d].length > 0));
      if (missingService) {
        errs.services = 'Por favor selecciona al menos un servicio (desayuno, comida o cena) para cada fecha.';
      }
      for (const date of selectedDates) for (const service of dayServices[date] || []) {
        const issue = selectionIssue(DEMO_PACKAGES, service, menuSelections[date]?.[service]);
        if (issue) errs[`${date}-${service}`] = issue;
      }
    }

    if (step === 4) {
      if (!name.trim()) {
        errs.name = 'Por favor ingresa tu nombre completo.';
      }
      const digits = phone.replace(/\D/g, '');
      if (!/^\+?[\d ()-]+$/.test(phone.trim()) || digits.length < 10 || digits.length > 15) {
        errs.phone = 'Por favor ingresa un número de teléfono o WhatsApp válido de 10 a 15 dígitos.';
      }
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildSelection = (): ItinerarySelection => {
    const days: ItineraryDay[] = selectedDates.map(date => ({
      date,
      services: dayServices[date] || [],
      selections: Object.fromEntries((dayServices[date] || []).map(service => [service, menuSelections[date]?.[service]]))
    }));
    return {
      guestsCount,
      days,
      location: location.trim()
    };
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 2) {
      // The next step displays only the authoritative server estimate.
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
        if (estimate?.version !== data.version) setConsent(false);
        setEstimate(data);
        setCurrentStep(3);
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
    if (!estimate || !consent || busy || !validateStep(4)) return;
    setBusy(true);
    setSubmitError('');

    try {
      const payload = {
        selection: estimate.selection,
        contact: {
          name: name.trim(),
          phone: phone.trim(),
          dietaryRestrictions: dietary.trim(),
          additionalNotes: contactNotes
        },
        acceptedVersion: estimate.version,
        idempotencyKey: '',
        consent
      };

      const fingerprint=JSON.stringify({...payload,idempotencyKey:undefined});
      if(submission.current?.fingerprint!==fingerprint)submission.current={fingerprint,key:crypto.randomUUID()};
      payload.idempotencyKey=submission.current.key;
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
    setMenuSelections({});
    setGuestsCount(6);
    setName('');
    setPhone('');
    setNotes('');
    setDietary('');setLocation('');setConsent(false);submission.current=null;
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
            Consultar disponibilidad
          </h2>
          <p className="simple-intro-subtitle">
            Elige tus fechas, servicios y platillos. Carlos y Karen revisarán personalmente la disponibilidad.
          </p>
        </div>

        {/* Success View */}
        {receipt ? (
          <SimpleReceiptView receipt={receipt} onReset={handleReset} />
        ) : (
          <div className="simple-card-container">
            {/* Step Progress Pills */}
            <div className="simple-progress-bar" role="progressbar" aria-label={STEPS[currentStep-1]} aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
              {STEPS.map((label,index) => { const stepNum=index+1; return (
                <div
                  key={stepNum}
                  className={`progress-step-pill ${
                    stepNum === currentStep ? 'current' : stepNum < currentStep ? 'completed' : ''
                  }`}
                  aria-label={`Paso ${stepNum}: ${label}`}
                />
              ); })}
            </div>

            {/* Error notifications */}
            {Object.values(stepErrors).length > 0 && (
              <div className="simple-step-error-banner animate-fade-in" role="alert">
                <AlertCircle size={16} />
                <span>{Object.values(stepErrors)[0]}</span>
              </div>
            )}

            {submitError && (
              <div className="simple-step-error-banner animate-fade-in" role="alert">
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Active Step Content */}
            <div className="simple-step-body animate-fade-in" ref={stepBody} tabIndex={-1}>
              {currentStep === 1 && (
                <>
                <div className="simple-step-header"><span className="simple-step-tag">Paso 1</span><h3 className="simple-step-title">Tu evento</h3><p className="simple-step-desc">Elige una o varias fechas y cuéntanos dónde será.</p></div>
                <SimpleDateSelector
                  embedded
                  selectedDates={selectedDates}
                  onToggleDate={handleToggleDate}
                  onClearDate={handleClearDate}
                />
                <SimpleGuestCount embedded guestsCount={guestsCount} onChange={setGuestsCount}/>
                <label className="simple-field-group simple-event-location" htmlFor="simple-event-location"><span className="simple-field-label">¿Para dónde? Lugar o alojamiento (opcional)</span><input id="simple-event-location" className="simple-text-input" value={location} maxLength={500} placeholder="Ciudad, casa o lugar del evento" onChange={e=>setLocation(e.target.value)}/></label>
                </>
              )}

              {currentStep === 2 && (
                <SimpleDayServices
                  dates={selectedDates}
                  dayServices={dayServices}
                  selections={menuSelections}
                  errors={stepErrors}
                  onToggleService={handleToggleService}
                  onChangeSelection={handleChangeSelection}
                  onCopySelection={handleCopySelection}
                />
              )}

              {currentStep === 3 && estimate && <SimpleSummary estimate={estimate} onEdit={setCurrentStep}/>}

              {currentStep === 4 && (
                <>
                <SimpleContact
                  name={name}
                  phone={phone}
                  notes={notes}
                  dietary={dietary}
                  errors={stepErrors}
                  onChangeField={(field, val) => {
                    if (field === 'name') setName(val);
                    if (field === 'phone') setPhone(val);
                    if (field === 'notes') setNotes(val);
                    if (field === 'dietary') setDietary(val);
                    setStepErrors({});
                  }}
                />
                <div className="simple-send-review"><p>{estimate?.summary.dayCount} fechas · {estimate?.summary.serviceCount} servicios · {guestsCount} personas</p><button type="button" className="simple-btn-prev" disabled={busy} onClick={()=>setCurrentStep(3)}>Revisar o corregir estimado</button></div>
                <div className="summary-consent-block"><label className="simple-consent-label"><input type="checkbox" className="simple-checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} disabled={busy}/><span>Autorizo guardar esta solicitud para que el equipo me contacte por WhatsApp. Entiendo que no reserva una fecha automáticamente.</span></label></div>
                <button type="button" className="btn-submit-itinerary" disabled={busy || !consent} onClick={handleSubmit}><Send size={18}/><span>{busy ? 'Guardando solicitud…' : 'Enviar solicitud'}</span></button>
                </>
              )}
            </div>

            {/* Step Navigation Buttons */}
            {currentStep < 4 && (
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
                  <span>{currentStep === 2 ? 'Ver estimado' : currentStep === 3 ? 'Continuar' : 'Siguiente'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {currentStep === 4 && (
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
