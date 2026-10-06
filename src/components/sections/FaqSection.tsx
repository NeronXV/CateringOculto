import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FAQS_CONFIG } from '../../config/faqs';
import './FaqSection.css';

export const FaqSection: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0, 1]);

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
            <span>Claridad & Términos</span>
          </div>
          <h2 id="faq-heading" className="section-title">
            Preguntas frecuentes & Condiciones
          </h2>
          <p className="section-description">
            Resolvemos las dudas habituales sobre tiempos de reserva, logística en locación y preparación personalizada de menús.
          </p>
        </div>

        <div className="faq-list">
          {FAQS_CONFIG.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);
            const isPolicyNotice = faq.category === 'politicas';

            return (
              <div
                key={idx}
                className={`faq-card ${isOpen ? 'open' : ''} ${isPolicyNotice ? 'policy-card' : ''}`}
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
