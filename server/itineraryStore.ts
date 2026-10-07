import { randomUUID } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { jsonDocument } from './jsonDocument';
import { parseState } from './mysqlStore';
import { digest, exactKeys, object, QuoteError, textField } from './quoteEngine';
import { estimateItinerary } from './itineraryEngine';
import type { ItineraryReceipt } from '../src/types/itinerary';

export class ItineraryStore {
  constructor(private pool: Pool) {}

  async submit(input: unknown): Promise<ItineraryReceipt> {
    const body = object(input);
    exactKeys(body, ['selection', 'contact', 'acceptedVersion', 'idempotencyKey', 'consent']);

    if (
      typeof body.idempotencyKey !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(body.idempotencyKey)
    ) {
      throw new QuoteError('Clave de solicitud inválida.');
    }

    if (body.consent !== true || typeof body.acceptedVersion !== 'string' || !/^[a-f0-9]{64}$/.test(body.acceptedVersion)) {
      throw new QuoteError('Revisa y acepta el resumen de tu solicitud y el guardado de tus datos.');
    }

    const c = object(body.contact);
    exactKeys(c, ['name', 'phone', 'dietaryRestrictions', 'additionalNotes']);
    const contact = {
      name: textField(c.name, 100, true),
      phone: textField(c.phone, 30, true),
      dietaryRestrictions: textField(c.dietaryRestrictions, 2000),
      additionalNotes: textField(c.additionalNotes, 2000)
    };

    if (
      !/^\+?[\d ()-]+$/.test(contact.phone) ||
      contact.phone.replace(/\D/g, '').length < 10 ||
      contact.phone.replace(/\D/g, '').length > 15
    ) {
      throw new QuoteError('Escribe un teléfono o WhatsApp de contacto válido de 10 a 15 dígitos.');
    }

    const canonical = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(canonical)
        : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, canonical(v)])
          )
        : value;

    const payloadHash = digest(
      canonical({
        selection: body.selection,
        contact,
        acceptedVersion: body.acceptedVersion,
        consent: true
      })
    );

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute<RowDataPacket[]>('SELECT document FROM editorial_state WHERE id=1 FOR UPDATE');
      if (!rows.length) throw new Error('Catalog missing');

      const [existing] = await conn.execute<RowDataPacket[]>(
        'SELECT folio,created_at,estimate_snapshot,payload_hash FROM quote_requests WHERE idempotency_key=?',
        [body.idempotencyKey]
      );

      if (existing.length) {
        const row = existing[0];
        if (row.payload_hash !== payloadHash) {
          throw new QuoteError('Esta clave ya se utilizó para otra solicitud.', 409);
        }
        await conn.commit();
        return {
          folio: row.folio,
          createdAt: row.created_at,
          estimate: jsonDocument(row.estimate_snapshot)
        };
      }

      const publishedCatalog = parseState(rows[0].document).published;
      const estimate = estimateItinerary(publishedCatalog, body.selection);

      if (estimate.version !== body.acceptedVersion) {
        throw new QuoteError('El catálogo se actualizó. Por favor revisa y vuelve a confirmar tu solicitud.', 409);
      }

      const requestedDates = estimate.selection.days.map(d => d.date);
      if (requestedDates.length > 0) {
        const placeholders = requestedDates.map(() => '?').join(',');
        const [occupied] = await conn.execute<RowDataPacket[]>(
          `SELECT event_date FROM service_events WHERE event_date IN (${placeholders}) AND status IN ('confirmed','blocked')`,
          requestedDates
        );

        if (occupied.length > 0) {
          const busyDates = occupied.map(r => r.event_date).join(', ');
          throw new QuoteError(
            `La fecha ${busyDates} ya no se encuentra disponible. Por favor elige otra fecha o consúltanos directamente.`,
            409
          );
        }
      }

      const id = randomUUID();
      const createdAt = new Date().toISOString();
      const folio = `CO-${createdAt.slice(0, 10).replaceAll('-', '')}-${id.replaceAll('-', '').toUpperCase()}`;

      await conn.execute(
        'INSERT INTO quote_requests (id,folio,idempotency_key,payload_hash,estimate_snapshot,contact_document,consent_version,created_at) VALUES (?,?,?,?,?,?,?,?)',
        [
          id,
          folio,
          body.idempotencyKey,
          payloadHash,
          JSON.stringify(estimate),
          JSON.stringify(contact),
          'itinerary-v1',
          createdAt
        ]
      );

      await conn.commit();
      return { folio, createdAt, estimate };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
