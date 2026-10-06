import { DEMO_PACKAGES } from './packages';

export interface QuoteRules {
  leadTimes: Array<{id:string;name:string;approved:boolean;days:number}>;
  validityApproved:boolean;
  validityDays:number;
  requirementsApproved:boolean;
  requirementsText:string;
}
export const QUOTE_RULES:QuoteRules={
  leadTimes:DEMO_PACKAGES.map(pkg=>({id:pkg.id,name:pkg.name,approved:false,days:1})),
  validityApproved:false,validityDays:7,
  requirementsApproved:false,requirementsText:'Pendiente de confirmar con el negocio los requisitos de cocina, acceso y montaje.'
};
