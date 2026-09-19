---

description: "Dependency-ordered tasks for the Funes Municipal Employment Portal MVP"
---

# Tasks: MVP del Portal Municipal de Empleo de Funes

**Input**: Design documents from `specs/001-municipal-employment-portal/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the specification and constitution for authentication, permissions, offer
moderation, participation transitions, referral, audit history, files, and data import. Story tests
are listed before implementation tasks and must fail for the intended reason before implementation.

**Review gate**: `checklists/mvp-readiness.md` is reviewer-owned and remains a gate. Resolve its
conflicts and gaps in the governing artifacts before implementation; `$speckit-implement` must not
mark checklist items on behalf of the reviewer.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as
an independent increment after the shared foundation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes different files and has no dependency on another
  incomplete task in the same group.
- **[Story]**: Maps the task to a user story in `spec.md`.
- Every task names its target file or directory.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the reproducible application skeleton and quality toolchain without implementing
product behavior.

- [ ] T001 Scaffold the single Next.js App Router project and planned directories in `package.json`, `package-lock.json`, `src/app/`, `src/components/`, `src/features/`, `src/domain/`, `src/lib/`, `src/validation/`, `supabase/`, and `tests/`; pin Node 24.21.0/npm 11.19.0 and every direct version enumerated in `plan.md`, and require a reviewed plan/research update before adding any unlisted direct dependency
- [ ] T002 Configure strict TypeScript, Next.js 16.3.5, React 19.3.0, Tailwind 4.3.3/PostCSS, and ESLint 10.10.0 with zero warnings in `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, and `eslint.config.mjs`
- [ ] T003 [P] Define validated, server/client-separated environment names and safe fictitious placeholders in `.env.example`, `src/lib/env/server.ts`, and `src/lib/env/client.ts`, excluding all real credentials and PII
- [ ] T004 [P] Configure Vitest 5.0.1, React Testing Library 16.3.3, jsdom, and coverage scripts in `vitest.config.ts`, `tests/setup.ts`, and `package.json`
- [ ] T005 [P] Configure Playwright 1.63.0 and `@axe-core/playwright` 4.13.0 with failure-only traces and fictitious test identities in `playwright.config.ts` and `tests/e2e/fixtures/auth.ts`
- [ ] T006 [P] Configure the local Supabase 2.117.0 project, migration/test directories, private seed convention, and ignored temporary artifacts in `supabase/config.toml`, `supabase/migrations/.gitkeep`, `supabase/tests/.gitkeep`, and `.gitignore`
- [ ] T007 Add the pull-request quality pipeline with read-only permissions and jobs for `npm ci`, typecheck, lint, Vitest, pgTAP, build, and Playwright in `.github/workflows/quality.yml`

