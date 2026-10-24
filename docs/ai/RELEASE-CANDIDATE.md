# Catering Oculto — candidata y preflight de publicación

Revisión: **23 de octubre de 2026**, America/Mazatlan.
**GO técnico para solicitar autorización final de publicación interna.
El usuario acepta temporalmente el riesgo de no contar con copia externa independiente.
Commit, push y activación todavía NO autorizados; producción continúa sin actualizar.**

## Autorización y límite actual

La entrega anterior autorizó y completó respaldo cifrado en línea y restauración aislada.
En esta revisión el usuario decidió posponer la copia externa hasta el24 de octubre,
entendiendo el riesgo de pérdida conjunta de respaldo y clave en el VPS.
Esta aceptación es específica de la publicación interna propuesta; no autoriza cambios
de datos, precios, IVA, permisos, migraciones, Vivero, Caddy o configuración global.

La instrucción vigente exige presentar preflight, selección y activación **antes de
staging/commit/push o escrituras en el VPS**, y esperar autorización final expresa.
Esta preparación solo consulta remoto/VPS y actualiza los dos documentos locales.
No se generaron claves SSH ni se modificaron accesos.

## Nueva candidata local

- Rama master, HEAD local `f2ab977a2137b212d520dc409767a39b723b60ba`, índice vacío.
  GitHub coincidía en la revisión anterior; no se reconsultó en este preflight.
- Imagen construida: `catering-oculto-app:rc-20261023-4702cc79`.
- ID local de imagen (no digest de registro):
  `sha256:177da5b7536a318a54bc804ab13b6e41b65f370fdbfb6a86104839a877640eb5`.
- Plataforma linux/amd64, usuario node, base Node24.21.0 fijada al digest documentado.
  Build Linux previo aprobado; dependencias/lockfile cotejados ahora con producción, sin cambios.
- Fuente: **146 archivos**. SHA256 de manifest.json:
  `509ea9448265743dd974d4e944dd05ae8f14f6e682a358bf58383f8330769f22`.
- Carpeta local ignorada: `.local-data/qa/rc-20261023-4702cc79/`.
  manifest.json contiene las146 rutas y hashes; git-selection.json, selección exacta;
  preflight-summary.json, evidencia sanitizada. No contienen SQL ni datos de clientes.
- Los146 archivos siguen coincidiendo con copia congelada y fuente local; no hubo rebuild.
  Se exportó la imagen existente y se verificó el archivo por SHA256 antes de cargarla
  exclusivamente para el ensayo aislado. Arranque integrado y estimación aprobados
  con respaldo real restaurado; identidad de imagen intacta. Después se retiraron
  contenedores, copia temporal de imagen y tar del VPS. La app productiva sigue en12oct.
- Export local ignorado: candidate-recovery-image.tar.gz, SHA256
  `a85cbb58fff5859398a3c2b569b9e25a160b9cdb8af4e354947ec3048f30eb72`.
  No contiene credenciales ni SQL. No confundir transferencia de ensayo con despliegue.
- Sustituye a la candidata congelada del21. No reutilizar esa imagen anterior como
  si incluyera folios cortos, redacción regional y contraste actuales.

## Alcance funcional y dependencias

Incluye cuatro etapas; desglose de subtotal/IVA/importe conocido en estimado,
confirmación, panel y comprobante; desayunos publicados y notas especiales;
IVA16% propuesto sin aprobación automática, permisos Admin y auditoría;
folios cortos con identidad interna intacta y búsqueda privada corta/completa;
redacción casa/lugar del evento y contraste del menú lateral.

Frontend y backend deben publicarse juntos. No importar catálogo/fixtures locales,
activar IVA, cambiar precios de cenas o modificar propuestas históricas.
No hay ES/EN implementado, contratos nuevos ni migraciones de este alcance.

