# Calidad, seguridad y operación

## Definición de terminado

Una función está terminada cuando cumple la aceptación, funciona con teclado/móvil, controla estados vacíos/error/carga, valida entradas en servidor, tiene permisos probados y se puede diagnosticar sin registrar datos sensibles. El build correcto por sí solo no demuestra seguridad ni funcionamiento comercial.

## Matriz mínima de pruebas premium

| Área | Escenarios |
|---|---|
| Motor | Extras de los tres tipos, máximos/mínimos por menú, incompatibilidades, suma de líneas, impuestos configurados, traslado pendiente |
| Fechas | Zona horaria del negocio, cambio de día, fecha inexistente, anticipación por paquete, fecha bloqueada cuando exista agenda |
| Solicitud | Falta contacto, precio cambió, doble clic, timeout tras guardar, reintento, catálogo despublicado |
| Autorización | Lectura anónima de leads denegada; editor no publica precios si su rol no lo permite; usuario desactivado sin acceso |
| Contenido | HTML malicioso, enlaces inseguros, subida con extensión falsa, borrador invisible, restauración de publicación |
| Datos | Cotización antigua conserva precios; estado comercial no altera importe; folio no permite leer datos privados |
| UI | 360/390/768/1280 px, teclado, foco modal, contraste, validación asociada a campos, ausencia de scroll horizontal |
| Fallos | API caída, upload interrumpido, correo fallido, conflicto de edición; mensajes accionables sin perder selección |
| Posterior: pagos | Webhook duplicado/falso/fuera de orden, pago tardío, reserva concurrente, devolución |

Pruebas actuales existentes: `npm run build` y `node tests/regression.cjs`. Agregar runner unitario, pruebas de integración/permisos de backend y E2E cuando se implemente cada módulo; no afirmar que ya existen. Usar sandbox de proveedores y contactos ficticios; nunca enviar mensajes o generar cobros reales durante pruebas.

## Seguridad aplicada

Acceso denegado por defecto a datos comerciales. Políticas por rol y operación; revisar privilegios de vistas y funciones privilegiadas. Publicación, cambio de precio, asignación de rol y exportación auditados. No confiar en ocultar botones.

Validación y límites en endpoints públicos; mitigación antispam gradual y límite de tamaño. CSP y enlaces seguros; HTML editorial sanitizado o bloques estructurados. Invitaciones administrativas restringidas. Rotación/revocación de accesos y credenciales al salir del equipo.

Recopilar solo datos necesarios. Necesidades alimentarias en campos privados y opcionales, no logs, URL ni analítica. Retención y eliminación por acordar; no conservar indefinidamente por defecto. Los textos de privacidad, impuestos y condiciones requieren validación del negocio y, cuando proceda, su asesor; estos documentos son requisitos de producto, no dictamen legal.

## Publicación y continuidad

- Desarrollo → staging → revisión → producción; migraciones pequeñas, versionadas y compatibles durante transición.
- Entrega conserva la demo hasta aceptar staging. No mezclar datos de demostración con leads reales.
- Backup de base y objetos antes de cambios de esquema/carga masiva; frecuencia y retención según servicio contratado.
- Ensayar restauración en entorno separado. No confundir rollback del frontend con restauración de base.
- Definir con negocio pérdida de datos tolerable y tiempo de recuperación; objetivos provisionales RPO 24 h/RTO 1 día hábil, sujetos a recursos y plan. No vender SLA 24/7 sin soporte contratado.
- Alertas: errores de guardar, fallos de publicación, cola de notificaciones, consumo y acceso inusual. Dueño técnico de cada alerta definido.
- Si falla el envío de correo, la solicitud persiste y se muestra en bandeja. UI no afirma “correo entregado” sin evidencia.

## Analítica

Eventos: configurador_iniciado, viabilidad_completada, menu_seleccionado, resumen_visto, estimado_aceptado, solicitud_guardada, whatsapp_abierto, estado_comercial_actualizado. ID seudónimo no derivado de email/teléfono; sin textos libres. Sesiones de prueba identificadas y excluidas.

Reportes básicos inicialmente: solicitudes semanales, listas/por revisar, etapa y motivos de pérdida. Dashboard avanzado después de volumen suficiente. No optimizar solo leads: medir calidad, tiempo humano y reservas reales.

## Rendimiento y accesibilidad

Imágenes con dimensiones y versiones responsivas, carga diferida bajo portada y prioridad solo a la imagen principal; panel cargado aparte. Objetivos de validación: LCP ≤2.5 s, INP ≤200 ms y CLS ≤0.1 en condiciones documentadas; verificar en campo cuando haya tráfico. Son objetivos, no resultados medidos de esta demo.

## Entrega y mantenimiento

Manual del propietario con capturas, guía de publicar/restaurar, uso de bandeja, recuperación de cuenta y contacto de soporte. Capacitación propuesta de 60–90 minutos. Acordar por escrito garantía limitada de corrección de defectos (propuesta: 30 días), horario y mantenimiento recurrente; no incluir funcionalidades nuevas en garantía.

Revisión mensual propuesta: dependencias, accesos, errores, consumo, copia/restauración y embudo. Hosting, correo, dominio y servicios a nombre del negocio; no guardar contraseñas en Markdown.
