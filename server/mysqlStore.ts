import type { Pool, RowDataPacket } from 'mysql2/promise';
import { validateCatalog, upgradeStoredCatalog } from '../src/admin/catalog';
import type { EditorialState } from './localStore';
import {jsonDocument} from './jsonDocument';
export function parseState(document: unknown): EditorialState {
  const state = jsonDocument(document) as EditorialState;
  state.draft=upgradeStoredCatalog(state.draft); state.published=upgradeStoredCatalog(state.published);
  if (state.previous !== null) state.previous=upgradeStoredCatalog(state.previous);
  if (!Number.isSafeInteger(state.revision) || state.revision < 0) throw new Error('Revisión inválida.');
  return state;
}
export class MysqlStore {
  constructor(private pool: Pool) {}
  async read() {
    const [rows] = await this.pool.execute<RowDataPacket[]>('SELECT document FROM editorial_state WHERE id=1');
    if (!rows.length) throw new Error('Primero ejecuta la migración local.');
    return parseState(rows[0].document);
  }
  async update(action: string, revision: unknown, draft: unknown, actorId: number) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute<RowDataPacket[]>('SELECT document FROM editorial_state WHERE id=1 FOR UPDATE');
      if (!rows.length) throw new Error('Catálogo no inicializado.');
      const state = parseState(rows[0].document);
      if (state.revision !== revision) throw new Error('CONFLICT: Otra pestaña guardó cambios. Conserva tu trabajo antes de recargar.');
      if (action === 'draft') {validateCatalog(draft);state.draft=draft;}
      else if (action === 'publish') {state.previous=state.published;state.published=structuredClone(state.draft);state.publishedAt=new Date().toISOString();}
      else if (action === 'restore' && state.previous) state.draft=structuredClone(state.previous);
      else throw new Error('Acción inválida o sin versión anterior.');
      state.revision++;
      await conn.execute('UPDATE editorial_state SET revision=?, document=? WHERE id=1',[state.revision,JSON.stringify(state)]);
      await conn.execute('INSERT INTO editorial_audit (actor_id, action, revision) VALUES (?,?,?)',[actorId,action,state.revision]);
      await conn.commit(); return state;
    } catch(error) {await conn.rollback();throw error;} finally {conn.release();}
  }
}
