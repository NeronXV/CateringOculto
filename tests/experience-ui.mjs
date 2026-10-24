// Delivery 1: real React + estimator, memory-only API, no DB or external contacts.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync } from 'node:fs';
import { defaultCatalog } from '../src/admin/catalog.ts';
import { clientCatalog } from '../src/admin/clientCatalog.ts';
import { estimateItinerary } from '../server/itineraryEngine.ts';
import { requestAmounts } from '../src/utils/requestSummary.ts';
import { itineraryPresentation } from '../src/utils/itineraryPresentation.ts';
import { receiptText } from '../src/utils/receipt.ts';
import { visibleFolio } from '../src/utils/folio.ts';

const base = 'http://127.0.0.1:5198';
const directory = '.local-data/qa/ux-folios-' + Date.now();
const server = await createServer({ configFile: false, plugins: [react()], server: { host: '127.0.0.1', port: 5198, strictPort: true }, logLevel: 'error' });
let browser;
try {
  await server.listen();
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const errors = [], submissions = [];
  const fullFolio = 'CO-20261023-1234567890ABCDEF1234567890ABCDEF';
  const shortFolio = visibleFolio(fullFolio);
  let trackingProposal = false;
  const fixture = () => clientCatalog(defaultCatalog());
  let catalog = fixture(), saved = null;
  // Approval is synthetic and isolated to this fixture.
  catalog.service.taxApproved = true;
  catalog.service.taxRateBps = 1600;
  catalog.sections.services.items[0].includes = ['Café de prueba', 'Granola de prueba'];
  const followup = { revision: 0, status: 'nueva', assigneeId: null, nextAction: '', nextDate: '' };
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/api/local-editor/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname.replace('/api/local-editor/', '');
    const body = request.postDataJSON();
    let result, status = 200;
    if (path === 'published') result = catalog;
    else if (path === 'availability' || path === 'events/calendar') result = { days: {} };
    else if (path === 'quotes/itinerary/estimate') result = estimateItinerary(catalog, body);
    else if (path === 'quotes/itinerary/submit') {
      assert.deepEqual(Object.keys(body).sort(), ['acceptedVersion', 'consent', 'contact', 'idempotencyKey', 'selection']);
      assert.deepEqual(Object.keys(body.selection).sort(), ['days', 'guestsCount', 'location']);
      const estimate = estimateItinerary(catalog, body.selection);
      assert.equal(estimate.version, body.acceptedVersion);
      submissions.push(structuredClone(body));
      saved = { folio: fullFolio, createdAt: new Date().toISOString(), estimate, contact: body.contact };
      result = saved;
    }
    else if (path === 'mode') result = { authentication: true };
    else if (path === 'auth/status') result = { user: { name: 'Chef ficticio', role: 'admin' }, setupRequired: false };
    else if (path === 'state') result = { revision: 0, publishedAt: null, published: catalog, draft: catalog, previous: null };
    else if (path === 'events' || path === 'inbox/staff') result = [];
    else if (path === 'inbox/settings') result = { responseHours: 24 };
    else if (path === 'inbox') result = { items: saved ? [{ id: 'request-test', ...saved, name: saved.contact.name, eventDate: saved.estimate.summary.startDate, eventDates: saved.estimate.selection.days.map(day => day.date), guests: 8, subtotalCents: requestAmounts(saved.estimate).subtotalCents, totalCents: null, hasPendingAmounts: true, followup }] : [], total: saved ? 1 : 0, page: 1 };
    else if (path === 'inbox/request-test') result = { id: 'request-test', ...saved, followup, availability: { status: 'pending' }, activity: [], reservationStatus: 'draft', reservationHoldUntil: '' };
    else if (path === 'tracking/read') result = trackingProposal
      ? { folio: fullFolio, status: 'draft', proposal: { folio: fullFolio, version: 1, dates: ['2099-11-10'], guests: 8, schedule: '08:30', proposal: 'Propuesta histórica ficticia sin alterar.', notes: '', totalCents: 2700000 }, depositCents: 0 }
      : { kind: 'request', folio: fullFolio, dates: ['2099-11-10'], availability: 'pending', status: 'draft', holdUntil: '' };
    else { status = 403; result = { error: 'Operation outside this memory-only fixture.' }; }
    await route.fulfill({ status, json: result });
  });
  const noOverflow = async page => {
    for (const width of [360, 390, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
  };
  const event = async (page, days = [10, 12]) => {
    await page.goto(base);
    await page.getByRole('button', { name: 'Mes siguiente' }).click();
    for (const day of days) await page.getByRole('button', { name: new RegExp('^' + day + ' de ') }).click();
    await page.getByRole('spinbutton', { name: 'Número de personas' }).fill('8');
    assert.equal(await page.getByPlaceholder('Ciudad, casa o lugar del evento').count(), 1);
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuemax'), '4');
    await page.getByRole('button', { name: 'Siguiente', exact: true }).focus();
    await page.keyboard.press('Enter');
  };
  const breakfast = async (card, time = '08:30') => {
    await card.getByRole('button', { name: 'Desayuno', exact: true }).click();
    await card.getByLabel('Horario solicitado').fill(time);
    await card.getByLabel('Desayuno *', { exact: true }).selectOption('omelette');
  };
  const rows = page => page.locator('.itinerary-amounts-rows > div').evaluateAll(nodes => nodes.map(node => [node.querySelector('dt').textContent, node.querySelector('dd').textContent]));
  mkdirSync(directory, { recursive: true });
  const page = await context.newPage();
  await event(page);
  assert.ok(!/\bvillas?\b/i.test(await page.locator('body').innerText()));
  assert.equal(await page.getByLabel('Incluido en desayunos').count(), 0);
  const cards = page.locator('.day-service-card');
  await breakfast(cards.nth(0));
  await breakfast(cards.nth(1), '09:00');
  assert.equal(await page.getByLabel('Incluido en desayunos').count(), 1);
  assert.match(await page.getByLabel('Incluido en desayunos').textContent(), /Café de prueba.*Granola de prueba/);
  assert.ok(!(await page.getByLabel('Incluido en desayunos').textContent()).includes('Hot cakes'));
  await noOverflow(page);
  await page.getByLabel('Incluido en desayunos').screenshot({ path: directory + '/breakfast-390.png' });
  await cards.nth(0).getByRole('button', { name: 'Comida', exact: true }).click();
  await cards.nth(0).locator('.simple-service-menu').nth(1).getByLabel('Horario solicitado').fill('14:00');
  await cards.nth(1).getByRole('button', { name: 'Cena', exact: true }).click();
  await cards.nth(1).getByRole('button', { name: 'Cena de dos tiempos', exact: true }).click();
  await cards.nth(1).locator('.simple-service-menu').nth(1).getByLabel('Horario solicitado').fill('20:00');
  await page.getByRole('button', { name: 'Ver estimado', exact: true }).click();
  await page.getByRole('heading', { name: 'Tu estimado', exact: true }).waitFor();
  const expectedRows = [['Subtotal de servicios cotizados', '$24,000 MXN'], ['IVA de servicios cotizados', '$3,840 MXN'], ['Importe conocido con IVA', '$27,840 MXN']];
  assert.deepEqual(await rows(page), expectedRows);
  assert.match(await page.locator('.itinerary-amounts').textContent(), /Importe parcial.*Cena de dos tiempos/s);
  await noOverflow(page);
  await page.locator('.itinerary-amounts').screenshot({ path: directory + '/tax-approved-390.png' });
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  const notes = page.getByLabel('Otras notas o preferencias (opcional)', { exact: true });
  assert.equal(await notes.getAttribute('aria-describedby'), 'simple-contact-notes-hint');
  await page.locator('#simple-contact-notes-hint').getByText(/boda.*paellas/).waitFor();
  assert.equal(await notes.getAttribute('required'), null);
  const special = 'PRUEBA FICTICIA: boda con interés en paellas; presupuesto por confirmar.';
  await notes.fill(special);
  await page.getByLabel('Tu nombre completo').fill('Cliente ficticio de experiencia');
  await page.getByLabel('WhatsApp o teléfono celular').fill('6120000000');
  await noOverflow(page);
  await page.locator('.simple-contact').screenshot({ path: directory + '/contact-390.png' });
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Enviar solicitud', exact: true }).click();
  await page.getByRole('link', { name: 'Continuar por WhatsApp' }).waitFor();
  assert.match(await page.locator('.receipt-folio-display').textContent(), new RegExp(shortFolio));
  const whatsapp = new URL(await page.getByRole('link', { name: 'Continuar por WhatsApp' }).getAttribute('href')).searchParams.get('text');
  assert.ok(whatsapp.includes(shortFolio));assert.ok(!whatsapp.includes(fullFolio));
  assert.equal(saved.folio, fullFolio);
  assert.deepEqual(await rows(page), expectedRows);
  assert.equal(submissions.length, 1);
  assert.equal(saved.contact.additionalNotes, special);
  const snapshotBefore = JSON.stringify(saved.estimate);
  const printed = receiptText(saved);
  assert.ok(printed.includes(shortFolio));assert.ok(!printed.includes(fullFolio));
  for (const [label, value] of expectedRows) assert.ok(printed.includes(`${label}: ${value}`));
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.receipt-print').isVisible(), true);
  for (const [label, value] of expectedRows) assert.ok((await page.locator('.receipt-print').textContent()).includes(`${label}: ${value}`));
  await page.screenshot({ path: directory + '/receipt-print.png', fullPage: true });
  await page.pdf({ path: directory + '/receipt-fictitious.pdf', format: 'A4', printBackground: true });
  assert.equal(readFileSync(directory + '/receipt-fictitious.pdf').subarray(0, 5).toString(), '%PDF-');
  await page.emulateMedia({ media: 'screen' });
  await noOverflow(page);
  await page.close();

  // A new catalog policy must not change the saved request displayed by the admin.
  catalog.service.taxRateBps = 2000;
  const admin = await context.newPage();
  await admin.goto(base + '/admin');
  await admin.locator('.inbox-card').getByText(shortFolio, { exact: true }).waitFor();
  await admin.locator('.inbox-card').getByRole('button', { name: 'Ver detalle', exact: true }).click();
  assert.deepEqual(await rows(admin), expectedRows);
  await noOverflow(admin);
  await admin.locator('.itinerary-amounts').screenshot({ path: directory + '/admin-390.png' });
  assert.equal(JSON.stringify(saved.estimate), snapshotBefore);
  await admin.getByRole('button', { name: /Configuración/ }).click();
  const advanced = admin.locator('.admin-sidebar .admin-history');
  const summary = advanced.locator('summary');
  await summary.focus();await admin.keyboard.press('Enter');assert.notEqual(await advanced.getAttribute('open'), null);
  const zone = advanced.getByRole('button', { name: 'Zonas de servicio', exact: true });
  const contrast = async locator => locator.evaluate(node => {
    const color = text => text.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {const s=v/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
    let background = node;
    while (background.parentElement && getComputedStyle(background).backgroundColor === 'rgba(0, 0, 0, 0)') background=background.parentElement;
    const a=color(getComputedStyle(node).color),b=color(getComputedStyle(background).backgroundColor);
    return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
  });
  for (const width of [360,390,1440]) {
    await admin.setViewportSize({width,height:1000});
    assert.ok(await contrast(summary)>=4.5);assert.ok(await contrast(advanced.locator('p'))>=4.5);
    await summary.hover();assert.ok(await contrast(summary)>=4.5);
    await zone.hover();assert.ok(await contrast(zone)>=4.5);
    await zone.focus();assert.notEqual(await zone.evaluate(n=>getComputedStyle(n).outlineStyle),'none');
    await zone.evaluate(n=>{n.disabled=true;});assert.ok(await contrast(zone)>=4.5);assert.equal(await zone.evaluate(n=>getComputedStyle(n).opacity),'1');
    await advanced.screenshot({path:directory+'/advanced-'+width+'.png'});
    await zone.evaluate(n=>{n.disabled=false;});
    assert.ok(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await admin.close();

  const tracking = await context.newPage();
  await tracking.goto(base+'/seguimiento#'+'a'.repeat(64));await tracking.getByText('Solicitud: '+shortFolio,{exact:true}).waitFor();await noOverflow(tracking);
  trackingProposal=true;await tracking.reload();await tracking.getByText('Folio: '+shortFolio,{exact:true}).waitFor();
  await tracking.getByText('Propuesta histórica ficticia sin alterar.',{exact:true}).waitFor();await noOverflow(tracking);
  assert.ok((await tracking.locator('.tracking-print').textContent()).includes(shortFolio));
  assert.ok(!(await tracking.locator('.tracking-print').textContent()).includes(fullFolio));
  await tracking.close();

  // Empty shared content: retain the menu without adding ingredients or a fallback promise.
  catalog = fixture();
  catalog.sections.services.items[0].includes = [];
  const pending = await context.newPage();
  await event(pending, [10]);
  await breakfast(pending.locator('.day-service-card'));
  assert.equal(await pending.getByLabel('Incluido en desayunos').count(), 0);
  await pending.getByRole('button', { name: 'Ver estimado', exact: true }).click();
  await pending.getByRole('heading', { name: 'Tu estimado', exact: true }).waitFor();
  assert.deepEqual((await rows(pending)).map(row => row[1]), ['$7,600 MXN', 'Por confirmar', 'Por confirmar']);
  await pending.getByText('IVA por confirmar. No incluido en el subtotal.', { exact: true }).waitFor();
  await noOverflow(pending);
  await pending.locator('.itinerary-amounts').screenshot({ path: directory + '/tax-pending-390.png' });
  await pending.close();

  catalog = fixture();
  const dinner = await context.newPage();
  await event(dinner, [10]);
  await dinner.getByRole('button', { name: 'Cena', exact: true }).click();
  assert.equal(await dinner.getByLabel('Incluido en desayunos').count(), 0);
  await dinner.getByRole('button', { name: 'Cena de dos tiempos', exact: true }).click();
  await dinner.getByLabel('Horario solicitado').fill('20:00');
  await dinner.getByRole('button', { name: 'Ver estimado', exact: true }).click();
  await dinner.getByRole('heading', { name: 'Tu estimado', exact: true }).waitFor();
  assert.deepEqual((await rows(dinner)).map(row => row[1]), ['Por confirmar', 'Por confirmar', 'Por confirmar']);
  assert.ok(!(await dinner.locator('.simple-summary-view').textContent()).includes('$0'));
  await noOverflow(dinner);
  await dinner.close();
  assert.equal(JSON.stringify(saved.estimate), snapshotBefore);
  assert.equal(itineraryPresentation(saved.estimate).rows[2].value, '$27,840 MXN');
  assert.deepEqual(errors, []);
  console.log('OK: React + estimator / memory API; short folios across confirmation/WhatsApp/inbox/request tracking/proposal print, original IDs/snapshots preserved, regional wording, advanced-card contrast >=4.5 in normal/hover/disabled, focus, four steps and 360/390/1440 px. PDF evidence: '+directory+'. No SQL, real contacts or production.');
} finally {
  await browser?.close();
  await server.close();
}
