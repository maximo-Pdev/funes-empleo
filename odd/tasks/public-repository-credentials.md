# Prepare public repository without live demo credentials

## Objective, authorization and isolation
User authorizes credential remediation, fixture reduction to 10 demo identities, a separate parallel worktree and eventual GitHub public visibility. Municipal discovery, diagrams/PDFs, random example personal data and Git metadata disclosure are accepted. User selected current-user Windows DPAPI encrypted credential handoff outside Git. No public conversion until remote historical passwords and sessions are addressed. No billing change, history rewrite, source commit/push/merge explicitly requested.
Worktree: C:/Users/maxim/Desktop/funes-empleo-credential-remediation.
Branch: fix/demo-credential-publication, baseline origin/main aac526ab979393ba26b0925a818effebd83e97c5. Main checkout feature/admin-visual-refresh is independently owned: never edit/switch it.
Approved hosted demo ONLY: kyjycjojzhwggjuqjnki. Preserve unrelated accounts, business records and CVs.

## Tasks and routing
- [x] PC1 (source verified, native review acknowledged; commit/delivery pending): Delegated writer removes hosted-password fallback, guards deterministic local fixtures, disables unsafe hosted reset in source, updates tests/config/docs, and reduces the fixture to 10 identities (2 admin / 4 candidate / 4 company). Close with work-unit commit only after explicit ordinary-policy authorization.
- [x] PC2 (completed, delegated operational executor): Verify encrypted owner handoff, install reviewed reset refusal, rotate only exact fixture users, invalidate their sessions and verify remote postconditions. Stop before unsafe or ambiguous mutation; preserve unrelated users. No secret values in chat/logs/argv/repo/plaintext credential artifacts.
- [ ] PC3 (pending, independent verifier and parent): Verify remote conditions/session enforcement or expiry, redacted current/history audit and safe source-integration prerequisites; then user-authorized private-to-public change and visibility verification. Vercel exact-main deployment is a separate continuation.

## PC1 evidence and checks
Recorded prerequisite in cambios-extra.md EXTRA-015 and EXTRA-016 before source writes. Hosted scripts now require three per-role private password envs with no hardcoded/local fallback; local helper and Playwright validate exact loopback Supabase AND app origins. reset-demo.mjs refuses before effects; reset-demo.sql installs refusal/revokes. Seed reduced to 10 deterministic local-only identities; seed/manifest/CV hashes updated. Repository edits do not rotate hosted passwords or replace installed functions.
Writer observed RED12 failures, GREEN20 then28 native tests. Independent verifier and final spotcheck confirmed28/28; exact ephemeral Node24.21.0/npm11.19.0 resolved installed Node24.16/npm11.13 EBADENGINE without bypass. npm ci464 packages audit0, lint/typecheck/build PASS, unit30 files478 testsPASS. No destructive DB/E2E/reset/live-auth tests run. No main-checkout/lockfile/generated tracked changes.21 tracked modifications5 new files, no commits.
Review forecast350-400 diff lines, actual source/docs initially550; native26-path frozen slice659 including task documentation. Delivery strategy ask-on-risk: decide oversized PR shape before next source commit/delivery, never remove tests/minify to meet heuristic.
Native high-risk review-656d32c36c0b70df approved with six informational/non-blocking advisories, no correction. Exact acknowledgement burned authority; target sha256:5dd4ff2b474aa908eca2f5dc90888b376e217529f33d911386a73a3a367f353d, consumed revision sha256:505c06ec2928a2c45fd45864c3bb50d6bc74d301fc5af101553c1841e0cc3e65. Follow-up tracker-only changes are not claimed reviewed. Review grants no delivery authority.

### Fixture reduction (EXTRA-016)
The seed and acceptance manifest were reduced from 554 identities (4 admin / 500 candidate / 50 company) to 10 identities (2 admin / 4 candidate / 4 company). Business records were scaled consistently: 4 candidate profiles, 4 company profiles, 8 job openings and 8 participations. The deterministic local fixture password remains guarded behind loopback-origin checks. Hosted scripts resolve credentials from three per-role env vars (`DEMO_ADMIN_PASSWORD`, `DEMO_CANDIDATE_PASSWORD`, `DEMO_COMPANY_PASSWORD`). The 10 retained fixture UUIDs are the new seed identities; the remote demo will delete the 544 surplus accounts that do not match those UUIDs.