**Checkpoint**: The empty application and every quality command are reproducible; no business flow is
implemented.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared identity, schema, authorization, audit, validation, error, and UI
foundations required by all stories.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [ ] T008 [P] Write failing pgTAP specifications for account roles/status, public/admin registration boundaries, catalog integrity, base grants, and suspended-account denial in `supabase/tests/001_foundation_rls.test.sql`
- [ ] T009 [P] Write failing unit specifications for role parsing, Spanish safe-error mapping, normalized identifiers, and centralized state/catalog values in `tests/unit/foundation/auth-and-domain.test.ts`
- [ ] T010 Create the accounts and controlled catalog migration in `supabase/migrations/202609190001_accounts_catalogs.sql` with these data-model constraints: `auth_user_id` UUID unique/non-null; role exactly `candidate|company|admin`; account status exactly `pending_verification|active|suspended|archived`; suspension reason/actor/date complete together; category `(version, code)` unique and deactivation recoverable
- [ ] T011 Create the shared business-schema migration in `supabase/migrations/202609190002_business_entities.sql` with the data-model constraints for candidate, private DNI, contacts, consent, versioned CV metadata, company, opening, category joins, participation, preinterview, referral, feedback, interview, contact, internal note, import batch, and import row; include UUID keys, UTC timestamps, `version`, archive fields, unique normalized DNI/CUIT, positive vacancies, one active CV, one active candidate/opening participation, and no destructive cascade over history
- [ ] T012 Create private authorization helpers, append-only `audit_events`, actor constraints, optimistic-version functions, minimum grants, and RLS enablement for every exposed table in `supabase/migrations/202609190003_authorization_audit.sql`; audit metadata must exclude PII, notes, credentials, tokens, and file content
- [ ] T013 Create the private `candidate-cvs` bucket and Storage policies in `supabase/migrations/202609190004_private_storage.sql`; object paths must be opaque UUIDs, MIME must be `application/pdf`, demo size must be `1..5 MiB`, and access must be limited to owner, active admin, or company with an active referral to its own opening
- [ ] T014 Generate typed database definitions and implement separate browser, cookie-bound server, and isolated secret clients in `src/lib/supabase/database.types.ts`, `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/admin.ts`, marking privileged code `server-only`
- [ ] T015 Implement session validation and role/status guards without trusting `getSession()` or editable metadata in `src/lib/auth/session.ts`, `src/lib/auth/guards.ts`, and `src/app/auth/callback/route.ts`
- [ ] T016 Implement public candidate/company role allowlisting, individual admin invitation/provisioning, suspension/reactivation, and generic recovery behavior in `src/features/accounts/service.ts` and `src/features/accounts/actions.ts`; public input must never create `admin`
- [ ] T017 Create the shared Spanish login, logout, verification-pending, recovery-request, password-update, and suspended-account pages in `src/app/(auth)/` and accessible auth forms in `src/features/accounts/components/`
- [ ] T018 [P] Implement allowlisted structured server logging, request IDs, safe Spanish error codes, and error boundaries in `src/lib/logging/logger.ts`, `src/lib/errors/codes.ts`, `src/lib/errors/public-error.ts`, `src/app/error.tsx`, and `src/app/global-error.tsx`
- [ ] T019 [P] Implement centralized Zod schemas and domain catalogs for DNI/CUIT/contact normalization, roles, states, modalities, contract types, and channels in `src/validation/common.ts`, `src/domain/catalogs/`, and `src/domain/states/`
- [ ] T020 [P] Build responsive, keyboard-accessible Spanish UI primitives and role layouts with loading, empty, error, focus, and status patterns in `src/components/ui/`, `src/components/layouts/`, and `src/app/loading.tsx`
- [ ] T021 Add exclusively fictitious local identities, companies, candidates, categories, offers, and deterministic reset helpers in `supabase/seed.sql` and `tests/fixtures/`; do not seed a “final” occupation catalog while OQ-010 remains open

**Checkpoint**: Shared schema, identity, RLS, Storage, errors, validation, fixtures, and layouts pass
foundation tests and can support each story.

---

## Phase 3: User Story 1 - Intermediación municipal de una búsqueda laboral (Priority: P1) 🎯 MVP

**Goal**: Let municipal staff moderate an offer, search/evaluate candidates, preselect, refer only
authorized profiles, receive company feedback, and confirm the final result with complete history.

**Independent Test**: With one fictitious company, one submitted offer, and several fictitious
candidates, an admin can moderate, filter, preinterview, preselect, refer, and confirm an outcome;
the company can see only referred data and every critical transition retains actor/date/state.

### Tests for User Story 1

- [ ] T022 [P] [US1] Write failing unit tests for allowed/forbidden offer and participation transitions, 30-day deadline, late-response override, and optimistic conflicts in `tests/unit/intermediation/transitions.test.ts`
- [ ] T023 [P] [US1] Write failing pgTAP tests for offer moderation, admin-only preselection/referral/final outcome, append-only history, company referral projection, and denial of DNI/address/internal notes/general-pool access in `supabase/tests/010_intermediation_rls.test.sql`
- [ ] T024 [P] [US1] Write failing component tests for moderation, candidate filtering, preinterview, referral, feedback, and safe Spanish errors in `tests/components/intermediation/admin-workflow.test.tsx`
- [ ] T025 [US1] Write the failing end-to-end municipal intermediation scenario from Quickstart scenarios 2–4 in `tests/e2e/intermediation.spec.ts`

### Implementation for User Story 1

