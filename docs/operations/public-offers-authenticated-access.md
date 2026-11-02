# Acceso desde ofertas públicas

## Current integration authority — EXTRA-120

Maxi's final decision is **"bueno conservamos el hero para todos y adaptamos la tarjeta derecha"**. This is the current presentation amendment for the open merge of local `3d162f3` and main `1e3cdab`, traced by S2/S3/S5 in `odd/tasks/ofertas-navigation-integration.md`. It supersedes main EXTRA-118's authenticated offers-first/no-Hero route composition, including later PR88-MAIN-01 statements retaining it; those statements remain historical evidence, not current instructions.

| Surface | Current contract |
| --- | --- |
| Home, every role | Keep the animated Hero and institutional introduction. Guests retain the existing login/registration, role guides, draft isolation and lifecycle notices unchanged. Active sessions keep the right card with a brief welcome/status, primary verified role-panel link, Ver ofertas and secondary existing logout action; omit login/registration tabs/forms and anonymous closing registration entrances. Keep PR89's gray active-state treatment. Active registration/access queries cannot reopen forms or replace the session. |
| Shared navigation | Reuse actual HomeNavbar on normal public, auth/legal and dashboard pages. Guests: Inicio, Ofertas, Ingresar; active sessions: Inicio, Ofertas, notifications and Mi cuenta. Resolve all panel links from the same verified `getSiteAccess().panel`: candidate `/dashboard`, company `/empresa`, administrator `/admin`. No guessed roles, private notification reads for guests or navigation-based authorization. Preserve Home desktop scroll/reveal/timers, mobile visibility, fixed-header clearance and inner-page visibility. Ingresar uses `#contenido` on Home and `/#contenido` elsewhere, with main focus. Minimal technical fallbacks remain separate. |
| Public catalog | Remove both help/accompaniment cards and duplicate header/profile shortcut. Use the full content area, retained GET filters, shared numeric pagination for every page with current-page semantics and wrapping, and centralized decorative category icons with readable text/neutral unknown fallback. Native select text, IDs, validation and FormData stay unchanged. |
| Public detail | Use the actual shared navbar and existing white `candidateCanvas`/`sectionContent` canvas capped at 1280px on static green, without sidebar/junction. Breadcrumbs are Inicio / Ofertas / current title using adapted base-nova primitives. Retain every condition, task, requirement and optional salary/benefit, closing date once, then one unchanged final application link and slug. Remove both entire opportunity/accompaniment cards. Do not replace that application link with role-panel or registration CTAs; panel access belongs in the navbar and destination guards remain authoritative. Use LinkButton JSX, never call client `buttonVariants` from a server page. |
| Compatible main layout | Retain public catalog/courses/wide Home section expansion to 1800px from 1440px and private usable-width layouts, card/row symmetry, natural mobile heights, stable DOM order and complete actions. Detail's explicit 1280px cap is the exception; removed asides cannot justify empty pairing cards or an aside-dependent grid. Retain narrow-navbar spacing, touch targets and sidebar footer/scroll access. |
| Collections and retirement | Retain main's 10-record pages, initial five history/note records with access to all remaining records, selected/hash reveal, stable order/focus/counters, complete aggregate/export/option scope and unchanged privacy. Retain EXTRA-119's private append-only backup, atomic retirement/recovery, active-selector and metrics behavior, no automatic equivalence or history loss. This integration authorizes no migration execution or reset. |

### Evidence and precedence

The branch paragraphs below are preserved verbatim as provenance wherever possible. Any older header/sidebar/account-section target, role-override application CTA, active registration-tab instruction, uniform private-canvas cap or authenticated no-Hero requirement is **historical and superseded only for the scope in the table above**. Compatible requirements and all existing consent, referral, CV/photo, notification, hiring-window, audit and retirement restrictions remain effective; presentation is not authorization. EXTRA106/108 rollback is limited to its originating Home/login experiment, not independently approved features.

Historical verification and approval paragraphs retain their original qualifications; they do not prove this integrated tree, current CI, PR review, product acceptance or municipal/legal approval. Integrated source/browser/non-reset gates and exact-head GitHub application/database checks remain **PENDING**, owned by the parent. This documentation unit runs structural checks only and changes no source, tests, schema, credentials, local records or remote state.

See the title/branch disambiguation table in `cambios-extra.md` under EXTRA-120; bare EXTRA112–116 references are not globally unique.

> Preserved local branch wording; historical wherever superseded by EXTRA-120 above. Compatible requirements remain effective.


EXTRA106/108, 29/10/2026. Mateo conserva solo el ajuste de /ofertas y descarta los
cambios del inicio/login, cuyo diseño y comportamiento vuelven al estado previo.

Actualización EXTRA-112, 31/10/2026: se eliminan las dos tarjetas laterales y
el acceso duplicado al perfil del encabezado de /ofertas. El listado ocupa todo
el ancho disponible. Se conserva la lectura de sesión verificada en servidor:

- Candidato, empresa o administración: «Mi cuenta» en la navegación principal
  conserva el destino de cuenta correspondiente al rol.
- Visitante: «Inicio» permite volver a Home para ingresar o registrarse.
- EXTRA-113: el detalle también usa la misma navbar compartida. Sus tarjetas
  laterales se retiran y la postulación queda al final de toda la información,
  conservando el destino de candidato y el identificador público de la oferta.

No requiere migración, variables nuevas, dependencias ni configuración de
Supabase/Vercel. No cambia registro, recuperación, permisos ni reglas de sesión.
Se usa una lectura por request para la navbar, sin estado global entre personas.

> Preserved main branch wording; historical wherever superseded by EXTRA-120 above. Compatible requirements remain effective.


## Historical access-note versions — superseded presentation clauses

The original versions below retain branch history. Account-section destinations, absent guest Ingresar and role-override detail CTAs are historical; use the EXTRA-120 table above. Their guards and privacy restrictions are not weakened.

> **Historical presentation wording:** any conflicting Hero, aside, CTA, width or navigation-target clause in this preserved paragraph is superseded by the current EXTRA-120 contract above; unrelated privacy and business restrictions remain unchanged.

EXTRA112,31/10/2026: catálogo y detalle comparten ahora HomeNavbar y getSiteAccess
por request. Mi cuenta abre el panel del rol y la campana solo se monta con panel
verificado. El detalle tampoco ofrece registro a personas ya autenticadas y solo
candidato/visitante conservan postulación; otros roles reciben su propio panel.
Sin cambiar guards, sesión o permisos. Ver public-offers-presentation.md.

EXTRA106/108, 29/10/2026. Mateo conserva solo el ajuste de /ofertas y descarta los
cambios del inicio/login, cuyo diseño y comportamiento vuelven al estado previo.

En /ofertas, la tarjeta lateral usa la sesión activa verificada en servidor:

- Candidato, empresa o administración: enlace a su panel, sin «Crear cuenta» ni
  «Iniciá sesión».
- Visitante: «Crear cuenta» abre /?registro=candidato; «Iniciá sesión» abre /.

No requiere migración, variables nuevas, dependencias ni configuración de
Supabase/Vercel. No cambia registro, recuperación, permisos ni reglas de sesión.
Se usa una lectura por request para header y CTA, sin estado global entre personas.

Verificación: public-offers.test.tsx y session-navigation.spec.ts para los tres
roles, visitante, navegación y cierre de sesión. El inicio conserva sus pruebas
previas. Requiere PR/publicación para verse en Vercel.
