# Home test contract

Scope: restore home component coverage after async public offer integration and correct home-local accessibility defects required for the public smoke. Preserve shared styles, business logic and all accessibility assertions. Necessary browser installation authorized; dependency changes only if evidence requires them.

- [x] Observe current home test failure and update async component tests with a mocked public offers boundary, covering ready, empty and unavailable states.
- [x] Update public browser smoke heading assertion without weakening language, keyboard or axe checks.
- [x] Run focused and full unit tests, lint and typecheck.
- [x] Install matching Playwright Chromium binaries with explicit user authorization.
- [x] Correct home-local contrast and heading hierarchy defects.
- [x] Obtain passing public smoke and rerun unit suite, lint, typecheck and build.

Branch histórica: fix/home-test-contract.

## Referencia de entrega — 2026-10-06

Step 1 quedó en commit local `46c6c0d`, creado posteriormente por el padre.
Sin push ni merge; continuación en `docs/status-handoff` desde step 3 `5d6a51e`.
La evidencia siguiente pertenece al step 1, no al árbol final; ver
`docs/validation/quality-gates.md` para resultados posteriores.

## Evidence

- RED: original focused suite exits 1 at the server-only import guard.
- GREEN: focused suite passes 3/3 tests; full unit suite passes 378/378 tests in 23 files.
- Lint and typecheck exit 0.
- Initial browser attempt was blocked by the missing executable. After explicit user authorization, `npx playwright install chromium` exited 0.
- Browser command `npx playwright test tests/e2e/setup.spec.ts --project=chromium --no-deps` now executes and exits 1: 1 test failed on axe color-contrast (including 4.19:1 and 4.33:1 versus the required 4.5:1) and heading-order violations. The preceding heading, language and skip-link assertions passed. No checks were weakened and no database resets performed.
- Screenshot, trace and error context retained in ignored `test-results/playwright/setup-base-pública-en-espa-e5e9f-eras-automáticas-detectadas-chromium/`.
- Home-local source correction: intermediary heading is h2; stat labels use text-primary-700 and process eyebrow text-primary-600. No shared tokens/components or business logic changed.
- Heading regression test RED observed (1 failed/2 passed); GREEN 3/3 after source edits.
- Final production build exit 0; refreshed production smoke PASS 1/1, no axe violations; full suite 378/378 in 23 files, lint/typecheck exit 0. No tracked generated file changes.
- Accessibility evidence updated in docs/validation/accessibility.md. This does not close manual T087, NVDA or zoom acceptance.
- No new npm dependencies required. Este worker no realizó commit/push;
  el commit posterior del padre está identificado arriba. Push no realizado.
