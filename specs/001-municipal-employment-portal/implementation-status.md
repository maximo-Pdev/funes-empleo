# Estado de implementación — 2026-09-22

Rama: `feature/mvp-implementation`. Base observada: `1cc466f` (merge de PR #16).
Trabajo local sin commit, push ni PR creados por esta ejecución.

## Gate de entrada

Se leyeron skill, AGENTS, contexto/discovery, especificación, plan, investigación, modelo,
contratos, tareas, quickstart y constitución 1.0.0. Las checklists estaban completas y no se editaron:
`mvp-readiness.md` 77/77; `requirements.md` 16/16. No existe `.specify/extensions.yml`.

## Alcance real

Solo infraestructura de fase 1: Next App Router, página pública de desarrollo, configuración estricta,
Tailwind, variables validadas, scripts de calidad, Vitest/RTL, Playwright/axe, configuración local de
Supabase y workflow CI. La página declara que los servicios todavía no están habilitados.
No hay tablas de negocio, RLS, autenticación, perfiles, ofertas, derivaciones, importación ni métricas.
Los helpers de identidad E2E contienen únicamente direcciones ficticias y no simulan autenticación.

T002–T005 están verificadas y marcadas. Permanecen abiertas:

- T001: scaffold y lockfile creados, pero la revisión del complemento de dependencias de plan/research
  por el segundo desarrollador sigue pendiente. No se atribuye esa aprobación al agente.
- T006: config, carpetas, seed vacío y prueba de infraestructura pgTAP creados; ejecución sin verificar
  porque no hay motor Docker local accesible.
- T007: workflow creado con permisos de lectura y jobs de aplicación/base; no ejecutado en GitHub.
  El E2E actual es solo smoke público; al incorporar identidad debe incorporar el entorno local
  ficticio de Supabase para esos escenarios, sin usar secretos de demo/producción.
- T008 en adelante: no iniciadas. No avanzar de fase hasta cerrar el checkpoint de fase 1.

## Evidencia ejecutada

| Comando | Resultado |
| --- | --- |
| `npm ci` | Exit 0, instalación desde lockfile; audit informó 0 vulnerabilidades conocidas |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0, cero advertencias de lint |
| `npm run test:coverage` | Exit 0, 5 pruebas en 2 archivos |
| `npm run build` | Exit 0, ruta pública prerenderizada |
| `npm run test:e2e` | Exit 0, 1 prueba Chromium con axe y enlace de salto/foco |
| `npm run test:db` | Exit 1, `LegacyLocalDbRunningError: failed to inspect service` |

La cobertura se limita explícitamente al módulo de esquema de entorno, no representa cobertura del
MVP. Axe sobre la página inicial tampoco reemplaza la aceptación manual ni NVDA de los flujos futuros.
La primera ejecución E2E en sandbox aprobó aserciones pero quedó esperando el cierre de Next. Se
cerraron exclusivamente sus procesos identificados, se reinstaló con `npm ci` y se ejecutó de nuevo
con permisos para manejar subprocesos; terminó normalmente en aproximadamente 3 segundos.

## Correcciones técnicas y riesgos

- Dependencias auxiliares explicitadas en plan/research; ninguna función de producto añadida.
- ESLint 10.10.0 fallaba con `eslint-plugin-react` 7.37.5 por `context.getFilename` retirado.
  Se fijó temporalmente ESLint 9.39.5, compatible y validado sin desactivar reglas. npm lo marca como
  no mantenido: revisar esta limitación en el PR y actualizar cuando el plugin soporte ESLint 10.
- npm avisa que `unrs-resolver` tiene un postinstall sin aprobación `allowScripts`; no se aprobó ni
  se forzó. Las comprobaciones indicadas pasan sin ejecutarlo. No habilitar scripts globalmente.
- Variables privadas solo se leen desde módulo `server-only`; errores de configuración no copian
  valores. Se rechazan claves `sb_secret_` y JWT `service_role` en configuración pública.
- Config Supabase: grants explícitos, sin Realtime/Edge/analítica/vectores ni integración IA;
  email confirmado y cambio seguro, bucket/límites definitivos pendientes de las migraciones de fase 2.
- No se detectó `docker` ni `podman` en PATH, tampoco Docker en su ruta habitual ni pipes
  `docker_engine`/`dockerDesktopLinuxEngine`. No se instalaron ni modificaron servicios del sistema.

## Cómo retomar

1. Revisar diff y la corrección/complemento técnico de plan/research. No sobrescribir este trabajo.
2. Disponer de Docker Desktop con motor Linux activo; ejecutar `npx supabase start` y
   `npm run test:db` exclusivamente sobre el proyecto local ficticio. No imprimir credenciales en
   conversaciones. El comando de prueba resetea únicamente la base local.
3. Validar el workflow en PR con el segundo desarrollador. Completar T001/T006/T007 únicamente con
   evidencia aplicable y cerrar el checkpoint de fase 1.
4. Iniciar T008/T009 (tests que fallen por ausencia de funcionalidad) antes de las migraciones y
   servicios de fase 2. No saltar directamente a historias.
5. Mantener OQ abiertas; T069 y el importador histórico dependen del mapeo municipal aprobado.

Constitución: se conserva intermediación, privacidad, datos ficticios, trazabilidad prevista y revisión
por PR. Esta base no constituye el MVP terminado ni habilita datos reales o producción.
