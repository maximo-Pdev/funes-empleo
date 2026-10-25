# Municipal visual reference

Use the official Funes website as a visual reference, not as a template dependency.
This guide records the portal's current implementation choices so future sessions
and both developers can keep pages consistent. It is not a municipal identity
manual or evidence of stakeholder acceptance.

## Before changing a page

Home's left introduction follows the access selection: login retains its municipal
message; candidate and company registration reuse the original registration guide,
steps and privacy notice. Company registration also retains the documentary
verification disclaimer. Switching back to login restores its original copy.

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

Migration status: partial. Candidate profile Avatar, Attachment, Empty and the
compatible shared Button now use adapted official base-nova sources (EXTRA-059);
independent verification/deployment status is tracked in
`odd/tasks/candidate-profile-rebuild.md`. Other primitives and the sidebar are not
automatically migrated. `components.json` configures
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
EXTRA-048/059 in `cambios-extra.md`. Candidate-photo implementation now includes
private persisted upload/change/remove and physical old-object cleanup; rollout
requires its additive migration and existing server-only secret. Company logos
remain unimplemented. See `docs/implementation/candidate-profile-photos.md`.

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
The homepage navbar uses a subtle white frosted-glass surface: 85% white and
16px backdrop blur where supported, with solid white as the unsupported-browser
fallback. Keep text, logo and controls fully opaque and sharp: never apply opacity
or a foreground blur to the header itself. Retain the 1px `--color-brand-muted`
bottom border and overlay positioning rather than taking space in the content flow.
On desktop it is hidden at the top and slides into view after scrolling
(`scrollY > 0`). After returning to the top from a positive scroll position, keep
it open for 2000ms before hiding. Hover or keyboard focus within the navbar keeps
it open even after that delay; leaving hides it only once the delay has expired.
Cancel pending timers on renewed scrolling, breakpoint changes and unmount.
The initial desktop top state remains hidden. The desktop transition lasts
280ms and is disabled for reduced motion; hidden navigation is inert.
Below 768px it is fixed at the bottom, visible and interactive without scrolling,
with no slide transition. Preserve a 64px control row plus the device bottom safe
area, move the divider/shadow to its upper edge, and reserve 88px plus the safe
area at the end of Home and the candidate workspace so content remains reachable.
Remove the workspace's former top reservation; Home's introduction starts 24px
from the top and its access anchor uses 24px clearance on mobile (88px desktop).
A media-query subscription updates visibility on viewport changes.
The left navbar brand uses the user-supplied `public/brand/funes-navbar-emblem.svg`
(225×235 viewBox, copied without alteration) and links to `https://funes.gob.ar/`.
Render the vector emblem at 48px high with automatic proportional width inside
a 64px navbar, on both the homepage and the `alwaysVisible` account variant.
On desktop, place “Oficina de Empleo” / “Municipalidad de Funes” beside it;
hide this identity text below 768px. Remove the repeated identity/logo from the
hero, not its headline, summary, roles or intermediary notice. Preserve the
official municipal destination even though Inicio links within the portal.
Keep the white frosted bar, subtle border, visible keyboard focus and restrained
hover underline. Add only a soft shadow after scrolling, not initial desktop
visibility. The green action is “Ingresar” for anonymous visitors, a native link
to the focusable `#contenido` landmark, returning to the very top of Home (including repeated activation), rather than aligning only the login card. The separate `#acceso` target retains its existing clearance for other links. With a verified
active session, replace it with “Mi cuenta” at the current role-resolved panel
destination (including `/dashboard` for candidates).
Right-aligned text links provide `Inicio` (`#contenido` on the homepage, `/` in
the account variant) and `Ofertas` (`/ofertas`). Use a native same-page anchor on
the homepage so repeated activation returns to the start and focuses `main#contenido`.
The link has no background, border or color filter; do not reuse the old green badge.
The landing page is called Home. In `HomeNavbar`, mark the current destination
with `aria-current="page"` and persist its existing hover style: green text and
underline for Inicio on `/`, and Ofertas on `/ofertas` and its detail routes.
Mi cuenta retains its own button hover treatment when its destination is current.
Ingresar is an in-page shortcut, not a separate current page. Preserve all anchor
destinations and navbar visibility rules; do not extend this navbar to other shells.
On the homepage only, hide the root skip-link bar completely, including from the
tab order. Use the navbar's existing `Inicio` link to return to the page start.
Preserve the global skip link on other routes and retain the homepage's unique
focusable `main#contenido` landmark. Verify repeated Tab navigation and Enter on
`Inicio` on both desktop and mobile; hiding the bar is not equivalent to a skip link.

