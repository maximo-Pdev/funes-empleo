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

## EXTRA-011 — Salto al contenido y regresión pública local

- Fecha: 2026-10-06. Responsable: agente bajo decisión arquitectónica del padre.
  Estado final: implementación verificada con pruebas y gates independientes más
  browser público live; revisión nativa/humana y aceptación pendientes.
  Las notas posteriores de build/browser pendientes son evidencia de la etapa inicial,
  supersedida por la finalización documental siguiente.
- Origen: FR-070 / SC-009, T020/T087 y `odd/tasks/public-browser-readiness.md`.
- Problema/evidencia: el diagnóstico del padre observa BODY tras activar el salto
  y enlaces del header de 36/38px. El header está dentro de main, por lo que agregar
  tabindex sin moverlo no omitiría la navegación.
- Cambio mínimo: header y main hermanos en un fragmento; main#contenido con
  tabindex=-1, comenzando en el hero; footer hermano conservando contenido/estilos.
  Enlaces Ofertas/Ingreso con inline-flex, items-center y min-h-11 (44px).
  Agregar aserciones de estructura y navegación de teclado y cobertura acotada
  de páginas públicas con servicios simulados, sin presentarla como integración real.
- Justificación: cumplir accesibilidad ya requerida sin cambiar reglas de negocio,
  navegación, textos, CSS compartido, datos, permisos ni dependencias.
- Archivos/contratos: `src/app/(public)/page.tsx`,
  `tests/components/setup/home.test.tsx`, `tests/components/setup/public-offers.test.tsx`,
  `tests/e2e/setup.spec.ts` y este registro. Sin cambios de contratos de datos.
- Riesgos/límites: estructura/estilo sticky y orden de foco requieren browser real;
  mocks no prueban Supabase. NVDA/zoom manual y recorridos privados fuera de alcance.
- Autorización/coordinación: padre autoriza explícitamente el cambio header/main
  local y estos tests. Revisión/aceptación municipal y commit/PR pendientes.
- Verificación realizada: comando exacto
  `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/components/setup/home.test.tsx tests/components/setup/public-offers.test.tsx"`.
  RED exit 1: 2 fallos/3 PASS; primero tabindex ausente y clase min-h-11 ausente,
  segunda ejecución observa header aún dentro del main. GREEN final exit 0:
  13/13 en 2 archivos, incluyendo listado/detalle, vacíos/fuera de rango,
  opcionales, notFound y propagación de errores con mocks.
  Las pruebas opcionales de ofertas caracterizan comportamiento existente:
  no tienen RED de producto ni acreditan integración real.
- Checks ordinarios: `npm run lint` exit 0 sin warnings (antes y después de
  correcciones de tipos). `npm run typecheck` primero exit 2 por tres errores
  exclusivamente en tests nuevos (índice posiblemente undefined y opciones RTL);
  corregidos sin supresiones, repetición final exit 0.
- Limitaciones/resultados pendientes: E2E actualizado con Enter → main enfocado
  → Tab → CTA principal, reteniendo lang, título y axe; no ejecutado por este worker.
  Build/browser, NVDA/zoom manual y revisión independientes pendientes; sin commit/PR.

## EXTRA-012 — Compatibilidad de presentación de ofertas públicas

- Fecha: 2026-10-06. Estado final: implementación verificada con pruebas y gates
  independientes más browser público live; revisión nativa/humana y aceptación
  pendientes. Los pendientes de build/browser de la etapa inicial se superseden
  por la finalización documental siguiente.
- Origen: FR-024/FR-070, T045 y corrección display-only solicitada durante
  `odd/tasks/public-browser-readiness.md`; interfaz clara en español como restricción fija.
- Evidencia aportada: pantallas públicas muestran códigos legacy del seed `onsite`,
  `fixed_term` y fechas ISO sin formato de lectura local.
- Cambio mínimo: helper central de presentación para `onsite` → `Presencial` y
  `fixed_term` → `Plazo fijo`; desconocidos verbatim. Fechas calendario estrictas
  YYYY-MM-DD válidas → DD/MM/YYYY sin UTC ni offsets; entradas inválidas intactas.
  Aplicar a inicio/listado/detalle, conservando ISO en atributos time.dateTime.
- Justificación/límites: compatibilidad de presentación, NO catálogo municipal
  aprobado ni decisión legal. OQ-010/OQ-011 siguen abiertas; sin cambios a
  DeferredCatalog, formularios, validación de entrada, schema, RPC, auth o datos.
- Archivos: helper `src/features/openings/public-offer-display.ts`, tres páginas
  públicas, tests de helper y componentes setup, y este registro.
- Riesgos: traducir valores no observados o desplazar días por zona horaria;
  limitar traducción exacta y validar calendario sin objetos Date.
- Estrategia: RED con fixtures legacy y aserciones de etiquetas/fechas sobre páginas
  actuales; GREEN con helper, pruebas de bisiestos/invalidos/desconocidos, suite
  focalizada conjunta, lint y typecheck con toolchain temporal exacto autorizado.
- Autorización/coordinación: padre autoriza estas superficies exactas; preservados
  foco/estructura, pruebas y registro previos. Build/browser y revisión quedan al
  padre; sin commit/push ni aceptación municipal acreditada.
- Resultado observado con prefijo `npm exec --yes --package=node@24.21.0
  --package=npm@11.19.0 --call`: componentes RED exit 1 (4 fallos por modalidad
  cruda, 9 PASS); GREEN exit 0 (13/13), incluyendo contratación y todas las fechas
  visibles con dateTime ISO intacto. Helper 34/34 PASS; suite conjunta 47/47 PASS;
  `npm run lint` exit 0 sin warnings y `npm run typecheck` exit 0.
  Las pruebas del helper triangulan bisiestos (2000/2024 vs 1900/2100), días/meses
  inválidos, formato estricto y desconocidos verbatim; no tienen RED independiente.
  Mocks de páginas no prueban integración live, RLS ni Supabase.

### Finalización documental de EXTRA-011/012 — step 3

- Evidencia final aportada, sin repetir checks: verificador independiente fase 1
  con Node 24.21.0/npm 11.19.0 exactos; build, lint, typecheck y audit exit 0
  (0 vulnerabilidades), 447 pruebas/26 archivos exit 0 y setup Chromium reforzado
  1/1 PASS. Helper 34 y componentes públicos 13 son pruebas con mocks/dominio,
  distintas de la verificación live; no se suman otra vez al total.
