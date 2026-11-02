# Colecciones limitadas y navegables — EXTRA116

Fecha: 01/11/2026. Solicitud de Mateo y aclaración explícita: historiales y notas
internas de **5** en **5**; perfiles, ofertas y empresas de **10** en **10**.
La captura de nueve ofertas no constituye un fallo: caben en la primera página
de diez. El listado ahora explica también el intervalo mostrado.

## Inventario y tratamiento

Se revisaron las 31 páginas `page.tsx`, sus secciones por rol, componentes y
servicios de lectura. Las rutas alternativas del perfil usan la misma composición.

| Superficie | Límite inicial | Acceso al resto / consulta |
| --- | --- | --- |
| Público: `/ofertas` | 10 | GET servidor, filtros y total existentes |
| Inicio: carrusel | 10 recientes | Carrusel existente y enlace al catálogo completo |
| Público y candidato: cursos | 10 | Anterior/Siguiente en proyección autorizada completa |
| Candidato: ofertas | 10 | Paginación servidor existente |
| Candidato: Mis postulaciones | 10 | Anterior/Siguiente; un hash de notificación revela su página |
| Candidato: preentrevistas de una participación | 5 | Mostrar más, sin exponer notas internas |
| Candidato: resumen del panel | 10 abiertas / 5 resultados recientes | Ver todas en ambos bloques; conteos completos |
| Candidato: sugerencias | Hasta 6 | Resumen existente; catálogo de ofertas disponible |
| Empresa: ofertas | 10 | Paginación servidor existente |
| Empresa: resumen | 5 recientes | Enlace al listado completo existente |
| Empresa: candidatos derivados a una oferta | 10 | Anterior/Siguiente; la selección conserva su página |
| Empresa: entrevistas históricas autorizadas | 5 | Mostrar más; no se habilita un formulario eliminado |
| Administración: candidatos y atención presencial | 10 | GET existente; no se admite ampliar la página mediante `pageSize` en URL |
| Administración: ofertas, empresas y participaciones | 10 | GET servidor, filtros, conteos y referencias existentes |
| Administración: ofertas de una empresa | 10 | Páginas existentes dentro de su detalle |
| Administración: candidatos coincidentes en una oferta | 10 | GET existente, orden por actualización y nominación intactos |
| Administración: notas del candidato | 5 | `notesPage`, consulta servidor de 5 + 1; acceso posterior a las primeras 50 |
| Administración: participaciones recientes del candidato | 10 | Enlace a todas sus participaciones, con filtro por candidato |
| Administración: cuenta y perfil | 5 | Cursor y Mostrar más existentes, mismos eventos admitidos |
| Administración y empresa: moderación de oferta | 5 | Mostrar más existente |
| Administración: contactos, cronología, preentrevistas, respuestas y notas del caso | 5 | Mostrar más por bloque; evidencia completa para decisiones |
| Administración: enlaces de cursos | 10 | Anterior/Siguiente, formulario de alta independiente |
| Administración: derivaciones a cursos | 5 | GET servidor de 5 + 1, conservando candidato seleccionado |
| Administración: otras cuentas del personal | 10 | Anterior/Siguiente, mismos guards y acciones |
| Administración: tiempos por oferta en métricas | 10 | Anterior/Siguiente; todos los tiempos siguen en exportaciones |
| Todos los roles: pantalla de notificaciones | 10 | Paginación RPC existente; campana conserva 5 recientes |

Los detalles de un único perfil, oferta, CV o foto no son colecciones. Tampoco se
recortan categorías, estados, localidades, pasos, campos, leyendas o series
agregadas de gráficos. Las opciones de evidencia para transiciones conservan el
universo autorizado: un límite de presentación no debe impedir elegir una acción
válida. Autenticación, recuperación, términos y formularios singulares se revisaron
sin agregar paginación artificial.

## Contratos y límites técnicos

`BoundedList` recibe hijos ya autorizados, compuestos en servidor. Modo `more`
revela cinco adicionales; modo `pages` reemplaza el bloque por diez. Reutiliza
Button/Pagination adaptados, anuncia el intervalo y enfoca el primer registro
nuevo. No introduce filtros de negocio en cliente. El enlace por hash y el índice
de la derivación seleccionada evitan ocultar el destino en una página posterior.

Las notas del perfil se consultan con rango SQL y lookahead; no se descargan todas
para paginarlas visualmente. Los historiales completos de tablas usan lotes
ordenados de 200 con desempate por ID, evitando el corte implícito de PostgREST.
Un error de lote rechaza la lectura completa, sin presentar un parcial exitoso.
Las proyecciones RPC completas existentes y los hijos de `BoundedList` siguen
cargándose completos: esto **limita la presentación**, no constituye carga SQL
diferida por clic ni un nuevo contrato de escalabilidad del MVP.

No cambian RLS, guards, funciones SQL, resultados, consentimiento, conservación,
actores, permisos de CV ni acceso entre roles. No hay migración, dependencia o
variable nueva. No se elimina información. Recuperación: revertir los cambios de
aplicación; las tablas y sus historiales permanecen intactos.

## Verificación

1616 pruebas unitarias/componentes en 135 archivos, 60 tooling, tipos, lint,
build y diff-check PASS. Cinco E2E nuevos, nueve de búsqueda/sesión y tres
visuales finales PASS. Revisión Chromium de 59 rutas/variantes por cuatro roles:
118 vistas a 1920/390px, 59 análisis axe sin infracciones y 26 bloques acotados;
sin desbordamiento, error de cliente o ruptura de la geometría previa. Capturas
de cursos/seguimiento revisadas. Hash lejano y selección posterior a 20 se
verifican en componentes; no se afirma esa cantidad de derivaciones empresariales
en la fixture de navegador. Diagnósticos de timeouts de inventario, caché CSS
incremental y medición visual se detallan en EXTRA116. Pruebas persistentes:

- `bounded-list.test.tsx`: umbrales, última página, volver, foco, hash lejano e
  índice seleccionado posterior a la segunda página.
- `read-all.test.ts`: 1051 registros en lotes inclusivos, error posterior y URL inválida.
- `admin-current-cv.test.ts`: notas paginadas después de 50, lookahead y privacidad existente.
- `collection-limits.spec.ts`: 57 notas sin pérdidas/duplicados, contactos 5 + 2,
  filtros y listados de diez, cursos por rol y tiempos/exportación completos.
- `admin-metrics.spec.ts`: busca los tiempos esperados navegando páginas, sin
  reducir las exigencias sobre conteos, datos exportados o seguridad.

Los datos agregados para QA son exclusivamente ficticios y locales: 57 notas,
7 contactos y 12 cursos con identificadores deterministas. Los scripts comprueban
destino local y usuarios `@example.invalid`; no borran registros ni resetean la
base habitual. La revisión humana, CI y aceptación del producto requieren evidencia
independiente y no quedan aprobadas por este documento.