Frente a la fuente **real instalada**, inspeccionada en lectura el23 de octubre:
**25 archivos modificados +4 nuevos**, otros117 idénticos. Coincide con el delta
documentado del12 de octubre. Los hashes de package/lockfile, compose y SQL001–007
coinciden con producción. Ledger y estructura real compatibles; no se requiere DDL.
No ejecutar migrador: además de DDL, su comando limpia sesiones expiradas.

### Delta de ejecución frente a la base instalada y documentada

```text
server/authApp.ts
server/inboxStore.ts
server/mysqlStore.ts
src/Tracking.tsx
src/admin/Admin.css
src/admin/Admin.tsx
src/admin/AuthGate.tsx
src/admin/Inbox.tsx
src/admin/Operations.tsx
src/admin/RequestSummary.tsx
src/components/cotizador/ItineraryAmounts.css
src/components/cotizador/ItineraryAmounts.tsx
src/components/cotizador/RequestTracking.tsx
src/components/cotizador/ServerRequest.tsx
src/components/cotizador/SimpleQuote.tsx
src/components/cotizador/simple/SimpleContact.tsx
src/components/cotizador/simple/SimpleDayServices.tsx
src/components/cotizador/simple/SimpleGuestCount.tsx
src/components/cotizador/simple/SimpleQuote.css
src/components/cotizador/simple/SimpleReceiptView.tsx
src/components/cotizador/simple/SimpleSummary.tsx
src/config/packages.ts
src/config/sections.ts
src/config/service.ts
src/config/zones.ts
src/types/availability.ts
src/utils/folio.ts
src/utils/itineraryPresentation.ts
src/utils/receipt.ts
```

## Selección propuesta para GitHub — no añadida al índice

**67 rutas de ejecución +23 QA +2 documentos =92 rutas.**
GitHub no contiene toda la base documentada como desplegada en octubre. Por eso
el conjunto coherente es mayor al delta29. Revisar expresamente el trabajo mixto
antes de versionar; no autoriza incluir todo el árbol. Los35 cambios excluidos (34 originales más recovery-checkpoint.py)
permanecen intactos, incluidas herramientas antiguas de despliegue y documentación.

### Ejecución: diferencias con HEAD

```text
infra/Dockerfile
package-lock.json
package.json
server/app.ts
server/authApp.ts
server/availabilityGuard.ts
server/availabilitySchema.ts
server/inboxStore.ts
server/itineraryEngine.ts
server/itineraryStore.ts
server/manage.ts
server/migrations/006-event-dates.sql
server/migrations/007-request-availability.sql
server/mysqlStore.ts
server/operations.ts
server/quoteStore.ts
src/App.tsx
src/Tracking.tsx
src/admin/Admin.css
src/admin/Admin.tsx
src/admin/AuthGate.tsx
src/admin/ChefMenus.css
src/admin/ChefMenus.tsx
src/admin/Inbox.css
src/admin/Inbox.tsx
src/admin/Operations.css
src/admin/Operations.tsx
src/admin/RequestSummary.css
src/admin/RequestSummary.tsx
src/admin/catalog.ts
src/admin/mergeDraft.ts
src/components/cotizador/Availability.tsx
src/components/cotizador/ItineraryAmounts.css
src/components/cotizador/ItineraryAmounts.tsx
src/components/cotizador/Premium.css
src/components/cotizador/RequestTracking.tsx
src/components/cotizador/ServerRequest.tsx
src/components/cotizador/SimpleQuote.tsx
src/components/cotizador/simple/SimpleContact.tsx
src/components/cotizador/simple/SimpleDateSelector.tsx
src/components/cotizador/simple/SimpleDayServices.tsx
src/components/cotizador/simple/SimpleGuestCount.tsx
src/components/cotizador/simple/SimpleQuote.css
src/components/cotizador/simple/SimpleReceiptView.tsx
src/components/cotizador/simple/SimpleSummary.tsx
src/components/layout/Footer.tsx
src/components/sections/FaqSection.tsx
src/components/sections/Gallery.tsx
src/components/sections/Hero.tsx
src/components/sections/MainServices.tsx
src/components/sections/Philosophy.tsx
src/config/editorial.ts
src/config/faqs.ts
src/config/mainServices.ts
src/config/packages.ts
src/config/sections.ts
src/config/service.ts
src/config/zones.ts
src/types/availability.ts
src/types/inbox.ts
src/types/itinerary.ts
src/types/operations.ts
src/utils/folio.ts
src/utils/itineraryMenus.ts
src/utils/itineraryPresentation.ts
src/utils/receipt.ts
src/utils/requestSummary.ts
```

