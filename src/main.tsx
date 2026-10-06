import { SERVER_ENABLED } from './config/runtime';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyCatalog } from './admin/catalog';

async function start() {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  if (SERVER_ENABLED && window.location.pathname === '/seguimiento') {const {default:Tracking}=await import('./Tracking');root.render(<Tracking/>);return;}
  if (SERVER_ENABLED && window.location.pathname === '/admin') {
    const {default: Admin} = await import('./admin/Admin');
    const {default: AuthGate} = await import('./admin/AuthGate');
    root.render(<React.StrictMode><AuthGate><Admin/></AuthGate></React.StrictMode>);
    return;
  }
  if (window.location.pathname === '/admin') {
    root.render(<p>El panel administrativo todavía no está habilitado en producción.</p>); return;
  }
  const preview = SERVER_ENABLED && new URLSearchParams(window.location.search).get('preview') === '1';
  if (SERVER_ENABLED) {
    try {
      const response = await fetch(`/api/local-editor/${preview ? 'draft' : 'published'}`);
      if (response.status===401 || response.status===403) {window.location.assign('/admin');return;}
      if (!response.ok) throw new Error('No se pudo cargar el contenido.');
      applyCatalog(await response.json());
    } catch {
      root.render(<div style={{padding:40}} role="alert"><h1>No se pudo cargar el catálogo local</h1><p>Comprueba que el servidor esté iniciado y vuelve a cargar la página. No se han reemplazado tus datos.</p><button onClick={()=>window.location.reload()}>Reintentar</button></div>);return;
    }
  }
  root.render(<React.StrictMode>{preview && <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:9999,background:'#f1deb6',color:'#253529',padding:12,textAlign:'center',fontSize:13}}>Vista previa del borrador · Todavía no publicado. <a href="/admin" style={{color:'inherit',textDecoration:'underline'}}>Volver al panel</a></div>}<App/></React.StrictMode>);
}
void start();
