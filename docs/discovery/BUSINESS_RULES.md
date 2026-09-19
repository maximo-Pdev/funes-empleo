# Business rules and recorded decisions

Status labels:

- **Confirmed:** stated by the stakeholder or explicitly decided in class.
- **Project decision:** selected by the team as the safest MVP behavior.
- **Provisional:** usable for specification work but requires municipal confirmation before production.

## Accounts and permissions

- **BR-001 — Confirmed:** Candidates and companies register and sign in.
- **BR-002 — Confirmed:** Four Employment Office employees use the system with full administrator permissions.
- **BR-003 — Project decision:** Every administrator uses an individual account; shared administrator credentials are prohibited.
- **BR-004 — Project decision:** Administrator accounts are created administratively and cannot be registered through the public site.
- **BR-005 — Project decision:** Public users may browse published openings, but applying requires a candidate account.

## Companies and openings

- **BR-010 — Confirmed:** Company documentary verification is not required in the MVP because the current office does not perform it.
- **BR-011 — Project decision:** Lack of documentary verification does not imply automatic publication. Every company opening requires municipal moderation.
- **BR-012 — Project decision:** Administrators can suspend company accounts or openings that are abusive, misleading, illegal, duplicated, or inappropriate.
- **BR-013 — Project decision:** Opening states are `draft`, `pending_review`, `changes_requested`, `published`, `paused`, `closed`, `rejected`, and `cancelled`, subject to refinement during specification.
- **BR-014 — Project decision:** Only `published` openings are publicly visible and accept applications.

## Candidates

- **BR-020 — Confirmed:** A candidate may be suitable for and interested in multiple occupational categories.
- **BR-021 — Confirmed:** A candidate may participate in multiple job searches.
- **BR-022 — Project decision:** Candidate categories come from a controlled catalog, while skills may also include free text.
- **BR-023 — Project decision:** A candidate can create an account before completing the profile but cannot apply until required profile information and a valid CV are present.
- **BR-024 — Project decision:** Staff can create an assisted candidate record without public credentials. A future claiming flow must avoid duplicates.
- **BR-025 — Project decision:** Profiles not confirmed or updated for six months are marked `needs_update` and excluded from default active-match results, but are not automatically deleted.
- **BR-026 — Project decision:** DNI and email are duplicate-detection keys. Suspected duplicates require review rather than silent overwriting.

## Applications, referral, and outcomes

- **BR-030 — Confirmed:** The Employment Office performs a preselection before sending candidates to a company.
- **BR-031 — Confirmed:** The municipality must remain between the initial application and company referral.
- **BR-032 — Project decision:** A company cannot browse the general candidate pool.
- **BR-033 — Project decision:** Complete candidate details and CV become visible to a company only after municipal referral to that company's opening.
- **BR-034 — Project decision:** Candidate/application progression begins with `received`, `under_review`, `preinterview`, `preselected`, `referred`, and `company_interview` and ends in `hired`, `not_selected`, `withdrawn`, or `cancelled`. Clarification may refine names and allowed transitions.
- **BR-035 — Project decision:** Every status transition records timestamp and responsible actor; administrative transitions may require a reason.
- **BR-036 — Confirmed:** A candidate who is not selected may return to the active candidate pool and be considered for another opening.
- **BR-037 — Confirmed:** The office may direct candidates toward employability training.

## Data, communication, and metrics

- **BR-040 — Project decision:** Existing Excel information is imported through a reviewed CSV mapping with preview, validation, and duplicate handling.
- **BR-041 — Project decision:** The MVP records communications but does not integrate directly with the WhatsApp API.
- **BR-042 — Confirmed:** The office needs operational indicators and may be asked for information by the municipality or province.
- **BR-043 — Project decision:** Initial metrics include active candidates, companies, openings by state, applications, pre-interviews, referrals, hires, non-selections, withdrawals, and period/category breakdowns.
- **BR-044 — Provisional:** Business records are archived or soft-deleted. Automatic permanent deletion is prohibited until the municipality approves retention and legal rules.
- **BR-045 — Provisional:** Candidate consent must cover storage of employment data and sharing the profile with a company only after referral.

## Rules deliberately deferred

- Company document verification and validation workflow.
- Automated candidate ranking or AI matching.
- Direct WhatsApp API messages.
- Full CV generation.
- Automatic training recommendations.
- Additional administrator permission levels.
