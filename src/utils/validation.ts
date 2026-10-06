import { QuoteConfigState } from '../types';
import { DEMO_PACKAGES, EVENT_TYPES } from '../config/packages';
import { ZONES_CONFIG } from '../config/zones';
import { getTodayMinDateString } from './formatters';
import {activeDishGroups} from './dishes';

export function getStepErrors(state: QuoteConfigState, step: number): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!EVENT_TYPES.some(type => type.id === state.eventType)) errors.eventType = 'Selecciona un tipo de evento válido.';
    const date = new Date(`${state.eventDate}T12:00:00`);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(state.eventDate) &&
      Number.isFinite(date.getTime()) && date.getFullYear() === Number(state.eventDate.slice(0, 4)) &&
      date.getMonth() + 1 === Number(state.eventDate.slice(5, 7)) && date.getDate() === Number(state.eventDate.slice(8, 10));
    if (!validDate) errors.eventDate = 'Por favor selecciona una fecha válida para el servicio.';
    else if (state.eventDate < getTodayMinDateString()) errors.eventDate = 'Selecciona una fecha a partir de mañana.';
    if (!ZONES_CONFIG.some(zone => zone.id === state.zoneId)) errors.zoneId = 'Selecciona la zona de tu evento.';
  }
  if (step === 2) {
    const pkg=DEMO_PACKAGES.find(pkg=>pkg.id===state.packageId);
    if(activeDishGroups(pkg,state.selectedDishes).some(g=>g.required && !g.options.some(o=>o.id===state.selectedDishes?.[g.id])))errors.selectedDishes='Completa las opciones de platillos requeridas.';
    const maxGuests = Math.min(150, DEMO_PACKAGES.find(pkg => pkg.id === state.packageId)?.maxGuests ?? 150);
    if (!DEMO_PACKAGES.some(pkg => pkg.id === state.packageId)) errors.packageId = 'Selecciona una opción de menú válida.';
    if (!Number.isInteger(state.guestsCount) || state.guestsCount < 1 || state.guestsCount > maxGuests) {
      errors.guestsCount = `El número de comensales debe ser un entero entre 1 y ${maxGuests} para este menú.`;
    }
  }
  if (step === 4 && !state.clientName.trim()) errors.clientName = 'Por favor ingresa tu nombre completo para personalizar la solicitud.';
  return errors;
}

export function isQuoteReady(state: QuoteConfigState): boolean {
  return [1, 2, 4].every(step => Object.keys(getStepErrors(state, step)).length === 0);
}
