import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.env.local')) {
  console.log('La configuración local ya existe; no se han reemplazado sus claves.');
} else {
  const secret = () => randomBytes(32).toString('hex');
  writeFileSync('.env.local', `EDITOR_STORAGE=file\nDB_HOST=127.0.0.1\nDB_PORT=3307\nDB_NAME=restauran\nDB_USER=restauran_app\nDB_PASSWORD=${secret()}\nDB_ROOT_PASSWORD=${secret()}\nSESSION_SECRET=${secret()}\n`, {flag:'wx',mode:0o600});
  console.log('Configuración local creada. Las claves no se muestran y están excluidas de Git.');
}
