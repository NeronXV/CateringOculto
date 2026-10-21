# Catering Oculto — contexto del proyecto

Mapa estable para consultas selectivas. [AGENTS](../../AGENTS.md) contiene las reglas
de trabajo y [HANDOFF](HANDOFF.md) el estado operativo para continuar una entrega.
Describe el árbol local inspeccionado, que incluye funciones y pruebas aún sin
versionar; HANDOFF identifica su base y la diferencia frente a GitHub. La existencia
de un enlace no implica que su contenido remoto incluya los cambios locales.

## Objetivo y alcance

Ayudar al visitante a configurar servicios de chef privado y catering, conocer un
estimado y entregar una solicitud completa a Carlos y Karen. El equipo administra
contenido y catálogo, atiende solicitudes y acuerda propuestas y fechas con control
humano. Se conserva la identidad oscura/dorada y una experiencia móvil sencilla.

El alcance funcional incluye catálogo administrable, solicitudes, agenda compartida
y propuestas con decisión humana. Aceptación y pendientes comerciales se consultan
en HANDOFF. No hay cobros web, bot ni envíos automáticos.

## Arquitectura y responsabilidades

| Área | Ubicación y función |
| --- | --- |
| Frontend | React 19, TypeScript y Vite 6; entrada en `src/main.tsx`, página en `src/App.tsx`, CSS/tokens en `src/styles/`. Carga el catálogo publicado por API antes de renderizar; la vista previa consulta el borrador con sesión. |
| Rutas | `/` pública, `/admin` privada y `/seguimiento` por enlace secreto. La entrada elige la vista; el cotizador anterior sigue accesible con `?legacy=1`. |
| API | Express 5/Node; `server/start.ts`, `server/app.ts` y `server/authApp.ts`. Conserva `/api/local-editor` por compatibilidad de clientes y medios. Sirve el build y ofrece `/health/live` y `/health/ready`. |
| Dominio | `quoteEngine.ts` y `itineraryEngine.ts` validan/cotizan; `quoteStore.ts` y `itineraryStore.ts` guardan solicitudes; `inboxStore.ts` atiende seguimiento; `operations.ts` y `availabilityGuard.ts` gestionan agenda y conflictos, bajo `server/`. |
| Persistencia | MariaDB con `mysql2`, SQL parametrizado y transacciones; migraciones ordenadas en `server/migrations/`. Catálogo editorial en JSON versionado, solicitudes con snapshots/contacto, seguimiento/auditoría, eventos/fechas y propuestas publicadas. Sesiones y usuarios en DB. |
| Medios | `server/media.ts` valida y optimiza imágenes con Sharp; almacenamiento separado de DB. Borradores privados y publicación controlada. |
| Ejecución | Docker Compose en `infra/`, Node 24 y MariaDB 11.4 en VPS Hostinger/Ubuntu 24.04 según el despliegue documentado; HTTPS mediante Caddy compartido. Desarrollo Vite usa el adaptador de `server/localAdmin.ts`. |

`src/config/` conserva valores iniciales; `src/admin/catalog.ts` valida y aplica el
catálogo recibido. El nombre `DEMO_PACKAGES` no implica que la página operativa
ignore la publicación. El adaptador de archivos `server/localStore.ts` es legado.
El borrador local no sensible del cotizador anterior no acredita recuperación del
flujo simple: este conserva selección/contacto en memoria al navegar entre etapas.

## Flujos implementados

1. **Tu evento:** una o varias fechas, invitados y ubicación opcional.
2. **Servicios y menús:** desayuno/comida/cena por fecha, horario, menú, platillos y
   variantes; copia voluntaria entre días. Componentes en `src/components/cotizador/`.
3. **Tu estimado:** el servidor calcula desde catálogo publicado; separa subtotal
   conocido de cenas, IVA, traslado u otros importes pendientes. Editar vuelve a estimar.
4. **Enviar solicitud:** contacto, restricciones, notas y consentimiento. El servidor
   revalida versión y fechas, guarda folio/snapshot y conserva el resultado en reintentos
   idempotentes. La confirmación permite revisar/imprimir y contactar manualmente.

En `/admin`, `AuthGate.tsx` presenta Solicitudes, Agenda, Menús y Configuración.
Admin y Editor pueden administrar contenido y operación; solo Admin gestiona usuarios.
El backend comprueba sesión, rol activo y permisos; protege al último Admin.
`ChefMenus.tsx` y `Admin.tsx` comparten catálogo: guardar borrador, previsualizar,
publicar y recuperar la publicación anterior como borrador, con revisión y auditoría.

La bandeja muestra el snapshot original, seguimiento comercial, responsable y próxima
acción. La decisión humana de disponibilidad es independiente del estado comercial:
aceptar permite continuar, sin crear reserva. El plazo de atención destaca pendientes;
no cancela reservas. El calendario público solo refleja compromisos registrados.

Preparar propuesta desde una solicitud precarga un borrador sin recaptura ni total
final inventado; si ya existe ficha vinculada, se abre. Agenda admite varias fechas,
bloqueos y apartados con vencimiento elegido por el equipo. Confirmar exige propuesta
final publicada y consistente, importe y anticipo verificado manualmente; el servidor
revisa conflictos. Las propuestas publicadas conservan versiones. El seguimiento
privado usa tokens aleatorios con hash en DB y respuestas públicas limitadas.

