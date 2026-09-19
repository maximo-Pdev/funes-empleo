# Discovery requirements

These requirements capture the agreed discovery baseline. They are inputs to `$speckit-specify`, not a replacement for the generated and reviewed feature specification.

Priority meanings:

- **Must**: required for the MVP to solve the current operational problem.
- **Should**: valuable for the first usable release if time permits.
- **Could**: explicitly deferred unless the plan demonstrates low cost and no risk to Must items.

## Authentication and access

- **FR-001 — Must:** Candidates and companies can register and sign in with individual accounts.
- **FR-002 — Must:** Administrators use individually created accounts; public administrator registration is prohibited.
- **FR-003 — Must:** Users can recover account access securely.
- **FR-004 — Must:** Server-side authorization protects every private action and record.
- **FR-005 — Must:** Administrators can suspend and reactivate candidate or company access.

## Candidate management

- **FR-010 — Must:** Candidates can create and maintain their own structured profile.
- **FR-011 — Must:** Administrators can create and maintain an assisted profile for an in-person candidate.
- **FR-012 — Must:** A candidate can select multiple occupational categories and job interests.
- **FR-013 — Must:** A candidate can upload and replace a PDF CV subject to file validation.
- **FR-014 — Must:** Candidate duplication is detected using DNI and email, with an administrator-controlled resolution process.
- **FR-015 — Must:** Candidate availability and profile freshness are visible to staff.
- **FR-016 — Should:** An assisted profile can later be claimed by its candidate without creating a duplicate.
- **FR-017 — Could:** Generate a formatted CV from structured profile data.

## Company and opening management

- **FR-020 — Must:** Companies can maintain their own organization profile without documentary verification in the MVP.
- **FR-021 — Must:** Companies can create and edit draft job openings.
- **FR-022 — Must:** Companies submit openings for municipal review.
- **FR-023 — Must:** Administrators can approve, request correction, reject, pause, close, or cancel openings.
- **FR-024 — Must:** Only approved and published openings are publicly discoverable.
- **FR-025 — Must:** Openings capture structured requirements, location, work conditions, vacancies, categories, and closing information.

## Applications and municipal intermediation

- **FR-030 — Must:** A signed-in candidate can apply to multiple published openings.
- **FR-031 — Must:** Administrators can associate an active candidate with an opening when acting on an identified opportunity.
- **FR-032 — Must:** Administrators can search and filter candidates by categories, skills, availability, location, and profile freshness.
- **FR-033 — Must:** Administrators can record pre-interviews, internal notes, decisions, and contact events.
- **FR-034 — Must:** Administrators decide which candidates are referred to a company.
- **FR-035 — Must:** Companies see complete information only for candidates referred to their own opening.
- **FR-036 — Must:** The system records the complete status history with date and responsible actor.
- **FR-037 — Must:** The final outcome distinguishes hired, not selected, withdrawn, and other approved terminal states.
- **FR-038 — Should:** Staff can associate an unsuccessful candidate with a relevant training opportunity or recommendation.

## Legacy data and reporting

- **FR-040 — Must:** Administrators can import candidate data from a controlled CSV derived from the existing Excel workbook.
- **FR-041 — Must:** Import provides preview, validation errors, duplicate detection, and an all-or-nothing or safely recoverable result.
- **FR-042 — Must:** Administrators can view counts for candidates, companies, openings, applications, referrals, and hires by period and state.
- **FR-043 — Must:** Administrative data can be exported to CSV without exposing it publicly.
- **FR-044 — Should:** Dashboards include category trends and approximate time-to-fill.

## Communication and audit

- **FR-050 — Must:** Staff can record phone, email, WhatsApp, and in-person contact events.
- **FR-051 — Should:** The interface provides message templates or safe links without requiring direct WhatsApp API integration.
- **FR-052 — Must:** Important administrative changes retain actor, timestamp, previous state, and new state where applicable.
- **FR-053 — Must:** Internal notes are invisible to candidates and companies.

## Quality attributes

- **NFR-001 — Must:** The product is responsive and usable on common mobile and desktop sizes.
- **NFR-002 — Must:** Core interactions are keyboard accessible and use clear Spanish labels, validation, and errors.
- **NFR-003 — Must:** Sensitive records require authenticated, authorized access.
- **NFR-004 — Must:** Real personal data never appears in source control, fixtures, screenshots, or automated tests.
- **NFR-005 — Must:** Uploaded content is type- and size-validated and cannot be executed as application code.
- **NFR-006 — Must:** Business records use recoverable archive or soft-delete behavior until a retention policy is approved.
- **NFR-007 — Must:** Critical workflow and permission behavior has automated tests.
- **NFR-008 — Must:** Errors do not expose credentials, personal data, stack traces, or internal implementation details to end users.
