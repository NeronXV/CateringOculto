import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {writeFileSync,readFileSync,mkdirSync,cpSync,rmSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import type {Pool} from 'mysql2/promise';
import {isolatedHarness,migrate,seedHistory,sqlStatements,serve} from './isolatedHarness';
import {verifyAvailabilitySchema} from '../server/availabilitySchema';
import {InboxStore} from '../server/inboxStore';
import {Operations} from '../server/operations';
import sharp from 'sharp';
import {pathToFileURL} from 'node:url';
import {application} from '../server/app';
import {once} from 'node:events';

const h=await isolatedHarness('migration007');
const snapshot=async(pool:Pool)=>{
  const result:Record<string,unknown>={};
  for(const [table,columns,order]of [
    ['editorial_state','id,revision,document','id'],['staff_users','*','id'],['staff_sessions','*','sid'],['staff_access_audit','*','id'],['editorial_audit','*','id'],['quote_requests','*','id'],
    ['quote_followup','quote_id,revision,status,assignee_id,next_action,next_date','quote_id'],['quote_activity','*','id'],
    ['service_events','*','id'],['service_event_dates',"event_id,DATE_FORMAT(service_date,'%Y-%m-%d') AS service_date",'event_id,service_date'],
    ['event_activity','*','id'],['event_proposals','*','event_id,version']
  ]){const [rows]=await pool.query(`SELECT ${columns} FROM ${table} ORDER BY ${order}`);result[table]=rows;}
  return JSON.stringify(result);
};
const sha=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
try {
  const original=await h.create('baseline');await migrate(original.pool,6);const seed=await seedHistory(original.pool);
  const before=await snapshot(original.pool),statements=sqlStatements('007-request-availability');
  // Simulate interruption after the first ALTER and retry the corrected migration.
  const partial=await h.create('partial');await migrate(partial.pool,6);await seedHistory(partial.pool);
  await partial.pool.query(statements[0]);
  let resumable=true;
  try{await partial.pool.query(statements[0]);}catch(error){assert.equal((error as any).code,'ER_DUP_FIELDNAME');resumable=false;}
  // New API must not declare ready on a database still using schema 006.
  const app=await application(original.pool,randomBytes(32).toString('hex'),h.directory,{origin:'http://127.0.0.1:5197',localOnly:true,secureCookies:false,allowSetup:false,trustProxy:false});
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address() as any;
  const healthBefore=(await fetch(`http://127.0.0.1:${address.port}/health/ready`)).status;
  await new Promise<void>(done=>{server.close(()=>done());server.closeAllConnections();});
  {
    assert.equal(resumable,true,'Migration must resume after partial application.');assert.equal(healthBefore,503,'New API needs schema 007 before becoming ready.');
    for(const statement of statements)await original.pool.query(statement);
    assert.equal(await snapshot(original.pool),before);
    for(const statement of statements)await partial.pool.query(statement);
    for(const statement of statements)await partial.pool.query(statement);
    const conn=await original.pool.getConnection();try{await verifyAvailabilitySchema(conn);}finally{conn.release();}
    const migrationEnv={...process.env,DB_HOST:'127.0.0.1',DB_NAME:original.name,DB_USER:'root',DB_PASSWORD:process.env.DB_ROOT_PASSWORD};
    delete migrationEnv.DB_PASSWORD_FILE;delete migrationEnv.SESSION_SECRET_FILE;
    // Replay the real runner after all DDL succeeded but before its ledger entry was written.
    const runner=spawnSync(process.execPath,['--import','tsx','server/manage.ts','migrate'],{env:migrationEnv,windowsHide:true,stdio:'pipe'});assert.equal(runner.status,0,'Real migration runner must resume');
    const repeated=spawnSync(process.execPath,['--import','tsx','server/manage.ts','migrate'],{env:migrationEnv,windowsHide:true,stdio:'pipe'});assert.equal(repeated.status,0);
    // Resume a partial copy of the originally issued ALTER, including its implicit unique index.
    const issued=await h.create('issued');await migrate(issued.pool,6);await seedHistory(issued.pool);
    await issued.pool.query("ALTER TABLE quote_followup ADD COLUMN availability_status VARCHAR(16) NOT NULL DEFAULT 'pending', ADD COLUMN availability_document LONGTEXT NULL CHECK (availability_document IS NULL OR JSON_VALID(availability_document)), ADD COLUMN tracking_hash CHAR(64) NULL UNIQUE");
    for(const statement of statements)await issued.pool.query(statement);
    const [issuedIndexes]=await issued.pool.query<any[]>('SHOW INDEX FROM quote_followup');assert.equal(issuedIndexes.filter(i=>i.Column_name==='tracking_hash').length,1);
    // IF NOT EXISTS must never conceal a malformed partial schema or mark it completed.
    const malformed=await h.create('malformed');await migrate(malformed.pool,6);await seedHistory(malformed.pool);
    const malformedBefore=await snapshot(malformed.pool);
    await malformed.pool.query("ALTER TABLE quote_followup ADD COLUMN availability_status VARCHAR(8) NOT NULL DEFAULT 'pending'");
    const failedRunner=spawnSync(process.execPath,['--import','tsx','server/manage.ts','migrate'],{env:{...migrationEnv,DB_NAME:malformed.name},windowsHide:true,stdio:'pipe'});assert.notEqual(failedRunner.status,0);
    const [failedLedger]=await malformed.pool.query<any[]>("SELECT version FROM schema_migrations WHERE version='007-request-availability'");assert.equal(failedLedger.length,0);assert.equal(await snapshot(malformed.pool),malformedBefore);
    const [ledger]=await original.pool.query<any[]>("SELECT version FROM schema_migrations WHERE version='007-request-availability'");assert.equal(ledger.length,1);
    const [defaults]=await original.pool.query<any[]>('SELECT availability_status,availability_document,tracking_hash FROM quote_followup');
    assert.ok(defaults.every(row=>row.availability_status==='pending'&&row.availability_document===null&&row.tracking_hash===null));
    const [hours]=await original.pool.query<any[]>('SELECT response_hours FROM editorial_state');assert.equal(hours[0].response_hours,24);
    const [indexes]=await original.pool.query<any[]>('SHOW INDEX FROM quote_followup');assert.ok(indexes.some(index=>index.Column_name==='tracking_hash'&&index.Non_unique===0));
    const [foreignKeys]=await original.pool.query<any[]>("SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? AND TABLE_NAME='quote_followup'",[original.name]);assert.equal(foreignKeys.length,1);
    await assert.rejects(original.pool.query("UPDATE quote_followup SET availability_document='broken-json'"));
    const [ids]=await original.pool.query<any[]>('SELECT quote_id FROM quote_followup ORDER BY quote_id');
    await original.pool.execute('UPDATE quote_followup SET tracking_hash=? WHERE quote_id=?',['a'.repeat(64),ids[0].quote_id]);
    await assert.rejects(original.pool.execute('UPDATE quote_followup SET tracking_hash=? WHERE quote_id=?',['a'.repeat(64),ids[1].quote_id]),(error:any)=>error.code==='ER_DUP_ENTRY');
    await original.pool.execute('UPDATE quote_followup SET tracking_hash=NULL WHERE quote_id=?',[ids[0].quote_id]);
    // A complete logical SQL backup is restored to a different database and compared.
    const config=join(h.directory,'client.cnf');writeFileSync(config,`[client]\nhost=127.0.0.1\nport=${process.env.DB_PORT}\nuser=root\npassword=${process.env.DB_ROOT_PASSWORD}\ndefault-character-set=utf8mb4\n`,{mode:0o600});
    const dump=join(h.directory,'synthetic.sql');const tool=resolve(process.env.MARIADB_BASEDIR!,'bin');
    const exported=spawnSync(join(tool,'mariadb-dump.exe'),[`--defaults-file=${config}`,'--single-transaction','--routines','--triggers','--events','--hex-blob',`--result-file=${dump}`,original.name],{windowsHide:true,stdio:'pipe'});assert.equal(exported.status,0,'Logical export must succeed (output withheld).');
    const restored=await h.create('restored');
    const imported=spawnSync(join(tool,'mariadb.exe'),[`--defaults-file=${config}`,restored.name],{input:readFileSync(dump),windowsHide:true,stdio:'pipe'});assert.equal(imported.status,0,'Restore into separate database must succeed (output withheld).');
    assert.equal(await snapshot(restored.pool),before);
    const media=join(h.directory,'media'),mediaRestore=join(h.directory,'restored-media');mkdirSync(media);
    const mediaName='00000000-0000-4000-8000-000000000001.webp';await sharp({create:{width:8,height:8,channels:3,background:'#d1b77e'}}).webp().toFile(join(media,mediaName));
    const mediaArchive=join(h.directory,'media.tar.gz');assert.equal(spawnSync('tar',['-czf',mediaArchive,'-C',media,'.'],{windowsHide:true,stdio:'pipe'}).status,0);mkdirSync(mediaRestore);assert.equal(spawnSync('tar',['-xzf',mediaArchive,'-C',mediaRestore],{windowsHide:true,stdio:'pipe'}).status,0);
    assert.equal(sha(readFileSync(join(media,mediaName))),sha(readFileSync(join(mediaRestore,mediaName))));await sharp(join(mediaRestore,mediaName)).metadata();
    // Explicit historical column selections remain valid after the additive migration.
    await original.pool.query("SELECT q.*,f.revision,f.status,f.assignee_id,f.next_action,f.next_date FROM quote_requests q LEFT JOIN quote_followup f ON f.quote_id=q.id");
    const newServer=await serve(application,restored.pool,mediaRestore);try{assert.equal((await fetch(newServer.base+'/health/ready')).status,200);}finally{await newServer.close();}
    // Actual archived API from the documented October release: reads compatible, negative guard absent.
    const oldModule=await import(pathToFileURL(resolve('.local-data/qa/legacy-20261008/old-app.mjs')).href);
    const oldServer=await serve(oldModule.application,restored.pool,mediaRestore);
    let oldWriterUnsafe=false;
    try {
      const api=async(path:string,body?:unknown,cookie='')=>fetch(oldServer.base+'/api/local-editor'+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:oldServer.base}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
      const logged=await api('/auth/login',{email:'admin@phase5.example.test',password:seed.password});assert.equal(logged.status,200);const cookie=logged.headers.get('set-cookie')!.split(';')[0];
      assert.equal((await api('/inbox',undefined,cookie)).status,200);
      const originalQuote=seed.quotes[1],inbox=new InboxStore(restored.pool);
      const detailed=(await (await api('/inbox/'+originalQuote.id,undefined,cookie)).json());assert.deepEqual(detailed.estimate,originalQuote.estimate);
      await inbox.decide(originalQuote.id,{revision:1,status:'unavailable',note:'Ensayo aislado de rollback'}, {id:1,name:'Carlos ficticio'});
      const prepared=await new Operations(restored.pool).prepare(originalQuote.id);
      const attempted=await api('/events',{quoteId:originalQuote.id,data:{...prepared.data,status:'hold',holdUntil:'2099-12-01T12:00:00.000Z'}},cookie);
      assert.equal(attempted.status,201,'Old writer demonstrates why code-only rollback is unsafe after new negative decisions');oldWriterUnsafe=true;
    }finally{await oldServer.close();}
    writeFileSync(join(h.directory,'evidence.json'),JSON.stringify({version:h.info.version,sqlMode:h.info.sqlMode,tableNames:h.info.tableNames,historyPreserved:true,partialResume:true,realRunnerResumed:true,originalPartialResumedWithoutDuplicateIndex:true,malformedSchemaRejectedWithoutLedger:true,readyBeforeSchema:healthBefore,backupSha256:sha(readFileSync(dump)),restoredHistorySha256:sha(before),mediaArchiveSha256:sha(readFileSync(mediaArchive)),mediaRestored:true,archivedApiReadCompatible:true,archivedApiWriterUnsafeAfterNegativeDecision:oldWriterUnsafe,syntheticOnly:true},null,2));
    const resolved=resolve(config);assert.ok(resolved.startsWith(resolve(h.directory)+sep));rmSync(config);
    console.log('OK: 007 resumable, original history unchanged, defaults/JSON/unique/FK intact, schema readiness, SQL/media backup restored and legacy column contract valid. '+h.info.version);
    console.log('Evidence: '+join(h.directory,'evidence.json'));
  }
}finally{await h.close();}
