// Disposable MariaDB instance: uses binaries only, never an existing data directory.
import {spawn, spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdirSync, existsSync, rmSync} from 'node:fs';
import {resolve, join, sep} from 'node:path';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {createConnection} from 'mysql2/promise';

const base=process.env.MARIADB_BASEDIR || 'C:/xampp/mysql';
const target=process.argv[2]??'tests/auth.ts';
if(!['tests/auth.ts','tests/fullJourney.mjs','tests/migration007.ts','tests/taxAdministration.ts'].includes(target))throw new Error('Unknown isolated test target.');
if(!existsSync(join(base,'bin/mysql_install_db.exe')))throw new Error('MariaDB binaries unavailable.');
const root=resolve('.local-data/qa');
mkdirSync(root,{recursive:true});
const directory=resolve(root,'mariadb-'+randomBytes(8).toString('hex'));
if(!directory.startsWith(root+sep))throw new Error('Invalid test directory.');
const password=randomBytes(24).toString('hex');
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');
const port=probe.address().port;await new Promise(done=>probe.close(done));
const installed=spawnSync(join(base,'bin/mysql_install_db.exe'),[`--datadir=${directory}`,`--password=${password}`,`--port=${port}`],{windowsHide:true,stdio:'pipe'});
if(installed.status!==0)throw new Error('Unable to initialize isolated MariaDB. Installer output omitted to protect credentials.');
const processDb=spawn(join(base,'bin/mysqld.exe'),['--no-defaults',`--basedir=${base}`,`--datadir=${directory}`,`--port=${port}`,'--bind-address=127.0.0.1','--skip-name-resolve',`--log-error=${join(directory,'test.log')}`],{windowsHide:true,stdio:'ignore'});
let connection;
try {
  for(let n=0;n<30;n++){
    try{connection=await createConnection({host:'127.0.0.1',port,user:'root',password,connectTimeout:500});break;}
    catch{await new Promise(done=>setTimeout(done,300));}
  }
  if(!connection)throw new Error('Isolated MariaDB did not start.');
  console.log('Running real SQL integration on a fresh, isolated MariaDB instance.');
  const child=spawn(process.execPath,['--import','tsx',target],{windowsHide:true,stdio:'inherit',env:{...process.env,AUTH_TEST_MYSQL:'1',ISOLATED_MARIADB:'1',MARIADB_BASEDIR:base,DB_HOST:'127.0.0.1',DB_PORT:String(port),DB_ROOT_PASSWORD:password}});
  const [code]=await once(child,'exit');process.exitCode=code ?? 1;
} finally {
  if(connection){await connection.query('SHUTDOWN').catch(()=>{});await connection.end();}
  if(processDb.exitCode===null)await Promise.race([once(processDb,'exit'),new Promise(done=>setTimeout(done,3000))]);
  if(processDb.exitCode===null)processDb.kill();
  // Only the checked, random test directory may be removed.
  if(resolve(directory).startsWith(root+sep))rmSync(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
