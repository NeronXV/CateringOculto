import json,pathlib
p=pathlib.Path('/srv/apps/projects.json')
data=json.loads(p.read_text())
backup=p.with_name('projects.before-catering.json')
if not backup.exists():backup.write_text(p.read_text())
data['vivero-dulcinea'].update(domain='viverodulcinea.bajastack.network',proxy_container='platform-proxy-proxy-1')
data['catering-oculto']={'compose_project':'catering-oculto','domain':'cateringoculto.bajastack.network','entrypoint':'/srv/apps/catering-oculto','volumes':['catering-oculto_db_data','catering-oculto_media'],'proxy_container':'platform-proxy-proxy-1','shared_proxy_network':'platform_proxy'}
p.write_text(json.dumps(data,indent=2))
print('PASS: registry updated; prior registry preserved')
