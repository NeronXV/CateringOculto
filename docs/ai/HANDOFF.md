# HANDOFF — BajaStack AI Workflow 1.0

## Estado activo

- Revisión: **23 de octubre de 2026, 23:02, America/Mazatlan**.
- **GO técnico para solicitar autorización final de publicación interna.**
  Preflight, candidata, respaldo y recuperación válidos; no se ha publicado.
- El usuario aceptó explícitamente posponer la copia externa al24oct, entendiendo
  pérdida conjunta de respaldo/clave si falla el VPS. Aceptación temporal específica
  de esta publicación; no elimina otras medidas ni autoriza destinos nuevos.
- Instrucción vigente: presentar selección92 y activación y detenerse **antes de
  staging/commit/push o escrituras en VPS** hasta autorización final expresa.
  Se permite este checkpoint documental local; índice y producción permanecen intactos.
- No migraciones, cambios de usuarios/permisos, IVA/tarifas, Caddy/Vivero o VPS global.
  Aplicación continúa en pruebas internas con Carlos/Karen, sin aceptación comercial.
- [RELEASE-CANDIDATE](RELEASE-CANDIDATE.md) contiene las92 rutas y procedimiento exacto.

## Repo y candidata

- Master; HEAD `f2ab977a2137b212d520dc409767a39b723b60ba`; índice vacío.
  GitHub master reconsultado: mismo SHA; remoto origin correcto, sin avances.
- Inicio de esta revisión: 60 modificados, 67 sin seguimiento; 263 archivos con hash. Preservar
  los 110 cambios originales y entregas posteriores, sin igualar con remoto.
- Trabajo actual:solo HANDOFF y RELEASE-CANDIDATE. La herramienta recovery-checkpoint.py
  pertenece a entrega anterior y queda fuera del commit propuesto; conservarla.
  Evidencia/export en .local-data/qa ignorados; no SQL ni secretos descargados.
- Imagen `catering-oculto-app:rc-20261023-4702cc79`, ID
  `sha256:177da5b7536a318a54bc804ab13b6e41b65f370fdbfb6a86104839a877640eb5`.
  Linux/amd64, usuario node; misma imagen, sin rebuild ni modificación.
- Fuente146 y manifest SHA256
  `509ea9448265743dd974d4e944dd05ae8f14f6e682a358bf58383f8330769f22`
  siguen vigentes. Incluye IVA, desayunos, notas especiales, folios, textos y contraste.
  Frente a producción:25 modificados+4 nuevos,117 iguales; dependencias/SQL sin cambios.
- Selección funcional propuesta67 ejecución+23 QA+2 docs=92,35 cambios excluidos.
  Herramienta de recuperación fuera de selección/imagen; no añadirla ni incluir
  los demás cambios preexistentes automáticamente. HEAD+selección cubren fuente146.

## Respaldo verificado

- ID: `recovery-20261024-054407-7750e1a3`.
  Captura23oct22:44:08 local (24oct05:44:08UTC); restauración22:48:17.
- Carpeta root0700:
  `/srv/backups/catering-oculto/recovery-20261024-054407-7750e1a3`.
  Archivos0600; manifest, CAPTURE_COMPLETE, COMPLETE y restore-verification presentes.
  Trece carpetas de backup en total; ninguna anterior sobrescrita o borrada.
- SQL13 tablas, medios4 WebP/313368bytes, configuración146 archivos (release, wrapper,
 3 secretos privados), versiones e IDs. Captura single-transaction en línea;
  datos/medios estables antes/después, sin pausa, DDL, tabla bloqueada o SQL productivo escrito.
- Tres payloads autenticados AES-256-GCM:database.sql.aesgcm, media.tar.gz.aesgcm,
  configuration.tar.gz.aesgcm. Hashes completos y formato COBK1 en RELEASE-CANDIDATE.
- Clave aleatoria de recuperación separada, root0600 en
  `/srv/backups/catering-oculto-keys/recovery-20261024-054407-7750e1a3.key`,
  directorio0700. No imprimir/copiar a chat, scripts, logs o Markdown sus valores.
  **La clave y respaldo están en el mismo VPS; no cubren su pérdida completa.**
- Se autenticaron y descifraron contenidos en memoria; no se conservaron SQL o
  configuración privada descifrados en disco ni se descargaron datos personales.

## Restauración y candidata

- MariaDB11.4.13 al digest real, tmpfs propio512MiB/1CPU; candidata384MiB/1CPU.
  DB network=none; app en ese namespace, bind loopback, sin puertos ni salida a
  servicios productivos. Sin montajes productivos; conexión y sesión con secretos ficticios.
- Las13 tablas coinciden por conteo/hash y esquema; ledger001–007,0 FK huérfanas,
 4 solicitudes y4 WebP íntegros. No hay eventos/propuestas publicadas en esa captura;
  no presentar su ausencia como prueba real de propuestas históricas.
- Imagen exacta aprobó live/ready, página y panel200; estimación sintética2099:200,
  importes del servidor, IVA pendiente y total definitivo pendiente. Tablas iguales
  después; no se crearon solicitudes, mensajes o cobros productivos ni de prueba en DB real.
