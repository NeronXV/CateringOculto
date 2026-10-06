# Bandeja comercial local

Implementada el 2026-09-18. Funciona con MariaDB y Vite local; no está desplegada.

## Uso

1. Ejecutar `npm run local:start` (incluye migraciones).
2. Abrir `/admin` e iniciar sesión. El propietario elige **Solicitudes**; comercial entra directamente a la bandeja. Editor conserva únicamente contenido.
3. Buscar por nombre o folio, filtrar estado y seleccionar una solicitud. La lista tiene páginas de 20 elementos.
4. Consultar contacto, evento, restricciones declaradas y desglose original. Los importes vienen del snapshot guardado, sin recalcular contra precios actuales.
5. Asignar propietario/comercial activo, estado, próxima acción, fecha opcional y nota interna. Guardar agrega actor, fecha y cambios al historial.

Estados operativos iniciales: Nueva, En revisión, Contactada y Cerrada. Cerrada solo significa fin del seguimiento; no acredita compra, pago o reserva. Las reglas de precalificación del negocio siguen pendientes de aprobación.

Las notas se agregan al historial y no se editan ni se envían al visitante. Cambiar de pestaña entre contenido y solicitudes conserva los formularios montados. Abrir otro detalle con cambios sin guardar pide descartarlos; recargar/cerrar la página usa el aviso de salida del navegador. Cerrar sesión es una salida explícita y no guarda cambios.

## Persistencia y permisos

- Migración `003-inbox`: añade `quote_followup` y `quote_activity`, sin sustituir datos existentes. Aplicada en la base local durante esta entrega.
- API autenticada: `GET /api/local-editor/inbox`, `GET /inbox/staff`, `GET /inbox/:id` y `POST /inbox/:id` (las últimas bajo el mismo prefijo).
- Solo propietario/comercial acceden a cualquier solicitud del negocio; no hay restricción por asignación. Editor y anónimo no pueden leer ni escribir la bandeja. No existe consulta pública por folio.
- Escritura transaccional: bloqueo por solicitud, revisión optimista, seguimiento, estado comercial y auditoría juntos. Una revisión obsoleta devuelve 409; no sobrescribe datos. El formulario conserva el texto para copiarlo antes de recargar.
- No se modifican contacto ni snapshot de importes. No se persiste información de solicitudes en localStorage.
- La fecha de próxima acción es una fecha de calendario sin hora; no crea recordatorios automáticos.

## Verificación

- `npm run test:mysql`: integración HTTP con MariaDB real aislada; lectura por roles, filtros, responsables inválidos, origen externo, campos desconocidos, fechas inválidas, concurrencia (un guardado y un 409), auditoría y snapshot intacto.
- Pasan `npm test`, `npm run test:auth` (SQL simulado), `npm run test:quotes`, `npm run typecheck:server` y `npm run build`.
- `tests/inbox-ui.mjs`: interfaz real con API simulada y datos ficticios, Edge headless, escritorio y móvil de 390 px; guardado con Enter, historial visible y ausencia de desbordamiento horizontal. Capturas en `.local-data/qa/`. Requiere Playwright disponible; `PLAYWRIGHT_MODULE` acepta la ruta del módulo instalado y `PLAYWRIGHT_CHANNEL` permite elegir navegador (por defecto `msedge`). No instala dependencias ni navegadores.
- No constituye una prueba E2E integral del panel con sesión real. No se crearon cuentas ni solicitudes ficticias en la base del usuario; la suite real elimina su base temporal.

## Lo siguiente antes del hosting

1. Resumen imprimible desde el snapshot, separado de notas/historial internos.
2. Administración de equipo y cambio de contraseña.
3. Precalificación explicable cuando estén aprobadas las reglas comerciales; medición del embudo sin PII.
4. Separar API de Vite, preparar configuración de producción y ensayar respaldo/restauración.

Siguen pendientes hosting/dominio/HTTPS, medios persistentes, retención y privacidad definitivas, recuperación por correo, prueba con el propietario y capacitación. El build estático todavía entrega la demo.
