# Base de datos y acceso administrativo local

Actualización: la carga de fotografías de portada/menús ya está implementada; ver [12-fotografias.md](12-fotografias.md). Sigue pendiente la integración de medios en producción.

## Implementado y probado

- MariaDB en `127.0.0.1:3307`, instancia exclusiva del restaurante.
- Tablas de contenido editorial, usuarios, sesiones, auditoría y migraciones.
- Importación del catálogo original, conservando `.local-data/catalog.json` sin modificar. Repetir la migración no reemplaza datos existentes en MariaDB.
- Acceso con correo/contraseña, hash Argon2id, sesiones del lado servidor, cookies HttpOnly/SameSite Strict y expiración máxima de ocho horas.
- Renovación del identificador de sesión al entrar; cierre que invalida la sesión del servidor.
- Primera cuenta de propietario creada manualmente desde `/admin`; el registro inicial se cierra al existir una cuenta. Un bloqueo de base de datos evita dos registros iniciales concurrentes.
- Permisos en API: propietario/editor administran contenido; comercial no puede leer borradores ni publicar. Solo propietario consulta/crea cuentas mediante la API. El formulario de gestión de equipo aún está pendiente.
- Publicación con transacción, control de revisión y auditoría de actor/acción. No se acepta la función del usuario enviada desde el navegador: se consulta su cuenta activa en cada solicitud.
- Límite de intentos de acceso e inspección de origen para escrituras.
- Ninguna contraseña administrativa predeterminada. El usuario debe crear la primera cuenta y conservar su contraseña.

## MariaDB sin Docker (ADR-004)

Docker no inicia en este equipo. Se reutilizan los ejecutables existentes de `C:/xampp/mysql`, que reportan MariaDB 10.4.32. Se crea una instancia separada con datos en `.local-data/mariadb`, puerto 3307 y escucha exclusivamente local. No se modifica la carpeta `C:/xampp/mysql/data`, sus servicios, ni sus credenciales.

Esta versión es un entorno de desarrollo heredado, no la versión recomendada para producción. Antes del despliegue hay que repetir integración/restauración en la versión soportada elegida para el hosting. La alternativa de Docker con MariaDB 11.4 queda disponible en `compose.yaml`; no utilizar simultáneamente ambos motores en 3307. Los directorios de datos no son intercambiables entre versiones: migrar mediante exportación/importación validada.

Los secretos generados están en `.env.local`, excluido de Git y del acceso web. No mostrar su contenido en registros ni copiarlo a `VITE_*`. El servidor de desarrollo también bloquea descargas de `.local-data`.

## Arranque cotidiano

Desde la carpeta del proyecto:

```powershell
npm run db:native
npm run dev
```

La base inicia en segundo plano sin ventana. No se instala un servicio ni se configura autoarranque de Windows. Para detener solo esta instancia: `npm run db:native:stop`.

En una instalación nueva, ejecutar primero `npm run local:prepare`, luego iniciar MariaDB y `npm run db:migrate`. Cambiar `EDITOR_STORAGE` a `mysql` en `.env.local` solo tras verificar conexión y migración; el modo `file` queda como adaptador anterior sin autenticación, no como recuperación automática. Nunca volver a `file` para eludir un error de acceso o de conexión.

El modo activo de este equipo es **mysql**. La migración ya se ejecutó; no hay usuarios reales creados al finalizar el desarrollo. El propietario se registra directamente en `http://127.0.0.1:5180/admin` y luego inicia sesión. La contraseña debe tener entre 12 y 128 caracteres. No existe aún recuperación por correo.

## Pruebas realizadas

- `npm test`: cálculo, validación de cotizador, borrador local y editor de archivos.
- `npm run test:auth`: contrato HTTP con adaptador SQL simulado (no prueba del motor).
- `npm run test:mysql`: repite autenticación y permisos contra MariaDB real, además de publicación concurrente, recuperación y auditoría. Crea una base con nombre aleatorio `restauran_test_*` y elimina solo esa base al terminar. No crea cuentas de prueba en `restauran`.
- `npm run typecheck:server`: comprobación de tipos del backend.
- `npm run build`: compilación de la aplicación.

Se verificaron accesos anónimos rechazados, credenciales incorrectas, hashes, cookies, permisos de comercial/editor, cuenta desactivada, expiración, cierre de sesión, origen externo y límite de intentos. La importación real del catálogo y la pantalla inicial fueron comprobadas.

## Pendiente antes de publicar

Esta API aún vive en el adaptador de Vite de desarrollo y sus restricciones corresponden a localhost. El build estático sigue sin incluir el panel ni consultar MariaDB. Falta separar el servidor de producción, configurar HTTPS/cookies Secure y origen real, revisar permisos de infraestructura y permitir despliegues reproducibles.

También faltan interfaz de administración de equipo, cambio/recuperación de contraseña, desactivación desde panel, correo, prueba de respaldo/restauración, política de retención de sesiones/auditoría, carga de medios y cálculo de presupuestos en servidor. La limitación de intentos es en memoria del proceso; deberá revisarse para producción y múltiples procesos.

La base se respalda por exportación consistente, no copiando archivos de un motor encendido. No ejecutar limpiezas de volúmenes o de `.local-data` como solución a errores.

## Referencias técnicas

- [Sesiones Express](https://expressjs.com/en/resources/middleware/session/).
- [MariaDB en Windows sin servicio](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/installing-mariadb/binary-packages/installing-mariadb-windows-zip-packages).
- [MySQL2](https://github.com/sidorares/node-mysql2).
# Arranque sencillo y recuperación del acceso

Actualización 2026-09-18: desde la carpeta del proyecto ejecuta `npm run local:start`. Inicia MariaDB aislada, aplica las migraciones pendientes y arranca Vite; si el servidor del restaurante ya está activo, comprueba el acceso y lo reutiliza. Mantén abierta la terminal si acaba de iniciar Vite.

Sitio: `http://127.0.0.1:5180/`. Administración: `http://127.0.0.1:5180/admin`.

Si la página abre pero el panel muestra un fallo de conexión, eso no implica una contraseña incorrecta. Ejecuta el comando anterior y pulsa **Reintentar conexión** o recarga. El formulario de correo y contraseña aparece cuando el servicio responde. No recrear cuentas ni cambiar al adaptador de archivos para resolver esta incidencia.

Verificado: se reprodujo un 503 tanto en acceso como en catálogo; tras iniciar MariaDB, ambos devolvieron 200 y la cuenta existente se conservó. Arranque unificado probado con Vite ya activo; compilación y tipos correctos.
