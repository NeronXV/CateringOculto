import {mkdir,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const dir='.local-data/docker-secrets';await mkdir(dir,{recursive:true});
for(const name of ['db_password','db_root_password','session_secret']) {
  try {await writeFile(`${dir}/${name}`,randomBytes(48).toString('hex'),{flag:'wx',mode:0o600});}
  catch(error){if(error.code!=='EEXIST')throw error;}
}
console.log('Secretos Docker preparados sin reemplazar valores existentes. No compartir esta carpeta.');
