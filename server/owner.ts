import {hash,argon2id} from 'argon2';
import type {RowDataPacket} from 'mysql2/promise';
import {database} from './db';
import {runtimeEnv} from './runtime';
import {accountInput} from './authApp';
const pool=database(runtimeEnv());
try {
  let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>4096)throw new Error('Entrada demasiado larga.');}
  const account=accountInput(JSON.parse(input)),passwordHash=await hash(account.password,{type:argon2id});
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [state]=await conn.query<RowDataPacket[]>('SELECT id FROM editorial_state WHERE id=1 FOR UPDATE');
    if(!state.length)throw new Error('Migración pendiente.');
    const [users]=await conn.query<RowDataPacket[]>('SELECT id FROM staff_users LIMIT 1');
    if(users.length)throw new Error('El propietario ya existe.');
    await conn.execute('INSERT INTO staff_users (email,name,password_hash,role) VALUES (?,?,?,?)',[account.email,account.name,passwordHash,'admin']);
    await conn.commit();console.log('Propietario creado.');
  } catch(error){await conn.rollback();throw error;}finally{conn.release();}
}catch{console.error('No se creó la cuenta. Revisa datos, migración y existencia de un propietario.');process.exitCode=1;}finally{await pool.end();}
