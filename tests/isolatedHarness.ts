import assert from 'node:assert/strict';
import {createConnection,createPool,type Pool} from 'mysql2/promise';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {hash,argon2id} from 'argon2';
import {clientCatalog} from '../src/admin/clientCatalog';
import {defaultCatalog} from '../src/admin/catalog';
import {estimateQuote} from '../server/quoteEngine';
import {estimateItinerary} from '../server/itineraryEngine';
import {blankEvent} from '../src/types/operations';
import {createServer} from 'node:net';
import {once} from 'node:events';
export async function serve(factory:any,pool:Pool,media:string){
  const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=(probe.address() as any).port;await new Promise<void>(done=>probe.close(()=>done()));
  const base=`http://127.0.0.1:${port}`;
  const app=await factory(pool,randomBytes(32).toString('hex'),media,{origin:base,localOnly:true,secureCookies:false,allowSetup:false,trustProxy:false});
  const server=app.listen(port,'127.0.0.1');await once(server,'listening');
  return {base,server,async close(){await new Promise<void>(done=>{server.close(()=>done());server.closeAllConnections();});}};
}

export const versions=['001-foundation','002-quotes','003-inbox','004-two-roles','005-operations','006-event-dates','007-request-availability'];
export const sqlStatements=(version:string)=>readFileSync(resolve('server/migrations/'+version+'.sql'),'utf8').split(';').map(s=>s.trim()).filter(Boolean);
export async function isolatedHarness(label:string){
  const dockerQA=process.env.ISOLATED_DOCKER==='1';
  if((process.env.ISOLATED_MARIADB!=='1'&&!dockerQA)||process.env.DB_HOST!=='127.0.0.1'||!/^\d+$/.test(process.env.DB_PORT??'')||[3306,3307].includes(Number(process.env.DB_PORT)))throw Error('Only the disposable MariaDB launcher may run this test.');
  const connectionOptions={host:'127.0.0.1',port:Number(process.env.DB_PORT),user:'root',password:process.env.DB_ROOT_PASSWORD,charset:'utf8mb4'};
  const root=await createConnection(connectionOptions);
  const [info]=await root.query<any[]>('SELECT VERSION() AS version,@@datadir AS directory,@@hostname AS hostname,@@sql_mode AS sqlMode,@@lower_case_table_names AS tableNames,@@collation_server AS collation');
  if(dockerQA){assert.match(process.env.QA_EXPECTED_DB_HOSTNAME??'',/^[a-f0-9]{12}$/);assert.equal(info[0].hostname,process.env.QA_EXPECTED_DB_HOSTNAME,'Only the separately inspected QA container may be used.');assert.equal(info[0].tableNames,0);}
  else assert.ok(String(info[0].directory).replaceAll('\\','/').toLowerCase().startsWith(resolve('.local-data/qa/mariadb-').replaceAll('\\','/').toLowerCase()));
  assert.match(info[0].version,/^11\.4\./,'Use the portable 11.4 QA distribution, not the legacy XAMPP server.');
  const owned=new Set<string>(),pools:Pool[]=[];
  const directory=resolve('.local-data/qa',label+'-'+randomBytes(8).toString('hex'));mkdirSync(directory,{recursive:true});
  const create=async(suffix:string)=>{
    const name=(dockerQA?'catering_5b_':'catering_5a_')+suffix+'_'+randomBytes(8).toString('hex');assert.match(name,/^catering_5[ab]_[a-z]+_[a-f0-9]{16}$/);
    await root.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE ${dockerQA?'utf8mb4_uca1400_ai_ci':'utf8mb4_unicode_ci'}`);owned.add(name);
    const pool=createPool({...connectionOptions,database:name,connectionLimit:8});pools.push(pool);return {name,pool};
  };
  return {root,create,directory,connectionOptions,info:info[0],async close(){await Promise.all(pools.map(pool=>pool.end()));for(const name of owned){assert.match(name,/^catering_5[ab]_[a-z]+_[a-f0-9]{16}$/);await root.query(`DROP DATABASE \`${name}\``);}await root.end();}};
}
export async function migrate(pool:Pool,last=7){
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(80) PRIMARY KEY,applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
  for(const version of versions.slice(0,last)){for(const statement of sqlStatements(version))await pool.query(statement);await pool.execute('INSERT INTO schema_migrations(version) VALUES (?)',[version]);}
}
export async function seedHistory(pool:Pool,catalog=clientCatalog(defaultCatalog())){
  const state={revision:0,publishedAt:null,draft:catalog,published:catalog,previous:null};
  await pool.execute('INSERT INTO editorial_state(id,revision,document) VALUES(1,0,?)',[JSON.stringify(state)]);
  const password=randomBytes(24).toString('hex'),passwordHash=await hash(password,{type:argon2id});
  await pool.execute("INSERT INTO staff_users(email,name,password_hash,role) VALUES ('admin@phase5.example.test','Carlos ficticio',?,'admin'),('editor@phase5.example.test','Karen ficticia',?,'editor')",[passwordHash,passwordHash]);
  await pool.execute('INSERT INTO staff_sessions(sid,expires_at,document) VALUES(?,?,?)',['synthetic-history-session',Date.parse('2099-01-01T00:00:00.000Z'),JSON.stringify({cookie:{originalMaxAge:86400000,httpOnly:true,sameSite:'strict'},userId:1})]);
  const legacy=estimateQuote(catalog,{eventType:'cena_privada',eventDate:'2099-07-10',zoneId:'zona-0',packageId:'desayunos',guestsCount:8,selectedExtras:{},selectedDishes:{desayuno:'omelette'}});
  const old=estimateItinerary(catalog,{guestsCount:10,days:[{date:'2099-07-11',services:['desayuno','cena']},{date:'2099-07-13',services:['comida']}]});
  const detailed=estimateItinerary(catalog,{guestsCount:8,days:[{date:'2099-07-16',services:['desayuno'],selections:{desayuno:{menuId:'desayunos',requestedTime:'08:30',selectedDishes:{desayuno:'chilaquiles',salsa:'verde',proteina:'pollo'}}}}]});
  const phase1={...detailed,engineVersion:'itinerary-v2',pricing:undefined};
  const quotes=[];
  for(const [index,estimate]of [legacy,old,phase1].entries()){
    const id=randomUUID(),folio='CO-HISTORIA-'+index,contact={name:'Cliente histórico ficticio '+index,phone:'+52 612 000 0000',dietaryRestrictions:'Restricción histórica ficticia',additionalNotes:'Observación histórica ficticia'};
    await pool.execute('INSERT INTO quote_requests(id,folio,idempotency_key,payload_hash,estimate_snapshot,contact_document,consent_version,created_at) VALUES(?,?,?,?,?,?,?,?)',[id,folio,randomUUID(),'a'.repeat(64),JSON.stringify(estimate),JSON.stringify(contact),'quote-consent-v1','2026-01-01T12:00:00.000Z']);
    await pool.execute("INSERT INTO quote_followup(quote_id,revision,status,assignee_id,next_action,next_date) VALUES(?,1,'en_revision',1,'Seguimiento histórico','2099-07-01')",[id]);
    await pool.execute('INSERT INTO quote_activity(quote_id,actor_id,actor_name,created_at,document) VALUES(?,1,?,?,?)',[id,'Carlos ficticio','2026-01-02T12:00:00.000Z',JSON.stringify({before:{revision:0,status:'nueva'},after:{revision:1,status:'en_revision'},note:'Historia ficticia'})]);quotes.push({id,folio,estimate,contact});
  }
  const confirmed={...blankEvent('2099-07-10'),name:quotes[0].contact.name,status:'confirmed',totalCents:1500000,depositCents:750000,paymentVerified:true,proposal:'Propuesta histórica ficticia',schedule:'14:00'};
  const events=[];
  for(const [index,data]of [confirmed,{...blankEvent('2099-07-20'),status:'hold',name:'Apartado histórico ficticio',holdUntil:'2099-07-01T00:00:00.000Z'},{...blankEvent('2099-07-22'),status:'blocked',internalNotes:'Compromiso histórico ficticio'}].entries()){
    const id=randomUUID(),published=index===0?{folio:quotes[0].folio,version:1,date:data.date,dates:[data.date],guests:data.guests,schedule:data.schedule,proposal:data.proposal,notes:'',totalCents:data.totalCents}:null;
    await pool.execute('INSERT INTO service_events(id,quote_id,folio,event_date,status,hold_until,document,proposal_version,published,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',[id,index===0?quotes[0].id:null,'EV-HISTORIA-'+index,data.date,data.status,data.holdUntil,JSON.stringify(data),index===0?1:0,published?JSON.stringify(published):null,'2026-01-03T12:00:00.000Z']);
    await pool.execute('INSERT INTO service_event_dates(event_id,service_date) VALUES(?,?)',[id,data.date]);
    await pool.execute('INSERT INTO event_activity(event_id,actor_id,actor_name,action,document,created_at) VALUES(?,1,?,?,?,?)',[id,'Carlos ficticio','create',JSON.stringify({data}),'2026-01-03T12:00:00.000Z']);
    if(published)await pool.execute('INSERT INTO event_proposals(event_id,version,document,created_at) VALUES(?,1,?,?)',[id,JSON.stringify(published),'2026-01-03T12:00:00.000Z']);events.push(id);
  }
  return {catalog,password,quotes,events};
}
