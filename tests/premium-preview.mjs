// Loopback-only UI fixture. In-memory data; never sends WhatsApp/email or uses SQL.
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {defaultCatalog,validateCatalog} from '../src/admin/catalog.ts';
import {clientCatalog} from '../src/admin/clientCatalog.ts';
import {estimateQuote} from '../server/quoteEngine.ts';
const catalog=clientCatalog(defaultCatalog());
let state={revision:1,publishedAt:new Date().toISOString(),published:catalog,draft:structuredClone(catalog),previous:null};
let staff=[{id:1,name:'Chef Carlos (prueba)',email:'carlos@example.test',role:'admin',active:true},{id:2,name:'Chef Karen (prueba)',email:'karen@example.test',role:'editor',active:true}];
const events=[];
const fixture={name:'premium-fixture',configureServer(server){
  server.middlewares.use('/premium-fixture',async(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/premium-fixture','<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/tests/premiumFixture.tsx"></script></html>'));});
  server.middlewares.use('/api/local-editor',async(req,res)=>{
    res.setHeader('Content-Type','application/json');
    try {
      let raw='';for await(const part of req)raw+=part;const body=raw?JSON.parse(raw):{};
      let result;
      if(req.url.startsWith('/availability?'))result={month:new URL('http://localhost'+req.url).searchParams.get('month'),days:{}};
      else if(req.url.startsWith('/events?'))result=events;
      else if(req.url==='/events'){const id=crypto.randomUUID();events.push({id,quoteId:body.quoteId,folio:'EV-VISUAL',revision:0,data:body.data,proposalVersion:0,published:null,proposals:[],activity:[]});result={id};}
      else if(req.url.startsWith('/events/')){const event=events.find(e=>e.id===req.url.split('/')[2]);if(!event)throw new Error('Evento no encontrado');if(req.url.endsWith('/link')){event.revision++;result={token:'1'.repeat(64)};}else if(req.method==='GET')result=event;else{event.data=body.data;event.revision++;if(body.publish){event.proposalVersion++;event.published={folio:event.folio,version:event.proposalVersion,date:event.data.date,guests:event.data.guests,schedule:event.data.schedule,proposal:event.data.proposal,notes:event.data.publicNotes,totalCents:event.data.totalCents};event.proposals.push(event.published);}result={ok:true};}}
      else if(req.url==='/tracking/read'){const event=events[0];result={folio:event?.folio,status:event?.data.status,proposal:event?.published,depositCents:event?.data.depositCents,holdUntil:event?.data.holdUntil};}
      else if(req.url==='/users' && req.method==='GET')result=staff;
      else if(req.url==='/users'){const id=staff.length+1;staff.push({id,name:body.name,email:body.email,role:body.role,active:true});result={id};}
      else if(req.url.startsWith('/users/')){const user=staff.find(u=>u.id===Number(req.url.split('/').pop()));Object.assign(user,body);result={ok:true};}
      else if(req.url==='/state')result=state;
      else if(req.url==='/quotes/estimate')result=estimateQuote(state.published,body);
      else if(req.url==='/quotes/submit')result={folio:'CO-PRUEBA-VISUAL',createdAt:new Date().toISOString(),estimate:estimateQuote(state.published,body.selection)};
      else if(req.url==='/draft'){validateCatalog(body.draft);state={...state,revision:state.revision+1,draft:body.draft};result=state;}
      else if(req.url==='/publish'){state={...state,revision:state.revision+1,previous:state.published,published:structuredClone(state.draft)};result=state;}
      else {res.statusCode=404;result={error:'Ruta de prueba no disponible'};}
      res.end(JSON.stringify(result));
    }catch(error){res.statusCode=400;res.end(JSON.stringify({error:error.message}));}
  });
}};
const server=await createServer({configFile:false,plugins:[react(),fixture],server:{host:'127.0.0.1',port:5183,strictPort:true},logLevel:'error'});
await server.listen();console.log('UI fixture: http://127.0.0.1:5183/premium-fixture');
