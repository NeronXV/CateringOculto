import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/business';
import './Header.css';

interface HeaderProps {
  onOpenCotizador: (preselectedPackageId?: string, preselectedEventType?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCotizador }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Experiencias', href: '#experiencias' },
    { label: 'Menús', href: '#menus' },
    { label: 'Nuestra Cocina', href: '#cocina' },
    { label: 'Galería', href: '#galeria' },
    { label: 'Cómo Funciona', href: '#como-funciona' },
    { label: 'Preguntas', href: '#preguntas' },
  ];

  return (
    <>
      <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          {/* Brand identity */}
          <a href="#" className="brand-logo" aria-label="Catering Oculto - Inicio">
            <img className="brand-emblem" src="/logo-catering-oculto.png" alt="Catering Oculto · Chef Carlos Zarate" width="64" height="64" />
            <span className="brand-copy">
            <span className="brand-name">{BUSINESS_CONFIG.brandName}</span>
            <span className="brand-subtitle">Chef Carlos Zárate · La Paz</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Navegación principal">
            <ul className="nav-list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="nav-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Header Action Button */}
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-primary header-cta-btn"
              onClick={() => onOpenCotizador()}
            >
              <span>Diseña tu evento</span>
              <ArrowRight size={15} />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <div 
        className={`mobile-drawer-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        inert={!mobileMenuOpen}
        aria-hidden={!mobileMenuOpen}
      >
        <div 
          className="mobile-drawer-content" 
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Menú móvil"
        >
          <div className="mobile-drawer-header">
            <div className="brand-logo">
              <img className="brand-emblem" src="/logo-catering-oculto.png" alt="Catering Oculto · Chef Carlos Zarate" width="64" height="64" />
              <span className="brand-copy">
              <span className="brand-name">{BUSINESS_CONFIG.brandName}</span>
              <span className="brand-subtitle">La Paz, BCS</span>
              </span>
            </div>
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="mobile-nav" aria-label="Navegación móvil">
            <ul className="mobile-nav-list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mobile-drawer-footer">
            <button
              type="button"
              className="btn btn-primary mobile-cta-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCotizador();
              }}
            >
              <span>Diseña tu evento</span>
              <ArrowRight size={16} />
            </button>

            <div className="mobile-contact-snippet">
              <p>Atención directa por WhatsApp:</p>
              <a 
                href={`https://wa.me/${BUSINESS_CONFIG.whatsAppNumberDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-phone-link"
              >
                {BUSINESS_CONFIG.whatsAppPhoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
