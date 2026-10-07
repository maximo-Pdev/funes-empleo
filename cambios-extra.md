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

## EXTRA-008 — Parche mínimo de seguridad de dependencias (step 2)

- Fecha: 2026-10-06. Estado: parche dirigido implementado; instalación limpia y
  gates funcionales verificados por verificador independiente; audit con riesgo
  residual. Aceptación manual, comprobaciones DB y revisión pendientes.
- Origen: autorización explícita del usuario para step 2, seguridad de dependencias
  y versiones reproducibles de T001/T095; `odd/tasks/dependency-security.md`.
- Problema/evidencia de base aportada: npm audit informa 8 vulnerabilidades,
  1 crítica y 7 altas. Next 16.3.5 tiene GHSA-vcvr-r3jv-pc5j, corregido en
  16.3.8; source-map-js <1.2.2 tiene GHSA-68fv-2mgg-jv7q, corregido en 1.2.2.
  braces <=3.0.3 tiene GHSA-vfj7-8cjw-p6xm; latest 3.0.3 permanece sin parche
  estable según la investigación de base. No se promete audit cero.
- Cambio mínimo previsto: instalar Next y eslint-config-next 16.3.8 con pins
  exactos y actualizar source-map-js en el lockfile; sincronizar plan/research.
  Continuación autorizada: reparar también sharp <0.35.5 con `npm update sharp`,
  solo dentro del rango opcional de Next y sin dependencia directa ni override.
  Usar Node 24.21.0/npm 11.19.0 temporales en cache ignorada y verificar ambos
  ejecutables antes de instalar; preservar `.npmrc`, engines y packageManager.
- Justificación: corregir advisories con parches estables del stack aprobado,
  sin cambiar arquitectura, reglas de negocio ni ampliar dependencias directas.
- Archivos: `package.json`, `package-lock.json`, este registro,
  `specs/001-municipal-employment-portal/plan.md`, `research.md` del mismo
  directorio y `docs/validation/quality-gates.md`. No cambia contratos ni DB.
- Riesgos/límites: braces puede seguir propagando severidad alta por micromatch,
  fast-glob y la configuración ESLint de Next. No force, legacy-peer-deps,
  canary, downgrade mayor, vendoring, upgrades amplios ni debilitamiento de engines.
- Autorización: usuario autoriza este ajuste exacto y toolchain temporal, sin
  instalación global. Revisión del compañero/PR y aceptación manual pendientes.
- Verificación: versiones reales de runtime, instalación dirigida, `npm audit`
  y `npm ls` focalizado; instalación limpia y gates funcionales posteriores
  confirmados por el verificador independiente. Los resultados históricos de fase 9
  no se atribuyen al parche ni sustituyen las comprobaciones DB pendientes.
- Resultado observado: las tres instalaciones dirigidas finalizaron con exit 0;
  antes de cada una se observó Node v24.21.0/npm 11.19.0. `npm ls` focalizado
  exit 0 confirma Next/config/plugin 16.3.8 y source-map-js 1.2.2.
  Audit intermedio exit 1 informó 6 altas y 0 críticas, incluyendo sharp 0.35.4
  (GHSA-wq5f-xc86-pv6w). Con autorización posterior se comprobó en registry que
  Next 16.3.8 admite sharp `^0.35.4` y sharp 0.35.5 requiere Node >=20.9.0,
  compatible con el runtime exacto. `npm update sharp` exit 0 cambió 2 paquetes
  instalados; lockfile actualiza sharp/binarios a 0.35.5 y libvips a 1.3.4.
  `npm ls` exit 0 confirma sharp 0.35.5, sin nuevos pins directos ni overrides.
  Audit final exit 1 informa **5 altas, 0 críticas**, únicamente braces y cuatro
  dependientes ESLint; ya no enumera el advisory de sharp.
  Las instalaciones, incluida la actualización de sharp, advirtieron postinstall
  no cubierto por allowScripts para unrs-resolver 1.12.2;
  no se aprobó ni modificó esa política. Comandos exactos en quality-gates.md.
