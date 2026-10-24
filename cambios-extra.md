# Cambios extra necesarios

Registro de requisitos derivados y ajustes técnicos necesarios para cumplir tareas
aprobadas. No sustituye la constitución ni los artefactos de Spec Kit, y no convierte
una propuesta en una decisión municipal aprobada.

## EXTRA-023 — Estabilizar el escenario E2E de mantenimiento

- **Fecha/autorización:** 2026-10-18, Máximo: «Bueno, entonces encontramos un bug no? Bien, arreglalo».
- **Problema/evidencia:** los CI39179308511/39179314605 esperan dos derivaciones vencidas y obtienen745; el mantenimiento usa el reloj real sobre fixtures de septiembre. Main52fcae9 pasó el17 de octubre, antes del vencimiento18 de octubre12UTC; seed, mantenimiento y aserción no cambiaron.
- **Origen:** corrección necesaria para completar los controles de publicación de ofertas; se entrega como prerrequisito independiente, sin incluir slugs.
- **Cambio:** aislar los instantes del escenario en `tests/e2e/intermediation.spec.ts`, mantener activo el permiso inicial respecto del reloj real y conservar todas las expectativas exactas. Incluye el aislamiento pgTAP010 ya comprobado en los jobs de base de datos.
- **Límites/riesgo:** solo fixtures de prueba; sin cambios de seed, reglas, contratos ni datos alojados. Se mantiene la limitación cronológica preexistente entre consentimientos y derivaciones ficticias, sin ampliar este arreglo.
- **Verificación/recuperación:** RED remoto documentado; tipos/lint y CI completos del SHA corregido pendientes. Docker local apagado: no se atribuye una ejecución local. Reversión limitada a los fixtures; revisión independiente antes de integrar.
- **Corrección dependiente:** CI39181435054/39181499292/39181504654 detectó cuatro fallos en `tests/unit/maintenance-timezone.test.ts`, que exigía el literal anterior. Se actualiza el contrato al reloj inyectado, conservando todos los límites de Buenos Aires y agregando la comprobación del instante real del escenario. RED local reproducido antes del ajuste; no modifica el cálculo de producción.

## Autorización de trabajo

- **Responsable:** Mateo.
- **Fecha:** 2026-09-26.
- **Evidencia:** instrucción en este chat: «agrega a agents.md si considera que algún
  requisito extra sea necesario que lo agregue pero registralo en cambios-extra.md
  o algún nombre así».
- **Alcance:** incorporar extras necesarios para cumplir la tarea aprobada, con
  justificación y trazabilidad; los límites y controles están en `AGENTS.md`.
- **Revisión:** esta instrucción no acredita revisión de Máximo ni aceptación municipal.

## EXTRA-022 — Aislar el reloj de la prueba de vencimiento poscontratación

- **Origen/autorización:** entrega de slugs solicitada por Máximo, 2026-10-18; requisito técnico para completar CI sin cambiar el producto.
- **Evidencia:** Quality39178555606 falla en pgTAP010 casos97/110–112; maintenance(clock_timestamp()) vence derivaciones del seed de septiembre al llegar octubre. Archivo y reglas de mantenimiento no cambiaron respecto de52fcae9.
- **Cambio mínimo:** solo tres instantes del fixture poscontratación en `supabase/tests/010_intermediation_rls.test.sql`; usar el reloj histórico determinista del escenario. Conservar todas las expectativas, seed/hashes, permisos y reglas de producción.
- **Riesgo/recuperación:** aislamiento de pruebas; se revierte únicamente el fixture. No toca datos alojados ni cambia plazos de negocio.
- **Verificación:** RED observado en ambos jobs remotos; reproducción local bloqueada por Docker apagado. Recheck exacto por CI y revisión independiente pendientes antes del merge.

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

## EXTRA-022 — A07: búsqueda pública de ofertas

- **Fecha/estado:** 2026-10-19; registrado antes de implementar. Mateo solicita
  continuar y abrir PR desde main actualizado (`43b94a7`); rama
  `feat/public-offer-search`. A04 público de Máximo se conserva; PR #54 descartado.
- **Origen/evidencia:** A07 de la matriz confirma texto/rubro/localidad/modalidad.
  El listado actual solo pagina. A05/A06 requieren diseño propio de carga privada;
  este bloque independiente no los implementa ni reabre la solución de slugs.
- **Cambio propuesto:** GET `/ofertas?q=&rubro=&localidad=&modalidad=&page=`;
  texto literal en título/tareas/requisitos, sin distinguir mayúsculas pero sí
  tildes; rubro por código del catálogo actual (no UUID), localidad/modalidad por
  valor completo sin distinguir mayúsculas/espacios exteriores. Filtros combinan
  con AND, se aplican antes de contar/paginar, orden actual intacto.
- **Contrato técnico:** vista `private.public_offer_rows` sin grants cliente
  centraliza la proyección y los mismos predicados vigentes. RPC nueva de búsqueda
  y de opciones; `published_offers` conserva firma y delega en la misma consulta.
  Opciones solo derivadas de ofertas visibles (rubros activos); sin catálogo
  municipal nuevo ni datos privados. Slugs y lookup del compañero intactos.
- **Entrada/UI:** Zod en servidor y servicio; q120, rubro50, localidad200,
  modalidad100, página1–10000 y tamaño1–30. Duplicados/arrays y excesos se rechazan
  sin consultar ofertas; mensaje español y filtros seguros. Formulario nativo GET,
  reinicia página al buscar; paginación conserva filtros y limpiar vuelve a listado.
- **Archivos/contratos:** migración de lectura sin backfill/tablas nuevas, servicio,
  validación/utilidad de URL, formulario/listado, pruebas, spec/plan/tasks y matriz.
- **Coordinación:** Mateo funcional, compañero visual/revisor; controles mínimos
  con estilos existentes, sin rediseño global. Revisión independiente del SQL/PR
  pendiente; no se afirma aprobación municipal o cierre de gates históricos.
- **Riesgos/recuperación:** filtrar antes de paginar; opciones no deben revelar
  borradores/suspendidas. SQL parametrizado y texto literal, sin wildcard/inyección.
  Helpers/vista privados, grants explícitos solo RPC de proyección. Aplicar base
  antes de app; rollback de app conserva funciones compatibles, sin borrar datos.
- **Verificación prevista:** RED/GREEN validación, transporte y componentes;
  pgTAP de filtros, total/páginas, equivalencia de proyección, grants y privacidad;
  navegador público/teclado/empty/URL/slugs, regresiones, tipos, lint, build y CI.
  Solo datos ficticios y destinos locales; sin reset de base existente ni cambios
  alojados. No se reutiliza la migración local descartada del PR #54.
- **Análisis focalizado previo:** seis criterios (cuatro filtros combinables,
  paginación/URL, opciones públicas, validación, compatibilidad y privacidad),
  cubiertos por T106–T110; sin cambios al modelo persistido, slugs o transiciones.
  Prerrequisitos Spec Kit resueltos contra la feature existente. Checklists
  históricos sin alterar; revisión propia no equivale a revisión independiente.
  RED inicial del servicio: 10 FAIL/4 PASS, comportamiento anterior ignora filtros.
- **Prerrequisito local detectado:** CLI `migration up --local` rechaza el historial
  por `20261017204435`, residuo ya informado del PR #54 descartado. No se borra ni
  se marca revertido, ni se recupera su código. Para validar sin reset se aplican
  exclusivamente los SQL revisados `20261018000000` (base integrada del compañero)
  y `20261019124218` (lectura A07) con psql transaccional/ON_ERROR_STOP contra el
  contenedor local exacto; después se registran como applied con repair solo si
  finalizaron. Se compara checksum de versiones/fechas. Historial previo intacto;
  CI fresco verifica únicamente las migraciones rastreadas y no este residuo.
- **Colisión local adicional:** el primer intento transaccional del SQL integrado
  revirtió completo: la RPC `published_offer_by_slug(text)` del PR #54 ya existe.
  Se reemplaza únicamente esa definición descartada por la del compañero dentro
  de la misma transacción de instalación, después de comprobar columna/helper
  exclusivos del residuo y ausencia del nuevo `slug`. No se borran columnas,
  referencias, registros ni historial. El SQL rastreado del compañero no se edita.
- **Resultado local:** instalación de ambas migraciones y registro applied
  correctos; checksum ID/versión/updated_at de ofertas idéntico antes/después.
  La migración A07 por sí sola no escribe negocio; pgTAP usa rollback.
  La vista usa security_invoker/security_barrier como defensa adicional; solo
  las RPC definer de proyección autorizada pueden leerla. Sin nuevos grants.
- **Implementado/verificado:** servicio y Zod, vista/RPC, formulario servidor con
  labels explícitos y GET, URLs/filtros/paginación/limpiar, error y vacío seguro.
  RED10 FAIL/4 PASS; focal49/49 antes del endurecimiento final de arrays/booleanos;
  regresión final603/39 archivos, tooling57/57, tipos/lint/build PASS.
  SQL final951/14 archivos (38 nuevas) PASS y advisor security sin hallazgos.
  Navegador final9/9: tres A07 y seis sesiones; teclado, persistencia, slug12hex,
  axe sin violaciones y sin overflow360×800. Se recolectan70/17, no se afirma
  ejecución local completa. Avisos de streaming Next existentes sin fallo final.
- **Incidencias de validación:** SQL072 comparó snapshots mientras el navegador
  hacía login (dos fallos de snapshot); sin cambios SQL, repetición secuencial
  completa PASS. No se redujeron sus aserciones ni se reseteó la base. El primer
  E2E detectó labels implícitos ambiguos por incluir opciones; se separaron labels
  y selects mediante id/htmlFor, no se eludió la verificación. Se aisla el alert
  de validación del anunciador de rutas de Next y se eligen opciones reales del
  fixture en vez de suponer Funes. Un pipe Zod rechazado por TS se reemplazó por
  transformación explícita string/number; no se introdujo any ni dependencia.
  E2E A07 final repetido3/3 usando una combinación pública con más de diez
  resultados, no primeras opciones independientes que podrían no coincidir.
- **Entorno/privacidad:** Node24.22/npm11.19.1 portable oficial verificado por SHA;
  global intacto. Sin tokens/claves en código, capturas/trazas de sesión ni nuevos
  env. Consultas y Auth solo locales/ficticios. Docker permanece activo; servidor
  Next de pruebas finalizado. No se aplicó SQL ni se desplegó a servicios alojados.
- **Entrega/límites:** T106–T110 verificadas localmente; runbook/matriz/artefactos
  actualizados. PR desde feat/public-offer-search; CI completo del SHA y revisión
  independiente pendientes al entregar. No se acredita aceptación municipal ni
  se cierran gates históricos; A04 privado, A05, A06 y A08 conservan pendientes.

## EXTRA-023 — Continuidad visual de Mi cuenta administrativa

- **Fecha y autorización:** 2026-10-19, Mateo solicita que el recorrido Inicio →
  Mi cuenta de administración muestre el menú lateral, como las páginas de `(admin)`.
- **Problema/evidencia:** `getAccountAccess()` dirige administradores a `/account`,
  pero esa ruta compartida usa AuthShell y pierde la navegación administrativa.
- **Origen:** ajuste visual explícito del diseño administrativo, sin cambiar A03,
  roles, rutas, acceso ni las reglas de cuentas individuales.
- **Cambio mínimo propuesto:** elegir AdminShell exclusivamente para el rol admin
  en la presentación de `/account` y marcar Mi cuenta como sección activa. Los
  otros roles conservan AuthShell. Guardias, consulta de otros administradores,
  exclusión de la propia cuenta, acciones y confirmaciones permanecen intactas.
- **Archivos/contratos:** `src/app/(auth)/account/page.tsx`, AdminShell local,
  tests de cuenta y documentación de diseño. No cambia contrato ni esquema.
- **Riesgos y verificación prevista:** evitar dos H1, comprobar navegación activa,
  aislamiento por rol, exclusión propia y controles de suspensión/reactivación;
  revisar responsive/axe/foco con fixtures ficticios; lint, tipos, suite y build.
- **Estado:** implementado y verificado localmente en `codex/frontend-admin-design`;
  autorizado por la instrucción explícita; revisión independiente pendiente.
- **Resultados:** 27 pruebas focalizadas y suite completa 620/40 aprobadas;
  lint, tipos y build aprobados. Nueve vistas ficticias de Mi cuenta por rol
  a 360/768/1366 px sin hallazgos axe, desbordamientos ni pérdida de foco en
  el recorrido muestreado. Un H1 y menú activo solo para admin. No se acredita
  sesión real ni cambios de cuentas contra backend; T087 sigue pendiente.

## EXTRA-024 — A08: catálogo amplio y coincidencias por oferta

- **Fecha/autorización:** 2026-10-19. Mateo solicita implementar A08 en
  `feat/job-categories-matching`; catálogo y coincidencia por al menos un rubro
  aprobados en la matriz. No acredita aceptación del producto.
- **Evidencia:** el seed solo incluye DEMO-A/B; no existe consulta de coincidencias
  desde la oferta. Las asociaciones múltiples y la nominación municipal ya existen.
- **Cambio necesario:** insertar quince rubros en `job_categories`, versión 2,
  y una RPC administrativa paginada que cruza ocupaciones/intereses activos
  con rubros de la oferta. Reutilizar la evaluación/nominación vigente.
- **Integridad:** conservar códigos, IDs, estado y asociaciones previas; no inferir
  equivalencias entre categorías anteriores y rubros nuevos. El importador
  sintético v1 permanece intacto. El catálogo persistido sigue siendo fuente única.
- **Archivos/contratos:** migración nueva, servicio/validación de matching, detalle
  de oferta y componente, tipos SQL, pruebas SQL/unitarias/UI/E2E y artefactos A08.
- **Privacidad/riesgos:** solo administrador activo con sesión vigente; sin DNI,
  contactos, CV, notas, ranking ni escritura al consultar. La empresa no recibe
  acceso. Revalidar estados al nominar/derivar con comandos existentes.
- **Verificación prevista:** RED/GREEN; OR sin duplicados, consentimiento,
  vigencia, disponibilidad, cuentas, CV y oferta; total antes de página; catálogo
  sin pérdida de referencias; permisos negativos; tipos/lint/build y navegador.
- **Análisis focalizado:** requirements16/16 y mvp-readiness77/77 sin editar sus
  marcas. Spec/plan/modelo/contrato y T111–T115 consistentes. Constitución: solo
  lectura municipal, permisos servidor/SQL, historial preservado, interfaz
  accesible y stack actual sin dependencias ni excepciones. Revisión técnica
  propia React: Server Components, Suspense, sin hooks/cachés privados compartidos.
- **Estado:** implementado y verificado localmente. Migración
  `20261019203041_job_categories_matching.sql` aplicada en transacción sobre
  Docker local y registrada solo tras comprobar SQL. Sin reset, migración remota,
  cambios de variables ni reparación de historias anteriores.
- **Resultados:** RED SQL: dos fallos intencionales (RPC ausente y cero rubros v2).
  Final: 655 unitarias/componentes/42 archivos; tooling57; tipos/lint/build PASS;
  pgTAP986/15 archivos, incluidas35 nuevas; advisor security sin hallazgos.
  Navegador12/12: tres A08, tres búsqueda pública y seis sesiones por rol.
  Axe del bloque sin violaciones y sin overflow a360×800. Un primer selector
  E2E ambiguo incluía el anunciador de Next; se acotó al main sin relajar el texto.
- **Archivos reales adicionales:** matriz, OPEN_QUESTIONS, implementation-status y
  runbooks A08/A07 (evidencia posterior aportada por Mateo). No se modifican
  seed, importador, Auth, estilos globales ni código visual del compañero.
- **Entrega/límites:** colección73 E2E/18 archivos, no suite completa ejecutada.
  Cobertura configurada del proyecto100% solo para env/schema, no del nuevo
  matching. Commit/PR, CI completo, revisión y aceptación pendientes.
  Avisos de cierre temprano de stream de Next observados en navegación, sin fallos
  en los doce recorridos; no se atribuye una causa ni se cambia código ajeno.

