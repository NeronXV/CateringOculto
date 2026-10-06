import {useEffect,useState} from 'react';
type Role='admin'|'editor';
interface Staff {id:number;name:string;email:string;role:Role;active:boolean;}
async function request(path:string,body?:unknown) {
  const response=await fetch('/api/local-editor/users'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
  const data=await response.json();if(!response.ok)throw new Error(data.error ?? 'No se pudo actualizar el acceso.');return data;
}
function AccessRow({user,busy,onSave}:{user:Staff;busy:boolean;onSave:(id:number,role:Role,active:boolean)=>Promise<void>}) {
  const [role,setRole]=useState(user.role),[active,setActive]=useState(Boolean(user.active));
  useEffect(()=>{setRole(user.role);setActive(Boolean(user.active));},[user.role,user.active]);
  return <fieldset className="admin-item" disabled={busy}><legend>{user.name}</legend><p>{user.email}</p>
    <label className="admin-field">Rol de {user.name}<select value={role} onChange={e=>setRole(e.target.value as Role)}><option value="admin">Admin</option><option value="editor">Editor</option></select></label>
    <label className="admin-check"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>Acceso activo para {user.name}</label>
    <button className="admin-secondary" type="button" disabled={role===user.role && active===Boolean(user.active)} onClick={()=>void onSave(user.id,role,active)}>Guardar acceso de {user.name}</button>
  </fieldset>;
}
export default function Users({onAccessChange}:{onAccessChange:()=>Promise<void>}) {
  const [users,setUsers]=useState<Staff[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const load=async()=>setUsers(await request(''));
  useEffect(()=>{void load().catch(()=>setError('No se pudo cargar la lista de usuarios.'));},[]);
  const save=async(id:number,role:Role,active:boolean)=>{
    setBusy(true);setError('');setMessage('');
    try{await request('/'+id,{role,active});setMessage('Acceso actualizado.');await onAccessChange();await load();}
    catch(err){setError(err instanceof Error?err.message:'No se pudo guardar.');}finally{setBusy(false);}
  };
  return <main className="users-panel"><h1>Usuarios y roles</h1><p>Admin gestiona accesos. Editor administra contenido, fotos, precios y solicitudes. Ambas cuentas pueden publicar.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
    <section aria-label="Crear usuario"><h2>Añadir usuario</h2><form onSubmit={async event=>{
      event.preventDefault();const form=event.currentTarget,data=Object.fromEntries(new FormData(form));setBusy(true);setError('');setMessage('');
      try{await request('',data);form.reset();await load();setMessage('Usuario creado. Ya puede iniciar sesión con sus datos.');}
      catch(err){setError(err instanceof Error?err.message:'No se pudo crear la cuenta.');}finally{setBusy(false);}
    }}><fieldset className="admin-inputs" disabled={busy}><div className="admin-fields">
      <label className="admin-field">Nombre<input name="name" required maxLength={80} placeholder="Chef Carlos o chef Karen" autoComplete="off"/></label>
      <label className="admin-field">Correo<input name="email" type="email" required maxLength={254} autoComplete="off"/></label>
      <label className="admin-field">Contraseña inicial<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label>
      <label className="admin-field">Rol<select name="role" defaultValue="editor"><option value="editor">Editor</option><option value="admin">Admin</option></select></label>
    </div><p className="admin-hint">Usa una contraseña de al menos 12 caracteres y entrégala al titular por un canal privado.</p><button className="admin-primary" type="submit">{busy?'Guardando…':'Crear usuario'}</button></fieldset></form></section>
    <section aria-label="Usuarios existentes"><h2>Accesos del equipo</h2><div className="admin-collection">{users.map(user=><AccessRow key={user.id} user={user} busy={busy} onSave={save}/>)}</div></section>
  </main>;
}
