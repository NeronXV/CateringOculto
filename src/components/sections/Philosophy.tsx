import React from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import { SECTIONS_CONFIG } from '../../config/sections';
import './Philosophy.css';

export const Philosophy: React.FC = () => {
  return (
    <section className="section section-dark" id="cocina" aria-labelledby="cocina-heading">
      <div className="container">
        <div className="philosophy-grid" style={{ alignItems: 'center' }}>
          {/* Visual column: single powerful photograph */}
          <div className="philosophy-media-col">
            <div className="philosophy-image-stack" style={{ display: 'block' }}>
              <div className="image-stack-primary" style={{ transform: 'none', margin: '0 auto' }}>
                <img
                  src={SECTIONS_CONFIG.philosophy.photos[0].image}
                  alt="Chef preparando platillo con ingredientes locales"
                  className="stack-img"
                  loading="lazy"
                  width="700"
                  height="850"
                  style={{ borderRadius: '10px', maxHeight: '480px', objectFit: 'cover', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Text column: concise & elegant */}
          <div className="philosophy-text-col">
            <div className="eyebrow">
              <Sparkles size={14} />
              <span>Nuestra Cocina</span>
            </div>

            <h2 id="cocina-heading" className="section-title">
              Hospitalidad, producto local y técnica de autor
            </h2>

            <div className="editorial-divider"></div>

            <p className="philosophy-lead" style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#deded7' }}>
              Catering Oculto nace de la pasión del Chef Carlos Zárate y Karen por compartir la riqueza marina del Mar de Cortés y los frutos de las huertas sudcalifornianas.
            </p>

            <p style={{ color: '#aab2a7', fontSize: '0.95rem', lineHeight: '1.6', margin: '1rem 0 1.5rem' }}>
              Cocinamos al momento en tu villa o residencia, adaptando cada servicio al ritmo de tus días con el cuidado, la limpieza y la calidez de un equipo profesional que ama lo que hace.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#c3ac7c', fontSize: '0.88rem', fontWeight: 600 }}>
              <MapPin size={16} />
              <span>La Paz · Cerritos · Todos Santos · El Triunfo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
