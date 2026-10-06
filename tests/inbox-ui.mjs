import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture={name:'inbox-fixture',configureServer(server){server.middlewares.use('/inbox-fixture',async(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/inbox-fixture','<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/tests/inboxFixture.tsx"></script></html>'));});}};
const server=await createServer({configFile:false,plugins:[react(),fixture],server:{host:'127.0.0.1',port:5182,strictPort:true},logLevel:'error'});
await server.listen();
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
try {
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  let detail={id:'12345678-1234-1234-1234-123456789012',folio:'CO-20990101-12345678123412341234123456789012',createdAt:'2099-01-01T12:00:00.000Z',name:'Cliente ficticio',eventDate:'2099-06-15',guests:12,totalCents:1500000,followup:{revision:0,status:'nueva',assigneeId:null,nextAction:'',nextDate:''},contact:{name:'Cliente ficticio',phone:'+52 612 000 0000',dietaryRestrictions:'Confirmar requisitos con el cliente.',additionalNotes:'Evento ficticio para revisión de interfaz.'},estimate:{selection:{eventType:'cena_privada'},breakdown:{selectedPackage:{name:'Menú de prueba'},selectedZone:{name:'La Paz'},menuSubtotalCents:1440000,extrasItemized:[{id:'extra',name:'Complemento de prueba',quantity:12,totalCents:60000}],travelRequiresConfirmation:true,travelFeeCents:0},pending:['Tarifas de demostración.','Disponibilidad e impuestos por confirmar.']},activity:[]};
  await page.route('**/api/local-editor/inbox**',async route=>{
    const url=new URL(route.request().url());let data;
    if(url.pathname.endsWith('/staff'))data=[{id:1,name:'Equipo ficticio'}];
    else if(url.pathname.endsWith(detail.id)) {
      if(route.request().method()==='POST') {
        const {note,...after}=route.request().postDataJSON();after.revision++;
        detail={...detail,followup:after,activity:[{id:1,actorName:'Equipo ficticio',createdAt:'2099-01-01T13:00:00.000Z',change:{before:detail.followup,after,note}}]};data={ok:true};
      } else data=detail;
    } else data={items:[detail],total:1,page:1};
    await route.fulfill({json:data});
  });
  await page.goto('http://127.0.0.1:5182/inbox-fixture');
  await page.getByRole('button',{name:/Cliente ficticio/}).click();
  await page.getByRole('heading',{name:'Cliente ficticio'}).waitFor();
  await page.getByLabel('Próxima acción',{exact:true}).fill('Revisar logística');
  await page.getByLabel('Añadir nota interna').fill('Nota ficticia');
  await page.getByRole('button',{name:'Guardar seguimiento'}).focus();await page.keyboard.press('Enter');
  await page.getByText('Seguimiento guardado.',{exact:true}).waitFor();
  assert.equal(await page.getByText('Nota ficticia',{exact:true}).count(),1);
  await mkdir('.local-data/qa',{recursive:true});
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.local-data/qa/inbox-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.getByLabel('Añadir nota interna').focus();await page.keyboard.type('Prueba de teclado');
  assert.equal(await page.getByLabel('Añadir nota interna').inputValue(),'Prueba de teclado');
  await page.screenshot({path:'.local-data/qa/inbox-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('OK: UI con API simulada; guardado con teclado, historial, móvil 390px sin desbordamiento y capturas.');
} finally {await browser.close();await server.close();}