Importes y reglas sensibles pertenecen al servidor: validación, redondeo, aceptación
de versión, snapshots, idempotencia y concurrencia no dependen del navegador. Los
contratos admiten cotizaciones antiguas e itinerarios v1/v2/v3 sin reescribir historia.

## Pruebas y comprobaciones disponibles

Los comandos están en [package.json](../../package.json); elegir según impacto y
entorno, no ejecutar todos por rutina. La tabla describe el archivo local: varios
scripts y sus pruebas aún no están en HEAD/GitHub. Resultados fechados y límites en
las referencias locales indicadas al final.

| Alcance | Comandos y tipo de evidencia |
| --- | --- |
| Compilación/tipos | `npm run build`, `npm run typecheck:server`. No hay lint configurado. |
| Regresiones y contratos | `npm test`, `npm run test:quotes`, `npm run test:premium`, `npm run test:itinerary`, `npm run test:requests`. |
| Acceso simulado | `npm run test:auth`: HTTP/sesiones/permisos con SQL simulado. |
| Integración SQL | `npm run test:mysql:isolated`: MariaDB real temporal; `npm run test:migration:isolated`: migración y recuperación aisladas. El script anterior `test:mysql` también existe; revisar su destino antes de usarlo. |
| UI con API ficticia | `test:ui:simple`, `test:ui:admin`, `test:ui:availability` mediante `npm run`; no acreditan persistencia real. |
| Recorrido integrado | `npm run test:e2e:isolated`: Edge → Express → MariaDB desechable. Requiere runtime de navegador/`PLAYWRIGHT_MODULE` y binarios DB configurados. |

Existe evidencia de pruebas integradas; no equivale a cobertura total, ejecución
actual ni aceptación en teléfonos físicos. Las vistas `preview:quote` y
`preview:admin` usan fixtures aisladas y tampoco acreditan operación real.

## Publicación y referencias selectivas

El despliegue documentado usa `infra/compose.yaml` + `infra/compose.shared.yaml`,
proyecto `catering-oculto`, secretos por archivos, DB/medios propios y red interna;
MariaDB no publica puertos. El proxy Caddy es compartido con otros proyectos.
Preparación, respaldo SQL/medios y restauración aislada preceden a migración,
activación y postflight autorizados. Comprobar compatibilidad de datos/escritor antes
de una reversión; la vuelta de imagen no revierte DB. La documentación no autoriza
a ejecutar scripts operativos. Release documentada y riesgos abiertos: HANDOFF.

- [Decisiones y supuestos](../07-decisiones-pendientes.md): separar acuerdos de propuestas.
- [Reglas y filtro](../16-reglas-y-filtro.md) y [plan técnico](../17-plan-tecnico-tony.md): antecedentes de negocio/arquitectura.
- [Roles](../20-usuarios-y-roles.md) y [agenda](../21-agenda-y-experiencia-premium.md): antecedentes de contratos ya versionados.
- [Base local](../11-base-de-datos-y-acceso.md): MariaDB heredada en puerto 3307, binarios XAMPP con datadir propio `.local-data/mariadb`; no usar bases de XAMPP. Verificar puertos/estado actual antes de arrancar servicios.

El [índice histórico](../README.md) contiene afirmaciones antiguas de backend/panel
pendientes; contrastarlas con los informes posteriores. La separación documental
adopta la metodología de Vivero Dulcinea; sus datos y permisos no se transfieren aquí.

### Referencias locales sin publicar

Estas rutas existen solo en el árbol local revisado y están ausentes de HEAD y de
`master` en GitHub al corte de HANDOFF. Se conservan como texto, sin hipervínculos;
no estarán disponibles en un clon que reciba únicamente los tres documentos del
workflow. Consultarlas solo si se dispone de esa copia local. Sus resultados son
evidencia histórica documentada, sin revalidación de aplicación en este cierre.

| Ruta local desde la raíz | Contenido |
| --- | --- |
| `docs/22-coherencia-flujo-simple.md` | Conexión página/panel y evolución del flujo simple. |
| `docs/24-cotizador-fase2-local.md` | Estimado y cuatro etapas. |
| `docs/25-panel-fase3-local.md` | Solicitudes completas y preparación de propuestas. |
| `docs/26-disponibilidad-fase4-local.md` | Decisiones de disponibilidad y seguimiento. |
| `docs/27-validacion-integral-fase5a.md` | Pruebas integradas con MariaDB aislada. |
| `docs/28-procedimiento-fase5b.md` | Procedimiento de actualización y recuperación. |
| `docs/30-preparacion-produccion-fase5b.md` | Ensayo Linux/HTTPS y recuperación. |
| `docs/33-despliegue-controlado-fase5b.md` | Registro de despliegue técnico y sus límites. |
| `docs/34-guia-pruebas-operativas-publicadas.md` | Guía de aceptación y restricciones de pruebas reales. |

Publicar estos antecedentes no es indispensable para incorporar el workflow.
Su eventual incorporación requiere revisión y autorización separadas; no incluirlos
automáticamente junto con cambios funcionales preexistentes.
