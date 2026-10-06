export type EventType = 
  | 'cena_privada'
  | 'celebracion'
  | 'catering_corporativo'
  | 'experiencia_degustacion'
  | 'otro';

export interface EventTypeOption {
  id: EventType;
  name: string;
  shortDescription: string;
  tagline: string;
  recommendedGuestsMin: number;
}

export interface MenuItemCourse {
  title: string;
  description: string;
}

export interface PackageMenu {
  id: string;
  name: string;
  subtitle: string;
  concept: string;
  pricePerPersonCents: number; // in MXN cents (e.g. 185000 = $1,850.00 MXN)
  minGuests: number;
  maxGuests?: number;
  highlight?: string;
  courses: MenuItemCourse[];
  includedServices: string[];
  compatibleExtraIds: string[];
  image: string;
  demoLabel: string;
  choiceGroups?: DishGroup[];
  priceApproved?: boolean;
}

export interface DishGroup {
  id:string;
  name:string;
  required:boolean;
  note:string;
  // Variants can depend on an option chosen in another group.
  dependsOnGroup:string;
  dependsOnOption:string;
  options:Array<{id:string;name:string;description:string}>;
}

export type ExtraPricingType = 'per_person' | 'per_unit' | 'fixed';

export interface ExtraOption {
  id: string;
  name: string;
  description: string;
  pricingType: ExtraPricingType;
  priceCents: number; // in MXN cents
  unitLabel?: string; // e.g. "por hora", "por mesero"
  defaultQuantity?: number;
  maxQuantity?: number;
  category: 'maridaje' | 'servicio' | 'ambientacion' | 'cocteleria';
  demoLabel?: string;
}

export interface ZoneOption {
  id: string;
  name: string;
  description: string;
  travelFeeCents: number; // 0 if included/free or requires confirmation
  requiresConfirmation: boolean;
  notes?: string;
}

export interface QuoteConfigState {
  eventType: EventType;
  eventDate: string;
  zoneId: string;
  packageId: string;
  guestsCount: number;
  selectedExtras: Record<string, number>; // extraId -> quantity (1 for selected fixed/per_person, N for per_unit)
  selectedDishes?: Record<string,string>;
  clientName: string;
  dietaryRestrictions: string;
  additionalNotes: string;
}

export interface CalculationBreakdown {
  menuSubtotalCents: number;
  extrasSubtotalCents: number;
  travelFeeCents: number;
  travelRequiresConfirmation: boolean;
  totalEstimatedCents: number;
  extrasItemized: {
    id: string;
    name: string;
    pricingType: ExtraPricingType;
    unitPriceCents: number;
    quantity: number;
    totalCents: number;
    unitLabel?: string;
  }[];
  minGuestsWarning: boolean;
  selectedPackage: PackageMenu | undefined;
  selectedZone: ZoneOption | undefined;
  taxCents?:number;
  taxPending?:boolean;
  totalIsPartial?:boolean;
  pricePending?:boolean;
  dishSummary?:Array<{group:string;name:string;description:string}>;
}
