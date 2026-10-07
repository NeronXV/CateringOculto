import { SECTIONS_CONFIG } from '../../config/sections';
import React from 'react';
import { Sparkles } from 'lucide-react';
import './Gallery.css';

export const Gallery: React.FC = () => {
  const galleryItems = SECTIONS_CONFIG.gallery.items;

  return (
    <section className="section" id="galeria" aria-labelledby="galeria-heading">
      <div className="container">
        <div className="section-header-centered">
          <div className="eyebrow">
            <Sparkles size={14} />
            <span>Galería</span>
          </div>
          <h2 id="galeria-heading" className="section-title">
            Platos, preparaciones y momentos
          </h2>
          <p className="section-description">
            Un vistazo a nuestros montajes de mesa, técnica en cocina y presentación de platillos en residencia.
          </p>
        </div>

        <div className="gallery-composition-grid">
          {galleryItems.map((item) => (
            <figure key={item.id} className={`gallery-item item-${item.aspect}`}>
              <div className="gallery-image-wrapper">
                <img
                  src={item.image}
                  alt={item.title}
                  className="gallery-photo"
                  loading="lazy"
                  width="800"
                  height="600"
                />
                <div className="gallery-item-overlay">
                  <span className="gallery-item-cat">{item.caption}</span>
                  <figcaption className="gallery-item-title">{item.title}</figcaption>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
