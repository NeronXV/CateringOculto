# Panel editorial local

**Actualización:** el modo activo ahora utiliza MariaDB y acceso administrativo. Las descripciones de archivo/sin autenticación de este documento corresponden al adaptador anterior `file`. Consultar [11-base-de-datos-y-acceso.md](11-base-de-datos-y-acceso.md) para el estado vigente. El alcance de los formularios sigue aplicando.

## Estado real

Primera versión funcional disponible en `http://127.0.0.1:5180/admin`, iniciando `npm run dev`. No requiere hosting ni servicios externos de pago. Conserva el diseño público aprobado.

Se pueden editar los elementos existentes:

- Portada: título, descripción, botón, fotografía por enlace y selección entre video existente/fotografía.
- Negocio: nombre, ubicación, contacto, redes, avisos de cotización y fiscales.
- Menús: nombres, descripciones, precios en MXN, mínimos/máximos, fotografía por enlace, tiempos y servicios incluidos.
- Extras: textos, precios y cantidades; modalidad de cobro visible y protegida.
- Zonas: textos, costo de traslado y necesidad de confirmación.
- Preguntas frecuentes y políticas.

Las páginas abiertas deben recargarse después de publicar. El máximo por menú valida el cotizador; grupos menores al mínimo conservan el aviso de revisión humana de la demo. Editar el aviso fiscal no cambia las operaciones del cálculo ni añade impuestos automáticos.

## Flujo de trabajo

1. Editar una o varias secciones; cambiar de sección conserva lo escrito.
2. Guardar borrador. Los visitantes locales siguen viendo la versión publicada.
3. Abrir Vista previa: muestra el borrador con una etiqueta y no lo publica.
4. Publicar y confirmar: el catálogo completo pasa a la página local.
5. Recuperar versión anterior: la copia anterior vuelve al borrador; requiere revisión y publicación explícita.

Los errores se muestran sin dar por guardado el contenido. Cada escritura exige la revisión actual: si otra pestaña guardó primero, se rechaza el cambio en lugar de sobrescribir. Antes de recargar tras ese conflicto, copiar manualmente el trabajo que se quiera conservar. El navegador avisa al salir con cambios sin guardar.

## Persistencia y decisión técnica (ADR-003)

Adaptador temporal de desarrollo en `server/localAdmin.ts`, integrado únicamente en el servidor de Vite. Guarda `.local-data/catalog.json` mediante archivo temporal y renombrado. Contiene borrador, publicación, una publicación anterior y número de revisión. El archivo está excluido de Git y debe respaldarse por separado; no contiene solicitudes ni datos de visitantes.

Esto permite probar los formularios mientras se implementa la infraestructura. No sustituye la arquitectura Node.js + MySQL/MariaDB. No hay migración ni base de datos operativa aún.

El adaptador acepta conexiones de loopback y Host `127.0.0.1:5180`; las escrituras exigen ese Origin y JSON, con límite de tamaño. Valida estructura, campos, importes enteros, identificadores protegidos y enlaces. Estas medidas no equivalen a autenticación: cualquier usuario local con acceso a este servidor puede administrar. No exponer con túneles, proxies ni en red pública.

En compilaciones de producción no se incluye el panel ni se consulta este adaptador: se usa el catálogo de código. **Los cambios del panel local no se incorporan automáticamente al build.** Antes del despliegue, reemplazar el adaptador por API autenticada y persistencia MySQL/MariaDB; migrar el catálogo guardado con validación. No copiar `.local-data` a `public`.

## Límites actuales

- Sin cuentas, contraseñas, roles, recuperación de acceso ni auditoría por usuario.
- Sin carga directa de imágenes; admite enlaces HTTPS y rutas públicas ya existentes. Galería, experiencias y filosofía aún conservan contenido en componentes.
- Edita elementos existentes; añadir/eliminar menús, extras, zonas o tiempos y cambiar compatibilidades requiere la próxima iteración.
- La web calcula en el navegador; no es todavía una cotización emitida por servidor.
- Sin solicitudes, folios, filtro comercial ni bandeja operativa.
- Una versión anterior recuperable; no historial ilimitado.
- Contenido demo: no publicar datos como reglas reales hasta aprobación del negocio.

## Verificación

`npm test`: regresiones previas más aislamiento del borrador, persistencia tras recrear repositorio, publicación, recuperación, conflicto de revisiones, importes/URLs/campos inválidos y archivo corrupto. TypeScript y build verifican compatibilidad.

Prueba manual realizada: editar título → guardar → comprobar publicado sin cambios → publicar → comprobar título en la web → recuperar original → vista previa → publicar original. El texto original queda restaurado.

Panel revisado en escritorio y a 390 px de ancho, con foco visible de teclado y sin errores de consola en la sesión. API local comprobada: rechaza escrituras sin Origin, desde Origin externo y catálogos inválidos, sin cambiar la revisión persistida. No hay pruebas de roles: esos accesos no existen todavía.

## Próxima entrega

Implementar acceso real, migraciones MySQL/MariaDB y API autenticada conservando el contrato editorial. Añadir carga de medios validada, ampliar los editores a las secciones restantes y conectar el cálculo de servidor antes de recibir solicitudes reales.
