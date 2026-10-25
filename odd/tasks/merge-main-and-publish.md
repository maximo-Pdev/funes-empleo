# Publish local unified-access work and merge main

Objective: turn the 167-file working tree on `fix/landing-unified-access` into reviewable commits, merge `origin/main` (PRs #67-#72), resolve every conflict with the decisions recorded below, and open one PR.
Branch: `fix/landing-unified-access` (base `8c1612b`, 25 commits behind `origin/main` `f389885`).
Delivery: one PR; push and PR creation authorized by L3. No deploy, no merge to main.
Runner: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit`, `npm run test:e2e`.

## Specs

- S1 — Publish the local work: thematic commits over the current base, then exactly one merge of `origin/main`, then verification, then PR. No rebase. Intermediate commits are thematic slices; verification is at the branch tip.
- S2 — D1 admin chrome: keep the local `DashboardShell` refactor in `src/app/(admin)/_components/admin-shell.tsx`; main's municipal header is superseded. Parameterize the sidebar `aria-label` (today hardcoded `"Secciones de mi cuenta"` inside `DashboardShell`) so the admin panel does not reuse the candidate label, and point the affected `admin-pages.test.tsx` assertions at the new label.
- S3 — D2 redirects: accept that `src/app/(admin)/admin/candidates/assisted/[candidateId]/page.tsx` and `src/app/(company)/company/openings/[openingId]/referrals/page.tsx` stop rendering. Correct `docs/product/admin-frontend.md`, `docs/product/company-frontend.md`, `docs/UI_GUIDELINES.md` and `specs/001-municipal-employment-portal/tasks.md` to describe them as redirects. Then, as the **last commit of this PR** (L6), retire both shims: migrate the five e2e that navigate to `/company/openings/<ref>/referrals`, drop the `revalidatePath` entries, delete both route files and the `/company/openings/` query rewrite in `src/lib/records/reference-url.ts`.
- S4 — D3 types: keep a manual union of `src/lib/supabase/database.types.ts` only long enough to compile the merge, then regenerate with `npx supabase gen types typescript --local` after `npx supabase migration up`, in its own commit, and check the diff is the seven RPC (2 reference + 5 photo).
- S5 — D4 numbering: main occupies `EXTRA-050`..`EXTRA-062`; local occupies `056`..`062` for different work. Renumber the local entries to `069`..`075` consistently across `cambios-extra.md`, `specs/.../plan.md`, `specs/.../data-model.md`, `specs/.../contracts/authorization-matrix.md`, `docs/UI_GUIDELINES.md` and `docs/implementation/candidate-profile-photos.md`.
- S6 — D5 silent text loss: port main's two corrected strings into `src/features/accounts/registration-content.ts` ("recibirás por correo electrónico", "experiencia, categorías laborales y CV").
- S7 — D6 visual check: rewrite `tests/visual/home-keyboard-navigation-check.mjs` against the merged app — open `/recover`, assert zero `body > a[href="#contenido"]`, assert a single `main#contenido`, assert the first Tab lands on the header logo.
- S8 — Scope hygiene: keep `public/brand/animated-background-gradient/`, `public/brand/gradient-background-animation/` and `public/brand/pure-css-animated-gradient-background/` out of the PR; they are unreferenced leftovers of the discarded gradient. Keep `public/brand/coverflow-3d/LICENSE.txt`, referenced by `src/app/(public)/home.module.css`.
- S9 — Verification: lint, typecheck, build, unit and e2e pass at the branch tip; no real personal data, no secrets, no `.env.local`.

## Tasks

- T1 | S1, S8 | inline | done | 8 thematic commits (97e9771, 63b2ab1, a81f3a9, f7e5f92, 4c8fb76, c1a4d14, 5727fd8, a716b02); the three unreferenced brand folders stayed out.
- T2 | S1 | delegated (4 parallel writers) | done | Single merge c536134 of origin/main; 30 files, 46 hunks, zero markers.
- T3 | S2, S6, S7 | delegated + inline | done | Unions applied; DashboardShell gained navigationLabel; D5 texts ported; keyboard check rewritten against /recover. Five test corrections followed from the merged behaviour.
- T4 | S5 | inline | done differently | a65f8c0 documents the duplicated ids with a title table instead of renumbering: both id formats (EXTRA-056 and EXTRA056) are interleaved across six files, so a blind rewrite would have corrupted main's references. Full renumber remains possible as a follow-up.
- T5 | S4 | inline | blocked | Local database is behind main (missing get_record_references, resolve_record_reference, create_active_assisted_candidate and the private reference tables) and its migration history is desynced, so `supabase migration up` refuses. Needs a decision on `supabase db reset`.
- T6 | S1, S9 | inline | partial | lint, typecheck, production build and 1169 unit/component tests pass at c536134. E2E pending on the database decision.
- T7 | S3 | inline | pending | Retire the two redirect shims and migrate the five e2e; last commit before the PR.
- T8 | S1 | inline | pending | Push branch and open PR with the decisions and known limitations.

## Log

- L1 — "Consulta: cuál es el estado de la página? Todavía no está en producción no?" Verified against git, GitHub deployments and the live URLs.
- L2 — "Si, haz eso. Por otro lado, qué falta para que salga la página a producción?" Conflict cross-check delivered: 30 conflicting files, 46 hunks, 26 auto-merged overlaps, 0 untracked collisions.
- L3 — "Quiero hacer un PR y pullear main, pero antes chequea todos los conflictos que hay y decidamos que conservar."
- L4 — "explicame los cambios de cada decisión de manera sencilla" D1-D6 explained.
- L5 — "Con respecto a D2 significa que van a haber páginas ya hechas que quedarán inutilizables? Si ese es el caso entonces lo ideal sería eliminarlas y modificar las reglas del proyecto, porque sino van a quedar cosas innecesarias. Con respecto al D3 cuando correríamos "supabase gen types"? Con el resto de decisiones está todo bien. Respondeme las preguntas y después hacemos el PR"
- L6 — "Si, van como último commit en este PR" Accepting S3's shim retirement inside this PR.
- L6b — Resolutions observed at the merge commit: 46 hunks in 30 files, no markers left. Unit suite 1169/1169 in 88 files; lint, typecheck and production build pass. Two candidate-history tests fail only under full-suite load and pass alone or per directory; recorded as environmental flakiness, not logic.
- L6c — Local database check: it has the five photo RPC and candidate_photos, but not get_record_references, resolve_record_reference, create_active_assisted_candidate, nor the private reference and legacy-interest tables. Migration history holds versions without matching files and files without matching versions, so the CLI refuses to advance; the documented fallback is a local reset.
- L7 — Shim retirement (S3): deleted `src/app/(admin)/admin/candidates/assisted/[candidateId]/page.tsx` and the whole `src/app/(company)/company/` tree, dropped five revalidatePath entries and the dead `/company/openings/` rule in `reference-url.ts`, removed the three tests that asserted the redirects, and updated four documents plus T036.
- L7b — Discovered while migrating the e2e: the local branch never ran the browser suite, so four specs still visited routes it retired months ago (`/login`, `/candidato/perfil`, `/candidato/ofertas`, `/candidato/postulaciones`). They now point at `/` and the `/account?section=` views. This is the kind of breakage only the full e2e can show.
- L7c — `npm run test:e2e` refuses locally without `LOCAL_ACCEPTANCE_PROJECT_OWNED=funes-empleo`; that variable is the documented ownership confirmation for the local-only reset.
- L7d — First full e2e run: 28 passed, 2 failed, 89 did not run. Both failures were `accessibility.spec.ts` on the candidate journeys: the profile section of the account rendered no `h1` at all, because `renderCandidateAccount` skipped the heading block for `section === "perfil"`. Every other candidate section and the admin/company shells do render one. Fixed by rendering the same header for the profile section; the canvas keeps its own slot.
- L7e — Unrelated to the merge: port 3000 was held by a stale Next server started from this repo in an earlier session, so Playwright refused to start. Stopped that process (PID 25508) before the successful run.
- L7f — Second full e2e run after the h1 fix: 105 passed, 13 failed, 1 did not run. Only one was a product defect (the missing candidate h1, fixed in 9c1bae1); the other twelve were tests written against the retired login page, the previous home navbar or the retired assisted route. Fixes: wait for the hero entrance animation before axe (Playwright's toBeVisible ignores opacity), query the navbar with includeHidden because it is inert at the top of the desktop home, expect the summary alert instead of inline field errors on the unified form, clear cookies before re-login, drop the retired assisted URL in favour of the candidate detail, and scroll the activation state into view at 360x800.
- L7g — Confirmed by the accessibility run: `missingFieldMessages="summary"` suppresses the inline per-field messages on the home form, so the error lives in the `role="alert"` summary plus `aria-invalid`; the inline message only appears for a non-empty failure such as the minimum password length.
