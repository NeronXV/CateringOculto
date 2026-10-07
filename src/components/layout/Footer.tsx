import React from 'react';
import { MessageCircle, MapPin, ArrowUpRight } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/business';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer section-dark" id="contacto">
      <div className="container">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <img className="footer-emblem" src="/logo-catering-oculto.png" alt="Catering Oculto · Chef Carlos Zarate" width="120" height="120" loading="lazy" />
            <span className="footer-logo-title">{BUSINESS_CONFIG.brandName}</span>
            <p className="footer-tagline">Chef Carlos Zárate & Karen</p>
            <p className="footer-bio">
              Chef privado y catering en villas, residencias y alojamientos de La Paz y Baja California Sur.
            </p>
            
            <div className="footer-location-badge">
              <MapPin size={16} className="text-bronze" />
              <span>{BUSINESS_CONFIG.location}</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Servicios & Navegación</h4>
            <ul className="footer-links">
              <li><a href="#servicios">Desayuno, Comida & Cena</a></li>
              <li><a href="#como-funciona">Cómo Funciona</a></li>
              <li><a href="#cotizador">Consultar Disponibilidad</a></li>
              <li><a href="#cocina">Nuestra Cocina</a></li>
              <li><a href="#galeria">Galería</a></li>
              <li><a href="#preguntas">Preguntas Frecuentes</a></li>
            </ul>
          </div>

          {/* Contact & WhatsApp Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contacto Directo</h4>
            <p className="footer-col-text">
              Atención personalizada para cotizaciones, disponibilidad y menús a medida:
            </p>
            
            <a
              href={`https://wa.me/${BUSINESS_CONFIG.whatsAppNumberDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-whatsapp-card"
            >
              <div className="whatsapp-icon-wrap">
                <MessageCircle size={22} />
              </div>
              <div className="whatsapp-card-info">
                <span className="whatsapp-card-label">WhatsApp Oficial</span>
                <span className="whatsapp-card-number">{BUSINESS_CONFIG.whatsAppPhoneDisplay}</span>
              </div>
              <ArrowUpRight size={18} className="whatsapp-card-arrow" />
            </a>

            <div className="footer-social-links" style={{ marginTop: '1.2rem' }}>
              <a href={BUSINESS_CONFIG.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                Instagram
              </a>
              <span className="social-divider">·</span>
              <a href={BUSINESS_CONFIG.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                Facebook
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} {BUSINESS_CONFIG.brandName} · {BUSINESS_CONFIG.region}.
          </p>
          <div className="footer-legal-links">
            <span className="legal-notice">Las solicitudes web son confirmadas personalmente por el chef vía WhatsApp.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
