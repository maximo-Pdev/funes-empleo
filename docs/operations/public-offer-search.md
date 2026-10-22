# A07: búsqueda pública — despliegue y recuperación

## Dependencias y alcance

Base revisada: `43b94a7` y slugs de `20261018000000_opening_public_slugs.sql`.
Migración nueva: `supabase/migrations/20261019124218_public_offer_search.sql`.
Agrega vista de proyección privada sin permisos cliente y dos RPC de lectura;
`published_offers` conserva firma/defaults y proyección y delega en la búsqueda.
`published_offer_by_slug` y las identidades/slugs no cambian. No hay backfill,
tablas nuevas, cambios de estados, Auth, bucket, dependencias o variables.

## Aplicar antes de desplegar aplicación

1. Revisar el PR y migraciones pendientes del destino autorizado con su operador.
2. Aplicar la migración por el procedimiento aprobado del entorno, después de la
   migración de slugs. No pegar SQL contra un proyecto supuesto ni usar un reset.
3. Verificar RPC `search_published_offers` y `public_offer_filter_options`, sin
   otorgar SELECT de la vista privada ni de tablas a usuarios anónimos.
4. Desplegar app y comprobar listado sin filtros, los cuatro filtros combinados,
   paginación, limpiar, sin resultados y detalle por slug.

**Este incremento no aplicó la migración a Supabase alojado ni publicó Vercel.**
Un preview que use la base anterior carecerá de las RPC y no valida A07; aprobar
el build no significa que el entorno haya recibido la migración.

### Operación posterior informada por Mateo — 2026-10-19

Tras el PR #59, el operador ejecutó el SQL completo entre BEGIN/COMMIT en el
proyecto alojado; informó Success y ambas RPC devolvieron JSON de tipo object.
La captura de CLI confirma registro `20261019124218 => applied` y Mateo informó
funcionamiento local contra esa base. Es evidencia aportada por el operador,
no ejecución ni inspección remota del agente; tampoco acredita Vercel.
El listado remoto confirmó versiones iniciales generadas por MCP distintas
de los archivos locales. Esa divergencia histórica continúa sin reparar.

## Recuperación

Revertir aplicación conserva el SQL nuevo: la RPC anterior es compatible y las
columnas/datos siguen iguales. No borrar vista o RPC mientras la función anterior
dependa de ellas; una recuperación SQL debe ser una migración forward revisada.
Nunca borrar ofertas, regenerar slugs ni resetear una base compartida para esto.

La base local de Mateo conserva el registro de la migración descartada del PR
#54. El CLI puede denunciar `LegacyMigrationMissingLocalError`; no inventar un
archivo vacío ni marcarlo revertido sin revisar el estado. La instalación local
de las dos migraciones pendientes se hizo transaccionalmente, con precondiciones,
reemplazo solo de la RPC descartada en conflicto y registro aplicado posterior.
No se eliminó el residuo ni se modificó el SQL integrado de Máximo. Evidencia en
EXTRA-022; no extrapolar esta recuperación local a un entorno compartido.

## Verificación

Validación rechaza arrays, excesos, booleanos o páginas inválidas antes de buscar.
SQL usa parámetros y texto literal, no comodines ni SQL dinámico. Los filtros son
AND y se ejecutan antes de total/limit/offset. Catálogo y opciones no revelan
borradores, cerradas ni ofertas de empresas bloqueadas. No se implementa A08.

Pruebas SQL `022_public_offer_search.test.sql` usan rollback. Ejecutar SQL y E2E
secuencialmente: `072_audit_rollback_matrix` compara snapshots de Auth que los
logins del navegador modifican legítimamente. CI usa jobs/entornos separados y
su runner de aceptación solo restablece su fixture aislado. No usar ese reset en
una base local que se quiera conservar.

Node 24.22.0/npm 11.19.1 portable verificados por SHA-256; instalación global intacta.