- Verificación independiente final aportada para este árbol: Node 24.21.0/npm
  11.19.0 exactos; `npm ci` exit 0; build exit 0; smoke público 1/1, exit 0;
  unitarias 378 pruebas en 23 archivos, exit 0; lint y typecheck exit 0.
  Audit exit 1: **5 altas, 0 críticas**, en braces/micromatch/fast-glob/
  @next/eslint-plugin-next/eslint-config-next. Los gates funcionales pasan;
  audit no pasa y no se afirma remediación completa.
  `npm ci` también advierte que el script de instalación de unrs-resolver 1.12.2
  no está en allowScripts. Política sin cambios; su postinstall no fue validado
  independientemente. Evidencia actual separada de la histórica e intermedia en
  `docs/validation/quality-gates.md`.
- Limitaciones/referencias: aceptación manual, comprobaciones DB/pgTAP y E2E
  privados completos del árbol parcheado pendientes; no se acredita aceptación
  ni revisión humana. Esta finalización solo documenta resultados aportados, sin
  volver a ejecutar comandos. No se creó commit/PR, no se hizo push ni reset de
  datos. Cambios previos preservados.

## EXTRA-009 — Evaluación de sustitución glob acotada al plugin ESLint de Next

- Fecha: 2026-10-06. Estado: ensayo autorizado por el usuario, rechazado por
  incompatibilidad verificada y reemplazo retirado; revisión del compañero pendiente.
  Origen: step 2 / T001/T095 y
  `odd/tasks/dependency-security.md`; eliminar la cadena vulnerable residual de EXTRA-008.
- Cambio propuesto: override anidado únicamente bajo `@next/eslint-plugin-next`,
  `fast-glob: npm:tinyglobby@0.2.17`, sin dependencia directa ni overrides globales.
  API inspeccionada: el plugin usa exclusivamente CommonJS `globSync(pattern,
  { onlyDirectories: true })` en `get-root-dirs`, convirtiendo barras Windows a `/`.
- Contrato: comparar conjuntos de rutas normalizadas (orden y barra final no
  significativos), raíces literales/glob/brace/absolutas, arrays y separadores Windows;
  excluir archivos y comprobar la regla real `no-html-link-for-pages` para enlaces
  internos incorrectos, externos y Next Link. No deshabilitar ni debilitar reglas.
- Riesgo observado antes de implementar: tinyglobby expone globSync CommonJS pero
  su `expandDirectories` predeterminado es true; Next no pasa false. La sustitución
  debe rechazarse si amplía raíces, aunque audit sea cero. No añadir adaptadores
  ni modificar el plugin para forzar compatibilidad.
- Archivos: package.json/lock, tests/unit/tooling/next-eslint-glob.test.ts,
  este registro, plan.md/research.md y docs/validation/quality-gates.md.
- Verificación prevista: RED con paquete original; instalación exacta con Node
  24.21.0/npm 11.19.0; GREEN y casos alternativos; npm audit y npm ls focalizados.
  Si hay incompatibilidad, retirar solo el override propio y reinstalar preservando
  el trabajo previo; documentar rechazo y riesgo residual. Gates completos pendientes.
- Mantenimiento: reevaluar API/opciones de ambos paquetes y estas pruebas en cada
  actualización de Next/tinyglobby; retirar el override cuando upstream repare la
  cadena. Audit cero no acredita equivalencia, mantenimiento futuro ni aceptación.
- Autorización: usuario autoriza expresamente correcciones/instalaciones necesarias
  para esta mitigación acotada. Revisión del compañero, aceptación y PR pendientes;
  sin commit/push, reset DB, cambios de runtime de aplicación ni instalación global.

