# Dependency security remediation

Scope: step 2; minimal stable dependency remediation, exact pins, preserve engine-strict and approved stack. Preserve all uncommitted step 1 changes; no commit/push requested. Branch: fix/dependency-security.

- [x] Record EXTRA-008 and update Next.js/eslint-config-next to 16.3.8 with verified Node 24.21.0/npm 11.19.0 temporary toolchain; refresh source-map-js to patched 1.2.2 and sharp to patched 0.35.5.
- [x] Verify fresh audit, clean dependency installation, unit tests, lint, types, production build and public browser smoke.
- [x] Record final dependency evidence and upstream-unpatched residual risk; keep approved plan/research pins consistent.
- [x] Validate and implement a scoped maintained glob replacement for the Next ESLint plugin.
- [x] Verify clean install, zero full audit and unchanged lint rule behavior; rerun quality gates.
- [x] Record mitigation, compatibility evidence and ongoing maintenance constraints.

## Referencia de entrega — 2026-10-06

Step 2 quedó en commit local `93b76fc`, creado posteriormente por el padre;
sin push ni merge. Step 1 previo: `46c6c0d`. El handoff documental continúa
sobre step 3 `5d6a51e` en `docs/status-handoff`. Los pendientes/ausencia de commits
indicados abajo describen cada ejecución histórica, no el historial actual.
Evidencia final posterior: `docs/validation/quality-gates.md`.

## Baseline

- npm audit exit 1: 8 vulnerabilities, 1 critical and 7 high.
- next 16.3.5 critical GHSA-vcvr-r3jv-pc5j: fixed by published 16.3.8.
- source-map-js <1.2.2 high GHSA-68fv-2mgg-jv7q: fixed by published 1.2.2.
- braces <=3.0.3 high GHSA-vfj7-8cjw-p6xm: registry latest 3.0.3; no patched stable release found. Propagates through micromatch/fast-glob/@next/eslint-plugin-next/eslint-config-next.
- eslint-config-next16.3.8/plugin16.3.8 retains fast-glob3.3.1; no force/downgrade/canary workaround authorized.
- Installed global Node24.16/npm11.13 differ from project pins; exact required versions are published as npm packages for a temporary toolchain, execution still to verify.
- Existing next-env.d.ts diff is generated dev-vs-build imports; preserve user work, do not stage or manually reset it.

## Verification

Installed versions verified via npm ls. Targeted installs/updates exit 0 with exact toolchain. Sharp GHSA-wq5f-xc86-pv6w was discovered during updates and fixed transitively within Next's ^0.35.4 range.

Latest audit exit 1: 5 high, 0 critical, all from the braces tooling chain. No compatible patched stable braces version published. Independent exact-runtime verification: npm ci, production build, lint and typecheck exit 0; full unit suite 378 tests/23 files passes; refreshed production public smoke 1/1 passes. Audit exit 1 remains 5 high/0 critical. npm warns unrs-resolver1.12.2 install script not covered by allowScripts; policy not bypassed. No claim of zero vulnerabilities or complete upstream remediation.

## Final mitigation (supersedes residual-audit status above)

- EXTRA-009 records rejected direct tinyglobby alias: default directory expansion was incompatible, so no false zero-audit closure.
- EXTRA-010 implements private local tools/next-eslint-glob-adapter/index.mjs using exact tinyglobby0.2.17 with expandDirectories:false, bounded globSync contract, no top-level await. Next's CJS consumer loads synchronous ESM under pinned Node24.
- Portable root file devDependency next-eslint-glob-adapter and scoped @next/eslint-plugin-next.fast-glob override reference $next-eslint-glob-adapter; no vulnerable braces/micromatch upstream fast-glob code, no disabled rules or audit suppression.
- Clean npm ci and npm ls --all exit0. Full and production audits exit0: zero vulnerabilities.
- Final independent full suite403 tests/24files (includes25compatibility tests), lint/typecheck/build exit0; refreshed Chromium public smoke1/1pass. Test strictness errors corrected with guards, not compiler suppressions.
- Global Node/npm unchanged; all checks use verified temporary node24.21/npm11.19. Historical failed experiments are retained as history only.
- Reevaluate/remove adapter when upstream safely replaces/fixes chain; maintain compatibility checks on Next updates. Human teammate review and cross-platform checks remain pending.
- Existing allowScripts warning not bypassed; external parent lockfile warning remains. No DB resets/private full E2E/manual acceptance performed. No commits or publishing requested.
