# Fronteras de autorización — T088/T094

2026-09-29. Alcance comprobado localmente y en demo, con límites explícitos. Fuente normativa:
`specs/001-municipal-employment-portal/contracts/authorization-matrix.md`.

| Superficie | Evidencia positiva | Evidencia negativa |
| --- | --- | --- |
| Páginas por rol | E2E existentes y accessibility | authorization-boundaries enumera todos los page.tsx de grupos admin/candidate/company e intenta acceso anónimo/cruzado |
| Server Actions | Recorridos candidate/company/intermediation/assisted/import | action-http usa encodeReply de React y el manifiesto compilado: anónimo y tres roles activos/suspendidos; auditoría sin cambios; matriz de integración complementaria |
| Route Handlers | CV en intermediation, importación y métricas | Anónimo/candidato/empresa contra handlers admin con denegación explícita; tres roles suspendidos; CV ajeno/ausente mismo 404/no-store |
| Auth callback | recovery-flow, registro/verificación | Códigos inválidos/no sesión en pruebas de Auth; no atribución de rol público admin |
| Data API/RLS | Suites 001–060 con sesiones independientes | 071 enumera RLS/grants de tablas públicas; suites por historia prueban propiedad/rol/suspensión |
| Storage | reset-local y demo: 500 PDF con tamaño/hash; seis actores alojados | Descarga solo autorizada; firma y listado denegados incluso a admin; sin padrón empresarial |
| Exportación | 060 + admin-metrics | Admin activo exclusivo, filtros, no-store y auditoría sin contenido |
| Cron | 010 via mantenimiento ficticio | 070/071: sin EXECUTE para roles interactivos/servicio; actor system reservado |

## Sesión, propiedad y revocación

Servidor usa `getUser` y cuenta vigente, no rol de metadata editable ni `getSession`.
SQL comprueba sesión Auth vigente y bloquea actor al mutar. El nuevo E2E intercepta
el POST real de una Server Action, suspende el candidato antes de continuar, y exige
que no cambie la versión del perfil. Es una intercalación controlada antes de SQL;
no acredita por sí solo carreras dentro de SQL. `tests/quality/concurrency.mjs`
añade dos conexiones reales: A mantiene bloqueo de suspensión o eliminación de
sesión, B intenta mutar y se observa esperando Lock en pg_stat_activity; después
de commit A, B recibe AUTH_REQUIRED y la entidad conserva estado/versión.

Las cookies existentes de los tres roles suspendidos pierden todas sus páginas y
handlers. Oferta/derivación ajena e inexistente muestran el mismo mensaje genérico
español, sin datos ni indexación. Next usa HTTP 200 para streaming y 404 antes de
empezarlo; la prueba exige comportamiento equivalente, pantalla final y noindex,
no confunde un 200 con acceso autorizado ([Next](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)).
CV ajeno e inexistente
devuelven la misma respuesta; pruebas de intermediation comprueban revocación y 720 h
incluso antes del job. Feedback tardío conserva solo ID derivación, ID/título oferta y
fecha, nunca candidato/CV/contactos. No se encontraron llamadas `createSignedUrl` en src.

## Cliente secreto

`src/lib/supabase/admin.ts` es server-only y exporta únicamente invitación individual;
no exporta el cliente. Su único consumidor es servicio de cuentas que exige admin
activo. No hay llamadas desde módulos use-client. La allowlist del plan permite
aprovisionamiento/invitación, suspensión Auth cuando haga falta y mantenimiento
programado acotado; actualmente la suspensión es transacción de cuenta/RLS y Cron
invoca SQL privado, sin cliente secreto web. No ampliar esta lista para consultas
ordinarias, importación o exportación.

## Inventario y límites

`tests/integration/authorization/server-actions.test.ts` clasifica las 35 acciones
exportadas: 28 protegidas y siete públicas/de salida. Ejecuta 246 casos de denegación
con validadores y servicios reales, sesión simulada y barreras sobre RPC/tablas/Storage/Auth;
una aserción adicional falla si aparece una acción sin clasificar. La sesión debe leerse:
un error de validación no cuenta como denegación. Los comandos compartidos de cuenta
delegan propiedad/rol a SQL (permiten autoarchivo); esta matriz solo acredita su rechazo
sin sesión activa, no simula que la base haya autorizado o denegado una cuenta objetivo.

La matriz de integración se complementa ahora con `action-http.spec.ts`: 26 endpoints
protegidos presentes en el build. `screenDuplicatesAction` y `confirmOutcomeAction`
no generan endpoint al no estar usados; la prueba exige que esa exclusión permanezca
explícita y falla ante acciones nuevas no clasificadas. Inputs válidos impiden contar
VALIDATION_ERROR como rechazo de autorización. Usa sesiones y base reales, sin
simular respuesta RPC; no devuelve OK ni digest interno, y no agrega auditoría.

Resultado: suite completa 57 E2E sin omisiones, 855 pgTAP y dos carreras SQL PASS.
Después se reforzó el handler para candidato activo: prueba focalizada PASS.
El cliente secreto y system actor conservan la allowlist; no hay privilegios nuevos
de aplicación en el reset demo (función private sin EXECUTE para roles web/servicio).
T088/T094 tienen evidencia técnica; la revisión independiente es T096. No se afirma
que una suite pruebe toda intercalación posible, SMTP ni seguridad productiva.
Inventario reproducible: `rg -n '^export async function' src/features -g '*actions.ts'`.
Las rutas dinámicas de la prueba usan IDs del fixture; el lote inexistente prueba guard
previo, no lectura positiva de un lote real. La evidencia anterior se reutiliza, no se
presenta como cobertura exhaustiva de una frontera distinta.
