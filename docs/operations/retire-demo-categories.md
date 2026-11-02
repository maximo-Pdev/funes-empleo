# Retiro de categorías ficticias A/B — EXTRA119

Mateo eligió quitar las asignaciones sin reemplazo y conservar respaldo histórico.
La migración `20261101120000_retire_demo_job_categories.sql` desactiva únicamente
DEMO-A/DEMO-B versión1 y retira sus relaciones vigentes con candidatos/ofertas.
No elimina los registros del catálogo: sus IDs y nombres históricos permanecen.

Antes de retirar cada relación, guarda la fila completa original en
`private.demo_category_retirement_backup`, junto con fecha, rol SQL ejecutor,
motivo y versión de migración. RLS sin políticas/grants de aplicación y trigger
append-only impiden leer/modificar ese respaldo desde anon/authenticated/service_role.
Los snapshots contienen catálogo/relaciones por ID y fechas, sin copiar los datos
personales de perfiles, contactos, CV o notas. No hay endpoint para el respaldo.

Los registros que solo tenían A/B quedan sin categorías: el usuario deberá elegir
categorías vigentes cuando corresponda. La limpieza no inventa equivalencias ni
modifica estados, versiones, disponibilidad, consentimientos, ofertas, casos,
accesos, resultados o auditoría previa. Los quince rubros reales se conservan.
No se modifica la lógica de matching; dejan de existir esas relaciones operativas.

## Aplicación

Verificar proyecto/versión e inspeccionar `db push --dry-run --linked` antes de
aplicar. Debe proponer únicamente esta migración. Si existe divergencia histórica,
no reparar otras versiones: ejecutar solo el SQL revisado mediante la conexión
administrativa vinculada y registrar esta versión con `migration repair --status
applied`, después de verificar resultado y respaldo. No incluir seeds ni roles.

El SQL incluye transacción y límites de espera: bloqueo breve de cuentas espera
los guards FOR SHARE de comandos ya iniciados; luego se bloquean categorías y
relaciones. Las lecturas ordinarias siguen disponibles. Nombres inesperados,
respaldo contradictorio, timeout o cualquier error revierten toda la operación.
Volver a ejecutar no sobrescribe snapshots; una asociación recreada con datos
distintos aborta en vez de perder su nueva información.

Verificar que no queden filas activas ni relaciones vigentes para esos dos códigos
v1; comparar conteos de snapshots con los originales. No exportar contenido del
respaldo, identificadores de personas o credenciales a logs de revisión.
`verify-demo-categories.sql` consulta únicamente estos conteos/metadatos, permisos,
filtros públicos y versión registrada; no devuelve snapshots o identidades.

Los seeds sintéticos de aceptación conservan A/B intencionalmente para sus pruebas
deterministas. La migración se ejecuta antes del seed en una base de prueba nueva;
no convierte esa fixture en catálogo operativo. Nunca ejecutar seeds o reset sobre
las bases operativas para aplicar este cambio.

## Recuperación

`recover-demo-categories.sql` es una operación administrativa explícita, no una
migración de avance ni algo que deba ejecutarse al desplegar. Primero revisar que
se desea recuperar exactamente esas categorías y asociaciones, y que los registros
padre siguen existiendo. El script aborta ante cambios posteriores del catálogo o
de relaciones con la misma clave; no los sobreescribe. Restaura los metadatos
modificados del catálogo y las relaciones originales, con transacción/locks. No
cambia perfiles/estados/consentimientos ni borra el respaldo. Si hay conflicto,
resolverlo mediante una nueva operación revisada; no desactivar los controles.

Evidencia de pruebas/aplicación y diferencias local/alojado: EXTRA119 y
`specs/001-municipal-employment-portal/implementation-status.md`.