## EXTRA-025 — A08: perfil modal y nominación desde la oferta

- **Fecha/autorización:** 2026-10-19, solicitud explícita de Mateo: perfil en popup,
  nominación a la oferta actual, ocultar personas ya nominadas y tarjetas compactas
  en dos columnas. Amplía A08; no autoriza derivación automática ni cambios de roles.
- **Evidencia:** el primer A08 obliga a salir al perfil, lista casos existentes y
  ocupa una sola columna en la mitad del detalle. Mateo ya aplicó/registró
  `20261019203041` en Supabase alojado, con catálogo15, función presente y anon
  bloqueado; captura de CLI y resultados aportados por el operador, no inspección
  remota del agente.
- **Cambio mínimo:** diálogo nativo accesible, consulta laboral administrativa
  bajo demanda y nominación explícita con el comando existente/versiones vigentes.
  Dos columnas desde md y doce fichas por página, una columna en móvil. Excluir
  antes de contar/paginar cualquier participación no archivada en esa oferta,
  también postulaciones: el comando existente prohíbe duplicarlas, sin importar
  origen/estado. Las participaciones siguen consultables en su pantalla propia.
- **Contrato/seguridad:** perfil laboral, rubros y CV vigente, sin DNI/contactos/
  notas; comprobar sesión/rol/aptitud/empresa/oferta y coincidencia al abrirlo.
  Nominar revalida cuenta, oferta, consentimiento y versiones transaccionalmente;
  no concede acceso empresarial. Carga/error/duplicado/conflicto, Escape, foco y
  solicitudes tardías cubiertos. Sin reintento automático de nominación tras
  refrescar versiones; actualizar la lista sí requiere revalidación/refresh.
- **Migración:** nueva forward-only para consultas; no editar SQL ya aplicado ni
  catálogo. Pool privado invocador compartido por lista y preview, sin permisos
  clientes. RPC pública de preview exige administrador; no nuevas tablas.
- **Archivos:** migración nueva, matching-service/validation/action, componentes
  de lista/diálogo, detalle de oferta, revalidación de nomination-actions, tipos,
  contratos/spec/plan/tareas y tests SQL/unitarios/UI/E2E/HTTP.
- **Verificación prevista:** RED exclusión; igualdad conteo/página, permisos y
  preview; nominación real con auditoría y no duplicación en SQL; navegador
  apertura/cierre/foco/columnas/nominar/desaparición/recarga y móvil/axe;
  tipos/lint/suites/build.
- **Estado/resultados:** implementado y verificado localmente; review pendiente.
  689 unitarias/componentes/43 archivos, tooling57, tipos/lint/build PASS;
  pgTAP1007/16 archivos (21 nuevos y35 de matching actualizados), advisor security
  sin hallazgos. Navegador13/13 (A08×4, A07×3, sesiones×6), autorización HTTP8/8
  PASS incluyendo preview. Colección74/18, no ejecución completa ni CI remoto.
  Cobertura configurada100% solo de env/schema, no del feature completo.
- **Verificación funcional:** popup bajo demanda, CV, Escape/foco, dos columnas,
  doce fichas, paginación, móvil360×800/axe; nominación real a la oferta actual,
  exclusión tras recarga, un único caso under_review/admin_nomination y cero
  derivaciones nuevas. SQL1007 se ejecutó primero; el navegador dejó después una
  participación ficticia adicional (1001 total), preservada con su auditoría.
- **Revisión técnica propia:** predicado SQL compartido, guards de actor/sesión y
  rol, ACL cerradas, validación de entradas/salidas, conflictos de versiones,
  sin caché privada compartida. Server Component bajo Suspense y cliente acotado,
  diálogo nativo, guardia de respuestas tardías y doble envío; sin nuevos any,
  dependencias ni cambios globales de estilo. No equivale a revisión independiente.
- **Operación:** migración20261019205940 aplicada/registrada solo localmente;
  primera A08 alojada según recibo del operador, ampliación alojada pendiente.
  Se cerró el next dev identificado con autorización expresa de Mateo y se usó
  build/servidor propio con destinos locales explícitos, sin editar `.env.local`.
  Servidor de pruebas cerrado al finalizar, puerto3000 libre y Docker conservado.
  Continúan avisos de stream de Next durante navegación pese a los recorridos
  PASS; sin atribuir causa ni corregir framework ajeno. Se restaura la variación
  generada dev de next-env que ya existía antes de la intervención.
- **Límites:** sin aplicar SQL remoto ni commit/PR en este paso. Preservar cambios
  anteriores de A08 y `next-env.d.ts`, modificado fuera de esta intervención.

## EXTRA-026 — A08: candidatos debajo de la oferta

- **Fecha/autorización:** 2026-10-19, Mateo solicita únicamente mover los candidatos
  debajo de la información de la oferta; informa que la migración anterior funciona.
- **Evidencia/origen:** A08/T119 coloca el bloque de coincidencias antes del detalle.
  El ajuste solicitado es de orden visual, no del contrato ni del flujo municipal.
- **Cambio mínimo:** mover el Suspense de coincidencias después del grid existente
  de información/moderación e historial. Conservar todo el ancho, dos columnas de
  fichas y el popup con nominación; no tocar SQL, servicios ni permisos.
- **Archivos:** página administrativa de oferta, test de orden en admin-pages,
  spec/plan y este registro. Sin nuevos estados, dependencias ni variables.
- **Riesgos/verificación:** proteger el orden DOM y ubicación fuera del grid con
  prueba de componente; comprobar regresión UI, tipos/lint/build y whitespace.
  Preservar cambios anteriores de la rama y next-env generado fuera del ajuste.
- **Estado/resultados:** implementado; RED1/17PASS del orden anterior y GREEN33/33
  de página/popup. Suite690/43 archivos, tipos/lint y whitespace PASS. Revisión
  propia: solo reordenamiento del Server Component, Suspense conservado, sin
  hooks, permisos ni datos adicionales. No se repiten SQL/E2E en este ajuste.
- **Límites:** build nuevo pendiente para no interferir con el next dev activo
  del usuario en puerto3000; no se detuvo ni reinició su proceso. El build previo
  no se acredita como nuevo. Revisión y PR pendientes; no acredita despliegue
  ni inspección remota del agente. next-env conserva sus imports dev previos.
- **Entrega posterior solicitada:** Mateo pide revisar/actualizar el PR. GitHub
  confirma PR60 mergeado, ningún PR abierto ni rama remota A08: corresponde crear
  uno nuevo, no modificar el PR60. Build final PASS con Node24.22/npm11.19.1,
  destinos loopback y clave publicable ficticia. Se verificó en el Next instalado
  que la limpieza de build conserva dev; no se detuvo el servidor del usuario.
  Este resultado reemplaza el pendiente de build anterior, no acredita CI remoto.
