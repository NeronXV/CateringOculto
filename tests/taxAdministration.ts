import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {Pool} from 'mysql2/promise';
import {clientCatalog} from '../src/admin/clientCatalog';
import {isolatedHarness,migrate,seedHistory,serve} from './isolatedHarness';
import {application} from '../server/app';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

type Request = (route:string,body?:unknown,cookie?:string,origin?:string)=>Promise<Response>;
export async function testTaxAdministration(pool:Pool,request:Request,admin:string,editor:string) {
  const state = async()=> (await request('/state',undefined,admin)).json();
  const initial = await state();
  const [oldQuotes] = await pool.query<any[]>('SELECT id,estimate_snapshot FROM quote_requests ORDER BY id');
  const [oldProposals] = await pool.query<any[]>('SELECT * FROM event_proposals ORDER BY event_id,version');
  const auditCount = async()=>{const [r]=await pool.query<any[]>('SELECT COUNT(*) AS n FROM editorial_audit');return r[0].n;};
  const save = async(draft:unknown,cookie=admin)=>{const s=await state();return request('/draft',{revision:s.revision,draft},cookie);};
  const publish = async(cookie=admin)=>{const s=await state();return request('/publish',{revision:s.revision},cookie);};
  const fixture = clientCatalog(initial.published);
  fixture.service.taxRateBps=1600;fixture.service.taxApproved=false;fixture.service.taxOnTravel=false;
  assert.equal((await save(fixture)).status,200);assert.equal((await publish()).status,200);
  const packagesBefore=structuredClone(fixture.packages);
  const baseline=await state(),auditBefore=await auditCount();
  for(const change of [{taxRateBps:800},{taxApproved:true},{taxOnTravel:true}]) {
    const draft=structuredClone(baseline.draft);Object.assign(draft.service,change);
    const denied=await request('/draft',{revision:baseline.revision,draft,actorId:1,role:'admin'},editor);
    assert.equal(denied.status,403);
  }
  assert.deepEqual(await state(),baseline);assert.equal(await auditCount(),auditBefore);
  assert.equal((await request('/draft',{revision:baseline.revision,draft:fixture})).status,401);
  for(const rate of [-1,10001,1600.5]) {
    const draft=structuredClone(fixture);draft.service.taxRateBps=rate;
    assert.equal((await save(draft)).status,400);
  }
  const editorial=structuredClone(fixture);editorial.editorial.title='Contenido ficticio sin cambiar IVA';
  assert.equal((await save(editorial,editor)).status,200);assert.equal((await publish(editor)).status,200);

  const selection={guestsCount:8,days:[{date:'2099-11-25',services:['desayuno'],selections:{desayuno:{menuId:'desayunos',requestedTime:'08:30',selectedDishes:{desayuno:'omelette'}}}}]};
  const estimate = async()=>{const r=await request('/quotes/itinerary/estimate',selection);assert.equal(r.status,200);return r.json();};
  const pending=await estimate();assert.equal(pending.pricing.menuSubtotalCents,760000);assert.equal(pending.pricing.taxCents,null);
  let draft=(await state()).draft;draft.service.taxApproved=true;
  assert.equal((await save(draft)).status,200);
  assert.equal((await estimate()).pricing.taxCents,null,'A saved draft is not public');
  const ready=await state(),beforeDenied=await auditCount();
  assert.equal((await publish(editor)).status,403,'Editor cannot publish Admin fiscal changes');
  assert.deepEqual(await state(),ready);assert.equal(await auditCount(),beforeDenied);
  assert.equal((await request('/publish',{revision:ready.revision},admin,'https://outside.test')).status,403);
  assert.equal((await publish()).status,200);
  const approved=await estimate();
  assert.equal(approved.pricing.taxCents,121600);assert.equal(approved.pricing.knownAmountCents,881600);
  assert.equal(approved.pricing.totalCents,null);assert.equal(approved.pricing.travelStatus,'pending');
  const body={selection,acceptedVersion:approved.version,idempotencyKey:randomUUID(),consent:true,contact:{name:'IVA ficticio',phone:'6120000000',dietaryRestrictions:'',additionalNotes:'Ensayo fiscal aislado'}};
  const sent=await request('/quotes/itinerary/submit',body);assert.equal(sent.status,201);const receipt=await sent.json();
  const [savedRows]=await pool.execute<any[]>('SELECT id,estimate_snapshot FROM quote_requests WHERE folio=?',[receipt.folio]);

  // An approved configuration does not remove Editor's unrelated editorial permissions.
  draft=(await state()).draft;draft.editorial.title='Editor conserva su trabajo';
  assert.equal((await save(draft,editor)).status,200);assert.equal((await publish(editor)).status,200);
  draft=(await state()).draft;draft.service.taxRateBps=800;draft.service.taxOnTravel=true;draft.service.taxApproved=true;
  assert.equal((await save(draft)).status,200);assert.equal((await publish()).status,200);
  const changed=await estimate();assert.equal(changed.pricing.taxCents,60800);assert.equal(changed.pricing.knownAmountCents,820800);
  assert.equal(changed.pricing.travelStatus,'pending');
  assert.equal((await request('/quotes/itinerary/submit',{...body,idempotencyKey:randomUUID()})).status,409,'An old accepted version cannot create a new request');
  const replay=await request('/quotes/itinerary/submit',body);assert.equal(replay.status,201);assert.deepEqual(await replay.json(),receipt);
  draft=(await state()).draft;draft.service.taxApproved=false;
  assert.equal((await save(draft)).status,200);assert.equal((await publish()).status,200);
  const off=await estimate();assert.equal(off.taxPending,true);assert.equal(off.pricing.taxCents,null);
  const offState=await state();
  assert.equal((await request('/restore',{revision:offState.revision},editor)).status,403,'Restore cannot bypass fiscal permissions');
  assert.equal((await request('/draft',{revision:0,draft:offState.draft},admin)).status,409);
  assert.deepEqual((await state()).published.packages,packagesBefore,'Tax settings never alter menu prices');
  const [afterSaved]=await pool.execute<any[]>('SELECT id,estimate_snapshot FROM quote_requests WHERE id=?',[savedRows[0].id]);
  assert.deepEqual(afterSaved,savedRows);
  for(const old of oldQuotes){const [r]=await pool.execute<any[]>('SELECT id,estimate_snapshot FROM quote_requests WHERE id=?',[old.id]);assert.deepEqual(r,[old]);}
  const [afterProposals]=await pool.query<any[]>('SELECT * FROM event_proposals ORDER BY event_id,version');assert.deepEqual(afterProposals,oldProposals);
  const [audit]=await pool.query<any[]>("SELECT actor_id,action,revision,created_at FROM editorial_audit WHERE action LIKE 'tax%' ORDER BY id");
  for(const action of ['taxApproved:0>1','taxApproved:1>0','taxRateBps:1600>800','taxOnTravel:0>1']) assert.ok(audit.some(row=>row.action===action),action);
  assert.ok(audit.every(row=>row.actor_id===1&&row.created_at&&row.revision>0&&row.action.length<=24));
  // Leave the original fixture catalog in place for the remaining integration groups.
  assert.equal((await save(initial.published)).status,200);assert.equal((await publish()).status,200);
  assert.equal((await save(initial.draft)).status,200);
  console.log('OK: real SQL tax administration; Admin-only draft/publish/restore, 16%/8%/off, unchanged prices/history/proposals, idempotent replay and audited value transitions.');
}

