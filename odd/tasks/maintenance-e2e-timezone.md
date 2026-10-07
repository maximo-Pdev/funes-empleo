# Maintenance E2E timezone repair

## Objective and authorization
Repair the common CI failure in PRs #41-44 without changing production expiration rules. The user explicitly authorized commits, merges up the existing stack and pushes, without force-push or merging to main.

## Scope and constraints
Change the maintenance E2E fixture to derive yesterday in America/Buenos_Aires. Preserve expected counters and idempotency. Add a deterministic regression for UTC midnight and the 03:00 UTC boundary. Record EXTRA-013 before implementation. No production SQL, contracts, authentication or business behavior changes; Draft specification approval is not inferred. Existing rule is recorded in T034 and state-machine contracts.

Delivery: existing PR stack, under 150 forecast authored diff lines. Single writer; delegated multi-file implementation and command verification. No local database resets or installs authorized. Docker unavailable; local Node 24.16.0/npm 11.13.0 differ from CI pins. Full isolated checks will run on GitHub after push; do not claim success before observed.

## Tasks
- [ ] T1 (in progress): Fix fixture and deterministic regression; run applicable checks; review and commit. Route: gentle-ai-worker (multi-file trigger), gentle-ai-verify if runtime limitations. Candidate base: 46c6c0dee33ec96a209ce06611f6ee464a9c192e.
- [ ] T2 (pending): Merge fix upward into #42, #43, #44 without rewriting history; push four branches and inspect new CI checks. Route: parent git state/delivery, delegated expensive verification if needed.

## Acceptance and verification
Old UTC fixture must fail a deterministic check at 01:00 UTC; BA fixture must pass at 01:00, immediately before 03:00, and at 03:00 UTC. Preserve existing maintenance/idempotency assertion. Run focused test, typecheck, lint, coverage and build where tooling permits. Database/full E2E require isolated CI because Docker is unavailable locally. Native review only with user-owned RDD on, inspect before START.

## Evidence and next step
Git fetch completed; all branch refs up to date, clean tree. Checked out fix/home-test-contract. Original runs all report 56 passed / 1 failed at intermediation.spec.ts:470, closedOpenings 0 vs 1. Next: bounded writer records addition and implements test-first correction.
