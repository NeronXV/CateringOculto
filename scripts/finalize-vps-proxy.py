import json,pathlib,subprocess,urllib.request,time
proxy=pathlib.Path('/srv/proxy')
compose=proxy/'compose.yaml'
original=compose.read_text()
digest='caddy:2.11.6-alpine@sha256:c776e0c6413b544d0459665e54ec7b8b2a15000c0cbee8b254da0067b1d184ff'
lines=original.splitlines()
updated='\n'.join('    image: '+digest if line.startswith('    image: ') else line for line in lines)+'\n'
base=['docker','compose','-p','platform-proxy','-f',str(compose)]
try:
    compose.write_text(updated)
    subprocess.check_call(base+['config','--quiet'])
    subprocess.check_call(base+['up','-d'])
    for host in ['viverodulcinea.bajastack.network','cateringoculto.bajastack.network']:
        for attempt in range(10):
            try:
                with urllib.request.urlopen('https://'+host+'/',timeout=10) as r:assert r.status==200
                break
            except Exception:
                if attempt==9:raise
                time.sleep(1)
except Exception:
    compose.write_text(original)
    subprocess.check_call(base+['up','-d'])
    raise
owner=json.loads((proxy/'owner.json').read_text());owner['image']=digest
(proxy/'owner.json').write_text(json.dumps(owner,indent=2))
registry=pathlib.Path('/srv/apps/projects.json')
data=json.loads(registry.read_text())
print('Registry structure:',type(data).__name__)
receipt={'slug':'catering-oculto','domain':'cateringoculto.bajastack.network','compose_project':'catering-oculto','release':'20261003-json-fix','volumes':['catering-oculto_db_data','catering-oculto_media'],'backup_directory':'/srv/backups/catering-oculto','owner_created':False,'content':'demonstration catalog; business approval pending','https_verified':True,'real_mariadb_tests_passed':True}
pathlib.Path('/srv/apps/catering-oculto/deployment.json').write_text(json.dumps(receipt,indent=2))
print('PASS: official independent proxy image; both sites verified; deployment receipt saved')