- [ ] T026 [P] [US1] Implement centralized offer and participation transition definitions and guards in `src/domain/transitions/opening.ts` and `src/domain/transitions/participation.ts`, preserving municipal referral as the only boundary that exposes candidate data
- [ ] T027 [US1] Implement atomic SQL functions for submit/moderate/pause/close/cancel offers and for review/preinterview/preselect/refer/finalize participations in `supabase/migrations/202609190010_workflow_functions.sql`; each function must check expected version and write entity plus actor/date/previous/new state/reason in one transaction
- [ ] T028 [P] [US1] Implement admin offer-review queries/actions with separate company-visible message and internal reason in `src/features/openings/admin-service.ts`, `src/features/openings/admin-actions.ts`, and `src/validation/opening-moderation.ts`
- [ ] T029 [P] [US1] Implement paginated admin candidate search by categories, skills, availability, locality, vigency, and referral eligibility in `src/features/candidates/search-service.ts` and `src/validation/candidate-search.ts`
- [ ] T030 [P] [US1] Implement append-only preinterview, preselection, contact, training-guidance note, and internal applicant-note commands in `src/features/participations/evaluation-service.ts`, `src/features/participations/evaluation-actions.ts`, and `src/validation/evaluation.ts`
- [ ] T031 [US1] Implement the referral service and database-safe company projection in `src/features/referrals/service.ts` and `supabase/migrations/202609190011_referral_projection.sql`; expose job profile, shareable contacts, and referred CV only, and always exclude DNI, address, duplicate alerts, other participations, and internal notes/reasons
- [ ] T032 [US1] Implement authenticated CV streaming with owner/admin/referral authorization and optional non-persisted signed URL of at most 60 seconds in `src/app/api/cv/[cvId]/route.ts`
- [ ] T033 [P] [US1] Implement append-only company interview/feedback submission and admin-only final outcome confirmation in `src/features/referrals/feedback-service.ts`, `src/features/referrals/feedback-actions.ts`, and `src/validation/referral-feedback.ts`
- [ ] T034 [US1] Add the idempotent daily Supabase Cron function that closes unresolved referrals 30 days after `referred_at` as `no_company_response` with actor `system` in `supabase/migrations/202609190012_no_response_cron.sql`; permit a later admin result without removing the automatic event
- [ ] T035 [US1] Build the admin offer moderation, candidate search, participation timeline, preinterview, preselection, referral, and outcome pages in `src/app/(admin)/admin/openings/`, `src/app/(admin)/admin/candidates/`, and `src/app/(admin)/admin/participations/`
- [ ] T036 [P] [US1] Build the company read-only referred-candidate projection, interview, and feedback UI in `src/app/(company)/company/openings/[openingId]/referrals/` and `src/features/referrals/components/`
- [ ] T037 [US1] Integrate audit timelines, stale-version conflict recovery, loading/empty/error states, and cache invalidation across the US1 pages in `src/features/participations/components/` and `src/features/openings/components/`

**Checkpoint**: US1 is independently demonstrable with admin/company fixtures and proves that no
candidate data crosses to a company without an explicit municipal referral.

---

## Phase 4: User Story 2 - Autogestión del candidato (Priority: P1)

**Goal**: Let a candidate register, complete and maintain a multi-category profile and protected CV,
accept/withdraw consent, apply to multiple published offers, withdraw, and see only receipt/final
result.

**Independent Test**: A fictitious candidate verifies access, activates a valid profile, applies to
two offers, withdraws one participation, changes availability, and cannot see internal stages or
notes.

### Tests for User Story 2

- [ ] T038 [P] [US2] Write failing unit/component tests for candidate registration, activation prerequisites, six-month freshness, consent versioning, CV rejection/replacement, multi-category profile, and application withdrawal in `tests/components/candidate/candidate-flow.test.tsx`
- [ ] T039 [P] [US2] Write failing pgTAP tests proving a candidate can access only their profile/private data/contacts/consents/CV and the limited status projection of their participations in `supabase/tests/020_candidate_rls.test.sql`
- [ ] T040 [US2] Write the failing end-to-end candidate scenario from Quickstart scenario 1, including two independent applications and hidden internal stages, in `tests/e2e/candidate-self-service.spec.ts`

### Implementation for User Story 2

