# Usuarios: admin y editor

Solicitud del usuario del 4 de octubre de 2026: dos roles para el negocio del chef Carlos y la chef Karen. Release `20261004-roles`.

| Función | Admin | Editor |
|---|---|---|
| Editar contenido, fotos, menús, precios y reglas | Sí | Sí |
| Guardar, previsualizar, publicar y recuperar catálogo | Sí | Sí |
| Leer y atender solicitudes, asignar responsables y notas | Sí | Sí |
| Crear usuarios, cambiar roles, activar o desactivar accesos | Sí | No |

En `/admin`, un administrador encuentra **Usuarios y roles**. Crear una cuenta con nombre, correo, contraseña inicial de 12 a 128 caracteres y rol. No hay invitación por correo automática. Entregar la contraseña privadamente al titular. Para Carlos y Karen se pueden crear dos cuentas Admin si ambos deben gestionar accesos; la aplicación no asigna roles por nombre ni crea cuentas ficticias.

Los usuarios pueden desactivarse y reactivarse; no se eliminan registros con historial. Siempre debe quedar al menos un Admin activo. Una transacción serializa los cambios, vuelve a comprobar el permiso del actor y protege contra quitar al último Admin mediante operaciones simultáneas. El backend consulta rol y estado en cada petición, así que el cambio de permisos aplica a sesiones abiertas. La auditoría guarda actor, destinatario y cambio, sin contraseña ni hash.

Migración 004: convierte `owner` a `admin` y `sales` a `editor`; preserva IDs, correo, nombre, hash y estado de cuenta. El enum final solo admite admin/editor. Esta conversión amplía al antiguo comercial hacia todas las funciones del editor, conforme a la solicitud de tener únicamente dos roles. El comando de primera cuenta ahora crea Admin.

Pruebas: build Windows/Linux, SQL simulado y suite MariaDB real en base temporal. La suite acredita conservación de cuentas previas al migrar, editor sin gestión de cuentas, acceso a bandeja, publicación, cambios de permisos inmediatos, último admin y concurrencia. Interfaz de usuarios observada en 390 px sin desbordamiento horizontal; cambio de rol con Enter comprobado en fixture local en memoria. Ninguna cuenta real de Carlos/Karen se creó durante las pruebas.

Backup previo: `/srv/backups/catering-oculto/20261004-194103`, restauración SQL aislada comprobada y medios legibles. La versión anterior de aplicación espera los roles antiguos: no volver a su imagen sin un plan de compatibilidad de datos. Restaurar un backup puede perder cambios posteriores; no se realiza como rollback automático.
