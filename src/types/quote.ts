import type { CalculationBreakdown, QuoteConfigState } from './index';
export interface CommercialAnswers {investment:'pending'|'fits'|'review';requirements:'pending'|'yes'|'no';dietaryReview:boolean;}
export interface Qualification {status:'ready'|'clarify';reasons:string[];policyPending:string[];answers:CommercialAnswers;}
export type QuoteSelection = Pick<QuoteConfigState,'eventType'|'eventDate'|'zoneId'|'packageId'|'guestsCount'|'selectedExtras'|'selectedDishes'> & {commercial?:CommercialAnswers};
export interface ServerEstimate {
  version: string;
  engineVersion: string;
  catalogVersion: string;
  selection: QuoteSelection;
  breakdown: CalculationBreakdown;
  estimateStatus: 'partial'|'estimated';
  demo: boolean;
  pending: string[];
  qualification?:Qualification;
  rulesSnapshot?:import('../config/quoteRules').QuoteRules;
  serviceSnapshot?:import('../config/service').ServiceSettings;
}
export interface QuoteContact {name:string;phone:string;dietaryRestrictions:string;additionalNotes:string;}
export interface QuoteReceipt { folio: string; createdAt: string; estimate: ServerEstimate; contact?:QuoteContact; }
export function quoteSelection(state: QuoteConfigState): QuoteSelection {
  return {eventType:state.eventType,eventDate:state.eventDate,zoneId:state.zoneId,packageId:state.packageId,guestsCount:state.guestsCount,selectedExtras:state.selectedExtras,...(state.selectedDishes?{selectedDishes:state.selectedDishes}:{})};
}