- Se corrigieron fallos del arnés HTTP/red y cotejo de sus contenedores temporales;
  validación final completa aprobada, sin cambios a aplicación/imagen.
- Contenedores, tmpfs, secretos/medios temporales, imagen y tar de ensayo del VPS retirados.
  Respaldo y clave preservados. Export local de imagen conservado como artefacto ignorado.
- Evidencia sanitizada:
  `.local-data/qa/rc-20261023-4702cc79/recovery-checkpoint-verified.json`.
  Restore-verification remoto SHA256:
  `bf4d5324892f48de0468fc3d7646a18747458a8510f9f1d9852f09eaafa78653`.
- Herramienta local: `python -B scripts/recovery-checkpoint.py --self-test` aprobado:
  cifrado, rechazo de alteración/AAD y rutas inseguras. No ejecutar --backup/--restore
  sin autorización para destino/acción; usa rutas e imágenes verificadas de esta entrega.

## Producción y riesgos restantes

- Release sigue12oct: `20261012-phase5b-candidate`, imagen9f5437...cdf26.
  App/DB healthy; MariaDB11.4.13 y esquema001–007. No necesita migración nueva.
- Postflight22:49:9 contenedores originales con mismos IDs/imágenes/arranques/
  reinicios/montajes; release, wrapper y hash de Caddy activo intactos.
  Históricos, catálogo y medios iguales a preflight; Catering y Vivero HTTPS/salud200,
  privados anónimos401. No se consultaron datos de las bases de Vivero.
- Catálogo revisión3/schemaVersion2, IVA desactivado/tasa0 en borrador y publicado.
  Cenas dos/tres no aprobadas. Mantener16% solo como propuesta; cenas1300/1450
  recogidas en checkpoint previo, unidad/incluidos/condiciones pendientes.
  No publicar nuevas tarifas, inventar precios de bodas/paellas ni alterar snapshots.
- No se encontró offsite de Catering en ops/shared/root, unidades o cron consultados.
  Restic disponible, sin destino autorizado verificable. No se crearon servicios,
  repositorios, retención ni cargas externas; no usar credenciales/copias de Vivero.
- La copia externa está pendiente al24oct; el riesgo residual fue aceptado
  explícitamente en esta solicitud. No tratarlo como bloqueo sin aceptación ni como
  protección externa ya conseguida. Falta autorización final para publicar.
- Antes de desplegar repetir identidad y frescura: si hay nuevas escrituras, renovar
  captura/recuperación autorizadas. No ejecutar migrador (limpia sesiones), activadores
  antiguos, up general o cambios de Caddy. No restaurar el VPS entero por Catering.

## Preflight final y próximo paso

- 23oct23:02:backup COMPLETE/GCM/hashes y evidencia de recuperación bf4d...8653 válidos;
  las13 tablas actuales coinciden con captura. Sin cambios de9 contenedores, medios,
  catálogo, wrapper, release o Caddy desde el ensayo. Cuatro solicitudes y cuatro WebP.
- Fuente146, imagen17...640eb5 y export a85c...eb72 intactos. No se repiten suites
  aprobadas sin cambios; recuperación real ya acreditó arranque y estimación.
- Compose objetivo validado en lectura:alias/red/volúmenes preservados, imagen app/
  migrate cambia por tag; activar exclusivamente app con no-deps/no-build/pull never.
  No ejecutar migrate. Activador antiguo no sirve: aplica007 y espera estado obsoleto.
- Secuencia propuesta:commit aislado92 y push normal condicionado a remoto inmóvil;
  transferir/verificar artefactos, crear release nueva rc-20261023-4702cc79,
  recrear solo app; después salud, current/wrapper atómicos y postflight.
  No ejecutar escrituras por este resumen; esperar autorización final de Pedro.
- Staging todavía vacío:cached name-only/check/stat/diff se revisarán después de
  autorización, antes de commit. No nuevos hooks/workflows de despliegue identificados.
  LF/CRLF por core.autocrlf se revisa sin cambiar configuración o reconstruir imagen.
- Límite QA conocido:prueba opcional migration007 depende de old-app.mjs local y
  variante Docker E2E de scripts WSL excluidos; no afirmar que esas variantes
  sean reproducibles desde un clon limpio. No hay DDL que verificar en producción.
- No crear solicitudes ficticias ni aprobar IVA/precios en postflight.
  Si no hay sesión Admin autorizada, limitar revisión a login/API anónima y reportarlo.
- Ante cambios inesperados o fallo detener con NO-GO. No rollback/restauración SQL
  automática ni pérdida de escrituras posteriores. Imagen antigua carece del nuevo
  control fiscal Admin; evaluar antes de revertir app.
- Esperar aprobación expresa del procedimiento de RELEASE y operaciones Git/VPS.
  Copia externa/custodia independiente pendiente al24oct, sin automatización creada.
[PROJECT](PROJECT.md) es el mapa y [AGENTS](../../AGENTS.md) las reglas.
