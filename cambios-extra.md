# Cambios extra necesarios

Registro de requisitos derivados y ajustes técnicos necesarios para cumplir tareas
aprobadas. No sustituye la constitución ni los artefactos de Spec Kit, y no convierte
una propuesta en una decisión municipal aprobada.

## Autorización de trabajo

- **Responsable:** Mateo.
- **Fecha:** 2026-09-26.
- **Evidencia:** instrucción en este chat: «agrega a agents.md si considera que algún
  requisito extra sea necesario que lo agregue pero registralo en cambios-extra.md
  o algún nombre así».
- **Alcance:** incorporar extras necesarios para cumplir la tarea aprobada, con
  justificación y trazabilidad; los límites y controles están en `AGENTS.md`.
- **Revisión:** esta instrucción no acredita revisión de Máximo ni aceptación municipal.

## EXTRA-001 — Evidencia histórica para métricas al cierre del período

- **Fecha de detección:** 2026-09-26.
- **Estado:** implementado y verificado localmente; pendiente de revisión por PR.
- **Origen:** FR-064 y tareas T079/T081 de
  `specs/001-municipal-employment-portal/`; fase 8 (US6).
- **Problema y evidencia:** las métricas deben reflejar el estado al cierre del
  período, pero los perfiles guardan valores actuales. Las funciones de mantenimiento
  reemplazan asociaciones de categorías y la auditoría no conserva todos los valores
  necesarios para reconstruir disponibilidad, confirmación y categorías anteriores.
  Ejemplos: `supabase/migrations/202609190019_candidate_self_service.sql` y
  `supabase/migrations/202609190030_company_self_service.sql` eliminan asociaciones
  previas de categorías; `202609190003_authorization_audit.sql` limita los metadatos
  de auditoría a identificadores de decisión, versión y conteo.
- **Cambio implementado:** conservar evidencia histórica mínima, protegida y transaccional
  de los atributos necesarios para calcular las métricas aprobadas. No copiar nombres,
  DNI, contactos, notas ni CV. Una instalación existente registra cobertura fiable
  desde la migración y rechaza períodos anteriores sin reconstrucciones supuestas.
- **Justificación:** es soporte técnico para un requisito ya aprobado, no una nueva
  funcionalidad municipal ni una solicitud de documentación oficial.
- **Archivos y contratos:** migraciones `202609190060_metrics.sql` y
  `202609190061_metrics_history_guard.sql`; `supabase/tests/060_metrics.test.sql`;
  servicio, validación, dashboard y exportación en `src/features/metrics/` y sus rutas;
  `plan.md`, `data-model.md` y `research.md`. Contratos definitivos, tablas privadas,
  errores y recuperación en `docs/validation/phase-8-metrics.md`. No se reescribieron
  migraciones aplicadas. `playwright.config.ts` ejecuta el proyecto de métricas antes
  de los recorridos que mutan el fixture; seed y manifiesto conservan conteos exactos.
- **Riesgos y límites:** historia previa irrecuperable, consistencia transaccional,
  exposición de datos y crecimiento del historial. No inventar antecedentes ni
  introducir purgas o retención no aprobadas. No cambiar las reglas de negocio.
- **Verificación realizada:** pruebas de cambios posteriores al período, categorías,
  disponibilidad, vigencia, consentimiento, acceso exclusivo administrativo y
  rollback; 54 aserciones SQL nuevas dentro de 466 correctas, 112 pruebas
  unitarias/componentes, E2E de métricas, typecheck, lint y build correctos.
- **Autorización y coordinación:** cubierto por la autorización general anterior
  como requisito técnico derivado. Se anunciaron el problema y el ajuste de configuración
  compartida al usuario. La revisión del diseño y de los archivos por Máximo sigue pendiente.
- **Resultado:** fase 8 implementada; evidencia y límites en el documento de validación.
  Esta entrada no acredita aprobación municipal, revisión humana ni merge.
