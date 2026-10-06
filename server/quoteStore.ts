import { randomUUID } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import {jsonDocument} from './jsonDocument';
import { parseState } from './mysqlStore';
import { digest, estimateQuote, exactKeys, object, QuoteError, textField } from './quoteEngine';
import type { QuoteReceipt } from '../src/types/quote';

export class QuoteStore {
  constructor(private pool: Pool) {}
  async submit(input: unknown): Promise<QuoteReceipt> {
    const body=object(input);
    exactKeys(body,['selection','contact','acceptedVersion','idempotencyKey','consent']);
    if(typeof body.idempotencyKey!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(body.idempotencyKey))throw new QuoteError('Clave de solicitud inválida.');
    if(body.consent!==true || typeof body.acceptedVersion!=='string' || !/^[a-f0-9]{64}$/.test(body.acceptedVersion))throw new QuoteError('Revisa y acepta el estimado y el guardado de tus datos.');
    const c=object(body.contact);exactKeys(c,['name','phone','dietaryRestrictions','additionalNotes']);
    const contact={name:textField(c.name,100,true),phone:textField(c.phone,30,true),dietaryRestrictions:textField(c.dietaryRestrictions,2000),additionalNotes:textField(c.additionalNotes,2000)};
    if(!/^\+?[\d ()-]+$/.test(contact.phone) || contact.phone.replace(/\D/g,'').length<10 || contact.phone.replace(/\D/g,'').length>15)throw new QuoteError('Escribe un teléfono de contacto de 10 a 15 dígitos.');
    const selection=object(body.selection);
    if(selection.commercial && object(selection.commercial).dietaryReview!==!!contact.dietaryRestrictions)throw new QuoteError('Las restricciones alimentarias cambiaron. Revisa de nuevo el estimado.');
    // Canonical hash makes key order irrelevant, including extras, but preserves every submitted value.
    const canonical=(value: unknown): unknown=>Array.isArray(value)?value.map(canonical):value && typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)])):value;
    const payloadHash=digest(canonical({selection:body.selection,contact,acceptedVersion:body.acceptedVersion,consent:true}));
    const conn=await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      // Same lock as publication: pricing and insertion see one consistent published catalog.
      const [rows]=await conn.execute<RowDataPacket[]>('SELECT document FROM editorial_state WHERE id=1 FOR UPDATE');
      const [existing]=await conn.execute<RowDataPacket[]>('SELECT folio,created_at,estimate_snapshot,payload_hash FROM quote_requests WHERE idempotency_key=?',[body.idempotencyKey]);
      if(existing.length) {
        const row=existing[0];
        if(row.payload_hash!==payloadHash)throw new QuoteError('Esta clave ya se utilizó para otra solicitud.',409);
        await conn.commit();return {folio:row.folio,createdAt:row.created_at,estimate:jsonDocument(row.estimate_snapshot)};
      }
      if(!rows.length)throw new Error('Catalog missing');
      const estimate=estimateQuote(parseState(rows[0].document).published,body.selection);
      if(estimate.version!==body.acceptedVersion)throw new QuoteError('El catálogo cambió. Revisa de nuevo el estimado antes de aceptarlo.',409);
      const [occupied]=await conn.execute<RowDataPacket[]>("SELECT id FROM service_events WHERE event_date=? AND status IN ('confirmed','blocked')",[estimate.selection.eventDate]);
      if(occupied.length)throw new QuoteError('La fecha ya no está disponible. Elige otra fecha; tu solicitud aún no se ha guardado.',409);
      const id=randomUUID(),createdAt=new Date().toISOString();
      const folio=`CO-${createdAt.slice(0,10).replaceAll('-','')}-${id.replaceAll('-','').toUpperCase()}`;
      await conn.execute('INSERT INTO quote_requests (id,folio,idempotency_key,payload_hash,estimate_snapshot,contact_document,consent_version,created_at) VALUES (?,?,?,?,?,?,?,?)',[id,folio,body.idempotencyKey,payloadHash,JSON.stringify(estimate),JSON.stringify(contact),estimate.demo?'local-demo-v1':'quote-consent-v1',createdAt]);
      await conn.commit();return {folio,createdAt,estimate};
    } catch(error){await conn.rollback();throw error;} finally {conn.release();}
  }
}
