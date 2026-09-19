# Repository instructions

## Project purpose

This repository contains the MVP for the Municipalidad de Funes Employment Portal. The system must help the municipal Employment Office organize candidates, companies, job openings, referrals, interviews, outcomes, and follow-up while preserving the office as the intermediary between candidates and employers.

The product is not a direct marketplace. Companies must not browse the full candidate database or contact arbitrary candidates. The Employment Office reviews applications, performs preselection, and decides which profiles are referred.

## Required context before working

Before planning or changing the product, read these files in order:

1. `docs/PROJECT_CONTEXT.md`
2. `docs/discovery/CURRENT_PROCESS.md`
3. `docs/discovery/ACTORS_AND_ROLES.md`
4. `docs/discovery/REQUIREMENTS.md`
5. `docs/discovery/BUSINESS_RULES.md`
6. `docs/discovery/OPEN_QUESTIONS.md`
7. The active feature artifacts under `specs/`, when they exist
8. `.specify/memory/constitution.md`, once ratified

Do not rely on prior chat history. The repository is the shared source of context for both developers and their Codex sessions.

## Authority and uncertainty

- The project constitution governs stable engineering and product principles once ratified.
- An approved feature `spec.md` governs that feature's scope and acceptance criteria.
- Discovery documents describe the current shared understanding and must not silently override an approved specification.
- Items marked open, provisional, inferred, or unconfirmed must not be invented. Record the uncertainty and request a decision.
- When evidence conflicts, preserve both versions in `OPEN_QUESTIONS.md` and identify the stakeholder who must resolve it.

## Current project phase

- Spec Kit is initialized with the Codex integration and PowerShell scripts.
- Product discovery has started from classes, the current municipal site, and a group interview transcript.
- The constitution and first feature specification have not been ratified yet.
- Do not start application implementation until the team reviews the constitution, specification, clarification results, plan, checklist, tasks, and analysis.

## Spec Kit collaboration

- Only one developer is the active owner of Spec Kit artifacts at a time.
- The other developer reviews the artifacts through a pull request; do not run competing Spec Kit commands for the same feature.
- Do not manually edit managed files under `.agents/skills/`, `.specify/scripts/`, or `.specify/templates/`.
- Do not run `specify init` again. Use manifest-aware Spec Kit commands for future maintenance.
- Run Spec Kit stages individually and review their output before continuing.
- For meaningful features use the full sequence: constitution once, then specify, clarify, plan, checklist, tasks, analyze, implement, and converge.

## Git collaboration

- Never implement directly on `main`.
- Start work from an updated `main` and use a focused branch such as `docs/...`, `feature/...`, `fix/...`, or `chore/...`.
- Use pull requests for every change to `main`.
- Before editing, check the current branch and working tree. Do not overwrite unrelated or uncommitted work.
- Avoid having both developers edit the same files concurrently.
- Changes to shared contracts, database schema, authentication, authorization, application states, or global UI foundations require coordination before implementation.
- Keep commits focused and explain behavior changes in the pull request.

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

## Engineering expectations

- Do not choose or introduce a technology stack before the Spec Kit planning stage approves it.
- Prefer the simplest design that satisfies the approved MVP and leaves clear extension points.
- Centralize business catalogs and workflow states; do not duplicate them as unrelated hardcoded values across the UI and backend.
- Enforce authorization on the server, not only by hiding UI controls.
- Validate all external input and uploaded files.
- Critical flows require automated tests: authentication, permissions, offer moderation, application transitions, candidate referral, and data import.
- Database migrations must be reviewable and include a safe rollback or recovery strategy.
- Build responsive, keyboard-accessible interfaces with clear Spanish-language messages.
- Preserve auditability and avoid destructive deletion of business records unless an approved retention rule explicitly requires it.

## Definition of done

A task is complete only when:

- Its behavior matches an approved requirement and acceptance criteria.
- Relevant tests pass.
- Authorization, validation, privacy, empty states, errors, and accessibility were considered.
- Documentation is updated when a business rule, contract, setup step, or user-visible behavior changes.
- No real personal data or secrets were added.
- The pull request explains what changed, how it was verified, and any remaining limitation.
