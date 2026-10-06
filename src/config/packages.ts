import { EventTypeOption, PackageMenu } from '../types';

export const EVENT_TYPES: EventTypeOption[] = [
  {
    id: 'cena_privada',
    name: 'Cena Privada',
    shortDescription: 'Servicio exclusivo en residencia, villa o terraza privada con atención personalizada.',
    tagline: 'Veladas íntimas diseñadas a la medida de los comensales.',
    recommendedGuestsMin: 4
  },
  {
    id: 'celebracion',
    name: 'Celebración & Reunión',
    shortDescription: 'Aniversarios, bodas íntimas o encuentros familiares con montajes gastronómicos cuidados.',
    tagline: 'Momentos memorables en torno a una mesa generosa y refinada.',
    recommendedGuestsMin: 8
  },
  {
    id: 'catering_corporativo',
    name: 'Catering Empresarial',
    shortDescription: 'Experiencias de alto nivel para retiros ejecutivos, cócteles de marca y reuniones selectas.',
    tagline: 'Hospitalidad profesional con pulcritud y puntualidad absoluta.',
    recommendedGuestsMin: 12
  },
  {
    id: 'experiencia_degustacion',
    name: 'Mesa de Degustación',
    shortDescription: 'Recorrido sensorial guiado de múltiples tiempos con técnica de autor e ingredientes locales.',
    tagline: 'El diálogo directo entre el comensal y el chef en cada plato.',
    recommendedGuestsMin: 4
  }
];

