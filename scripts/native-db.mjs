import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { createConnection } from 'mysql2/promise';
import { createServer } from 'node:net';

// Isolated development instance using existing XAMPP binaries, not its data/service.
const base=process.env.MARIADB_BASEDIR || 'C:/xampp/mysql';
const data=resolve('.local-data/mariadb');
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const port=Number(env.DB_PORT);
if(env.DB_HOST!=='127.0.0.1' || port!==3307 || env.DB_NAME!=='restauran' || env.DB_USER!=='restauran_app')throw new Error('Esta herramienta solo administra la instancia local del restaurante en 3307.');
const config={host:'127.0.0.1',port,user:'root',password:env.DB_ROOT_PASSWORD,connectTimeout:1000};
async function connectOwn() {
  const conn=await createConnection(config);
  const [rows]=await conn.query('SELECT @@datadir AS dir');
  if(resolve(rows[0].dir).toLowerCase()!==data.toLowerCase()){await conn.end();throw new Error('El puerto pertenece a otra instancia.');}
  return conn;
}
try {
  if(process.argv[2]==='stop') {
    const conn=await connectOwn();await conn.query('SHUTDOWN');await conn.end();console.log('Base local del restaurante detenida.');
  } else {
    let conn;
    try{conn=await connectOwn();}catch{
      // Do not launch on an occupied port, even if credentials mismatch.
      const probe=createServer();await new Promise((done,fail)=>{probe.once('error',fail);probe.listen(port,'127.0.0.1',()=>probe.close(done));});
      const init=join(base,'bin/mysql_install_db.exe');const executable=join(base,'bin/mysqld.exe');
      if(!existsSync(init)||!existsSync(executable))throw new Error('No se encontraron los ejecutables de MariaDB.');
      if(!existsSync(join(data,'mysql'))) {
        if(existsSync(data))throw new Error('La carpeta de datos existe pero está incompleta. Revisar sin sobrescribir.');
        mkdirSync(resolve('.local-data'),{recursive:true});
        execFileSync(init,[`--datadir=${data}`,`--password=${env.DB_ROOT_PASSWORD}`,`--port=${port}`],{windowsHide:true,stdio:'pipe'});
      }
      const ini=resolve('.local-data/mariadb-local.ini');
      const pathValue=value=>value.replaceAll('\\','/');
      writeFileSync(ini,`[mysqld]\nbasedir=${pathValue(base)}\ndatadir=${pathValue(data)}\nport=${port}\nbind-address=127.0.0.1\nskip-name-resolve\ncharacter-set-server=utf8mb4\ncollation-server=utf8mb4_unicode_ci\nlog-error=${pathValue(resolve('.local-data/mariadb.log'))}\n`);
      const child=spawn(executable,[`--defaults-file=${ini}`],{windowsHide:true,detached:true,stdio:'ignore'});child.unref();
      for(let i=0;i<30;i++){try{conn=await connectOwn();break;}catch{await new Promise(done=>setTimeout(done,500));}}
      if(!conn)throw new Error('MariaDB no pudo iniciar; revisar el registro local.');
    }
    try {
      await conn.query('CREATE DATABASE IF NOT EXISTS restauran CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      await conn.query("CREATE USER IF NOT EXISTS 'restauran_app'@'127.0.0.1' IDENTIFIED BY ?",[env.DB_PASSWORD]);
      await conn.query("GRANT ALL PRIVILEGES ON restauran.* TO 'restauran_app'@'127.0.0.1'");
      console.log('MariaDB local listo en 127.0.0.1:3307. Datos de XAMPP sin modificar.');
    } finally {await conn.end();}
  }
} catch {console.error('No se pudo iniciar/detener la instancia local. Revisar puerto 3307 y .local-data/mariadb.log. No se muestran credenciales.');process.exitCode=1;}
