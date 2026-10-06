import hashlib, json, pathlib, subprocess, tarfile, time, urllib.request

def command(*args, data=None):
    return subprocess.check_output(args, input=data)

db='catering-oculto-db-1'
prefix='umask 077; f=$(mktemp); trap "rm -f $f" EXIT; printf "[client]\\nuser=root\\npassword=%s\\n" "$(cat /run/secrets/db_root_password)" > "$f"; '
def sql(statement, database='catering'):
    return command('docker','exec','-i',db,'sh','-c',prefix+'mariadb --defaults-extra-file="$f" --batch --skip-column-names "$1"','sh',database,data=statement.encode())

print('Migration markers:', sql('SELECT version FROM schema_migrations ORDER BY version').decode().strip())
assert sql('SELECT COUNT(*) FROM schema_migrations').strip()==b'3'
assert sql('SELECT COUNT(*) FROM staff_users').strip()==b'0'
assert sql('SELECT COUNT(*) FROM editorial_state WHERE id=1').strip()==b'1'
print('PASS: schema, catalog and no automatically created staff accounts')

folder=pathlib.Path('/srv/backups/catering-oculto')/time.strftime('%Y%m%d-%H%M%S')
folder.mkdir(mode=0o700)
subprocess.check_call(['docker','stop','catering-oculto-app-1'],stdout=subprocess.DEVNULL)
try:
    dump=command('docker','exec',db,'sh','-c',prefix+'mariadb-dump --defaults-extra-file="$f" --single-transaction --routines --triggers catering')
    (folder/'database.sql').write_bytes(dump)
    mount=command('docker','volume','inspect','catering-oculto_media','--format','{{.Mountpoint}}').decode().strip()
    with tarfile.open(folder/'media.tar.gz','w:gz') as tar:tar.add(mount,arcname='.')
finally:
    subprocess.check_call(['docker','start','catering-oculto-app-1'],stdout=subprocess.DEVNULL)
manifest={name:hashlib.sha256((folder/name).read_bytes()).hexdigest() for name in ['database.sql','media.tar.gz']}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2))
for name,digest in manifest.items():assert hashlib.sha256((folder/name).read_bytes()).hexdigest()==digest
restore='catering_restore_'+time.strftime('%Y%m%d%H%M%S')
sql('CREATE DATABASE '+restore)
try:
    sql(dump.decode(),restore)
    for table in ['schema_migrations','editorial_state','staff_users']:
        assert sql('SELECT COUNT(*) FROM '+table,restore)==sql('SELECT COUNT(*) FROM '+table)
    assert sql('SELECT SHA2(document,256) FROM editorial_state',restore)==sql('SELECT SHA2(document,256) FROM editorial_state')
    with tarfile.open(folder/'media.tar.gz') as tar:
        for member in tar:
            if member.isfile():assert tar.extractfile(member).read() is not None
    print('PASS: SQL restored in isolated temporary database; catalog hash matches; media archive readable')
finally:sql('DROP DATABASE '+restore)
(folder/'COMPLETE').write_text('SQL restore verified; media archive read; '+time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()))
pathlib.Path('/srv/apps/catering-oculto/current').symlink_to('/srv/apps/catering-oculto/releases/20261003-initial') if not pathlib.Path('/srv/apps/catering-oculto/current').exists() else None
print('Backup:',folder)

for host,paths in [('viverodulcinea.bajastack.network',['/','/login','/health']),('cateringoculto.bajastack.network',['/','/admin','/health/ready','/api/local-editor/published'])]:
    for path in paths:
        for attempt in range(10):
            try:
                with urllib.request.urlopen('https://'+host+path,timeout=10) as r:
                    assert r.status==200
                    print(host+path,r.status)
                break
            except Exception:
                if attempt==9:raise
                time.sleep(3)
for path in ['/state','/draft','/inbox']:
    try:urllib.request.urlopen('https://cateringoculto.bajastack.network/api/local-editor'+path)
    except urllib.error.HTTPError as e:assert e.code==401;print('Private route',path,e.code)
    else:raise AssertionError('Private route exposed')
