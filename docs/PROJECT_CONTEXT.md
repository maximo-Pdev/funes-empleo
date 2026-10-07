# Funes Employment Portal - Project context

## Summary

The Municipalidad de Funes Employment Office currently receives CVs through paper, email, the municipal website, and direct contact. Information is handled largely through Excel, PDFs, WhatsApp, email, phone calls, and manual follow-up. Finding suitable candidates for a company request is slow because candidate information is not consistently structured or categorized.

Beex organized a two-month training project in which participant teams must design and build an improved employment system. This repository belongs to a two-person team. Both developers use Codex and collaborate through Git branches and pull requests.

## Product vision

Create a municipal employment management system that allows the Employment Office to:

- Maintain an organized and searchable candidate pool.
- Receive, moderate, publish, and close company job openings.
- Preselect candidates before referring them to companies.
- Track the complete history and outcome of every application and referral.
- Continue assisting people who cannot complete a digital process independently.
- Produce basic operational metrics without manually counting spreadsheets.

The public website is only one part of the solution. The administrative workflow is the core product.

## Stakeholders

- Municipalidad de Funes.
- Municipal Employment Office and its four staff members.
- Job seekers in Funes and the surrounding area.
- Companies seeking candidates.
- Beex instructors and project evaluators.
- The two developers maintaining this repository.

## Confirmed product direction

- The Employment Office remains the intermediary between companies and candidates.
- Candidates and companies have registration and login.
- All four municipal employees have separate full-administrator accounts.
- The MVP does not require documentary verification of companies.
- Job openings created by companies are reviewed by municipal administrators before publication.
- Candidates can be associated with multiple categories and multiple openings.
- Companies do not browse the complete candidate database.
- The system supports both self-service and assisted in-person data entry.

## MVP outcome

At the end of the initial project, staff should be able to receive or create candidate profiles, find relevant candidates, manage company requests, follow each candidate through preselection and referral, record outcomes, and view basic indicators from one system.

## MVP boundaries

Included:

- Authentication and role-based access.
- Candidate, company, administrator, opening, application, referral, contact, and outcome management.
- Multiple categories per candidate and opening.
- Offer moderation and publication.
- Search and filtering.
- Status history and auditability.
- Assisted profile creation.
- Import of the existing candidate spreadsheet through a controlled CSV process.
- Basic administrative metrics and CSV export.

Not included initially:

- Automatic AI matching or ranking.
- Documentary company verification.
- Direct WhatsApp API integration.
- A complete CV builder.
- Automatic course recommendation.
- Public advanced analytics.
- Unmediated communication between arbitrary companies and candidates.

## Course-defined technical direction

The official course environment guide establishes the following baseline:

- Next.js with React for the web application, routes, and server-side functionality.
- TypeScript for typed application code.
- Tailwind CSS for interface styling.
- Node.js 24 LTS and npm for the development environment and dependencies.
- Supabase for PostgreSQL data storage and authentication.
- Git and GitHub for version control and team collaboration.
- Vercel for publishing the course demonstration.

This baseline is fixed for the training project. Exact versions beyond Node.js 24 LTS, architecture, schema, security model, storage, testing tools, and deployment configuration must be defined during `$speckit-plan`. See `docs/discovery/TECHNICAL_BASELINE.md`.

## Team delivery model

- One developer owns each Spec Kit stage while the other reviews the resulting pull request.
- One developer will own the primary end-to-end implementation run with Codex after the Spec Kit artifacts are approved.
- The second developer will guide product decisions, review progress, and avoid concurrent edits to the same files during that run.
- The first implementation is a starting point, not an unquestioned final result. Both developers will verify it and then improve it through focused tasks and pull requests.
- The repository documentation and approved Spec Kit artifacts, rather than private chat history, provide the shared context for every Codex session.

## Current state

- The repository and `main` branch exist.
- Spec Kit 1.0.8 is initialized for Codex using PowerShell scripts.
- Managed Spec Kit files pass `specify integration status`.
- Discovery documentation has been established from the available source material.
- The course technical stack and demonstration platform are known.
- As of 2026-10-06, constitution 1.0.0 is ratified (2026-09-19) and the application is implemented; convergence and acceptance are incomplete (91/97 tasks checked).
- T069, T087, T089, T092, T096 and T097 remain open. The specification still says Draft; its stage owner must reconcile approval evidence, not infer it from implementation.
- Current local evidence and the distinction between merged frontend work and unpublished steps 1–3 are recorded in `specs/001-municipal-employment-portal/implementation-status.md`.
- Municipal production hosting, privacy, retention, branding, and reporting requirements remain unresolved.

## Success direction

The system succeeds when the office spends less time searching and retyping information, no candidate is lost merely because newer CVs arrived, company requests have a visible state, and staff can explain what happened to each referred candidate.
