# Preparación local y estado de avance

**Actualización:** MariaDB ya está operativa sin Docker y el panel usa sesiones y permisos; ver [11-base-de-datos-y-acceso.md](11-base-de-datos-y-acceso.md). Los pendientes de infraestructura de esta primera etapa quedan sustituidos por ese estado.

## Dirección acordada

El restaurante será el piloto de una base reutilizable. Alojamiento objetivo: Hostinger con Node.js administrado y MySQL/MariaDB. Compra pendiente; no hay servicios contratados ni backend desplegado. Se mantiene React/Vite y el alcance de tres semanas.

## Implementado en esta etapa

Actualización: existe primera versión del panel editorial local. Consultar [10-panel-local.md](10-panel-local.md) para el alcance exacto; la infraestructura de producción continúa pendiente.

- Estado único del evento compartido entre tarjetas y cotizador: ya no se remonta al elegir menú o experiencia.
- Cambios de menú conservan datos y retiran extras incompatibles con aviso.
- Borrador local limitado a selección de evento, fecha, zona, menú, invitados y extras; caduca después de siete días sin actualización. No persiste precios.
- Nombre, alergias y notas solo en memoria; desaparecen al recargar/cerrar. No hay recuperación entre dispositivos.
- Restauración valida IDs, cantidades, fechas y versión de catálogo; ignora contenido corrupto o caduco. Si cambia la estructura del catálogo, incrementar la versión del borrador.
- Navegador sin almacenamiento: el cotizador funciona en memoria e informa la limitación.
- `npm test` ejecuta regresiones de cálculo, validación y borrador.
- Git local inicializado, sin commit ni remoto todavía.
- `.gitignore` excluye dependencias, compilados, secretos, archivos subidos y respaldos.

## Siguientes entregas locales, en orden

1. **Backend y base local:** Node.js/TypeScript, migraciones MySQL/MariaDB, catálogo de demostración y endpoint de estimación. Confirmar runtime y versión DB compatibles con el hosting. No depender de servicios pagos.
2. **Acceso administrativo:** sesiones seguras mediante librería mantenida, invitaciones de personal, roles y recuperación; pruebas de permisos por endpoint. No improvisar criptografía.
3. **Catálogo administrable:** editar textos, fotos, paquetes y extras; borrador/vista previa/publicación con versiones. Media persistente fuera del directorio reemplazado en despliegues.
4. **Solicitud real:** recalcular en servidor, folio, snapshot, idempotencia y bandeja comercial. No tratar WhatsApp como almacenamiento de solicitudes.
5. **Filtro comercial:** criterios con razones y presupuesto aceptado; usar reglas demo explícitas hasta obtener las reales. No prometer disponibilidad ni cierre.
6. **Ensayo de entrega:** datos sintéticos, pruebas móvil/acceso, documentación y restauración en entorno de prueba.

Docker está disponible como comando en este equipo, pero no se ha confirmado que el motor esté iniciado ni se ha creado una base local. No declarar operativa la infraestructura por la sola presencia del ejecutable.

## Requiere hosting o decisiones externas

- Validar cupos de apps, Node.js, DB, almacenamiento persistente, cron y respaldos en el plan comprado.
- Dominio, DNS, HTTPS, correo autenticado, credenciales y prueba de despliegue/restauración.
- Precios, políticas, límites e información del negocio aprobados.
- Datos de producción, capacitación y lanzamiento aceptado por el cliente.

## Cómo verificar hoy

Dirección local del restaurante: `http://127.0.0.1:5180/`. Puerto fijo y exclusivo para evitar confundirlo con IntutecTest u otros proyectos en 5173. Si está ocupado, Vite avisa y no cambia de puerto automáticamente.

```powershell
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Prueba manual: seleccionar fecha futura e invitados, cambiar de menú desde una tarjeta, volver al cotizador, recargar y comprobar recuperación. Nombre/alergias/notas no deben recuperarse. Reiniciar y recargar debe mantener valores iniciales. La cotización sigue calculándose en navegador hasta la entrega del backend.

Verificación realizada: regresiones, TypeScript y compilación correctos. En navegador se comprobó que cambiar de menú conserva fecha y 12 invitados, que se recuperan al recargar y que reiniciar devuelve los valores iniciales. Aviso revisado en escritorio y ancho móvil de 390 px, con recorrido básico de teclado; sin errores ni advertencias registrados en esa sesión. La exclusión de datos personales, expiración y contenido corrupto se verificó con pruebas automatizadas. Esto no sustituye las pruebas integrales del futuro backend.

## Próximo ticket

P2-02A — API local de catálogo y estimación con validación estricta. Aceptación: IDs desconocidos rechazados, importes calculados exclusivamente por servidor y errores visibles; prueba de integración contra MySQL/MariaDB local. Mantener la demo utilizable hasta conectar la API.
