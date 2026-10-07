import { useEffect, useState, type ReactNode } from 'react';
import './Admin.css';
import Inbox from './Inbox';
import Users from './Users';
import Operations from './Operations';
import ChefMenus from './ChefMenus';

interface User { name: string; email: string; role: string; }
interface Status { setupRequired: boolean; setupDisabled?: boolean; user: User | null; }

async function api(path: string, body?: unknown) {
  const response = await fetch(`/api/local-editor/${path}`, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  } : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'No se pudo completar la operación.');
  return data;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [fileMode, setFileMode] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  // VISTA POR DEFECTO: Solicitudes (no Contenido)
  const [view, setView] = useState<'inbox' | 'events' | 'menus' | 'settings'>('inbox');
  const [settingsTab, setSettingsTab] = useState<'content' | 'users'>('content');
  const [eventQuote, setEventQuote] = useState<string | null>(null);

  const checkAccess = async () => {
    setBusy(true);
    setError('');
    try {
      const mode = await api('mode');
      if (!mode.authentication) setFileMode(true);
      else setStatus(await api('auth/status'));
    } catch {
      setError('No pudimos conectar con el servicio de acceso. Si estás en local, inicia el proyecto con npm run local:start.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void checkAccess();
  }, []);

  if (fileMode) return <>{children}</>;

  const logout = async () => {
    setBusy(true);
    try {
      await api('auth/logout', {});
      window.location.reload();
    } catch {
      setError('No se pudo cerrar la sesión. Intenta de nuevo.');
      setBusy(false);
    }
  };

  if (status?.user) {
    const isAdmin = status.user.role === 'admin';

    return (
      <div className="admin-app-root">
        {/* Barra de navegación principal del Chef */}
        <header className="auth-session-bar">
          <div className="auth-user-info">
            <a href="/" className="auth-logo-link" title="Ir al sitio público">
              <img src="/logo-catering-oculto.png" alt="" width="26" height="26" />
            </a>
            <div className="auth-user-text">
              <strong>{status.user.name}</strong>
              <small>{isAdmin ? 'Admin' : 'Editor'}</small>
            </div>
          </div>

          <nav className="auth-main-nav" aria-label="Navegación del panel">
            <button
              type="button"
              className={`auth-nav-btn ${view === 'inbox' ? 'active' : ''}`}
              onClick={() => setView('inbox')}
            >
              Solicitudes
            </button>
            <button
              type="button"
              className={`auth-nav-btn ${view === 'events' ? 'active' : ''}`}
              onClick={() => setView('events')}
            >
              Agenda
            </button>
            <button
              type="button"
              className={`auth-nav-btn ${view === 'menus' ? 'active' : ''}`}
              onClick={() => setView('menus')}
            >
              Menús
            </button>
            <button
              type="button"
              className={`auth-nav-btn ${view === 'settings' ? 'active' : ''}`}
              onClick={() => setView('settings')}
            >
              ⚙ Configuración
            </button>
          </nav>

          <div className="auth-bar-actions">
            <button
              type="button"
              className="auth-logout-btn"
              disabled={busy}
              onClick={() => void logout()}
            >
              Cerrar sesión
            </button>
          </div>
          {error && <span role="alert" className="auth-error-inline">{error}</span>}
        </header>

        {/* 1. SOLICITUDES (Pantalla principal) */}
        <div hidden={view !== 'inbox'}>
          <Inbox onEvent={id => { setEventQuote(id); setView('events'); }} />
        </div>

        {/* 2. AGENDA */}
        <div hidden={view !== 'events'}>
          <Operations quoteId={eventQuote} />
        </div>

        {/* 3. MENÚS DE LA COCINA */}
        <div hidden={view !== 'menus'}>
          <ChefMenus />
        </div>

        {/* 4. CONFIGURACIÓN (Textos web, zonas, impuestos y usuarios) */}
        {view === 'settings' && (
          <div className="settings-wrapper">
            {isAdmin && (
              <div className="settings-subnav-bar">
                <button
                  type="button"
                  className={`subnav-tab ${settingsTab === 'content' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('content')}
                >
                  Diseño de página & Datos del negocio
                </button>
                <button
                  type="button"
                  className={`subnav-tab ${settingsTab === 'users' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('users')}
                >
                  Usuarios y accesos del equipo
                </button>
              </div>
            )}

            {settingsTab === 'users' && isAdmin ? (
              <Users onAccessChange={async () => {
                const next = await api('auth/status');
                setStatus(next);
                if (next.user?.role !== 'admin') setSettingsTab('content');
              }} />
            ) : (
              <div>{children}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-page">
      <a href="/">← Volver a la página pública</a>
      <div className="auth-card">
        <img src="/logo-catering-oculto.png" alt="" />
        <p>PANEL PRIVADO</p>
        <h1>{!status ? 'Conectando con el panel' : status.setupRequired ? 'Crea tu acceso' : 'Bienvenido de nuevo'}</h1>
        <p>{!status ? 'Comprobando servicio de acceso…' : status.setupRequired ? 'Configura la primera cuenta de propietario en este equipo.' : 'Inicia sesión para administrar Catering Oculto.'}</p>
        {error && <p className="admin-error" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status">{message}</p>}
        {status?.setupDisabled && <p role="status">El administrador debe crear la primera cuenta antes de iniciar sesión.</p>}

        {status ? (
          <form onSubmit={async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            setBusy(true);
            setError('');
            try {
              await api(status.setupRequired ? 'auth/setup' : 'auth/login', Object.fromEntries(data));
              form.reset();
              setStatus(await api('auth/status'));
              if (status.setupRequired) setMessage('Cuenta creada. Ahora inicia sesión con tus datos.');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
            } finally {
              setBusy(false);
            }
          }}>
            <fieldset disabled={busy} className="admin-inputs">
              {status.setupRequired && (
                <label className="admin-field">
                  Tu nombre
                  <input name="name" autoComplete="name" required maxLength={80} />
                </label>
              )}
              <label className="admin-field">
                Correo
                <input name="email" type="email" autoComplete="username" required maxLength={254} />
              </label>
              <label className="admin-field">
                Contraseña
                <input
                  name="password"
                  type="password"
                  autoComplete={status.setupRequired ? 'new-password' : 'current-password'}
                  required
                  minLength={status.setupRequired ? 12 : 1}
                  maxLength={128}
                />
              </label>
              {status.setupRequired && <small>Usa al menos 12 caracteres. No compartas tu contraseña en el chat.</small>}
              <button className="admin-primary btn-touch" type="submit">
                {busy ? 'Procesando…' : status.setupRequired ? 'Crear cuenta de propietario' : 'Entrar al panel'}
              </button>
            </fieldset>
          </form>
        ) : (
          !error && <p>Cargando acceso…</p>
        )}

        {!status && error && (
          <button className="admin-primary btn-touch" type="button" disabled={busy} onClick={() => void checkAccess()}>
            {busy ? 'Comprobando…' : 'Reintentar conexión'}
          </button>
        )}
        <small>Acceso privado · Catering Oculto</small>
      </div>
    </div>
  );
}
