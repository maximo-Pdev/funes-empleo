# Municipal visual reference

## EXTRA096 — CV por postulación

CV acepta PDF/JPG/JPEG/PNG hasta5 MiB; excluir WebP/video y animaciones. Explicar
que imágenes se preparan como PDF; no cambiar visor o estilos de formularios.
En Postularme, archivo opcional: sin archivo usa CV general actual; con archivo
usa CV específico sin reemplazar general. Selección fija después de enviar.
Errores conservan archivo/datos; éxito deshabilita nuevo envío hasta refresh.
Caso municipal y postulaciones propias enlazan CV elegido, referencia opaca y
nueva pestaña. Reutilizar Form/FileInput/Button y foco de feedback.

## EXTRA094 —2026-10-28

CV: Abrir CV, nueva pestaña y rel noopener noreferrer; conservar estilos/primitivas.
Métricas: seis tarjetas principales, dos distribuciones de barras con etiquetas/
valores textuales y tokens, sin depender del color; datos restantes en Ver detalle
cerrado. Definiciones en Más información, guardas y descargas completas intactas.
Consentimiento aceptado muestra estado, sin checkbox/botón de aceptación. Texto
explica conservación al contratar y No disponible, acceso720h de empresa contratante
y que permisos revocados no regresan. Datos de prueba siguen sin aprobación legal.

## Portal follow-ups — EXTRA085

EXTRA090: name both popup and list of every combobox for its field (categories,
locality and offer options), including open/closing states. Reuse the adapted
Base primitives and their ARIA props. Multiple selection stays open until Escape
or dismissal; tests should operate the visible combobox by role and close it
before acting on controls it covers. Keep native auxiliary validation inputs.

EXTRA089: the candidate-search locality wrapper is positioned relative so its
visually hidden native FormData/validation input stays within the field under
administrative full-width input rules. Preserve native validation and combobox
focus; do not hide page overflow or relax viewport/accessibility checks.

EXTRA088: Home shows the ten newest eligible offers by publication date. Keep the
3D/mobile carousel with circular neighbors and previous/next navigation: last and
penultimate left of first, first and second right of last. Mobile uses Embla loop
with its fallback for insufficient slides. Candidate preview dialogs lock background
scrolling while keeping internal scrolling, Escape and focus restoration.

EXTRA087 supersedes EXTRA086: advance every three seconds on desktop and mobile,
then return to the first offer. Keep only previous/next buttons (circular EXTRA088);
remove Pausar/Reanudar. Mouse hover and focus pause only while interacting;
leaving resumes automatically. Reduced-motion disables autoplay and hidden tabs
do not advance. Use pointer-type-aware hover to avoid permanent touch hover.

Search forms are composed on the server with native GET names and opaque category
references. Keep shared validation and combobox interaction as narrow client
islands. Candidate locality is optional; matching order applies with an explicit
“Aplicar orden” submit and resets pagination. Metrics offers separate filtered PDF
and Excel downloads using existing institutional colors and local PDF fonts.
See `docs/implementation/portal-filters-audit.md` for the surface inventory.

## PR 78 validation and matching corrections — EXTRA-084

Company Localidad remains a required catalog combobox. Its validation participates
in the shared Form summary, required marker, invalid description and first-error
focus; a hidden FormData value alone is not native required-field validation.
The registration keeps eight required fields and an optional contact phone.
User-facing focus/touch checks exclude library auxiliary inputs and explicitly
exercise the real combobox with the keyboard.

`odd/tasks/portal-polish.md` S22/S27 supersedes the older matching-card geometry:
candidate and matching results use the adapted table, retaining twelve matching
results per page, global ordering, accessible profile preview and nomination.
This records the existing authorized migration, not a new listing redesign.

## Home live public totals — EXTRA-079

Replace the former role-guide cards with “El portal en números”: Postulantes
registrados, Empresas registradas and Ofertas vigentes. Use three balanced cards
on desktop and a single column below 768px, the existing institutional tokens,
Sora numbers, Be Vietnam labels and decorative Lucide icons. Counts come from
`public_portal_counts`, never constants or the ten-card carousel limit (EXTRA088).
Count nonarchived profiles, including assisted/imported, incomplete and suspended
registrations; count offers through the same public eligibility view as the catalog.
Render genuine zero as zero; render unavailable totals as an em dash with an
explanation, never zero. Keep all other Home sections and closing shortcuts intact.
This supersedes older guidance preserving the “Cada perfil entra por el camino
correcto” cards, not the role-specific registration guide in the hero.

## Opaque navigation surfaces (current override)

