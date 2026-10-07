# PR42 candidate journey timeout

## Objective and authorization
Repair Quality/application on PR #42 (fix/dependency-security) after run 37680658309 failed. User requested review and repair; explicit prior commits/push authorization for this PR stack remains applicable. No force-push, main merge, production behavior or authentication changes. Update #42 only; upper PRs already passed and are outside this follow-up publication scope.

## Evidence and scope
CI reports `Test timeout of 30000ms exceeded` at candidate-self-service.spec.ts:17 called from :151 (last sign-in after profile restore). 56 other E2Es passed. Default 30-second overall budget is insufficient for the single journey (registration, mail polling, scans, uploads, applications and suspension/archive/restore). Comparable assisted journey uses 120 seconds. Set test.setTimeout(120_000) only inside this journey; keep 5-second URL expectation, zero retries and all assertions intact.

## Tasks
- [ ] T1 (in progress): Record EXTRA-014 before edit; apply scoped test timeout; verify registered timeout and local checks; native review and commit. Route: delegated worker, multi-file trigger. Base d5183b2d1ce66e9d67d290b6f187f419e850d027.
- [ ] T2 (pending): Push #42 with existing publication authorization and observe full CI; record final check status. Route: parent git delivery, delegated CI verification.

## Acceptance and checks
No meaningful local RED/GREEN E2E is available: Docker-backed Supabase absent; existing CI failure is observed RED evidence, not proof of authentication fault. Prefer registered Playwright timeout validation before/after via read-only test collection, not an added source-text test solely for timeout config. Run typecheck, lint, coverage, build and diff check with normal generated outputs authorized (.next, coverage, tsconfig.tsbuildinfo and normal ignored Playwright outputs). No installs, resets, env-file content reads, skips or retries. Next automatic env loading allowed without showing values. Full private journey and database must pass isolated CI after push before final acceptance.

## Progress
Fetched origin, clean branch fix/dependency-security d5183b2. Previous timezone fix passes in this run; #41/#43/#44 application and database success. No production defect proven. Forecast below 100 authored diff lines; delivery is existing #42.

## Next step
Delegate worker for scoped timeout repair and observed local verification.
