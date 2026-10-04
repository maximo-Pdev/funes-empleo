# Parallel frontend work guide

This guide lets another AI-assisted developer continue visual work on subpages while this branch is reviewed. It is intentionally narrow: improve presentation and loading states without changing municipal workflow rules, permissions, schema, RLS, or data contracts.

## Current branch and PR intent

- Branch: `codex/temp-mvp-completion`
- Visual slice completed here: public landing/home refresh.
- Primary files already touched: `src/app/(public)/page.tsx`, `src/app/(public)/loading.tsx`, `src/app/globals.css`, `src/components/ui/*`, `public/brand/*`.
- Next recommended parallel surfaces:
  1. `src/app/(public)/ofertas/page.tsx`
  2. `src/app/(public)/ofertas/[openingId]/page.tsx`
  3. `src/app/(auth)/registro/candidato/page.tsx`
  4. `src/app/(auth)/registro/empresa/page.tsx`
  5. `src/app/(auth)/login/page.tsx`

## Product constraints that must not change

- The Employment Office remains the intermediary.
- Companies must not browse the candidate pool.
- Candidate data is shown to a company only after municipal referral.
- Do not change Server Actions, SQL migrations, RLS policies, Storage policies, role checks, or state machines for visual work.
- Do not use real personal data, real CVs, real emails, secrets, screenshots with tokens, or production credentials.
- T087 must remain open until manual keyboard, zoom, and NVDA evidence is recorded in `docs/validation/accessibility.md`.

## Visual direction

Follow:

- `docs/product/frontend-brief.md`
- `docs/validation/accessibility.md`
- `C:/Users/maxim/Desktop/pagina-elias/proyecto-next-FTL/docs/DESIGN_SYSTEM_Portal_Municipal_Empleo.md` as the local reference, when available on the developer machine.

Use the visual language now established in the home:

- Tailwind v4 tokens from `src/app/globals.css`.
- shadcn/ui-style local primitives from `src/components/ui/`.
- Lucide icons from `lucide-react`.
- Institutional green as identity, but mostly light work surfaces.
- Clear Spanish labels and accessible status/error/empty/loading states.
- Skeleton loading screens that resemble the final layout; avoid full-page spinner-only loading.

## Available UI primitives

Import from `@/components/ui` when possible:

```tsx
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
```

Use `cn` for class composition:

```tsx
import { cn } from "@/lib/utils";
```

Use Lucide icons consistently:

```tsx
import { BriefcaseBusiness, Building2, Search } from "lucide-react";
```

Rules:

- Do not use emoji as functional icons.
- Icon-only controls need `aria-label`.
- Decorative icons need `aria-hidden="true"`.
- Keep targets at least roughly 44px high for touch interactions.

## Page-by-page suggestions

### Public offers list: `src/app/(public)/ofertas/page.tsx`

Goal: turn the plain list into a public job board page without changing query behavior.

Suggested structure:

1. Header/intro matching the home style.
2. Small explanation that only approved/current offers appear.
3. Offer cards using `Card`, `Badge`, Lucide location/briefcase icons.
4. Empty state using `Card` and a helpful message.
5. Pagination as clear previous/next buttons.
6. Add or improve `loading.tsx` if the segment lacks one.

Do not add filters unless the service already supports them or a separate approved task expands the contract.

### Public offer detail: `src/app/(public)/ofertas/[openingId]/page.tsx`

Goal: make the detail page readable and action-oriented.

Suggested structure:

1. Breadcrumb/back link to offers.
2. Main card with title, company, location, modality, schedule, contract type, vacancies, closing date.
3. Sections for tasks, requirements, salary/benefits only when present.
4. CTA for candidate login/registration/application path as existing behavior allows.
5. Clear statement that publication is municipal-approved.

### Candidate registration: `src/app/(auth)/registro/candidato/page.tsx`

Goal: reduce form intimidation and clarify why data is requested.

Suggested structure:

1. Split layout: institutional explanation + form.
2. Use light surface cards, clear heading, privacy/intermediation note.
3. Loading state if async route behavior needs it.
4. Preserve existing validation and actions.

### Company registration: `src/app/(auth)/registro/empresa/page.tsx`

Goal: explain moderation and no-documentary-verification MVP constraint.

Suggested structure:

1. Split layout: what companies can do + form.
2. Make clear that offers need municipal review before publication.
3. Preserve existing validation and actions.

### Login: `src/app/(auth)/login/page.tsx`

Goal: match the product identity and avoid plain HTML feel.

Suggested structure:

1. Institutional left/upper panel with brand mark.
2. Form card on a clean surface.
3. Links for recovery and registration clearly grouped.
4. Keep non-enumerating safe messages.

## Loading state pattern

Prefer skeletons that mirror final structure:

```tsx
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <main id="contenido" className="min-h-screen bg-page px-6 py-10">
      <section className="mx-auto max-w-7xl">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </section>
    </main>
  );
}
```

## Required checks before handing back

Run at minimum:

```bash
npm run lint
npm run typecheck
npm run build
```

If changing tests or behavior, run the relevant focused tests too.

Known environment note: the project pins Node `24.21.0` and npm `11.19.0`. If local `npm install` fails because of `engine-strict=true`, fix the local runtime rather than weakening repository policy. The current branch installed `lucide-react` using an engine-strict override only because the local machine had Node `24.16.0`/npm `11.13.0`; do not repeat that as a normal workflow.

## PR review notes for this visual slice

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed, with the pre-existing Turbopack warning about `C:\Users\maxim\package-lock.json` outside the repository.
- `npm audit --json`: reports dependency vulnerabilities including `next@16.3.5`; handle as a separate coordinated dependency update, not as part of subpage visual polish.
