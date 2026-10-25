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

- T1 | S1, S8 | inline | pending | Thematic commits: docs track, ui foundation, home, auth, candidate/photos, workspace chrome, tests, docs.
- T2 | S1 | inline | pending | Single merge of `origin/main`.
- T3 | S2, S6, S7 | inline | pending | Resolve the 46 hunks per the decided unions; D1 label, D5 strings, D6 rewrite.
- T4 | S5 | inline | pending | Renumber local EXTRA ids to 069-075.
- T5 | S4 | inline | pending | `supabase migration up` + regenerate types in its own commit.
- T6 | S1, S9 | inline | pending | lint, typecheck, build, unit, e2e.
- T7 | S3 | inline | pending | Retire the two redirect shims and migrate the five e2e (last commit).
- T8 | S1 | inline | pending | Push branch and open PR with the decisions and known limitations.

## Log

- L1 — "Consulta: cuál es el estado de la página? Todavía no está en producción no?" Verified against git, GitHub deployments and the live URLs.
- L2 — "Si, haz eso. Por otro lado, qué falta para que salga la página a producción?" Conflict cross-check delivered: 30 conflicting files, 46 hunks, 26 auto-merged overlaps, 0 untracked collisions.
- L3 — "Quiero hacer un PR y pullear main, pero antes chequea todos los conflictos que hay y decidamos que conservar."
- L4 — "explicame los cambios de cada decisión de manera sencilla" D1-D6 explained.
- L5 — "Con respecto a D2 significa que van a haber páginas ya hechas que quedarán inutilizables? Si ese es el caso entonces lo ideal sería eliminarlas y modificar las reglas del proyecto, porque sino van a quedar cosas innecesarias. Con respecto al D3 cuando correríamos "supabase gen types"? Con el resto de decisiones está todo bien. Respondeme las preguntas y después hacemos el PR"
- L6 — "Si, van como último commit en este PR" Accepting S3's shim retirement inside this PR.
