import assert from 'node:assert/strict';
import type {Pool} from 'mysql2/promise';
type Request=(route:string,body?:unknown,cookie?:string,origin?:string)=>Promise<Response>;
export async function testUserRoles(pool:Pool,request:Request,admin:string,editor:string,secondAdmin:string) {
  assert.equal((await request('/users/1',{role:'editor',active:true},editor)).status,403);
  assert.equal((await request('/users/2',{role:'admin',active:true},editor)).status,403);
  assert.equal((await request('/users/2',{role:'sales',active:true},admin)).status,400);
  const list=await (await request('/users',undefined,admin)).json();
  assert.ok(list.every((user:any)=>!('password_hash' in user)));
  assert.equal((await request('/users/2',{role:'admin',active:true},admin)).status,200);
  // Existing editor session receives new permissions, and loses them immediately on demotion.
  assert.equal((await request('/users',undefined,editor)).status,200);
  assert.equal((await request('/users/2',{role:'editor',active:true},admin)).status,200);
  assert.equal((await request('/users',undefined,editor)).status,403);
  const concurrent=await Promise.all([request('/users/1',{role:'editor',active:true},admin),request('/users/3',{role:'editor',active:true},secondAdmin)]);
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
  const [rows]=await pool.query<any[]>('SELECT id,role,active FROM staff_users ORDER BY id');
  assert.equal(rows.filter(u=>u.role==='admin' && u.active).length,1);
  const survivor=rows.find(u=>u.role==='admin' && u.active),cookie=Number(survivor.id)===1?admin:secondAdmin;
  assert.equal((await request('/users/'+survivor.id,{role:'admin',active:false},cookie)).status,409);
  const [audit]=await pool.query<any[]>('SELECT document FROM staff_access_audit');
  assert.ok(audit.length>=5);assert.ok(audit.every(row=>!JSON.stringify(row.document).includes('password')));
  // Restore fixture accounts for the remaining session-expiry tests.
  await pool.query("UPDATE staff_users SET role='admin' WHERE id IN (1,3)");
  console.log('OK: MariaDB real; solo dos roles, editor sin gestión de cuentas, permisos inmediatos y último admin protegido ante concurrencia.');
}
