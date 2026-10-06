# Plan de entrega: $15,000 y tres semanas

Dato confirmado por el desarrollador el 2026-09-16: vendido en 15 mil, entrega en tres semanas. Se asume MXN; impuestos, anticipo, mantenimiento y día de inicio no confirmados. No asumir que tres semanas significa fecha exacta hasta acordar arranque y entrega de materiales.

## Corte contractual recomendado

La visión completa de los otros documentos excede este precio y plazo. El paquete de tres semanas debe presentarse como **Premium inicial administrable**, con estos entregables:

1. Conservar el diseño aprobado y adaptación móvil.
2. Panel privado para fotos, textos de secciones existentes, preguntas, paquetes y extras.
3. Edición guiada con borrador, vista previa y publicación; historial mínimo para recuperar una publicación anterior.
4. Un carrito/configurador por evento con progreso local no sensible; estimación validada en servidor.
5. Filtro por invitados, zona, antelación, inversión aceptada y requisitos; resultado con motivos. Disponibilidad siempre por confirmar.
6. Guardar solicitud con folio y snapshot de importes; página imprimible para guardar PDF desde navegador. No motor avanzado de documentos.
7. Bandeja interna con búsqueda, estado, notas, próxima acción y responsable.
8. WhatsApp manual con resumen y folio; correo transaccional básico solo si dominio/proveedor están disponibles en la primera semana.
9. Medición básica del embudo sin datos personales, capacitación y entrega de accesos.

Propuesta de límites para cerrar por escrito: un negocio, español, tres cuentas de personal, hasta seis paquetes y doce extras de carga inicial, veinte fotos, secciones actuales y dos rondas consolidadas de ajustes. Los límites de carga inicial no son límites técnicos permanentes del catálogo. Se pueden administrar más elementos después; no se incluyen cargas masivas ilimitadas ni rediseños nuevos.

**No incluido en esta entrega:** pagos, reservas automáticas, calendario de capacidad, WhatsApp Business API, bot conversacional, portal con cuentas de clientes, recuperación entre dispositivos, facturación, CRM externo, presupuestos de múltiples eventos, campañas y seguimiento automático. Incluirlos posteriormente con cotización propia. No presentar estas exclusiones como ya aceptadas por el cliente: hay que validar el alcance prometido.

## Calendario propuesto: 15 días hábiles

| Periodo | Trabajo | Criterio de salida |
|---|---|---|
| Días 1–2 | Alinear alcance y reglas, materiales, Git, staging, esquema, accesos | Matriz de reglas aprobada y acceso de prueba funcional |
| Días 3–5 | Contenido y catálogo administrable, imágenes, publicación, permisos de backend | Dueño cambia foto/texto y publica un paquete desde móvil; usuario ajeno no puede editar |
| Días 6–8 | Estado del carrito, motor servidor, validaciones, snapshots | Cantidades/límites/precios correctos; tarifas del navegador no se pueden manipular |
| Días 9–10 | Precalificación, guardar folio, bandeja y WhatsApp manual | Solicitud completa aparece una sola vez con razones y desglose |
| Días 11–12 | QA integral, acceso entre usuarios, rendimiento móvil, eventos | Pruebas críticas pasan; no hay fuga de solicitudes ni borradores |
| Día 13 | Prueba con cliente y ronda consolidada | El cliente ejecuta editar → publicar → cotizar → atender |
| Día 14 | Correcciones y restauración/rollback ensayados | Entrega candidata y manuales listos |
| Día 15 | Capacitación, revisión final y despliegue acordado | Acta de aceptación y responsables definidos |

Estimación de planificación: 75–95 horas de trabajo concentrado, incluido QA y un margen de integración. No es garantía: accesos, material y alcance pueden ampliarla. Tres semanas requieren disponibilidad sostenida; IA ayuda a producir código, no elimina revisión ni pruebas. Con 15,000 MXN el ingreso bruto equivale aproximadamente a 158–200 MXN/h antes de costos e impuestos; proteger margen mediante alcance y cuotas recurrentes separadas.

## Dependencias y decisiones

- Antes de día 3: reglas y precios, correo/dominio, propiedad de cuentas y responsable único de aprobación.
- Proveedor de correo pendiente: entrega conserva bandeja y WhatsApp manual; no simular envíos exitosos.
- Si hay retraso: priorizar panel, cotizador correcto y solicitudes; posponer acabados adicionales, no permisos ni validación servidor. Reprogramar cuando afecte un entregable contractual.
- No comenzar pagos ni bot “si sobra un rato”. Cualquier ampliación implica estimación y fecha nuevas.

## Tickets iniciales con aceptación

| ID | Tarea | Prueba de aceptación |
|---|---|---|
| P0-01 | Baseline y repositorio | Build y regresiones actuales reproducibles; demo preservada |
| P0-02 | Reglas negocio | Tabla de límites, vigencia y pendientes aprobada |
| P1-01 | Acceso/roles/permisos backend | Anónimo no lee leads; editor no asigna roles; comercial no publica tarifas |
| P1-02 | Contenido y medios | Guardar borrador no altera público; rechazo de archivo inválido |
| P1-03 | Publicar catálogo | Release consistente y rollback editorial verificable |
| P2-01 | Borrador de evento | Cambiar menú conserva fecha/contacto en memoria y elimina incompatibles con aviso |
| P2-02 | Motor de servidor | Entradas adulteradas rechazadas, impuestos y pendientes explícitos |
| P2-03 | Solicitud e idempotencia | Doble clic produce un folio; conflicto de precio pide nueva aceptación |
| P2-04 | Precalificación | Casos estándar y excepciones explicados, sin garantía de compra |
| P3-01 | Bandeja | Filtrar, asignar y cambiar estado con auditoría |
| P3-02 | Resumen imprimible | Folio coincide con snapshot; no expone notas internas |
| P3-03 | Embudo | Eventos sin PII; WhatsApp abierto no se cuenta como venta |
| P4-01 | UAT y entrega | Dueño completa escenarios y recibe manuales/credenciales por canal seguro |

La fase siguiente se estima después del piloto; la agenda y los pagos forman un proyecto de operación, no solo un botón de checkout.
