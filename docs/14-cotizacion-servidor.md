# Cálculo y solicitudes locales

Implementado el 2026-09-17. Disponible únicamente con Vite dev y MariaDB, en `http://127.0.0.1:5180/`. No es un backend desplegado. El build estático conserva el flujo de demostración por WhatsApp; no incluye este guardado ni el panel.

## Flujo para probar

1. Iniciar `npm run db:native`, aplicar `npm run db:migrate` y arrancar `npm run dev`.
2. Configurar evento, fecha futura, menú, invitados y extras; completar nombre ficticio.
3. En el resumen, añadir teléfono ficticio y pulsar **Revisar estimado actualizado**. En móvil, expandir primero el resumen.
4. Revisar desglose, pendientes y aceptación del guardado. Pulsar **Guardar solicitud con folio**.
5. Conservar el folio mostrado. WhatsApp abre únicamente a petición del visitante y requiere envío manual. No se envían notificaciones, cobran anticipos ni reservan fechas.

Las pruebas locales deben usar datos ficticios. El aviso de privacidad definitivo, retención y condiciones del cliente siguen pendientes; la aceptación `local-demo-v1` documenta esta prueba y no sustituye esos documentos.

## Motor

- `server/quoteEngine.ts`: entradas exactas de selección, IDs publicados, compatibilidad, cantidades enteras y límites. Rechaza importes enviados por el navegador y campos desconocidos.
- Todos los importes son centavos enteros; suma menú por persona, extras por persona/unidad/fijos y traslado conocido.
- Solo usa el catálogo publicado, nunca el borrador ni los precios recibidos del navegador.
- Mantiene el límite de 150 invitados de la demo y el máximo de cada paquete. Bajo el mínimo solo marca revisión: no inventa un mínimo facturable.
- Fecha válida posterior al día local del negocio, usando `America/Mazatlan` para La Paz. Es la restricción actual de la demo; la anticipación comercial permanece pendiente.
- Impuestos sin resolver, tarifas de demostración y disponibilidad pendiente: siempre `partial`, `demo: true`, motor `demo-v1`. No se anuncia probabilidad de cierre.
- La versión es un SHA-256 del estimado y su catálogo completo. Cualquier publicación distinta exige revisión nueva, aunque el cambio sea editorial. Guardar solo un borrador no cambia la versión pública.

## API y persistencia

Rutas bajo `/api/local-editor`, con guardas locales y límite compartido de 30 operaciones por minuto/IP:

- `POST /quotes/estimate`: recibe selección, devuelve desglose/versiones/pendientes. No guarda contacto ni solicitud.
- `POST /quotes/submit`: selección, contacto, versión aceptada, consentimiento y clave UUID v4; recalcula en transacción y guarda snapshot inmutable.
- No hay consulta pública por folio ni lista pública. La bandeja privada y su API autorizada ya están implementadas; ver [15-bandeja-comercial.md](15-bandeja-comercial.md).

La migración `002-quotes.sql` añade `quote_requests` sin sustituir el catálogo o las cuentas. Almacena folio único, clave de idempotencia única, hash del payload, snapshot del estimado, contacto separado, versión de aceptación, fecha UTC y estado `nueva`. El folio usa fecha UTC y UUID completo; no es una contraseña ni un enlace de recuperación.

El guardado bloquea la misma fila editorial que la publicación. Consulta primero la clave de idempotencia: mismo payload devuelve el mismo folio, incluso después de un cambio de catálogo; distinta información con la misma clave devuelve 409. Para una solicitud nueva, una versión distinta devuelve 409 y no inserta nada. No hay actualizaciones de snapshots emitidos.

El navegador conserva la clave de reintento en memoria para ese payload durante la sesión del componente. No guarda contacto, alergias o notas en localStorage. Recargar la página pierde el recibo y esa clave: no hay recuperación entre recargas/dispositivos todavía. Conservar el folio antes de salir. Una nueva solicitud explícita es un registro distinto.

## Evidencia y pendientes

- `npm run test:quotes`: aritmética, modalidades de extras, fechas, IDs/cantidades inválidas, compatibilidad, mínimos y versiones.
- `npm run test:mysql`: base real aislada y temporal; doble envío concurrente produce un registro, conflicto de tarifa no inserta, reintento devuelve snapshot original, consentimiento/contacto requeridos, acceso anónimo por folio rechazado. Mantiene pruebas de cuentas, permisos, medios y publicación.
- `npm test`, `npm run typecheck:server`, `npm run build`.
- Prueba de navegador local con solicitud ficticia y folio guardado; validación de teléfono y activación del guardado con teclado. No se envió WhatsApp.
- Revisión visual a 390 × 844: resumen expandible, desglose y aceptación legibles. Se corrigió el pie de navegación para que los controles se distribuyan en filas en móvil. No constituye una suite E2E completa.
- Bandeja local completada: ver documento 15. Pendientes: precalificación comercial aprobada, resumen imprimible, política de retención/privacidad y backend independiente de Vite para hosting.
