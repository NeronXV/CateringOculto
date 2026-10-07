import React from 'react';
import { Calendar, Utensils, Users, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import './HowItWorks.css';

interface HowItWorksProps {
  onOpenCotizador: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenCotizador }) => {
  const steps = [
    {
      number: '01',
      title: 'Elige tus fechas',
      description: 'Selecciona los días que estarás en tu villa o residencia en La Paz. Pueden ser días consecutivos o fechas puntuales.',
      icon: <Calendar size={22} />
    },
    {
      number: '02',
      title: 'Elige tus servicios',
      description: 'Marca qué necesitas cada día: desayuno, comida, cena o combinación de ellos según el ritmo de tu viaje.',
      icon: <Utensils size={22} />
    },
    {
      number: '03',
      title: 'Indica comensales',
      description: 'Dinos cuántas personas disfrutarán del servicio y si existe alguna alergia o preferencia alimentaria.',
      icon: <Users size={22} />
    },
    {
      number: '04',
      title: 'Confirmación directa',
      description: 'Carlos y Karen revisan tu solicitud y se ponen en contacto contigo directamente por WhatsApp para afinar el menú.',
      icon: <MessageCircle size={22} />
    }
  ];

  return (
    <section className="section section-subtle" id="como-funciona" aria-labelledby="como-funciona-heading">
      <div className="container">
        <div className="section-header-centered">
          <div className="eyebrow">
            <Sparkles size={14} />
            <span>Paso a Paso</span>
          </div>
          <h2 id="como-funciona-heading" className="section-title">
            ¿Cómo funciona el servicio?
          </h2>
          <p className="section-description">
            Sin intermediarios ni procesos complicados. Una atención cálida, directa y personalizada desde el primer mensaje.
          </p>
        </div>

        <div className="steps-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          {steps.map((step, idx) => (
            <div key={idx} className="step-card">
              <div className="step-badge-row">
                <span className="step-number">{step.number}</span>
                <div className="step-icon-wrap">{step.icon}</div>
              </div>

              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="how-it-works-cta">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCotizador}
          >
            <span>Consultar disponibilidad</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
