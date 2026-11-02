# Catálogo y detalle públicos — EXTRA112

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


## Current manual verification checklist (pending)

1. As a guest and each active role, confirm the same session-appropriate navbar on catalog/detail and normal auth/legal/dashboard pages; guest Ingresar returns to Home and focuses its main. Check role-panel destinations separately from the unchanged application destination.
2. In the catalog, search/reload/clear GET filters and navigate every numeric page; confirm current-page semantics, retained category text/icons and no help aside or duplicate profile shortcut.
3. Open an eligible public slug; check complete fields and optional sections, breadcrumbs, closing date once, white 1280px detail canvas on green, no asides, and the original single final application link below all information for every session state. Destination guards still decide eligibility.
4. Check mobile 320/390 and desktop 1366/1920/2560: fixed-header clearance, narrow-navbar separation, keyboard focus, 44px targets, wrapping and no horizontal overflow. Catalog expansion does not widen the detail beyond its explicit cap.
5. Check Home guests/both registrations and all active roles: Hero remains; active right card has no auth tabs/forms, only brief status/welcome, verified panel access, Ver ofertas and logout. Preserve guest drafts, Home desktop scroll reveal and one h1; offers section remains below the Hero.

These are pending integration checks, not results. Retain real session renewal, no-store, logout and revoked-session denial coverage; no retries or weakened privacy assertions substitute for proof. Parent owns execution and exact-head CI.

## Historical main implementation note — superseded presentation clauses

The following complete original note preserves its contracts and verification receipts. Its aside/manual-check and role-override CTA promises are superseded by EXTRA-120; its past passes are not new integrated results. The scope of its recovery is that original presentation delta, not unrelated privacy, collection or retirement work.

Pedido de Mateo del31/10/2026. Ambas vistas públicas reutilizan HomeNavbar y un
contenedor servidor local: fondo verde, lienzo blanco, encabezado compacto,
tipografía municipal y tarjetas con bordes y espaciado consistentes. El detalle
mantiene condiciones, tareas, requisitos y salario/beneficios cuando existen.

La navbar está siempre visible y marca Ofertas como sección actual, también en
un detalle. Se eliminan el header/logo alternativos y el segundo acceso de cuenta.
Con sesión activa, Mi cuenta lleva al panel del rol y se muestra la campana;
sin sesión, no se consultan avisos privados. HomeNavbar no se modifica: solo se
reutiliza con su contrato existente. Bajo359px se ajustan espacios exclusivamente
dentro de estas páginas, conservando todos los enlaces, el emblema y la campana.

> **Historical presentation wording:** any conflicting Hero, aside, CTA, width or navigation-target clause in this preserved paragraph is superseded by the current EXTRA-120 contract above; unrelated privacy and business restrictions remain unchanged.

En el detalle, candidato y visitante conservan Postularme con mi cuenta y el
destino por slug. Registrate aparece únicamente sin sesión activa. Empresa y
administración reciben el acceso a su propio panel; no acciones de candidato.
Esto es presentación: los guards, consultas y políticas siguen autorizando cada
destino en servidor y base de datos.

## Contratos preservados

- Filtros de texto, rubro, localidad y modalidad con GET; valores, validación,
  búsqueda/orden/paginación en servidor y reinicio de página al buscar.
- Slugs persistidos, fechas DD/MM/AAAA y elegibilidad pública por estado/vigencia.
- Vacíos, filtros inválidos, errores técnicos y oferta no disponible/404.
- Autenticación, renovación/cierre de sesión, privacidad y postulación existentes.
- Todos los campos del detalle y sus secciones opcionales; texto completo con
  saltos de línea y ajuste de palabras extensas.

No requiere migración, variable nueva, dependencia o cambios en Supabase/Vercel.
No modifica Home, cursos, dashboards o componentes compartidos. LinkButton aplica
las variantes del botón dentro de su límite cliente; las páginas y las consultas
permanecen en servidor. No llamar buttonVariants desde un módulo RSC.

## Revisión manual

> **Historical presentation wording:** any conflicting Hero, aside, CTA, width or navigation-target clause in this preserved paragraph is superseded by the current EXTRA-120 contract above; unrelated privacy and business restrictions remain unchanged.

1. Como visitante, abrir /ofertas, buscar con los cuatro filtros, ir a otra página,
   recargar y limpiar. Revisar vacío y parámetros repetidos/incorrectos.
2. Abrir una oferta por su slug; comparar campos y opcionales con el registro
   ficticio y navegar con Volver a ofertas. Un slug no disponible no revela datos.
3. Repetir como candidato, empresa y administrador: Mi cuenta abre su panel,
   campana consulta avisos propios y no se ofrece otro registro. Solo el candidato
   conserva la acción para postularse desde el detalle.
4. Revisar320/390/1440/1920px: sin desplazamiento horizontal, navbar y heading
   separados, logo e Inicio con al menos8px y aside debajo del header fijo.
   Probar títulos/cuerpo largos, navegación por teclado y foco visible.

Los recorridos automatizados están en public-offer-search.spec.ts y
session-navigation.spec.ts. Se conserva la renovación real, reapertura del contexto,
cierre explícito e invalidación de las sesiones anteriores. El segundo incluye
mediciones geométricas a320px, además de comprobar el destino de cada rol.

## Entorno y recuperación

Verificaciones:1608 pruebas unitarias/componentes (133 archivos),66 focales
finales y60 tooling PASS; tipos/lint/build/diff PASS. Nueve E2E finales sin
reintentos/omisiones,20 vistas con axe0/overflow0 y separación geométrica>=8px;
consulta de avisos solo en sesiones activas, textos largos, teclado, opcionales
y no disponible/noindex sin postulación comprobados en navegador real.

El navegador detectó un intento de llamar una utilidad cliente desde RSC que
los tests de componentes no detectaban: se corrigió reutilizando LinkButton.
El primer ajuste móvil tampoco cumplía la separación; se conservó el umbral y
se corrigió CSS antes de repetir build y todos los recorridos finales.

Verificación ejecutada en copia ignorada con proyecto ficticio propio
funes-admin-cv-check, API54341/DB54342 y aplicación3001. Se aplicaron a esa copia
las tres migraciones ya mergeadas de main que faltaban en su respaldo; ninguna
es nueva para este incremento. Base habitual y Supabase alojado intactos.

Capturas y resumen locales quedan en
test-results/portal-followups-check/test-results/extra112-*. Se agregó una oferta
ficticia independiente con título/cuerpo largos y opcionales para esa revisión,
sin cambiar ofertas del fixture ni borrar auditorías. No reutilizar estos datos
o credenciales de prueba en entornos alojados.

Recuperar mediante revert del cambio de presentación en un PR; no ejecutar SQL
de borrado o restauración de consentimientos/casos. Evidencia final y limitaciones
en cambios-extra.md e implementation-status.md. No implica aceptación humana,
CI, despliegue o cierre de gates históricos.
