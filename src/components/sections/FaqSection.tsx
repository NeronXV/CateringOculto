import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import './FaqSection.css';

const ESSENTIAL_FAQS = [
  {
    question: '¿Con cuánta anticipación debo reservar?',
    answer: 'Recomendamos solicitar tu fecha con al menos 3 a 7 días de anticipación para estancias cortas y cenas privadas, y con 2 a 4 semanas para grupos grandes o temporada alta. Siempre puedes consultar disponibilidad de último momento por WhatsApp.'
  },
  {
    question: '¿Pueden atender alergias o restricciones alimentarias?',
    answer: 'Completamente. Toda la cocina se prepara al momento exclusivamente para tu grupo. Diseñamos alternativas cuidadas para comensales celíacos, vegetarianos, veganos o con alergias a mariscos, frutos secos y lácteos.'
  },
  {
    question: '¿La solicitud en la página confirma automáticamente mi fecha?',
    answer: 'No. La solicitud nos permite conocer tus fechas, comensales y servicios deseados. Carlos y Karen Ascencio revisan personalmente la agenda y te contactan de inmediato por WhatsApp para confirmar disponibilidad antes de cualquier anticipo.'
  },
  {
    question: '¿Ofrecen servicio fuera de La Paz?',
    answer: 'Sí. Además de La Paz, atendemos residencias y villas en Cerritos, Todos Santos, El Triunfo y zonas aledañas en Baja California Sur (sujeto a logística previa).'
  }
];

export const FaqSection: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleFaq = (index: number) => {
    setOpenIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <section className="section" id="preguntas" aria-labelledby="faq-heading">
      <div className="container container-narrow">
        <div className="section-header-centered">
          <div className="eyebrow">
            <Sparkles size={14} />
            <span>Preguntas Frecuentes</span>
          </div>
          <h2 id="faq-heading" className="section-title">
            Dudas habituales
          </h2>
          <p className="section-description">
            Información clave para planear tu estancia y resolver tus preguntas con total transparencia.
          </p>
        </div>

        <div className="faq-list">
          {ESSENTIAL_FAQS.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);

            return (
              <div
                key={idx}
                className={`faq-card ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-question-content">
                    <HelpCircle size={18} className="faq-question-icon" />
                    <span className="faq-question-text">{faq.question}</span>
                  </div>
                  <span className="faq-chevron">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {isOpen && (
                  <div className="faq-answer-panel animate-fade-in">
                    <p className="faq-answer-text">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
