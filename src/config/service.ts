export interface ServiceSettings {
  pricesApproved:boolean;
  taxApproved:boolean;
  taxRateBps:number;
  taxOnTravel:boolean;
  travelMode:'zones'|'blocks';
  travelApproved:boolean;
  travelBlockGuests:number;
  travelBlockCents:number;
  contactEmail:string;
  conditions:string;
  conditionsVersion:string;
  depositPercent:number;
  balanceDays:number;
}
export const SERVICE_SETTINGS:ServiceSettings={pricesApproved:false,taxApproved:false,taxRateBps:0,taxOnTravel:false,
  travelMode:'zones',travelApproved:false,travelBlockGuests:20,travelBlockCents:500000,contactEmail:'',
  conditions:'La fecha y las condiciones finales deben confirmarse con el equipo. La cotización no reserva el evento.',
  conditionsVersion:'pendiente-v1',depositPercent:50,balanceDays:15};
