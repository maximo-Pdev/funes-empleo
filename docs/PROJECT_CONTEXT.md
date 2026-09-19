# Funes Employment Portal — Project context

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

## Current state

- The repository and `main` branch exist.
- Spec Kit 1.0.8 is initialized for Codex using PowerShell scripts.
- Managed Spec Kit files pass `specify integration status`.
- Discovery documentation is being established.
- Technology stack, hosting, constitution, feature specification, plan, and task breakdown remain undecided.

## Success direction

The system succeeds when the office spends less time searching and retyping information, no candidate is lost merely because newer CVs arrived, company requests have a visible state, and staff can explain what happened to each referred candidate.
