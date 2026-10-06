import React from 'react';
import { Flame, Compass, HeartHandshake, Fish, Sparkles } from 'lucide-react';
import { SECTIONS_CONFIG } from '../../config/sections';
import './Philosophy.css';

export const Philosophy: React.FC = () => {
  return (
    <section className="section section-dark" id="cocina" aria-labelledby="cocina-heading">
      <div className="container">
        <div className="philosophy-grid">
          {/* Left Column: Visual Composition */}
          <div className="philosophy-media-col">
            <div className="philosophy-image-stack">
              <div className="image-stack-primary">
                <img
                  src={SECTIONS_CONFIG.philosophy.photos[0].image}
                  alt={SECTIONS_CONFIG.philosophy.photos[0].imageAlt}
                  className="stack-img"
                  loading="lazy"
                  width="900"
                  height="1100"
                />
                <span className="badge-demo stack-demo-tag">{SECTIONS_CONFIG.philosophy.photoNote}</span>
              </div>
              <div className="image-stack-secondary">
                <img
                  src={SECTIONS_CONFIG.philosophy.photos[1].image}
                  alt={SECTIONS_CONFIG.philosophy.photos[1].imageAlt}
                  className="stack-img"
                  loading="lazy"
                  width="600"
                  height="450"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Narrative */}
          <div className="philosophy-text-col">
            <div className="eyebrow">
              <Sparkles size={14} />
              <span>Nuestra Filosofía</span>
            </div>

            <h2 id="cocina-heading" className="section-title">
              {SECTIONS_CONFIG.philosophy.title}
            </h2>

            <div className="editorial-divider"></div>

            <p className="philosophy-lead">{SECTIONS_CONFIG.philosophy.description}</p>

            <div className="philosophy-pillars">
              <div className="pillar-item">
                <div className="pillar-icon">
                  <Fish size={20} />
                </div>
                <div className="pillar-content">
                  <h3 className="pillar-title">{SECTIONS_CONFIG.philosophy.pillars[0].title}</h3>
                  <p className="pillar-desc">
                    {SECTIONS_CONFIG.philosophy.pillars[0].description}
                  </p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon">
                  <Flame size={20} />
                </div>
                <div className="pillar-content">
                  <h3 className="pillar-title">{SECTIONS_CONFIG.philosophy.pillars[1].title}</h3>
                  <p className="pillar-desc">
                    {SECTIONS_CONFIG.philosophy.pillars[1].description}
                  </p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon">
                  <HeartHandshake size={20} />
                </div>
                <div className="pillar-content">
                  <h3 className="pillar-title">{SECTIONS_CONFIG.philosophy.pillars[2].title}</h3>
                  <p className="pillar-desc">
                    {SECTIONS_CONFIG.philosophy.pillars[2].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Chef Team Profile Placeholder Box (No false Michelin or made up awards) */}
            <div className="chef-team-box">
              <div className="chef-team-header">
                <Compass size={18} className="text-bronze" />
                <span className="chef-team-label">El Equipo de Cocina</span>
              </div>
              <p className="chef-team-bio">{SECTIONS_CONFIG.philosophy.teamBio}</p>
              <span className="chef-team-note">{SECTIONS_CONFIG.philosophy.teamNote}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
