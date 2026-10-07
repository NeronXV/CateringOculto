import React from 'react';
import { useQuoteDraft } from './hooks/useQuoteDraft';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { MainServices } from './components/sections/MainServices';
// Componentes conservados intactos para reactivación futura sin pérdida de código
import { Experiences as _Experiences } from './components/sections/Experiences';
import { Menus as _Menus } from './components/sections/Menus';
import { Philosophy } from './components/sections/Philosophy';
import { Gallery } from './components/sections/Gallery';
import { HowItWorks } from './components/sections/HowItWorks';
import { FaqSection } from './components/sections/FaqSection';
import { CotizadorContainer } from './components/cotizador/CotizadorContainer';
import { SimpleQuote } from './components/cotizador/SimpleQuote';
import './styles/globals.css';
import './styles/dark-theme.css';

export const App: React.FC = () => {
  const draft = useQuoteDraft();

  const scrollToCotizador = () => {
    const el = document.getElementById('cotizador');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isLegacy = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('legacy') === '1';

  return (
    <div className="app-layout">
      {/* 1. Navegación principal */}
      <Header onOpenCotizador={scrollToCotizador} />

      <main id="main-content">
        {/* 2. Portada (Hero directo: Chef privado & catering en La Paz) */}
        <Hero onOpenCotizador={scrollToCotizador} />

        {/* 3. Solicitar Disponibilidad (SimpleQuote por defecto, legacy con ?legacy=1) */}
        {isLegacy ? (
          <CotizadorContainer
            state={draft.quote}
            onChange={draft.changeField}
            onReset={draft.reset}
            notice={draft.notice}
            storageStatus={draft.storageStatus}
          />
        ) : (
          <SimpleQuote />
        )}

        {/* 4. Servicios Principales: Desayuno, Comida y Cena */}
        <MainServices onSelectService={scrollToCotizador} />

        {/* 5. Cómo Funciona: 4 pasos conversacionales */}
        <HowItWorks onOpenCotizador={scrollToCotizador} />

        {/* 6. Nuestra Cocina (Chef Carlos Zárate & Karen) */}
        <Philosophy />

        {/* 7. Galería Visual */}
        <Gallery />

        {/* 8. Dudas Habituales (4 preguntas esenciales) */}
        <FaqSection />
      </main>

      {/* 9. Contacto y Footer */}
      <Footer />
    </div>
  );
};

export default App;