### QA: diferencias con HEAD

```text
scripts/admin-fixture.ts
scripts/preview-admin.mjs
scripts/preview-quote.mjs
scripts/test-mysql-isolated.mjs
tests/adminPreview.mjs
tests/auth.ts
tests/availability-ui.mjs
tests/availability.ts
tests/editorial.cjs
tests/experience-ui.mjs
tests/folio.ts
tests/fullJourney.mjs
tests/inbox.ts
tests/isolatedHarness.ts
tests/itineraryMenus.ts
tests/itineraryPresentation.ts
tests/itineraryPricing.ts
tests/migration007.ts
tests/operations.ts
tests/premiumIntegration.ts
tests/requestSummary.ts
tests/simple-flow-ui.mjs
tests/taxAdministration.ts
```

### Documentación

```text
docs/ai/HANDOFF.md
docs/ai/RELEASE-CANDIDATE.md
```

El cierre de imports relativos de comandos/pruebas se verificó sin ausencias.
Se conservan limitaciones ya conocidas de suites opcionales: migration007 requiere
old-app.mjs local y algunas rutas Docker usan scripts históricos WSL no seleccionados.
No se publican esos módulos ni SQL privado para resolverlo automáticamente.
Fixtures/tests no entran en la imagen. Manifest146 es la fuente exacta del paquete.

Commit propuesto, **pendiente**:
`feat: refine quote experience, readable folios and secure VAT administration`.
No hay commit, rama nueva, staging ni push. Antes de autorizarlos revisar selección,
remoto, integridad de cambios excluidos y reconstrucción exacta del paquete.
La entrega de recuperación añade scripts/recovery-checkpoint.py, herramienta operativa
fuera de la fuente146 y de esta selección92. No se añade automáticamente a un commit;
revisar su inclusión separada al autorizar versionado.

## Preflight verificado — 23 de octubre, 22:27 America/Mazatlan

Evidencia sanitizada local ignorada:
`.local-data/qa/rc-20261023-4702cc79/preflight-verified-readonly.json`.
Contiene metadatos, hashes y conteos, sin contactos, snapshots, contraseñas o SQL de datos.
La estructura SQL se leyó; no se exportaron filas ni copias de respaldo.

### Acceso y producción

- ssh-agent de Windows devolvió la llave pública esperada. SSH no interactivo correcto:
  root, srv2030059, IP179.236.238.111:22. BatchMode=yes, IdentitiesOnly=yes,
  autenticación exclusivamente publickey, contraseñas e interacción de teclado deshabilitadas.
  StrictHostKeyChecking=yes, UpdateHostKeys=no y ED25519; sin cambios a known_hosts.
  El sandbox no accede al agente; la ejecución autorizada fuera del sandbox sí.
- Release real: `/srv/apps/catering-oculto/releases/20261012-phase5b-candidate`.
  App healthy, tag `catering-oculto-app:20261012-phase5b-candidate`,
  ID `sha256:9f5437c0066239f5c73d93bf8fd20f057344e2884ddd52ee53470cd3b96cdf26`.
- MariaDB11.4.13 healthy; imagen
  `sha256:1292844148b311e4ed4300022a996d39083f415a963e970cf47cad1b3b18e3a6`.
  App/DB sin puertos publicados; configuración production y DB catering/catering_app.
  Usuario de app con SELECT/INSERT/UPDATE/DELETE solo sobre catering; sin DDL.
  Sin secretos inline; archivos existentes root, directorio0700. No cambiar sus modos.
