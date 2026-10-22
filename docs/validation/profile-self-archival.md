# Retirar autoarchivo de candidatos y empresas — EXTRA039

## Alcance autorizado

Mateo solicita el 2026-10-22 eliminar archivar/eliminar cuenta en perfiles de
candidatos y empresas. Se retiran formularios de ambos perfiles y Mi cuenta,
sus Actions y estado/props exclusivos. El servicio común rechaza a candidatos
y empresas antes de llamar a la DB. No se borran cuentas, perfiles o historia.

Se mantienen edición, activación, disponibilidad, retiro de participaciones,
consentimiento, contraseña, logout y archivo/cancelación de ofertas propias.
Administración conserva archivo empresarial y restauración de registros
históricos con motivo/confirmación. El comando privado ya rechazaba archivar
candidatos por otro actor; no se agrega ese permiso ni una pantalla nueva para
sustituir el autoservicio eliminado. Las cuentas/perfiles archivados anteriormente
permanecen igual y se pueden restaurar según el flujo previo, sin revivir accesos.

No modifica políticas legales OQ-001/002 ni inventa un canal o proceso alternativo
de solicitud de eliminación. Los antecedentes de aclaraciones quedan como
históricos; FR-016/054 y contratos describen el nuevo alcance del portal.

## Migración y rollout

`20261022202940_admin_only_account_archival.sql` reemplaza solo el wrapper
`public.change_account_status(uuid,integer,text,text,boolean)`:

- Bloquea/verifica la sesión vigente como antes y exige cuenta activa/admin.
- Conserva firma y grants: authenticated puede invocar, pero la identidad se
  verifica dentro; anon/service_role no ejecutan. La función privada no se expone.
- Delega únicamente las operaciones administrativas ya permitidas al comando
  privado existente, manteniendo serialización, motivo, confirmación, versión,
  cambios relacionados y auditoría atómica.

No crea tablas, estados, triggers, nuevas variables o dependencias. No transforma
datos ni vuelve a aplicar SQL anterior. La migración se probó solo localmente;
**no se aplicó al proyecto compartido** en este incremento.

Aplicar SQL antes de publicar la app. Confirmar proyecto, definiciones previas y
backup del entorno; inspeccionar el historial y hacer dry-run:

```powershell
npx --no-install supabase migration list --linked
npx --no-install supabase db push --linked --dry-run --skip-vault
```

El proyecto tiene diferencias históricas de timestamps documentadas en EXTRA037.
Si el CLI se detiene por ellas, no reparar/revertir versiones en bloque ni repetir
migraciones viejas. Revisar el historial y aplicar solo el archivo nuevo completo
en una transacción controlada, registrando únicamente su propia versión/SQL una
vez verificada la ejecución. No marcar applied antes de ejecutar ni ejecutar
este DDL dos veces por intuición. No tocar Vault, seed, usuarios o permisos previos.

Verificación de catálogo sin datos personales:

```sql
select version,name from supabase_migrations.schema_migrations
where version='20261022202940';
select pg_get_functiondef('public.change_account_status(uuid,integer,text,text,boolean)'::regprocedure);
select has_function_privilege('anon','public.change_account_status(uuid,integer,text,text,boolean)','execute') as anon_execute,
 has_function_privilege('authenticated','private.change_account_status(uuid,integer,text,text,boolean)','execute') as private_execute;
```

Esperado: versión/nombre correctos, wrapper con comprobación admin y ambos
privilegios consultados false. No probar archivo sobre personas reales ni ejecutar
fixtures/pgTAP/E2E contra el proyecto alojado.

## Recuperación y seguridad

DDL transaccional; fallo previo al commit revierte el cambio. Tras aplicar,
corregir por otra migración forward-only, sin editar versiones aplicadas, borrar
auditoría, restaurar permisos o reactivar autoarchivo sin decisión explícita.
Revertir solamente la app dejaría visibles controles viejos, pero la DB debería
seguir rechazándolos; preferir mantener la UI actual y corregir el problema.

No se añade un lock de cuenta anterior al advisory lock del comando privado:
se conserva su orden de serialización. El wrapper valida sesión/rol y el privado
vuelve a comprobar actor/estado/versiones bajo sus locks existentes.

## Verificación del incremento

RED inicial: siete fallos UI/servidor de33 casos, y10 fallos SQL de12 contra el
permiso anterior. GREEN del rechazo SQL inicial12/12; ampliado para congelar el
rechazo de archivo administrativo candidato. Snapshot de cuentas, perfiles,
empresas, ofertas, participaciones, permisos, consentimientos, CV, sesiones y
auditoría demuestra cero cambios ante denegación.

Se conservan casos positivos de archivo/restauración empresarial y rollback ante
auditoría fallida. La restauración candidata prepara un archivo **histórico ficticio**
mediante el comando privado solo como propietario de DB de prueba, sin otorgar
EXECUTE a clientes ni simular un nuevo permiso público. El E2E mantiene bloqueo
de cuenta archivada y restauración a draft sin reabrir participaciones.

La matriz HTTP/servidor clasifica accountStatusAction y adminCompanyAction como
admin, con payload archive válido y confirmación/motivo; las Actions de autoarchivo
retiradas dejan de tener endpoint. Inventario de Form actualizado a38 tras retirar
los tres usos de autoarchivo (antes41); conserva el escaneo estricto de campos y
componentes compartidos, no se omiten errores para lograr verde.

Resultados finales y límites en implementation-status.md y EXTRA039. Sin nueva
aceptación municipal/legal, revisión humana, CI o cierre de gates históricos.