async function testTaxInterface(pool:Pool,base:string,password:string,directory:string) {
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const errors:string[]=[];
  try {
    const context=await browser.newContext({viewport:{width:390,height:900}});
    await context.route('**/*',(r:any)=>new URL(r.request().url()).origin===base?r.continue():r.abort());
    context.on('page',(p:any)=>p.on('pageerror',(e:Error)=>errors.push(e.message)));
    const page=await context.newPage();
    const login=async(p:any,email:string)=>{await p.goto(base+'/admin');await p.getByLabel('Correo',{exact:true}).fill(email);await p.getByLabel('Contraseña',{exact:true}).fill(password);await p.getByRole('button',{name:'Entrar al panel',exact:true}).click();await p.getByRole('heading',{name:'Solicitudes de clientes',exact:true}).waitFor();};
    await login(page,'admin@phase5.example.test');
    const api=async(path:string,body?:unknown)=>page.request[body?'post':'get'](base+'/api/local-editor/'+path,body?{headers:{Origin:base},data:body}:{});
    // Existing saved zero is preserved on opening; proposing 16% is explicit.
    const s=await (await api('state')).json();s.draft.service.taxRateBps=0;
    assert.equal((await api('draft',{revision:s.revision,draft:s.draft})).status(),200);
    await page.reload();await page.getByRole('button',{name:/Configuración/}).click();await page.getByRole('button',{name:'Precios y contacto',exact:true}).click();
    const rate=page.getByLabel('IVA · porcentaje',{exact:true}),approved=page.getByLabel('Tasa y conceptos de IVA confirmados',{exact:true});
    assert.equal(await rate.inputValue(),'0');assert.equal(await approved.isChecked(),false);
    await page.getByRole('button',{name:'Proponer 16% sin activar',exact:true}).focus();await page.keyboard.press('Enter');
    assert.equal(await rate.inputValue(),'16');assert.equal(await approved.isChecked(),false);
    const save=async()=>{const response=page.waitForResponse((r:any)=>r.url().endsWith('/draft')&&r.request().method()==='POST');await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();assert.equal((await response).status(),200);};
    const publish=async()=>{await page.getByRole('button',{name:'Publicar',exact:true}).click();const response=page.waitForResponse((r:any)=>r.url().endsWith('/publish'));await page.getByRole('region',{name:'Confirmar publicación'}).getByRole('button',{name:'Confirmar publicación',exact:true}).click();assert.equal((await response).status(),200);};
    await save();assert.equal((await (await api('published')).json()).service.taxApproved,false);
    for(const width of [360,390,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.getByRole('region',{name:'Configuración de IVA'}).screenshot({path:join(directory,'iva-admin-'+width+'.png')});}
    await page.setViewportSize({width:360,height:900});await approved.check();assert.equal(await approved.isChecked(),true);await approved.uncheck();
    await approved.check();await save();await publish();
    const quote=await context.newPage();
    const event=async()=>{await quote.goto(base);await quote.getByRole('button',{name:'Mes siguiente'}).click();await quote.getByRole('button',{name:/^25 de /}).click();await quote.getByRole('spinbutton',{name:'Número de personas'}).fill('8');assert.equal(await quote.getByRole('progressbar').getAttribute('aria-valuemax'),'4');await quote.getByRole('button',{name:'Siguiente',exact:true}).click();await quote.getByRole('button',{name:'Desayuno',exact:true}).click();await quote.getByLabel('Horario solicitado').fill('08:30');await quote.getByLabel('Desayuno *',{exact:true}).selectOption('omelette');await quote.getByRole('button',{name:'Ver estimado',exact:true}).click();await quote.getByRole('heading',{name:'Tu estimado',exact:true}).waitFor();};
    const values=()=>quote.locator('.itinerary-amounts-rows dd').allTextContents();
    await event();assert.deepEqual(await values(),['$7,600 MXN','$1,216 MXN','$8,816 MXN']);
    await quote.locator('.itinerary-amounts').screenshot({path:join(directory,'iva-estimate-16.png')});
    await quote.getByRole('button',{name:'Continuar',exact:true}).click();await quote.getByLabel('Tu nombre completo').fill('IVA navegador ficticio');await quote.getByLabel('WhatsApp o teléfono celular').fill('6120000000');await quote.getByRole('checkbox').check();
    const submitted=quote.waitForResponse((r:any)=>r.url().endsWith('/quotes/itinerary/submit'));
    await quote.getByRole('button',{name:'Enviar solicitud',exact:true}).click();const receipt=await (await submitted).json();await quote.getByRole('link',{name:'Continuar por WhatsApp',exact:true}).waitFor();assert.deepEqual(await values(),['$7,600 MXN','$1,216 MXN','$8,816 MXN']);
    const [before]=await pool.execute<any[]>('SELECT estimate_snapshot FROM quote_requests WHERE folio=?',[receipt.folio]);
    await rate.fill('8');assert.equal(await approved.isChecked(),false,'Changing the rate requires approval again');
    await approved.check();await save();await publish();await event();assert.deepEqual(await values(),['$7,600 MXN','$608 MXN','$8,208 MXN']);
    await approved.uncheck();await save();await publish();await event();assert.deepEqual(await values(),['$7,600 MXN','Por confirmar','Por confirmar']);
    const [after]=await pool.execute<any[]>('SELECT estimate_snapshot FROM quote_requests WHERE folio=?',[receipt.folio]);assert.deepEqual(after,before);
    const editorContext=await browser.newContext();await editorContext.route('**/*',(r:any)=>new URL(r.request().url()).origin===base?r.continue():r.abort());const editorPage=await editorContext.newPage();
    await login(editorPage,'editor@phase5.example.test');await editorPage.getByRole('button',{name:/Configuración/}).click();await editorPage.getByRole('button',{name:'Precios y contacto',exact:true}).click();
    for(const label of ['IVA · porcentaje','Tasa y conceptos de IVA confirmados','Aplicar IVA también al traslado'])assert.equal(await editorPage.getByLabel(label,{exact:true}).isDisabled(),true);
    assert.deepEqual(errors,[]);console.log('OK: real browser + Express + SQL; proposed 16% stays off, Admin approval/publication updates four-step estimate, 16%/8%/off, historical snapshot, Editor controls disabled, keyboard and 360/390/1440 px. Evidence: '+directory);
    writeFileSync(join(directory,'evidence.json'),JSON.stringify({syntheticOnly:true,apiMocks:false,taxRatesBps:[1600,800],deactivated:true,viewports:[360,390,1440],historyUnchanged:true,browserErrors:errors},null,2));
  } finally {await browser.close();}
}

// A separate API/limiter and a fresh disposable database keep this suite isolated.
const h=await isolatedHarness('tax-administration');
let server:Awaited<ReturnType<typeof serve>>|undefined;
try {
  const db=await h.create('tax');await migrate(db.pool);const seed=await seedHistory(db.pool);
  server=await serve(application,db.pool,h.directory);
  const base=server.base;
  const request:Request=(route,body,cookie,origin=base)=>fetch(base+'/api/local-editor'+route,{
    method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:origin}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})
  });
  await testTaxInterface(db.pool,base,seed.password,h.directory);
  const login=async(email:string)=>{const r=await request('/auth/login',{email,password:seed.password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
  await testTaxAdministration(db.pool,request,await login('admin@phase5.example.test'),await login('editor@phase5.example.test'));
} finally {await server?.close();await h.close();}
