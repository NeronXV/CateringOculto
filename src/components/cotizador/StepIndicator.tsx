import React from 'react';
import { Check } from 'lucide-react';
import './Cotizador.css';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onSelectStep: (step: number) => void;
  isStepValid: (step: number) => boolean;
}

const STEP_LABELS = [
  'Evento & Zona',
  'Menú & Invitados',
  'Extras & Servicios',
  'Contacto & Envío'
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  onSelectStep,
  isStepValid
}) => {
  return (
    <div className="step-indicator-wrapper" aria-label="Progreso del cotizador">
      <div className="step-indicator-track">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCurrent = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          const canNavigate = isCompleted || (stepNum === currentStep + 1 && isStepValid(currentStep));

          return (
            <div
              key={stepNum}
              className={`step-indicator-item ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <button
                type="button"
                className="step-circle"
                onClick={() => canNavigate && onSelectStep(stepNum)}
                disabled={!canNavigate && !isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Paso ${stepNum}: ${STEP_LABELS[i]}`}
              >
                {isCompleted ? <Check size={14} /> : stepNum}
              </button>
              <span className="step-label-text">{STEP_LABELS[i]}</span>
              {stepNum < totalSteps && <div className="step-line" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
