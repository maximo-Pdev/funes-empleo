# Manual de operación ficticia: local, preview y demo

Alcance T090, actualizado para PC1/EXTRA-017. **Default interactivo: 10 cuentas;
aceptación: fixture TEST-ONLY local/CI de 4 admins y 500/50/100/1000.** Nunca cargar
el fixture de aceptación en el demo alojado. Reset alojado bloqueado; credenciales
individuales existentes, sin variables compartidas por rol ni rotación en scripts.
No autoriza producción municipal ni uso de datos reales.

## Despliegue — evidencia histórica 2026-09-28/29

- URL: https://funes-empleo-demo.vercel.app (preview protegido por Vercel).
- Supabase: `Funes-empleo`, ref `kyjycjojzhwggjuqjnki`, organización
  `maximo-Pdev's Org`, región `sa-east-1`.
- Vercel: proyecto `funes-empleo`, equipo `pantherium-8487s-projects`, región `gru1`.
- Preview verificado entonces: `dpl_Bj7YxDaYcCydVayNAh4GW9kQnHNC`, desde la rama
  `codex/temp-mvp-completion`; se creó con cambios entonces sin commit. Su ID
  identifica el build, pero no acredita un SHA limpio ni corresponde a main.
- Variables configuradas exclusivamente para Preview: `APP_ENV=demo`,
  `CONSENT_POLICY_VERSION=demo-not-approved`, URL canónica anterior, URL Supabase
  y clave publicable. No se configuró un cliente secreto en Vercel.
- Fixture cargado: 500 candidatos, 50 empresas, 100 ofertas, 1.000 participaciones,
  554 cuentas (cuatro administradores) y 500 PDF ficticios del manifiesto.
- Smoke alojado: cuatro roles con navegación/aislamiento/CV; Storage: seis actores
  con descarga autorizada o denegada, sin firma ni listado. Ver scripts
  `tests/quality/demo-smoke.mjs` y `demo-storage.mjs`.
- Cron `municipal-employment-daily` activo a `0 3 * * *`. El fixture puede cambiar
  por acciones o automatizaciones: estos conteos no sustituyen un reset por medición.

Las migraciones iniciales se aplicaron por MCP usando el nombre original del archivo;
Supabase asignó versiones remotas distintas de los prefijos locales. La carga ficticia
consta como `demo_fictitious_fixture_v1`; la corrección de Storage como
`authenticated_cv_info`. No ejecutar `db push` ni reparar historial automáticamente:
comparar primero nombres y contenido de ambas historias. El repositorio conserva las
migraciones fuente; EXTRA-006 documenta recuperación mediante migración posterior.

