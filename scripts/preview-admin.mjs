import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {adminFixture} from './admin-fixture.ts';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export async function startAdminPreview(port=5194) {
const fixture=adminFixture();
const server=await createServer({configFile:false,plugins:[react(),{
  name:'isolated-admin-preview',
  transformIndexHtml(){return [
    {tag:'div',attrs:{role:'status',style:'position:fixed;bottom:0;left:0;right:0;z-index:10000;background:#d1b77e;color:#191b16;padding:8px;text-align:center;font:12px system-ui'},children:'Panel ficticio · Cambios solo en memoria · Sin base de datos ni mensajes',injectTo:'body'},
    {tag:'script',children:"document.addEventListener('click',function(event){const link=event.target.closest('a');if(link&&(link.href.startsWith('https://wa.me/')||link.href.startsWith('mailto:')||link.href.startsWith('tel:'))){event.preventDefault();alert('Contacto deshabilitado: todos los clientes son ficticios.');}},true);",injectTo:'body'}
  ];},
  configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
    const url=new URL(req.url??'/',`http://127.0.0.1:${port}`);
    if(!url.pathname.startsWith('/api/'))return next();
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    try{
      if(!url.pathname.startsWith('/api/local-editor/'))throw Object.assign(new Error('Ruta deshabilitada.'),{status:403});
      let body;
      if(req.method==='POST'){
        if(req.headers.origin!==`http://127.0.0.1:${port}`)throw Object.assign(new Error('Origen no permitido.'),{status:403});
        let raw='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>500000)throw Error('Solicitud demasiado grande.');raw+=chunk.toString();}body=JSON.parse(raw);
      }
      res.end(JSON.stringify(fixture.handle(url.pathname.slice('/api/local-editor/'.length),req.method??'GET',body,url.searchParams)));
    }catch(error){res.statusCode=error.status??400;res.end(JSON.stringify({error:error.message}));}
  });}
}],server:{host:'127.0.0.1',port,strictPort:true},logLevel:'error'});
await server.listen();
return server;
}
if(resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)) {
await startAdminPreview();
const port=5194;
console.log(`Panel local ficticio: http://127.0.0.1:${port}/admin`);
console.log('Acceso simulado. No lee .env, no conecta a MariaDB ni al VPS. Cerrar reinicia todos los cambios ficticios. Ctrl+C para detener.');
}
