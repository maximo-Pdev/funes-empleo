# Controles de calidad — fase 9

## Fuente vigente — 2026-10-06

Último árbol fuente verificado localmente: `5d6a51e` (step 3), no el commit futuro
de `docs/status-handoff`. Las secciones step 3 abajo registran 447 pruebas/26 archivos,
lint/typecheck/build, audit 0, Chromium focalizado 1/1 y browser público de seis
rutas/dos tamaños (12 vistas, axe 0/overflow 0). Ver también [accesibilidad](accessibility.md).
Steps 1–3 son locales sin push/merge; snapshot local main/origin `523ee4a` incluye
PR #33–39 según comprobación previa del padre, sin consulta remota nueva.
Este paso documental no vuelve a verificar aplicación, DB ni suite privada;
NVDA, zoom real, formularios Auth enviados y aceptación humana siguen pendientes.

## Entrega histórica del 2026-09-29

Fecha: 2026-09-29. Rama `codex/temp-mvp-completion`, base `481b9f0` (PR #32
integrada). Evidencia local del árbol histórico de esa entrega, no del handoff actual. CI del commit `2974958` aprobado:
[Actions 36596663506](https://github.com/maximo-Pdev/funes-empleo/actions/runs/36596663506),
jobs application/database correctos. La revisión independiente sigue pendiente;
los controles de demo se distinguen de la aceptación municipal.

Entorno: Windows, Node `24.21.0`, npm `11.19.0`, Next `16.3.5`, Supabase CLI
`2.117.0`, Docker Desktop y Chromium de Playwright `1.63.0`. Solo fixture ficticio
`funes-demo-v1`: 500 candidatos, 50 empresas, 100 ofertas, 1.000 participaciones,
500 PDF. SHA-256 seed:
`ae11e0374459bd64f5f6a7803223d3f74a56fc80966c066be69e13a47eadb7d7`.

## Ejecuciones finales históricas (anteriores al parche step 2)

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

T095 registra gates ejecutados, no certifica cobertura exhaustiva. Siete casos técnicos
alojados medidos dentro de sus límites y con integridad posterior; ver performance.md.
No hay aceptación humana. T087/T089/T092 requieren esa evidencia.
T088/T094 añaden HTTP real y concurrencia SQL; T093 añade 310 comprobaciones de clases
de auditoría/rollback. T096 necesita revisión del segundo desarrollador.
Los dos intentos previos de E2E detectaron supuestos incorrectos del test NOT_FOUND:
status 404 fijo y un selector ambiguo de robots en streaming. Corregidos, prueba
focalizada y serie completa pasan. No se omitió la prueba para obtener verde.
Los checks de requisitos permanecen intactos: no equivalen a tareas implementadas.

Seguimiento 2026-09-29: `npm run lint` PASS y
`npm run test:unit -- tests/performance/acceptance.test.ts` PASS (5 pruebas existentes)
para el harness/manifiesto ampliados; `node --check tests/quality/demo-performance.mjs`
PASS. No se suman esas cinco a las 376 originales. No cambió código de aplicación,
dependencias ni migraciones productivas en este seguimiento. Los checks del commit
posterior se registran por su SHA; el PASS de `2974958` no se atribuye automáticamente
a otra revisión.

## Step 3 — verificación pública final, 2026-10-06

Rama `fix/public-browser-readiness`; EXTRA-011/012. Evidencia final aportada por
el padre y verificador independiente (fase 1), documentada **sin repetir gates**.
Node **24.21.0** y npm **11.19.0** exactos. No se suministraron invocaciones
completas de esos gates: se identifican los resultados, sin reconstruir comandos.
Las secciones anteriores y de step 2 conservan su carácter histórico.

| Gate informado | Resultado observado final |
| --- | --- |
| Build de producción | Exit 0 |
| Suite unitarias/componentes | Exit 0; 447 pruebas en 26 archivos |
| Lint | Exit 0 |
| Typecheck | Exit 0 |
| Audit | Exit 0; 0 vulnerabilidades |
| Smoke setup Chromium reforzado | PASS 1/1 |

Las 34 pruebas del helper de fechas/presentación y 13 de componentes públicos
con mocks están incluidas en la evidencia de pruebas, no son resultados live ni
se suman nuevamente al total. RED/GREEN anteriores permanecen en EXTRA-011/012.

### Browser live y estados observados

- Seis rutas públicas × dos viewports (360×800 y 1366×768), 12 capturas finales
  y contact sheets en `test-results/public-visual-review-final/` (ignorado),
  recibo `report.json`: axe 0, overflow horizontal 0, idioma/H1/labels correctos.
- Inicio: salto enfoca main y siguiente Tab alcanza CTA candidato; header ≥44px,
  hero sobre el pliegue. Inicio con 3 destacadas, listado con 10, página 2 con 10,
  página 999 vacía. Detalle live muestra Presencial/Plazo fijo/31/12/2026 y
  mantiene fecha ISO legible por máquina. CTA anónimo lleva a sesión vencida.
- IDs malformado/desconocido: not-found español, HTTP 200 observado en streaming;
  no se exige ni se afirma 404. `page=0`/`page=abc`: boundary genérico español
  con reintento y sin filtración, no mensaje de validación específico.
- Loading visto en desktop a DOMContentLoaded (44 ms), no timing mobile ni
  cobertura universal de estados. Formularios Auth no enviados: pending sin probar.
- Diagnóstico sanitizado del entorno configurado: destino Supabase local,
  health HTTP 200 y RPC `published_offers` funcional. La indisponibilidad previa
  es histórica, de causa no confirmada; no se atribuye una reparación de config
  o datos ni se hizo reset DB.

Alcance: evidencia pública y gates del árbol actual, no aceptación humana ni
municipal. Revisión nativa/humana, T087 (NVDA, zoom real y matriz manual por rol),
DB/pgTAP y suite E2E privada completa actuales pendientes. Los 855 pgTAP/57 E2E
históricos no se transfieren a este árbol. Sin source edits en esta finalización,
commit, push ni cierre de tareas manuales. Detalle en `accessibility.md`.

## Step 2 — evidencia de dependencias, 2026-10-06

Rama `fix/dependency-security`; `EXTRA-008`. Esta primera verificación corresponde
al parche previo al adaptador y es histórica. La verificación independiente final
actual se registra bajo «verificación independiente final de la mitigación EXTRA-010»
más abajo; esta finalización documental no vuelve a ejecutar comandos.
Los PASS de fase 9 anteriores son históricos y **no** verifican este árbol ni los
cambios home preexistentes. Los gates actuales verifican el árbol con esos cambios,
no prueban por sí solos la corrección aislada del parche ni aceptación manual.
No se declara revisión del compañero, commit ni merge.

### Verificación independiente histórica — posterior a EXTRA-008, previa a EXTRA-010

Resultados observados comunicados por el verificador independiente, con Node
**24.21.0** y npm **11.19.0** exactos. El resumen aportado identifica los gates y
sus resultados, pero no sus invocaciones completas; no se reconstruyen comandos
exactos a partir del prefijo usado durante la implementación.

| Gate informado | Resultado observado |
| --- | --- |
| Runtime | Node 24.21.0 / npm 11.19.0 exactos confirmados |
| `npm ci` | Exit 0; instalación limpia desde lockfile |
| Build de producción | Exit 0 |
| Smoke público | PASS, 1/1; exit 0 |
| Unitarias/componentes | PASS, 378 pruebas en 23 archivos; exit 0 |
| Lint | Exit 0 |
| Typecheck | Exit 0 |
| Audit | Exit 1; **5 altas, 0 críticas**: braces, micromatch, fast-glob, @next/eslint-plugin-next y eslint-config-next |

Los gates funcionales pasan, pero audit sigue fallando: no se afirma audit cero
ni remediación completa. `npm ci` advirtió que el script de instalación de
`unrs-resolver@1.12.2` no figura en allowScripts. La política permanece intacta;
los gates aprobados no constituyen validación independiente de ese postinstall.

Aceptación manual, comprobaciones DB/pgTAP y E2E privados completos del árbol
parcheado siguen pendientes. Los 855 pgTAP y 57 E2E de fase 9 son evidencia
histórica, no resultados nuevos del parche; el smoke público 1/1 no los sustituye.

### Evidencia de implementación — instalación dirigida e intermedia

Runtime temporal reproducible (cache bajo `node_modules/`, ignorada):

```text
npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version"
```

Exit 0, salida `v24.21.0` y `11.19.0`. No se asumió el PATH global; npm de
bootstrap emitió aviso de actualización desde 11.13.0, pero el npm temporal
comprobado dentro del comando fue 11.19.0. Para reutilizar en el verificador,
conservar el prefijo completo y sustituir el contenido de `--call` por su comando.
No cambiar `.npmrc`, engines, packageManager ni aprobar scripts para eludir errores.

| Comando exacto | Resultado observado |
| --- | --- |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm install next@16.3.8 --save-exact"` | Exit 0; runtime exacto comprobado; 3 paquetes cambiados; audit de instalación: 7 altas |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm install eslint-config-next@16.3.8 --save-dev --save-exact"` | Exit 0; runtime exacto comprobado; 2 paquetes cambiados; audit de instalación: 7 altas |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm update source-map-js"` | Exit 0; runtime exacto comprobado; 1 paquete cambiado; audit de instalación: 6 altas |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm audit"` | Exit 1; 6 vulnerabilidades altas, 0 críticas; no significa audit aprobado |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ls next eslint-config-next @next/eslint-plugin-next source-map-js braces micromatch fast-glob sharp"` | Exit 0; Next/config/plugin 16.3.8, source-map-js 1.2.2 deduplicado, braces 3.0.3, micromatch 4.0.8, fast-glob 3.3.1, sharp 0.35.4 |

Base aportada por step 2: 8 vulnerabilidades (1 crítica, 7 altas). No se repitió
ese audit antes de instalar y no se lo presenta como ejecución nueva. El audit
posterior ya no enumera GHSA-vcvr-r3jv-pc5j de Next ni GHSA-68fv-2mgg-jv7q de
source-map-js; npm ls confirma sus versiones objetivo.

### Continuación autorizada — reparación transitiva de sharp

Los comandos anteriores son evidencia intermedia, anterior a esta reparación.
`npm view` confirma el rango opcional `^0.35.4` de Next 16.3.8 y sharp 0.35.5
publicado con engines Node >=20.9.0; admite Node 24.21.0 y publica el binario
win32-x64 0.35.5. No se añadió dependencia directa ni override.

| Comando exacto | Resultado observado |
| --- | --- |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm view next@16.3.8 optionalDependencies.sharp && npm view sharp@0.35.5 version engines os cpu dependencies optionalDependencies --json"` | Exit 0; v24.21.0 / 11.19.0; rango ^0.35.4; sharp 0.35.5, Node >=20.9.0, binarios 0.35.5/libvips 1.3.4 |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm update sharp"` | Exit 0; v24.21.0 / 11.19.0 comprobados; 2 paquetes instalados cambiados; 479 auditados; 5 altas |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm audit"` | Exit 1; audit final: 5 altas, 0 críticas; solo braces y cuatro dependientes ESLint; sharp ya no figura |
| `npm exec --cache ./node_modules/.cache/step2-toolchain --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ls next eslint-config-next @next/eslint-plugin-next source-map-js braces micromatch fast-glob sharp"` | Exit 0; Next/config/plugin 16.3.8, source-map-js 1.2.2, sharp 0.35.5; braces 3.0.3/micromatch 4.0.8/fast-glob 3.3.1 sin cambios |

Durante esta continuación de implementación no se ejecutaron tests ni build;
la verificación independiente posterior figura en la sección actual anterior.
Se conserva el aviso allowScripts de unrs-resolver 1.12.2 sin aprobar scripts ni
alterar engines.

### Riesgo residual histórico de EXTRA-008, previo a la mitigación EXTRA-010

- `braces@3.0.3`: GHSA-vfj7-8cjw-p6xm, stack-exhaustion DoS. La base informa
  latest 3.0.3 sin parche estable; permanece en
  `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
  Audit contabiliza cinco paquetes altos en esa cadena y sugiere force con
  downgrade mayor a eslint-config-next 14.2.35. No se aplicó esa solución ni
  canary, vendoring, legacy-peer-deps o upgrades amplios.
- `sharp@0.35.5`, dependencia opcional de Next: reparada en la continuación
  autorizada; GHSA-wq5f-xc86-pv6w / CVE-2026-96889 ya no figura en audit.
  El audit sigue fallando por la cadena braces: no se afirma audit aprobado.
- Las instalaciones dirigidas y el `npm ci` independiente advierten un script
  de instalación de `unrs-resolver@1.12.2` no cubierto por allowScripts. No se
  aprobó ni se debilitó la política. Los gates funcionales posteriores pasan,
  pero el postinstall no fue validado independientemente.

El diff de dependencias contiene únicamente los pins Next/config, los paquetes
Next asociados (env/plugin/SWC), source-map-js y sharp/binarios/libvips;
engines y el resto de pins
permanecen sin cambio. `.npmrc`, `next-env.d.ts`, home/tests/accessibility y los
ODD docs no se editaron en este trabajo. TDD no aplica a un cambio de lockfile
sin comportamiento propio ni runner determinista de advisory; se usa evidencia
real de instalación/audit/árbol en vez de inventar RED/GREEN de producto.

## Step 2 — verificación independiente final de la mitigación EXTRA-010

Resultados finales aportados por el verificador independiente, con Node **24.21.0**
y npm **11.19.0** exactos. Esta finalización documental no repite gates. El resumen
no suministra las invocaciones completas; se registran los gates informados sin
inventar prefijos ni comandos exactos. La instalación limpia previa exit 0 corresponde
al mismo package.json/package-lock.json; no se afirma una nueva ejecución de ci.

| Gate informado | Resultado observado final |
| --- | --- |
| Runtime | Node 24.21.0 / npm 11.19.0 exactos |
| `npm ci` previo | Exit 0, mismo package.json/lockfile |
| `npm ls --all` | Exit 0, árbol válido |
| Audit completo | Exit 0, 0 vulnerabilidades |
| Audit de producción | Exit 0, 0 vulnerabilidades |
| Suite completa unitarias/componentes | Exit 0, 403 pruebas en 24 archivos; incluye las 25 de compatibilidad |
| Lint | Exit 0, sin warnings |
| Typecheck | Exit 0 |
| Build de producción | Exit 0 |
| Smoke público Chromium | PASS 1/1, exit 0 |

Los errores intermedios de typecheck afectaban guards exclusivamente de prueba;
ya fueron corregidos y el PASS final los supersede. No se cambió ninguna regla,
exclusión o supresión para obtener verde. El árbol verificado incluye trabajo home
preexistente; los resultados no certifican la corrección aislada de cada cambio.

La mitigación elimina realmente la cadena vulnerable del consumidor del plugin:
adaptador privado ESM síncrono, tinyglobby exacto 0.2.17, expandDirectories false,
devDependency raíz file y override anidado con referencia $next-eslint-glob-adapter.
No es el alias incompatible rechazado en EXTRA-009 ni un bypass de audit. Sus
resultados y los intentos fallidos anteriores se conservan como evidencia histórica;
las notas de gates pendientes de esas etapas no representan el estado actual.

Avisos/límites: se observó un lockfile externo del directorio padre ignorado, sin
modificarlo; el aviso previo unrs-resolver 1.12.2 postinstall sin allowScripts sigue
sin cambios. Política intacta, sin aprobación de scripts ni validación independiente
de ese postinstall. No hubo actualización global de runtime. Audit cero describe
esta ejecución, no seguridad futura: reevaluar API/defaults/require(ESM) en cada
actualización y retirar adaptador/override cuando upstream repare la cadena.

Validación manual, DB/pgTAP, E2E privados completos, otras plataformas y revisión
del compañero siguen pendientes. Smoke público 1/1 no sustituye esos controles;
855 pgTAP y 57 E2E históricos no se atribuyen a este árbol. No se declara aceptación
municipal, revisión humana completada, commit, push ni merge.

## Step 2 — ensayo glob rechazado, EXTRA-009 (2026-10-06)

Esta continuación sí agregó pruebas deterministas antes de instalar. Se inspeccionó
el plugin real: único consumidor de fast-glob `get-root-dirs`, que llama
`globSync(pattern.replace(/\\\\/g, '/'), { onlyDirectories: true })`. La regla real
`no-html-link-for-pages` usa esas raíces para buscar pages/src/pages y app/src/app.
Tinyglobby 0.2.17 publica CommonJS globSync, pero activa expandDirectories por defecto.
Solo se ensayó `overrides.@next/eslint-plugin-next.fast-glob = npm:tinyglobby@0.2.17`.
No se cambió configuración ESLint, reglas, engines, política de scripts ni código
runtime. Todo el trabajo previo de home y dependencias se preservó.

| Comando exacto | Resultado observado en orden de ejecución |
| --- | --- |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/unit/tooling/next-eslint-glob.test.ts"` | RED antes de instalar: exit 1; 1/22 falla por identidad fast-glob != tinyglobby; 21 PASS (10 raíces, 10 casos regla real, default/archivo/ausente) |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm install"` | Ensayo: exit 0; v24.21.0/11.19.0; 3 agregados/16 retirados, audit de instalación 0 |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/unit/tooling/next-eslint-glob.test.ts"` | Ensayo: exit 1; 10/22 fallan por raíces adicionales, 12 PASS. No GREEN de mitigación |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm audit"` | Ensayo: exit 0; 0 vulnerabilidades, no acredita compatibilidad |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ls next eslint-config-next @next/eslint-plugin-next fast-glob tinyglobby micromatch braces"` | Ensayo: exit 0; Next/config/plugin 16.3.8; plugin resuelve fast-glob@npm:tinyglobby@0.2.17; micromatch/braces ausentes |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm install"` | Tras retirar override: exit 0; runtime exacto; up to date, alias persistía en lockfile y audit seguía 0. No se consideró recuperación válida |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm install"` | Tras retirar únicamente las tres entradas nuevas del ensayo en lockfile: exit 0; runtime exacto; 16 agregados/3 retirados; audit de instalación 5 altas |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/unit/tooling/next-eslint-glob.test.ts"` | Recuperación: exit 0; 23/23 PASS. Prueba de identidad ahora exige original restaurado y agrega rechazo explícito del candidato; no prueba eliminación de vulnerabilidades |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm audit"` | Final tras recuperación: exit 1; 5 altas/0 críticas, cadena braces/micromatch/fast-glob/plugin/config |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ls next eslint-config-next @next/eslint-plugin-next fast-glob tinyglobby micromatch braces"` | Final: exit 0; Next/config/plugin 16.3.8; fast-glob 3.3.1 → micromatch 4.0.8 → braces 3.0.3; tinyglobby 0.2.17 sigue solo en consumidores preexistentes |

Equivalencia comparada por conjuntos de paths absolutos normalizados, sin depender
de orden ni barras finales. Se comprobaron literal relativo, barra final, glob,
brace, absoluto literal/glob/brace, separadores Windows relativos/absolutos y array
con entrada no string ignorada. Cada forma ejecutó ESLint con el plugin real:
`<a href='/about'>` produce exactamente un error; externo y Next Link no producen
errores. Los 10 fallos de raíces del ensayo agregaban pages/src/src/nested, incluso
para literal; las pruebas no se debilitaron para aceptar esa expansión.

Decisión: retirar el reemplazo incompatible. La prueba final conserva contrato
original y rechazo reproducible con fixtures ficticios en temporales (sin borrar
archivos ni leer variables/secretos). No se añade dependencia directa de tinyglobby:
ya está instalada por tooling existente. Hay que reevaluar su API/defaults y estas
pruebas en cada actualización antes de cualquier propuesta futura.

El diff final de lockfile respecto de HEAD contiene solo los parches preexistentes
Next/config/env/SWC, source-map-js y sharp/binarios/libvips; no hay entradas alias
ni override retenido. Las tres instalaciones advirtieron unrs-resolver 1.12.2
postinstall no cubierto por allowScripts; política intacta. Gates completos,
instalación limpia posterior, aceptación manual y revisión del compañero pendientes.
La mitigación no está completada: audit cero fue solo del ensayo rechazado, no del
árbol final de EXTRA-009. No se ejecutó build, reset DB, suites amplias, commit ni push aquí.

## Step 2 — intento inicial detenido, EXTRA-010 (2026-10-06; histórico)

El estado roto descrito aquí fue recibido y reparado en la continuación siguiente;
no representa el árbol final. Se conserva la evidencia del fallo inicial.

Continuación autorizada: adaptador local privado `next-eslint-glob-adapter` con
pin tinyglobby 0.2.17, sole API CommonJS globSync y expandDirectories false.
Inspección confirma consumidor real get-root-dirs y regla no-html-link-for-pages.
Se conservan los diez casos de raíces y los diez de la regla real de EXTRA-009;
identidad ahora exige adaptador privado/API/pin exacto. EXTRA-010 registrado antes
 de implementación. Todo el trabajo previo ajeno se preserva.

| Comando exacto | Resultado observado en orden |
| --- | --- |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/unit/tooling/next-eslint-glob.test.ts"` | RED exit 1: 1/23 falla identidad fast-glob != next-eslint-glob-adapter; 22 PASS |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm install"` | Exit 0; v24.21.0/npm 11.19.0; 1 agregado/16 retirados; audit de instalación 0. Aviso unrs-resolver postinstall sin allowScripts; política intacta |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/unit/tooling/next-eslint-glob.test.ts"` | GREEN intentado, **exit 1**: suite no carga, Cannot find module 'fast-glob'; 0 tests ejecutados |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ls next eslint-config-next @next/eslint-plugin-next fast-glob tinyglobby micromatch braces"` | Exit 1 ELSPROBLEMS; Next/config/plugin 16.3.8; fast-glob inválido, tinyglobby 0.2.17 en consumidores previos |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm audit"` | Exit 0, 0 vulnerabilidades; **no acredita árbol usable ni mitigación verificada** |

El lockfile resuelve el enlace fast-glob a
`node_modules/@next/eslint-plugin-next/tools/next-eslint-glob-adapter`, relativo
al plugin, no a `tools/next-eslint-glob-adapter` de la raíz. Por ello el override
local exacto no es utilizable con esta instalación npm. Se aplica la instrucción
de detener, sin hack manual de node_modules ni estrategias alternativas.
Se entrega el candidato y el lockfile fallido como evidencia al padre; **el árbol
actual no puede cargar el plugin ESLint**. No hubo GREEN ni triangulación del
adaptador, incluida su normalización de raíces, aunque esos casos estén escritos.
Instalación limpia, build, suites completas, browser y revisión quedan pendientes
 del desbloqueo y verificación por el padre. No se ejecutó DB reset/commit/push.
La evidencia anterior no verifica este árbol nuevo.

## Step 2 — resolución local portable, EXTRA-010 (2026-10-06; anterior a ESM)

Continuación autorizada, en `fix/dependency-security`, conservando cambios previos.
El spec `file:../../../tools/next-eslint-glob-adapter` inicialmente retuvo el enlace
fallido anterior. Se retiraron solo sus dos entradas de package-lock y npm regeneró
un enlace root `node_modules/fast-glob → tools/next-eslint-glob-adapter`, incluyendo
la declaración tinyglobby 0.2.17. ci y 25 pruebas pasaron, pero npm ls --all lo marcó
inválido (exit 1). **Candidato rechazado**: tests verdes no sustituyen árbol válido.

Solución final: devDependency raíz `next-eslint-glob-adapter` con
`file:tools/next-eslint-glob-adapter`, override anidado solo bajo el plugin
`fast-glob: $next-eslint-glob-adapter`. npm referencia el spec directo y administra
ambos enlaces al paquete local. Tinyglobby exacto se instala como dependencia del
adaptador mediante el lockfile raíz; no hay lockfile independiente ni instalación
en tools. No publicación, rutas absolutas versionadas, scripts extra, bypass de
política ni edición manual de node_modules. El código existente del adaptador se
preserva: CommonJS globSync, expandDirectories false y fail-closed.

| Comando exacto | Resultado observado de esta continuación |
| --- | --- |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm config get cache"` | Exit 0; cache predeterminada npm-cache fuera de node_modules, en AppData/Local |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/unit/tooling/next-eslint-glob.test.ts"` | RED recibido: exit 1, suite no carga por fast-glob ausente, 0 tests; no fallo de comportamiento ejecutado |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm install"` | Tres ejecuciones exit 0, todas v24.21.0/11.19.0: spec relativo conserva enlace fallido; tras regenerar dos entradas crea enlace root; referencia raíz final agrega 1 paquete. Todas audit de instalación 0 |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ci"` | Ensayo relativo exit 0, 463 paquetes; solución final exit 0, 464 paquetes, 466 auditados. Toolchain/cache sobreviven ci porque están fuera de node_modules |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ls --all"` | Ensayo relativo exit 1 ELSPROBLEMS fast-glob inválido; solución final exit 0, ambos enlaces al adaptador y tinyglobby 0.2.17, sin inválidos. Ausentes opcionales/otras plataformas no son fallos |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/unit/tooling/next-eslint-glob.test.ts"` | Ensayo relativo 25/25 PASS; solución final con aserciones raíz/ref ampliadas 25/25 PASS, exit 0 |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm audit"` | Solución final exit 0, found 0 vulnerabilities |
| `git diff --check` | Exit 0; sin errores de espacios. Aviso LF/CRLF en home.test.tsx preexistente y no editado aquí |

Las 25 pruebas verifican identidad privada y API, resolución de tinyglobby desde
el adaptador, enlaces/spec raíz portables, diez variantes de raíces, defaults/
archivos/ausentes, raíz filesystem literal y rechazo de patrones/opciones no
admitidos (incluida clave Symbol). Diez casos usan el plugin ESLint real para
rechazar enlace interno y aceptar externo/Next Link. No se cambian reglas para
obtener GREEN. No se afirma compatibilidad general fast-glob ni otra plataforma.

Avisos: ESLint 9.39.5 no mantenido; unrs-resolver 1.12.2 postinstall sin allowScripts.
Política intacta, sin aprobar scripts. Audit cero es resultado actual, no garantía
futura; reevaluar API/defaults en cada actualización y retirar al repararse upstream.
**Gates completos del árbol final pendientes**: lint, tipos, suite completa, build,
browser/DB/pgTAP y revisión humana. Los PASS históricos no se atribuyen a esta
mitigación. No hubo commit/push ni reset DB.

## Step 2 — conversión ESM síncrona, EXTRA-010 (2026-10-06; anterior a verificación final)

El padre informó tres errores @typescript-eslint/no-require-imports en index.cjs
y renombró únicamente ese artefacto propio a index.mjs antes de esta ejecución.
El RED observado aquí es distinto: main aún apuntaba a index.cjs ausente y por
ello lint y la suite no cargaron. No se presenta el informe de los tres errores
como una ejecución propia. La conversión usa imports ESM y exportación nombrada
globSync, sin default export ni top-level await, conservando toda la lógica.
main/exports apuntan a index.mjs; ./package.json se expone para verificar identidad.
Node 24.21.0 carga ese ESM síncronamente desde require() del plugin CommonJS de
Next. No se modifica ESLint, no se excluye el adaptador ni se suprime ninguna regla.

| Comando exacto | Resultado observado en orden |
| --- | --- |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm run lint"` | RED exit 2; v24.21.0/11.19.0; Cannot find module fast-glob/index.cjs por main obsoleto tras rename |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/unit/tooling/next-eslint-glob.test.ts"` | RED exit 1, 0 tests: mismo main obsoleto. Después de implementar: GREEN exit 0, 25/25; repetición tras ci exit 0, 25/25 |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "node --version && npm --version && npm install"` | Exit 0; v24.21.0/11.19.0; up to date, 466 auditados, cero vulnerabilidades |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ci"` | Exit 0; 464 paquetes instalados, 466 auditados, cero vulnerabilidades |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run lint"` | GREEN exit 0; eslint . --max-warnings=0, sin errores ni warnings |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm audit"` | Exit 0, found 0 vulnerabilities |
| `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm ls --all"` | Exit 0; ambos enlaces tools válidos y tinyglobby 0.2.17; opcionales de otras plataformas ausentes no son fallos |

Las 25 pruebas se preservan, ampliando identidad/main/exports y ruta index.mjs.
Comprueban namespace con solo globSync, carga síncrona real, fail-closed, diez
variantes de raíces y diez casos con la regla real no-html-link-for-pages
(enlace interno rechazado, externo y Next Link aceptados). La instalación limpia
no exigió modificar package.json ni package-lock raíz. Avisos de instalación:
ESLint 9.39.5 no mantenido y unrs-resolver 1.12.2 postinstall sin allowScripts;
política intacta, sin aprobar scripts ni bypass.

**Gates restantes pendientes**: tipos, suite completa, producción build,
browser/DB/pgTAP, otras plataformas y revisión humana. No se ejecutaron ni se
atribuyen PASS históricos a este modo ESM. Sin cambios de aplicación/DB, resets,
commit/push, publicación ni instalación global; trabajo ajeno preservado.