The navbar and Home's offers shortcut now use opaque white backgrounds, with
no backdrop blur. Keep the shortcut's existing opaque light-green hover state.
The navbar has no divider border or scroll shadow; this supersedes the older
frosted-glass references below without changing visibility, timing or navigation.
Desktop dashboards share a white navbar/sidebar junction with a 24px inward
curve at the 264px sidebar edge and 64px header bottom. A non-interactive fixed
pseudo-element rounds the green workspace corner without moving content. Do not
draw this corner in the stacked mobile layout. Preserve the current mobile sidebar
collapse behavior and top navigation.

Use the official Funes website as a visual reference, not as a template dependency.
This guide records the portal's current implementation choices so future sessions
and both developers can keep pages consistent. It is not a municipal identity
manual or evidence of stakeholder acceptance.

## Before changing a page

EXTRA073: detalle administrativo de oferta conserva grilla responsive; Oferta y
empresa izquierda, Decisión municipal e Historial de moderación derecha. Móvil
apila en ese orden antes de matching. Enlace a participaciones usa variantes
del Button municipal en link semántico (mínimo44px, foco visible, texto adaptable).
Matching incluye selector de última actualización con dos órdenes; cambiarlo
reinicia página y mantiene URLs opacas. Reutilizar SelectField con placeholder
opcionalmente omitido; no alterar sus defaults ni controles de otros perfiles.
El enlace destacado usa data-slot=link-button para conservar el texto blanco
de sus variantes frente al override de enlaces del panel, también en hover.
Historial de moderación conserva cinco eventos iniciales y revela cinco por
Mostrar más; ocultar ese botón si no quedan otros. Mantener foco y anuncio.

EXTRA072: Consentimiento de prueba del perfil propio muestra dos párrafos
visibles y cuatro dentro de Más información, cerrado inicialmente. Usar el texto
literal de Mateo; retirar el apartado de política/versión/aviso de esta vista.
Reutilizar details/summary y su foco; mantener estado, acción y aceptación explícita.

EXTRA071: DNI/CUIT del perfil propio permanecen ocultos al abrir; botón de ojo
Mostrar/Ocultar junto al input, operable por teclado y con nombre/estado accesibles.
Conservar valor, foco, validación y errores; reutilizar Field/Button municipales.
No incorporar estos botones en registros, vistas de terceros o atención presencial.

Home's left introduction follows the access selection: login retains its municipal
message; candidate and company registration reuse the original registration guide,
steps and privacy notice. Company registration also retains the documentary
verification disclaimer. Switching back to login restores its original copy.

EXTRA-072 (2026-10-25): Home is also the only registration surface. Retire
`/registro/candidato` and `/registro/empresa` with HTTP 404 and no redirect or
`Location`, including query variants; keep the shared forms and actions.
Normal activation of registration links within Home selects the intended role
in the existing access panel, keeps the current URL/page unchanged, scrolls the
document to `scrollY=0` and focuses `#acceso` with focus-induced scrolling
prevented. Keep selector and introduction synchronized, including repeat clicks
and keyboard activation. Reduced motion uses immediate rather than smooth scroll.
From other pages, new contexts or without JavaScript, use `/?registro=candidato`
or `/?registro=empresa`; only exact single values select registration. Missing,
unsupported or array values default to login. A fragment alone is not a role
selector. Do not restore a standalone registration layout or redirect alias.