- Resultado real: RED 1/22 (identidad fast-glob original), 21 contratos PASS.
  Con alias instalado: identidad PASS y audit 0, pero 10/22 fallan por raíces
  adicionales pages/src/src/nested, no por orden ni barras finales; los diez casos
  ESLint internos/externos/Link pasan. No hubo GREEN de la mitigación.
- Recuperación: retirado el override. La primera reinstalación conservó el alias
  en lockfile; se retiraron únicamente las tres entradas agregadas por el ensayo
  y se reinstaló de nuevo con runtime exacto. Árbol final restaurado a fast-glob
  3.3.1 → micromatch 4.0.8 → braces 3.0.3. Audit final exit 1: 5 altas,
  0 críticas. Pins Next/config 16.3.8, sharp 0.35.5 y source-map-js 1.2.2
  preexistentes preservados. Sin alias residual ni cambios funcionales.
- Pruebas retenidas como contrato de base y rechazo explícito del candidato:
  23/23 PASS tras recuperación; no afirman remediación ni audit cero. Fixtures
  temporales exclusivamente sintéticos, conservados para diagnóstico sin borrar.
  Gates completos/instalación limpia/revisión posteriores pendientes; comandos
  y evidencia del ensayo y recuperación en quality-gates.md. Sin commit/PR.

## EXTRA-010 — Adaptador privado de glob para ESLint de Next

- Fecha: 2026-10-06. Estado final: implementado con referencia npm a devDependency
  local raíz y entrada ESM síncrona index.mjs; verificación independiente final
  aportada: ci previo sobre mismo package.json/lockfile, ls --all, audits completo/
  producción, 403 pruebas/24 archivos (25 de compatibilidad), lint sin warnings,
  typecheck/build y smoke público Chromium 1/1 PASS, todos exit 0.
  Revisión del compañero, validación manual, DB y E2E privados completos pendientes.
  El intento inicial detenido y las continuaciones se conservan abajo como
  evidencia histórica, no como estado del árbol final.
- Origen: step 2 / T001/T095 y `odd/tasks/dependency-security.md`.
- Evidencia: EXTRA-009 rechaza el alias directo porque tinyglobby expande directorios;
  el consumidor real `get-root-dirs` requiere exclusivamente CommonJS
  `globSync(pattern, { onlyDirectories: true })`. La regla de enlaces usa esas raíces.
- Cambio mínimo autorizado: paquete local privado `next-eslint-glob-adapter`, dependencia
  exacta tinyglobby 0.2.17, expansión desactivada y normalización segura de cadenas/rutas;
  override solo `@next/eslint-plugin-next → fast-glob: file:./tools/next-eslint-glob-adapter`.
  No se modifica el plugin, las reglas, engines, scripts ni dependencias ajenas.
- Archivos: tools/next-eslint-glob-adapter/{package.json,index.mjs,README.md},
  tests/unit/tooling/next-eslint-glob.test.ts, package.json/lock, este registro,
  plan.md/research.md y docs/validation/quality-gates.md.
- Riesgos: subconjunto deliberado, no reemplazo general de fast-glob; validar API y defaults
  en cada actualización upstream, raíces de filesystem y rutas Windows/absolutas.
  Retirar override al repararse upstream; audit cero no acredita ausencia futura de riesgos.
- Verificación prevista: RED identidad antes de implementación, GREEN raíces y regla real,
  casos negativos/opciones no admitidas, instalación npm normal con runtime exacto,
  audit, árbol focalizado y diff --check. Si npm rechaza override local, detener sin
  modificar node_modules manualmente. Suites/build/browser/instalación limpia del nuevo
  árbol quedan al verificador padre; sin DB reset, commit ni push.
- Autorización: contrato explícito del usuario para esta continuación; no acredita revisión,
  aceptación ni merge. EXTRA-009 se conserva íntegro como ensayo histórico rechazado.