export const DEMO_PACKAGES: PackageMenu[] = [
  {
    id: 'mar-de-cortes',
    name: 'Mar de Cortés & Huerto Local',
    subtitle: 'Pesca fresca del día, cítricos del oasis y vegetales orgánicos',
    concept: 'Un homenaje contemporáneo a la abundancia marina de La Paz y los valles agrícolas cercanos, equilibrando frescura marina, acidez vibrante y cocción precisa.',
    pricePerPersonCents: 165000, // $1,650.00 MXN
    minGuests: 4,
    maxGuests: 40,
    highlight: 'Ideal para cenas frente al atardecer en terraza o jardín',
    courses: [
      {
        title: 'Entrada Fría',
        description: 'Tiradito de jurel local en leche de tigre de guayaba agria, emulsión de aguacate criollo y brotes de cilantro de Todos Santos.'
      },
      {
        title: 'Entrada Caliente',
        description: 'Taco ceremonial de pulpo tierno a las brasas sobre tortilla de maíz azul nixtamalizado, costra de queso regional y salsa verde martajada.'
      },
      {
        title: 'Plato Fuerte',
        description: 'Pesca sustentable al sartén con mantequilla de algas del Mar de Cortés, puré de coliflor tostada y verduritas tiernas glaseadas.'
      },
      {
        title: 'Postre',
        description: 'Tarta tibia de dátiles de Mulegé con ganache de chocolate amargo mexicano y helado artesanal de vainilla Papantla.'
      }
    ],
    includedServices: [
      'Chef y cocinero en locación durante todo el servicio',
      'Montaje de cocina y servicio de emplatado tiempo a tiempo',
      'Limpieza exhaustiva del área de cocina al término del evento',
      'Vajilla de cerámica artesanal de baja temperatura y servilletas de lino'
    ],
    compatibleExtraIds: ['maridaje-vinos', 'cocteleria-bienvenida', 'mesero-adicional', 'vajilla-premium'],
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    demoLabel: 'Menú de muestra · Sujeto a temporada de pesca'
  },
  {
    id: 'brasas-y-humo',
    name: 'Brasas & Fuego Sudcaliforniano',
    subtitle: 'Cocina rústico-elegante con cortes selectos y vegetales ahumados',
    concept: 'La calidez de la leña y el carbón reinterpretada con elegancia. Proteínas maduradas en cocción lenta, salsas complejas y guarniciones con carácter de campo.',
    pricePerPersonCents: 195000, // $1,950.00 MXN
    minGuests: 6,
    maxGuests: 60,
    highlight: 'Perfecto para veladas al aire libre y celebraciones con espíritu festivo',
    courses: [
      {
        title: 'Bocado de Bienvenida',
        description: 'Hogaza de masa madre campesina a la parrilla con mantequilla de cenizas de romero y sal ahumada de Guerrero Negro.'
      },
      {
        title: 'Primero',
        description: 'Remolachas asadas al rescoldo con requesón artesanal de rancho, reducción de higos y vinagreta de nuez pecana tostada.'
      },
      {
        title: 'Fuerte Principal',
        description: 'Rib eye de pastoreo al fuego vivo con reducción de vino tinto del Valle de Guadalupe, papitas al romero crujiente y cebollitas cambray glaseadas.'
      },
      {
        title: 'Cierre Dulce',
        description: 'Frutas de temporada asadas al carbón sobre crema inglesa de cardamomo y crujiente de miel de abeja melipona.'
      }
    ],
    includedServices: [
      'Equipo completo de asador/cocina móvil y combustible leña/carbón vegetal',
      'Chef parrillero y asistencia de cocina profesional',
      'Servicio de mesa sincronizado y explicación de cada corte',
      'Desmontaje y limpieza completa del espacio utilizado'
    ],
    compatibleExtraIds: ['maridaje-vinos', 'barra-mezcal', 'mesero-adicional', 'hora-extra-servicio'],
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    demoLabel: 'Menú de muestra · Se adapta al equipamiento del espacio'
  },
  {
    id: 'degustacion-autor',
    name: 'Experiencia Degustación de Autor (6 Tiempos)',
    subtitle: 'Nuestra propuesta más refinada y personal',
    concept: 'Una narrativa en seis pases concebida para comensales curiosos y ocasiones irrepetibles. Técnica de vanguardia, estética cromática y sabores con profundidad.',
    pricePerPersonCents: 260000, // $2,600.00 MXN
    minGuests: 4,
    maxGuests: 20,
    highlight: 'La máxima expresión culinaria con narrativa personal del Chef',
    courses: [
      {
        title: 'Pase 1 · Prólogo',
        description: 'Ostra de estero con perlas de mezcal espadín, granizado de pepino silvestre y aceite de hierbas aromáticas.'
      },
      {
        title: 'Pase 2 · Fondo Marino',
        description: 'Almeja chocolata sellada en su concha con mantequilla de ajo confitado y espuma ligera de vino blanco regional.'
      },
      {
        title: 'Pase 3 · Huerta',
        description: 'Betabel tierno en costra de sal marina, consomé clarificado de hongos silvestres y crema de quesos de rancho.'
      },
      {
        title: 'Pase 4 · Pesca',
        description: 'Lomo de robalo en cocción a baja temperatura con emulsión de azafrán, hinojo braseado y crujiente de piel.'
      },
      {
        title: 'Pase 5 · Campo',
        description: 'Short rib braseado durante doce horas con mole ligero de chiles secos de la península y puré sedoso de plátano macho.'
      },
      {
        title: 'Pase 6 · Epílogo',
        description: 'Esfera de chocolate amargo al 70%, centro de frutos del desierto, tierra de cacao y nieve de pitahaya.'
      }
    ],
    includedServices: [
      'Presencia directa del Chef Carlos liderando cada tiempo y mesa',
      'Menú impreso personalizado en papel de algodón con los nombres de los anfitriones',
      'Vajilla de diseño exclusivo y cristalería fina para maridaje',
      'Equipo de servicio y mayordomía dedicado para atención discreta e impecable'
    ],
    compatibleExtraIds: ['maridaje-vinos', 'barra-mezcal', 'cocteleria-bienvenida', 'vajilla-premium'],
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=1200&q=80',
    demoLabel: 'Menú degustación de muestra · Requiere reserva con 5 días mínimos'
  }
];
