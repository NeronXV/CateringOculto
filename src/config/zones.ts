import { ZoneOption } from '../types';

export const ZONES_CONFIG: ZoneOption[] = [
  {
    id: 'malecon-centro',
    name: 'La Paz · Malecón, Centro & Esterito',
    description: 'Radio urbano céntrico de La Paz. Traslado y logística básica contemplados.',
    travelFeeCents: 0,
    requiresConfirmation: false,
    notes: 'Cobertura habitual sin cargo logístico extra.'
  },
  {
    id: 'manglito-centenario',
    name: 'La Paz · El Manglito, Fidepaz & Centenario',
    description: 'Área metropolitana y zona residencial sur de La Paz.',
    travelFeeCents: 35000, // $350.00 MXN
    requiresConfirmation: false,
    notes: 'Tarifa fija por desplazamiento del equipo y menaje.'
  },
  {
    id: 'pichilingue-balandra',
    name: 'Corredor Pichilingue · Puerta Cortés & Balandra',
    description: 'Zona costera norte, marinas y residencias frente a la bahía.',
    travelFeeCents: 75000, // $750.00 MXN
    requiresConfirmation: false,
    notes: 'Incluye traslado técnico de equipamiento a marina o villa.'
  },
  {
    id: 'todos-santos-pescadero',
    name: 'Todos Santos & El Pescadero',
    description: 'Costa del Pacífico. Requiere logística vial foránea y evaluación de cocina en locación.',
    travelFeeCents: 0,
    requiresConfirmation: true,
    notes: 'Traslado por confirmar. No está incluido en el importe preliminar.'
  },
  {
    id: 'otra-zona-bcs',
    name: 'Otra zona en Baja California Sur (Los Barriles, etc.)',
    description: 'Villas o ranchos alejados. Sujeto a disponibilidad y viáticos según distancia.',
    travelFeeCents: 0,
    requiresConfirmation: true,
    notes: 'Traslado por confirmar. El costo logístico se evalúa de forma personalizada.'
  }
];
