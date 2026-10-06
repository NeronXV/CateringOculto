# Decisiones y supuestos

## Confirmado

- Cliente aprobó la dirección visual de la demo.
- Quiere administrar fotos, textos y menús.
- Quiere que el visitante configure presupuesto y pase un filtro antes de atención humana.
- Precio vendido: 15 mil. Plazo comunicado: tres semanas.

## Supuestos de planificación, todavía por confirmar

- Moneda MXN; un negocio, idioma español y cobro de hosting/servicios por separado.
- Premium inicial según el corte de `05-plan-de-ejecucion.md`; el cliente todavía no ha aceptado por escrito ese desglose.
- El catálogo final y políticas sustituyen las tarifas/contenido de demostración.
- Atención humana confirma disponibilidad. Sin agenda ni cobros automáticos en el primer lanzamiento.
- El negocio ofrece una persona que aprueba cambios y responde durante el proyecto.

## Resolver antes de implementar reglas

1. ¿Qué funciones exactas se prometieron al vender? ¿Los 15 mil incluyen impuestos, dominio, hosting o soporte?
2. ¿Cuándo empiezan y qué fecha exacta de entrega acordamos? ¿Hay anticipo?
3. ¿Cuáles son paquetes, precios, límites de invitados y opciones de platillos reales?
4. ¿Cómo operan mínimos: mínimo facturable, rechazo o revisión? ¿Anticipación por paquete?
5. ¿Qué traslados tienen precio fijo y cuáles requieren evaluación? ¿Impuestos incluidos o separados?
6. ¿Qué requisitos de cocina/logística son obligatorios? ¿Cómo revisan alergias?
7. ¿Cuánto dura un presupuesto y qué pasa si cambia el número de invitados?
8. ¿Quién administra contenido/precios y quién atiende solicitudes? ¿Qué plazo de respuesta pueden cumplir?
9. ¿Qué rango de inversión da viabilidad real al servicio? ¿Qué alternativas pueden ofrecer?
10. ¿Dominio, correo, fotos y derechos de uso disponibles? ¿Qué contacto público y redes son definitivos?
11. ¿Cuánto tiempo conservar solicitudes y quién valida condiciones/privacidad?

## Decisiones diferibles

Proveedor de pagos, anticipo y devolución; recursos/franjas de agenda; WhatsApp Business; CRM externo; chatbot; facturación; inglés. Ninguna bloquea el MVP si se acuerda explícitamente que queda fuera.

## Registro

Actualización 2026-10-01: el usuario define VPS Hostinger con Ubuntu, Docker y MariaDB. Se recibió `catering%20oculto.docx` con oferta, precios base y políticas; ver documento 17 para trazabilidad y ambigüedades. No se publicaron tarifas ni se asumió tasa de IVA, fórmula de traslado o equivalencia de un mes a 30 días. Docker local operativo verificado; esta actualización sustituye su limitación histórica.

Avance autorizado el 2026-09-18: configurar y probar reglas con datos de demostración, sin atribuir aprobación al cliente. Anticipación, vigencia y requisitos permanecen desactivados hasta confirmar cada política. Ver [16-reglas-y-filtro.md](16-reglas-y-filtro.md).

| Fecha | Decisión | Estado | Responsable |
|---|---|---|---|
| 2026-09-16 | Presupuesto 15 mil / entrega tres semanas | Informado por desarrollador | Desarrollador |
| 2026-09-16 | Mantener React/Vite + proponer Supabase | Sustituida por Node.js + MySQL/MariaDB para Hostinger, compra pendiente | Desarrollador |
| 2026-09-16 | Premium inicial sin pagos/bot/agenda automática | Pendiente de validar promesas comerciales | Desarrollador y cliente |
| 2026-09-16 | Preparación comercial no equivale a 90% de cierre | Criterio del plan | Producto |

Registrar respuestas aquí y actualizar las reglas/tickets afectados; una conversación nueva no debe dejar contratos contradictorios.

Actualización 2026-10-04: el usuario solicita exactamente dos roles, Admin y Editor.
Ambos administran contenido y solicitudes; solo Admin puede gestionar usuarios y roles.
Carlos y Karen son propietarios del negocio, pero sus correos y asignación individual
se configuran por el administrador sin cuentas automáticas. Ver documento 20.

Actualización 2026-10-04: Carlos y Karen trabajan juntos y normalmente atienden
un evento por día. El usuario autoriza implementar agenda compartida, apartados,
propuesta final y seguimiento privado. No se harán pagos en la página: el chef
cierra el acuerdo por WhatsApp y registra/verifica manualmente el anticipo.
Vencimiento del apartado elegido por el chef, sin duración comercial inventada.
Ver documento 21 para funcionamiento y límites de automatización.
