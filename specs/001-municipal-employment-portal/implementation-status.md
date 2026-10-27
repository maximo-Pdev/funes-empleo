# Estado de implementación — 2026-09-22

**Estado vigente: ver actualizaciones hasta 2026-10-25 al final.** Los apartados previos son
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
correo alojado), T096 (revisión independiente), T097 (acceso GitHub/Vercel resuelto
y enlace/preview Git `0e84bb0` READY con smoke de cuatro roles confirmados;
entrega desde main tras aprobación/merge pendiente). No se cierran por inferencia. Guía
paso a paso: docs/validation/human-validation-guide.md. PR #33 abierto en borrador;
CI remoto application/database del commit `2974958` PASS, Actions 36596663506.
Convergencia revisó 54 FR/11 SC, seis historias, 13 decisiones técnicas agrupadas y
seis principios; encontró un gap parcial MEDIUM de entrega y agregó T097 en fase 10.
Los gates humanos son externos/no construibles mediante código: no se duplicaron
sus tareas ni se declaró conformidad global. Sin cambios de spec/plan/constitución.

## Actualización 2026-10-06: estado vigente y handoff

- Snapshot local de main/origin: `523ee4a`, con frontend PR #33–39 integradas
  según comprobación previa del padre. El borrador PR #33 del 29/09 arriba es
  historia fechada; no se consultó estado remoto nuevo en este paso.
- Commits locales, sin push ni merge: step 1 `46c6c0d` (tests/home), step 2
  `93b76fc` (seguridad/adaptador ESLint), step 3 `5d6a51e` (browser público).
  Este step 4 en `docs/status-handoff` solo reconcilia documentación.
- Evidencia final local del árbol fuente `5d6a51e`: 447 pruebas/26 archivos,
  lint/typecheck/build y audit 0; Chromium focalizado 1/1. Browser público:
  seis rutas × dos tamaños (360×800/1366×768), 12 vistas, axe 0 y overflow 0.
  Fuentes y límites: [calidad](../../docs/validation/quality-gates.md) y
  [accesibilidad](../../docs/validation/accessibility.md), secciones step 3;
  reporte/capturas ignorados en `test-results/public-visual-review-final/`.
- Revisión nativa step 3 `213f13470b861051`: aprobada y reconocida por el padre;
  no equivale a revisión del segundo desarrollador ni aceptación municipal.
- Siguen 91/97 tareas marcadas: T069/T087/T089/T092/T096/T097 abiertas.
  T088/T094 ya estaban cerradas; este handoff no cambia casillas. Fase 9 no completa.
- Constitución 1.0.0 ratificada el 19/09; spec sigue `Draft`, cuya evidencia de
  aprobación debe reconciliar su propietario. OQ-010/OQ-011 siguen abiertas:
  traducciones legacy de presentación no deciden el catálogo ni campos oficiales.
- No hay suite privada/DB completa actual, envío de formularios Auth, NVDA,
  zoom real ni aceptación humana acreditados. Node global 24.16/npm 11.13
  no cambió; se usó temporalmente Node 24.21/npm 11.19 exactos.

Próximo paso: verificación documental independiente; después, coordinar las tareas
abiertas y follow-ups con superficies disjuntas, sin asignar propietarios por inferencia.
No se afirma publicación desde main, producción ni aprobación de artefactos.

## Incremento A02/A03, 2026-10-17: sesión y navegación

Rama `feat/session-persistence-profile-navigation`, desde el merge del PR #52
(`da21597`). Mateo autoriza continuar este bloque. El proxy renueva en páginas
y handlers dinámicos y conserva cookies/opciones y cabeceras de no caché entre
escrituras. Login/logout invalidan layout. Inicio/listado/detalle públicos muestran
el perfil de candidato o empresa activos, la cuenta de administración o login,
consultando identidad y cuenta en servidor sin enviar PII a la navegación.
No se alteran RLS, guards, vencimientos, cierres de seguridad ni modelo persistido.

RED 18 FAIL/26 PASS; GREEN focalizado 52/52. Regresión 559 pruebas/35 archivos y
tooling 57/57 PASS; typecheck/lint/build PASS. Supabase local existente, sin reset:
Chromium 10/10 PASS; seis escenarios por rol de renovación, navegación, recarga y
logout, tres de contraseñas y smoke público. Los seis de sesión se repiten con
reutilización de cookies en otra pestaña después del logout: 6/6 PASS, sin acceso.
Docker se inició y conserva sus servicios; servidor Next de pruebas terminado.

T102–T105 verificadas localmente: ledger 99/105 marcado y seis gates históricos
abiertos. Entrega por PR desde `feat/session-persistence-profile-navigation`;
CI completo/pgTAP, revisión del
compañero y aceptación humana pendientes. Detalle en matriz y EXTRA-019.
No se ratifica retrospectivamente el Draft global.

PR #53, commit inicial `af7b9aa`: Quality #86 (`39065451675`) aprobó typecheck,
lint, tooling, cobertura, build y pgTAP (858 pruebas); database PASS. Application
falló en un E2E que comparaba literalmente `private, no-store` con las directivas
adicionales del proxy: 2 PASS, 1 FAIL y 64 sin ejecutar por dependencia.
Corrección focalizada en el mismo PR: comparar tokens completos `private` y
`no-store` y rechazar `public`, manteniendo 403 y ausencia de contenido sensible
para anónimo y empresa. RED local reproducido y GREEN 1/1 sin reset ni cambios
de producto. La nueva ejecución completa de CI y revisión humana siguen pendientes;
detalle en la continuación de EXTRA-019.

A01 ya fue integrado por PR #52: Quality #84 (`39056857381`) aprobó application
y database para `5d8cdfb`, 61 E2E completos sin omisiones/fallos/inestables y
concurrencia SQL. Esto complementa la evidencia local histórica siguiente y no
acredita revisión humana ni cierra los gates de aceptación externos.

## Incremento A01, 2026-10-17: registro y controles de contraseña

Mateo autorizó comenzar los arreglos en `feat/portal-functional-adjustments`.
Decisiones, criterios y pendientes compartidos:
`docs/implementation/functional-adjustments.md`. A01/T098–T101 agrega confirmación
obligatoria en ambos registros, validación independiente previa a Auth y controles
de mostrar/ocultar en registro, ingreso y actualización, con validez nativa que
evita perder datos ante discordancia. La confirmación no se persiste ni se envía
a Auth/metadata. Sin dependencias, migraciones ni cambios de permisos.

Verificación local final: 520 pruebas/32 archivos PASS, typecheck/lint/build PASS,
Chromium focalizado 3/3 PASS con teclado, bypass de validez nativa y axe sin
violaciones en ambos registros, sin desbordes a 360×800. Transporte Auth simulado
en unitarias; no se ejecutaron los recorridos completos de alta con correo/DB,
pgTAP ni el cambio de contraseña autenticado en navegador. Evidencia y límites
en la matriz y EXTRA-018. Entrega mediante el PR de
`feat/portal-functional-adjustments`; revisión del compañero pendiente.

T098–T101 se marcan por implementación/verificación; no acreditan revisión del
compañero, aprobación global del Draft ni aceptación municipal. La base histórica
de 91/97 tareas y sus seis pendientes continúa según la conciliación siguiente;
el ledger ampliado suma 95/101 marcadas, manteniendo esos seis pendientes.

## Actualización 2026-10-17: conciliación informada por Mateo

- Mateo informa que T087, T089 y T092 se ejecutaron y sus resultados están documentados.
  Los artefactos rastreados disponibles al sincronizar contradicen ese estado: `accessibility.md`
  mantiene pendientes la matriz manual completa, el zoom real al 200 % y NVDA; `performance.md`
  mantiene pendientes los tiempos humanos de SC-003/SC-008; y `quickstart-results.md` mantiene
  pendientes los resultados humanos y cohortes. Por ello las casillas siguen abiertas y el total
  respaldado por los artefactos del repositorio sigue en 91/97. Reconciliar los recibos/resultados
  con esos artefactos antes de cambiar las casillas; esta nota no descarta el reporte de Mateo.
- T069 continúa abierta: Mateo no sabe todavía si estará disponible la estructura anonimizada del
  libro y el mapeo aprobado. No inferir columnas ni cerrar la importación histórica sin esa evidencia.
- T096 continúa pendiente de la revisión independiente del segundo desarrollador.
- T097 continúa pendiente de verificación con el compañero que controla la cuenta de Vercel y de
  confirmar la publicación del destino demo desde `main` después de la revisión y fusión. El preview
  READY y su smoke previo no prueban por sí solos ese paso final.
- Esta actualización registra el estado comunicado en la conversación y la discrepancia documental;
  no acredita nuevos resultados, aceptación humana, publicación ni revisión.

## A07 / FR-024B — búsqueda pública, 2026-10-19

