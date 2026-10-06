import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import type { Pool } from 'mysql2/promise';
import { createConnection, createPool } from 'mysql2/promise';
import { readFileSync, mkdtempSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { MediaStore, mediaId } from '../server/media';
import { authApp, canEdit, accountInput } from '../server/authApp';
import { defaultCatalog } from '../src/admin/catalog';
import { testQuoteIntegration } from './quoteIntegration';
import { testInbox } from './inbox';
import {testOperations} from './operations';
import {testUserRoles} from './userRoles';
import {testPremiumIntegration} from './premiumIntegration';

// HTTP/auth contract tests with a fake SQL adapter. Not MariaDB integration.
const users: Array<{id:number;email:string;name:string;password_hash:string;role:string;active:boolean}>=[];
const sessions=new Map<string,{expires:number;document:string}>();
const document=JSON.stringify({revision:0,publishedAt:null,draft:defaultCatalog(),published:defaultCatalog(),previous:null});
async function execute(sql:string,args:unknown[]=[]) : Promise<any> {
  if(sql.startsWith('SELECT COUNT'))return [[{total:users.length}]];
  if(sql.startsWith('SELECT document FROM editorial_state'))return [[{document}]];
  if(sql.startsWith('SELECT id FROM editorial_state'))return [[{id:1}]];
  if(sql==='SELECT id FROM staff_users LIMIT 1')return [users.slice(0,1).map(u=>({id:u.id}))];
  if(sql.startsWith('SELECT id,role,active FROM staff_users WHERE'))return [users.filter(u=>u.id===args[0]).map(({id,role,active})=>({id,role,active}))];
  if(sql.startsWith('INSERT INTO staff_access_audit'))return [{}];
  if(sql.startsWith('SELECT id,password_hash'))return [users.filter(u=>u.email===args[0])];
  if(sql.startsWith('SELECT id,name,email,role FROM staff_users'))return [users.filter(u=>u.id===args[0] && u.active).map(({id,name,email,role})=>({id,name,email,role}))];
  if(sql.startsWith('SELECT id,name,email,role,active'))return [users.map(({id,name,email,role,active})=>({id,name,email,role,active}))];
  if(sql.startsWith('INSERT INTO staff_users')){
    if(users.some(u=>u.email===args[0]))throw Object.assign(new Error('Duplicate'),{code:'ER_DUP_ENTRY'});
    const id=users.length+1;users.push({id,email:String(args[0]),name:String(args[1]),password_hash:String(args[2]),role:String(args[3]),active:true});return [{insertId:id}];
  }
  if(sql.startsWith('SELECT document FROM staff_sessions')){const s=sessions.get(String(args[0]));return [s && s.expires>Number(args[1])?[{document:s.document}]:[]];}
  if(sql.startsWith('INSERT INTO staff_sessions')){sessions.set(String(args[0]),{expires:Number(args[1]),document:String(args[2])});return [{}];}
  if(sql.startsWith('DELETE FROM staff_sessions')){sessions.delete(String(args[0]));return [{}];}
  throw new Error(`Unexpected SQL in fake adapter: ${sql}`);
}
const fake={query:execute,execute,getConnection:async()=>({query:execute,execute,beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{}})} as unknown as Pool;
const integration=process.env.AUTH_TEST_MYSQL==='1';
let realPool: Pool | undefined;
let cleanup=async()=>{};
if(integration) {
  const root=await createConnection({host:'127.0.0.1',port:Number(process.env.DB_PORT),user:'root',password:process.env.DB_ROOT_PASSWORD});
  const name=`restauran_test_${randomBytes(8).toString('hex')}`;
  if(!/^restauran_test_[a-f0-9]{16}$/.test(name))throw new Error('Invalid test database');
  await root.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4`);
  realPool=createPool({host:'127.0.0.1',port:Number(process.env.DB_PORT),user:'root',password:process.env.DB_ROOT_PASSWORD,database:name,connectionLimit:4});
  cleanup=async()=>{await realPool!.end();await root.query(`DROP DATABASE \`${name}\``);await root.end();};
  for(const sql of readFileSync('server/migrations/001-foundation.sql','utf8').split(';').map(s=>s.trim()).filter(Boolean))await realPool.query(sql);
  for(const sql of readFileSync('server/migrations/002-quotes.sql','utf8').split(';').map(s=>s.trim()).filter(Boolean))await realPool.query(sql);
  for(const sql of readFileSync('server/migrations/003-inbox.sql','utf8').split(';').map(s=>s.trim()).filter(Boolean))await realPool.query(sql);
  await realPool.query("INSERT INTO staff_users(email,name,password_hash,role,active) VALUES ('migration-owner@example.test','Existing owner','migration-only-hash','owner',1),('migration-sales@example.test','Existing commercial','migration-only-hash','sales',0)");
  const [beforeRoles]=await realPool.query<any[]>('SELECT id,email,name,password_hash,role,active FROM staff_users ORDER BY id');
  for(const sql of readFileSync('server/migrations/004-two-roles.sql','utf8').split(';').map(s=>s.trim()).filter(Boolean))await realPool.query(sql);
  const [afterRoles]=await realPool.query<any[]>('SELECT id,email,name,password_hash,role,active FROM staff_users ORDER BY id');
  assert.deepEqual(afterRoles,beforeRoles.map(row=>({...row,role:row.role==='owner'?'admin':'editor'})));
  for(const sql of readFileSync('server/migrations/005-operations.sql','utf8').split(';').map(s=>s.trim()).filter(Boolean))await realPool.query(sql);
  await realPool.query('DELETE FROM staff_users');await realPool.query('ALTER TABLE staff_users AUTO_INCREMENT=1');
  await realPool.execute('INSERT INTO editorial_state (id,revision,document) VALUES (1,0,?)',[document]);
}
assert.equal(canEdit('admin'),true);assert.equal(canEdit('editor'),true);assert.equal(canEdit('sales'),false);assert.equal(canEdit('unknown'),false);
assert.throws(()=>accountInput({name:'Test',email:'bad',password:'short'}));
const mediaDirectory=mkdtempSync(join(tmpdir(),'restauran-media-test-'));
const app=await authApp(realPool ?? fake,randomBytes(32).toString('hex'),mediaDirectory);
const server=app.listen(0,'127.0.0.1');await once(server,'listening');
const address=server.address();if(!address || typeof address==='string')throw new Error('No address');
const base=`http://127.0.0.1:${address.port}`;
const password=randomBytes(24).toString('hex');
async function request(route:string,body?:unknown,cookie?:string,origin='http://127.0.0.1:5180') {
  return new Promise<Response>((resolve,reject)=>{
    const req=httpRequest(base+route,{method:body?'POST':'GET',headers:{host:'127.0.0.1:5180',...(body?{'Content-Type':Buffer.isBuffer(body)?'application/octet-stream':'application/json',Origin:origin}:{}),...(cookie?{Cookie:cookie}:{})}},res=>{
      let data='';res.on('data',chunk=>{data+=chunk;});res.on('end',()=>{
        const headers=new Headers();for(const [key,value] of Object.entries(res.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
        resolve(new Response(data,{status:res.statusCode,headers}));
      });
    });req.on('error',reject);req.end(Buffer.isBuffer(body)?body:body?JSON.stringify(body):undefined);
  });
}
try {
  assert.equal((await request('/state')).status,401);
  assert.equal((await request('/draft')).status,401);
  assert.equal((await request('/published')).status,200);
  assert.equal((await request('/auth/setup',{name:'Test owner',email:'owner@example.test',password})).status,201);
  const accounts=realPool ? (await realPool.query<any[]>('SELECT password_hash FROM staff_users ORDER BY id'))[0] : users;
  assert.match(accounts[0].password_hash,/^\$argon2id\$/);assert.notEqual(accounts[0].password_hash,password);
  assert.equal((await request('/auth/setup',{name:'Other',email:'other@example.test',password})).status,409);
  assert.equal((await request('/auth/login',{email:'owner@example.test',password:'wrong'})).status,401);
  const login=await request('/auth/login',{email:'owner@example.test',password});assert.equal(login.status,200);
  const header=login.headers.get('set-cookie')!;assert.match(header,/HttpOnly/i);assert.match(header,/SameSite=Strict/i);
  const ownerCookie=header.split(';')[0];
  assert.equal((await request('/state',undefined,ownerCookie)).status,200);
  assert.equal((await request('/publish',{revision:0},ownerCookie,'https://outside.test')).status,403);
  assert.equal((await request('/users',{name:'Editor',email:'editor@example.test',password,role:'editor'},ownerCookie)).status,201);
  assert.equal((await request('/users',{name:'Second admin',email:'sales@example.test',password,role:'admin'},ownerCookie)).status,201);
  const editor=(await request('/auth/login',{email:'editor@example.test',password})).headers.get('set-cookie')!.split(';')[0];
  const sales=(await request('/auth/login',{email:'sales@example.test',password})).headers.get('set-cookie')!.split(';')[0];
  assert.equal((await request('/state',undefined,editor)).status,200);
  assert.equal((await request('/users',undefined,editor)).status,403);
  assert.equal((await request('/users',{name:'Bad',email:'bad@example.test',password,role:'editor'},editor)).status,403);
  assert.equal((await request('/state',undefined,sales)).status,200);

  const photo=await sharp({create:{width:2600,height:800,channels:3,background:'#456047'}}).jpeg().toBuffer();
  assert.equal((await request('/media',photo)).status,401);
  assert.equal((await request('/media',photo,sales,'https://outside.test')).status,403);
  assert.equal((await request('/media',photo,editor,'https://outside.test')).status,403);
  assert.equal((await request('/media',Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),editor)).status,400);
  assert.equal((await request('/media',Buffer.from('not-an-image'),editor)).status,400);
  const upload=await request('/media',photo,editor);assert.equal(upload.status,201);
  const asset=await upload.json();const mediaRoute=asset.url.replace('/api/local-editor','');
  assert.equal((await request(mediaRoute)).status,404);
  assert.equal((await request(mediaRoute,undefined,sales)).status,200);
  assert.equal((await request(mediaRoute,undefined,editor)).status,200);
  const metadata=await sharp(readFileSync(join(mediaDirectory,asset.url.split('/').pop()))).metadata();
  assert.equal(metadata.format,'webp');assert.equal(metadata.width,2400);assert.equal(metadata.exif,undefined);
  await assert.rejects(new MediaStore(mediaDirectory).save(Buffer.alloc(8*1024*1024+1)));
  if(realPool) {
    const change=defaultCatalog();change.editorial.title='Integración real';change.sections.gallery.items[0].image=asset.url;change.sections.philosophy.teamBio='Equipo de prueba';
    const saved=await request('/draft',{revision:0,draft:change},editor);assert.equal(saved.status,200);
    assert.equal((await (await request('/published')).json()).editorial.title,defaultCatalog().editorial.title);
    const results=await Promise.all([request('/publish',{revision:1},ownerCookie),request('/publish',{revision:1},editor)]);
    assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
    assert.equal((await request(mediaRoute)).status,200);
    assert.match((await request(mediaRoute)).headers.get('content-type') ?? '',/image\/webp/);
    assert.equal((await (await request('/published')).json()).editorial.title,'Integración real');
    assert.equal((await (await request('/published')).json()).sections.philosophy.teamBio,'Equipo de prueba');
    assert.equal((await request('/restore',{revision:2},editor)).status,200);
    assert.equal((await (await request('/draft',undefined,editor)).json()).editorial.title,defaultCatalog().editorial.title);
    const [audits]=await realPool.query<any[]>('SELECT COUNT(*) AS total FROM editorial_audit');assert.equal(audits[0].total,3);
    await testQuoteIntegration(realPool,request,ownerCookie);
    await testInbox(realPool,request,ownerCookie,editor,sales);
    await testPremiumIntegration(realPool,request,ownerCookie);
    await testOperations(realPool,request,ownerCookie,editor);
    await testUserRoles(realPool,request,ownerCookie,editor,sales);
    await realPool.execute('UPDATE staff_users SET active=FALSE WHERE id=2');
    await realPool.execute('UPDATE staff_sessions SET expires_at=0 WHERE JSON_EXTRACT(document,\'$.userId\')=3');
  } else {
    users[1].active=false;
    const session=[...sessions.values()].find(s=>JSON.parse(s.document).userId===3)!;session.expires=Date.now()-1;
  }
  assert.equal((await request('/state',undefined,editor)).status,401);
  assert.equal((await request('/state',undefined,sales)).status,401);
  assert.equal((await request('/auth/logout',{},ownerCookie)).status,200);
  assert.equal((await request('/state',undefined,ownerCookie)).status,401);
  for(let i=0;i<6;i++)await request('/auth/login',{email:'missing@example.test',password:'wrong'});
  assert.equal((await request('/auth/login',{email:'missing@example.test',password:'wrong'})).status,429);
  console.log(`OK: HTTP login, hash, sesión, expiración, logout, permisos, origen y límite de intentos (${integration?'MariaDB real; publicación concurrente y auditoría verificadas':'SQL simulado'}).`);
} finally {
  await new Promise<void>(resolve=>{server.close(()=>resolve());server.closeAllConnections();});await cleanup();
  for(const name of readdirSync(mediaDirectory)){assert.ok(mediaId.test(name));unlinkSync(join(mediaDirectory,name));}rmdirSync(mediaDirectory);
}
