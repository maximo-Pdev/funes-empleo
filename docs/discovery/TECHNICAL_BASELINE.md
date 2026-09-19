# Technical baseline

## Status and purpose

This document records the technologies and environment guidance established by the official Funes Tech Lab course material. It is authoritative for the training stack but does not replace the architecture decisions, security design, acceptance criteria, or task breakdown produced through Spec Kit.

The implementation plan must use this baseline unless the instructors explicitly approve a change.

## Required stack

| Area | Technology | Intended use |
| --- | --- | --- |
| Web application | Next.js with React | User interfaces, routes, and server-side application functions |
| Language | TypeScript | Typed application code and compile-time checks |
| Styling | Tailwind CSS | Responsive visual styling with utility classes |
| Runtime and packages | Node.js 24 LTS and npm | Run Next.js and manage dependencies |
| Data and authentication | Supabase with PostgreSQL | Persistent relational data and user authentication |
| Version control | Git and GitHub | Repository management, branches, pull requests, and collaboration |
| Demonstration hosting | Vercel | Publish the course demonstration on the internet |

Exact Next.js, TypeScript, Tailwind CSS, Supabase client, and testing package versions are not defined by the source material. They must be selected deliberately in the implementation plan and recorded in the lockfile.

## Local prerequisites

Each developer should have:

- Node.js 24 LTS.
- npm, included with Node.js.
- Git.
- A code editor such as Visual Studio Code.
- Access to the shared GitHub repository.

The team will also need shared project access in Supabase and Vercel. Each person should use an individual account and invitation. Passwords and personal access credentials must not be shared through Git, source files, issues, prompts, or chat.

Next.js, React, TypeScript, and Tailwind CSS should be installed as project dependencies rather than global packages.

## Not initially required

The course guide states that the following are not necessary at the current preparation stage:

- Docker.
- A local PostgreSQL installation.
- Supabase CLI.
- Vercel CLI.
- Postman, because APIs can initially be explored from the browser.
- Extra Visual Studio Code extensions unless the instructors or approved plan later require them.

These tools may be introduced later only when the approved plan identifies a concrete need.

## AI-assisted development

The team uses Codex as its primary programming assistant. Google Antigravity is mentioned by the course only as an optional alternative and is not a project dependency.

AI-generated work must be treated as unreviewed code until a developer verifies it. In particular:

- Compare behavior with the approved specification, plan, and tasks.
- Review authentication, authorization, database policies, migrations, file uploads, and external dependencies carefully.
- Run type checking, linting, automated tests, and a production build.
- Manually verify the critical candidate, company, and administrator flows.
- Do not provide AI systems with production credentials, private keys, real personal data, or real CVs.

## Data and secret safety

- Use fictitious or properly anonymized data during development, demonstrations, tests, and screenshots.
- Never commit real CVs, DNI numbers, phone numbers, addresses, passwords, access tokens, service-role keys, private keys, or production exports.
- Keep `.env.local` and equivalent secret-bearing files outside Git.
- Commit a safe `.env.example` containing only variable names, descriptions where useful, and non-secret placeholders.
- Use separate permissions and secrets for local development, previews, and any future production environment.
- Supabase authorization must not rely only on interface visibility. Server-side checks and appropriate database policies must enforce access.

## Decisions reserved for the plan

`$speckit-plan` must define at least:

- Next.js application structure and routing approach.
- The selected compatible package versions.
- Supabase project ownership and collaborator access.
- Database schema, migrations, seed data, and recovery strategy.
- Authentication, session, administrator provisioning, and account-recovery flows.
- Row-level security and server-side authorization boundaries.
- CV file storage, validation, permissions, and retention behavior.
- Application, opening, referral, and outcome state models.
- Test strategy and tools.
- Environment variables and separation between local, preview, and demonstration environments.
- Vercel deployment and Supabase integration.
- Logging, error handling, audit history, accessibility, and responsive-interface strategy.

## Initial implementation run

After the constitution, specification, clarification, plan, checklist, tasks, and analysis have been reviewed, one developer may ask Codex to execute the approved MVP implementation as a broad initial run.

That run must:

- Start from an updated `main` on a dedicated implementation branch.
- Read all required repository context and active Spec Kit artifacts.
- Stay within the approved MVP and surface unresolved decisions instead of inventing them.
- Work through the approved task list and preserve traceability to requirements.
- Avoid real personal data and secrets.
- Finish with test, type-check, lint, and production-build results.
- Document remaining limitations and follow-up tasks for review.

The second developer should review the result and create focused follow-up work rather than editing the same implementation files concurrently.
