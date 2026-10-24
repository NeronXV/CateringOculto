const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {defaultCatalog,validateCatalog} = require('../src/admin/catalog.ts');
const {upgradeStoredCatalog,hasPublishedImage}=require('../src/admin/catalog.ts');
const legacy=defaultCatalog(); delete legacy.sections; legacy.editorial.title='Título conservado';
const upgraded=upgradeStoredCatalog(legacy);
const oldRules=defaultCatalog();delete oldRules.rules;
assert.equal(upgradeStoredCatalog(oldRules).rules.validityApproved,false);
assert.equal(oldRules.rules,undefined);
const badRules=defaultCatalog();badRules.rules.leadTimes[0].days=-1;assert.throws(()=>validateCatalog(badRules));
const badApproval=defaultCatalog();badApproval.rules.requirementsApproved='yes';assert.throws(()=>validateCatalog(badApproval));
assert.equal(upgraded.editorial.title,'Título conservado');
assert.equal(legacy.sections,undefined);
assert.equal(upgraded.sections.gallery.items.length,4);
assert.throws(()=>validateCatalog(legacy));
assert.throws(()=>upgradeStoredCatalog({...legacy,sections:null}));
const custom=defaultCatalog();custom.sections.philosophy.teamBio='Biografía autorizada';
assert.equal(upgradeStoredCatalog(custom).sections.philosophy.teamBio,'Biografía autorizada');
custom.sections.gallery.items[0].image='/api/local-editor/media/test.webp';
assert.equal(hasPublishedImage(custom,'/api/local-editor/media/test.webp'),true);
custom.sections.gallery.items[0].caption='/not-an-image.webp';
assert.equal(hasPublishedImage(custom,'/not-an-image.webp'),false);
custom.sections.experiences.items[0].id='unknown';assert.throws(()=>validateCatalog(custom));
const previousSchema=defaultCatalog();delete previousSchema.sections.services;
previousSchema.editorial.description='Cenas privadas y cocina de autor. Una experiencia que comienza en el producto y permanece en la memoria.';
previousSchema.editorial.buttonText='Diseña tu experiencia';
previousSchema.editorial.title='Título propio';previousSchema.sections.philosophy.photos[0].image='/foto-propia.jpg';
const adapted=upgradeStoredCatalog(previousSchema);
assert.equal(adapted.editorial.title,'Título propio');assert.equal(adapted.sections.philosophy.photos[0].image,'/foto-propia.jpg');
assert.equal(adapted.sections.services.items[0].id,'desayuno');assert.equal(previousSchema.sections.services,undefined);
assert.equal(adapted.editorial.buttonText,'Consultar disponibilidad');assert.equal(adapted.editorial.description,defaultCatalog().editorial.description);
assert.equal(previousSchema.editorial.buttonText,'Diseña tu experiencia');
previousSchema.editorial.description='Descripción personalizada';previousSchema.editorial.buttonText='Botón personalizado';
assert.equal(upgradeStoredCatalog(previousSchema).editorial.description,'Descripción personalizada');assert.equal(upgradeStoredCatalog(previousSchema).editorial.buttonText,'Botón personalizado');
const invalidServices=defaultCatalog();invalidServices.sections.services.items[0].id='otro';assert.throws(()=>validateCatalog(invalidServices));
const {mergeDraft}=require('../src/admin/mergeDraft.ts');
const mergeBase=defaultCatalog(),ours=structuredClone(mergeBase),theirs=structuredClone(mergeBase);
ours.editorial.title='Edición pendiente';theirs.sections.services.items[0].description='Publicado desde Menús';
const combined=mergeDraft(mergeBase,ours,theirs);
assert.equal(combined.editorial.title,ours.editorial.title);assert.equal(combined.sections.services.items[0].description,theirs.sections.services.items[0].description);
theirs.editorial.title='Edición en conflicto';assert.equal(mergeDraft(mergeBase,ours,theirs),null);
const {LocalStore} = require('../server/localStore.ts');
const {parseState}=require('../server/mysqlStore.ts');
const stored={revision:0,publishedAt:null,draft:defaultCatalog(),published:defaultCatalog(),previous:null};
assert.deepEqual(parseState(JSON.stringify(stored)),parseState(stored));
assert.notEqual(parseState(stored).draft,stored.draft);
assert.throws(()=>parseState('{broken'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'restaurant-editor-'));
try {
  const file = path.join(temp,'catalog.json');
  const store = new LocalStore(file);
  const original = store.read();
  const draft = defaultCatalog();
  draft.editorial.title = 'Prueba editorial';
  draft.packages[0].pricePerPersonCents = 123400;
  const saved = store.update('draft',0,draft);
  assert.deepEqual(saved.published,original.published);
  assert.equal(new LocalStore(file).read().draft.editorial.title,'Prueba editorial');
  assert.throws(()=>store.update('publish',0),/CONFLICT/);
  const published = store.update('publish',1);
  assert.equal(published.published.packages[0].pricePerPersonCents,123400);
  assert.deepEqual(published.previous,original.published);
  const restored = store.update('restore',2);
  assert.deepEqual(restored.draft,original.published);
  assert.deepEqual(restored.published,published.published);
  for (const mutate of [
    c=>c.packages[0].pricePerPersonCents=-1,
    c=>c.packages[0].pricePerPersonCents=1.1,
    c=>c.packages[0].minGuests=151,
    c=>c.packages[0].id=c.packages[1].id,
    c=>c.packages[0].image='javascript:alert(1)',
    c=>c.packages[0].image='//evil.test/image.png',
    c=>c.business.socialLinks.instagram='data:text/html,hello',
    c=>c.business.whatsAppNumberDigits='not-a-number',
    c=>c.editorial.title='',
    c=>c.packages=[],
    c=>c.extras[0].pricingType='invalid',
    c=>c.business.unexpected='value',
    c=>{c.zones[0].requiresConfirmation=true;c.zones[0].travelFeeCents=100;},
  ]) {
    const bad = defaultCatalog(); mutate(bad);
    assert.throws(()=>validateCatalog(bad));
    assert.throws(()=>store.update('draft',3,bad));
    assert.equal(store.read().revision,3);
  }
  assert.throws(()=>store.update('unknown',3));
  // Invalid disk content must fail closed, not reset a business catalog.
  fs.writeFileSync(file,'{broken');
  assert.throws(()=>store.read());
  console.log('OK: borrador aislado, persistencia, publicación, recuperación, conflictos y validación editorial.');
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
