# Arreglar 25 fallos e2e pre-existentes (registro en Home + badges de estado)

Objetivo: dejar `test:e2e` verde sobre `feature/status-badges` para poder mergear a `main` sin romper su CI. Los 25 fallos son pre-existentes (confirmado: idénticos antes y después del merge de `origin/main`).
Rama: `feature/status-badges`. Estrategia: `single-pr` (un solo PR de bugfix). Runner: `npm run test:unit` + `LOCAL_ACCEPTANCE_PROJECT_OWNED=funes-empleo npm run test:e2e`.

## Specs

- **S1 — Botón de submit del registro.** El submit del registro en Home usa el label específico por rol («Crear cuenta candidata» / «Crear cuenta de empresa»), no el genérico «Registrarse» (que colisiona con el tab «Registrarse» de «Opciones de acceso» y es ambiguo). Los 8 timeouts de specs que esperan esos labels desaparecen.
- **S2 — Radios de 44px.** Los radios nativos de «Tipo de cuenta» son la excepción al gate de 44px: el touch target vive en el contenedor `Field`, el input radio nativo mide ~18px. El spec `registration-layout` excluye `input[type=radio]` de la medición de altura mínima, igual que login-layout si corresponde.
- **S3 — Errores de campo faltante en Home.** El registro en Home usa `missingFieldMessages="summary"`: un submit vacío muestra el resumen «Revisá los x campos indicados» y no 5 `[data-field-error]` inline. `form-validation.spec.ts:16` se actualiza a ese contrato (resumen + errores de formato de campos no vacíos), sin debilitar la validación.
- **S4 — Heading del registro.** El registro en Home ya no tiene un `heading` «Registro de empresas»; `company-offers.spec.ts:41` usa el marcador real del formulario de empresa en Home (sin reintroducir un heading obsoleto).
- **S5 — Badges de estado.** Los specs que aún esperan el texto viejo de estado («Estado: Activo», «Cuenta: Activa», un solo «Listo para confirmar», «Estado:») se actualizan al marcado de `Badge` (span con dot aria-hidden + label), scoping con `within(...)` cuando el mismo estado aparece en varias superficies. No se debilitan aserciones: se apunta al estado real visible.
- **S6 — status/atributo en candidate-self-service y setup.** Los specs que esperan `role="status"` o un atributo específico se alinean al contrato real de la página en Home, sin eliminar cobertura.

## Tasks

| ID | Specs | Ruta | Estado |
|---|---|---|---|
| T1 | S1 | inline — quitar `submitLabel="Registrarse"` en `home-access-panel.tsx` (dejar defaults) | completado |
| T2 | S2 S3 S4 | inline — actualizar `registration-layout`, `form-validation`, `company-offers` (registro) | completado |
| T3 | S5 S6 | inline — actualizar `intermediation`, `company-offer-management`, `company-offers`, `candidate-import`, `assisted-candidate`, `candidate-self-service`, `setup` (badges/status) | completado |
| T4 | todas | inline — verificación `test:unit` + `test:e2e` completo verde | completado — unit 1247/1247; e2e 124 passed, único fallo heredado `SC-008A` (reset frío de concurrency, reproduce en main) |

## Log

- **L1 (pedido, verbatim):** «Arreglar los 25 fallos e2e ahora (registro + badges), después mergear a main verde, y recién arrancar el listado nuevo».
- **L2 (evidencia):** 25 fallos idénticos en pre-merge (`3b866e4`) y post-merge (`18d8755`); el merge no introduce ni arregla ninguno.
- **L3 (SC-008A heredado):** `acceptance-concurrency.spec.ts` SC-008A falla en su preparación (reset frío local, status 1) solo dentro de la suite completa; el reset frío aislado termina EXIT=0. Documentado en `funes-empleo-workflow` como fallo heredado que reproduce en `main`, no relacionado con este fix.
