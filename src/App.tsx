import React from 'react';
import { useQuoteDraft } from './hooks/useQuoteDraft';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { Experiences } from './components/sections/Experiences';
import { Menus } from './components/sections/Menus';
import { Philosophy } from './components/sections/Philosophy';
import { Gallery } from './components/sections/Gallery';
import { HowItWorks } from './components/sections/HowItWorks';
import { FaqSection } from './components/sections/FaqSection';
import { CotizadorContainer } from './components/cotizador/CotizadorContainer';
import { EventType } from './types';
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

  const handleSelectPackageFromMenu = (pkgId: string) => {
    draft.changeField('packageId', pkgId);
    scrollToCotizador();
  };

  const handleSelectExperience = (eventType: EventType) => {
    draft.changeField('eventType', eventType);
    scrollToCotizador();
  };

  return (
    <div className="app-layout">
      {/* 1. Header Navigation */}
      <Header onOpenCotizador={scrollToCotizador} />

      <main id="main-content">
        {/* 2. Portada (Hero) */}
        <Hero onOpenCotizador={scrollToCotizador} />

        {/* 3. Experiencias Culinarias */}
        <Experiences onSelectExperience={handleSelectExperience} />

        {/* 4. Menús y Paquetes Gastronómicos */}
        <Menus onSelectPackage={handleSelectPackageFromMenu} />

        {/* 5. Nuestra Cocina (Dark contrast section) */}
        <Philosophy />

        {/* 6. Galería Visual */}
        <Gallery />

        {/* 7. Cómo Funciona */}
        <HowItWorks onOpenCotizador={scrollToCotizador} />

        {/* 8. Cotizador Funcional Interactivo */}
        <CotizadorContainer
          state={draft.quote}
          onChange={draft.changeField}
          onReset={draft.reset}
          notice={draft.notice}
          storageStatus={draft.storageStatus}
        />

        {/* 9. Preguntas Frecuentes y Políticas */}
        <FaqSection />
      </main>

      {/* 10. Footer con contacto y avisos */}
      <Footer />
    </div>
  );
};

export default App;
