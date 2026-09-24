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

## Actualización 2026-09-24: fase 3 de intermediación

Las secciones anteriores describen el cierre histórico de fase 1; ya no representan el estado actual.
La PR #22 de derivaciones y funciones SQL está fusionada en `main` remoto (`2aac079`) y también fue
integrada en `tasks.md-FASE-3-Maximo`. La rama de trabajo incluye las pantallas y acciones municipales,
el fixture PDF determinista corregido y pruebas de privacidad en navegador. No se fusionó esta rama
de trabajo a `main`.

Quedaron marcadas T022–T024 y T026–T037. T025 permanece abierta: los E2E actuales prueban búsqueda,
lectura administrativa, aislamiento de rol, descarga del CV exacto, revocación después de la última
derivación activa, feedback con confirmación municipal, contactos/notas y suspensión/reactivación sin
restaurar acceso. No cubren todavía **todos** los recorridos de Quickstart 2–4 y la parte administrativa
de 8 (por ejemplo alta/edición de empresa y oferta, reemplazo de CV, consentimiento y nominaciones de
punta a punta), algunos de los cuales dependen de interfaces de fases posteriores. No marcar T025 por
una cobertura parcial.

Evidencia local sobre el fixture exclusivamente ficticio: reset y carga de 500 CV, 203 pruebas pgTAP,
69 pruebas unitarias/de componentes, typecheck, lint y build exitosos; Playwright terminó con 12 pruebas
aprobadas y una omisión ajena a US1 (`recovery-flow`). Docker Desktop se instaló en modo usuario
y el motor local respondió; el agente no aceptó ningún acuerdo de licencia. La prueba de revocación
contempla que una empresa puede
tener otra derivación todavía vigente del mismo candidato: cancelar una sola no corta ese otro permiso;
cancelar la última sí devuelve 404 en nuevas descargas. No se guarda URL firmada reutilizable.

Antes de fusionar esta rama, revisar el diff y la nueva cobertura E2E en PR, comprobar los checks
remotos y decidir cuándo completar T025 con las interfaces correspondientes. La validación local no
equivale a aprobación humana ni prueba de despliegue en Vercel.

## Actualización 2026-09-24: fase 4 de autogestión candidata

Rama: `codex/phase-4-candidate-self-service`, creada sobre `tasks.md-FASE-3-Maximo` porque esa base
todavía no está integrada. Commit intermedio: `ca247d8`. T038–T050 se implementaron y marcaron. T025
de fase 3 permanece abierta y no se considera resuelta por estos recorridos.

El candidato puede registrar una cuenta individual y verificar su correo, completar y corregir su
perfil con varias categorías, decidir el consentimiento de demostración, cargar o reemplazar un CV
PDF, activar el perfil, postularse a ofertas vigentes y retirar una postulación o nominación abierta.
El reclamo de un perfil asistido con DNI coincidente queda pendiente de vinculación presencial sin
duplicar el perfil. El archivo de cuenta y perfil es inmediato; una restauración administrativa con
motivo vuelve el perfil a borrador sin reabrir casos ni accesos empresariales. Las pantallas de
candidato muestran solo recepción o resultado final, con estados y mensajes en español.

Migraciones `202609190019` y `202609190020`: comandos protegidos, consentimiento versionado,
proyecciones limitadas, ofertas públicas vigentes y vigencia de seis meses atribuida a la cuenta que
consulta. `202609190021` es una corrección hacia adelante: la proyección de participaciones debe ser
`VOLATILE` porque la validación de sesión bloquea la fila de cuenta; PostgREST ejecutaba la función
`STABLE` en una transacción de solo lectura. `202609190022` corrige hacia adelante la política de
inserción de Storage: el metadato del objeto aún no existe al evaluarse la política. La carga de CV
reserva la clave, sube el objeto privado
y confirma la nueva versión después de comprobar metadatos; un rechazo conserva el CV anterior y
las derivaciones previas mantienen su versión exacta. Un fallo entre reserva y confirmación puede
dejar una fila `upload_pending` y un objeto sin vigencia: se reintenta con una nueva clave y se
conserva la evidencia antes de cualquier limpieza. La recuperación de una migración aplicada exige
otra migración correctiva, sin reescribir la aplicada. No se agregaron variables de entorno nuevas;
`CONSENT_POLICY_VERSION=demo-not-approved` sigue siendo texto ficticio, no aprobación municipal.

Verificación local con datos ficticios: `reset-local.mjs --confirm-local-reset` reconstruyó el fixture
500/50/100/1.000 y cargó 500 CV; 262 pruebas pgTAP, 74 unitarias/de componentes, typecheck, lint y
build pasaron. `npm run test:e2e -- --workers=1 --reporter=list` pasó 14/14, incluidos registro con
correo local, reemplazo y rechazo de CV, dos postulaciones, retiro, corrección directa, cambio de
disponibilidad, suspensión/reactivación, archivo/restauración y análisis axe de ofertas y perfil.
Para evitar un bloqueo de cierre del servidor Playwright en Windows, se inició `next start` en otra
terminal y se usó `PLAYWRIGHT_EXTERNAL_SERVER=1` solo para esa ejecución; CI conserva el servidor
configurado por Playwright.

Antes de integrar, el segundo desarrollador debe revisar el PR y sus checks remotos. Permanecen las
decisiones municipales abiertas sobre consentimiento real, retención, datos y límites de CV. No se
usaron datos personales reales ni se probó un despliegue remoto.