- [ ] T041 [US2] Implement candidate signup and verified-email bootstrap with name, normalized DNI, email contact, duplicate blocking, and `draft` profile in `src/features/candidates/registration-service.ts`, `src/features/candidates/registration-actions.ts`, and `src/validation/candidate-registration.ts`
- [ ] T042 [P] [US2] Implement own-profile/contact/category/availability update queries and actions in `src/features/candidates/profile-service.ts`, `src/features/candidates/profile-actions.ts`, and `src/validation/candidate-profile.ts`
- [ ] T043 [P] [US2] Implement append-only policy-version/hash consent acceptance and withdrawal plus activation eligibility in `src/features/candidates/consent-service.ts`, `src/features/candidates/consent-actions.ts`, and `src/validation/consent.ts`; use no real municipal text until the approved version is supplied
- [ ] T044 [US2] Implement candidate/admin PDF upload and replacement in `src/app/api/candidate/cv/route.ts` and `src/lib/files/pdf-validation.ts`; validate extension, declared MIME, `%PDF-` signature, readable structure, and `1..5 MiB`, and never replace the valid CV on rejection
- [ ] T045 [P] [US2] Implement public published-offer listing/detail queries with pagination and no private fields in `src/features/openings/public-service.ts` and `src/app/(public)/ofertas/`
- [ ] T046 [US2] Implement self-application and withdrawal commands with one active participation per candidate/opening and independent history in `src/features/participations/candidate-service.ts`, `src/features/participations/candidate-actions.ts`, and `src/validation/application.ts`
- [ ] T047 [P] [US2] Build candidate registration, profile, categories, consent, availability, and CV panels with Spanish labels and accessible validation in `src/app/(auth)/registro/candidato/` and `src/app/(candidate)/candidato/perfil/`
- [ ] T048 [P] [US2] Build published-offer application controls and the candidate participation view that maps every non-final internal state to `received` and reveals only the final outcome in `src/app/(candidate)/candidato/ofertas/` and `src/app/(candidate)/candidato/postulaciones/`
- [ ] T049 [US2] Add the idempotent six-month freshness function that marks overdue profiles `needs_update` without deletion in `supabase/migrations/202609190020_candidate_freshness.sql`
- [ ] T050 [US2] Integrate candidate loading/empty/error/focus states, masked private data, conflict recovery, and cache invalidation in `src/features/candidates/components/` and `src/features/participations/components/candidate-status.tsx`

**Checkpoint**: US2 works with public offers and candidate-owned data, independently of company
self-service screens.

---

## Phase 5: User Story 3 - Gestión de empresa y ofertas (Priority: P1)

**Goal**: Let a company register and maintain its profile, create/edit/submit offers, respond to
correction requests, and view only its moderation state and municipally referred candidates.

**Independent Test**: A fictitious company completes its profile, submits a complete draft, corrects
and resubmits it, and sees only its own opening and referrals without being able to publish or set a
final outcome.

### Tests for User Story 3

- [ ] T051 [P] [US3] Write failing component tests for required company fields, draft completeness, optional salary/benefits, submission/resubmission, moderation visibility, and suspension messages in `tests/components/company/company-flow.test.tsx`
- [ ] T052 [P] [US3] Write failing pgTAP tests for company ownership, offer draft/update/submit permissions, denial of publish/moderate/final-outcome operations, and isolation from other companies in `supabase/tests/030_company_rls.test.sql`
- [ ] T053 [US3] Write the failing end-to-end company scenario from Quickstart scenario 2 plus referral isolation in `tests/e2e/company-offers.spec.ts`

### Implementation for User Story 3

