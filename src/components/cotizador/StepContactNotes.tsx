import { SERVER_ENABLED } from '../../config/runtime';
import React from 'react';
import { User, MessageSquare, AlertCircle, ShieldCheck } from 'lucide-react';
import { QuoteConfigState } from '../../types';

interface StepContactNotesProps {
  state: QuoteConfigState;
  onChange: <K extends keyof QuoteConfigState>(field: K, value: QuoteConfigState[K]) => void;
  errors: Record<string, string>;
}

export const StepContactNotes: React.FC<StepContactNotesProps> = ({
  state,
  onChange,
  errors
}) => {
  return (
    <div className="step-content-pane animate-fade-in">
      <div className="step-pane-header">
        <span className="step-pane-badge">Paso 4 de 4</span>
        <h3 className="step-pane-title">Datos de Contacto & Notas</h3>
        <p className="step-pane-subtitle">
          Indícanos tu nombre y cualquier requerimiento alimentario para preparar tu consulta personalizada.
        </p>
      </div>

      {/* 1. Nombre Completo */}
      <div className="form-group">
        <label htmlFor="client-name-input" className="form-label">
          <User size={15} className="label-icon" />
          <span>Nombre y Apellido</span>
          <span className="required-star">*</span>
        </label>
        <input
          id="client-name-input"
          type="text"
          value={state.clientName}
          onChange={(e) => onChange('clientName', e.target.value)}
          placeholder="Ej. Sofía Mendoza"
          className={`form-input ${errors.clientName ? 'input-error' : ''}`}
          required
          maxLength={100}
        />
        <p className="field-hint">
          {SERVER_ENABLED ? 'En el resumen podrás añadir tu teléfono y guardar la solicitud con un folio.' : 'La conversación se iniciará desde tu propio WhatsApp.'}
        </p>
        {errors.clientName && (
          <div className="field-error-msg">
            <AlertCircle size={14} />
            <span>{errors.clientName}</span>
          </div>
        )}
      </div>

      {/* 2. Restricciones Alimentarias */}
      <div className="form-group">
        <label htmlFor="dietary-restrictions-input" className="form-label">
          <span>Alergias o Restricciones Alimentarias (Opcional)</span>
        </label>
        <textarea
          id="dietary-restrictions-input"
          value={state.dietaryRestrictions}
          onChange={(e) => onChange('dietaryRestrictions', e.target.value)}
          placeholder="Ej. 1 persona celíaca (sin gluten), 1 persona alérgica a mariscos o nueces..."
          className="form-textarea"
          rows={3}
          maxLength={2000}
        />
        <p className="field-hint">
          El equipo debe revisar las restricciones y confirmar qué adaptaciones puede ofrecer. No se garantiza ausencia de alérgenos.
        </p>
      </div>

      {/* 3. Comentarios Adicionales */}
      <div className="form-group">
        <label htmlFor="additional-notes-input" className="form-label">
          <MessageSquare size={15} className="label-icon" />
          <span>Comentarios o Deseos Especiales (Opcional)</span>
        </label>
        <textarea
          id="additional-notes-input"
          value={state.additionalNotes}
          onChange={(e) => onChange('additionalNotes', e.target.value)}
          placeholder="Ej. Es el aniversario sorpresa de mis padres; preferimos servicio en terraza exterior al atardecer..."
          className="form-textarea"
          rows={3}
          maxLength={2000}
        />
      </div>

      {/* Explanation Box */}
      <div className="contact-explanation-box">
        <div className="explanation-header">
          <ShieldCheck size={18} className="text-olive" />
          <span className="explanation-title">¿Qué sucede en el siguiente paso?</span>
        </div>
        <p className="explanation-text">
          {SERVER_ENABLED ? 'Revisa el estimado actualizado, acepta el guardado y obtén tu folio. Después podrás abrir WhatsApp para continuar la conversación.' : 'Abre WhatsApp con tu resumen para consultar disponibilidad.'}
        </p>
        <p className="explanation-subtext">
          {SERVER_ENABLED ? 'Al confirmar guardaremos tu solicitud para que el equipo pueda revisarla. Después podrás compartir el presupuesto por WhatsApp o correo. La fecha no queda reservada automáticamente.' : 'Tú decides cuándo enviar el mensaje. No se reserva la fecha automáticamente.'}
        </p>
      </div>
    </div>
  );
};
