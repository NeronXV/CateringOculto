import React from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import './Hero.css';
import { EDITORIAL_CONFIG } from '../../config/editorial';
import { BUSINESS_CONFIG } from '../../config/business';

interface HeroProps { onOpenCotizador: () => void; }

export const Hero: React.FC<HeroProps> = ({ onOpenCotizador }) => (
  <section className="hero-section" aria-label="Introducción">
    {EDITORIAL_CONFIG.useVideo ? <video
      className="hero-background"
      autoPlay
      loop
      muted
      playsInline
      poster={EDITORIAL_CONFIG.image}
    >
      <source src="/videos/hero-video.mp4" type="video/mp4" />
    </video> : <img className="hero-background" src={EDITORIAL_CONFIG.image} alt="" />}
    <div className="hero-shade" />
    <div className="container hero-container">
      <div className="hero-content">
        <div className="hero-kicker"><span />LA PAZ, BAJA CALIFORNIA SUR<span /></div>
        <img className="hero-emblem" src="/logo-catering-oculto.png" alt="Catering Oculto · Chef Carlos Zárate" width="120" height="120" />
        <p className="hero-signature">{BUSINESS_CONFIG.brandName}</p>
        <h1 className="hero-title">El arte de compartir<br /><em>lo extraordinario.</em></h1>
        <p className="hero-lead">Desayunos, comidas y cenas preparados al momento en tu residencia o alojamiento.</p>
        <div className="hero-cta-group">
          <button type="button" className="btn btn-primary hero-btn-main" onClick={onOpenCotizador}>Consultar disponibilidad <ArrowRight size={16} /></button>
          <a href="#servicios" className="btn btn-secondary hero-btn-sec">Ver servicios</a>
        </div>
      </div>
    </div>
    <div className="hero-bottom">
      <span>CHEF CARLOS ZÁRATE <i /> KAREN ASCENCIO</span>
      <a href="#servicios" aria-label="Descubrir servicios"><ArrowDown size={18} /></a>
      <span>DESAYUNO · COMIDA · CENA</span>
    </div>
  </section>
);