- Ledger001–007 completo, sin migraciones inesperadas; los7 SQL dentro del contenedor
  coinciden por SHA256 con candidata. Trece tablas InnoDB, utf8mb4/uca1400.
  Columnas de disponibilidad, índice único de tracking, checks JSON, roles admin/editor
  y action VARCHAR24 de auditoría fiscal presentes. No hace falta migración nueva.
- Cuatro solicitudes: itinerary-v1(1), itinerary-v3(2), catering-v3 legado(1).
  Cero eventos y propuestas publicadas. No se puede acreditar lectura de propuestas
  históricas reales inexistentes; su compatibilidad conserva evidencia sintética previa.
  Nueve consultas de integridad:0 JSON inválidos, huérfanos, fechas/versiones faltantes.
  Huellas de9 tablas históricas/estado iguales entre lecturas, sin recalcular importes.
- Catálogo revisión3, schemaVersion2, response_hours24; publicado y borrador:
  taxApproved=false, taxRateBps=0, taxOnTravel=false. Cenas dos/tres sin precio aprobado.
  Cinco incluidos comunes de desayuno; el menú tiene su lista separada.
  La candidata conserva0 almacenado y permite al Admin proponer16% sin activar.
  No importar catálogo semilla ni publicar impuestos/tarifas.
- Volumen propio `catering-oculto_media`:4 WebP,313368bytes, sin symlinks;
  huella agregada en evidencia. DB propia `catering-oculto_db_data`.
- Recursos al corte:80.8GiB libres y6.56GiB MemAvailable; Docker29.8.2.
  Permiten planificar clon local o contenedor separado con límites, no garantizan
  capacidad futura. No se creó contenedor/clon ni se reservaron recursos.

### HTTPS y protección de servicios compartidos

- GET /, /admin, /seguimiento, /health/live y /health/ready de Catering:200.
  Inbox/eventos anónimos:401. Sin login, solicitudes ficticias ni POST de negocio.
- Nueve contenedores activos. Vivero API/DB healthy y Web running; / y /health:200.
  También existe stack de aceptación Vivero; no detenerlo ni reutilizar sus recursos.
- IDs, imágenes, arranques, reinicios, montajes y redes de todos los contenedores
  estables entre lecturas. No se consultaron datos de las bases de Vivero.
- La app de Catering comparte solo la red de entrada platform_proxy; DB y medios
  separados. Proxy monta /srv/proxy/platform.Caddyfile; se registró su hash activo.
  /srv/proxy/Caddyfile tiene otro hash: no usar ese archivo alterno para acreditar
  identidad del proxy activo. No se editó ninguno.
- La futura actualización debe recrear únicamente app de Catering, con no-deps,
  sin build/pull de servicios compartidos; no usar up general ni cambiar Caddy/DB.

### Respaldo fresco y restauración — 23 de octubre, 22:44–22:49 America/Mazatlan

- ID: `recovery-20261024-054407-7750e1a3`.
  UTC de captura:24oct05:44:08; recuperación verificada05:48:17UTC.
- Ubicación protegida:
  `/srv/backups/catering-oculto/recovery-20261024-054407-7750e1a3`.
  Directorio0700; archivos0600, root. CAPTURE_COMPLETE, COMPLETE, manifest y
  restore-verification.json presentes. No se sobrescribió ningún respaldo anterior.
- Cobertura:SQL de13 tablas, todas InnoDB, medios4 WebP/313368bytes,146 archivos de
  configuración (release completa, wrapper y3 archivos privados de secretos), versiones,
  IDs y huellas. Dump single-transaction/skip-lock-tables, routines/triggers/events/
  hex-blob. No pausa, DDL, bloqueo de tablas ni escritura en volúmenes productivos.
