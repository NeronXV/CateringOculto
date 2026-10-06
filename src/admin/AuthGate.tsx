import { useEffect, useState, type ReactNode } from 'react';
import './Admin.css';
import Inbox from './Inbox';
import Users from './Users';
import Operations from './Operations';
interface User {name:string;email:string;role:string;}
interface Status {setupRequired:boolean;setupDisabled?:boolean;user:User|null;}
async function api(path:string,body?:unknown) {
  const response=await fetch(`/api/local-editor/${path}`,body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : undefined);
  const data=await response.json();
  if(!response.ok)throw new Error(data.error ?? 'No se pudo completar la operación.');
  return data;
}
export default function AuthGate({children}:{children:ReactNode}) {
  const [status,setStatus]=useState<Status|null>(null);
  const [fileMode,setFileMode]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [view,setView]=useState('content');
  const [eventQuote,setEventQuote]=useState<string|null>(null);
  const checkAccess=async()=>{
    setBusy(true);setError('');
    try {const mode=await api('mode');if(!mode.authentication)setFileMode(true);else setStatus(await api('auth/status'));}
    catch {setError('No pudimos conectar con el servicio de acceso. Si estás en local, inicia el proyecto con npm run local:start y vuelve a intentar.');}
    finally {setBusy(false);}
  };
  useEffect(()=>{void checkAccess();},[]);
  if(fileMode)return <>{children}</>;
  const logout=async()=>{setBusy(true);try{await api('auth/logout',{});window.location.reload();}catch{setError('No se pudo cerrar la sesión. Intenta de nuevo.');setBusy(false);}};
  if(status?.user)return <><div className="auth-session"><span>{status.user.name} · {status.user.role==='admin'?'Admin':'Editor'}</span><button aria-pressed={view==='content'} onClick={()=>setView('content')}>Contenido</button><button aria-pressed={view==='events'} onClick={()=>setView('events')}>Agenda y eventos</button><button aria-pressed={view==='inbox'} onClick={()=>setView('inbox')}>Solicitudes</button>{status.user.role==='admin' && <button aria-pressed={view==='users'} onClick={()=>setView('users')}>Usuarios y roles</button>}<button disabled={busy} onClick={()=>void logout()}>Cerrar sesión</button>{error && <span role="alert">{error}</span>}</div><div hidden={view!=='content'}>{children}</div><div hidden={view!=='inbox'}><Inbox onEvent={id=>{setEventQuote(id);setView('events');}}/></div><div hidden={view!=='events'}><Operations quoteId={eventQuote}/></div>{view==='users' && status.user.role==='admin' && <Users onAccessChange={async()=>{const next=await api('auth/status');setStatus(next);if(next.user?.role!=='admin')setView('content');}}/>}</>;
  return <div className="auth-page"><a href="/">← Volver al restaurante</a><div className="auth-card"><img src="/logo-catering-oculto.png" alt=""/><p>ESTUDIO DE CONTENIDO</p><h1>{!status?'Conectando con el panel':status.setupRequired?'Crea tu acceso':'Bienvenido de nuevo'}</h1><p>{!status?'Estamos comprobando el servicio de acceso.':status.setupRequired?'Configura la primera cuenta de propietario en este equipo.':'Inicia sesión para administrar Catering Oculto.'}</p>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
    {status?.setupDisabled && <p role="status">El administrador debe crear la primera cuenta con el comando del servidor antes de iniciar sesión.</p>}
    {status ? <form onSubmit={async event=>{
      event.preventDefault();const form=event.currentTarget;const data=new FormData(form);setBusy(true);setError('');
      try {
        await api(status.setupRequired?'auth/setup':'auth/login',Object.fromEntries(data));
        form.reset();setStatus(await api('auth/status'));
        if(status.setupRequired)setMessage('Cuenta creada. Ahora inicia sesión con tus datos.');
      } catch(err){setError(err instanceof Error?err.message:'No se pudo completar la operación.');}
      finally{setBusy(false);}
    }}><fieldset disabled={busy} className="admin-inputs">
      {status.setupRequired && <label className="admin-field">Tu nombre<input name="name" autoComplete="name" required maxLength={80}/></label>}
      <label className="admin-field">Correo<input name="email" type="email" autoComplete="username" required maxLength={254}/></label>
      <label className="admin-field">Contraseña<input name="password" type="password" autoComplete={status.setupRequired?'new-password':'current-password'} required minLength={status.setupRequired?12:1} maxLength={128}/></label>
      {status.setupRequired && <small>Usa al menos 12 caracteres. No compartas tu contraseña en el chat.</small>}
      <button className="admin-primary" type="submit">{busy?'Procesando…':status.setupRequired?'Crear cuenta de propietario':'Entrar al panel'}</button>
    </fieldset></form>:!error && <p>Cargando acceso…</p>}
    {!status && error && <button className="admin-primary" type="button" disabled={busy} onClick={()=>void checkAccess()}>{busy?'Comprobando…':'Reintentar conexión'}</button>}
    <small>Acceso privado · Si necesitas recuperar tu acceso, contacta al administrador.</small>
  </div></div>;
}
