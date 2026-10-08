# Public repository and credential remediation

## Authorized scope

- Keep one PR: [#50](https://github.com/maximo-Pdev/funes-empleo/pull/50), `fix/demo-credential-publication` → `main`.
- Repair credentials and reduce the **interactive demo** to 2 administrators, 4 companies and 4 candidates. Keep the separate acceptance dataset and all approved quality thresholds.
- The user authorized corrections and merge after successful checks, followed by safe public GitHub visibility and a Vercel **fictitious-data demo**. This does not authorize municipal production.
- Preserve the unrelated Supabase user, their records, immutable history and concurrent admin frontend work. Never print credentials, read `.env.local` into model context, rewrite Git history or bypass protections.
- Irreversible deletion requires fresh human confirmation. YOLO does not override this rule. Real operation requires **zero active fixture accounts** and a resolved synthetic-business-data cleanup plan.

## Workspaces

| Workspace | Purpose |
| --- | --- |
| `C:/Users/maxim/Desktop/funes-empleo-credential-remediation` | Authorized feature branch and this parent-owned ledger |
| `C:/Users/maxim/Desktop/funes-empleo-review-source` | Sequential local source-review branch; not published |
| `C:/Users/maxim/Desktop/funes-empleo` | Concurrent admin frontend task; do not edit or switch |

Baseline: `aac526ab979393ba26b0925a818effebd83e97c5` (PR #49).

## Tasks

- [ ] **PC1 — Finish coherent fixture and credential repair.** In progress: source unit approved; port and exact new CI pending. Interactive seed has 10 identities. Acceptance remains test-only: 4 admins, 500 candidates, 50 companies, 100 openings, 1,000 participations. Preserve unique per-identity hosted credentials, ownership/origin guards, metrics, audit, private journeys and concurrency. Close only after porting the approved correction and observing successful checks.
- [x] **PC2 — Rotate exposed fixture credentials and revoke sessions.** Previously verified: 554 unique rotations, hosted reset refusal, fixture sessions/tokens/AMR `0/0/0`, unrelated user's `3/3/3` preserved. Current-user DPAPI vault outside Git retains 554 entries and 8 older mappings. Do not discard recovery credentials while surplus accounts exist.
- [ ] **PC4 — Retire surplus fixtures safely.** Latest read-only preflight: 555 Auth/accounts, all active/not deleted (554 fixtures + 1 unrelated user), 501 candidate profiles and 50 company profiles. Hard deletion conflicts with FKs and immutable history. Supabase soft deletion is irreversible; access/UI/business-data effects remain untested. No deletion, archival or trigger bypass occurred. Obtain the destructive decision before retirement; update the vault only after a verified outcome.
- [ ] **PC3 — Verify and deliver safely.** Final privacy/readback, required CI and ordinary branch policy; then authorized merge and record SHA. Publish GitHub only after safety prerequisites and verify visibility. Configure/deploy the exact merged `main` to Vercel as a demo, then check alias/SHA, `/ofertas` and critical authentication flows. Repository remains private; PR unmerged; deployment not verified.

## Repair evidence

| Commit | Outcome |
| --- | --- |
| `bdd9362e8982c11a625e7b75be4764af617ba1db` | Initial incomplete reduction; old CI failures retained as history |
| `efd15f4e255f140db232b0a7d81ec608a499d5d3` | Separated acceptance data and restored unique hosted identities |
| `1f24db63ddda617d05d4eab781235565461b2720` | Restored all 13 strict acceptance SQL count assertions |
| `a8f6a3aa93c8773491c4d59a2c89d70cbde35f71` | Foreign CV probe selects candidate 11 for acceptance, 2 for interactive |

The old candidate-2 negative probe was invalid: company 1 legitimately received that candidate in the large dataset. RLS was not weakened.

Observed tooling RED/GREEN sequences: `20/15 → 38`, `40/12 → 52`, `54/1 → 55` (pass/fail → green count). Writer lint, types, build and 478 unit tests passed. Exact `a8f6a3a` Actions run **37793430977** independently confirmed application/database success. Exact CI journey counts were not extracted. That run does not prove the later correction passed.

## Bounded native source review

The complete 41-path candidate exceeded native context capacity before authority creation. One honest review-unit split preserved **all 40 code, tests, configuration, operational docs and `cambios-extra.md`**; only this passive ODD ledger was separate. No original history, PR or behavior was changed to reduce review size.

- Local source unit: `922093dcab7897563189fa4e3d83e790f5739169`, tree `cfb3d481c96e6a9a16ceb9fbc3edd21b5ae8e629`; 40 normalized blobs matched `a8f6a3a`, with 8 additions relative to baseline.
- Native lineage: **`review-e52e285c17d8dae6`**. Four reviewers and the refuter confirmed one critical finding: **R3-E2E-SEED-MISMATCH**. Public `npm run test:e2e` bypassed acceptance setup, unlike CI's full runner.
- Correction: `dd71709f21eab41643a569567563351b104f5531`, tree `70f28517f3454590722b05d6d99cafdca1b0b165`. Five files, **37 additions + 3 deletions = 40 diff lines**, under the accepted 96-line plan and separate frozen 200-logical-correction budget.
- The public command now invokes the existing confirmed local acceptance runner and forwards Playwright arguments directly. Ownership, loopback, confirmation, four-admin concurrency and no-skips controls remain intact.
- RED `56 pass / 1 fail`; GREEN and final repetition **57/57**, zero skips. Pinned Node 24.21.0/npm 11.19.0: locked install, lint, typecheck, build (memory-only fictitious configuration) and **478 unit tests** passed. No live DB/E2E, shared Docker, hosted Auth or vault operations ran here.
- Targeted validator approved. Exact acknowledgement returned **authority burned**, target `sha256:1ae514f2468afc5bda206000548b85dd71588507b5533b27d7c9b5139512b249`, consumed revision `sha256:71fa026ee4930766326923693b3afc69592a22aa028aba630ad56300dcf90699`, evidence `gentle-ai.review-acknowledged/v1`. No STATUS followed the burn.

Approval covers the source unit, **not** the different original tree containing this ledger. Review grants no delivery authority. Fourteen non-blocking advisories remain separate follow-ups; do not reopen the approved candidate to address them.

## Limits and next action

The five-file structural port is complete: 40/40 normalized source blobs match reviewed `dd71709f`; parent ledger bytes were preserved, and tooling passed **57/57** in the original worktree. Original candidate assessment: medium risk, 6 paths/126 diff lines including passive ledger, large runtime writer; self-verification stands, no separate verifier required. Functional CI is still required.

1. Commit only the approved five-file port plus this passive ledger; preserve concurrent work and the one-PR strategy.
2. Commit/non-force push to the same PR. Assess the exact ported candidate and verify new CI; do not reuse the old green run as evidence.
3. Close PC1 only after successful checks, then proceed with PC3 under ordinary repository policy.
4. Keep irreversible retirement and the zero-active-fixture real-use gate explicit. **Rotated passwords and revoked sessions do not mean the accounts are disabled.**

Earlier native attempts are retained, not treated as current approval: `review-999e1e14fb8d9f74` escalated on counts; `review-7582747c459132b2` had a model transport failure; failed start `review-3775c3e08d6dc762` created no lineage and must not be used with STATUS/recovery. The original `review-656d32c36c0b70df` covered older safeguards only.

The DPAPI **ciphertext** checksum is `010ec460ad0be4f40ad831c77d96a730f50a45e86f0a7cbb0e7949f44f8e84af`; the earlier `974ddf…` checksum was for the decrypted payload, not the file. CLI route: `node` plus the main checkout's `node_modules/supabase/dist/supabase.js`, with SQL on stdin and captured/redacted output. Bare CLI PATH failure was not a remote permission failure.

Known notices: unsupported ESLint/unapproved `unrs-resolver` postinstall notice; no policy override. Review-worktree `next-env.d.ts` has no normalized content diff but retains an EOL/stat dirty marker; it was not staged.
