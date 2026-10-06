// One-time initial catalog import. Never overwrite an existing editorial workflow.
import {database} from './db';
import {runtimeEnv} from './runtime';
import {parseState} from './mysqlStore';
import {validateCatalog} from '../src/admin/catalog';
import {clientCatalog} from '../src/admin/clientCatalog';
import type {RowDataPacket} from 'mysql2/promise';
const pool=database(runtimeEnv());
try {
  if(process.argv[2]!=='--initial-publish-client')throw new Error('Explicit initial import flag required');
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows]=await conn.query<RowDataPacket[]>('SELECT document FROM editorial_state WHERE id=1 FOR UPDATE');
    const [users]=await conn.query<RowDataPacket[]>('SELECT id FROM staff_users LIMIT 1');
    if(!rows.length || users.length)throw new Error('Use authenticated editorial import');
    const state=parseState(rows[0].document);
    if(state.revision!==0 || state.publishedAt)throw new Error('Existing editorial changes');
    const next=clientCatalog(state.published);validateCatalog(next);
    state.previous=structuredClone(state.published);state.published=next;state.draft=structuredClone(next);state.publishedAt=new Date().toISOString();state.revision=1;
    await conn.execute('UPDATE editorial_state SET revision=?,document=? WHERE id=1',[1,JSON.stringify(state)]);
    await conn.commit();console.log('Catálogo del cliente publicado inicialmente; anterior conservado, impuestos/traslado/cenas pendientes.');
  } catch(error){await conn.rollback();throw error;} finally {conn.release();}
} catch {console.error('Importación no realizada. Requiere catálogo inicial sin ediciones ni cuentas; utiliza el panel si ya existe trabajo editorial.');process.exitCode=1;}
finally{await pool.end();}
