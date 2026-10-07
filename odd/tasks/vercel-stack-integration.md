# Vercel stack integration

## Intent and authority
Complete the pending merge and create one aggregate PR into main, for the owner to merge. No main merge, deployment, force-push, reset or abort. Preserve empty redeploy d0c98cd and #42 timeout; integrate #42/#43/#44, exclude #45. Existing Git identity maps to GitHub maximo-Pdev (aadf25d metadata verified). Production 6b3dd8c blocked because author MateoMansillaDev lacked Vercel access; production success is not guaranteed by opening a PR.

## Plan and constraints
Branch chore/integrate-reviewed-stack; single aggregate PR requested, nonclosing Refs #40 (status:approved). Forecast ~1800 inherited authored lines plus ~570 generated lockfile diff lines; review burden is large but original units were reviewed separately. No new product code or approval inferred from Draft spec. Required context read. Existing native review review-3ea33c41948bdb33 approved/acknowledged exact pending candidate beeb52bc, 12 files/445diff lines. main contains only #41; final public stack tree5fc2789 must merge without losing later #42 timeout/docs. No installs/local database reset/environment contents read; normal generated verification outputs allowed.

## Tasks
- [x] T1: Complete pending merge. Parent bounded Git route; diff/index checks passed, owner-authored merge b21cb08 has parents d0c98cd/2374b84; staged changes preserved and no merge remains. Dedicated integration branch created.
- [x] T2: Integration merge 2399cd9 combines b21cb08 and 5fc2789. No conflicts; 17 documentation-only files added by final merge, identical executable trees to reviewed b21cb08. Delegated verifier passed typecheck/lint/coverage/build/diff check (452 tests); all old stack ancestors present, #45 and its unique design commit absent. Current/merge author and committer match GitHub-mapped aadf25d. Passive docs do not trigger a new native review.
- [ ] T3 (in progress): Push integration branch, create PR into main with Refs #40 and type:chore, verify exact-head CI/Vercel preview. Parent delivery + delegated CI verification; human retains merge/deploy.

## Acceptance and evidence
All reviewed stack changes and timeout preserved; #45 excluded; no conflicts/secrets. Typecheck/lint/coverage/build after integration; isolated CI for PostgreSQL/full E2E (local Docker absent). Test-first inapplicable to integration of previously tested behavior; inherited CI does not prove final candidate passes. Verify new commits map to maximo-Pdev and Vercel preview succeeds. Track final checks honestly.

## Next step
Commit this progress record, publish branch and open PR. Final inherited aggregate: 37 tracked files/2460 changed lines, 1890 authored plus570 generated lockfile; this task adds only documentation. Native pending-merge review stands, source/package/tools equality verified. Full private flows/PostgreSQL and Vercel preview remain pending final exact-head CI; no production deployment attempted.
