import React from 'react';
import { Coffee, Utensils, Moon, Check, ArrowRight, Sparkles } from 'lucide-react';
import './MainServices.css';

interface MainServicesProps {
  onSelectService: () => void;
}

export const MainServices: React.FC<MainServicesProps> = ({ onSelectService }) => {
  return (
    <section className="section section-services" id="servicios" aria-labelledby="servicios-heading">
      <div className="container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="eyebrow">
            <Sparkles size={14} />
            <span>Nuestra Propuesta</span>
          </div>
          <h2 id="servicios-heading" className="section-title">
            Chef privado para cada momento de tu día
          </h2>
          <p className="section-description">
            Servicio exclusivo cocinado al momento en tu villa, casa o residencia en La Paz. Tú eliges qué servicios necesitas cada día y nosotros nos encargamos de todo.
          </p>
        </div>

        {/* 3 Main Services Cards */}
        <div className="services-grid">
          {/* 1. DESAYUNO */}
          <article className="service-card">
            <div className="service-card-media">
              <img
                src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80"
                alt="Mesa de desayuno servida con fruta fresca y panadería"
                className="service-card-img"
                loading="lazy"
                width="600"
                height="400"
              />
              <div className="service-card-badge">
                <Coffee size={14} />
                <span>Desayuno Completo</span>
              </div>
            </div>

            <div className="service-card-body">
              <span className="service-category">01 · MAÑANAS</span>
              <h3 className="service-title">Desayuno</h3>
              <p className="service-lead">
                Comienza el día con una mesa completa al centro y platillos calientes preparados al momento.
              </p>

              <div className="service-includes-block">
                <h4 className="service-includes-heading">Incluido al centro de la mesa:</h4>
                <ul className="service-includes-list">
                  <li><Check size={14} className="check-icon" /><span>Fruta fresca de temporada</span></li>
                  <li><Check size={14} className="check-icon" /><span>Yogurt griego con granola artesanal</span></li>
                  <li><Check size={14} className="check-icon" /><span>Miel pura de abeja y mantequilla</span></li>
                  <li><Check size={14} className="check-icon" /><span>Hot cakes esponjosos recién hechos</span></li>
                  <li><Check size={14} className="check-icon" /><span>Café de especialidad y jugo natural</span></li>
                </ul>

                <h4 className="service-includes-heading" style={{ marginTop: '0.9rem' }}>Plato fuerte a elegir:</h4>
                <p className="service-subtext">
                  Opciones calientes según menú acordado (chilaquiles con salsa de la casa, huevos al gusto, tostadas de aguacate o especialidad del chef).
                </p>
              </div>

              <div className="service-card-footer">
                <div className="service-price-hint">
                  <span className="price-label">Servicio en villa</span>
                  <span className="price-sub">Tarifa según comensales</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary service-cta-btn"
                  onClick={onSelectService}
                >
                  <span>Consultar disponibilidad</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </article>

          {/* 2. COMIDA */}
          <article className="service-card">
            <div className="service-card-media">
              <img
                src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
                alt="Platillo de mar con pesca fresca y brotes locales"
                className="service-card-img"
                loading="lazy"
                width="600"
                height="400"
              />
              <div className="service-card-badge">
                <Utensils size={14} />
                <span>Mar & Huerto</span>
              </div>
            </div>

            <div className="service-card-body">
              <span className="service-category">02 · MEDIODÍA</span>
              <h3 className="service-title">Comida</h3>
              <p className="service-lead">
                Frescura relajada y de alto nivel. Pesca del día, producto local y recetas diseñadas para compartir en terraza o alberca.
              </p>

              <div className="service-includes-block">
                <h4 className="service-includes-heading">Qué incluye:</h4>
                <ul className="service-includes-list">
                  <li><Check size={14} className="check-icon" /><span>Entradas frescas, tiraditos o botanas de mar</span></li>
                  <li><Check size={14} className="check-icon" /><span>Plato fuerte con pesca del día o cortes selectos</span></li>
                  <li><Check size={14} className="check-icon" /><span>Guarniciones de temporada y ensaladas orgánicas</span></li>
                  <li><Check size={14} className="check-icon" /><span>Postre artesanal de la casa</span></li>
                  <li><Check size={14} className="check-icon" /><span>Montaje, servicio en mesa y limpieza de cocina</span></li>
                </ul>

                <p className="service-subtext" style={{ marginTop: '0.9rem' }}>
                  El menú se define contigo según el producto más fresco disponible en el mercado local y las preferencias de tus invitados.
                </p>
              </div>

              <div className="service-card-footer">
                <div className="service-price-hint">
                  <span className="price-label">Servicio en villa</span>
                  <span className="price-sub">Tarifa según comensales</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary service-cta-btn"
                  onClick={onSelectService}
                >
                  <span>Consultar disponibilidad</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </article>

          {/* 3. CENA */}
          <article className="service-card">
            <div className="service-card-media">
              <img
                src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"
                alt="Cocina a las brasas y velada gastronómica"
                className="service-card-img"
                loading="lazy"
                width="600"
                height="400"
              />
              <div className="service-card-badge">
                <Moon size={14} />
                <span>Velada Privada</span>
              </div>
            </div>

            <div className="service-card-body">
              <span className="service-category">03 · NOCHES</span>
              <h3 className="service-title">Cena</h3>
              <p className="service-lead">
                Nuestra propuesta más especial. Cenas privadas y veladas gastronómicas diseñadas a medida de la ocasión.
              </p>

              <div className="service-includes-block">
                <h4 className="service-includes-heading">Qué incluye:</h4>
                <ul className="service-includes-list">
                  <li><Check size={14} className="check-icon" /><span>Propuesta de autor personalizada (mar, brasas o huerto)</span></li>
                  <li><Check size={14} className="check-icon" /><span>Servicio tiempo a tiempo con explicación de cada plato</span></li>
                  <li><Check size={14} className="check-icon" /><span>Atención cuidada de mesa, vajilla y cristalería</span></li>
                  <li><Check size={14} className="check-icon" /><span>Opciones de maridaje o coctelería a solicitud</span></li>
                  <li><Check size={14} className="check-icon" /><span>Chef y equipo dedicados exclusivamente a tu evento</span></li>
                </ul>

                <p className="service-subtext" style={{ marginTop: '0.9rem' }}>
                  Desde veladas íntimas en pareja hasta reuniones familiares o celebraciones frente al atardecer.
                </p>
              </div>

              <div className="service-card-footer">
                <div className="service-price-hint">
                  <span className="price-label">Servicio en villa</span>
                  <span className="price-sub">Tarifa según menú acordado</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary service-cta-btn"
                  onClick={onSelectService}
                >
                  <span>Consultar disponibilidad</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
