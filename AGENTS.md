# Repository instructions

## Project purpose

This repository contains the MVP for the Municipalidad de Funes Employment Portal. The system must help the municipal Employment Office organize candidates, companies, job openings, applications, referrals, interviews, outcomes, and follow-up while preserving the office as the intermediary between candidates and employers.

The product is not a direct marketplace. Companies must not browse the full candidate database or contact arbitrary candidates. The Employment Office reviews applications, performs preselection, and decides which profiles are referred.

## Required context before working

Before planning or changing the product, read these files in order:

1. `docs/PROJECT_CONTEXT.md`
2. `docs/discovery/TECHNICAL_BASELINE.md`
3. `docs/discovery/CURRENT_PROCESS.md`
4. `docs/discovery/ACTORS_AND_ROLES.md`
5. `docs/discovery/REQUIREMENTS.md`
6. `docs/discovery/BUSINESS_RULES.md`
7. `docs/discovery/OPEN_QUESTIONS.md`
8. The active feature artifacts under `specs/`, when they exist
9. `.specify/memory/constitution.md`, once ratified
10. `cambios-extra.md`, for necessary additions, their rationale, status, and review history
11. `docs/UI_GUIDELINES.md`, before changing any page, form, typography, or color

Do not rely on prior chat history. The repository is the shared source of context for both developers and their Codex sessions.

## Authority and uncertainty

- The project constitution governs stable engineering and product principles once ratified.
- An approved feature `spec.md` governs that feature's scope and acceptance criteria.
- An approved `plan.md` governs the architecture and technical implementation for that feature.
- `docs/discovery/TECHNICAL_BASELINE.md` records the technologies required by the course but does not replace architecture decisions in the plan.
- Discovery documents describe the current shared understanding and must not silently override an approved specification.
- Items marked open, provisional, inferred, or unconfirmed must not be invented. Record the uncertainty and request a decision.
- When evidence conflicts, preserve both versions in `OPEN_QUESTIONS.md` and identify the stakeholder who must resolve it.

## Necessary additions discovered during implementation

- Project authorization recorded by Mateo on 2026-09-26: if an additional requirement or technical prerequisite is demonstrably necessary to satisfy the approved task, the agent may add it within that task's scope instead of stopping solely because it was not enumerated. Prefer the smallest sufficient change; unrelated improvements are deferred.
- Before implementing an addition, record it in the root `cambios-extra.md` with a stable ID, date, problem/evidence, originating approved requirement/task, proposed change, justification, affected files/contracts, risks, verification plan, and authorization/review status. Tell the user what will change and why.
- Keep the specification, plan, data model, contracts, and tasks consistent where affected. The log is traceability, not a replacement for those artifacts or for the constitution. Follow existing Spec Kit review and analysis gates for architectural changes.
- This authorization covers necessary implementation details and derived requirements; it does not authorize inventing municipal/legal decisions, resolving open questions, adding excluded MVP features, changing approved functional behavior, or bypassing privacy, security, the required stack, or quality gates. Record such proposals as pending and request the responsible stakeholder's decision before implementing them.
- An explicit instruction from the requesting developer authorizes the requested work, including changes to shared contracts, schema, authentication, authorization, states, and global UI. The developers coordinate continuously outside the agent session; do not require separate confirmation or approval from the second developer before proceeding. Preserve unrelated work and raise concrete conflicts in concurrently edited files rather than assuming a conflict from the affected subsystem alone.
- After implementation, update the entry with actual files, verification results, remaining limitations, and commit/PR references when available. Distinguish proposed, implemented, verified, and reviewed work; never mark review or acceptance complete without evidence.

## Current project phase

- Spec Kit is initialized with the Codex integration and PowerShell scripts.
- Product discovery was assembled from the classes, the current municipal site, the group interview transcript, and the official course technology guide.
- The course-defined technical baseline is Next.js, TypeScript, Tailwind CSS, Node.js with npm, Supabase/PostgreSQL, GitHub, and Vercel.
- As of 2026-10-06, constitution 1.0.0 is ratified (2026-09-19); application implementation exists and convergence remains incomplete.
- The task ledger has 91/97 checked: T069, T087, T089, T092, T096 and T097 remain open. See `specs/001-municipal-employment-portal/implementation-status.md` for current evidence and local-only commits.
- Máximo approved the current feature specification scope and business rules on 2026-10-17; `spec.md` records this approval. This does not establish final product acceptance, close open questions or pending validation tasks, constitute municipal approval, or waive other review gates.

## Spec Kit collaboration

- Only one developer is the active owner of Spec Kit artifacts at a time.
- The other developer reviews the artifacts through a pull request; do not run competing Spec Kit commands for the same feature.
- Do not manually edit managed files under `.agents/skills/`, `.specify/scripts/`, or `.specify/templates/`.
- Do not run `specify init` again. Use manifest-aware Spec Kit commands for future maintenance.
- Run Spec Kit stages individually and review their output before continuing.
- For the MVP use the full sequence: constitution once, then specify, clarify, plan, checklist, tasks, analyze, implement, and converge.
- Do not treat generated artifacts as automatically correct. Compare them with the discovery documents and resolve contradictions before implementation.

## Initial implementation ownership

- One developer is the primary owner of the initial end-to-end implementation run with Codex.
- The second developer acts as product guide and reviewer during that run and must avoid editing overlapping files at the same time.
- The initial implementation may cover the complete approved MVP, but it must follow the ratified Spec Kit artifacts and task breakdown. It is not authorization to invent missing requirements or bypass unresolved questions.
- Codex must inspect the repository and approved artifacts before implementing, work on a dedicated feature branch, and verify the result with tests and build checks.
- The reviewer should record defects, missing behavior, usability improvements, and deferred ideas as focused follow-up tasks instead of introducing unrelated changes into the initial implementation branch.
- After the initial implementation is merged, either developer may own a focused improvement branch, but only one person should own a shared file or subsystem at a time.

