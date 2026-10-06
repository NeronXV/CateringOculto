# Agenda compartida y atención premium

Entrega del 4 de octubre de 2026. Release `20261004-operations`, migración 005.

## Decisiones del negocio

Carlos y Karen trabajan juntos; regla inicial: un evento por día. Los pagos se acuerdan con el chef por WhatsApp. La página prepara la solicitud, y una cotización no aparta una fecha. El chef decide la duración de cada apartado; no se inventó un vencimiento comercial automático ni una excepción de capacidad. No hay cobros en la web.

## Recorrido del cliente

En el cotizador, **Ver calendario de disponibilidad** muestra días disponibles para solicitar, sujetos a revisión por apartado o no disponibles. Puede seleccionar otra fecha cercana. La disponibilidad pública nunca contiene nombres, teléfonos, direcciones ni información de eventos.

**¿Necesitas ayuda para elegir?** permite explorar desayunos, lunch y cenas por momento del servicio e inversión aproximada. Solo usa el catálogo existente; no inventa suplementos ni precios pendientes. Invitados y platillos se completan en el cotizador.

Guardar una solicitud conserva el folio y snapshot originales. Si la fecha quedó confirmada o bloqueada mientras el cliente llenaba el formulario, el backend rechaza el nuevo guardado y solicita otra fecha. Los reenvíos idempotentes de solicitudes ya guardadas conservan su folio incluso si cambia la agenda.

El chef prepara la ficha y comparte un enlace de seguimiento por WhatsApp. El cliente consulta estado, vencimiento activo, última propuesta publicada, importe acordado y, cuando hay confirmación, anticipo registrado y saldo. Puede imprimir la propuesta o guardar PDF con el navegador. No necesita una cuenta. Un enlace compartido permite acceso a quien lo reciba: entregarlo únicamente a organizadores del evento.

## Operación de los chefs

Ambos roles entran a **Agenda y eventos**. Desde Solicitudes, **Preparar ficha en la agenda** prellena datos y preferencias de la solicitud. También pueden registrar eventos recibidos por WhatsApp/teléfono y bloqueos de descanso.

1. Guardar la ficha **En revisión**: no ocupa la fecha.
2. Seleccionar **Apartado temporal** y un vencimiento futuro: ocupa el día hasta ese momento.
3. Escribir propuesta final, servicios, horarios, condiciones e importe acordado. **Guardar y publicar propuesta final** crea una versión separada del presupuesto original.
4. Registrar el anticipo recibido fuera de la web y marcar que fue verificado.
5. Seleccionar **Reserva confirmada** y guardar. Requiere propuesta final publicada y consistente, importe final y anticipo verificado; si otro evento ocupa el día, rechaza el cambio.
6. Crear y compartir el enlace privado. Generar otro enlace invalida el anterior.

Un apartado vencido libera disponibilidad al consultar la agenda; el registro e historial permanecen. Para renovar, indicar un nuevo vencimiento: se vuelve a comprobar que la fecha siga libre. Cancelar libera el día sin eliminar información.

La ficha contiene dirección interna, horarios, notas de preparación, lista de tareas y su cumplimiento. El listado muestra tareas pendientes y vencimientos de apartados. Las respuestas preparadas para WhatsApp se abren para revisión y envío humano. No hay notificaciones automáticas, correos transaccionales ni cron de recordatorios configurados.

## Datos y acceso

Admin y Editor tienen agenda y solicitudes; solamente Admin gestiona usuarios. Se conserva la autenticación existente. Transacciones con bloqueo compartido serializan cambios de agenda, cotizaciones y publicación: evitan dobles apartados/reservas y precios obsoletos. La revisión protege contra sobrescribir cambios de otra persona.

Las propuestas publicadas conservan versiones inmutables. El snapshot original de la solicitud se conserva en su tabla. La auditoría operativa guarda actor, acción, cambios y fecha. El enlace usa 32 bytes aleatorios; la base guarda únicamente SHA-256. El token viaja en el fragmento de URL y se consulta por POST, no en la ruta del servidor. La página tiene noindex y referrer no-referrer. El JSON público omite contacto, dirección, notas internas, tareas, responsables y auditoría.

## Verificación y despliegue

Build Windows/Linux y pruebas existentes de acceso y precios aprobados. Suite MariaDB real aislada: conflicto de dos apartados simultáneos, vencimiento, reocupación, importes inválidos, rechazo de confirmación sin propuesta, versión obsoleta, privacidad del enlace, rotación y revocación, propuestas y auditoría. Rechazo de nueva cotización en día ocupado comprobado.

Revisión de interfaz en fixture local en memoria: registrar, guardar con Enter, publicar propuesta, generar enlace y consultar propuesta. Seguimiento y ficha observados a 390 px sin desbordamiento horizontal. La fixture no acredita persistencia SQL; esta se acredita por la suite real. La impresión usa CSS específico; no se automatizó el diálogo de impresión del sistema.

Backup previo `/srv/backups/catering-oculto/20261004-210620`, SQL restaurado en base temporal y catálogo comparado; medios legibles. Se conservan releases y volúmenes de producción. No se crearon cuentas ni eventos reales de prueba en producción, ni se enviaron mensajes/pagos. Disponibilidad inicial refleja únicamente eventos y bloqueos registrados: los chefs deben cargar sus compromisos actuales antes de ofrecer fechas al público.
