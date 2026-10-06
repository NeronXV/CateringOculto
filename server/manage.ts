import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { database } from './db';
import { LocalStore } from './localStore';
import type { RowDataPacket } from 'mysql2/promise';
import {runtimeEnv} from './runtime';
const pool = database(runtimeEnv());
try {
  const command = process.argv[2];
  if (command !== 'migrate') throw new Error('Comando permitido: migrate');
  const conn = await pool.getConnection();
  try {
    const [lock] = await conn.query<RowDataPacket[]>("SELECT GET_LOCK('restauran_migrations',10) AS acquired");
    if (lock[0].acquired !== 1) throw new Error('Otra migración está en curso.');
    await conn.query('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(80) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    for (const version of ['001-foundation','002-quotes','003-inbox','004-two-roles','005-operations']) {
    const [versions] = await conn.query<RowDataPacket[]>('SELECT version FROM schema_migrations WHERE version=?',[version]);
    if (!versions.length) {
      const sql = readFileSync(resolve(`server/migrations/${version}.sql`),'utf8');
      for (const statement of sql.split(';').map(s=>s.trim()).filter(Boolean)) await conn.query(statement);
      await conn.execute('INSERT INTO schema_migrations (version) VALUES (?)',[version]);
    }
    }
    // Read/validate legacy first; never overwrite an existing DB catalog.
    const [existing] = await conn.query<RowDataPacket[]>('SELECT id FROM editorial_state WHERE id=1');
    if (!existing.length) {
      const legacy = new LocalStore(resolve('.local-data/catalog.json')).read();
      await conn.execute('INSERT INTO editorial_state (id,revision,document) VALUES (1,?,?)',[legacy.revision,JSON.stringify(legacy)]);
      console.log('Catálogo importado. El archivo original se conserva sin cambios.');
    }
    await conn.execute('DELETE FROM staff_sessions WHERE expires_at<?',[Date.now()]);
    console.log('Migración completada; no se han creado usuarios ni contraseñas administrativas.');
  } finally {await conn.query("SELECT RELEASE_LOCK('restauran_migrations')");conn.release();}
} catch {console.error('No se pudo completar la migración. Revisa que MariaDB esté iniciado y la configuración local sea correcta.');process.exitCode=1;}
finally {await pool.end();}