## Git collaboration

- Never implement directly on `main`.
- Start work from an updated `main` and use a focused branch such as `docs/...`, `feature/...`, `fix/...`, or `chore/...`.
- Use pull requests for every change to `main`.
- Before editing, check the current branch and working tree. Do not overwrite unrelated or uncommitted work.
- Avoid having both developers edit the same files concurrently.
- Do not block explicitly requested implementation on an additional coordination or second-developer approval step. Pull request, security, verification, and product-approval requirements still apply; preserve unrelated working-tree changes.
- Changes to shared contracts, database schema, authentication, authorization, application states, or global UI foundations require coordination before implementation.
- Collaboration clarification from Maxi, 2026-10-22: changes he explicitly
  requests have already been discussed with his teammate. Treat those requests
  as coordination confirmation for their stated scope; do not ask for the same
  confirmation again. This does not authorize overwriting conflicting concurrent
  edits, expanding scope, skipping artifact review gates, or publishing changes.
- Keep commits focused and explain behavior changes in the pull request.
- A pull request approval is not a merge. Confirm that the pull request was merged before both developers update their local `main` branches.

## Fixed product constraints

- Four Employment Office employees will have separate accounts with the same full administrator permissions. Never use one shared administrator account.
- Candidates and companies register and sign in.
- Company identity documents are not verified in the MVP. Company accounts may be suspended by administrators.
- Company job openings require municipal review before publication.
- A candidate may have multiple job categories and may apply to multiple openings.
- Companies only see complete candidate information after an administrator refers that candidate to one of their openings.
- Staff must be able to create and maintain candidate profiles for people assisted in person.
- The system must retain a traceable history of important status changes and administrative actions.
- Never commit real CVs, DNI numbers, phone numbers, addresses, credentials, secrets, or other personal data. Use fictitious or anonymized fixtures only.

## Technical baseline

- Use Next.js with React, TypeScript, and Tailwind CSS for the application.
- Use Node.js 24 LTS and npm for the development environment and dependency management.
- Use Supabase for PostgreSQL data storage and authentication.
- Use Git and GitHub for version control and collaboration.
- Use Vercel to publish the course demonstration.
- Exact package versions, application structure, database design, authentication flow, storage, testing tools, and deployment configuration must be decided and documented in the Spec Kit plan.
- Do not introduce another framework, database, authentication provider, package manager, deployment provider, or infrastructure layer without an approved technical reason.
- Docker, local PostgreSQL, Supabase CLI, Vercel CLI, Postman, and additional editor extensions are not initial prerequisites unless the approved plan later requires them.

## AI-assisted development

- Codex may generate and modify substantial parts of the application, but generated code must be reviewed against the approved specification, plan, and tasks.
- Never provide an AI tool with real personal data, production credentials, private keys, real CVs, or unrestricted secret files.
- Do not accept generated dependencies, database changes, authorization rules, or external integrations without understanding their purpose and risk.
- Verify generated work with type checking, linting, automated tests, a production build, and manual checks of critical user flows.
- Google Antigravity is an optional course alternative and is not required when the team uses Codex.

## Engineering expectations

### Shared visual reference

- Follow `docs/UI_GUIDELINES.md` and the current tokens in `src/app/globals.css`
  for every page-level visual task. The official Funes website is a reference,
  not a Crafto dependency or a license to copy its template.
- Reuse the bundled Be Vietnam/Sora families, semantic institutional colors and
  shared form treatment. Prefer existing UI primitives; do not introduce local
  replacement palettes, fonts or competing field styles.
- Preserve validation, accessible focus, error feedback and destructive-action
  meaning. Coordinate shared changes and keep unrelated page composition intact.
- Use official shadcn/ui Base components, following the configured `base-nova`
  style, adapted to the municipal tokens and current appearance. Before adding
  or replacing a button, field, form composition or other supported UI control,
  consult its official documentation and registry source. Reuse the adapted
  shared component; do not create another local shadcn-style imitation.
- Preserve existing component contracts, form actions, native validation,
  accessibility and visual layout during migration. Configuration alone is not
  evidence of an official component integration. Do not bulk-overwrite local
  components with registry defaults. See `docs/UI_GUIDELINES.md` for migration
  status and the required shared-foundation coordination.

### Implementation quality

- Prefer the simplest design that satisfies the approved MVP and leaves clear extension points.
- Centralize business catalogs and workflow states; do not duplicate them as unrelated hardcoded values across the UI and backend.
- Enforce authorization on the server and in the database where applicable, not only by hiding UI controls.
- Validate all external input and uploaded files.
- Critical flows require automated tests: authentication, permissions, offer moderation, application transitions, candidate referral, and data import.
- Database migrations must be reviewable and include a safe rollback or recovery strategy.
- Build responsive, keyboard-accessible interfaces with clear Spanish-language messages.
- Preserve auditability and avoid destructive deletion of business records unless an approved retention rule explicitly requires it.
- Keep `.env.local` and all real secrets out of Git. Commit only a safe `.env.example` containing variable names and fictitious placeholders.

## Definition of done

A task is complete only when:

- Its behavior matches an approved requirement and acceptance criteria.
- Relevant tests, type checks, lint checks, and the production build pass.
- Authorization, validation, privacy, empty states, errors, loading states, and accessibility were considered.
- Database migrations and environment-variable changes are documented.
- Documentation is updated when a business rule, contract, setup step, or user-visible behavior changes.
- No real personal data or secrets were added.
- The pull request explains what changed, how it was verified, and any remaining limitation.
