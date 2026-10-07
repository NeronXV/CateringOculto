import type { ServiceSettings } from '../config/service';
import type { QuoteContact } from './quote';

// Public meal moments. Internal menus (desayunos, lunch, cena-*) stay in the catalog.
export const MEAL_SERVICES = ['desayuno', 'comida', 'cena'] as const;
export type MealService = typeof MEAL_SERVICES[number];
export const MEAL_LABELS: Record<MealService, string> = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena' };

export const ITINERARY_MAX_DAYS = 31;
export const ITINERARY_MAX_GUESTS = 150;

export interface ItineraryDay { date: string; services: MealService[]; }
export interface ItinerarySelection { guestsCount: number; days: ItineraryDay[]; }

// Reference price per meal moment. Never a total; null means "por confirmar".
export interface ServiceReference {
  service: MealService;
  status: 'approved' | 'pending';
  fromPerPersonCents: number | null;
  menus: Array<{ id: string; name: string; priceApproved: boolean }>;
}

export interface ItineraryEstimate {
  kind: 'itinerary';
  engineVersion: 'itinerary-v1';
  catalogVersion: string;
  selection: ItinerarySelection;
  summary: { startDate: string; endDate: string; dayCount: number; serviceCount: number };
  references: ServiceReference[];
  zoneStatus: 'pending';
  taxPending: boolean;
  pending: string[];
  serviceSnapshot: ServiceSettings;
  version: string;
}

export type ItineraryContact = QuoteContact;
export interface ItineraryReceipt { folio: string; createdAt: string; estimate: ItineraryEstimate; contact?: ItineraryContact; }

export function isItineraryEstimate(value: unknown): value is ItineraryEstimate {
  return !!value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'itinerary';
}
