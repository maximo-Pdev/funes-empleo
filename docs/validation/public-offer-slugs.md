# Stable public offer URLs

Status: verified locally on 2026-10-17; release reconciliation on 2026-10-18 preserves the newer account navigation from main. FR-024A / EXTRA-020 / EXTRA-021. Hosted rollout and final commit verification are recorded in the release ledger; historical local results below do not prove a newer candidate.

## Contract

- Public details use `/ofertas/title-normalized-randomsuffix`. Persist `job_openings.slug`; retain all UUID primary keys, foreign keys and application commands.
- Allocate once on first publication, after the existing workflow validates the title and required fields. Untitled drafts remain valid. Later title/status changes never regenerate or clear an assigned slug.
- Add a unique index and database protection against slug replacement. Handle random suffix collisions without unchecked concurrent allocation.
- Backfill offers that have already been published. Do not delete or reseed existing data for this change.
- Existing `published_offers(p_page integer, p_page_size integer, p_id uuid)` remains callable, with the same filters, pagination and UUID lookup. Each offer gains the public `slug` field.
- New `published_offer_by_slug(p_slug text)` returns the same JSON envelope (`total`, `page`, `pageSize`, `items`), with page 1, pageSize 1, and zero or one result. Unknown, archived, expired or otherwise unavailable offers produce no result. Apply the same company/account/publication rules as the existing public projection.
- Public list links and candidate offer-selection links use the slug. After resolution, application mutations still receive the selected offer UUID. Company/admin resource URLs are unchanged.
- Old UUID-based public detail URLs need not resolve. The user explicitly accepted this compatibility boundary. UUIDs may remain inspectable in payloads; slugging is not authorization.

## Local verification

Focused RED/GREEN and independent inspection completed. After authorized local repair, all application gates and the complete database gate pass on Node24.22.0/npm11.19.1. The user-authorized test-only correction and affected browser journeys pass; full product acceptance and hosted deployment remain separate.

Only guarded local fictitious database tests are authorized. Do not use `.env.local`, hosted credentials or ambient remote sessions to compensate for missing Docker/local infrastructure.

## Deployment and recovery

1. Deploy the forward migration `supabase/migrations/20261018000000_opening_public_slugs.sql` before application code that expects the new RPC and slug field. Applying it to a hosted project requires separate authorization.
2. Verify public list/detail and candidate selection/postulation in the target environment after deployment. Do not make private offers visible to validate slugs.
3. If application rollback is required, restore the previous application version while retaining the additive slug column and stored values. The existing UUID RPC signature remains supported. This restores old UUID URLs without deleting newly allocated slugs.
4. Do not drop the column, uniqueness/immutability guards or reset data as an automatic rollback. Any database reversal requires a reviewed forward recovery migration and preservation of allocated slugs for link continuity.

## Earlier verification attempts (superseded by continuation below)

- Parent rerun of focused tests: 75/75 passed across five files. Tooling suite: 57/57 passed. `git diff --check`: exit 0.
- Independent scratch verification: typecheck passed; webpack production build passed. Full unit run passed 526 tests in 35 files, but one suite failed loading missing `fast-glob`. Lint also failed on that missing dependency, independently reproduced in the original dependency tree; package manifests are unchanged.
- Default Turbopack build failed because its sandbox cannot resolve the external dependency junction. The webpack fallback passed, but does not establish a default-bundler pass.
- Guarded local database runner failed at Supabase status before reset because the Docker engine pipe was unavailable. Migration, pgTAP, pre-migration populated upgrade, concurrent publication and E2E execution remain unverified. A SQL-text locking assertion is not a multi-session test.
- Runtime used: Node 26.7.0 (project requires 24.21.0), npm 11.19.0 (matches). No runtime/dependency install, database reset, hosted operation, commit or deployment performed.
- Independent review reproduced no change-caused application blocker. It did not establish full database correctness. Scratch logs: `C:/Users/maxim/AppData/Local/hermes/cache/scratch/slug-verify-r9e37ozv/verification-logs/`.
- The user subsequently authorized local repair and updating Node; the evidence below supersedes these environment blockers. Hosted deployment remains unauthorized.

