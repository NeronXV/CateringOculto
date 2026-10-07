import React from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import { ITINERARY_MAX_GUESTS } from '../../../types/itinerary';

interface SimpleGuestCountProps {
  guestsCount: number;
  onChange: (value: number) => void;
}

export const SimpleGuestCount: React.FC<SimpleGuestCountProps> = ({
  guestsCount,
  onChange
}) => {
  const handleDecrement = () => {
    if (guestsCount > 1) {
      onChange(guestsCount - 1);
    }
  };

  const handleIncrement = () => {
    if (guestsCount < ITINERARY_MAX_GUESTS) {
      onChange(guestsCount + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(1, Math.min(ITINERARY_MAX_GUESTS, parsed));
      onChange(clamped);
    }
  };

  return (
    <div className="simple-guest-count">
      <div className="simple-step-header">
        <span className="simple-step-tag">Paso 3</span>
        <h3 className="simple-step-title">¿Para cuántas personas?</h3>
        <p className="simple-step-desc">
          Indica el número aproximado de invitados que disfrutarán de la experiencia culinaria.
        </p>
      </div>

      <div className="guest-counter-box">
        <div className="guest-counter-main">
          <button
            type="button"
            className="guest-count-btn minus"
            onClick={handleDecrement}
            disabled={guestsCount <= 1}
            aria-label="Disminuir comensales"
          >
            <Minus size={22} />
          </button>

          <div className="guest-count-display">
            <input
              type="number"
              className="guest-count-input"
              value={guestsCount}
              min={1}
              max={ITINERARY_MAX_GUESTS}
              onChange={handleInputChange}
              aria-label="Número de personas"
            />
            <span className="guest-count-unit">
              {guestsCount === 1 ? 'persona' : 'personas'}
            </span>
          </div>

          <button
            type="button"
            className="guest-count-btn plus"
            onClick={handleIncrement}
            disabled={guestsCount >= ITINERARY_MAX_GUESTS}
            aria-label="Aumentar comensales"
          >
            <Plus size={22} />
          </button>
        </div>

        <div className="guest-counter-note">
          <Users size={16} />
          <span>
            {guestsCount < 5
              ? 'Para grupos de menos de 5 personas, el chef confirma la viabilidad del montaje.'
              : 'Atendemos con servicio personalizado en residencia, villa o terraza.'}
          </span>
        </div>
      </div>
    </div>
  );
};
