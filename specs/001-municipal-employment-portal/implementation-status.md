# Estado de implementación — 2026-09-22

**Estado vigente: ver actualización 2026-09-29 al final.** Los apartados previos son
registros históricos de cada fase, no una descripción del producto actual.

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

## Actualización 2026-09-24: integración de fases 4 y 5

La fase 4 se publicó en la PR #23 desde `codex/phase-4-candidate-self-service` hacia
`tasks.md-FASE-3-Maximo`. El workflow Quality pasó. GitHub registró la fusión con commit
`741f5c7fb2fe0039dd630562e6c30f4d34a3e8be`; al consultarlo no figuraban revisiones de PR.
Después de confirmar la fusión, se borró la rama de fase 4 tanto local como remotamente.
Esa ausencia de revisión registrada no se presenta como aprobación del segundo desarrollador.

Para avanzar en paralelo se había creado `codex/phase-5-company-self-service` desde fase 4,
con commit intermedio `9eb9c61`. Tras la fusión se rebasó exclusivamente ese trabajo sobre el
commit `741f5c7`, que pasó a identificarse como `0a3db46`. Se conservaron las ramas y PR por fase;
la rama de integración aún no se fusionó a `main`.

La fase 5 implementa T051–T060: cuenta y perfil empresarial individuales con CUIT normalizado,
edición de borradores y categorías, envío/reenvío a moderación, historial visible limitado,
tablero de ofertas y derivaciones propias, y suspensión/archivo/restauración por el administrador.
La empresa puede archivar su perfil, pero no restaurarlo. La migración forward-only
`202609190030_company_self_service.sql` agrega funciones de escritura con validación de actor,
versión, propiedad y estado, además de proyecciones que omiten motivos internos. No se agregaron
variables de entorno. Ante una migración aplicada fallida corresponde conservar evidencia y añadir
una correctiva hacia adelante; en el entorno local ficticio puede reconstruirse con reset.

Verificación con Supabase local restablecido y datos ficticios: typecheck, lint y build pasaron;
79 pruebas unitarias/de componentes pasaron en 15 archivos; pgTAP pasó 300 pruebas en 6 archivos;
Playwright pasó los 3 recorridos de `company-offers.spec.ts` sobre base recién reiniciada.
Los recorridos incluyen registro y verificación de correo local, corrección, envío y aprobación de
una oferta, pausa y reanudación, aislamiento entre empresas, suspensión, archivo y restauración.
Se ejecutó axe sin violaciones en registro y perfil empresarial. No se realizaron las mediciones
manuales de usuarios, zoom/NVDA o despliegue de demostración; siguen como aceptación posterior.
Las decisiones municipales abiertas del documento de preguntas siguen vigentes.

## Actualización 2026-09-24: cierre de T025 de fase 3

La fase 5 quedó publicada en la PR #24, desde `codex/phase-5-company-self-service` hacia
`tasks.md-FASE-3-Maximo`. El workflow Quality pasó; al cerrar esta verificación la PR seguía sin
revisiones registradas. La rama `codex/phase-3-e2e-completion` parte del commit de fase 5
`2aa7139` para completar únicamente T025 mientras espera esa revisión. Por eso la integración a
`main` todavía no corresponde.
El cierre de T025 se publicó en la PR #25, desde `codex/phase-3-e2e-completion` hacia la rama
de fase 5, con el commit `576636f`; se solicitó revisión a `MateoMansillaDev`.

Se amplió `tests/e2e/intermediation.spec.ts` con los recorridos administrativos de Quickstart 2–4
y 8: filtros del padrón, nominación, preentrevista, preselección, omisiones justificadas y derivación;
retiros por candidato y administrador; confidencialidad empresarial tras cambios de CV/contactos,
retiro y renovación del consentimiento; entrevista, no selección y cancelación individual;
vencimiento de oferta, falta de respuesta a 30 días y permiso poscontratación a 720 horas con
automatización idempotente y corrección tardía; rechazo, cierre, cancelación y suspensión sin
reabrir permisos ni borrar el historial. El helper de reloj actúa solo contra la base Supabase local
y el contenedor ficticio identificado de este proyecto. La nominación administrativa usa la RPC
existente `create_participation`, con validación de rol, versión y condiciones en el servidor y la
base. Se corrigió el enlace desde una oferta pública para que el candidato llegue a la oferta
elegida y pueda postularse aunque no esté en la primera página del listado.