- **Referencia de entrega:** implementación `11be483`, publicada en
  [PR61](https://github.com/maximo-Pdev/funes-empleo/pull/61), abierto contra main.
  Incluye EXTRA024–026; próximo paso: checks del SHA publicado y revisión humana.
  Se conserva solo next-env generado como cambio local fuera del commit.

## EXTRA-027 — diagnóstico y reparación del registro/verificación

- **Fecha/autorización:** 2026-10-20. Mateo informa que dejó de funcionar el
  registro y que el correo abre una versión antigua; solicita limitar el arreglo
  a esos fallos y reemplazar la rama anterior.
- **Base/seguridad:** PR61 mergeado confirmado; main6607854 actualizado, rama
  anterior local/remota borrada tras verificar inclusión. Nueva rama
  codex/fix-registration-verification; next-env generado previo se conserva.
- **Evidencia inicial:** candidato/empresa ignoran el error devuelto por signUp
  y muestran respuesta genérica por diseño no enumerativo. Ambos usan
  NEXT_PUBLIC_APP_URL/auth/callback; callback también redirige a esa base.
  Configuración pública local: origen localhost3000 y Supabase alojado.
  Consulta pública de Auth confirma registro/email habilitados y confirmación
  exigida; no se enviaron correos ni crearon cuentas alojadas para diagnosticar.
  No se conoce todavía el error concreto ni URL final deseada del operador.
- **Propuesta/verificación:** reproducir registro y verificación de ambos roles
  en Supabase Docker/mailbox local, sin reset; contrastar el destino del correo,
  callback y sesión. Revisar configuración URL/allowlist/plantilla del entorno
  afectado con evidencia antes de modificarla. Preservar no enumeración, PKCE,
  confirmación obligatoria, roles y RLS; no desactivar controles ni eludir cuotas.
- **Archivos/contratos previstos:** pruebas de registro/callback, servicios Auth
  y documentación operativa según causa comprobada; sin autorizar cambios de
  campos o rediseño. Una modificación derivada se detalla aquí antes del código.
- **Riesgos/límites:** no recibir enlaces de correo con tokens ni datos reales;
  no inventar dominio nuevo ni inspección remota. No cambiar variables alojadas,
  SMTP ni datos compartidos sin diagnóstico y destino confirmado. Solo pruebas
  ficticias locales; build/tipos/lint y suites relevantes tras la corrección.
- **Estado:** diagnóstico en curso; causa y reparación aún no acreditadas.
- **Diagnóstico confirmado:** Mateo prueba https://funes-empleo.vercel.app y
  reporta ausencia de mensaje. Prueba publicada con datos ficticios inválidos
  devuelve el mensaje seguro esperado, sin alta ni correo. Callback público sin
  token redirige al mismo dominio actual (307/no-store), no al demo anterior.
  Dashboard Supabase con sesión del operador muestra Site URL del demo antiguo
  y solo sus dos callbacks permitidos; custom SMTP desactivado y plantillas
  predeterminadas. No se atribuye todavía el fallo de alta a una cuota concreta.
- **Cambio operativo propuesto:** Site URL al dominio actual y agregar callback
  de verificación/recuperación actual, conservando ambos anteriores. Pendiente
  confirmación específica solicitada antes de guardar destinos de autenticación.
  Sin tocar SMTP, confirmación, sesiones ni cuentas. Vercel conectado no expone
  este proyecto; no se realizaron cambios allí ni se intentó otro acceso.
- **Prueba local nueva:** registration-verification.spec.ts cubre ambos roles:
  alta, correo con destino exacto, bloqueo antes de verificar, callback, sesión,
  bootstrap del perfil y recarga. 2/2 PASS sin cambiar código de aplicación.
  Primera ejecución falló solo por esperar el texto antiguo de Rol; el correo y
  la sesión ya funcionaban. Se corrigió la expectativa al texto real, sin quitar
  comprobación del rol. Deja cuentas ficticias locales; no se borra ni resetea.
- **Respuesta posterior:** Mateo confirma URLs antiguas, informa que el formulario
  candidato borra los datos (empresa no probada) y que no tienen SMTP/remitente.
  Pregunta el motivo del cambio de URL: no constituye aprobación para guardarlo.
  Configuración alojada aún intacta. El registro público general queda limitado
  por SMTP integrado; no se elige proveedor ni se habilita Resend de oficio.
- **Verificación final del diagnóstico:**690 unitarias/43 archivos, tipos/lint y
  build PASS; E2E2/2 con reuso de enlace rechazado sin tokens en destino. Solo
  pruebas/documentación nuevas, código de aplicación intacto. El servidor propio
  quedó cerrado y puerto3000 libre; Docker e identidades ficticias conservados.
  Sin commit/PR ni nueva migración. Corregir el destino requiere confirmación y
  correo público requiere configuración SMTP; no se declara el incidente resuelto.

- **Autorización operativa posterior:** Mateo responde «cambialas entonces» el
  2026-10-20, confirmando Site URL actual y sus dos callbacks exactos propuestos.
  Se verificó nuevamente el proyecto y los valores antiguos antes de guardar;
  conservar ambos destinos anteriores. Esta autorización no incluye SMTP,
  envío de correos, alta de usuarios, cambio de credenciales ni despliegue.
- **Operación ejecutada/verificada:** guardado en dashboard Site URL
  https://funes-empleo.vercel.app; toast Successfully updated site URL. Agregados
  los callbacks exactos de verificación y recuperación actuales; toast Successfully
  added 2 URLs. Lectura posterior muestra Site URL actual y cuatro destinos:
  ambos anteriores conservados y ambos nuevos. Captura de evidencia guardada
  fuera del repositorio. Sin SMTP, nuevas cuentas, correos, SQL ni deploy.
  Queda corregida la configuración de destino; entrega real de correo y registro
  público general siguen pendientes de SMTP y prueba autorizada del entorno.

## EXTRA-028 — validación visible y conservación de formularios

- **Fecha/autorización:** 2026-10-20. Mateo pide en todos los formularios asterisco
  rojo para obligatorios, bordes rojos y explicación junto a cada campo incorrecto,
  instrucciones claras y conservar lo cargado ante cualquier error. Incluye
  registro, acceso, perfiles, empresa, administración, búsqueda y archivos.
- **Evidencia:** 29 archivos contienen formularios, con validación nativa, manual
  y Server Actions mezcladas. React reinicia inputs no controlados después de
  resolver una Action aunque su resultado informe error. TextField/SelectField
  muestran obligatorio como texto y muchos labels no tienen aviso ni error local.
- **Cambio mínimo compartido:** Form y Field declarativos con contexto de errores,
  asterisco accesible, mensajes españoles por restricción, foco al primer error,
  resumen y limpieza del error al corregir; no manipular DOM de React ni duplicar
  validadores del servidor. Integrar todos los forms/labels y componentes comunes.
  Evitar reset automático en fallo y permitirlo solo tras éxito explícito; datos
  y archivos permanecen en el DOM de esa página, nunca en storage/logs/URL nuevos.
- **Validación:** mantener opcionales y borradores incompletos existentes; reflejar
  requisitos condicionales/confirmaciones y grupos de al menos un contacto/fecha.
  Mantener mensajes no enumerativos y permisos/validación servidor. El color no
  es el único indicador: aria-invalid, descripciones y texto junto al control.
- **Archivo/CV:** evitar navegación destructiva en fallo de carga, mediante
  respuesta JSON opt-in del handler existente y cliente acotado. Mantener el
  POST/303 previo como compatibilidad, límites PDF y autorización intactos.
  La regresión completa detectó una carrera entre aviso de carga y refresh de
  versión del perfil: el éxito definitivo espera las props actualizadas, con
  prueba que retiene deliberadamente la respuesta RSC antes de activar. También
  se evitan refresh automáticos en conflictos y períodos invertidos de métricas.
- **Archivos/contratos:** componentes/forms, TextField/SelectField/PasswordField,
  29 consumidores, endpoint CV solo respuesta opt-in, estilos acotados, pruebas
  UI/E2E/unitarias y artefactos de especificación. Sin dependencias ni migración.
  Ajustar los dos selectores de hijos directos de formularios candidato/empresa
  para que el nuevo contenedor Field conserve el ancho completo de textareas;
  no cambiar columnas, tamaños ni dirección visual existentes.
- **Riesgos/verificación:** límites cliente/servidor, filtros GET, campos dinámicos,
  radio/checkbox/select, confirmación de contraseña, archivos, Enter/foco/lector,
  error servidor y doble envío. RED/GREEN, inventario sin forms aislados, suites,
  tipos/lint/build, navegador por rol y axe/responsive con datos ficticios locales.
- **Análisis/gates:** checklists requirements16/16 y mvp-readiness77/77 PASS,
  leídas sin cambiar marcas; sin hooks registrados. Constitución: simplicidad,
  privacidad, accesibilidad y controles servidor conservados. User autoriza el
  cambio transversal; no altera requisitos municipales ni diseño global ajeno.
- **Implementación real:** Form/Field/validation/identifier-fields y CSS común;
  TextField/SelectField/PasswordField; 40 usos de Form en 29 archivos de consumidores
  candidatos, empresas, acceso, administración, participaciones, derivaciones e
  importación; CvUploadForm y respuesta opt-in del handler. Dos selectores CSS
  conservan el ancho existente. Spec/plan/contrato/tareas y guía de formularios
  alineados; matriz A18 agregada. Sin dependencias, tablas o migración.
- **Verificación real:** RED inicial4/4; GREEN final729 tests/49 archivos,
  tooling57, typecheck/lint/build PASS. Inventario AST sin forms/labels aislados
  ni controles sin Field. Navegador20/20: validación por campo, corrección, foco,
  contraseña y registro real local, rechazo de Action/login, grupos, métricas,
  CSV/PDF retenidos, CV válido con RSC retenida y activación posterior, candidato
  y empresa completos, filtros y sesiones. HTTP privado8/8 aislado PASS. Axe sin
  violaciones en recorridos comprobados; teclado y móvil360×800 sin overflow.
  Revisión React: hooks en nivel superior, IDs/ayudas estables, sin any ni
  persistencia de datos personales, sin cambiar reglas de negocio o permisos.
- **Incidencias corregidas:** la prueba de carga/activación reveló aviso de éxito
  antes de refrescar versión; se agrega guardia y regresión determinista. Un
  intento de ejecutar HTTP y UI simultáneamente alteró el conteo global de
  auditoría de los tests HTTP; la repetición aislada8/8 pasa sin relajar aserciones.
  Mantener el orden de proyectos de Playwright; no mezclar con --no-deps.
- **Estado/límites:** implementado y verificado localmente; T121–T125 completos.
  Sin commit, PR, CI nuevo, revisión independiente, NVDA o aceptación acreditados.
  No se ejecutó la suite E2E completa ni se cerraron gates históricos. Pruebas
  solo contra Supabase local, sin reset; quedan datos y auditoría ficticios.
  Se conserva EXTRA027, la modificación previa de next-env y Docker activo.
  Este incremento no toca servicios alojados ni SMTP: el correo público continúa
  bloqueado por proveedor/remitente pendientes. Datos conservados solo mientras
  permanece la página abierta; límites CV5MiB y A06 pendiente se mantienen.

- **Ajuste de texto solicitado por Mateo, 2026-10-20:** quitar del resumen de
  errores la frase sobre conservación; mantener “Revisá el campo indicado.” o
  “Revisá los N campos indicados.” sin cambiar validación ni retención. Afecta
  Form y su regresión de texto exacto; 12 pruebas focalizadas, ESLint de ambos
  archivos y diff --check PASS. Solo cambia el aviso; conservación intacta.

## EXTRA-029 — registros compactos y tarjetas simétricas

- **Fecha/autorización:** 2026-10-20. Mateo pide simetría entre tarjetas de
  registro y evitar scroll innecesario en1920×1080, reduciendo componentes y
  espacios sobredimensionados sin ocultar contenido simple.
- **Evidencia:** ambas páginas duplican estructura, usan columnas0.95/1.05 con
  items-start, padding de40px, controles48px y otra tarjeta solo bajo el formulario.
  Esto produce alturas/anchos diferentes y exceso vertical, especialmente empresa.
- **Cambio propuesto:** layout servidor común solo para ambos registros, columnas
  iguales y stretch en escritorio, espacios/títulos más compactos, controles44px,
  campos distribuidos en dos columnas donde haya espacio y ayuda de verificación
  integrada en la tarjeta. Conservar todos los campos, mensajes, enlaces y avisos
  de intermediación/verificación documental. Sin alturas fijas, overflow oculto ni
  scroll interno; móvil, zoom y errores pueden extender la página naturalmente.
- **Origen/archivos:** solicitud directa, formularios EXTRA028; páginas de ambos
  registros, nuevo RegistrationLayout/CSS local, tests visuales/componentes y
  spec/plan/tareas/guía Auth. Sin tocar acciones, contratos de datos, permisos,
  catálogo, base, dependencias, SMTP o estilos de otros formularios.
- **Riesgos/verificación:** medir tarjetas y ausencia de scroll inicial1920×1080,
  controles≥44px, móvil360×800, ancho intermedio/zoom equivalente, errores completos,
  orden de teclado y axe; regresiones de registro, tipos/lint/build. Revertir solo
  layout/páginas/estilos restaura presentación anterior sin tocar datos.
- **Constitución/análisis:** reutiliza React/Next/Tailwind/tokens y SVG existentes;
  no añade servicios ni resuelve decisiones municipales. Cambios previos y rama
  dedicada se conservan; revisión visual autorizada por Mateo, sin requerir nueva
  aprobación del compañero para ejecutarla. Revisión/aceptación global pendientes.
- **Implementación real:** RegistrationLayout servidor con configuración por rol,
  registration.module.css y dos páginas consumidoras; se mantienen los componentes
  funcionales de registro sin modificarlos. Guía Auth/spec/plan/tareas alineados,
  matriz A19. Controles44px, gaps8px, columnas iguales y ayuda dentro de la tarjeta.
- **Verificación:** RED2/3 en regresión de estructura; GREEN732 pruebas/50 archivos,
  tipos/lint/build PASS. Navegador6/6: tarjetas de igual ancho/alto e inicio sin
  scroll1920×1080 y1920×960, controles≥44px, móvil360×800 y reflow960×540 sin
  overflow horizontal, campos/ayuda alcanzables, errores visibles y teclado de
  contraseña. Axe sin violaciones; capturas vacías de ambos registros revisadas.
  Primera medición requirió esperar visibilidad/clic estable antes de foco y
  reducir separación para el margen vertical960; no se ocultó contenido.
- **Estado/límites:** implementado y verificado localmente; T126–T128 completos.
  Servidor propio de pruebas en3001 para preservar el servidor ajeno en3000;
  sin altas, correos ni cambios alojados en este ajuste visual. No se repitieron
  recorridos Auth con envío real, suite E2E completa, NVDA o zoom real200%.
  No acredita aceptación global, CI, revisión independiente, commit ni PR.
  Sin migración, dependencias o variables persistidas nuevas. Presentación local
  a registros; contenido puede crecer con errores/móvil/zoom sin scroll interno.

## EXTRA-030 — alternar tipo de registro

- **Fecha/autorización:** 2026-10-20. Mateo solicita cambiar desde el registro de
  postulantes al de empresas y viceversa sin volver al inicio.
- **Problema/origen:** EXTRA029 comparte layout pero no ofrece navegación directa
  entre ambos tipos. Ajuste explícito de acceso a los registros existentes.
- **Cambio mínimo:** selector con enlaces “Soy postulante”/“Soy empresa” en la fila
  superior del layout, activo con aria-current. Navegación normal, sin enviar
  formulario ni compartir/persistir contraseñas o datos entre roles.
- **Archivos/riesgos:** RegistrationLayout, tests de páginas y navegador, guía Auth
  y artefactos. Conservar simetría y encaje1920×1080/960; envolver en móvil sin
  overflow, controles≥44px y teclado accesible. Sin acciones/Auth/SQL nuevos.
- **Verificación prevista:** destinos y estado activo por rol, cambio de ida/vuelta
  con campos del formulario destino, medidas/responsive/axe, tipos/lint/build.
- **Resultado:** implementado en el layout común; enlaces a ambas rutas y tipo
  activo, sin añadir estado cliente. Regresiones de páginas3/3, navegador7/7,
  tipos/lint/build PASS. Se probó ida/vuelta sin POST, encaje1920×1080/960,
  simetría, móvil/reflow, errores, teclado y axe. No se repitió la suite completa.
- **Estado:** verificado localmente; T129 completo. Cambiar de página puede
  descartar borradores; no implica conservación entre registros. Sin cambios
  alojados, datos, migración o dependencias. Commit/PR/revisión pendientes.

## EXTRA-031 — inicio de sesión compacto y acceso al registro arriba

- **Fecha/autorización:** 2026-10-20. Mateo pide subir la tarjeta “¿Todavía no
  tenés cuenta?” y aplicar al login la simetría y ausencia de scroll innecesario
  verificadas en los registros.
- **Evidencia:** login mantiene columnas0.95/1.05/items-start, paddings40px,
  controles48px y tarjeta de registro debajo, fuera del primer bloque de acceso.
- **Cambio mínimo:** tarjeta de registro de ancho completo antes del grid de
  información/acceso; debajo dos tarjetas iguales/stretch y contenido compacto.
  Reutilizar estilos locales de entrada, con variante login de una columna para
  credenciales. Conservar todos los accesos, mensajes, formulario y avisos.
- **Archivos/contratos:** login/page, módulo CSS de entrada, pruebas de página y
  navegador, guía Auth y spec/plan/tareas. Sin tocar AuthForm, acciones, contraseña,
  sesiones, permisos, contratos de datos, SQL, SMTP, dependencias o env persistido.
- **Riesgos/verificación:** no recortar contenido ni fijar alto/scroll interno;
  medir encaje1920×1080/960 y tarjetas simétricas, móvil360×800/reflow960×540,
  controles≥44px, orden DOM del registro, enlaces reales, errores/retención,
  teclado/axe y regresiones de registros; tipos/lint/build. Revertir presentación
  restaura el login anterior sin afectar datos ni autenticación.
- **Implementación:** tarjeta de registro superior de ancho completo y dos
  tarjetas principales iguales. Login reutiliza las bases compactas locales con
  credenciales en una columna. AuthForm/acciones intactos; estilos nuevos solo
  mediante clases específicas de login. Guía/spec/plan/tareas y matriz A21 al día.
- **Verificación:** RED1/3 por orden DOM; GREEN735 tests/51 archivos, tipos/lint/build
  PASS. Navegador11/11 (login4, registros7): orden/dimensiones, sin scroll inicial
  1920×1080/960, controles≥44px, móvil360×800/reflow960×540 sin overflow, teclado,
  axe y errores/retención, enlaces de alta reales. Captura vacía revisada. La
  medición excluye inputs ocultos internos de Actions; no se ocultaron controles.
- **Estado/límites:** implementado/verificado localmente, T130 completo. Pruebas
  visuales en3001 sin detener servidor ajeno; sin alta/envío/cambios alojados.
  No se repitió toda la suite E2E, Auth privado/HTTP, NVDA ni zoom real200%.
  Sin migración, dependencias, variables persistidas, commit o PR nuevos. Gates
  históricos, revisión independiente, CI y aceptación global siguen pendientes.

## EXTRA-032 — Login: aprovechar la altura disponible

- **Fecha/responsable/autorización:** 2026-10-20, Mateo; solicitud explícita de
  ampliar en altura ambas tarjetas principales del login, conservando lo aprobado.
- **Problema/evidencia/origen:** EXTRA031/T130 deja espacio libre bajo las tarjetas
  en escritorio1920×1080; el usuario pide aprovecharlo manteniendo su simetría.
- **Propuesta/justificación:** T131; distribuir la altura mínima de la página con
  flex y estirar la grilla solo en escritorio. Sin alturas fijas, recortes ni scroll
  interno; móvil y contenido largo conservan crecimiento natural.
- **Archivos/contratos/riesgos:** página login, CSS compartido con clases específicas
  de login, E2E de layout y documentación. Sin cambios de Auth, datos, dependencias,
  contratos o entorno. Evitar afectar los registros o esconder errores en pantallas bajas.
- **Verificación prevista:** medir crecimiento entre1080/960, simetría, ausencia de
  scroll innecesario, móvil/reflow/errores/teclado/axe y regresión de registros;
  tests unitarios, tipos, lint y build. Revertir las clases restaura la presentación.
- **Implementación/verificación:** clases de página/contenido/grilla exclusivas
  del login; tarjetas de817px en1080 y697px en960, mismo ancho/alto y sin scroll
  inicial.735 tests/51 archivos, tipos/lint/build y navegador11/11 PASS. Registros,
  móvil360×800, reflow960×540, escritorio bajo1280×540, errores/retención, teclado
  y axe sin regresiones. Captura1920×1080 revisada.
- **Estado/límites:** implementado y verificado localmente; T131 completo. Pruebas
  visuales en3001 sin detener servidor ajeno, sin alta/envío/cambios alojados ni
  reset de datos. No se repitió suite E2E privada, NVDA o zoom real. Sin commit/PR,
  revisión independiente, CI, aceptación nueva ni cierre de gates históricos.

## EXTRA-033 — Login: información a la izquierda, registro e ingreso a la derecha

- **Fecha/responsable/autorización:** 2026-10-20, Mateo; disposición solicitada
  mediante esquema adjunto. Sustituye la ubicación a todo el ancho de EXTRA031
  y la igualdad de altura entre tarjetas individuales de EXTRA032.
- **Problema/origen:** T132; el usuario prefiere una tarjeta informativa alta a
  la izquierda, junto a una columna con registro arriba e inicio de sesión debajo.
- **Refinamiento antes de verificar:** Mateo observa demasiado espacio vacío en
  la captura y solicita centrar el conjunto sin estirar las tarjetas. Sustituye
  el aprovechamiento forzado de altura de EXTRA032 y de la propuesta inicial.
- **Propuesta/justificación:** mover el registro a la grilla existente y definir
  áreas CSS locales; información ocupa ambas filas en escritorio, con bordes
  superior/inferior alineados con la columna derecha. Mantener anchos iguales,
  altura según contenido y conjunto centrado verticalmente cuando haya espacio,
  sin expandir la grilla al viewport. Estética actual y controles compactos. En móvil: registro,
  login e información, sin ocultar contenido ni scroll interno.
- **Archivos/contratos/riesgos:** página login, CSS Module de entrada, pruebas
  de componentes/E2E, spec/plan/tareas y guía/matriz/estado. Sin cambios de Auth,
  datos, contratos, dependencias o configuración. Evitar afectar los registros,
  el orden de teclado o la visibilidad de errores en pantallas pequeñas.
- **Verificación prevista:** estructura y medidas de las dos columnas y filas,
  encaje1920×1080/960, móvil/reflow/escritorio bajo, errores/retención, enlaces,
  teclado/axe, regresión de registros, tipos/lint/tests/build y captura revisada.
  Recuperación: revertir presentación sin cambios de datos.
- **Implementación/verificación:** registro dentro de la grilla, guía abarcando
  ambas filas; filas automáticas y conjunto centrado sin flex-grow de la grilla.
  Alturas estables entre1080/960, límites alineados y sin scroll inicial. RED1/3
  de estructura; GREEN735 tests/51 archivos, tipos/lint/build y navegador11/11
  PASS. Incluye móvil360×800/reflow960×540/escritorio bajo1280×540, errores y
  retención, teclado/axe/enlaces y regresión de registros. Captura1920×1080 revisada.
  Se corrigieron los accesos de prueba posiblemente undefined y la medición antes
  de visibilidad; tipos se repitió secuencialmente tras una colisión con el build.
- **Estado/límites:** implementado/verificado localmente, T132 completo. Solo
  presentación: sin migración, dependencias, env persistido, reset, alta/envío ni
  cambios alojados. Pruebas en3001 sin detener servidor ajeno; no se repitió suite
  E2E privada/HTTP, NVDA o zoom real. Entrega de EXTRA027–033: commit `1b93a9f`,
  [PR #62](https://github.com/maximo-Pdev/funes-empleo/pull/62), abierto sin merge.
  Revisión independiente, CI, aceptación global y cierre de gates históricos pendientes.

## EXTRA-034 — PR62: actualizar regresión de retiro al contrato de errores por campo

- **Fecha/responsable/autorización:** 2026-10-20, Mateo solicita corregir el check
  fallido del PR62; continuación de EXTRA028/T125, sin cambio funcional adicional.
- **Problema/evidencia:** Quality117/run39525712466, application falla en
  intermediation.spec.ts:335: espera el aviso general anterior al retiro. El
  selector de solicitud ahora es required y Form bloquea antes de onSubmit,
  mostrando “Elegí una opción.” junto al campo.94 E2E pasan,1 falla y1 no corre;
  database y controles previos de application pasan. No es fallo de despliegue.
- **Cambio/justificación:** T133; ajustar la aserción al error asociado al selector,
  foco, aria-invalid, motivo retenido y estado aún Derivada; conservar el resto
  del recorrido que registra contacto entrante y retira con evidencia. Añadir
  regresión de componente que prueba bloqueo sin callback y envío con contacto
  entrante válido. No quitar validación ni relajar reglas para pasar el CI.
- **Archivos/contratos/riesgos:** pruebas E2E/componente de intermediación,
  tareas/estado y este registro. Sin cambios de aplicación, SQL, entorno, roles
  o contratos; verificar asociación del mensaje y no ocultar un retiro sin prueba.
- **Verificación prevista:** componentes, suite unitaria/cobertura, tipos/lint,
  push al mismo PR y ejecución completa del CI aislado. No resetear datos locales
  existentes ni usar servicios alojados. Revertir solo tests/documentación.
- **Implementación/verificación local:** E2E ahora verifica el error asociado al
  selector, foco, motivo retenido y participación aún Derivada; el recorrido
  positivo con contacto entrante se conserva. Nueva regresión de componente
  comprueba bloqueo sin callback, exclusión de contactos salientes, corrección
  del campo y payload de retiro con evidencia. Componentes11/11, cobertura736
  tests/51 archivos, tipos/lint y diff-check PASS. Sin cambios de producción.
- **Estado:** corrección implementada/verificada localmente; pendiente CI completo
  en el mismo PR62. No reset local, cambios alojados, merge ni aceptación global.

## EXTRA-035 — Contratación y retiro de consentimiento: clarificación previa

- **Fecha/responsable/origen:** 2026-10-21, Mateo solicita retiro automático al
  confirmar contratación normal/tardía, atomicidad, auditoría y conservación de
  otras participaciones e historial; exige resolver alcance antes de implementar.
- **Evidencia:** `spec.md` Clarifications 2026-09-19/20/21, FR-036/037,
  `data-model.md/candidate_consents`, contratos de estados/autorización: un único
  consentimiento general; retiro manual cierra casos abiertos; contratación normal
  conserva acceso hasta720 horas y la tardía no revive permisos revocados.
  Servidor `adminParticipationAction` -> `confirmReportedOutcome` -> RPC
  `transition_participation` (`hire`/`late_hire`) confirma ambos resultados en DB.
  El RPC no retira consentimiento; `change_candidate_consent` sí lo retira pero
  también cierra otras participaciones, por lo que no se puede reutilizar sin más.
- **Decisión/autorización:** OQ-020 resuelta por Mateo el2026-10-21: confirma la
  primera opción original, retiro global y revocación a todas las empresas; descarta
  su comentario posterior sobre solo matching. Conserva estados de otros casos,
  como excepción al retiro manual. No se inventa consentimiento por oferta, aprobación
  municipal, cierre de otros casos ni reversión automática de consentimientos.
- **Propuesta técnica condicionada:** luego de responder, actualizar spec,
  plan/modelo/contratos, checklist/tareas y análisis antes del código. Migración
  forward-only que centralice en la transacción de contratación normal/tardía el
  evento append-only de retiro, actor/fecha/motivo y revocación aprobada; sin cambios
  parciales, cierre de otros casos ni reactivación por corrección/reconsentimiento.
  El alcance individual requiere distinguir revocación de acceso y consentimiento
  global; no implementar una segunda clase de consentimiento por inferencia.
- **Archivos/contratos previstos:** funciones SQL de transición/consentimiento y
  autorización, Server Actions/servicios de resultados si corresponde; tests SQL
  de flujo/RLS/auditoría/rollback, unitarios/servidor y E2E; Spec Kit y guía de
  despliegue/recuperación. No editar migraciones ya aplicadas ni usar service-role
  para operaciones ordinarias. Al registrar esta propuesta aún no se había
  creado/aplicado una migración; resultados de implementación al final de la entrada.
- **Riesgos/verificación prevista:** ventana720h y retiro manual global son reglas
  anteriores a reconciliar expresamente; bloqueo/orden de locks e idempotencia;
  actor y causa fieles (no fingir acción afirmativa del candidato); historial de
  consentimiento intacto y permisos jamás resucitados. Contratación normal/tardía,
  permisos de varias empresas, otros casos/finales inalterados, fallo forzado de
  auditoría con rollback integral, concurrencia, nueva aceptación explícita,
  roles negativos, tipos/lint/tests/build y recuperación sin restaurar permisos.
- **Diseño técnico mínimo autorizado:** reemplazar la función RPC de transición
  manteniendo firma y grants. Bloquear candidato antes de participación y sus
  permisos para serializar contratación con aceptación/retiro/derivación; no
  llamar al retiro manual que cierra otros casos. En `hire`/`late_hire`, agregar
  evento de retiro solo si el último consentimiento es accepted, copiar política/
  hash y atribuir al admin confirmante. Fuente nueva `hiring_workflow`, restringida
  a withdrawn (requisito técnico necesario para no fingir autoservicio/atención
  presencial); motivo `hired` en auditoría y decisión privada ligada a la
  participación. Revocar todos sus permisos activos, sin tocar otros casos.
  Perfil pasa a consent_withdrawn salvo si está archivado; versión se incrementa
  para impedir envíos obsoletos. No crear ventana720h nueva; conservar soporte
  para contrataciones históricas sin backfill ni restauración de permisos.
- **Recuperación:** migración correctiva posterior, nunca reaceptar ni reabrir
  permisos como rollback; copias previas e integridad revisadas en entorno alojado
  antes de despliegue. No reset de la base local existente para validar.
- **Evidencia local previa:** regresión nueva RED22/37 contra el RPC anterior.
  `migration up --local` se detiene por la versión local histórica20261017204435,
  ajena a este cambio y ausente del checkout. No se reparará/eliminará esa historia:
  aplicar exclusivamente el SQL nuevo por psql al contenedor local confirmado,
  registrando solo la nueva versión en la misma transacción y conservando las
  versiones previas. Documentar el bloqueo del CLI para quien despliegue.
- **Aislamiento de verificación:** local024 GREEN49/49 y unitarios741/52 PASS.
  Las suites010/072 requieren versiones iniciales de ofertas; en la base ya usada
  encuentran versiones9/estados draft y fallan por CONFLICT_STALE_DATA. No corregir
  esos datos ni resetearlos. Preparar una instancia Supabase efímera separada
  `funes-empleo-hiring-check` en puertos553xx dentro de test-results (ignorado),
  con copias de migraciones/tests y fixture ficticio de aceptación, sin .env.local.
  Solo para pruebas SQL; detener esa instancia al terminar, preservando la original.
- **Implementado:** migración20261021220623, constraint de fuente restringida,
  RPC atómico con bloqueo candidato primero, retiro/auditoría/revocación global
  y ninguna modificación de otros casos. feedback-service conserva un RPC e
  invalida vistas tras éxito. Tests SQL024, unitario hiring-consent y E2E propio;
  guía `docs/validation/hiring-consent.md`, especificación/modelo/contratos,
  plan/checklist/tasks y estado actualizados. EXTRA036 cubre fecha efectiva.
- **Verificado:** SQL55/55 y suite aislada1062/17 archivos, cobertura741 tests/52
  archivos, tooling57, tipos/lint/build, E2E13/13 (dos contrataciones con lock
  real más once regresiones Auth), advisor seguridad sin warn/error y diff-check
  PASS. Cobertura configurada solo para env/schema, no de toda la aplicación.
  Se repitió cobertura fuera del sandbox tras un ENOENT de archivos temporales
  del runner; no exigió cambios de código. Sin reset de la base original.
- **Gates/estado:** clarify aprobado por Mateo; spec/plan/modelo/contratos,
  checklist10/10, tareas y análisis acotados antes de implementar. Reanálisis
  final armoniza referencias antiguas720h como históricas; sin bloqueos de alcance
  o arquitectónicos nuevos, sin ampliar la arquitectura. Convergencia acotada
  T134–138 cubierta; no acredita revisión humana, CI, despliegue ni aceptación.
  PR62 mergeado; rama desde main15ec4e7 `codex/feat-withdraw-consent-on-hire`.
  Cambio local `next-env.d.ts` preservado, sin commit/PR nuevos ni cambios alojados.
  Ambas migraciones aplicadas solo localmente; rollout compartido pendiente.

## EXTRA-036 — Fecha efectiva de eventos de consentimiento

- **Fecha/origen/autorización:** 2026-10-21; requisito técnico derivado de
  EXTRA035/T138: nueva aceptación afirmativa válida después del retiro. Autorizado
  por la delegación de requisitos técnicos necesarios de AGENTS.md y el pedido.
- **Evidencia:** pgTAP024 pasa48/49; la aceptación asistida devuelve éxito pero
  current_consent sigue false dentro de la misma transacción. recorded_at usa
  now() (inicio de transacción), mientras el retiro automático usa reloj efectivo.
- **Cambio mínimo:** nueva migración forward-only cambia únicamente el default
  de candidate_consents.recorded_at a clock_timestamp(). No reescribe filas ni
  modifica la migración ya aplicada localmente20261021220623. Mantiene fecha
  efectiva coherente en eventos sucesivos; no simula una aceptación automática.
- **Archivos/contratos:** nueva migración, modelo/plan, pgTAP024 y guía de despliegue.
  Ninguna firma RPC ni permiso se amplía; fuentes, actores y afirmación explícita
  siguen iguales. Riesgo: orden temporal al insertar múltiples eventos; verificar
  retiro y reaceptación asistida con permisos revocados y perfil draft.
- **Verificación prevista:**49 pruebas SQL iniciales, suite de consentimiento, servidor,
  tipos/lint/build. Recuperación solo de default mediante otra migración, sin
  reordenar historia ni reactivar accesos. Propuesta registrada antes del SQL.
- **Implementación/verificación:** migración20261021221414 y default comprobado
  en ambas instancias locales. SQL final55/55 y suite completa1062 PASS, incluida
  aceptación asistida posterior en la misma transacción, perfil draft y permisos
  revocados; tipos/lint/build, cobertura741 y E2E13 PASS. Modelo/plan/guía alineados.
  Implementado/verificado localmente, no revisión humana ni despliegue alojado.

## EXTRA-037 — Aplicación alojada de las dos migraciones de contratación

- **Fecha/origen/autorización:** 2026-10-21, Mateo solicita expresamente
  “aplicalas” después de explicar EXTRA035/036. Alcance exclusivo: las versiones
  20261021220623 y20261021221414, sin backfill ni cambios de datos de negocio.
- **Evidencia previa:** CLI autenticado identifica el proyecto enlazado
  Funes-empleo/kyjycjojzhwggjuqjnki como ACTIVE_HEALTHY. El conector MCP no tiene
  acceso a ese proyecto; se usa la sesión CLI autorizada ya existente, sin pedir
  claves. Consulta de catálogo confirma función idéntica al cuerpo de la versión
  base, grants esperados, source self_service/assisted y default now(). Ambas
  versiones nuevas están ausentes. Snapshot de función/constraints/default/grants
  guardado en test-results/hiring-remote-before.json (ignorado, sin datos personales).
- **Obstáculo técnico:** migration list y db push --dry-run --skip-vault confirman
  versiones remotas históricas con timestamps distintos de los archivos locales.
  No reparar, revertir, renombrar ni volver a ejecutar esa historia para aplicar
  dos cambios nuevos; no se modifica Vault ni se ejecutan seeds o tests alojados.
- **Cambio mínimo propuesto:** ejecutar por CLI db query --linked únicamente el
  contenido revisado de ambas migraciones, en una transacción común con límites
  de espera/ejecución, guardia contra cambios concurrentes del cuerpo de función
  y registro de sus propias versiones/nombres/statements en la misma transacción.
  Los archivos de migración quedan intactos; no se registra éxito antes del DDL.
  El registro guarda ambos SQL originales para trazabilidad. No modifica versiones
  previas, configuración, datos de candidatos, permisos existentes ni resultados.
- **Riesgo/recuperación/verificación:** breves locks DDL; ante conflicto/timeout
  rollback total y revisar, sin bucles de reintento. Copia previa de definiciones,
  recuperación forward-only según guía, nunca restaurar consentimiento/permisos.
  Verificar cuerpos SQL/default/constraints/grants/versiones y advisors antes/
  después mediante consultas de catálogo sin PII; no crear contrataciones reales.
  Actualizar guía/estado con resultado real. Estado: procedimiento registrado
  antes de ejecutar el DDL alojado; no implica CI, PR, revisión ni aceptación.
- **Resultado alojado:** ambas migraciones aplicadas en una única transacción,
  incluidas sus versiones originales y SQL registrado. Verificación posterior:
  cuerpo remoto igual al archivo, ambos constraints correctos, default
  clock_timestamp(), SECURITY DEFINER/search_path y grants conservados (anon y
  service_role sin ejecución; authenticated sí). Hash de toda la historia previa
  idéntico antes/después y hashes del SQL registrado iguales a los archivos.
  Advisor remoto:52 WARN previos y52 posteriores, cero nuevos; no se declara
  resuelto ese backlog ni se relajan permisos. No se ejecutaron pruebas/fixtures,
  contrataciones ni backfill alojados. Evidencia técnica ignorada en test-results/
  hiring-remote-{before,apply,after}.json y logs de advisors. Guía y estado
  actualizados; reemplaza el pendiente de rollout alojado de EXTRA035/036.
  Sin commit/PR nuevo, despliegue de aplicación, CI ni revisión independiente.

## Entrega de EXTRA035–037 — 2026-10-21

Mateo solicita crear el PR. Commit funcional28c6a25, rama
codex/feat-withdraw-consent-on-hire desde main15ec4e7 actualizado:
[PR63](https://github.com/maximo-Pdev/funes-empleo/pull/63), abierto hacia main,
sin merge. Incluye las dos migraciones ya aplicadas/verificadas en Supabase
compartido, pruebas y trazabilidad de la decisión global. next-env.d.ts conserva
su modificación local y queda excluido; sin logs/fixtures privados/secretos.
Verificaciones previas consignadas en EXTRA035–037; cambios de esta entrega solo
documentales, diff-check PASS. CI/revisión independiente y aceptación pendientes.

## EXTRA-038 — PR63: aislar fixtures de contratación y matching

- **Fecha/origen/autorización:** 2026-10-21, Mateo solicita corregir el error de
  GitHub del PR63; derivado de T138 y de la obligación de regresión sin saltos.
- **Evidencia:** Quality121/run39688659768: database PASS; application falla
  exclusivamente en dos E2E de job-category-matching,95 pasan y1 no corre. Las
  dos contrataciones nuevas pasan, pero copian ofertas publicadas sin sus rubros.
  El selector de matching elige cualquier primera oferta pública por UUID: puede
  elegir una de esas ofertas aleatorias sin categorías y encontrar cero candidatos.
  No es fallo de migración ni razón para relajar consentimiento o matching.
- **Cambio mínimo propuesto:** ofertas de contratación ficticias en paused (los
  permisos de derivación admiten ese estado), aserción de que no aparecen en
  public_offer_rows, y selector del fixture de matching con categorías explícitas
  como precondición. Conservar expectativas de12 tarjetas/paginación/nominación,
  rechazo/ausencia de acceso, auditoría, locks y demás casos intactos.
- **Archivos/contratos/riesgos:** tests/e2e/hiring-consent.spec.ts,
  tests/e2e/job-category-matching.spec.ts, tareas/estado y este registro. Solo
  fixtures/selección de prueba; sin cambios de producto, arquitectura, migraciones,
  dependencias, configuración, permisos o datos alojados. No borrar/restablecer
  datos locales para forzar verde ni omitir pruebas.
- **Verificación prevista:** RED de aislamiento antes del fix, E2E de ambas
  contrataciones y matching, tipos/lint/tooling/cobertura/build, diff-check;
  publicar en el mismo PR y comprobar CI completo aislado. Autoriza el pedido y
  AGENTS.md para prerrequisito técnico; no implica nueva aceptación del producto.
- **Implementación/verificación local:** aserción de aislamiento RED (esperaba0
  ofertas públicas, recibía2) y GREEN tras usar paused. Helper de matching exige
  categorías, sin elegir por cantidad de coincidencias ni bajar expectativas.
  Navegador6/6 PASS ejecutando contratación antes de matching; ambas contrataciones
  y las cuatro regresiones de modal/paginación/nominación/roles se conservan.
  Cobertura741 tests/52 archivos, tooling57, tipos/lint/build y diff-check PASS.
  Docker/base existentes iniciados sin reset; solo se cerró el servidor de pruebas
  propio. next-env.d.ts mantiene el cambio local y se excluye del commit.
  Corrección en el mismo PR63, pendiente nueva ejecución CI completa/revisión.

## EXTRA-039 — Retirar autoarchivo de candidatos y empresas

- **Fecha/origen/autorización:** 2026-10-22, Mateo solicita eliminar archivar/
  eliminar cuenta en perfiles candidatos y empresas, tras merge de PR63. Alcance
  comunicado: autoservicio, manteniendo archivo/restauración administrativos y
  todo el historial; no elimina derechos legales ni decide OQ-001/002.
- **Evidencia/conflicto:** paneles CandidateProfilePanel/CompanyProfileForm y
  /account ofrecen archivo propio. FR-016/054 y contratos antiguos lo permiten;
  service changeAccountStatus y RPC público delegan incluso para titulares.
  Ocultar solo tarjetas dejaría la operación disponible por requests antiguos.
  La petición expresa sustituye ese permiso de autoservicio; no afecta archivo
  de ofertas propias, disponibilidad, retiro de postulaciones o consentimiento.
- **Cambio técnico mínimo necesario:** quitar formularios/estado/props/Actions/
  servicio exclusivo de autoarchivo; conservar comandos administrativos. Exigir
  admin activo en servicio común y wrapper público change_account_status, con
  nueva migración forward-only, misma firma/grants, sesión bloqueada y delegación
  privada/auditoría existentes. Sin nuevos estados, tablas, triggers o paquetes.
- **Archivos/contratos:** perfiles y /account, features/accounts/candidates/
  companies, validadores solo del flujo removido; spec/plan/modelo/contratos,
  tareas/checklist; pruebas UI, servidor/HTTP, SQL/RLS/rollback y E2E actuales.
- **Riesgos/recuperación:** no borrar cuentas/eventos, preservar recursos ya
  archivados y restauración administrativa. No reutilizar sesiones de titulares
  como si fueran admin en pruebas. No editar migraciones aplicadas. Recuperación
  forward-only sin reactivar permisos ni autoarchivo por rollback implícito.
  Aplicar SQL antes de app en el rollout; alojado no se modifica en esta tarea.
- **Gates/verificación prevista:** alinear artefactos y checklist/tareas/análisis
  acotados antes de implementar; RED UI/servicio/SQL, roles negativos y cero
  cambios ante denegación, archivo/restauración admin positivos con motivo e
  historial, consentimiento/edición/logout intactos; tipos/lint/pruebas/build y
  E2E ficticios sin reset local. Misma arquitectura/constitución, sin nueva
  decisión municipal ni aprobación/revisión independiente inferidas.
- **Rama/estado inicial:** main actualizado a a75bfc8 (PR63 mergeado), rama
  codex/feat-remove-profile-self-archival; anterior borrada local/remoto. Cambio
  local next-env.d.ts preservado. Quality122 del PR63 pasó application/database,
  98 E2E y carreras SQL, Vercel success. Esta entrada precede a la implementación.
- **Precisión detectada en pruebas:** el privado anterior rechaza archivar
  candidatos por admin, aunque sí permite archivo empresarial administrativo y
  restauración de candidatos. No se añade un permiso administrativo nuevo para
  sustituir el autoarchivo; se preserva exactamente ese alcance previo. Los tests
  de restauración preparan archivos candidatos históricos como propietario de la
  DB ficticia, nunca como permiso público nuevo. Artefactos ajustados a este límite.
- **Prerrequisitos de pruebas:** inventario Form pasa de41 usos a38 por retirar
  tres formularios; se actualiza su mínimo manteniendo el escaneo estricto de
  campos. En navegador local11/12 pasan inicialmente; el recorrido candidato
  encuentra cuatro ofertas ficticias anteriores con título idéntico. Seleccionar
  dos títulos únicos disponibles y ubicar sus textos exactos, sin reset/borrar
  fixtures ni cambiar lógica de postulaciones, para comprobar ambos casos nuevos.
  La ejecución siguiente conserva11/12 y encuentra concatenación del textarea al
  rellenarlo inmediatamente tras navegar; probar la sustitución con foco y
  selección total por teclado, manteniendo la aserción exacta y sin sleeps,
  reintentos de escritura, cambios de producto o resets.
- **Implementado:** sin tarjetas de archivo en ambos perfiles o /account; Actions
  exclusivas/servicio/validador/props retirados, guardia admin en servicio común y
  migración20261022202940 del wrapper público, misma firma/grants/locks. Archivo
  empresarial y restauraciones históricas siguen igual; ninguna habilitación de
  archivo administrativo candidato. Migración aplicada solo localmente, sin tocar
  la anterior historia local divergente ni editar archivos SQL ya aplicados.
- **Verificado:** UI/servidor RED7/33, SQL RED10/12; final unitarias/componentes/
  integración/cobertura730 tests/53 archivos, tooling57, SQL1072/18 archivos,
  navegador12/12 (incluye HTTP real8/8), tipos/lint/build, diff-check y advisor
  local sin warn/error PASS. Cobertura configurada mide env/schema, no toda la app.
  SQL073 final14 casos, snapshot sin cambios por denegación y sin nuevo permiso
  candidato; se conserva rollback administrativo y restauración de datos legados.
  React: hooks no condicionales, estado/props sin uso retirados, Form/Field y
  efectos/validación restantes conservados; edición, logout, teclado/axe y
  permisos comprobados en recorridos pertinentes. No son revisión externa/NVDA.
- **Gates/estado final:** spec→plan/modelo/contratos→checklist9/9→tareas→análisis
  acotado→implementación→verificación/convergencia del incremento. La precisión de
  permisos candidata descubierta en tests se alinea sin ampliar arquitectura o
  permisos; sin gaps construibles nuevos dentro de T140–143. No converge ni acepta
  globalmente el MVP. Guía docs/validation/profile-self-archival.md.
  Instancia SQL efímera detenida/descartada y servidor propio cerrado; base local
  original sin reset y next-env.d.ts preservado. Datos de prueba nuevos ficticios;
  sin cambios alojados, CI, revisión o aceptación acreditados.
  Commit funcional70ae1ea publicado en PR64:
  https://github.com/maximo-Pdev/funes-empleo/pull/64 (abierto, sin merge).
  Pendiente aplicar únicamente20261022202940 en Supabase compartido antes del
  despliegue de app y revisión mediante PR; gates históricos/OQ-001/002 intactos.

## EXTRA-040 — Claridad de consentimiento y activación del perfil candidato

- **Fecha/origen/autorización:** 2026-10-22, petición expresa de Mateo de aclarar
  consentimiento y colocar activación/indicador al principio. PR64 confirmado
  mergeado (5b15b24); rama codex/feat-candidate-consent-activation-ui desde main
  actualizado, anterior eliminada local/remoto. next-env.d.ts ajeno preservado.
- **Evidencia:** CandidateProfilePanel muestra el formulario de activación al
  final para cualquier estado distinto de active, incluso incompleto/archivado.
  El RPC activate_candidate de202609190019 exige draft/needs_update/unavailable/
  consent_withdrawn, disponibilidad available, localidad/resumen no vacíos,
  categoría, consentimiento accepted y CV válido. Workspace ya provee esos datos
  guardados y la ruta exige cuenta candidata activa. No hace falta otra consulta.
  CSS usa first-of-type/last-child y pinta de rojo la activación como si fuera
  destructiva; moverla sin revisar esos selectores puede deformar otras tarjetas.
- **Reglas/origen aprobado:** FR-010/015/036/038/055, OQ-020 resuelta y EXTRA035:
  consentimiento global, no por oferta; contratación normal/tardía confirmada
  retira el vigente y revoca todos sus accesos empresariales, sin alterar otros
  casos ni resultados. Nuevo consentimiento exige acción afirmativa y no revive
  permisos. Retiro manual conserva sus efectos propios. OQ-001/002 siguen abiertas.
- **Cambio mínimo propuesto antes de implementar:** primera tarjeta con estado,
  vigencia e indicador Perfil activo, o formulario Activar perfil solo si la
  proyección guardada satisface las condiciones actuales del RPC. Mostrar faltantes
  accionables para estados recuperables sin habilitar envíos imposibles; servidor
  mantiene la revalidación final ante concurrencia. Selectores CSS semánticos para
  datos laborales, eliminando estilos destructivos posicionales obsoletos.
  Explicación auxiliar de autorización municipal, derivación, datos visibles/no
  visibles, retiro global al contratar, historial y nueva aceptación explícita.
  Conservar íntegros policy_text/version/hash y aviso de política demo no aprobada.
- **Archivos/contratos afectados:** panel candidato, candidate-forms.module.css,
  pruebas de componente y navegador; spec/plan/tasks/estado y guía de interfaz.
  Sin nuevas Actions, RPC, migración, campos persistidos, entorno, dependencias
  ni cambios de autorización, activación, contratación, disponibilidad o política.
- **Riesgos/verificación prevista:** no confundir activo con aptitud para derivar,
  no afirmar cierre de otros casos por contratación ni eliminación de historia;
  no reemplazar política/hash con explicación auxiliar. RED de orden/estados,
  faltantes independientes y consentimiento; GREEN, regresiones de candidato,
  teclado/axe/móvil/escritorio, tipos/lint/tooling/cobertura/build. Usar solo
  fixtures locales ficticios sin reset ni cambios alojados. Análisis de coherencia
  acotado a este incremento; revisión humana/aceptación no inferidas.
- **Estado inicial:** propuesta registrada antes de cambios de producto; autorización
  expresa del solicitante, sin nueva arquitectura o decisión municipal/legal.
- **Ajuste visual necesario detectado:** captura local1920×1080 con el texto nuevo
  muestra consentimiento en media anchura y Contacto adicional estirado con un
  gran vacío por la fila compartida. Antes de corregir: usar ancho completo para
  ambos formularios directos del panel; conservar dos columnas internas en datos
  laborales y una en móvil. Solo CSS local, sin reordenar DOM o agregar componentes.
  Evidencia sintética ignorada test-results/profile-presentation-desktop.png;
  verificar nueva captura, axe, ausencia de overflow y regresión de formulario.
- **Implementación:** tarjeta inicial con estado/vigencia y formulario condicional,
  faltantes calculados sin efectos/estado duplicados, explicación global y retiro
  manual diferenciados. policy_text/version/hash y formulario afirmativo intactos.
  CSS semántico/ancho completo verificados visualmente con capturas sintéticas.
  Archivos reales: panel, CSS candidato, candidate-flow/profile-presentation y
  candidate-self-service, guía docs/product/candidate-profile-presentation.md,
  spec/plan/tasks/implementation-status y este registro. Ningún archivo de
  backend, autorización, contrato persistido o migración modificado.
- **Evidencia inicial de pruebas:** RED15/15 de presentación; la suite candidata
  adicional tuvo fallo de importación temporal en el sandbox de Vitest, no de
  producto. Reejecución fuera del sandbox GREEN28/28, sin modificar configuración
  o relajar aserciones. Tooling57/57, cobertura745/54, tipos/lint/build PASS.
  Cobertura configurada sigue limitada a env/schema, no toda la aplicación.
  Servidor next dev de Mateo detenido únicamente tras autorización expresa;
  puerto3000 reservado por Playwright y configuración de proceso solo local.
- **Verificación final:**745 pruebas/54 archivos y tooling57 PASS, tipos/lint/build
  y diff-check PASS. Navegador12/12 en una ejecución sin reintentos: autogestión,
  formularios9 y contratación normal/tardía2. Activación superior por teclado,
  indicador activo sin botón, faltantes, anchura de tarjetas, móvil360×800,
  escritorio1920×1080, sin overflow y axe PASS. Revisión visual de las dos capturas
  ficticias, sin NVDA o validación humana acreditada. Avisos previos de stream
  cerrado por navegación en logs Next no impidieron los recorridos; sin cambio
  ajeno para ocultarlos. No se volvió a ejecutar pgTAP completo: no cambia DB.
- **Análisis/convergencia acotados:** reglas UI trazadas a FR-010/015/036/038/055,
  consentimiento global a OQ-020/EXTRA035 y tareasT144–147. Sin hallazgos bloqueantes
  de duplicación/ambigüedad/contratos/constitución o gaps construibles dentro del
  incremento. Checklists previos4/4 sin ítems pendientes, sin modificarlos ni
  atribuir revisión independiente. Guía y estado actualizados; hooks de extensión
  no configurados. Revisión React: derivaciones simples en render, sin nuevo
  efecto/fetch/estado persistido, hooks incondicionales y claves estables.
  Servidor de pruebas cerrado automáticamente, base local sin reset, next-env.d.ts
  ajeno restaurado tras typegen/build. Sin migración, entorno alojado, commit/PR
  nuevo, CI, suite E2E completa o aceptación global. OQ-001/002 siguen pendientes.

## EXTRA-041 — Reorganizar teléfono, CV y aviso de consentimiento

- **Fecha/origen/autorización:** 2026-10-22, Mateo solicita retirar el cartel de
  política demo, integrar teléfono opcional en Datos laborales y personales y
  colocar CV antes del consentimiento. Misma rama, renombrada por pedido de Mateo
  a feat/candidate-consent-activation-ui; sin prefijo codex ni firmas/atribuciones
  automáticas en futuros commits. Cambios EXTRA040 y next-env.d.ts preservados.
- **Evidencia/necesidad:** teléfono y datos usan comandos/versiones separados.
  Encadenarlos desde la UI como si fueran un guardado atómico podría guardar solo
  una parte o enviar una versión vencida. El pedido es visual: no justifica un
  RPC/migración o modificar validación/autorización. El consentimiento registra
  versión/hash de policy_text demo; quitar toda posibilidad de consultar ese texto
  rompería la trazabilidad de lo mostrado respecto de lo aceptado.
- **Cambio mínimo propuesto antes de implementar:** una sola tarjeta de Datos
  laborales y personales con teléfono opcional y botón explícito Guardar teléfono,
  conservando dos formularios hermanos y sus comandos existentes, nunca anidados
  ni guardado parcial disfrazado de éxito conjunto. Eliminar tarjeta/título
  Contacto adicional. Mover el bloque CV completo antes del consentimiento.
  Quitar cartel amarillo de la vista inicial; política literal y versión siguen
  consultables en details/summary accesible, cerrado inicialmente. No cambiar
  política/hash, aceptación afirmativa, permisos ni su carácter demo. La petición
  no constituye aprobación legal ni habilitación de datos reales (OQ-001/002).
- **Archivos/contratos:** panel, CSS si fuera necesario, pruebas componentes/E2E
  de perfil y contacto derivado, spec/plan/tasks/guía/estado y este registro.
  Sin cambios backend, DB, migraciones, entorno, dependencias o contratos RPC.
- **Riesgos/verificación prevista:** evitar forms anidados y pérdida de otros
  campos al guardar teléfono; validar opcionalidad/errores/versión y persistencia.
  Orden CV→consentimiento real en DOM; política expandible por teclado y sin
  banner inicial; activación/consentimiento de EXTRA040 intactos. RED/GREEN de UI,
  pruebas/tipos/lint/tooling/build y navegador local ficticio, sin reset/alojado.
  Autoriza el solicitante; revisión/aceptación humana pendientes.
- **Implementación:** sección única de datos con formularios hermanos, sin
  anidamiento ni comandos nuevos; teléfono opcional y Guardar teléfono explícito.
  CV antes del consentimiento. Cartel amarillo retirado; política literal y
  advertencia solo en details/summary cerrado, con acceso por teclado. Actions,
  versiones, validación, hash y reglas permanecen. Regresión de contacto derivado
  actualiza solo el nombre del botón candidato, no las acciones municipales.
  RED2/16 y GREEN29/29 focales; cobertura746/54, tooling57, tipos/lint/build PASS.
- **Verificado/cierre acotado:** navegador11/11 PASS sin reintentos: candidato1,
  formularios9 y snapshot/contactos/consentimiento1. Teléfono inválido señalado,
  guardado/relectura y vaciado opcional correctos; guardar teléfono no borra ni
  guarda otras correcciones locales. Política inicialmente cerrada y expandible
  por teclado; CV antes del consentimiento, sin tarjeta Contacto adicional ni
  forms anidados. Capturas sintéticas y móvil/escritorio/axe revisados. Contacto
  actualizado visible a empresa ya derivada, CV instantáneo conservado y retiro/
  reaceptación sin devolver acceso. Fixture15 se consultó primero para comprobar
  precondiciones y luego se ejecutó el recorrido existente, sin reset local.
  Logs Next mantienen avisos previos de stream cerrado al navegar; recorridos
  completados sin ocultar errores de pruebas o cambiar producto ajeno.
- **Trazabilidad/límites:** T148–150 y guía/estado alineados, análisis de alcance
  sin arquitectura/contrato/permiso nuevo ni decisión legal inventada. React con
  hooks/Actions existentes y sin nuevos efectos/fetch. Diff-check PASS, sin hooks
  de extensión configurados. Servidor next dev cerrado tras nueva autorización
  de Mateo y servidores de prueba finalizados; next-env.d.ts ajeno restaurado.
  Sin migración, cambios alojados, commit/PR, CI, suite completa E2E/SQL o NVDA;
  OQ-001/002 y revisión humana permanecen abiertos. Policy/hash no modificados y
  retirar el cartel no acredita aprobación municipal o uso con datos reales.

## Entrega de EXTRA040–041 — 2026-10-22

Mateo solicita el PR. Commit funcionalc228d2c desde main5b15b24 actualizado,
rama feat/candidate-consent-activation-ui, sin firma GPG/sign-off/atribución
automática. PR65 abierto hacia main, sin merge:
https://github.com/maximo-Pdev/funes-empleo/pull/65.
Incluye interfaz, pruebas y artefactos del incremento; next-env.d.ts ajeno queda
fuera y sin añadir logs/capturas/secretos. Verificaciones locales consignadas en
EXTRA040–041; publicación no acredita CI, revisión o aceptación. Sin nuevas
migraciones ni cambios alojados. Documentación de entrega: diff-check PASS.

## EXTRA-042 — Referencia visual municipal compartida

- **Fecha/estado:** 2026-10-20; autorizado por Maxi en la rama visual, registrado
  antes de implementar. No acredita aceptación municipal ni revisión del compañero.
- **Origen:** solicitud explícita de guardar una guía en el repositorio y aplicar
  los colores, formularios y fuentes extraídos de `https://funes.gob.ar/`.
- **Problema/evidencia:** el portal combina Arial, primarios verdes distintos y
  controles azules. El tema municipal declara Be Vietnam/Sora, `#074A1F`,
  `#262b35` y `#868d98`; sus formularios usan borde inferior y etiquetas uppercase.
  AdminLTE pisa parte de la tipografía y elimina el foco: no se replica ese defecto.
- **Cambio mínimo/justificación:** guía permanente referenciada desde AGENTS,
  fuentes locales con licencias y procedencia, tokens y presentación compartida de
  formularios. Necesario para que otras sesiones mantengan la misma referencia.
- **Superficies:** `docs/UI_GUIDELINES.md`, `AGENTS.md`, `src/app/globals.css`,
  estilos de formularios de portada/autenticación, primitivas Button/TextField/
  SelectField, `public/fonts/funes/` y pruebas visuales/de componentes.
- **Límites/coordinación:** esta rama mantiene lo visual; no cambia acciones,
  permisos, datos, contratos de props, campos, textos funcionales ni navegación.
  Se preserva el trabajo previo sin confirmar y la composición de portada.
- **Riesgos/recuperación:** tokens y reglas de formulario compartidos afectan varias
  rutas. Revertir únicamente este diff; conservar errores, acciones peligrosas,
  checkboxes, radios, archivos y foco accesible. No hay migración ni cambios de env.
- **Verificación prevista:** RED/GREEN visual y de primitivas, pruebas unitarias,
  lint/typecheck/build, revisión independiente y navegador desktop/mobile sin
  enviar formularios ni resetear datos. Revisión humana y PR pendientes.
- **Implementación:** guía `docs/UI_GUIDELINES.md` enlazada desde AGENTS, nueve
  fuentes originales locales con licencias OFL, tokens municipales y controles
  compartidos implementados. Be Vietnam para texto/campos y Sora para títulos/
  botones. Se preservan la composición previa, bisel, sombras y cambios ajenos.
- **Resultados:** RED observado (dos pruebas de primitivas y fuente Arial en
  navegador); GREEN focalizado 32/32; regresión 559 pruebas/37 archivos PASS;
  lint, typecheck y build exit 0; detector visual sin hallazgos; diff-check PASS.
  Chromium de producción: login y ambos registros a 1440/390px PASS, sin envíos
  ni reset de datos. Inspección de capturas desktop/mobile realizada.
- **Revisión independiente:** 16 pruebas focalizadas y seis casos de navegador
  PASS; nueve hashes de fuentes coinciden con el inventario. Sin bloqueos.
  Advertencia no bloqueante: TextField sigue siendo un control textual, no debe
  usarse para checkbox/archivo; la guía delimita esa excepción. No se cambian sus
  contratos para corregir un uso que no existe entre sus consumidores actuales.
- **Entorno/límites:** el servidor previo 3000 presentó fallos de hidratación/HMR;
  la prueba usa producción separada en 3001, no acredita corregir aquel entorno.
  La primera comprobación de una fuente no usada se corrigió para cargar el peso
  explícitamente antes de verificarlo. Node observado 26.7.0, distinto del 24.21.0
  requerido; no se modifica el entorno. No se recorren exhaustivamente páginas
  privadas ni se ejecuta el E2E que resetea datos. Revisión humana/municipal y PR
  pendientes. Sin commit ni publicación en esta tarea.

## EXTRA-043 — Acceso a ofertas sin superposición al centrar Empresa

- **Fecha/estado:** 2026-10-21; implementado y verificado técnicamente; registrado
  antes de implementar como detalle necesario
  de la corrección visual solicitada por Maxi: «el recuadro de login y registro
  cuando selecciono Registrarse -> Empresa no está centrado verticalmente».
- **Evidencia:** la regla de registro usa `align-items: flex-start` y márgenes
  verticales asimétricos. Centrar Empresa con su altura natural hace coincidir la
  tarjeta ancha con el enlace inferior centrado en toda la pantalla.
- **Cambio mínimo/justificación:** centrar Empresa con 40px de espacio superior e
  inferior; solo en Empresa desktop, centrar el enlace inferior dentro del
  cuadrante izquierdo para preservar su acceso sin cubrir campos ni la tarjeta.
- **Superficies/contratos:** `src/app/(public)/home.module.css`,
  `tests/visual/home-responsive-layout-check.mjs`, `docs/UI_GUIDELINES.md`.
  Sin cambios de contratos, acciones, validación, datos ni estilos globales.
- **Riesgos/recuperación:** cambio local de composición; conservar los demás
  modos y celular. Formularios más altos que la pantalla mantienen scroll del
  documento. Revertir únicamente estas reglas locales si se rechaza el ajuste.
- **Autorización/revisión:** derivado de la corrección explícita y la autorización
  de detalles necesarios; informado al usuario. Revisión humana y PR pendientes.
- **Verificación:** RED observado por `flex-start` en Chromium; GREEN en 15 estados
  responsive y seis estados municipales, sin superposición ni scroll interno.
  Desviación de centrado de Empresa: 0px a 1440×900 y 1920×1080; tarjeta completa
  dentro del viewport y composición móvil preservada. Tres clics reales del
  enlace llegan al destino con el offset de navbar, usando la tolerancia de 2px
  existente para scroll suave y coordenadas fraccionarias, no igualdad exacta.
  Pasan 568 pruebas unitarias, lint, tipos, build y diff-check; capturas revisadas.
  Advertencia externa de lockfile conocida/no bloqueante. Sin cambios de datos,
  envíos de formularios, commit ni publicación. Revisión humana/PR pendientes.

## EXTRA-044 — Espacio de navbar para el SVG ampliado de portada

- **Fecha/estado:** 2026-10-21; registrado antes de implementar, revisión pendiente.
- **Origen:** pedido de Maxi de quitar el título de la portada y reemplazar el
  logo por el SVG adjunto, ampliándolo porque casi no se ve.
- **Problema/cambio mínimo:** el logo de 60px está limitado por una navbar de
  72px. En portada se mostrará a 96px dentro de una navbar de 104px, ajustando
  el espacio móvil y el offset del destino inferior para no ocultar contenido.
- **Superficies/contratos:** `home-navbar.tsx`, `home.module.css`, `page.tsx`,
  recurso en `public/brand/`, pruebas de portada y guía visual. La variante
  `alwaysVisible` reutilizada en cuenta conserva sus dimensiones de 72px/60px.
  No cambian enlaces, acciones, validaciones, datos ni contratos de props.
- **Riesgos/justificación:** evitar recortar el SVG o superponer la navbar con
  formularios. Cambio local de composición derivado del tamaño solicitado,
  informado mediante esta entrada; sin estilos globales ni cambios de permisos.
- **Verificación/estado:** RED observado para título y logo; previstos copia
  idéntica del SVG, geometría de imagen/navbar, enlace y offset de 104px,
  responsive desktop/mobile, variantes de cuenta y puertas de calidad.
  Implementado: SVG copiado sin modificar (hashes iguales), título y reglas de
  título retirados, imagen 96×96/navbar 104px en portada y espacio móvil 24px.
  Pasan 15 pruebas focalizadas, 569 unitarias, lint, tipos, build y diff-check;
  15 estados responsive y seis municipales en Chromium. SVG decodifica como
  353×353; geometría CSS compacta sigue en 72px/60px. Capturas desktop/mobile
  revisadas; enlace municipal y destino inferior de 104px verificados.
  Next/Image no emite `sizes` para este SVG no optimizado: la prueba incorrecta
  del atributo se sustituyó por geometría real, sin cambiar la aplicación para
  satisfacer esa suposición. Sin envíos de formularios ni cambios de datos.
  Advertencia de lockfile externa preexistente/no bloqueante. Sin commit/PR ni
  aceptación humana; revisión pendiente.

## EXTRA-045 — Integración local de Canvas Ribbons y restauración informativa

- **Fecha/estado:** 2026-10-21; registrado antes de implementar, revisión pendiente.
- **Origen:** pedido explícito de reemplazar el slideshow por `bsehovac/LQVzxJ`
  y restaurar la información de la captura; ZIP original adjuntado por Maxi.
- **Evidencia/prerrequisito:** el efecto utiliza Canvas 2D/JavaScript, no CSS solo.
  El ZIP incluye código completo, sin dependencias externas, y licencia MIT de
  Boris Šehovac. Conservar aviso/licencia es condición de reutilización.
- **Cambio mínimo:** adaptar las mismas curvas Bézier e historial de cintas a
  TypeScript/React, paleta municipal y fondo neutro oscuro; retirar estadísticas,
  globals y bucle sin limpieza del demo. Añadir resize, cancelación al desmontar,
  pausa fuera de vista/documento oculto y fotograma estático con movimiento reducido.
- **Superficies:** portada, módulo CSS local, componente de fondo, licencia en
  `public/brand/canvas-ribbons/`, guía y pruebas de portada. Texto restaurado desde
  `src/app/(auth)/login/page.tsx`, contrastado con la captura. Sin cambios en esa
  ruta, formularios, navbar, permisos, datos, paquetes ni servicios externos.
- **Límites/riesgos:** no ejecutar el HTML global del ZIP, no ocultar el scroll del
  documento y preservar móvil con tarjeta primero e información desktop oculta.
  Limitar densidad, FPS y resolución; verificar contraste, ciclo de vida y ausencia
  de superposición. No afirmar equivalencia sin usar la geometría del original.
- **Autorización:** solicitud explícita y detalles necesarios de integración local;
  revisión humana/PR pendientes. Sin commit ni publicación autorizados.
- **Verificación:** RED observado para contenido, reemplazo y ciclo de vida;
  previstos GREEN unitario, navegador (píxeles en movimiento/estáticos, resize,
  contenido y formularios), lint, tipos y build.
- **Implementado/verificado:** fondo local `home-ribbons.tsx`, información completa
  restaurada, slideshow retirado y licencia original MIT copiada sin alterar.
  Pasan 18 pruebas focalizadas, 572 unitarias/38 archivos, lint, tipos, build y
  diff-check. Chromium: 15 estados responsive y seis municipales PASS, píxeles
  que cambian en reproducción y se congelan con movimiento reducido, carga
  inicial reducida con fotograma visible y resize estático correctos; cero
  solicitudes a fotos y cero errores JS en 1440/768/390px. Capturas inspeccionadas.
- **Correcciones acotadas:** prueba real reprodujo que `isIntersecting` puede ser
  verdadero con área visible cero; se usa umbral/ratio explícito para pausar en
  el borde. La prueba móvil esperaba pausa antes de terminar de crecer la tarjeta:
  espera ahora sus transiciones antes de ir al final del documento. Pausa fuera
  de pantalla y reanudación verificadas. Sin cambios ajenos para satisfacer pruebas.
- **Límites finales:** assets fotográficos/procedencia originales preservados sin
  uso; navbar de 64px y márgenes existentes intactos. Sin cambios de datos,
  sesiones, paquetes, envíos reales, commit ni publicación. Advertencia de
  lockfile externa preexistente/no bloqueante; revisión humana/PR pendientes.

## EXTRA-046 — Retorno de CV y actualización del panel de cuenta

- **Fecha/estado:** 2026-10-21; implementado y verificado técnicamente;
  revisión humana pendiente. Prerrequisito registrado antes del cambio de retorno.
- **Origen:** solicitud explícita de integrar perfil, ofertas y postulaciones en
  `/account` mediante sidebar y retirar el archivo de cuenta de esta pantalla.
- **Problema/evidencia:** `src/app/api/candidate/cv/route.ts` devuelve todo resultado
  de candidato a `/candidato/perfil`; las acciones invalidan solo las rutas antiguas.
  Esto saca al usuario del panel después de cargar el CV o deja sus datos sin invalidar.
- **Cambio mínimo:** aceptar únicamente el valor exacto `/account?section=perfil`
  como contexto opcional de retorno de candidato y conservar destinos anteriores
  por defecto, administrativos y de sesión inválida. Añadir invalidación de `/account`
  a las acciones existentes; sin modificar validaciones, permisos ni persistencia.
- **Archivos/contratos:** ruta POST de CV, prop opcional/hidden del panel de perfil,
  acciones de perfil/consentimiento/postulación y pruebas de retorno/compatibilidad.
- **Riesgos/límites:** impedir redirecciones externas y preservar propiedad, versión,
  mensajes, status 303 y cabeceras privadas. No migraciones, nuevos proveedores,
  cambios de autenticación ni eliminación de rutas.
- **Autorización/coordinación:** detalle necesario de la integración solicitada;
  revisión humana del contrato compartido pendiente, sin publicación ni commit.
- **Verificación:** RED reproducido en retorno válido/inválido; previstos tests de
  allowlist, compatibilidad legacy/admin, acciones, UI integrada, lint, tipos y build.
- **Resultados:** 600 pruebas/40 archivos, lint, tipos, build y diff-check pasan.
  Verificación independiente en copia scratch: 49 pruebas focalizadas, incluidas
  variantes de redirección, cuenta ajena/archivada/desactualizada y sesiones
  inhabilitadas; sin defectos bloqueantes. Probes adversariales incorporados al repo.
  Navegador: seis vistas desktop/móvil de componentes reales con servicios ficticios,
  clics de las tres secciones, geometría sin superposición/desborde y logout encima
  de identidad verificados. No equivale a una sesión autenticada con base real.
- **Compatibilidad/límites:** los cargadores existentes ejecutan bootstrap/frescura;
  no se afirma que todos los GET de cuenta carezcan de efectos persistentes. Sin
  nuevas reglas de mutación, paquetes, datos personales, commits ni publicación.
  La sidebar local adapta la composición no colapsable de shadcn, no instala el
  registro completo ni cambia primitivas ajenas. Revisión humana/PR pendientes.

## EXTRA-047 — Componentes oficiales de shadcn con identidad municipal

- **Fecha/estado:** 2026-10-22; criterio solicitado por el usuario y documentado;
  migración de código, coordinación y revisión pendientes.
- **Origen:** solicitud explícita de usar componentes oficiales de shadcn y
  adaptarlos al estilo actual, incluidos los controles existentes de la landing.
- **Problema/evidencia:** `components.json` configura `base-nova`, pero las
  primitivas actuales son locales; la configuración no acredita integración
  oficial. La guía anterior solo pedía reutilizar dichas primitivas.
- **Cambio mínimo/justificación:** registrar la fuente oficial obligatoria para
  futuras implementaciones y migrar los controles de la landing sin rediseño,
  conservando contratos, acciones, validación, accesibilidad y estilos actuales.
- **Archivos/contratos:** política en `AGENTS.md` y `docs/UI_GUIDELINES.md`;
  implementación prevista en `src/components/ui`, utilidades, manifiesto/lockfile
  y consumidores de la landing. Revisar consumidores compartidos antes de editar.
- **Riesgos/límites:** dependencias y contratos compartidos; no ejecutar una
  instalación que sobrescriba componentes ni alterar pantallas ajenas.
- **Autorización/coordinación:** dirección autorizada por el usuario; no acredita
  coordinación del segundo desarrollador ni aprobación global de la spec Draft.
- **Verificación prevista:** regresiones de controles y formularios, suite, lint,
  tipos, build y comparación visual desktop/móvil. Por ahora solo documentación;
  no se afirma instalación, migración o verificación funcional. Sin commit/PR.

## EXTRA-048 — Foto de candidato y logo de empresa

- **Fecha/estado:** 2026-10-22; solicitud y privacidad del candidato registradas;
  diseño técnico, coordinación, implementación y revisión pendientes.
- **Origen:** solicitud de foto de perfil y logo empresarial con Avatar oficial.
  Confirmación textual del usuario: “Si, la foto del candidato debe seguir la misma restricción que su perfil completo, visible para la Oficina de Empleo y para una empresa únicamente cuando la Oficina le derive ese candidato.”
- **Problema/evidencia:** el avatar de cuenta es un placeholder; la persistencia
  existente admite CV PDF, no imágenes. Avatar solo presenta imagen/fallback.
- **Cambio propuesto/justificación:** flujo real de carga y lectura autorizadas,
  persistencia y presentación con Avatar, sin reutilizar implícitamente el bucket
  PDF ni hacer públicas las fotos. Preservar el acceso del propio candidato.
- **Archivos/contratos:** futuras migraciones Storage/metadatos/RLS, validación,
  handlers, servicios y formularios de candidatos/empresas; derivar rutas exactas
  al aprobar el diseño. Esta entrada no modifica dichos contratos.
- **Riesgos/límites:** datos personales, acceso entre empresas, caché y revocación
  de acceso. No URLs públicas de candidatos. La privacidad confirmada no resuelve
  visibilidad del logo, límites de archivo ni reglas de reemplazo/retención.
- **Autorización/coordinación:** solicitud funcional y privacidad del candidato
  confirmadas; coordinar esquema, permisos y contratos con el otro desarrollador
  y respetar las revisiones Spec Kit antes de implementarlos.
- **Verificación prevista:** carga/persistencia, archivos inválidos, acceso propio
  y administrativo, empresa derivada/no derivada, reemplazo fallido, caché y
  revocación según contrato aprobado; pruebas, lint, tipos, build y navegador.
  Aún no implementado ni probado; sin migraciones aplicadas, commit o PR.

## EXTRA-051 — Interfaz en español en todos los roles

- **Fecha/origen/autorización:** 2026-10-22, Mateo solicita revisar toda la web
  y todos los perfiles y traducir palabras/estados del sistema al español.
  PR65 confirmado mergeado (23ba5fa), main actualizado y rama
  feat/spanish-interface-labels; anterior eliminada local/remoto. next-env.d.ts
  ajeno preservado; sin prefijo codex ni firmas/atribuciones automáticas.
- **Evidencia:** ofertas/cuentas/perfiles muestran status crudo (active, draft,
  pending_review); historiales usan replaceAll sobre códigos ingleses. Canales,
  disponibilidad, entrevistas, motivos y feedback también filtran códigos a la
  vista. Hay etiquetas parciales duplicadas y fallbacks que devuelven el código.
  Capturas locales previas muestran Choose File/No file chosen del input nativo.
  Importación muestra available/unavailable en la edición y códigos de error;
  el CSV tiene encabezados exactos de un contrato técnico que debe conservarse.
- **Origen aprobado:** accesibilidad en español de spec, FR-056, constituciónIV
  y petición expresa. No es cambio de negocio, catálogo municipal o permisos.
- **Cambio mínimo propuesto antes de implementar:** catálogos de presentación
  tipados para estados existentes, acciones/motivos y canales; reutilizarlos en
  páginas/filtros/historiales por rol y usar fallback español sin filtrar códigos
  desconocidos. Reemplazar feedback por respuesta/informe empresarial en textos,
  conservando nombres internos/RPC/IDs/values/selectores técnicos. Traducir
  códigos legados conocidos de modalidad/contrato solo en presentación. Evitar
  alterar automáticamente contenido libre escrito por personas, nombres, emails,
  archivos, datos ya guardados, URLs, identificadores o formato de CSV.
  Selector de archivos compartido con textos españoles sin depender del idioma
  del navegador; conservar input real, Field, teclado, validación y retención.
- **Archivos/contratos afectados:** domain/presentation, adaptadores de etiquetas
  existentes, páginas/componentes públicos/candidatos/empresas/admin, selección
  CV/CSV, pruebas de etiquetas/componentes/E2E, spec/plan/tasks/guía/estado.
  Sin migración, backend de negocio, schema, auth, dependencias o contratos
  persistidos nuevos. Contenido libre y contratos técnicos no se traducen.
- **Riesgos/verificación prevista:** distinguir estados de cada entidad, cubrir
  todos los valores normativos, no traducir valores enviados ni inventar estados,
  conservar privacidad de proyecciones y auditoría. RED/GREEN de etiquetas y vistas,
  escaneo de JSX/códigos visibles y pruebas por rol/historial/selectores; teclado,
  móvil/axe, tipos/lint/tooling/cobertura/build y navegador ficticio local sin reset
  ni cambios alojados. Diálogos del SO/navegador ajenos al DOM quedan fuera.
  Autoriza la petición; revisión humana/aceptación/gates históricos pendientes.
- **Detalle técnico previo al ajuste del editor:** la oferta puede contener
  códigos legados onsite/fixed_term en campos de texto libre. Mostrar su etiqueta
  española no debe reescribirlos al guardar otro campo. Usar un input visible
  etiquetado y un hidden con el valor original; solo editar explícitamente ese
  input cambia su valor enviado. Sin normalización de datos, catálogo nuevo o
  cambios de servicio. Cubrir FormData original y valores visibles en pruebas.
- **Error cliente detectado antes de corregir:** ImportUpload muestra directamente
  Error.message del navegador, por ejemplo Failed to fetch en una caída de red.
  Mantener mensajes españoles devueltos por su API protegida y mostrar un mensaje
  español genérico para excepciones de transporte/parsing, conservando archivo y
  confirmación. Regresión de fetch rechazado sin tocar el handler o sus permisos.

- **Implementación/verificación real EXTRA051:** catálogos compartidos en
  src/domain/presentation/labels.ts y adaptadores; páginas/componentes de cuentas,
  candidatos, empresas, ofertas, participaciones, derivaciones, importación y
  métricas. FileInput/CSS compartido para CV/CSV; etiquetas legadas del editor con
  FormData original preservado. Mensajes de admin-participation-action y
  referral-feedback y textos de registro traducidos, sin cambiar validaciones.
  Guía docs/product/spanish-interface.md; spec/plan/tasks y estado alineados.
  RED inicial de módulo ausente, GREEN focal49/49 y editor/inventario7/7;
  regresión de transporte1/1. Inventario AST ampliado a frases de mensajes TS/TSX.
  Resultado final: tipos/lint/build/diff-check PASS;764 pruebas/58 archivos,
  tooling57/57 y navegador18/18 sin reintentos. Navegador público/tres roles con
  locale en-US, historial/filtros, guardado/moderación/permisos, PDF/CSV retenidos,
  móvil360×800, axe y capturas ficticias revisadas. Expectativas inglesas antiguas
  corregidas y sincronización de h1 antes de axe; no se omiten pruebas/reglas.
  Supabase local conservado sin reset ni cambios alojados; sin nuevas migraciones,
  dependencias o variables. Servidor de desarrollo cerrado con autorización,
  servidores de pruebas finalizados, next-env.d.ts ajeno restaurado.
  Cobertura instrumentada limitada al módulo de entorno, no al producto entero.
  Sin suite SQL/E2E completa, NVDA, CI remoto, commit/PR o revisión humana nueva;
  aceptación municipal, OQ-001/002 y gates históricos no se declaran resueltos.

- **Integración antes de publicar:** origin/main avanzó a8c1612b (PR66).
  Colisión del ID local EXTRA042 con el registro visual ya mergeado: esta entrada
  pasa a EXTRA051, conservando su origen y evidencia; no renumera entradas ajenas.
  Resolver CV conservando returnTo de main y FileInput español. Conservar sidebar,
  portada, tipografías y reglas visuales de main. Ajustar solo tokens de FileInput
  al tema compartido, sin nueva paleta ni migración de controles oficiales.
  Leídas AGENTS/UI_GUIDELINES actualizadas y documentación/registro oficial Input
  base-nova; esa migración (EXTRA047 de main) sigue independiente y no se declara
  implementada aquí. Verificación posterior: tipos/lint/pruebas/build, navegador
  por rol y formularios, cuenta candidata con sidebar, y chequeos visuales locales.
  Next-env.d.ts permanece excluido; commit93fbca6 sin firma/atribución guardó el
  trabajo antes de integrar main. Este párrafo registra el estado previo al merge.
- **Resultado posterior a integrar PR66:** ambos conflictos resueltos sin perder
  el retorno de CV ni el diseño. Conserva la cuenta candidata con sidebar y sus
  tres secciones; el recorrido español ahora las visita también. Guía visual y
  registros de main intactos. Tipos/lint/build PASS;807 pruebas/63 archivos y
  tooling57/57 PASS. Navegador18/18 sin reintentos:17 recorridos de español,
  candidato/empresa/validación y1 filtro municipal. Los tres scripts visuales
  municipal-style-check, home-responsive-layout-check y home-keyboard-navigation-check
  PASS. Solo servicios/datos ficticios locales, sin reset o cambios alojados.
  Un intento de Vitest en sandbox falló por caché temporal ENOENT; la ejecución
  final fuera de esa restricción aprobó completa, sin cambios de código ni omisiones.
  Diff del PR contra origin/main sin errores; el merge trae un espacio final ya
  existente en la licencia Sora de main, que se conserva sin modificar la licencia.
  Creación/push del commit de integración y PR solicitados; CI y revisión pendientes.
- **Entrega:** commit93fbca6 de implementación y4b83104 de integración publicados
  sin firma ni atribución automática en feat/spanish-interface-labels. PR67 abierto
  hacia main: https://github.com/maximo-Pdev/funes-empleo/pull/67.
  Next-env.d.ts ajeno excluido. No acredita CI, revisión, merge o aceptación.

- **Corrección CI de PR67, registrada antes de implementar (2026-10-22):**
  Mateo pide corregir el check fallido. Quality39887066823: database PASS,
  application falla únicamente en intermediation.spec.ts:581,100 recorridos PASS
  y1 no ejecutado por dependencia. El helper decide todavía espera rejected/
  published/closed/cancelled; la vista correctamente muestra Rechazada. RED local
  reproduce exactamente el mismo fallo. Además queda una expectativa literal
  cancelled al final del mismo recorrido, que quedaba oculta por el primer error.
  Origen: petición de español, constituciónIV y T152/T154 de esta entrada.
  Cambio mínimo: expectativas españolas explícitas por las cuatro decisiones,
  con unión de tipos que impida claves inesperadas; mantener selectOption en
  inglés y todas las aserciones de publicación, privacidad y casos independientes.
  Archivos: tests/e2e/intermediation.spec.ts y este registro/tasks/estado/guía.
  Sin cambiar producto, backend, contratos, schema, CI o dependencias; sin saltos
  de tests ni relajación de comprobaciones. Riesgo: que un primer fallo esconda
  otro estado; verificar el recorrido entero rechazo/publicación/cierre/cancelación,
  tipos/lint/unit/tooling/build y nueva ejecución remota. No reset local ni cambios
  alojados. Autorización: solicitud expresa; CI/revisión aún no aprobadas.
- **Resultado local de la corrección:** RED confirma rejected frente a Rechazada;
  GREEN del recorrido completo1/1 sin reintentos, incluidas publicación, privacidad,
  conservación del caso al cerrar y cancelación de su caso relacionado.807 pruebas
  en63 archivos, tooling57/57, tipos/lint/build y diff-check PASS. Sin modificar
  aplicación, fixtures, configuración CI o contratos; base local conservada sin
  reset. Se publica en el mismo PR67 sin firma/atribución; next-env.d.ts ajeno
  excluido. Nueva ejecución remota y revisión humana pendientes al publicar.
- **Segundo fallo oculto de CI, antes de implementar:** Quality39889638752
  confirma101 recorridos PASS, incluido el corregido, y falla solamente SC-008A.
  demo-performance.mjs:85 aún busca Estado: published; el estado visible aprobado
  es Estado: Publicada. Ese helper no se ejecutó antes por la dependencia fallida.
  Su escenario candidato también usa fill(available) sobre el nuevo select.
  Cambiar solo texto esperado y fill por selectOption(available); agregar prueba
  de contrato del helper en tests/unit/tooling/spanish-interface.test.ts. Mantener
  barrera común, cuatro administradores,5 segundos por acción y auditorías SQL,
  sin ampliar plazos, reintentos ni suprimir comprobaciones. T156 deriva de T154.
  No ejecutar acceptance-concurrency local porque resetea la base preexistente;
  verificar RED/GREEN de contrato, tipos/lint/unit/tooling/build y CI aislada que
  realiza el reset autorizado en su runner. Sin cambios de producto o SQL.
- **Verificación local del helper:** RED1/2 y GREEN incluido en808/808 pruebas
  de63 archivos; tooling57/57, tipos/lint/build/diff-check PASS. Diff de medición
  limitado a etiqueta y selectOption; plazos, barrera, auditorías y reset frío
  conservados. No se ejecutó el reset en la base local preexistente. Se actualiza
  el mismo PR67; nueva CI aislada pendiente al publicar, sin afirmar aprobación.

## EXTRA-052 — Referencias privadas en lugar de UUID visibles

- **Fecha/origen:**2026-10-23, Mateo solicita quitar UUID de todas las páginas y
  URLs por los cuatro tipos de acceso. A04 ya aprueba slugs públicos/códigos
  aleatorios privados. PR67 mergeado8d00f95; árbol limpio y main actualizado,
  rama feat/private-record-references; anterior eliminada local/remota.
- **Evidencia:** UUID en detalle/enlaces/actores admin, ofertas/derivaciones de
  empresa, CV, import/retry, filtros de categorías/participaciones y métricas/CSV.
  Slugs públicos funcionan y permanecen. Triggers bump_version y append_only
  impiden backfill inocuo por UPDATE en tablas de negocio.
- **Propuesta previa:** private.record_references con códigos aleatorios96bits
  estables, backfill INSERT y AFTER INSERT, sin cambiar UUID/versión/historia.
  RPCs por lote e inversa con sesión viva, autorización por entidad y grants
  mínimos; no son credenciales. UI resuelve/genera referencias en fronteras sin
  alterar comandos. Conservar stub empresarial revocado, CV reautorizado y slugs;
  no codificar UUID ni usar nombres/DNI/email como localizador privado.
- **Archivos/contratos:** migración nueva, lib de referencias, páginas/actions/API/
  componentes y pruebas afectadas; spec/plan/modelo/tasks y contrato
  private-record-references.md. Recuperación aditiva; SQL antes de app.
- **Riesgos/verificación:** IDOR, revocación, versiones, colisiones, URLs antiguas,
  filtros, revalidación, duplicados, scripts quality y exportaciones. SQL positivo/
  negativo, RED/GREEN, tipos/lint/unit/tooling/build y navegador cuatro accesos.
  Sin reset de la base local o cambios alojados no solicitados. Tokens Auth y
  datos internos/contenido libre no se convierten por estética.
- **Revisión:** análisis acotado de arquitectura/constitución y autorización por
  petición expresa; no nuevas decisiones legales ni aprobación municipal.
  Investigación delegada de solo lectura según speckit-plan; implementación,
  verificación local completadas; revisión humana pendiente.
- **Resultado2026-10-23:** T157–T161 implementadas/verificadas. SQL1125/19,
  unit/componentes844/65, tooling57, tipos/lint/build/diff-check, advisor security
  warn/error sin incidencias y navegador108/108 sin reintentos/omisiones; SC-008A
  conserva cuatro actores, barrera y cinco segundos. Dos carreras SQL adicionales
  de suspensión/revocación correctas. Lectura manual de cuenta, padrón, perfil,
  actores y participaciones con códigos, sin mutaciones de negocio.
  Base desechable funes-reference-check54331/54332, fixture/hashes intactos;
  no se reseteó ni migró la habitual54321/54322 ni el alojado. Guide/contrato,
  matriz y estado sincronizados. Migración antes de app; nuevos commit/PR,
  revisión independiente y rollout alojado no realizados.

### EXTRA-052 — Precisión técnica de la prueba de colisiones

El rol postgres local no es propietario de pgcrypto: la prueba no puede sustituir
extensions.gen_random_bytes (evidencia SQL,2026-10-23). Para comprobar reintentos y
rollback sin elevar privilegios ni modificar extensiones, se encapsulan solamente
los12 bytes en private.record_reference_entropy, sin EXECUTE para clientes.
Producción sigue usando pgcrypto; la prueba sustituye esa función propia dentro
de una transacción revertida. Afecta migración, contrato y prueba025. Riesgo:
exposición accidental, verificada mediante grants y pgTAP. Detalle necesario bajo
la autorización de EXTRA-052; revisión humana pendiente.

### EXTRA-052 — Aplicación alojada autorizada, 2026-10-23

Mateo solicita «hace la migracion» después de la validación aislada. Se comprobó
mediante CLI autenticado que el proyecto vinculado es Funes-empleo
(`kyjycjojzhwggjuqjnki`), activo, y que existen pgcrypto, el guard de sesión,
can_read_cv y deny_history_change. Tabla/RPCs/triggers/revisión20261023180306
todavía ausentes. El conector MCP no tiene permisos; el CLI sí accede al proyecto.
Se aplicará únicamente el SQL completo20261023180306 mediante Management API,
sin db push/reset ni reparación del historial anterior divergente. Luego se
verificarán backfill, permisos, metadatos y advisors y se registrará únicamente
esta versión como aplicada. Se compararán huellas agregadas de negocio antes y
después, sin extraer datos personales. La publicación de app y revisión por PR
siguen fuera de esta autorización.

Resultado: SQL completo aplicado, exit0, y solo20261023180306 registrado después
de verificar.3751 referencias; cero faltantes/huérfanas, nueve triggers, RLS,
grants restringidos y guard AUTH_REQUIRED comprobados. Huellas y conteos de las
nueve tablas de origen, consentimientos y auditoría intactos. Advisor alojado:
52 WARN previos y54 posteriores, cero ERROR; los dos nuevos0029 corresponden a
los RPC SECURITY DEFINER intencionales con autorización por recurso. No se
silencian ni se declaran inexistentes; detalle y enlaces en la guía de validación.
No se hizo db push/reset ni despliegue; historial anterior y base local habitual
intactos. Se preserva next-env.d.ts regenerado por el servidor existente.

Publicación posterior autorizada por Mateo: commit a22745d sin firma/coautorías,
[PR68](https://github.com/maximo-Pdev/funes-empleo/pull/68), rama
feat/private-record-references hacia main8d00f95. Tipos/lint,844 unitarias y57
tooling repetidos PASS; diff-check y escaneo de patrones de credenciales PASS.
CI/revisión humana, merge, despliegue y recorridos alojados siguen pendientes.

## EXTRA-053 — Retirar enlace global «Ir al contenido principal»

- **Fecha/origen/autoridad:**2026-10-23, Mateo solicita expresamente eliminar el
  enlace oculto repetido, conservando la navegación existente (A16). PR68 mergeado
  confirmado86b7de8; main actualizado, rama fix/remove-skip-link; anterior
  eliminada local/remotamente. next-env.d.ts ajeno se conserva sin incluirlo.
- **Problema/evidencia:** RootLayout agrega un anchor sr-only a todas las rutas.
  setup.spec.ts y home-keyboard-navigation-check.mjs exigen ese primer foco; A16
  estaba pendiente de comprobar alternativa accesible. UI_GUIDELINES conserva
  una indicación histórica contradictoria de ocultación solo en portada.
- **Cambio propuesto antes de implementar:** quitar solamente ese anchor del
  layout compartido; conservar main#contenido, tabIndex, títulos, regiones/nav
  identificadas, foco visible y enlace Inicio de portada. Actualizar regresiones
  de ausencia del enlace, primer control real y retorno Inicio mediante teclado.
  No reemplazarlo por otro enlace oculto, componente o atajo inventado.
- **Justificación/alcance:** constituciónIV, FR-070 y SC-009 exigen operabilidad
  por teclado, no ese texto/control concreto. Se conserva navegación semántica
  por landmarks (técnica W3C ARIA11) y controles operables; Inicio de portada no se
  presenta como sustituto universal del salto para todas las rutas. No se afirma
  que Tab sin tecnología de apoyo salte automáticamente las cabeceras.
- **Archivos/contratos:** layout raíz, tests de layout/portada/setup y chequeo
  visual de teclado; A16, spec/plan/tasks, guía UI y pauta manual de validación.
  Sin contratos de negocio, backend, schema, dependencias o migraciones.
- **Riesgos/verificación prevista:** regresión del primer foco, pérdida de
  destino/landmarks, navegación Inicio y aparición accidental del enlace.
  RED/GREEN de layout, teclado escritorio/móvil y páginas públicas, axe sin
  omisiones, tipos/lint/unitarias/tooling/build. Pruebas de lectura sin reset,
  login ni cambios de negocio. Revertir el diff recupera el enlace anterior.
- **Gate acotado:** solicitud explícita y análisis de consistencia A16/FR-070/
  SC-009/constituciónIV; sin arquitectura nueva o decisión municipal inferida.
  Modelo y contratos intactos. Implementación/verificación completadas; revisión
  humana pendiente, sin aprobación municipal o aceptación NVDA inferidas.
- **Resultado:** eliminado únicamente el anchor global de src/app/layout.tsx;
  main y enlaces Inicio intactos. RED2/2 en el layout y GREEN14/14 focalizadas.
  Tipos/lint,846 pruebas/66 archivos, tooling57 y build de producción PASS;
  diff-check PASS. Seis recorridos públicos de lectura con primer foco/landmarks
  y axe sin violaciones, más seis combinaciones de Inicio por teclado a1440/390px
  (ingreso/postulante/empresa) PASS. Sin omisiones ni reintentos.
- **Entorno/límites:** Node24.22.0; compilación en copia aislada ignorada y servidor
  propio3001, con configuración pública ficticia, sin copiar .env.local. Sin
  reset/SQL/login/envíos de formularios, ni tocar servidor3000 o su .next. Advertencia
  de múltiples lockfiles propia de la copia anidada; no se cambió next.config.
  Evidencias test-results/remove-skip-* ignoradas. No se repitió la batería privada
  ni se certificó lector de pantalla/zoom real. No hay migración.
- **Publicación autorizada posteriormente:** Mateo solicita el PR; commit9a899d3
  sin firma/coautorías, rama fix/remove-skip-link, [PR69](https://github.com/maximo-Pdev/funes-empleo/pull/69)
  abierto hacia main86b7de8. next-env.d.ts ajeno permanece sin incluirse. CI,
  revisión humana, merge y despliegue pendientes; no acredita aceptación global.
- **Fuente técnica:** [W3C ARIA11](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11).

## Formato para próximas entradas

Usar un ID consecutivo `EXTRA-NNN` y registrar:

1. Fecha, responsable y estado.
2. Problema, evidencia y requisito/tarea aprobada de origen.
3. Cambio mínimo necesario y justificación.
4. Archivos y contratos afectados, riesgos y límites.
5. Autorización y coordinación, distinguiendo decisiones pendientes de aprobadas.
6. Verificación prevista y resultados reales.
7. Limitaciones, revisión y referencias de commit/PR cuando existan.

## EXTRA-049 — Integración de la rama visual con `main` (40 commits)

- **Fecha/estado:** 2026-10-22; implementado y verificado técnicamente; revisión
  del compañero y PR pendientes. Registrado al resolver el merge.
- **Origen:** pedido explícito de Maxi de poner al día el proyecto con las ramas
  del compañero antes de publicar el trabajo visual.
- **Problema/evidencia:** la rama `feature/landing-page-visuals` partía de un
  `main` anterior y sus 7 commits no tenían equivalente remoto. Al sincronizar,
  14 archivos quedaron en conflicto, incluidos `src/app/(public)/page.tsx`,
  los formularios de registro, `CandidateProfilePanel` y la portada de pruebas.
  Ambos lados habían evolucionado en paralelo: el compañero creó los componentes
  compartidos `Form`/`Field` con validación inline, retiró el autoarchivo y unificó
  la ayuda de contraseña; esta rama extrajo los cuerpos de página a
  `candidato/_components/*-content.tsx`, agregó la variante de portada y el retorno
  de CV hacia `Mi cuenta`.
- **Cambio mínimo/justificación:** conservar ambos aportes donde son compatibles y
  preferir `main` en el comportamiento funcional ya publicado. Resoluciones:
  `TextField`/`SelectField` adoptan `Field` manteniendo las clases municipales y
  los ids de descripción que `Field` ya calcula; los formularios de registro
  conservan la validación inline del compañero y la variante `homepageLayout` de
  portada; `CandidateProfilePanel` mantiene el retiro del autoarchivo y recibe
  `cvReturnTo`, que se propaga a `CvUploadForm` como campo oculto para el envío sin
  JavaScript; las ofertas enlazan por `slug`; los radios de tipo de cuenta y el
  formulario de cierre de sesión usan los componentes compartidos que exige
  `form-inventory`; los botones llevan `type="submit"` explícito.
- **Decisiones que requieren revisión:** (1) la portada de esta rama no muestra la
  vista previa de ofertas que `main` mantiene; se conserva el rediseño aprobado y
  su enlace a `#ofertas-disponibles`, por lo que el PR debe confirmarlo; (2) se
  adoptó el texto unificado «Entre 6 y 128 caracteres. No compartas tu contraseña.»
  en los registros, revirtiendo su ausencia previa; (3) el autoarchivo sigue
  retirado, sin reintroducir `archiveAction`.
- **Superficies/contratos:** los 14 archivos en conflicto, `candidate-account.tsx`,
  `home-access-panel.tsx`, `cv-upload-form.tsx`, `home.module.css`,
  `docs/UI_GUIDELINES.md` y `tests/components/home-access-panel.test.tsx`.
  Las entradas de esta rama se renumeraron a EXTRA-040..EXTRA-046 porque `main`
  ya usaba EXTRA-020..EXTRA-039; las referencias en la guía visual se actualizaron.
- **Riesgos/recuperación:** los conflictos mezclan capa visual y comportamiento; la
  recuperación es revertir el merge y volver a resolverlo con este registro. No hay
  migraciones nuevas ni cambios de variables de entorno en esta resolución.
- **Verificación:** `npm run typecheck` exit 0, `npm run lint` exit 0 (sin warnings),
  `npm run test:unit` 773 pruebas en 58 archivos PASS, `npm run test:tooling`
  57 pruebas PASS, `npm run build` exit 0. Los 602 tests previos de la rama pasaron
  a 773 por la suite del compañero. No se ejecutó E2E ni el reset de datos.
- **Entorno:** Node observado 26.7.0, distinto del 24 LTS requerido; no se modifica
  el entorno local. Revisión visual en navegador de la portada tras el cambio de
  marcado de `Field` y aprobación del PR pendientes.

## EXTRA-050 — Cierre de brechas E2E detectadas por CI en el PR #66

- **Fecha/estado:** 2026-10-22; implementado y verificado localmente; CI y revisión
  del compañero pendientes. Registrado antes de implementar los ajustes.
- **Origen:** pedido explícito de Maxi de corregir los 12 E2E rojos del PR #66 con
  la opción elegida: arreglar los 44px, agregar el acceso a la cuenta en el navbar
  municipal y actualizar los specs que codificaban la UI anterior.
- **Problema/evidencia:** el job `application` de CI (run 39863097071) dio 85 E2E
  verdes y 12 rojos. Causas: (1) tokens de control a 38px contra el mínimo de 44px
  de `login-layout` y `registration-layout`; (2) la portada ocultaba el skip link
  global con una regla propia y no ofrecía acceso a la cuenta para sesiones
  activas, lo que rompía `session-navigation` en las seis combinaciones de rol y
  entrada; (3) `accounts`, `registration-verification` y `setup` esperaban el h1
  «Un puente claro…», el h1 «Mi cuenta» y la línea «Acceso individual activo», que
  el panel con sidebar reemplazó.
- **Cambio mínimo/justificación:** subir `--form-control-height` a 44px y recuperar
  el ritmo vertical solo en las páginas de registro mediante `@media (min-width:
  1024px) and (max-height: 1000px)` sobre la clase local `registrationPage`, sin
  tocar el gap de campos documentado; eliminar la ocultación del skip link;
  incorporar `HomeAccountNav` con `aria-label="Accesos principales"` y el enlace de
  cuenta resuelto en el servidor con `getAccountAccess`, manteniendo la portada
  como componente async igual que en `main`; alinear `setup`, `accounts` y
  `registration-verification` con el rediseño aprobado.
- **Superficies/contratos:** `src/app/globals.css`, `(public)/page.tsx`,
  `(public)/home-account-nav.tsx`, `(public)/home.module.css`,
  `(auth)/_components/registration-layout.tsx` y `registration.module.css`, los tres
  E2E y los tres chequeos visuales, más los tests de componentes de portada.
- **Riesgos/recuperación:** los encabezados y textos de los E2E son contrato de la
  suite; se actualizan solo los que el rediseño reemplazó, conservando las
  aserciones de accesibilidad, simetría y ausencia de scroll. Revertir este diff
  devuelve el estado rojo de CI.
- **Verificación local:** `typecheck`, `lint` sin warnings, 773 pruebas unitarias,
  57 de tooling y build PASS. Playwright local contra producción en 127.0.0.1:3001
  (puerto 3000 ocupado por otro servidor del usuario, no se tocó):
  `setup`, `login-layout` y `registration-layout` 12/12 PASS; además
  `home-responsive-layout-check`, `municipal-style-check` y
  `home-keyboard-navigation-check` PASS.
- **Pendiente:** CI completa (incluye `accounts`, `registration-verification` y
  `session-navigation`, que requieren Supabase local y solo corren en el runner),
  revisión del compañero y merge del PR. Node local 26.7.0, distinto del 24 LTS.
