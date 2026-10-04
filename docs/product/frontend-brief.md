# Frontend visual brief

This refresh gives the employment portal a municipal, approachable identity before the remaining human accessibility and acceptance checks. It starts with the public landing page and keeps the approved MVP behavior unchanged.

## Decision

Use the existing Next.js + Tailwind CSS stack with shadcn/ui-style primitives and Lucide icons to build an institutional but not bland interface: clear green municipal identity, generous spacing, high-contrast actions, and guided entry points for candidates, companies, and municipal staff.

## Inputs

| Source | Use |
| --- | --- |
| `C:/Users/maxim/Desktop/logo_funes_gris.svg` | Neutral brand mark for light surfaces. |
| `C:/Users/maxim/Desktop/logo_funes_verde.svg` | Strong municipal mark for green or hero surfaces. |
| `C:/Users/maxim/Desktop/colores.txt` | Primary palette and contrast intent. |
| `https://funes.gob.ar/` | Institutional tone, service-oriented CTAs, quick access pattern, public-service framing. |
| `C:/Users/maxim/Desktop/pagina-elias/proyecto-next-FTL/docs/DESIGN_SYSTEM_Portal_Municipal_Empleo.md` | Reference design-system direction: Tailwind tokens, shadcn/ui, Lucide icons, skeleton loading states and landing structure. |
| `docs/validation/accessibility.md` | Manual keyboard, zoom and NVDA checks that must still be executed. |

## Palette

| Token | Hex | Intended use |
| --- | --- | --- |
| Institutional green | `#006833` | Main brand surfaces, primary buttons, headers. |
| Green deep | `#004E24` | Dark contrast, shadows, strong text on light backgrounds. |
| Green section | `#247042` | Section backgrounds and secondary green areas. |
| Green soft | `#337F50` | Gradients and supporting panels. |
| Mint highlight | `#69BC88` | Badges, secondary cards and accents. |
| Accent violet | `#21126F` | Sparse emphasis only where a green-only hierarchy is not enough. |
| Text gray | `#434343` | Main readable text on light surfaces. |
| White | `#FFFFFF` | Text on green surfaces and clean card backgrounds. |

## Landing page priorities

1. Make the portal immediately feel official and trustworthy.
2. Put login and registration actions above the fold.
3. Explain the municipal-intermediation model in plain Spanish.
4. Show a small set of current job offers further down the page.
5. Keep public visitors away from assumptions of direct company/candidate contact.
6. Preserve accessibility: semantic headings, visible focus, high contrast, responsive layout, clear link/button names.

## Home structure

1. Header with logo, public navigation, login action.
2. Hero with value proposition and two primary CTAs: candidate registration and company registration.
3. Trust/constraint cards: municipal intermediation, protected candidate data, assisted in-person service.
4. Current offers preview loaded from the existing public offers service.
5. Role-specific guide: candidates, companies and Employment Office.
6. Final CTA block.

## Non-goals for this slice

- Do not change business rules, RLS, migrations, authentication or role permissions.
- Do not mark T087 complete without manual evidence.
- Do not introduce a UI framework or dependency beyond Tailwind.
- Do not use real personal data, real CVs, credentials or production secrets.
- Do not claim municipal production readiness.

## Acceptance checklist for this slice

- [ ] Home uses the Funes brand assets from `public/brand/`.
- [ ] Home uses the approved Tailwind stack and local color tokens.
- [ ] Home uses shadcn/ui-style primitives and Lucide icons instead of emoji/icon mixing.
- [ ] Public routes have a skeleton-style loading screen.
- [ ] Login and candidate/company registration are visible before scrolling.
- [ ] A public offers preview appears below the hero and handles empty/error-safe states.
- [ ] Copy preserves the municipality as intermediary.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] T087 remains open until the manual matrix has evidence.
