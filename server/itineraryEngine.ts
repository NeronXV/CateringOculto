import { createHash } from 'node:crypto';
import type { Catalog } from '../src/admin/catalog';
import {
  ITINERARY_MAX_DAYS,
  ITINERARY_MAX_GUESTS,
  MEAL_SERVICES,
  type ItineraryDay,
  type ItineraryEstimate,
  type ItinerarySelection,
  type MealService,
  type ServiceReference
} from '../src/types/itinerary';
import { digest, exactKeys, object, QuoteError, textField } from './quoteEngine';

function todayInBusinessTz(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mazatlan',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-');
}

function isValidIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = Date.parse(date + 'T12:00:00Z');
  if (!Number.isFinite(parsed)) return false;
  const backToIso = new Date(parsed).toISOString().slice(0, 10);
  return backToIso === date;
}

export function estimateItinerary(catalog: Catalog, input: unknown, now = new Date()): ItineraryEstimate {
  const data = object(input);
  exactKeys(data, ['guestsCount', 'days']);

  const guests = data.guestsCount;
  if (typeof guests !== 'number' || !Number.isSafeInteger(guests) || guests < 1 || guests > ITINERARY_MAX_GUESTS) {
    throw new QuoteError(`El número de personas debe ser un número entero entre 1 y ${ITINERARY_MAX_GUESTS}.`);
  }

  if (!Array.isArray(data.days) || data.days.length === 0 || data.days.length > ITINERARY_MAX_DAYS) {
    throw new QuoteError(`Debes seleccionar entre 1 y ${ITINERARY_MAX_DAYS} fechas para tu solicitud.`);
  }

  const todayStr = todayInBusinessTz(now);
  const seenDates = new Set<string>();
  const validatedDays: ItineraryDay[] = [];

  for (const rawDay of data.days) {
    const dayObj = object(rawDay);
    exactKeys(dayObj, ['date', 'services']);

    const date = dayObj.date;
    if (typeof date !== 'string' || !isValidIsoDate(date) || date <= todayStr) {
      throw new QuoteError('Todas las fechas deben ser válidas y a partir de mañana.');
    }

    if (seenDates.has(date)) {
      throw new QuoteError(`La fecha ${date} aparece duplicada en el itinerario.`);
    }
    seenDates.add(date);

    if (!Array.isArray(dayObj.services) || dayObj.services.length === 0) {
      throw new QuoteError(`Debes elegir al menos un servicio (desayuno, comida o cena) para el día ${date}.`);
    }

    const dayServices: MealService[] = [];
    const seenServices = new Set<string>();

    for (const s of dayObj.services) {
      if (typeof s !== 'string' || !MEAL_SERVICES.includes(s as MealService)) {
        throw new QuoteError('Servicio no reconocido. Las opciones válidas son desayuno, comida y cena.');
      }
      const meal = s as MealService;
      if (!seenServices.has(meal)) {
        seenServices.add(meal);
        dayServices.push(meal);
      }
    }

    // Preserve clean ordering: desayuno -> comida -> cena
    dayServices.sort((a, b) => MEAL_SERVICES.indexOf(a) - MEAL_SERVICES.indexOf(b));
    validatedDays.push({ date, services: dayServices });
  }

  // Sort days chronologically
  validatedDays.sort((a, b) => a.date.localeCompare(b.date));

  // Determine pricing references based on published catalog
  const packages = catalog.packages || [];
  const references: ServiceReference[] = [];

  for (const meal of MEAL_SERVICES) {
    let matchedPackages = packages.filter(p => {
      if (meal === 'desayuno') return p.id === 'desayunos' || p.id.startsWith('desayun');
      if (meal === 'comida') return p.id === 'lunch' || p.id.includes('comida');
      if (meal === 'cena') return p.id.startsWith('cena');
      return false;
    });

    if (matchedPackages.length === 0) {
      // Fallback if catalog has different IDs
      matchedPackages = packages.filter(p => p.name.toLowerCase().includes(meal));
    }

    const anyPending = matchedPackages.some(p => p.priceApproved === false || p.pricePerPersonCents <= 0);
    const allApproved = matchedPackages.length > 0 && !anyPending && catalog.service.pricesApproved;

    let fromPerPersonCents: number | null = null;
    if (allApproved) {
      fromPerPersonCents = Math.min(...matchedPackages.map(p => p.pricePerPersonCents));
    }

    references.push({
      service: meal,
      status: allApproved && fromPerPersonCents !== null ? 'approved' : 'pending',
      fromPerPersonCents,
      menus: matchedPackages.map(p => ({
        id: p.id,
        name: p.name,
        priceApproved: p.priceApproved !== false
      }))
    });
  }

  const startDate = validatedDays[0].date;
  const endDate = validatedDays[validatedDays.length - 1].date;
  const serviceCount = validatedDays.reduce((acc, d) => acc + d.services.length, 0);

  const pending: string[] = [
    'Disponibilidad tentativa sujeta a confirmación directa con el equipo.',
    'La ubicación y logística de traslado se acordarán directamente según la locación del evento.'
  ];

  if (!catalog.service.pricesApproved || references.some(r => r.status === 'pending')) {
    pending.push('Precios de cena y ajustes de propuesta por confirmar con el chef.');
  }

  if (!catalog.service.taxApproved) {
    pending.push('IVA y conceptos fiscales pendientes de confirmación.');
  }

  const selection: ItinerarySelection = {
    guestsCount: guests,
    days: validatedDays
  };

  const snapshot = {
    kind: 'itinerary' as const,
    engineVersion: 'itinerary-v1' as const,
    catalogVersion: digest(catalog),
    selection,
    summary: {
      startDate,
      endDate,
      dayCount: validatedDays.length,
      serviceCount
    },
    references,
    zoneStatus: 'pending' as const,
    taxPending: !catalog.service.taxApproved,
    pending,
    serviceSnapshot: structuredClone(catalog.service)
  };

  return {
    ...snapshot,
    version: digest(snapshot)
  };
}
