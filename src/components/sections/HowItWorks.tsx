import React from 'react';
import { Sparkles, Compass, Sliders, MessageCircle, ArrowRight } from 'lucide-react';
import './HowItWorks.css';

interface HowItWorksProps {
  onOpenCotizador: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenCotizador }) => {
  const steps = [
    {
      number: '01',
      title: 'Elige tu experiencia',
      description: 'Explora nuestros formatos de servicio (cena privada, celebración o catering) y selecciona el estilo de menú que mejor resuene con tu evento.',
      icon: <Compass size={24} />
    },
    {
      number: '02',
      title: 'Configura comensales y complementos',
      description: 'Indica invitados, fecha y localidad. Elige tus preferencias de platillos y los complementos disponibles para tu menú.',
      icon: <Sliders size={24} />
    },
    {
      number: '03',
      title: 'Revisa tu presupuesto y guarda tu solicitud',
      description: 'Recibe un folio, conserva tu presupuesto y compártelo por WhatsApp o correo. El chef tendrá tus preferencias y podrá centrarse en confirmar disponibilidad y resolver lo pendiente.',
      icon: <MessageCircle size={24} />
    }
  ];

  return (
    <section className="section section-subtle" id="como-funciona" aria-labelledby="como-funciona-heading">
      <div className="container">
        <div className="section-header-centered">
          <div className="eyebrow">
            <Sparkles size={14} />
            <span>Hospitalidad Simple & Directa</span>
          </div>
          <h2 id="como-funciona-heading" className="section-title">
            Cómo diseñamos tu evento
          </h2>
          <p className="section-description">
            Sin formularios interminables ni reservas automáticas impersonales. Conectamos directamente contigo desde el primer momento.
          </p>
        </div>

        <div className="steps-grid">
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
            <span>Comenzar configuración ahora</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
