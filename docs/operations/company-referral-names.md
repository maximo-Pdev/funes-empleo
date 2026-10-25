# Nombre mínimo en derivaciones — EXTRA069

Solicitud y decisión expresa de Mateo,2026-10-25. La empresa identifica a las
personas ya derivadas por nombre aunque termine su permiso de perfil. Cuenta y
empresa activas; oferta, participación y derivación propias no archivadas.
Se conservan el resto de bloqueos: perfil, contactos, foto y CV revocados no se
recuperan. Las condiciones para informar o confirmar resultados no cambian.

## Migración y orden

Aplicar `supabase/migrations/20261025135805_company_referral_names.sql` en el
entorno correcto antes de desplegar esta aplicación. Añade un RPC de lista
`company_referral_summaries(uuid)` y reemplaza `company_referral(uuid)` añadiendo
`candidateName`; conserva el contrato previo de referencias y `hiredCandidate`.
No crea tablas, campos persistidos, snapshots, backfills o escrituras de negocio.
Nombres actuales, sin consultar cada detalle individualmente para armar la lista.
Summaries es VOLATILE porque el guard de sesión toma FOR SHARE; de ese modo
PostgREST permite el bloqueo. No realiza escrituras de negocio ni omite el guard.

Requiere las funciones existentes de proyección/actor del MVP. No aplicar de nuevo
migraciones históricas enteras para obtener una función. La definición de detalle
preserva la excepción de contratación de EXTRA062; su migración de gestión de
ofertas sigue teniendo un propósito separado. Las versiones remotas históricas
pueden diferir de los nombres locales: revisar historial antes de push, sin
reparaciones masivas ni resets. No incluir claves o datos personales en diagnósticos.

Resultado de SQL editor: «Success. No rows returned» indica ejecución sin filas,
no acredita por sí solo pruebas de permisos. Si se ejecuta SQL manual, registrar
como aplicada únicamente esta versión después de verificar que todos sus objetos
existen y que la transacción terminó; no registrar versiones que no se ejecutaron.

## Verificación

1. Con propia empresa activa, lista y detalle dan el mismo nombre con permiso
   vigente y revocado, incluidos cierre, retiro, no respuesta y contratación.
2. Tras revocación no aparecen perfil/contactos/foto/CV ni se conceden permisos.
   La descarga de un documento puede tener otro permiso válido independiente;
   cuando no queda ninguno, el endpoint y Storage deben denegarla.
3. Empresa ajena/inactiva, sesión revocada y registros archivados no reciben nombres.
4. Una consulta no cambia perfiles/casos/consentimientos/permisos/auditoría.
   El informe tardío permitido sigue pendiente municipal y no restaura accesos.
5. SQL044, regresiones010/024 y pruebas TS/E2E acompañan este cambio.

## Recuperación

Revertir primero la aplicación para que use `company_referral_references`.
Restaurar únicamente la definición anterior de `company_referral(uuid)` respaldada
en ese entorno antes de aplicar. Si allí ya estaba EXTRA062, corresponde a
`20261024184354_company_offer_management.sql`. Mantener revoke/grant a
authenticated y reload schema, dentro de una transacción revisada. Después,
retirar `company_referral_summaries(uuid)` cuando no tenga consumidores.
No ejecutar entera la migración anterior ni borrar perfiles, nombres, informes,
referencias o historial. La recuperación no restaura permisos/consentimientos.

## Estado

Migración aplicada/verificada solo en fixture local aislado funes-admin-cv-check:
1275 SQL/24 archivos,1195 unit/componentes,57 tooling y17 E2E finales PASS;
tipos/lint/build, advisor local y1440/390px/teclado/axe PASS. Diagnóstico STABLE/
FOR SHARE corregido antes de la corrida completa final.

Por solicitud posterior de Mateo, aplicada2026-10-25 al proyecto vinculado
`kyjycjojzhwggjuqjnki` y registrada como20261025135805/company_referral_names.
Cuerpos verificados contra archivo, permisos/volatilidad/guard de sesión
comprobados, helpers de perfil/CV y contrato anterior sin cambios. Solo esta
migración, sin reset/backfill ni aplicación de versiones previas pendientes.
Respaldo exacto de definición/ACL en test-results/referral-names-remote-backup.json
(ignorado); ese entorno aún tenía la proyección original anterior a062.

Advisor alojado:56 WARN antes/57 después, cero ERROR. Único nuevo es el
[aviso0029 del RPC autenticado SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
intencional y revisado con guard de sesión/propiedad y permisos restringidos.
Publicación del código, revisión humana y despliegue de interfaz quedan pendientes. La excepción no
aprueba política municipal, uso de datos reales o plazos de retención (OQ001/002).
