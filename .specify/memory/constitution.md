<!--
Sync Impact Report
- Version change: unratified template -> 1.0.0
- Modified principles:
  - Template principle 1 -> I. Municipal Mission and Intermediation
  - Template principle 2 -> II. Privacy and Security by Design
  - Template principle 3 -> III. Traceability and Record Integrity
  - Template principle 4 -> IV. Accessibility and Inclusive Service
  - Template principle 5 -> V. Specification-Driven Simplicity and Quality
  - Added principle VI. Responsible Use of Artificial Intelligence
- Added sections:
  - Technical Constraints
  - Development Workflow and Quality Gates
- Removed sections: none; template placeholders were replaced
- Follow-up TODOs: none
-->

# Funes Municipal Employment Portal Constitution

## Core Principles

### I. Municipal Mission and Intermediation

The product MUST solve the operational needs of the Funes Employment Office and preserve the
municipality as the intermediary between candidates and employers. The administrative workflow is
the core product: staff MUST be able to organize candidates, moderate openings, perform
preselection, decide referrals, record outcomes, and follow each case. Companies MUST NOT browse
the general candidate pool or contact arbitrary candidates through the system. Complete candidate
information MUST become available to a company only after an authorized municipal referral to
that company's opening. Product decisions MUST prioritize reduced manual work, continuity of
service, and explainable outcomes over marketplace-style growth or unmediated contact.

### II. Privacy and Security by Design

Private data and actions MUST be protected by authenticated, authorized access enforced on the
server and in the data store; hiding interface controls alone is insufficient. Every administrator
MUST use an individual account, and shared administrative credentials are prohibited. Development,
tests, demonstrations, fixtures, screenshots, prompts, and repository content MUST use fictitious
or properly anonymized data. Real CVs, DNI numbers, contact details, credentials, tokens, private
keys, production exports, and secret-bearing environment files MUST NOT enter source control or AI
systems. CVs and all external input MUST be validated and protected according to their sensitivity.
Collection, visibility, consent, retention, and sharing MUST follow approved requirements; open or
provisional privacy decisions MUST remain explicit and MUST NOT be invented during implementation.

### III. Traceability and Record Integrity

Important workflow transitions and administrative actions MUST retain the responsible actor,
timestamp, previous state, new state, and reason when required by an approved rule. Application,
opening, referral, interview, outcome, contact, import, suspension, and other material histories
MUST remain reconstructable for authorized staff. Business records MUST use recoverable archival
or soft-deletion behavior until an approved retention rule explicitly permits permanent deletion.
Imports and migrations MUST be reviewable, validate integrity before committing changes, and
provide an all-or-nothing or otherwise safely recoverable result. Audit history MUST NOT be silently
rewritten to conceal prior states or responsible actors.

### IV. Accessibility and Inclusive Service

The product MUST provide a responsive, keyboard-accessible interface with clear Spanish-language
labels, instructions, validation, status information, empty states, and error messages. Candidate
service MUST support both self-service and assisted in-person workflows so that lack of digital
skills or access does not exclude a person. Authorized staff MUST be able to create and maintain
assisted candidate profiles while preserving the same privacy, authorization, duplicate-detection,
and history safeguards required for self-service profiles. Accessibility and assisted
service MUST be acceptance concerns for every relevant feature, not optional polish.

### V. Specification-Driven Simplicity and Quality

Implementation MUST follow reviewed and approved Spec Kit artifacts in their established order.
The team MUST NOT implement unapproved requirements, silently resolve open questions, or treat
generated artifacts as automatically correct. Designs MUST use the simplest approach that satisfies
the approved MVP and MUST justify added dependencies, infrastructure, abstractions, or workflow
complexity. Shared catalogs, roles, permissions, and workflow states MUST be centralized rather
than duplicated as unrelated values. Authentication, permissions, opening moderation, application
transitions, candidate referral, and data import MUST receive automated coverage, supplemented by
manual verification of critical end-to-end flows.

### VI. Responsible Use of Artificial Intelligence

