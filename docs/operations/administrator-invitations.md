# Individual administrator invitations

EXTRA-086 / S5 adds invitation management to the administrator's Cuenta page. This document describes the implementation, not evidence that a real invitation was delivered.

1. Sign in with an active individual administrator account and open Cuenta.
2. Enter the intended administrator's email and explicitly confirm that the recipient will have full administrator permissions.
3. Submit Enviar invitación. An actual successful provider response is required before the interface reports success. Configuration, authorization and provider errors remain failures.
4. The recipient uses their individual Auth invitation and existing password-setup callback. Never assign a shared password or elevate an ordinary public registration through metadata supplied by a browser.

## Required email transport

Use the reviewed `supabase/templates/invite.html` for the Invite user email. Local configuration enables it in `[auth.email.template.invite]`. Its link uses the environment's canonical `.SiteURL`, `/auth/callback`, the one-time `.TokenHash`, fixed `type=invite` and fixed `next=/update-password`. Keep the canonical Auth Site URL aligned with the application's approved origin.

The default provider confirmation link verifies the invitation and returns bearer tokens in a browser fragment. A server callback cannot read that fragment. Delivery and an email-verified account therefore do not establish a working password-setup flow. The reviewed template sends the hash directly to the callback, whose existing `verifyOtp` branch establishes server session cookies before redirecting to individual password setup. Do not remove fragment scrubbing or add a client bearer-token bridge as a workaround.

For an already running local stack, apply the reviewed configuration with the supported data-preserving stop/start procedure for this project, then verify retained database and Storage records. Never use `stop --no-backup`, delete volumes, or run an acceptance reset merely to apply an email template. Do not read or print database backups. Applying the local configuration and verifying a fresh local Mailpit invitation are separate from changing hosted Auth settings.

Hosted rollout requires separate authorization for the exact project and operator session. A Vercel application deployment does not update hosted Auth email templates or Site URL configuration. Install the reviewed Invite user template and canonical-origin settings through the approved hosted operations process; no hosted change is implied by this repository configuration.

Reference: https://supabase.com/docs/guides/auth/auth-email-templates, including the server-side endpoint section.

The dedicated Server Action validates the email and confirmation. Both the action and the existing provisioning service verify the active server-side administrator session; the actor is not accepted from a hidden input. The server-only helper reserves the individual invitation and invokes Supabase Auth. The privileged client is never exported or sent to the browser. The existing administrative suspension/reactivation rules and protection of the last active administrator are unchanged.

The existing server-only provisioning configuration must be present in the application environment. Do not paste credentials into chat, add them to source control or show them in logs. Lack of configuration must not be bypassed by exposing a privileged key or simulating an invitation.

A provider failure can leave a reserved but unused invitation according to the existing reservation lifecycle. No destructive cleanup or reservation-policy change is included here. A separate reviewed procedure is required if operational recovery is needed.

Local mocked action/helper tests establish guard ordering, actor attribution, safe feedback and the invitation payload, not email delivery, account creation or hosted configuration. Static template guards verify the server callback contract, not provider template application. Live verification requires authorization for the exact target and recipient/session. Corrected-template local Mailpit acceptance passed: actual canonical hash link, server cookies, individual password setup, chosen-password login, signout, fresh administrator login and reused/invalid-link rejection. The preserving local restart retained all 73 table fingerprints and all 501 physical Storage object digests before that intentional invitation. See `odd/tasks/final-portal-improvements.md` L33 for execution evidence and limitations; hosted rollout remains unperformed.

Acceptance must use a fresh fictional local recipient and the actual email link once: render Actualizar contraseña, choose an individual password, confirm the administrator panel, sign out, and verify a fresh password login. Assert that reused or invalid hashes do not establish a new browser session. Never log the mail link, token, password, Auth response or cookies. Preserve existing consumed fictional accounts; do not infer chosen-password completion from the presence of an Auth password hash.

Known pre-existing usability advisory: successful password updates redirect to `/?changed=1`, but Home does not render a success notice for that parameter. Actual password persistence and subsequent login passed. The same redirect and omitted notice are present in the baseline commit; this is not reported as a template regression or silently fixed in this scope.
