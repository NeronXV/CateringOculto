# Reglas configurables y revisión comercial

Implementación local del 2026-09-18. Autorización: avanzar con datos de demostración mientras el cliente confirma sus reglas. No equivale a aprobación comercial.

## Matriz de configuración

| Dato | Dónde editar | Comportamiento actual |
|---|---|---|
| Precio y límites de invitados | Panel → Menús | Precio por persona; bajo mínimo requiere revisión sin mínimo facturable; sobre máximo se rechaza la selección |
| Extras | Panel → Servicios y extras | Importes en centavos, modalidades y compatibilidad existentes |
| Traslado | Panel → Zonas | Tarifa fija o pendiente; nunca presenta traslado pendiente como incluido |
| Anticipación por menú | Panel → Reglas de cotización | 1 día de preparación, **no aprobado**. Al aprobar, menos días agrega un motivo para revisión; no bloquea atención |
| Vigencia | Panel → Reglas de cotización | 7 días de preparación, **no aprobados**. Al aprobar, añade aviso informativo desde emisión; no automatiza vencimientos ni reservas |
| Cocina, acceso y montaje | Panel → Reglas de cotización | Texto pendiente. Solo se pregunta cumplimiento al visitante cuando se aprueba |
| Inversión | Cotizador | Encaja, requiere ajuste o pendiente; independiente del consentimiento para guardar |
| Restricciones alimentarias | Cotizador existente | Texto en contacto y señal de revisión humana; no garantiza seguridad |
| Impuestos | Pendiente del cliente | No se calcula IVA ni se declara incluido. Requiere definir tratamiento y, si aplica, añadir cálculo fiscal probado |

Los valores de 1 y 7 días no representan políticas del cliente. Anticipación, vigencia y requisitos tienen aprobaciones independientes, inicialmente desactivadas. La restricción técnica existente de fecha futura sigue vigente. Los días configurables aceptan enteros de 1 a 150.

## Publicar y usar

Abrir `/admin`, elegir Reglas de cotización, editar y guardar borrador. Publicar usa la confirmación existente y registra una versión del catálogo; el borrador solo no cambia el cálculo público. La vista previa muestra contenido del borrador, pero el motor de solicitudes sigue usando exclusivamente el catálogo publicado.

El cotizador pide si la inversión preliminar encaja y, si están aprobados, si el lugar cumple requisitos. Cambiar respuestas invalida el estimado visible y obliga a recalcular. El consentimiento posterior se refiere al importe revisado por servidor. Respuestas comerciales permanecen solo en memoria antes de guardar, sin localStorage.

El servidor devuelve:

- **Lista para revisión comercial:** no detecta aclaraciones del visitante en los criterios evaluados. Puede haber políticas pendientes del negocio.
- **Requiere aclaraciones:** inversión sin confirmar/por ajustar, invitados bajo mínimo, traslado pendiente, anticipación insuficiente aprobada, requisitos incumplidos/sin responder o restricciones alimentarias.

Las políticas pendientes se muestran separadas. Ningún resultado confirma disponibilidad, precio definitivo, reserva, venta ni probabilidad de cierre. Solicitudes con aclaraciones se pueden guardar para atención humana.

## Versiones y compatibilidad

`catalog.rules` se incorpora al leer catálogos antiguos, conservando los demás datos. No exige migración SQL. El motor `demo-v2` guarda reglas, respuestas y motivos en el snapshot. Publicar cambios de reglas modifica la versión aceptable; una solicitud nueva con versión anterior devuelve 409. Los snapshots anteriores siguen legibles y no se recalifican.

La bandeja muestra los motivos guardados; solicitudes anteriores al filtro indican esa limitación. La API acepta selecciones antiguas sin respuestas comerciales y las considera pendientes de inversión. En el nuevo contrato rechaza respuestas adulteradas y discrepancias entre la señal alimentaria y el contacto al guardar.

## Evidencia

- Regresiones de cálculo/editorial, tipos y build pasan.
- Pruebas del motor: aprobación/inactividad, límite exacto de anticipación, inversión, requisitos, restricciones, traslado, validación y snapshot independiente.
- MariaDB real aislada: publicación de reglas invalida la aceptación anterior y discrepancias alimentarias se rechazan; conserva pruebas de sesiones, solicitudes y bandeja.
- `node --import tsx tests/rules-ui.mjs`: interfaz con API simulada y motor real, Edge headless. Móvil 390 px sin desbordamiento, cálculo con Enter, cambio de respuestas invalida resultado, edición de reglas. Requiere Playwright instalado o `PLAYWRIGHT_MODULE`; capturas locales en `.local-data/qa/`.
- No se publicaron reglas de prueba ni se modificaron cuentas del usuario.

## Decisiones que aún necesitamos

Precios finales, mínimos comerciales (revisión, rechazo o mínimo facturable), impuestos, días de anticipación, vigencia, requisitos y condiciones. Cambiar valores de las reglas implementadas se hará desde el panel. Una política nueva, como mínimo facturable o cálculo fiscal, requiere implementación y pruebas antes de activarla; no basta con cambiar su texto.

El siguiente entregable independiente es el resumen imprimible desde el snapshot. Continúan pendientes producción, privacidad/retención, equipo y recuperación, respaldo/restauración y aceptación del cliente.
