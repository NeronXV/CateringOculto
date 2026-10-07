import React from 'react';
import { Check, Utensils, AlertCircle } from 'lucide-react';
import { formatEventDate } from '../../../utils/formatters';
import { MEAL_SERVICES, MEAL_LABELS, type MealService } from '../../../types/itinerary';

interface SimpleDayServicesProps {
  dates: string[];
  dayServices: Record<string, MealService[]>;
  onToggleService: (date: string, service: MealService) => void;
}

export const SimpleDayServices: React.FC<SimpleDayServicesProps> = ({
  dates,
  dayServices,
  onToggleService
}) => {
  return (
    <div className="simple-day-services">
      <div className="simple-step-header">
        <span className="simple-step-tag">Paso 2</span>
        <h3 className="simple-step-title">¿Qué momentos gastronómicos necesitas cada día?</h3>
        <p className="simple-step-desc">
          Elige los tiempos que deseas para cada fecha. Puedes combinar desayuno, comida y cena como mejor se adapte a tu plan.
        </p>
      </div>

      <div className="day-services-cards">
        {dates.map(dateStr => {
          const activeServices = dayServices[dateStr] || [];
          const hasNone = activeServices.length === 0;

          return (
            <div key={dateStr} className={`day-service-card ${hasNone ? 'card-warning' : ''}`}>
              <div className="day-card-header">
                <div className="day-card-date-wrap">
                  <Utensils size={16} className="day-card-icon" />
                  <h4 className="day-card-date">{formatEventDate(dateStr)}</h4>
                </div>
                <span className="day-card-count">
                  {activeServices.length === 0
                    ? 'Sin servicios'
                    : activeServices.length === 1
                    ? '1 momento'
                    : `${activeServices.length} momentos`}
                </span>
              </div>

              <div className="day-meal-options" role="group" aria-label={`Servicios para ${dateStr}`}>
                {MEAL_SERVICES.map(meal => {
                  const isChecked = activeServices.includes(meal);
                  return (
                    <button
                      type="button"
                      key={meal}
                      className={`meal-pill-btn ${isChecked ? 'active' : ''}`}
                      onClick={() => onToggleService(dateStr, meal)}
                      aria-pressed={isChecked}
                    >
                      <span className="meal-pill-checkbox">
                        {isChecked && <Check size={14} />}
                      </span>
                      <span className="meal-pill-label">{MEAL_LABELS[meal]}</span>
                    </button>
                  );
                })}
              </div>

              {hasNone && (
                <div className="day-warning-notice">
                  <AlertCircle size={14} />
                  <span>Selecciona al menos un momento para este día.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
