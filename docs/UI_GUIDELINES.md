# Municipal visual reference

Use the official Funes website as a visual reference, not as a template dependency.
This guide records the portal's current implementation choices so future sessions
and both developers can keep pages consistent. It is not a municipal identity
manual or evidence of stakeholder acceptance.

## Before changing a page

1. Read this guide and `src/app/globals.css`.
2. Reuse `Button`, `TextField` and `SelectField` from `src/components/ui` where
   applicable. Keep existing form actions, fields, validation and accessibility.
3. Check the page's CSS module for competing declarations. Do not introduce
   another font, brand green, field treatment or independent palette.
4. Limit composition changes to the requested page. Coordinate shared foundation
   changes; preserve unrelated working-tree changes and functional ownership.

## Reference and deliberate adaptations

### Official component standard — requested 2026-10-22

Use official [shadcn/ui Base components](https://ui.shadcn.com/docs/components),
with the configured `base-nova` registry style, as the shared component source.
Consult the corresponding official documentation and registry source before
adding or replacing a button, form field or supported interactive control.
Reuse the municipal adaptation in `src/components/ui` rather than introducing
another page-local implementation or an independently styled copy.

Keep the current appearance: municipal colors, Be Vietnam/Sora, underlined
fields, bevels, spacing and responsive composition. Preserve public component
props, form actions, field names, validation, focus, error feedback, pending
states and destructive-action meaning. Registry defaults must not reset the
theme or silently change existing behavior.

Migration status: requested, not implemented. `components.json` configures
`base-nova`, but current local primitives and sidebar are not thereby official
registry installations. Historical native-control/no-dependency decisions below
describe the current implementation, not an exemption for future components.
The requested landing migration must preserve those controls' appearance and
semantics; it does not authorize redesigning unrelated pages. Coordinate shared
primitives and dependencies before implementation and verify downstream callers.

Use the official [Avatar](https://ui.shadcn.com/docs/components/base/avatar)
for candidate-photo and company-logo presentation, with an accessible fallback.
Avatar does not implement file upload, persistence or authorization. Candidate
photos must follow full-profile visibility: the candidate's own account, the
Employment Office, and a company only after an Office referral to that company.
Never publish candidate photos through a public bucket or unrestricted URL.
Company-logo visibility is not implicitly the same as candidate-photo visibility
and must be established before implementing a read contract. See EXTRA-047 and
EXTRA-048 in `cambios-extra.md`; neither image flow is implemented yet.

Observed on 2026-10-20:

| Evidence | Official source | Portal decision |
| --- | --- | --- |
| Primary family `Be Vietnam`; alternate family `Sora` | [business.css](https://funes.gob.ar/views/assets/demos/business/business.css) | Be Vietnam for body, labels and controls; Sora for headings and shared buttons |
| Green `#074A1F`; dark `#262B35`; medium `#868D98` | Same theme stylesheet | Brand tokens; medium gray is not a default small-text color |
| Underlined fields and uppercase labels | [Employment form](https://funes.gob.ar/empleo), [contact form](https://funes.gob.ar/contacto), `.contact-form-style-03` in [style.css](https://funes.gob.ar/views/assets/css/style.css) | Shared form treatment without importing Crafto/Bootstrap/AdminLTE |
| Later AdminLTE overrides the computed input font stack | Stylesheet cascade on those public forms | Intentionally use the municipal theme families instead of reproducing the incidental fallback |
| Source form focus has no visible outline | Same public forms | Intentionally keep a visible green keyboard outline and white separation |

The source theme's 17px/32px body sizing is evidence, not a mandatory size for
all portal content. Existing page typography scales, layout, bevel and inset
shadow are preserved unless a task explicitly changes them.

## Colors

Use semantic tokens/classes, not new hex literals in page components.

| Role | Token / utility | Current value |
| --- | --- | --- |
| Institutional green | `--color-brand-primary` / `bg-brand-primary`; `--color-primary` / `bg-primary` | `#074A1F` |
| White | `--color-brand-secondary` / `bg-brand-secondary` | `#FFFFFF` |
| Body and heading text | `--color-brand-text`, `--color-foreground` | `#262B35` |
| Dark base | `--color-brand-base` | `#262B35` |
| Observed medium neutral | `--color-brand-muted` | `#868D98` |
| Readable secondary and input text | `--color-foreground-secondary` | `#495057`, observed form text color |
| Keyboard focus | `--color-ring` | institutional green |
| Form submit background / hover | brand text / primary | `#262B35` / `#074A1F` |

`#868D98` is not approved for normal-size text on white without a contrast check.
The existing light backgrounds, border colors, primary shades, semantic red,
bevel gradient and shadows are portal adaptations, not extracted brand rules.
The old `brand-primary-light` name remains as a compatibility alias to the exact
institutional green; do not treat it as a second official green.

## Typography

- **Be Vietnam** (not Be Vietnam Pro): body, field values and labels. Bundled
  regular weights: 400, 500, 600, 700, 800.
- **Sora:** h1–h6, shared buttons and form submission buttons. Bundled regular
  weights: 400, 600, 700, 800.
- Use `font-sans` and `font-heading`; CSS definitions live in `globals.css`.
- Fonts are self-hosted in `public/fonts/funes/`, with `font-display: swap`.
  There is no runtime Google Fonts request or build-time font download.
- Font provenance and original OFL licenses are stored beside the binaries.
  Do not silently substitute a similarly named family or remove the licenses.

## Forms

| Element | Shared presentation |
| --- | --- |
| Text-like inputs and selects | 38px minimum height; 16px / 24px Be Vietnam; weight 400 |
| Control border | bottom-only 1px `#262B35`; square corners; transparent background |
| Control padding | top 6px, right 12px, bottom 6px, left 0 |
| Field labels | 13px / 19.5px; weight 700; uppercase presentation, original text unchanged |
| Textareas | same treatment, minimum 85px, vertical resizing allowed |
| Standard submit | white Sora, 13px / 19.5px, weight 600; padding 16px 30px; 4px radius; minimum 44px target |
| Shared primary button outside submit | institutional green; dark text-color background on hover |
| Invalid control | red underline plus existing text/ARIA error feedback |
| Focus | solid 3px green outline, 3px offset, white separation |

Global form rules also cover existing raw controls so changing pages one by one
does not leave incompatible field styles. `municipal-control` and
`municipal-label` let primitives opt into the same rules outside a form.
Do not add competing local field borders/radii or full Crafto CSS imports.

Raw special inputs (hidden, checkbox, radio, file, range, color, image and native
button inputs) are excluded from the text-field shape. `TextField` is a text-like
control primitive: do not use its `municipal-control` class for those special
types, which require native controls or a dedicated primitive. Checkboxes/radios retain
their native shape with a green accent. Their labels keep sentence case.
Password visibility toggles remain separate non-submit controls with at least
44×44px targets. Existing destructive actions stay red; the auth danger wrapper
uses `--form-submit-background` / `--form-submit-hover` to preserve that meaning.
Do not remove confirmation, hints, `required`, autocomplete, errors or ARIA links.

The homepage's compact layout uses 6px between labels and their controls,
16px between field groups, and 12px panel padding. Reuse `--form-label-gap`,
`--form-field-gap`, and `--form-panel-padding` through `form-compact`.
These are intentional portal layout choices, not extracted municipal measurements.
The homepage navbar is white with a 1px `--color-brand-muted` bottom border;
it remains an overlay rather than taking space in the content flow.
On desktop it is hidden at the top and slides into view after scrolling
(`scrollY > 0`); returning to the top hides it again. The desktop transition lasts
280ms and is disabled for reduced motion; hidden navigation is inert.
Below 768px it is visible and interactive without scrolling, with no slide
transition. A media-query subscription updates visibility on viewport changes.
The left navbar brand uses the user-supplied `public/brand/funes-navbar-emblem.svg`
(225×235 viewBox, copied without alteration) and links to `https://funes.gob.ar/`.
Render the text-free vector emblem at 48px high with automatic proportional width
inside a 64px navbar, on both the homepage and the `alwaysVisible` account variant.
Right-aligned text links provide `Inicio` (`#contenido` on the homepage, `/` in
the account variant) and `Ofertas` (`/ofertas`). Use a native same-page anchor on
the homepage so repeated activation returns to the start and focuses `main#contenido`.
The link has no background, border or color filter; do not reuse the old green badge.
At Mateo's explicit request (A16 / EXTRA-053, 2026-10-23), remove the root
“Ir al contenido principal” link on all routes, not merely its styling or tab stop.
Keep the unique `main#contenido` landmark, page headings, named navigation,
existing focus targets and visible keyboard focus. The homepage navbar's `Inicio`
link still returns to and focuses the main landmark. Verify repeated Tab/Enter
on desktop and mobile. Landmarks preserve assistive-technology navigation
([W3C ARIA11](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11)); `Inicio` is not
a universal replacement for a skip link, nor does plain Tab skip every header.

## Administrative candidate CV

The administrative candidate detail shows the current valid, non-archived CV's
safe filename and size, with a native protected download link using its opaque
reference. Do not embed Storage paths, signed URLs or historical files as current.
Without a current CV show “El candidato no tiene un CV vigente.” and no download.
Keep the existing archived-profile restriction. The existing upload/replacement
form lives in the assisted-maintenance screen, reached through “Mantener perfil
y atención presencial”; its validation, version checks and permission rules stay
unchanged. Candidate self-service and company referral access are unaffected.
See EXTRA-054. No embedded PDF viewer or new file exposure is introduced.

## Candidate account workspace

Candidate `/account` uses a white main surface and a 264px left sidebar below the
64px shared navbar. The non-collapsible composition in `src/components/ui/sidebar.tsx`
adapts the [shadcn Base sidebar anatomy](https://ui.shadcn.com/docs/components/base/sidebar)
to existing local primitives and municipal tokens; it is not a full registry install
and does not introduce Base UI dependencies, a theme reset or a second palette.
The centered upper menu contains Perfil, Postulaciones and Ofertas. Its buttons
fill the sidebar's inner width, use a 56px minimum height, 16px text and 22px icons,
and retain a shared left-aligned icon/text column. Active
links use `aria-current="page"`. The footer keeps password access, then logout,
then a placeholder avatar with the persisted candidate display name and validated
session email. No photo upload or storage flow is implied by the placeholder.
Keep the email on one clipped line. Measure actual text overflow with ResizeObserver
and recheck after font loading and email changes. Only overflowing addresses loop
left with an aria-hidden duplicate: on hover/keyboard focus for desktop pointers,
automatically below 768px or on non-hover devices. Touch focus pauses the loop;
pointer exit resets the desktop position. Keep the complete email as its title
and accessible original text, and disable movement for reduced-motion preferences,
including while hovered. Addresses that fit must remain static without a duplicate.
Below 768px the sidebar moves into normal document flow before the main content.

Views are selected with `/account?section=perfil|postulaciones|ofertas` and rendered
on the server, without iframes or duplicate main landmarks. Missing/unsupported
sections show the profile. Shared content preserves existing standalone candidate
routes, forms, notices, application requirements, withdrawal confirmation and CV
feedback. Account-local profile/offers links and pagination retain the selected
view; public offer-detail links still open the existing detailed offer route.
Archive controls are absent from this candidate account screen, including the
embedded profile; standalone profile and other account roles remain unchanged.
CV uploads may return only to the exact account profile destination or the existing
legacy/admin destinations. See EXTRA-046 for compatibility and review status.

## Homepage ribbons and offers shortcut

The left hero uses the user's selected **Canvas Ribbons** by Boris Šehovac:
`https://codepen.io/bsehovac/pen/LQVzxJ`. The supplied export includes complete
dependency-free Canvas 2D JavaScript and an MIT license. Preserve the original
notice in `public/brand/canvas-ribbons/LICENSE.txt`; the adjacent README records
source provenance, hash and adaptations. Do not embed CodePen or import the demo's
global document styles. The former slideshow is no longer rendered or requested;
its original photo assets/provenance remain untouched.

`home-ribbons.tsx` retains the original sine-driven Bézier curves and trail
history with three green/neutral ribbons on a charcoal field. Limit rendering to
30 FPS, 120 trail segments and pixel ratio 2; resize to the actual quadrant/hero.
The decorative canvas is non-interactive and hidden from assistive technology.
Pause when off-screen or the document is hidden; reduced motion draws a preloaded
static frame, never an empty canvas. Release frames/observers/listeners on unmount.
A dark overlay preserves readable white foreground text; CSS provides a fallback.

Restore the complete municipal information from `src/app/(auth)/login/page.tsx`
and the supplied screenshot: office/municipality identity, “El empleo en Funes,
con acompañamiento municipal.”, the introduction, Postulantes/Empresas descriptions
and the municipal intermediary notice. This replaces the former employment slogan.
Use the existing fonts, icons and identity asset; do not change business wording.

The right half uses the principal green `#074A1F`. Its form panel is white,
with dark labels, helper text and underlined fields, plus a neutral gray bevel,
shadows, tabs and password controls. Alerts retain their dark red treatment.
These are local overrides of
the shared finish, not a global palette replacement; `surface-bevel` keeps its
existing default for other callers.
There is no divider border between the opening hero and the lower white section.

Do not render an additional portal title above the photographic quadrant or form.
The desktop municipal introduction replaces the previous slogan.
Login and both registration roles center their cards vertically. Registration uses 40px outer clearance,
with extra bottom clearance on narrower desktop layouts to avoid the offers action.
Company uses symmetric top/bottom clearance. Only in company desktop mode, the
offers shortcut is centered below the left quadrant so it cannot cover the wide,
vertically centered card. Other modes retain their existing shortcut position.
Do not clip or scale fields to claim viewport fit:
tall forms still use normal document scrolling. A content
ResizeObserver updates the card's explicit natural height. Both height and wrapper
width transition for 360ms, disabled for reduced motion. Login/candidate use a
460px target width, company uses 580px, constrained by the available space.
Neither registration uses an internal scrolling region or viewport height cap;
long forms extend the document and use normal page scrolling. Keep space below
the card for the offers action. No authentication actions or validations change.
The registration account-type legend and two radio options share a centered
group using the card's neutral gray bevel gradient and a 1px medium-gray
`--color-brand-muted` border. Below 1024px (including 768px tablets), center the
caption on its own first row with Postulante and Empresa side by side underneath.
This selector-only breakpoint must not change the page's 768px composition
breakpoint. A visually hidden native legend preserves the accessible name.

Homepage registration forms opt into `homepageLayout`; other routes retain their
original field layout. The company order is company name, responsible person/email,
CUIT/activity, locality/contact phone, password and password confirmation.
Each slash-separated pair shares a desktop row and stacks in that order on mobile.
Required indicators derive from the existing native `required`
attributes, not new validation rules. CSS-generated asterisks have an empty
accessible alternative to avoid duplicating native required announcements.
Optional phone has no asterisk or “(opcional)” suffix on the homepage.
Both homepage registration forms end with “Los campos marcados con * son
obligatorios.” below the submit. Registration password guidance is only
“Entre 6 y 128 caracteres.”; remove “No compartas tu contraseña.” from registration
but preserve it in login and password-change flows. Native limits and confirmation
validation remain unchanged.

Below 768px, show the complete municipal introduction first, followed by the
login/registration card, then the offers footer. Reuse the same content and DOM
order as desktop, without duplicating text. Clear the 64px navbar by 24px
(88px introduction top padding) and leave 32px between introduction and card.
Use 32px before the intermediary notice on mobile; preserve all its wording.
The card remains horizontally centered and naturally sized in every access mode;
do not vertically center login independently or add a second top clearance for
registration. Let the document scroll instead of clipping any content.

Keep one animated ribbons background covering the whole mobile hero, behind both
information and forms. The decorative wrapper uses display: contents while the
absolute canvas/overlay layers fill the hero. The access wrapper stays transparent
and has no separate green background or inner shadow. The removed portal title
remains absent. Desktop/tablet two-column composition is unchanged.

Only homepage login includes a subtle “Recuperar acceso” text link below
“Ingresar”, separated by a full-width 1px horizontal rule inspired by the
[shadcn Separator](https://ui.shadcn.com/docs/components/base/separator).
Use a native semantic `hr` and the existing `/recover` route; keep the link outside
the authentication form. No Base UI/shadcn dependency or recovery-flow changes
are required. Hide this section in both registration roles and include it in the
card's existing measured-height animation. Keep the link compact, centered,
12px regular-weight body text, borderless and without a button background.
Retain a 44px invisible touch height, hover underline and visible keyboard focus.
The offers action has its own in-flow footer with 24px padding above and below;
it is no longer absolutely positioned over mobile content. The desktop offers
action retains its original floating position.

The floating “Ver ofertas disponibles” action links to `#ofertas-disponibles`,
the currently empty white section below the hero. Native smooth anchor scrolling
uses the existing 104px target clearance (not the navbar height) and becomes instant for
reduced-motion preferences. Do not add placeholder job offers to this section.

## Verification

- Run `npm run test:unit -- tests/components/foundation/municipal-visuals.test.tsx`
  and the affected existing component tests.
- Against an already running local application, run
  `node tests/visual/municipal-style-check.mjs` (optionally set `VISUAL_BASE_URL`).
  It checks desktop/mobile login and both registration forms, fonts, underlines,
  labels, focus, toggles and generic controls without submitting forms.
- Run repository-required unit tests, lint, typecheck and production build.
- Run `node tests/visual/home-responsive-layout-check.mjs` against a local server
  for full-height registration, width animation, required markers and mobile
  overlay/contact-row layouts; it never submits forms or resets data.
- Run `node tests/visual/home-keyboard-navigation-check.mjs` to verify the removed
  global link, first visible controls and preserved `Inicio` focus behavior.
- Do not use `npm run test:e2e` for a visual spot check: its wrapper resets the
  acceptance database. A filename filter does not make that wrapper read-only.
- Check loading, errors, keyboard navigation and long forms in a real browser.
  This guide does not claim all private pages have been manually reviewed.

## Current change review

The 2026-10-20 alignment replaces Arial, maps legacy primary `#006833` to
`#074A1F`, maps the general foreground to `#262B35`, introduces the observed
medium gray, replaces shared blue buttons/focus, and changes boxed fields to
underlined fields. Functional behavior and page composition are unchanged.
See `cambios-extra.md`, EXTRA-042, for checks and remaining review status.
