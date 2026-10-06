import React from 'react';
import { MessageCircle, MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react';
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
            <img className="footer-emblem" src="/logo-catering-oculto.png" alt="Catering Oculto · Chef Carlos Zarate" width="144" height="144" loading="lazy" />
            <span className="footer-logo-title">{BUSINESS_CONFIG.brandName}</span>
            <p className="footer-tagline">{BUSINESS_CONFIG.tagline}</p>
            <p className="footer-bio">
              Cocina sobre pedido, cenas privadas y catering de autor inspirados en la riqueza marina y terrestre de Baja California Sur.
            </p>
            
            <div className="footer-location-badge">
              <MapPin size={16} className="text-bronze" />
              <span>{BUSINESS_CONFIG.location}</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Explorar</h4>
            <ul className="footer-links">
              <li><a href="#experiencias">Experiencias Culinarias</a></li>
              <li><a href="#menus">Menús & Paquetes</a></li>
              <li><a href="#cocina">Nuestra Filosofía</a></li>
              <li><a href="#como-funciona">Cómo Funciona</a></li>
              <li><a href="#preguntas">Preguntas Frecuentes</a></li>
              <li><a href="#cotizador">Cotizador en Línea</a></li>
            </ul>
          </div>

          {/* Contact & WhatsApp Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contacto Directo</h4>
            <p className="footer-col-text">
              Atención personalizada para cotizaciones, disponibilidad de agenda y consultas de menú:
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

            <div className="footer-social-links">
              <a href={BUSINESS_CONFIG.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                Instagram
              </a>
              <span className="social-divider">·</span>
              <a href={BUSINESS_CONFIG.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                Facebook
              </a>
            </div>
          </div>

          {/* Business Conditions & Disclosures Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Transparencia</h4>
            <div className="footer-disclaimer-box">
              <div className="disclaimer-header">
                <ShieldCheck size={16} className="text-bronze" />
                <span>Aviso de Cotización</span>
              </div>
              <p className="disclaimer-body">
                {BUSINESS_CONFIG.quoteDisclaimer}
              </p>
              <div className="editorial-divider" style={{ margin: '0.8rem 0' }}></div>
              <p className="disclaimer-notes">
                {BUSINESS_CONFIG.demoNotice}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} {BUSINESS_CONFIG.brandName} · {BUSINESS_CONFIG.region}.
          </p>
          <div className="footer-legal-links">
            <span className="legal-notice">Aviso de Privacidad (documento en preparación antes de producción)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
