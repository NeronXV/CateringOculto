import assert from 'node:assert/strict';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {defaultCatalog} from '../src/admin/catalog.ts';
import {estimateQuote} from '../server/quoteEngine.ts';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture={name:'rules-fixture',configureServer(server){server.middlewares.use('/rules-fixture',async(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/rules-fixture','<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/tests/rulesFixture.tsx"></script></html>'));});}};
const server=await createServer({configFile:false,plugins:[react(),fixture],server:{host:'127.0.0.1',port:5183,strictPort:true},logLevel:'error'});await server.listen();
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const catalog=defaultCatalog();catalog.rules.requirementsApproved=true;catalog.rules.requirementsText='Requisito ficticio para probar el formulario.';
  await page.route('**/api/local-editor/**',async route=>{
    if(route.request().url().endsWith('/state'))return route.fulfill({json:{revision:0,publishedAt:null,draft:catalog,published:catalog,previous:null}});
    if(route.request().url().endsWith('/quotes/estimate'))return route.fulfill({json:estimateQuote(catalog,route.request().postDataJSON())});
    return route.fulfill({status:400,json:{error:'Ruta no prevista en prueba'}});
  });
  await page.goto('http://127.0.0.1:5183/rules-fixture');
  await page.getByLabel('¿El importe preliminar encaja con tu inversión?').selectOption('fits');
  await page.getByLabel('¿El lugar cumple estos requisitos?').selectOption('yes');
  await page.getByRole('button',{name:'Revisar estimado actualizado'}).focus();await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Lista para revisión comercial'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mkdir('.local-data/qa',{recursive:true});await page.screenshot({path:'.local-data/qa/rules-public-mobile.png',fullPage:true});
  await page.getByLabel('¿El importe preliminar encaja con tu inversión?').selectOption('review');
  assert.equal(await page.getByRole('heading',{name:'Lista para revisión comercial'}).count(),0);
  await page.getByRole('button',{name:'Revisar estimado actualizado'}).click();
  await page.getByRole('heading',{name:'Requiere aclaraciones'}).waitFor();
  await page.goto('http://127.0.0.1:5183/rules-fixture?admin');
  await page.getByRole('button',{name:'Reglas de cotización'}).click();
  await page.getByLabel('Días de vigencia (inactivo hasta aprobar)').fill('12');
  assert.equal(await page.getByRole('button',{name:'Guardar borrador'}).isEnabled(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'.local-data/qa/rules-admin-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('OK: reglas UI; móvil, teclado, recálculo por respuestas y edición del panel (API simulada).');
} finally {await browser.close();await server.close();}
