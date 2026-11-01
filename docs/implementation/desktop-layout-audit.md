# Revisión de espacio en escritorio — EXTRA113

**Continuación115:** esta matriz conserva evidencia de ancho de113, no aceptación
de simetría de todos los detalles. Mateo detectó pilas independientes en seguimiento;
la corrección y revisión completa de tarjetas está en
[card-symmetry-audit.md](card-symmetry-audit.md). Sustituye la conservación de esas
pilas en detalles, manteniendo los resultados de ancho/columnas verificados aquí.

Solicitud de Mateo del31/10/2026. Inventario de las31 páginas actuales más variantes
de sesión, secciones de candidato y detalles. Los endpoints API y los registros
retirados con404 no son páginas adicionales. La rama conserva también EXTRA112.

## Criterio

Usar el espacio útil de trabajo, descontando sidebar y márgenes. No agrandar
tipografías o campos ni forzar alturas para llenar un viewport. Los listados
pueden ganar columnas; un texto legal o un formulario de dos campos necesita
un ancho de lectura controlado. Las vistas vacías no inventan registros.

A1920, la medición anterior mostraba1280 de1608px útiles en los paneles de los
tres roles y1280 de1824px en ofertas públicas. Esos límites, y las grillas de
dos columnas, son los ajustes principales. No cambian consultas o permisos.

## Cobertura por página

| Ruta de página | Revisión y decisión |
| --- | --- |
| `/` | Hero/login/registro conservan proporciones; secciones de ofertas, cifras y acompañamiento amplían su máximo compartido. |
| `/ofertas` | Lienzo público más ancho, tres columnas de ofertas y filtros compactos en escritorio ancho. |
| `/ofertas/[openingId]` | Detalle por slug amplía su lienzo; aside y párrafos mantienen medida legible. |
| `/cursos` | Encabezado y enlaces usan el mismo máximo público amplio. |
| `/terminos` | Mantener límite de lectura del documento, sin estirar párrafos. |
| `/dashboard` | Revisar las siete secciones; lienzo privado fluido y tarjetas con más columnas. |
| `/account` | Revisar los tres roles y el alias candidato; mismo lienzo privado, controles y permisos conservados. |
| `/empresa` | Panel y filas recientes aprovechan el lienzo compartido; no inflar tarjetas. |
| `/empresa/perfil` | Formulario existente en dos columnas dentro del ancho útil, con controles intactos. |
| `/empresa/ofertas` | Tres columnas desde1600 y cuatro desde2200, misma paginación y orden. |
| `/empresa/ofertas/nueva` | Ancho del shell; conservar composición/validación de alta. |
| `/empresa/ofertas/[openingId]` | Ancho del shell; consulta, edición por botón, derivaciones e historial conservados. |
| `/empresa/notificaciones` | Ancho del shell; mantener secuencia cronológica y estados de lectura. |
| `/admin` | Gráficos visibles ocupan el ancho útil; sin cambiar datos, escalas o indicadores. |
| `/admin/candidates` | Tabla y filtros usan el espacio disponible, sin cargar más registros. |
| `/admin/candidates/[candidateId]` | Revisar perfil propio digital y presencial no vinculado; orden de tarjetas y acciones conservado. |
| `/admin/atencion-presencial` | Alta y listado existentes amplían el lienzo sin duplicar perfiles. |
| `/admin/candidates/assisted` | Alias/redirección revisados; comparte la vista presencial actual. |
| `/admin/empresas` | Tabla/listado dentro del lienzo fluido. |
| `/admin/empresas/[companyId]` | Datos simples en tres columnas desde1600; mismas ofertas paginadas y controles de acceso. |
| `/admin/openings` | Listado y filtros aprovechan el lienzo; paginación y exclusión de borradores intactas. |
| `/admin/openings/[openingId]` | Información/decisión/historia y matching conservan su grilla y orden; más ancho útil. |
| `/admin/participations` | Tabla y filtros se amplían con el shell. |
| `/admin/participations/[participationId]` | Columnas existentes de seguimiento y decisiones, sin alterar historial o acciones. |
| `/admin/courses` | Dos áreas existentes de gestión dentro del ancho útil. |
| `/admin/metrics` | Gráficos, tabla y filtros amplios; cálculos y exportaciones intactos. |
| `/admin/notificaciones` | Secuencia cronológica dentro del shell; no repartir avisos fuera de orden. |
| `/recover` | Mantener composición de acceso y formulario corto con ancho controlado. |
| `/verification-expired` | Mantener aviso y formulario breve de reenvío, sin estirarlos. |
| `/update-password` | Revisada con los tres roles; mantener ancho de formulario y controles actuales. |
| `/logout` | Mantener confirmación corta; la revisión no envía el formulario. |

También se revisa un slug inexistente con página no disponible y noindex. Loading
y error boundaries mantienen su composición breve, con los mismos tokens y sin
añadir contenido artificial. Las variantes de registro viven en Home, no en rutas
retiradas. No se transforma una lectura en autorización de una acción.

