# Estado de implementación — 2026-09-22

Rama: `feature/mvp-implementation`. Base de esta continuación: `836dc2b` (`docs: complete implement pt.1`).
El trabajo anterior ya estaba commiteado y el árbol limpio al retomar. Esta continuación no creó
commits, push ni PR.

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

T001–T007 están implementadas y marcadas; checkpoint técnico local de fase 1 validado.

- T001: se completaron las carpetas del plan, se revisaron las versiones fijadas y la justificación
  de dependencias auxiliares en plan/research, y se comprobó `npm ci`. No se agregaron dependencias
  en esta continuación. La revisión técnica del agente no sustituye la revisión humana del PR.
- T006: Docker Desktop ya estaba instalado por usuario y activo, fuera de PATH. Se utilizó ese motor
  sin instalar servicios ni modificar PATH global. Arranque, reset local y pgTAP terminaron con exit 0.
- T007: YAML parseado y comprobados permisos de lectura y los siete comandos del workflow;
  comandos validados localmente. No se afirma ejecución remota: GitHub devolvió 404 a la consulta
  no autenticada de Actions. La revisión del segundo desarrollador y la ejecución en GitHub siguen
  pendientes antes de integrar; no son evidencia sustituida por estas casillas de implementación.
- T008 en adelante: no iniciadas por alcance de la solicitud («completa la fase 1»).
  El E2E actual es solo smoke público; al incorporar identidad se debe añadir el entorno local
  ficticio de Supabase para esos escenarios, sin usar secretos de demo/producción.

## Evidencia ejecutada

| Comando | Resultado |
| --- | --- |
| `npm ci` | Exit 0, instalación desde lockfile; audit informó 0 vulnerabilidades conocidas |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0, cero advertencias de lint |
| `npm run test:coverage` | Exit 0, 5 pruebas en 2 archivos |
| `npm run build` | Exit 0, ruta pública prerenderizada |
| `npm run test:e2e` | Exit 0, 1 prueba Chromium con axe y enlace de salto/foco |
| `npm run test:db` | Exit 0, reset local + pgTAP: 1 archivo, 1 prueba, PASS |
| Workflow CI | YAML, permisos y comandos comprobados; ejecución remota no verificada |

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
- El diagnóstico inicial de Docker quedó superado: WSL2 y procesos del sistema revelaron una
  instalación activa en `%LOCALAPPDATA%\Programs\DockerDesktop`, no en Program Files. Docker Server
  29.8.0 funciona. La guía documenta cómo agregar su binario al PATH solo de la terminal actual.
- Un intento de `npm ci` durante el arranque de Supabase encontró el ejecutable en uso (EPERM).
  Se esperó a que terminara el arranque y se repitió con éxito, sin borrar archivos manualmente ni
  cerrar procesos ajenos. Ejecutar reinstalaciones antes de comandos que usen esos binarios.
- El entorno Docker local `funes-empleo` queda iniciado con seed vacío, sin datos de negocio.

## Cómo retomar

1. Revisar el diff y la corrección/complemento técnico de plan/research con el segundo desarrollador;
   validar el workflow en el PR antes de integrar. No confundir validación local con aprobación humana.
2. Ante una nueva solicitud de avanzar, iniciar T008/T009 (tests que fallen por ausencia de
   funcionalidad) antes de las migraciones y servicios de fase 2. No saltar directamente a historias.
3. Mantener Docker activo; `npm run test:db` resetea exclusivamente la base local ficticia. No imprimir
   credenciales en conversaciones. No usar un entorno remoto real para estas pruebas.
4. Mantener OQ abiertas; T069 y el importador histórico dependen del mapeo municipal aprobado.

Constitución: se conserva intermediación, privacidad, datos ficticios, trazabilidad prevista y revisión
por PR. Esta base no constituye el MVP terminado ni habilita datos reales o producción.