- Browser final: seis rutas públicas en 360×800 y 1366×768, 12 capturas/contact
  sheets y `report.json` bajo `test-results/public-visual-review-final/` ignorado.
  Axe 0, overflow 0, idioma/H1/labels correctos. Inicio: main recibe foco tras
  salto, Tab sigue al CTA candidato; header ≥44px y hero sobre el pliegue.
- Supabase configurado local: health HTTP 200 y RPC published_offers funciona.
  Inicio 3 destacadas/listado 10/página 2 con 10/página 999 vacía; detalle live
  Presencial/Plazo fijo/31/12/2026, ISO machine-readable conservado. CTA anónimo
  lleva a sesión vencida. No se reparó configuración/datos; indisponibilidad
  anterior histórica, causa no confirmada.
- Malformado/desconocido: not-found español con HTTP 200 por streaming, no
  aserción 404. `page=0`/`page=abc`: error genérico seguro con reintento del
  boundary existente, no validación específica. Loading observado en desktop
  a DOMContentLoaded (44 ms), no timing mobile ni todos los estados.
- Formularios Auth no enviados y pending sin comprobar; sin reset DB. T087,
  NVDA, zoom real/matriz manual por rol, suite privada/DB actual y revisión
  nativa/humana siguen pendientes. No se acredita aceptación municipal ni merge.
- Archivos de esta finalización exclusivamente documental: este registro,
  `docs/validation/accessibility.md` y `docs/validation/quality-gates.md`.
  Se preservan evidencias históricas step 1/2 y cambios previos; sin source edits,
  commit ni push. Las invocaciones completas de gates no aportadas no se inventan.

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

### Cierre verificado de EXTRA-014

