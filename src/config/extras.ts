import { ExtraOption } from '../types';

export const EXTRAS_CONFIG: ExtraOption[] = [
  // 1. EXTRAS POR PERSONA (multiplicados por número de invitados)
  {
    id: 'maridaje-vinos',
    name: 'Maridaje de Vinos de Baja California',
    description: 'Selección curada de etiquetas del Valle de Guadalupe y Santo Tomás, armonizada copa a copa con cada plato.',
    pricingType: 'per_person',
    priceCents: 85000, // $850.00 MXN por persona
    category: 'maridaje',
    demoLabel: 'Estimado por comensal'
  },
  {
    id: 'cocteleria-bienvenida',
    name: 'Cóctel de Bienvenida de Autor',
    description: 'Servicio de bienvenida con mixología artesanal, infusiones botánicas y espumoso mexicano a la llegada de los invitados.',
    pricingType: 'per_person',
    priceCents: 35000, // $350.00 MXN por persona
    category: 'cocteleria',
    demoLabel: 'Estimado por comensal'
  },

  // 2. EXTRAS POR UNIDAD (multiplicados por la cantidad elegida)
  {
    id: 'mesero-adicional',
    name: 'Mesero / Steward Adicional',
    description: 'Personal de sala adicional para eventos donde se busca atención ultra personalizada o servicio de bebidas continuo.',
    pricingType: 'per_unit',
    priceCents: 120000, // $1,200.00 MXN por mesero/servicio
    unitLabel: 'mesero (servicio de 4 hrs)',
    defaultQuantity: 1,
    maxQuantity: 5,
    category: 'servicio',
    demoLabel: 'Tarifa unitaria por turno'
  },
  {
    id: 'hora-extra-servicio',
    name: 'Hora Adicional de Servicio',
    description: 'Extensión del equipo en locación más allá de las horas estipuladas para la sobremesa y atención.',
    pricingType: 'per_unit',
    priceCents: 95000, // $950.00 MXN por hora
    unitLabel: 'hora extra',
    defaultQuantity: 1,
    maxQuantity: 4,
    category: 'servicio',
    demoLabel: 'Tarifa por hora'
  },

  // 3. EXTRAS FIJOS (monto único por evento)
  {
    id: 'vajilla-premium',
    name: 'Montaje de Cerámica de Autor & Lencería Fina',
    description: 'Colección especial de vajilla artesanal de gres torneada a mano, mantelería de lino puro y cristalería de cristal soplado.',
    pricingType: 'fixed',
    priceCents: 280000, // $2,800.00 MXN monto único
    category: 'ambientacion',
    demoLabel: 'Monto fijo por evento'
  },
  {
    id: 'barra-mezcal',
    name: 'Estación de Mezcales Artesanales & Agaves',
    description: 'Mesa de degustación con tres etiquetas de pequeños productores, sales de gusano y cítricos para sobremesa.',
    pricingType: 'fixed',
    priceCents: 450000, // $4,500.00 MXN monto único
    category: 'cocteleria',
    demoLabel: 'Monto fijo por montaje'
  }
];