- SQL, medios y configuración están **cifrados AES-256-GCM autenticado**, formato COBK1:
  cabecera5bytes, nonce12, ciphertext/tag; nombre de archivo como AAD.
  No se guardaron copias descifradas de SQL/configuración en disco.
  Clave de recuperación aleatoria separada, root0600 en
  `/srv/backups/catering-oculto-keys/recovery-20261024-054407-7750e1a3.key`,
  directorio0700. No se imprimió ni copió a documentación/logs.
  **Clave y respaldo siguen en el mismo VPS: no acredita recuperación ante pérdida del VPS.**

| Archivo cifrado | SHA256 |
| --- | --- |
| database.sql.aesgcm | fd07abdc408a24367224bdecc265cec3bcd291c4c314528c41df48ac17d35939 |
| media.tar.gz.aesgcm | 53eef7676abd004f2c63195ce578411985ecd6e76f5f8e2c804c8725c8a69a29 |
| configuration.tar.gz.aesgcm | 66c0c0a94ac45e3661d0fa328a1bc849783212ec313c7cc5a13d666efcf77c59 |

Los3 hashes se verificaron tras captura y recuperación. Se verificó autenticación GCM
y hash de los contenidos descifrados en memoria; configuración privada recuperable.

- Restauración real en MariaDB11.4.13 al digest registrado, tmpfs/datadir propio,
  512MiB/1CPU; candidata384MiB/1CPU, usuario node, sin privilegios añadidos.
  DB con network=none, app comparte únicamente ese namespace; bind127.0.0.1,
  sin puertos publicados ni acceso a redes/volúmenes/secretos de producción.
  Usuarios y secretos de conexión del ensayo sintéticos, distintos de producción.
- Las13 tablas coinciden por hashes/conteos; esquema, ledger001–007 y claves foráneas
  verificados,0 huérfanos. Cuatro solicitudes conservadas y4 WebP idénticos.
  No se recalcularon snapshots ni se generaron solicitudes nuevas.
- Candidata ID17...640eb5 intacto: /health/live, /health/ready, / y /admin200.
  Estimación sintética en fecha2099:200, importes del servidor consistentes,
  IVA pendiente/no activado y total definitivo pendiente. Las tablas permanecieron
  iguales después. No se hicieron solicitudes ficticias en producción.
- El arnés tuvo fallos corregidos de transporte Host, comparación de red por nombre/ID
  y exclusión de sus propios contenedores al cotejar producción. No fueron cambios de
  aplicación; la validación final pasó íntegra. No se alteró la imagen candidata.
- Contenedores, tmpfs, secretos sintéticos y medios temporales eliminados; imagen y tar
  usados en el VPS para ensayo retirados. Respaldos y clave de recuperación conservados.
- Postflight22:49:los9 contenedores originales conservan ID/imagen/arranque/reinicios/
  montajes, release y wrapper iguales, Caddy activo con mismo hash. Históricos,
  catálogo y medios productivos intactos. Catering/Vivero HTTPS200, privados401.
- Evidencia local sanitizada:
  `.local-data/qa/rc-20261023-4702cc79/recovery-checkpoint-verified.json`.
  Evidencia del VPS:restore-verification.json SHA256
  `bf4d5324892f48de0468fc3d7646a18747458a8510f9f1d9852f09eaafa78653`.
  No se descargaron SQL, medios o configuración privada reales.

### Herramienta y copia externa

`scripts/recovery-checkpoint.py` reutiliza captura consistente y cotejo por hashes
de las herramientas phase5b, actualizando identidades sin modificar activadores.
No omite columnas007, no aplica migraciones, no pausa servicios ni usa secretos reales
en el ensayo. Pruebas locales sintéticas:cifrado/descifrado, rechazo de alteración/AAD
incorrecta y rutas inseguras de archivo; restauración real integrada aprobada.
No ejecutar esta herramienta por la mera existencia del documento; exige autorización.

