# Despliegue Catering Oculto en VPS compartido

## Arquitectura

```
Internet (443)
    ↓
platform-proxy (Caddy global) → puertos 80/443
    ↓ (red Docker: platform_proxy)
catering-oculto-web:3000 (alias de red)
    ↓
┌─────────────────────────────────────┐
│ Stack: catering-oculto              │
│  ├─ app (Express + React build)     │
│  ├─ db (MariaDB 11.4)               │
│  └─ migrate (one-shot)              │
│                                     │
│ Redes: edge (proxy), database (DB)  │
│ Volúmenes: catering_db_data,        │
│            catering_media           │
└─────────────────────────────────────┘
```

- **Dominio**: `https://cateringoculto.bajastack.network`
- **Ubicación en VPS**: `/srv/apps/catering-oculto/`
- **Proxy global**: `platform-proxy` (Caddy en `/srv/proxy/`)
- **Proyecto aislado**: Compose project `catering-oculto`, redes y volúmenes propios

---

## Secretos

**NUNCA en variables de entorno ni `.env`.** Archivos en `/srv/apps/catering-oculto/shared/secrets/`:

| Archivo | Contenido | Generar con |
|---------|-----------|-------------|
| `db_password` | Password usuario `catering_app` | `openssl rand -hex 48` |
| `db_root_password` | Password root MariaDB | `openssl rand -hex 48` |
| `session_secret` | Firma cookies (≥32 chars) | `openssl rand -hex 48` |

Permisos: `chmod 600 * && chown -R 1000:1000 .`

---

## Primera instalación

### 1. Preparar directorios en VPS
```bash
mkdir -p /srv/apps/catering-oculto/{releases,shared/secrets,ops}
mkdir -p /srv/backups/catering-oculto
```

### 2. Generar secretos (SOLO EN VPS)
```bash
cd /srv/apps/catering-oculto/shared/secrets
openssl rand -hex 48 > db_password
openssl rand -hex 48 > db_root_password
openssl rand -hex 48 > session_secret
chmod 600 * && chown -R 1000:1000 .
```

### 3. Clonar release
```bash
cd /srv/apps/catering-oculto/releases
git clone --branch <TAG> --depth 1 <repo-url> <TAG>
ln -sfn <TAG> ../current
```

### 4. Configurar `.env` (no secretos)
```bash
cd /srv/apps/catering-oculto/current
cat > .env <<'EOF'
PUBLIC_ORIGIN=https://cateringoculto.bajastack.network
DB_HOST=db
DB_PORT=3306
DB_NAME=catering
DB_USER=catering_app
APP_ENV=production
TRUST_PROXY=uniquelocal
MEDIA_DIRECTORY=/app/media
PORT=3000
BIND_HOST=0.0.0.0
EOF
```

### 5. Build + Deploy
```bash
cd /srv/apps/catering-oculto/current
export RELEASE_TAG=<TAG>
export SECRETS_DIRECTORY=/srv/apps/catering-oculto/shared/secrets
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml build
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml run --rm migrate
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml up -d --wait
```

### 6. Crear primera cuenta (desde tu máquina local)
```powershell
# Requiere SSH key configurada: ~/.ssh/vivero_vps
./scripts/create-vps-owner.ps1
```

### 7. Validar
```bash
/srv/apps/catering-oculto/ops/cateringctl.sh validate
curl -k https://cateringoculto.bajastack.network/health/ready
curl -k https://cateringoculto.bajastack.network/admin
```

---

## Actualización posterior

```bash
cd /srv/apps/catering-oculto
# Obtener nuevo tag
git -C releases/<TAG> pull  # o clonar nuevo tag
ln -sfn releases/<NUEVO_TAG> current
cd current

export RELEASE_TAG=<NUEVO_TAG>
export SECRETS_DIRECTORY=/srv/apps/catering-oculto/shared/secrets
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml build
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml run --rm migrate
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml up -d --wait --force-recreate app

# Actualizar wrapper ops con nuevo RELEASE_TAG
```

---

## Rollback

```bash
cd /srv/apps/catering-oculto
ln -sfn releases/<TAG_ANTERIOR> current
cd current
export RELEASE_TAG=<TAG_ANTERIOR>
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml up -d --wait --force-recreate app
```

**Nota**: Rollback de imagen NO revierte migraciones de BD. Para revertir BD: restaurar backup SQL.

---

## Validación post-despliegue

| Check | Comando |
|-------|---------|
| Health ready | `curl -k https://cateringoculto.bajastack.network/health/ready` |
| Health live | `curl -k https://cateringoculto.bajastack.network/health/live` |
| Panel admin | `curl -k https://cateringoculto.bajastack.network/admin` (401 sin login) |
| Catálogo público | `curl -k https://cateringoculto.bajastack.network/api/local-editor/published` |
| Logs app | `/srv/apps/catering-oculto/ops/cateringctl.sh logs app` |
| Status migración | `docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml logs migrate` |

---

## Backups

**Ubicación**: `/srv/backups/catering-oculto/<timestamp-UTC>/`

```bash
# Backup manual (ejecutar desde VPS)
TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
mkdir -p /srv/backups/catering-oculto/$TIMESTAMP
docker exec catering-oculto-db-1 mariadb-dump -u root -p"$DB_ROOT_PASSWORD" catering > /srv/backups/catering-oculto/$TIMESTAMP/db.sql
docker cp catering-oculto-app-1:/app/media /srv/backups/catering-oculto/$TIMESTAMP/media
```

**Restauración de prueba**:
```bash
# Crear BD temporal
docker run --rm -i mariadb:11.4 mariadb -u root -p"$DB_ROOT_PASSWORD" catering_restore < /srv/backups/catering-oculto/<timestamp>/db.sql
# Verificar hash catálogo
```

**Backups Caddy (certificados)**: `/srv/proxy/backups/` (gestionado por platform-proxy)

---

## Archivos clave en VPS

```
/srv/apps/catering-oculto/
├── current/                    # Symlink a release activa
├── releases/<TAG>/             # Código + Dockerfile por release
├── shared/secrets/             # db_password, db_root_password, session_secret
├── ops/cateringctl.sh          # status, validate, logs app
└── backups/                    # Backups SQL + media

/srv/proxy/
├── compose.yaml                # platform-proxy (Caddy global)
├── Caddyfile                   # Bloques de dominio (incluye cateringoculto)
├── Caddyfile.shared            # Configuración compartida
└── backups/                    # Certificados TLS
```

---

## Comandos útiles

```bash
# Ver logs
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml logs -f app

# Reiniciar solo app
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml restart app

# Entrar a contenedor app
docker exec -it catering-oculto-app-1 sh

# Verificar Caddy (proxy global)
docker exec platform-proxy-proxy-1 caddy validate
docker exec platform-proxy-proxy-1 caddy reload --config /etc/caddy/Caddyfile
```

---

## Checklist previo a producción

- [ ] Docker Desktop iniciado localmente y build verificado
- [ ] Tag de release creado y pushado
- [ ] VPS: Docker Engine + Compose instalados
- [ ] VPS: `platform_proxy` red existe (`docker network ls`)
- [ ] VPS: platform-proxy corriendo (`docker ps | grep platform-proxy`)
- [ ] VPS: Secretos generados en `/srv/apps/catering-oculto/shared/secrets/`
- [ ] DNS: `cateringoculto.bajastack.network` → IP VPS
- [ ] Caddy: Bloque de dominio añadido y recargado
- [ ] Primera cuenta creada via `create-vps-owner.ps1`
- [ ] Validación `/health/ready`, `/admin`, catálogo público OK
- [ ] Backup inicial verificado (SQL + media + restore test)