- Resultado observado: RED exit 1, identidad original fast-glob frente al adaptador;
  22/23 pruebas pasan. Instalación normal exit 0 con v24.21.0/npm 11.19.0,
  1 agregado/16 retirados y audit cero, pero el lockfile enlaza el override a
  `node_modules/@next/eslint-plugin-next/tools/next-eslint-glob-adapter` en lugar
  del paquete raíz. GREEN intentado exit 1: suite no carga por Cannot find module
  'fast-glob'; npm ls exit 1 (ELSPROBLEMS), fast-glob inválido. Audit exit 0 no
  acredita árbol usable ni remediación compatible. Advertencia allowScripts de
  unrs-resolver 1.12.2 conservada; no bypass ni cambio de política.
- Límite aplicado: detener ante override local no soportado, sin hack de node_modules
  ni rutas alternativas no autorizadas. Se entrega candidato/lockfile fallido como
  evidencia al padre, no como instalación funcional. Adaptador no ejecutado por las
  pruebas; normalización/raíces siguen sin verificación. Sin commit/PR/push/DB reset.

### Continuación autorizada de EXTRA-010 — resolución local portable

- El padre autoriza ensayar `file:../../../tools/next-eslint-glob-adapter` relativo
  al plugin y, si es necesario, devDependency raíz `file:tools/next-eslint-glob-adapter`
  con referencia override `$next-eslint-glob-adapter`. npm administra instalación,
  lockfile, enlaces y cache predeterminada fuera de node_modules; no hacks manuales,
  rutas absolutas, publicación, lockfile independiente ni bypass de scripts.
- Justificación: corregir el enlace inválido y resolver tinyglobby del paquete local
  desde el proyecto. Superficies y riesgos siguen siendo los de EXTRA-010.
- Verificación autorizada: toolchain temporal exacto, install, ci limpio, ls --all,
  pruebas focalizadas (incluidos fail-closed y enlace portable), audit y diff --check.
  Si ningún candidato funciona, restaurar con npm la cadena original funcional;
  suites completas/build/browser y revisión humana siguen pendientes.
- RED de esta continuación: suite no carga por módulo fast-glob ausente, exit 1,
  0 tests; reproduce el árbol roto recibido, no un fallo de comportamiento del adaptador.
- Resultado final: rechazado el spec relativo `file:../../../tools/...`: después
  de retirar únicamente las dos entradas inválidas del lockfile anterior, npm
  resolvió el enlace a tools y ci/25 pruebas pasaron, pero ls --all exit 1 lo marcó
  inválido. No se aceptó ese candidato pese a funcionar en las pruebas.
- Alternativa implementada: devDependency raíz
  `next-eslint-glob-adapter: file:tools/next-eslint-glob-adapter` y override anidado
  `fast-glob: $next-eslint-glob-adapter`. npm administra dos enlaces al mismo
  paquete tools y tinyglobby exacto 0.2.17 en el lockfile del proyecto; no se
  añadió tinyglobby como dependencia directa raíz ni lockfile independiente.
- Verificación final observada: install exit 0 (Node v24.21.0/npm 11.19.0), ci
  limpio exit 0 (464 paquetes), ls --all exit 0 sin inválidos; 25/25 pruebas
  focalizadas PASS y audit exit 0, cero vulnerabilidades. Pruebas amplían fail-closed,
  raíz literal, resolución de tinyglobby desde el adaptador y enlaces/spec portables.
  Se conserva implementación/API existente, expandDirectories false y reglas sin cambios.
- Cache predeterminada confirmada fuera de node_modules. Avisos ESLint no mantenido
  y unrs-resolver postinstall no cubierto por allowScripts conservados sin bypass.
  Sin rutas absolutas versionadas ni edición manual de node_modules; cambios previos
  ajenos preservados. Evidencia/comandos en quality-gates. Suites completas, lint,
  tipos, build, browser, DB y revisión humana del nuevo árbol siguen pendientes.
  Sin commit/PR/push/DB reset.

### Continuación autorizada de EXTRA-010 — ESM síncrono sin debilitar lint