Restic/GPG disponibles, pero **no se identificó repositorio externo existente y
autorizado de Catering** en rutas consultadas de ops/shared/root, unidades systemd
o cron. No se creó destino, configuró retención, usó credenciales de Vivero, subió
información a nuevos servicios ni ejecutó prune/forget. Sin copia externa creada.
Los snapshots del proveedor no sustituyen esta condición.

## Preflight final y autorización pendiente — 23 de octubre, 23:02 America/Mazatlan

**GO para solicitar autorización final. Ninguna escritura Git/VPS ejecutada.**
El riesgo externo fue aceptado de manera explícita y separada por el usuario en esta
solicitud; su creación se pospone al24oct. No se programa ni autoriza un destino nuevo.

- HEAD/master y GitHub NeronXV/CateringOculto master:
  `f2ab977a2137b212d520dc409767a39b723b60ba`; índice vacío, remoto sin avance.
  Sin workflows .github en HEAD ni hooks activos encontrados; no hay despliegue automático
  identificado por push. Revalidar el remoto inmediatamente antes del push.
- Fuente146 actual y congelada coinciden con manifest509e...9f22; imagen local17...640eb5,
  linux/amd64/node y export a85c...eb72 intactos.
- HEAD más las67 rutas de ejecución propuestas cubre las146 fuentes sin faltantes.
  Revisión de92 archivos sin .env/llaves privadas/credenciales detectadas.
 35 cambios excluidos, incluida herramienta de recuperación, intactos; no añadirlos.
- Fuente y pruebas sin cambios desde validación funcional/SQL y restauración real.
  No se repitieron suites ni se reconstruyó imagen. UI360/390/escritorio, PDF y roles
  fiscales son evidencia previa; arranque, salud y estimación del respaldo son del ensayo.
  La prueba opcional migration007 requiere old-app.mjs local; modo Docker de E2E
  usa herramientas WSL excluidas. No acreditar reproducibilidad de esas variantes
  desde un clon limpio. No son requisitos de migración para esta publicación sin DDL.
- core.autocrlf=true: revisar normalización LF/CRLF en diff cached sin cambiar config.
  Publicar el artefacto ya probado por ID/hash; no reconstruir silenciosamente desde Git.
- Backup recovery-20261024-054407-7750e1a3 COMPLETE, sin FAILED;3 hashes y autenticación
  GCM verificados en memoria. Evidencia bf4d...8653 coincide con manifest;restoreVerified=true.
  Las13 tablas actuales todavía coinciden con la captura y configuración/medios estables.
- Nueve contenedores originales iguales a captura, incluida Vivero; mismo Caddy activo,
  wrapper, release12oct,4 solicitudes,4 WebP/313368bytes y esquema001–007.
  Catering /,/admin,/seguimiento/live/ready200; privados401; Vivero / y /health200.
  IVA=false/tasa0 en borrador y publicación; cenas dos/tres no aprobadas.
- Compose validado en lectura con el tag objetivo sobre los YAML instalados idénticos
  a la candidata: solo cambia imagen de app y migrate. migrate **no se ejecutará**.
  Se conservan alias catering-oculto-web, red platform_proxy y volúmenes propios.
  En release nueva también cambian rutas absolutas de build/init SQL por su carpeta;
  no construir ni recrear DB, y validar esos archivos por hash antes de activar.
- Activador phase5b antiguo **incompatible con este procedimiento**: exige release vieja,
  app detenida y aplica migración007. No usarlo. Se propone secuencia sin migrador.

### Secuencia concreta propuesta — ejecutar solo tras autorización final

1. Revalidar HEAD/remoto, índice vacío, selección92 y hashes de35 cambios excluidos.
   Añadir exclusivamente las rutas de las tres listas anteriores, nunca add . o add -A.
   Revisar cached name-only/check/stat/diff completo y que no existan secretos.
   Commit propuesto:
   `feat: refine quote experience, readable folios and secure VAT administration`.
   Publicar master por fast-forward normal solo si origen sigue en HEAD esperado.
   Ante divergencia/rechazo detener, sin pull/merge/rebase/reset/force.
