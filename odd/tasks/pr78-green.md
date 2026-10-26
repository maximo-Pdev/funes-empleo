# Restore PR 78 checks
Objective: correct the reported browser failures without skipping tests or weakening business and authorization assertions.
Branch: feature/portal-polish. Delivery: single-pr (existing #78). Runner: Node 24.22.0 / npm 11.19.1, Vitest and GitHub isolated full E2E.

## Specs
S1. User request: "Falló el PR en github. Arreglalo para que salga en verde". Correct stale login destinations, ambiguous locators and removed controls while preserving all journey and permission assertions.
S2. Preserve matching pagination, global SQL-derived ordering, accessible profile popup and nomination proofs against the existing implemented table, after checking its recorded authorization.
S3. Restore required Localidad registration validation, accurate eight-field summary, invalid state, focus and correction; retain responsive and keyboard checks while excluding inaccessible library transport inputs.
S4. Publish only the correction to the existing PR and verify all checks for its exact final head. Preserve unrelated dirty work and curated local accounts; no local acceptance reset or hosted database operations.

## Tasks
- T1 | S1,S2 | delegated (parallel independent browser-test correction unit) | implemented; isolated E2E pending | `506c226`
- T2 | S3 | delegated (parallel independent locality validation unit) | implemented; focused checks pass, full recheck pending | `d8f381b`
- T3 | S4 | inline integration, delegated long verification | published correction; final checks pending | documentation receipt in this commit

## Log
L1. Original request: "Falló el PR en github. Arreglalo para que salga en verde". Attached full failure report: C:/Users/maxim/AppData/Local/hermes/attachments/pasted_content_2026-10-26_18-01-46-444_f8e51d.txt.
L2. Verified PR #78 head f73d17f71cfa57bd7f6eb7bd94ca88146d40616b; application failed (27 E2E failures), database passed. Read-only explorer mapped stale role helpers, substring labels, removed consent selector, card-to-table selectors and hidden-input locality validation gap. No current local E2E run performed.
L3. Local DB contains curated manual-test identities. Acceptance wrapper destroys them before applying test filters. Use GitHub's isolated full runner instead; preserve local DB. Existing unrelated changes: cambios-extra.md, docs/UI_GUIDELINES.md, docs/operations/manual-test-accounts.md, next-env.d.ts, src/app/layout.tsx, tests/components/setup/root-layout.test.tsx and untracked brand assets. Stage correction hunks only; never bundle these edits.
L4. Forecast approximately 250 authored changed lines; single existing PR, no new delivery slice. Parent owns Git, shared documentation and integration. Workers use disjoint surfaces and never reset DB, install, run repository-wide formatting or publish.
L5. T1: nine affected E2E files updated; 41 scenarios collected, scoped lint passed. Strict role landings and permission-denial redirects remain distinct. Matching pagination/order/CV/nomination assertions preserved. Original table authorization found at `odd/tasks/portal-polish.md` S27; reconciled spec/UI guide, no new redesign authorized.
L6. T2: required-locality regression observed RED (seven instead of eight required fields). Five new focused tests GREEN and independently reproduced in scratch; same tests against baseline produced four failures. Independent source review found no scoped blockers. Parent reran five tests successfully.
L7. Initial integration: lint, typecheck, build and 57 tooling tests passed; coverage found five failures in three files (old marker counts/locality queries plus form inventory). One correction batch puts the proxy literally inside Field and updates existing component tests to the actual combobox and eight fields. Parent recheck: 34 tests in five files passed. Full lint/types/build/coverage recheck and exact-head GitHub E2E remain pending. Local coverage uses two workers; remote uses repository default.
L8. Risk: item 3, shared LocalityCombobox consumers; independent verifier covered optional/default/controlled/unnamed variants. No Auth, permission, migration, dependency or data changes. Next generation rewrote next-env.d.ts to tracked production imports; preserve the user's prior dev-import working change after all local generation completes.
L9. Published `506c226` and `d8f381b` to existing PR #78 using the authenticated GitHub CLI session; exact remote head read back. Only correction sections of dirty shared docs were staged; favicon/layout/manual-account edits remain outside commits. Running correction count: 393 authored additions/deletions across both work units, including the recovery document; single existing PR retained. Final remote result will be recorded as a PR verification receipt to avoid repeatedly invalidating exact-head checks with documentation-only updates.