## Authorized continuation — current evidence

- Active runtime: official portable Node24.22.0 LTS/npm11.19.1, downloaded and checked against official SHA256. Project pins, lock metadata, .node-version, both CI npm pins and active guides agree. Global Node remains unchanged; no dependency graph changes.
- `npm ci --ignore-scripts --no-audit --no-fund` repaired stale Windows junctions from an old checkout path without installing new project dependencies or enabling unapproved install scripts.
- Independent application gates:551 unit tests/36 files,57 tooling tests, lint, typecheck and default Turbopack build all pass. Parent independently reran lint successfully. Evidence: `app-gates-20261017-214443/verified-results.json` under Hermes managed scratch.
- Database RED was a fixture timezone error, not expiry-policy behavior: UTC current_date differed from Argentina date near midnight. Corrected fixtures use the business date explicitly; a UTC-session assertion verifies closing-today visible/yesterday hidden. Targeted55/55 and full guarded913 assertions/13 files pass. Migration applied only to guarded local fictitious Supabase.
- Independent live probes passed: concurrent authenticated publication with observed advisory wait and forced collision retry (distinct slugs, correct versions/audit); full row unchanged after unauthorized mutation and slug replacement/clearing denials; populated reconstructed-predecessor upgrade preserves103 rows/non-slug fields/history, backfills101 and leaves2 unpublished drafts null. Clone removed. This is not a chronological predecessor replay.
- Full guarded E2E:58 collected,54 passed,3 failed,1 dependency-blocked,0flaky. Reset, repeated DB gate, fixture/CV verification and default production build passed. All3 failures expect HTTP404 but receive200 for not-found public routes. Company DOM snapshots show not-found UI without offer content; candidate slug handoff/application passed. Pause/resume after the first failure and downstream concurrency steps remain unexecuted.
- [Next.js documents](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) that streamed not-found UI may retain HTTP200 and includes noindex. Runtime baseline equivalence has not been proven; no slug visibility leak demonstrated. The added strict transport assertions do not establish a product requirement by themselves.
- The user authorized aligning browser assertions with not-found UI, no offer content and noindex. A test-only helper now verifies those observables at the four public-page callers. API/security transport assertions remain unchanged. No rendering or production behavior was changed to satisfy the tests.
- Final DB/E2E logs: `C:/Users/maxim/AppData/Local/hermes/cache/scratch/slug-correction-recheck/`. No commits, hosted operations or deployment.

## Final scoped browser correction

- Parent focused ESLint for the three changed test files, TypeScript check and final diff check passed.
- Grouped scoped run selected only company-offers, intermediation and acceptance-concurrency:18 executed,15 passed,3 failed. All company3/3 and acceptance-concurrency1/1 passed, covering UUID-page rejection, paused/expired unavailable UI/noindex, resume slug stability and acceptance concurrency. Three intermediation failures followed company archival/restoration that left offers3/53 in draft; no product code or required assertions were changed to compensate.
- A single pristine-fixture intermediation run then passed14/14, zero skipped/flaky/retries, exit0. Both previously unreached candidate slug handoff/application and maintenance-closed no-content/noindex assertions executed and passed. Mandatory runner phases passed:913 pgTAP assertions/13 files, fixture/CV checks, default production build and trailing SQL suspension/session-revocation races.
- Combined affected-browser evidence is company3/3, acceptance-concurrency1/1 and pristine intermediation14/14. This is not a rerun of all58 browser tests. Earlier broad application results remain551 unit tests,57 tooling tests, lint/types/default build passed.
- Grouped state interference is an existing harness limitation supported by unchanged-source isolated success; no separate runtime baseline equivalence is claimed. Future broad runs should isolate mutating fixture state. This follow-up does not redesign the fixture system.
- Final evidence: `C:/Users/maxim/AppData/Local/hermes/cache/scratch/slug-isolated-intermediation/verified-results.json`, `recheck-summary.md` and `test-e2e.log`; grouped evidence in sibling `slug-streaming-recheck/`. No commits, hosted mutations or deployment.