- Evidencia de origen aportada por el padre: index.cjs contenía tres require imports
  rechazados por @typescript-eslint/no-require-imports. Se autoriza convertir solo
  sintaxis/entrada, no deshabilitar la regla ni excluir el paquete de lint.
- El padre renombró el artefacto propio index.cjs a index.mjs antes de esta ejecución.
  RED observado: lint exit 2 y suite focalizada sin cargar (0 tests) por main index.cjs
  obsoleto. No se atribuyen esos resultados a los tres errores originales informados.
- Implementación: imports ESM node:path/node:fs/tinyglobby y exportación nombrada
  globSync; main/exports apuntan a index.mjs, ./package.json accesible. Sin top-level
  await ni default export. Node 24.21.0 permite require(ESM) síncrono y Next recibe
  namespace.globSync; no cambian normalización, opciones, fail-closed ni API acotada.
- Pruebas: se conservan las 25, ampliando identidad con main/exports/resolución mjs.
  GREEN 25/25 antes y después de npm ci: diez variantes de raíces, diez casos con
  regla real, entradas/opciones negativas y contrato de instalación portable.
- Verificación real con npm exec Node 24.21.0/npm 11.19.0: install exit 0, ci exit 0
  (464 paquetes), lint exit 0 sin warnings, audit exit 0/cero vulnerabilidades y
  ls --all exit 0 sin inválidos. Comandos exactos en quality-gates.md. Se conservan
  avisos ESLint no mantenido y unrs-resolver postinstall sin allowScripts, sin bypass.
- Archivos de esta continuación: index.mjs, package.json del adaptador, README,
  test focalizado y este registro/plan/research/quality-gates. npm install no necesitó
  nuevos cambios del package.json ni lockfile raíz. Sin cambios de reglas ni DB.
- Límite: tipos, suite completa, build/browser/DB y revisión siguen pendientes del
  padre; no se afirma full build ni aceptación. Cambios ajenos preservados, sin
  commit/push/reset DB ni instalación global. Reevaluar require(ESM)/defaults ante
  cada actualización; retirar al repararse upstream.

### Finalización documental de EXTRA-010 — verificación independiente final

- Resultados aportados por el verificador independiente con Node 24.21.0 y npm
  11.19.0 exactos: npm ci previo exit 0 con el mismo package.json/lockfile;
  npm ls --all exit 0; audit completo y de producción exit 0, cero vulnerabilidades;
  suite completa 403 pruebas en 24 archivos, exit 0, incluidas las 25 de compatibilidad;
  lint exit 0 sin warnings; typecheck exit 0; build exit 0; smoke público Chromium
  1/1 exit 0. No se reconstruyen invocaciones completas no suministradas.
- Los errores de typecheck de guards exclusivamente de prueba fueron corregidos;
  los PASS finales superseden los fallos previos, que permanecen como historia.
  EXTRA-009 sigue rechazado: audit cero de aquel alias no acreditaba compatibilidad.
- La mitigación actual reemplaza realmente la cadena vulnerable mediante tinyglobby
  exacto 0.2.17, adaptador ESM síncrono y override limitado al plugin, con referencia
  a la devDependency local raíz; no es una supresión de audit ni de reglas.
- Aviso observado: lockfile externo del directorio padre ignorado, sin modificarlo.
  Aviso previo unrs-resolver/allowScripts sin cambios; política intacta y postinstall
  no validado independientemente. Sin actualización global de runtime.
- Límites: audit cero no garantiza mantenimiento futuro. Reevaluar consumidor/API/
  defaults en cada actualización y retirar adaptador/override al repararse upstream.
  Manual, DB/pgTAP, E2E privados completos, otras plataformas y revisión del compañero
  pendientes. Sin aceptación municipal, revisión humana completada, commit ni push.
- Esta finalización modifica solo documentación autorizada y registra evidencia
  aportada sin repetir gates; resultados actuales en quality-gates.md. Las notas
  anteriores de pendientes/fallos corresponden a sus etapas históricas.

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

