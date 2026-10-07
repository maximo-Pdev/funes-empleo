# Diseño de las páginas de empresas

La rama `codex/frontend-company-design`, desde `main` actualizado (`ada1baf`),
aplica la identidad municipal de las pantallas anteriores a las seis páginas
existentes de `(company)`: panel, perfil, listado de ofertas, nueva oferta,
edición de oferta y candidatos derivados.

La presentación común y el módulo CSS son locales a `(company)`. Se reutilizan
los tokens Tailwind, Card, Badge, el logo SVG y Lucide existentes, junto con la
navegación de empresas. Los formularios funcionales se conservan y reciben estilos
mediante contenedores locales; no se modifican los componentes de otros roles,
los estilos globales ni las dependencias.

Los formularios se organizan en tarjetas y columnas en escritorio, con controles
de al menos 44 px, foco visible y una columna en mobile. El archivo recuperable
mantiene énfasis rojo y confirmación obligatoria. Se mantienen los avisos de
revisión municipal, los mensajes de moderación y las vistas vacías.

Se preservan las guardias, consultas, rutas y acciones existentes (FR-020 a FR-026).
Las ofertas publicadas/cerradas no recuperan controles de edición; una oferta
nueva debe guardarse antes de enviarse a revisión. La empresa solo accede a los
perfiles derivados a sus ofertas. Una derivación revocada conserva únicamente su
referencia y la posibilidad de informar un resultado, sin datos personales ni CV.
No se cambia autenticación, autorización, lógica de negocio, APIs ni base de datos.

Diez pruebas nuevas verifican estos límites, la paginación y la confirmación de
archivo. Revisión visual del 2026-10-07 a 360, 768 y 1366 px de las seis páginas y
cinco variantes: 33 vistas sin hallazgos axe ni desbordamientos y con foco visible.
Las capturas usan componentes reales renderizados con servicios y datos ficticios.
No acreditan sesiones reales, envío de formularios al backend, descarga de CV,
NVDA ni zoom real al 200%; T087 sigue abierto.

Archivos del cambio:

- `src/app/(company)/_components/company-shell.tsx`
- `src/app/(company)/_components/company-forms.module.css`
- `src/app/(company)/empresa/page.tsx`
- `src/app/(company)/empresa/perfil/page.tsx`
- `src/app/(company)/empresa/ofertas/page.tsx`
- `src/app/(company)/empresa/ofertas/nueva/page.tsx`
- `src/app/(company)/empresa/ofertas/[openingId]/page.tsx`
- `src/app/(company)/company/openings/[openingId]/referrals/page.tsx`
- `tests/components/company/company-pages.test.tsx`
- `docs/product/company-frontend.md`

Con las dependencias sincronizadas mediante `npm ci` (sin cambios del lockfile),
la suite completa aprueba 478 pruebas en 30 archivos. Lint, TypeScript y build de
producción aprobados. La revisión React conserva componentes de servidor, claves
estables, consultas existentes y formularios funcionales sin nuevos hooks.
