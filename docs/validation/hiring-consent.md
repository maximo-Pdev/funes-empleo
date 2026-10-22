# Contratación y retiro global de consentimiento

## Alcance y decisión

Mateo confirma el 2026-10-21 el retiro **global**, no solo ocultar candidatos en
matching (OQ-020, EXTRA035, FR-036/038, T134–T138). Al confirmar administrativamente
`hire` o `late_hire`, una sola transacción:

1. Verifica actor activo, versión, transición y evidencia según el flujo vigente.
2. Registra `hired` solo en la participación elegida.
3. Si el último consentimiento es `accepted`, agrega `withdrawn` con fuente
   `hiring_workflow`, política/hash anteriores, fecha efectiva y administrador
   confirmante. La auditoría usa causa `hired` y una decisión interna enlazada al
   caso; no atribuye el retiro a una acción del candidato.
4. Marca el perfil `consent_withdrawn`, salvo si está archivado, y revoca todos
   sus permisos empresariales activos con auditoría, incluso los de otros casos.

Los estados, resultados, versiones e historial de las demás participaciones no
cambian. No hay borrado de consentimientos previos, duplicación de un retiro ya
vigente, ventana de acceso nueva ni restauración automática de consentimiento o
permisos. Una aceptación posterior exige el flujo afirmativo actual y tampoco
recupera permisos revocados. El retiro manual conserva su regla previa de cierre
de casos abiertos. El aviso de la empresa, sin confirmación municipal, no dispara
el retiro. Nuevas derivaciones requieren nuevamente consentimiento y las demás
condiciones vigentes.

Se bloquea primero el candidato y después el caso/permisos, serializando con
consentimiento y derivación. Fallar cualquier escritura, incluso auditoría final,
revierte todo. El servidor conserva un único RPC e invalida vistas tras su éxito;
la seguridad no depende de esa invalidación ni de la interfaz.

## Migraciones y despliegue

Aplicar en este orden, antes de publicar el código del servidor:

1. `20261021220623_hiring_consent_withdrawal.sql`: amplía la fuente del evento,
   restringe `hiring_workflow` a retiros y reemplaza `transition_participation`
   conservando firma y grants.
2. `20261021221414_consent_event_clock.sql`: cambia el default de `recorded_at`
   a `clock_timestamp()` para ordenar correctamente una aceptación afirmativa
   posterior, incluso en la misma transacción. No reescribe eventos anteriores.

No hay nuevas variables, dependencias, tablas públicas o permisos de cliente.
No se hace backfill de contrataciones anteriores: sus permisos históricos siguen
sujetos a la ventana anterior, Cron y revocaciones vigentes.

En un proyecto enlazado, confirmar primero proyecto/destino, copia de seguridad
y diferencias de historial, sin compartir credenciales. Estos comandos de
inspección se ejecutaron en el despliegue posterior autorizado (EXTRA037):

```powershell
npx --no-install supabase migration list --linked
npx --no-install supabase db push --linked --dry-run
```

El dry-run debe listar solo las migraciones esperadas y no aplicar nada. Si
aparecen versiones remotas sin archivo local, detenerse y reconciliar su origen;
no usar `migration repair --status reverted` en bloque ni marcar `applied` sin
haber ejecutado y verificado el SQL correspondiente. Con historial alineado,
backup disponible y SQL revisado:

```powershell
npx --no-install supabase db push --linked
npx --no-install supabase migration list --linked
```

Resultado esperado: ambas versiones aplicadas en local/remoto, sin errores.
Si se usa SQL Editor de forma controlada, ejecutar cada archivo completo una
sola vez, incluida su transacción; `Success. No rows returned` significa que el
DDL terminó, no que se probaron los casos de negocio. Verificar antes de registrar
su versión como aplicada. No volver a ejecutar el primer archivo sobre la misma
base: contiene un constraint nuevo. No cambiar archivos de migración aplicados.

Comprobaciones de solo lectura:

```sql
select version, name from supabase_migrations.schema_migrations
where version in ('20261021220623','20261021221414') order by version;
select conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid='public.candidate_consents'::regclass
and conname in ('candidate_consents_source_check','candidate_consents_hiring_source_check');
select column_default from information_schema.columns
where table_schema='public' and table_name='candidate_consents' and column_name='recorded_at';
```