- [ ] T054 [US3] Implement company signup/profile create/update with required name, unique normalized CUIT, responsible person, at least one contact, activity, and locality, explicitly without documents or a verified-company state, in `src/features/companies/service.ts`, `src/features/companies/actions.ts`, and `src/validation/company.ts`
- [ ] T055 [US3] Implement offer draft create/update validation for required title, tasks, one or more categories, positive vacancies, location, modality, schedule, contract type, requirements, and future closing date, with optional salary/benefits, in `src/features/openings/company-service.ts`, `src/features/openings/company-actions.ts`, and `src/validation/opening.ts`
- [ ] T056 [US3] Implement submit/resubmit commands that only allow `draft|changes_requested -> pending_review` and never direct publication in `src/features/openings/company-actions.ts`
- [ ] T057 [P] [US3] Build company registration/profile pages and accessible status/errors in `src/app/(auth)/registro/empresa/` and `src/app/(company)/empresa/perfil/`
- [ ] T058 [P] [US3] Build company offer list, draft editor, submission, correction, and moderation-history pages in `src/app/(company)/empresa/ofertas/` and `src/features/openings/components/company/`
- [ ] T059 [US3] Build the company dashboard projection that contains only its profile, its offers, visible moderation messages, and its referrals in `src/app/(company)/empresa/page.tsx`
- [ ] T060 [US3] Implement admin company/offer suspension and reactivation with mandatory reason, preserved history, and no automatic reactivation of related records in `src/features/companies/admin-actions.ts` and `src/app/(admin)/admin/empresas/`

**Checkpoint**: US3 completes the company-side lifecycle while municipal publication/referral/final
outcome authority remains intact.

---

## Phase 6: User Story 4 - Atención presencial asistida (Priority: P2)

**Goal**: Let an admin create and maintain an assisted candidate, continue internal service without a
CV, block external referral until a valid PDF exists, and link a later personal account without
duplicating history.

**Independent Test**: An admin creates a fictitious assisted profile after duplicate screening,
updates it without a CV, fails safely to refer it, adds a valid CV, refers it, and later links a
verified account while preserving the same profile/history.

### Tests for User Story 4

- [ ] T061 [P] [US4] Write failing unit/component tests for assisted-profile prerequisites, admin attribution, DNI/email potential matches, no-CV referral block, free-text training note, and claim conflicts in `tests/components/admin/assisted-candidate.test.tsx`
- [ ] T062 [P] [US4] Write failing pgTAP tests for admin-only assisted maintenance, duplicate non-overwrite, active-but-not-referral-eligible profiles, and history-preserving account linkage in `supabase/tests/040_assisted_candidate.test.sql`
- [ ] T063 [US4] Write the failing end-to-end assisted-service scenario from Quickstart scenario 5 in `tests/e2e/assisted-candidate.spec.ts`

### Implementation for User Story 4

- [ ] T064 [US4] Implement potential-duplicate search and an explicit admin resolution service that never silently merges or overwrites DNI/email matches in `src/features/candidates/duplicate-service.ts`, `src/features/candidates/duplicate-actions.ts`, and `src/validation/duplicate-resolution.ts`
- [ ] T065 [US4] Implement assisted create/update commands with `origin=assisted`, nullable `account_id`, mandatory responsible admin, at least one contact, and action history in `src/features/candidates/assisted-service.ts` and `src/features/candidates/assisted-actions.ts`
- [ ] T066 [P] [US4] Build the admin assisted-profile wizard, duplicate review, consent/contact/category/availability/CV maintenance, and internal `training_guidance` note UI in `src/app/(admin)/admin/candidates/assisted/` and `src/features/candidates/components/assisted/`
- [ ] T067 [US4] Enforce referral eligibility so an assisted profile may remain active for internal evaluation without a CV but cannot be referred until a valid PDF exists in `src/features/referrals/service.ts` and `src/domain/permissions/referral.ts`
- [ ] T068 [US4] Implement the approved-identity account-claim transaction that preserves `candidate_profile.id`, relations, and audit history and rejects account/DNI/email conflicts in `supabase/migrations/202609190040_claim_assisted_profile.sql` and `src/features/candidates/claim-actions.ts`

**Checkpoint**: US4 proves the in-person path has the same privacy, duplicate, and audit safeguards as
self-service without requiring public credentials at creation.

---

## Phase 7: User Story 5 - Importación controlada del padrón existente (Priority: P2)

**Goal**: Let an admin preview, validate, resolve, and atomically confirm candidate imports from the
approved historical CSV mapping without hidden partial writes.

**Independent Test**: With a fictitious CSV based on the approved mapping, the preview identifies
every invalid/unmapped/duplicate row without business writes; a valid batch imports completely and a
forced row failure rolls back the entire batch.

**Blocking dependency**: T069 must be approved before T070–T078. No task may infer historical
columns or use a real workbook.

### Tests for User Story 5