El preview exige acceso de Vercel. Los evaluadores deben recibir acceso desde el
despliegue; no compartir la cuenta propietaria ni publicar cookies de bypass.
Site URL y redirecciones de Auth configuradas y verificadas en el panel:
`https://funes-empleo-demo.vercel.app`, `/auth/callback` y
`/auth/callback?next=/update-password` sobre ese dominio exacto, sin wildcard.
SMTP personalizado está desactivado; el servicio integrado solo admite destinatarios
miembros del equipo y tiene límites bajos. El propietario aportó un buzón controlado
para probar correo; no se guarda esa dirección real en el repositorio. La entrega y
recuperación alojadas todavía requieren prueba con el usuario. El login precreado sí
fue probado. Para cohortes, configurar SMTP propio con secretos introducidos por el
operador en el panel ([Supabase](https://supabase.com/docs/guides/auth/auth-smtp)).
El 2026-09-29 el propietario habilitó el acceso al repositorio en Vercel. La API
del proyecto confirma conexión GitHub a `maximo-Pdev/funes-empleo` (repo 1376497802),
con `productionBranch=main`, protección SSO activa y protección de forks. El rechazo
anterior de `vercel git connect` queda como incidente histórico resuelto de acceso.
El push `0e84bb0f9f7f4214a3a4e590dec9bae5ca8b4b85` generó automáticamente el
preview Git `dpl_CBRrKSZZF5QKUdhMv35zUy1nHfDW`, READY, target Preview:
https://funes-empleo-nebstp3fr-pantherium-8487s-projects.vercel.app.
La API confirmó SHA/rama/source=git. El smoke de cuatro roles pasó navegación,
aislamiento y CV/hash en ese dominio, usando el script existente con únicamente
la URL sustituida en una copia ignorada; cookies solo en memoria, sin trazas.
Este recibo identifica ese despliegue exacto, no todos los commits posteriores.
La URL canónica y los callbacks siguen apuntando al despliegue de las mediciones;
no se sustituyó ese despliegue ni se atribuyeron sus tiempos al preview Git.
T097 conserva pendiente la publicación desde main tras revisión/merge:
Production no tiene variables de aplicación ni se habilitó producción municipal.
Referencia: [Vercel git](https://vercel.com/docs/cli/git).
Vercel selecciona Node 24 por versión mayor; no se acredita el patch exacto local.
Las pruebas humanas están en [la guía de ejecución](../validation/human-validation-guide.md).

## Separación y configuración

| Entorno | Datos y credenciales | Restricción |
| --- | --- | --- |
| Local | Supabase CLI/Docker, seed/PDF ficticios, claves locales | Reset local explícito; no conexión a proyectos alojados |
| Preview | Proyecto de prueba separado o sin persistencia | Nunca secretos/datos productivos ni secretos a PR no confiables |
| Demo | Supabase y Vercel separados, usuarios ficticios individuales | Confirmar propietario, proyecto y permisos; no equivale a producción |
| Producción | No configurada | Bloqueada OQ-006 y gates municipales |

Variables de aplicación: `APP_ENV`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`CONSENT_POLICY_VERSION`. La publicable no elude RLS. `SUPABASE_SECRET_KEY` es
opcional y exclusivamente servidor/aprovisionamiento controlado; jamás prefijo
`NEXT_PUBLIC_`. `ACCEPTANCE_DEMO_PROJECT_REF` solo admite `kyjycjojzhwggjuqjnki`.
El reset alojado está bloqueado por EXTRA-015/017. Variables privadas por identidad
solo en procesos de tooling: [credenciales de demo](demo-credentials.md). No publicar
valores ni reutilizar el literal local en el proyecto alojado.

### Reset alojado: no ejecutar procedimientos históricos

`npm run acceptance:reset-demo` y `reset-demo.sql` rechazan el reset. No usar SQL
preparado anteriormente, recrear Auth, copiar seeds locales ni eludir auditoría.
Cualquier sustitución debe preservar identidades, contraseñas e historial y pasar
revisión separada. Los recibos siguientes son historia, no instrucciones vigentes ni
prueba del candidato actual. Los protocolos humanos con reset alojado siguen pendientes.
Los scripts CV interactivos verifican solo los 4 candidatos retenidos: nunca atribuir
sus resultados al benchmark de 500 CV. PC4 operativo conserva el retiro seguro de
sobrantes; no está ejecutado ni autorizado por estos cambios de fuente.

Evidencia 2026-09-28: reset `8c85617b-56ec-4ef0-9cfe-89aee0768388`,
22:47:10 UTC, conteos 554/500/50/100/1000/500 correctos; a las 22:50:22 UTC se
verificaron los 500 PDF de 1426 bytes con el hash del manifiesto. Guard de entorno
incorrecto rechazado; EXECUTE denegado a anon/authenticated/service_role.
Mediciones posteriores del 2026-09-29: siete casos técnicos dentro de sus límites,
siete resets distintos y 500 PDF comprobados antes de cada caso; detalle en
[performance.md](../validation/performance.md). Aceptación humana pendiente.
El usuario autorizó expresamente repetir resets de esta demo el 29/09; la revisión
automática previa que rechazó una repetición quedó resuelta con esa autorización.
Después de las mediciones, reset final `654236d6-b235-48a0-8438-2e960ffa5afe`
del 29/09 21:41:13 UTC: 554/500/50/100/1000/500 correctos; verificación de los
500 PDF/hash completada a las 21:42:36 UTC. Se retiró la variante de preparación
concurrente mediante ese reset. Esto no acredita registro ni correo alojado.

Concurrencia vigente: `acceptance-concurrency.spec.ts` hace un reset frío de aceptación
local, aplica `prepare-demo-concurrency.sql` con contexto local explícito y ejecuta
cuatro cuentas administrativas diferentes mediante una barrera común. Cada operación
debe confirmar éxito visible en ≤5 s; después se verifican cuatro versiones y
cuatro auditorías con actores individuales/request IDs. Es el último proyecto de
Playwright para no alterar los recorridos anteriores. Nunca ejecutar esa preparación
en el servidor alojado. Las mediciones históricas de EXTRA-007 permanecen separadas.
`demo-performance.mjs` distingue checks interactivos de benchmarks; rechaza
`concurrent-admins` en `APP_ENV=demo`. Los otros controles individuales no acreditan
aceptación sobre el dataset grande.

Variables solo de tests: `LOCAL_MAILPIT_URL` (buzón local ficticio),
`PLAYWRIGHT_EXTERNAL_SERVER=1` únicamente cuando se inició deliberadamente un servidor
de pruebas de la misma versión. No reutilizar un servidor de trabajo ajeno.
No imprimir `supabase status -o json`, cookies, enlaces de recuperación o env completos
en evidencias. Cargar valores en memoria del proceso; registrar solo nombres y entorno.

Para E2E local, después del reset y antes del comando de pruebas (PowerShell):

```powershell
# La salida completa queda en memoria; no imprimir $localTestConfiguration.
$localTestConfiguration = npx supabase status -o json | ConvertFrom-Json
if ($localTestConfiguration.API_URL -ne 'http://127.0.0.1:54321') {
  throw 'Destino inesperado: estas pruebas solo admiten el fixture local.'
}
$env:NEXT_PUBLIC_SUPABASE_URL = $localTestConfiguration.API_URL
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $localTestConfiguration.PUBLISHABLE_KEY
if (!$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $localTestConfiguration.ANON_KEY
}
$env:NEXT_PUBLIC_APP_URL = 'http://127.0.0.1:3000'
$env:APP_ENV = 'local'
$env:CONSENT_POLICY_VERSION = 'demo-not-approved'
$env:LOCAL_MAILPIT_URL = 'http://127.0.0.1:54324'
$localTestConfiguration = $null
npm run test:e2e -- --workers=1
```

Usar una terminal de pruebas dedicada. No cargar estas variables sobre una sesión de
operación alojada ni sustituir el destino por una URL remota. Si el proceso no contiene
APP_ENV/CONSENT_POLICY_VERSION, algunas páginas fallarán de forma cerrada: no se debe
contar una pantalla de error como recorrido correcto.

## Preparación local y controles

1. Verificar rama limpia, Node/npm fijados y Docker activo. Instalar con `npm ci` sin
   procesos que bloqueen `node_modules` en Windows.
2. Ejecutar `npx supabase start`; copiar variables solo al `.env.local` ignorado.
3. Verificar propiedad exclusiva del proyecto local (no el Docker/servicio del checkout
   principal). Fuera de CI aislado, establecer `LOCAL_ACCEPTANCE_PROJECT_OWNED=funes-empleo`
   solo después de verificarlo. El reset sin `--acceptance` prepara la demo de 10 cuentas
   y 4 PDF. Loopback por sí solo no acredita propiedad.
4. Para gates, `npm run test:db` elige explícitamente aceptación TEST-ONLY con
   `--no-seed`, carga SQL generado protegido y ejecuta pgTAP completo sin blobs.
   `npm run test:e2e:full` prepara aceptación más 500 PDF y exige cero skips/fallos.
   Manifiesto separado con hashes/inputs/conteos; no reducir expectativas por el seed
   interactivo. Ejecutar además tooling, tipos, lint, unit y build.
5. `npm run dev` para revisión; `npm run build` y `npm run start` para validación del build.
6. `npx supabase stop` cuando nadie dependa del entorno. No usar un borrado general de Docker.

## Administradores y correo

El producto requiere cuatro cuentas municipales separadas, nunca una compartida.
El seed interactivo usa dos admins ficticios; el fixture TEST-ONLY de aceptación usa
cuatro para comprobar el requisito, sin crear admin3/admin4 en el demo alojado. La aplicación no ofrece registro público admin.
`provisionAdministrator` valida un admin activo; `inviteIndividualAdministrator`
reserva invitación con actor en base y llama Auth Admin, sin exportar el cliente secreto.
El arranque del primer administrador alojado requiere un operador confirmado y
procedimiento controlado; no simularlo con un usuario público ni editar roles desde UI.
Las identidades municipales y operador inicial no están aprobados aún.

Correo local: Mailpit, sin envío real. SMTP integrado solo para pruebas controladas;
no prometer entregabilidad productiva. Configurar URL de aplicación y callback permitido
para cada entorno, con `/auth/callback` y destino seguro de recuperación. No almacenar
links/tokens en capturas, trazas ni PR. Confirmar remitente/SMTP con responsable antes
de aceptación real; usar solicitudes no enumeradoras y renovación de enlaces vencidos.

## Migraciones y recuperación forward-only

Antes de aplicar: identificar entorno/proyecto, commit, migraciones pendientes y
coincidencia de `supabase_migrations.schema_migrations`; coordinar cambios compartidos.
Previsualizar con `supabase db push --dry-run` solo contra destino explícitamente
verificado. No vincular un proyecto desconocido. Antes de cambios destructivos, respaldo
y plan de recuperación; no se autorizan cambios destructivos por este documento.

Ante fallo, cualquiera de los dos desarrolladores puede detener el despliegue afectado
y diagnosticar en su rama sin esperar al compañero:

1. Conservar evidencia sanitizada: entorno, actor, fecha, commit, migración, código de
   error, estado antes/después, integridad y referencia al respaldo si existe.
2. Determinar rollback completo o DDL/datos parciales; comparar historial de migraciones,
   objetos y constraints reales. Verificar versión/destino y migraciones posteriores
   concurrentes antes de corregir. No asumir éxito por existir una fila de historial.
3. Crear **otra** migración correctiva. Nunca reescribir una ya aplicada ni borrar su
   registro para ocultar divergencia; probar reset y actualización hacia adelante.
4. Solo reconstruir entornos exclusivamente ficticios y después de preservar evidencia.
   No restaurar backups sobre un destino no verificado ni purgar historia municipal.
5. Registrar integridad posterior y comunicar al compañero en PR/comentario antes de
   integración compartida. La revisión ordinaria controla el merge; no confundir
   aprobación con integración. Producción sigue bloqueada por OQ-006.

## Cron y vencimientos

`municipal-employment-daily` llama `private.run_daily_employment_maintenance()` a
03:00 UTC: cierra ofertas vencidas, casos sin respuesta y permisos poscontratación
vencidos. Función privada, idempotente, sin acceso para anon/authenticated/service_role.
Revisar `cron.job` y `cron.job_run_details` mediante operador autorizado, sin publicar
logs sensibles. No ejecutar relojes de prueba sobre datos reales.

El permiso poscontratación se deniega al instante de 720 horas aunque Cron se retrase.
Un fallo de Cron requiere conservar error seguro, revisar última ejecución, corregir
hacia adelante y ejecutar la misma función únicamente desde mantenimiento autorizado.
No agregar un endpoint público ni conceder EXECUTE para sortear el fallo. Vercel Cron
es contingencia del plan, no está implementada: requiere diseño/revisión y no debe
coexistir sin control con la programación actual. Reevaluar el riesgo beta señalado
por el plan antes de producción.

## Entrega de demo

Antes de configurar integración GitHub/Vercel: acordar propietarios y permisos,
proyecto Supabase ficticio independiente, URLs, correo y secretos separados. No hacer
deploy desde esta tarea sin un destino confirmado. Verificar migraciones, RLS, Storage,
Cron, gates y revisión del candidato exacto por PR. Los protocolos humanos con reset
alojado requieren primero un procedimiento nuevo revisado; un build local o preview
no acredita esos resultados. Antes de operación municipal real: cero cuentas de prueba
activas y retiro seguro sin purgar historial ni afectar la cuenta ajena. La publicación,
configuración alojada y merge pertenecen al padre, no a PC1.