## Implementación acotada

- Variable CSS pública `--layout-content-max`:1280 normalmente y1800 desde1440.
  Consumida por Home, ofertas y cursos; conserva tamaños menores.
- Canvas común de DashboardShell sin el máximo artificial1280; sidebar, márgenes,
  navegación, tipografía y disposición interna se mantienen.
- Listas privadas opt-in: tres columnas desde1600 y cuatro desde2200. Dashboard
  candidato usa el mismo criterio. Catálogo público: tres por su aside.
- Filtros públicos desde1600: texto ocupa dos unidades y los tres selectores una
  cada uno; acciones en fila completa. Mismo orden DOM, nombres, GET y validación.
- El espaciado móvil ya verificado en112 se centraliza en la navbar compartida,
  retirando la duplicación local. La revisión previa detectó una acción que acababa
  en327.48px dentro de un viewport320; no se ocultan accesos para resolverlo.

## Validación y recuperación

| Medición a1920px | Antes | Después |
| --- | ---: | ---: |
| Canvas privado, espacio útil1608px |1280px|1608px|
| Canvas de ofertas públicas |1280px|1800px|
| Columnas de tarjetas públicas/empresa |2|3|
| Altura del filtro de ofertas |352px|185px|

A2560, los paneles usan2248px útiles y las listas privadas cuatro columnas. Los
públicos amplios mantienen su máximo1800 para lectura. El límite público anterior
se conserva hasta1439. Los formularios cortos/documentos mantienen su medida.

Resultado:154 mediciones posteriores (138 desktop y16 móviles), sin overflow o
errores cliente; axe0 en28 barridos seleccionados, no en todas las mediciones.
Tras compactar filtros, seis checks adicionales de1366/1440/1920/2560/390/320
validan alineación, altura, tabulación, búsqueda GET, valores retenidos, limpiar y
axe0. Nueve E2E finales de búsqueda/sesión,1608 unit/componentes,60 tooling,
tipos/lint/build frío/diff PASS. Sin reintentos u omisiones en los nueve recorridos.
SP1–SP5 cubiertos, sin brechas nuevas; no cierre de aceptación humana histórica.

La medición inicial cubrió46 vistas a1920px sobre copia ignorada, instancia propia
funes-admin-cv-check (API54341/DB54342/aplicación3001), solo datos ficticios. Se creó
un perfil presencial independiente mediante create_active_assisted_candidate;
se conservan consentimiento/auditoría y solo se elimina su sesión temporal.
No se restablece la base habitual ni se escribe sobre servicios alojados.

Mediciones, capturas y resultados finales: `cambios-extra.md` e
`implementation-status.md`; evidencia local ignorada extra113-before/after.
La prueba mide área útil y exige que el lienzo privado la ocupe, además de comprobar
overflow y accesibilidad. Revisión en1366/1920/2560 y regresión320/390.

No requiere migración, nueva dependencia, variable de entorno o configuración
alojada. Recuperar mediante revert de presentación por PR, sin borrar datos,
auditorías o permisos. No implica CI, aceptación humana o cierre de gates históricos.
## Simetría de tarjetas — EXTRA114

La continuación de este ajuste alinea tarjetas equivalentes por fila, con ancho,
altura y tres grupos: encabezado, contenido y cierre. El CSS opt-in se comparte
entre catálogo público, ofertas/participaciones de candidato y ofertas de empresa;
reutiliza Card sin cambiar controles, campos, acciones, claves de intentos o datos.
Subgrid desde768px con fallback flex; en una columna móvil la altura es natural.
No recortar títulos, imponer alturas de pantalla ni igualar grupos de otra función.
Dashboard alinea metadatos; las dos tarjetas empresariales usan columnas iguales
y enlaces al pie. Grupos ya equilibrados de Home y cuentas conservan su diseño.

Verificación local sobre el mismo snapshot ficticio de113: ocho rutas/variantes
por cinco anchos (1366,1920,2560,390,320),40 vistas; ancho/alto y grupos internos
de pares dentro de1px, sin overflow/recorte/errores cliente. Axe0 en16 barridos.
CV opcional desplegado con teclado y mensaje/título largo ficticio insertado solo
en DOM agregan dos pruebas/axe0: botones y grupos siguen alineados. No se enviaron
formularios ni se alteraron registros por esas pruebas. Cuatro checks de fallback
con CSS de prueba, sin afirmar cobertura nativa de Safari/Firefox u otros motores.
Evidencia local ignorada: extra114-cards.json, extra114-interactions.json y capturas.

1608 unit/componentes,60 tooling, tipos/lint/build frío y nueve E2E finales de
búsqueda/sesión PASS. La suite se repitió completa tras un timeout durante build,
sin aumentar límites ni editar pruebas. Recuperación: revert visual por PR, sin
migración, datos o dependencias nuevas. No implica revisión humana o publicación.