- [ ] T069 [US5] Obtain the anonymized workbook structure and approved written mapping from the Employment Office, record exact headers/transformations/category mappings and approval evidence in `docs/import/candidate-import-v1.md`, and keep US5 blocked if either input is missing
- [ ] T070 [P] [US5] Write failing parser tests for the approved mapping plus UTF-8/BOM, exact/duplicate/unknown headers, inconsistent columns, empty file, `5 MiB`, `10,000 rows`, `64 KiB` record, invalid fields, intra-file duplicates, and unmapped/deactivated categories in `tests/unit/imports/csv-parser.test.ts`
- [ ] T071 [P] [US5] Write failing pgTAP tests for admin-only staging, hash/mapping/version preconditions, double confirmation, duplicate resolution, complete rollback, and sanitized audit summary in `supabase/tests/050_import_atomicity.test.sql`
- [ ] T072 [US5] Write the failing end-to-end import scenario from Quickstart scenario 6 with only fictitious rows in `tests/e2e/candidate-import.spec.ts`

### Implementation for User Story 5

- [ ] T073 [US5] Finalize the placeholder import-batch/import-row schema against the approved mapping without storing the raw file indefinitely in `supabase/migrations/202609190050_import_schema.sql`; statuses must be exactly `uploaded|preview_ready|blocked|confirming|completed|failed|archived` and row statuses must cover valid, warning, invalid, potential duplicate, unmapped category, and imported
- [ ] T074 [US5] Implement strict, non-casting, streaming CSV parsing and row normalization for the approved contract in `src/features/imports/parser.ts`, `src/features/imports/mapping.ts`, and `src/validation/candidate-import.ts`
- [ ] T075 [US5] Implement admin-only preview with zero business writes, masked sensitive values, row/error codes, counts, impact summary, and temporary-file cleanup in `src/features/imports/preview-service.ts` and `src/app/api/admin/imports/preview/route.ts`
- [ ] T076 [P] [US5] Build the accessible preview and explicit duplicate/category resolution UI with confirmation disabled while blockers remain in `src/app/(admin)/admin/imports/new/` and `src/features/imports/components/`
- [ ] T077 [US5] Implement the all-or-nothing confirmation function that revalidates batch ID/hash/mapping/version and writes profiles, contacts, categories, observations, and audit in one transaction in `supabase/migrations/202609190051_confirm_import.sql`
- [ ] T078 [US5] Implement the confirmation handler and batch-history/result pages with safe retry/conflict messages in `src/app/api/admin/imports/[batchId]/confirm/route.ts` and `src/app/(admin)/admin/imports/`

**Checkpoint**: US5 is complete only with approved anonymized mapping evidence and passing rollback,
duplicate, authorization, and privacy tests.

---

## Phase 8: User Story 6 - Seguimiento operativo y métricas básicas (Priority: P3)

**Goal**: Let admins reconstruct contact history, consult basic period/category metrics, and export a
generic authorized CSV without public access or spreadsheet-formula injection.

**Independent Test**: With known fictitious fixtures across periods/categories, an admin sees the
expected counts and timeline and downloads a filtered CSV within the acceptance interaction target;
anonymous/company requests are denied and dangerous cell prefixes are neutralized.

### Tests for User Story 6

- [ ] T079 [P] [US6] Write failing SQL/unit tests for metric definitions, period/category filters, active-candidate semantics, time-to-fill when computable, and contact ordering in `supabase/tests/060_metrics.test.sql` and `tests/unit/metrics/metrics.test.ts`
- [ ] T080 [US6] Write the failing end-to-end dashboard/export scenario from Quickstart scenario 7, including unauthenticated/company denial and formula-prefixed fixtures, in `tests/e2e/admin-metrics.spec.ts`

### Implementation for User Story 6

