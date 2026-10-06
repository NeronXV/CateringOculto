import { createHash } from 'node:crypto';
import type { Catalog } from '../src/admin/catalog';
import { EVENT_TYPES } from '../src/config/packages';
import type { CommercialAnswers, QuoteSelection, ServerEstimate } from '../src/types/quote';
import {activeDishGroups} from '../src/utils/dishes';
import {servicePricing} from '../src/utils/servicePricing';

export class QuoteError extends Error { constructor(message: string, public status=400) {super(message);} }
export function digest(value: unknown): string {return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
export function object(value: unknown): Record<string,unknown> {
  if(!value || typeof value!=='object' || Array.isArray(value))throw new QuoteError('Formato de solicitud inválido.');
  return value as Record<string,unknown>;
}
export function exactKeys(value: Record<string,unknown>, keys: string[]) {
  if(Object.keys(value).sort().join('|')!==keys.sort().join('|'))throw new QuoteError('Los campos de la solicitud no son válidos.');
}
export function textField(value: unknown,max: number,required=false): string {
  if(typeof value!=='string' || value.length>max || (required && !value.trim()))throw new QuoteError('Revisa los datos de contacto y la longitud de las notas.');
  return value.trim();
}
// Business timezone is explicit so deployment does not depend on the host clock zone.
function today(now: Date) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mazatlan',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(type=>parts.find(p=>p.type===type)!.value).join('-');
}
export function estimateQuote(catalog: Catalog,input: unknown,now=new Date()): ServerEstimate {
  const data=object(input);
  exactKeys(data,['eventType','eventDate','zoneId','packageId','guestsCount','selectedExtras',...('commercial' in data?['commercial']:[]),...('selectedDishes' in data?['selectedDishes']:[])]);
  const commercial:CommercialAnswers={investment:'pending',requirements:'pending',dietaryReview:false};
  if('commercial' in data) {
    const answers=object(data.commercial);exactKeys(answers,['investment','requirements','dietaryReview']);
    if(typeof answers.investment!=='string' || !['pending','fits','review'].includes(answers.investment) || typeof answers.requirements!=='string' || !['pending','yes','no'].includes(answers.requirements) || typeof answers.dietaryReview!=='boolean')throw new QuoteError('Respuestas comerciales inválidas.');
    Object.assign(commercial,answers);
  }
  if(!EVENT_TYPES.some(t=>t.id===data.eventType))throw new QuoteError('Selecciona un tipo de evento válido.');
  const date=data.eventDate;
  if(typeof date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T12:00:00Z')) || new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date || date<=today(now))throw new QuoteError('Selecciona una fecha válida a partir de mañana.');
  const pkg=catalog.packages.find(p=>p.id===data.packageId);
  const zone=catalog.zones.find(z=>z.id===data.zoneId);
  if(!pkg || !zone)throw new QuoteError('El menú o la zona no están disponibles. Recarga el catálogo.');
  const dishes='selectedDishes' in data?object(data.selectedDishes):{};
  const activeGroups=activeDishGroups(pkg,dishes as Record<string,string>);
  const selectedDishes:Record<string,string>={};
  const dishSummary:NonNullable<ServerEstimate['breakdown']['dishSummary']>=[];
  for(const id of Object.keys(dishes).sort()) {
    const group=activeGroups.find(g=>g.id===id),chosen=group?.options.find(o=>o.id===dishes[id]);
    if(!group || !chosen)throw new QuoteError('Hay un platillo o variante no disponible para este menú.');
    selectedDishes[id]=chosen.id;dishSummary.push({group:group.name,name:chosen.name,description:chosen.description});
  }
  if(activeGroups.some(g=>g.required && !selectedDishes[g.id]))throw new QuoteError('Completa las opciones de platillos requeridas.');
  const guests=data.guestsCount;
  if(typeof guests!=='number' || !Number.isSafeInteger(guests) || guests<1 || guests>Math.min(150,pkg.maxGuests ?? 150))throw new QuoteError('El número de invitados está fuera del rango de este menú.');
  const extras=object(data.selectedExtras);
  const selectedExtras: Record<string,number>={};
  const items: ServerEstimate['breakdown']['extrasItemized']=[];
  for(const id of Object.keys(extras).sort()) {
    const extra=catalog.extras.find(e=>e.id===id);const qty=extras[id];
    if(!extra || !pkg.compatibleExtraIds.includes(id))throw new QuoteError('Hay un complemento no disponible para este menú.');
    if(typeof qty!=='number' || !Number.isSafeInteger(qty) || qty<1 || qty>(extra.pricingType==='per_unit' ? extra.maxQuantity ?? 10 : 1))throw new QuoteError('Cantidad de complemento inválida.');
    selectedExtras[id]=qty;
    const quantity=extra.pricingType==='per_person' ? guests : qty;
    items.push({id,name:extra.name,pricingType:extra.pricingType,unitPriceCents:extra.priceCents,quantity,totalCents:extra.priceCents*quantity,...(extra.unitLabel?{unitLabel:extra.unitLabel}:{})});
  }
  const menuSubtotalCents=guests*pkg.pricePerPersonCents;
  const extrasSubtotalCents=items.reduce((total,item)=>total+item.totalCents,0);
  const travelFeeCents=zone.requiresConfirmation ? 0 : zone.travelFeeCents;
  const totalEstimatedCents=menuSubtotalCents+extrasSubtotalCents+travelFeeCents;
  if(![menuSubtotalCents,extrasSubtotalCents,travelFeeCents,totalEstimatedCents,...items.map(i=>i.totalCents)].every(n=>Number.isSafeInteger(n) && n>=0))throw new QuoteError('El catálogo contiene importes inválidos.');
  const selection={eventType:data.eventType,eventDate:date,zoneId:zone.id,packageId:pkg.id,guestsCount:guests,selectedExtras,...('selectedDishes' in data?{selectedDishes}:{}),...('commercial' in data?{commercial}: {})} as QuoteSelection;
  const breakdown=servicePricing({menuSubtotalCents,extrasSubtotalCents,travelFeeCents,totalEstimatedCents,extrasItemized:items,travelRequiresConfirmation:zone.requiresConfirmation,minGuestsWarning:guests<pkg.minGuests,selectedPackage:structuredClone(pkg),selectedZone:structuredClone(zone)},guests,catalog.service);
  breakdown.dishSummary=dishSummary;
  if(!Number.isSafeInteger(breakdown.totalEstimatedCents) || breakdown.totalEstimatedCents<0)throw new QuoteError('Importe fuera de rango.');
  const pending=['Disponibilidad y condiciones por confirmar con el equipo.'];
  if(!catalog.service.pricesApproved)pending.push('Precios de demostración: pendientes de aprobación del negocio.');
  if(breakdown.taxPending)pending.push('IVA pendiente de confirmar; no incluido en este importe.');
  if(breakdown.pricePending)pending.push('Precio y unidad de cobro de este menú pendientes; no incluidos en el total parcial.');
  if(breakdown.travelRequiresConfirmation)pending.push('Traslado pendiente de cotización; no incluido en este importe.');
  activeGroups.filter(g=>g.note).forEach(g=>pending.push(`${g.name}: ${g.note}`));
  if(guests<pkg.minGuests)pending.push('Grupo menor al mínimo: requiere revisión; no se ha cobrado un mínimo automático.');
  const reasons:string[]=[],policyPending=['Disponibilidad siempre por confirmar.'];
  if(!catalog.service.pricesApproved || breakdown.pricePending || breakdown.taxPending)policyPending.push('Precios o impuestos pendientes de aprobación.');
  const lead=catalog.rules.leadTimes.find(rule=>rule.id===pkg.id) ?? {approved:false,days:1};
  const days=Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(today(now)+'T12:00:00Z'))/86400000);
  if(!lead.approved)policyPending.push('Anticipación de este menú pendiente de aprobación.');
  else if(days<lead.days)reasons.push(`El evento tiene ${days} días de anticipación; este menú requiere ${lead.days}.`);
  if(guests<pkg.minGuests)reasons.push('Invitados por debajo del mínimo; revisar sin aplicar cobro mínimo automático.');
  if(breakdown.travelRequiresConfirmation)reasons.push('Falta cotizar el traslado.');
  if(breakdown.pricePending)reasons.push('Falta confirmar el precio de este menú.');
  if(commercial.investment!=='fits')reasons.push(commercial.investment==='review'?'El visitante solicita ajustar la inversión.':'Falta confirmar si el importe estimado encaja con la inversión prevista.');
  if(!catalog.rules.requirementsApproved)policyPending.push('Requisitos de cocina, acceso y montaje pendientes de aprobación.');
  else if(commercial.requirements!=='yes')reasons.push(commercial.requirements==='no'?'El lugar no cumple los requisitos declarados; revisar alternativas.':'Falta confirmar los requisitos del lugar.');
  if(commercial.dietaryReview)reasons.push('Restricciones alimentarias declaradas: requieren revisión humana, sin garantía de seguridad.');
  if(!catalog.rules.validityApproved)policyPending.push('Vigencia pendiente de aprobación.');
  else pending.push(`Vigencia propuesta del presupuesto: ${catalog.rules.validityDays} días desde su emisión; cualquier cambio requiere una nueva revisión.`);
  const qualification={status:reasons.length?'clarify' as const:'ready' as const,reasons,policyPending,answers:commercial};
  const snapshot={engineVersion:'catering-v3',catalogVersion:digest(catalog),selection,qualification,rulesSnapshot:structuredClone(catalog.rules),serviceSnapshot:structuredClone(catalog.service),breakdown,
    estimateStatus:breakdown.totalIsPartial?'partial' as const:'estimated' as const,demo:!catalog.service.pricesApproved,pending};
  return {...snapshot,version:digest(snapshot)};
}
