# Entrega funcional: catálogo y cotizaciones

Actualizado el 4 de octubre de 2026. Sitio: https://cateringoculto.bajastack.network.
Panel: https://cateringoculto.bajastack.network/admin.
Release final: `20261004-date`.

## Funciones entregadas

- Catálogo del documento del cliente: desayunos, lunch, cenas de dos y tres tiempos; opciones de platillos y variantes de chilaquiles.
- Panel autenticado: textos, fotos, galería, menús, opciones, extras compatibles, zonas, preguntas, precios y reglas. Añadir, retirar y ordenar elementos; guardar borrador, previsualizar y publicar.
- Cotizador con cálculo autoritativo en Node/MariaDB, importes en centavos, impuestos configurables y traslado por zona o bloques cuando el negocio confirme la regla.
- Solicitudes con folio, consentimiento, bandeja y seguimiento; snapshots conservan precios y platillos originales aunque se edite el catálogo. Protección frente a reenvíos y versiones desactualizadas.
- Resumen imprimible y enlaces con texto preparado para WhatsApp y correo. Contactos de prueba proporcionados por el usuario configurados. El visitante confirma el envío en su aplicación; no hay SMTP ni envío automático de WhatsApp.

## Acceso del propietario

La primera cuenta sigue pendiente, por instrucción del proyecto la crea el usuario. Ejecutar desde PowerShell:

```powershell
& 'C:\Users\GAMER\proyectoswebs\Restauran\scripts\create-vps-owner.ps1'
```

El script solicita nombre, correo y contraseña privada y los transmite por SSH; no escribir la contraseña en este chat. Después entrar a `/admin`.

## Decisiones comerciales pendientes

No se inventaron aclaraciones del chef. Desayuno $950 y lunch $1,100 por persona antes de IVA. Cenas $1,300/$1,450 del documento conservadas como referencia textual: la unidad está pendiente, por eso no se suman al cálculo. IVA y traslado pendientes y señalados como no incluidos. La regla de $5,000 por cada 20 personas está preparada pero no activada. Selecciones ambiguas son preferencias sujetas a confirmación. La solicitud no reserva.

Las fotografías continúan siendo ilustrativas. Antes de promoción comercial completar fotografías propias, biografía, redes, aviso de privacidad y aprobación de condiciones. No se configuraron pagos, agenda automática ni bot.

## Evidencia

Build Windows y Linux correcto; regresiones, catálogo editorial, motor y autenticación simulada aprobados durante implementación. Suite de MariaDB real aislada aprobada: sesiones, permisos, publicación, consentimiento, folios, bandeja, idempotencia y snapshots después de editar opciones. Pruebas premium cubren impuestos sintéticos, redondeo y bloques 19/20/21.

Revisión móvil de 390 px sin desbordamiento horizontal; panel y controles observados. Se corrigió captura de fecha con evento input y se verificó avance al menú, variantes condicionales y navegación con Enter en fixture local. La fixture usa memoria y no acredita persistencia SQL; esta se verificó con la suite real por separado. No existe suite E2E completa.

Comprobación HTTPS de producción: readiness, catálogo, contactos, cálculo de 8 desayunos = $7,600 base, variantes y conceptos pendientes; rutas privadas 401 y Vivero sano. No se enviaron mensajes reales ni se insertaron solicitudes de prueba en producción.

## Operación y recuperación

Backup previo `/srv/backups/catering-oculto/20261004-065002` con restauración SQL aislada y hash de catálogo comprobado; medios legibles. Se conservan releases anteriores y volúmenes de producción. El catálogo anterior también se conserva como versión previa. No hay copia externa ni calendario automático de respaldos configurados.

El importador inicial rechaza catálogos con ediciones o cuentas existentes. Después del primer ingreso, trabajar mediante el panel. Para regresar de versión de código, usar release compatible y actualizar `current` y el tag en `ops/cateringctl.sh`; el rollback de imagen no revierte datos.
