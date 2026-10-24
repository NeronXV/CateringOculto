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
import { menusForService, selectionIssue } from '../src/utils/itineraryMenus';
import type { ItineraryPricing, ServiceMenuSelection } from '../src/types/itinerary';
import { servicePricing } from '../src/utils/servicePricing';
import { activeDishGroups } from '../src/utils/dishes';
import type { CalculationBreakdown } from '../src/types';

function priceItinerary(catalog: Catalog, days: ItineraryDay[], guests: number): ItineraryPricing {
  const settings = { ...catalog.service, travelMode: 'zones' as const };
  const base = (menuSubtotalCents: number): CalculationBreakdown => ({
    menuSubtotalCents, extrasSubtotalCents: 0, travelFeeCents: 0,
    travelRequiresConfirmation: true, totalEstimatedCents: menuSubtotalCents,
    extrasItemized: [], minGuestsWarning: false, selectedPackage: undefined, selectedZone: undefined
  });
  const lines = days.flatMap(day => day.services.map(service => {
    const selection = day.selections![service]!;
    const menu = catalog.packages.find(p => p.id === selection.menuId)!;
    if (!Number.isSafeInteger(menu.pricePerPersonCents) || menu.pricePerPersonCents < 0) throw new QuoteError('El catálogo contiene importes inválidos.');
    const approved = catalog.service.pricesApproved && menu.priceApproved !== false && menu.pricePerPersonCents > 0;
    const menuBase = approved ? guests * menu.pricePerPersonCents : 0;
    if (!Number.isSafeInteger(menuBase) || menuBase < 0) throw new QuoteError('Importe fuera de rango.');
    // Reuse the price engine. Tax is rounded once on the aggregate below;
    // travel remains unknown until a multi-day rule/location is agreed.
    const calculated = servicePricing({ ...base(menuBase), selectedPackage: { ...menu, priceApproved: approved } }, guests, { ...settings, taxApproved: false });
    return {
      date: day.date, service, menuId: menu.id, menuName: menu.name, requestedTime: selection.requestedTime,
      dishes: activeDishGroups(menu, selection.selectedDishes).flatMap(group => {
        const option = group.options.find(o => o.id === selection.selectedDishes[group.id]);
        return option ? [{ group: group.name, name: option.name, description: option.description }] : [];
      }),
      perPersonCents: approved ? menu.pricePerPersonCents : null,
      subtotalCents: approved ? calculated.menuSubtotalCents : null
    };
  }));
  const known = lines.filter(line => line.subtotalCents !== null);
  const subtotal = known.reduce((sum, line) => sum + line.subtotalCents!, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal < 0) throw new QuoteError('Importe fuera de rango.');
  const calculated = servicePricing(base(subtotal), guests, settings);
  if (!Number.isSafeInteger(calculated.totalEstimatedCents) || calculated.totalEstimatedCents < 0) throw new QuoteError('Importe fuera de rango.');
  return {
    lines, menuSubtotalCents: known.length ? subtotal : null,
    taxCents: known.length && settings.taxApproved ? calculated.taxCents! : null,
    knownAmountCents: known.length ? calculated.totalEstimatedCents : null,
    totalCents: null, travelStatus: 'pending', extrasStatus: 'not_selected'
  };
}

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
  exactKeys(data, ['guestsCount', 'days', ...('location' in data ? ['location'] : [])]);
  const location = 'location' in data ? textField(data.location, 500) : undefined;

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
    exactKeys(dayObj, ['date', 'services', ...('selections' in dayObj ? ['selections'] : [])]);

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
    let selections: ItineraryDay['selections'];
    if ('selections' in dayObj) {
      const rawSelections = object(dayObj.selections);
      exactKeys(rawSelections, [...dayServices]);
      selections = {};
      for (const service of dayServices) {
        const raw = object(rawSelections[service]);
        exactKeys(raw, ['menuId', 'requestedTime', 'selectedDishes']);
        if (typeof raw.menuId !== 'string' || typeof raw.requestedTime !== 'string') throw new QuoteError('Revisa el menú y horario del servicio.');
        const dishes = object(raw.selectedDishes);
        if (Object.values(dishes).some(value => typeof value !== 'string')) throw new QuoteError('Revisa los platillos y variantes del servicio.');
        const selection: ServiceMenuSelection = {
          menuId: raw.menuId,
          requestedTime: raw.requestedTime,
          selectedDishes: Object.fromEntries(Object.entries(dishes).sort(([a], [b]) => a.localeCompare(b))) as Record<string, string>
        };
        const issue = selectionIssue(catalog.packages, service, selection);
        if (issue) throw new QuoteError(`${date} · ${service}: ${issue}`);
        const menu = catalog.packages.find(p => p.id === selection.menuId)!;
        if (guests > (menu.maxGuests ?? ITINERARY_MAX_GUESTS)) throw new QuoteError('El número de invitados supera el límite de este menú.');
        selections[service] = selection;
      }
    }
    validatedDays.push({ date, services: dayServices, ...(selections ? { selections } : {}) });
  }

  // Sort days chronologically
  validatedDays.sort((a, b) => a.date.localeCompare(b.date));

  // Determine pricing references based on published catalog
  const packages = catalog.packages || [];
  const references: ServiceReference[] = [];

  for (const meal of MEAL_SERVICES) {
    const matchedPackages = menusForService(packages, meal);

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
  const pricing = validatedDays.every(day => day.selections) ? priceItinerary(catalog, validatedDays, guests) : undefined;

  const pending: string[] = [
    'Disponibilidad tentativa sujeta a confirmación directa con el equipo.',
    'La ubicación y logística de traslado se acordarán directamente según la locación del evento.'
  ];

  if (!catalog.service.pricesApproved || (pricing ? pricing.lines.some(line => line.subtotalCents === null) : references.some(r => r.status === 'pending'))) {
    pending.push(pricing ? 'Servicios con precio pendiente: no incluidos en el subtotal conocido.' : 'Precios de cena y ajustes de propuesta por confirmar con el chef.');
  }

  if (!catalog.service.taxApproved) {
    pending.push('IVA y conceptos fiscales pendientes de confirmación.');
  }

  const selection: ItinerarySelection = {
    guestsCount: guests,
    days: validatedDays,
    ...(location !== undefined ? { location } : {})
  };

  const snapshot = {
    kind: 'itinerary' as const,
    engineVersion: pricing ? 'itinerary-v3' as const : validatedDays.some(d => d.selections) ? 'itinerary-v2' as const : 'itinerary-v1' as const,
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
    serviceSnapshot: structuredClone(catalog.service),
    ...(pricing ? { pricing } : {})
  };

  return {
    ...snapshot,
    version: digest(snapshot)
  };
}