El default esperado es `clock_timestamp()` y la fuente automática solo admite
`withdrawn`. Probar contratación normal/tardía con **datos ficticios en entorno
de prueba**, no ejecutar pgTAP/seed/E2E ni generar contrataciones sobre personas
reales para validar el despliegue.

### Aplicación alojada realizada — 2026-10-21, EXTRA037

Mateo solicita aplicar ambas migraciones. Proyecto confirmado por CLI:
Funes-empleo/kyjycjojzhwggjuqjnki. El dry-run se detuvo por diferencias históricas
de timestamps; no se reparó ni volvió a ejecutar esa historia. Se guardó copia
de las definiciones afectadas (no una exportación de datos de negocio) en
test-results/hiring-remote-before.json, ignorado por Git.

Se ejecutó únicamente el SQL de ambos archivos por CLI db query --linked,
en una transacción común con límites de espera y guardia de función previa,
registrando sus versiones/nombres/SQL originales dentro de esa misma transacción.
No se ejecutó db push, seeds, backfill ni pruebas de contratación sobre el entorno
alojado. La fuente histórica de diferencias de timestamps permanece pendiente
de reconciliación y no se oculta marcando versiones anteriores como revertidas.

Verificación de catálogo PASS: función igual al archivo, hashes del SQL registrado
iguales, versiones20261021220623/20261021221414 presentes, constraints/default
correctos, firma/grants/search_path conservados y hash de toda la historia previa
idéntico. Advisor remoto mantiene52 WARN anteriores, sin nuevos hallazgos; no se
declara resuelto ese backlog. Sin despliegue de aplicación, CI o revisión humana
nuevos. La regla ya rige futuras confirmaciones normales/tardías en esta base;
las contrataciones anteriores no cambian.

### Recuperación

Las migraciones son transaccionales: un error antes del commit no deja un cambio
parcial. Tras aplicarlas, cualquier corrección debe ser otra migración forward-only.
Ante un incidente, detener nuevas confirmaciones/derivaciones mientras se revisa
el fallo; no volver a la función previa que conserva accesos sin una decisión
explícita. Nunca borrar eventos, reaceptar automáticamente, reactivar permisos o
restaurar datos anteriores al retiro como supuesto rollback. Conservar evidencia
y copias previas según el procedimiento del entorno. No eliminar la fuente nueva
mientras haya eventos que la usen. Verificar retiro normal/tardío y rollback de
auditoría antes de reanudar.

## Evidencia local — 2026-10-21

- SQL nuevo: RED22/37 contra el RPC anterior; versión final55/55 PASS. Suite SQL
  completa en Supabase efímero aislado: **17 archivos,1062 pruebas PASS**.
- Los fallos iniciales de010/072 en la base local usada eran versiones/estados de
  fixture ya modificados, no se repararon ni resetearon esos datos. Se creó otra
  instancia `funes-empleo-hiring-check`, puertos553xx, con migraciones versionadas
  y fixture ficticio de aceptación. La base original permanece preservada.
  La instancia efímera fue detenida y sus volúmenes descartados al finalizar;
  solo se cerró el servidor de aplicación iniciado para estas pruebas.
- La instancia original contiene la versión histórica local20261017204435,
  ausente del checkout; bloqueó `migration up --local`. Se aplicó solo cada SQL
  nuevo al contenedor local confirmado y se registró solo su propia versión en
  la misma transacción. No se borró/reparó historia anterior. Esa discrepancia
  local no autoriza reparar el historial alojado.
- Las pruebas cubren roles negativos, normal/tardía, rechazo de evidencia/versión,
  actor/fecha/política/causa, append-only, revocación multicompañía y de permiso
  histórico, perfil/CV inaccesibles, otras participaciones idénticas, nueva
  aceptación sin restauración y fallos forzados de auditoría en distintos puntos
  con rollback integral (también tardío).
- E2E añade fixtures ficticios propios sin reset y comprueba navegador → servidor
  → RPC → permiso/CV, con otra conexión reteniendo el lock del candidato hasta
  verificar el bloqueo real de la contratación normal y tardía.
- Advisor de seguridad local aislado: sin hallazgos warn/error. No sustituye la
  revisión humana ni un control del proyecto alojado.

Resultados finales de tipos/lint/cobertura/tooling/build/navegador y límites en
`specs/001-municipal-employment-portal/implementation-status.md`. No acredita CI,
despliegue alojado, revisión independiente, aceptación global, NVDA ni cierre de
los gates históricos.
