# Open questions and validation backlog

These questions must not be silently answered by implementation. Defaults listed here are temporary assumptions for discussion, not stakeholder approval.

## Must be resolved before the first production release

| ID | Question | Current safe position | Decision owner |
|---|---|---|---|
| OQ-001 | What retention period applies to candidate profiles, CVs, contact history, and audit records? | Archive; do not permanently delete automatically. | Municipality / authorized legal or data owner |
| OQ-002 | What exact consent and privacy notice must candidates accept? | Explicit consent for employment processing and post-referral sharing. | Municipality |
| OQ-003 | Which fields are legally and operationally required for a candidate? | Minimize collection; retain only fields justified by the workflow. | Employment Office |
| OQ-004 | Which candidate data may a referred company view and download? | Minimum necessary profile and CV only after referral. | Employment Office / Municipality |
| OQ-005 | What are the required provincial or municipal report formats? | Provide internal metrics and generic CSV export first. | Employment Office |
| OQ-006 | Where will the production system be hosted and who owns operations, backups, and incident response? | Undecided; address during technical planning. | Beex / Municipality |

## Must be resolved during specification and clarification

| ID | Question | Current safe position | Decision owner |
|---|---|---|---|
| OQ-010 | What is the final controlled category and occupation catalog? | Start from the existing catalog, remove duplicates, and allow multiple selections. | Employment Office |
| OQ-011 | What exact fields and evidence are required in a company profile and opening? | No documents in MVP; collect only contact and operational opening data. | Employment Office |
| OQ-012 | Can administrators directly nominate a candidate who did not self-apply? | Yes, but record who initiated it and confirm candidate interest before referral. | Employment Office |
| OQ-013 | Which status changes are visible to candidates and companies? | Expose useful progress; hide internal notes and sensitive reasons. | Employment Office |
| OQ-014 | Who records the company interview outcome: company, administrator, or both? | Company may submit; administrator confirms the final state. | Employment Office |
| OQ-015 | What should happen when a company never reports an outcome? | Allow staff follow-up and an explicit `awaiting_feedback` condition. | Employment Office |
| OQ-016 | Is a PDF CV mandatory for every referral, including staff-assisted records? | Required before external referral; staff may help create or digitize it. | Employment Office |
| OQ-017 | Which file-size limit and document formats are acceptable? | PDF only for MVP; exact size decided in planning. | Technical plan / Municipality |
| OQ-018 | What is the complete mapping of the existing Excel workbook? | Require an anonymized sample and written mapping before importer implementation. | Employment Office |
| OQ-019 | How are courses represented: simple notes/links or managed entities? | Begin with a simple referenced training record. | Employment Office |

## Technical decisions intentionally deferred to `$speckit-plan`

- Frontend framework and application architecture.
- Backend language and framework.
- Database and migration tooling.
- Authentication provider or library.
- File-storage provider.
- Email provider.
- Hosting and deployment platform.
- Observability, backup, and recovery tooling.
- CI pipeline and test frameworks.

## Evidence that still needs collection

- An anonymized copy of the current Excel column structure.
- The current form fields and category list exported in a usable format.
- Examples of real company requests, anonymized.
- Examples of reports requested by the municipality or province.
- Confirmation of the four intended administrator users and how their accounts will be provisioned.
- Municipal visual identity and accessibility requirements.
