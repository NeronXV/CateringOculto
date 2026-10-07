import {Operations,registerPublicOperations,registerPrivateOperations} from './operations';
import {registerUsers} from './users';
import express from 'express';
import session from 'express-session';
import { rateLimit } from 'express-rate-limit';
import { hash, verify, argon2id } from 'argon2';
import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { MysqlSessions } from './mysqlSessions';
import { MysqlStore } from './mysqlStore';
import { MediaStore, MAX_IMAGE_BYTES, mediaId } from './media';
import { resolve } from 'node:path';
import { hasPublishedImage } from '../src/admin/catalog';
import { estimateQuote, QuoteError } from './quoteEngine';
import { QuoteStore } from './quoteStore';
import { estimateItinerary } from './itineraryEngine';
import { ItineraryStore } from './itineraryStore';
import { InboxStore } from './inboxStore';

declare module 'express-session' {
  interface SessionData { userId?: number; issuedAt?: number; }
}
type Role = 'admin' | 'editor';
export function canEdit(role: string) {return role === 'admin' || role === 'editor';}
export function accountInput(body: unknown) {
  if (!body || typeof body !== 'object') throw new Error('Datos de cuenta inválidos.');
  const input = body as Record<string,unknown>;
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const password = input.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || !name || name.length>80 || typeof password!=='string' || password.length<12 || password.length>128) throw new Error('Escribe nombre, correo válido y una contraseña de 12 a 128 caracteres.');
  return {email,name,password};
}
export interface AuthOptions {origin:string;localOnly:boolean;secureCookies:boolean;allowSetup:boolean;trustProxy:false|string[];}
export async function authApp(pool: Pool, secret: string, mediaDirectory = resolve('.local-data/media'), options:AuthOptions={origin:'http://127.0.0.1:5180',localOnly:true,secureCookies:false,allowSetup:true,trustProxy:false}) {
  if (secret.length < 32) throw new Error('Configura SESSION_SECRET con al menos 32 caracteres.');
  const app = express();
  app.set('trust proxy',options.trustProxy);
  const store = new MysqlStore(pool);
  const media = new MediaStore(mediaDirectory);
  const dummyHash = await hash('invalid-login-placeholder',{type:argon2id});
  app.disable('x-powered-by');
  app.use((req,res,next)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const origin = req.headers.origin;
    if (req.headers.host!==new URL(options.origin).host || (options.localOnly && !['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '')) ||
        (origin && origin!==options.origin) ||
        (!['GET','HEAD'].includes(req.method) && (origin!==options.origin || !(req.is('application/json') || (req.path==='/media' && req.is('application/octet-stream')))))) {
      res.status(403).json({error:'Origen no permitido.'});return;
    } next();
  });
  app.use(express.json({limit:'500kb'}));
  app.get('/mode',(_req,res)=>res.json({storage:'mysql',authentication:true}));
  app.get('/published',async(_req,res)=>res.json((await store.read()).published));
  const operations=new Operations(pool);
  registerPublicOperations(app,operations);
  const quotes = new QuoteStore(pool);
  const itineraries = new ItineraryStore(pool);
  const quoteLimit=rateLimit({windowMs:60_000,limit:30,legacyHeaders:false,message:{error:'Espera un minuto antes de volver a calcular o guardar.'}});
  app.post('/quotes/estimate',quoteLimit,async(req,res)=>res.json(estimateQuote((await store.read()).published,req.body)));
  app.post('/quotes/submit',quoteLimit,async(req,res)=>res.status(201).json(await quotes.submit(req.body)));
  app.post('/quotes/itinerary/estimate',quoteLimit,async(req,res)=>res.json(estimateItinerary((await store.read()).published,req.body)));
  app.post('/quotes/itinerary/submit',quoteLimit,async(req,res)=>res.status(201).json(await itineraries.submit(req.body)));
  app.use(session({name:'restauran.sid',secret,store:new MysqlSessions(pool),resave:false,saveUninitialized:false,
    cookie:{httpOnly:true,sameSite:'strict',secure:options.secureCookies,maxAge:8*60*60*1000,path:'/'}}));
  app.get('/media/:id',async(req,res)=>{
    const id=String(req.params.id);
    if(!mediaId.test(id)){res.status(404).end();return;}
    const url=`/api/local-editor/media/${id}`;
    const published=(await store.read()).published;
    const visible=hasPublishedImage(published,url);
    if(!visible) {
      if(!req.session.userId || Date.now()-(req.session.issuedAt ?? 0)>=8*60*60*1000){res.status(404).end();return;}
      const [users]=await pool.execute<RowDataPacket[]>('SELECT id,name,email,role FROM staff_users WHERE id=? AND active=TRUE',[req.session.userId]);
      if(!users.length || !canEdit(users[0].role)){res.status(404).end();return;}
    }
    res.type('webp').sendFile(resolve(mediaDirectory,id),error=>{if(error && !res.headersSent)res.status(404).end();});
  });
  const limiter = rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Demasiados intentos. Espera 15 minutos antes de volver a intentar.'}});
  app.get('/auth/status',async(req,res)=>{
    const [count] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM staff_users');
    let user = null;
    if(req.session.userId && Date.now()-(req.session.issuedAt ?? 0)<8*60*60*1000) {
      const [users] = await pool.execute<RowDataPacket[]>('SELECT id,name,email,role FROM staff_users WHERE id=? AND active=TRUE',[req.session.userId]);
      user=users[0] ?? null;
    }
    res.json({setupRequired:options.allowSetup && count[0].total===0,setupDisabled:!options.allowSetup && count[0].total===0,user});
  });
  app.post('/auth/setup',limiter,async(req,res)=>{
    if(!options.allowSetup){res.status(403).json({error:'El propietario se crea mediante el comando administrativo del servidor.'});return;}
    const input = accountInput(req.body);
    const passwordHash = await hash(input.password,{type:argon2id});
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Singleton lock serializes the one-time bootstrap, including concurrent requests.
      const [state] = await conn.query<RowDataPacket[]>('SELECT id FROM editorial_state WHERE id=1 FOR UPDATE');
      if (!state.length) throw new Error('Primero ejecuta la migración.');
      const [users] = await conn.query<RowDataPacket[]>('SELECT id FROM staff_users LIMIT 1');
      if(users.length){await conn.rollback();res.status(409).json({error:'La cuenta inicial ya existe.'});return;}
      await conn.execute('INSERT INTO staff_users (email,name,password_hash,role) VALUES (?,?,?,?)',[input.email,input.name,passwordHash,'admin']);
      await conn.commit();res.status(201).json({ok:true});
    } catch(error){await conn.rollback();throw error;} finally{conn.release();}
  });
  app.post('/auth/login',limiter,async(req,res,next)=>{
    const email = typeof req.body?.email==='string' ? req.body.email.trim().toLowerCase().slice(0,254) : '';
    const password = typeof req.body?.password==='string' && req.body.password.length<=128 ? req.body.password : '';
    const [users] = await pool.execute<RowDataPacket[]>('SELECT id,password_hash,active FROM staff_users WHERE email=?',[email]);
    const user=users[0];
    const valid = await verify(user?.password_hash ?? dummyHash,password);
    if(!user || !user.active || !valid){res.status(401).json({error:'Correo o contraseña incorrectos.'});return;}
    req.session.regenerate(error=>{
      if(error){next(error);return;}
      req.session.userId=user.id;req.session.issuedAt=Date.now();
      req.session.save(error=>{if(error)next(error);else res.json({ok:true});});
    });
  });
  app.post('/auth/logout',(req,res,next)=>req.session.destroy(error=>{
    if(error){next(error);return;}res.clearCookie('restauran.sid',{path:'/',httpOnly:true,sameSite:'strict'}).json({ok:true});
  }));
  app.use(async(req,res,next)=>{
    if(!req.session.userId || Date.now()-(req.session.issuedAt ?? 0)>=8*60*60*1000){res.status(401).json({error:'Inicia sesión para continuar.'});return;}
    const [users] = await pool.execute<RowDataPacket[]>('SELECT id,name,email,role FROM staff_users WHERE id=? AND active=TRUE',[req.session.userId]);
    if(!users.length){res.status(401).json({error:'La cuenta no está disponible.'});return;}
    res.locals.user=users[0];next();
  });
  const inbox=new InboxStore(pool);
  app.use('/inbox',(_req,res,next)=>{
    if(!['admin','editor'].includes(res.locals.user.role)){res.status(403).json({error:'Tu cuenta no tiene permiso para consultar solicitudes.'});return;}
    next();
  });
  app.get('/inbox',async(req,res)=>res.json(await inbox.list(req.query)));
  app.get('/inbox/staff',async(_req,res)=>res.json(await inbox.staff()));
  app.get('/inbox/:id',async(req,res)=>res.json(await inbox.detail(String(req.params.id))));
  app.post('/inbox/:id',async(req,res)=>res.json(await inbox.update(String(req.params.id),req.body,res.locals.user)));
  registerUsers(app,pool);
  registerPrivateOperations(app,operations);
  app.use((_req,res,next)=>{if(!canEdit(res.locals.user.role)){res.status(403).json({error:'Tu cuenta no tiene permiso para editar el sitio.'});return;}next();});
  app.post('/media',rateLimit({windowMs:60_000,limit:20,legacyHeaders:false,message:{error:'Espera un minuto antes de subir más fotografías.'}}),express.raw({type:'application/octet-stream',limit:MAX_IMAGE_BYTES}),async(req,res)=>{
    try {res.status(201).json(await media.save(req.body));}
    catch {res.status(400).json({error:'No se pudo subir la fotografía. Usa JPG, PNG o WebP sin animación, hasta 8 MB y 24 megapíxeles. Si persiste, revisa el espacio local.'});}
  });
  app.get('/state',async(_req,res)=>res.json(await store.read()));
  app.get('/draft',async(_req,res)=>res.json((await store.read()).draft));
  for(const action of ['draft','publish','restore']) app.post(`/${action}`,async(req,res)=>{
    try {res.json(await store.update(action,req.body?.revision,req.body?.draft,res.locals.user.id));}
    catch(error){
      const message=error instanceof Error ? error.message : '';
      // Domain validation messages are safe; database diagnostics are not returned.
      if(message.startsWith('CONFLICT:'))res.status(409).json({error:message});
      else res.status(400).json({error:'No se pudo guardar. Revisa los campos y la conexión a la base de datos.'});
    }
  });
  app.use((_req,res)=>res.status(404).json({error:'Ruta no encontrada.'}));
  app.use((error: unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
    if(error instanceof QuoteError){res.status(error.status).json({error:error.message});return;}
    if(error && typeof error==='object' && 'type' in error && error.type==='entity.too.large'){res.status(413).json({error:'Archivo demasiado grande. El máximo es 8 MB.'});return;}
    const malformed=error instanceof SyntaxError;
    res.status(malformed ? 400 : 503).json({error:malformed ? 'Formato inválido.' : 'No se pudo completar la operación. Revisa los datos o la conexión local.'});
  });
  return app;
}
