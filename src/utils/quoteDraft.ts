import { QuoteConfigState } from '../types';
import { DEMO_PACKAGES, EVENT_TYPES } from '../config/packages';
import { ZONES_CONFIG } from '../config/zones';
import { EXTRAS_CONFIG } from '../config/extras';
import { pruneIncompatibleExtras } from './calculator';
import { getStepErrors } from './validation';
import {pruneDishes} from './dishes';

export const DRAFT_KEY = 'catering-oculto:event-draft:v1';
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Increment when catalog structure or meanings of IDs change. Prices are never persisted.
const CATALOG_VERSION = 'demo-v1';

export function createDefaultQuote(): QuoteConfigState {
  return {
    eventType: 'cena_privada', eventDate: '', zoneId: ZONES_CONFIG[0].id,
    packageId: DEMO_PACKAGES[0].id, guestsCount: 6, selectedExtras: {}, selectedDishes:{},
    clientName: '', dietaryRestrictions: '', additionalNotes: ''
  };
}

export function serializeDraft(state: QuoteConfigState, now = Date.now()): string {
  // Explicit allowlist: never spread the full state into persistent storage.
  return JSON.stringify({
    version: 1, catalogVersion: CATALOG_VERSION, savedAt: now,
    selection: {
      eventType: state.eventType, eventDate: state.eventDate, zoneId: state.zoneId,
      packageId: state.packageId, guestsCount: state.guestsCount, selectedExtras: state.selectedExtras, selectedDishes:state.selectedDishes ?? {}
    }
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function restoreDraft(raw: string | null, now = Date.now()): QuoteConfigState | null {
  if (!raw || raw.length > 16000) return null;
  try {
    const draft: unknown = JSON.parse(raw);
    if (!isRecord(draft) || draft.version !== 1 || draft.catalogVersion !== CATALOG_VERSION ||
      typeof draft.savedAt !== 'number' || !Number.isFinite(draft.savedAt) ||
      draft.savedAt > now || now - draft.savedAt > DRAFT_TTL_MS || !isRecord(draft.selection)) return null;
    const selection = draft.selection;
    const state = createDefaultQuote();
    if (EVENT_TYPES.some(type => type.id === selection.eventType)) state.eventType = selection.eventType as QuoteConfigState['eventType'];
    if (ZONES_CONFIG.some(zone => zone.id === selection.zoneId)) state.zoneId = selection.zoneId as string;
    if (DEMO_PACKAGES.some(pkg => pkg.id === selection.packageId)) state.packageId = selection.packageId as string;
    if (typeof selection.guestsCount === 'number' && Number.isInteger(selection.guestsCount) &&
      selection.guestsCount >= 1 && selection.guestsCount <= 150) state.guestsCount = selection.guestsCount;
    if (typeof selection.eventDate === 'string' &&
      !getStepErrors({ ...state, eventDate: selection.eventDate }, 1).eventDate) state.eventDate = selection.eventDate;
    const extras = selection.selectedExtras;
    if(isRecord(selection.selectedDishes) && state.packageId===selection.packageId)state.selectedDishes=pruneDishes(DEMO_PACKAGES.find(p=>p.id===state.packageId),selection.selectedDishes as Record<string,string>);
    if (isRecord(extras) && state.packageId === selection.packageId) {
      for (const extra of EXTRAS_CONFIG) {
        const quantity = extras[extra.id];
        if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) continue;
        state.selectedExtras[extra.id] = extra.pricingType === 'per_unit'
          ? Math.min(quantity, extra.maxQuantity ?? 10) : 1;
      }
      state.selectedExtras = pruneIncompatibleExtras(state.packageId, state.selectedExtras);
    }
    return state;
  } catch { return null; }
}

export interface QuoteSession { quote: QuoteConfigState; notice: string; }
type FieldAction = { [K in keyof QuoteConfigState]-?: { type: 'field'; field: K; value: QuoteConfigState[K] } }[keyof QuoteConfigState];
export type QuoteAction = FieldAction | { type: 'reset' };

export function quoteReducer(session: QuoteSession, action: QuoteAction): QuoteSession {
  if (action.type === 'reset') return { quote: createDefaultQuote(), notice: 'Has reiniciado tu evento.' };
  if (action.field === 'packageId') {
    if (!DEMO_PACKAGES.some(pkg => pkg.id === action.value)) return session;
    const extras = pruneIncompatibleExtras(action.value, session.quote.selectedExtras);
    const removed = Object.keys(session.quote.selectedExtras).some(id => !(id in extras));
    return {
      quote: { ...session.quote, packageId: action.value, selectedExtras: extras, selectedDishes:action.value===session.quote.packageId?session.quote.selectedDishes:{} },
      notice: removed ? 'Actualizamos el menú y retiramos los extras que no son compatibles. Conservamos los demás datos de tu evento.' : 'Menú actualizado. Conservamos los demás datos de tu evento.'
    };
  }
  return { quote: { ...session.quote, [action.field]: action.value }, notice: '' };
}