## Landing access state and missing-field feedback

Show nonempty informational feedback in the Home login and both registrations
in the semantic informational color (`--color-feedback-info: #5758D6`, defined in
`src/app/globals.css`) with a decorative `Info` SVG from the existing `lucide-react`
library. Never substitute Unicode/ASCII glyphs or generated text for this icon.
Keep the existing
message text, live-region semantics and focus target. Preserve red error feedback,
including login failures that use `role="status"` with `text-red-700`, and leave
empty feedback collapsed without an icon. Static help and standalone forms retain
their existing appearance. Registration's conditional verification notice is
informational, not proof that an account or verification email was created.

Resolve the active-session projection once on the server for both navbar and
access panel. In login mode show “Ya tenés la sesión iniciada” instead of the
form/recovery link when active; keep both registration roles enabled. The login
service must check the authoritative session before provider sign-in, returning
the same safe feedback without sign-in, sign-out, redirect or revalidation when
already active. Keep anonymous login and suspension cleanup intact.
Below the active-session message, show a green role-specific panel link:
“Ir al panel de usuario” for candidates, “Ir al panel de empresa” for companies,
and “Ir al panel de administración” for administrators. Resolve its label from
the same verified session projection as its existing destination, never from the
registration role selector. Keep its
`Accesos principales` navigation landmark inside the access card, not in the
left introduction. Hide this card shortcut in registration modes and for anonymous
visitors. Public offers/detail pages retain their existing profile entries.

Homepage login and registrations opt into `Form missingFieldMessages="summary"`.
Suppress only generic required-empty text explanations. Keep the full error map,
accurate “Revisá los x campos indicados.” count, first-invalid focus, required
markers and `aria-invalid` red underlines. Do not remove useful format, length,
confirmation, custom or supplied server errors. Suppressed paragraphs must not
leave dangling error IDs in `aria-describedby`; preserve hints and labels.
Other forms retain the default inline explanations.

## Shared account workspace

Candidate, company and administrator panels use the same `DashboardShell` in
`src/components/ui/dashboard-shell.tsx` and the same `account.module.css` below.
Change sidebar, navbar placement, workspace/canvas geometry, heading rhythm and
identity styling there, not in role-specific copies. Shared CSS retains its
existing candidate-prefixed names for compatibility; company uses those same
classes. Role callers supply navigation, active links, persisted identity and
content only. `CompanyShell` supplies company headings/content in that frame for
dashboard, profile, offers, draft/detail, referrals and company `/account`.
The company canvas is white, not empty: existing business information/forms remain
inside it. Company identity shows legal name and verified session email (not the
editable contact email), falling back to Mi empresa when the profile is missing.
Cuenta keeps the password shortcut; logout appears once, in the shared sidebar.
No company/admin data or permissions are exposed through this presentation reuse.

`AdminShell` uses the same frame with Candidatos, Empresas, Ofertas,
Participaciones, Importaciones, Métricas and Mi cuenta. Existing management
content, contextual links and the internal-use notice remain inside `admin-canvas`.
Administración is a truthful role fallback, not an invented personal name;
each protected page supplies its verified session email. Loading shells show
Correo no disponible until that identity is available. Page-local role guards
are unchanged. Keep legacy admin-workspace CSS scoped to business content so
it cannot restyle the shared sidebar/navbar. Admin account retains password
and peer-administration controls, with logout only in the sidebar (EXTRA-068).

### Candidate account workspace