AI-generated code, specifications, plans, migrations, tests, dependencies, and configuration MUST
be treated as unreviewed work until a developer verifies them against the approved requirements,
this constitution, and the relevant plan. AI systems MUST NOT invent requirements or resolve items
marked open, provisional, inferred, or unconfirmed. They MUST NOT receive real personal data,
production credentials, private keys, real CVs, or unrestricted secret files. A developer remains
accountable for understanding, testing, validating, and approving every AI-assisted change before
it is merged or demonstrated.

## Technical Constraints

The training baseline is mandatory for the project:

- The web application MUST use Next.js with React.
- Application code MUST use TypeScript.
- Interface styling MUST use Tailwind CSS.
- The development runtime MUST be Node.js 24 LTS, with npm as the package manager.
- Persistent relational data and authentication MUST use Supabase with PostgreSQL.
- Version control and collaboration MUST use Git and GitHub.
- The course demonstration MUST be published with Vercel.

Exact compatible package versions, application structure, routing, schema, migrations,
authentication and session flows, administrator provisioning, authorization boundaries, CV
storage, testing tools, environment separation, deployment configuration, logging, observability,
backup, and recovery MUST be decided and documented during `$speckit-plan`. No alternative
framework, database, authentication provider, package manager, deployment provider, or
infrastructure layer may be introduced without a documented and approved technical reason.
Vercel is authoritative for the course demonstration; municipal production hosting and operational
ownership remain open until the authorized stakeholders decide them.

Open, provisional, inferred, or unconfirmed product and legal questions MUST remain recorded in
`docs/discovery/OPEN_QUESTIONS.md` with their decision owner. A plan or implementation MUST NOT
convert a temporary safe position into stakeholder approval.

## Development Workflow and Quality Gates

Work MUST occur on focused branches and MUST NOT be implemented directly on `main`. Every change
destined for `main` MUST be submitted through a focused Pull Request with a clear description of
behavior, verification evidence, limitations, and any follow-up work. One developer MUST own each
Spec Kit stage or overlapping subsystem at a time; the second developer MUST review the resulting
Pull Request and MUST avoid concurrent edits to the same files. Approval is not equivalent to a
merge, and the team MUST confirm the merge before synchronizing local `main` branches.

The MVP workflow MUST proceed one reviewed stage at a time:
`constitution -> specify -> clarify -> plan -> checklist -> tasks -> analyze -> implement ->
converge`. Application implementation MUST NOT begin until the constitution, specification,
clarifications, plan, checklist, task breakdown, and analysis have been reviewed and approved.
Approved feature specifications govern feature scope and acceptance criteria; approved plans
govern architecture for that scope.

Before a change is considered complete, all applicable type checks, lint checks, automated tests,
and the production build MUST pass. Critical user flows MUST also be checked manually. Review MUST
cover authorization, validation, privacy, accessibility, responsive behavior, loading and empty
states, user-safe errors, auditability, and protection against destructive data loss. Relevant
documentation MUST be updated when a business rule, contract, setup step, environment variable,
migration, or user-visible behavior changes. No change may be considered complete if it introduces
real personal data or secrets.

## Governance

This constitution is the highest authority for stable project principles and engineering
governance. `AGENTS.md` supplies repository working instructions consistent with it. Within an
approved feature, the reviewed `spec.md` governs scope and acceptance criteria, and the reviewed
`plan.md` governs technical design. Discovery documents provide evidence and shared context but
MUST NOT silently override an approved specification or resolve an open decision.

Amendments MUST be made on a dedicated branch, documented with rationale and impact, and reviewed
through a Pull Request by the other developer. An amendment is effective only after approval and
merge. If an amendment changes approved feature artifacts or implemented behavior, the amendment
MUST identify the affected artifacts and the required migration or follow-up work.

Constitution versions follow semantic versioning:

- MAJOR for removal or backward-incompatible redefinition of a principle or governance rule.
- MINOR for a new principle or materially expanded governance requirement.
- PATCH for clarifications and non-semantic wording corrections.

Every specification, plan, task breakdown, implementation review, and Pull Request MUST include a
constitution compliance check appropriate to its scope. Reviewers MUST block unexplained
violations. Any necessary exception MUST be explicit, narrowly scoped, justified in the governing
artifact, and approved before implementation; repeated or principle-level exceptions require a
constitutional amendment.

**Version**: 1.0.0 | **Ratified**: 2026-09-19 | **Last Amended**: 2026-09-19
