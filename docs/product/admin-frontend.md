# Diseño de las páginas de administración

## Alcance y base

La rama `codex/frontend-admin-design` parte de `main` actualizado (`cce0773`).
La rama local anterior `feat/public-offer-search` fue eliminada después de
verificar que su commit `c63581e` ya estaba integrado mediante el PR #59. La rama
remota ya no existía al intentar eliminarla.

Se aplica la identidad visual municipal a las 14 páginas de `(admin)`:

- Candidatos: búsqueda, detalle, nueva atención presencial y mantenimiento asistido.
- Empresas: listado y detalle con gestión de acceso.
- Ofertas: listado y detalle con moderación.
- Participaciones: listado y seguimiento individual.
- Importaciones: historial, carga y revisión de lote.
- Métricas operativas.

También se actualizan las cuatro pantallas de carga existentes. No se agrega una
ruta de dashboard ni una función nueva de negocio.

## Decisiones visuales

Cabecera con el SVG municipal existente, navegación lateral en escritorio y una
grilla en mobile, indicador de sección y accesos contextuales sin duplicar la
navegación general. Tarjetas claras, bordes suaves, verde institucional, controles
de formulario de 48 px y foco visible. Los formularios y las tarjetas usan estilos
locales a `(admin)`, sin modificar componentes funcionales compartidos ni estilos
globales. Los esqueletos de carga conservan un mensaje de estado accesible.

Los formularios de suspensión y archivo conservan énfasis rojo, motivos y
confirmaciones; las restauraciones conservan sus avisos. Se mantienen los estados
vacíos, errores de filtros, importaciones bloqueadas y métricas pendientes. Los
textos, filtros, paginación, consultas, guardias y acciones existentes se preservan.
No hay cambios de autenticación, permisos, contratos, transiciones, APIs, base de
datos ni dependencias. Las cuentas administrativas continúan siendo individuales.

## Verificación del 2026-10-19

- `npm run lint`, `npm run typecheck` y `npm run build`: aprobados.
- `npm run test:coverage`: 620 pruebas aprobadas en 40 archivos.
- 17 regresiones nuevas: acceso rechazado antes de consultas, filtros y
  paginación, perfil archivado, CV, confirmación de suspensión, decisiones de
  empresas, requisito de CSV ficticio, bloqueo de importación, exportación y
  cobertura pendiente, DNI oculto y vinculación sin solicitud.
- 25 vistas (14 páginas, carga y diez variantes) a 360×800, 768×800 y 1366×800:
  axe sin hallazgos y sin desbordamientos horizontales. Recorrido de hasta
  20 paradas de Tab por vista con foco visible; no equivale a verificar todos
  los controles ni los recorridos funcionales completos.
- Revisión visual de búsqueda, métricas, formularios, decisiones sensibles y
  resolución de importación; componentes reales renderizados con servicios y
  datos ficticios. Capturas locales bajo `test-results/admin-design/` (ignorado).

La evidencia de navegador usa fixtures de presentación, sin sesión real ni
operaciones contra backend. No acredita permisos RLS, persistencia, envío de
formularios, carga/descarga real de archivos, NVDA ni zoom real al 200 %.
T087 y los gates históricos de aceptación conservan su estado pendiente.
La revisión React mantiene componentes de servidor, claves existentes, consultas
y hooks funcionales sin nuevos efectos ni solicitudes desde el cliente.

## Archivos modificados

- `src/app/(admin)/_components/admin-shell.tsx`
- `src/app/(admin)/_components/admin-workspace.module.css`
- `src/app/(admin)/_components/admin-loading.tsx`
- `src/app/(admin)/admin/loading.tsx`
- `src/app/(admin)/admin/candidates/page.tsx`
- `src/app/(admin)/admin/candidates/assisted/loading.tsx`
- `src/app/(admin)/admin/candidates/assisted/page.tsx`
- `src/app/(admin)/admin/candidates/assisted/[candidateId]/page.tsx`
- `src/app/(admin)/admin/candidates/[candidateId]/page.tsx`
- `src/app/(admin)/admin/empresas/page.tsx`
- `src/app/(admin)/admin/empresas/[companyId]/page.tsx`
- `src/app/(admin)/admin/imports/loading.tsx`
- `src/app/(admin)/admin/imports/page.tsx`
- `src/app/(admin)/admin/imports/new/page.tsx`
- `src/app/(admin)/admin/imports/[batchId]/page.tsx`
- `src/app/(admin)/admin/metrics/loading.tsx`
- `src/app/(admin)/admin/metrics/page.tsx`
- `src/app/(admin)/admin/openings/page.tsx`
- `src/app/(admin)/admin/openings/[openingId]/page.tsx`
- `src/app/(admin)/admin/participations/page.tsx`
- `src/app/(admin)/admin/participations/[participationId]/page.tsx`
- `tests/components/admin/admin-pages.test.tsx`
- `docs/product/admin-frontend.md`

El recorrido ampliado detectó una pérdida del anillo de foco al pasar por el botón
nativo de calendario del campo de fecha/hora. Se corrigió con `:focus-within`
exclusivamente en los campos de fecha de este módulo CSS; se comprobó el avance
por segmentos, calendario y control siguiente en Chromium. No se modificó el
componente funcional compartido.
