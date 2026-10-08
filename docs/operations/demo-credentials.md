# Credenciales de prueba: una contraseña privada por identidad

La demo interactiva usa **10 identidades ficticias: 2 admin, 4 candidate y 4 company**.
Cada identidad alojada conserva su contraseña única existente. Los scripts no rotan
contraseñas, no leen `.env`, no consultan la bóveda y no usan fallback por rol.
El dataset de aceptación **4/500/50/100/1000 es TEST-ONLY local/CI**, nunca se instala
como seed por defecto ni en Supabase alojado.

## Configuración privada

El operador suministra valores en el entorno del proceso Node mediante un canal
privado. `.env.example` contiene solo nombres con valores vacíos. No copiar valores,
cookies, encabezados, traces ni `storageState` a Git, logs, artefactos o chat.
Todas las identidades requeridas se resuelven antes del primer transporte/navegador.
Una variable ausente o vacía aborta con un mensaje genérico.

| Identidad alojada (`@example.invalid`) | Variable privada |
| --- | --- |
| admin1 | `DEMO_ADMIN1_PASSWORD` |
| admin2 | `DEMO_ADMIN2_PASSWORD` |
| candidate1 | `DEMO_CANDIDATE1_PASSWORD` |
| candidate2 | `DEMO_CANDIDATE2_PASSWORD` |
| candidate3 | `DEMO_CANDIDATE3_PASSWORD` |
| candidate4 | `DEMO_CANDIDATE4_PASSWORD` |
| company1 | `DEMO_COMPANY1_PASSWORD` |
| company2 | `DEMO_COMPANY2_PASSWORD` |
| company3 | `DEMO_COMPANY3_PASSWORD` |
| company4 | `DEMO_COMPANY4_PASSWORD` |

El resolver admite exactamente estas diez identidades. Rechaza admin3/admin4
alojados, identidades adicionales y variables compartidas `DEMO_ADMIN_PASSWORD`,
`DEMO_CANDIDATE_PASSWORD`, `DEMO_COMPANY_PASSWORD` o `DEMO_PASSWORD` como fallback.
Son variables Node-only: nunca `NEXT_PUBLIC_*` ni configuración cliente del portal.

| Control alojado | Identidades requeridas |
| --- | --- |
| Carga/verificación de los 4 CV interactivos | admin1 |
| Smoke | candidate1, company1, admin1 |
| Storage | candidate1, candidate2, company1, company2, admin1 |
| Comprobaciones individuales de demo-performance | admin1 |

La publicable Supabase no sustituye una contraseña. Los checks interactivos no son
benchmarks de aceptación: 10 cuentas no prueban el volumen 500/50/100/1000 ni cuatro
administradores simultáneos. `concurrent-admins` solo se ejecuta con `APP_ENV=local`,
destinos exactos y propiedad del proyecto aislado; usa cuatro identidades del dataset
TEST-ONLY con el resolver local, no inventa dos cuentas alojadas.

## Local y aceptación aislada

`localFixturePassword` valida **ambos destinos** antes de entregar el literal
local determinista: HTTP, hostname exacto `127.0.0.1` o `localhost`, Supabase :54321
y aplicación :3000, sin userinfo, rutas extra, query ni fragmento. No reutilizar
un build conectado a Supabase alojado. Playwright valida también servidor externo.

`acceptance-manifest.json` separa `interactive` y `acceptance` con versiones,
conteos, entradas y hashes independientes; el PDF ficticio es común. El generador
versionado deriva el SQL de aceptación de la plantilla `supabase/seed.sql`, cambiando
solo parámetros revisados. Las pruebas nativas rechazan diferencias en SQL/hash.

- Seed predeterminado: 2 admins / 4 candidatos / 4 empresas, 8 ofertas y 8 casos.
- Aceptación explícita: 4 admins / 500 candidatos / 50 empresas / 100 ofertas / 1000 casos.
- `npm run test:db` selecciona aceptación, ejecuta pgTAP y no carga blobs PDF.
- `npm run test:e2e:full` selecciona aceptación, carga/verifica 500 CV y ejecuta
  todos los recorridos sin skips. El caso final de cuatro admins realiza otro reset
  frío y comprueba las cuatro mutaciones y auditorías después de la barrera común.
- Fuera de CI aislado se exige `LOCAL_ACCEPTANCE_PROJECT_OWNED=funes-empleo`;
  establecerlo solo si el operador verificó propiedad exclusiva del servicio local.
  Loopback no demuestra propiedad. Nunca usarlo sobre el servicio del checkout principal.

## Reset alojado: bloqueado

`acceptance:reset-demo` aborta sin generar SQL. `reset-demo.sql` contiene una negativa
incondicional sin eliminar Auth ni ejecutar seeds. No ejecutar SQL preparado por
el procedimiento histórico ni copiar ninguno de los seeds locales al servidor.
El código no cambia una función ya instalada: el padre registra las operaciones y
verificaciones remotas autorizadas en PC2/PC4. La rotación individual histórica
verificada no acredita retiro de las cuentas sobrantes ni aprobación del código actual.

Un reset futuro requiere revisión, conservación de identidades/credenciales e
historial, alcance verificable y recibo de integridad. Hasta entonces los protocolos
humanos que requieren reset alojado quedan pendientes, sin sustituirlos por una
sesión calentada. Antes de uso municipal real deben quedar **cero cuentas de prueba
activas**, con retiro seguro que preserve cuenta ajena e historial conforme a la
política pendiente. Este PR no autoriza borrar usuarios, purgar auditoría o modificar
la bóveda; tampoco habilita producción, publicación o merge.

## Evidencia de código y límites

`npm run test:tooling` usa Node nativo y transportes interceptados sobre los
entrypoints reales; no ejecuta Auth, SQL, Docker ni Vercel alojados. Vitest no recoge
`.mjs`, por eso CI ejecuta este gate aparte. Ver EXTRA-017 en `cambios-extra.md` para
RED/GREEN y gates actuales; la evidencia original de EXTRA-015 precede a la reducción
bdd9362 y no constituye revisión del candidato reparado. DB/E2E del nuevo candidato
requieren servicio local propio o CI después del push del padre.

El padre conserva tracker, revisión y entrega de PR #50. No inferir revisión,
aceptación humana, despliegue o merge de los checks de fuente.
