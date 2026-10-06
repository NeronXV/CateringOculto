import { useEffect, useReducer, useState } from 'react';
import { QuoteConfigState } from '../types';
import { createDefaultQuote, DRAFT_KEY, quoteReducer, restoreDraft, serializeDraft, QuoteAction } from '../utils/quoteDraft';

function readInitialQuote() {
  try {
    const restored = restoreDraft(window.localStorage.getItem(DRAFT_KEY));
    return { quote: restored ?? createDefaultQuote(), notice: restored ? 'Recuperamos la selección de tu evento. Revisa la fecha y el estimado actualizado.' : '' };
  } catch { return { quote: createDefaultQuote(), notice: '' }; }
}

export function useQuoteDraft() {
  const [session, dispatch] = useReducer(quoteReducer, undefined, readInitialQuote);
  const [storageStatus, setStorageStatus] = useState<'saved' | 'unavailable'>('unavailable');
  const { eventType, eventDate, zoneId, packageId, guestsCount, selectedExtras, selectedDishes } = session.quote;

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, serializeDraft({
        eventType, eventDate, zoneId, packageId, guestsCount, selectedExtras, selectedDishes,
        clientName: '', dietaryRestrictions: '', additionalNotes: ''
      }));
      setStorageStatus('saved');
    } catch { setStorageStatus('unavailable'); }
  }, [eventType, eventDate, zoneId, packageId, guestsCount, selectedExtras, selectedDishes]);

  const changeField = <K extends keyof QuoteConfigState>(field: K, value: QuoteConfigState[K]) => {
    dispatch({ type: 'field', field, value } as QuoteAction);
  };
  return { ...session, storageStatus, changeField, reset: () => dispatch({ type: 'reset' }) };
}
