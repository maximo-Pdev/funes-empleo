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

- [X] T001 Scaffold the single Next.js App Router project and planned directories in `package.json`, `package-lock.json`, `src/app/`, `src/components/`, `src/features/`, `src/domain/`, `src/lib/`, `src/validation/`, `supabase/`, and `tests/`; pin Node 24.21.0/npm 11.19.0 and every direct version enumerated in `plan.md`, and require a reviewed plan/research update before adding any unlisted direct dependency
- [X] T002 Configure strict TypeScript, Next.js 16.3.5, React 19.3.0, Tailwind 4.3.3/PostCSS, and ESLint 9.39.5 (compatibility correction documented in plan/research) with zero warnings in `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, and `eslint.config.mjs`
- [X] T003 [P] Define validated, server/client-separated environment names and safe fictitious placeholders in `.env.example`, `src/lib/env/server.ts`, and `src/lib/env/client.ts`, excluding all real credentials and PII
- [X] T004 [P] Configure Vitest 5.0.1, React Testing Library 16.3.3, jsdom, and coverage scripts in `vitest.config.ts`, `tests/setup.ts`, and `package.json`
- [X] T005 [P] Configure Playwright 1.63.0 and `@axe-core/playwright` 4.13.0 with failure-only traces and fictitious test identities in `playwright.config.ts` and `tests/e2e/fixtures/auth.ts`
- [X] T006 [P] Configure the local Supabase 2.117.0 project, migration/test directories, private seed convention, and ignored temporary artifacts in `supabase/config.toml`, `supabase/migrations/.gitkeep`, `supabase/tests/.gitkeep`, and `.gitignore`
- [X] T007 Add the pull-request quality pipeline with read-only permissions and jobs for `npm ci`, typecheck, lint, Vitest, pgTAP, build, and Playwright in `.github/workflows/quality.yml`

**Checkpoint**: The empty application and every quality command are reproducible; no business flow is
implemented.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared identity, schema, authorization, audit, validation, error, and UI
foundations required by all stories.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T008 [P] Write failing pgTAP specifications for account roles/status, public/admin registration boundaries, admin peer suspension/reactivation with reason and audit plus denial of self-suspension and last-active-admin suspension, catalog integrity, base grants, suspended/archived-account denial, access revocation, candidate-account reactivation that preserves the prior candidate-profile status while revalidating current conditions, and restoration without implicit related-record reactivation in `supabase/tests/001_foundation_rls.test.sql`
- [X] T009 [P] Write failing unit specifications for role parsing, Spanish safe-error mapping, normalized identifiers, and centralized state/catalog values in `tests/unit/foundation/auth-and-domain.test.ts`
- [x] T010 Create the accounts and controlled catalog migration in `supabase/migrations/202609190001_accounts_catalogs.sql` with these data-model constraints: `auth_user_id` UUID unique/non-null; role exactly `candidate|company|admin`; account status exactly `pending_verification|active|suspended|archived`; suspension and archive reason/actor/date fields complete together; category `(version, code)` unique and deactivation recoverable
- [x] T011 Create the shared business-schema migration in `supabase/migrations/202609190002_business_entities.sql` with every field/relationship from `data-model.md` for candidate/private data/contacts/consent/versioned CV, `duplicate_reviews`, company/opening/categories, participation/preinterview/referral/feedback/interview/contact/internal note, import batch/row; enforce UUID/UTC/version/archive conventions, unique normalized DNI/CUIT, positive vacancies, one valid CV, one active participation per candidate/opening, referral `consent_event_id` plus immutable `cv_document_id`, opening `suspended` support, duplicate decision `use_or_update_existing|correct_and_create|reject`, import-row `unmapped_category`, and no destructive cascade over history
- [x] T012 Create private authorization helpers, append-only `audit_events`, actor constraints for account/system, optimistic-version functions, minimum grants, and RLS enablement for every exposed table in `supabase/migrations/202609190003_authorization_audit.sql`; forbid application-role `UPDATE`/`DELETE` on audit, limit `system` insertion to protected scheduled functions, allowlist secret-client operations, exclude PII, notes, credentials, tokens, and file content from audit metadata, and revoke private access on suspension/archive without erasing history
- [x] T013 Create the private `candidate-cvs` bucket and Storage policies in `supabase/migrations/202609190004_private_storage.sql`; object paths must be opaque UUIDs, MIME must be `application/pdf`, demo size must be `1..5 MiB`, and access must be limited to owner, active admin, or an active company/referral pair requesting exactly that referral's `cv_document_id`
- [x] T014 Generate typed database definitions and implement separate browser, cookie-bound server, and isolated secret clients in `src/lib/supabase/database.types.ts`, `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/admin.ts`, marking privileged code `server-only`
- [x] T015 Implement session validation and role/status guards without trusting `getSession()` or editable metadata in `src/lib/auth/session.ts`, `src/lib/auth/guards.ts`, and `src/app/auth/callback/route.ts`; every protected request must revalidate current account role/status so suspension defeats stale cookies and concurrent requests fail with a safe non-disclosing error before mutation
- [x] T016 Implement public candidate/company role allowlisting, individual admin invitation/provisioning and recovery, suspension/reactivation, candidate/company recoverable archive/restore primitives, and generic access recovery in `src/features/accounts/service.ts` and `src/features/accounts/actions.ts`; public input must never create or elevate to `admin`, each administrator retains an individual auditable identity, and one active admin may suspend/reactivate another from the panel only with reason, explicit confirmation and audit, never self-suspending or leaving zero active admins. Do not offer admin-account archive in the MVP. Allow a company to archive its own account/profile and an admin to archive them with reason, but only an admin may restore them. Every administrative transition requires actor/reason/version; candidate-account reactivation must preserve the prior candidate-profile status and revalidate current conditions, and reactivation/restoration must not reactivate related offers, referrals, participations, or company access
- [x] T017 Create the shared Spanish login, logout, verification-pending, expired-verification-link renewal, recovery-request, invalid/expired-recovery-link renewal, password-update, revoked-session and suspended-account pages in `src/app/(auth)/` and accessible auth forms in `src/features/accounts/components/`; all account lookup and renewal responses must be non-enumerating
- [X] T018 [P] Implement allowlisted structured server logging, request IDs, safe Spanish error codes, and error boundaries in `src/lib/logging/logger.ts`, `src/lib/errors/codes.ts`, `src/lib/errors/public-error.ts`, `src/app/error.tsx`, and `src/app/global-error.tsx`
- [X] T019 [P] Implement centralized Zod schemas and domain catalogs for DNI/CUIT/contact normalization, roles, and every account/company-profile/candidate-profile/opening/participation/referral-access/consent/CV/import state defined normatively in `contracts/state-machines.md`, plus duplicate decisions, modalities, contract types, channels, and moderation-decision codes, in `src/validation/common.ts`, `src/domain/catalogs/`, and `src/domain/states/`; include workflow states such as `suspended` and `no_company_response`, the import-row state `unmapped_category`, and the moderation-decision codes `auto_closed` and `restored_to_draft` in their respective centralized catalogs without duplicated string literals; do not treat decision codes as executable states or create states/transitions found only in the data model or tasks
- [X] T020 [P] Build responsive, keyboard-accessible Spanish UI primitives and role layouts with loading, empty, error, focus, and status patterns in `src/components/ui/`, `src/components/layouts/`, and `src/app/loading.tsx`
- [x] T021 Add exclusively fictitious local identities and deterministic reset helpers in `supabase/seed.sql` and `tests/fixtures/`, including a reproducible acceptance dataset of 500 candidates, 50 companies, 100 offers, and 1,000 participations with known active-candidate and hiring outcomes; version fixed SC-008A inputs and expected counts for candidate term/category/availability search, opening status/page listing, and company status/page listing beside the fixture hash; do not seed a “final” occupation catalog while OQ-010 remains open

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

- [X] T022 [P] [US1] Write failing unit tests for allowed/forbidden offer and participation transitions, forward-only omission of review/preinterview/preselection with mandatory reason, explicit referral, offer-date auto-close, 30-day no-response deadline without pause/reset, 720-hour post-hire access window beginning at admin confirmation without restoring a revoked permission, late-response override to `hired|not_selected|cancelled` backed by portal feedback or a dated/channelled/admin-recorded municipal contact while preserving the prior automatic closure, and optimistic conflicts in `tests/unit/intermediation/transitions.test.ts`
- [X] T023 [P] [US1] Write failing pgTAP tests for offer moderation, admin-only preselection/referral/company-reported outcomes, candidate withdrawal of either participation origin, admin withdrawal only on candidate request, motivated individual cancellation without cancelling the offer, append-only history, company projection of all current contacts plus exactly the referred `cv_document_id`, consent/account/record/access-status revalidation including denial exactly 720 hours after admin-confirmed hire even before cron materialization, revocation on withdrawal/consent/result/suspension/archive, late-feedback access to only non-personal referral metadata, and denial of DNI/address/internal notes/other-company/general-pool access in `supabase/tests/010_intermediation_rls.test.sql`
- [X] T024 [P] [US1] Write failing component tests for moderation, candidate filtering, preinterview, justified stage omission, referral, feedback, prominent suspension confirmation, restoration-safe states, and safe Spanish errors in `tests/components/intermediation/admin-workflow.test.tsx`
- [X] T025 [US1] Write the failing end-to-end municipal intermediation scenarios from Quickstart scenarios 2–4 plus the administrative portions of scenario 8 in `tests/e2e/intermediation.spec.ts`

### Implementation for User Story 1

- [X] T026 [P] [US1] Implement centralized offer and participation transition definitions and guards in `src/domain/transitions/opening.ts` and `src/domain/transitions/participation.ts`, including suspend/restore-to-draft, forward-only justified omission of review/preinterview/preselection, and municipal referral as the non-skippable boundary that exposes candidate data
- [X] T027 [US1] Implement atomic SQL functions for submit/moderate/pause/suspend/restore-to-draft/close/cancel offers and for review/preinterview/preselect/justified-skip/refer/finalize/withdraw/individually-cancel participations in `supabase/migrations/202609190010_workflow_functions.sql`; each function must check actor, current state, expected version and preconditions, write entity plus actor/date/previous/new state/required reason and referral-access change in one transaction, and roll back the entity, authorization and event together on any failure. Confirming `hired` must set `post_hire_access_until` to admin confirmation +720 hours only when the referral permission remained active; no correction reopens a revoked permission. Candidate withdrawal covers self-applications and admin nominations; admin withdrawal requires a recorded candidate request; individual cancellation requires an operational reason and does not cancel the offer. Cancelling an offer must also close all its non-final participations as `cancelled` and revoke affected referral access atomically while preserving earlier final outcomes; pausing and ordinary/expiry closing must leave existing participations open
- [X] T028 [P] [US1] Implement admin offer-review queries/actions with separate company-visible message and internal reason in `src/features/openings/admin-service.ts`, `src/features/openings/admin-actions.ts`, and `src/validation/opening-moderation.ts`; only changes-requested and rejected decisions require an actionable public message, rejection/pause/admin-close/cancel/suspend/restore require internal reason, and approval/resumption require actor/date/state history but no reason. Company sees state only for pause, suspension, closure and cancellation
- [X] T029 [P] [US1] Implement paginated admin candidate search by categories, skills, availability, locality, vigency, and referral eligibility in `src/features/candidates/search-service.ts` and `src/validation/candidate-search.ts`
- [X] T030 [P] [US1] Implement append-only preinterview, preselection, contact, training-guidance note, and internal applicant-note commands in `src/features/participations/evaluation-service.ts`, `src/features/participations/evaluation-actions.ts`, and `src/validation/evaluation.ts`
- [X] T031 [US1] Implement the referral service and database-safe company projection in `src/features/referrals/service.ts` and `supabase/migrations/202609190011_referral_projection.sql`; persist the exact `consent_event_id` and `cv_document_id`, expose the job profile, every current non-archived contact, and only that CV version while the company owns the opening, consent is current, accounts/records are active, `access_status=active`, and `post_hire_access_until` is null or still in the future; after revocation or expiry an active company sees only its referral ID, own opening ID/title and referral date for late feedback, never candidate name/profile/contacts/CV, DNI, address, duplicate alerts, other participations, or internal notes/reasons
- [X] T032 [US1] Implement authenticated CV streaming in `src/app/api/cv/[cvId]/route.ts` with owner/admin checks or an active, non-expired own-opening referral whose stored `cv_document_id` exactly matches the requested resource; reauthorize current session, role, account/record state, consent, referral and post-hire 720-hour deadline on every request, return `Cache-Control: private, no-store`, never expose a signed or reusable URL, and document that an already downloaded copy cannot be technically revoked
- [X] T033 [P] [US1] Implement append-only company interview/feedback submission and admin-only confirmation of company-reported outcomes in `src/features/referrals/feedback-service.ts`, `src/features/referrals/feedback-actions.ts`, and `src/validation/referral-feedback.ts`; include `process_cancelled` for one participation without cancelling the opening, and allow a late `no_company_response` correction only to `hired|not_selected|cancelled` using portal feedback or a participation-linked municipal contact with phone/email/WhatsApp/in-person channel, date, admin and short note, showing the new result as current while retaining the automatic closure as superseded history and never reactivating access
- [X] T034 [US1] Add one idempotent daily Supabase Cron function in `supabase/migrations/202609190012_daily_automations.sql` that records actor `system`, evaluates UTC instants with the UI boundary documented for `America/Buenos_Aires`, closes `published` offers only after `closing_date` has ended without altering existing participations, closes unresolved referrals when `feedback_due_at <= now()` exactly 30 days after `referred_at` as `no_company_response` without pause/reset from interviews, contacts, or follow-up, and materializes `revoked` with `post_hire_window_ended` for hired referrals whose 720-hour access window has ended; authorization denies reads immediately at the deadline regardless of cron timing; repeated runs create no duplicate events and later admin outcomes preserve the automatic event
- [X] T035 [US1] Build the admin offer moderation/suspension/restoration, candidate-account suspension and candidate restore-to-`draft`, candidate search, participation timeline, preinterview, justified stage-skip, preselection, referral, and outcome pages in `src/app/(admin)/admin/openings/`, `src/app/(admin)/admin/candidates/`, and `src/app/(admin)/admin/participations/`
- [X] T036 [P] [US1] Build the company read-only referred-candidate projection showing all current contacts and only the CV version attached to that referral, plus interview and feedback UI, in `src/app/(company)/company/openings/[openingId]/referrals/` and `src/features/referrals/components/`
- [X] T037 [US1] Integrate audit timelines, stale-version conflict recovery, loading/empty/error states, and cache invalidation across the US1 pages in `src/features/participations/components/` and `src/features/openings/components/`

**Checkpoint**: US1 is independently demonstrable with admin/company fixtures and proves that no
candidate data crosses to a company without an explicit municipal referral.

---

## Phase 4: User Story 2 - Autogestión del candidato (Priority: P1)

**Goal**: Let a candidate register, complete and directly correct a multi-category profile and
protected CV, accept/withdraw consent, apply to multiple published offers, withdraw, request
immediate recoverable archive, and see only receipt/final result.

**Independent Test**: A fictitious candidate verifies access, activates and corrects a valid profile,
applies to two offers, withdraws one participation, changes availability, archives the account/profile
immediately, and after an admin restoration returns to `draft` without reactivated relations; the
candidate never sees internal stages or notes.

### Tests for User Story 2

- [X] T038 [P] [US2] Write failing unit/component tests for candidate registration, activation prerequisites, six-month freshness, consent versioning and withdrawal that closes all open participations as `withdrawn` without altering final outcomes or reopening on later acceptance, CV rejection/replacement without changing prior referral snapshots, direct profile correction, multi-category profile, withdrawal of both self-applications and admin nominations, immediate archive request, and admin restore-to-draft in `tests/components/candidate/candidate-flow.test.tsx`
- [X] T039 [P] [US2] Write failing pgTAP tests proving a candidate can access only their profile/private data/contacts/consents/CV and limited participation projection, archive their own account/profile atomically, lose private/new-operation access immediately, and never restore or reactivate related records themselves in `supabase/tests/020_candidate_rls.test.sql`
- [X] T040 [US2] Write the failing end-to-end candidate scenario from Quickstart scenario 1 plus the candidate suspension/reactivation and archive/restore paths from scenario 8, proving that reactivation preserves the prior profile status while revalidating current conditions and that restoration returns an archived profile to `draft`, including two independent applications and hidden internal stages, in `tests/e2e/candidate-self-service.spec.ts`

### Implementation for User Story 2

- [X] T041 [US2] Implement candidate signup and verified-email bootstrap with name, normalized DNI, email contact, duplicate blocking, and `draft` profile in `src/features/candidates/registration-service.ts`, `src/features/candidates/registration-actions.ts`, and `src/validation/candidate-registration.ts`; when an existing assisted profile matches, allow only a candidate account pending in-person claim without creating another candidate profile or bypassing duplicate review
- [X] T042 [P] [US2] Implement direct own-profile/contact/category/availability correction, immediate atomic candidate account/profile archive request, and admin-only conflict-checked restore-to-`draft` with mandatory reason in `src/features/candidates/profile-service.ts`, `src/features/candidates/profile-actions.ts`, `src/features/candidates/admin-actions.ts`, and `src/validation/candidate-profile.ts`; archive/restore must preserve history/CVs and never reactivate participations, referrals, or company access
- [X] T043 [P] [US2] Implement append-only policy-version/hash consent acceptance and withdrawal plus activation eligibility in `src/features/candidates/consent-service.ts`, `src/features/candidates/consent-actions.ts`, and `src/validation/consent.ts`; withdrawal must atomically close all non-final participations as `withdrawn` with `consent_withdrawn` reason, revoke all active company access, preserve prior final outcomes/history, and never reopen those participations or permissions on later acceptance; use no real municipal text until the approved version is supplied
- [X] T044 [US2] Implement candidate/admin PDF upload and replacement in `src/app/api/candidate/cv/route.ts` and `src/lib/files/pdf-validation.ts`; validate extension, declared MIME, `%PDF-` signature, readable structure, and `1..5 MiB`, and never replace the valid CV on rejection
- [X] T045 [P] [US2] Implement public published-and-current-offer listing/detail queries with pagination in `src/features/openings/public-service.ts` and `src/app/(public)/ofertas/`; expose exactly company name, title, tasks, categories, vacancies, location, modality, schedule, contract type, requirements and closing date, plus salary and benefits only when supplied, and never company CUIT/responsible/private contacts, candidates, participations or individual outcomes; remove expired offers from public results and block new applications while preserving existing participations
- [X] T046 [US2] Implement self-application and withdrawal commands, allowing the candidate to withdraw either a self-application or admin nomination still open, with one active participation per candidate/opening and independent history in `src/features/participations/candidate-service.ts`, `src/features/participations/candidate-actions.ts`, and `src/validation/application.ts`
- [X] T047 [P] [US2] Build candidate registration, profile, direct correction, categories, consent, availability, CV, and explicit archive-confirmation panels with Spanish labels and accessible validation in `src/app/(auth)/registro/candidato/` and `src/app/(candidate)/candidato/perfil/`
- [X] T048 [P] [US2] Build published-offer application controls and the candidate participation view that maps every non-final internal state to `received` and reveals only the final outcome in `src/app/(candidate)/candidato/ofertas/` and `src/app/(candidate)/candidato/postulaciones/`
- [X] T049 [US2] Add the protected idempotent six-month freshness function that is invoked by candidate/admin queries or commands, attributes the transition to that requesting account, marks overdue profiles `needs_update` without deletion, and is not a Cron or `system`-actor automation, in `supabase/migrations/202609190020_candidate_freshness.sql`
- [X] T050 [US2] Integrate candidate loading/empty/error/focus states, masked private data, conflict recovery, and cache invalidation in `src/features/candidates/components/` and `src/features/participations/components/candidate-status.tsx`

**Checkpoint**: US2 works with public offers and candidate-owned data, independently of company
self-service screens.

---

## Phase 5: User Story 3 - Gestión de empresa y ofertas (Priority: P1)

**Goal**: Let a company register and maintain its profile, create/edit/submit offers, respond to
correction requests, undergo safe suspension/restoration, and view only its moderation state and
municipally referred candidates.

**Independent Test**: A fictitious company completes its profile, submits/corrects/resubmits a draft,
observes automatic closing at the deadline, loses private/referral access when suspended, and after
explicit restoration remains `incomplete` with offers in `draft`; it sees only its own resources and
cannot publish or set a final outcome.

### Tests for User Story 3

- [X] T051 [P] [US3] Write failing component tests for required company fields, draft completeness, optional salary/benefits, submission/resubmission, moderation visibility, automatic expiry messaging, prominently presented suspension with explicit confirmation, own-company archive, administrative archive with reason, and restore-to-`incomplete`/`draft` messaging in `tests/components/company/company-flow.test.tsx`
- [X] T052 [P] [US3] Write failing pgTAP tests for company ownership, offer draft/update/submit permissions, system-only idempotent expiry close, suspended-company denial/revocation, company-own and admin archive permissions, denial of company self-restoration, restore-to-`active`/`incomplete`/`draft` without implicit related access, denial of publish/moderate/final-outcome operations, and isolation from other companies in `supabase/tests/030_company_rls.test.sql`
- [X] T053 [US3] Write the failing end-to-end company scenario from Quickstart scenario 2 plus referral isolation and the company suspension, own/admin archive, and admin-restoration paths from scenario 8 in `tests/e2e/company-offers.spec.ts`

### Implementation for User Story 3

- [X] T054 [US3] Implement company signup/profile create/update with required name, unique normalized CUIT, responsible person, at least one contact, activity, and locality, explicitly without documents or a verified-company state, in `src/features/companies/service.ts`, `src/features/companies/company-actions.ts`, and `src/validation/company.ts`
- [X] T055 [US3] Implement offer draft create/update validation for required title, tasks, one or more categories, positive vacancies, location, modality, schedule, contract type, requirements, and future closing date, with optional salary/benefits, in `src/features/openings/company-service.ts`, `src/features/openings/company-actions.ts`, and `src/validation/opening.ts`
- [X] T056 [US3] Implement submit/resubmit commands that only allow `draft|changes_requested -> pending_review` and never direct publication in `src/features/openings/company-actions.ts`
- [X] T057 [P] [US3] Build company registration/profile pages and accessible status/errors in `src/app/(auth)/registro/empresa/` and `src/app/(company)/empresa/perfil/`
- [X] T058 [P] [US3] Build company offer list, draft editor, submission, correction, and moderation-history pages in `src/app/(company)/empresa/ofertas/` and `src/features/openings/components/company/`
- [X] T059 [US3] Build the company dashboard projection that contains only its profile, its offers, visible moderation messages, and its referrals in `src/app/(company)/empresa/page.tsx`
- [X] T060 [US3] Implement company-own archive plus admin company/offer suspension, reactivation, archive/restoration, and UI in `src/features/companies/company-actions.ts`, `src/features/companies/admin-actions.ts`, `src/app/(company)/empresa/perfil/`, and `src/app/(admin)/admin/empresas/`; archive account/profile atomically, set `archived_at` on every non-final offer without introducing a separate deactivated workflow state, revoke referral access and preserve cases/results/history, requiring reason from admin and denying company self-restoration. Suspension must be visually prominent with explicit confirmation and mandatory internal reason, expose only the state to the company, revoke private/referral access without finalizing cases. Reactivating the company account must set that account `active` and its company profile `incomplete` in the same decision, while offers, participations and access remain inactive; archive restoration clears the offers' archive marker and returns account to `active`, company to `incomplete` and offers to `draft` without reactivating related records or exposing internal reasons

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

- [ ] T061 [P] [US4] Write failing unit/component tests for assisted-profile prerequisites, admin attribution, DNI/email matches, the exact `use_or_update_existing|correct_and_create|reject` decisions with reason, false-positive correction before separate creation, no-CV referral block, free-text training note, and in-person claim only after displayed-DNI check and verified candidate email, including claim conflicts and denial of automatic remote claim, in `tests/components/admin/assisted-candidate.test.tsx`
- [ ] T062 [P] [US4] Write failing pgTAP tests for admin-only assisted maintenance, persisted duplicate actor/date/reason, no automatic merge/overwrite, unique-key revalidation after `correct_and_create`, active-but-not-referral-eligible profiles, and history-preserving account linkage that rejects an unverified email, existing account profile, account/DNI/email conflict or missing admin in-person verification in `supabase/tests/040_assisted_candidate.test.sql`
- [ ] T063 [US4] Write the failing end-to-end assisted-service scenario from Quickstart scenario 5 in `tests/e2e/assisted-candidate.spec.ts`

### Implementation for User Story 4

- [ ] T064 [US4] Implement potential-duplicate search and explicit `use_or_update_existing|correct_and_create|reject` admin resolution with mandatory reason/history in `src/features/candidates/duplicate-service.ts`, `src/features/candidates/duplicate-actions.ts`, and `src/validation/duplicate-resolution.ts`; only expressly confirmed fields may update an existing profile, false positives must be corrected/revalidated before separate creation, and no path may silently merge profiles
- [ ] T065 [US4] Implement assisted create/update commands with `origin=assisted`, nullable `account_id`, mandatory responsible admin, at least one contact, and action history in `src/features/candidates/assisted-service.ts` and `src/features/candidates/assisted-actions.ts`
- [ ] T066 [P] [US4] Build the admin assisted-profile wizard with the three explicit duplicate decisions and reason capture, plus consent/contact/category/availability/CV maintenance and internal `training_guidance` note UI, in `src/app/(admin)/admin/candidates/assisted/` and `src/features/candidates/components/assisted/`
- [ ] T067 [US4] Enforce referral eligibility so an assisted profile may remain active for internal evaluation without a CV but cannot be referred until a valid PDF exists in `src/features/referrals/service.ts` and `src/domain/permissions/referral.ts`
- [ ] T068 [US4] Implement the in-person assisted-profile account-claim transaction in `supabase/migrations/202609190040_claim_assisted_profile.sql` and `src/features/candidates/claim-actions.ts`: an admin verifies the displayed DNI without storing a copy, the candidate account has verified email and no other profile, and any account/DNI/email conflict enters duplicate review rather than creating or merging a profile. Preserve `candidate_profile.id`, origin, consent, states, relations and history; audit admin/date without DNI or document image; prohibit automatic remote claim

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
- [ ] T071 [P] [US5] Write failing pgTAP tests for admin-only staging, hash/mapping/version preconditions, double confirmation, all three duplicate decisions with mandatory actor/date/reason, false-positive correction/revalidation, complete rollback, failed-batch history, linked reupload/new preview recovery, and sanitized audit summary in `supabase/tests/050_import_atomicity.test.sql`
- [ ] T072 [US5] Write the failing end-to-end import scenario from Quickstart scenario 6 with only fictitious rows in `tests/e2e/candidate-import.spec.ts`

### Implementation for User Story 5

- [ ] T073 [US5] Finalize the placeholder import-batch/import-row schema against the approved mapping without storing the raw file indefinitely in `supabase/migrations/202609190050_import_schema.sql`; retain optional `retry_of_batch_id` for a new batch linked to a failed attempt, statuses exactly `uploaded|preview_ready|blocked|confirming|completed|failed|archived`, and row statuses covering valid, warning, invalid, potential duplicate, unmapped category, and imported
- [ ] T074 [US5] Implement strict, non-casting, streaming CSV parsing and row normalization for the approved contract in `src/features/imports/parser.ts`, `src/features/imports/mapping.ts`, and `src/validation/candidate-import.ts`
- [ ] T075 [US5] Implement admin-only preview with zero business writes, masked sensitive values, row/error codes, counts, impact summary, and temporary-file cleanup in `src/features/imports/preview-service.ts` and `src/app/api/admin/imports/preview/route.ts`
- [ ] T076 [P] [US5] Build the accessible preview and explicit `use_or_update_existing|correct_and_create|reject` duplicate/category resolution UI with reason capture, masked sensitive values, false-positive correction/revalidation, and confirmation disabled while blockers remain in `src/app/(admin)/admin/imports/new/` and `src/features/imports/components/`
- [ ] T077 [US5] Implement the all-or-nothing confirmation function that revalidates batch ID/hash/mapping/version and every recorded duplicate decision, then writes only expressly approved profile/contact/category changes, observations, and audit in one transaction in `supabase/migrations/202609190051_confirm_import.sql`
- [ ] T078 [US5] Implement the confirmation handler and batch-history/result pages with safe retry/conflict messages in `src/app/api/admin/imports/[batchId]/confirm/route.ts` and `src/app/(admin)/admin/imports/`; a failed batch must remain auditable with zero partial business writes and require corrected reupload/new preview/new linked batch rather than automatic retry or reuse of a discarded raw CSV

**Checkpoint**: US5 is complete only with approved anonymized mapping evidence and passing rollback,
duplicate, authorization, and privacy tests.

---

## Phase 8: User Story 6 - Seguimiento operativo y métricas básicas (Priority: P3)

**Goal**: Let admins reconstruct contact history, consult basic period/category metrics, and export a
generic authorized CSV without public access or spreadsheet-formula injection.

**Independent Test**: With the reproducible 500-candidate/50-company/100-offer/1,000-participation
fixture, an admin sees expected counts, contact timeline, days to first confirmed hire, and total
coverage only after confirmed hires equal vacancies, then downloads a filtered CSV within 30 seconds;
anonymous/company requests are denied and dangerous cell prefixes are neutralized.

### Tests for User Story 6

- [ ] T079 [P] [US6] Write failing SQL/unit tests for period-end snapshots of active candidates, companies, and offers by state versus in-period events for applications, preinterviews, referrals, and outcomes; candidate category for the candidate count, opening category for openings/cases, and no category filter for company counts; active candidate as `active` + available + current consent + confirmation within six months without requiring CV; per-offer duration cohort selected by `published_at` within the period even when hiring occurs later; days from `published_at` to first admin-confirmed hire; days to confirmed hires equaling `vacancies` with null/pending before full coverage; and contact ordering in `supabase/tests/060_metrics.test.sql` and `tests/unit/metrics/metrics.test.ts`
- [ ] T080 [US6] Write the failing end-to-end dashboard/export scenario from Quickstart scenario 7 using exactly 500 candidates, 50 companies, 100 offers, and 1,000 participations, including both per-offer hiring durations, pending full coverage, a metrics-only CSV matching the visible period/category filters and identifying offers only for hiring durations, under-30-second filtered counts/download, download audit without content, unauthenticated/company denial, and formula-prefixed fixtures, in `tests/e2e/admin-metrics.spec.ts`

### Implementation for User Story 6

- [ ] T081 [US6] Implement protected invoker-safe metric functions/views in `supabase/migrations/202609190060_metrics.sql` for period-end snapshots of active candidates, companies, and offers by state, in-period events for applications, preinterviews, referrals, hires, non-selections, withdrawals and no-response, candidate-category filtering for candidates and opening-category filtering for openings/cases but none for companies, the exact active-candidate predicate, category trends, days from publication to first admin-confirmed hire, and days to confirmed hires equaling `vacancies` with null until full coverage
- [ ] T082 [P] [US6] Implement period/category filter validation and admin metrics queries without public cache leakage in `src/features/metrics/service.ts` and `src/validation/metrics.ts`
- [ ] T083 [P] [US6] Implement the chronological admin contact/follow-up timeline with phone, email, WhatsApp, and in-person channels and no direct messaging integration in `src/features/participations/contact-service.ts` and `src/features/participations/components/contact-timeline.tsx`
- [ ] T084 [US6] Build the accessible admin metrics dashboard with visible definitions for active candidate and both hiring durations, explicit pending full coverage, empty/loading/error states, filters, and comprehensible trends in `src/app/(admin)/admin/metrics/page.tsx` and `src/features/metrics/components/`
- [ ] T085 [US6] Implement streaming metrics-only CSV export with the same authorized period/category filters, rows for period/category/indicator/value/unit/calculation state and offer code/title for the two per-offer hiring durations, no candidate/company/participation detail, audit of administrator/time/filters without content, and neutralization of cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return in `src/features/metrics/csv-export.ts` and `src/app/api/admin/exports/operations.csv/route.ts`
- [ ] T086 [P] [US6] Implement optional staff-only message templates/safe links without sending integrations in `src/features/participations/message-templates.ts` and `src/features/participations/components/contact-tools.tsx`

**Checkpoint**: US6 supplies only internal metrics and generic CSV; official report formats remain
outside scope until OQ-005 is resolved.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Prove the whole MVP meets privacy, accessibility, recovery, performance, documentation,
and delivery gates without expanding scope.

- [ ] T087 [P] Add axe-assisted coverage and document manual keyboard/focus/no-trap/control/message checks for every critical candidate/company/admin flow at 360×800 and 1366×768 with 100% and 200% zoom, plus at least one representative NVDA journey per role, in `tests/e2e/accessibility.spec.ts` and `docs/validation/accessibility.md`
- [ ] T088 [P] Add cross-role negative authorization coverage for every protected page, Server Action and Route Handler, including suspended accounts with stale sessions, in-flight mutation rejection before write, ownership isolation, and non-disclosing `NOT_FOUND` behavior in `tests/e2e/authorization-boundaries.spec.ts`
- [ ] T089 Add pagination/query-index validation and reproducible acceptance measurements in `tests/performance/acceptance.test.ts` and `docs/validation/performance.md`: on the exact 500/50/100/1,000 fictitious fixture, use one administrator without prior training or practice who receives only each task description; measure both tasks in the same demo deployment with stable connection, no warm-up, a verified fixture reset before each measurement, and recorded date, deployment, fixture version/hash, browser, device, connection and pseudonymous participant ID. Measure search through saved preselection under 5 minutes and metrics/export under 30 seconds with their existing boundaries. For SC-008A, execute one cold measurement per separately reset case, never average, and fail on any excess: fix beside the fixture hash the term, category, availability, statuses, page numbers and expected counts for candidate search/filter, opening-state list/pagination and company-state list/pagination, then measure each from submit/apply/page-change through stable rows plus count/pagination within 3 seconds; measure authorized CV download from request through complete size/hash-validated file within 10 seconds; measure 1,000-row synthetic CSV preview from upload through full summary within 30 seconds and confirmation from click through visible terminal batch/counts within 60 seconds, checking integrity/audit afterward. Use a common barrier for four concurrent admin sessions on distinct fixture records—moderate a pending opening, save a preselection, record a contact, and confirm an outcome—measuring each final action through visible success within 5 seconds, excluding import/export, then assert four complete mutations and audit events with no partial state or lost history. Explicitly exclude load above four administrators and production SLA until OQ-006 is resolved
- [ ] T090 [P] Document local/preview/demo environment separation, admin provisioning, email limitations, migrations, forward recovery, Cron risk/fallback, and variables in `README.md`, `.env.example`, and `docs/operations/demo-runbook.md`; for failed migrations, either developer may stop the affected deployment and prepare a new forward-only correction independently, never rewrite an applied migration, detect rollback/partial DDL or data/`schema_migrations` divergence/concurrent later migrations, preserve sanitized environment/actor/date/commit/migration/error/before-after/integrity/backup evidence, rebuild only fictitious environments after evidence capture, and notify the other developer in the PR or associated comment before shared integration, while production remains blocked by OQ-006
- [ ] T091 [P] Record every unresolved stakeholder gate—retention, reports, production operation, catalog, CV approval, CSV mapping, consent text, admin identities, SMTP, and municipal visual/accessibility requirements—in `docs/validation/release-gates.md`, identifying owner, safe limit, blocked stage and closure evidence; accept a traceable PR, issue, minutes, email, or repository-captured message with decision/owner/date instead of requiring a separate formal document, and never treat demo defaults as municipal approval
- [ ] T092 Execute every scenario in `specs/001-municipal-employment-portal/quickstart.md` with fictitious data and record results/limitations in `docs/validation/quickstart-results.md`; include 10 candidate and 10 company runs with at least five distinct people per role, prepared fictitious data and stable connection, and 9/10 under 10 minutes from first registration-open to confirmed application/offer submission without technical help; allow a restart within a timed run but never reset its original clock. Evaluate SC-010 separately with cohorts of at least five candidates, five company representatives and the four planned administrators or equivalent municipal staff; each person performs only their role's tasks. Record first-attempt success without external help or restart (interface-guided error correction remains the same attempt) for each of the five task types, require at least 80% success per type, and approve globally only if at least four of the five types pass
- [ ] T093 [P] Add an executable audit-completeness matrix and database/integration tests for account provisioning/suspension, consent, CV versioning, duplicate decisions, moderation, justified skips, referral access, outcomes, archive/restore, imports, filtered metrics-CSV downloads, and automations in `docs/validation/audit-matrix.md`, `supabase/tests/070_audit_integrity.test.sql`, and `tests/integration/audit/audit-events.test.ts`; require actor/date/previous/new state when applicable, mandatory reasons, request ID, safe metadata including download filters but never export contents, append-only grants, atomic rollback, and a scheduled-function-only `system` actor
- [ ] T094 Consolidate positive and negative cross-layer authorization evidence for protected pages, Server Actions, Route Handlers, Data API/RLS, Storage, exports and scheduled functions in `supabase/tests/071_authorization_surfaces.test.sql` and `docs/validation/authorization.md`, reusing E2E evidence from `tests/e2e/authorization-boundaries.spec.ts`; cover browser/server/secret-client separation and the exact privileged operation allowlist, stale and concurrent session/status changes, ownership isolation, non-disclosing errors, late-feedback-only referral ID plus own opening ID/title/date, immediate revoked or 720-hour-expired CV streaming denial with no reusable URL, and scheduled-only `system` actor
- [ ] T095 Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:db`, `npm run build`, and `npm run test:e2e`, then record exact commands and outcomes in `docs/validation/quality-gates.md`
- [ ] T096 Review tracked files, fixtures, logs, traces, screenshots, dependencies, migrations, RLS, Storage policies, secret-client call sites, and `.env.example` for secrets/real PII/unapproved scope, and document the second developer’s PR findings in `docs/validation/final-review.md`

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
- **Phase 5 — US3**: depends on Phase 2; company/profile/offer work may run beside US1/US2 after
  shared schema/RLS are stable, but its automatic-expiry acceptance depends on the shared daily
  automation in T034.
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

US1, US2, and most US3 work can begin in parallel after Foundation if developers own disjoint files;
US3 automatic-expiry integration waits for T034. US4 has a deliberate service dependency on US2;
US6 needs representative activity from the transactional stories; US5 is externally gated.

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
- US3 tests T051/T052 and UI T057/T058 can run in parallel around the shared company service; the
  automatic-expiry assertions wait for T034.
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
