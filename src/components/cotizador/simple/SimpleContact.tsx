import React from 'react';
import { User, Phone, MessageSquare } from 'lucide-react';

interface SimpleContactProps {
  name: string;
  phone: string;
  notes: string;
  errors: Record<string, string>;
  onChangeField: (field: 'name' | 'phone' | 'notes', value: string) => void;
}

export const SimpleContact: React.FC<SimpleContactProps> = ({
  name,
  phone,
  notes,
  errors,
  onChangeField
}) => {
  return (
    <div className="simple-contact">
      <div className="simple-step-header">
        <span className="simple-step-tag">Paso 4</span>
        <h3 className="simple-step-title">¿A nombre de quién preparamos la propuesta?</h3>
        <p className="simple-step-desc">
          Solo necesitamos tus datos de contacto básicos para enviarte la propuesta y coordinar contigo por WhatsApp.
        </p>
      </div>

      <div className="simple-contact-form">
        <div className="simple-field-group">
          <label htmlFor="simple-contact-name" className="simple-field-label">
            <User size={15} />
            <span>Tu nombre completo</span>
            <span className="required-star">*</span>
          </label>
          <input
            id="simple-contact-name"
            type="text"
            className={`simple-text-input ${errors.name ? 'has-error' : ''}`}
            placeholder="Ej. Alejandra Valenzuela"
            value={name}
            maxLength={100}
            onChange={e => onChangeField('name', e.target.value)}
            autoComplete="name"
          />
          {errors.name && <p className="simple-field-error">{errors.name}</p>}
        </div>

        <div className="simple-field-group">
          <label htmlFor="simple-contact-phone" className="simple-field-label">
            <Phone size={15} />
            <span>WhatsApp o teléfono celular</span>
            <span className="required-star">*</span>
          </label>
          <input
            id="simple-contact-phone"
            type="tel"
            className={`simple-text-input ${errors.phone ? 'has-error' : ''}`}
            placeholder="Ej. 612 123 4567 o +52 612 123 4567"
            value={phone}
            maxLength={30}
            onChange={e => onChangeField('phone', e.target.value)}
            autoComplete="tel"
          />
          <span className="simple-field-hint">
            Te responderemos con la disponibilidad y menú por este medio.
          </span>
          {errors.phone && <p className="simple-field-error">{errors.phone}</p>}
        </div>

        <div className="simple-field-group">
          <label htmlFor="simple-contact-notes" className="simple-field-label">
            <MessageSquare size={15} />
            <span>Notas, alergias o preferencias (opcional)</span>
          </label>
          <textarea
            id="simple-contact-notes"
            className="simple-textarea"
            rows={3}
            placeholder="Ej. Algunos invitados no comen mariscos; nos gustaría enfocar las cenas en cortes y pesca fresca..."
            value={notes}
            maxLength={1000}
            onChange={e => onChangeField('notes', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
