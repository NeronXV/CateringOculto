# Catering Oculto en el VPS compartido

Preparación del 3 de octubre de 2026. Dominio elegido por el usuario:
`cateringoculto.bajastack.network`. Despliegue remoto completado y comprobado.

## Arquitectura

React/Vite compilado servido por Express/Node 24, MariaDB 11.4 y Docker Compose.
Un Caddy independiente debe gestionar HTTPS de todos los proyectos. Catering
usa el proyecto Compose `catering-oculto`, volúmenes propios de DB y medios,
credenciales independientes y una red interna para MariaDB sin puertos públicos.
La app conecta a `platform_proxy` como `catering-oculto-web:3000`.

El servidor independiente ya está presente en `server/app.ts` y `server/start.ts`.
El build incluye panel y llamadas a API; la documentación previa que decía que
solo existía Vite dev describe un estado anterior. El setup público está
deshabilitado; la primera cuenta la crea el usuario mediante `server:owner`.

## Estado inspeccionado

Hostinger confirma VPS 2030059, `srv2030059.hstgr.cloud`, Ubuntu 24.04, KVM 2.
SSH confirma Vivero operativo, MariaDB 11.4, unos 93 GB libres y 7 GB de RAM
disponible en esta medición. Existe también un stack de aceptación aislado.
Caddy aún vive en `vivero-vps-web-1`; `platform_proxy` solo conecta ese servicio.
Separar su entrada HTTPS antes de incorporar Catering requiere una breve ventana
y conservar los volúmenes de certificados y las rutas de recuperación de Vivero.

## Archivos preparados

`infra/compose.shared.yaml` se combina con `infra/compose.yaml`, sin el overlay
`compose.vps.yaml`, que crea otro proxy en 80/443. `infra/Caddyfile.shared`
contiene el bloque de dominio para el futuro proxy independiente.

Rutas previstas: `/srv/apps/catering-oculto/releases/<release>`, `current`,
`shared/secrets`, `ops` y `/srv/backups/catering-oculto`. No copiar `.env.local`,
datadirs, llaves SSH ni sesiones locales. Generar secretos nuevos en el VPS;
archivos privados y directorio con permisos restringidos. Conservar releases.

Desde la carpeta de release, con variables no secretas definidas:

```sh
export RELEASE_TAG=<release>
export SECRETS_DIRECTORY=/srv/apps/catering-oculto/shared/secrets
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml config --quiet
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml build
docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml up -d --wait
```

## Datos, validación y recuperación

Definir con el usuario si importar el catálogo de MariaDB local o iniciar con
el catálogo de demostración. La migración inicial usa el catálogo de respaldo
si no existe un catálogo importado; eso no acredita contenido comercial aprobado.
Nunca compartir datadirs ni copiar cuentas y sesiones sin un plan explícito.

Antes de abrir el dominio: comprobar migraciones 001–003, readiness, login,
roles, medios privados, publicación, cálculo y doble envío con datos ficticios.
La primera cuenta no debe crearse con credenciales publicadas ni valores demo.
Respaldar SQL y medios como conjunto consistente, verificar hashes y ensayar
restauración aislada. La copia externa cifrada sigue siendo un pendiente común
del VPS. Un rollback de imagen no revierte migraciones ni recupera datos.

## Resultado del despliegue

Release activa: `20261003-json-fix`. Node 24, MariaDB 11.4; Caddy independiente
2.11.6 con imagen oficial fijada por digest en `/srv/proxy/compose.yaml`.
El proxy conserva el volumen de certificados existente. Vivero sirve HTTP
interno y conserva sus rutas públicas, incluida recuperación del dominio anterior.
Los overlays activos en `/srv/apps/vivero-dulcinea/ops` eliminan sus puertos
públicos. No recrear Vivero sin ese overlay: volvería a competir por 80/443.

HTTPS verificado para portada, panel, readiness y catálogo de Catering, y portada,
login y health de Vivero. Estado, borrador y bandeja rechazan anónimos con 401.
No hay usuarios administrativos creados automáticamente. La base inicia con
contenido demostrativo; no se importaron cuentas, solicitudes ni datos locales.

Se corrigió la lectura de JSON en catálogo, sesiones, snapshots y bandeja: mysql2
con MariaDB 11.4 devuelve algunas columnas como objetos. El lector compartido
acepta texto y objetos sin cambiar los snapshots almacenados.

Pasaron build Linux, regresiones locales, tipos, autenticación con SQL simulado,
motor de cotización y suite con MariaDB real en base temporal aislada: sesiones,
permisos, publicación concurrente/auditoría, folio, doble submit, snapshot,
consentimiento, privacidad y seguimiento comercial. La base temporal se eliminó.

Backup verificado de SQL y medios: `/srv/backups/catering-oculto/20261004-055507`
(nombre en UTC; corresponde al 3 de octubre en America/Mazatlan). El SQL se
restauró en una base temporal y el hash del catálogo coincidió; se leyó el archivo
de medios, actualmente vacío. Secretos separados, fuera del respaldo SQL/medios.
Certificados respaldados en `/srv/proxy/backups/20261004-054956`.

## Acceso y operación

Panel: `https://cateringoculto.bajastack.network/admin`.
El usuario crea la primera cuenta ejecutando `scripts/create-vps-owner.ps1`
en su PowerShell local. Pide nombre/correo y contraseña de forma privada;
la envía por stdin cifrado SSH, sin argumentos de contraseña ni archivos.
No volver a ejecutar `owner` para cambiar credenciales existentes.

En el VPS: `/srv/apps/catering-oculto/ops/cateringctl.sh status`, `validate`
o `logs app`. El wrapper fija la release activa; actualizar su tag al desplegar
una release nueva. El acceso de operación de Catering aún usa la llave existente;
no se ampliaron los permisos sudo de Pedro/Toni.

Proxy: `docker compose -p platform-proxy -f /srv/proxy/compose.yaml config --quiet`.
Validar Caddy y recargar con `docker exec platform-proxy-proxy-1 caddy validate`
o `reload --config /etc/caddy/Caddyfile`. Editar el archivo montado sin reemplazar
su inode. Respaldar primero y comprobar ambos dominios tras cambios.

Pendientes: cuenta del propietario, QA humano móvil/teclado y catálogo/reglas
aprobados. El navegador de esta sesión no resolvió aún el nuevo DNS; HTTP/HTTPS
sí se comprobaron desde el servidor con validación normal del certificado.
No hay copia externa cifrada ni calendario automático de respaldos configurados
para Catering. Su configuración y pruebas de recuperación operativas son el
siguiente trabajo de infraestructura; el backup aquí acreditado es manual.

## Actualización del 4 de octubre de 2026

Catálogo del documento, administración dinámica, platillos, impuestos configurables,
folios y enlaces de WhatsApp/correo implementados y publicados. Release actual
`20261004-date`. Ver [entrega funcional y acceso](19-entrega-catalogo-cotizador.md)
para evidencia, creación de primera cuenta y pendientes comerciales. Esta actualización
sustituye el estado demostrativo descrito en la entrega inicial.

Actualización de roles: release `20261004-roles`, migración 004 aplicada; ver
[usuarios y roles](20-usuarios-y-roles.md). Cuenta inicial crea Admin.

Actualización premium: release `20261004-operations`, migración 005 y respaldo
previo `/srv/backups/catering-oculto/20261004-210620`. Ver [agenda y seguimiento](21-agenda-y-experiencia-premium.md).
