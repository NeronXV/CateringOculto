import type {Express} from 'express';
import type {Pool, RowDataPacket, ResultSetHeader} from 'mysql2/promise';
import {hash,argon2id} from 'argon2';
import {rateLimit} from 'express-rate-limit';
import {accountInput} from './authApp';

export function registerUsers(app:Express,pool:Pool) {
  app.use('/users',(_req,res,next)=>{
    if(res.locals.user.role!=='admin'){res.status(403).json({error:'Solo un administrador puede gestionar usuarios y roles.'});return;}
    next();
  });
  app.get('/users',async(_req,res)=>{
    const [users]=await pool.query<RowDataPacket[]>('SELECT id,name,email,role,active FROM staff_users ORDER BY id');res.json(users);
  });
  app.post('/users',rateLimit({windowMs:60_000,limit:10,legacyHeaders:false}),async(req,res)=>{
    let input:ReturnType<typeof accountInput>;
    try {input=accountInput(req.body);}catch {res.status(400).json({error:'Escribe nombre, correo válido y contraseña de 12 a 128 caracteres.'});return;}
    const role=req.body.role;
    if(!['admin','editor'].includes(role)){res.status(400).json({error:'Elige admin o editor.'});return;}
    const passwordHash=await hash(input.password,{type:argon2id});
    const conn=await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('SELECT id FROM editorial_state WHERE id=1 FOR UPDATE');
      const [actor]=await conn.execute<RowDataPacket[]>('SELECT id,role,active FROM staff_users WHERE id=? FOR UPDATE',[res.locals.user.id]);
      if(!actor.length || !actor[0].active || actor[0].role!=='admin'){await conn.rollback();res.status(403).json({error:'Tu cuenta ya no puede gestionar usuarios.'});return;}
      const [result]=await conn.execute<ResultSetHeader>('INSERT INTO staff_users (email,name,password_hash,role) VALUES (?,?,?,?)',[input.email,input.name,passwordHash,role]);
      await conn.execute('INSERT INTO staff_access_audit (actor_id,target_id,action,document) VALUES (?,?,?,?)',[res.locals.user.id,result.insertId,'create',JSON.stringify({role,active:true})]);
      await conn.commit();res.status(201).json({id:result.insertId});
    } catch(error) {
      await conn.rollback();
      if((error as {code?:string}).code==='ER_DUP_ENTRY'){res.status(409).json({error:'Ya existe una cuenta con ese correo.'});return;}
      throw error;
    } finally {conn.release();}
  });
  app.post('/users/:id',async(req,res)=>{
    const id=Number(req.params.id),body=req.body;
    if(!Number.isSafeInteger(id) || id<1 || !body || Object.keys(body).sort().join(',')!=='active,role' || !['admin','editor'].includes(body.role) || typeof body.active!=='boolean'){
      res.status(400).json({error:'Revisa el usuario, su rol y el estado de acceso.'});return;
    }
    const conn=await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Serialize access changes, including competing attempts to remove the last admin.
      await conn.query('SELECT id FROM editorial_state WHERE id=1 FOR UPDATE');
      const [users]=await conn.query<RowDataPacket[]>('SELECT id,role,active FROM staff_users ORDER BY id FOR UPDATE');
      const actor=users.find(u=>Number(u.id)===Number(res.locals.user.id));
      if(!actor || !actor.active || actor.role!=='admin'){await conn.rollback();res.status(403).json({error:'Tu cuenta ya no puede gestionar usuarios.'});return;}
      const target=users.find(u=>Number(u.id)===id);
      if(!target){await conn.rollback();res.status(404).json({error:'La cuenta no existe.'});return;}
      if(target.active && target.role==='admin' && (!body.active || body.role!=='admin') && users.filter(u=>u.active && u.role==='admin').length===1){
        await conn.rollback();res.status(409).json({error:'Debe quedar al menos un administrador activo.'});return;
      }
      await conn.execute('UPDATE staff_users SET role=?,active=? WHERE id=?',[body.role,body.active,id]);
      await conn.execute('INSERT INTO staff_access_audit (actor_id,target_id,action,document) VALUES (?,?,?,?)',[actor.id,id,'update',JSON.stringify({before:{role:target.role,active:Boolean(target.active)},after:body})]);
      await conn.commit();res.json({ok:true});
    }catch(error){await conn.rollback();throw error;}finally{conn.release();}
  });
}
