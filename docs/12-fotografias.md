# Fotografías desde el panel

## Implementación local

Los campos de imagen de portada y menús permiten elegir un archivo del equipo, además de conservar la opción de enlace. Funciona en el modo MySQL autenticado; no se ha habilitado una ruta de carga sin acceso en el adaptador anterior de archivos.

Flujo: elegir foto → subir y optimizar → guardar borrador → vista previa → publicar. Subir no modifica por sí solo el catálogo. Si la portada sigue usando video, desactivar esa opción para mostrar la fotografía elegida.

La API acepta JPG, PNG y WebP sin animación, con un máximo de 8 MiB y 24 millones de píxeles. Decodifica y vuelve a generar WebP de hasta 2400 px por lado, sin ampliar imágenes pequeñas, corrigiendo orientación y sin conservar metadatos EXIF. No guarda el original. Los archivos no se ejecutan ni se sirven como HTML/SVG.

Solo propietario/editor activos pueden subir y consultar fotos aún no publicadas. Para visitantes sin sesión solo se sirven archivos referenciados por el catálogo publicado. La entrega usa tipo image/webp y nosniff. Un nombre aleatorio evita usar el nombre de archivo aportado por el cliente como ruta.

## Almacenamiento

Los archivos se guardan en `.local-data/media`, bloqueado al acceso directo de Vite y excluido de Git. La API entrega únicamente los archivos permitidos. No están dentro de `public` ni del build. Hay un límite provisional por instancia de 500 archivos / 250 MiB y una carga procesada simultáneamente; el límite es de protección local, no una condición comercial vendida.

No se borran imágenes al reemplazarlas, para conservar versiones anteriores. Las subidas abandonadas permanecen privadas. Falta una biblioteca con selección, inventario y limpieza segura de archivos no usados. No eliminar archivos manualmente sin revisar borrador, publicación y versión anterior. El respaldo debe incluir base de datos y carpeta de medios.

## Verificación

Las pruebas `test:auth` (SQL simulado) y `test:mysql` (base temporal real) verifican subida, rechazo de archivos inválidos/SVG, permisos de visitante/comercial/editor, privacidad del borrador y acceso público después de publicar. También verifican conversión real a WebP, reducción de ancho a 2400, ausencia de EXIF y rechazo del límite de bytes en almacenamiento.

Pasaron comprobación de tipos de servidor, regresiones y compilación. La prueba manual completa del selector en escritorio/móvil queda pendiente del primer inicio de sesión del propietario: no se creó ni se sustituyó su cuenta para probarlo. Las cuentas y archivos de pruebas automatizadas son temporales y aislados.

## Próximos pasos

- Completar galería, experiencias y filosofía administrables.
- Validar interacción visual del selector tras crear la cuenta.
- Integrar almacenamiento persistente y rutas de medios en el servidor de producción; el adaptador de Vite sigue siendo local.
- Definir respaldo/restauración y gestión de imágenes no utilizadas.

Referencia: [procesamiento de imágenes con Sharp](https://sharp.pixelplumbing.com/api-constructor/).
