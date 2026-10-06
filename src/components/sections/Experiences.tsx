import { SECTIONS_CONFIG } from '../../config/sections';
import React from 'react';
import { ArrowRight, Sparkles, GlassWater, Users, Building2 } from 'lucide-react';
import { EventType } from '../../types';
import './Experiences.css';

interface ExperiencesProps {
  onSelectExperience: (eventType: EventType) => void;
}

export const Experiences: React.FC<ExperiencesProps> = ({ onSelectExperience }) => {
  const experiences = SECTIONS_CONFIG.experiences.items;

  return (
    <section className="section" id="experiencias" aria-labelledby="experiences-heading">
      <div className="container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="eyebrow">
            <Sparkles size={14} />
            <span>Formatos de Hospitalidad</span>
          </div>
          <h2 id="experiences-heading" className="section-title">
            {SECTIONS_CONFIG.experiences.title}
          </h2>
          <p className="section-description">
            {SECTIONS_CONFIG.experiences.description}
          </p>
        </div>

        {/* Experience Cards Grid */}
        <div className="experiences-grid">
          {experiences.map((exp) => (
            <article key={exp.id} className="experience-card">
              <div className="experience-media">
                <img
                  src={exp.image}
                  alt={exp.imageAlt}
                  className="experience-img"
                  loading="lazy"
                  width="800"
                  height="533"
                />
                <div className="experience-media-badge">
                  <span>{exp.demoNote}</span>
                </div>
              </div>

              <div className="experience-body">
                <div className="experience-icon-title">
                  <div className="experience-icon">{exp.id === 'cena_privada' ? <GlassWater size={20}/> : exp.id === 'celebracion' ? <Users size={20}/> : <Building2 size={20}/>}</div>
                  <span className="experience-subtitle">{exp.subtitle}</span>
                </div>

                <h3 className="experience-title">{exp.title}</h3>

                <p className="experience-text">{exp.description}</p>

                <div className="experience-ideal">
                  <span className="ideal-label">Capacidad sugerida:</span>
                  <span className="ideal-value">{exp.idealFor}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary experience-action-btn"
                  onClick={() => onSelectExperience(exp.id as EventType)}
                >
                  <span>Cotizar {exp.title}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