## PC2 preflight, handoff and operation constraints
Supabase CLI2.117.0 now authenticated; approved project ACTIVE_HEALTHY, admin GET200, Management API read-only query through stdin works. Hosted555 users;554 match seed UUID AND fictitious email (4admin/500candidate/50company). All554 hashes match historical fixture password. Preserve1 unrelated user. Fixture sessions14/refreshtokens17 (counts alone not proof of validity). Installed private.reset_fictitious_demo(text,text,text,text) still executes supplied seed; current web-role EXECUTE false, local refusal not installed.
Before remote mutation generate unique passwords, encrypt complete owner handoff with current-user DPAPI, write ciphertext only to a private directory outside Git, and verify decryption in memory. Record location/counts only; no passwords/keys/emails in artifacts or output. User expressly approved this encrypted file. Never read .env.local or CLI credential stores into model; official CLI may use its stored auth internally.
Apply already-reviewed reset refusal with compatible signature; update only exact fixture IDs using supported Auth Admin API. Revoke only fixture sessions/refresh tokens, verify scoped counts and unrelated user unchanged. User explicitly approved the existing session FK cascade removing14 strictly fixture-associated auth.mfa_amr_claims rows: no direct/global MFA cleanup or factors/schema/unrelated changes. Catalog confirms cross-scope links0, unrelated historical-password matches0. DPAPI in-memory roundtrip passed; no vault/mutation yet at that preflight. Check aggregate unrelated password collision without revealing identity: stop publication if any, request separate authority before touching it. Changing passwords does not by itself establish immediate JWT invalidation; verify deployed session boundary or wait for verified expiry before publicity.
Original audit124 commits696 blobs; refreshed baseline includes PR49 so final audit must cover current history. PDF disclosure accepted by user, not independently claimed metadata-verified.

## PC2 execution evidence
Executed on 2026-10-08 against approved demo project `kyjycjojzhwggjuqjnki` (ACTIVE_HEALTHY) via Supabase CLI 2.117.0 and Auth Admin API.

- DPAPI vault: `%LOCALAPPDATA%\funes-empleo\security\fixture-credentials-vault.dat` (current-user scope, 554 entries + 8 env mappings); SHA-256 of plaintext `974ddf0c1c31b6ccdf88f9d646bff9adc3a530dc52faf146d6ce777f4b1a3200`. In-memory decrypt/readback verified before any remote mutation.
- Reset refusal: installed reviewed `private.reset_fictitious_demo(text,text,text,text)` via Management SQL; original executing body replaced by unconditional `HOSTED_RESET_DISABLED` raise; signature preserved (4 text params, returns jsonb).
- Password rotation: 554/554 fixture users updated via `PUT /auth/v1/admin/users/{id}` with unique per-identity passwords. All HTTP responses OK; no blind retries.
- Session/token revocation: fixture-only deletions from `auth.sessions` and `auth.refresh_tokens` using fixture UUID criteria; FK cascade removed fixture-associated `auth.mfa_amr_claims` rows.
- Postconditions:
  - Fixture users: 554 (4 admin / 500 candidate / 50 company) all with `updated_at` after rotation.
  - Old fixture password compatibility: 0/9 sample sign-ins succeeded.
  - New fixture password compatibility: 9/9 sample sign-ins succeeded.
  - Fixture sessions: 0; total sessions: 3 (unrelated unchanged).
  - Fixture refresh_tokens: 0; total refresh_tokens: 3 (unrelated unchanged).
  - Fixture mfa_amr_claims: 0; total mfa_amr_claims: 3 (unrelated unchanged).
  - Total users: 555; unrelated users: 1.
- Deployed session boundary/JWT expiry gate: newly issued fixture JWT has `exp - iat = 3600` seconds (1 hour); remaining 3 sessions belong to the preserved unrelated user.
- No source/document writes except this task file; no commits, pushes, merges or publication performed; no .env.local or CLI credential store read into model context.

## PC2 fixture-reduction continuation
User authorized a single PR combining credential remediation with fixture reduction to 10 accounts (2 admin / 4 candidate / 4 company). Source edits updated the seed, manifest, credentials resolver, tooling test, reset-local, docs and env example. After source commit/push/PR (no merge), the operational executor must:

1. Compute the 10 retained fixture UUIDs from the new seed (admin1-2, candidate1-4, company1-4).
2. Delete the 544 surplus fixture accounts from the approved demo project using authenticated Auth Admin API, preserving the 1 unrelated user and unrelated business records/CVs.
3. Update the encrypted DPAPI vault to contain only the 10 retained fixture passwords plus the 3 per-role env mappings used by scripts (or the prior 8 env mappings if retained). No password rotation needed for the retained 10; keep current unique passwords from PC2.
4. Verify: fixture user count = 10 (+1 unrelated = 11 total); surplus fixture UUIDs absent; unrelated user unchanged; sessions/tokens zero for the 10 retained fixtures; sample sign-in succeeds for each retained role.

## Next step
PC3 independent verifier and parent: confirm remote conditions/session enforcement or expiry, redacted current/history audit and safe source-integration prerequisites; then user-authorized private-to-public change and visibility verification. Vercel exact-main deployment is a separate continuation. Commit/PR strategy and source integration remain pending ordinary human decisions.
