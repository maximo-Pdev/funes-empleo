# Candidate profile photos and rebuilt profile canvas

Status: local same-origin route repair and matching server-only configuration verified; 45 focused route/storage/service tests pass. Photo migration202610240001 is selectively applied to the original local database. The final production build and full 950-test suite pass. Actual local production-browser upload, refreshed private WebP readback, Storage byte equality, anonymous denial, replacement and removal all pass, including physical deletion of replaced/removed files. Independent security inspection and 45 focused tests passed; its initial end-to-end harness failure was corrected without changing product privileges, then the parent completed the real Storage proof. Evidence: `C:/Users/maxim/AppData/Local/hermes/cache/scratch/photo-proof-corrected-results.json`. No developer-owned server was stopped. Prior disposable PostgreSQL/Storage proofs remain separate evidence. User authorization: persisted upload/change/remove, full-profile privacy and physical deletion of the previous file. This is candidate-only; company logos remain out of scope. Source tasks: `odd/tasks/candidate-profile-rebuild.md`, `odd/tasks/candidate-panel-finalize.md`, EXTRA-059 and EXTRA-063.

## Product and UI

All requested profile controls remain inside the existing centered, fluid, maximum-960px white canvas. Order: private circular avatar and upload/change/remove actions; truthful profile state and missing requirements; existing profile fields and separate telephone form; CV PDF Attachment with Empty state; complete existing test consent and affirmative confirmation; municipal intermediary closing notice. No self-archive, public image, company-logo flow or mandatory photo is added. Use official shadcn Base `base-nova` Avatar/Attachment/Empty source adapted to municipal fonts/colors; preserve existing shared Button consumers and native semantics. Photo changes must be reflected after refresh, not merely by local preview.

## Privacy and retention

Only the candidate owning the profile can mutate the photo. Photo reads are allowed for that candidate, an active Office administrator or a company with a currently valid authorized referral to that candidate. Use the existing live referral authorization predicate; prior referral alone is insufficient. Serve the **current** image, not a historical referral snapshot. Pending, replaced and removed image IDs must not read. Photo metadata is not a company directory.

Use a private bucket and an authenticated same-origin handler with `Cache-Control: private, no-store, max-age=0`, `Vary: Cookie`, correct MIME and `nosniff`. No public/signed URLs, browser Storage writes or shared optimizer cache. A previously downloaded copy cannot be technically recalled.

The user explicitly selected physical deletion on replace/remove. Commit/revoke the old reference first, then delete its blob. Never erase the current image before a successful replacement. Record pending cleanup durably and return an explicit pending/error message if physical removal cannot be confirmed; retry must survive refresh. Audit metadata persists, not old image bytes. Failed uploads/commits must preserve the previous current photo and reconcile abandoned objects.

## Ingestion and concurrency

Technical defaults: JPEG or PNG, 5 MiB input limit, maximum 16 million decoded pixels, reject SVG/animation and malformed data. Use explicit `sharp@0.35.5` server dependency to decode actual bytes, normalize orientation, resize to at most 1024px and encode WebP without EXIF/location/ancillary metadata. Extension and caller MIME are not proof of validity. Do not record original personal filenames in logs.

Use immutable UUID object keys and upload without overwrite. SQL mutations recheck active actor, candidate ownership, archival state and expected existing profile version under locks. Metadata/current pointer and audit must commit atomically; photo is not a profile-activation prerequisite. Storage is outside the SQL transaction, so pending-object and physical-cleanup reconciliation are explicit, not an assumed cross-system rollback.

### Narrow privileged-operation exception

The previous privileged-operation allowlist is extended **only** for server-validated candidate-photo ingestion and physical cleanup. A server-only module internally creates the privileged client using the existing `SUPABASE_SECRET_KEY`, exposes no general client, validates the authenticated actor and passes that actor into restricted SQL functions which independently validate role/state/ownership/version. Authenticated/anonymous clients cannot execute trusted ingestion or mutate bucket objects. Reads use the request session and RLS, never a privileged client. Existing administrator-invitation behavior is unchanged. No secret is sent to a client bundle or supplied through a browser form.

`SUPABASE_SECRET_KEY` was already configured as optional for admin provisioning; photos require it in the server deployment too. Do not commit or inspect real secret files. Missing configuration must fail with a safe actionable message, never fake a saved photo.

For this explicitly authorized local repair only, the ignored `.env.local` server key was provisioned from the running local Docker Storage service entirely in process memory. The script verified the destination is exactly `http://127.0.0.1:54321`, the credential has the local `service_role` claim and is accepted by that endpoint, refused a different nonempty existing key, preserved all unrelated environment-file bytes, and rechecked ignored status. No key/token or secret-file content was printed. No public/client variable was added. Restart the authorized development server to load the new server key.

The photo POST CSRF guard now derives the expected origin from actual `Host` plus the request URL protocol, not Next's potentially internal `localhost` authority. It validates Host syntax (including bracketed IPv6), normalizes host case/default ports via URL parsing, and requires a strictly serialized matching HTTP(S) Origin. Foreign/malformed origins fail closed; arbitrary `Forwarded`, `X-Forwarded-Host` and `X-Forwarded-Proto` cannot authorize a request. Requests without Origin retain existing server-side owner/session/version enforcement; no auth or storage checks were weakened.

## Optional photo availability

Profile rendering isolates failures from both current-photo and cleanup-state reads. If schema rollout or photo access is unavailable, render the existing fields, telephone, CV and consent normally, with an explicit photo-unavailable notice and disabled photo controls. Do not misrepresent a read failure as a successfully loaded empty photo, and do not weaken server authorization or auto-apply migrations.

## Deployment and recovery

1. Review the additive `202610240001_candidate_photos.sql` migration and pgTAP proof on an isolated disposable database before rollout.
2. Apply migration **locally first**; production/remote application requires separate authorization for the destination and session. Never use a linked-project push or repair as implicit authorization.
3. Deploy application only after schema and the existing server-only secret are available. No new public environment variable or external service is introduced.
4. Roll back application code without deleting schema or audit history. Use forward corrective SQL; never edit already-applied migrations, restore access to removed photos or destructively roll back stored business records.
5. Retry durable cleanup on owner operations; inspect/reconcile remaining failures through authorized maintenance. Do not claim physical deletion until Storage confirms it.

## Verification requirements

- Unit image tests with actual decode, dimension/size/format/metadata checks.
- Route/service tests for active owner, foreign/unauthenticated/company mutation denial, version conflict, preservation on failure and cleanup failure/retry.
- SQL tests for grants/RLS/live referral/revocation/stale writes/audit/current-photo invariants; real independent-session probes for concurrency, not inspecting SQL text alone.
- Profile/form/CV return regressions, lint, typecheck, build; desktop/mobile/keyboard checks using fictitious fixtures only.
- Do not run `test:db` or `test:e2e` on the existing instance: their wrappers reset fixtures. Use isolated scratch state without real credentials or personal records.

## Environment and dependency observations

The default Hermes Node 26/npm 11.19.0 cannot install this project's strict Node 24/npm 11.19.1 dependencies. This work uses the already installed Node 24.16.0 and npm 11.19.1 via npm exec, without changing global/runtime configuration. New explicit packages: `@base-ui/react@1.9.0`, `class-variance-authority@0.7.1`, `sharp@0.35.5`.

The dependency install reported seven audit findings in existing Next/Zod/Vitest/Vite/undici dependencies (including a critical Next advisory); none names the three new packages. No unrelated automatic audit fix or framework upgrade is authorized by this profile change. Track remediation before remote deployment, and distinguish this advisory from proof that the new photo code is safe.
