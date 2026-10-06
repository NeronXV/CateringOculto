import { readFileSync } from 'node:fs';
export function runtimeEnv(source:NodeJS.ProcessEnv=process.env) {
  const env={...source};
  for(const key of ['DB_PASSWORD','SESSION_SECRET']) {
    if(env[`${key}_FILE`])env[key]=readFileSync(env[`${key}_FILE`]!,'utf8').trim();
  }
  return env;
}
export function serverOptions(env:NodeJS.ProcessEnv) {
  const origin=new URL(env.PUBLIC_ORIGIN ?? '');
  if(origin.origin!==env.PUBLIC_ORIGIN || origin.username || origin.password)throw new Error('PUBLIC_ORIGIN inválido.');
  const local=env.APP_ENV==='local';
  if(origin.protocol!=='https:' && !(local && origin.protocol==='http:' && ['127.0.0.1','localhost'].includes(origin.hostname)))throw new Error('Se requiere HTTPS; HTTP solo está permitido en pruebas locales.');
  return {origin:origin.origin,localOnly:false,secureCookies:origin.protocol==='https:',allowSetup:false,trustProxy:env.TRUST_PROXY?.split(',').filter(Boolean) ?? false as false};
}
