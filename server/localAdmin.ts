import { loadEnv, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { LocalStore } from './localStore';
import { database } from './db';
import { authApp } from './authApp';

// Development adapter only. Production requires authenticated API + database.
export function localAdmin(): Plugin {
  return {name: 'restaurant-local-editor', apply: 'serve', configureServer(server) {
    const env = {...process.env,...loadEnv(server.config.mode,server.config.root,'')};
    if(env.EDITOR_STORAGE === 'mysql') {
      const pool = database(env);
      const ready = authApp(pool,env.SESSION_SECRET ?? '');
      server.httpServer?.once('close',()=>{void pool.end();});
      server.middlewares.use('/api/local-editor',(req,res)=>{
        void ready.then(app=>app(req,res)).catch(()=>{res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'No se pudo iniciar el acceso administrativo.'}));});
      });
      return;
    }
    if(env.EDITOR_STORAGE && env.EDITOR_STORAGE !== 'file') throw new Error('EDITOR_STORAGE debe ser file o mysql.');
    const store = new LocalStore(resolve(server.config.root, '.local-data/catalog.json'));
    server.middlewares.use('/api/local-editor', async (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      const send = (status: number, data: unknown) => {res.statusCode = status; res.end(JSON.stringify(data));};
      const host = req.headers.host;
      const origin = req.headers.origin;
      const remote = req.socket.remoteAddress;
      if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote ?? '') ||
          host !== '127.0.0.1:5180' || (origin && origin !== 'http://127.0.0.1:5180')) {
        send(403, {error: 'Editor disponible solo en la dirección local del restaurante.'}); return;
      }
      try {
        if (req.method === 'GET') {
          if (req.url === '/mode') {send(200,{storage:'file',authentication:false});return;}
          const state = store.read();
          if (req.url === '/published') send(200, state.published);
          else if (req.url === '/draft') send(200, state.draft);
          else if (req.url === '/state') send(200, state);
          else send(404, {error: 'Ruta desconocida.'});
          return;
        }
        if (req.method !== 'POST') {send(405, {error: 'Método no permitido.'}); return;}
        if (origin !== 'http://127.0.0.1:5180' || req.headers['content-type'] !== 'application/json') {
          send(403, {error: 'Origen o formato no permitido.'}); return;
        }
        let body = ''; let size = 0;
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk);
          if (size > 512000) {send(413, {error: 'Contenido demasiado grande.'}); return;}
          body += chunk;
        }
        const input = JSON.parse(body);
        const state = store.update((req.url ?? '').slice(1), input.revision, input.draft);
        send(200, state);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo guardar.';
        send(message.startsWith('CONFLICT:') ? 409 : 400, {error: message});
      }
    });
  }};
}
