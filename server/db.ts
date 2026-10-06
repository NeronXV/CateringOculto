import { createPool } from 'mysql2/promise';
export function database(env: Record<string,string|undefined>) {
  for (const key of ['DB_HOST','DB_NAME','DB_USER','DB_PASSWORD']) if (!env[key]) throw new Error(`Falta configurar ${key}.`);
  const port = Number(env.DB_PORT ?? 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto de base de datos inválido.');
  return createPool({host:env.DB_HOST,port,user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_NAME,
    charset:'utf8mb4',connectionLimit:5,connectTimeout:5000,multipleStatements:false});
}