- [ ] T081 [US6] Implement protected invoker-safe metric functions/views for candidates, companies, offers by state, applications, preinterviews, referrals, hires, non-selections, withdrawals, no-response, category trends, and time-to-fill in `supabase/migrations/202609190060_metrics.sql`
- [ ] T082 [P] [US6] Implement period/category filter validation and admin metrics queries without public cache leakage in `src/features/metrics/service.ts` and `src/validation/metrics.ts`
- [ ] T083 [P] [US6] Implement the chronological admin contact/follow-up timeline with phone, email, WhatsApp, and in-person channels and no direct messaging integration in `src/features/participations/contact-service.ts` and `src/features/participations/components/contact-timeline.tsx`
- [ ] T084 [US6] Build the accessible admin metrics dashboard with definitions, empty/loading/error states, filters, and comprehensible trends in `src/app/(admin)/admin/metrics/page.tsx` and `src/features/metrics/components/`
- [ ] T085 [US6] Implement streaming generic CSV export with the same authorized filters and neutralization of cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return in `src/features/metrics/csv-export.ts` and `src/app/api/admin/exports/operations.csv/route.ts`
- [ ] T086 [P] [US6] Implement optional staff-only message templates/safe links without sending integrations in `src/features/participations/message-templates.ts` and `src/features/participations/components/contact-tools.tsx`

**Checkpoint**: US6 supplies only internal metrics and generic CSV; official report formats remain
outside scope until OQ-005 is resolved.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Prove the whole MVP meets privacy, accessibility, recovery, performance, documentation,
and delivery gates without expanding scope.

- [ ] T087 [P] Add axe-assisted and keyboard/focus/zoom regression coverage for representative public, candidate, company, admin, and assisted flows in `tests/e2e/accessibility.spec.ts`
- [ ] T088 [P] Add cross-role negative authorization coverage for every protected page/action/handler, suspended accounts, stale sessions, and non-disclosing `NOT_FOUND` behavior in `tests/e2e/authorization-boundaries.spec.ts`
- [ ] T089 Add pagination/query-index validation and acceptance measurements for candidate search, metrics, import preview, and export using agreed fictitious datasets in `tests/performance/acceptance.test.ts` and `docs/validation/performance.md`
- [ ] T090 [P] Document local/preview/demo environment separation, admin provisioning, email limitations, migrations, forward recovery, Cron risk/fallback, and variables in `README.md`, `.env.example`, and `docs/operations/demo-runbook.md`
- [ ] T091 [P] Record every unresolved stakeholder gate—retention, reports, production operation, catalog, CV approval, CSV mapping, consent text, admin identities, SMTP, and municipal visual/accessibility requirements—without treating safe defaults as approval in `docs/validation/release-gates.md`
- [ ] T092 Execute every scenario in `specs/001-municipal-employment-portal/quickstart.md` with fictitious data and record results/limitations in `docs/validation/quickstart-results.md`
- [ ] T093 Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:db`, `npm run build`, and `npm run test:e2e`, then record exact commands and outcomes in `docs/validation/quality-gates.md`
- [ ] T094 Review tracked files, fixtures, logs, traces, screenshots, dependencies, migrations, RLS, and `.env.example` for secrets/real PII/unapproved scope, and document the second developer’s PR findings in `docs/validation/final-review.md`

**Checkpoint**: All applicable automated and manual gates pass, unresolved external decisions remain
explicit, and the implementation is ready for analysis/review rather than automatic merge.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: no dependencies.
- **Phase 2 — Foundational**: depends on Phase 1 and blocks every story.
- **Phase 3 — US1**: depends only on Phase 2; it is the first demonstrable municipal-intermediation
  increment and the suggested technical MVP.
- **Phase 4 — US2**: depends on Phase 2; may run beside US1 after shared schema/RLS are stable.
- **Phase 5 — US3**: depends on Phase 2; may run beside US1/US2 after shared schema/RLS are stable.
- **Phase 6 — US4**: depends on Phase 2 and reuses candidate/CV/consent services completed in US2;
  schedule after US2 in a two-person team to avoid overlapping files.
- **Phase 7 — US5**: depends on Phase 2 and the external T069 mapping gate; it does not depend on UI
  completion in other stories.
- **Phase 8 — US6**: depends on Phase 2 and meaningful fixture/activity data; schedule after US1–US3
  for realistic acceptance counts.
- **Phase 9 — Polish**: depends on every story included in the release.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 (municipal intermediation) -> US6 (meaningful operational metrics)
                    -> US2 (candidate self-service) -> US4 (assisted service and claim)
                    -> US3 (company self-service)  --┘
                    -> US5 (CSV import), gated independently by approved mapping T069
```

