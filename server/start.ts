import {resolve} from 'node:path';
import {database} from './db';
import {runtimeEnv,serverOptions} from './runtime';
import {application} from './app';
try {
  const env=runtimeEnv(),options=serverOptions(env),pool=database(env);
  const port=Number(env.PORT ?? 3000);
  if(!Number.isInteger(port) || port<1 || port>65535)throw new Error('Puerto inválido.');
  const app=await application(pool,env.SESSION_SECRET ?? '',resolve(env.MEDIA_DIRECTORY ?? '.local-data/media'),options);
  const server=app.listen(port,env.BIND_HOST ?? '0.0.0.0',()=>console.log('Aplicación iniciada.'));
  let stopping=false;
  const stop=()=>{if(stopping)return;stopping=true;server.close(()=>{void pool.end().then(()=>process.exit(0));});setTimeout(()=>process.exit(1),10000).unref();};
  process.on('SIGTERM',stop);process.on('SIGINT',stop);
  server.on('error',()=>{console.error('No se pudo iniciar el servicio HTTP.');void pool.end().then(()=>process.exit(1));});
} catch {console.error('No se pudo iniciar la aplicación. Revisa configuración y servicios.');process.exit(1);}
