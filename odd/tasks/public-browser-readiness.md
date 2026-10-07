# Public browser readiness — step 3

Scope: complete public six-route mobile/desktop browser verification and fix home-local keyboard/touch defects. Preserve business logic, authorization, database/schema, credentials and shared UI. No resets or form submissions. Branch: fix/public-browser-readiness (after step 1/2 commits).

- [x] Add test-first regression coverage and correct home main focus target plus header touch targets (component checks passed; actual browser verification next).
- [x] Verify real public offers list/detail, empty/invalid/not-found and keyboard behavior at 360x800 and 1366x768; capture loading where observable without changing data.
- [x] Run unit/lint/type/build/audit and focused browser checks; record final evidence and residual manual limits.

## Baseline

- Prior browser review: home/login/candidate/company render cleanly; list rendered generic error while local service was unreachable. Detail/empty could not be checked.
- Fresh sanitized in-process diagnosis: actual target is local, key present/non-placeholder, health HTTP200, published_offers RPC succeeds, Docker daemon reachable. No config/data changes or service startup performed.
- Home skip-link activation leaves activeElement BODY instead of MAIN. Header offers/login links measured 36/38px rather than recommended 44px.
- Manual NVDA/real zoom, account creation/submission, private flows and full DB reset suite are outside this task. Browser mock evidence must never be reported as live integration.

## Implementation evidence

- EXTRA-011 records local semantic landmark correction and derived coverage before implementation.
- RED observed: main tabindex missing, header nested within main, header links below intended target size (2 failures/3 passes).
- GREEN: header/main/footer siblings, main tabindex=-1, header links min-h-11; focused home/public-offers component tests13/13pass.
- Unit page tests characterize public list/detail/empty/not-found/error with mocks; not live integration evidence.
- EXTRA-012 adds display-only compatibility for observed legacy onsite/ fixed_term codes (Presencial / Plazo fijo), unknown values verbatim, strict calendar dates DD/MM/YYYY without timezone shifts; approved catalog decisions remain open.
- Display component RED4 failures/9pass then GREEN13/13; helper34/34 tests pass.
- Final independent exact-runtime gates: production build0, full unit447tests/26files0, lint/typecheck0, audit0 vulnerabilities, strengthened Chromium setup smoke1/1pass.
- Live browser matrix12/12: six public routes at360x800/1366x768, axe0/overflow0, home mainfocus thenCTA, header>=44px, inputslabelled, heroCTAabovefold.
- Actual demo service: home3featured, list10/page2ten, page999empty, detailpublicfields with Spanishlegacylabels/formatteddate/ISOtime intact; anonymousapplicationCTA sessionexpired. No data/credential changes or resets.
- Unknown/malformed detail render not-found content (HTTP200 streamed; not status404 claim). Invalid page0/abc show safe existing generic boundary, no internal details.
- Loading observed early desktop only; mobile timing not guaranteed. Auth submission/pending, real zoom, NVDA, private role/DB suites and manual T087 are not claimed.
- Evidence: ignored test-results/public-visual-review-final/report.json,12PNGs,2contact sheets; tracked accessibility/quality docs updated. No console/page errors in final valid-route browser run.
- Native review pending; no commit or push requested.
