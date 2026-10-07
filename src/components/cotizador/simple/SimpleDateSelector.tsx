import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { getTodayMinDateString, formatEventDate } from '../../../utils/formatters';
import { SERVER_ENABLED } from '../../../config/runtime';

interface SimpleDateSelectorProps {
  selectedDates: string[];
  onToggleDate: (date: string) => void;
  onClearDate: (date: string) => void;
}

export const SimpleDateSelector: React.FC<SimpleDateSelectorProps> = ({
  selectedDates,
  onToggleDate,
  onClearDate
}) => {
  const minDate = getTodayMinDateString();
  const [currentMonth, setCurrentMonth] = useState(() => minDate.slice(0, 7));
  const [availability, setAvailability] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!SERVER_ENABLED || !/^\d{4}-\d{2}$/.test(currentMonth)) return;
    let active = true;
    fetch(`/api/local-editor/availability?month=${currentMonth}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (active && d && d.days) setAvailability(d.days);
      })
      .catch(() => {
        // Soft fail: availability is advisory
      });
    return () => {
      active = false;
    };
  }, [currentMonth]);

  const [year, monthNum] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const startDayOffset = (new Date(year, monthNum - 1, 1).getDay() + 6) % 7; // Monday = 0

  const monthLabel = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, monthNum - 1, 1));

  const handlePrevMonth = () => {
    const prev = new Date(year, monthNum - 2, 1);
    const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const minMonth = minDate.slice(0, 7);
    if (prevStr >= minMonth) {
      setCurrentMonth(prevStr);
    }
  };

  const handleNextMonth = () => {
    const next = new Date(year, monthNum, 1);
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(nextStr);
  };

  const minMonth = minDate.slice(0, 7);
  const canGoPrev = currentMonth > minMonth;

  return (
    <div className="simple-date-selector">
      <div className="simple-step-header">
        <span className="simple-step-tag">Paso 1</span>
        <h3 className="simple-step-title">¿Cuándo te gustaría que cocinemos para ti?</h3>
        <p className="simple-step-desc">
          Toca una o varias fechas en el calendario. Puedes elegir días sueltos o estancias completas.
        </p>
      </div>

      <div className="simple-calendar-card">
        <div className="simple-calendar-nav">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="calendar-month-heading">{monthLabel}</span>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="simple-calendar-weekdays" aria-hidden="true">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <span key={d} className="calendar-weekday">
              {d}
            </span>
          ))}
        </div>

        <div className="simple-calendar-grid" role="grid" aria-label="Calendario de fechas">
          {Array.from({ length: startDayOffset }, (_, i) => (
            <span key={`blank-${i}`} className="calendar-cell-blank" aria-hidden="true" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentMonth}-${String(dayNum).padStart(2, '0')}`;
            const isPast = dateStr < minDate;
            const isSelected = selectedDates.includes(dateStr);
            const status = availability ? availability[dateStr] : null;
            const isUnavailable = status === 'unavailable';

            return (
              <button
                type="button"
                key={dateStr}
                className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${
                  isUnavailable ? 'unavailable' : ''
                } ${isPast ? 'past' : ''}`}
                disabled={isPast || isUnavailable}
                aria-pressed={isSelected}
                aria-label={`${dayNum} de ${monthLabel}${
                  isSelected ? ', seleccionado' : ''
                }${isUnavailable ? ', no disponible' : ''}`}
                onClick={() => onToggleDate(dateStr)}
              >
                <span className="day-number">{dayNum}</span>
                {isSelected && <span className="day-active-dot" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDates.length > 0 ? (
        <div className="simple-selected-chips-box">
          <div className="selected-chips-title">
            <CalendarIcon size={15} />
            <span>
              {selectedDates.length === 1
                ? '1 fecha seleccionada'
                : `${selectedDates.length} fechas seleccionadas`}
            </span>
          </div>
          <div className="selected-chips-list">
            {selectedDates.map(dateStr => (
              <span key={dateStr} className="selected-date-chip">
                <span>{formatEventDate(dateStr)}</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => onClearDate(dateStr)}
                  aria-label={`Eliminar ${dateStr}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="simple-hint-box">Selecciona al menos un día en el calendario para continuar.</p>
      )}
    </div>
  );
};
