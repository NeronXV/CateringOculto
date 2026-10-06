# Galería, experiencias y filosofía administrables

En `/admin`, la sección **Galería y experiencias** contiene tres grupos:

- Galería: título, descripción, aviso, cuatro imágenes, títulos y categorías.
- Experiencias: título, introducción, tres propuestas con descripción, capacidad sugerida, foto, texto alternativo y nota.
- Filosofía: título, narrativa, dos fotografías, tres principios, biografía y nota del equipo.

Todos usan el flujo existente de guardar borrador, vista previa y publicación. Las fotografías permiten carga directa con los mismos controles de acceso. Los identificadores que conectan las experiencias con el cotizador y la composición visual de la galería están protegidos.

El contenido inicial se extrajo de los componentes existentes, conservando textos, imágenes, clases y composición. La narrativa y biografía ahora son texto plano (sin marcado HTML). Los textos de capacidad son editoriales; no modifican por sí mismos las reglas del cotizador.

## Compatibilidad de los datos

`upgradeStoredCatalog` añade las secciones únicamente cuando faltan en un catálogo antiguo leído del almacenamiento. Conserva el resto de los valores. Un grupo presente pero inválido se rechaza; no se reemplaza silenciosamente. Se aplica también a la versión anterior recuperable. Las escrituras exigen el catálogo completo y guardan la ampliación al guardar/publicar normalmente. No se modificaron directamente los registros reales ni se publicó contenido de prueba.

## Verificación y límites

Regresiones comprueban conservación de valores antiguos, no modificación del objeto original, rechazo de secciones inválidas e identificadores protegidos. Las pruebas con MariaDB temporal comprueban publicación de biografía y acceso público de una foto de galería solo después de publicar. Compilación y tipos del servidor verificados.

La revisión manual de los nuevos formularios con cuenta del propietario queda pendiente. Se editan los elementos existentes; agregar/eliminar/reordenar elementos todavía no forma parte de esta entrega. El despliegue de producción y el cálculo de presupuestos en servidor continúan pendientes.