2. Transferir export de imagen y fuente congelada146 a incoming propio nuevo de Catering,
   verificar SHA256, cargar imagen y comprobar ID17...640eb5 exacto.
   Crear release propia `/srv/apps/catering-oculto/releases/rc-20261023-4702cc79`,
   sin sobrescribir directorios existentes. No transferir .env, secretos, SQL o fixtures.
   Registrar commit/imagen/manifest/backup en metadatos de release sin credenciales.
3. Validar Compose usando rutas absolutas de esa release, proyecto catering-oculto,
   RELEASE_TAG=rc-20261023-4702cc79 y SECRETS_DIRECTORY compartido **solo de Catering**.
   Comparar DB/medios/redes/origen/alias/archivos antes de activar. No crear migrador,
   usuarios o catálogos, no ejecutar manage.ts, importadores o prepare-docker.
4. Activar **solo app**, con comando equivalente:
   `docker compose -p catering-oculto -f NUEVA/infra/compose.yaml -f NUEVA/infra/compose.shared.yaml up -d --no-deps --no-build --pull never --wait --wait-timeout 90 app`.
   Las variables anteriores se limitan al proceso; no cambiar configuración global.
   Puede haber interrupción breve de Catering por recreación de su único contenedor app.
   DB, migrate, proxy y Vivero no se recrean, reinician o actualizan.
5. Tras salud correcta, actualizar atómicamente current y la línea RELEASE_TAG del
   wrapper propio de Catering, verificando primero target/hash anteriores. Preservar
   el wrapper/release/imagen anteriores; no tocar el wrapper local excluido de Git.
   Si falla un paso, detener y reportar estado; no restaurar SQL automáticamente.
6. Postflight:ID/health de nueva app; HTTPS y API; cuatro etapas, folio, desayunos,
   notas, comprobante/impresión y presentación de IVA desactivado.
   Sin enviar solicitud ni publicar configuración; estimar no crea registros.
   Panel/login renderizados; acciones Admin con sesión ya autorizada si existe,
   sin crear cuentas/cambiar credenciales. Si no hay sesión, reportar ese límite
   y conservar evidencia aislada de permisos para revisión humana.
   Comparar13 tablas/DDL/4 medios con respaldo; Vivero/Caddy y demás contenedores intactos.
   Si aparecen escrituras legítimas posteriores, preservarlas y reportarlas,
   sin descartarlas, recalcular snapshots ni restaurar DB.
7. Actualizar HANDOFF/RELEASE con commit, release y resultados reales. No presentar
   commit, transferencia, salud aislada o este GO como despliegue ya realizado.

### Riesgo residual y autorización requerida

La copia y su clave siguen en el mismo VPS. Se acepta temporalmente para estas pruebas
internas el riesgo de pérdida conjunta ante fallo total. El24oct debe definirse una
copia independiente y custodia de clave fuera del VPS; sin prometer creación automática
ni utilizar destinos/credenciales de Vivero. Esta aceptación no relaja otros controles.

Falta autorización final expresa para **staging/commit/push de las92 rutas y escrituras
de preparación/activación exclusivas de Catering en srv2030059**, incluidos incoming,
imagen/release/metadatos, recreación de app, current y wrapper. No hay permiso para DB,
migraciones, impuestos/precios, proxy o Vivero. Repetir guards si transcurre tiempo o
cambia cualquier evidencia; ante fallo declarar NO-GO y no improvisar otra secuencia.

Recuperación:conservar imagen/release/wrapper anteriores y respaldos. Antes de una
reversión de app evaluar datos y permisos: imagen anterior carece del nuevo control
fiscal Admin. Tras reapertura priorizar reparación hacia adelante y preservar escrituras.
Nunca restaurar el VPS entero ni DB automáticamente para revertir Catering.
[HANDOFF](HANDOFF.md) conserva continuidad y [AGENTS](../../AGENTS.md) las reglas.
