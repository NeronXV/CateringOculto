import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { defaultCatalog, validateCatalog, upgradeStoredCatalog, type Catalog } from '../src/admin/catalog';

export interface EditorialState {
  revision: number; publishedAt: string | null; draft: Catalog; published: Catalog; previous: Catalog | null;
}
export class LocalStore {
  constructor(private file: string) {}
  read(): EditorialState {
    if (!existsSync(this.file)) return {revision: 0, publishedAt: null, draft: defaultCatalog(), published: defaultCatalog(), previous: null};
    const state = JSON.parse(readFileSync(this.file, 'utf8')) as EditorialState;
    state.draft=upgradeStoredCatalog(state.draft); state.published=upgradeStoredCatalog(state.published);
    if (state.previous) state.previous=upgradeStoredCatalog(state.previous);
    if (!Number.isSafeInteger(state.revision) || state.revision < 0) throw new Error('Revisión inválida.');
    return state;
  }
  update(action: string, revision: unknown, draft?: unknown): EditorialState {
    const state = this.read();
    if (revision !== state.revision) throw new Error('CONFLICT: Otra pestaña guardó cambios. Recarga el panel antes de continuar.');
    if (action === 'draft') { validateCatalog(draft); state.draft = draft; }
    else if (action === 'publish') {
      state.previous = state.published;
      state.published = structuredClone(state.draft);
      state.publishedAt = new Date().toISOString();
    } else if (action === 'restore') {
      if (!state.previous) throw new Error('No hay una publicación anterior.');
      // Restore into draft for review; never replace the public version silently.
      state.draft = structuredClone(state.previous);
    } else throw new Error('Acción desconocida.');
    state.revision++;
    mkdirSync(dirname(this.file), {recursive: true});
    writeFileSync(`${this.file}.tmp`, JSON.stringify(state, null, 2), {mode: 0o600});
    renameSync(`${this.file}.tmp`, this.file);
    return state;
  }
}
