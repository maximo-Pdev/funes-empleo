# Stable public offer slugs — release
Objective: publish the verified implementation while retaining newer main authentication/navigation. Base: 52fcae9; integration branch: release/verified-offer-slugs.
Delivery: feature-branch-chain, database and application review slices (target <=400 authored lines each); tracker integrates only after checks. Runtime: Node24.22.0/npm11.19.1.

## Specs
- S1 User: «la url queda como título + id random generado y si se actualiza el título se mantiene el slug original para no romper los enlaces compartidos.» Persist one immutable normalized-title/random-suffix slug; retain UUID identities.
- S2 User: «Esto afecta solo a ofertas». No admin, candidate-name or company identifier redesign; preserve private routes and upstream session-aware navigation.
- S3 User: «Si, que se genere el slug cuando cuando la oferta ya tiene su título validado, que además sería cuando tiene sentido compartir o guardar un link.» Allocate once at first publication; unpublished drafts remain unassigned. Backfill previously published offers without changing other fields/history.
- S4 User: «Sigue con el ajuste de las pruebas.» Assert unavailable UI, no offer content/application link and noindex for streamed pages; retain API/security status assertions. Legacy public UUID links need not work.
- S5 User: «Si, te autorizo a reparar el entorno local y completar esas verificaciones.» and «Se puede actualizar el node que exige el proyecto? Si si, hazlo». Keep approved Node24LTS and exact current patch metadata; no new dependency graph.
- S6 User: «Bueno, ahora hazlo, quiero ver los cambios reflejados en Vercel» and «Si, autorizo». Authorized existing GitHub/Vercel/Supabase sessions: repo maximo-Pdev/funes-empleo, Vercel funes-empleo under pantherium-8487s-projects, Supabase demo kyjycjojzhwggjuqjnki; commits, push, PR, merge, migration and verification. No hosted reset or municipal production.
- S7 User: «Mateo ya borró su PR, subí el nuestro». PR54 verified CLOSED/unmerged; deploy our publication-time implementation, not the competing draft-time migration. Preserve original clean landing branch and stash d3f5be7, including unrelated visual work.

## Tasks
- T1 [S1,S3,S7] inline — in progress — database, pgTAP and contract slice; forward-only migration. Risk1-4; independent verification required; commit pending.
- T2 [S1-S5,S7] inline — in progress — public consumers, tests and runtime slice; preserve main PR51-53 changes. Risk2,3,5; commit pending.
- T3 [S1,S3,S6] inline — pending — compare hosted history, migrate exact authorized demo, read back invariants. Risk1,2,4; no reset.
- T4 [S6,S7] inline — pending — PR chain, observe CI, merge main, verify Vercel commit/alias and public behavior. Risk5; no bypass of gates.

## Log
- L1 Original publication request: «Bueno, ahora hazlo, quiero ver los cambios reflejados en Vercel». Access authorized by «Si, autorizo»; competing PR disposition: «Mateo ya borró su PR, subí el nuestro».
- L2 Prior verified local feature/runtime changes are preserved in stash d3f5be7 (base7fd41fc, untracked62eca5a). Current original branch feature/landing-page-visuals clean at52fcae9. Release worktree is separate; never pop/drop stash or overwrite original.
- L3 Selectively recovered only slugs/runtime/governance onto updated main. Kept getAccountAccess and all PR51-53 auth/session/password changes. Excluded stashed admin/home visual redesign and its account-panel-only test. Public home receives only slug link change. EXTRA020/021 avoid collisions with merged upstream EXTRA018/019.
- L4 Existing sessions verified: GitHub maximo-Pdev, Vercel pantherium-8487; approved Supabase healthy. Hosted metadata has no slug/public_slug column or slug RPC. Historical migration timestamps differ, so do not run blind db push/history repair.
- L5 Previous local checks (not a new candidate pass): unit551/tooling57/DB913, default build/lint/types and scoped browser company3/3, intermediation14/14, acceptance-concurrency1/1. New main reconciliation requires targeted checks and independent review; remote CI remains a separate delivery gate.
