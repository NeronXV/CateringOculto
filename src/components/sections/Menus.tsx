import React, { useState } from 'react';
import { Sparkles, Users, Check, ArrowRight, Utensils, ChevronDown, ChevronUp } from 'lucide-react';
import { DEMO_PACKAGES } from '../../config/packages';
import { EXTRAS_CONFIG } from '../../config/extras';
import { formatMXNCents } from '../../utils/formatters';
import './Menus.css';

interface MenusProps {
  onSelectPackage: (packageId: string) => void;
}

export const Menus: React.FC<MenusProps> = ({ onSelectPackage }) => {
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(DEMO_PACKAGES[0].id);

  const toggleExpand = (id: string) => {
    setExpandedPackageId(prev => prev === id ? null : id);
  };

  return (
    <section className="section section-subtle" id="menus" aria-labelledby="menus-heading">
      <div className="container">
        {/* Header */}
        <div className="section-header-centered">
          <div className="eyebrow">
            <Sparkles size={14} />
            <span>Propuestas Gastronómicas</span>
          </div>
          <h2 id="menus-heading" className="section-title">
            Menús concebidos para celebrarse
          </h2>
          <p className="section-description">
            Explora los platillos y elige tus preferencias antes de solicitar tu presupuesto. Los conceptos pendientes se indican en el desglose; el chef confirma disponibilidad, logística y condiciones antes de contratar.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="menus-grid">
          {DEMO_PACKAGES.map((pkg) => {
            const isExpanded = expandedPackageId === pkg.id;
            const compatibleExtras = EXTRAS_CONFIG.filter(extra => 
              pkg.compatibleExtraIds.includes(extra.id)
            );

            return (
              <article key={pkg.id} className="menu-card">
                {/* Header card with image */}
                <div className="menu-card-header">
                  <div className="menu-card-img-wrap">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="menu-card-img"
                      loading="lazy"
                      width="600"
                      height="380"
                    />
                    <div className="menu-card-img-overlay"></div>
                    <span className="badge-demo menu-demo-badge">{pkg.demoLabel}</span>
                  </div>

                  <div className="menu-header-info">
                    <span className="menu-subtitle-tag">{pkg.subtitle}</span>
                    <h3 className="menu-title">{pkg.name}</h3>
                    <p className="menu-concept">{pkg.concept}</p>
                  </div>
                </div>

                {/* Price and Minimum Guests Banner */}
                <div className="menu-pricing-bar">
                  <div className="pricing-col">
                    <span className="pricing-label">Inversión estimada por comensal</span>
                    <div className="pricing-amount">
                      <span className="currency-val">{pkg.priceApproved===false?'Por confirmar':formatMXNCents(pkg.pricePerPersonCents)}</span>
                      <span className="currency-unit">{pkg.priceApproved===false?'Precio y unidad pendientes':'MXN / persona · antes de IVA'}</span>
                    </div>
                  </div>

                  <div className="guests-col">
                    <Users size={16} className="text-olive" />
                    <span>Mínimo requerido: <strong>{pkg.minGuests} comensales</strong></span>
                  </div>
                </div>

                {/* Included courses preview */}
                <div className="menu-courses-list">
                  <h4 className="courses-heading">
                    <Utensils size={15} />
                    <span>Tiempos del menú ({pkg.courses.length} tiempos)</span>
                  </h4>
                  
                  <div className="courses-grid">
                    {pkg.courses.map((course, idx) => (
                      <div key={idx} className="course-item">
                        <span className="course-index">{course.title}</span>
                        <p className="course-desc">{course.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {(pkg.choiceGroups ?? []).filter(g=>!g.dependsOnGroup).map(group=><div className="menu-courses-list" key={group.id}><h4>{group.name}</h4><ul>{group.options.map(o=><li key={o.id}><strong>{o.name}</strong><p>{o.description}</p></li>)}</ul></div>)}
                {/* Collapsible Details: Included services & Available extras */}
                <div className="menu-details-collapsible">
                  <button
                    type="button"
                    className="details-toggle-btn"
                    onClick={() => toggleExpand(pkg.id)}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Ocultar servicios y extras compatibles' : 'Ver servicios incluidos y extras compatibles'}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="details-expanded-body animate-fade-in">
                      <div className="services-block">
                        <h5 className="details-subheading">Servicios de cocina incluidos:</h5>
                        <ul className="included-list">
                          {pkg.includedServices.map((service, sIdx) => (
                            <li key={sIdx}>
                              <Check size={14} className="check-icon" />
                              <span>{service}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="extras-preview-block">
                        <h5 className="details-subheading">Extras disponibles para este menú:</h5>
                        <div className="extras-preview-tags">
                          {compatibleExtras.map((extra) => (
                            <span key={extra.id} className="extra-preview-tag">
                              + {extra.name} ({formatMXNCents(extra.priceCents)} {extra.pricingType === 'per_person' ? 'por comensal' : extra.unitLabel || 'fijo'})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="menu-card-footer">
                  <button
                    type="button"
                    className="btn btn-primary menu-select-btn"
                    onClick={() => onSelectPackage(pkg.id)}
                  >
                    <span>Elegir este menú en el cotizador</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