Main actualizado `43b94a7` integra la solución de slugs de Máximo (PR #55/#56/#57),
no el PR #54 descartado. Rama `feat/public-offer-search`: cuatro filtros públicos,
formulario GET, paginación persistente, limpiar, vacío y validación segura. Filtros
se aplican en SQL antes de contar/paginar; opciones solo de ofertas públicas.
La vista privada invocadora con barrera centraliza los mismos predicados; RPC
anterior y slug conservan contrato. Sin tablas/backfill, Auth o estados nuevos.
No se implementan A04 privado/A05/A06/A08; A07 es independiente de esas tareas.

Evidencia: RED10 FAIL/4 PASS; final603 unitarias/componentes/39 archivos y tooling57,
tipos/lint/build PASS. SQL final951/14 archivos, incluidas38 nuevas y la defensa
invoker/barrier. CI completo se acredita por el SHA del PR. Navegador9/9
(tres A07 y seis sesiones), teclado y axe sin violaciones,
sin overflow360×800. Colección70/17 no equivale a ejecución local completa.
El primer SQL072 se solapó con logins de navegador y falló dos snapshots; repetido
solo y sin cambiar SQL aprobó todo. No se quitaron controles ni se reseteó la base.

Local: Node24.22/npm11.19.1 portable con SHA verificado y global intacto. CLI no
pudo aplicar por el residuo local descartado `20261017204435`; se conservaron
su registro/columnas. Se instalaron transaccionalmente solo SQL integrado de
slugs y A07, reemplazando la RPC descartada en conflicto tras precondiciones.
Versiones/fechas de ofertas conservaron checksum. Se registraron applied solo
tras éxito. No se cambió SQL del compañero ni se reintrodujo el PR descartado.
Pruebas SQL usan rollback, sesiones solo ficticias locales; Docker activo y
Next de pruebas finalizado, sin cambios alojados ni nuevos archivos env.

T106–T110 implementadas/verificadas localmente; ledger T001–T110104/110, seis gates
históricos pendientes. FR-024A conserva ledger separado. Revisión independiente
y aceptación humana no se infieren; CI completo del SHA se acredita en el PR.
Aplicar `20261019124218_public_offer_search.sql` antes de desplegar o validar
preview en DB compartida; procedimiento en `docs/operations/public-offer-search.md`.

## A08 — rubros y coincidencias municipales (2026-10-19)

Base main `efdeff2` (PR59 y PR60 integrados). Rama `feat/job-categories-matching`.
Quince rubros nuevos en catálogo v2, categorías/referencias anteriores intactas
sin mapeos inferidos. Multiselección existente sin duplicar catálogo en UI.
RPC administrativa con actor/sesión vigente, OR de ocupaciones/intereses activos,
aptitud de derivación, empresa/oferta vigentes, orden por nombre/ID y total antes
de página. No ranking ni nominaciones/derivaciones al consultar. Participaciones
existentes llevan a evaluación, perfiles sin participación a nominación manual.

T111–T115 implementadas/verificadas localmente; ledger109/115 sin cerrar seis
gates históricos ni ledger independiente FR-024A. Checklists16/16 y77/77 intactas.
Constitución/spec/plan/modelo/contrato y EXTRA-024 sincronizados; OQ-010 precisa
aprobación del catálogo amplio, sin resolver equivalencias/ocupaciones históricas.

RED SQL (catálogo/RPC ausentes) observado. GREEN:655 unitarias/componentes/42
archivos, tooling57, tipos/lint/build PASS; pgTAP986/15 (35 nuevas), advisor
security sin hallazgos. Navegador12/12 (A08×3, A07×3, sesión×6), teclado y axe
sin violaciones en bloque, sin overflow360×800. Colección73/18; no ejecución
completa. Cobertura configurada100% de env/schema, no de toda la funcionalidad.

Migración20261019203041 aplicada transaccionalmente/registrada solo en Docker
local, sin reset ni modificaciones de historiales previos. No cambios alojados,
dependencias o env persistidos. Se conserva Docker; servidor de prueba finalizado.
Runbook: `docs/operations/job-category-matching.md`. CI completo, commit/PR,
revisión independiente y aceptación pendientes; no se acredita producción municipal.

Predecesor A07: Mateo aportó resultado exitoso de ejecución, verificación JSON,
registro applied de20261019124218 y funcionamiento local contra la base alojada.
Runbook A07 distingue esta operación del operador de la entrega original del agente;
no se reinspeccionó remotamente, no acredita Vercel ni sanea la historia divergente.

### Ampliación A08 — perfil modal y nominación desde la oferta

Solicitud explícita de Mateo del2026-10-19; EXTRA-025 y T116–T120. Sustituye el
comportamiento inicial de mostrar participaciones previas: ahora todo caso no
archivado se excluye antes del conteo/paginación, con el mismo pool de elegibilidad
para listado y preview. Perfil laboral/CV mínimo bajo demanda, dos columnas,
doce fichas/página y nominación exclusivamente a la oferta actual. Éxito cierra,
retira y actualiza sin redirección ni derivación/acceso empresarial automáticos.
Roles, comando transaccional de nominación y catálogo original no se alteran.

689 unitarias/componentes/43 archivos, tooling57, tipos/lint/build PASS.
pgTAP1007/16 archivos (21 nuevos, matching35 actualizado), advisor sin hallazgos;
ejecutados antes de Auth/navegador. Navegador13/13 (A08×4, A07×3, sesiones×6),
HTTP8/8 del inventario privado completo PASS. Axe modal/bloque sin violaciones,
desktop dos columnas y móvil360×800 sin overflow, foco/Escape y nominación real
persistida comprobados. Colección74/18; no ejecución E2E completa ni nuevo CI.
La nominación deja un caso ficticio local adicional y su auditoría (1001 total),
sin nuevas derivaciones: no se borró ni reseteó para recuperar el fixture original.

`20261019205940_opening_candidate_preview.sql` aplicada/registrada solo Docker
local. Primera A08 `20261019203041` alojada según SQL/registro que aportó Mateo;
no repetirla ni editarla. La ampliación modal sigue pendiente allí antes de app.
Sin cambios persistentes de entorno, dependencias o permisos empresariales.
Ledger114/120: seis gates históricos permanecen abiertos; commit/PR, CI completo,
revisión independiente, despliegue y aceptación no se acreditan con pruebas locales.

Entrega posterior: `11be483` en [PR61](https://github.com/maximo-Pdev/funes-empleo/pull/61),
abierto contra main; PR60 ya estaba mergeado y no había PR A08 previo. Incluye
el ajuste EXTRA026: candidatos debajo de información/historial, nueva regresión
de orden DOM; final690/43 archivos, tipos/lint y build PASS. Se conserva el dev
activo sin detenerlo y next-env generado fuera del commit. CI del nuevo SHA y
revisión/aceptación pendientes; no implica merge ni despliegue.

## Actualización — formularios, 2026-10-20

Rama `codex/fix-registration-verification`, base main6607854 (PR61 mergeado al
iniciar la rama). Mateo solicita asteriscos rojos, error junto a cada campo,
bordes rojos y conservación ante fallos en todos los formularios. EXTRA028,
matriz A18 y T121–T125 registran el incremento; spec/plan/contrato alineados.

Form/Field compartidos integran 40 usos en 29 archivos, incluidas primitivas,
grupos alternativos, confirmaciones, períodos y requisitos dinámicos. No hay
forms/labels nativos aislados ni controles visibles sin Field según inventario AST.
Se bloquea el reset automático de React Actions fallidas; las respuestas públicas
no enumerativas conservan datos incluso ante supuesto éxito. Conflictos no
recargan y descartan ediciones. CV usa JSON opt-in sin navegar en error, conserva
303 para otros clientes y espera versión actualizada antes de anunciar éxito.
No cambia validación servidor, RLS, permisos, estados o límites de archivos.

Resultados locales:729 unitarias/componentes en49 archivos y tooling57 PASS;
tipos/lint/build PASS. Navegador20/20 y HTTP privado8/8 aislado PASS; incluyen
altas verificadas de candidato/empresa con buzón local, perfiles/ofertas,
moderación, sesiones, CSV/PDF rechazados sin pérdida, carga válida/activación
con respuesta RSC deliberadamente demorada y filtros. Axe/teclado/foco y
responsive360×800 comprobados; un selector verifica ancho completo de textarea.
No es la suite E2E completa ni prueba humana NVDA/aceptación. Respetar el orden
de proyectos: ejecutar HTTP junto con flujos que mutan auditoría produjo
interferencia en contadores; la ejecución aislada pasa sin modificar aserciones.

Sin migración, dependencias o entorno persistido nuevos; pruebas contra Docker
local sin reset, con identidades/casos/auditoría ficticios adicionales. Se mantiene
Docker y la modificación previa de next-env; no se hizo commit/PR para este ajuste.
Seis gates históricos, CI nuevo, revisión independiente, despliegue y aceptación
siguen pendientes. Guía: `docs/product/form-validation.md`.

El ajuste operativo previo EXTRA027 ya actualizó Site URL/callbacks de Supabase,
según `docs/operations/registration-verification.md`. Este incremento de formularios
no cambia el entorno alojado ni habilita SMTP. Proveedor y remitente propios
siguen pendientes: la confirmación genérica no acredita envío de correo público.

### Registros compactos y simétricos — 2026-10-20

Solicitud de Mateo, EXTRA029 y T126–T128: layout servidor común a candidato y
empresa, tarjetas de igual ancho/alto en escritorio, controles44px y separación
compacta. La ayuda de correo se integra en la tarjeta. Sin alterar los formularios
funcionales, avisos municipales, validación, acciones, autenticación ni permisos.
Móvil/errores/zoom pueden extender el documento; no se oculta contenido ni hay
scroll interno para simular encaje.

732 unitarias/componentes en50 archivos, tipos/lint/build PASS. Navegador6/6:
medidas simétricas y sin scroll inicial1920×1080 y1920×960, controles≥44px,
móvil360×800/reflow960×540 sin overflow horizontal, errores completos, teclado
y axe sin violaciones. Capturas vacías de ambos registros revisadas visualmente.
No acredita zoom real200%, NVDA ni alta/envío Auth repetidos en este ajuste.
Servidor de prueba propio3001 separado del servidor existente3000; sin cambios
alojados, altas, correos, reset, migración o dependencias. Próxima entrega/revisión
mediante PR pendientes; los seis gates históricos se conservan abiertos.
Guía actualizada: `docs/product/auth-frontend.md`.

Ampliación EXTRA030/T129: navegación “Soy postulante”/“Soy empresa” en la fila
superior, activa con aria-current, sin enviar formularios ni compartir datos
entre roles. Mateo la autoriza2026-10-20. Regresiones focalizadas3/3 y navegador7/7,
tipos/lint/build PASS; ida/vuelta sin POST, simetría/encaje y accesibilidad intactos.
No se repite suite completa ni Auth con alta/envío; sin cambios de datos o entorno
alojado. Commit/PR, revisión, CI y aceptación global pendientes.

Ampliación EXTRA031/T130: login compacto con tarjeta de registro de ancho completo
arriba y dos tarjetas principales iguales; estilos locales reutilizados de los
registros con variante de credenciales en una columna. AuthForm, acciones y reglas
no se alteran.735 unitarias/componentes/51 archivos, tipos/lint/build PASS;
navegador11/11 (login4+registros7), simetría/no scroll1920×1080/960, móvil/reflow,
errores/retención, teclado, enlaces y axe PASS. Captura vacía revisada; pruebas en
3001 sin alta/envío o cambios alojados. Sin migración/dependencias, nueva aceptación,
CI o revisión independiente acreditados; no es suite E2E completa/NVDA/zoom real.

Refinamiento EXTRA032/T131: tarjetas del login estiradas por igual para aprovechar
la altura disponible en escritorio, sin fijar alturas o recortar contenido.735
tests/51 archivos, tipos/lint/build y navegador11/11 PASS: crecimiento1080/960,
sin scroll inicial, móvil/reflow/escritorio bajo, teclado/axe y regresión de
registros/errores/retención. Captura revisada. Solo presentación; sin reset,
alta/envío o cambios alojados. Revisión/CI/aceptación y gates previos pendientes;
no acredita suite E2E privada, NVDA ni zoom real.

EXTRA033/T132 sustituye la disposición/estiramiento de EXTRA031/032 por el esquema
de Mateo y su refinamiento: información a la izquierda, registro sobre ingreso a
la derecha y conjunto compacto centrado, sin crecer para llenar el viewport.735
tests/51 archivos, tipos/lint/build y navegador11/11 PASS: alineación/centrado y
alturas estables1080/960 sin scroll, móvil/reflow/escritorio bajo, errores/retención,
teclado/axe/enlaces y registros. Captura revisada. Solo presentación, sin reset,
altas/envíos, cambios alojados, migraciones o dependencias. Sin nueva revisión/CI/
aceptación/gates cerrados ni suite privada/HTTP/NVDA/zoom real repetidos.

## Preparación de entrega — 2026-10-20

Mateo solicita crear el PR de `codex/fix-registration-verification`, desde main
6607854 (PR61 mergeado). Incluye EXTRA027–033: diagnóstico/destino de verificación,
validación compartida y retención de datos, carga de CV sin pérdida ante error,
registros compactos con navegación entre roles y disposición compacta/centrada
del login. El SMTP/remitente continúa pendiente; no se declara resuelto el correo
público general. Sin SQL, dependencias, nuevas variables o cambios de permisos.

Verificación final adicional: tooling57/57 y test:coverage735 tests/51 archivos
PASS; la cobertura configurada solo mide el módulo seleccionado por el proyecto,
no implica cobertura100% de toda la aplicación. Tipos/lint/build y navegador11/11
del último ajuste PASS; la evidencia de recorridos privados/HTTP anteriores está
en EXTRA028. No se reseteó la base ni repitió la suite E2E completa en esta entrega.
`next-env.d.ts` conserva su cambio local generado y se excluye del commit.
Commit funcional: `1b93a9f` (`feat(forms): improve validation and registration experience`).
Entrega: [PR #62](https://github.com/maximo-Pdev/funes-empleo/pull/62), abierto
hacia `main` con EXTRA027–033 y sin merge. CI y revisión independiente pendientes;
no acredita aceptación global ni cierre de los seis gates históricos.

## Corrección del check application de PR62 — 2026-10-20

EXTRA034/T133: Quality117 (run39525712466) falla por una expectativa E2E antigua
del retiro administrativo: Form ahora bloquea el selector requerido y muestra el
error junto a él, antes del mensaje general previo.94 E2E pasan,1 falla y1 no
corre; database, tipos/lint/tooling/cobertura y build pasan en ese run.

Se ajusta solo el contrato esperado por tests: error asociado al selector/foco,
motivo retenido y estado aún Derivada; luego se registra contacto y se verifica
el retiro. Nuevo test de componente prueba callback bloqueado sin evidencia,
filtrado de contacto saliente y payload correcto al elegir contacto entrante.
Componentes11/11, suite/cobertura736 tests/51 archivos, tipos/lint/diff-check
PASS local. Sin cambios de aplicación, DB o entorno ni reset local; ejecución
completa del CI corregido pendiente. No relaja la evidencia de retiro requerida.

## Contratación y retiro global — 2026-10-21

Mateo confirma el alcance global (OQ-020/EXTRA035), descartando la alternativa de
solo matching. Trabajo desde main15ec4e7, PR62 ya mergeado, en
`codex/feat-withdraw-consent-on-hire`; rama anterior eliminada y cambio local de
`next-env.d.ts` preservado. No hay commit/PR nuevo ni despliegue alojado.

Confirmar `hire` o `late_hire` agrega el retiro si corresponde, con admin, fecha,
fuente restringida, política/hash y auditoría/causa enlazada al caso. Revoca todos
los permisos activos sin cambiar otros casos/versiones/resultados. Una única
transacción y bloqueo candidato primero; no se usa el retiro manual que cierra
otros casos. Confirmación tardía no restaura accesos y la empresa no confirma por
sí sola una contratación. Reaceptar requiere acción afirmativa y tampoco restaura
permisos. Sin backfill: soporte720h/Cron permanece solo para permisos históricos.

T134–T138 implementadas/verificadas localmente. Migraciones nuevas
20261021220623/20261021221414 (EXTRA036: default de fecha efectiva) aplicadas solo
localmente. Servidor conserva firma/RPC/grants, invalida vistas tras éxito; no hay
dependencias, nuevas variables ni cambios de UI. Rollout/recuperación y comandos
seguros en `docs/validation/hiring-consent.md`.

| Verificación | Evidencia local |
| --- | --- |
| SQL específico | RED22/37 contra implementación anterior; final55/55 PASS. |
| SQL completo | 17 archivos/1062 pruebas PASS, Supabase efímero con fixture ficticio limpio, sin reset de la base original. |
| Unitarias/componentes/integración y cobertura | 52 archivos/741 tests PASS; incluye5 nuevos de servicio. Cobertura configurada limitada a env/schema. |
| Tooling | 57/57 PASS. |
| Tipos/lint/build | PASS con Node24.22.0 y destinos locales, sin editar .env.local. |
| Navegador | 13/13 PASS: normal/tardía, bloqueo entre conexiones, retiro/permisos/CV y otros casos intactos; once regresiones login/registro. |
| Seguridad | Advisor local aislado sin warn/error; grants, roles negativos, acceso a CV/perfil, append-only y rollback auditados en SQL. |
| Integridad de cambios | diff-check PASS; sin datos reales/secretos. next-env local excluido del cambio funcional. |

Se preservó la discrepancia histórica local20261017204435 sin reparar ni eliminar
versiones. Las suites010/072 inicialmente fallaron sobre ofertas ya modificadas
del fixture usado; la suite limpia aislada completa pasa. La cobertura inicialmente
en sandbox falló por ENOENT de archivos temporales del runner; repetición fuera de
ese sandbox pasa sin cambios funcionales. Fixtures E2E nuevos son ficticios y no
borran datos existentes.

### Análisis y convergencia acotados

Secuencia aplicada: clarificar alcance → alinear spec → diseño/plan/modelo/
contratos → checklist de requisitos10/10 → tareas → análisis previo → implementar
→ verificar → convergencia acotada. La autorización expresa de Mateo cubre este
cambio; no equivale a revisión independiente ni aprobación municipal/legal.

FR-036/038 y conservación de otros casos se trazan a T135/136 y SQL024; servidor/
invalidation a T137 y5 unitarias; atomicidad/roles/CV/lock/aceptación a T138 y SQL/
E2E. EXTRA036 queda cubierto por aceptación posterior en la misma transacción.
Reanálisis armoniza referencias operativas antiguas a720h como históricas y
mantiene los antecedentes de decisión. Sin nuevos conflictos de arquitectura o
constitución ni tareas construibles faltantes dentro de T134–138; no se genera
una fase de convergencia vacía ni se marca completa la convergencia global.

Límites: no se ejecutó la suite E2E completa ni NVDA/aceptación con personas;
sin CI, revisión humana o validación alojada de este cambio. Despliegue compartido
de ambas migraciones y revisión mediante PR siguen pendientes. Los seis gates
históricos del producto permanecen abiertos; OQ-001 no se resuelve con este cambio.

### Aplicación alojada posterior — EXTRA037, 2026-10-21

Mateo solicita expresamente aplicar las migraciones. CLI autenticado confirma
proyecto Funes-empleo/kyjycjojzhwggjuqjnki, función base sin cambios concurrentes
y versiones nuevas ausentes. Se guardan definiciones previas de función/grants/
constraints/default sin datos personales en test-results ignorado. El dry-run
confirma el desfase histórico de timestamps; no se repara ni repite esa historia.

Se aplican exclusivamente20261021220623/20261021221414 por db query --linked,
en una transacción común con guardia de cuerpo previo y límites de espera,
registrando las versiones/SQL originales en la misma transacción. Verificación
posterior PASS: cuerpo de función igual al archivo, hashes del SQL registrado,
ambos constraints/default clock_timestamp(), firma/grants/search_path y hash
de toda la historia anterior sin cambios. Advisor remoto52 WARN antes/después,
cero nuevos; no confundirlo con la instancia local aislada sin hallazgos.

Esto reemplaza el pendiente de rollout SQL anterior. Aplica a futuras
confirmaciones normales/tardías; no se ejecutaron contrataciones, backfill,
fixtures, E2E ni pgTAP alojados. No cambia código/variables/secretos ni acredita
despliegue de aplicación, nuevo CI, PR, revisión o aceptación. Las verificaciones
funcionales locales previas siguen siendo la evidencia de los recorridos.

### Entrega mediante PR — 2026-10-21

Solicitud de Mateo: commit funcional28c6a25 en
codex/feat-withdraw-consent-on-hire, publicado en
[PR63](https://github.com/maximo-Pdev/funes-empleo/pull/63) hacia main15ec4e7.
Abierto sin merge; incluye migraciones ya aplicadas, pruebas y EXTRA035–037.
next-env.d.ts permanece como cambio local fuera del commit. Evidencia de calidad
anterior conservada; entrega documental adicional con diff-check PASS. CI,
revisión independiente y aceptación siguen pendientes, sin cerrar otros gates.

### Corrección de application en PR63 — EXTRA038, 2026-10-21

Quality121/run39688659768: database PASS, application falla solo por dos E2E de
matching,95 pasan y1 no corre. Las ofertas aleatorias creadas por contratación
copiaban published sin categorías y el selector de matching podía elegirlas.
No se modifica el matching real ni el retiro global: solo fixtures en paused,
aserción explícita de que no son públicos y selector de prueba con categorías.
Mantiene12 tarjetas, paginación/modal/nominación y todas las comprobaciones de
contratación, evidencia, revocación, atomicidad y otras participaciones intactas.

Regresión de aislamiento RED0 esperado/2 recibidas; GREEN y navegador6/6 PASS
en orden contratación→matching. Cobertura741/52, tooling57, tipos/lint/build y
diff-check PASS; base local preservada sin reset, sin repetir SQL alojado ni
migraciones. next-env.d.ts conserva su cambio local fuera del commit. Nueva
ejecución completa CI en el mismo PR y revisión humana pendientes; no se relajan
gates ni se declara resuelto el backlog del producto.

## Retiro de autoarchivo en perfiles — EXTRA039, 2026-10-22

Mateo solicita quitar archivar/eliminar cuenta en candidatos y empresas. Se
confirma PR63 mergeado (a75bfc8) y Quality122 PASS con98 E2E; main actualizado,
anterior rama borrada local/remoto y nueva codex/feat-remove-profile-self-archival.
Se conserva el cambio local next-env.d.ts sin incluirlo en el cambio funcional.

Desaparecen tarjetas de ambos perfiles y Mi cuenta y se retiran Actions, estado,
props y validador exclusivos. Servicio común exige admin antes de RPC. Migración
20261022202940 reemplaza solo wrapper público con sesión/cuenta activa/admin,
manteniendo firma/grants y comando privado serializado/auditado. Aplicada solo
localmente, sin modificar SQL anterior o datos alojados. El archivo empresarial
administrativo y restauración siguen; no se agrega archivo administrativo
candidato, antes rechazado por el privado. Se preparan archivos candidatos
legados solo como fixtures de DB propietaria para probar restauración histórica.

No cambia edición, activación, disponibilidad, consentimiento, participaciones,
contraseña/logout ni archivo/cancelación de ofertas propias. No borra eventos,
perfiles, cuentas o registros archivados, ni inventa otra política/canal legal.

| Verificación local | Resultado |
| --- | --- |
| Regresiones RED | UI/servidor7/33 fallan contra flujo previo; SQL10/12 fallan al permitir autoarchivo. |
| Unitarias/componentes/integración y cobertura | 730/53 PASS; elimina solo casos de Actions retiradas y agrega guardias por rol. Cobertura configurada limitada a env/schema. |
| SQL completo aislado | 18 archivos/1072 PASS; incluye14 nuevos de rechazo/snapshot y no ampliación del archivo candidato. |
| Navegador/HTTP | 12/12 PASS: HTTP real8, registro/perfil/postulaciones/archivo legado/restauración candidata y gestión empresarial3. |
| Tipos/lint/tooling/build | PASS, tooling57/57. |
| Seguridad e integridad | Advisor local aislado sin warn/error y diff-check PASS; grants/rol/versión/auditoría/rollback conservados. |

Prerrequisitos locales encontrados y documentados: títulos duplicados de ofertas
ficticias previas, selección exacta sin reset; entrada del textarea con foco y
selección por teclado para sustituir el valor tras navegar. Inventario Form38
tras retirar tres usos, manteniendo escaneo estricto de campos/componentes.
React sin hooks condicionales ni estado/props nuevos; mantiene validación/foco y
las comprobaciones axe de los recorridos existentes.

Análisis/convergencia acotados T140–143: alcance/contratos y comportamiento
coherentes, sin nueva arquitectura/permiso candidato o gaps construibles en el
incremento. No acredita revisión independiente, suite E2E completa, CI nuevo,
NVDA, aceptación ni cierre de gates históricos. Instancia SQL efímera y servidor
propio cerrados; base original preservada sin reset, fixtures nuevos ficticios.
Commit70ae1ea publicado en PR64 (abierto, sin merge):
https://github.com/maximo-Pdev/funes-empleo/pull/64.
CI y revisión pendientes. Pendiente aplicar20261022202940 en Supabase compartido antes
de desplegar app; guía docs/validation/profile-self-archival.md. OQ-001/002 abiertos.

## Perfil candidato: consentimiento y activación — EXTRA040, 2026-10-22

PR64 confirmado mergeado en5b15b24. main actualizado y nueva rama
codex/feat-candidate-consent-activation-ui; anterior borrada local/remoto.
next-env.d.ts preexistente preservado fuera del incremento.

Primera tarjeta con estado/vigencia. active muestra Perfil activo sin botón;
draft/needs_update/unavailable/consent_withdrawn muestran Activar perfil solo con
localidad/resumen/categoría, disponibilidad available, consentimiento accepted
y CV válido guardados. Incompletos enumeran pasos; archived/desconocidos no
ofrecen activación. Predicado visual derivado del RPC vigente, sin modificar
servidor/DB ni sustituir sus controles de concurrencia, propiedad y sesión.

Consentimiento explica uso laboral por la Oficina, acceso empresarial solo tras
derivación y exclusión de DNI/domicilio/notas internas. Contratación normal o
tardía confirmada retira el global y revoca todos los accesos dependientes, sin
alterar otros casos/finales. Corregir resultado no reconsiente; nueva aceptación
afirmativa no revive accesos. Retiro manual diferenciado y política demo íntegra
con advertencia de no aprobación municipal. No se decide otra retención/uso legal.

CSS local semántico y tarjetas de ancho completo evitan estirar contacto junto
al aviso; datos laborales mantienen dos columnas internas en escritorio y una
en móvil. Sin reordenamiento visual distinto del DOM. Guía:
docs/product/candidate-profile-presentation.md.

| Verificación local | Resultado |
| --- | --- |
| RED/GREEN focal | Presentación15/15 RED; tres archivos candidatos28/28 GREEN. Una importación temporal de Vitest en sandbox se resolvió ejecutando fuera, sin modificar tests/configuración para ocultarla. |
| Unitarias/componentes/integración/cobertura | 745/54 PASS; cobertura configurada solo env/schema, no toda la app. |
| Tooling, tipos, lint y build | 57/57 y PASS. |
| Navegador final | 12/12 PASS, sin reintentos: candidato1, formularios9 y contrataciones normal/tardía2. |
| Presentación/accesibilidad | Orden y teclado de activación, indicador, ancho de tarjetas, móvil360×800/escritorio1920×1080, axe y sin overflow PASS; capturas ficticias revisadas visualmente. |
| Integridad | Diff-check PASS; sin servidor/DB/migración/contratos nuevos ni cambios alojados. Base local conservada sin reset. |

T144–147 completos para el alcance solicitado; análisis acotado sin gaps nuevos
construibles o conflictos de constitución. Checklists existentes sin cambios,
no acredita revisión independiente o aceptación municipal. Servidor next dev
cerrado con autorización de Mateo para las pruebas; servidor de pruebas cerrado
al terminar, next-env.d.ts ajeno restaurado. Sin commit/PR nuevo, CI, suite E2E/SQL
completa o NVDA en este incremento. El rollout de EXTRA039 no se ejecuta aquí y
OQ-001/002 siguen abiertas; no hay una decisión nueva pendiente para esta interfaz.

### Reorganización de tarjetas — EXTRA041, 2026-10-22

Rama actual feat/candidate-consent-activation-ui: renombrada sin prefijo codex
por pedido de Mateo, quien también pide commits sin firmas ni atribuciones
automáticas. Sin commit/PR todavía; modificaciones EXTRA040 y next-env.d.ts ajeno
preservados.

Teléfono opcional dentro de Datos laborales y personales, sin tarjeta/título
Contacto adicional. Guardar teléfono conserva comando/versión/formulario propio,
hermano del formulario de datos en una única tarjeta, sin anidarlos ni simular
guardado atómico de dos operaciones distintas. CV queda antes del consentimiento.
Cartel amarillo retirado de la vista inicial; texto literal, versión y advertencia
demo consultables en Ver política de consentimiento, desplegable cerrado con
acceso por teclado. Sin cambiar política/hash, autorización o regla de negocio.

RED2/16 y GREEN29/29 focales;746 pruebas/54 archivos, tooling57/57, tipos/lint/build
y diff-check PASS. Navegador11/11 sin reintentos: recorrido candidato, formularios9
y prueba existente de snapshot/contactos/retiro y reaceptación. Rechazo de teléfono
inválido, persistencia/relectura, vaciado opcional y conservación de correcciones
no guardadas PASS. Empresa derivada ve contacto nuevo, mantiene CV vinculado y no
recupera acceso tras retiro/reaceptación. Revisión visual de captura sintética,
móvil/escritorio, teclado y axe; sin aprobación humana o NVDA inferidas.

Guía docs/product/candidate-profile-presentation.md actualizada. Sin migración,
backend, dependencias, reset local o cambios alojados. El fixture15 se comprobó
apto antes de ejecutar su recorrido existente; sin restablecer casos previos.
Servidor de desarrollo cerrado con permiso explícito para probar, servidores de
prueba finalizados y next-env.d.ts preexistente restaurado. No acredita CI, suite
E2E/SQL completa, aceptación o cierre de OQ-001/002. No cambia el carácter demo de
la política ni habilita datos reales por quitar su cartel inicial.

Entrega solicitada por Mateo: commitc228d2c publicado sin firma ni atribución
automática en PR65, abierto hacia main desde feat/candidate-consent-activation-ui:
https://github.com/maximo-Pdev/funes-empleo/pull/65.
next-env.d.ts ajeno excluido. Sin nuevas migraciones/cambios alojados, CI y
revisión pendientes; sin merge o aceptación acreditados.

### Español transversal — EXTRA051, 2026-10-22

PR65 confirmado mergeado en23ba5fa; main actualizado, rama anterior retirada
local/remota y rama feat/spanish-interface-labels creada sin prefijo codex.
next-env.d.ts ajeno conservado; no se crea commit/PR en esta solicitud.

Etiquetas españolas compartidas para cuentas/perfiles/ofertas/participaciones,
consentimiento/accesos/CV/importaciones, acciones/motivos/canales/entrevistas y
respuestas empresariales. Filtros y formularios muestran español pero conservan
valores técnicos. Editor empresarial muestra modalidades/contratos legados sin
reescribir el original al guardar otro campo. FileInput español con input real,
Field, validación/foco y retención de archivos; importación da error de transporte
español sin mostrar excepciones del navegador. Mensajes de corrección y registro
traducidos sin modificar reglas. Texto libre/archivos/CSV técnico no se traducen.

| Verificación final | Evidencia local |
| --- | --- |
| Tipos/lint/build | PASS con Node24 y Supabase local. |
| Pruebas/componentes/inventario | 764/764,58 archivos; enums, auditoría, fallbacks, FormData legado, selector y error de red. |
| Tooling | 57/57 PASS. |
| Navegador | 18/18 PASS sin reintentos: español4,candidato1,ofertas3,validación9,filtro municipal1. |
| Presentación | Público/tres roles en-US; listas/historiales, opciones españolas con value técnico; móvil360×800 sin overflow y axe PASS; capturas ficticias revisadas. |
| Integridad | Diff-check PASS, sin migración/reset/servicios o cambios alojados; next-env.d.ts ajeno restaurado. |

T151–154 completos para este incremento. Guía docs/product/spanish-interface.md
y análisis acotado sin gaps nuevos construibles: presentación consistente con
spec/plan y constitución; modelo/contratos/transiciones/política sin cambios.
Checklists existentes intactas; no acredita revisión independiente o aprobación.
Cobertura instrumentada solo de entorno, no cobertura total del negocio.
Fallos iniciales de expectativas inglesas y sincronización antes de axe corregidos
sin omitir recorridos/reglas; Next conserva su aviso preexistente de stream cerrado
durante navegaciones abortadas. Servidor next dev cerrado con autorización y
servidores de pruebas finalizados. Sin suite SQL/E2E completa, NVDA, CI remoto,
commit/PR o aceptación nueva. Gates históricos y OQ-001/002 siguen pendientes;
no hay decisión municipal nueva necesaria para esta traducción.

Entrega solicitada: commit93fbca6 sin firma ni atribución conserva la implementación
antes de sincronizar. PR66 avanzó main a8c1612b; se integra sin perder portada,
sidebar, cvReturnTo/returnTo ni traducciones. El ID local EXTRA042 de esta rama
colisionó con el visual de main: esta mejora pasa a EXTRA051 y preserva su origen.
La migración oficial de controles de main continúa independiente. FileInput usa
los tokens compartidos; no cambia controles/reglas del compañero.

Revalidación tras integración:807 pruebas/63 archivos, tooling57/57, tipos/lint/build,
18/18 recorridos de navegador sin reintentos y3 scripts visuales de main PASS.
El smoke español incluye las tres secciones del /account candidato con sidebar.
Diff del PR contra main PASS; no se modifica el whitespace heredado en la licencia
Sora al resolver el merge. Sin reset/migración/cambios alojados ni revisión/CI
acreditados. Next-env.d.ts ajeno queda fuera de la entrega.

PR67 abierto hacia main con93fbca6 y4b83104, ambos sin firma/atribución:
https://github.com/maximo-Pdev/funes-empleo/pull/67.
Publicación no equivale a CI aprobada, revisión humana, merge o aceptación.

Corrección del check application de PR67 (Quality39887066823,2026-10-22):
database PASS y100 recorridos PASS; el helper decide aún esperaba códigos ingleses,
con otro cancelled literal oculto al final. RED local reproduced rejected/Rechazada.
Expectativas independientes Publicada/Rechazada/Cerrada/Cancelada con unión de
decisiones tipada; los values ingleses y las aserciones de privacidad/casos siguen.
GREEN local1/1 del recorrido entero sin reintentos;807 pruebas/63 archivos,
tooling57/57, tipos/lint/build/diff-check PASS. Sin tocar aplicación, SQL, fixtures,
pipeline o datos compartidos; sin reset local. T155 implementado/verificado local,
actualización del mismo PR67; nueva CI y revisión pendientes al publicar.

Segundo fallo expuesto por CI39889638752:101 recorridos PASS, incluido T155;
solo SC-008A falla porque demo-performance aún busca Estado: published. T156
actualiza esa etiqueta a Publicada y usa selectOption(available) para el escenario
de búsqueda candidato. Conserva cinco segundos, cuatro actores, barrera y SQL
de integridad. RED de contrato1/2;808 pruebas/63 archivos, tooling57, tipos/lint/build
y diff-check PASS. Sin cambios de producto/pipeline ni reset local; benchmark frío
se verifica en el runner aislado de la nueva CI, pendiente al publicar.

## 2026-10-23 — A04 referencias privadas, EXTRA052

Mateo solicita eliminar UUID visibles y de URLs para todos los accesos. PR67
mergeado8d00f95; rama anterior eliminada local/remotamente y árbol limpio antes
de crear feat/private-record-references. T157–T161 implementadas y verificadas;
sin nuevos commits, push o PR. Los slugs de Máximo y los contratos UUID internos
permanecen intactos.

Migración20261023180306: tabla privada con códigos aleatorios estables, backfill
INSERT y triggers, RPCs autorizados con sesión vigente, permisos mínimos y RLS.
No cambia estados, versiones o historial. UI/API/GET/CSV/clientes/revalidación
usan referencias; enlaces UUID privados previos se canonicalizan solo tras
autorizar. CV mantiene RPC+Storage, streaming y no-store; una referencia revocada
no recupera acceso. Guía/recuperación: docs/validation/private-record-references.md.

SQL1125/19, unit/componentes844/65, tooling57, tipos/lint/build/diff-check y
advisor security warn/error PASS. Navegador108/108 sin reintentos ni omisiones,
incluido SC-008A frío con cuatro actores y cinco segundos; dos carreras SQL de
suspensión/revocación adicionales PASS. Lectura manual de cuenta/padrón/perfil/
actores y enlaces verificada con identidad ficticia, sin cambios de negocio.
Solo Supabase desechable funes-reference-check54331/54332; fixture/hashes
preservados. Base habitual54321/54322 y entorno alojado sin migrar/resetear.

Posteriormente Mateo solicitó aplicar la migración:20261023180306 ejecutada y
registrada en Funes-empleo (`kyjycjojzhwggjuqjnki`),3751 referencias completas,
cero faltantes/huérfanas y permisos/guard verificados. Huellas y conteos de las
nueve tablas de origen, consentimientos y auditoría intactos. Sin reset ni push
de otras migraciones. Advisor alojado:52 WARN previos,54 posteriores, cero ERROR;
dos avisos0029 esperados por los RPC autorizados, documentados en la guía.

Publicación posterior solicitada por Mateo: commit a22745d sin firma/coautorías,
[PR68](https://github.com/maximo-Pdev/funes-empleo/pull/68) abierto hacia main.
Tipos/lint,844 unitarias/componentes y57 tooling repetidos PASS antes de publicar;
next-env.d.ts ajeno excluido y preservado. Pendientes: CI, revisión humana, merge,
despliegue y recorridos alojados con sesiones. No se cierran gates históricos ni
se acredita aceptación municipal/global. No se reintroducen cambios del PR54;
base habitual sigue sin migrar/resetear.

## 2026-10-23 — A16 retirar enlace global, EXTRA053

PR68 mergeado86b7de8 confirmado; main actualizado y rama anterior eliminada
local/remotamente. Rama fix/remove-skip-link. Cambio local previo de next-env.d.ts
preservado. Se retira únicamente el anchor global «Ir al contenido principal»;
main#contenido, landmarks, foco visible y enlace Inicio de portada permanecen.
A16/spec/plan/UI/pauta manual y pruebas actualizados; sin backend o migración.
Análisis acotado conserva constituciónIV/FR-070/SC-009 mediante operabilidad y
landmarks, sin declarar Inicio equivalente universal del salto.

RED2/2 y GREEN14/14 focalizadas; tipos/lint,846 pruebas/66 archivos, tooling57,
build de producción y diff-check PASS. Seis recorridos públicos de lectura con
axe y primer foco, más seis combinaciones de Inicio a1440/390px (ingreso y ambos
registros) PASS, sin omisiones/reintentos. Node24.22.0; copia aislada y servidor
3001 con configuración pública ficticia, sin .env.local. No se tocó servidor3000,
su .next, base local o alojada; no se enviaron formularios ni hubo login/reset.
No se repitió E2E privado ni se certificó NVDA/zoom real. Por solicitud posterior
de Mateo se publicó commit9a899d3 sin firma/coautorías y se abrió
[PR69](https://github.com/maximo-Pdev/funes-empleo/pull/69) hacia main86b7de8.
next-env.d.ts ajeno queda fuera del commit. CI/revisión humana, merge, despliegue
y gates históricos pendientes.

## 2026-10-23 — CV vigente administrativo, EXTRA054

PR69 mergeado08cd740 confirmado; rama anterior eliminada local/remotamente y
feat/admin-candidate-current-cv desde main actualizado. next-env.d.ts local
preexistente preservado. El detalle administrativo reemplaza la carga por
nombre/tamaño del CV válido no archivado y descarga protegida por referencia;
sin CV muestra un mensaje sin enlace. La carga/reemplazo existente se conserva
en mantenimiento presencial para no romper FR-013. Consulta mínima administrativa
con RLS y error diferenciado de ausencia. No se cambia endpoint/SQL/permisos,
historial, autoservicio candidato, infraestructura o dependencias de producto.

RED6/28, GREEN66/66 focalizadas, tipos/lint,856 pruebas/67 archivos, tooling57,
build de producción y diff-check PASS. Seis recorridos de referencias/roles/IDOR
PASS en respaldo aislado; la carga de ese respaldo falló con Storage500/42P10
por faltar un índice esperado por su imagen. Instancia nueva desechable
funes-admin-cv-check54341/54342 generó esquema compatible y ambos recorridos
asistidos completos pasaron2/2, sin omisiones/reintentos ni parches de índices.
Incluyen ausencia, carga/reemplazo, descarga vigente, derivación, consentimiento,
claim e historial. Descarga con Enter a1440/390px sin overflow/errores y capturas
ficticias revisadas; advisor local PASS. Detalle de diagnóstico: cambios-extra.md.

Sin reset o modificaciones de base habitual/alojada, lectura de .env.local o
cambios de .next del usuario; build en copia ignorada con Node24.22.0. No se
repitió aceptación E2E/SQL completa ni se certificó NVDA/zoom real. No hay migración
nueva. Por solicitud posterior de Mateo se publicó commit aa139cc sin firma ni
coautorías y se abrió [PR70](https://github.com/maximo-Pdev/funes-empleo/pull/70)
hacia main08cd740. next-env.d.ts y evidencias temporales excluidos. CI/revisión
humana, merge, despliegue y gates históricos pendientes.

## 2026-10-23 — Apartado de atención presencial, EXTRA055

PR70 mergeado84a2ce6 confirmado; main actualizado, rama anterior eliminada
local/remotamente y nueva feat/admin-assisted-candidates-section. next-env.d.ts
ajeno preservado. Menú «Atención presencial» debajo de Candidatos dirige a
/admin/atencion-presencial: mismos perfiles con origin=assisted fijo en servidor,
incluso borradores, archivados y cuentas vinculadas; vigencia/aptitud «Todos»
por defecto solo en este apartado. Reutiliza filtros, paginación, referencias
opacas, detalle y formulario/mantenimiento actuales. No cambia registros, RLS,
permisos, reglas de aptitud, estados, dependencias o esquema; sin migración.

RED7/8 y GREEN64/64 focalizadas, tipos/lint,873 pruebas/70 archivos,57 tooling,
build de producción y diff-check PASS. Seis E2E Chromium sin omisiones/reintentos:
flujo asistido/claim/historial y duplicados existentes; protección de anónimo,
candidato y empresa; listado vacío, borradores, filtros, paginación y detalle
por teclado sin crear duplicados al navegar. Axe sin violaciones y capturas
ficticias revisadas a1440/390px sin overflow ni errores de navegador. Advisor
de seguridad local sin hallazgos. Ajustado test de navegación Mi cuenta a8 opciones.

Node24.22.0 en copia ignorada con .next propio y base ficticia aislada
funes-admin-cv-check54341/54342, sin .env.local o reset/cambios en bases habitual
o alojada. Servidor next dev3000 detenido con autorización explícita para probar;
sin cambios en configuración de producto. No se repitió aceptación E2E/SQL completa
ni se certificó NVDA/zoom real. Commit/PR no solicitados todavía; CI/revisión humana,
merge/despliegue y gates históricos pendientes. T168–T170 verificados técnicamente.

Corrección solicitada2026-10-24: el apartado muestra el formulario existente
«Crear perfil asistido» arriba y «Perfiles creados» con búsqueda/listado debajo;
el alta ya no requiere un enlace a otra pantalla. Conserva las acciones,
validación, duplicados y redirección al mantenimiento al guardar. Reutiliza el
catálogo ya cargado, sin nuevas consultas o cambios de backend/DB. RED2/26 y
GREEN35/35 focalizadas; tipos/typegen, lint,873 unit/componentes,57 tooling, build
y diff-check repetidos PASS. Alta integrada y otros cuatro E2E PASS; claim pasó
1/1 tras corregir el buzón ficticio solo en la copia aislada. Axe sin violaciones,
1440/390px sin desbordes ni pageerror. Diagnóstico/límites en EXTRA055; no se
declara aceptación global. Misma rama, cambios ajenos preservados; sin commit/PR.

## 2026-10-24 — Alta presencial activa, EXTRA056

Mateo elige exigir datos de activación y registrar aceptación presencial al crear.
Nuevo RPC create_active_assisted_candidate guarda/consiente/activa atómicamente
con administrador activo; validación servidor/DB y checkbox sin marcar con
política visible. Usa comandos/auditoría/duplicados vigentes. Usar existente o
rechazar no acepta/reactiva; CSV/mantenimiento y contrataciones anteriores sin
backfill. Contratación normal/tardía ya retira consentimiento global y deja el
perfil consent_withdrawn revocando todos sus permisos, sin alterar otros casos.
Se invalida también la nueva ruta presencial tras contratación.

Spec/plan/modelo/contratos/UI/tasks alineados y análisis de seis criterios sin
críticos/altos abiertos en el delta. RED8/10, GREEN44/44; tipos/typegen, lint,
884 pruebas/71 archivos,57 tooling, build y diff-check PASS. SQL04124+04065+02455
=144 aserciones PASS (024 usa identidad ficticia equivalente disponible solo en
copia reducida);8 E2E sin omisiones/reintentos PASS, incluidas contrataciones
normal/tardía, bloqueo concurrente, consentimiento/accesos y otros casos intactos.
Axe sin violaciones, política/aceptación sin marcar revisadas a1440/390px, sin
overflow/pageerror; advisor local sin hallazgos. Entorno/diagnósticos en EXTRA056.

Migración20261024033056_active_assisted_registration.sql ejecutada solamente
en instancia ficticia aislada54341/54342 para verificar; pendiente aplicación
en Supabase alojado antes de desplegar. Guía de operación/recuperación incluida.
Sin .env.local, reset/modificación de base habitual o cambios a next-env.d.ts
ajeno. Misma rama feat/admin-assisted-candidates-section, sin commit/PR solicitados.
T171–T173 verificados técnicamente; revisión humana/CI/merge/despliegue y gates
históricos pendientes. No se certifica aceptación global/municipal ni NVDA.

## 2026-10-24 — Categorías laborales únicas, EXTRA057

Rama feat/candidate-profile-categories desde84a2ce6 (origin/main coincidente),
con trabajo local EXTRA055/056 preservado y copia ignorada de39 archivos previos.
next-env.d.ts ajeno y menú anterior intactos por hash. Se retira Intereses laborales
de formularios/asistido/registro informativo, preview y ficha empresarial. Propio
ya usa categorías; persiste hasta40 para conservar la capacidad histórica20+20.
Proyecciones y nuevas relaciones solo occupation. Payload legado no vacío se
rechaza sin pérdida silenciosa; vacío solo compatibilidad técnica sin campo UI.

Migración20261024124316 captura origen y ambos timestamps en historial privado
append-only/RLS/sin grants de aplicación y reclasifica asociaciones in situ:
no inserta ni borra relaciones ni altera perfiles/versiones, consentimiento, CV,
participaciones o catálogo. Matching conserva OR, aptitud, exclusiones, orden y
paginación; CSV conserva columna/mapping. Definiciones previas recuperables,
guía operacional con reversión restringida a antes de escrituras posteriores.
Spec/plan/modelo/contratos/checklist/tareas alineados, análisis previo sin
críticos/altos abiertos y convergencia del delta cubierta por T174–T178.

RED3/3, GREEN21/21 focalizadas;887 unit/componentes/72 archivos,57 tooling,
typegen/tsc, lint, build y diff-check PASS. Prueba sobre datos previos14/14
conserva unión/timestamps y agregados y matching exacto en3 páginas. Suite SQL
completa1163 aserciones/21 archivos PASS; fixture aceptación500/50/100/1000 y500
CV sintéticos con Storage verificado. Dieciséis E2E por roles/propio/asistido/CSV/
matching/modal/nominación/contratación normal y tardía PASS, cero omisiones o
reintentos. Axe sin violaciones;1440/390px, foco y ancho revisados, sin pageerror.
Advisor local sin hallazgos. Diagnósticos y alcance detallados en EXTRA057.

Solo instancia ficticia funes-admin-cv-check54341/54342, copia ignorada con
.next propio y Node24.22.0; no .env.local ni reset/cambios de base habitual o
alojada. Migración alojada pendiente antes de despliegue. Sin commit/PR pedido;
revisión humana/CI/merge/despliegue y gates históricos pendientes. No aceptación
municipal/global, suite E2E global o certificación NVDA/zoom real.

## 2026-10-24 — Nominación desde oferta, EXTRA058

Detalle administrativo del candidato sin formulario para nominar ni consulta de
ofertas para ese formulario. Componente NominationForm y listNominationOpenings
eliminados por quedar sin consumidores. El mantenimiento asistido enlaza solo a
CV/notas/historial. Nominación por matching/popup de oferta y comando existente
intactos; conserva CV, notas, participaciones, decisiones de cuenta y permisos.
UI acotada según solicitud expresa; spec/plan/UI/tasks alineados, sin migración.

RED1/26, GREEN30/30;891 pruebas/72 archivos,57 tooling, typegen/tsc, lint, build y
diff-check PASS. Ocho E2E sin omisiones/reintentos PASS: flujo asistido y vinculación,
duplicados, matching/popup/nominación y escenarios de seguimiento, retiro,
rechazo/cierre/cancelación. Pruebas ahora nominan por la oferta; perfiles activos,
asistidos, borradores y archivados no ofrecen selector/botón. Capturas1440/390px,
foco en Ofertas y ancho revisados sin overflow/pageerror. Axe de recorridos sin
violaciones. Diagnósticos y detalles en EXTRA058.

Servidor3001 y Auth ficticio/fixture500 en copia ignorada, sin detener servidor
de usuario3000 ni modificar su .next/.env.local, base habitual/alojada o configuración
de producto. No se repitió SQL inalterado o suite E2E global; sin certificación
NVDA/zoom real. Misma rama feat/candidate-profile-categories, trabajo previo y
next-env.d.ts ajeno preservados. T179/T180 verificados técnicamente; commit/PR,
CI/revisión humana/merge/despliegue y gates históricos pendientes.

## Atención presencial integrada — EXTRA059,2026-10-24

Edición, consentimiento/activación, carga/reemplazo CV y claim dentro del detalle
administrativo, únicamente para origen presencial sin cuenta y no archivado.
No duplica notas/historial. Tras vincular desaparecen esos formularios y quedan
los mismos controles normales por estado de cuenta, conservando origen/historial.
Alta/guardado abren detalle principal; mantenimiento antiguo redirige allí por
referencia opaca con guard previo. Sin migración o cambio de permisos/comandos.

Suite903/72 PASS y luego46 focales (incluidos cuatro casos nuevos de equivalencia
con perfil normal). Tooling57, tipos/lint/build/diff-check PASS en Node24.22.0.
Dieciséis E2E PASS sin omisiones/reintentos: alta/edición, consentimiento/retiro/
aceptación/activación, CV/reemplazo, claim/conflicto/historial, duplicados, sección,
roles, matching y referencias. Revisión1440/390px/teclado/axe sin incidencias.
Se corrigió clave React duplicada detectada por E2E y reproducida en test de
rerender; retirada de controles verificada sin recarga manual tras claim.

Entorno ficticio aislado funes-admin-cv-check54341/54342, build/servidor3001 en
copia ignorada. Base habitual/alojada, .env.local, .next y next-env del usuario
preservados. Sin repetir SQL inalterado ni acreditar E2E global/NVDA/aceptación.
T181/T182 verificados técnicamente; detalles/diagnósticos en EXTRA059. Commit/PR,
CI/revisión humana/merge/despliegue y gates históricos pendientes.

## Orden de tarjetas presenciales — EXTRA060,2026-10-24

CV inmediatamente debajo de Mantener perfil y Perfil candidato antes de
Participaciones recientes en la columna derecha, para origen presencial.
Bloques únicos sin cambiar visibilidad, controles o datos. Otros orígenes
conservan composición.907/72 pruebas,46 focales,57 tooling, tipos/lint/build/
diff-check PASS; revisión1440/390px de orden real/DOM, foco y axe sin incidencias.
Servidor/build y Supabase ficticios aislados, sin reset o migración. T183
verificado técnicamente; límites en EXTRA060, revisión humana/PR/CI pendientes.

## Historial resumido de cuenta y perfil — EXTRA061,2026-10-24

Decisiones de Mateo aplicadas solo a esa tarjeta: activación, consentimiento,
disponibilidad, suspensión/reactivación, vinculación y actualización pendiente
visibles; creación, edición común, verificación y archivo/restauración internos.
Evento y fecha/hora argentina24h, cinco iniciales y Ver más. Filtro antes de limit,
cursor fecha/id estable y Server Action admin con scope reconstruido/payload mínimo.
Auditoría completa, permisos y otros historiales intactos; sin nueva migración.

Suite939/74 PASS seguida de24 focales postajuste horario (un caso adicional),
tooling57, tipos/lint/build final/diff-check PASS. Nueve E2E PASS y recorrido del
historial repetido tras24h PASS:80 eventos ocultos/61 visibles con empates, más de50,
nueva llegada entre páginas, teclado y huella íntegra de auditoría.1440/390px/axe
sin incidencias y capturas revisadas. Primer error de tipos en tests corregido;
interrupción de revisión automática por cuota resuelta al reintentar sin bypass.

Supabase/build/servidor ficticios aislados, sin reset ni cambios alojados; next-env
ajeno preservado. T184/T185 verificados técnicamente. EXTRA061 contiene evidencia
y límites; sin acreditar SQL/E2E global/NVDA/aceptación. Commit/PR/CI/revisión/merge/
despliegue y gates históricos siguen pendientes.

## Publicación de mejoras de candidatos — 2026-10-24

Mateo solicitó publicar la rama acumulada EXTRA055–061. Commit `0ad6e85` sin firma
ni signoff/coautor publicado en `feat/candidate-profile-categories`, desde `main`
actualizado (`84a2ce6`). [PR #71](https://github.com/maximo-Pdev/funes-empleo/pull/71)
abierto sin borrador,80 archivos, con evidencias y dos migraciones requeridas antes
del despliegue. `next-env.d.ts` ajeno queda local y fuera del commit. CI y revisión
humana siguen pendientes; PR abierto no acredita merge, despliegue o aceptación.

## Gestión empresarial de ofertas y moderación — EXTRA062,2026-10-24

PR71 confirmado mergeado en4da73c7; main actualizado, rama anterior eliminada
local/remota y nueva feat/company-offer-management. Cambio next-env.d.ts ajeno
preservado (huella en EXTRA062). Sin commit ni PR de este incremento.

Empresa contratante activa conserva nombre/resultado de su contratación confirmada,
normal o tardía; no revive consentimiento global, perfil/contactos/CV ni accesos
de otras empresas. Admin excluye borradores de sus listados/filtros, incluido
detalle empresarial; rol/RLS/métricas/restauración siguen vigentes. Vista empresarial
reúne moderación y derivados, ruta previa compatible sin UUID; historia cinco
recientes y Ver más por cinco para ambos roles, con privacidad correspondiente.

Publicado editable completo vuelve atómicamente a pending_review, con dos versiones
y eventos de guardado/envío; sale del público y conserva slug/casos/resultados.
Empresa cancela propia oferta no final con motivo/confirmación: sigue visible
Cancelada, cierra solo abiertos y revoca sus accesos, conserva finales e historial.
Empresa restaurada incompleta conserva detalle/borrador con aviso, sin acceso
anticipado a derivados. Acción destructiva roja; invalidación de informes/entrevistas
adaptada a la página integrada. Sin dependencias/tablas/campos nuevos.

Migración20261024184354 reemplaza tres RPC manteniendo firmas/grants. Aplicada y
probada solo en funes-admin-cv-check local aislado54341/54342; base habitual y
proyecto alojado sin cambios. Recuperación sin borrar datos ni revivir estados
documentada en docs/operations/company-offer-management.md.

980 pruebas/77 archivos y283 focales finales,57 tooling, tipos/lint/build final y
diff-check PASS. SQL1201 aserciones/22 archivos y97 focales tras ampliar inactividad
PASS. Fixture ficticio inicial500 candidatos/50 empresas/100 ofertas/1000 casos/
500PDF. Doce E2E PASS y un recorrido final adicional PASS (informe pending_admin,
errores sin borrar valores, edición/reaprobación/slug, cancelación/finales,
1440/390px/axe/capturas revisadas). Diagnósticos corregidos en EXTRA062.

Análisis previo y convergencia final acotados a R1–R6/T186–191, sin brechas nuevas
ni hooks. T186–191 verificados técnicamente; tasks sin cambios durante convergencia.
No acredita cierre global del MVP. Migración alojada, entrega/PR/CI/revisión humana,
merge/despliegue, aceptación/NVDA/zoom real y gates históricos siguen pendientes.

### Ajuste R5: editor por botón — T192,2026-10-24

Mateo pide consulta inicial en ofertas existentes. CompanyOpeningDetails muestra
datos y vacíos; «Editar oferta» revela formulario solo en estados editables,
«Cancelar edición» vuelve sin guardar, versión guardada vuelve al detalle nuevo.
Estado local ligado a id/versión, foco y errores/valores preservados; alta nueva
directa. Sin cambios de servidor, contratos de datos ni migración adicional.

982/77 pruebas y23 focales finales PASS, tipos/lint/build/diff-check PASS; cuatro
E2E empresariales (alta, edición normal/publicada, revisión, cancelación, permisos,
restauración y cierre) PASS.1440/390px/axe y capturas revisadas. Supabase local
aislado reanudado sin reset; evidencia/diagnósticos en EXTRA062 y logs editor.
T192 técnicamente verificado, revisión humana/CI/entrega y migración previa alojada
pendientes. Cambios acumulados y next-env.d.ts ajeno preservados.

### Publicación de EXTRA062 —2026-10-24

Por solicitud de Mateo, commit `e2fd399` (48 archivos) publicado sin firma,
signoff ni coautor en feat/company-offer-management, desde main actualizado4da73c7.
[PR #72](https://github.com/maximo-Pdev/funes-empleo/pull/72) abierto sin borrador
y adjunto a la conversación; incluye T186–192 y editor por botón. next-env.d.ts
ajeno queda fuera del commit. Migración20261024184354 continúa pendiente en el
proyecto alojado antes del despliegue. CI/revisión humana/merge/despliegue y
aceptación siguen pendientes; PR abierto no acredita esas etapas.

### Correcciones de CI del PR72 —2026-10-24

El primer fallo application fue una espera insuficiente del anuncio final de la
transición de historial: commit f852233, diez repeticiones y982/77 coverage PASS;
tipos/lint/build limpio PASS. La siguiente tanda completa superó esa etapa y
database, con115 E2E aprobadas, tres fallidas y concurrencia dependiente sin ejecutar.

T194 ajusta categorías al apartado de derivados, ruta esperada al detalle nuevo y
nombre contratado mínimo tras revocación. Panel no repite nombre legado cuando
ya aparece en el perfil completo. No cambia DTO/SQL/permisos. Otro permiso válido
puede autorizar el mismo CV tras caducar uno aislado; tras retiro global se exige
API403/404.983/77 coverage y tipos/lint/build/diff-check PASS; los tres E2E afectados
PASS juntos sin omisiones/reintentos. Solo fixture local aislado, manteniendo
next-env.d.ts ajeno. Publicación en misma rama/PR sin firma; resultado completo de
nueva CI en checks del PR, revisión humana/merge/despliegue aún pendientes.

La revisión2daccf3 pasó983 pruebas, database, build y118 E2E; el último caso frío
SC-008A agotó180s de preparación antes de medir. Reset completo inicial en el mismo
job:189s, con1205 pgTAP en133s. T195 ajusta solo preparación a300s y total a420s,
con diagnóstico por código sin exponer logs sensibles. Conserva90s del proceso de
medición y≤5000ms por cada una de cuatro operaciones, barrera y auditorías completas.
Prueba fría local íntegra con SQL/500PDF PASS en2.7m; tipos/lint/diff-check y57 tooling
PASS. Sin cambios de aplicación/SQL ni omisiones/reintentos. Protocolo en performance.md;
nueva CI completa del PR72 se confirma en sus checks, sin éxito anticipado.

### Reparar preview administrativo — EXTRA068,2026-10-25

PR72 confirmado mergeado; main actualizado a a2001e5 (incluye PR73), rama local
anterior eliminada y nueva fix/admin-candidate-preview. next-env.d.ts ajeno
conservado. Popup fallaba porque exigía kind=occupation a categorías históricas
interest; lectura agregada local y versiones remotas evidencian consolidación057
pendiente. No se leyeron perfiles alojados ni se aplicaron migraciones.

Preview ahora proyecta solo code/name y descarta metadatos internos; conserva
categorías únicas visibles, validaciones de identidad/versiones/CV/fechas,
roles/aptitud/matching y comando auditado de nominación. Sin SQL ni cambios de UI.

RED3/45; GREEN1178/89 unit/componentes,57 tooling, tipos/lint/build/diff-check PASS.
56 aserciones pgTAP023/024 y cinco recorridos E2E sin omisiones/reintentos PASS,
incluido fixture temporal de categoría antigua, restaurado al terminar. CV200/PDF
por referencia opaca, nominación/auditoría/exclusión, consultas sin escrituras,
Escape/foco y1440/390px/axe0 verificados. Node24.22.0; solo entorno propio54341/
54342/app3001, sin reset, .env.local o mutaciones a base habitual/alojada.

Evidencia/diagnósticos y versiones anteriores pendientes en EXTRA068. No precisa
migración nueva; no sustituye el rollout de cambios anteriores. T196/T197 completos
técnicamente; commit/PR/CI, revisión humana, despliegue y aceptación pendientes.

Publicación solicitada2026-10-25: commit4d3922f sin firma/signoff/coautor y
[PR74](https://github.com/maximo-Pdev/funes-empleo/pull/74) abierto hacia main,
no borrador, en fix/admin-candidate-preview. Cambio ajeno next-env.d.ts fuera
del commit; sin migración nueva ni cambios alojados. CI/revisión/merge y
despliegue permanecen pendientes; no acredita aceptación municipal.

### Nombre en derivaciones empresariales — EXTRA069,2026-10-25

PR74 confirmado mergeado; main0bd10b1, rama previa local/remota eliminada y
nueva fix/company-referral-names. next-env.d.ts ajeno preservado. Mateo confirmó
nombre mínimo en toda derivación propia aunque termine el permiso, resolviendo
el conflicto con stub039; empresa/cuenta activas y oferta/caso/derivación no
archivados. No recupera perfil, contactos, foto, CV o consentimiento revocados.

Migración20261025135805 añade company_referral_summaries y candidateName en
company_referral; no cambia firma del RPC previo de referencias, hiredCandidate,
helpers de perfil/CV, RLS o comandos de informes. Sin tablas/backfill/copias de
nombres o cambios de estados/versiones por consulta. UI identifica nombres en
lista/encabezado, código secundario, aviso claro y explicación candidata alineada.
Proyección descarta clasificación histórica de categorías no usada por la ficha.

Gates acotados: N1–N6 cubiertos100%, sin críticos/altos; convergencia final sin
brechas nuevas y revisión React sin hallazgos.1195/90 unit/componentes,57 tooling,
1275/24 SQL (41 nuevas),17 E2E finales sin omisiones/reintentos, tipos/lint/build/
diff-check, advisor local y1440/390px/teclado/axe0 PASS. Cubre contratación normal/
tardía, informe, retiro/reaceptación, suspensión/reactivación y CV denegado.

Primer HTTP detectó25006: guard FOR SHARE requiere summaries VOLATILE; no se
retiró el bloqueo. Fixture propio rehecho y suite íntegra final PASS. Solo
funes-admin-cv-check54341/54342/app3001,500PDF ficticios; base habitual/alojada
sin cambios. Recuperación y despliegue SQL antes que app en guía operativa.
T198–201 completos técnicamente; migración alojada, commit/PR/CI, revisión
humana, despliegue y aceptación pendientes. EXTRA069 conserva diagnósticos.

Aplicación alojada posterior, autorizada por Mateo2026-10-25: únicamente
20261025135805_company_referral_names ejecutada y registrada applied en el
proyecto vinculado kyjycjojzhwggjuqjnki. Cuerpos por hash contra archivo, grants,
VOLATILE/search_path del RPC y denegación sin sesión verificados; helpers de
perfil/CV y contrato previo intactos. Respaldo exacto de definición/ACL anterior
en test-results ignorado; no reset, backfill o reparación de versiones previas.
Advisor56→57 WARN, cero ERROR: solo nuevo0029 del RPC autenticado intencional.
Guía y EXTRA069 actualizados. Interfaz aún requiere commit/PR/CI/despliegue;
esta ejecución no acredita revisión humana ni aceptación municipal.

Publicación solicitada2026-10-25: commit07751d0 sin firma/signoff/coautor y
[PR75](https://github.com/maximo-Pdev/funes-empleo/pull/75) abierto hacia main,
sin borrador, en fix/company-referral-names; adjunto a la conversación. Incluye
el cambio probado y evidencia de migración ya aplicada. next-env.d.ts y respaldo
ignorados excluidos. CI/revisión/merge/despliegue de interfaz pendientes.

## 2026-10-25 — Oferta administrativa y orden de coincidencias, EXTRA073

Base main9569a88 (PR76 mergeado), rama feat/admin-opening-workspace. Rama
anterior eliminada local/remota a pedido de Mateo; next-env.d.ts preexistente
preservado. Contexto, artefactos y gates incrementales revisados antes de editar.
R1–R5 y T208–211: decisión/historial a la derecha de información, enlace destacado
a participaciones y orden por última actualización solo en matching de cada oferta.
Más recientes por defecto; cambiar orden vuelve a página1 y paginar lo conserva.

RPC nuevo match_opening_candidates_ordered en migración20261025222811; pool,
aptitud, proyección, autorización, RPC legado y nominación conservados. Sin DML,
backfill ni índices nuevos. LinkButton conserva semántica de enlace y referencia
opaca. Override CSS acotado evita texto verde sobre verde; regresión RED/GREEN
real. Helper E2E localiza candidatos por el mismo orden; consumidor de perfil
espera la redirección canónica para evitar carreras. Detalle en EXTRA073.

Verificado:1200 unitarias/componentes/90 archivos,57 tooling, SQL1314/25 archivos,
tipos/lint/build/diff PASS. Advisor security local sin incidencias.5 recorridos
principales Chromium PASS23.2s, más3 consumidores de nominación PASS (uno tras
corregir carrera de redirección). Geometría1440/390, teclado/foco, contraste/axe0,
orden global/paginación/reload, popup/CV/nominar y permisos comprobados.
EXPLAIN sintético9.218ms para12 elegibles sobre500 perfiles; no es SLO alojado.
Cotejo final acotado R1–R5:5/5, sin tareas nuevas del alcance; no aceptación global.

Se usó únicamente snapshot y base ficticia funes-admin-cv-check54341/54342/app3001.
La base habitual y alojada quedan sin cambios. Aplicar esta migración antes de
desplegar app; recuperación en docs/operations/admin-opening-workspace.md.
Migración alojada, commit/PR/CI completo/revisión humana/despliegue pendientes.

Aplicación alojada posterior autorizada por Mateo2026-10-25: únicamente
20261025222811/admin_opening_candidate_order ejecutada y registrada en
kyjycjojzhwggjuqjnki, dentro de una transacción con validación de cuerpo,
ACL/volatilidad/search_path y guard sin sesión. Hash del SQL registrado igual
al archivo local; hashes y ACL de pool, guard y RPC legado intactos. Respaldo
previo y evidencia ignorados en test-results/admin-opening-remote-*. Sin reset,
backfill ni otras migraciones. Guía operativa actualizada; publicación de la
interfaz, pruebas alojadas por usuario y revisión humana aún pendientes.
Advisor alojado57→58 WARN, sin ERROR: único nuevo0029 por el RPC autenticado
SECURITY DEFINER intencional y protegido por guard admin/sesión/ACL. Guía incluye
el enlace y la justificación. Primer chequeo posterior falló con el rol temporal
del CLI; repetido sin conexiones paralelas PASS. No se repitió la migración ni
se modificaron credenciales o configuración de Auth.

Ampliación visual posterior de EXTRA073/T212: historial de moderación conserva
cinco iniciales y bloques de cinco; rótulo Mostrar más, ausente si no quedan
más eventos. Componente compartido empresa/admin, foco/anuncio y datos intactos.
59 pruebas pertinentes, tipos/lint/build limpio/diff PASS;8 escenarios Chromium
0/5/6/12×1440/390 con teclado/foco/axe0 PASS. Expectativa E2E empresarial alineada;
no se repite el recorrido con base porque solo cambia la etiqueta del control.
Build inicial falló en worker CSS y cacheó el error; limpieza de .next únicamente
en snapshot resolvió. Sin migración adicional ni cambios de negocio/permisos.
Publicación/revisión humana pendientes; next-env.d.ts preexistente intacto.

Publicación solicitada por Mateo: commit00f06cc sin firma/signoff/coautoría y
[PR77](https://github.com/maximo-Pdev/funes-empleo/pull/77) abierto hacia main,
sin borrador, desde feat/admin-opening-workspace; adjunto a la conversación.
Incluye EXTRA073/T208–212 y migración alojada ya aplicada. next-env.d.ts y todos
los respaldos ignorados quedan fuera. CI/revisión/merge/despliegue pendientes.

## 2026-10-27 — EXTRA085: ofertas recientes, archivos y filtros

Implementado en `feat/portal-offers-metrics-filters` desde main b900485, sin
commit/publicación. Home conserva orden servidor published_at DESC/ID DESC y
carrusel 3D/móvil con extremos acotados. Métricas permite PDF y Excel reales,
filtrados/autorizados/auditados, conservando CSV. Filtros compuestos en servidor
GET con islas cliente para combobox/validación; matching aplica orden explícito.
Popup bloquea fondo y conserva desplazamiento interior y restauración de foco.
Sin migración ni variables nuevas. Inventario/operación:
`docs/implementation/portal-filters-audit.md`; contrato
`contracts/portal-reports-and-filters.md`.

Tipos/lint/build/diff PASS;1242 pruebas/100 archivos y57 tooling;67 focales PASS.
pgTAP1314/25 archivos y fixture aislado500 candidatos/50 empresas/100 ofertas/
1000 participaciones/500 CV ficticios PASS. Diez E2E y repetición final del popup
PASS, sin retries; binarios PDF/XLSX, permisos y auditoría+3, GET opaco múltiple,
orden/paginación/nominación, desktop/móvil, bloqueo/restauración comprobados.
PDF14p leído/renderizado con encabezados/acentos/última fila; XLSX parser/XML sin
contenido activo ni UUID. Ambas fuentes en tracing;21 hashes runtime coinciden
con build. Cobertura100% se limita al env/schema configurado. next-env.d.ts
preexistente conservado. Audit mantiene los siete avisos del main; no se agregan
avisos por las librerías de informes. Incidencias de entorno y resultados reales
en EXTRA085. T213–218 completos; P1–P4 cubiertos y sin pendientes funcionales
focales detectados. Revisión humana/CI/aceptación global pendientes.
## 2026-10-27 — EXTRA086: carrusel automático

T219 implementado: avance5s en desktop y móvil, retorno al inicio, controles
manuales conservados y Button Pausar/Reanudar accesible. Hover de mouse pausa;
foco/tacto pausa hasta acción expresa; reduced-motion inicia pausado y pestaña
oculta no avanza. Sin dependencia, datos ni migración nuevos. Ocho focales PASS;
suite1247/100 anterior al último ajuste táctil PASS, cubierto luego por focales.
Tipos/lint/build PASS. Cinco recorridos browser finales cubiertos y PASS tras
corregir el entorno aislado y una expectativa de espacios SSR (EXTRA086).
Capturas1440/390 revisadas, código compilado coincide por hash. Trabajo existente
y next-env.d.ts ajeno preservados. Sin commit/PR/CI/deploy; revisión humana pendiente.
## 2026-10-27 — EXTRA087: tres segundos sin botón adicional

T220 sustituye presentación/temporización de EXTRA086 por petición expresa:
carrusel automático3000ms con solo flechas. Quita Button/iconos/ref/pausa manual;
hover/foco son temporales y se reanuda solo al salir. Conserva reduced-motion,
visibilidad, reinicio y cleanup. Seis focales, tipos/lint/build/diff PASS; cuatro
E2E desktop/móvil sin retries PASS, ausencia de Pausar/Reanudar comprobada. Código
compilado coincide por hash; next-env.d.ts ajeno preservado. Sin migración/reset/
cambios alojados. Misma rama, sin commit/PR/CI; revisión humana pendiente.
## 2026-10-27 — EXTRA088: diez ofertas y vecinos circulares

T221 implementado: Home pide10 públicas, conserva orden publicación DESC/ID DESC;
coverflow muestra última/penúltima a izquierda de primera y primera/segunda a
derecha de última, con flechas modulares y Embla loop móvil. Mantiene auto3s y
solo flechas, sin cambiar catálogo, conteos, elegibilidad ni SQL.31 focales PASS,
tipos/lint/build/diff PASS; cuatro recorridos browser finales cubiertos y PASS,
con vecinos/cruces de extremos1440/390, límite10, auto/hover y reduced-motion.
Capturas primera/última revisadas y hashes de fuente/build coinciden. Incidencia
solo de viewport de prueba documentada en EXTRA088. next-env.d.ts ajeno intacto.
Sin reset/migración/dependencia/hosted/commit/PR/CI; revisión humana pendiente.
## 2026-10-27 — Publicación del PR80

Mateo solicita el PR. Base remota b900485 confirmada sin divergencia. Suite final
1250/100 y cobertura env/schema100% PASS. Commit de implementación5936d25,
sin firma/coautoría, publicado en feat/portal-offers-metrics-filters. PR abierto
(no draft): https://github.com/maximo-Pdev/funes-empleo/pull/80 . Comprende
EXTRA085–088; next-env.d.ts ajeno excluido y preservado. CI/revisión humana/merge
pendientes. No se ejecutó despliegue manual ni cambios alojados de base de datos.
## 2026-10-27 — EXTRA089: recuperar accesibilidad del PR80

Run40571403004 falló solo application en accesibilidad administrativa360/1366;
database/tipos/lint/tooling1250pruebas/build pasaron. Input auxiliar de localidad
ocupaba100% del viewport por falta de contenedor posicionado. CandidateSearchForm
ahora posiciona su wrapper relativo; sin clipping global ni cambio de validación,
GET, controles, permisos o datos. RED2/2 y GREEN8 E2E (seis roles/tamaños y dos
filtros general/asistido),13 componentes y tipos/lint/build/diff PASS; hashes de
fuente/build coinciden, next-env.d.ts ajeno intacto. T222 implementado. Publicación
sin firma en PR80; CI posterior/revisión humana se verifican en los checks del PR.
No se dan por aprobados por las pruebas locales. Sin reset o cambios alojados.
## 2026-10-27 — EXTRA090/091: completar recorridos del PR80

Run40573996246 supera accesibilidad y121 E2E; seis fallos: Localidad ambigua en
3 pruebas, enlace presencial antiguo, popup múltiple cubriendo submit y axe en
Popup/List sin nombre. Ajustados selectores por rol/enlace vigente/Escape y nombres
aria de los cuatro callers, conservando primitivas/controles/validación. Tres nuevas
regresiones prueban menús abiertos con axe y restauración de foco.

La corrida dirigida7/9 descubre otro defecto: canonicalReferenceRoute normaliza
espacios a '+' y referenceUrl a '%20' aun sin sustituir UUID; redirige en bucle al
filtrar frases con categorías. Se omite reconstrucción si no cambia identificador;
se conservan encoding, repetidos, orden, guards y conversión legada. RED4 nuevas;
GREEN47 referencias/descargas. Final1254/100, tipos/lint/build/diff PASS. Siete E2E
finales PASS tras siete anteriores; seis casos originales recuperados y menús
abiertos/frases verificadas sin alterar umbrales/timeouts ni force clicks. T223/224
implementados; nueva CI/revisión humana en PR80. next-env.d.ts ajeno preservado.
Sin migración/hosted/reset; Docker reiniciado en segundo plano por motor detenido.