import { Coffee, Utensils, Moon, Check, ArrowRight, Sparkles } from 'lucide-react';
import { SECTIONS_CONFIG } from '../../config/sections';
import './MainServices.css';

export function MainServices({ onSelectService }: { onSelectService: () => void }) {
  const content = SECTIONS_CONFIG.services;
  const icons = [Coffee, Utensils, Moon];
  return <section className="section section-services" id="servicios" aria-labelledby="servicios-heading">
    <div className="container">
      <div className="section-header-centered">
        <div className="eyebrow"><Sparkles size={14}/><span>Nuestros servicios</span></div>
        <h2 id="servicios-heading" className="section-title">{content.title}</h2>
        <p className="section-description">{content.description}</p>
      </div>
      <div className="services-grid">
        {content.items.map((service, index) => {
          const Icon = icons[index];
          return <article key={service.id} className="service-card">
            <div className="service-card-media">
              <img src={service.image} alt={service.title} className="service-card-img" loading="lazy" width="600" height="400"/>
              <div className="service-card-badge"><Icon size={14}/><span>{service.subtitle}</span></div>
            </div>
            <div className="service-card-body">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-lead">{service.description}</p>
              <div className="service-includes-block">
                <h4 className="service-includes-heading">{service.id==='desayuno'?'Al centro de la mesa:':'Sobre el servicio:'}</h4>
                <ul className="service-includes-list">{service.includes.map((item,i)=><li key={i}><Check size={14} className="check-icon"/><span>{item}</span></li>)}</ul>
                <p className="service-subtext" style={{marginTop:'0.9rem'}}>{service.note}</p>
              </div>
              <div className="service-card-footer">
                <button type="button" className="btn btn-primary service-cta-btn" onClick={onSelectService}>Consultar disponibilidad <ArrowRight size={15}/></button>
              </div>
            </div>
          </article>;
        })}
      </div>
    </div>
  </section>;
}
