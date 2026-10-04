# Frontend visual refresh

Feature: frontend-visual-refresh

Status: verified

## Context

User wants an institutional but lively visual direction, starting with the public landing page. Tailwind is already part of the approved stack. Visual improvement is needed before completing remaining human/accessibility validation.

## Important constraint

T087 must not be marked complete until the manual keyboard/zoom/NVDA matrix in `docs/validation/accessibility.md` has evidence. The current work prepares the UI for that validation; it does not replace it.

## Tasks

- [x] Record visual brief and accessibility constraint.
- [x] Prepare brand assets and theme tokens.
- [x] Redesign public landing page with login/register CTAs and visible job offers section.
- [x] Run lint, typecheck and build; record git status.

## Evidence

- Created `docs/product/frontend-brief.md` with visual direction, palette, inputs, landing structure, non-goals and acceptance checklist.
- Copied provided SVG assets into `public/brand/logo-funes-gris.svg` and `public/brand/logo-funes-verde.svg`.
- Updated `src/app/globals.css` with brand color tokens and accessible focus color.
- Reworked `src/app/(public)/page.tsx` into a styled landing page that keeps the municipal-intermediation model, exposes login/registration CTAs above the fold, and previews public offers through `listPublicOffers`.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed; Next.js emitted the pre-existing Turbopack root warning about `C:Usersmaximpackage-lock.json` outside the repository.
- `git status --short --branch` showed only the expected working-tree changes for this visual refresh.

## Review follow-up

- Added a safe fallback for the home offer preview so the landing page does not fail entirely if the public offers RPC is temporarily unavailable.
- Re-ran `npm run lint`, `npm run typecheck`, and `npm run build`; all passed. Build still reports the pre-existing Turbopack root warning.

- Strengthened `:focus-visible` with a white halo plus violet outline to improve visibility on green and light backgrounds; re-ran lint/typecheck/build successfully.

## Reference adaptation

User provided a local reference project at `C:/Users/maxim/Desktop/pagina-elias/proyecto-next-FTL` and added requirements:

- Use shadcn/ui-style components and Lucide icons.
- Add loading screens.
- Make the landing/home closer to the reference design-system direction.

Reference findings:

- `docs/DESIGN_SYSTEM_Portal_Municipal_Empleo.md` defines a municipal design system using Tailwind, shadcn/ui and Lucide.
- Global tokens use green institutional surfaces, light page background, subtle borders, cards, skeleton loading states and Lucide icons.
- The example `src/app/page.tsx` itself is only a small placeholder card; the useful source is the design-system document and component conventions.

Additional tasks:

- [x] Add shadcn-compatible local primitives and Lucide icons.
- [x] Adapt the public home to the reference visual language.
- [x] Add public loading skeletons.
- [x] Verify lint, typecheck and build.

## Implementation continuation

- Added `lucide-react@1.51.0` with exact version. Local npm required `--engine-strict=false` because the active runtime is Node 24.16.0/npm 11.13.0 while the project pins Node 24.21.0/npm 11.19.0.
- Added shadcn/ui-style local primitives: `src/components/ui/card.tsx`, `badge.tsx`, `skeleton.tsx`, plus `src/lib/utils.ts`.
- Reworked global Tailwind v4 tokens toward the reference design system.
- Reworked the public home using Lucide icons, cards, badges, public offer preview and the reference landing structure.
- Added `src/app/(public)/loading.tsx` with skeletons matching the public landing layout.

## Final verification

- `npm run lint` passed after removing an unused Lucide import.
- `npm run typecheck` passed.
- `npm run build` passed. It still emits the pre-existing Turbopack root warning about `C:Usersmaximpackage-lock.json` outside this repository.
- `npm audit --json` reports 6 vulnerabilities: `next@16.3.5` critical advisory fixed by `16.3.8`, plus high-severity `eslint-config-next` transitive findings. These were not fixed in this visual slice because dependency versions are project-governed and should be coordinated separately.
