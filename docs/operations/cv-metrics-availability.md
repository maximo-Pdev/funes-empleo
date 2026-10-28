# CV, métricas y disponibilidad — EXTRA094

## Comportamiento

Los enlaces de CV de candidato, administración, empresa y preview abren otra
pestaña. El proxy conserva autorización por solicitud y entrega PDF inline,
no-store/nosniff; nunca entrega Storage URL o un enlace firmado reutilizable.
Un navegador sin visor PDF o configurado para descargar puede elegir descargarlo.

Métricas muestra seis indicadores y gráficos de resultados/contrataciones por
categoría. Ver detalle conserva todos los indicadores y tiempos; Más información
conserva definiciones. PDF, Excel y CSV mantienen el resumen completo filtrado,
su auditoría y permisos. Las categorías solapadas no se suman. Sin librerías nuevas.

Un consentimiento aceptado se conserva y no vuelve a mostrar aceptación. Si falta
o fue retirado, se requiere acción afirmativa. La política de demo y los eventos
históricos no se reescriben; esto no aprueba tratamiento de datos reales.

Al contratar normal o tardíamente se fija disponibilidad No disponible; solo un
estado de perfil active pasa a unavailable, sin reactivar estados restringidos.
Se audita actor/fecha/causa y se conserva consentimiento/otros casos/permisos.
No disponible impide nuevas nominaciones/derivaciones por las guardas existentes.
Volver a estar disponible y activar sigue el flujo vigente, no ocurre por corregir
resultados. Un permiso de empresa contratante todavía activo y autorizado vence
a720h exactas desde la confirmación; autorización lo deniega aun antes de Cron.
Tardío/revocado no recibe acceso nuevo. Retiro manual conserva revocación global
y cierre de participaciones abiertas, sin cambiar finales.

## Migración y recuperación

`supabase/migrations/20261028104205_hiring_candidate_availability.sql` reemplaza
únicamente la función transaccional existente, con misma firma/ACL/sesión/locks.
No modifica filas de negocio previas, esquema de tablas, RLS, política o variables.
Debe aplicarse antes de publicar la interfaz nueva para alinear texto/comportamiento.
Aplicada en el Supabase compartido2026-10-28 por solicitud posterior de Mateo.
Se verificaron cuerpo/SQL exactos, firma/ACL/search_path/RLS y registro20261028104205;
recuentos de negocio sin cambios, sin backfill. Advisor60 avisos previos sin nuevos
ni ERROR. La publicación de interfaz se realiza mediante PR por separado.

El dry-run general conserva divergencias históricas de identidad; se aplicó solo
el archivo revisado mediante CLI vinculado, con guard de baseline y registro exacto
en la misma transacción. Copia previa/recibos en test-results ignorado. No hubo
repair/revert, otras migraciones, cambios de Vault o escritura de datos de negocio.

En el entorno adecuado, revisar migration list/db push --dry-run antes de aplicar
una única migración pendiente. Este proyecto tiene antecedentes de identidades
locales/remotas distintas: no reparar historial o ejecutar reset sobre la base
compartida para sortear divergencias. Comparar versiones/nombres/cuerpos primero.
No marcar applied sin evidencia de ejecución real.

Recuperación forward-only tras diagnóstico: preservar eventos/permisos revocados,
no aceptar consentimiento en nombre de una persona ni restaurar acceso por SQL.
Rollback de UI requiere volver al texto compatible con el backend realmente
instalado. No ejecutar la antigua migración de retiro global como rollback de datos.

## Evidencia

La evidencia final y limitaciones se registran en cambios-extra.md EXTRA094 y
specs/001-municipal-employment-portal/implementation-status.md. No se atribuye
revisión humana, CI, PR o despliegue hasta que existan.
