# Lecturas paginadas — EXTRA116

Alcance aprobado por Mateo, 01/11/2026: registros 10 por página; historiales y
notas 5 inicialmente, con navegación al resto. No cambia contratos de escritura.

- `RECORD_PAGE_SIZE = 10`, `HISTORY_PAGE_SIZE = 5` son defaults compartidos de
  presentación. Servicios existentes conservan su validación de máximos; las
  páginas de búsqueda administrativa fuerzan 10, independientemente de una URL
  que intente pasar `pageSize`.
- `getAdminCandidate(candidateId, notesPage = 1)` requiere administrador activo
  y candidato válido. `notesPage` debe ser entero 1..100000. Devuelve `notes`
  (máximo 5), `notesHasNext` y las mismas propiedades previas de candidato/CV/
  historial. Orden `created_at DESC, id DESC`; rango inclusivo de seis filas para
  determinar continuación sin otro conteo. El perfil usa `?notesPage=N#candidate-notes`.
- `participations` en esa respuesta es un resumen de 10, ordenado por fecha e ID;
  el enlace completo usa el listado administrativo existente filtrado por candidato.
- `getCourseReferralHistory(candidateId, page)` conserva DTO y autorización;
  ahora consulta 5 + 1, devuelve máximo 5 e indica `hasNext`.
- `listNotifications(page, size)` usa 10 por defecto, manteniendo el parámetro
  y RPC previos. La campana continúa solicitando explícitamente 5.
- `readAllRows` recorre rangos inclusivos de 200 en consultas de tablas autorizadas
  y ordenadas de forma única. Ante error devuelve error y ningún parcial exitoso.
  No cambia el conjunto de filas admitido por los filtros, guards o RLS.
- `BoundedList` recibe contenido autorizado completo, no credenciales ni consultas.
  `more` revela bloques de 5; `pages` presenta páginas de 10. Puede revelar un hijo
  por ID hash o iniciar en `initialIndex`. No agrega destinos ni resuelve permisos.

Las respuestas completas de RPC continúan completas. Totales, exportaciones,
matching y selección de evidencia conservan el universo previo. No hay funciones
SQL, grants, tablas, migraciones o variables nuevas. Recuperación por revert de
aplicación, sin borrar registros. Ver inventario y evidencia en
`docs/implementation/collection-pagination-audit.md` y EXTRA116.