## EXTRA-014 — Presupuesto local del recorrido E2E de autogestión

- **Fecha:** 2026-10-06. **Estado:** registrado antes de editar el test e
  implementado; controles locales PASS, GREEN funcional de CI y revisión pendientes.
- **Origen:** US2, escenarios de aceptación 1–6, FR-005/010/016/030/054 y T040
  de `specs/001-municipal-employment-portal/`; recorrido existente de registro,
  perfil/CV, dos postulaciones, retiro, suspensión/reactivación y archivo/restauración.
- **Evidencia aportada:** Quality/application de PR #42, run `37680658309`,
  agota `Test timeout of 30000ms exceeded` en el helper de login (línea 17),
  llamado desde la línea 151 tras restaurar el perfil; otros 56 E2E pasan.
  El mismo test pasa en otros PR. Esto no demuestra un defecto de autenticación.
- **Cambio mínimo implementado:** `test.setTimeout(120_000)` como primera instrucción
  del único recorrido largo, igual al presupuesto del recorrido asistido.
  Sin cambios de producción/auth, timeout global, expectativas de URL (5 s),
  aserciones, skips ni retries; sin nuevas pruebas estructurales de fuente.
- **Archivos/contratos:** `tests/e2e/candidate-self-service.spec.ts` y este registro;
  sin modificaciones de contratos, esquema, permisos ni requisitos municipales.
- **Autorización/coordinación:** usuario autoriza este ajuste acotado sobre
  `fix/dependency-security` en `d5183b2`; el padre conserva revisión, ODD y entrega
  Git. Este escritor no cambia de rama ni hace commits/push.
- **Riesgos/límites:** el presupuesto mayor puede demorar la detección de un bloqueo;
  no acredita rendimiento ni corrige un defecto funcional probado. Docker/Supabase
  local ausente impide RED/GREEN E2E significativo; usar el RED de CI aportado y
  colección/controles locales, sin resets, installs ni lectura de secretos.
  Node/npm locales 24.16.0/11.13.0 difieren de CI 24.21.0/11.19.0.
- **Verificación prevista:** colección Playwright antes/después, typecheck, lint,
  cobertura, build y diff check; resultados observados se registrarán aquí.
  La colección no ejecuta el cuerpo ni prueba su timeout registrado.
- **Resultados observados:**
  - `npx playwright test tests/e2e/candidate-self-service.spec.ts --list`: PASS
    antes/después (exit 0), mismos 31 tests en 6 archivos con dependencias.
    El timeout dentro del cuerpo no se ejecuta en colección: no se afirma
    verificación de metadata registrada ni GREEN E2E por este resultado.
  - `npm run typecheck`: PASS (exit 0).
  - `npm run lint`: PASS (exit 0), sin warnings; no reaparece fast-glob ausente.
  - `npm run test:coverage`: PASS (exit 0), 408 pruebas en 25 archivos;
    100% de 18 statements/12 branches/3 functions/15 lines solo del módulo
    configurado `src/lib/env/schema.ts`, no cobertura global ni del recorrido.
  - `npm run build`: PASS (exit 0); aviso de lockfile externo ignorado conservado.
    Carga normal de entorno por Next, sin inspección ni exposición de valores.
  - `git diff --check`: PASS (exit 0), sin errores de whitespace.
  GREEN funcional y DB pendientes de CI aislado/PR #42; sin aceptación
  ni revisión humana acreditadas, sin referencia de commit nuevo.

## Formato para próximas entradas

Usar un ID consecutivo `EXTRA-NNN` y registrar:

1. Fecha, responsable y estado.
2. Problema, evidencia y requisito/tarea aprobada de origen.
3. Cambio mínimo necesario y justificación.
4. Archivos y contratos afectados, riesgos y límites.
5. Autorización y coordinación, distinguiendo decisiones pendientes de aprobadas.
6. Verificación prevista y resultados reales.
7. Limitaciones, revisión y referencias de commit/PR cuando existan.
