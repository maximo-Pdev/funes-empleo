# Maintenance E2E timezone repair

## Objective and authorization
Repair the common CI failure in PRs #41-44 without changing production expiration rules. The user explicitly authorized commits, merges up the existing stack and pushes, without force-push or merging to main.

## Scope and constraints
Change the maintenance E2E fixture to derive yesterday in America/Buenos_Aires. Preserve expected counters and idempotency. Add a deterministic regression for UTC midnight and the 03:00 UTC boundary. Record EXTRA-013 before implementation. No production SQL, contracts, authentication or business behavior changes; Draft specification approval is not inferred. Existing rule is recorded in T034 and state-machine contracts.

Delivery: existing PR stack, under 150 forecast authored diff lines. Single writer; delegated multi-file implementation and command verification. No local database resets or installs authorized. Docker unavailable; local Node 24.16.0/npm 11.13.0 differ from CI pins. Full isolated checks will run on GitHub after push; do not claim success before observed.

## Tasks
- [ ] T1 (pending CI): Fix fixture and deterministic regression; run applicable checks; review and commit. Implementation committed as `36fbdf8eea347b7d4fef89a6867468623b90d31e`. Route: gentle-ai-worker (multi-file trigger), gentle-ai-verify independent checks. Candidate base: 46c6c0dee33ec96a209ce06611f6ee464a9c192e. Checkoff awaits isolated CI because local lint failed and DB/E2E were unavailable.
- [x] T2 (done): Merge fix upward into #42, #43, #44 without rewriting history; push four branches and inspect new CI checks. Route: parent git state/delivery, delegated integrity verification. Commits: #41 `e2c4739`, #42 `d5183b2`, #43 `d6dfd12`, #44 `af46b2e`. Atomic push succeeded; GitHub confirms updated heads and new application/database checks running.

## Acceptance and verification
Old UTC fixture must fail a deterministic check at 01:00 UTC; BA fixture must pass at 01:00, immediately before 03:00, and at 03:00 UTC. Preserve existing maintenance/idempotency assertion. Run focused test, typecheck, lint, coverage and build where tooling permits. Database/full E2E require isolated CI because Docker is unavailable locally. Native review only with user-owned RDD on, inspect before START.

## Evidence and next step
Git fetch completed; branches initially up to date. Original runs all report 56 passed / 1 failed at intermediation.spec.ts:470, closedOpenings 0 vs 1.

T1 observed RED: 3 failed/2 passed, GREEN: 5 passed. Coverage: 383 tests passed. Independent focused regression, typecheck, build and diff check passed. Local lint failed (missing installed fast-glob; committed lockfile contains it). No dependency installation or database reset attempted. Full PostgreSQL/E2E checks pending CI. Native medium review `review-504045ac3acbc646` approved and acknowledgement burned authority; two informational follow-ups concern cwd-dependent test source path and regex non-null assertion, neither blocked approval. Production behavior unchanged.

Final stack verification: all four branches contain identical E2E/regression blobs, preserve earlier EXTRA entries, contain one EXTRA-013 heading, have no conflict markers, preserve stack ancestry and fast-forward remote updates. Two documentation merge conflicts were resolved by retaining both appended sections. Focused regression passed again; working tree was clean before publication.

Next: observe full isolated CI; T1 remains pending until gates pass. New runs: #41 37680658109, #42 37680658309, #43 37680660931, #44 37680660603 (will be superseded by this passive delivery-record commit).
