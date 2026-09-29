# Controles de calidad — fase 9

Fecha: 2026-09-29. Rama `codex/temp-mvp-completion`, base `481b9f0` (PR #32
integrada). Evidencia local del árbol de esta entrega; el commit que contiene este
documento identifica los archivos verificados. CI y revisión independiente siguen
pendientes; los controles de demo se distinguen de la aceptación municipal.

Entorno: Windows, Node `24.21.0`, npm `11.19.0`, Next `16.3.5`, Supabase CLI
`2.117.0`, Docker Desktop y Chromium de Playwright `1.63.0`. Solo fixture ficticio
`funes-demo-v1`: 500 candidatos, 50 empresas, 100 ofertas, 1.000 participaciones,
500 PDF. SHA-256 seed:
`ae11e0374459bd64f5f6a7803223d3f74a56fc80966c066be69e13a47eadb7d7`.

## Ejecuciones finales

| Comando exacto | Resultado |
| --- | --- |
| `npm run typecheck` | PASS, tipos de rutas y TypeScript sin errores |
| `npm run lint` | PASS, sin warnings permitidos |
| `npm run test:unit` | PASS, 376 pruebas en 23 archivos; incluye integración de servicios y evaluadores de protocolo |
| pgTAP dentro de `npm run test:e2e:full` | PASS, 855 aserciones en 12 archivos; reset/migraciones correctos |
| `npm run build` | PASS, compilación de producción y tipos correctos |
| `npm run test:e2e:full` | PASS, 57 pruebas, 0 omitidas/fallidas/inestables, 3,8 minutos de Playwright; dos carreras SQL PASS |
| E2E focalizado de handlers | PASS tras ampliar candidato activo y exigir rechazo de autorización, no error de input |
| `demo-smoke.mjs --confirm-fictitious-demo` | PASS, cuatro roles contra el nuevo preview protegido |
| `demo-storage.mjs --confirm-fictitious-demo` | PASS, seis actores; hash/denegaciones/firma/listado |
| Reset alojado y `verify-demo-cvs.mjs` | PASS, conteos del manifiesto y 500 PDF hash/tamaño; recibo en runbook |
| `npm audit --json` (2026-09-27) | PASS, 0 vulnerabilidades entonces; no se cambiaron dependencias ni certifica ausencia de riesgos |
| `git diff --check` | PASS, sin errores de espacios; aviso LF/CRLF de Git no es un fallo |

Preparación E2E ejecutada: `node tests/fixtures/reset-local.mjs --confirm-local-reset`.
Además de reset/SQL, sube y verifica los 500 PDF y las denegaciones de Storage/URL
firmada. Las variables del proceso se cargaron desde Supabase local sin imprimir
claves, más APP_ENV=local, CONSENT_POLICY_VERSION=demo-not-approved y Mailpit local.
Procedimiento reproducible: [runbook](../operations/demo-runbook.md). Los grupos se
ejecutan métricas → fronteras de calidad → recorridos que mutan el fixture. Repetir
E2E exige reset completo; `test:db` solo no vuelve a cargar archivos.

## Fallos previos y correcciones

- Paginación: prueba roja con 20 filas cuando el manifiesto exige 10. EXTRA-002
  corrigió filtro empresarial, tamaño de página y desempate de orden. Prueba verde
  con 80 ofertas publicadas, 50 empresas activas y páginas disjuntas.
- Una ejecución E2E omitió APP_ENV/CONSENT_POLICY_VERSION del proceso: 16 pasaron,
  una falló y 27 no se ejecutaron. Se corrigió la preparación, se restableció fixture
  y se ejecutó la serie completa final. Se reforzó axe para rechazar páginas de error.
- La matriz nueva de acciones requirió corregir el harness de importación y entorno
  simulado. Resultado final: 247 comprobaciones incluidas en las 376, no 247 nuevas
  pruebas HTTP/SQL. Todas las acciones exportadas están clasificadas.
- SQL 071 usa nombres reales y falla si falta una función esperada: no considera
  una selección vacía como evidencia de permiso correcto.
- Next emitió `The destination stream closed early` en recorridos existentes de
  navegación; las aserciones pasaron. La causa sigue sin diagnosticar y se conserva
  como hallazgo, no como defecto corregido. No publicar trazas/cookies sin revisión.
- La consulta npm audit restringida falló por red; repetida con acceso autorizado
  al registro produjo el resultado anterior. No se cambiaron dependencias.

## Alcance y pendientes

T095 registra gates ejecutados, no certifica cobertura exhaustiva. No hay aceptación
de mediciones alojadas ni pruebas humanas. T087/T089/T092 requieren esa evidencia.
T088/T094 añaden HTTP real y concurrencia SQL; T093 añade 310 comprobaciones de clases
de auditoría/rollback. T096 necesita revisión del segundo desarrollador.
Los dos intentos previos de E2E detectaron supuestos incorrectos del test NOT_FOUND:
status 404 fijo y un selector ambiguo de robots en streaming. Corregidos, prueba
focalizada y serie completa pasan. No se omitió la prueba para obtener verde.
Los checks de requisitos permanecen intactos: no equivalen a tareas implementadas.