EXTRA-073 (2026-10-25): account lifecycle states also live in Home's access card.
Retire `/account-suspended`, `/recovery-invalid`, `/session-expired` and
`/verification-pending` with real HTTP 404 (no redirect or `Location`) and send
their consumers to one validated state: `/?acceso=suspendido`,
`/?acceso=sesion-vencida` or `/?acceso=recuperacion-invalida`. Only exact single
values select a state; anything else shows the plain login card, and a verified
active session always keeps its own panel instead of any notice. Suspension shows
the Office contact message with no login form (the submission cannot succeed);
the expired session shows the notice above the login form; an invalid recovery
link shows the notice above the recovery renewal form and a "Volver a iniciar
sesión" link to `/`. Use the shared `AccessNotice` (`src/features/accounts/
components/access-notice.tsx`): semantic `info` tone with `--color-feedback-info`
for the expired session and `alert` tone with the established error red for
suspension and the invalid link. Do not add a live-region role to a notice that is
present at first render; the card already has one status region in the active
session state. `/verification-expired` keeps its URL and "Reenviar verificación"
form and adopts Home's paper: principal-green field with `--shadow-inner-panel`,
the same `.panel`/`surface-bevel` card, Sora heading, shared underlined controls
and the `recoveryLink` back-home shortcut. The pending-verification information
stays in the registration card's existing informational response.

EXTRA-075 (2026-10-25): after a registration submit returns its safe response, the
card stops being a form. It shows one compact confirmation state instead: the
"Revisá tu correo electrónico" heading (focused, `tabIndex=-1`, one `h2`), the
safe response, the confirmation resend and a "Volver a iniciar sesión" link. The
role selector, the form and the required-fields note leave together, so the card
shrinks — measured 738px to 372px at 1440×900, with the hero staying at exactly
the viewport — instead of growing past the fold. Never append the resend as an
extra block under a full registration form: that stretched the card and the
desktop hero. The resend control prompts "¿No recibiste el correo de
confirmación?", uses the shared secondary `Button`, stays disabled for 30 seconds
with a visible countdown ("Reenviar en 30 s") and is then labelled "Reenviar
correo de confirmación". It calls the existing non-enumerating
`verificationAction` with the email captured at submit time — never with the
editable field — reports the safe response in a polite status region and restarts
the wait. The countdown is a client-side UX guard, not a security control: one
`setInterval` per cycle driven by a local counter, with the button remounted per
cycle (`key`) so a reset never needs `setState` inside an effect. The submitted
form stays mounted but `hidden` while the confirmation is shown (and while the
session tab is active after a submission), so returning to "Registrarse" restores
every entered value and registering again is one click; do not unmount it there
or the user retypes everything. "Volver a iniciar sesión" must switch the card to
login and clean the URL — a plain `Link href="/"` alone is not enough, because the
navigation resolves after the visible state and a user can end up on the login
card with `?registro=` still in the address. Keep the control at 44px and do not
add a new server action, endpoint or enumeration surface.

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

## Status badges

Every displayed domain status uses the shared `Badge` with `variant="status"`:
a pill with a 7px dot on the left, a 1px border and the label in the solid
state colour, over the same colour at ~8% over white. Do not hand-roll dots,
coloured chips or local label maps for a status.

```tsx
<Badge variant="status" tone={statusTone(openingStatusTones, opening.status)}>
  {displayLabel(openingStatusLabels, opening.status)}
</Badge>
```

- Tokens: `--color-status-{green,red,amber,blue,violet,neutral}` and
  `--color-status-*-soft` in `globals.css`; the status → tone mapping lives only
  in `src/domain/presentation/status-tone.ts`, next to the labels it pairs with.
- Colour meaning: green = active/published/hired/valid; red = rejected,
  suspended, blocked, failed, no-show, withdrawn consent; amber = pending,
  awaiting action, needs update; blue = in progress (review, pre-interview,
  preselected, uploaded, scheduled); violet = referred and company interview;
  neutral = draft, paused, closed, cancelled, archived, unavailable.
- Excluded surfaces: `<select>` filters and decisions keep plain labels;
  moderation and audit histories stay as text; the public offers pages only list
  published openings; import rows do not show a row status.
- `default`, `secondary` and `outline` keep their previous meaning and must not
  be used for a domain status.

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
Below 768px it is fixed at the top, visible and interactive without scrolling,
with no slide transition and a 64px control row. Home's introduction starts at
88px, leaving 24px below the navbar; its access anchor uses 88px clearance.
The shared account workspace reserves 64px above its stacked sidebar. Do not
retain the bottom-navbar padding or bottom safe-area height from EXTRA-058:
EXTRA-076 restores upper navigation without changing the current opaque white
material, lack of borders/shadows or desktop behavior.
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

At Mateo's explicit request (A16 / EXTRA-053, 2026-10-23), remove the root
“Ir al contenido principal” link on all routes, not merely its styling or tab stop.
Keep the unique `main#contenido` landmark, page headings, named navigation,
existing focus targets and visible keyboard focus. The homepage navbar's `Inicio`
link still returns to and focuses the main landmark. Verify repeated Tab/Enter
on desktop and mobile. Landmarks preserve assistive-technology navigation
([W3C ARIA11](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11)); `Inicio` is not
a universal replacement for a skip link, nor does plain Tab skip every header.

## Administrative assisted-service section

EXTRA057 removes the independent “Intereses laborales” field. Candidate,
assisted/admin, employer referral and offer-preview screens use only “Categorías
laborales” with category names, without occupation/interest type labels. Reuse
the existing category controls, errors and focus; do not introduce a new selector.

EXTRA056: the interactive creation form requires activation data and available
status, displays the current consent policy and an unchecked explicit attestation
of the person's in-person acceptance. Saving creates an active profile atomically;
PDF remains optional for internal evaluation. Existing-profile maintenance and
duplicate resolution never silently reactivate or renew consent. Hiring retains
the existing global withdrawal, labelled “Consentimiento retirado”.