US1, US2, and US3 can begin in parallel after Foundation if developers own disjoint files. US4 has a
deliberate service dependency on US2; US6 needs representative activity from the transactional
stories; US5 is externally gated.

### Within Each User Story

1. Write the listed tests and observe the intended failures.
2. Complete schema/functions before services that consume them.
3. Complete domain/services before actions, handlers, and pages.
4. Integrate loading, empty, error, authorization, and audit behavior.
5. Pass the independent test before starting a later priority in the same workstream.

### Parallel Opportunities

- T003–T006 can run in parallel after T001/T002 boundaries are agreed.
- T008/T009 and T018–T020 touch independent foundation files.
- US1 test tasks T022–T024 can run in parallel; services T028–T030 and UI T035/T036 can be divided
  after their SQL dependencies are ready.
- US2 test tasks T038/T039 and services T042/T043/T045 can run in parallel.
- US3 tests T051/T052 and UI T057/T058 can run in parallel around the shared company service.
- US4 tests T061/T062 and UI T066 can run in parallel after service contracts are fixed.
- US5 tests T070/T071 and later parser/UI T074/T076 can run in parallel only after T069.
- US6 T079 and T082/T083 can run in parallel before dashboard integration.
- Cross-cutting T087/T088/T090/T091 touch independent paths.

---

## Parallel Examples

### User Story 1

```text
T022: tests/unit/intermediation/transitions.test.ts
T023: supabase/tests/010_intermediation_rls.test.sql
T024: tests/components/intermediation/admin-workflow.test.tsx
```

### User Story 2

```text
T038: tests/components/candidate/candidate-flow.test.tsx
T039: supabase/tests/020_candidate_rls.test.sql
T042: src/features/candidates/profile-service.ts
T043: src/features/candidates/consent-service.ts
```

### User Story 3

```text
T051: tests/components/company/company-flow.test.tsx
T052: supabase/tests/030_company_rls.test.sql
T057: src/app/(auth)/registro/empresa/
T058: src/app/(company)/empresa/ofertas/
```

### User Story 4

```text
T061: tests/components/admin/assisted-candidate.test.tsx
T062: supabase/tests/040_assisted_candidate.test.sql
T066: src/app/(admin)/admin/candidates/assisted/
```

### User Story 5

```text
After T069 only:
T070: tests/unit/imports/csv-parser.test.ts
T071: supabase/tests/050_import_atomicity.test.sql
T074: src/features/imports/parser.ts
T076: src/app/(admin)/admin/imports/new/
```

### User Story 6

```text
T079: supabase/tests/060_metrics.test.sql and tests/unit/metrics/metrics.test.ts
T082: src/features/metrics/service.ts
T083: src/features/participations/contact-service.ts
```

---

## Implementation Strategy

### MVP First — User Story 1

1. Complete Setup and Foundation.
2. Complete US1 using fictitious admin/company/candidate fixtures.
3. Stop and validate the independent intermediation flow and all privacy boundaries.
4. Use this as a technical MVP demonstration; it is not the complete approved product scope.

### Incremental Delivery

1. Add US2 and US3 to replace fixtures with candidate/company self-service.
2. Add US4 for inclusive in-person service after candidate services stabilize.
3. Add US5 only after its external mapping gate.
4. Add US6 after transactional data exists.
5. Complete cross-cutting gates, then run `$speckit-analyze` before implementation approval/merge.

### Two-Developer Strategy

1. One developer owns each shared schema, auth, contract, or state file at a time.
2. After Foundation, split only disjoint story paths; do not concurrently edit the same migration or
   shared service.
3. Review every logical group through a focused PR; approval is not a merge.

## Notes

- `[P]` means different files and no dependency on an incomplete task in the same group.
- Story labels provide requirement traceability; Setup, Foundation, and Polish intentionally have no
  story label.
- Tests listed before implementation must fail for the intended missing behavior, not because the
  harness is broken.
- Use only fictitious or properly anonymized data and never place secrets or real CVs in Git, logs,
  traces, screenshots, prompts, or fixtures.
- Do not resolve open municipal/legal questions through code. Stop the affected task at its stated
  gate and update the governing artifact after the authorized decision.
- Commit after each task or coherent group and preserve second-developer review.
