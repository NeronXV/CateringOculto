// Only runs against the isolated catering-oculto-check stack, never the user's native DB.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const compose=['compose','-f','infra/compose.yaml','-f','infra/compose.local.yaml','-p','catering-oculto-check'];
const base='http://127.0.0.1:5185',prefix=base+'/api/local-editor';
mkdirSync('.local-data/qa',{recursive:true});
const file='.local-data/qa/docker-test-account.json';
const account=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{name:'Propietario de prueba',email:'qa@example.test',password:randomBytes(32).toString('hex')};
const status=await (await fetch(prefix+'/auth/status')).json();
assert.equal(status.setupRequired,false);
if(status.setupDisabled) {
  const result=spawnSync('docker',[...compose,'exec','-T','app','node','server-dist/owner.js'],{input:JSON.stringify(account),encoding:'utf8',windowsHide:true});
  assert.equal(result.status,0,'No se creó el propietario de QA');writeFileSync(file,JSON.stringify(account),{mode:0o600});
}
let cookie='';
async function request(path,body,origin=base) {
  return fetch(prefix+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:origin}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
}
assert.equal((await fetch(base+'/health/ready')).status,200);
assert.equal((await fetch(base+'/admin')).status,200);
assert.equal((await fetch(base+'/.env.local')).status,404);
assert.equal((await fetch(base+'/server/authApp.ts')).status,404);
assert.equal((await request('/inbox')).status,401);
assert.equal((await request('/auth/setup',account)).status,403);
assert.equal((await request('/auth/login',account,'https://outside.test')).status,403);
const login=await request('/auth/login',account);assert.equal(login.status,200);
cookie=login.headers.get('set-cookie').split(';')[0];
assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/SameSite=Strict/);
const state=await (await request('/state')).json();
assert.equal((await request('/draft',{revision:state.revision,draft:state.draft})).status,200);
const catalog=await (await request('/published')).json();
const selection={eventType:'cena_privada',eventDate:'2099-06-15',zoneId:catalog.zones[0].id,packageId:catalog.packages[0].id,guestsCount:8,selectedExtras:{},commercial:{investment:'fits',requirements:'pending',dietaryReview:false}};
const estimate=await (await request('/quotes/estimate',selection)).json();
assert.equal(estimate.demo,true);
const payload={selection,contact:{name:'Solicitud Docker ficticia',phone:'+52 612 000 0000',dietaryRestrictions:'',additionalNotes:'Prueba aislada'},acceptedVersion:estimate.version,idempotencyKey:randomUUID(),consent:true};
const submitted=await Promise.all([request('/quotes/submit',payload),request('/quotes/submit',payload)]);
assert.deepEqual(submitted.map(r=>r.status),[201,201]);
const receipts=await Promise.all(submitted.map(r=>r.json()));assert.equal(receipts[0].folio,receipts[1].folio);
const list=await (await request('/inbox?q='+receipts[0].folio)).json();assert.equal(list.total,1);
const detail=await (await request('/inbox/'+list.items[0].id)).json();assert.deepEqual(detail.estimate,estimate);
const changes={...detail.followup,status:'en_revision',note:'Ensayo Docker',nextAction:'Revisar',nextDate:''};
assert.equal((await request('/inbox/'+detail.id,changes)).status,200);
assert.equal((await request('/inbox/'+detail.id,changes)).status,409);
const denied=spawnSync('docker',[...compose,'exec','-T','app','node','--input-type=module','-e',"import fs from 'node:fs';import mysql from 'mysql2/promise';const c=await mysql.createConnection({host:'db',user:'catering_app',password:fs.readFileSync('/run/secrets/db_password','utf8').trim(),database:'catering'});try{await c.query('CREATE TABLE forbidden_qa (id INT)');process.exitCode=1;}catch(e){process.exitCode=e.code==='ER_TABLEACCESS_DENIED_ERROR'?0:2;}finally{await c.end();}"],{encoding:'utf8',windowsHide:true});
assert.equal(denied.status,0,'La cuenta runtime no debe poder crear tablas');
assert.equal((await request('/auth/logout',{})).status,200);assert.equal((await request('/inbox')).status,401);
if(process.env.PLAYWRIGHT_MODULE) {
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/admin');await page.getByLabel('Correo',{exact:true}).fill(account.email);await page.getByLabel('Contraseña',{exact:true}).fill(account.password);
    await page.getByRole('button',{name:'Entrar al panel'}).focus();await page.keyboard.press('Enter');
    await page.getByRole('button',{name:'Solicitudes',exact:true}).click();
    await page.getByRole('button',{name:/Solicitud Docker ficticia/}).first().click();
    await page.getByRole('heading',{name:'Solicitud Docker ficticia'}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:'.local-data/qa/docker-inbox-mobile.png',fullPage:true});
    await page.goto(base);await page.getByRole('heading',{level:1}).waitFor();
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
}
console.log('OK: build sin Vite, MariaDB Docker, bootstrap cerrado, sesión, origen, folio idempotente, bandeja, concurrencia, mínimo privilegio y UI real si Playwright está configurado.');