Evidencia local con fixture ficticio reconstruido: 300/300 pgTAP, 79/79 pruebas unitarias y de
componentes, typecheck, lint y build exitosos. Playwright pasó 21 recorridos; el de recuperación
de contraseña conserva su omisión ambiental preexistente (1 skipped). El recorrido de nominación
también pasó aislado antes de reiniciar la base para la suite completa. No se añadieron migraciones,
variables de entorno ni datos reales en T025. Faltan revisión humana de las PR, mediciones manuales
de aceptación y decisiones municipales ya documentadas; estos gates no se presentan como completos.

## Actualización 2026-09-24: integración efectiva de fases 3–5

La PR #24 fusionó fase 5 en `tasks.md-FASE-3-Maximo` con `3162a20`. La PR #25 fusionó
después T025 en la rama de fase 5 con `b1792a7`, por lo que ese cierre todavía no había llegado
a la rama de integración. La PR #26 llevó el mismo delta de nueve archivos a
`tasks.md-FASE-3-Maximo` con `5125575`; se comprobó que `ad7a810` es ancestro de esa rama.
Quality pasó en las PR #24, #25 y #26. El usuario confirmó que el segundo desarrollador hizo
la revisión; la API de GitHub no muestra revisiones formales en las PR #24 y #25, y este registro
no las atribuye a una aprobación de GitHub.

Las fases 3, 4 y 5 quedan integradas entre sí. Las fases 6 en adelante y las mediciones,
decisiones municipales y validaciones finales del MVP siguen abiertas según `tasks.md` y
`OPEN_QUESTIONS.md`; esta integración no equivale a completar todo el MVP.

## Actualización 2026-09-25: fase 6 de atención presencial asistida

Rama `codex/temp-phase-6-assisted-service`, creada desde `main` actualizado (`8b9ff68`).
T061–T068 implementadas y marcadas. Alta y mantenimiento sin cuenta ni CV, decisiones
explícitas de duplicados, consentimiento y orientación internos, derivación bloqueada sin PDF
y vinculación presencial con correo verificado conservando la ficha y su historial.

Las migraciones `202609190040`–`202609190044` incluyen correcciones forward-only verificadas
para campos no seleccionados, auditoría y autorización de perfiles sin cuenta. Sin nuevas
dependencias, variables de entorno ni datos reales.

Verificación local: 86 pruebas unitarias/componentes, 365 pgTAP, typecheck, lint y build
correctos; Playwright completo con 23 recorridos correctos y 1 omisión ambiental preexistente.
Se revisaron capturas móvil/escritorio y axe en US4. El runtime local es Node 24.16.0/npm
11.13.0; permanece pendiente CI con las versiones exactas fijadas, revisión humana por PR
y la aceptación municipal ya prevista.

La evidencia, alcance, limitaciones y recuperación de migraciones están en
[validación de fase 6](../../docs/validation/phase-6-assisted-service.md).

## Actualización 2026-09-25: fase 7, demostración CSV

Rama `codex/temp-phase-7-csv-import` desde `c1c7547`. Mateo aprobó la excepción
documentada en `docs/import/candidate-import-v1.md`: T070–T078 implementadas para
`demo-candidates-v1`, exclusivamente ficticio. T069/OQ-018 siguen pendientes para
el padrón histórico; no existe aprobación municipal inferida.

Parser, preview protegida, resoluciones explícitas, confirmación SQL atómica,
historial y recuperación por nuevo lote vinculado. Migraciones 050–053 forward-only.
Verificación: 100 unitarias/componentes, 412 pgTAP, tres E2E de importación,
typecheck, lint y build correctos. Node 24.21.0/npm 11.19.0. Revisión móvil y axe;
NVDA/aceptación humana, rendimiento alojado, CI y revisión del compañero pendientes.
Evidencia y límites en [validación de fase 7](../../docs/validation/phase-7-csv-import.md).

## Actualización 2026-09-26: fase 8, seguimiento y métricas

