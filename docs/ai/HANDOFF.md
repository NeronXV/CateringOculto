# HANDOFF — BajaStack AI Workflow 1.0

## Entrega activa y base

- Revisión: **21 de octubre de 2026**, zona America/Mazatlan.
- Cierre documental de BajaStack: estructura y ajustes de privacidad/referencias
  aprobados. El usuario autorizó el commit documental y su sincronización normal
  con GitHub, condicionados a las verificaciones de este cierre. La aplicación
  continúa en pruebas internas con Carlos y Karen.
- Repositorio: Catering Oculto; rama `master`.
- Commit base del cierre: `3f8968d525768b12299b2bd287ab9edab28611b4`, 7 de octubre de 2026.
- Alcance autorizado: commit exclusivo de `AGENTS.md`, `docs/ai/PROJECT.md` y este archivo,
  con mensaje `docs: establish BajaStack AI Workflow 1.0`, y push normal a `master`
  solo si el remoto no avanzó. Sin cambios de código, migraciones, despliegue ni VPS.

## Estado local frente a publicación

El informe 33, disponible solo en la copia local y enumerado en
[PROJECT](PROJECT.md), registra publicación técnica
del **12 de octubre de 2026**, release `20261012-phase5b-candidate`, con Fases 1–4 y
migración 007. La fuente e imagen publicadas tienen identidades en ese informe.
La revisión actual verificó GitHub en lectura; no consultó ni revalidó producción.

En la comprobación previa al commit, la API de GitHub confirmó que
`NeronXV/CateringOculto`, rama `master`, apunta a
`3f8968d525768b12299b2bd287ab9edab28611b4`, igual a HEAD local. Se comprobó su árbol
completo para contrastar los destinos de enlaces; no se actualizaron referencias
locales ni se realizaron operaciones Git de sincronización. Es un corte de lectura,
no garantía de que la rama remota permanezca inmóvil hasta un futuro push.

Tras el ajuste quedan 18 enlaces a 13 destinos: 11 existen en HEAD y en `master`
remoto; PROJECT y HANDOFF son los dos destinos nuevos que incluirá el commit
propuesto junto con AGENTS. No quedarán enlaces rotos por publicar solo esos tres.

HEAD precede a ese despliegue y hay cambios locales sin commit. No se comprobó
equivalencia entre HEAD, árbol local y artefacto desplegado; no igualarlos automáticamente.
Aunque la aplicación está en pruebas internas, el informe describe un dominio público:
puede recibir solicitudes reales. No asumir aislamiento por falta de lanzamiento.

## Trabajo preexistente protegido

Al iniciar esta revisión final había **54 archivos modificados y 59 sin seguimiento**,
sin cambios en staging. Incluyen los tres documentos del workflow ya revisados y
**110 cambios ajenos a esta entrega**: frontend, backend, pruebas, package/lockfile,
infraestructura, documentos 22–34, migraciones 006/007 y scripts de QA/despliegue.
Conservar el conjunto; un archivo sin seguimiento no es un temporal descartable.

Se registraron de nuevo huellas SHA-256 de los 250 archivos versionados o sin
seguimiento fuera de los tres objetivos para comparar antes/después. Antes del
staging coinciden con la revisión anterior; rama, HEAD e índice iniciales también.
El commit autorizado debe incluir solo los tres Markdown y preservar esos archivos.

## Evidencia de validación y operación

- **Histórica local:** el informe 27 registra Edge → Express
  → MariaDB aislada, contratos, concurrencia, idempotencia e históricos; las suites UI
  ficticias siguen siendo evidencia separada. El informe 30
  registra ensayo Linux/HTTPS y recuperación; el 33,
  comprobaciones técnicas tras publicar, sin solicitudes ficticias ni login automatizado real.
- **Este paso:** revisión documental completa, rutas/enlaces locales, contenido sensible,
  contraste de enlaces con HEAD y `master` remoto, `git diff --check` y comparación
  con estado/huellas iniciales. No se repitieron builds,
  suites de aplicación, migraciones ni pruebas de producción por este cambio documental.
- **Pendiente:** aceptación operativa de Carlos/Karen en celulares físicos, incluidos
  Safari/iPhone y Android utilizados; revisión autenticada y permisos para registros
  de prueba según la guía 34 local. No hay aprobación integral del cliente acreditada
  por estos documentos. Las rutas de los informes 27/30/33 y guía 34 están en PROJECT;
  no están publicados en GitHub.

## Comentarios recientes de Karen: por confirmar

Reportados por el usuario durante la preparación documental. Son requisitos
pendientes de definición y confirmación comercial; no autorizan modificar catálogo,
código ni producción.

| Comentario | Aclaración necesaria antes de implementar |
| --- | --- |
| Especificar ingredientes incluidos en desayunos | Confirmar lista aprobada por menú/platillo, variantes y alcance de lo incluido; no inferir garantías de alérgenos. |
| Cena de dos tiempos: $1,300 | Confirmar moneda, unidad de cobro, alcance y condiciones. No activar como tarifa aprobada. |
| Cena de tres tiempos: $1,450 | Confirmar moneda, unidad de cobro, alcance y condiciones. No activar como tarifa aprobada. |
| Mostrar desglose de IVA | Aclarar si los precios ya incluyen IVA, tasa/regla aplicable y cómo presentar base, impuesto y total; evitar doble aplicación. |
| Revisar bodas y paellas | Definir si son menús, servicios o solicitudes especiales, qué datos requieren y cómo se cotizan; no crear un módulo por suposición. |

Los precios y condiciones comerciales siguen sujetos a confirmación. Los estimados
actuales conservan conceptos pendientes; estos comentarios no aprueban automáticamente
cenas, impuestos ni una fórmula nueva.

## Riesgos y siguiente acción

- Falta copia externa cifrada de Catering con destino, retención, custodia y restauración
  probada, según informe 33. El riesgo aceptado para aquella publicación sigue abierto.
- Después de posibles escrituras públicas, una imagen anterior puede ignorar decisiones
  negativas de disponibilidad de 007. No usar rollback solo de imagen ni restauración
  destructiva; una recuperación necesita preservar/reconciliar escrituras posteriores.
- Agenda refleja solo compromisos capturados. Confirmar compromisos externos con el
  equipo; no interpretar días libres del sistema como disponibilidad garantizada.
- Referencias: nueve documentos antes enlazados existen solo localmente y están
  ausentes de HEAD/GitHub. PROJECT los enumera como texto local. Los enlaces restantes
  apuntan a archivos ya versionados o a PROJECT/HANDOFF, que deben publicarse juntos
  con AGENTS. No se necesita ampliar el alcance para evitar enlaces rotos.
- Un clon basado solo en HEAD más estos tres documentos no incluye el código, pruebas
  ni informes locales posteriores. El mapa local no acredita que esos cambios estén
  versionados. La validación de enlaces verifica destinos, sin corregir enlaces
  internos de documentación histórica ajena al alcance.

**Siguiente acción exacta:** completar y comprobar el commit aislado autorizado:
revisar las tres rutas y todo el diff staged, revalidar el remoto y publicar sin
forzar solo si conserva la base esperada. Confirmar el hash real local/remoto,
los tres archivos en GitHub y la integridad de los 110 cambios ajenos; este texto
no acredita por sí mismo que el push ya ocurrió. Tras verificar el cierre, esperar
la siguiente solicitud. Las definiciones de Karen requieren confirmación y un ticket
posterior; no empezar cambios funcionales por este HANDOFF. Al retomar, comprobar
Git según [AGENTS](../../AGENTS.md). Reemplazar este estado operativo al iniciar otra
entrega significativa.