The existing administrative sidebar includes “Atención presencial”, linking to
`/admin/atencion-presencial`. Use the same menu treatment, responsive layout and
aria-current behavior; do not introduce a second sidebar. The list is restricted
on the server to origin=assisted, including profiles that later claimed an account.
Default vigency/eligibility filters to all so unfinished profiles remain visible;
preserve the existing eligibility calculation and show Spanish states. Cards open
the existing candidate detail; archived entries retain its read-only restrictions.
The section itself renders the existing AssistedProfileForm above the filters
and list, so administrators can create a profile without first leaving this page.
Keep its validation, duplicate resolution, save action and maintenance destination.
The creation route `/admin/candidates/assisted` stays intact, with a return link to the new
section. The former per-candidate maintenance route `/admin/candidates/assisted/[candidateId]`
was retired: maintenance now happens in the candidate detail. Filter submission and pagination
stay inside the section and use opaque category/candidate references (EXTRA-055).

## Administrative candidate CV

EXTRA058: the candidate detail has no nomination form/offer selector. Its existing
Ofertas navigation remains; nomination stays in the offer's candidate preview.
Assisted maintenance links to CV/notes/history without promising nomination there.

The administrative candidate detail shows the current valid, non-archived CV's
safe filename and size, with a native protected download link using its opaque
reference. Do not embed Storage paths, signed URLs or historical files as current.
Without a current CV show “El candidato no tiene un CV vigente.” and no download.
Keep the existing archived-profile restriction. The existing upload/replacement
form lives in the assisted-maintenance screen, reached through “Mantener perfil
y atención presencial”; its validation, version checks and permission rules stay
unchanged. Candidate self-service and company referral access are unaffected.
See EXTRA-054. No embedded PDF viewer or new file exposure is introduced.

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

### Keeping typed values across the access tabs

The access card keeps one form mounted at a time. Before every mode, role or
submit change it reads the mounted form with `FormData` and stores the values in
panel state (`data-access-key` on the content node names the current form), then
the next form mounts with them as `defaultValue`. Never keep a second, hidden
copy of a form to preserve values: two mounted forms duplicate labels and make
`getByLabelText` ambiguous for every test and for assistive technology.

Every field belongs only to its own login, candidate-registration or
company-registration draft, including `email`, `password` and `confirmation`.
Never copy credentials between forms or auto-fill confirmation from password.
Returning to a form restores its own values; clearing a field clears only that
form's value. This supersedes EXTRA-080's identity-sharing behavior (EXTRA-082).
Keep state in memory only — no `localStorage`, cookies or server writes —
and in scope of the card, so a reload starts clean.

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
natural-height canvas capped at 1280px for Perfil, Panel de usuario, Postulaciones
and Ofertas. Company and administrator canvases share this same cap (EXTRA-071).
The exterior is flat `--color-brand-primary`: no gradient or exterior
animation. Desktop main and the 264px fixed sidebar start at top 0 behind the
existing frosted navbar. Main padding-top is 96px (64px navbar + 32px clearance);
sidebar uses the same internal top padding, preserving unobscured links. The
canvas itself starts below the navbar, not behind it. Outer gutters are 24px on
desktop and 16px on mobile. Nonprofile headings/content share one padded inner
wrapper; the profile panel retains its own padding and `data-slot="profile-canvas"`.
Its separate heading uses the same inset as the panel: 28px top/sides on desktop,
20px top and 16px sides below 640px. Keep its bottom margin at zero so the panel's
own top padding provides the heading-to-photo separation without a doubled gap.
Other sections expose `data-slot="candidate-canvas"`; all use `candidateCanvas`.
Below 768px the sidebar remains stacked in document flow, main uses 24px top padding
rather than desktop clearance, and workspace reserves 64px above the sidebar for
the top navbar, without a bottom-navbar reservation. This supersedes the earlier profile-only
animated-gradient treatment (EXTRA-063; `odd/tasks/candidate-panel-finalize.md` S2–S4).
The composition in `src/components/ui/sidebar.tsx`
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
All three account roles use `DashboardSidebar` for mobile collapse (EXTRA-069).
Initially expanded, it places a 44px circular green double-chevron Button below
the existing identity. Collapse hides navigation and logout with `display: none`,
removing their controls from keyboard and accessibility navigation, while keeping
the avatar, account name and verified email visible. The control exposes Spanish
expand/collapse labels, `aria-expanded` and both controlled region IDs. Its arrow
points down when collapsed and up when expanded. No animation or stored preference
is introduced. At 768px and wider the toggle disappears and navigation/logout
remain visible regardless of mobile state; desktop geometry is unchanged.
Keep the icon-bearing navigation server-rendered; pass composed React nodes into
the small client controller instead of sending Lucide component functions across
the server/client boundary. This does not add photo fetching or change identity.

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
order as desktop, without duplicating text. Use 88px introduction top padding
to clear the 64px top navbar by 24px. Leave a separate 32px top margin before the
green access area plus its 32px inner top padding before the white card.
Use 32px before the intermediary notice on mobile; preserve all its wording.
The card remains horizontally centered and naturally sized in every access mode;
do not vertically center login independently or add a second top clearance for
registration. Let the document scroll instead of clipping any content.

