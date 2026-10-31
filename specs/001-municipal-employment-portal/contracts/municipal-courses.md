# Municipal courses and referrals

Scope: EXTRA-086 / FR-042, authorized by the supplied final-project PDF. Implementation is local and is not municipal production approval.

## Public metadata

`/cursos` and the candidate Cursos section show only published `municipal_courses` metadata: `id`, `title`, `url`, `published`. No candidate identity, referral, staff attribution or unpublished link is public. Empty and unavailable states are distinct. External links use HTTPS and open with `noopener noreferrer`; the server never fetches them or promises enrollment. Administrators verify official provenance before publishing; no municipal domain allowlist is invented.

## Administrative commands

`save_municipal_course(p_title text, p_url text, p_published boolean, p_course uuid default null) -> uuid` creates or updates a link. It requires the live active administrator session, validates input, serializes updates on the existing course row and records `course_link_created` or `course_link_updated`. Other roles and anonymous callers cannot mutate the tables directly. Editing links is last-write-wins; no optimistic version contract is claimed.

`create_course_referral(p_candidate uuid, p_course uuid) -> uuid` requires the same administrator guard, an existing nonarchived candidate and an existing published course. It records course title/URL snapshots, the authenticated account and database time, plus an audit event. It does not require or create a job application, employer referral, CV, enrollment or company permission. Repeated referrals are separate historical events, not silently merged or deduplicated.

`/admin/courses?candidate=<opaque candidate reference>` provides creation and paginated history. The candidate detail's Cursos y derivaciones link supplies that reference. Raw candidate UUID query values are rejected on this page. The service resolves opaque references only after authorization. History is ordered by referral time and ID descending, twenty items per page; URLs preserve the same opaque candidate context. Archived candidate history remains readable by administrators, but new referrals are refused.

## History and recovery

`course_referrals` is append-only. Foreign keys restrict record deletion and historical title/URL snapshots do not change when the course metadata changes. No application role can delete business records. A rollback disables the new application surfaces and revokes new command execution through a reviewed corrective migration; it must preserve populated course, referral and audit records. Do not drop the tables, undo unrelated migrations or reset curated data.

## Verification and deployment boundary

Migration: `supabase/migrations/20261027233000_course_referrals.sql`.
SQL regressions: `supabase/tests/074_course_referrals.test.sql`.
Focused application regressions: `tests/unit/training/` and `tests/components/training/`.

Mocked application tests do not establish that migrations, RLS or audit writes succeed in PostgreSQL. Database execution, deployment, official course URLs and real enrollment are not implied by source implementation. Use an explicitly isolated verification database; the ordinary local DB/E2E wrappers reset curated fixtures and are not authorized by this document. No hosted migration, course publication or invitation email is authorized by local implementation.
