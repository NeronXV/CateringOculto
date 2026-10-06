import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd=fileURLToPath(new URL('..',import.meta.url));
async function run(args) {
  const child=spawn(process.execPath,args,{cwd,stdio:'inherit',windowsHide:true});
  return new Promise((resolve,reject)=>{
    child.once('error',reject);
    child.once('exit',(code)=>code===0?resolve():reject(new Error('No se pudo completar el arranque local.')));
  });
}
try {
  await run(['scripts/native-db.mjs']);
  await run(['--env-file=.env.local','--import','tsx','server/manage.ts','migrate']);
  // Reuse only a responding restaurant server; never stop another project's process.
  let running=false;
  try {
    const response=await fetch('http://127.0.0.1:5180/api/local-editor/mode',{signal:AbortSignal.timeout(3000)});
    const mode=await response.json();running=response.ok && mode.storage==='mysql' && mode.authentication===true;
  } catch {}
  if(running) {
    const response=await fetch('http://127.0.0.1:5180/api/local-editor/auth/status',{signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error('La web está activa pero el acceso no responde. Revisa el servicio local.');
    console.log('Restaurante listo: http://127.0.0.1:5180/');
    console.log('Panel: http://127.0.0.1:5180/admin — recarga la página o pulsa Reintentar conexión.');
  } else {
    console.log('Iniciando restaurante. Mantén esta terminal abierta mientras haces pruebas.');
    await run(['node_modules/vite/bin/vite.js','--host','127.0.0.1']);
  }
} catch {
  console.error('Arranque incompleto. Revisa el mensaje del paso anterior; no se han cambiado tus credenciales.');
  process.exitCode=1;
}