Keep one animated ribbons background covering the mobile hero; its decorative
wrapper uses display: contents while the absolute canvas/overlay layers fill the
hero. The mobile access wrapper retains the same primary-green background and
shared inner shadow as desktop, with the unchanged white card above it. Use 32px
top and 20px horizontal inner padding. Its existing offers footer belongs inside
this same surface, below login or either naturally sized registration card, with
24px above and below the shortcut. The green continues uninterrupted to the
available-offers section, with no bottom margin or separate canvas strip.
These revisions supersede the transparent mobile access treatment and its
subsequent card-only green area (EXTRA-077, EXTRA-078). The removed portal title
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

## Atención presencial integrada — EXTRA059

EXTRA062: oferta empresarial muestra en su misma página derivaciones y moderación;
conservar sanitización por rol y enlaces canónicos previos. Moderación empresa/admin
presenta5 recientes con Ver más por5/foco/anuncio. Editar publicada explica que vuelve
a revisión; controles compartidos/asteriscos/errores y valores conservados. Eliminar
requiere motivo/confirmación y deja visible Cancelada; no borrar historial. Contratado
propio puede mostrar solo nombre cuando el permiso completo ya no está disponible.
Las ofertas empresariales existentes abren en consulta: «Editar oferta» revela
el formulario solo si su estado permite edición; «Cancelar edición» vuelve al
detalle. Guardado correcto vuelve al detalle actualizado, error conserva valores.
Alta nueva directa; conservar foco, validación y reenvío a revisión de publicadas.

EXTRA061: «Historial de cuenta y perfil» de candidatos muestra solo los eventos
elegidos en spec, con evento y fecha/hora. Sin actor/código/estados/motivo en cada
entrada. Cinco iniciales y Ver más incremental, con progreso accesible/error/
reintento/foco en entradas nuevas. Reutilizar controles compartidos y conservar
registro interno íntegro; vacío dice «Sin eventos para mostrar», sin afirmar
que no existen registros auditados. Otros historiales sin cambios.
La fecha usa America/Buenos_Aires y hora24h explícita para evitar ambigüedad AM/PM.

En el detalle administrativo del candidato, reutilizar los formularios de edición,
consentimiento/activación, carga de CV y vinculación solo si el origen es presencial,
no tiene cuenta vinculada y no está archivado. No duplicar notas/historial/CV ni
mostrar el enlace intermedio de mantenimiento. Después de vincular, conservar la
consulta administrativa y retirar esos formularios. Mantener componentes, campos,
validación, foco y reglas vigentes; diseño en dos columnas que apila en móvil.
El perfil asistido vinculado ofrece los mismos controles administrativos que
un perfil normal con igual estado de cuenta. El origen histórico se conserva.
EXTRA070 sustituye el orden EXTRA060: para todos los candidatos, Perfil candidato
y CV PDF del candidato van antes del formulario y listado de notas internas, en
la primera columna. Mantener perfil presencial, si corresponde, sigue primero.
Participaciones y demás controles conservan la segunda columna. En móvil se
apilan las columnas respetando el DOM. No duplicar tarjetas ni cambiar visibilidad.

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
  clearance, mobile top-navbar reservation and overflow.
  `profile-gradient-check.mjs` is retained only as an entrypoint to this static proof.
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

## Nombres en derivaciones empresariales — EXTRA069

Lista y encabezado identifican al candidato por su nombre actual; el código de
derivación permanece secundario. Si terminó el permiso, explicar que solo se
conserva el nombre para identificar el caso, sin perfil/contactos/foto/CV.
Mantener selección por referencia opaca, formularios y reglas de informe vigentes.

## Current change review

The 2026-10-20 alignment replaces Arial, maps legacy primary `#006833` to
`#074A1F`, maps the general foreground to `#262B35`, introduces the observed
medium gray, replaces shared blue buttons/focus, and changes boxed fields to
underlined fields. Functional behavior and page composition are unchanged.
See `cambios-extra.md`, EXTRA-042, for checks and remaining review status.
