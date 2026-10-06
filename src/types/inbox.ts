import type { ServerEstimate } from './quote';
export const SALES_STATUSES = {nueva:'Nueva',en_revision:'En revisión',contactada:'Contactada',cerrada:'Cerrada'} as const;
export type SalesStatus = keyof typeof SALES_STATUSES;
export interface Followup {revision:number;status:SalesStatus;assigneeId:number|null;nextAction:string;nextDate:string;}
export interface InboxItem {id:string;folio:string;createdAt:string;name:string;eventDate:string;guests:number;totalCents:number;followup:Followup;}
export interface StaffOption {id:number;name:string;}
export interface InboxDetail extends InboxItem {
  estimate:ServerEstimate;
  contact:{name:string;phone:string;dietaryRestrictions:string;additionalNotes:string;};
  activity:Array<{id:number;actorName:string;createdAt:string;change:{before:Followup;after:Followup;note:string;}}>;
}
