import { CalculationBreakdown, QuoteConfigState } from '../types';
import { DEMO_PACKAGES } from '../config/packages';
import { EXTRAS_CONFIG } from '../config/extras';
import { ZONES_CONFIG } from '../config/zones';
import {servicePricing} from './servicePricing';

export function calculateQuote(state: QuoteConfigState): CalculationBreakdown {
  const selectedPackage = DEMO_PACKAGES.find(p => p.id === state.packageId) || DEMO_PACKAGES[0];
  const selectedZone = ZONES_CONFIG.find(z => z.id === state.zoneId) || ZONES_CONFIG[0];
  
  const guests = Math.max(1, Math.floor(state.guestsCount || 1));
  const minGuests = selectedPackage ? selectedPackage.minGuests : 1;
  const minGuestsWarning = guests < minGuests;
  
  // 1. Menu Subtotal in integer cents
  const menuUnitPriceCents = selectedPackage ? selectedPackage.pricePerPersonCents : 0;
  const menuSubtotalCents = guests * menuUnitPriceCents;
  
  // 2. Extras Subtotal & Itemized breakdown
  let extrasSubtotalCents = 0;
  const extrasItemized: CalculationBreakdown['extrasItemized'] = [];
  
  for (const extra of EXTRAS_CONFIG) {
    const qty = state.selectedExtras[extra.id] || 0;
    if (qty <= 0) continue;
    
    // Check compatibility with selected package
    if (selectedPackage && !selectedPackage.compatibleExtraIds.includes(extra.id)) {
      continue;
    }
    
    let itemTotalCents = 0;
    
    if (extra.pricingType === 'per_person') {
      // price * number of guests
      itemTotalCents = extra.priceCents * guests;
    } else if (extra.pricingType === 'per_unit') {
      // price * quantity chosen
      itemTotalCents = extra.priceCents * qty;
    } else if (extra.pricingType === 'fixed') {
      // fixed single fee
      itemTotalCents = extra.priceCents;
    }
    
    extrasSubtotalCents += itemTotalCents;
    extrasItemized.push({
      id: extra.id,
      name: extra.name,
      pricingType: extra.pricingType,
      unitPriceCents: extra.priceCents,
      quantity: extra.pricingType === 'per_person' ? guests : qty,
      totalCents: itemTotalCents,
      unitLabel: extra.unitLabel
    });
  }
  
  // 3. Travel fee
  const travelFeeCents = selectedZone.requiresConfirmation ? 0 : selectedZone.travelFeeCents;
  const travelRequiresConfirmation = selectedZone.requiresConfirmation;
  
  // 4. Total estimated (in cents)
  const totalEstimatedCents = menuSubtotalCents + extrasSubtotalCents + travelFeeCents;
  
  return servicePricing({
    menuSubtotalCents,
    extrasSubtotalCents,
    travelFeeCents,
    travelRequiresConfirmation,
    totalEstimatedCents,
    extrasItemized,
    minGuestsWarning,
    selectedPackage,
    selectedZone
  },guests);
}

/**
 * Filter out extras from state that are incompatible with the newly selected package.
 */
export function pruneIncompatibleExtras(
  packageId: string,
  currentExtras: Record<string, number>
): Record<string, number> {
  const pkg = DEMO_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return currentExtras;
  
  const updated: Record<string, number> = {};
  for (const [extraId, qty] of Object.entries(currentExtras)) {
    if (qty > 0 && pkg.compatibleExtraIds.includes(extraId)) {
      updated[extraId] = qty;
    }
  }
  return updated;
}
