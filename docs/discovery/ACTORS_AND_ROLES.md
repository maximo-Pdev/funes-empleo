# Actors and roles

## Public visitor

Can:

- View public employment information.
- Browse published and currently open job openings.
- Start candidate or company registration.

Cannot:

- Apply without a candidate account.
- View candidate information.
- Access administrative information.

## Candidate

Can:

- Register, verify access, sign in, recover access, and sign out.
- Maintain only their own profile and CV.
- Select multiple employment categories and job interests.
- Browse published openings and apply to several openings.
- View the status information the office chooses to expose.
- Withdraw an active application or deactivate their availability.
- Request correction or deletion of their personal data.

Cannot:

- Access other candidates.
- See internal municipal notes.
- Contact companies through an unmediated candidate directory.
- Change administrative workflow decisions.

## Company user

Can:

- Register, sign in, recover access, and maintain its company profile.
- Draft and submit job openings.
- View the moderation state of its own openings.
- View candidates referred by the Employment Office to its own openings.
- Record or communicate outcomes for those referrals.

Cannot:

- Publish an opening without municipal review.
- Browse the complete candidate pool.
- View candidates referred to another company.
- Access internal municipal notes.
- Create administrator accounts.

The MVP does not require company documentation. Email confirmation proves account access, not company legitimacy. Administrators may suspend abusive or inappropriate accounts.

## Employment Office administrator

There are four municipal employees. Each has a separate account, and all four have the same full administrator permissions.

Can:

- Manage candidates, companies, categories, openings, applications, referrals, outcomes, contacts, training references, imports, and reports.
- Create assisted candidate profiles for in-person service.
- Review and moderate company openings.
- Search the candidate pool and initiate a preselection.
- Refer candidates to companies.
- Record internal notes and workflow history.
- Suspend or reactivate accounts and content.
- Import legacy data and export operational information.

Important constraint:

- Full permissions do not justify a shared login. Every action must retain the responsible administrator's identity.

## Permission summary

| Capability | Public | Candidate | Company | Administrator |
|---|---:|---:|---:|---:|
| Browse published openings | Yes | Yes | Yes | Yes |
| Apply to an opening | No | Own account | No | On behalf of candidate |
| Edit candidate profile | No | Own profile | No | Yes |
| Browse full candidate pool | No | No | No | Yes |
| Draft company opening | No | No | Own company | Yes |
| Publish company opening | No | No | No | Yes |
| View referred candidate | No | Own status | Own opening only | Yes |
| Record internal notes | No | No | No | Yes |
| View metrics and imports | No | No | No | Yes |

## Future roles

Do not add additional roles until a real need is confirmed. Possible future roles include read-only reporting, limited interviewer, or municipal supervisor, but they are outside the current MVP.
