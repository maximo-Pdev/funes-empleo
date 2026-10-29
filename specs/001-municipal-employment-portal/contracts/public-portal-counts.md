# Public portal count contract — EXTRA-079

## Boundary

Supabase RPC `public.public_portal_counts()`, no arguments. Anonymous and authenticated
callers may execute it. It returns exactly `{ candidates: number, companies: number,
offers: number }`, all nonnegative integers. It exposes no identities, contact data,
status breakdowns or administrator metrics and adds no table/view read grants.

## Approved meaning

- `candidates`: one per candidate profile with no archive timestamp and status other
  than archived. Assisted/imported and incomplete/unavailable profiles count, whether
  or not they have been linked to an account. Linking does not create another count.
- `companies`: one per company profile with no archive timestamp and status other
  than archived, including incomplete and suspended registrations.
- `offers`: one per row of the existing `private.public_offer_rows` projection:
  published/nonarchived opening, active/nonarchived company, active company account,
  and closing date not before today in America/Buenos_Aires. Not vacancies and not
  the number of currently rendered carousel cards.

Maxi approved these definitions and the hosted aggregate function on 2026-10-25.

## Rendering and failure

The server-only service uses the ordinary Supabase request client, validates the
exact shape and returns a generic internal error on provider/schema failure. Home
renders real zeros when successful. On failure it renders an unavailable notice and
em dashes, independently of session access and offer-preview loading. Home remains
dynamic; counts are not hardcoded or derived from the ten-item preview limit (EXTRA088).

## Recovery and rollout

Migration: `20261025210000_public_portal_counts.sql`. SECURITY DEFINER with an empty
search_path, fixed schema-qualified sources and explicit function grants. To retire,
remove the consumer first, then revoke/drop only this function. No business data is
changed by this migration. Hosted application publication is separate from applying
the authorized schema and adding the six fictitious demo offers. Record observed
rollout in `odd/tasks/home-public-metrics-demo-offers.md`.