- Reparación: `f7ad322`; head publicado/verificado de PR #42: `98d8f4e`.
- CI [37686615198](https://github.com/maximo-Pdev/funes-empleo/actions/runs/37686615198):
  application y database PASS; recorrido del candidato 25,2 s; 57 E2E PASS.
  Vercel y Preview Comments PASS. No se reintentaron ni omitieron tests.
- Revisión nativa `review-6d2877daf500352c` aprobada y reconocida; observaciones
  informativas diferidas. Esto no acredita aprobación humana ni merge a main.
- El commit de este cierre solo modifica documentación; se observará su CI final.

## EXTRA-015 — Separación de credenciales locales y alojadas

- **Fecha:** 2026-10-07 (fecha observada del entorno). **Estado histórico de la etapa original:**
  fuente original verificada independientemente antes de bdd9362; no cubre la
  reducción posterior ni la reparación actual. Operaciones remotas se registran
  por el padre en PC2/PC4; revisión/publicación del candidato actual pendientes.
- **Origen:** PC1 de `odd/tasks/public-repository-credentials.md`, T003/T005/T021/T096
  y principios II/III/VI de la constitución: privacidad, identidades individuales
  y preservación del historial. No modifica comportamiento del producto.
- **Problema/evidencia:** scripts alojados reutilizan la contraseña versionada del
  seed local; el reset alojado incorpora el seed completo y elimina usuarios Auth.
  Los guards E2E por prefijo no verifican el destino de la aplicación.
- **Cambio necesario:** exigir variables privadas por identidad en CV/calidad
  alojados, resolverlas antes de transporte o navegador, centralizar fixtures E2E
  con validación estricta de ambos orígenes y bloquear reset MJS/SQL sin borrados.
- **Superficies:** helper/declaración/prueba Node en tests/fixtures y tests/unit/tooling;
  scripts CV/reset/calidad demo; ocho consumidores E2E incluido su helper;
  playwright.config.ts, package.json, workflow Quality, .env.example, quickstart,
  docs/operations/demo-credentials.md y este registro. Seed/manifiesto sin cambios.
- **Justificación/riesgos:** requisito de seguridad previo a una eventual publicación,
  no nueva función municipal. El reset alojado queda indisponible; una sustitución
  futura debe preservar identidades/contraseñas e historial y tener revisión propia.
  Bloquear código no invalida contraseñas ni funciones SQL ya instaladas: PC2/PC3
  siguen siendo necesarios. No se habilita producción ni visibilidad pública.
- **Autorización/coordinación:** usuario autoriza PC1 en el worktree aislado;
  checkout principal y cambios administrativos concurrentes intocables. El padre
  conserva tracker, revisión y entrega Git. Sin commits/push ni acciones remotas.
- **Verificación prevista:** RED/GREEN Node sin red, negativos de origen/credenciales,
  transporte simulado, guard SQL estructural y hashes; npm ci con lockfile existente,
  lint/typecheck/unit/build sin secretos ni Auth alojado. Runtime observado
  Node 24.16.0/npm 11.13.0 distinto de los pins; no debilitar engines.
- **Historia de verificación del escritor:**
  `node --test tests/unit/tooling/fixture-credentials.node.test.mjs`
  RED 12/12 fallos esperados (transporte alcanzado, generación SQL y destinos
  inseguros aceptados); GREEN inicial 20/20, triangulación final 28/28 PASS.
  Transporte/cliente/browser simulados, rechazo de la última identidad ausente,
  valores vacíos, URLs engañosas y errores de navegador sin credenciales en salida.
  Sintaxis de ocho .mjs, negativa SQL estructural y hashes normalizados de seed/
  manifiesto PASS; comparación inicial de bytes del manifiesto difería por CRLF.
  `npm ci` FAIL EBADENGINE con Node 24.16/npm 11.13 frente a 24.21/11.19:
  engines intactos, sin bypass ni cambios de lockfile. `npm run lint`,
  `npm run typecheck`, `npm run test:unit` y `npm run build` FAIL por ejecutables
  ausentes después de la instalación rechazada; no acreditan gates de aplicación.
  No se ejecutaron DB/E2E/reset/controles alojados reales ni se generó next-env.
  El RED fue presenciado por el escritor; no se atribuye al verificador independiente.
- **Verificación independiente vigente, registrada 2026-10-07:** evidencia
  aportada por el padre de gentle-ai-verify, con toolchain efímero mediante
  `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 -- …`.
  Node 24.21.0/npm 11.19.0 reales comprobados; `npm ci` PASS, 464 paquetes y
  audit 0; lint/typecheck PASS; `test:unit` PASS, 478 pruebas en 30 archivos;
  build PASS; tooling nativo PASS, 28/28 con Node exacto. Sin cambios generados
  rastreados. Estos PASS superseden la indisponibilidad inicial de los gates;
  se conserva EBADENGINE como historia, no como estado vigente. Este follow-up
  documental no repite comandos npm/tests ni acredita CI remoto o aceptación.
- **Prerrequisito operativo PC2, registrado 2026-10-07:** el intento de solo
  lectura con Supabase CLI oficial 2.117.0, `projects list --output-format json
  --log-level none`, falló por autenticación ausente. No hubo recuperación de
  proyecto/clave administrativa ni operación remota. El padre solicitará acceso
  seguro mediante login de la cuenta autorizada o `SUPABASE_ACCESS_TOKEN` en el
  proceso local, fuera del chat; nunca secretos en chat, archivos env ni argv.
  Tras autenticar y verificar alcance, la CLI soporta `projects api-keys` para
  capturar la clave solo en memoria y `db query` vía Management API para bloquear
  la función SQL ya instalada. Son capacidades disponibles, no acciones ejecutadas.
  El repositorio permanece privado hasta verificar invalidación remota, manejo
  de sesiones y bloqueo de la función instalada. El usuario acepta PDFs, documentos,
  fixtures sintéticos y metadatos Git para el objetivo público; esa autorización
  no sustituye los controles de seguridad pendientes.
- **Unicidad:** EXTRA-015 verificado frente a referencias locales main/origin,
  según evidencia aportada por el padre; no se afirma consulta del último remoto.
- **Límites de artefactos/revisión:** quickstart y guía operativa registran el bloqueo;
  las descripciones históricas de reset en plan/runbook requieren reconciliación
  por su propietario (fuera de las superficies delegadas). El slice PC1 informado
  antes de este follow-up documental tiene 550 líneas de diff, por encima de la
  previsión orientativa de 400; el padre decide entrega/revisión. No se omitieron
  pruebas para ajustar el presupuesto.
- **Revisión/aceptación y commit/PR:** pendientes; no acreditados por esta entrada.

## EXTRA-016 — Reducción del fixture demo a 10 identidades

- **Fecha:** 2026-10-08. **Estado histórico:** reducción de fuente bdd9362 incompleta,
  con checks application/database fallidos; no revisada ni aceptada como solución
  coherente. Supersedida por EXTRA-017: se conserva el demo pequeño, se rechazan
  variables por rol y la pérdida de cobertura de aceptación/concurrencia.
- **Origen:** autorización explícita del usuario para combinar la remediación de credenciales con la reducción del fixture demo; PC1 de `odd/tasks/public-repository-credentials.md` y principios II/III/VI de la constitución.
- **Problema y evidencia:** el fixture contenía 554 cuentas ficticias (4 admin / 500 candidate / 50 company) que el usuario considera innecesarias para la demo y que aumentan la superficie de credenciales a rotar/controlar.
- **Cambio implementado:** reducir el seed local y el manifiesto a 10 identidades ficticias (2 admin / 4 candidate / 4 company), con registros de negocio coherentes: 4 perfiles de candidato, 4 empresas, 8 ofertas y 8 participaciones. Conservar el password local determinista protegido por los guards de origen local. Reemplazar las ocho variables de entorno alojadas por tres variables por rol (`DEMO_ADMIN_PASSWORD`, `DEMO_CANDIDATE_PASSWORD`, `DEMO_COMPANY_PASSWORD`). Actualizar el resolver, test nativo, reset local, documentación y `.env.example`.
- **Justificación:** reduce la superficie de credenciales y cuentas de prueba mantenidas en el demo sin cambiar reglas de negocio ni habilitar producción/publicación.
- **Archivos y contratos afectados:** `supabase/seed.sql`, `tests/fixtures/acceptance-manifest.json`, `tests/fixtures/credentials.mjs`, `tests/fixtures/credentials.d.mts`, `tests/unit/tooling/fixture-credentials.node.test.mjs`, `tests/fixtures/reset-local.mjs`, `.env.example`, `docs/operations/demo-credentials.md`, `specs/001-municipal-employment-portal/quickstart.md`, `odd/tasks/public-repository-credentials.md` y este registro.
- **Riesgos y límites:** los tests E2E y pgTAP que esperaban 500/50/100/1000 quedan desactualizados para este PR; el fixture de concurrencia (`prepare-demo-concurrency.sql`) queda marcado como no soportado con 10 cuentas. No se ejecutaron resets ni operaciones remotas; el ajuste remoto (borrado de 544 cuentas sobrantes y actualización de la bóveda DPAPI) es parte de la continuación operativa PC2/PC3.
- **Autorización y coordinación:** usuario autoriza explícitamente la reducción a 10 cuentas y el PR único; el padre conserva revisión, ODD y acciones Git. Sin commits/push/merge por parte de este escritor.
- **Verificación prevista:** `node --test tests/unit/tooling/fixture-credentials.node.test.mjs`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`.
- **Resultados:** pendientes de ejecución en el worktree; se reportarán antes del handoff.
- **Limitaciones:** no se verifican E2E ni pgTAP en este ámbito; requieren actualización aparte o fixture de concurrencia revisado.

## EXTRA-017 — Reparación coherente de datasets y credenciales de PR #50

- **Fecha:** 2026-10-08. **Estado:** registrado antes de cambios; implementación/verificación pendientes, sin revisión acreditada.
- **Origen:** PC1 reconciliado, T021/T089/T095, FR-003 y SC-003/008/008A; autorización del usuario para corregir todos los checks en un único PR.
- **Evidencia:** bdd9362 reduce el seed pero no los contratos de pgTAP/E2E: métricas, referencias a admin3/4, FK de sesiones y rollback de auditoría fallan. Tres variables por rol contradicen las contraseñas únicas ya existentes. La revisión del código previo no cubre esa reducción.
- **Cambio mínimo previsto:** conservar seed interactivo 2/4/4; generar desde la misma plantilla SQL un fixture TEST-ONLY 4/500/50/100/1000, activado explícitamente solo por aceptación local aislada/CI. Manifiesto con datasets separados, hashes y expectativas. Resolver exactamente las diez identidades alojadas con variables individuales, sin fallback ni rotación. Ejecutar concurrencia de cuatro admins únicamente en aceptación local y diagnosticar la aserción de ofertas restauradas sin bajar expectativas.
- **Superficies:** seed, fixtures/generador/reset local, credenciales y pruebas tooling; runner local/CI/package; consumidores E2E/performance/demo; pruebas SQL y documentación operativa/quickstart. Solo tests/tooling/docs: no migraciones ni políticas de producto.
- **Riesgos/límites:** nunca cargar aceptación al demo alojado; exigir destinos exactos y propiedad del servicio aislado antes del reset. Ninguna operación alojada, bóveda, borrado Auth o aceptación municipal. Checks DB/E2E requieren servicio local propio o CI después del push del padre.
- **Autorización/coordinación:** padre autoriza superficies técnicas ampliadas en worktree aislado; conserva tracker, revisión y commit/push/merge. Checkout principal y sus servicios intactos. PR único; no se reduce el diff omitiendo checks.
- **Verificación prevista:** RED/GREEN nativo de identidades y datasets/entrypoints, negativos remotos, hashes/SQL generado; Node 24.21.0/npm 11.19.0 efímeros para tooling/lint/typecheck/unit/build. DB/E2E solo en entorno de propiedad verificada; reportar pendientes honestamente.
- **Supersede EXTRA-016:** la reducción interactiva sigue vigente, pero sus variables por rol y la declaración de concurrencia no soportada se rechazan. Los fallos de checks no se aceptan como limitación permanente. EXTRA-015 conserva evidencia histórica de la fuente anterior, no aprobación del candidato actual.
- **Implementación:** `supabase/seed.sql` sigue creando exactamente 10 identidades y 4/4/8/8 registros. El generador deriva SQL TEST-ONLY 4/500/50/100/1000 desde el mismo bloque parametrizado; manifiesto separado y hashes normalizados. `test:db` y el runner E2E seleccionan aceptación explícitamente. El último proyecto E2E hace reset frío y prueba cuatro admins/barrera/≤5 s/versiones/auditorías, sin crear admins alojados nuevos. Resolver exacto de diez variables individuales, controles CV interactivos de 4 candidatos y checks de demo sin atribuirles el benchmark grande.
- **Diagnóstico 030:** el seed pequeño da a company1 una oferta publicada y otra cerrada; esta última se excluye correctamente del archivo/restauración. Aceptación da dos publicadas (1 y 51), más la nueva oferta del test: la expectativa de tres borradores se conserva. Se agregaron precondiciones explícitas y una oferta terminal propia que debe permanecer cerrada/no archivada. Diagnóstico de fuente; confirmación SQL funcional pendiente, sin cambios de políticas.
- **RED observado:** `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:tooling"` exit 1, 20 PASS/15 FAIL contra comportamiento de bdd9362: variables individuales rechazadas, datasets/generador ausentes, flags de aceptación sin soporte. Dos ejecuciones intermedias 34/35 fallaron únicamente por hashes aún pendientes; no se presentan como GREEN.
- **GREEN y triangulación observados:** mismo comando exit 0, primero 35/35 y después de refactor/negativos adicionales 38/38. Cubre los entrypoints reales con transportes interceptados, exactamente diez identidades/variables vacías, rechazo admin3/4 alojados y fallback por rol, aceptación local de cuatro admins sin credenciales alojadas, rechazo de orígenes remotos y servicios sin propiedad, parámetros/conteos/outcomes, hash del PDF y equivalencia de SQL generado. Estos tests no ejecutan SQL real.
- **Gates observados:** cada comando ejecutado en foreground dos veces, ambas exit 0, con prefijo exacto `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call`: `"npm run lint"` sin warnings; `"npm run typecheck"`; `"npm run test:unit"` 478 pruebas/30 archivos; `"npm run build"`. `git diff --check` PASS. No cambió `next-env.d.ts`; no fue necesario restaurar artefactos rastreados.
- **Pendientes honestos:** `npm run test:db`, `npm run test:e2e:full` y concurrencia SQL no ejecutados: no se verificó un servicio local de propiedad exclusiva, y el servicio principal/concurrente no se toca. Requieren Quality/application y database del SHA que publique el padre. No afirmar DB/E2E PASS, checks de PR nuevos, aceptación humana o revisión. Sin stage/commit/push/merge, operaciones alojadas, lectura/cambio de bóveda ni cambios al tracker del padre. Referencias de commit/revisión siguen pendientes.

### Continuación funcional de EXTRA-017 — contrato SQL de conteos de aceptación

- **Origen/autorización:** reparación acotada solicitada por el padre después del push de `efd15f4e255f140db232b0a7d81ec608a499d5d3`; no operación de autoridad de revisión.
- **Evidencia aportada:** Quality `37760793365`: tooling 38 PASS; database 858 tests/10 fallos y application falla durante reset por los mismos diez conteos de `002_fixture_counts.test.sql`. Inspección de fuente: esa prueba aún exige el seed pequeño aunque el runner selecciona aceptación. Sus dos páginas también conservan limit/offset 2, que pueden pasar SQL sin comprobar el protocolo aprobado de 10 filas.
- **Cambio previsto antes de editar:** restaurar los 13 conteos/consultas estrictos de aceptación conforme a `aac526a` y al manifiesto explícito, incluyendo activos, contrataciones/cobertura y páginas. Agregar contrato nativo contra las consultas SQL reales para impedir nueva divergencia. No derivar expectativas de conteos observados ni cambiar seeds, manifiesto, políticas o cuatro administradores municipales.
- **Superficies:** `supabase/tests/002_fixture_counts.test.sql`, prueba nativa de datasets, guía de credenciales y esta entrada. Demo interactiva sigue separada y verificada por generador/manifiesto; `supabase test db` después de reset default pequeño no es el comando de aceptación.
- **Verificación prevista:** RED/GREEN tooling y lint/typecheck/unit/build con Node 24.21.0/npm 11.19.0 efímeros; whitespace. DB/E2E pendientes de nuevo CI: ningún reset de servicios compartidos. No stage/commit/push/merge, operaciones alojadas/bóveda ni manipulación de revisión/tracker.
- **RED observado:** `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:tooling"` exit 1: 40 PASS/12 FAIL. Diez fallos por conteos pequeños frente a aceptación, más dos fallos por limit/offset 2 en lugar de 10. La búsqueda de candidato siguió pasando. Esto caracteriza la fuente SQL real sin ejecutar PostgreSQL; los diez fallos funcionales de CI son evidencia aportada por el padre.
- **Implementación/GREEN:** restaurados los 13 `select is` y sus consultas a la versión estricta de `aac526a` (solo comentarios nuevos de separación). Mismo comando exit 0, 52/52 PASS. Contrato cubre queries/filtros/joins/literales y páginas, junto con los guards/hashes/generador previos. Seed default, fixture/manifiesto y regresión de oferta terminal de 030 intactos.
- **Gates observados de esta continuación:** con el mismo prefijo efímero exacto y comandos `"npm run lint"`, `"npm run typecheck"`, `"npm run test:unit"`, `"npm run build"`: todos exit 0; lint sin warnings, unit 478 pruebas/30 archivos. `git diff --check` exit 0; repetición final del comando tooling exit 0, 52/52 PASS. `next-env.d.ts` sin diff; ninguna restauración necesaria. No instalación ni cambio de dependencias.
- **Límites actuales:** no se ejecutan DB/E2E locales porque no hay destino de propiedad exclusiva disponible; ningún reset de servicios compartidos. Nuevo CI del próximo SHA publicado por el padre sigue pendiente. No se acredita CI PASS ni aprobación del candidato reparado; sin operaciones de autoridad de revisión, stage/commit/push/merge, hosted/vault ni tracker.

### Continuación funcional de EXTRA-017 — CV ajeno según dataset

- **Evidencia aportada por el padre:** HEAD `1f24db63ddda617d05d4eab781235565461b2720`, Actions `37782732227`: database PASS, application FAIL en el guard Storage de `reset-local.mjs`. No se atribuye ese resultado a una filtración alojada ni a una política defectuosa: candidate2 tiene derivaciones legítimas para company1 en aceptación (participaciones 2/502, ofertas 1/51).
- **Cambio previsto antes de editar:** seleccionar candidate11 como CV extranjero para company1 en aceptación y conservar candidate2 en interactivo. Mantener las dos descargas positivas y los cuatro rechazos estrictos (CV ajeno de company1, target de company2, URL firmada y anónimo), con diagnóstico separado. No cambiar RLS, migraciones, criterios ni identidades.
- **Prueba prevista:** RED/GREEN nativo enlazado a la selección real de `otherPath`; reconstruir independientemente derivaciones activas desde parámetros/fórmulas del seed para ambos datasets, verificando target autorizado y probe verdaderamente extranjero. Guards y hashes previos intactos. SQL/Storage real y E2E pendientes del nuevo CI, sin servicios compartidos, Docker o Auth alojado.
- **Superficies/autoridad:** solo reset local, test nativo, guía y esta entrada; padre conserva tracker, revisión y entrega. No stage/commit/push/merge ni operaciones de autoridad/bóveda. Gates con Node 24.21.0/npm 11.19.0 efímeros, sin afirmar E2E verde.
- **RED observado:** `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:tooling"` exit 1, 54 PASS/1 FAIL: el CV configurado para aceptación tiene una derivación activa a company1. El mismo contrato interactivo y la presencia de todos los probes pasan. Test de contrato sobre selección real y enumeración independiente de parámetros/fórmulas de SQL; no ejecución PostgreSQL/Storage.
- **GREEN observado:** mismo comando exit 0, 55/55 PASS tras seleccionar 11/2 según dataset. Target1 sigue legítimamente referido a company1 y no a company2; el CV negativo existe y está referido a company2 pero no a company1. Se mantienen dos descargas positivas exactas/hash y cuatro negativos estrictos, ahora con mensajes separados. No cambios de políticas, seeds, manifiesto ni ventana de acceso.
- **Gates observados:** con el mismo prefijo exacto, `"npm run lint"`, `"npm run typecheck"`, `"npm run test:unit"`, `"npm run build"` exit 0; lint sin warnings, unit 478/30 archivos. `git diff --check` exit 0; repetición final tooling 55/55 PASS. `next-env.d.ts` sin diff, sin restauración necesaria. No se ejecutó cobertura instrumentada adicional, DB/E2E, reset real, Docker o hosted/vault. Nuevo CI del siguiente SHA del padre pendiente: database PASS/application FAIL de `37782732227` es evidencia previa aportada, no verificación de esta reparación.

### Corrección acotada de EXTRA-017 — R3-E2E-SEED-MISMATCH

- **Propuesta previa a cambios:** hallazgo nativo aportado por el padre: `test:e2e` público invoca Playwright crudo contra 4/4/8/8, incompatible con T095/SC-003/008/008A (500/50/100/1000).
- **Cambio necesario:** reutilizar el runner local protegido de `test:e2e:full` y reenviar argumentos al CLI Playwright directo, sin recursión ni duplicar resets. Superficies: package.json, runner, test nativo, guía operativa y esta entrada; datasets/Auth/RLS intactos.
- **Autorización/límites:** padre autoriza esta corrección de fuente; revisión observada del candidato corregido pendiente, no aprobada. Reset solo local propio; nunca servicio compartido/alojado.
- **Verificación prevista:** RED/GREEN tooling, lint/typecheck/unit/build con Node 24.21.0/npm 11.19.0; DB/E2E reales pendientes de CI aislado tras corrección de puertos por el padre.
- **Resultado observado:** `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:tooling"`: RED 56 PASS/1 FAIL (entrypoint público); GREEN 57/57, sin skips, incluido rechazo de confirmación ausente antes del transporte simulado. Mismo prefijo con `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:unit` (478/30) y `npm run build`: exit 0; lint sin warnings. Build con placeholders públicos ficticios solo en memoria.
- **Límites:** sin DB/E2E/CI ni aprobación nativa acreditados; guards/datasets/concurrencia intactos. `next-env.d.ts` restaurado byte-idéntico a HEAD; lockfile sin cambios. Diff whitespace PASS; sin acciones Git de escritura. Avisos npm de ESLint sin soporte y postinstall unrs-resolver no autorizado conservados.

## EXTRA-018 — Confirmación y visibilidad de contraseña (A01)

- **Fecha/responsable/estado:** 2026-10-17, Mateo; registrado antes de implementar,
  ahora implementado y verificado localmente. Revisión del compañero pendiente.
- **Origen y autorización:** arreglos.txt, decisiones directas y solicitud de Mateo
  de comenzar en `feat/portal-functional-adjustments`; A01/T098–T101 y FR-001/010/020.
  Alcance confirmado incorporado a spec, plan, contratos y matriz. La autorización
  acotada no acredita aprobación retrospectiva del Draft global ni revisión del compañero.
- **Problema/evidencia:** ambos formularios de autorregistro carecen de confirmación
  y de control de visibilidad; sus esquemas servidor aceptan el alta con una única
  contraseña. La actualización ya compara dos campos, pero no permite mostrarlos.
- **Cambio mínimo:** esquema compartido de 6–128 caracteres y coincidencia exacta,
  validación de acciones y servicios previa a Auth, componente cliente reutilizable
  para mostrar/ocultar, confirmación en ambos registros y ajuste de sus recorridos.
- **Superficies:** validadores, acciones y componentes de accounts/candidates/companies;
  pruebas unitarias, componentes y E2E; página de registro candidato para corregir
  la indicación de cuatro campos; artefactos citados y este registro.
- **Contratos/modelo:** confirmación transitoria descartada antes de Auth/metadata;
  sin migración, secretos, paquetes, roles, RLS ni cambios al diseño visual global.
- **Coordinación:** Mateo toma las funciones y su compañero lo visual según la
  distribución informada. El componente conserva estilos existentes y no modifica
  cimientos globales. Revisión del otro desarrollador mediante PR pendiente.
- **Riesgos y recuperación:** el campo se vuelve obligatorio también en servidor;
  adaptar clientes de pruebas que registran cuentas. Recuperación por reversión del
  incremento sin operaciones de base. No alterar el comportamiento de sesiones en A01.
- **Verificación prevista:** RED/GREEN de ausencia, discordancia, tamaño, acciones y
  payload de Auth; mostrar/ocultar sin envío ni pérdida de valor; tests existentes,
  typecheck, lint, build y navegador con datos ficticios. Resultados pendientes.
- **Revisión, aceptación y commit/PR:** pendientes; no acreditados.

### Resultados locales finales de EXTRA-018

- RED inicial: 30 FAIL / 10 PASS; recuperación nativa: 2 FAIL / 7 PASS. GREEN
  final: 520 pruebas/32 archivos con `npm run test:unit -- --maxWorkers=4`.
- `npm run typecheck`, `npm run lint` y `npm run build`: exit 0, Node 24.21.0/npm
  11.19.0. Se corrigieron un acceso opcional de mock y claves JSX de la prueba;
  sin desactivar reglas. El build TypeScript final también pasó.
- Dos builds se detuvieron en compilación dentro del sandbox y se cancelaron;
  la ejecución ampliada del mismo comando compiló correctamente. Vitest usó
  TEMP/TMP en `test-results/auth-tmp` tras un ENOENT de temporales del sandbox.
  Solo variables de proceso; sin cambios de configuración ni secretos.
- Chromium final: 3/3 PASS con teclado Enter/Espacio, confirmación independiente,
  conservación de datos en validación nativa y rechazo servidor ante bypass.
  Axe sin violaciones en ambos registros, sin desbordes a 360×800. El primer
  intento tuvo ambigüedad entre el alert del formulario y el anunciador de Next;
  se acotó el selector al formulario. El flag CLI de captura no soportado se
  retiró; no se modificó la política de capturas/trazas de la suite.
- Revisión técnica propia con guía React realizada; no equivale a revisión del
  compañero. Sin dependencias, migraciones, secretos ni datos reales agregados.
  `git diff --check` PASS. No se ejecutaron pgTAP ni recorridos completos privados
  con Auth/correo/DB. El cambio autenticado de contraseña se cubre en componentes
  y validación, no con un usuario real en navegador.
- T098–T101 verificadas; detalle en `docs/implementation/functional-adjustments.md`.
  Entrega mediante el PR de `feat/portal-functional-adjustments`; revisión del
  compañero y aceptación siguen pendientes.

### Detalle necesario de A01 — ancho del control en AuthSurface

- **Evidencia previa a editar:** `auth-forms.module.css` asigna `width: 100%` a todos
  los botones del formulario. Aplicado al nuevo control junto al input, puede
  ocupar el ancho de la fila y comprimir el campo en actualización de contraseña.
- **Cambio mínimo:** acotar `width: auto` a botones `type=button` con `aria-controls`
  dentro de esa superficie. Es compatibilidad del control funcional, sin cambiar
  paleta, layout global ni propiedad del diseño. Cobertura: build, tipos y revisión
  del componente; recorrido autenticado de actualización con DB pendiente.

### Detalle necesario de A01 — prevenir reinicio ante discordancia

- **Evidencia previa a editar:** el recorrido Chromium muestra el mensaje servidor
  correcto, pero React reinicia los campos no controlados después de la acción.
  Agregar la confirmación vuelve frecuente ese error y obliga a recargar datos.
- **Cambio mínimo:** el control actualiza la validez nativa de confirmación al
  editar cualquiera de las dos contraseñas. El navegador impide enviar valores
  distintos sin reiniciar campos; el servidor conserva la misma validación ante
  bypass o ausencia de JavaScript. No se almacenan valores en React ni en storage.
- **RED observado:** prueba adicional de componentes, 7 PASS / 2 FAIL, porque la
  discordancia no establece `validity.customError`. Verificar recuperación por
  edición de cualquiera de los campos y bypass de `novalidate` en Chromium.

### Continuación de EXTRA-018 — fallos de application en PR #52

- **Fecha/origen/autorización:** 2026-10-17; Mateo solicita reparar el job
  application del PR #52, commit `9392144`, Quality `39055781126`, job
  `117463342954`. Database, typecheck, lint, tooling y coverage aprobaron.
- **Evidencia previa a editar:** el alta de reclamante en
  `tests/e2e/assisted-candidate.spec.ts:98` usa `getByLabel("Contraseña")`, que
  ahora coincide con cuatro controles, y no completa confirmación. La prueba
  `candidate-self-service.spec.ts:118` recibe experiencia concatenada en lugar
  de la corrección exacta; su guardado anterior se sigue inmediatamente de
  `reload`, sin esperar la confirmación de la acción. No se atribuye todavía
  la concatenación a una causa de producto demostrada.
- **Cambio mínimo previsto:** adaptar el registro restante a coincidencia exacta
  y confirmación; comprobar el valor editado antes de enviar y esperar mensaje
  de éxito y botón habilitado antes de recargar. Mantener intacta la aserción
  del texto persistido y todos los recorridos, sin sleeps, retries ni skips.
- **Superficies/contratos/riesgos:** solo los dos E2E y evidencia documental de
  A01/T100–T101. Sin código de producto, permisos, esquema, dependencias o datos
  reales. El nuevo CI determinará si queda un problema adicional; no debilitar
  las expectativas para obtener un PASS.
- **Verificación prevista:** lint, typecheck, suite unitaria y recolección de E2E;
  nuevo commit y push al mismo PR para ejecutar los jobs aislados completos.
  Docker local no está iniciado; no se realizan resets ni cambios alojados.
- **Resultado local:** ambos E2E corregidos según el alcance anterior; typecheck y
  lint exit 0; unitarias 520/32 PASS; Playwright descubre 61 pruebas/15 archivos;
  whitespace PASS. El código de producto y el build anterior permanecen intactos.
- **Entrega/verificación funcional:** continuación en el mismo PR #52. El resultado
  remoto del SHA de corrección se conserva en sus checks Quality; esta entrada
  registra los resultados locales previos al push y no los sustituye. Revisión
  del compañero y aceptación global siguen pendientes.

## EXTRA-019 — Persistencia de sesión y navegación por cuenta (A02/A03)

- **Fecha/estado:** 2026-10-17; registrado antes de implementar.
- **Origen/autorización:** Mateo solicita continuar A02/A03 tras el merge del PR
  #52, en `feat/session-persistence-profile-navigation`; T102–T105 y FR-001/004.
- **Problema/evidencia:** proxy solo cubre account/update-password; los Server
  Components no pueden persistir cookies renovadas. Tres headers públicos
  muestran login de forma incondicional. El callback setAll recrea la respuesta
  y omite cabeceras del SDK: 0.12.7 entrega cache headers solo en la primera
  escritura, que no debe perderse ante una segunda escritura.
- **Cambio mínimo:** matcher para páginas/handlers dinámicos y acumulación por
  request de cookies/cabeceras; función server-only de enlace por cuenta activa;
  tres headers con sus clases existentes; invalidación de layout al login/logout.
- **Justificación/contratos:** conservar sesión válida al navegar, sin cambiar
  duración de Auth ni eludir revocación, suspensión, archivo, guards o RLS.
  El header recibe href/label sin PII. Modelo persistido y variables sin cambios.
- **Archivos:** proxy, accounts/actions/navigation, tres páginas públicas,
  pruebas unitarias/componentes/E2E y artefactos de trazabilidad citados.
- **Coordinación:** Mateo conserva funcionalidad y su compañero lo visual;
  no se rediseña ni cambia UI global. Revisión del compañero mediante PR pendiente.
- **Riesgos/recuperación:** identidad/cookies no deben entrar a caché compartida;
  conservar opciones y chunks eliminados, respuesta final y controles de seguridad.
  Reversión del código, sin recuperación de base ni migraciones.
- **Verificación prevista:** RED/GREEN matcher real de Next, setAll múltiple,
  relectura por request, visibilidad por rol, logout explícito y caché; regresiones,
  typecheck/lint/build y E2E local ficticio por rol con expiración de metadata
  de sesión sin falsificar firma JWT ni registrar tokens.
- **Fuentes técnicas:** documentación oficial Supabase SSR y código/tipos
  instalados de @supabase/ssr 0.12.7; sin cambios de dependencia. Checklists
  requirements 16/16 y mvp-readiness 77/77, sin edición de sus marcas.
- **Implementación:** `src/proxy.ts` amplía matcher y conserva cookies/opciones y
  cabeceras entre callbacks; `accounts/actions.ts` invalida layout al login/logout;
  `accounts/navigation.ts` proyecta solo href/label después de validar sesión/cuenta.
  Inicio/listado/detalle consultan proyección y ofertas en paralelo. Sin cambios
  de esquema, permisos, Auth expiry, dependencias, secretos o estilos globales.
- **RED/GREEN:** 18 FAIL / 26 PASS con el comportamiento anterior; focalizado
  final 52/52. Regresión final: 559 pruebas/35 archivos PASS; tooling 57/57;
  typecheck/lint/build exit 0. El primer typecheck del E2E detectó propiedad
  expires_at de tipo unknown; se proyecta como número tras validarla, sin any.
- **Navegador/consulta real:** tres cuentas ficticias activas verificadas mediante
  un conteo SQL de solo lectura. Chromium contra Supabase local existente:
  10/10 PASS; seis escenarios de renovación en rutas públicas/privadas por rol,
  enlaces correctos, recarga, restauración de cookies y logout; tres de contraseña
  y smoke público. Repetición de los seis de sesión incluyendo reutilización de
  cookies en otra pestaña después del logout: 6/6 PASS, acceso revocado y header
  público sin enlace privado. No se falsifica JWT; solo expires_at local del SDK.
- **Entorno:** Docker Desktop iniciado desde su instalación por usuario; el intento
  de la ruta global inexistente falló sin efectos. Contenedores locales existentes
  consultados, sin reset, cambios de negocio, migraciones ni operaciones alojadas.
  Configuración publicable local capturada en memoria desde CLI; no se imprimen
  tokens o claves ni se crean archivos env. Servidor Next de Playwright finalizado;
  Docker y servicios existentes permanecen activos. Build requirió ejecución
  ampliada por la limitación de Turbopack del sandbox ya observada en A01.
- **Observaciones/límites:** avisos Next “destination stream closed early” durante
  navegación, sin fallos del runner; no se investiga ni cambia streaming en este
  bloque. Colección completa 67 pruebas/16 archivos, sin afirmar su ejecución:
  CI completo, pgTAP, revisión del compañero y aceptación global pendientes.
- **Trazabilidad:** T102–T105 verificadas localmente; matriz y estado de implementación
  actualizados. Entrega por PR desde `feat/session-persistence-profile-navigation`;
  revisión del compañero e integración a `main` pendientes.

### Corrección de CI del PR #53 — contrato semántico de caché

- **Fecha/autorización:** 2026-10-17; Mateo solicita solucionar `application`.
  Continuación de EXTRA-019/T105 en la misma rama y PR, sin ampliar el producto.
- **Evidencia:** Quality #86, run `39065451675`, job `117492041374`: typecheck,
  lint, tooling, cobertura y build PASS; pgTAP 858 PASS y job database PASS.
  El E2E de métricas exige literalmente `private, no-store`, pero el proxy
  entrega `private, no-cache, no-store, must-revalidate, max-age=0`.
  Dos E2E PASS, uno FAIL y 64 no ejecutados por dependencia; no es un PASS global.
- **Cambio propuesto antes de implementar:** comprobar directivas `private` y
  `no-store`, rechazando `public`, tanto en el rechazo anónimo como empresarial
  del CSV en `tests/e2e/admin-metrics.spec.ts`. Mantener 403 y ausencia de datos;
  no reducir cabeceras, controles de acceso ni expectativas para ocultar fallos.
- **Justificación/alcance:** el contrato exige privacidad y no almacenamiento,
  no un orden o cantidad exacta de directivas. No cambia spec, plan, permisos,
  datos, dependencias, variables ni arquitectura. Revisión del compañero pendiente.
- **Riesgos/recuperación:** evitar aceptar directivas parecidas o una respuesta
  pública; separar por comas y comparar tokens completos. Reversión del test,
  sin migración ni recuperación de datos.
- **Verificación prevista:** reproducir el E2E actual contra servicios locales
  existentes sin reset; repetir corregido, typecheck/lint y nueva ejecución
  completa de Quality mediante commit/push al mismo PR.
- **Resultado local:** RED reproducido con el mismo error de Quality #86;
  GREEN 1/1 contra Next de producción y Supabase local existente, sin reset.
  El test ahora comprueba rechazo, privacidad, no almacenamiento y ausencia
  de datos para ambos actores; el código de producto permanece intacto.
  Typecheck, lint y `git diff --check` PASS. Se entrega la corrección por el
  mismo PR #53; el resultado remoto se registra en sus checks, sin inferirlo
  del resultado focalizado ni acreditar revisión humana.

## EXTRA-020 — Slugs públicos al publicar ofertas (FR-024A)

- **Fecha/responsable:** Máximo autoriza el 2026-10-17; ratifica publicar nuestra implementación el 2026-10-18 tras cierre sin merge del PR #54.
- **Problema/origen:** UUID visibles en enlaces públicos; se requieren URLs legibles, compartibles y estables sin cambiar identidad ni permisos.
- **Cambio:** `job_openings.slug` único, asignado en primera publicación y protegido contra cambios; título normalizado y sufijo aleatorio con reintentos/bloqueo. Backfill de publicación histórica, consulta pública por slug y enlaces asociados; UUID interno y RPC existente conservados.
- **Superficies:** migración `20261018000000_opening_public_slugs.sql`, pgTAP021, servicio/validación/tipos, páginas públicas y selección del candidato, pruebas y artefactos FR-024A. Sin rediseños de portada/administración ni alteración de navegación por sesión de PR #53.
- **Riesgos/recuperación:** migración, privacidad y concurrencia; aplicar base antes que aplicación. Recuperación preferida: revertir app y conservar slugs/RPC; nunca resetear demo ni regenerar enlaces. Contratos: `docs/validation/public-offer-slugs.md`.
- **Verificación/estado:** evidencia previa local y nueva entrega separadas en `odd/tasks/public-offer-slugs.md`. Checks del candidato recuperado, revisión independiente, historial remoto, migración y publicación pendientes; no afirmar aceptación municipal ni despliegue antes de lectura de retorno.
- **Autorización:** sesiones existentes GitHub/Vercel/Supabase, destino demo exacto autorizado; sin reset alojado, secretos publicados ni producción municipal. Identificadores EXTRA020/021 reconciliados con los EXTRA018/019 ya integrados.

## EXTRA-021 — Node 24 LTS y recuperación reproducible del entorno

- **Fecha/responsable/origen:** Máximo autoriza reparación local y actualización del runtime el 2026-10-17, necesarias para verificar y publicar FR-024A.
- **Cambio/evidencia:** Node24.22.0 LTS/npm11.19.1 oficiales, checksum verificado; manifiestos, `.node-version`, CI y guías activas alineados. `npm ci --ignore-scripts` corrigió junctions del adaptador ESLint hacia la ubicación anterior, sin cambiar el grafo de dependencias ni instalar globalmente.
- **Riesgos/recuperación:** entorno/CI; conservar engine-strict, scripts no aprobados desactivados, versiones históricas documentadas y Node global. Reversión de pins posible sin cambio de datos.
- **Verificación/estado:** controles previos de aplicación correctos; comprobar nuevamente recuperación sobre main y CI del commit exacto. Publicación autorizada; resultados y referencias en el ledger de entrega.
- **Compatibilidad alojada (2026-10-18, propuesta previa):** preview `6dcff5d` rechazado con EBADENGINE: Vercel ofrece Node24.21.0/npm11.19.0 y solo permite seleccionar Node por mayor. Mantener `.node-version`24.22.0 y CI exactos; expresar Node24LTS como `24.x` en engines/lock y fijar npm11.19.1 antes de `npm ci` en installCommand de Vercel. Se conserva engine-strict y no cambia el grafo. Agregar regresión del contrato de configuración; verificar preview real antes del merge.

## Formato para próximas entradas

Usar un ID consecutivo `EXTRA-NNN` y registrar:

1. Fecha, responsable y estado.
2. Problema, evidencia y requisito/tarea aprobada de origen.
3. Cambio mínimo necesario y justificación.
4. Archivos y contratos afectados, riesgos y límites.
5. Autorización y coordinación, distinguiendo decisiones pendientes de aprobadas.
6. Verificación prevista y resultados reales.
7. Limitaciones, revisión y referencias de commit/PR cuando existan.
