import assert from 'node:assert/strict';
import type { Pool } from 'mysql2/promise';
type Request=(route:string,body?:unknown,cookie?:string,origin?:string)=>Promise<Response>;
export async function testInbox(pool:Pool,request:Request,owner:string,editor:string,sales:string) {
  for(const path of ['/inbox','/inbox/staff','/inbox/00000000-0000-0000-0000-000000000000']) {
    assert.equal((await request(path)).status,401);
    if(path!=='/inbox/00000000-0000-0000-0000-000000000000')assert.equal((await request(path,undefined,editor)).status,200);
  }
  const list=await (await request('/inbox',undefined,sales)).json();assert.equal(list.total,2);
  const id=list.items[0].id;
  assert.equal(list.items[0].contact,undefined);
  assert.equal((await request('/inbox/'+id,{},editor)).status,400);
  assert.equal((await request('/inbox/'+id,{})).status,401);
  const detail=await (await request('/inbox/'+id,undefined,owner)).json();
  assert.equal(detail.contact.phone,'+52 612 000 0000');assert.equal(detail.followup.revision,0);
  const staff=await (await request('/inbox/staff',undefined,sales)).json();assert.equal(staff.length,3);
  const [users]=await pool.query<any[]>('SELECT id,role FROM staff_users');
  const salesId=Number(users.find(u=>u.role==='admin' && Number(u.id)!==1).id),editorId=Number(users.find(u=>u.role==='editor').id);
  const change={...detail.followup,status:'en_revision',assigneeId:salesId,nextAction:'Llamada ficticia',nextDate:'2099-06-01',note:'Nota interna de prueba'};

  assert.equal((await request('/inbox/'+id,{...change,assigneeId:999999},owner)).status,400);
  assert.equal((await request('/inbox/'+id,{...change,nextDate:'2099-02-30'},owner)).status,400);
  assert.equal((await request('/inbox/'+id,{...change,status:'pagada'},owner)).status,400);
  assert.equal((await request('/inbox/'+id,{...change,totalCents:1},owner)).status,400);
  assert.equal((await request('/inbox/'+id,change,owner,'https://outside.test')).status,403);
  const saved=await Promise.all([request('/inbox/'+id,change,owner),request('/inbox/'+id,change,sales)]);
  assert.deepEqual(saved.map(r=>r.status).sort(),[200,409]);
  const after=await (await request('/inbox/'+id,undefined,sales)).json();
  assert.equal(after.followup.revision,1);assert.equal(after.activity.length,1);assert.equal(after.activity[0].change.note,change.note);
  assert.deepEqual(after.estimate,detail.estimate);assert.deepEqual(after.contact,detail.contact);
  assert.equal((await (await request('/inbox?status=en_revision',undefined,owner)).json()).total,1);
  assert.equal((await (await request('/inbox?q='+encodeURIComponent(detail.folio),undefined,owner)).json()).total,1);
  assert.equal((await (await request('/inbox?q=Persona',undefined,owner)).json()).total,2);
  assert.equal((await (await request('/inbox?q=%25',undefined,owner)).json()).total,0);
  assert.equal((await request('/inbox?page=-1',undefined,owner)).status,400);
  assert.equal((await request('/inbox?status=unknown',undefined,owner)).status,400);
  assert.equal((await request('/inbox/00000000-0000-0000-0000-000000000000',undefined,owner)).status,404);
  assert.equal((await request('/inbox/'+id,{...after.followup,status:'cerrada',assigneeId:null,nextAction:'',nextDate:'',note:'Fin de seguimiento ficticio'},sales)).status,200);
  const final=await (await request('/inbox/'+id,undefined,owner)).json();assert.equal(final.activity.length,2);assert.equal(final.followup.status,'cerrada');
  const [stored]=await pool.execute<any[]>('SELECT sales_status FROM quote_requests WHERE id=?',[id]);assert.equal(stored[0].sales_status,'cerrada');
  console.log('OK: bandeja MariaDB real; permisos, filtros, asignación, auditoría, conflicto concurrente y snapshot intacto.');
}
