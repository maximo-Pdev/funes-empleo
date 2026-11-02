# Manual test accounts

This is a small, disposable manual-testing dataset, not the automated acceptance fixture or municipal production data. Both local Supabase and hosted project `kyjycjojzhwggjuqjnki` use the identities below, with **different private passwords for every account and environment**. No email was sent to `prueba.com`; ownership of that domain is not assumed.

## Accounts

| Email | Initial state | Purpose |
| --- | --- | --- |
| `admin1@prueba.com` | Active administrator | Primary administration and workflow actor |
| `admin2@prueba.com` | Active administrator | Independent actor, stale-version conflicts, admin access safeguards |
| `postulante1@prueba.com` | Verified, active, complete profile and fictional PDF CV | Candidate self-service, applications, consent, CV and photo changes |
| `postulante2@prueba.com` | Email unverified; no linked profile | Verification denial, then assisted-profile linkage and second-owner tests |
| `empresa1@prueba.com` | Active | Opening moderation, referrals, interviews and company feedback |
| `empresa2@prueba.com` | Active | Independent company and cross-company access denial |
| `empresa3@prueba.com` | Verified Auth identity, suspended portal account/profile | Suspension denial; reactivation, profile completion, archival and restoration |

Seven logins minimize identities by reusing them **sequentially**. They do not represent every workflow state simultaneously and do not establish that all application flows have been tested.

## Private credential access

Credentials are outside Git, protected by Windows current-user DPAPI encryption. On the operator's PC, open:

`C:\Users\maxim\AppData\Local\funes-empleo\manual-test-accounts-20261025\Ver-cuentas.cmd`

The viewer shows environment, email, password, role and initial scenario. It decrypts into a local window; passwords are not printed in this document or stored in application configuration. Do not commit or attach plaintext credentials, screenshots containing passwords, session cookies or tokens. Share any needed access with the teammate through a private channel. DPAPI ciphertext alone is not portable to the teammate's Windows account.

## Local login recovery (2026-10-26)

The local database was found with 554 automated `@example.invalid` identities and
none of the seven manual identities. An additive recovery restored the seven
manual logins using their existing **local** passwords in the private viewer.
The existing 554 identities and their business data were preserved; no reset,
password rotation or hosted operation was performed.

The recovered local candidate1 has a **draft** self-service profile with fictitious
private data and an email contact, not the complete profile described in the
original starting records below. No CV, consent, openings, applications, referrals,
or assisted/archived/stale profile scenarios were recreated. The three manual
company profiles were restored; company3 remains suspended and candidate2 remains
unverified without a linked profile. The original scenario list below describes
the initial dataset, not the complete state of this recovered local database.

## Original starting records

- Four fictitious candidate profiles: active self-service candidate (`99000001`); assisted draft reserved for the second candidate (`99000002`); archived assisted profile (`99000003`); stale assisted profile requiring an update (`99000004`). The numbers are fixtures, not real identity information.
- The assisted draft uses `postulante2@prueba.com`. Complete and activate it through the administrator's assisted-profile workflow before testing in-person linkage. After deliberately confirming the second Auth email in the test environment, use the same DNI and email; do not create a conflicting independent profile.
- Two published openings, one for each active company, plus a draft opening for company1. No applications or referrals are preloaded: begin with a fresh application through the interface. Additional openings can reuse the same accounts.
- One real fictional PDF in private Storage for the active self-service candidate. No photo is preloaded, allowing an actual upload test. New accounts do not automatically inherit old records or files.
- Existing job categories, consent policies, schema, migrations, Storage buckets and access policies are retained. Previously generated bulk test data and files are removed.

## Suggested sequence

1. **Initial access:** sign in as each role. Verify that `postulante2` is rejected for unverified email and `empresa3` cannot use protected portal operations. Distinguish an Auth password login from authorization to use portal features: a suspended identity may still authenticate but its portal access must be rejected.
2. **Assisted work and ownership:** use an admin to complete the assisted draft. Test unlinked-profile editing before the claim. Confirm `postulante2` through a controlled test-environment administrative action, not by sending messages to the test domain. Complete in-person linkage; then test that each candidate cannot read or modify the other's private data. Changing the email confirmation state is a deliberate later fixture change, not part of the initial dataset.
3. **Openings:** with company1, submit the draft; with an admin, request changes, approve or reject. Use separate openings for irreversible/terminal branches. Test published editing/resubmission, pause/resume, close, cancel and suspension/restoration.
4. **Participation:** apply as candidate1. Review, record the preinterview, preselect, refer to company1, record interview and company feedback, and confirm the outcome as an admin. Before referral, company1 must not see the full candidate or CV; company2 must remain denied after referral only to company1. Repeat with separate candidate/opening pairs for rejection, withdrawal, cancellation, hiring and overdue-company cases. Hiring changes global consent/referral access, so test it last or explicitly reconsent and reactivate before further scenarios.
5. **Candidate lifecycle:** sequentially test unavailable/available, stale-profile update, consent withdrawal/reacceptance, CV replacement, photo upload/replacement/removal, suspension/reactivation and account archival. Reconsent does not silently restore previously revoked referrals. Use the separate archived and stale assisted profiles for historical restoration/freshness starting states.
6. **Company lifecycle:** reactivate company3 from an administrator account; restoration may require completing the company profile. Use this third company for suspension/archive tests while company1 and company2 stay active for ownership-denial tests.
7. **Remaining office flows:** use fictitious import rows for preview/errors/duplicates/confirmation, assisted contacts and notes, search and filters, reports/CSV, audit actor attribution, version conflicts, logout and session rejection. Clock-dependent expirations need an explicitly controlled fixture clock/preparation; do not age unrelated records accidentally.

A requested password-reset email, delivery test or real verification-link journey requires an owned mailbox/domain and separate authorization. The current domain is only a login identifier.

## Reset warning

`npm run test:e2e`, `npm run test:db` and local reset scripts replace the local database with their own automated fixture. They will overwrite these curated manual accounts. Do not run them to verify this dataset. The disabled historical hosted reset remains disabled; the one-off maintenance operation is not a supported reusable reset command.

## Verification scope

Real Auth logins, unverified-email rejection, portal role/status projection, suspended protected-operation denial, candidate/admin profile-reference access, company arbitrary-candidate denial, private CV byte download, un-referred company CV denial, anonymous denial, and sign-out were exercised in both environments. Storage uploads were downloaded and SHA-256 checked; old objects were removed through the Storage API, and sampled old paths returned not found. Schema/catalog/migration/bucket preservation and exact identity manifests are checked separately in the operation receipt. Full interactive business journeys and mail delivery are not claimed as executed.
