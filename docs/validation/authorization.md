# Fronteras de autorización — T088/T094

2026-09-27. Alcance comprobado localmente y límites de cobertura. Fuente normativa:
`specs/001-municipal-employment-portal/contracts/authorization-matrix.md`.

| Superficie | Evidencia positiva | Evidencia negativa |
| --- | --- | --- |
| Páginas por rol | E2E existentes y accessibility | authorization-boundaries enumera todos los page.tsx de grupos admin/candidate/company e intenta acceso anónimo/cruzado |
| Server Actions | Recorridos candidate/company/intermediation/assisted/import | Reenvío en vuelo de corrección tras suspensión; matriz de integración de todas las acciones exportadas, con sesiones simuladas |
| Route Handlers | CV en intermediation, importación y métricas | Anónimo/empresa contra cuatro handlers; CV ajeno/ausente misma respuesta 404/no-store |
| Auth callback | recovery-flow, registro/verificación | Códigos inválidos/no sesión en pruebas de Auth; no atribución de rol público admin |
| Data API/RLS | Suites 001–060 con sesiones independientes | 071 enumera RLS/grants de tablas públicas; suites por historia prueban propiedad/rol/suspensión |
| Storage | reset-local sube 500 PDF y prueba permisos | Políticas privadas, UUID opacos, CV exacto de derivación, sin padrón empresarial |
| Exportación | 060 + admin-metrics | Admin activo exclusivo, filtros, no-store y auditoría sin contenido |
| Cron | 010 via mantenimiento ficticio | 070/071: sin EXECUTE para roles interactivos/servicio; actor system reservado |

## Sesión, propiedad y revocación

Servidor usa `getUser` y cuenta vigente, no rol de metadata editable ni `getSession`.
SQL comprueba sesión Auth vigente y bloquea actor al mutar. El nuevo E2E intercepta
el POST real de una Server Action, suspende el candidato antes de continuar, y exige
que no cambie la versión del perfil. Es una intercalación controlada antes de SQL;
no acredita todas las carreras posibles dentro de una transacción.

Una cookie existente de admin suspendido pierde página y CSV. CV ajeno e inexistente
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

## Cobertura que continúa pendiente

`tests/integration/authorization/server-actions.test.ts` clasifica las 35 acciones
exportadas: 28 protegidas y siete públicas/de salida. Ejecuta 246 casos de denegación
con validadores y servicios reales, sesión simulada y barreras sobre RPC/tablas/Storage/Auth;
una aserción adicional falla si aparece una acción sin clasificar. La sesión debe leerse:
un error de validación no cuenta como denegación. Los comandos compartidos de cuenta
delegan propiedad/rol a SQL (permiten autoarchivo); esta matriz solo acredita su rechazo
sin sesión activa, no simula que la base haya autorizado o denegado una cuenta objetivo.

No declarar T088/T094 completas por esta matriz: no invoca cada acción sobre HTTP ni
una base real. Faltan reenvíos HTTP por acción, sesión revocada y suspensión concurrente
dentro de SQL, pruebas por handler
para candidato/admin suspendido y revisión completa de propiedad/NOT_FOUND por ruta.
Inventario reproducible: `rg -n '^export async function' src/features -g '*actions.ts'`.
Las rutas dinámicas de la prueba usan IDs del fixture; el lote inexistente prueba guard
previo, no lectura positiva de un lote real. La evidencia anterior se reutiliza, no se
presenta como cobertura exhaustiva de una frontera distinta.
