# Filtros, ofertas recientes e informes — EXTRA085

Revisión del 2026-10-27, feature001 P1–P4. Los filtros se componen en Server
Components y la selección de datos, validación y autorización se ejecutan en el
servidor. Los controles que necesitan estado, teclado o validación compartida
siguen siendo islas cliente; no se envía un padrón completo al navegador para
filtrarlo. Un Server Component puede componer esos controles sin convertirse
en un Client Component.

| Superficie | Composición y consulta | Interacción conservada |
| --- | --- | --- |
| Público `/ofertas` | `PublicOfferSearchForm`, página y `public-service`; GET con texto/rubro/localidad/modalidad | Validación compartida de campos; paginación en servidor |
| Administración `/admin/candidates` | `CandidateSearchForm`, `candidateSearchSchema`, `searchCandidates`; GET nativo | Combobox múltiple de categorías y localidad; categoría OR, referencias opacas, localidad opcional |
| Administración `/admin/atencion-presencial` | Mismo formulario GET con destino propio; `searchAssistedCandidates` conserva alcance presencial | Misma selección y validación; no se altera creación ni vinculación |
| Matching dentro de una oferta | `OpeningMatchOrderForm` y `OpeningCandidateMatches` en servidor; servicio/RPC ordena antes de paginar | Tabla, popup y nominación cliente; botón Aplicar orden; página se reinicia y orden persiste en enlaces |
| Administración `/admin/openings` | Formulario GET de página y `listAdminOpenings` | Estado, paginación y exclusión de borradores vigentes |
| Administración `/admin/empresas` | Formulario GET de página y consulta autorizada en servidor | Búsqueda/estado y paginación vigentes |
| Administración `/admin/participations` | Formulario GET, `listAdminParticipations`, filtros contextuales opacos | Origen/estado/oferta/candidato y paginación vigentes |
| Administración `/admin/metrics` | Formulario GET, esquema y `getMetrics` | Fechas/categoría; PDF y Excel usan esos filtros |
| Candidato `/dashboard` y perfil/cuenta | Composición y consultas en servidor; no hay otro buscador de candidatos | Formularios de edición conservan validación cliente/servidor |
| Empresa `/empresa`, `/empresa/ofertas` y detalle | Listas/paginación y selección de derivación en servidor | Formularios de oferta/resultado son edición; no filtros locales del padrón |

Cambios concretos: quitar la navegación por router de la composición del buscador
de candidatos y del selector de orden; usar nombres nativos, categorías repetidas
en inputs ocultos opacos y GET. La localidad del buscador no es obligatoria. No se
cambia la semántica de los filtros, las consultas, los permisos ni el matching.

## Descargas

En Métricas operativas, aplicar los filtros y elegir **Descargar PDF filtrado** o
**Descargar Excel filtrado**. PDF contiene contexto e indicadores paginados; Excel
incluye hojas Contexto y Métricas, valores numéricos y pendientes vacíos explicados.
No sumar desgloses por categorías como un total único. Un pendiente no es cero.
Son informes internos, no informes oficiales municipales/provinciales.

Las rutas Node `/api/admin/exports/operations.pdf` y `.xlsx` conservan el guard de
administrador activo, filtros estrictos, una auditoría por solicitud autorizada y
referencias opacas. CSV sigue disponible para consumidores existentes. Sin nuevas
variables ni migraciones. Dependencias exactas/lockfile y fuentes TTF locales;
el tracing de producción incluye las dos fuentes Be Vietnam para PDF.

## Orden y popup

EXTRA088: Home obtiene las primeras diez ofertas públicas ordenadas por fecha de
publicación descendente, con desempate por ID. Empieza en la más reciente, con
vecinos circulares: última/penúltima a izquierda de primera y primera/segunda a
derecha de última. Flechas circulares; Embla móvil loop con fallback nativo para
pocas slides. Conserva diseño 3D/móvil, sin duplicar registros.

Ampliación EXTRA087, que sustituye EXTRA086: avance automático cada tres segundos
y retorno a la primera al terminar. Solo flechas anterior/siguiente circulares,
sin Pausar/Reanudar. Hover/foco pausan mientras dura la interacción; al salir
vuelve solo. Reduced-motion desactiva autoplay y una pestaña oculta no avanza.
Se conserva el orden de datos; sin pausa táctil permanente.

El popup de candidato usa el dialog nativo. Mientras esté abierto, una regla CSS
dirigida al marcador `data-candidate-preview` bloquea el overflow raíz y mantiene
scroll interior contenido. Cerrar con Escape/botón devuelve el foco; cierre o
desmontaje elimina automáticamente el bloqueo. No agrega listeners globales.

## Evidencia y límites

Ver resultados consolidados en EXTRA085 de `cambios-extra.md`. Las pruebas de
navegador usan un servidor de producción en 3001 y Supabase ficticio aislado en
54341/54342; no modifican el proyecto habitual ni el alojado. Incluyen descargas
binarias y roles, categoría múltiple/URL opaca/localidad vacía/atrás/adelante,
orden global, nominación y scroll móvil/escritorio. El PDF largo se leyó con pypdf
y se renderizó para verificar Unicode, encabezados y último indicador; XLSX se
leyó con un parser independiente y se inspeccionó su XML sin fórmulas/macros.

Revisión humana, CI y publicación pendientes. El audit de dependencias mantiene
los siete avisos del main de partida; las librerías nuevas no agregaron avisos.