Candidate `/dashboard` (also rendered by `/account`) uses one shared centered white,
natural-height canvas capped at 960px for Perfil, Panel de usuario, Postulaciones
and Ofertas. The exterior is flat `--color-brand-primary`: no gradient or exterior
animation. Desktop main and the 264px fixed sidebar start at top 0 behind the
existing frosted navbar. Main padding-top is 96px (64px navbar + 32px clearance);
sidebar uses the same internal top padding, preserving unobscured links. The
canvas itself starts below the navbar, not behind it. Outer gutters are 24px on
desktop and 16px on mobile. Nonprofile headings/content share one padded inner
wrapper; the profile panel retains its own padding and `data-slot="profile-canvas"`.
Other sections expose `data-slot="candidate-canvas"`; all use `candidateCanvas`.
Below 768px the sidebar remains stacked in document flow, main uses 24px top padding
rather than desktop clearance, and workspace reserves 88px plus the bottom safe
area for the unchanged bottom navbar. This supersedes the earlier profile-only
animated-gradient treatment (EXTRA-063; `odd/tasks/candidate-panel-finalize.md` S2–S4).
The non-collapsible composition in `src/components/ui/sidebar.tsx`
adapts the [shadcn Base sidebar anatomy](https://ui.shadcn.com/docs/components/base/sidebar)
to existing local primitives and municipal tokens; it is not a full registry install
and does not introduce Base UI dependencies, a theme reset or a second palette.
The centered upper menu contains Panel de usuario, Perfil, Postulaciones, Ofertas and Cuenta. Its buttons
fill the sidebar's inner width, use a 56px minimum height, 16px text and 22px icons,
and retain a shared left-aligned icon/text column. Active
links use `aria-current="page"`. Cuenta (`section=cuenta`) contains the existing
password shortcut to `/update-password`, absent from the sidebar footer and other
candidate views. The unchanged logout form/action stays in the footer, followed by
a placeholder avatar with the persisted candidate display name and validated
session email. No photo upload or storage flow is implied by the placeholder.
Keep the email on one clipped line. Measure actual text overflow with ResizeObserver
and recheck after font loading and email changes. Only overflowing addresses loop
left with an aria-hidden duplicate: on hover/keyboard focus for desktop pointers,
automatically below 768px or on non-hover devices. Touch focus pauses the loop;
pointer exit resets the desktop position. Keep the complete email as its title
and accessible original text, and disable movement for reduced-motion preferences,
including while hovered. Addresses that fit must remain static without a duplicate.
Below 768px the sidebar moves into normal document flow before the main content.

Views are selected with `/dashboard?section=perfil|postulaciones|ofertas` and rendered
on the server, without iframes or duplicate main landmarks. Missing/unsupported
sections show the dashboard summary. Shared content preserves forms, notices,
application requirements, withdrawal confirmation and CV feedback without cloning.
Profile/offers links and pagination retain the section, selected offer and page;
public offer-detail links still open `/ofertas/[openingId]`. Its application link
opens `/dashboard?section=ofertas&oferta=<slug>`.
Archive controls remain absent from this candidate account screen. Administrator
screens reuse the shared dashboard frame. CV uploads allow only exact `/dashboard?section=perfil` or
`/account?section=perfil` return contexts; unsupported contexts fall back to the
dashboard profile. Administrative uploads keep their candidate detail destination
or the administration list for malformed IDs. See EXTRA-056, which supersedes
the legacy route compatibility in EXTRA-046.
`/candidato/perfil`, `/candidato/ofertas` and `/candidato/postulaciones` have no
page, rewrite or redirect: direct requests, including query variants, return 404.

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

Preserve the complete municipal information from the historical `src/app/(auth)/login/page.tsx`
and the supplied screenshot: office/municipality identity, “El empleo en Funes,
con acompañamiento municipal.”, the introduction, Postulantes/Empresas descriptions
and the municipal intermediary notice. This replaces the former employment slogan.
Use the existing fonts, icons and identity asset; do not change business wording.

The introduction swaps between login, postulante and empresa instead of
replacing its text instantly. Remount it per view and let each direct block
enter with a 420ms fade plus an 8px rise, staggered 45ms up to the fifth block.
Keep the animation decorative: no text, order or destination changes, no
residual transform once it settles, and `animation: none` under reduced motion.

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
Animate its horizontal position in both directions over 360ms with the card's
ease-out timing. Keep it in normal flow without horizontal movement on mobile;
disable the transition for reduced-motion preferences.
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
Required indicators derive from the existing native `required` attributes.
Use a single shared Field marker, not an additional CSS pseudo-element.
Homepage login starts without markers; submitting an empty required field shows
a red marker. Homepage registration starts with gray markers, turning red only
for missing required values after submission. Correction hides the login marker
or restores registration gray; other invalid nonempty values retain their error
messages and ARIA state. Other forms keep their existing red markers.
Optional phone has no asterisk or “(opcional)” suffix on the homepage.
Both homepage registration forms end with “Los campos marcados con * son
obligatorios.” below the submit. Registration password guidance is only
“Entre 6 y 128 caracteres.”; remove “No compartas tu contraseña.” from registration
but preserve it in login and password-change flows. Native limits and confirmation
validation remain unchanged.

The homepage is the unified login surface. `/login` returns 404, with no redirect
or duplicate page. Login links and logout go directly to `/`; password changes
return to `/?changed=1`. This supersedes the temporary compatibility redirect
recorded in EXTRA-051 (login), per EXTRA-056. The left
introduction contains no account/profile, Ofertas or Iniciar sesión shortcuts.
Keep authenticated panel access inside the login card and in the navbar, plus
the existing lower offers shortcut.

Below 768px, show the complete municipal introduction first, followed by the
login/registration card, then the offers footer. Reuse the same content and DOM
order as desktop, without duplicating text. Use 24px introduction top padding
with the navbar now below, and leave 32px between introduction and card.
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

The floating “Ver ofertas disponibles” action uses the navbar's frosted finish,
with 85% white and the same 16px backdrop blur, plus solid fallback.
Its existing light-green hover tint also remains 85% opaque where supported;
the navbar uses the same 85% white.
Keep the text and arrow fully opaque, and preserve its shape, position and focus.
It links to `#ofertas-disponibles`, the currently empty white section below the
hero. Native smooth anchor scrolling
aligns the section with the viewport top, with zero target scroll margin, so no
part of the hero remains visible. Preserve the fixed navbar overlay and the
separate access-panel clearance; do not apply a navbar offset to this full-screen
section jump. Scrolling becomes instant for reduced-motion preferences. Do not
add placeholder job offers to this section.

## Verification

- Run `npm run test:unit -- tests/components/foundation/municipal-visuals.test.tsx`
  and the affected existing component tests.
- Against an already running local application, run
  `node tests/visual/municipal-style-check.mjs` (optionally set `VISUAL_BASE_URL`).
  It checks desktop/mobile login and both registration forms, fonts, underlines,
  labels, focus, toggles and generic controls without submitting forms.
- Run `node tests/visual/candidate-workspace-check.mjs` for standalone 1440px/390px
  geometry checks of all four candidate sections, with both motion preferences.
  The runner exports actual React composition from the focused component test,
  compiles current global/module CSS without Next, and writes screenshots/results
  under Hermes scratch (or `CANDIDATE_WORKSPACE_OUTPUT_DIR`). Services use explicitly
  fictitious mocked fixtures: this proves layout, not live authenticated data.
  It checks flat primary green, white centered natural-height canvas, navbar/sidebar
  clearance, bottom-navbar reservation and overflow. Headless safe-area env is zero;
  the additive `env(safe-area-inset-bottom)` declaration is checked separately.
  `profile-gradient-check.mjs` is retained only as an entrypoint to this static proof.
- Run repository-required unit tests, lint, typecheck and production build.
- Run `node tests/visual/home-responsive-layout-check.mjs` against a local server
  for full-height registration, width animation, required markers and mobile
  overlay/contact-row layouts; it never submits forms or resets data.
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
