# Catering Oculto — Plan premium

Fecha: 2026-09-16. Estado: propuesta para acordar alcance; no es funcionalidad implementada ni compromiso de entrega.

**Restricción comercial confirmada:** 15 mil y tres semanas; moneda asumida MXN. El corte de entrega de [05-plan-de-ejecucion.md](05-plan-de-ejecucion.md) prevalece sobre la visión ampliada de los demás documentos. El desglose debe validarse contra lo prometido al cliente.

## Objetivo

Convertir la demo en una plataforma administrable que ayude al visitante a diseñar su evento, entender la inversión y entregar al equipo una solicitud lista para revisar. Conservar la identidad oscura y dorada que ya gustó al cliente.

## Documentos

1. [Producto y alcance](01-producto-y-alcance.md): propuesta, prioridades, exclusiones y métricas.
2. [Flujo comercial](02-flujo-y-precalificacion.md): configurador, carrito, criterios y atención humana.
3. [Arquitectura](03-arquitectura.md): stack recomendado, módulos, seguridad y evolución.
4. [Datos y contratos](04-datos-y-contratos.md): entidades, API, precios, versiones y estados.
5. [Plan de ejecución](05-plan-de-ejecucion.md): fases, entregables y dependencias.
6. [Calidad y operación](06-calidad-y-operacion.md): pruebas, lanzamiento, mantenimiento y recuperación.
7. [Decisiones pendientes](07-decisiones-pendientes.md): preguntas para negocio y supuestos.
8. [Trabajo con IA](08-trabajo-con-ia.md): tareas, contexto y criterios de revisión.
9. [Preparación local y avance](09-preparacion-local.md): implementación actual y siguiente ticket.
10. [Panel editorial local](10-panel-local.md): funcionamiento, persistencia, límites y preparación para producción.
11. [Base de datos y acceso](11-base-de-datos-y-acceso.md): MariaDB local, sesiones, permisos y arranque sin Docker.
12. [Fotografías](12-fotografias.md): carga, optimización, permisos y publicación de imágenes.
13. [Secciones editables](13-secciones-editables.md): galería, experiencias, filosofía y compatibilidad del catálogo.
14. [Cotización en servidor](14-cotizacion-servidor.md): estimación validada, solicitudes con folio, snapshots e idempotencia local.
15. [Bandeja comercial](15-bandeja-comercial.md): consulta privada, seguimiento, asignación e historial con control de concurrencia.
16. [Reglas y filtro](16-reglas-y-filtro.md): configuración con aprobación independiente, respuestas comerciales y motivos guardados.
17. [Plan técnico para Tony](17-plan-tecnico-tony.md): contraste del Word del cliente, catálogo real, arquitectura VPS Ubuntu/Docker/MariaDB y plan de entrega actualizado al 1 de octubre de 2026.

Las instrucciones de trabajo para agentes están en [AGENTS.md](../AGENTS.md). El proyecto combina la demo pública con funciones premium locales; el build de producción todavía conserva la demo.

## Estado real del proyecto

Actualización del 3 de octubre de 2026: Catering ya está desplegado con servidor
Node independiente, MariaDB y Docker en `https://cateringoculto.bajastack.network`.
El proxy HTTPS compartido se separó de Vivero. Ver [18-despliegue-vps.md](18-despliegue-vps.md)
para pruebas reales, respaldo, creación de propietario y pendientes. El inventario
histórico siguiente describe el estado local previo y no sustituye ese registro.

- React 19 + TypeScript + Vite; componentes de presentación reutilizables.
- Catálogo, extras, zonas y preguntas en archivos `src/config`.
- Panel editorial local en `/admin`, con borrador, vista previa, publicación y recuperación anterior; conectado a MariaDB con sesiones y permisos. El propietario crea su primera cuenta si no existe. Ver documento 11.
- Bandeja local para propietario/comercial: búsqueda, estados, responsable, próxima acción, notas e historial; cotizaciones originales inmutables. Ver documento 15.
- Cotizador con vista preliminar en navegador; en local revisa en servidor y guarda solicitudes con folio y snapshot en MariaDB. WhatsApp manual; no confirma reservas. Ver documento 14.
- Borrador local de selección con expiración y sin datos personales; navegación conserva el evento.
- MariaDB local operativa; sin despliegue remoto, CRM ni pagos.
- Carga de fotografías en portada y menús con optimización y privacidad hasta publicar; prueba manual de interfaz pendiente del primer acceso del propietario.
- Pruebas actuales: `node tests/regression.cjs`; compilación: `npm run build`.
- Repositorio Git local inicializado y exclusiones configuradas; todavía no hay commit inicial ni remoto.
- Motor local de servidor con validación estricta de IDs, cantidades y compatibilidad. El cálculo preliminar del navegador conserva los valores de respaldo de la demo; no es autoridad para guardar solicitudes.

## Dirección técnica actual

Dirección actualizada el 1 de octubre de 2026: React/Vite + backend Node.js + MariaDB en VPS Hostinger con Ubuntu y Docker, según instrucción del usuario. Sustituye la propuesta anterior de Node administrado. Docker local responde; la API de producción y el despliegue aún no están implementados. Ver documento 17.

## Recomendación ejecutiva

Entregar primero un premium operativo acotado: panel editorial, catálogo versionado, borrador local no sensible, presupuesto calculado en servidor, precalificación explicable, bandeja comercial y medición básica. Después incorporar agenda, recuperación entre dispositivos, anticipos y automatizaciones. El asistente con IA conversacional queda para cuando exista contenido aprobado y datos de preguntas frecuentes.

La meta del 90% se interpreta como completitud de la solicitud, no probabilidad de compra. La tasa de cierre se medirá con resultados reales.

### Entrega funcional publicada — 4 de octubre de 2026

Ver [19 — Catálogo, cotizador y acceso al panel](19-entrega-catalogo-cotizador.md).
El backend Node/MariaDB ya opera en el VPS; los apartados anteriores sobre backend
pendiente describen el estado histórico. Sigue pendiente que el usuario cree su
cuenta de propietario y que el chef confirme las reglas comerciales ambiguas.

### Dos roles — 4 de octubre de 2026

La solicitud actual define solo Admin y Editor, ambos con contenido y bandeja;
solo Admin gestiona usuarios. Ver [20 — Usuarios y roles](20-usuarios-y-roles.md).
Sustituye las matrices históricas de propietario/editor/comercial.

### Agenda y experiencia premium — 4 de octubre de 2026

Implementadas agenda compartida, apartados con vencimiento, bloqueos, ficha de
preparación, propuesta final versionada y seguimiento privado. Ver
[21 — Agenda y experiencia premium](21-agenda-y-experiencia-premium.md).
El usuario autorizó esta ampliación; sustituye la exclusión histórica de agenda
para este alcance. Pagos y cierre siguen fuera de la página, por WhatsApp.
