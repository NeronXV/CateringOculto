"""Run on the authorized VPS as root; preserve the existing Vivero image/data."""
import json, pathlib, subprocess, tarfile, time, urllib.request

def run(*args):
    return subprocess.check_output(args, text=True).strip()

existing=subprocess.run(['docker','inspect','platform-proxy-proxy-1'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
if existing.returncode==0:
    raise SystemExit('Proxy already separated; do not repeat the initial migration.')

proxy = pathlib.Path('/srv/proxy')
backup = proxy / ('backups/' + time.strftime('%Y%m%d-%H%M%S'))
backup.mkdir(parents=True, mode=0o700)
overlay = pathlib.Path('/srv/apps/vivero-dulcinea/ops/compose.host.yaml')
original = overlay.read_text()
(backup / 'compose.host.yaml').write_text(original)
(backup / 'Caddyfile').write_text((proxy / 'Caddyfile').read_text())
(backup / 'owner.json').write_text((proxy / 'owner.json').read_text())
image = run('docker', 'inspect', 'vivero-vps-web-1', '--format', '{{.Image}}')
webconfig = (proxy / 'Caddyfile').read_text().replace('{$VIVERO_DOMAIN} {', 'http://{$VIVERO_DOMAIN} {').replace('{$VIVERO_LEGACY_DOMAIN:localhost} {', 'http://{$VIVERO_LEGACY_DOMAIN:localhost} {')
webpath = pathlib.Path('/srv/apps/vivero-dulcinea/ops/Caddyfile.http')
webpath.write_text(webconfig)
platform = proxy / 'platform.Caddyfile'
platform.write_text('''viverodulcinea.bajastack.network, bajastack.network {
    reverse_proxy vivero-dulcinea-proxy:80
}
cateringoculto.bajastack.network {
    encode zstd gzip
    reverse_proxy catering-oculto-web:3000
}
''')
compose = proxy / 'compose.yaml'
compose.write_text('''name: platform-proxy
services:
  proxy:
    image: ''' + image + '''
    restart: unless-stopped
    ports: ["80:80", "443:443", "443:443/udp"]
    volumes:
      - ./platform.Caddyfile:/etc/caddy/Caddyfile:ro
      - certificates:/data
      - config:/config
    networks: [proxy]
    security_opt: ["no-new-privileges:true"]
    logging:
      driver: json-file
      options: {max-size: "10m", max-file: "3"}
networks:
  proxy:
    external: true
    name: platform_proxy
volumes:
  certificates:
    external: true
    name: vivero-vps_caddy_data
  config:
''')
# Keep the same compose project, database, API, image and frontend files.
new_overlay = '''services:
  web:
    ports: !reset []
    volumes: !override
      - /srv/apps/vivero-dulcinea/ops/Caddyfile.http:/etc/caddy/Caddyfile:ro
    networks:
      api: {}
      proxy:
        aliases: [vivero-dulcinea-proxy]
networks:
  proxy:
    external: true
    name: platform_proxy
'''
base = ['docker','compose','--env-file','/srv/apps/vivero-dulcinea/shared/.env.vps','-p','vivero-vps','-f','/srv/apps/vivero-dulcinea/current/ViveroApp/infra/docker/compose.yaml','-f','/srv/apps/vivero-dulcinea/current/ViveroApp/infra/docker/compose.vps.yaml','-f',str(overlay)]
pbase = ['docker','compose','-p','platform-proxy','-f',str(compose)]
run(*pbase,'config','--quiet')
run('docker','run','--rm','--entrypoint','caddy','-v',str(platform)+':/etc/caddy/Caddyfile:ro',image,'validate','--config','/etc/caddy/Caddyfile')
overlay.write_text(new_overlay)
try:
    run(*base,'config','--quiet')
    run('docker','stop','vivero-vps-web-1')
    for name in ['vivero-vps_caddy_data','vivero-vps_caddy_config']:
        path=run('docker','volume','inspect',name,'--format','{{.Mountpoint}}')
        with tarfile.open(backup/(name+'.tar.gz'),'w:gz') as tar:
            tar.add(path,arcname='.')
        with tarfile.open(backup/(name+'.tar.gz')) as tar:
            assert tar.getmembers()
    run(*base,'up','-d','--no-deps','--no-build','web')
    run(*pbase,'up','-d')
    for i in range(15):
        try:
            with urllib.request.urlopen('https://viverodulcinea.bajastack.network/health',timeout=10) as r:
                assert r.status == 200
            break
        except Exception:
            if i == 14: raise
            time.sleep(2)
except Exception:
    subprocess.run(pbase+['stop'],check=False)
    overlay.write_text(original)
    run(*base,'up','-d','--no-deps','--no-build','web')
    raise
(proxy/'owner.json').write_text(json.dumps({'container':'platform-proxy-proxy-1','compose_project':'platform-proxy','certificates':['vivero-vps_caddy_data'],'backup':str(backup)},indent=2))
print('PASS: independent HTTPS proxy and Vivero health; certificate backup:', backup)
