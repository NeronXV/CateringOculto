import { BUSINESS_CONFIG } from '../config/business';
import { DEMO_PACKAGES } from '../config/packages';
import { EXTRAS_CONFIG } from '../config/extras';
import { ZONES_CONFIG } from '../config/zones';
import { FAQS_CONFIG } from '../config/faqs';
import { EDITORIAL_CONFIG } from '../config/editorial';
import { SECTIONS_CONFIG } from '../config/sections';
import { QUOTE_RULES } from '../config/quoteRules';
import {SERVICE_SETTINGS} from '../config/service';
import {EVENT_TYPES} from '../config/packages';

export function defaultCatalog() {
  return JSON.parse(JSON.stringify({ business: BUSINESS_CONFIG, editorial: EDITORIAL_CONFIG,
    schemaVersion:2,service:SERVICE_SETTINGS,rules: QUOTE_RULES, sections: SECTIONS_CONFIG, packages: DEMO_PACKAGES.map(p=>({...p,choiceGroups:p.choiceGroups ?? [],priceApproved:p.priceApproved ?? true})), extras: EXTRAS_CONFIG, zones: ZONES_CONFIG, faqs: FAQS_CONFIG })) as Catalog;
}
export interface Catalog {
  schemaVersion:2;
  service:typeof SERVICE_SETTINGS;
  rules: typeof QUOTE_RULES;
  sections: typeof SECTIONS_CONFIG;
  business: typeof BUSINESS_CONFIG;
  editorial: typeof EDITORIAL_CONFIG;
  packages: typeof DEMO_PACKAGES;
  extras: typeof EXTRAS_CONFIG;
  zones: typeof ZONES_CONFIG;
  faqs: typeof FAQS_CONFIG;
}
const template = defaultCatalog();
const fixedKeys = new Set(['currency', 'currencySymbol']);
// Upgrade only stored legacy catalogs. Writes still require the complete schema.
export function upgradeStoredCatalog(value: unknown): Catalog {
  if(!value || typeof value!=='object' || Array.isArray(value)) throw new Error('Catálogo inválido.');
  const upgraded={...value} as Record<string,unknown>;
  if(!Object.prototype.hasOwnProperty.call(upgraded,'schemaVersion'))upgraded.schemaVersion=2;
  if(!Object.prototype.hasOwnProperty.call(upgraded,'service'))upgraded.service=structuredClone(template.service);
  if(Array.isArray(upgraded.packages))upgraded.packages=upgraded.packages.map(p=>p && typeof p==='object'?{...p,choiceGroups:p.choiceGroups ?? [],priceApproved:p.priceApproved ?? true}:p);
  if(!Object.prototype.hasOwnProperty.call(upgraded,'sections')) upgraded.sections=structuredClone(template.sections);
  if(!Object.prototype.hasOwnProperty.call(upgraded,'rules')) upgraded.rules=structuredClone(template.rules);
  validateCatalog(upgraded);
  return upgraded;
}
export function hasPublishedImage(catalog: Catalog, url: string): boolean {
  const walk=(value: unknown):boolean=>!!value && typeof value==='object' && Object.entries(value).some(([key,item])=>key==='image' ? item===url : walk(item));
  return walk(catalog);
}
export function validateCatalog(input: unknown): asserts input is Catalog {
  const walk = (value: unknown, expected: unknown, path: string, key: string) => {
    if (fixedKeys.has(key)) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) throw new Error(`${path}: campo protegido.`);
    } else if (Array.isArray(expected)) {
      if (!Array.isArray(value) || value.length>100) throw new Error(`${path}: estructura inválida (máximo 100 elementos).`);
      value.forEach((item, i) => walk(item, expected[0], `${path}.${i}`, String(i)));
    } else if (expected !== null && typeof expected === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: formato inválido.`);
      const record = value as Record<string, unknown>;
      if (Object.keys(record).sort().join('|') !== Object.keys(expected).sort().join('|')) throw new Error(`${path}: campos inválidos.`);
      Object.entries(expected).forEach(([k, v]) => walk(record[k], v, `${path}.${k}`, k));
    } else if (typeof expected === 'string') {
      if (typeof value !== 'string' || (!value.trim() && !['contactEmail','note','dependsOnGroup','dependsOnOption'].includes(key)) || value.length > 5000) throw new Error(`${path}: texto inválido o demasiado largo.`);
      if(key==='contactEmail' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new Error('Correo de contacto inválido.');
      if(key==='id' && !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(value))throw new Error(`${path}: identificador inválido.`);
      if (key === 'image' || key === 'instagram' || key === 'facebook') {
        if (!(key === 'image' && /^\/(?!\/)[\w/.-]+$/.test(value))) {
          let url: URL;
          try { url = new URL(value); } catch { throw new Error(`${path}: enlace inválido.`); }
          if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${path}: usa un enlace HTTPS.`);
        }
      }
      if (key === 'whatsAppNumberDigits' && !/^\d{10,15}$/.test(value)) throw new Error('WhatsApp: usa de 10 a 15 dígitos, con código de país.');
    } else if (typeof expected === 'number') {
      const max = key.endsWith('Cents') ? 100000000 : key==='taxRateBps'?10000:key==='depositPercent'?100:150;
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < (key.endsWith('Cents') || ['taxRateBps','depositPercent'].includes(key) ? 0 : 1) || value > max) throw new Error(`${path}: número fuera de rango.`);
    } else if (typeof value !== typeof expected) throw new Error(`${path}: tipo inválido.`);
  };
  if(!input || typeof input!=='object' || Array.isArray(input))throw new Error('Catálogo inválido.');
  const raw=input as Catalog;
  if(raw.schemaVersion!==2)throw new Error('Versión de catálogo no compatible.');
  const plain={...raw,packages:[],extras:[],zones:[]};
  walk(plain,template,'Catálogo','');
  const dynamic=(items:unknown,required:string[],optional:Record<string,unknown>,example:Record<string,unknown>,label:string)=>{
    if(!Array.isArray(items) || items.length>50)throw new Error(`${label}: máximo 50 elementos.`);
    for(const item of items) {
      if(!item || typeof item!=='object' || Array.isArray(item))throw new Error(`${label}: formato inválido.`);
      const keys=Object.keys(item);
      if(required.some(k=>!(k in item)) || keys.some(k=>!required.includes(k) && !(k in optional)))throw new Error(`${label}: campos inválidos.`);
      for(const k of keys)walk(item[k],k in optional?optional[k]:example[k],`${label}.${k}`,k);
    }
  };
  const dish={id:'plato',name:'Platillo',description:'Descripción'};
  const group={id:'grupo',name:'Tiempo',required:true,note:'',dependsOnGroup:'',dependsOnOption:'',options:[dish]};
  dynamic(raw.packages,['id','name','subtitle','concept','pricePerPersonCents','minGuests','courses','includedServices','compatibleExtraIds','image','demoLabel'],{maxGuests:150,highlight:'Distintivo',choiceGroups:[group],priceApproved:false},template.packages[0] as unknown as Record<string,unknown>,'Menús');
  dynamic(raw.extras,['id','name','description','pricingType','priceCents','category'],{unitLabel:'unidad',defaultQuantity:1,maxQuantity:10,demoLabel:'Nota'},template.extras[0] as unknown as Record<string,unknown>,'Extras');
  dynamic(raw.zones,['id','name','description','travelFeeCents','requiresConfirmation'],{notes:'Nota'},template.zones[0] as unknown as Record<string,unknown>,'Zonas');
  const catalog = input as Catalog;
  const unique=(items:Array<{id:string}>,label:string)=>{if(new Set(items.map(x=>x.id)).size!==items.length)throw new Error(`${label}: identificadores duplicados.`);};
  if(!catalog.packages.length || !catalog.zones.length)throw new Error('Conserva al menos un menú y una zona.');
  if(catalog.sections.philosophy.photos.length!==2 || catalog.sections.philosophy.pillars.length!==3)throw new Error('La composición de filosofía utiliza dos fotografías y tres principios.');
  if(catalog.sections.gallery.items.some(i=>!['portrait','landscape'].includes(i.aspect)))throw new Error('Formato de fotografía inválido.');
  unique(catalog.packages,'Menús');unique(catalog.extras,'Extras');unique(catalog.zones,'Zonas');unique(catalog.rules.leadTimes,'Anticipación');unique(catalog.sections.gallery.items,'Galería');
  if(!['zones','blocks'].includes(catalog.service.travelMode))throw new Error('Regla de traslado inválida.');
  if(catalog.sections.experiences.items.some(x=>!EVENT_TYPES.some(t=>t.id===x.id)))throw new Error('Experiencia inválida.');
  for(const extra of catalog.extras)if(!['per_person','per_unit','fixed'].includes(extra.pricingType) || !['maridaje','servicio','ambientacion','cocteleria'].includes(extra.category))throw new Error('Tipo de complemento inválido.');
  for(const pkg of catalog.packages) {
    if(pkg.compatibleExtraIds.some(id=>typeof id!=='string' || !catalog.extras.some(e=>e.id===id)))throw new Error(`${pkg.name}: complemento desconocido.`);
    unique(pkg.choiceGroups ?? [],'Grupos');
    for(const group of pkg.choiceGroups ?? []) {
      unique(group.options,'Platillos');
      if(!group.options.length)throw new Error('Cada grupo necesita una opción.');
      if(group.dependsOnGroup && !(pkg.choiceGroups ?? []).some(g=>g.id===group.dependsOnGroup && !g.dependsOnGroup && g.options.some(o=>o.id===group.dependsOnOption)))throw new Error('Dependencia de platillo inválida.');
      if(!group.dependsOnGroup && group.dependsOnOption)throw new Error('Selecciona el grupo del que depende la variante.');
    }
  }
  for (const pkg of catalog.packages) if (pkg.maxGuests && pkg.minGuests > pkg.maxGuests) throw new Error(`${pkg.name}: el mínimo supera al máximo.`);
  for (const extra of catalog.extras) if (extra.defaultQuantity && extra.maxQuantity && extra.defaultQuantity > extra.maxQuantity) throw new Error(`${extra.name}: cantidad inicial mayor al máximo.`);
  for (const zone of catalog.zones) if (zone.requiresConfirmation && zone.travelFeeCents !== 0) throw new Error(`${zone.name}: deja el traslado en cero si requiere confirmación.`);
}
export function applyCatalog(catalog: Catalog) {
  validateCatalog(catalog);
  Object.assign(QUOTE_RULES,catalog.rules);
  Object.assign(SERVICE_SETTINGS,catalog.service);
  Object.assign(BUSINESS_CONFIG, catalog.business);
  Object.assign(EDITORIAL_CONFIG, catalog.editorial);
  Object.assign(SECTIONS_CONFIG, catalog.sections);
  DEMO_PACKAGES.splice(0, DEMO_PACKAGES.length, ...catalog.packages);
  EXTRAS_CONFIG.splice(0, EXTRAS_CONFIG.length, ...catalog.extras);
  ZONES_CONFIG.splice(0, ZONES_CONFIG.length, ...catalog.zones);
  FAQS_CONFIG.splice(0, FAQS_CONFIG.length, ...catalog.faqs);
}