Rama `codex/temp-phase-8-metrics` desde `4f422cf` (PR #30 integrada).
T079–T086 implementadas y marcadas: panel administrativo, filtros temporales y de
categoría, tiempos por oferta, CSV de métricas auditado, cronología de contactos y
plantillas internas sin envío. No se implementaron fases posteriores.

EXTRA-001, autorizado por Mateo y registrado en `cambios-extra.md`, agrega evidencia
temporal mínima con RLS para reconstruir estados anteriores; una instalación
existente no inventa datos previos a la migración. Migraciones 060–061 forward-only.
`AGENTS.md` exige registrar y verificar estos extras sin resolver decisiones abiertas.

Verificación local: 112 pruebas unitarias/componentes, 466 pgTAP, 29 E2E correctos y
una omisión ambiental de recuperación sin Mailpit; typecheck, lint y build correctos.
El proyecto Playwright de métricas precede a los recorridos que mutan el fixture.
Axe y ancho móvil de 360 px correctos. Node 24.21.0/npm 11.19.0.

Pendientes: revisión del segundo desarrollador, CI, aceptación humana alojada,
NVDA y controles de fase 9. No acredita merge ni cierra OQ-005/OQ-018.
Contratos, recuperación y evidencia en
[validación de fase 8](../../docs/validation/phase-8-metrics.md).

## Actualización 2026-09-27: fase 9, avance de controles transversales

Rama `codex/temp-phase-9-quality` desde `27e7b6e` (PR #31 integrada). Fase 9
**parcial**, no lista para aceptación final. Mateo confirmó que no hay demo,
pruebas humanas/NVDA ni revisión del segundo desarrollador de esta fase.

T090/T091 documentadas: README, separación de entornos, recuperación forward-only,
variables y gates con responsable/límite/etapa/evidencia. Protocolos de aceptación,
auditoría, accesibilidad y autorización registran expresamente qué falta verificar.
EXTRA-002 corrige paginación administrativa exigida por el manifiesto: filtro de
estado empresarial, diez filas por página y orden estable con desempate por ID.

Pruebas agregadas: axe por rol en dos viewports al 100%, páginas cruzadas por rol,
sesión suspendida, mutación en vuelo, handlers/CV, paginación, invariantes SQL y
matriz de 28 Server Actions protegidas con sesiones simuladas. No confundir esta
última con reenvíos HTTP ni concurrencia SQL real. No se modificaron migraciones
de producto ni se ampliaron permisos/estados/funcionalidades municipales.

Resultados exactos y T095 en [quality-gates](../../docs/validation/quality-gates.md).
T087/T089/T092 requieren además trabajo y evidencia alojada/humana; T088/T094 aún
necesitan cobertura HTTP y concurrencia exhaustiva; T093, comprobaciones de eventos
y rollback por cada clase; T096, revisión de Máximo. Las casillas incompletas se
conservan sin marcar. No se cerraron OQ ni se hizo merge.

## Actualización 2026-09-29: cierre técnico y demo

Rama `codex/temp-mvp-completion`, desde `481b9f0` (PR #32 integrada).
Limpieza previa de ramas fusionadas completada; main actualizado antes de crear esta
rama. No se implementó directamente en main ni se hizo merge automático.

T088/T093/T094 completadas: acciones compiladas por HTTP con sesión/base reales,
todos los roles suspendidos y handlers, propiedad/NOT_FOUND, dos carreras SQL con
bloqueo observado y 310 aserciones adicionales de auditoría/rollback por clase.
Suite total: 376 Vitest, 855 pgTAP, 57 E2E completos y dos carreras PASS; tipos,
lint y build correctos. Refuerzo posterior de handlers verificado focalizadamente.

Demo Vercel/Supabase creada, protegida y verificada con cuatro roles y Storage.
El reset alojado privado restablece conteos/hash y preserva los 500 PDF verificados.
Callbacks de Auth configurados; no se cambiaron SMTP ni permisos del proyecto.
Detalles y scripts en docs/operations/demo-runbook.md; extras 003–006 rastreables.

91 de 97 tareas marcadas. La fase 9 tiene seis tareas completas y cuatro abiertas.
Permanecen T069 (mapeo municipal), T087 (accesibilidad humana), T089 (tiempos humanos,
con siete casos técnicos alojados correctos), T092 (cohortes/quickstart y
correo alojado), T096 (revisión independiente), T097 (conexión GitHub/Vercel rechazada
por acceso). No se cierran por inferencia. Guía
paso a paso: docs/validation/human-validation-guide.md. PR #33 abierto en borrador;
CI remoto application/database del commit `2974958` PASS, Actions 36596663506.
Convergencia revisó 54 FR/11 SC, seis historias, 13 decisiones técnicas agrupadas y
seis principios; encontró un gap parcial MEDIUM de entrega y agregó T097 en fase 10.
Los gates humanos son externos/no construibles mediante código: no se duplicaron
sus tareas ni se declaró conformidad global. Sin cambios de spec/plan/constitución.
