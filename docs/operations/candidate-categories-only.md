# Categorías laborales únicas — EXTRA057

La aplicación usa únicamente categorías laborales. Se retiró el campo separado
de intereses de alta/mantenimiento asistido, textos de registro, preview de la
oferta y ficha empresarial. Autoservicio ya usaba categorías. CSV mantiene su
columna `categorias`, mapping y reglas restantes. La multiselección admite40
categorías para conservar la capacidad20+20 anterior.

## Instalación y conservación

Aplicar `20261024124316_candidate_categories_only.sql` después de las migraciones
anteriores, incluida `20261024033056_active_assisted_registration.sql`, antes de
desplegar el código nuevo. Verificar proyecto, respaldo e historial real; no usar
un push global para arreglar diferencias históricas de versiones.

La PK existente ya hace único cada par candidato/categoría. La migración:

1. Bloquea tablas durante la transacción y guarda el origen y ambos timestamps
   originales en `private.legacy_candidate_interests`.
2. Reclasifica las asociaciones en su misma fila a `occupation`, sin borrar o
   insertar relaciones, conservando IDs, created_at y updated_at.
3. Comprueba conservación y restringe kind a ese único valor operativo. No cambia
   estado, versión, consentimiento, CV, participaciones ni catálogo/inactivas.
4. Guarda definiciones anteriores de los tres comandos en
   `private.category_command_recovery`. Ambos respaldos tienen RLS, son append-only
   y no tienen grants de aplicación; no se exponen a candidato/empresa/admin UI.

No se crea una nueva correspondencia de catálogo. Las categorías efectivas y
las coincidencias OR permanecen iguales, con las mismas condiciones de aptitud,
orden, exclusión por participación y paginación. Un payload antiguo puede traer
`interests:[]` solamente como compatibilidad vacía; nunca se persiste ese campo.
Un array no vacío o confirmedFields obsoleto se rechazan sin pérdida silenciosa.

## Verificación

En una instancia ficticia, ejecutar `tests/fixtures/categories-before-migration.sql`,
la migración y `tests/fixtures/categories-after-migration.sql` en la misma sesión
psql (requiere pgTAP). Esta prueba no es para una base compartida: crea datos
ficticios, incluida una persona archivada, una categoría inactiva y un candidato
apto con la clasificación anterior; compara el matching real en tres páginas.
Completar tests SQL042/040/041/023/024/050, tipos/lint/unit/tooling/build y recorridos
por rol. Los fixtures nuevos usan exclusivamente categorías occupation.

## Recuperación

Preferir forward fix cuando ya hubo escrituras posteriores. Para reversión
inmediata, detener escrituras de aplicación y volver al código anterior primero.
Solo es automática cuando no hay perfiles/asociaciones creados o modificados
desde la captura, y las filas preservadas aún tienen sus timestamps originales.
Bloquear tablas, comprobar esas condiciones y abortar ante cualquier diferencia.
En esa transacción, volver el CHECK a `kind in ('occupation','interest')`, restaurar
kind='interest' únicamente en las filas identificadas por el respaldo, sin
insertar/borrar asociaciones; ejecutar las definiciones capturadas de los tres
comandos y recargar PostgREST. Mantener los dos respaldos privados e inmutables.

Si hubo una edición, alta, consentimiento o contratación posterior, no restaurar
en bloque: revisar cada relación y conservar las selecciones y eventos nuevos.
Nunca eliminar categorías nuevas ni reconstruir estados/consentimientos a partir
del respaldo. Los respaldos conservan historia, no autorizan revertir decisiones
de personas. No se cambia retención ni se ejecuta un reset del entorno compartido.
