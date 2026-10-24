import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {visibleFolio,folioSearchPattern} from '../src/utils/folio';
import {availabilityMessage} from '../src/types/availability';
import {receiptText,itineraryWhatsAppMessage} from '../src/utils/receipt';
import {defaultCatalog} from '../src/admin/catalog';
import {clientCatalog} from '../src/admin/clientCatalog';
import {estimateItinerary} from '../server/itineraryEngine';
import {estimateQuote} from '../server/quoteEngine';

const raw='CO-20261023-1234567890ABCDEF1234567890ABCDEF';
const short=visibleFolio(raw);
assert.match(short,/^CO-261023-[0-9A-HJKMNP-TV-Z]{10}$/);
assert.equal(short.length,20);assert.equal(visibleFolio(short),short);
assert.equal(visibleFolio(raw.toLowerCase()),short);
assert.equal(folioSearchPattern(short),'CO-__261023-1234567890AB%');
assert.equal(folioSearchPattern(short.toLowerCase()),folioSearchPattern(short));
for(const legacy of ['CO-TEST','CO-HISTORIA-0','EV-VISUAL','Evento directo / externo',''])assert.equal(visibleFolio(legacy),legacy);
for(const invalid of ['%','_',"' OR 1=1 --",'CO-261023-OOOOOOOOOO','CO-261023-ZZZZZZZZZZ','CO-261023-000000000%'])assert.equal(folioSearchPattern(invalid),null);
assert.equal(visibleFolio('EV-FFFFFFFFFFFFFFFF'),'EV-FZZZZZZZZZZZZ');
const seen=new Set<string>();
for(let i=0;i<10000;i++){
  const original='CO-20261023-'+randomUUID().replaceAll('-','').toUpperCase(),alias=visibleFolio(original);
  assert.equal(folioSearchPattern(alias),'CO-__261023-'+original.slice(12,24)+'%');
  assert.ok(!seen.has(alias));seen.add(alias);
}
const estimate=estimateItinerary(clientCatalog(defaultCatalog()),{guestsCount:8,location:'Villa escrita por el cliente',days:[{date:'2099-11-10',services:['desayuno'],selections:{desayuno:{menuId:'desayunos',requestedTime:'08:30',selectedDishes:{desayuno:'omelette'}}}}]});
const receipt={folio:raw,createdAt:'2026-10-23T12:00:00Z',estimate,contact:{name:'Cliente ficticio',phone:'6120000000',dietaryRestrictions:'',additionalNotes:'Villa escrita por el cliente'}};
const before=JSON.stringify(receipt);
for(const text of [receiptText(receipt),itineraryWhatsAppMessage(receipt),availabilityMessage('Cliente',raw,['2099-11-10'],'pending')]){assert.ok(text.includes(short));assert.ok(!text.includes(raw));}
assert.equal(JSON.stringify(receipt),before);assert.ok(receiptText(receipt).includes('Villa escrita por el cliente'));
const catalog=clientCatalog(defaultCatalog());
const legacy=estimateQuote(catalog,{eventType:'cena_privada',eventDate:'2099-11-10',zoneId:'zona-0',packageId:'desayunos',guestsCount:8,selectedExtras:{},selectedDishes:{desayuno:'omelette'}});
assert.ok(receiptText({...receipt,estimate:legacy}).includes(short));
console.log('OK: stable readable folios, 48-bit quote aliases/64-bit event encoding, historical passthrough, literal-safe lookup, 10,000 sample aliases, consistent messages/receipt and immutable snapshots. No DB. Example: '+short);