- **Referencias:** implementación `1aea6be`, [PR #31](https://github.com/maximo-Pdev/funes-empleo/pull/31).

## EXTRA-002 — Paginación administrativa reproducible

- Fecha/responsable: 2026-09-27, Mateo autoriza fase 9; agente implementa bajo
  autorización general de extras necesarios. Revisión del compañero pendiente.
- Estado: implementado y verificado localmente; revisión del compañero pendiente.
- Origen: T089 / SC-008A y entradas aprobadas de `acceptance-manifest.json`.
- Evidencia: empresas no acepta filtro de estado y usa 20 filas; ofertas usa 20 por
  defecto sin exponer tamaño. Ambos ordenan solo por fecha, con empates en el seed.
- Cambio mínimo: empresas con filtro validado y página de 10 filas; ofertas solicita
  10 filas; ambas usan UUID como desempate. Se conservan RLS, roles y conteos aprobados.
- Archivos compartidos: páginas admin de empresas/ofertas y servicio de listado de
  ofertas, pruebas E2E y documentación. Se anunció al usuario antes de implementar.
- Riesgos: navegación/filtros y orden; verificar página 2, totales, estado inválido,
  no duplicación entre páginas y accesibilidad. Sin schema ni nuevos estados.
- Verificación: E2E falló primero por 20 filas en lugar de 10; tras la corrección
  pasó con 80 ofertas publicadas, 50 empresas activas, páginas de 10 filas disjuntas
  y rechazo de filtro inválido. Typecheck, lint y build correctos. Evidencia completa
  y límites de rendimiento alojado en `docs/validation/quality-gates.md`.
- Commit/PR: pendiente al registrar esta verificación; consultar historial de esta
  entrada y PR de `codex/temp-phase-9-quality`. No se acredita revisión ni merge.

## EXTRA-003 — Ejecución E2E completa y reproducible

- Fecha: 2026-09-27. Estado: implementado y verificado localmente; revisión humana pendiente.
- Origen: T088/T094/T095 y plan de CI de flujos críticos.
- Evidencia: el job application no inicia Supabase ni prepara variables, Mailpit o
  PDF; los tests privados usan skip si falta ese entorno. Un check verde no prueba
  los recorridos privados.
- Cambio: ejecutor local/CI que valida destino local, prepara el fixture, carga
  variables en memoria, compila y ejecuta E2E con un reporte que rechaza omisiones.
  Se añaden pruebas HTTP y SQL reales de autorización/auditoría.
- Archivos: workflow Quality, package.json, tests/quality, tests/e2e,
  supabase/tests y documentación de validación. Sin cambios funcionales previstos.
- Riesgos: reset de datos de prueba y exposición de credenciales en logs. Guard
  local estricto; no imprimir configuración, no publicar trazas autenticadas.
- Autorización: Máximo solicita cerrar todas las tareas ejecutables en esta rama.
  Ajuste de CI anunciado antes de editar; revisión compartida se realiza por PR.
- Verificación prevista: tipos, lint, Vitest, pgTAP, build y suite E2E completa;
  confirmar ejecución del workflow en GitHub antes de afirmar CI verificado.
- Resultado 2026-09-29: tipos/lint/build PASS, 376 Vitest, 855 pgTAP,
  57 E2E sin omisiones y dos carreras SQL PASS. CI remoto se registra en el PR.

## EXTRA-004 — Respuesta segura al archivar empresa sin permiso

- Fecha: 2026-09-27. Origen: T088/T094, errores públicos sin detalles internos.
- La prueba HTTP real descubrió que `archiveCompanyAction` propagaba ACCESS_DENIED
  como error 500. Se captura con el mismo traductor público que las otras acciones,
  conservando el redirect exitoso fuera del catch. No cambian permisos ni estados.
- Autorización: corrección necesaria para terminar las tareas solicitadas, anunciada
  antes de editar. Revisión del segundo desarrollador pendiente en PR.
- Verificación: matriz de acciones HTTP y suites de calidad de esta rama.
- Resultado: las siete combinaciones de actor/estado de la matriz HTTP y el
  recorrido positivo de archivo empresarial pasan. Revisión independiente pendiente.

## EXTRA-005 — Recurso no encontrado accesible y en español

- Fecha: 2026-09-28. Origen: T087/T088, NFR-002/NFR-008.
- Evidencia: al consultar una oferta ajena, Next muestra su 404 por defecto en
  inglés, sin `main#contenido`; el enlace global de salto queda sin destino.
- Cambio mínimo: `src/app/not-found.tsx` con mensaje genérico en español y navegación
  pública. No revela si un registro existe ni cambia autorización o contratos.
- Riesgo: preservar respuesta y contenido indistinguibles para ID ajeno/ausente.
- Autorización: requisito técnico necesario dentro del cierre solicitado; anunciado
  antes de implementar. Revisión humana pendiente.
- Verificación: E2E de propiedad/NOT_FOUND, tipos, lint y build.
- Resultado: ajeno/ausente con igual contenido, status compatible con streaming
  y noindex PASS; tipos/lint/build PASS. El skip link tiene destino `main#contenido`.

## EXTRA-006 — Descarga privada compatible con Storage alojado

- Fecha: 2026-09-28. Origen: T094/T089, CV privado autorizado en Vercel/Supabase.
- Evidencia: RPC de autorización correcto, objeto presente con hash/tamaño de fixture,
  pero descarga devuelve 400/404. Logs de Storage 1.77.5 identifican la operación
  `object.get_authenticated_info`, excluida por la política local de solo descarga.
- Cambio mínimo: permitir `object.get_authenticated_info` junto con
  `object.get_authenticated`, manteniendo bucket privado y el mismo control de
  dueño/derivación vigente. Nunca permitir listing, firma, overwrite ni delete.
- Archivos: nueva migración forward-only, pruebas de Storage y documentación.
- Riesgo: ampliar accidentalmente operaciones; verificar descarga por cada rol y
  denegación de objeto ajeno, anónimo, listado y URLs firmadas.
- Autorización: requisito técnico necesario del despliegue ficticio solicitado;
  comunicado antes de modificar la política compartida. Revisión humana pendiente.
- Recuperación: migración posterior que restaure el predicado anterior si fuese
  necesario; no reescribir historial. El síntoma sería denegación de CV en cloud.
- Resultado: migración aplicada en demo y reset local; seis actores de Storage
  alojado PASS (descarga según permiso, firma/listado denegados), cuatro roles
  de smoke Vercel PASS y 500 PDF verificados por SHA-256/tamaño tras reset alojado.
  Revisión del segundo desarrollador pendiente en el PR de esta rama.

## EXTRA-007 — Precondiciones ficticias para concurrencia de aceptación

- Fecha: 2026-09-29. Origen: T089 / SC-008A. Estado: implementado y verificado; revisión pendiente.
- Evidencia: el seed tiene 80 ofertas publicadas y ninguna pendiente; todas las
  participaciones están derivadas o finalizadas. No permite ejecutar las cuatro
  acciones de aceptación requeridas sin preparar sus estados iniciales.
- Cambio mínimo: helper SQL de pruebas que, después de un reset autorizado, prepara
  oferta 80 en `pending_review` y participación 775 en `under_review`, retirando
  únicamente su derivación ficticia. Conserva 500/50/100/1000 y los 500 PDF.
  No es una transición de producto ni una migración; su recibo identifica la variante.
- Archivos: `tests/fixtures/prepare-demo-concurrency.sql`, harness de rendimiento,
  manifiesto y documentación. No modifica contratos, permisos ni esquema compartidos.
- Riesgos: ejecutarlo fuera del fixture o ocultar su diferencia con el seed original.
  Exigir identidades/conteos/estados iniciales exactos, transacción y proyecto demo
  fijado en el transporte; conservar auditoría previa y registrar variante/baselines.
- Verificación: cuatro sesiones individuales, barrera común, éxito visible ≤5 s por
  acción y comprobación posterior de entidades, versiones y cuatro auditorías.
- Autorización: detalle necesario de la tarea aprobada, anunciado antes de editar;
  resets de esta demo autorizados expresamente por el usuario. Revisión pendiente
  en https://github.com/maximo-Pdev/funes-empleo/pull/33.
- Resultado: barrera común con cuatro admins distintos, inicio separado por menos
  de 1 ms; 891/891/891/906 ms, todos ≤5000 ms. SQL posterior comprobó las cuatro
  versiones y sus auditorías con actor/request ID; preselección conserva decisión
  privada justificada y evento `stage_skipped`. Dos fallos previos de preparación
  por selector exacto que ignoraba «obligatorio» no enviaron acciones ni midieron.
- El ejecutor mantiene cookies solo en memoria. Los errores del transporte Vercel
  se traducen a mensaje genérico para que un fallo no imprima encabezados de acceso.

### Referencias de la entrega

EXTRA-003/004/005/006 están en el commit `2974958b36aefeb603de4a3943c5da7585ab6370`
y PR #33. Los jobs application/database de GitHub Actions 36596663506 aprobaron
ese commit. EXTRA-007 y las mediciones posteriores se agregan en el mismo PR;
ninguna revisión humana ni aprobación municipal está acreditada por esos checks.

## EXTRA-013 — Fixture de mantenimiento alineado con fecha de Buenos Aires

- **Fecha:** 2026-10-06. **Estado:** implementado; regresión/cobertura verificadas,
  gates locales incompletos y revisión pendiente.
- **Origen:** T034 y contrato `contracts/state-machines.md` de
  `specs/001-municipal-employment-portal/`: vencimiento a las 00:00 del día posterior
  a `closing_date` en `America/Buenos_Aires`, con ejecución idempotente.
- **Problema/evidencia:** el fixture de `tests/e2e/intermediation.spec.ts` usa
  `current_date - 1`; entre 00:00 y 03:00 UTC esa fecha aún no terminó en Buenos
  Aires. El diagnóstico de CI registra `closedOpenings: 0` en lugar de 1.
- **Cambio implementado:** derivar ayer de
  `(clock_timestamp() at time zone 'America/Buenos_Aires')::date - 1` y agregar
  `tests/unit/maintenance-timezone.test.ts`, vinculado a la expresión real del
  fixture con instantes deterministas 01:00, 02:59:59.999 y 03:00 UTC.
- **Justificación/límites:** reparación exclusiva de pruebas para satisfacer T034;
  conservar contadores e idempotencia. Sin cambios de producción, contratos ni
  aprobación inferida de la especificación Draft.
- **Autorización/coordinación:** usuario autoriza expresamente esta reparación y
  EXTRA-013; escritura delegada solo en los dos tests y este registro. El padre
  conserva el documento ODD, revisión y acciones Git; el escritor no hace commit/push.
- **Riesgos:** la comprobación estructural no ejecuta PostgreSQL; E2E completo
  pendiente de CI aislado porque Docker no está disponible. Node/npm locales
  24.16.0/11.13.0 difieren de los pins de CI 24.21.0/11.19.0.
- **Verificación observada:**
  - `npm run test:unit -- tests/unit/maintenance-timezone.test.ts`: RED, tres
    fallos con el source anterior (expresión, 01:00 y pre03); GREEN, cinco PASS
    tras corregir el fixture, incluido el límite exacto y caso negativo UTC.
  - `npm run test:coverage`: PASS, 24 archivos y 383 pruebas; resumen del runner
    100% de 18 statements/12 branches/3 functions/15 lines, no cobertura global.
  - `npm run lint`: FAIL (exit 2), dependencia `fast-glob` ausente al cargar
    `@next/eslint-plugin-next`. No se instaló ni modificó dependencia alguna.
  - `npm run typecheck` y `npm run build`: PASS en verificación independiente;
    carga normal de Next permitida sin inspeccionar ni mostrar valores de entorno.
  - Verificación independiente: regresión focalizada y `git diff --check` PASS;
    lint vuelve a fallar por instalación local incompleta (`fast-glob` existe en
    el lockfile pero falta en `node_modules`). No se ejecutó instalación.
  - `git diff --check`: PASS; sin errores de whitespace.
  - Sin resets, ejecución SQL/E2E, commits ni push; CI completo pendiente.
- **Archivos afectados:** los dos tests anteriores y `cambios-extra.md`; salidas
  generadas autorizadas únicamente en `.next/`, `coverage/`, `tsconfig.tsbuildinfo`.
- **Referencias:** tarea `odd/tasks/maintenance-e2e-timezone.md`; commit/PR de esta
  reparación y revisión independiente pendientes, no acreditados por este registro.

## Formato para próximas entradas

Usar un ID consecutivo `EXTRA-NNN` y registrar:

1. Fecha, responsable y estado.
2. Problema, evidencia y requisito/tarea aprobada de origen.
3. Cambio mínimo necesario y justificación.
4. Archivos y contratos afectados, riesgos y límites.
5. Autorización y coordinación, distinguiendo decisiones pendientes de aprobadas.
6. Verificación prevista y resultados reales.
7. Limitaciones, revisión y referencias de commit/PR cuando existan.
