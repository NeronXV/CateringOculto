import type {CalculationBreakdown} from '../types';
import {SERVICE_SETTINGS,type ServiceSettings} from '../config/service';
export function servicePricing(base:CalculationBreakdown,guests:number,settings:ServiceSettings=SERVICE_SETTINGS):CalculationBreakdown {
  const pricePending=base.selectedPackage?.priceApproved===false;
  const menuSubtotalCents=pricePending?0:base.menuSubtotalCents;
  const travelRequiresConfirmation=base.travelRequiresConfirmation || (settings.travelMode==='blocks' && !settings.travelApproved);
  const travelFeeCents=travelRequiresConfirmation?0:settings.travelMode==='blocks'?Math.ceil(guests/settings.travelBlockGuests)*settings.travelBlockCents:base.travelFeeCents;
  const taxable=menuSubtotalCents+base.extrasSubtotalCents+(settings.taxOnTravel?travelFeeCents:0);
  const taxCents=settings.taxApproved?Number((BigInt(taxable)*BigInt(settings.taxRateBps)+5000n)/10000n):0;
  return {...base,menuSubtotalCents,travelRequiresConfirmation,travelFeeCents,taxCents,taxPending:!settings.taxApproved,pricePending,
    totalIsPartial:pricePending || !settings.taxApproved || travelRequiresConfirmation,
    totalEstimatedCents:menuSubtotalCents+base.extrasSubtotalCents+travelFeeCents+taxCents};
}
