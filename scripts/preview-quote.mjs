// Safe local review: real estimator, catalog fixture, no DB or submit endpoint.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { defaultCatalog } from '../src/admin/catalog.ts';
import { clientCatalog } from '../src/admin/clientCatalog.ts';
import { estimateItinerary } from '../server/itineraryEngine.ts';

const catalog = clientCatalog(defaultCatalog());
const port = 5191;
const server = await createServer({
  configFile: false,
  plugins: [react(), {
    name: 'safe-quote-preview',
    transformIndexHtml() {
      return [
        { tag: 'div', attrs: { role: 'status', style: 'position:fixed;bottom:0;left:0;right:0;z-index:10000;background:#d1b77e;color:#191b16;padding:8px;text-align:center;font:12px system-ui' }, children: 'Vista local de prueba · No guarda solicitudes ni envía mensajes', injectTo: 'body' },
        { tag: 'script', children: "document.addEventListener('click', function(event) { const link = event.target.closest('a'); if (link && (link.href.startsWith('https://wa.me/') || link.href.startsWith('mailto:'))) { event.preventDefault(); alert('Esta vista de prueba no envía mensajes.'); } }, true);", injectTo: 'body' }
      ];
    },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0];
        if (!path?.startsWith('/api/')) return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        try {
          if (req.method === 'GET' && path === '/api/local-editor/published') return res.end(JSON.stringify(catalog));
          if (req.method === 'GET' && path === '/api/local-editor/availability') return res.end(JSON.stringify({ days: {} }));
          if (req.method === 'POST' && path === '/api/local-editor/quotes/itinerary/estimate') {
            if (req.headers.origin !== `http://127.0.0.1:${port}`) { res.statusCode = 403; return res.end(JSON.stringify({ error: 'Origen no permitido.' })); }
            let body = '', bytes = 0;
            for await (const chunk of req) { bytes += chunk.length; if (bytes > 500_000) throw new Error('Solicitud demasiado grande.'); body += chunk.toString(); }
            return res.end(JSON.stringify(estimateItinerary(catalog, JSON.parse(body))));
          }
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Esta vista local de prueba no guarda solicitudes. Puedes revisar las cuatro etapas sin enviar datos reales.' }));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Revisa la selección.' }));
        }
      });
    }
  }],
  server: { host: '127.0.0.1', port, strictPort: true },
  logLevel: 'error'
});
await server.listen();
console.log(`Vista local segura: http://127.0.0.1:${port}/#cotizador`);
console.log('Catálogo del cliente como fixture; cálculo real. Sin acceso a MariaDB ni al VPS. Ctrl+C para cerrar.');
