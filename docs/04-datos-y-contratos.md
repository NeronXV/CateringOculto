# Datos y contratos de desarrollo

Destino actual: Node.js + MySQL/MariaDB. Sesiones administrativas en backend; todas las consultas comerciales autorizadas por rol y recurso. Los IDs de usuario pertenecen a usuarios locales de la aplicación.

Diseño lógico propuesto; no es un esquema desplegado. La entrega de tres semanas implementa únicamente lo marcado MVP. Un único negocio; no construir multitenancy.

## Modelo

| Entidad | Datos e invariantes | Fase |
|---|---|---|
| staff_profiles | ID de usuario del backend, rol propietario/editor/comercial, activo; rol asignado solo por propietario | MVP |
| content_revisions | sección, JSON validado, revisión, borrador/publicado, autor y fecha | MVP |
| media_assets | ruta, tipo, dimensiones, alt, estado de publicación, propietario | MVP |
| catalog_releases | revisión publicada inmutable y fecha; puntero único a revisión vigente | MVP |
| packages / package_options | ID estable, nombre, platos/opciones, restricciones, rango de invitados | MVP; opciones limitadas al alcance acordado |
| extras / package_extras | precio y modalidad persona/unidad/fijo, límites y compatibilidades | MVP |
| service_zones | cobertura, tarifa fija o pendiente; no distancia GPS automática | MVP |
| pricing_rules | anticipación, mínimos/máximos, impuestos y vigencia aprobados, versión | MVP |
| quote_drafts | selecciones no sensibles en navegador; recuperación remota autenticada después | Local MVP / remoto después |
| quotes | UUID, folio único, release, versión motor, fecha/franja, invitados, zona, estado, vigencia | MVP |
| quote_items | snapshot de nombre, cantidad, modalidad, importe unitario y total en centavos | MVP |
| quote_contacts | nombre, canal y contacto; acceso restringido, no listado público | MVP |
| quote_private_notes | logística y necesidades alimentarias opcionales; visibilidad restringida | MVP |
| qualification_results | versión de reglas, criterios, motivos, resultado y pendientes | MVP |
| lead_events | cambios de estado, responsable y próxima acción, autor/fecha | MVP |
| consent_records | finalidad, versión de texto, fecha y canal | MVP |
| audit_events | publicación, tarifas, accesos privilegiados y cambios de estado; sin secretos ni detalles sensibles | MVP |
| notification_outbox | evento único, estado, intentos, próxima ejecución, error saneado | MVP si se habilita correo; bandeja funciona sin proveedor |
| availability_blocks / resources | fecha/franja, capacidad y bloqueos | Posterior; MVP solo aviso de confirmación humana |
| reservations / holds | recursos, intervalo, vencimiento, versión y estado | Posterior |
| payments / webhook_events | proveedor, referencia única, moneda, importe, estado y conciliación | Posterior |

Los registros de paquetes/extras que alimentan una release se leen consistentemente. Puede materializarse un snapshot JSON validado por release para el catálogo público pequeño. La estructura final se fija en migración, no duplicar dos fuentes editables.

## Precios

Dinero entero en centavos MXN. Cantidades enteras y acotadas. Rechazar IDs no publicados, extras incompatibles, NaN, negativos e infinitos; no sustituir silenciosamente por el primer paquete como hace hoy la demo.

`subtotal = invitados × tarifa_persona + extras_por_persona × invitados + extras_por_unidad × cantidad + extras_fijos + traslado_conocido`

Impuestos: usar la política que confirme el negocio; explicitar si incluidos, separados o pendientes. No asumir que una tasa aplica a todos los conceptos. No consultar a un LLM para precios. Si traslado o servicios están pendientes, devolver `estimateStatus: partial` y lista de pendientes; mostrar “estimado parcial”, no “total final”.

Redondeo por línea según regla documentada; suma de líneas debe coincidir con el resumen y documento. Reglas de mínimos: confirmar si se rechaza, se cobra mínimo o se revisa; hasta entonces revisión humana, no facturación implícita del mínimo.

## API propuesta

Las rutas son contratos semánticos; adaptar al enrutador de funciones elegido. Validar schemas compartidos y tamaños máximos. Rate limiting real en servidor; CORS por sí solo no protege una API pública.

| Operación | Entrada | Salida / control |
|---|---|---|
| GET /catalog | release opcional | Solo contenido publicado, versionado, cacheable |
| POST /quotes/estimate | IDs, invitados, fecha/franja, zona, release | Desglose, versión, vigencia, advertencias; cálculo servidor |
| POST /quotes/submit | Configuración, contacto, aceptación de estimado, versión aceptada, idempotency key | Recalcular y guardar transaccionalmente; folio o conflicto |
| GET /admin/quotes | Filtros/paginación | Sesión autenticada y autorización por rol/recurso; mínimo contacto necesario |
| PATCH /admin/quotes/:id/status | Estado, versión esperada, motivo | Transición autorizada; evento auditado |
| POST /admin/content/:id/publish | Revisión esperada | Publicación atómica; conflicto si otro usuario editó |
| POST /admin/media | Archivo/metadata | Validación de archivo y permiso; borrador privado |
| GET /quotes/:id | Sesión propietaria o token opaco limitado | Fase recuperación; jamás acceso por folio predecible |

Si la tarifa cambió desde la aceptación, respuesta 409 con nuevo estimado y solicitud de aceptación explícita. No aceptar importes enviados como autoridad. Para doble clic/reintento: clave única más hash del payload; misma clave y datos devuelven mismo resultado, misma clave y datos diferentes → conflicto.

No adjuntar datos sensibles a query strings. El folio de WhatsApp no es credencial. Un enlace de recuperación futuro debe tener token aleatorio, expiración, revocación y almacenamiento hash, sin acceso por enumeración.

## Estados MVP

Separar `qualification_status` (lista / incompleta / revisión especial) de `sales_status` (nueva / en revisión / contactada / propuesta enviada / ganada / perdida / archivada). Una solicitud puede estar lista comercialmente y requerir revisión de cocina.

Nueva → en revisión → contactada → propuesta enviada → ganada o perdida. Se permiten saltos razonables explícitos por el comercial; ganada/perdida requieren motivo/evidencia y fecha, y cualquier reapertura se audita. “Ganada” MVP es registro humano, no prueba automática de pago ni reserva de agenda.

Las cotizaciones emitidas son snapshots inmutables: corregir creando versión nueva ligada a la anterior. Los borradores pueden expirar; estados comerciales no se borran por el vencimiento de una tarifa.

## Reserva posterior

No equiparar carrito, cotización, aceptación, anticipo y reserva. Proceso posterior: revisión humana → oferta vigente → hold de capacidad → pago verificado → reserva confirmada. Asignación de recursos en transacción con exclusión/lock; dos pagos para el último espacio no pueden generar dos reservas. Hold expirado + pago tardío → revisión/conciliación, nunca confirmación automática sin capacidad. Diseñar reembolsos y cancelaciones antes de habilitar cobros.
