# Cambios extra necesarios

## Preparación de PR — 01/11/2026

Mateo solicita publicar los cambios acumulados112–119. Rama
feat/desktop-layout-polish sobre main71a758e, fetch sin divergencia. Se excluye
next-env.d.ts ajeno, conservado por SHA256; sin firmas/signoff/coautoría añadida.
Verificación final:1624 pruebas/136 archivos PASS con cobertura100% del alcance
configurado (solo src/lib/env/schema.ts, no cobertura global).64 tooling y
tipos/lint/build documentados en119; cinco E2E de matching completos PASS tras
alinear expectativas y oráculo SQL12→10, conservando todas las aserciones.
SQL119 ya aplicado local/alojado y registrado sin reparar historia ajena; filtro
de métricas y demás cambios UI requieren despliegue del código. Revisión humana,
CI completa de application/database y publicación se acreditan por sus resultados
posteriores, no por estas verificaciones locales.

## EXTRA-119 — Retirar categorías ficticias A/B con respaldo

- **Fecha/origen:** Mateo,01/11/2026, pide eliminar las categorías ficticias A/B.
  Decide expresamente «Quitar las asignaciones y conservar un respaldo histórico».
  Sustituye conservación operativa de DEMO-A/B en A08; no autoriza equivalencias
  o cambios de categorías reales. Rama actual y trabajo112–118/next-env preservados.
- **Evidencia previa:** en local cada código v1 activo tiene265 asignaciones
  candidatas; A64/B60 de ofertas. Proyecto vinculado kyjycjojzhwggjuqjnki: A1/B0
  candidatas y ninguna oferta. Solo conteos/metadatos consultados, sin PII. Conector
  integrado sin proyectos; CLI vinculada permite lectura. OQ-010 no define mapeo.
- **Diseño antes de código:** migración20261101120000, alcance exacto códigos
  DEMO-A/DEMO-B versión1 y nombres esperados. Respaldar filas originales de catálogo
  y relaciones candidate_categories/opening_categories en tabla privada con clave,
  snapshot, fecha/actor SQL, versión y motivo. RLS, sin grants a aplicación y
  append-only con deny_history_change existente, como patrón057. Después quitar
  solo esas relaciones y desactivar categorías; conservar filas/IDs del catálogo.
- **Atomicidad/concurrencia:** transacción única, lock_timeout5s/statement30s;
  cuentas en EXCLUSIVE antes de relaciones para esperar guards FOR SHARE de
  comandos vigentes y evitar validación/asignación concurrente. Lecturas simples
  siguen disponibles. Orden consistente, fallo revierte también el respaldo.
  Comprobar que cada fila retirada esté respaldada, antes de eliminarla. No tocar
  perfiles/ofertas, versiones, estados, consentimientos, casos, CV o auditoría previa.
- **Archivos/contratos:** migración, prueba de migración real con datos sintéticos
  y guía de retiro/recuperación; spec/plan/modelo/contrato/checklist/tasks. Sin
  endpoints o UI nueva. Seed/fixtures de aceptación conservan A/B deliberadamente:
  son datos sintéticos de pruebas, no el catálogo operativo. Una semilla/reset
  posterior no es un despliegue; no ejecutar semillas sobre bases operativas.
- **Riesgos:** registros solo A/B quedan sin categorías, por decisión expresa;
  no inferir reemplazos ni cambiar estados. Backup privado por IDs, sin copiar
  nombres/contactos de personas. Nunca borrar asociaciones sin su snapshot. Si
  hay nombres v1 inesperados o locks ocupados, abortar, no corregir datos a ciegas.
- **Verificación prevista:** transacción con rollback sobre fixture propio;
  conteos/snapshots exactos, categorías reales/relaciones/entidades/historial
  intactos, backup inaccesible/append-only, reejecución y recuperación sin pérdida;
  fallo simulado prueba rollback. Tipos/lint/unit/build y verificaciones de lecturas.
  Aplicar solo esta migración al proyecto vinculado/local sin reset; inspeccionar
  dry-run e historial antes, no reparar versiones ajenas ni empujar cambios pendientes.
- **Gates previos:** DC1–DC5 definidos/clarificados, plan/modelo/contrato/checklist/
  tareas y análisis constitucional II–V registrados antes de implementación.
  Patrón privado ya aprobado057, sin stack/arquitectura de aplicación nueva;
  no críticos/altos abiertos en delta. Solicitud/decisión autoriza alcance;
  implementación/verificación/revisión humana pendientes, gates históricos intactos.
- **Adición detectada antes de código de lectura:** metricsCategories ofrece
  también categorías inactivas para consultas históricas, por lo que desactivar
  A/B no basta para retirarlas de ese selector. Añadir active a lectura servidor
  y excluir exclusivamente DEMO-A/B v1 con active=false; devolver DTO previo.
  Otras inactivas y A/B activas de fixtures siguen disponibles. No alterar cálculo,
  exportación o datos históricos. Archivos metrics/service y prueba específica;
  verificar roles, activos/inactivos/versiones y errores. Sin nuevo endpoint/RPC.
- **Implementado:** migración y tabla privada con snapshots íntegros, trigger
  append-only reutilizado, recuperación con detección de conflictos y verificación
  por conteos/metadatos. Guías retire/recover/verify-demo-categories en operations;
  test ejecuta SQL real dentro de transacciones revertidas, sin copiar algoritmo.
  Lectura metrics/service omite solo v1 A/B inactivas y devuelve el DTO anterior.
- **Verificación técnica:** SQL real PASS para respaldo exacto, retiro, catálogo/
  padres/historia intactos, reejecución, nombres/backup/recuperación contradictorios,
  privacidad de tres roles, append-only y fallo inyectado con rollback total. Una
  sesión con ROW SHARE bloquea el retiro y provoca timeout sin efectos parciales.
  208 regresiones unitarias/componentes en10 archivos,64 tooling (4 guards nuevos),
  tipos/lint/build frío/diff PASS. Un E2E sin retries/omisiones comprueba selector
  con flags sintéticos retirados y los restaura en finally. QA propio54341/3001;
  una invocación desde root con puertos de QA fue rechazada antes de Docker/SQL,
  como exige el guard. Sin resets o cambios a fixtures compartidas.
- **Aplicación verificada:** versión20261101120000 ejecutada y registrada en
  local y kyjycjojzhwggjuqjnki. Ambas: A/B inactivas, cero relaciones vigentes,
  filtros públicos limpios y15 categorías v2 activas. Local respalda2 categorías,
 530 relaciones candidatas y124 de ofertas; alojado2 categorías y1 relación
  candidata. RLS/grants/append-only/metadatos completos verificados.
- **Historia/conservación:** db push dry-run detecta divergencia histórica previa
  de versiones20260927/28. Se aplica solamente el archivo nuevo vía conexión
  administrativa y se registra solo20261101120000 con repairAll=false; no se
  revierte/repara ninguna versión ajena. Huellas previas/posteriores de estados/
  versiones de candidatos, ofertas y participaciones, consentimientos, auditorías,
  otras categorías/relaciones e historial anterior idénticas en ambas bases.
- **Cierre y límites:** DC1–DC5/T289–T291 verificados técnicamente. Datos ya
  aplicados; filtro de métricas listo en código, pendiente del despliegue habitual.
  Build solo advierte raíz por lockfile del snapshot; sin advertencias CSS. Código
  previo112–118 y next-env ajeno intactos por hash; servicios QA detenidos sin
  tocar base/servidor habituales. Sin commit/PR/CI/revisión humana acreditados.

## EXTRA-118 — Inicio con sesión desde ofertas disponibles

- **Fecha/origen:** Mateo, 01/11/2026, solicita ocultar el bloque inicial completo
  de presentación/acceso con sesión iniciada y comenzar en Ofertas disponibles,
  según sus dos capturas. Esta solicitud sustituye la conservación del hero para
  usuarios activos de108/112; no revierte la presentación anónima o autenticación.
  Mantener rama feat/desktop-layout-polish,112–117 y next-env ajeno.
- **Evidencia/cambio antes de código:** Home ya obtiene panel mediante
  getSiteAccess servidor, pero monta HomeHero incluso activo. Condicionar su
  composición al panel activo verificado. Navbar siempre visible en ese caso,
  reservar64px y promover Ofertas a h1; sin hueco de hero ni scroll imperativo.
  Mantener carousel10, vacío, contenido restante y acceso al panel por rol.
- **Archivos/contratos:** public/page.tsx y home.module.css, pruebas Home/acceso/
  registro/sesión, spec/plan/tasks/UI/status. Sin backend, SQL, grants, dependencia
  o contrato nuevo. No inferir sesión por cookie sin verificar, query o estado cliente.
- **Riesgos/verificación prevista:** invitados/errores/suspendidos siguen viendo
  acceso y avisos; activos de tres roles no montan formularios ni hero, incluso con
  registro/acceso en URL. Un h1 y navbar sin cubrir título; escritorio/móvil,
  vacío/carrusel, panel correcto, recarga/navegación/salida y no-store. Tipos/lint,
  pruebas relevantes y build; QA propio ficticio, sin reset habitual o alojado.
- **Gates previos:** HN1–HN4 explícitos, sin nueva arquitectura, privacidad o
  decisión municipal. Diseño/análisis constitucional II/IV/V acotados, sin críticos
  o altos; revisión humana pendiente. Recuperación por revert de aplicación.
- **Prerrequisito detectado antes de ajustar carrusel:** axe detecta salto h1→h3
  al convertir Ofertas en título principal. Añadir headingLevel h2/h3 al carrusel,
  default h3 para preservar composición anónima; activo usa h2 en ambos modos.
  Contrato de presentación servidor/cliente, sin cambio de autoplay/datos/controles.
  Archivos page.tsx/home-offers-carousel.tsx y tests de Home. Verificar axe sin
  omitir heading-order; adaptar expectativa E2E antigua que aún buscaba el hero.
- **Implementado/verificado:** Home omite hero en servidor para panel activo y
  muestra navbar permanente, h1 de ofertas e inset64px. Carrusel conserva últimas10,
  modos/autoplay y estilo; títulos hijos h2 activo/h3 anónimo. Sin APIs, SQL,
  controles nuevos o cambio de autenticación/registro/avisos de visitantes.
  Archivos reales: public/page.tsx, home.module.css, home-offers-carousel.tsx;
  tests home-access-panel, home-registration-navigation, setup/home,
  e2e/home-session-entry y session-navigation. Artefactos/UI alineados.
- **Evidencia:** RED7/37 en expectativas del nuevo alcance; primera suite completa
  encuentra tres expectativas antiguas adicionales de setup/Home, adaptadas al
  nuevo destino manteniendo comprobación de rol. Primer navegador detecta
  heading-order en3 roles y seis expectativas antiguas de tarjeta; se corrige
  jerarquía y recorrido sin desactivar axe, omitir o debilitar checks de sesión.
  Final1618 pruebas/135 archivos, tipos/lint/build frío/diff-check PASS. Build
  solo advierte raíz por lockfile del snapshot, sin advertencias CSS.
- **Navegador final:**13/13 sin reintentos/omisiones: visitante, Home por tres
  roles, seis renovaciones/navegación/salidas y tres regresiones de menú. Cada rol
  se comprueba a1920×1080,1366×768,390×844 y320×800, con query de registro/aviso,
  primer bloque/h1/navbar por encima del título, scrollY0 y sin overflow. Tres
  axe móviles0; capturas1920/390 revisadas. Recargar mantiene inicio en ofertas;
  logout recupera login/registro, sin caché pública de sesión. Vacío/fallo de
  datos, suspensión y URLs se cubren en componentes y contratos existentes.
- **Cierre:** HN1–HN4/T287–T288 verificados técnicamente. Datos/servicios propios
 54341/3001, sin reset habitual, nuevas fixtures, migración o cambio alojado;
  servicios QA detenidos conservando backup. Trabajo112–117 y next-env ajeno
  preservados. Revisión humana/commit/PR/CI/despliegue pendientes, no acreditados.

## EXTRA-117 — Evitar superposición del pie del menú lateral

- **Fecha/origen:** Mateo, 01/11/2026, aporta captura administrativa: Cerrar
  sesión tapa Cuenta. Continuar rama feat/desktop-layout-polish y preservar112–116,
  next-env ajeno y cambios locales; sin commit/PR implícitos.
- **Evidencia:** SidebarContent tiene flex-1/min-h-0 sin overflow propio. Al
  reducir altura, sus enlaces desbordan por detrás de SidebarFooter. No es un
  problema de permisos ni del orden de navegación.
- **Cambio antes de código:** recuperar overflow-auto en SidebarContent y evitar
  compresión de SidebarFooter. Documentación oficial Base Sidebar y registro
  base-nova consultados: content es la región desplazable entre cabecera/pie.
  Reutilizar composición adaptada sin reemplazar componentes o estilos de botones.
- **Archivos/contratos:** components/ui/sidebar.tsx; guía UI, spec/plan/tasks y
  evidencia de estado. Sin APIs, datos, permisos, dependencias o migración.
- **Riesgo/verificación prevista:** foco/último enlace visible al desplazarse,
  pie dentro del viewport, sin solapamientos a alturas1080/900/768/600 y zoom,
  admin/candidato/empresa; móvil expandido/contraído sin recortes. Prueba de
  navegador de geometría y teclado, tipos/lint/pruebas relevantes/build. Rollback
  por revert de las clases sin cambios de datos. No tests que solo comparen CSS.
- **Estado previo:** autorizado por solicitud explícita; delta de presentación
  SB1–SB3 y análisis constitucional IV/V sin arquitectura/reglas nuevas. Revisión
  humana independiente y verificación pendientes, gates históricos intactos.
- **Resultado:** dos clases en sidebar.tsx: overflow-auto en contenido y shrink-0
  en pie. No cambia menú, controles, logout, identidad ni permisos. T285–T286
  verificados; recuperación por revert. next-env ajeno conserva SHA256 original.
- **Verificación:** RED administrativo reproduce Cuenta67px fuera del área del
  contenido a900px de altura; GREEN tres roles sin retries/omisiones. Seis
  viewports1920×1080,1366×900,1366×768,1024×600,960×540 y768×500; foco en Cuenta,
  último enlace y logout, pie dentro del viewport y sin solapamiento.960×540
  cubre espacio equivalente al zoom200% sobre1920×1080, sin afirmar automatizar
  el control de zoom nativo. Móvil390×844 expandido/contraído y tres axe0 PASS.
  121 pruebas de composición/3 archivos, tipos/lint/build frío/diff-check PASS.
  Build solo advierte raíz por lockfiles de snapshot, sin advertencias CSS.
  QA ficticio54341/3001, sin reset, migración, cambio alojado o nuevas fixtures.
  Revisión humana/PR/CI/despliegue pendientes; no se acreditan por estas pruebas.
- **Revisión visual:** captura1366×900 con datos/fuentes cargados y Cuenta
  enfocada revisada: pie separado32px, contenido termina719.5px y pie comienza
 751.5px; Cuenta completa y accesible. Los tres E2E esperan identidad real cargada,
  además de comprobar la composición. Servicios QA detenidos conservando backup.

## EXTRA-116 — Colecciones limitadas y navegables por rol

- **Revisión al preparar PR,01/11/2026:** job-category-matching.spec aún espera
  páginas12 y construye su oráculo SQL con limit/offset12. Alinear esos cuatro
  valores al alcance aprobado10 antes de publicar, conservando orden global,
  exclusión entre páginas, popup, permisos y nominación. Solo regresión E2E;
  no modificar el matching para satisfacer expectativas antiguas.

- **Fecha/origen:** Mateo, 01/11/2026, solicita revisar todas las páginas con
  información. Confirma: historiales/notas internas5; perfiles/ofertas/empresas10.
  La captura muestra9 ofertas y ya usa páginas10: no inventar una falla allí.
  Conservar112–115, rama actual y next-env ajeno; sin commit/PR implícitos.
- **Evidencia previa:** candidato administrativo corta notas/participaciones en50
  sin acceso al resto; listas candidatas, contactos, cronología, preentrevistas,
  notas de caso, cursos, derivaciones y tiempos de métricas renderizan arrays enteros.
  Búsqueda candidata default20, matching12, seguimiento default20 y cursos historial20.
  Moderación y cuenta-perfil ya muestran5 con revelado; empresas/ofertas ya paginan10.
- **Diseño antes de código:** constantes comunes10/5. Mantener GET servidor donde
  existe; notas de candidato se consultan5+1 con página propia y orden fecha/id.
  Participaciones recientes limitan10 y enlazan a todos los casos filtrados. Nuevas
  colecciones completas autorizadas usan composición cliente reutilizable: páginas10
  o Mostrar más por5, sin mover filtros al cliente, truncar datos o alterar acciones.
  Conservar selección de derivación y destino hash de notificaciones aunque esté
  fuera del primer bloque. Foco en registros nuevos, contador y anuncio accesibles.
- **Consultas/contratos:** consultas de historial por tabla recorren lotes ordenados
  para no perder registros por el tope PostgREST; no prometer carga SQL diferida en
  RPC que devuelven proyecciones completas. Búsqueda/estadísticas/selecciones de
  evidencia necesitan su universo autorizado; no recortar esos cálculos/opciones
  por el límite visual. Categorías/estados son catálogos, no historiales paginables.
  API de notas amplía respuesta con hasNext; privacidad y guard admin se mantienen.
- **Archivos previstos:** ui/bounded-list, lib/collections, consultas administrativas,
  páginas de candidato y cuenta, listas de candidato/cursos/derivaciones, historiales
  de caso/entrevistas, métricas y defaults de búsqueda/matching/seguimiento. Spec,
  plan/tasks/checklist/UI, contratos de lectura y matriz de cobertura afectados.
  Sin esquema, migración, dependencia o variable nueva; no borrar auditoría/datos.
- **Verificación prevista:** límites0/5/6/10/11 y más de50, todos accesibles sin
  duplicación; orden estable/errores/autorización; mostrar más/página previa/final,
  foco, hash lejano y selección. Guardar filtros/cuentas/resultado de contratación,
  conteos y exportaciones completos; simetría115/móvil/axe, tipos/lint/unit/build
  y recorridos relevantes con fixture local propio. Rollback por revert sin datos.
- **Gates antes de implementar:** alcance PG1–PG6 explicitado por el solicitante,
  clarificación numérica resuelta, diseño/checklist/tareas y análisis acotado de
  constituciónI–VI sin críticos/altos nuevos. No arquitectura/SQL nuevo ni decisión
  municipal pendiente. Implementación/verificación pendientes; revisión humana aparte.
- **Detalle antes del acabado:** los avisos ya estaban paginados a20. Unificar su
  pantalla completa a10 como listado de registros, conservando campana5, total/
  no leídos y contrato RPC (parámetro existente). Sin cambio de eventos o lectura.
- **Implementado:** `ui/bounded-list`, `lib/collections/{limits,read-all}`, lecturas
  candidates/search-service, openings/admin-service, participations/admin-query,
  training/service y notifications/service. Composición en cursos, cuenta,
  participaciones candidatas, derivaciones empresariales, historiales de caso,
  tiempos de métricas, búsquedas/matching y resumen candidato. Notas del perfil
  usan notesPage5+1; casos recientes10 enlazan al listado completo. Inventario de
  31 páginas en `docs/implementation/collection-pagination-audit.md` y contrato
  `contracts/collection-read-pagination.md`; spec/plan/tasks/checklist/UI alineados.
- **Pruebas y diagnóstico:** 1616 unit/componentes en135 archivos y60 tooling
  PASS; tipos/lint/build/diff PASS. Una corrida simultánea con build agotó5s en
  tres inventarios de archivos; suite completa repetida con dos workers PASS,
  sin elevar timeouts u omitir pruebas. La compilación final advierte caché CSS
  incremental (dos selectores inválidos adicionales) y raíz por lockfile de la
  copia QA; el build frío anterior compiló CSS sin esas advertencias. No cambios
  de tokens/clases válidas para encubrirlo. La regresión visual detectó medición
  secuencial durante scroll de foco: medir ambas tarjetas en el mismo fotograma
  elimina esa carrera, conservando tolerancia1px y todas las aserciones.
- **Navegador funcional:** cinco pruebas nuevas PASS (57 notas/12 páginas sin
  pérdidas o duplicados, contactos5+2/foco, filtros/diez registros, cursos en
  tres superficies, tiempos/exportación sin truncado). Nueve búsquedas/sesiones
  previas PASS; tres pruebas finales de composición PASS tras corrección de
  medición. Diecisiete recorridos verificados, sin omisiones/reintentos automáticos.
  Fixture propio54341/3001; solo notas/contactos/cursos ficticios idempotentes,
  sin borrar datos, reset habitual, cambio alojado o alteración de negocio.
- **Cierre técnico:** inventario31 páginas;59 rutas/variantes de público,
  candidato, empresa y admin,118 vistas1920/390px PASS.59 análisis axe sin
  infracciones,26 comprobaciones de bloques acotados y geometría real de detalles,
  cero overflow/fallos de cliente. Capturas de cursos y seguimiento revisadas.
  Hash lejano/selección posterior a20 se prueban en componente; no se afirma una
  fixture empresarial de más de20 derivaciones en navegador. Solo Chromium;
  gates humanos históricos intactos. PG1–PG6/T282–T284 verificados técnicamente.
  next-env ajeno preservado por SHA256, sin firmas/commit/PR/CI/despliegue nuevos.
  Revisión humana pendiente; no se marca aprobada por pruebas automáticas.
- **Aviso conocido del runtime:** navegación interrumpida/cierre de contextos
  vuelve a registrar Next `destination stream closed early`, digest2894301752,
  ya documentado en115. No produjo error cliente ni fallo de recorrido final;
  no se amplía este delta de paginación para sustituir el runtime.

## EXTRA-115 — Composición simétrica de todas las páginas

- **Fecha/origen:** Mateo, 31/10/2026, rechaza la cobertura limitada de114 y aporta
  captura de seguimiento administrativo con columnas desalineadas. Su pedido
  incluye revisar todas las páginas. Continúa la misma rama y conserva112–114
  y next-env ajeno. La verificación114 prueba listados, no aceptación de detalles.
- **Evidencia previa:** seguimiento usa dos pilas independientes; un aviso terminal
  desplaza Registrar contacto respecto de Historial. Perfil administrativo repite
  pilas con controles condicionales; oferta acumula moderación/historia en una
  columna. Métricas usan anchos1/.85 y align-items:start. Cursos separa dos pilas.
- **Cambio previsto antes de código:** detalles con grilla de filas compartidas,
  columnas iguales y tarjetas estiradas solo al alto natural de su fila; avisos
  generales ocupan fila completa. Seguimiento: acciones aparte, contacto/historial,
  preentrevistas/respuestas y cronología/notas. Perfil: mantenimiento primero,
  perfil/CV antes de notas y participaciones, con alta/vinculación condicionales.
  Oferta conserva información izquierda/decisión derecha y pasa historial debajo.
  Revisar cuentas, empresas, cursos, métricas, derivaciones y todos los públicos.
  No columnas de tarjetas apiladas de forma independiente ni cambios de CSS order.
- **Criterio:** sustituye la exclusión demasiado amplia de SM3 para detalles. Las
  tarjetas de una misma fila se alinean arriba/abajo también si contienen funciones
  distintas. Los controles y texto conservan su tamaño; sin alto de viewport,
  recorte, contenido ficticio en producto, JS de medición o campos nuevos. Navegación
  lateral y contenido principal no son tarjetas pares: revisar y documentar estos
  casos concretos. Formulario único/legal mantiene ancho legible, no pares vacíos.
- **Archivos/contratos previstos:** CSS module opt-in de composición, páginas
  admin detalle de participación/candidato/oferta/empresa/cursos y cuenta; CSS de
  métricas y revisión de superficies restantes, docs/spec/plan/tasks. Reusar Card,
  formularios, claves/IDs/anclas, guards, políticas y datos actuales. Sin SQL,
  dependencia, variables o arquitectura nueva; fuentes oficiales de Card consultadas.
- **Riesgos/verificación:** condicionales pueden dejar una celda sola; darle fila
  completa sin hueco ficticio. Revisar casos finalizados/abiertos, feedback pendiente,
  vacío/datos, presencial no vinculado/vinculado, activo/suspendido/archivado. Inventario
  de31 páginas y variantes, medición de tarjetas reales (no solo contenedores),
  igualdad por fila dentro de1px a1366/1920/2560, apilado320/390, texto largo,
  formularios expandidos/errores, teclado/axe; tipos/lint/unit/build/E2E relevantes.
- **Preparación:** alcance explícito coordinado; especificación, clarificación,
  diseño, checklist y tareas del delta revisados antes de producto. Análisis
  SY1–SY5/constituciónI–VI sin decisión municipal nueva o brecha crítica/alta.
  Gates humanos históricos intactos; esta preparación no implicaba aceptación visual.
- **Hallazgo antes de corregir AuthSurface:** auditoría completa detecta /recover
  a320: tarjetas miden311px dentro de288px útiles. Grilla implícita usa ancho
  intrínseco y texto de introducción no puede encoger; desktop además usa .95/1.05
  y alineación inicial. Ajustar solo AuthSurface (recover, verificación y cambio
  de contraseña): columna minmax0/mínimos de texto, columnas desktop iguales y
  paneles estirados por fila. Mantener Home/login, ancho de lectura, campos, orden
  móvil y todas las acciones. Verificar tres páginas y sus variantes/ambos roles.
- **Detalle previo al acabado:** capturas muestran inset20 en secciones y24 en
  formularios pares. Unificar24 (20 en móvil) solo en la grilla opt-in; conservar
  rojo de decisiones destructivas y no duplicar padding de cronologías enmarcadas.
  El mantenimiento presencial ahora ocupa una fila completa: agrupar nombre/DNI,
  teléfono/correo y detalle/domicilio en pares desktop, con el resto a ancho completo,
  sin reordenar campos/DOM. Aplicar también al alta presencial; móvil conserva una
  columna. Es composición necesaria para evitar campos estirados de1500px.
- **Implementado:** detail-layout.module.css opt-in, seis páginas administrativas
  (participación, candidato, oferta, empresa, cursos y atención presencial), cuenta,
  AuthSurface y dashboard.module.css de métricas. Campos/acciones/keys/IDs/anclas/
  guards y estados intactos; sin SQL, dependencia o variable nueva. Fuentes oficiales
  de Card/registro base-nova consultadas, sin sobrescribir componentes compartidos.
  Artefactos y docs/implementation/card-symmetry-audit.md reflejan el alcance final.
- **Verificación final:** inventario de31 páginas y59 variantes/rutas de los cuatro
  perfiles:295 vistas en Chromium a1366/1920/2560/390/320. Cero overflow, errores de
  cliente o fallas de geometría.95 mediciones de detalles verifican el marco real,
  no solo wrapper;30 de AuthSurface,78 barridos axe sin infracciones. Se revisaron
  capturas, texto extenso y estados disponibles: referido/contratado/no seleccionado/
  retirado; candidato activo/needs_update y presencial; seis estados de ofertas,
  cursos con/sin candidato. Estados archivados/suspendidos/vinculados adicionales
  conservan cobertura de componentes; no afirmar que todos tuvieron fixture navegador.
- **Regresiones:** tres nuevos E2E persistentes PASS: contacto/historial en caso
  referido y contratado, error de fecha sin perder resumen, teclado/axe/apilado;
  acceso secundario a1920/320. Nueve E2E finales de búsqueda/sesión PASS. Total12,
  sin retries/omisiones.1608 unit/componentes/133 archivos,60 tooling, tipos, lint,
  build frío y diff PASS. React revisado: solo composición/CSS, sin estado/efectos/
  JS nuevos o alteración de identidad/props de formularios.
- **Hallazgos conservados:** primer recorrido detectó seis vistas AuthSurface con
  overflow320; resueltas. Tres comparaciones iniciales de ancho de navegación/lector
  eran incorrectas: excepción documentada y ahora verificada por top/gap/límites,
  sin ocultar la medición ni cambiar esa navegación. La primera prueba nueva usaba
  received, ausente en el fixture: se eligió el caso abierto referido que sí existe,
  sin crear datos, omitir la prueba o aumentar timeout. Unitarias de orden se
  actualizaron a orden semántico conservado y grilla nueva, no pilas retiradas.
- **Cierre:** SY1–SY5/T279–T281 verificados sin brechas nuevas; evidencia local
  ignorada extra115-before-final/final-* y capturas. Solo instancia QA ficticia propia;
  sin reset habitual o cambios alojados. next-env ajeno conserva hash. Sin commit,
  PR, CI, despliegue o revisión/aceptación humana. Solo Chromium medido; no se afirma
  cobertura de otros motores. Avisos previos de stream cancelado en navegación
  interrumpida no produjeron fallos finales; no se modifica streaming en este alcance.
  Recuperación por revert visual conservando todos los registros.


## EXTRA-114 — Simetría de tarjetas comparables

- **Fecha/origen:** Mateo,31/10/2026, pide comprobar que las cards sean simétricas.
  Continúa feat/desktop-layout-polish conservando112/113 y next-env ajeno.
- **Evidencia previa:** listados ya igualan altura exterior con h-full, pero título
  largo desplaza empresa/categorías/datos frente a sus pares; ofertas empresariales
  y participaciones no separan encabezado, cuerpo y cierre. Recomendaciones del
  dashboard tienen metadatos a alturas distintas y resumen empresarial usa1.4fr/1fr.
- **Cambio antes de código:** grupos equivalentes comparten ancho/altura por fila,
  encabezado/cuerpo/cierre alineados mediante CSS subgrid opt-in desde768 con
  fallback flex. Tres grupos estables, orden/contenido completo y controles actuales;
  no clamp, alturas fijas, medición JS en producto o igualdad artificial entre filas
  distintas. En móvil una columna conserva altura natural. Dashboard alinea sus
  metadatos y resumen de empresa usa dos columnas iguales.
- **Justificación/contratos:** detalle técnico necesario para simetría sin recortar
  datos o estirar toda la página. Mantener Card/primitivas, formularios, acciones,
  foco, campos requeridos, mensajes y claves de intentos. Fuente técnica: CSS Grid
  subgrid (MDN, developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid),
  con @supports para mejora progresiva; sin dependencias o arquitectura nueva.
- **Archivos previstos:** CSS de layout opt-in en components/ui; catálogo público,
  ofertas/participaciones de candidato, ofertas/resumen empresarial, CSS de dashboard;
  spec/plan/tasks/UI y evidencia. Home (números/proceso/carrusel) y grupos de cuentas
  se revisan; no forzar simetría entre un formulario y una tarjeta de otra función.
- **Riesgos/verificación:** subgrid anidado, padding/filas incompletas, títulos/
  mensajes extensos, formularios de distinto estado, interacción y móvil. Medir
  anchos, alturas y coordenadas internas por fila a1366/1920/2560 y320/390, sin
  overflow/cortes/solapamientos; teclado/axe, tipos/lint/unit/build y recorridos
  relevantes. Fallback y grupos ya simétricos se preservan. Sin SQL/datos nuevos.
- **Estado:** implementado y verificado; registro previo a código y análisis
  SM1–SM4 sin brechas constitucionales ni decisión municipal nueva. Gates humanos
  históricos intactos; commit/PR, CI, despliegue y revisión humana no realizados.
- **Detalle visual antes del ajuste final:** las capturas muestran enlaces del
  resumen empresarial a distinta altura pese a sus bordes iguales. Aplicar flex
  vertical y margen automático a los enlaces existentes, sin cambiar destinos,
  controles o altura fija. Verificar que ambos queden al pie en desktop y que
  móvil conserve el contenido completo y el foco.
- **Archivos finales:** components/ui/card-layout.module.css; catálogo público
  y su CSS; ofertas/participaciones de candidato; ofertas y panel empresarial;
  account.module.css; artefactos spec/plan/tasks, UI_GUIDELINES, implementation-status
  y docs/implementation/desktop-layout-audit.md. Card, servicios, acciones, claves
  de intentos y permisos conservados. Sin SQL, dependencias o variables nuevas.
- **Verificación real:** 40 vistas en Chromium (ocho rutas/variantes de cuatro
  perfiles × 1366/1920/2560/390/320), con igualdad por fila dentro de 1px, tres
  grupos alineados, títulos completos y sin overflow/errores de cliente. 16
  barridos axe y dos adicionales con CV desplegado por teclado y mensaje largo
  ficticio insertado solo en DOM: cero infracciones. Cuatro comprobaciones del
  fallback flex mediante estilos de prueba; no equivalen a probar otros motores.
  Capturas revisadas; metadatos y enlaces del resumen empresarial alineados.
- **Checks:** 1608 unit/componentes en 133 archivos, 60 tooling, tipos, lint,
  build frío y nueve E2E finales de búsqueda/sesión PASS (sin retries/omisiones).
  La primera suite tuvo un timeout de 5s en el escaneo español mientras compilaba;
  se repitió completa sin modificar prueba/timeout: 1608 PASS. Caché incremental
  volvió a producir dos selectores CSS basura; build frío del snapshot, sin tocar
  fuente/configuración, pasó sin esos avisos. Advertencia de raíz por copia anidada
  solo del entorno QA. next-env ajeno conserva su hash; servicios propios cerrados
  al terminar, sin reset o cambios en Supabase habitual/alojado. Recuperar por
  revert visual del PR, sin alterar datos. Evidencia local ignorada extra114-*.
- **Límite observado:** Next conserva el aviso previo de stream cancelado
  (digest2894301752) en navegaciones interrumpidas de QA; no hubo errores de
  cliente ni fallos en los nueve recorridos finales. No se cambia streaming como
  parte de este ajuste de composición.

## EXTRA-113 — Aprovechamiento del escritorio en todas las páginas

- **Fecha/origen:** Mateo,31/10/2026, amplía la revisión visual a todas las páginas
  para aprovechar pantallas de PC. Se conserva íntegro el trabajo pendiente112;
  rama local renombrada feat/desktop-layout-polish, sin borrar trabajo ni publicar.
- **Evidencia previa:** DashboardShell de los tres roles limita candidateCanvas
  a1280px aunque el espacio de trabajo sea mayor. Ofertas, secciones inferiores
  de Home y cursos repiten ese tope; listados conservan dos columnas a1920/2560.
  Formularios breves, términos y páginas de error tienen límites de lectura que
  son deliberados, no equivalentes a un listado limitado artificialmente.
- **Cambio previsto antes de implementar:** lienzo privado ocupa el espacio útil
  tras sidebar/márgenes; máximo público compartido1280→1800 solo desde1440px.
  Catálogo y listados de tarjetas existentes ganan columnas en escritorio ancho;
  preservar orden DOM, paginación, filtros, contenido y acciones. Datos empresariales
  simples usan tercera columna cuando hay espacio. No inflar tipografías, campos,
  altos de tarjetas ni llenar con contenido artificial vistas cortas/vacías.
- **Alcance/autorización:** pedido global coordina las bases visuales compartidas.
  Auditoría de31 page.tsx, variantes de candidato y /account por rol, detalles,
  públicos, auth, redirecciones y estados. No rediseñar controles, perder simetría,
  cambiar navegación, permisos, reglas, CV, sesión o datos. Mantener límites de
  párrafos/formularios cortos y encabezados legibles, además del funcionamiento112.
- **Archivos/contratos:** globals.css (solo variable de ancho), account.module.css,
  home.module.css, public-offers.module.css y catálogo, cursos; listas privadas
  de candidato/empresa y ficha empresarial administrativa; docs/spec/plan/tasks y
  matriz de revisión. Contratos y modelo intactos; sin migración/dependencia/variable
  de entorno. CSS con tokens actuales, ajustes desktop opt-in; móvil conserva diseño.
- **Riesgos/verificación:** todos los roles usan shell común; comprobar anchos reales
  útiles antes/después, filas/tarjetas y lectura en1366/1920/2560, sin scroll
  horizontal o huecos por alturas forzadas. Móvil390/320 y teclado/axe de regresión.
  Recorrer páginas reales con fixture local propio, tipos/lint/unit/tooling/build
  y pruebas relevantes. Recuperar por revert de presentación, sin modificar datos.
- **Estado real:** implementado y verificado. Registro previo a código y análisis
  SP1–SP5 sin incertidumbre municipal, arquitectura nueva o críticos/altos. Las31
  páginas y46 variantes fueron revisadas; sin brechas nuevas del alcance. Gates
  humanos históricos intactos; sin commit/PR/CI/revisión humana o despliegue implícitos.
- **Prerrequisito visual demostrado antes de corregir:** al revisar regresión móvil,
  navbar privada320px usa44px para la marca y0px de separación, mientras Mi cuenta
  termina en327.48px. El ajuste112 solo cubre ofertas. Reutilizar esa regla probada
  en home.module.css compartido y retirar duplicado local: padding10/gap8, marca sin
  compresión y separaciones internas6 bajo359. Mismos enlaces/44px/visibilidad,
  ninguna interacción o control nuevo. Verificar todos los roles a320/390, límites
  reales de cada elemento y ausencia de overflow; riesgo compartido de CSS acotado.
- **Detalle derivado SP3 antes de código:** el formulario público conserva tres
  filas de campos/acciones aunque su columna ahora dispone de más de1000px.
  Bajo alcance de composición, desde1600 distribuir texto (dos unidades) y tres
  selectores en cinco columnas, acciones en una fila completa. Solo CSS local
  contra el formulario existente por su nombre accesible; campos/GET/errores/foco
  intactos, móvil/tablet conservados. Verificar alineación de cuatro campos,
  altura natural más corta y envío/limpieza a1920/2560, sin mover inputs de orden.
- **Archivos finales:** previstos arriba; grillas privadas opt-in en account.module.css
  reutilizadas por listas de candidato/empresa, datos simples en ficha de empresa;
  regla estrecha centralizada en home.module.css y eliminada del módulo de ofertas.
  Inventario/evidencia en docs/implementation/desktop-layout-audit.md y artefactos
  spec/plan/tasks/checklist/UI/implementation-status alineados. Sin SQL de producto,
  permisos, handlers, dependencias, variables de entorno o cambios alojados.
- **Medición real:** antes46 vistas a1920; después154 mediciones (46 variantes en
  1366/1920/2560 y16 móviles320/390), cero overflow/errores de cliente/boundaries.
  Paneles1920:1280→1608px útiles completos; a2560:2248px. Ofertas1920:1280→1800;
  cursos/Home amplían sus bloques según la misma variable. Tarjetas privadas3 a
  1920 y4 a2560, catálogo público3. Límites de lectura de términos/auth conservados.
  Filtro público revalidado tras el último ajuste en seis anchos:352→185px a1920/
  2560, campos alineados, tabulación/GET/persistencia/limpiar/axe correctos.
- **Verificación:**1608 unit/componentes/133 archivos,60 tooling, tipos/lint/
  build frío/diff PASS. Nueve E2E finales sin retries/omisiones: búsqueda y tres
  roles con renovación, reapertura, navegación y cierre explícito. Axe0 en28
  barridos seleccionados de la revisión general y seis finales de filtros; no se
  presenta como axe en todas las154 mediciones. Capturas desktop/móvil revisadas.
- **Diagnósticos/límites:** el build incremental generó dos selectores basura de
  CSS; fuentes verificadas sin caracteres de control y build frío de la copia
  propia PASS sin esas advertencias, sin parchear compilador/configuración. Axe
  auxiliar exigió browser.newContext explícito; corregido el harness y repetidos
  seis checks sin cambiar reglas. Persiste aviso histórico de stream cancelado
  al navegar, sin errores cliente o fallos finales; fuera del alcance visual.
- **Entorno/recuperación:** solo funes-admin-cv-check, API54341/DB54342/app3001.
  Un perfil presencial ficticio independiente creado por RPC activo autorizado,
  con consentimiento/auditoría conservados y sesión temporal eliminada. Sin reset
  de base habitual ni datos reales. Se detienen únicamente servidor/instancia
  propios conservando respaldo. next-env ajeno mantiene B8B3A344…C491000.
  Recuperar mediante revert de presentación; no borrar registros o auditorías.

## EXTRA-112 — Presentación pública de ofertas y navegación común

- **Fecha/origen:** Mateo,31/10/2026, solicita adecuar /ofertas y cada oferta al
  estilo vigente y corregir navbar distinta. Rama feat/public-offers-style desde
  main71a758e actualizado; PR87 mergeado, rama anterior eliminada local/remota.
  next-env ajeno preservado con hash B8B3A344…C491000.
- **Evidencia previa:** catálogo tiene HomeNavbar pero le pasa acceso al perfil
  en lugar del panel y duplica navegación en banda propia; detalle conserva logo,
  header, gradiente y enlaces de registro independientes. Ambos usan composición
  previa al panel blanco sobre espacio verde de las vistas actuales. Detalle ofrece
  registro/postulación también a empresa/admin aunque esos roles no pueden postular.
- **Cambio previsto antes de código:** reutilizar HomeNavbar sin modificar su
  comportamiento global, con panel verificado y campana solo en sesión activa.
  Contenedor servidor común de ambas páginas, espacio verde y lienzo blanco con
  tokens municipales, encabezado compacto Sora, tarjetas equilibradas, controles
  existentes y aside que respeta header fijo. Reutilizar variantes Button en links
  semánticos; sin fuente/paleta nueva ni rediseño de Home/cursos/dashboards.
- **Detalle necesario de presentación:** detalle lee getSiteAccess una vez como
  catálogo. Candidato mantiene destino por slug para postular, visitante conserva
  postulación/registro/login; otros roles ven acceso a su propio panel en lugar de
  acciones candidatas. No autoriza acciones nuevas: guards servidor/SQL intactos.
- **Archivos/contratos:** páginas de ofertas, contenedor/CSS local nuevos, pruebas
  de páginas/navegador; spec/plan/tasks/checklist/UI y evidencia. Contratos públicos
  de búsqueda, filtros GET, fechas, slugs, DTO, publicación/privacidad, CV y sesión
  se preservan. Sin migración, dependencia, variable o arquitectura nueva.
- **Riesgos/verificación:** teclado/foco/contraste, navegación móvil con campana,
  encabezado fijo sin tapar contenido, textos largos, tarjetas equilibradas,
  empty/invalid/404 y filtros/paginación; visitante y tres roles, destinos/ausencia
  de registro y uso de sesión servidor. Tipos/lint/pruebas/build y revisión visual
  a1920/1440/390/320px con datos ficticios; no datos privados o escrituras alojadas.
- **Estado real:** implementado y verificado; pedido explícito coordina/autoriza
  alcance. Documentado antes de código; revisión acotada PO1–PO5 sin críticos/altos
  o decisión municipal nueva. Sin brechas de implementación nuevas; pendientes
  humanos históricos intactos. Commit/PR/CI/revisión humana/despliegue no acreditados.
- **Diagnóstico intermedio:** navegador real mostró que buttonVariants de un módulo
  use-client no puede invocarse desde RSC, aunque unit/tipos/build pasen. Corregir
  reutilizando LinkButton existente, que aplica la variante dentro del límite
  cliente y conserva semántica link. Sin mover páginas/búsqueda al cliente ni
  cambiar componentes compartidos. Repetir build y recorridos reales antes de cierre.
- **Hallazgo visual antes de corregir:** captura activa320px muestra el emblema y
  el comienzo de Inicio tocándose aunque scrollWidth y axe pasen. Derivación PO5:
  reducir padding de navbar y separación interna solo bajo359px y dentro del
  contenedor público local, sin ocultar links/campana ni tocar HomeNavbar global.
  Verificar geometría real (al menos8px entre marca y primer link), además de
  overflow/axe; añadir la comprobación a navegación E2E por rol. Riesgo acotado a
  CSS de estas dos vistas en móvil estrecho; mismas acciones y mínimos táctiles.
- **Archivos finales:** páginas catálogo/detalle, public-offers-shell.tsx y módulo
  CSS local; public-offers.test.tsx, public-offer-search.spec.ts y
  session-navigation.spec.ts; spec/plan/tasks/checklist/contrato de autorización,
  UI_GUIDELINES, guías operativas e implementation-status. Servicios/RPC, filtros,
  HomeNavbar/globales, modelo y dependencias sin cambios.
- **Verificación real:** RED5/16 de navegación/accesos; suite1608/133 PASS y66/5
  focales finales tras corregir LinkButton;60 tooling PASS. Tipos/lint/build/diff
  PASS. Nueve E2E finales sin omisiones/reintentos verifican filtros/teclado/páginas,
  inválidos/cerradas, tres roles, renovación, reapertura y cierre de sesión.
  Veinte vistas finales a320/390/1440/1920px con axe0/overflow0/errores cliente0,
  títulos/cuerpo extensos, opcionales, foco y separación marca/Inicio>=8px; solo
  sesiones activas consultan avisos y su API responde200. Slug inexistente mantiene
  no disponible/noindex/sin postulación. Capturas normales/largas revisadas.
- **Diagnósticos preservados:** primer ajuste estrecho seguía dejando0px entre
  marca y primer link; seis E2E geométricos lo rechazaron. Se midieron anchos,
  reservó gap8px y se redujeron solo espacios locales; mismos umbrales y nueve
  recorridos posteriores PASS. No se rebajó axe/overflow/geometría ni se omitieron
  pruebas. Next conserva diagnóstico histórico de stream cerrado al cancelar
  navegación, sin error de cliente o fallo en recorridos finales; no se amplía
  este cambio visual a un arreglo general de streaming.
- **Entorno/límites:** copia ignorada e instancia propia funes-admin-cv-check,
  API54341/DB54342/aplicación3001, exclusivamente ficticias. Se actualizaron allí
  tres migraciones ya mergeadas de main que faltaban en su respaldo; no migración
  nueva de este incremento, reset de base habitual o cambio alojado. next-env ajeno
  mantiene hash original; ningún dato real, secreto, dependencia o variable nueva.
  Recuperación y validación: docs/operations/public-offers-presentation.md.


## PR86 documentation integration — current scope and historical evidence

PR86 adds only session-aware public-offer presentation: `/ofertas` reads
`getSiteAccess` once per request and reuses the verified `panel.href` and
`panel.label` for its header and sidebar. An active candidate, company or
administrator sees the correct panel link, not anonymous “Crear cuenta” or
“Iniciá sesión” calls to action. With no verified active panel, preserve the
anonymous registration and login links. URL parameters, client registration
selection and guessed role paths are not authentication evidence. Hiding links
is presentation, not authorization; keep server guards and database privacy.
See `docs/operations/public-offers-authenticated-access.md` and
`specs/001-municipal-employment-portal/contracts/authorization-matrix.md`.

Mateo's EXTRA-108 rollback applies to PR86's own Home/login experiments only;
it does not revert the feature branch's independently approved session-aware
Home access panel, anonymous drafts, or chart-first administrative architecture.
Both `/admin` and `/admin/metrics` retain visible shared bar/donut charts, not
six summary cards or graphs hidden behind Ver detalle. Keep central labels,
real values, text equivalents, native GET filters, selected-name tags, keep-open
multiselect and visible CSV/PDF/XLSX exports. Public Home aggregate cards are
separate and unchanged. Preserve course links/referral history, private photos,
individual administrator invitation/password setup, private notifications,
per-case immutable CVs, date presentation and withdrawn-only new attempts.
Hiring retains operational consent, changes availability to unavailable and
preserves only the already-authorized hiring-company access window of 720 hours;
revoked access never revives. Legal registration receipts remain separate from
operational privacy in Cuenta. Keep native `datetime-local`, ISO payloads and
Funes conversion; browser locale display order is not guaranteed.

The retained branch narratives below are historical evidence where superseded.
In particular, incoming six-card/Perfil wording is explicitly archived inline,
not a competing current design. Earlier statements that SQL or browser checks
were pending describe their recorded phase, not a new failure: the task ledger
contains subsequent isolated SQL, coverage and browser phase results. An
interrupted local gate is not a pass, and prior CI success is not a fresh
integrated acceptance run. This unit performs static documentation verification
only; the parent owns executable gates, task-ledger updates and Git operations.
No new legal/municipal approval, independent review, acceptance, hosted rollout,
merge or deployment is established by this union.

### Documentation reconciliation record

- **Authorization / origin:** requested PR86 documentation conflict resolution; S18/T11 in `odd/tasks/final-portal-improvements.md`. Existing EXTRA-106 identities are retained, not renumbered.
- **Problem / change:** independent appended histories collide; incoming current architecture predates approved charts and Cuenta privacy. Union both complete originals, archive superseded incoming wording inline, and bound PR86 to public-offer CTA presentation without reverting feature Home behavior.
- **Affected files / recovery:** only `cambios-extra.md`, `docs/UI_GUIDELINES.md` and `specs/001-municipal-employment-portal/plan.md`. Recover by additive documentation correction; preserve runbook, contracts and original evidence. No source, tests, SQL, dependency, Git or remote changes by this unit.
- **Static verification / status:** implemented documentation reconciliation. Exact ordered-line comparison retains all 5,747 local and 5,797 incoming ledger lines, all 908 local and 838 incoming UI lines, and all 1,313 local and 1,273 incoming plan lines; zero missing lines, including the complete EXTRA082 section. Conflict markers are absent from these three files. Original snapshot hashes and line mappings are retained in `C:/Users/maxim/AppData/Local/hermes/cache/scratch/pr86-doc-union/`. This is static preservation evidence only; integrated functional verification, review and task-ledger status remain parent-owned.

### Historical identifier disambiguation — EXTRA-106 (PR86)

| Historical ID | Title-qualified identity and scope |
| --- | --- |
| EXTRA-106 | `PR85 documentation union for chart-first dates and retries` — local documentation history |
| EXTRA-106 / EXTRA106 | `Accesos públicos coherentes con sesión iniciada` — incoming PR86 history, reduced to `/ofertas` by `EXTRA-108 — Conservar solo el ajuste de ofertas` |

Retain both original identifiers and all their evidence. Prior local references
to EXTRA-106 denote the PR85 documentation union; incoming EXTRA106/107/108
references denote the public-access experiment and its rollback history. Qualify
ambiguous references by title; do not globally renumber either lineage. The local
historical claim that 106 was unused describes its discovery snapshot only.
No new EXTRA identifier is allocated for this documentation-only reconciliation.

## EXTRA-106 — PR85 documentation union for chart-first dates and retries

- **Date / authorization:** 2026-10-29. Requested resolution of the three PR85 documentation conflicts; approved S18/T11/L36–L38 in `odd/tasks/final-portal-improvements.md`. Recorded before semantic documentation edits. EXTRA-106 was unused in this ledger at discovery.
- **Problem / evidence:** `pr85-map/report.md` identifies independent chart-first portal architecture and incoming date/retry/contact guidance in the same three documentation hunks. Both branches allocated EXTRA-102 to different changes. Historical EXTRA-104 free-text input is superseded by EXTRA-105, not a competing current requirement.
- **Necessary change / justification:** union both complete histories and architecture sections, add title-qualified EXTRA-102 references without renumbering, and clarify that central date presentation and withdrawn-only self-reapplication coexist with the shared chart-first renderer, existing privacy rules and per-case CVs. Preserve EXTRA-103/104/105 as historical evidence; do not reintroduce six summary cards or free-text contact entry.
- **Affected paths / contracts:** only `cambios-extra.md`, `docs/UI_GUIDELINES.md`, and `specs/001-municipal-employment-portal/plan.md`. Preserve native GET filters, labels, CSV/PDF/XLSX, notifications, courses, separate legal acceptance, private photos and the late retry test-project ordering. No source, tests, SQL, Git, database, installation, remote or configuration changes by this unit.
- **Risks / recovery:** ambiguous IDs, lost historical paragraphs and overstating browser locale or acceptance evidence. Recover through a reviewed additive documentation correction, never deletion of history or blind renumbering. Native `datetime-local` with `lang="es-AR"` does not guarantee regional order across browsers/systems.
- **Verification plan / status:** documentation union implemented. Static ordered-line readback against `pr85-map/01/local` and `pr85-map/01/main` retained all 5,529 local and all 5,670 incoming change-log lines verbatim in order, with zero missing lines, including the previously restored EXTRA082 verification paragraph. All three targets have zero conflict markers. Both complete local UI/plan originals are retained; incoming UI/plan retain the date/retry/contact sections while the earlier approved chart/privacy integration intentionally supersedes their obsolete current six-card/privacy wording. This is not a claim of byte-identical preservation of those architecture documents. Functional gates remain parent-owned; no new execution, independent review, legal/municipal approval, acceptance, migration rollout, merge or deployment is claimed.

## EXTRA-102 — Documentation integration for final portal improvements

- **Date / authorization:** 2026-10-29. Maxi requested «Resolvamos los conflictos» and confirmed «Prefiero reemplazarlos por los gráficos como te pedí inicialmente.» Scope: S18/T11/L36 in `odd/tasks/final-portal-improvements.md`; feature `63d32f2` / main `adad96c` are the supplied integration baselines.
- **Problem / evidence:** both branches add independent approved histories; conflict hunks and auto-merged contracts retain incompatible six-card/chart-first presentation and obsolete automatic consent withdrawal on hiring. The extracted registration-terms implementation note still describes that superseded rule.
- **Necessary change recorded before semantic documentation edits:** retain both histories without global renumbering; resolve the four documentation conflict blocks and align current spec, plan, UI, model, state-machine and terms implementation notes with visible shared bar/donut reporting, no six summary cards, and main's hiring/privacy rules. Keep notifications, application-specific CVs, limited candidate agenda, CSV/PDF/XLSX, courses, legal receipts, individual invitations and private photos. Preserve native GET filters, shared selected-name tags, keep-open multiselect and the ten-newest circular carousel without a pause button.
- **Contract / paths:** `cambios-extra.md`, `docs/UI_GUIDELINES.md`, `specs/001-municipal-employment-portal/{spec,plan,data-model}.md`, `specs/001-municipal-employment-portal/contracts/state-machines.md`, `docs/discovery/OPEN_QUESTIONS.md`, `docs/operations/registration-terms-draft.md`. Parent owns the task ledger, Git and final functional verification; no source, tests, migrations, database, remote or installation operations by this documentation unit.
- **Privacy / risks:** hiring makes availability unavailable while retaining consent; only an already-active authorized hiring-company referral may retain access for 720 hours (30 days); revoked access never revives and other cases remain intact. Legal acceptance at registration is separate from operational privacy in Cuenta. Preserve explicit manual withdrawal, conditional fresh acceptance after absence/withdrawal, and no repeat acceptance while accepted. Historical evidence is not current acceptance or municipal/legal approval. Risks: shared-contract contradictions, ambiguous historical IDs and mistaking static integration for functional proof.
- **Verification / recovery:** read back allowed paths for remaining conflict markers and contradictory current wording; verify both complete conflict-side histories remain, except explicitly superseded current presentation wording. Parent performs functional gates after concurrent resolution. Recovery is a reviewed documentation correction, never deletion of history or restoration of obsolete privacy rules.
- **Status:** documentation resolution implemented; static readback found zero conflict markers across the eight owned paths. Ordered-line comparison against both complete scratch originals (`pr84-map/01/local` and `01/main`) confirms both entire change-log histories are retained, including the EXTRA082 verification paragraph omitted by the initial textual merge. Current spec/plan/UI/model/state-machine/terms notes use the approved chart-first and hiring/privacy rules; superseded decisions remain explicitly historical. No integrated tests, build, independent review, acceptance, merge or deployment claimed; parent owns functional verification. Full current ledger recovery mirror saved and read back as Engram361 under project `funes-empleo`, topic `odd/final-portal-improvements/tasks`, with exact source locator; ledger itself was not edited.

### Historical identifier disambiguation — 085 / 086

| Historical ID | Title-qualified reference (preserve exact original identity) |
| --- | --- |
| EXTRA-085 | `/ofertas al diseño vigente y nombres accesibles de los combobox` — feature visual/accessibility history |
| EXTRA-085 / EXTRA085 | `Ofertas recientes, métricas PDF/XLSX y filtros servidor` — main portal/export/filter history |
| EXTRA-086 | `Mejoras finales del portal y recorridos del PDF de Beex` — feature S1–S17 history |
| EXTRA-086 / EXTRA086 | `Avance automático del carrusel` — main carousel history, subsequently refined by EXTRA087/088 |

References to colliding IDs must include the title or feature/main context above; do not globally replace historical IDs. EXTRA102 governs only this integration. Prior six-card and automatic-withdrawal descriptions remain historical where superseded by the approved rules above.

### Historical identifier disambiguation — 102 (PR85 integration)

| Historical ID | Title-qualified reference (preserve exact original identity) |
| --- | --- |
| EXTRA-102 / EXTRA102 | `Documentation integration for final portal improvements` — local chart-first documentation integration history |
| EXTRA-102 / EXTRA102 | `Fechas uniformes y nueva postulación tras retiro` — incoming PR85 dates and withdrawn-only self-reapplication history |

The preceding historical sentence “EXTRA102 governs only this integration” refers exclusively to `EXTRA-102 — Documentation integration for final portal improvements`, not to the incoming dates/retry entry. In the incoming EXTRA-103/104/105 histories, numeric 102 references denote `EXTRA-102 — Fechas uniformes y nueva postulación tras retiro`. Both identities remain unchanged; qualify current references by title. EXTRA-106 records the present union, not a renumbering of either history. EXTRA-105 supersedes the EXTRA-104 free-text contact experiment; its implementation and verification paragraphs remain historical evidence, not current input guidance.

## EXTRA-086 — Mejoras finales del portal y recorridos del PDF de Beex

- **Fecha y autorización:** 2026-10-27; Maxi solicita las diecisiete mejoras de `odd/tasks/final-portal-improvements.md` y confirma «Si, lo del PDF es lo que se pide» tras revisar la preentrevista opcional y las derivaciones a cursos.
- **Origen y evidencia:** el mapa de `a5b867c` detecta registro de Home disponible con sesión, categorías inconsistentes, sidebar sin foto persistida, métricas sin gráficos y ausencia de gestión específica de derivaciones a cursos. El PDF entregado exige curso, postulante, derivación e historial independiente; una lista de enlaces no lo reemplaza.
- **Cambio propuesto:** ejecutar los bloques trazados en el documento de tareas, preservando intermediación, controles de privacidad, validación, URLs opacas y datos existentes. Separar aceptación de términos del consentimiento operativo. Mantener preentrevista opcional y derivación directa según confirmación de Maxi; conservar la contradicción textual del PDF como evidencia.
- **Archivos y contratos:** superficies de Home, formularios compartidos, paneles, métricas, cuentas y capacitación; pruebas, documentación y migraciones aditivas acotadas cuando correspondan. Las rutas exactas y resultados se registran por bloque en el documento de tareas. Sin nuevas dependencias por defecto.
- **Riesgos y recuperación:** permisos/invitaciones, registros persistidos y contratos compartidos requieren verificación independiente. No migrar aceptaciones legales implícitas, eliminar historial, relajar consentimiento ni enviar invitaciones reales. Cambios de esquema con recuperación documentada. No ejecutar wrappers que resetean datos locales sin autorización específica.
- **Verificación prevista:** RED/GREEN focalizado, regresiones, lint, typecheck, build, unitarias/tooling; pruebas SQL y recorridos reales en estado aislado autorizado. Navegador responsive y teclado para la presentación. No inferir aprobación legal o municipal de los términos de demostración.
- **Estado actual:** implementado localmente en `feature/portal-flujos-final`, con verificación automatizada por fases registrada en `odd/tasks/final-portal-improvements.md` L33. Última suite amplia de navegador121aprobadas/1fallida; tras corregir el control desactualizado, SC-008A1aprobada con cuatro administradores bajo5000ms y auditorías íntegras, más ambas carreras SQL aprobadas. No se afirma una nueva corrida completa122/122. Cursos/historial, foto/sidebar e invitación real local hasta contraseña individual/ingreso nuevo ya pasaron; enlaces reutilizados/inválidos denegados. Aplicación de plantilla conservó exactamente73tablas y501objetos Storage por sus bytes. Últimas31pruebas focalizadas/4archivos, ESLint, TypeScript y57tooling aprobadas; evidencia anterior de1426unitarias,build y1383pgTAP/46migraciones se conserva separada. Aviso de contraseña actualizada ausente confirmado también en el commit base: advertencia preexistente, no regresión ni requisito añadido silenciosamente. Revisión visual humana, aprobación jurídica/municipal, plantilla Auth alojada y entrega Git siguen pendientes; no hubo commits, PR, publicación ni despliegue. Los cambios ajenos y los datos ficticios retenidos fueron preservados.
- **Resultado de la corrección de invitaciones:** plantilla/configuración implementadas y aplicadas solo al proyecto local con respaldo predeterminado. El verificador independiente comprobó correo real en Mailpit, callback con hash de un solo uso, cookies de servidor, formulario de contraseña, persistencia, cierre de sesión, ingreso nuevo a `/admin`, auditorías y rechazo de reutilización/hash/tipo inválido. Ningún bearer token se procesó en cliente ni se relajó el callback; no se modificó configuración alojada. El reinicio mantuvo los501objetos y todas las tablas antes de la nueva cuenta ficticia de aceptación; esa cuenta y sus auditorías permanecen. Riesgos2,5 verificados en el alcance local, no aprobación de producción.
- **Corrección necesaria de invitaciones, 2026-10-28, antes del cambio:** el recorrido real S5 confirma que el correo predeterminado de Auth verifica la cuenta pero entrega la sesión en un fragmento invisible al servidor. El callback recibe solo `next`, falla cerrado y no abre la contraseña individual. Se añadirá `supabase/templates/invite.html` y se habilitará exclusivamente `[auth.email.template.invite]` en `supabase/config.toml`, con origen canónico `.SiteURL`, `token_hash=.TokenHash`, tipo fijo `invite` y destino fijo de contraseña. Se conserva `verifyOtp`, eliminación de fragmentos, cookies de servidor, autorización y encabezados de privacidad; no se añade procesamiento cliente de bearer tokens. Fuentes: diagnóstico `scratch/s5-callback-diagnosis/verification-report.md` y documentación oficial de Supabase sobre plantillas/SSR. Verificación: regresión de configuración/enlace, callback existente, aplicación local no destructiva y nueva invitación real solo a Mailpit, contraseña propia e ingreso independiente; comprobación de enlace reutilizado/inválido. Riesgos: autenticación y configuración local; verificador independiente obligatorio. Aplicación mediante parada/arranque local con respaldo predeterminado, sin `--no-backup`, reset ni migraciones, verificando conservación de datos y objetos; cambios alojados requieren autorización aparte. Recuperación: revertir plantilla/configuración y reiniciar preservando datos; no reutilizar enlaces consumidos ni modificar las cuentas ficticias previas.
- **Corrección necesaria de búsqueda, 2026-10-28, antes del cambio:** el recorrido E2E de filtros reproduce un bucle canónico al combinar texto con espacios y categoría opaca. `referenceUrl` serializa espacios como `%20` y `canonicalReferenceRoute` reconstruye `+`, por lo que la búsqueda nunca llega a resultados. Se unificará únicamente la serialización del query en `src/lib/records/reference-url.ts` con URLSearchParams, conservando valores, orden, claves repetidas, anclas, firmas y permisos de referencias. Siete regresiones RED observadas cubren las seis superficies compartidas y diferencian espacios de `+` literal. Riesgo: contrato compartido de enlaces; verificación independiente y recorrido real sin aumentar timeout. Recuperación: revertir la serialización, sin modificar registros ni migraciones. La comparación con HEAD es estática, no se atribuye como regresión introducida sin prueba equivalente.
- **Corrección necesaria responsive, 2026-10-28, antes del cambio:** las cuatro regresiones E2E de Perfil/Atención presencial se reproducen por proxies nativos `.sr-only` afectados por los tamaños de inputs globales y administrativos. Anchos del documento:391/1681px para candidato y425/1723px para administración, frente a viewports360/1366px. Se restaurará únicamente su geometría1px en `src/app/globals.css`, sin clipping de página, sin tocar inputs visibles, required, FormData ni enfoque del combobox. La prueba existente `accessibility.spec.ts:25` y el diagnóstico real sirven como RED; se verificará con build fresco, las cuatro geometrías, pruebas de validación y E2E autorizado. Riesgo de fundamento compartido; revisión independiente requerida. Recuperación: revertir solo esa regla sin modificar datos.
- **Adición necesaria, 2026-10-28:** el PDF confirmado exige motivo cuando la empresa informa que no contrata; la revisión encuentra `companyFeedbackInput` y `submit_company_feedback` aceptando `not_selected` sin detalle. Antes de modificar se registra la validación condicional compartida, campo requerido para ese resultado y migración aditiva `20261028023000_required_nonhire_reason.sql`, conservando firma, permisos, bloqueo, auditoría y respuestas restantes. Pruebas de esquema, formulario y pgTAP deben rechazar motivo omitido/vacío y conservar contratación sin detalle. No modifica retrospectivamente respuestas históricas. También se protege el autorregistro genérico legado con la misma aceptación de términos para no dejar un camino alternativo sin validar.

## EXTRA-085 — /ofertas al diseño vigente y nombres accesibles de los combobox

- **Fecha/autorización:** 2026-10-26; Maxi pidió «rediseñes `src/app/(public)/ofertas/page.tsx` y lo adaptes al diseño que venimos trabajando» y arreglar los seis hallazgos del tablero de pruebas.
- **Origen/alcance:** S1 de `odd/tasks/portal-polish.md` quedó cerrado solo con el reemplazo del emblema del encabezado. El catálogo público conservaba el encabezado propio, el degradado y los `Card`/`Badge` anteriores al pulido del portal. Alcance: composición visual de esa página y accesibilidad de los desplegables; sin cambios de contrato, datos ni permisos.
- **Problema/evidencia:** (1) el popup del combobox se renderiza con `role="dialog"` (cuando el input de búsqueda vive dentro) y la lista con `role="listbox"`, ambos sin nombre accesible; la regla axe `aria-input-field-name` cubre `listbox`, así que quedaban violaciones al abrir el desplegable. (2) En el filtro de categorías de la búsqueda administrativa el popup quedaba abierto tras elegir y tapaba el botón «Buscar candidatos». (3) El input oculto de transporte de `LocalityCombobox` repetía el nombre accesible "Localidad" del disparador visible, dejando dos controles con el mismo nombre. (4) `tests/e2e/assisted-section.spec.ts` todavía buscaba «Volver a atención presencial» cuando la navegación dice «Volver a perfil asistido» desde S11.
- **Cambio:** encabezado de `/ofertas` con el `HomeNavbar` compartido (`alwaysVisible`) sobre banda primaria, eyebrow, titular Sora y nota de intermediación; formulario de búsqueda migrado a `TextField`/`SelectField`/`Button` con el tratamiento municipal de campos; tarjetas, estados vacíos, paginación y barra lateral con los tokens vigentes; el acceso de cuenta sigue dentro de `nav[aria-label="Accesos principales"]` y la barra lateral muestra el panel cuando hay sesión. Nombres accesibles únicos: diálogo «Elegir …», lista «…: opciones», y el transporte oculto de localidad pasa a llamarse «Valor del formulario». El filtro de categorías administrativo cierra el popup al elegir, devolviendo el foco al disparador.
- **Archivos/contratos:** `src/app/(public)/ofertas/page.tsx`, `public-offer-search-form.tsx`, `locality-combobox.tsx`, `category-multi-select.tsx`, `candidate-search-form.tsx`, `company-opening-form.tsx`, `tests/e2e/assisted-section.spec.ts`, pruebas nuevas de componentes del combobox de categorías y del cierre del filtro.
- **Riesgo/recuperación:** 3 (los selectores de búsqueda y registro comparten `LocalityCombobox`); se conservan etiquetas, validación nativa, marcador requerido, foco del primer error y `FormData`. Revertir el commit restituye la presentación y los nombres anteriores.
- **Verificación:** lint, `next typegen` + `tsc`, suite unitaria y build de producción; comprobación del render público en navegador real (nombres accesibles, teclado, axe y geometría). El wrapper E2E no se usa como prueba visual porque reinicia la base de aceptación.
- **Estado:** implementado; registrado durante la implementación. Revisión humana, PR y despliegue pendientes.

## EXTRA-111 — Contraste del estado ámbar en la vista administrativa

- **Fecha/origen:** 29/10/2026, prerrequisito demostrado de accesibilidad al
  verificar AD2/AD6 de EXTRA109; amparado por autorización de adiciones técnicas
  necesarias de AGENTS.md. Sin decisión funcional o municipal nueva.
- **Evidencia previa:** axe rechaza cuatro etiquetas Pendiente de revisión en la
  última página empresarial. Token existente #9a6b00 sobre #fcf3db da4.2399:1,
  inferior a4.5:1 para texto pequeño; no se cambia el test ni se omite la regla.
- **Cambio previsto antes de implementar:** oscurecer solo el token compartido
  status-amber a #805900 (5.6718:1), manteniendo fondo, estado, mapeo, borde y punto.
  Un único token evita excepciones por página o paletas paralelas. Afecta las
  etiquetas ámbar de todos los roles; el significado y demás colores no cambian.
- **Archivos/contratos:** globals.css, UI_GUIDELINES.md y prueba independiente de
  contraste de los seis pares semánticos; tasks/evidencia. Sin componentes nuevos,
  API, permisos, modelo, dependencias o migración. Cambio compartido mínimo dentro
  de la verificación del alcance, sin asumir revisión humana del compañero.
- **Riesgo/verificación:** matiz ámbar más oscuro en consumidores existentes;
  conservar textos y tonos. Cálculo de contraste de tokens reales, unit/lint/build
  y axe/navegador en escritorio/móvil. Fuente de umbral: W3C SC1.4.3,
  https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html.
- **Estado real:** implementado y verificado. Token en globals.css, guía UI,
  plan/tasks y prueba nueva de seis pares semánticos PASS. Suite1387/112, tipos,
  lint y build PASS; navegador final diez vistas1440/390px con axe0. No publicación
  o aprobación humana implícitas; no modifica colores institucionales principales.

## EXTRA-110 — Fecha de Funes en el fixture SQL de reintentos

- **Fecha/origen:** 29/10/2026, requisito técnico necesario para ejecutar la
  verificación SQL de EXTRA109 según AGENTS.md; autorización permanente de
  prerrequisitos demostrables, no un cambio funcional adicional.
- **Problema/evidencia:** tras restablecer solo el entorno propio,27 archivos SQL
  pasan y075 falla en «Oferta vencida». Consulta local muestra current_date=
  2026-10-30, Funes=2026-10-29; current_date-1 produce29, que todavía está vigente
  para el contrato aprobado. El intento se crea y provoca fallos posteriores.
- **Propuesta previa a código:** fijar el día del fixture desde clock_timestamp
  at time zone America/Buenos_Aires y reutilizarlo para fechas de prueba futuras/
  vencidas. Mantener todos los rechazos, versiones y aserciones existentes.
- **Archivos/contratos:** solo `supabase/tests/075_application_retry.test.sql` y
  evidencia/tasks; contrato de fechas Funes y funciones servidor/SQL de producto
  intactos. Sin migración, configuración horaria global ni nuevos datos reales.
- **Riesgo/verificación:** debe pasar entre00:00 y03:00 UTC cuando difieren los
  días, sin debilitar la condición de vencimiento. Repetir pgTAP completo sobre
  fixture aislado frío, incluido075; no tocar base habitual o alojada.
- **Estado real:** implementado solo en075; todas las aserciones conservadas.
  Suite SQL completa1463/28 PASS en base aislada fría, incluida frontera real
  UTC/Funes. Ninguna función, migración o base alojada modificada. Guía operativa
  y T266 actualizadas; revisión humana y publicación no acreditadas.

## EXTRA-109 — Gestión administrativa de ofertas, empresas y cuentas

- **Fecha/origen:** Mateo, 29/10/2026, solicita siete ajustes administrativos:
  decisión aprobar/rechazar/correcciones, consultar empresa, historial inicial5,
  protección de administradores, quitar plantillas, paginar ofertas y reactivar
  en verde. Rama feat/admin-offer-management desde main9cf0741, PR86 mergeado;
  rama anterior eliminada local/remota. next-env ajeno preservado.
- **Evidencia previa:** ModerationForm ofrece cinco decisiones para pending_review;
  la oferta muestra nombre empresarial sin enlace. La ficha administrativa solo
  lee nombre/estado, y limita ofertas a50 sin páginas. ModerationHistory ya revela
  cinco eventos; listado general ya pagina10. change_account_status exige admin
  activo, impide autosuspensión/archivo admin y serializa con advisory lock antes
  de revalidar actor/estado/conteo. No se encontró una vía de panel que eluda esto.
  ContactTools muestra exactamente «Plantillas para el personal». Reactivaciones
  usan estilos rojos/neutros y pueden heredar el rojo del contenedor de cuenta.
- **Cambio propuesto antes de implementar:** limitar la decisión de revisión a
  Aprobar/Rechazar/Solicitar correcciones, preservando las acciones de ciclo de vida
  de otros estados y sus contratos. Enlazar a empresa con referencia opaca y mostrar
  sus datos registrados solo tras guard admin existente. Paginar10 sus ofertas
  con conteo/filtro/sort en servidor, sin borrar ni esconder resultados después
  de50. Conservar/verificar paginación general e historial5, mejorar recuperación
  de página vacía si corresponde. Retirar UI/módulo de plantillas sin alterar
  contactos registrados. Usar Button municipal primario verde para reactivación,
  mantener suspensión/archivo rojos, confirmación, motivo y auditoría.
- **Justificación/contratos:** FR023/025/051/053/055 y matriz de autorización ya
  admiten moderación, lectura de empresa y protección de último admin; FR057 se
  retira por pedido expreso. Perfil empresarial incluye razón social, CUIT,
  responsable, email/teléfono, actividad y localidad ya almacenados y autorizados
  para la Oficina. No acceso público/candidato/otra empresa ni botón de DNI/CUIT
  ajeno. No cambia estados, privacidad, límites de roles o reglas de reactivación.
- **Archivos previstos:** moderation-form; detalle/lista administrativa de ofertas;
  detalle empresarial; AdminCompanyDecision/AccountChangeForm/SafetyDecisionForm y
  estilos de cuenta acotados si el rojo heredado lo requiere; detalle de caso y
  contact-tools/message-templates; pruebas unit/UI/SQL/concurrencia/navegador;
  spec/plan/tasks/UI y contrato de autorización/guía operativa afectados.
- **Riesgos/verificación:** acceso a datos privados solo admin, referencias sin
  UUID visibles, filtros/paginación antes de contar, mensajes/versión conservados,
  botones destructivos todavía rojos, historial sin perder eventos, último admin
  protegido también con dos transacciones reales. Probar SQL existente, auditoría
  y rechazos sin escritura; pruebas UI por estado/cinco/seis/múltiples páginas,
  tipos/lint/pruebas/build y navegador ficticio escritorio/móvil/teclado.
- **Estado real:** implementado y verificado; pedido explícito autoriza y coordina
  alcance. Spec/diseño/tasks y análisis acotado precedieron código; AD1–AD7 cubiertos,
  sin hallazgos nuevos críticos/altos ni brechas finales. Sin migración: protección
  del último admin ya existente, ampliada evidencia SQL/DELETE/concurrencia.
  Se preservan pendientes históricos de revisión humana. Sin dependencias,
  arquitectura nueva, datos reales, cambios alojados, commit o PR implícitos.
- **Detalle técnico AD6 descubierto antes de corregirlo:** navegador real en
  página999 falla con INTERNAL_ERROR; PostgREST devuelve PGRST103/416 para rango
  fuera de filas, no una lista vacía como el mock inicial. Se requiere recuperar
  únicamente ese código con un conteo head bajo idénticos filtros/RLS y devolver
  lista vacía + total para el enlace previsto. Otros errores se siguen rechazando.
  Afecta admin-service.ts, ficha empresarial y pruebas de ambos; no otro endpoint,
  permiso, arquitectura ni migración. Verificar rango real, filtros y no ocultar
  errores de autorización/conteo. Evidencia oficial: docs.postgrest.org/en/stable/
  references/errors.html (PGRST103); respuesta observada local y código del SDK.
- **Archivos finales/evidencia:** los previstos arriba más admin-service.ts,
  account-decision.module.css, prueba Node de barreras y prueba de contraste.
  Guía `docs/operations/admin-offer-management.md`, implementation-status y T259–267
  actualizados.1387 pruebas unit/UI en112 archivos,60 tooling y1463 SQL/28 archivos
  PASS; dos conexiones verificaron bloqueo observado, actor revalidado, auditoría
  única y restauración auditada del admin ficticio. Contactos E2E PASS sin omitir
  canales. Navegador guardó las tres decisiones y verificó ficha autorizada, páginas
  posteriores a50, recuperación de rango, historial5→6/foco, reactivación verde en
  tres formularios y rechazo de dos roles; diez vistas1440/390px con axe0/overflow0.
  Tipos/lint/build/diff PASS. Fallo auxiliar inicial de redirección se debió a leer
  URL antes del redirect de Next; se espera destino /account y ausencia de ficha,
  sin cambiar permisos. Ejecuciones intermedias fallidas se conservan como diagnóstico,
  no se presentan como recorridos válidos ni se debilitan aserciones de seguridad.
- **Entorno/límites:** instancia propia funes-admin-cv-check en copia ignorada,
  sin reset de base habitual ni cambios alojados. Hubo reset frío de esa instancia
  propia por fixture anterior con versiones modificadas; evidenció EXTRA110.
  Next mostró su diagnóstico histórico destination stream closed early al cancelar
  navegación, sin fallo de los recorridos verificados; no se amplía alcance a ese
  streaming. next-env ajeno mantiene SHA256 original B8B3A344…C491000. Sin commit,
  PR, CI, revisión humana o despliegue de este incremento; pendientes ajenos intactos.

Publicación posterior de EXTRA109/110/111 solicitada por Mateo: commit sin firma
f3d460e y [PR87](https://github.com/maximo-Pdev/funes-empleo/pull/87) abierto hacia
main desde feat/admin-offer-management. Verificación local anterior preservada;
CI/revisión humana/merge/despliegue pendientes, next-env ajeno excluido.


## EXTRA-108 — Conservar solo el ajuste de ofertas

- **Fecha/origen:** Mateo, 29/10/2026: «los cambios del login descartalos, lo de
  las ofertas esta bien». Reduce el alcance de la rama actual.
- **Evidencia/cambio previo a código:** restaurar Home, login y sus pruebas al
  estado inicial de la rama. Descartar EXTRA107 y la parte de Home de EXTRA106;
  conservar /ofertas con CTA por sesión activa y rol. Alinear artefactos vigentes
  y pruebas de navegación con esa decisión, sin modificar next-env ajeno.
- **Archivos/contratos:** HomeHero, HomeAccessPanel, HomePage, CSS y pruebas Home
  restaurados; /ofertas page y pruebas públicas conservados. Spec/plan/UI/tasks,
  matriz y guía de operación limitados a ofertas. Sin cambio de backend, reglas,
  permisos, dependencias o migración. Las entradas106/107 quedan como historial.
- **Riesgos/verificación:** no conservar alteraciones de login, registro, hero o
  navbar; mantener ocultos Crear cuenta/Iniciá sesión en ofertas autenticadas y
  disponibles para visitante. Diff, pruebas relevantes, tipos, lint y build.
- **Estado:** reversión implementada y verificada. Diff confirma que HomePage,
  HomeHero, HomeAccessPanel, CSS y todas sus pruebas coinciden con HEAD. Solo
  /ofertas conserva cambios de producto; documentación limitada al alcance final.
- **Verificación final:** 77 pruebas relevantes, tipos, lint completo, build y
  diff PASS. Seis E2E sin retries/omisiones (tres roles×renovación pública/privada):
  inicio anterior, navegación, CTA de ofertas por rol, retorno de enlaces anónimos
  al cerrar sesión y segunda pestaña. Entorno aislado ficticio sin reset/escritura
  alojada; next-env ajeno conserva SHA256 B8B3A344…491000. Sin migración, commit,
  PR/publicación ni revisión humana implícitos. T258 completo; no quedan brechas
  del alcance reducido ni cambios en gates históricos pendientes.
- **Publicación solicitada:** commit sin firma 361f7eb; PR86 abierto hacia main:
  https://github.com/maximo-Pdev/funes-empleo/pull/86. Incluye solo el ajuste de
  ofertas, sus pruebas y trazabilidad. Sin merge, aceptación humana o CI aprobado
  implícitos; next-env ajeno excluido.

## EXTRA-107 — Retirar también la tarjeta de sesión iniciada del inicio

**Descartado por Mateo en EXTRA108; no describe el comportamiento vigente.**

- **Fecha/origen:** Mateo, 29/10/2026, aclara con captura que el login del inicio
  incluye la tarjeta «Ya tenés la sesión iniciada». Sustituye esa presentación
  de EXTRA-106; conserva el resto del alcance y la rama enfocada actual.
- **Evidencia/problema:** el formulario se ocultó, pero su tarjeta y la mitad
  derecha verde permanecen aun con sesión activa.
- **Cambio previsto antes de implementar:** no montar el área de acceso para
  sesiones activas; usar una sola columna para la introducción y mantener visible
  «Mi cuenta» en la navegación, con el panel del rol. Anónimo conserva su diseño.
- **Archivos/contratos:** HomeHero, HomeAccessPanel, HomePage, home.module.css,
  pruebas Home/sesión y artefactos UI/spec/plan/tasks. Sin cambio de backend,
  autorización, contratos de datos, dependencias ni migración.
- **Riesgos/verificación prevista:** ausencia de tarjeta y espacio vacío en móvil
  y escritorio; navegación por teclado al panel de los tres roles; retorno de
  login al cerrar sesión y bloqueo de registros por query/evento autenticado.
  Pruebas relevantes, tipos, lint, build y navegador local con datos ficticios.
- **Estado:** implementado y verificado por pedido explícito. HomeHero omite
  acceso autenticado y conserva exactamente el contenedor anónimo; el enlace a
  ofertas se comparte sin duplicarlo. HomeAccessPanel desmonta formularios y sus
  listeners; navbar visible por rol. Sin cambios de reglas ni nueva arquitectura.
- **Verificación real:** 1362 unit/componentes en 110 archivos y 57 tooling PASS;
  tipos, lint completo, build y diff PASS. Se actualizó una expectativa antigua
  de tarjeta/ícono al comportamiento solicitado; el análisis de idioma agotó su
  tiempo durante concurrencia y pasó con maxWorkers=2, sin cambiar su límite.
  Tras preservar el contenedor anónimo: 81 focales, lint del hero y build final PASS.
  Nueve E2E finales sin retries/omisiones: siete de sesión/visitante y dos de
  diseño anónimo/teclado; 18 vistas de tres roles en 1920/1440/390, axe=0,
  sin desborde, una columna autenticada y acceso al panel por teclado. Capturas
  de inicio en escritorio/móvil y aside de ofertas revisadas. Supabase/servidor
  aislados; next-env ajeno mantiene SHA256 B8B3A344…491000. Sin migración,
  commit/PR/publicación o aprobación humana implícitos. T257 sin brechas nuevas;
  revisión humana y gates históricos pendientes conservados.

## EXTRA-106 — Accesos públicos coherentes con sesión iniciada

**Alcance reducido por EXTRA108: solo permanece /ofertas; Home/login descartados.**

- **Fecha/origen:** Mateo,29/10/2026: no mostrar login del inicio ni «Crear cuenta»
  de /ofertas cuando ya hay sesión. Rama fix/public-authenticated-access desde
  main e8ba52c; PR85 merge confirmado y rama anterior eliminada local/remota.
  next-env ajeno preservado (SHA256B8B3A344…491000).
- **Evidencia previa:** getSiteAccess/getAccountAccess ya leen rol activo verificado
  en servidor, sin caché global. HomeAccessPanel oculta credenciales solo en modo
  login, pero mantiene pestañas y formularios de registro vía query/evento aun
  autenticado. El cierre de Home también invita a registrarse. /ofertas ya adapta
  su header, pero el aside de registro/login es incondicional.
- **Cambio propuesto antes de código:** usar la misma sesión verificada por request
  para header y CTA; Home autenticado muestra aviso/panel sin login, pestañas o
  registro, incluso con query/eventos previos. Mantener composición y acceso al
  panel por rol. Cierre de Home y aside de ofertas muestran continuidad al panel,
  sin sugerir otra cuenta. Anónimo conserva login/registro y recuperación.
- **Origen/alcance:** A02/A03 y corrección explícita de presentación a EXTRA052/053.
  No cambia autorización, política de autorregistro, sesiones, roles o validación
  en servidor/DB; no intenta detectar por email cuentas existentes sin login.
  Sin dependencia, SQL, endpoint, componente base nuevo ni arquitectura nueva.
- **Archivos/contratos:** HomePage/HomeHero/HomeAccessPanel y /ofertas page; reutilizar
  navegación de cuenta y controles adaptados. Spec/plan/UI/tasks alineados. Mantener
  eventos y borradores de formularios anónimos, teclado, enlaces y listas públicas.
- **Riesgos/verificación:** cliente conservando modo registro al entrar/salir,
  caché entre usuarios, query ?registro y evento cliente; probar3 roles/anon,
  suspendido/sesión ausente, refresh/navegación/login/logout, sin formularios o
  CTAs anónimos autenticado y sin perder login al cerrar sesión. RED/GREEN de
  componentes y navegador ficticio; tipos/lint/unit/tooling/build requeridos.
- **Estado:** solicitud autoriza y coordina este arreglo; implementado tras
  revisión de artefactos. Gates históricos se conservan; sin ampliación de
  reglas/arquitectura que requiera repetir gates. No aplicar migración ni publicar
  commit/PR implícitamente en este pedido.
- **Archivos reales/evidencia:** HomeAccessPanel separa subárbol anónimo del aviso
  autenticado; HomePage normaliza vista/key y cierre, HomeHero conserva guía
  general autenticado, /ofertas usa getSiteAccess una vez para header y aside.
  Tests ajustan3 expectativas de registro autenticado previas al nuevo pedido;
  nuevo test de transición/listener/borradores e inactivos. RED8/44, GREEN66
  focales, suite1362 unit/componentes/110 archivos y57 tooling PASS. Tipos/lint/
  build PASS. Tipos detectó opción exact de Playwright en query RTL; corregida con
  regex anclada y14 focales/tipos PASS, sin relajar aserciones.
- **Navegador:**7/7 recorridos, sin retries/omisiones:3 roles con renovación pública
  y privada, queries/evento, navegación Next, recarga, segunda pestaña y cierre;
  visitante abre registro desde oferta y vuelve al login. Cookies privadas
  no-store y destinos por rol conservados. Sin reset local/hosted o cambios de BD.
  Docker estaba detenido; se inició oculto y solo se reanudó fixture propio.
- **Cierre visual:**12 vistas autenticadas (3 roles×2 anchos1440/390×Home/ofertas),
  axe0, overflow0 y navegación al panel con teclado PASS; capturas revisadas.
  El script auxiliar corrigió baseURL faltante y esperó título/panel visibles
  antes de medir el streaming inicial; no hubo cambio de producto o de tiempos.
  Guía docs/operations/public-authenticated-access.md y contratos actualizados.
  Convergencia del incremento sin brechas nuevas, sin acreditar revisión humana.
- **Cierre del entorno:** servidor3001 detenido y Supabase funes-admin-cv-check
  detenido con backup; ningún reset de servicios habituales o escritura alojada.
  Se repitió el diagnóstico Next «destination stream closed early» durante
  navegación/cierre, también observado antes de106; recorridos y respuestas
  comprobados PASS, sin cambiar código de streaming fuera de alcance. next-env
  conserva el hash inicial. Commit/PR y publicación pendientes de pedido.


## EXTRA-105 — Restituir selector de contacto municipal

- **Fecha/origen:** Mateo,29/10/2026: el control anterior estaba bien; pidió
  únicamente que apareciera día/mes/año. Rechaza la entrada de texto de EXTRA104.
- **Evidencia/limitación:** datetime-local conserva calendario y edición nativos;
  la documentación MDN indica que el formato mostrado depende de la región del
  sistema/navegador, sin API para imponer locale. lang no constituye garantía.
- **Cambio previo autorizado:** retirar solamente la sustitución104, restaurar
  datetime-local/estado ISO y edición/calendario anteriores, declarar idioma es-AR
  sin afirmar que fuerza el orden en Chromium. Retirar helper y pruebas creados
  solo para texto; adaptar pruebas del contacto al contrato nativo, manteniendo
  cobertura de envío/foco/retención. Mantener el resto de102/103 y next-env ajeno.
- **Archivos/contratos:** contact-record-form, tests/components/admin/contact-date,
  fills E2E de contacto y eliminación del helper funes-input/test propio de104.
  Docs/UI/spec/plan/task registran corrección; servidor/BD/permisos inalterados.
- **Decisión expresa de Mateo:** «Conservar el selector original». Mantener el
  calendario nativo, sin selector de aplicación ni entrada libre. El orden visible
  depende de la región del navegador; no cambiar la configuración personal sin
  pedido. No usar overlays/CSS frágil ni afirmar que lang garantiza día/mes/año.
- **Riesgos/verificación:** preservar valores, validación compartida, foco, calendario,
  hora Funes y payload ISO. Tipos/lint/unit/tooling/build y contacto ficticio en
  navegador; sin otra migración ni edición de la configuración personal del usuario.
- **Estado:** corrección solicitada, restaurada y verificada. No amplía
  permisos, lógica de negocio o arquitectura ni publica código/PR.
- **Resultado:** control nativo restituido; solo lang es-AR difiere de la versión
  anterior a104. Helper/pruebas de parsing libre retirados, fills ISO restaurados.
  1358 unit/componentes/110 archivos,57 tooling, tipos/lint/build/diff PASS. Navegador
  en-US confirma datetime-local, foco en requerido, resumen retenido, guardado y
  hora Funes correctos y sin overflow390; captura revisada muestra20/09/2026 12:00
  con icono nativo y día seleccionado. lang es-AR funciona en el Chromium probado;
  no se generaliza como garantía para todo navegador/sistema. La opción expresa
  fue conservar exactamente selector original. Convergencia
  sin brechas respecto de esa corrección; no migración/cambio alojado. next-env
  ajeno conserva SHA256B8B3A344…491000.
- **Seguimiento de publicación,29/10:** después de informar que su navegador aún
  mostraba mes/día/año, Mateo indica «ya esta» y solicita crear el PR. Se conserva
  selector nativo y limitación regional documentada; no implica una garantía de
  formato universal ni aceptación municipal. Base remota main adad96c actualizada
  y sin cambios; publicar únicamente archivos propios, excluyendo next-env ajeno.
  Verificaciones finales ya PASS; CI/revisión del PR pendientes de publicación.
- **Publicación:** commit sin firma2d4da71 y
  [PR85](https://github.com/maximo-Pdev/funes-empleo/pull/85),29/10/2026,
  feat/dates-and-application-retry→main adad96c. Incluye102/103 y corrección final105;
  control nativo, prueba de contacto, fechas y reintentos. next-env ajeno excluido.
  CI y revisión humana en seguimiento; no se acredita aceptación ni merge.


## EXTRA-104 — Entrada municipal de fecha en día/mes/año

- **Fecha/origen:** Mateo,29/10/2026, muestra «Registrar contacto municipal» con
  datetime-local nativo mm/dd/yyyy y pide el mismo formato día/mes/año allí.
- **Evidencia/alcance:** EXTRA102 uniformó presentación conservando selectores;
  ahora se autoriza explícitamente esta entrada. lang no garantiza el formato del
  control nativo del navegador. ContactRecordForm usa estado local ISO y servidor
  convierte occurredAtLocal a UTC mediante funesLocalToIso.
- **Cambio mínimo previo a implementar:** reutilizar TextField/Form y entrada
  visible DD/MM/AAAA HH:mm (24h), ejemplo e instrucción clara; adaptador puro
  valida y convierte al mismo YYYY-MM-DDTHH:mm antes del submit. Validación nativa
  customValidity integrada con error/borde/foco/retención compartidos; no aceptar
  meses/días inexistentes, formato ambiguo o horas inválidas. Reutilizar conversor
  Funes existente para validar calendario; no duplicar reglas de zona/servidor.
- **Archivos/contratos:** contact-record-form, helper de entrada local, pruebas
  unit/componentes y cuatro fills E2E en intermediation/hiring-consent. Artefactos
  y guía/UI afectados; payload/servidor/autorización/BD iguales. Consultadas docs y
  fuente oficial Input Base Nova; sin sobreescribir controles compartidos.
- **Riesgos/verificación:** confusión día/mes, bisiestos, horas, envío sin cambio,
  error remoto y conservación de resumen/fecha. RED/GREEN de entrada/payload/errores,
  navegador en-US, foco/teclado/axe móvil, contacto real ficticio y privacidad de
  empresa. Tipos/lint/pruebas/build requeridos; no otra migración o cambio alojado.
- **Estado:** solicitado/autorizado y coordinado; implementado con TextField/Form
  actuales y helper puro. Mismo gate histórico de dos casillas pendiente sin aprobar; sin
  cambio nuevo de arquitectura o regla de negocio que requiera repetir sus gates.
- **Evidencia:** RED3 de componente contra datetime-local; GREEN20 focales y
  suite1375 unit/componentes/111 archivos,57 tooling, tipos aislados/lint/build/diff
  PASS. Tres E2E intermediation de contacto/nominación/tardío PASS, con formato,
  error inline rojo/foco, retención de resumen, guardado y hora histórica correcta,
  privacidad empresarial, axe0 y sin overflow390px; captura visual revisada.
  Dos E2E de contratación fallaron inicialmente en preparación del bloqueo porque
  la copia auxiliar seguía apuntando al nombre del contenedor habitual. Se corrigió
  solo la copia ignorada al contenedor aislado, sin cambiar prueba original,
  producto, aserciones o tiempos. Nueva ejecución focal2/2 PASS sin retries o
  omisiones; cinco recorridos distintos verificados. Prueba visual adicional
  en-US confirma placeholder español, fecha inválida roja, foco, resumen retenido
  y cero overflow390; capturas del formulario1440/390 revisadas. Convergencia
  del alcance104 sin brechas nuevas. SQL/servidor/consentimiento/permisos intactos,
  sin otra migración. next-env ajeno conserva hashB8B3A344…491000.


## EXTRA-103 — Aplicar migración de reintentos al proyecto vinculado

- **Fecha/origen:** Mateo,2026-10-29: «hace la migracion», sobre EXTRA102 ya
  implementado/probado. Alcance exclusivo20261029180304_candidate_application_retry.
- **Evidencia/plan previo:** conector MCP rechaza acceso; CLI vinculada funcionó
  en EXTRA100. Verificar ref del proyecto/URL pública, historial, índice y cuerpos
  vigentes antes de ejecutar; rechazar divergencias o aplicación previa inesperada.
  Historial remoto heredado impide un push indiscriminado: aplicar solo SQL exacto
  con controles y registrar esa versión en la misma transacción, como EXTRA100.
- **Cambio/justificación:** sustituir único parcial y dos guardas conforme a102;
  conserva firmas/ACL, datos de negocio/auditoría/CV/permisos y otras funciones.
  Guardar evidencia técnica agregada, sin perfiles reales, tokens ni nuevas cuentas
  o postulaciones de prueba alojadas. No modificar migraciones anteriores.
- **Archivos/contratos:** migración102 sin cambios; scripts/evidencia ignorados en
  test-results, guía de operación, implementation-status y tareaT251. No nueva
  regla, dependencia, UI o cambio de alcance que requiera otro gate de arquitectura.
- **Riesgos/verificación:** lock breve del índice (lock_timeout5s, statement_timeout
  60s), concurrencia/deriva del esquema. Validar hashes/ACL/índice/check de historial
  antes de commit y lectura independiente después; controles completos de102 ya
  PASS. Auditoría/contadores y funciones ajenas intactos bajo el lock, advisors
  antes/después y smoke público solo lectura. Fallo revierte todo; recuperación
  forward-only documentada, nunca borrar/archivar casos para restituir índice viejo.
- **Estado:** aplicada y registrada20261029180304 el29/10/2026 por CLI vinculada,
  en una transacción con pre/postcondiciones y SQL exacto. SHA256
  589633fb6df1d52d75660beabab1a5e58c44018dfb7c31853f1cf3ab90876dc5.
  No publica interfaz ni constituye commit, PR o revisión humana.
- **Resultado:** preflight confirma funciones anteriores idénticas a102, índice
  antiguo vigente y versión todavía ausente; sin pares bloqueantes duplicados.
  Commit comprueba índice único válido con excepción withdrawn, dos cuerpos nuevos,
  firmas/ACL/configuración y otras111 funciones intactas; mismos contadores de
  negocio/CV/consentimientos/permisos/auditoría/avisos antes/después. Historial previo
  intacto y nueva versión con hash exacto. Postcheck independiente PASS; búsqueda
  y filtros públicos devuelven objetos válidos. Advisors seguridad66→66 avisos,
  cero nuevos y cero ERROR. Sin cuentas, CV ni postulaciones de prueba alojadas.
- **Evidencia local ignorada:** extra103-preflight/before/apply/postcheck/manifest,
  advisors-before/after y verification.json en test-results. Fallo de parsing
  inicial de advisors (CLI ahora devuelve array) corregido en script auxiliar;
  no requirió cambio o repetición de migración. next-env ajeno preservado.


## EXTRA-102 — Fechas uniformes y nueva postulación tras retiro

- **Fecha/origen:** Mateo,2026-10-29: fechas día/mes/año; volver a postularse
  después de cancelar la propia postulación; estado retirado/cancelado rojo.
- **Evidencia previa:** offers-content bloquea toda oferta con historial; índice
  participation_once y create_participation_with_cv/reserve_application_cv
  impiden cualquier segundo caso no archivado, incluido uno retirado. Fechas de
  cierre públicas ya son DD/MM/YYYY; otras vistas usan ISO, fechas sin ceros o
  año corto. status-tone asigna neutral a withdrawn/cancelled.
- **Cambio necesario, registrado antes de implementar:** nuevo caso propio tras
  retiros anteriores; índice único excluye withdrawn y las dos guardas SQL se
  alinean para self_application. Nominación y matching municipales conservan su
  exclusión previa. UI distingue historial retirado de caso que bloquea enviar.
  Centralizar presentación DD/MM/YYYY y hora local existente; no transformar
  fechas calendario en instantes. PDF/Excel visibles usan el mismo formato;
  transporte, CSV técnico y selectores nativos conservan ISO. Rojo en catálogo
  de participaciones, sin cambiar estados o colores de otros dominios.
- **Justificación/contratos:** imprescindible modificar restricción persistente,
  reserva de CV y creación atómica para no depender de ocultar botones. Nuevo
  intento conserva UUID propio y CV fijo; no reabre el retirado ni su permiso.
  Modelo/spec/plan/contrato de estados y guías se actualizan por etapas.
- **Archivos previstos:** migración nueva, supabase/tests, offers-content,
  src/lib/time, vistas por rol/report-data, status-tone y pruebas UI/unit/E2E.
  Sin nueva dependencia, RPC público, columna, permiso o eliminación de datos.
- **Riesgos/verificación:** duplicados concurrentes, CV específico tras retiro,
  auditoría/avisos y rollback; todos los otros resultados finales bloquean;
  actor ajeno, aptitud/vigencia y permisos revocados intactos. Probar calendario,
  medianoche Funes/UTC, padding/año4 y errores de fecha. Tipos/lint/unit/tooling/
  SQL/E2E/build en fixture aislado, preservando next-env y servicios habituales.
- **Recuperación:** forward-only; conservar intentos retirados y nuevos. Para
  suspender reintentos restaurar guardas previas, sin reconstruir índice antiguo
  sobre pares repetidos ni archivar/borrar historia para hacerlo caber.
- **Estado:** alcance solicitado y coordinación autorizados por Mateo; incremento
  implementado en feat/dates-and-application-retry desde main adad96c (PR83
  mergeado). Mateo permite continuar con2 casillas históricas de ofertas pendientes
  sin marcarlas aprobadas. No implica aplicación alojada, PR o revisión.
- **Prerrequisito de verificación descubierto antes de editar configuración:**
  z-application-retry crea ofertas publicadas. playwright.config.ts excluye
  z-application-cv/notificaciones del grupo chromium con conteos iniciales, pero
  todavía no reconoce este archivo nuevo. Incluir retry en ese mismo grupo
  posterior application-cv es necesario para no contaminar los conteos, sin
  relajar aserciones, reintentos ni dependencias. La ejecución auxiliar mezclada
  produjo83 frente a80 tras avisos; repetir conteo con fixture limpio y probar
  colección oficial de retry. Archivos: playwright.config.ts, plan/tasks y tests.
- **Archivos reales:** migración20261029180304 (índice y dos guardas), pruebaSQL075,
  offers-content con key por intento y estado público; helper time/presentation y
  wrapper público reutilizados en18 vistas/contexto de informes; catálogo de tonos.
  Pruebas de calendario/instantes/estados/UI/Excel/notificaciones y dos E2E nuevos;
  expectativa histórica24/09 corregida por padding. Documentación/contratos alineados.
- **Verificación hasta el momento:** RED de tono neutral y módulo de fecha ausente;
  GREEN1355 unit/componentes/109 archivos,57 tooling, tipos aislados/lint/build PASS.
  Suite completa1454 SQL/28 archivos y luego archivo ampliado40 focales PASS;
  incluye reserva/alta/retiros repetidos/CV/rollback/avisos/roles, revocación antigua,
  otros finales, matching/nominación sin cambios, vencimiento y versión. Al ampliar
  pruebas, la mutación de disponibilidad/estado incrementó versión del fixture:
  se corrigió preparación usando versión actual, sin cambiar controles de producto.
  LintSQL public/private y advisors locales ERROR0. Cuatro E2E CV/reintentos PASS,
  incluidos concurrencia y axe390/1440 sin overflow. Regresiones finales:17/18
  iniciales; el conteo80 falló por83 ofertas tras notificaciones en runner auxiliar.
  Conteo estricto repetido con fixture limpio PASS, después grupo oficial tardío
  completo7/7 PASS sin retries/omisiones.22 E2E distintos verificados en total;
  se conserva expectativa80. Clasificación oficial de retry comprobada por --list,
  lint focal y tipos con nuevas pruebas PASS. Convergencia R1–R3: sin brechas nuevas;
  gates históricos/aceptación humana permanecen pendientes. next-env ajeno conserva
  SHA256B8B3A344…491000; sin aplicación alojada, commit o PR en este pedido.
- **Cierre local:** servidor3001 detenido y Supabase funes-admin-cv-check detenido
  con backup; no reset del proyecto habitual. Durante navegación/cierre Next emitió
  diagnósticos «The destination stream closed early» sin fallo de los recorridos
  y respuestas comprobados; no se cambió código de streaming fuera de alcance.



## EXTRA-101 — Alinear pruebas de privacidad con agenda autorizada

- **Fecha/origen:** Mateo,2026-10-28, informa fallo de GitHub en PR83.
  CI40799278979/c1eb7e4: database/Vercel PASS; application pasa tipos/lint/tooling/
  1346 unit/build/SQL y128 E2E, falla dos aserciones de privacidad anteriores a
  EXTRA099. candidate-self-service prohíbe «preentrevista» en todo body, incluida
  la descripción; intermediation prohíbe la agenda real del caso nominado.
- **Requisito de origen:** N3 y respuesta expresa de Mateo: titular puede ver
  fecha/canal de preentrevista; resumen, recomendación y evaluaciones privados.
  Las pruebas contradicen la excepción acotada aprobada, no evidencian una fuga
  de notas. Seis recorridos dependientes quedaron sin ejecutar en ese runner.
- **Cambio mínimo propuesto antes de editar:** actualizar solo ambos E2E:
  postulaciones propias sin registro no muestran agenda; caso municipal con
  preentrevista muestra canal/fecha y conserva estado público Recibida, sin
  preselección/etapas internas/resumen/recomendaciones. Mantener retiros, pruebas
  de otras participaciones y revocación. No ocultar agenda aprobada, omitir pruebas,
  debilitar privacidad ni cambiar producto, SQL, CI o tiempos de espera.
- **Archivos/contratos/riesgos:** tests/e2e/candidate-self-service.spec.ts,
  tests/e2e/intermediation.spec.ts y evidencia/tasks. Contrato N3 vigente intacto.
  Riesgo: reemplazar prohibición demasiado amplia por una prueba permisiva;
  exigir positivos de agenda y negativos concretos del resumen privado.
- **Verificación prevista:** RED de ambos recorridos, GREEN con cambio acotado,
  tipos/lint y flujo de avisos relevante; publicar commit sin firma en el PR83 y
  comprobar nueva CI. Base alojada intacta; datos exclusivamente ficticios en
  entorno local aislado. next-env.d.ts ajeno conservado. Implementación pendiente.
- **Corrección verificada:** RED2/2 reproduce exactamente ambos errores de CI;
  GREEN5/5 completa registro/dos postulaciones/retiro/suspensión/archivo, nominación/
  preentrevista/preselección/derivación/retiros y los tres recorridos de avisos.
  Fecha/canal permitidos y resumen/recomendación/estados internos ocultos; no se
  omitieron aserciones de otras participaciones ni revocación. Tipos/lint/diff PASS.
  Solo dos archivos E2E y documentación; build de producto/migración/permisos sin
  cambios. Corrección publicada en el mismo PR83, sin firma; nueva CI en seguimiento.

## EXTRA-100 — Aplicación alojada de notificaciones

- **Fecha/origen:** Mateo,2026-10-28: «aplica la migracion», después de la
  verificación de EXTRA099. Autoriza aplicar20261028235316_portal_notifications
  al proyecto Supabase vinculado kyjycjojzhwggjuqjnki; sin publicar interfaz/PR.
- **Evidencia previa:** rama feat/portal-notifications y cambios existentes
  preservados. CLI confirma CV20261028210445 aplicado; tabla de avisos e historial
  de la nueva versión ausentes. Definiciones actuales y conteos sin datos personales
  guardados en test-results ignorado. Plugin sin permiso, CLI vinculada disponible.
- **Cambio propuesto antes de ejecutar:** aplicar exclusivamente el SQL revisado
  en una transacción con timeouts, guardas de ausencia/compatibilidad, verificación
  de seis cuerpos/search_path/ACL, RLS/política/índices/FK/trigger y registro exacto
  de versión/nombre/SQL en historial. Conservar funciones previas y conteos de negocio;
  sin backfill, reparaciones masivas, resets, cargas reales ni pruebas mutantes alojadas.
- **Archivos/contratos/riesgos:** migración de EXTRA099, guía operativa, estado/tasks
  y este log. Riesgos de destino equivocado, aplicación parcial o permisos incorrectos:
  verificar proyecto explícito, rollback ante discrepancias y postcheck independiente
  de estructura/historial/ACL/smoke público. Recuperación forward-only documentada;
  no eliminar auditoría ni avisos. Revisión de advisors antes/después.
- **Estado:** aplicación y comprobación pendientes; autorización expresa, no
  aceptación legal ni revisión humana del incremento. No commit/PR/deploy implícitos.
- **Ejecución completada:**20261028235316/portal_notifications aplicado por CLI
  vinculada en transacción con verificación antes de COMMIT; historial conserva
  SQL exacto normalizado y MD5ff727318748fe1fb425526d68be049f4,
  SHA256da661e9392f4edfe1389d380ca20260b43f85148f49eaa63e623a5938027daff.
  Postcheck independiente confirma seis cuerpos/search_path/ACL, RLS/política,
  cinco índices, trigger habilitado y FKs RESTRICT. Funciones previas intactas,
  recuentos de cuentas/perfiles/ofertas/casos/derivaciones/consentimientos/CV/
  auditoría conservados, cero avisos por backfill y smoke público JSON correcto.
  No se escribieron postulaciones u otros casos de prueba en el proyecto compartido.
- **Advisors:** tres WARN nuevos0029 por los RPC autenticados list_my_notifications,
  open_my_notification y my_candidate_preinterview_agenda. Exposición autenticada
  intencional del contrato: sesión viva/cuenta activa/propiedad revalidadas en DB;
  anon/service_role sin EXECUTE, helpers privados y tabla sin grants directos.
  No aparecieron otras advertencias nuevas. [Detalle del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
  Recibos/definiciones previas guardados solo en test-results ignorado. Migración
  alojada verificada; publicar interfaz por PR y revisión/CI continúan pendientes.
- **Publicación solicitada posteriormente:** implementación8de1c5b, sin firma,
  signoff ni coautoría; rama feat/portal-notifications publicada y
  [PR83](https://github.com/maximo-Pdev/funes-empleo/pull/83) abierto hacia main,
  listo para revisión y adjunto a esta conversación. next-env.d.ts ajeno y recibos
  ignorados excluidos. Migración ya aplicada; CI/revisión/merge aún pendientes.

## EXTRA-099 — Notificaciones del portal por perfil

- **Fecha/origen:** Mateo,2026-10-28, solicita avisos navegables para candidatos,
  empresas y administradores con la matriz de eventos incorporada en spec.md.
  PR82 mergeado7064e3c; application/database/Vercel PASS en a454c4e, run40780133223.
  Rama anterior retirada local/remota; feat/portal-notifications parte de main
  actualizado. next-env.d.ts ajeno preservado con su huella anterior.
- **Evidencia:** no hay notificaciones persistidas. Los comandos registran auditoría
  transaccional para altas, moderación, participaciones, preentrevistas, derivaciones,
  entrevistas y feedback. Los cuatro administradores tienen cuentas independientes.
  FR-053 y la matriz actual ocultan etapas/datos internos al candidato. El pedido
  nuevo autoriza avisos de nominación/preentrevista/derivación, sin notas ni razones
  internas. La pregunta inicial consideraba retirado el formulario empresarial;
  revisión del código actual encuentra InterviewForm en company-referral-panel.tsx.
  Se conserva sin cambios y se registra esta diferencia con el contexto previo.
  Mateo confirma omitir ese aviso y permitir únicamente fecha
  y canal de preentrevista al candidato; resumen y recomendación siguen privados.
- **Propuesta técnica derivada previa al código:** persistir avisos por destinatario
  dentro de la transacción de negocio, con vínculo al evento fuente e idempotencia;
  lectura individual por cuenta y RLS/sesión vigente. Enlaces construidos en servidor
  a destinos autorizados/referencias opacas; nunca rutas arbitrarias recibidas del
  cliente ni snapshots de DNI/CUIT/contactos/CV/notas. Integrar campana/contador y
  lista accesible usando el chrome y componentes adaptados existentes. Avisos en
  el portal, sin correo, push externo ni nuevo proveedor. No generar avisos históricos.
- **Archivos/contratos previstos:** nueva migración/tabla/RPC/tipos y pruebas SQL,
  servicios/acciones/catálogo UI de notificaciones, chrome compartido y vistas de
  destino por rol; spec/plan/modelo/contratos/tasks/UI/guía. No cambiar entrevistas
  empresariales. Agenda municipal mínima autorizada en la participación propia.
- **Riesgos/verificación prevista:** fuga entre destinatarios, estados leídos globales,
  duplicados, avisos huérfanos si falla auditoría, información revocada/archivada,
  navegación que eluda permisos, filtración de preselección/notas o resultados aún
  no confirmados. SQL de roles/propiedad/suspensión/atomicidad/idempotencia y eventos;
  UI de contador/lista/error/vacío/lectura/enlace/móvil/teclado/axe; tipos/lint/unit/
  build y E2E con actores ficticios. Recuperación aditiva sin borrar auditoría.
- **Autorización/estado:** alcance de avisos solicitado y coordinación según AGENTS.
  Especificación y clarificaciones resueltas. Diseño: AFTER INSERT de auditoría
  con lista cerrada; avisos sin snapshots personales, UNIQUE por fuente/tipo/cuenta;
  RPCs de lista/apertura con sesión viva y recurso vigente, RLS solo destinatario;
  referencia aviso-aleatoria, lectura por POST y destino construido en servidor.
  Campana privada con refresco mientras la pestaña es visible, lista paginada;
  participación propia anclada y agenda mínima. Sin backfill ni migración alojada
  automática. Gates de diseño y verificación se registran antes de implementar.
  Mateo autoriza continuar pese a2 casillas históricas pendientes del checklist de
  ofertas; quedan intactas. Necesidad de pruebas derivada N5/N6: los E2E de avisos
  crean ofertas ficticias, por eso se ejecutan en la fase posterior a los conteos
  base, junto al recorrido CV específico y antes del reset de concurrencia. Ajustar
  solo la selección de proyectos Playwright, sin omitir pruebas ni cambiar CI gates.
  Evidencia de navegador: globals.css aplica fondo oscuro a todo submit y deja
  fechas grises con contraste1.73 en avisos. Antes de corregir: CSS de módulo
  acotado a sus filas, tokens municipales de superficie/texto y foco existente;
  sin alterar estilos globales. Verificar axe, móvil y teclado nuevamente.
- **Implementado/verificado:** migración20261028235316 y SQL074, tipos cotejados
  con generación local, src/features/notifications, dos Route Handlers, dos páginas
  de avisos, chrome/nav por rol y agenda/ancla propias; artefactos/guía operativa/UI.
  Sin nuevas dependencias/configuración.1346 unit/componentes,57 tooling PASS;
  SQL completo1416 y focal ampliado57 PASS; tipos/lint/build/diff y DB lint
  public/private PASS.26 E2E sin omisiones/reintentos, registro real ficticio,
  permisos HTTP, flujos por rol/agenda/resultado/lectura, axe390/1440/foco PASS.
  Revisión React: datos servidor mínimos, islas cliente acotadas, cleanup/abort de
  polling, sin caché privada global; catálogos de canales/etiquetas reutilizados.
  Contraste de fechas corregido solo en CSS del componente, sin estilos globales.
  Convergencia N1–N6 sin brechas de implementación nuevas; recuperación documentada.
  Pendientes posteriores: aplicación alojada, publicación/PR/CI y revisión humana.
  No solicitados en este turno; sin aceptación legal implícita o cambio en gates
  históricos. Entorno aislado detenido con backup, entorno habitual y next-env ajeno
  preservados. Sin commits ni PR todavía.

## EXTRA-098 — Corregir inventario HTTP del PR82

- **Fecha/origen:** Mateo,2026-10-28, informa fallo de GitHub en PR82. CI40777824782
  sobre1d510dd: application pasa tipos/lint/tooling/unit/build/SQL, falla el gate
  action-http porque applyToOfferAction ya no está en el manifiesto compilado.
  EXTRA096 reemplazó ese envío por POST /api/candidate/applications; el export
  legado permanece probado directamente, pero Next elimina su endpoint sin uso.
- **Cambio propuesto antes de editar:** añadir únicamente ese nombre a la exclusión
  explícita del inventario (seguir exigiendo cero endpoints compilados), documentar
  el reemplazo y probar el POST real para anónimo/candidato/empresa/admin, activos
  y suspendidos, sin escrituras ni PII. No permitir omisiones automáticas de otras
  acciones ni cambiar autorización, código de producto o migraciones.
- **Segundo fallo independiente:** database no ejecutó pruebas: Docker no pudo
  publicar54322 porque estaba ocupado en el runner. Volver a observar con el push
  correctivo; no modificar configuración por un fallo aislado sin evidencia nueva.
- **Archivos/contratos:** tests/e2e/action-http.spec.ts, tasks/estado/log del delta;
  contrato HTTP y reglas de servidor/DB actuales intactos. Origen C4/C5/C6,T238.
- **Riesgos/verificación:** no debilitar el inventario ni esconder fallos reales;
  RED del manifiesto actual, GREEN de siete fronteras HTTP más inventario y POST,
  conteos de CV/casos/auditoría intactos, tipos/lint/pruebas relevantes. Publicar
  commit sin firma en el mismo PR y confirmar ambos checks; preservar next-env.d.ts.
- **Autorización/estado:** corrección solicitada y derivada necesaria bajo AGENTS.
  Implementación/verificación pendientes. No reaplicar migración alojada ni desplegar
  manualmente; CI/revisión humana no se declaran aprobadas sin evidencia.
- **Corrección local verificada:** RED1/1 reproduce applyToOfferAction ausente;
  GREEN8/8 HTTP reales, siete combinaciones rol/suspensión, validación de candidato
  ajeno y conteos CV/casos/auditoría intactos. Cache-Control verifica private y
  no-store aun con las directivas adicionales del proxy; JSON sin PII.264 pruebas
  directas de guardas/endpoint, tipos/lint/diff PASS. Build/producto/migración sin
  cambios: se usa el build que falla el gate anterior. Pendiente observar nueva CI.
- **CI/merge confirmados posteriormente:** a454c4e, run40780133223, application y
  database SUCCESS; Vercel SUCCESS. El conflicto54322 no se repitió, sin cambiar CI.
  PR82 mergeado7064e3c antes de comenzar EXTRA099. Corrección completada; no equivale
  a aceptación final del MVP o cierre de OQ/gates históricos.

## EXTRA-097 — Aplicar y publicar CV por postulación

- **Fecha/origen:** Mateo,2026-10-28, solicita migración y después PR de EXTRA096.
- **Evidencia:** rama feat/application-specific-cv-and-images; next-env.d.ts ajeno
  preservado. MCP rechaza acceso; CLI vinculado kyjycjojzhwggjuqjnki funciona.
  Las siete funciones vigentes coinciden exactamente con el baseline probado;
  índice cv_current previo, RLS cinco tablas y42 migraciones confirmados. La nueva
  versión no está aplicada. Advisor60 WARN existentes,0 ERROR.
- **Cambio técnico propuesto antes de ejecución:** aplicar exclusivamente el SQL
  revisado20261028210445 con guards de cuerpos/índice/columnas/historial y registro
  de versión/nombre/SQL exacto en una transacción. Evitar db push global por la
  discrepancia histórica de versiones ya documentada; no repair/reset ni migraciones
  ajenas. Guardar definiciones previas en recibo local ignorado para recuperación.
- **Archivos/contratos:** migración existente sin cambios de producto; recibos y
  envoltorio en test-results ignorado, log/guía/estado y PR. Mantener firmas/grants
  anteriores, nuevas firmas/ACL previstas y bucket PDF privado.
- **Riesgos/verificación:** rechazar si cambia baseline o se aplica otra vez;
  lock_timeout/statement_timeout acotados y rollback ante cualquier guard fallido.
  Verificar cuerpos de13 funciones, FK/índices/triggers, RLS/ACL, historial exacto,
  recuentos sin cambios y advisor antes/después. No escribir casos de negocio alojados.
- **Autorización/estado:** pedido explícito autoriza aplicar y commit/PR sin firma,
  signoff o coautoría, excluyendo next-env.d.ts y recibos privados. Evidencia local
  EXTRA096 vigente:1292 unit,57 tooling,1363 SQL únicas,32 E2E, tipos/lint/build.
  Aplicación/publicación pendientes; no inferir revisión, CI, merge o despliegue UI.
- **Aplicada/verificada2026-10-28:** exclusivamente20261028210445 registrada en
  kyjycjojzhwggjuqjnki. SQL normalizado MD5 874964da8450b6c5257c7d4c0726432e,
  SHA256 5d49c4c2a4efb4590575974c2ec53d149cbb97be6d0fdbeecefb9a58c59a77c1.
  Los13 cuerpos/search_path/SECURITY DEFINER, ACL previas y nuevas, índices/FK/
  triggers/RLS e historial exacto confirmados en una transacción; recuentos de
  documentos, casos, derivaciones, consentimientos y auditoría intactos. Lecturas
  públicas de ofertas/filtros devuelven object tras aplicar. Sin repair/backfill,
  otras migraciones o pruebas que escriban datos alojados.
- **Advisors:**60→63 WARN,0 ERROR. Los tres nuevos avisos0029 corresponden solo a
  los RPC autenticados previstos (reserve_application_cv/apply_to_opening_with_cv/
  my_candidate_participations_with_cv); guardan sesión/rol/titularidad y anon no
  tiene EXECUTE. Los tres helpers nuevos privados carecen de EXECUTE para clientes.
  Es exposición autenticada intencional según el contrato y pruebas, no permisos
  anónimos nuevos. [Detalle del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
  Recibos y definiciones previas guardados localmente en test-results ignorado.
  Pendiente publicar commit/PR y CI/revisión humana; no afirmar merge o deploy UI.
- **Publicación solicitada:** implementación8c0ef6f sin firma/signoff/coautoría y
  [PR82](https://github.com/maximo-Pdev/funes-empleo/pull/82) abierto hacia main,
  sin borrador, adjunto a la conversación. Migración alojada verificada antes del
  PR. next-env.d.ts ajeno y recibos privados excluidos. Checks/revisión/merge aún
  pendientes; el despliegue UI depende del flujo habitual del proyecto.

## EXTRA-096 — CV específico de postulación y entrada PDF/JPG/PNG

- **Fecha/origen:** Mateo2026-10-28 solicita CV por oferta y formatos de imagen;
  confirma opción CV general o específico, sin reemplazar general, máximo5 MiB.
  Corrige después: WebP no. Quedan PDF/JPG/JPEG/PNG; no video/GIF/SVG/WebP.
- **Evidencia previa:** un solo cv_documents valid por candidato; apply_to_opening
  no recibe documento y la derivación toma el CV general vigente en ese momento.
  Endpoint/parser/bucket actuales solo PDF. Hay consumidores de status valid en
  activación/matching/perfil que deben distinguir alcance para evitar mezclar CV.
- **Cambio técnico necesario antes de código:** aceptar entradas controladas y
  normalizar imágenes estáticas a PDF con sharp/PDFKit ya instalados; validar firma,
  MIME/extensión, integridad,5 MiB de entrada/salida y16MP para decodificación
  acotada. Sin metadatos EXIF, animación o contenido activo. Conservar PDF protegido,
  bucket/rutas/visor/privilegios y versiones anteriores. Trazar fuentes del runtime.
- **Modelo propuesto:** cv_documents.opening_id opcional, NULL solo general;
  participations.application_cv_document_id opcional, FK de documento/titular y
  coherencia de oferta en comandos/constraint. Índice único valid general; CV
  específicos históricos permanecen separados por caso. Aplicación fija CV elegido en alta, incluso al
  usar general; cambiar general después no lo cambia. Casos previos y nominaciones
  sin selección conservan comportamiento legado, sin backfill/borrado.
- **Atomicidad:** reserva PDF pendiente ligada al candidato/oferta, upload privado,
  RPC aplica/valida documento y crea participación/auditoría en una transacción.
  Helper privado común preserva create_participation/apply_to_opening antiguos;
  nuevo RPC específico evita sobrecargas ambiguas. Fallo deja reserva no compartible,
  no CV válido ni participación parcial. No locks durante transferencia binaria.
- **Frontera HTTP necesaria:** al pasar el envío binario a Route Handler, conservar
  protección de origen de Server Actions: comparar Origin con Host real sin confiar
  en forwarded headers, rechazar cross-site y acotar lectura multipart a5 MiB+64KiB
  antes de parsear. Reutilizar el patrón aprobado de la ruta de foto, sin tocarla.
- **Prueba preexistente:** la suite completa expuso una carrera en candidate-history:
  el error aparece antes de terminar useTransition y el reintento se busca mientras
  aún dice Cargando; clearAllMocks deja respuestas once si aborta el caso. Ajustar
  espera de botón habilitado y reset del mock entre casos, sin cambiar producto.
- **Orden E2E necesario:** Playwright agrupa por opciones de worker, no garantiza
  orden alfabético de archivos. Evidencia: z-application-cv corrió antes de
  intermediation y sus cuatro ofertas alteraron el conteo fijo80. Crear proyecto
  application-cv dependiente de chromium y anterior al reset de concurrencia;
  excluirlo del grupo general. No debilitar conteos ni omitir recorridos. Afecta
  playwright.config.ts y gate T238; verificar dependencias y recorrido completo.
- **Diagnóstico de verificación:** pgTAP026 crea un trigger temporal de fallo de
  auditoría; ejecutarlo simultáneamente al navegador produjo un deadlock en una
  suspensión ficticia. No es evidencia de defecto del flujo productivo. Repetir
  por fases: SQL completo, restauración del fixture ya verificado y luego E2E,
  sin pgTAP concurrente ni cambios de backend para encubrir el harness.
- **Archivos/contratos afectados:** nuevas migración/RPC/índices/FK y tipos, guards
  de CV general en activación/matching/preview/commit, servicios perfil/búsqueda,
  POST de postulación, normalizador/formularios globales, detalle municipal y
  participaciones propias, API CV existente, Spec Kit/guía/pruebas SQL/UI/E2E.
- **Riesgos:** selección ajena/cruce de oferta, doble alta, perfil actualizado en
  paralelo, reemplazo que afecte otros casos, imagen malformada/expansión/animación,
  resultado convertido excesivo y respuesta perdida. Revalidar estado/consentimiento/
  cuenta/frescura/CV general y versiones en DB; permisos revocados no reaparecen.
  No cambia consentimiento, contratación, criterios de matching, retención o stack.
- **Verificación prevista:** unit de PDF y conversión real/rechazos/5 MiB/dimensiones,
  rutas y formularios con retención; SQL roles/coherencia/legacy/snapshot/referral/
  auditoría/rollback/versión/concurrencia; navegador candidato→admin→empresa, CV
  general intacto/otras ofertas, imágenes/asistidos, móvil/teclado/axe; tipos/lint/
  tooling/build y trazado. Datos ficticios aislados. Sin hosted/reset compartido,
  commit/PR/deploy hasta solicitud posterior.
- **Estado/autorización:** alcance funcional confirmado y corrección WebP incorporada;
  detalles derivados necesarios autorizados por AGENTS y pedido. Gates de requisitos/
  diseño/calidad/análisis cumplidos antes de código: C1–C6 cubiertos,7/7 calidad,
  seis principios de constitución preservados, sin decisiones funcionales abiertas.
  Implementación y verificación completas. Rama feat/application-specific-cv-and-images
  desde main bef7ddf; PR81 mergeado, rama anterior retirada local/remota y
  next-env.d.ts ajeno preservado.
- **Implementado:** migración20261028210445, política/normalizador compartidos,
  POST protegido y servicio/formulario opcional, lectores generales con scope NULL,
  CV elegido propio/municipal, tipos generados solo del delta conservando anotaciones
  previas. Guía docs/operations/application-cv.md y artefactos sincronizados.
- **Verificado hasta ahora:**1292 unit/componentes/104 archivos,57 tooling, tipos,
  lint y build de producción PASS; fuente TTF trazada en ambas rutas. Suite SQL26
  archivos1361 PASS y ampliación02648/48 PASS (1363 comprobaciones únicas). Lint DB
  public/private sin errores. Recorrido nuevo y concurrencia real PASS; último
  lote E2E32/32 en3,8min sin omisiones/reintentos PASS, SQL y navegador por fases.
  Móvil390/1440px, teclado y axe0; referencias y visor PDF inline verificados.
  Colección del proyecto real132 casos y dependencias confirmadas. Convergencia
  C1–C6 y decisiones del plan sin brechas nuevas; no anexar tareas vacías.
  Sin migración alojada, commit/PR/CI o revisión
  humana de implementación; no declarar aprobados gates históricos del MVP.

## EXTRA-095 — Aplicación alojada puntual y publicación de EXTRA094

- **Fecha/origen:** Mateo2026-10-28 solicita aplicar migración y luego PR.
- **Evidencia previa:** conector MCP rechaza lectura por permisos; CLI vinculado
  kyjycjojzhwggjuqjnki sí permite inspección. Dry-run --skip-vault falla por
  versiones antiguas con identidad remota distinta; no ejecutar repair/revert ni
  incluir migraciones adicionales. Cuerpo actual transition_participation coincide
  exactamente con baseline probado (MD5 normalizado36d09bf9a34820d36f3939a2d8d02462),
  SECURITY DEFINER/search_path vacío, ACL postgres/authenticated y RLS4 tablas.
- **Cambio técnico propuesto antes de ejecución:** archivo temporal ignorado con
  solo20261028104205 revisada; guard previo de cuerpo/historial, comprobación de
  cuerpo nuevo b82a56556b9a30fd708732b1dd7c6383 y ACL, inserción de versión/nombre/
  SQL exactos en schema_migrations en la misma transacción. Copia de definición
  previa privada local para recuperación. Ninguna escritura en datos de negocio.
- **Archivos/contratos:** migración existente sin cambios; envoltorio/recibos en
  test-results ignorado, guía/estado/log/PR. No nuevo requisito funcional, grants,
  infraestructura, secreto o despliegue manual de aplicación. T227–232 conservados.
- **Riesgos/verificación:** evitar aplicación doble o sobre función concurrentemente
  cambiada mediante guard explícito; rollback si hash/ACL/historial no coincide.
  Verificar después cuerpo, firma/search_path/ACL/RLS, recuentos sin PII e historial;
  comparar advisor de seguridad. No probar contrataciones escribiendo datos alojados;
  evidencia crítica1315 SQL/33 E2E ya obtenida en entorno ficticio aislado.
- **Autorización/estado:** solicitud explícita autoriza ejecución y commit/PR sin
  firma/signoff/coautoría; next-env.d.ts ajeno excluido. Aplicación pendiente.
- **Aplicado/verificado2026-10-28:** guard baseline, reemplazo y registro exacto
  20261028104205/hiring_candidate_availability confirmados en una transacción.
  MD5 cuerpo nuevo b82a56556b9a30fd708732b1dd7c6383 y SQL almacenado coinciden con
  archivo revisado; ACL/search_path/SECURITY DEFINER/RLS preservados. Historial +1,
  sin repair ni otras migraciones; recuentos de consentimiento/participación/
  derivación sin cambios. Advisor60 WARN previos→60, cero nuevos/cero ERROR.
  No se hicieron pruebas escribiendo datos de negocio alojados ni deploy manual.
  Verificaciones locales previas vigentes, sin cambios posteriores de producto.
  Pendiente publicar commit/PR y observar CI/revisión humana.
- **Publicación solicitada:** implementación77c41b5 sin firma/signoff/coautoría,
  [PR81](https://github.com/maximo-Pdev/funes-empleo/pull/81) abierto hacia main,
  sin borrador y adjunto a la conversación. Incluye EXTRA094/095 y migración ya
  aplicada. next-env.d.ts y recibos privados ignorados excluidos. CI/revisión/merge
  pendientes; no se afirma despliegue de interfaz por haber aplicado la función.

## EXTRA-094 — CV en pestaña, métricas resumidas y disponibilidad al contratar

- **Fecha/origen:** Mateo,2026-10-28, solicita los tres ajustes. PR80 mergeado
  e864cfb confirmado antes de partir de main actualizado; rama
  feat/cv-metrics-candidate-availability. next-env.d.ts ajeno preservado.
- **Evidencia:** /api/cv envía attachment y tres vistas ofrecen descarga;
  Dashboard muestra todos los conteos/desgloses/tiempos sin jerarquía; EXTRA035
  retira consentimiento global al contratar, y perfil propio vuelve a mostrar
  aceptación aunque ya esté aceptado (DB rechaza duplicados).
- **Decisiones explícitas:** sustituir retiro automático por indisponibilidad;
  conservar consentimiento, otras participaciones/permisos, y acceso de empresa
  contratante hasta30 días. Una revocación previa nunca se reactiva. Seis tarjetas
  (candidatos activos, empresas activas, ofertas publicadas, participaciones,
  derivaciones, contrataciones); gráficos resultados/contrataciones por categoría;
  detalle plegado y exportaciones completas. No aprobación legal para datos reales.
- **Cambio necesario antes de código:** CV inline y enlaces nueva pestaña en todos
  los roles manteniendo proxy autorizado; jerarquía/gráficos accesibles servidor;
  reemplazar únicamente rama hired de transition_participation mediante migración
  forward-only. Actualizar disponibilidad/status y auditar atómicamente con hire/
  late_hire; sin modificar consentimiento ni otros casos. Solo aceptación pendiente/
  retirada muestra formulario; aceptado se conserva, sin aceptación implícita.
- **Contratos/archivos:** ruta CV y enlaces candidato/admin/empresa/preview;
  dashboard/página métricas, perfil candidato, RPC transition_participation,
  pruebas SQL/UI/servidor/E2E; spec/plan/modelo/estados/permisos/guía/recuperación.
- **Riesgos:** ampliación autorizada de acceso poscontratación; exige frontera
  exacta720h, cuenta/sesión/consentimiento/archivo vigentes y revocación terminal.
  Historial previo permanece; sin backfill, restauración de permisos o consentimiento.
  Abrir PDF depende de capacidad/preferencia del navegador; no se expone URL Storage.
  Gráficos preservan cero/pendiente, filtros y no suman categorías solapadas.
- **Verificación prevista:** SQL normal/tardía,720h/retiro manual/roles/rollback/
  concurrencia/otros casos; enlaces/headers/denegaciones, aceptación única, gráficos
  cero/null/móvil/teclado/axe; tipos/lint/unit/tooling/build y navegador ficticio
  aislado. Sin migración alojada/despliegue/PR solicitados todavía.
- **Estado:** requisitos y aclaraciones autorizados; diseño/gates e implementación
  pendientes. Sin cambios de producto antes de registrar este alcance.
- **Diseño/gate posterior:** spec/clarify→plan/modelo/contratos→checklist8/8→tareas
  T227–232→análisis R1–R5: cobertura100%, cero críticos/altos. Constitución I–VI
  preservada. Checklists históricos de revisión humana no se modifican ni se
  declaran aprobados; pedido explícito autoriza este incremento independiente.
- **Implementación verificada parcialmente:** migración20261028104205 aplicada
  solo a funes-admin-cv-check; normal/tardía conservan consentimiento, disponibilidad
  y ventana exacta720h/terminalidad.1315 SQL/25 archivos PASS;1257 unit/100 archivos,
  tooling57, tipos/lint/build PASS. Advisor security local sin incidencias.
- **Diagnósticos:** primera unidad focal tuvo4 expectativas antiguas y un error
  de archivo temporal sandbox del runner; suite completa fuera de sandbox PASS.
  Navegador detecta selector companies anterior, consentimiento form→region y
  dependencia del visor PDF inexistente en headless shell. Se ajustan pruebas al
  contrato real: popup creado, respuesta PDF inline autenticada y pestaña original
  conservada; sin exigir URL de una extensión. Sin cambios de producto por esos
  diagnósticos ni relajación de permisos/umbrales. Verificación de UI en curso.
- **Resultado final:** treinta E2E pasan en la primera corrida; los tres recorridos
  con expectativas de presentación anteriores se recuperan en la corrida final de
  seis pruebas PASS (métricas/exportaciones, atención presencial y candidato).
  Treinta y tres escenarios críticos afectados cubiertos, sin retries/omisiones;
  no se declara corrida de toda la suite de navegador/CI ni benchmark alojado.
 1315 SQL y fixture500/50/100/1000 con500 PDF verificados. Resumen1440/390px
  inspeccionado, axe0/teclado/plegado y exports completos PASS; nueva pestaña/
  inline y origen conservado, consentimiento sin reaceptación, permisos/normal/
  tardío/atomicidad/concurrencia bajo bloqueo candidato PASS. Tipos/lint finales
  PASS; build/source sin cambios posteriores de producto, unit1257/tooling57 PASS.
- **Revisión/convergencia:** R1–R5 implementados y trazados T227–232; cero brechas
  nuevas del incremento. Revisión React: hooks estables, render condicional solo
  del formulario, mensajes de éxito fuera de él, gráficos servidor sin paquetes
  ni fetch cliente, foco/semántica/valores legibles. FR036/038/modelo/contratos y
  reglas actuales alineados; decisiones anteriores quedan como histórico fechado.
  Guía docs/operations/cv-metrics-availability.md. No cambios alojados/env/deps,
  commit/PR/CI/revisión humana todavía. Rama anterior borrada local/remota después
  de confirmar merge80; next-env.d.ts ajeno con hash original conservado.

## EXTRA-093 — Observar oferta activa en prueba de pausa del carrusel

- **Origen/evidencia previa,2026-10-27 Funes:** Run40605431687/991365b pasa129 E2E
  y falla solo pausa móvil: espera translate3d -229.96px y recibe -230px. Son0.04px
  de asentamiento de la misma transición, sin cambio de oferta. El fallo impide
  ejecutar el control concurrente posterior, ya verificado localmente en EXTRA092.
- **Cambio mínimo antes de código:** medir en móvil el índice de la tarjeta cuya
  parte superior está más cerca del viewport del carrusel. Verificar que ese índice
  no cambia durante hover y sí cambia tras salir; desktop mantiene distancia entera
  de la tarjeta. Controla la oferta visible y tolera física subpíxel de Embla sin
  redondeo arbitrario, ocultar bugs de navegación o modificar producto.
- **Archivos/riesgos/contratos:** solo portal-filters.spec.ts y trazabilidad. Sin
  cambios de app, duración3s, preferencias, contratos o infraestructura. Riesgo de
  selector geométrico incorrecto: repetir desktop/móvil y comprobar auto/pausa/
  reanudación con igual umbral de tiempo, sin retries ni rebajar aserciones de
  oferta. Sin nuevo requisito de negocio/arquitectura; autorizado por recuperación
  de CI del mismo PR80. Verificación prevista: repetición focal, tipos/lint/CI.
- **Resultado:** seis E2E PASS (tres repeticiones por ancho1440/390), sin retries;
  autoavance/pausa/reanudación y límites originales preservados. Tipos/lint/diff
  PASS. Solo prueba/documentación; build de producto ya verificado sin cambios.
  T226 implementado; publicación sin firma en PR80, CI/revisión humana pendientes.

## EXTRA-092 — Recuperar observación de éxito en SC-008A

- **Origen/evidencia previa,2026-10-27:** Run40601364799/efbf768 pasa130 E2E y
  falla solo aceptación concurrente; database y Vercel PASS. demo-performance.mjs
  busca «Estado: Publicada» y «Resultado o estado vigente: Preseleccionada/Persona
  contratada». La UI aprobada renderiza esas etiquetas como texto + Badge sin ':',
  confirmado en página administrativa de oferta y ParticipationTimeline. El wrapper
  comprueba exit status antes de leer recibo, ocultando cuál de cuatro acciones falla.
- **Cambio mínimo propuesto:** observar badge Publicada dentro de región Oferta y
  empresa, y badge de estado dentro del status «Resultado o estado vigente» para
  preselección/contratación. Contacto conserva su texto único. No cambiar acciones,
  reloj/barrier, cuatro cuentas,5s, fixture frío ni comprobaciones SQL de integridad.
  Adaptar test de inventario español que aún obliga la cadena antigua. Mostrar
  solo admin/PASS-FAIL/milisegundos numéricos del recibo en error, nunca stdout/
  stderr crudos, claves o datos de formularios.
- **Archivos/contratos/riesgos:** helper de medición, aceptación E2E, inventario
  tooling, tareas/estado. Solo sonda de prueba acorde a UI; sin cambio funcional,
  presupuesto de latencia, SQL/RLS, dependencias o configuración. Riesgo de aceptar
  historial en lugar de estado actual: scope estricto de región/status y Badge.
- **Verificación prevista:** reset único en Supabase ficticio propio aislado,
  prueba real de cuatro acciones/actores/auditorías sin omisiones; tooling,
  tipos/lint y nuevo CI completo. Preservar entorno habitual y next-env.d.ts.
  Autorizado por recuperación de PR80; sin decisión de negocio/arquitectura nueva.
  Implementación y verificación pendientes.
- **Resultado:** sondas de texto exacto dentro de región/status vigentes, sin
  depender de ':' ni atributos del Badge no declarados. Primera verificación
  local detectó una suposición incorrecta de data-slot: SQL confirmó las cuatro
  mutaciones efectivas, solo fallaba observarlas. Corregida la sonda y repetido
  reset frío propio: SC-008A PASS, cuatro resultados <=5000ms, barrera común,
  actores1–4 y todas las versiones/auditorías SQL verdaderas. No se alteraron
  presupuesto, fixture, acciones o condiciones para pasar.
- **Verificado:**2 inventarios,57 tooling, tipos/lint/diff PASS; app sin cambios
  respecto a efbf768 que ya pasó130 E2E. Control frío local final PASS (2.9min,
  preparación fuera del reloj de acciones). Se hicieron dos resets únicamente del
  proyecto ficticio funes-admin-cv-check por la corrección intermedia de sonda;
  entorno habitual intacto. Recibo de fallo ahora expone solo números/admin/
  PASS-FAIL permitidos, nunca salida cruda. T225 implementado; publicación sin
  firma en PR80, nueva CI/revisión humana pendientes; escenarios alojados del
  helper no ejecutados ni ampliados.

## EXTRA-091 — Evitar redirecciones de filtros con espacios y referencias opacas

- **Origen/evidencia previa,2026-10-27:** recuperación autorizada PR80. Al liberar
  los menús de EXTRA090, dos recorridos quedan en «Cargando gestión municipal» y
  repiten la misma URL con term='Persona ficticia 001' o nombre presencial +
  categoryId opaco. canonicalReferenceRoute construye espacios como '+', mientras
  referenceUrl reconstruye todos los parámetros como '%20' aun sin convertir un
  UUID. Cada petición vuelve a redirigir por comparación de cadenas equivalente.
- **Cambio mínimo propuesto:** en referenceUrl omitir reconstrucción del query
  cuando los valores del campo no cambiaron tras conversión. Solo reescribir cuando
  se sustituye realmente UUID por referencia. Mantener orden/repeticiones/encoding
  original de URLs ya opacas. No tocar filtros, validación, guards ni resolución.
- **Contratos/archivos:** helper reference-url.ts, regresiones unitarias de
  idempotencia/espacios/+ y referencia legada, recorridos de búsqueda con espacios,
  artefacto de referencias/plan/tareas/estado. Sin SQL/auth/estados/dependencias.
- **Riesgos/verificación:** canonicalización de campos múltiples y referencias
  repetidas, legados y datos codificados. Probar RED del bucle y GREEN sin redirect
  espurio/ni RPC extra; conservar tests privados/autorización/UUID, ejecutar dos
  búsquedas completas y seis flujos previos, tipos/lint/build y CI. No aumentar
  timeouts ni ocultar estados de carga para sortear el fallo.
- **Estado:** requisito técnico necesario de filtros GET/referencias aprobados,
  autorizado por recuperación PR80; análisis focal sin cambio arquitectónico o de
  negocio. Implementación/verificación pendientes. next-env.d.ts ajeno preservado.
- **Resultado:** cuatro regresiones RED antes del guard;47 pruebas de referencias/
  descargas GREEN. Suite final1254/100 y cobertura configurada env/schema100%
  PASS, tipos/lint/build/diff PASS. Siete E2E finales PASS sin retries: alta/listado/
  filtrado presencial, búsqueda general con frase, dos filtros GET con espacios y
  tres menús abiertos/axe/foco. El diagnóstico confirmó bucle, no demora: se
  corrigió sin aumentar timeouts ni modificar condiciones de resultados.
  Fuente compilada coincide con workspace; T224 implementado. Publicación en
  PR80 sin firma/coautoría; CI posterior se verifica en checks, revisión humana
  pendiente. Sin cambios de datos alojados o migraciones.

## EXTRA-090 — Completar recuperación de recorridos del PR80

- **Origen/evidencia,2026-10-27:** continuación de Mateo «seguí». Run40573996246
  pasa database, accesibilidad completa y121 E2E; seis fallos antes ocultos por
  el gate. Tres selectores Localidad resuelven input auxiliar+combobox; un test
  busca enlace viejo «Volver a atención presencial» donde producto aprobado dice
  «Volver a perfil asistido»; un menú múltiple abierto intercepta submit; axe
  detecta Popup(dialog) y List(listbox) sin nombres en categorías asistidas.
- **Cambios necesarios antes de código:** usar role=combobox en los tres tests
  empresariales y categorías asistidas, cerrar selección múltiple con Escape,
  alinear enlace de regreso y verificar href. Añadir nombres accesibles específicos
  a Popup/List en los cuatro callers existentes (categorías, filtros, localidad,
  campos de oferta), conservando el componente adaptado Base. No ocultar errores
  axe, eliminar escenarios, forzar clicks ni cambiar flujos de negocio.
- **Fuentes/revisión:** docs oficiales shadcn Base Combobox y Base UI consultados;
  reutilizar props aria-label soportadas, sin reemplazar el primitivo/estilo/API.
  Adaptador base-nova local revisado. Fuente: https://base-ui.com/react/components/combobox
  y https://ui.shadcn.com/docs/components/base/combobox .
- **Archivos/riesgos/contratos:** cuatro componentes de campos y seis specs E2E,
  nueva regresión axe de popups abiertos, guía/tareas/estado. Sin datos, auth,
  permisos, esquemas, dependencias o acciones nuevas. Riesgo de selección/foco y
  nombres coincidentes; comprobar triggers por rol, Escape y navegaciones completas.
- **Plan de verificación:** seis recorridos fallidos sobre fixture aislado, axe
  abierto/cerrado por tipo de selector, componentes, tipos/lint/build y CI nuevo.
  Preservar next-env.d.ts. Autorizado como corrección necesaria de PR80; análisis
  focal sin cambio de requisitos de negocio o arquitectura. Verificación pendiente.
- **Resultado:** los seis recorridos que fallaban fueron verificados en corridas
  dirigidas, y tres nuevas pruebas axe de popup abierto pasan con Escape/foco
  intactos. Primera corrida7/9 PASS expuso el bucle de EXTRA091; tras corregirlo,
  dos pendientes y regresiones añadidas PASS en corrida final7/7. No se bajaron
  umbrales, aumentaron timeouts ni usaron clicks forzados.1254 unitarias y
  tipos/lint/build PASS; T223 implementado. Nuevo resultado remoto se consulta
  en PR80. Docker se había detenido; se reinició en segundo plano para el entorno
  ficticio, sin reset habitual ni operaciones alojadas.

## EXTRA-089 — Corregir desbordamiento administrativo del PR80

- **Fecha/origen:**2026-10-27, Mateo informa fallo GitHub de PR80 y solicita
  corregirlo. Run40571403004/head1dd0dc0: database PASS; application pasa tipos,
  lint, tooling,1250 pruebas y build, falla accesibilidad admin360/1366 al exigir
  ausencia de scroll horizontal. Los demás roles pasan;98 recorridos dependientes
  no se ejecutan tras el gate fallido, no se consideran verificados.
- **Evidencia antes de código:** Chromium sobre copia ficticia reproduce
  /admin/candidates:360→scrollWidth412 y1366→2188. Input sr-only name=locality
  absoluto toma ancho del viewport (CSS administrativo width100%) sin contenedor
  posicionado; su origenx52/822 lo excede. Las otras páginas medidas no desbordan.
  El nombre nativo agregado en EXTRA085 expone este transporte auxiliar.
- **Cambio propuesto/necesidad:** posicionar únicamente el contenedor de localidad
  de CandidateSearchForm con relative. Mantiene nombre/valor, validación nativa,
  combobox, GET/referencias y CSS compartido. No esconder overflow de body ni
  relajar pruebas. Mejorar diagnóstico de ruta en gate y comprobar360/1366 en
  buscadores general/asistido antes/después de filtros.
- **Archivos/contratos/riesgos:** candidate-search-form.tsx, E2E accesibilidad/
  portal-filters y documentación/estado. Sin datos, contratos API, SQL, permisos,
  dependencias o configuración. Riesgo de posicionamiento/foco del combobox;
  verificar controles/popup/selección/teclado y búsqueda con localidad opcional.
- **Verificación prevista:** reproducción RED y GREEN de ancho real, gate completo
  por roles y filtros de ambos destinos, tipos/lint/tests/build; publicar corrección
  sin firma en mismo PR80 y comprobar CI. Preservar next-env.d.ts ajeno.
- **Estado:** autorizado por pedido explícito y requisito técnico derivado de
  EXTRA085/constitución IV. Análisis focal sin cambio arquitectónico. Implementación,
  verificación y CI pendientes; revisión humana no acreditada.
- **Implementado/verificado localmente:** una clase relative en el contenedor,
  sin modificar CSS global/controles ni contratos. Dos regresiones nuevas fallan
  antes del fix (general sin filtrar y asistidos filtrados) y pasan después. Ocho
  E2E PASS sin omisiones/retries: seis de accesibilidad por roles360/1366 y dos de
  filtros GET/general/asistido con categorías múltiples y navegación. Umbrales,
  axe y foco conservados.13 componentes, tipos/lint/build/diff PASS. Hash del
  componente igual a copia compilada y next-env.d.ts ajeno intacto. No reset/SQL.
  T222 implementado; corrección se publica en mismo PR80 sin firma ni coautoría.
  CI posterior y revisión humana se consultan en los checks del PR; no se declaran
  aprobados por la verificación local. Logs ficticios en test-results ignorado.

### Publicación de EXTRA085–088 solicitada — 2026-10-27

Mateo solicita commit y PR de la rama feat/portal-offers-metrics-filters. Main
remoto sigue en b900485, sin divergencia de base. Revisión final del alcance
completo:1250 pruebas/100 archivos y cobertura configurada env/schema100% PASS;
tipos/lint/build,57 tooling, pgTAP1314 y recorridos focales anteriores documentados
arriba. Se publican47 archivos de producto/documentación/pruebas; next-env.d.ts
preexistente queda fuera y conserva su hash. Sin migración, configuración alojada
o deploy manual. Commit sin firma/coautoría; PR/CI y revisión humana pendientes.
- Publicado: commit de implementación `5936d2514fc55f397f98c445117d8a6b8618f1a4`
  sin firma ni trailers de coautoría; PR abierto y listo para revisión:
  https://github.com/maximo-Pdev/funes-empleo/pull/80 . CI y revisión humana
  permanecen pendientes; no se afirma aprobación ni merge.

## EXTRA-088 — Carrusel circular con diez ofertas recientes

- **Fecha/origen:**2026-10-27, Mateo solicita última/penúltima a la izquierda de
  la primera y primera/segunda a la derecha de la última, con las últimas10 ofertas.
  Sustituye límites/navegación de P1/EXTRA085–087, conservando avance3s sin botón
  de pausa y toda la funcionalidad restante de la rama.
- **Evidencia/cambio antes de código:** Home consulta12; coverflow resta índices
  y flechas se detienen. Pedir10 en servidor (publicación DESC/ID DESC existente),
  distancia circular centrada para vecinos y flechas con módulo. Embla móvil
  loop:true usando su API existente; fallback de biblioteca si faltan slides
  para llenar viewport, sin inventar ni duplicar ofertas. Fuente oficial v8.6.0:
  https://github.com/davidjerleke/embla-carousel/blob/v8.6.0/packages/embla-carousel/src/components/EmblaCarousel.ts
  y Options.ts: loop nativo/fallback verificados. No nueva dependencia.
- **Alcance/contratos:** página/carrusel Home y sus pruebas; spec/plan/research/
  tareas/quickstart/guía/inventario/estado. Solo límite de preview, no catálogo
  general, conteos públicos, elegibilidad ni SQL. Conservar links, foco/hover,
  reduced-motion/pestaña oculta/cleanup, vacío/error y0/1 ofertas.
- **Riesgos/verificación:** vecinos y sentido del giro, cruce9→0 y0→9, cantidades
  pequeñas, flechas móviles y DTO/límite10. Pruebas temporizador/geometría/servidor,
  navegador1440/390 con extremos y captura, tipos/lint/build/diff-check.
- **Estado:** autorizado por pedido explícito; análisis focal consistente con
  reglas públicas, sin cambio arquitectónico/SQL ni gates municipales nuevos.
  Implementación/verificación/revisión pendientes. Preservar next-env.d.ts ajeno.
- **Resultado implementado:** Home pide10 ofertas en servidor; coverflow tiene
  vecinos/flechas circulares y móvil usa loop nativo. Mantiene3s, sin botón extra,
  filtros públicos y conteos completos. Contrato de conteos solo ajusta referencia
  documental al nuevo límite, sin cambiar RPC/ACL/datos.
- **Verificación:**31 pruebas Home/carrusel/contadores PASS, incluidos0/1 y2–5/10,
  vecinos de extremos, flechas y temporizador. Tipos/lint/build/diff-check PASS;
  cuatro recorridos browser finales cubiertos y PASS en producción local aislada:
  orden/límite10, extremos desktop/móvil, auto3s/hover y reduced-motion/flechas.
  Una expectativa de visibilidad móvil falló porque parte del carrusel quedaba
  fuera de pantalla; se colocó todo el viewport en pantalla, manteniendo ratio0.9
  y verificando última/primera. Repetición PASS sin cambio de producto. Recorrido
  geométrico usa reduced-motion para capturas deterministas; auto3s se prueba
  por separado. Capturas primera/última revisadas; hashes de Home/carrusel
  coinciden con build. next-env.d.ts ajeno conserva su hash previo.
- **Estado final:** T221 completo, artefactos actuales consistentes; logs/capturas
  ficticios ignorados. Sin migración/reset/dependencias/cambios alojados ni
  commit/PR/CI; revisión humana pendiente. Entorno aislado cerrado con backup.

## EXTRA-087 — Carrusel automático cada3s sin botón de pausa

- **Fecha/origen:**2026-10-27, Mateo pide quitar Pausar/Reanudar y avanzar cada3s.
  Sustituye la presentación/temporización de EXTRA086; misma rama y preservación
  de todos los cambios anteriores/next-env.d.ts ajeno.
- **Cambio antes de código:** retirar Button/iconos/ref/estado de pausa manual;
  intervalo3000ms desktop/Embla móvil, reinicio al principio y flechas existentes.
  Hover/foco solo pausan mientras la persona interactúa; al salir vuelve solo.
  Conservar reduced-motion, pestaña oculta y cleanup, sin pausa táctil permanente
  que ya no tendría control para reanudar. Sin dependencias ni contratos de datos.
- **Archivos/riesgos:** HomeOffersCarousel, pruebas, spec/plan/tasks/guía/estado.
  Riesgo de dejar bloqueado el avance al quitar su control: comprobar foco/blur,
  hover/salida, mobile/tacto,3000ms/reinicio,0/1 ofertas y desmontaje. Tipos/lint/
  build y pruebas pertinentes. Sin SQL, permisos, migración o publicación.
- **Estado:** autorizado explícitamente; análisis focal compatible con P1 y sin
  cambio arquitectónico. Implementación/verificación/revisión pendientes.
- **Resultado:** implementado sin controles de pausa;3000ms en desktop/móvil,
  reinicio/flechas, hover/foco temporales y preferencias/cleanup conservados.
  Seis pruebas focales, tipos, lint, build y diff-check PASS. Cuatro E2E PASS
  sin retries en compilación de producción local: orden,1440/390px con avance/
  retorno automático tras hover, reduced-motion y flechas. Verificada ausencia
  de Pausar/Reanudar en ambos tamaños. Hash de fuente coincide con copia
  compilada; next-env.d.ts ajeno preservado. Sin reset ni cambios alojados.
  Artefactos/guía/inventario alineados, T220 completo; revisión humana/CI/PR
  pendientes. Entorno de prueba aislado detenido conservando datos.

## EXTRA-086 — Avance automático del carrusel

- **Fecha/origen:** 2026-10-27, Mateo pide que el carrusel cambie de oferta además
  de los botones. Continuación autorizada de EXTRA085 en la misma rama; conservar
  todos los cambios existentes y next-env.d.ts ajeno.
- **Evidencia/cambio propuesto antes de código:** HomeOffersCarousel solo avanza
  con controles. Agregar temporizador de5s para desktop y API Embla móvil,
  retornando a la primera tras la última; orden servidor y botones acotados
  permanecen. Sin dependencias nuevas, consultas, contratos de datos o migración.
- **Adición necesaria/accesibilidad:** botón compartido Pausar/Reanudar primero
  en orden de foco; pausa temporal al hover y persistente al foco/interacción
  táctil. Preferencia reduced-motion pausa por defecto y admite inicio explícito;
  pestaña oculta no avanza; cleanup cancela temporizador/listeners. Evidencia:
  https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ y Button oficial base-nova
  consultados, conservar tokens/control adaptado.
- **Archivos/contratos:** home-offers-carousel.tsx, pruebas de componente/browser,
  spec/plan/tasks/guía UI/inventario/estado. Solo presentación; sin cambios de API,
  permisos ni criterios de ofertas. Ampliación P1 sustituye parada automática al
  extremo por reinicio; navegación manual sigue acotada.
- **Riesgos/verificación:** movimiento durante lectura/foco, timers residuales,
  reinicio móvil y0/1 ofertas. Probar tiempo/pausa/reanudación/preferencias/
  pestaña oculta/desmontaje y navegador móvil/escritorio; tipos/lint/build y suite.
- **Estado:** autorizado por pedido explícito; análisis focal sin contradicciones
  de negocio/arquitectura, detalles accesibles derivados de constitución IV.
  Implementación y verificación pendientes; revisión humana pendiente.
- **Implementado/verificado:** intervalo5s con cleanup para desktop/Embla móvil,
  reinicio al principio, botones manuales conservados, Button municipal de pausa,
  foco/tacto/puntero mouse/reduced-motion/visibilidad. Ocho pruebas focales PASS;
  suite completa1247/100 PASS antes del último ajuste de puntero táctil, ocho
  focales finales lo verifican. Tipos/lint/build PASS en Node24.22.0. Cinco
  recorridos browser finales cubiertos: orden, auto/hover/pausa/reanudación1440 y
  390, reduced-motion e interacción táctil; todos PASS, capturas revisadas.
  Código compilado y fuente tienen el mismo hash; next-env.d.ts ajeno conserva
  su hash previo. No hubo reset, migración, dependencia ni publicación.
- **Incidencias:** primera prueba browser falló por variable pública con nombre
  incorrecto solo en la copia aislada; recompilada con el nombre vigente del
  contrato, sin editar configuración del usuario. Prueba reduced-motion encontró
  solo diferencia de espacios de style SSR; corregida para leer propiedad CSS,
  repetición PASS sin cambiar producto. Logs/capturas ignorados en test-results.
  Warning de lockfiles de copia y Canvas jsdom ya conocidos. Análisis final P1
  consistente con plan/tarea/guía; sin pendientes funcionales focales detectados.
  Revisión humana/CI/commit/PR siguen pendientes; T219 completo.

## EXTRA-085 — Ofertas recientes, métricas PDF/XLSX y filtros servidor

- **Fecha/origen:**2026-10-27, Mateo solicita cuatro mejoras. PR77 mergeado
  confirmado; base main b900485 incluye PR78/tablas/combobox/canvas1280. Rama
  feat/portal-offers-metrics-filters; next-env.d.ts preexistente preservado.
- **Decisiones:** Mateo confirma PDF y Excel .xlsx, y bloquear solo scroll del
  fondo del popup Ver perfil y nominar, conservando scroll interno. Consultas
  y criterios de negocio, permisos, fuentes/diseño de PR78 permanecen vigentes.
- **Evidencia:** Home ya pide12 ofertas ordenadas por publicación DESC/ID antes
  de limitar; el coverflow circular mezcla la última junto a la primera. Mantener
  orden servidor y limitar navegación reciente→antigua sin envolver, con diseño3D
  y carrusel móvil vigentes. No nuevo timestamp o ranking.
- **Adiciones necesarias antes de código:** descargas reales de servidor con
  write-excel-file4.1.1 y PDFKit0.20.2 (MIT), tipos PDFKit0.17.6 y parser XLSX de
  prueba. Versiones exactas/lockfile/audit/Node24; API actual writeExcelFile(...).
  toBuffer(). PDFKit externo y tracing de TTF Be Vietnam solo para ruta PDF en
  next.config. Evitar formatos binarios artesanales, ExcelJS más amplio y
  pdf-lib con paginación manual. No datos/fuentes remotos durante generación.
- **Contratos:** nuevas rutas operations.pdf/.xlsx reutilizan guard, filtros
  estrictos/referencias opacas, getMetrics(true), auditoría y datos de CSV. CSV
  permanece compatible; pantalla ofrece los dos nuevos formatos. Cabeceras
  private/no-store/nosniff/attachment. Etiquetas españolas, cero numérico,
  precisión y pendientes null, sin UUID/PII nuevos. XLSX texto String explícito
  sin fórmulas/links/macros; PDF fuente embebida y texto largo paginado.
- **Filtros:** auditoría de lectura confirma consultas ya servidor en público,
  candidatos/asistidos, matching, ofertas, empresas, casos y métricas. Convertir
  composición CandidateSearchForm a servidor GET, nombres nativos y categoryId
  repetible opaco; islas cliente de combobox, LocalityCombobox required=false.
  Matching compone orden GET en servidor y pasa ReactNode al cliente tabla/modal;
  omitir página al enviar. Conservar Form/Field cliente para validación/foco,
  defaults, selección múltiple OR y alcance asistido. No cambiar otros criterios.
- **Popup:** CSS dirigido al dialog de preview abierto bloquea overflow raíz;
  cierre/desmontaje restaura sin listeners residuales. Conservar scroll interior,
  foco/Escape/bloqueo en nominación y posición del fondo.
- **Archivos:** Home/carrusel, métricas etiquetas/generadores/handler/rutas/página,
  reference-url, next.config/package/lock; filtros candidato/categorías/matching,
  CSS/dialog, inventario y pruebas/artefactos. Sin SQL/variables/secretos nuevos.
- **Riesgos/verificación:** dependencias/fuentes, Unicode/PDF largo, fórmulas,
  caché/roles/auditoría, orden global, GET/refs/multiselección, móvil/foco/scroll.
  Unitarias, lectura independiente/visual de archivos ficticios, tipos/lint/build
  y navegador. No reset habitual/alojado, migraciones ni publicación autorizados.
- **Gates:** incremento feature001; spec/clarificaciones→research/plan/modelo/
  contratos/quickstart→checklist/tareas→análisis antes de implementar. Research
  delegado de solo lectura según fase0 speckit-plan, no edición por agentes.
  Constitución I–VI sin excepciones; autorización AGENTS para detalles necesarios.
  Implementación/verificación/revisión pendientes al registrar esta entrada.
- **Resultado implementado:** carrusel acotado reciente→antigua; PDF/XLSX reales
  en servidor y CSV compatible; filtros GET compuestos en servidor con islas de
  combobox/validación; bloqueo de fondo y scroll interior del popup. Archivos
  reales: Home/carousel, globals.css, metrics/{labels,report-data,pdf-export,
  xlsx-export,download-route,components/dashboard}, dos rutas exports, página de
  métricas, reference-url, next.config, package/lock y componentes de candidatos/
  matching. Inventario y operación en docs/implementation/portal-filters-audit.md;
  UI_GUIDELINES y artefactos feature001 alineados. Sin SQL/env/remoto.
- **Verificado, 2026-10-27:** Node24.22.0/npm11.19.1; tipos, lint sin warnings,
  build producción y diff-check PASS. Suite1242/100 archivos, tooling57;67
  focales finales PASS. Cobertura100% solo del módulo env/schema configurado,
  no de todo el producto. pgTAP1314/25 archivos PASS en Supabase aislado
  funes-admin-cv-check (API54341/DB54342), fixture500/50/100/1000 y500CV ficticios.
  Diez recorridos Chromium PASS sin retries; repetición de popup con escritorio/
  desmontaje PASS. PDF/XLSX/CSV audit+3 y permisos anónimo/empresa; matching,
  nominación, orden global, paginación, GET múltiple/atrás/adelante, Home1440/390
  y scroll móvil360/escritorio. Axe sin violaciones en superficies comprobadas.
  XLSX parser independiente/XML sin fórmulas/macros/links/UUID; PDF14p leído
  con pypdf y renderizado: acentos, títulos largos, encabezado por página y última
  fila presentes. Tracing contiene ambas fuentes TTF. Hashes21 archivos runtime/
  configuración/dependencias coinciden con la copia compilada. next-env.d.ts
  ajeno conserva SHA256 B8B3A344484B959AF5E4E3FC1A1609DAC3CB9ECE0CDEB6C145BE29BC4C491000.
- **Incidencias y límites:** primera ejecución Chromium no encontró caché del
  navegador del sandbox; luego no alcanzó servidor en otro contexto. Se ejecutaron
  servidor/browser en el mismo contexto local y pasaron. Una corrida Vitest perdió
  archivo temporal; repetición sin cambios de pruebas y suite completa PASS.
  Tipos detectó dos índices opcionales en test nuevo; aserciones tras longitud
  comprobada corregidas, tipos final PASS. Logs/capturas/binarios ficticios en
  test-results ignorado; no son artefactos de producto. Warning de lockfiles
  de la copia de verificación no afecta build. Audit actual=baseline7 avisos
  (Next crítico; Zod/Undici/Vite altos; Vitest/coverage/mocker moderados), ninguno
  nuevo por estas dependencias. npm temporal carece comando audit; se comparó con
  CLI npm11.19.0 del sistema, solo lectura. No se actualizó stack fuera de alcance.
- **Convergencia focal:** P1–P4 cubiertos por T214–218, sin trabajo funcional
  pendiente detectado. Revisión React/server-only/guards/estado/teclado sin
  defectos abiertos en este alcance. Gates municipales históricos y aceptación
  global no se cierran. Sin commit/PR/CI/deploy; revisión humana pendiente.


## EXTRA-084 — Restore PR 78 browser checks and required locality validation

- **Date/authorization:** 2026-10-26; Maxi requested: «Falló el PR en github. Arreglalo para que salga en verde».
- **Evidence:** the exact PR head fails 27 browser scenarios. Several helpers expect the retired universal login landing or card markup; help controls make substring labels ambiguous. Company locality uses a required hidden input, which native constraint validation ignores, so the eight-field summary misses locality.
- **Origin/scope:** approved portal-polish behavior and existing registration/validation requirements; recovery tracked in `odd/tasks/pr78-green.md`. Preserve permission, pagination, ordering, consent and keyboard proofs; do not skip tests or lower the required-field count.
- **Minimal change:** align browser locators with the approved role landings/table/combobox controls and restore locality's integration with required validation, invalid state, focus and correction. Keep current server validation, field meaning and layout.
- **Affected surfaces:** company locality/registration components, focused component regressions and the reported E2E specifications. No migrations, Auth/provider changes or dependency updates.
- **Risks/recovery:** locality is shared by company forms; test optional, controlled and default-value consumers. Revert the focused correction to recover the prior implementation. Preserve curated local accounts by using isolated GitHub acceptance runs instead of the local reset wrapper.
- **Verification/status:** implemented. Required-locality RED reproduced; five new focused tests pass and independent scratch baseline comparison fails four of them. Integration found five old-test/inventory failures; corrected without scanner suppression, and 34 focused tests now pass. Initial lint/types/build and 57 tooling tests passed; post-correction full recheck and exact-head GitHub E2E/database results pending. Table authorization recovered from `odd/tasks/portal-polish.md` S27 and reconciled with the older spec/UI guide. Not human-reviewed or accepted.

## EXTRA-083 — White municipal emblem favicon

- **Follow-up, 2026-10-26:** Maxi reports the prior default icon remains in the tab at `http://localhost:3000/`. Exact live GET confirmed the new root icon metadata and byte-exact PNG with HTTP 200, so the server is not serving the old reference. Add an explicit revision query to the icon URL so the browser must request a distinct favicon resource on reload; keep white silhouette, transparency and other logos unchanged. Local proof does not establish that an already-open user tab has refreshed.
- **Follow-up verification:** metadata regression observed RED without the query and 3/3 root-layout tests GREEN after adding `?v=white-emblem-1`; scoped ESLint and diff check passed. Actual `localhost:3000/` now emits exactly the revised icon URL and returns the matching PNG with HTTP 200. Passive metadata-only follow-up checked structurally and over live HTTP; full build/suite above belong to the preceding asset increment, not this URL revision. Refresh of the user's existing browser tab remains to be confirmed; no running server was restarted and no database changes occurred.
- **Date/authorization:** 2026-10-26; Maxi requested: «El favicon podría ser este logo pero en blanco», with a supplied transparent green emblem PNG.
- **Evidence/scope:** root metadata currently uses the navbar seal. Replace only the favicon with a white derivative of the supplied image; keep page logos, layout and metadata copy unchanged.
- **Implementation:** preserve the original alpha channel and silhouette, recolor RGB to white and center without distortion on a transparent 256×256 canvas. Reference the new local PNG explicitly through root metadata.
- **Risks/recovery:** passive public brand asset and favicon reference only; no runtime dependencies, authentication, data or routes changed. White on transparency has low contrast on light browser tabs, as inherent in the requested white treatment. Restore the previous metadata reference to revert.
- **Verification:** metadata regression, decoded PNG color/alpha/dimensions, production build and actual HTTP icon/metadata readback. No account creation or database-resetting E2E wrapper.
- **Status:** implemented and verified locally, not published or human-reviewed. A metadata regression failed against the former seal before implementation. PNG readback confirmed 256×256, all-white RGB, transparent padding and byte-exact original silhouette alpha; no image distortion. Node 24.22.0 and native child versions matched; lint, type generation, TypeScript, production build and 1217 tests/95 files passed (`--maxWorkers=2`). GET-only production readback verified the exact root icon link, HTTP 200/image/png and byte-exact served asset; owned server stopped. `git diff --check` passed. Existing Canvas/jsdom and external-lockfile warnings remain nonblocking. No E2E reset, accounts, database changes, commits or deployment. Unrelated untracked gradient archives preserved.

## EXTRA-082 — Independent Home access form drafts

- **Date/authorization:** 2026-10-26, Maxi explicitly requested independent login and registration fields. Supersedes EXTRA-080's cross-form identity sharing, not per-form draft retention.
- **Evidence:** HomeAccessPanel merges drafts.common into every form and auto-fills confirmation from password.
- **Change/scope:** keep all captured fields under their own login/candidate/company key; restore only that key. Keep one mounted form and memory-only drafts. Update persistence tests and UI guidance; preserve concurrent company edits.
- **Risk/recovery:** client-side credential draft isolation, no actions, permissions, database, dependencies or shared form contracts changed. Reverting restores unwanted sharing.
- **Verification plan:** RED reproduction, focused regressions, lint/types/build/unit suite and desktop/mobile browser switching without POST or database resets.
- **Status:** implemented; commit referenced below. No push or deployment yet.
- **Verification observed:** four isolation regressions failed before the fix; 33 focused tests then passed. Node 24.22.0 with matching native child: lint, type generation, TypeScript, production build and 1219 tests in 95 files passed. Independent review deleg_c8e4e60d reran 4/4 persistence tests and passed 22 production-browser scenario groups at 1440×900 and 390×844: distinct credentials, independent confirmation, repeated switches, clearing, both closing shortcuts, one mounted form and reload clearing. Zero write attempts or browser errors; owned server/browser closed. Parent repeated 4/4 tests successfully. Nonblocking jsdom Canvas and external-lockfile warnings remain. No database-resetting E2E wrapper run. Concurrent integration/commits were observed; this actor did not commit or publish these changes. Human review/publication are not established by these checks.

## EXTRA-080 — Conservar los datos escritos entre ingreso y registro

- **Fecha/autorización:** 2026-10-25, pedido explícito de Maxi: «Requiero que la información de los campos del formulario de login y registro sean persistentes a los cambios entre pestañas. Es decir, si completo mail o contraseña en login que se mantenga si selecciono "Registrarse" y lo mismo al revés. Para mayor comodidad del usuario.»
- **Problema/evidencia:** cada pestaña monta un formulario distinto y al cambiar de modo el anterior se desmonta, así que React descarta lo escrito (correo y contraseña incluidos). El usuario tiene que reescribirlo para volver a la pestaña anterior.
- **Cambio/justificación:** el recuadro de acceso guarda una instantánea de los valores del formulario montado (`FormData`) antes de cada cambio de modo o de rol, y la pasa como `defaultValues` al formulario que se monte después. Cubre ingreso ↔ registro en ambos sentidos, el rol postulante ↔ empresa, y el retorno desde la confirmación de registro. Vive solo en memoria del componente: no se escribe en `localStorage`, cookies ni servidor, y las contraseñas siguen el mismo alcance que la conservación ya existente tras un envío.
- **Superficies afectadas:** `home-access-panel` (instantánea y traspaso), `auth-form` y `password-field` (`defaultValues`/`defaultValue`), `candidate-registration-form`, `company-registration-form`, pruebas de componentes, guía visual y notas de producto.
- **Riesgo/recuperación:** presentación del lado del cliente sobre formularios ya existentes; no cambia validación, acciones, autenticación, autorización, enumeración ni datos. Revertir las props `defaultValues` y la instantánea restituye el comportamiento anterior.
- **Verificación prevista:** pruebas de persistencia en ambos sentidos, entre roles y desde la confirmación; suite, lint, tipos, build y comprobación en navegador sobre el build de producción. Sin reinicios de datos, altas reales, commits ni publicación.
- **Estado:** implementado y verificado localmente. El recuadro guarda la instantánea del formulario montado (`FormData` sobre `#acceso`, con `data-access-key` en el nodo de contenido) antes de cada cambio de pestaña, de rol y de envío, y la restituye como `defaultValue` al formulario siguiente. Correo, contraseña y confirmación se comparten entre ingreso, postulante y empresa; los demás campos quedan en su propio formulario. Al heredar una contraseña, la confirmación del registro se completa con el mismo valor para que el usuario no tenga que reescribirla. Se eliminó el formulario oculto: ahora se monta uno solo por vez, sin etiquetas duplicadas.
- **Verificación observada:** 4 pruebas nuevas (`tests/components/accounts/access-form-persistence.test.tsx`) en verde: ingreso→registro con correo y contraseña, registro→ingreso, conservación de nombre y DNI al volver, y campos propios por rol con el correo compartido. Suite completa 1218/1218 en 97 archivos, `eslint --max-warnings=0`, `tsc --noEmit` y `npm run build` en verde. Navegador real contra el build de producción: 16 comprobaciones (incluye la confirmación heredada, el aislamiento entre roles y ausencia de desborde horizontal a 1440×900 y 390×844). Una prueba existente de marcadores se ajustó porque el correo ahora llega completo al registro. Se corrigió un error de tipos en `tests/components/home-public-metrics.test.tsx` (trabajo concurrente) que impedía el chequeo de tipos del build.
- **Limitación:** el borrador vive en memoria del componente y se pierde al recargar; no se usan `localStorage`, cookies ni el servidor.

## EXTRA-079 — Métricas públicas reales y ofertas ficticias de demostración

- **Fecha/autorización:** 2026-10-25; «Reemplaza en Home "Cada perfil entra por el camino correcto" por métricas del portal como había en la página original (postulantes registrados, empresas registradas y cantidad de ofertas de trabajo)». Confirmó «Claro, que muestre cantidades reales Además agrega algunas ofertas de prueba para que el carrusel de Home se vea más completo», destino «En la demo publicada» y uso de la sesión existente de Supabase CLI sin borrar/reemplazar datos. Aprobó la función agregada y contar perfiles no archivados (incluidos asistidos, incompletos y suspendidos) y ofertas públicas vigentes: «Acepto la propuesta. Si autorizo».
- **Problema/evidencia:** los números originales eran constantes ilustrativas; la sección actual muestra tarjetas por rol y no hay agregado público. La consulta pública existente sí centraliza la elegibilidad de ofertas. Tres pruebas RED de Home confirman que falta la sección de métricas.
- **Cambio/justificación:** función pública sin parámetros que solo devuelve tres totales, cliente servidor normal y validación estricta; reemplazar únicamente la sección por tres indicadores y estado no disponible distinto de cero. Añadir seis ofertas inequívocamente ficticias a las empresas de prueba existentes, con categorías activas, cierres futuros y trazabilidad. No modificar permisos de lectura de tablas, cuentas, archivos, ofertas previas ni otras secciones.
- **Superficies/recuperación:** nueva migración agregada, tipos RPC, servicio público de métricas, Home/CSS, pruebas y documentos; trazabilidad en `odd/tasks/home-public-metrics-demo-offers.md`. Recuperación de la función mediante revocación/drop tras retirar el consumidor; ofertas identificadas por manifiesto, sin eliminación automática. Riesgos 1/2/3; revisión independiente antes de ejecutar escrituras en la demo.
- **Verificación:** tests de respuesta, valores reales/cero/no disponible, semántica de conteo y permisos; lectura exacta posterior a la escritura, huellas de filas anteriores preservadas y navegador de producción escritorio/móvil. Sin reinicios ni wrapper E2E mutante; sin publicación de aplicación/commits autorizados.
- **Estado/verificación observada:** implementado y aplicado en la demo autorizada tras revisión independiente y ensayo con rollback. La función devuelve tres totales públicos: 3 postulantes, 3 empresas y 8 ofertas vigentes al verificar. Se agregaron las seis ofertas del manifiesto con categorías, slugs generados, 12 eventos de moderación y 18 eventos de auditoría ficticia; las huellas de las nueve tablas controladas antes/después coinciden. No es una huella de toda la base. La demo publicada muestra los tres indicadores y ocho ofertas; navegador real a 1440 y 390 sin desborde. Localmente la base de prueba existente devuelve 500/50/80 y el build muestra esos valores reales a 1440/768/390; no se cargaron allí las seis ofertas de demo.
- **Comprobaciones/cierre:** 40 pruebas focalizadas, revisión independiente con 12 pruebas y PostgreSQL aislado aprobados; corredor general observó 1214 pruebas/96 archivos con `--maxWorkers=2` y lint aprobado. Tipos/build inicialmente fallaron por inferencia de una tupla de prueba; otro trabajo concurrente la tipó y se revalidaron tipos, 12 pruebas focalizadas y build con éxito. La publicación/integración fue observada desde otra sesión (commit de archivos 25e8350); este actor no ejecutó commit/push/despliegue. No se reiniciaron datos ni se enviaron correos. Detalles, entornos y limitaciones en el documento de tarea; sin bloqueo de implementación pendiente.

## EXTRA-078 — Extender el acceso verde hasta las ofertas y separar su inicio móvil

- **Fecha/autorización:** 2026-10-25; pedido explícito: «Quiero que el cuadrante verde abarque el botón de "Ver ofertas disponibles", vaya hasta abajo y se tope directamente con el contenedor de "Ofertas disponibles". Además el cuadrante verde en celular necesita un margen superior para que no esté todo tan junto.»
- **Origen/evidencia:** el pie del enlace es hermano del acceso, por lo que queda fuera de la superficie verde móvil. RED responsive en producción: `The offers shortcut belongs to the same green access quadrant` (`false !== true`). La comprobación inicial se pospuso hasta terminar un build concurrente; no se borraron locks ni se interrumpieron procesos ajenos.
- **Cambio mínimo:** incluir el pie existente dentro del mismo acceso verde, apilarlo bajo la tarjeta en celular y continuar la única superficie hasta el borde de `#ofertas-disponibles`, sin franjas ni márgenes inferiores. Añadir 32px de margen exterior superior móvil, conservando los 32px interiores sobre la tarjeta y 24px por encima/debajo del botón. Mantener composición/posición absoluta del enlace en escritorio y sus anclas, texto, icono y acción.
- **Superficies:** `src/app/(public)/home-hero.tsx`, `home.module.css`, prueba responsive, guía visual y este registro.
- **Riesgo/recuperación:** cambio local reversible de composición; sin formularios, datos, sesiones, permisos ni dependencias. Preservar cambios concurrentes.
- **Estado/verificación:** implementado; RED/GREEN en producción, 15 estados responsive con los tres modos en 1440/1280/768/390/320px aprobados. Se verificaron botón dentro del cuadrante, unión directa con ofertas, margen exterior de 32px, espacio interior preservado, tarjeta blanca, ausencia de recortes/overflow y escritorio/tablet sin cambios. Ancla: 12 escenarios aprobados; transición: 3 viewports con ida/vuelta y movimiento reducido aprobados. Captura móvil inspeccionada. Lint, tipos, build y 1202 pruebas/94 archivos aprobados con Node 24.22.0; unitarias con `--maxWorkers=2` por actividad concurrente. Sin envíos, resets, commits o publicación. Aceptación visual del usuario pendiente.

## EXTRA-077 — Conservar el cuadrante verde de acceso en celular

- **Fecha/autorización:** 2026-10-25; pedido explícito: «En vista de celular quiero que se vea el cuadrante verde derecho del viewport principal, que no desaparezca y que esté sobre el recuadro de login como en la versión de escritorio.»
- **Origen/evidencia:** la media query de Home hasta 767px reemplaza el fondo verde y la sombra del área de acceso por transparencia. RED en navegador de producción reproduce `rgba(0, 0, 0, 0)` donde se requiere el verde institucional `rgb(7, 74, 31)`; escritorio/tablet ya conservan el cuadrante.
- **Cambio mínimo:** retirar esos overrides móviles para reutilizar el fondo y la sombra interna de escritorio detrás de la tarjeta blanca. Conservar 20px laterales y 32px superiores, y añadir 32px inferiores para que el verde rodee la tarjeta completa; aplicar a login y ambos registros sin tocar sus controles. Mantener introducción primero, scroll natural, navbar, fondo animado y pie de ofertas.
- **Superficies:** `src/app/(public)/home.module.css`, pruebas visuales responsive y municipal, `docs/UI_GUIDELINES.md` y este registro.
- **Riesgo/recuperación:** presentación local y reversible; sin permisos, sesiones, datos, dependencias ni cambios de escritorio. Preservar el árbol concurrente.
- **Estado/verificación:** implementado y verificado con Node 24.22.0. RED/GREEN responsive: 15 estados en 1440/1280/768/390/320px, login y ambos registros; verde institucional, tarjeta blanca, sombra, márgenes, altura natural, envío visible sin clipping ni scroll horizontal y escritorio/tablet preservados. Ancla de ofertas: 12 escenarios aprobados, con/sin movimiento reducido. Captura de login móvil inspeccionada. Lint, tipos, build y 1200 pruebas/94 archivos aprobados; unitarias con `--maxWorkers=2` por comprobaciones concurrentes. Un lote de verificación agotó el tiempo del kernel; se repitieron los comandos con resultados observables. `municipal-style-check.mjs` solo actualiza la expectativa del cuadrante; no se ejecutó su matriz general. Sin envíos, resets, commits ni publicación; aceptación visual del usuario pendiente.

## EXTRA-076 — Restaurar navbar superior en celular

- **Fecha/autorización:** 2026-10-25, pedido explícito de Maxi: «Quiero que cambies la navbar en vista de celular nuevamente a la parte superior porque no me gusta como queda ahora.»
- **Origen/evidencia:** revierte la posición inferior de EXTRA-058, no las revisiones posteriores de material, enlaces, sidebar o fondos de los paneles.
- **Cambio mínimo:** navbar fija arriba de 64px en celular; restaurar 88px de inicio de la introducción y de clearance del acceso en Home, y reservar 64px superiores en el workspace compartido. Retirar solamente las reservas inferiores asociadas a la barra inferior. Conservar blanco opaco, ausencia de bordes/sombras, visibilidad móvil y comportamiento de escritorio.
- **Superficies:** módulos CSS de Home y cuenta, pruebas visuales de posición/espaciado y de los tres roles, guía visual y este registro.
- **Riesgo/recuperación:** presentación responsive reversible; sin rutas, datos, autenticación, permisos o dependencias. Preservar cambios concurrentes.
- **Verificación prevista:** RED/GREEN de geometría móvil, navegador de producción a 320/390px y escritorio, anclas y controles fuera del header; geometría de paneles con composición ficticia; lint/tipos/build/unitarias. Sin reset, envíos, commit ni publicación.
- **Resultado observado:** navbar superior implementada. RED en Chromium con CSS real (`top: 780`, esperado 0); GREEN contra build de producción en Home a 320/390px, login/ambos registros, anclas, clearance 88px, contenido final y breakpoint 768px. Captura móvil inspeccionada; prueba de espera/hover desktop y visibilidad móvil PASS con ambas preferencias de movimiento. Corredor renombrado a `tests/visual/home-navbar-mobile-position-check.mjs`. Lint, tipos y build PASS con Node 24.22.0/npm 11.19.1. 31/31 pruebas focalizadas y suite 1200/1200 en 94 archivos con invocación directa de Vitest y `--maxWorkers=2`; las invocaciones anteriores vía npm/Python excedieron su plazo, sin atribuir causa. Diff-check PASS; avisos existentes de Canvas/jsdom y lockfile externo.
- **Limitaciones de la comprobación ampliada:** candidato 68/70 geometrías PASS; perfil a 320px presenta scrollWidth 362px tanto con la posición superior como al reproducir los estilos inferiores anteriores en la misma composición ficticia (no se amplió alcance para corregirlo). Empresa y administrador no completaron sus corredores por fixtures faltantes `referrals.json` y `assisted-detail.json`, respectivamente. No se debilitaron sus aserciones ni se afirma aprobación visual completa de esos paneles. Servidor temporal propio cerrado; sin cambios de datos, reset, commit o publicación. Revisión visual del usuario pendiente.

## EXTRA-075 — Reenvío del correo de confirmación con espera de 30 segundos

- **Fecha/autorización:** 2026-10-25, pedido explícito de Maxi: «muchas aplicaciones utilizan un botón con un timer de 30 segundos debajo del mismo registro que sirve para reenviar el correo de confirmación. Eso hay que hacer». También confirmó que un usuario con sesión iniciada no debe pedir recuperación desde Home (queda como está) y aprobó los detalles cosméticos del aviso de acceso.
- **Problema/evidencia:** al retirar `/verification-pending` (EXTRA-073) y el layout de registro anterior (EXTRA-072) desapareció el único acceso de auto-servicio para reenviar la verificación. Quien no recibe el correo no tiene forma de pedir otro en el flujo de registro.
- **Cambio/justificación:** tras un registro enviado con respuesta segura, la tarjeta deja de ser un formulario y muestra un estado de confirmación compacto: título «Revisá tu correo electrónico» (enfocado), respuesta segura, el reenvío con su espera y un acceso para volver a iniciar sesión. Se retiran juntos el selector de tipo de cuenta, el formulario y la nota de campos obligatorios. El reenvío usa la acción existente (`verificationAction`, respuesta no enumeradora), apunta al correo capturado en el envío y queda deshabilitado con una cuenta regresiva de 30 segundos. Reutiliza el `Button` compartido y los tokens existentes; sin campos, acciones ni mensajes nuevos en el servidor.
- **Superficies afectadas:** `src/features/accounts/components/resend-verification.tsx` y su módulo CSS; `home-access-panel` (estado de confirmación), `candidate-registration-form`, `company-registration-form` (`onSent`), `home.module.css`, pruebas de componentes, guía visual y notas de producto.
- **Riesgo/recuperación:** presentación y temporizador del lado del cliente sobre una acción existente; no cambia autenticación, autorización, enumeración, esquema ni datos. Revertir el componente, el estado de confirmación y las dos llamadas `onSent` restituye el comportamiento anterior.
- **Revisión solicitada 2026-10-25:** «El botón de reenvío con timer de 30 s bajo el registro estira demasiado el frame de login y registro y en la versión de escritorio alarga mucho el viewport principal que debería abarcar solo la pantalla.» El bloque dejó de agregarse debajo del formulario y pasó a ser un estado de confirmación que reemplaza todo el contenido del registro en la misma tarjeta: 738 px → 372 px medidos a 1440×900, con el hero en 900 px exactos. Volver a «Registrarse» conserva los datos ingresados (corrección posterior); cambiar de rol monta el otro formulario.
- **Verificación prevista:** RED/GREEN con temporizadores falsos para la cuenta regresiva, el envío con el correo capturado y el reinicio tras reenviar; presencia en ambos registros y ausencia antes de un envío exitoso; 44px y accesibilidad del control; suite, lint, tipos y build; comprobación en navegador contra el Supabase local con un alta ficticia `@example.invalid` (correo capturado por Mailpit, sin publicación). Revisión independiente al cierre. Sin reinicios de datos, altas reales, commits ni publicación.
- **Corrección reportada 2026-10-25:** «El botón de "Volver a iniciar sesión" no funciona y si cambio de pestaña desaparece directamente revisar tu correo electrónico, de última me gustaría que cuando seleccione nuevamente "Registrarse" los datos ingresados se mantengan». El formulario enviado se mantiene montado pero oculto (`hidden`) mientras se muestra la confirmación y mientras el ingreso está activo tras un envío, de modo que volver a «Registrarse» —o pasar por ingreso y regresar— restituye todos los valores y registrarse otra vez es un clic. El acceso de vuelta ahora cambia el modo a ingreso además de navegar a `/`, y la URL queda limpia. `onSent` se pasa con identidad estable (`useCallback`) para no reejecutar el efecto del formulario.
- **Estado/verificación observada:** implementado y verificado. 9/9 pruebas nuevas (`tests/components/accounts/resend-verification.test.tsx`) con temporizadores falsos: espera de 30 segundos, reenvío al correo capturado, reinicio de la espera, reemplazo del formulario por la confirmación en ambos roles, conservación de los valores al volver a «Registrarse» y al pasar por la pestaña de ingreso, nuevo alta con los datos conservados, y vuelta al ingreso desde el acceso directo. Lint, `tsc --noEmit` y `npm run build` PASS. Comprobación real contra el build de producción propio (`resend-check-69845245@example.invalid`, Supabase local, correo en Mailpit): tarjeta 738 px → 372 px, hero 900 px = viewport, sin desborde a 1440×900 ni 390×844, formulario no visible, 30 s → habilitada → reenvío con mensaje seguro y espera reiniciada, formulario restituido con los datos, nueva alta directa a la confirmación y «Volver a iniciar sesión» mostrando el ingreso con la URL limpia en `/`. `tests/visual/retired-routes-check.mjs` PASS sobre el mismo build. No se ejecutaron los E2E de Playwright (el wrapper reinicia datos). Las altas ficticias locales quedan en la base local, que el corredor de aceptación reinicia; no se publicó nada. Riesgo: presentación y temporizador de cliente sobre una acción existente.

## EXTRA-074 — Badge de estado unificado en todas las superficies

- **Fecha/autorización:** 2026-10-25, pedido explícito de Maxi: reusar el
  componente Badge de shadcn como indicador de estado con «un rectángulo con los
  bordes laterales redondos con un círculo en la izquierda de color y a la
  derecha el texto que indique el estado», con «los colores en el fondo más
  clarito, en el círculo interior el color real y un borde con el color real» y
  que «esos estados aparezcan en todos lados y páginas donde correspondan». La
  enumeración de estados, tonos y superficies fue aprobada sin cambios por Maxi
  el 2026-10-25 («Así está perfecto, no cambio nada»).
- **Problema/evidencia:** el mismo hecho se muestra hoy con cuatro tratamientos
  distintos y sin semántica de color: `<Badge>` genérico en postulaciones,
  `variant="secondary"` en ofertas de empresa, texto plano «Estado: **X**» en
  las páginas administrativas, un punto verde/ámbar propio en el panel de perfil
  y mapas de etiquetas duplicados dentro de `admin/empresas` y `admin/imports`.
  El color, cuando existe, no distingue error de espera de cierre.
- **Cambio:** tokens semánticos de estado en `src/app/globals.css` (seis tonos ×
  color real y fondo tenue), variante `status` en `src/components/ui/badge.tsx`
  que dibuja el punto con `bg-current` y conserva intactas las variantes
  `default`, `secondary` y `outline`; catálogo único
  `src/domain/presentation/status-tone.ts` con el mapeo estado → tono por
  catálogo y el helper `statusTone()`; migración de las 19 superficies
  aprobadas; eliminación de los dos mapas de etiquetas locales.
- **Superficies afectadas:** `globals.css`, `components/ui/badge.tsx`,
  `domain/presentation/status-tone.ts`, diez páginas de `(admin)`, el panel de
  cuenta y postulaciones del candidato (`dashboard-content`,
  `participations-content`, `candidate-profile-panel`), `/account`, las dos
  superficies de empresa y el panel de derivación, más pruebas de componentes y
  `docs/UI_GUIDELINES.md`.
- **Riesgo/recuperación:** item 3 acotado, porque cambia el marcado y el texto
  visible que ya consumen pruebas de componentes y E2E (se actualizan en el
  mismo trabajo); sin cambios de datos, esquema, permisos ni dependencias. No se
  tocan los `<select>` de filtro y decisión, ni los historiales de moderación y
  auditoría, ni las páginas públicas de ofertas. Revertir los tokens, la
  variante y el catálogo restituye el comportamiento anterior.
- **Verificación prevista:** prueba unitaria del catálogo de tonos y de la
  variante; suite de componentes y unitaria; `npm run lint`, `npm run
  typecheck` y `npm run build`; comprobación visual en navegador de las
  superficies administrativa, candidato y empresa, en escritorio y móvil.
- **Estado/verificación observada:** implementado y verificado localmente.
  Commits `e050e72` (tokens, variante y catálogo), `bfc764d` (superficies
  administrativas), `1f1b2bd` (panel del candidato y cuenta), `5c4a572`
  (superficies de empresa), `ae0c1b0` (prueba sobre páginas administrativas) y
  `d2466ea` (alto mínimo por variante). Suite completa 1190/1190; `npm run
  build` PASS con `tests` excluido del `tsconfig` (restaurado sin diferencias);
  `eslint` limpio sobre los archivos del cambio; `tsc` sin errores propios. Los
  tres errores de `tests/components/home-registration-navigation.test.tsx` y el
  aviso de `src/features/accounts/components/resend-verification.tsx` pertenecen
  al trabajo concurrente de la otra sesión. Sin commit de este archivo ni de
  `docs/UI_GUIDELINES.md` porque ambos ya traían cambios ajenos sin confirmar;
  su contenido está escrito en el árbol de trabajo. Sin push, PR ni despliegue.

## EXTRA-073 — Avisos de ciclo de cuenta dentro del acceso de Home

- **Fecha/autorización:** 2026-10-25, pedido explícito de Maxi: «/account-suspended: borrar la página y que aparezca el mensaje directamente en el recuadro de login en Home, estilizado acordemente /recovery-invalid: borrar la página y que el formulario y mensaje aparezca directamente en el recuadro de login /session-expired: borrar la página y que el mensaje aparezca directamente en el recuadro de login /verification-expired: cambiar el estilo de la página y que quede estilizado acorde a Home /verification-pending: borrar la página, es innecesaria y podría parecer como un mensaje informativo en el recuadro de registro».
- **Problema/evidencia:** cuatro rutas de estado de cuenta (`account-suspended`, `recovery-invalid`, `session-expired`, `verification-pending`) son pantallas separadas con su propio armazón, aunque el acceso real vive en Home. `requireActiveAccount`, `loginAction` y `/auth/callback` siguen redirigiendo a ellas.
- **Cambio:** un catálogo sin dependencias (`src/features/accounts/access-notices.ts`) define los estados válidos de `?acceso=` y sus destinos. El recuadro de acceso de Home renderiza el aviso: suspensión solo con el mensaje (el formulario no puede prosperar), sesión vencida con mensaje y formulario de ingreso, enlace de recuperación inválido con mensaje y formulario de recuperación. Las cuatro rutas se retiran con 404 real, no con redirecciones. `/verification-expired` conserva su URL y formulario y adopta la superficie municipal de Home. Un aviso compartido (`AccessNotice`) usa los tokens y la tipografía existentes, sin paleta nueva.
- **Superficies afectadas:** `access-notices.ts`, `components/access-notice.tsx` y su módulo CSS, `home-access-panel`, `home-hero`, `(public)/page.tsx`, `lib/auth/guards.ts`, `features/accounts/actions.ts`, `auth/callback/route.ts`, `(auth)/verification-expired`, las cuatro carpetas de ruta retiradas, pruebas de componentes y de navegador, corredor de rutas retiradas, guía visual y notas de producto.
- **Riesgo/recuperación:** item 3, retiro de rutas que otros consumidores ya usan (guardias, callback de Auth, pruebas E2E y documentación). Sin cambios de datos, permisos, esquema ni dependencias. Revertir el catálogo, los tres destinos y las carpetas restituye el comportamiento anterior.
- **Verificación prevista:** prueba de estado en el panel de Home y de las rutas retiradas en 404 HTTP sin `Location`; formularios y accesibilidad de la tarjeta en los tres estados; movimiento reducido y móvil; suite de componentes, lint, tipos y build; corredor visual de rutas retiradas y capturas de `/verification-expired`. Revisión independiente de solo lectura al cierre. Sin reinicios de datos, altas reales, commits ni publicación.
- **Estado/verificación observada:** implementado y verificado localmente. 46/46 pruebas enfocadas (catálogo de estados, los tres avisos de Home, páginas de acceso, icono informativo) y 1181/1181 pruebas unitarias; el único archivo que no carga es `tests/components/accounts/registration-pages.test.tsx`, cuyo mock de `recoveryAction` pertenece a trabajo concurrente ajeno a este cambio. ESLint limpio y `tsc --noEmit` limpio para `src/**` (proyecto temporal que excluye `tests/`, porque `npm run typecheck` y `npm run build` hoy fallan por `ByRoleOptions.exact` en dos pruebas de registro de la otra sesión). `tests/visual/retired-routes-check.mjs` PASS contra el servidor de desarrollo: 10 rutas retiradas × 4 variantes de consulta × GET/HEAD responden 404 sin `Location`, y los tres estados de Home más `/verification-expired` se comprueban en navegador real. Capturas a 1440×900 y 390×844 sin desborde horizontal. No ejecutados: build, e2e completo (bloqueado por esos errores ajenos y por el reinicio de datos); sin commits, push ni publicación. Riesgo: item 3, retiro de rutas consumidas por guardias, callback y pruebas.

## EXTRA-072 — Unificar los accesos de registro en Home

- **Fecha/autorización:** 2026-10-25, pedido explícito: «Fijate en Home que los botones al final de la página de "Registrarme como postulante" y "Registrar empresa" redirigen a /registro/empresa y /registro/candidato No quiero que esas páginas existan y los botones deberían hacer solamente que el scroll de la página suba automáticamente arriba de todo y enfoque al recuadro correspondiente.»
- **Problema/evidencia:** los accesos de cierre y tarjetas de Home, catálogo y detalle todavía enlazan dos páginas duplicadas. Ocho pruebas RED reproducen la navegación incorrecta, la falta de selección/foco y la existencia de las rutas.
- **Cambio/justificación:** los accesos internos seleccionarán el registro correspondiente sin abandonar Home; subirán a `scrollY=0` y enfocarán `#acceso` sin alterar permisos ni acciones. Los enlaces externos usarán Home con un parámetro de registro validado. Retirar las dos páginas con respuesta 404, no redirecciones; preservar los formularios reutilizables y sus validaciones.
- **Superficies afectadas:** navegación de registro de Home, `home-hero`, `home-access-panel`, dos rutas `/registro/*`, accesos del catálogo/detalle y pruebas/documentación que consumen estas páginas.
- **Riesgo/verificación:** item 3, retiro de rutas existentes; pruebas de modos, clic/teclado repetidos, foco, desplazamiento completo, movimiento reducido, móvil, enlaces externos y 404 HTTP sin `Location`. Revisar de forma independiente el cambio después de sus comprobaciones. No ejecutar wrappers que reinician datos ni enviar altas reales.
- **Estado/verificación del pedido:** el árbol actual ya contiene la implementación. Comprobación propia en producción local: 24 escenarios de los accesos internos aprobados (1440/768/390, clic/Enter, ambos roles, movimiento normal/reducido), incluyendo `scrollY=0`, foco en `#acceso`, URL conservada y reutilización del formulario. Los accesos de las tarjetas también aprobaron; GET/HEAD de las dos rutas retiradas devolvieron 404 sin `Location`. Revisión independiente `deleg_c47653f3` confirmó los botones y las respuestas HTTP; no encontró un defecto en los botones solicitados. Cero solicitudes de mutación, sin registros, reinicios de datos, commits ni publicación.
- **Verificación general y limitación separada:** con Node 24.22.0/npm 11.19.1 se observaron lint, tipos, build y 1199 pruebas/94 archivos aprobados (`--maxWorkers=2`) antes de nuevos cambios concurrentes; no se atribuye ese resultado a una revisión inmutable del árbol actual. El corredor ampliado conservado en el repositorio falló intermitentemente al abrir directamente `/?registro=empresa`: llegó a `scrollY=0` y seleccionó el rol, pero el foco quedó en `BODY` en un caso móvil con movimiento reducido. Esa entrada directa es distinta de activar los botones internos, que aprobaron. La causa no quedó demostrada; no se relajó su aserción ni se cambió el código de los botones para ocultarla. Diagnóstico de foco de entrada directa pendiente; revisión visual del usuario pendiente. Riesgo: item 3, retiro de rutas.

## EXTRA-071 — Shared dashboard canvas width

- **Date/authorization:** 2026-10-25; Maxi approved the proposed 1280px maximum shared canvas and local branch name `feature/dashboard-ui-refinements`: «Bien, estoy de acuerdo con ambas cosas».
- **Evidence/change:** The three roles share `DashboardShell` and a 960px canvas cap. Increase only that cap to 1280px, retaining flexible width, centering, 264px desktop sidebar, 24px desktop and 16px mobile gutters, natural height and existing content.
- **Surfaces:** shared account CSS, three workspace visual regressions, UI guide and current specification clarification. Rename the local branch only; preserve unrelated changes, with no commit, push, account submission or database reset.
- **Risk/recovery:** item 3, shared presentation used by three roles; no component API change. Revert only this cap and its current expectations if needed.
- **Verification plan/status:** recorded before the CSS edit. Geometry RED rejected the old 960px cap. Lint, typecheck, production build and all 1170 tests/89 files passed (existing jsdom Canvas warnings). Independent Node 24.22.0 composition checks passed: candidate 23/23, company 23/23, admin/account 68/68. Paired browser checks compared identical current CSS with only the cap changed: candidate 68/70, company 84/84 and admin 210/210 at both caps; all 104 mobile comparisons were geometrically identical. The candidate profile file input overflows at 320px under both motion preferences identically before/after; company referrals and admin assisted-detail fixtures remain missing/unverified. No change-caused blockers; no assertions suppressed. Full authenticated/resetting E2E was not run for this visual increment. Parent spot-check confirmed branch and diff-check. Evidence: scratch `dashboard-width-independent-BrAicr/summary.json` and `results.json`. Implemented and independently checked locally; human visual acceptance pending. No commit/publication.

## EXTRA-070 — Candidate profile heading inset and photo-upload diagnosis

- **Authorization:** Maxi reported: «La primera parte de la sección "Perfil" está muy pegada al margen del lienzo, agrega un padding o margen igual que el resto del lienzo. Todavía no se puede cargar imagen.»
- **Evidence:** Profile heading is outside its padded panel and has zero top/left inset. Browser regression reproduces ten profile failures across viewport/motion combinations; the other forty combinations pass.
- **Minimal layout fix:** Add a candidate-profile-only heading inset matching its panel: 28px desktop, 20px top/16px sides below 640px. Preserve panel padding, shared canvas/sidebar and unrelated dirty CSS. Avoid doubling the heading-to-photo gap.
- **Photo scope:** Investigate the current form/API/service failure before changing it. No remote credentials, remote database operations, migration application or local data reset authorized by this entry.
- **Surfaces/checks:** Candidate renderer, scoped heading CSS, visual regression and UI guide. Layout implemented: all ten heading inset/alignment checks now pass. Overall visual runner has 48 passes and two 320px failures: the file input extends to 335px; a browser probe restoring the original heading still reproduces the same overflow, so it is not caused by the new padding. No assertion was relaxed. Node 24.22.0/npm 11.19.1 gates pass: lint, typecheck, production build, 1170 unit tests/89 files and diff-check. Functional photo changes still require actual causal evidence and their own verification; image diagnosis pending. Human review pending; no commit/publication.

## EXTRA-069 — Mobile collapsible shared sidebar

- **Date/authorization:** 2026-10-25; explicitly requested by Maxi: «Quiero que las sidebar de los paneles (admin, empresa y postulante) en celular pueda retraerse. Agrega debajo el ícono de flecha doble hacia abajo color verde con forma circular y cuando esté retraida se vea la foto de perfil, el nombre de la cuenta y el correo, ese clúster de información.»
- **Evidence/change:** all three roles share DashboardShell. Add a bounded client controller around its server-rendered navigation, logout and identity. On mobile only, a circular green double-chevron control below identity hides/shows navigation and logout while keeping the existing avatar, account name and verified email visible. Preserve the current initially expanded state and desktop layout; no persistence, photo-storage or identity-service changes.
- **Scope:** shared shell/controller, account CSS, focused tests, browser interaction proof and UI guide. Reuse the official adapted Button and existing Lucide icons; no new dependencies or changes to guards/actions.
- **Risk/recovery:** item 3, shared presentation consumed by three roles. Preserve shell props and desktop behavior; revert this increment only if necessary. Existing untracked brand directories remain untouched.
- **Verification plan/status:** recorded before implementation. Observe interaction RED, then focused and full unit/component regressions, lint, types, production build, real client interaction at mobile/desktop breakpoints and reduced motion, and independent review. No database reset, real account submission, remote operation, commit or publication. Human review pending.
- **Observed verification:** implemented locally. Three interaction expectations observed RED, then 118/118 focused regressions (independently repeated and parent spot-checked) and 1170/1170 full unit/component tests; lint, typecheck, production build and diff-check passed using Node 24.22.0/npm 11.19.1. Browser proof rendered the actual client controller with actual server-composed fixture markup/CSS: six combinations at 320/390/767px with normal/reduced motion, mouse/Enter/Space, retained identity, inaccessible hidden links/logout and desktop/mobile resizing all passed. Captures inspected. No authenticated database or deployment proof claimed.
- **Independent review/limitations:** no change-caused blockers. Candidate geometry 48/50 both here and on baseline a2001e5: existing profile overflow at 320px under both motion preferences. Desktop sidebar/navbar/first-link geometry unchanged in 30/30 baseline comparisons. Company 60/60 and admin 150/150 available fixture geometries passed; stock runners reference missing referrals/assisted-detail fixtures, so those sections remain unverified by that matrix. Concurrent account/profile work preserved; these results describe the checked sidebar increment, not acceptance of those other changes. Human acceptance pending; no commits/publication.

## Aviso de numeración — ids 056 a 068 duplicados (2026-10-24)

Este archivo registra dos líneas de trabajo que avanzaron en paralelo sobre bases distintas y
usaron el mismo espacio de ids `EXTRA`. Los ids 056 a 068 aparecen **dos veces con contenido
distinto**: una entrada de `main` (PRs #67 a #72) y otra de la rama
`fix/landing-unified-access`. Se conservaron los dos textos sin reescribir el registro; para leer
o citar una entrada hay que mirar el título, no solo el número.

| Id | Entrada de `main` | Entrada de `fix/landing-unified-access` |
| --- | --- | --- |
| EXTRA-056 | Alta presencial activa y aceptación expresa en una transacción | Retirar rutas duplicadas de candidato y login |
| EXTRA-057 | Categorías laborales como única selección del candidato | Avisos informativos azules en el acceso de Home |
| EXTRA-058 | Retirar nominación desde el perfil candidato | Navbar inferior en celular |
| EXTRA-059 | Atención presencial dentro del perfil administrativo | Rebuild candidate profile and persist private photos |
| EXTRA-060 | Orden de tarjetas en perfiles presenciales | Animated gradient behind the profile canvas |
| EXTRA-061 | Historial resumido de cuenta y perfil del candidato | Alternate endpoint-color gradient and photo availability repair |
| EXTRA-062 | Ofertas empresariales, derivaciones y moderación | Etiqueta del acceso al panel según la cuenta activa / Slower pure-CSS profile gradient |
| EXTRA-063 a 068 | No usados | Complete local photo repair, Ingresar vuelve al inicio, Candidate account sidebar, Shared candidate and company dashboard frame, Cambio suave entre introducciones, Shared administrator dashboard frame |

Las referencias `EXTRA-056` a `EXTRA-068` en `specs/plan.md`, `specs/data-model.md`,
`specs/.../contracts/authorization-matrix.md`, `docs/UI_GUIDELINES.md` y
`docs/implementation/candidate-profile-photos.md` se leen igual: el id identifica el registro
junto con el título de la sección que lo cita.

## EXTRA-068 — Shared administrator dashboard frame

- **Date/status:** 2026-10-24; recorded before implementation, explicitly requested by Maxi.
- **Request:** “Quiero hacer en el dashboard de administradores lo mismo que hicimos en el dashboard de usuarios y empresas: navbar, sidebar, lienzo en blanco, etc. Copia el formato pero con la información que hay en la cuenta de administradores.”
- **Evidence/change:** AdminShell still has separate header/sidebar geometry. Reuse DashboardShell and the existing account CSS without changing candidate/company chrome. Preserve administrative information, contextual navigation, forms, internal-use notice, routes and page-local authorization. White canvas means the shared white content surface, not removal of information.
- **Scope:** AdminShell, admin page verified-email props, administrator account presentation, focused component tests, offline visual runner and UI guide. No schema, service, dependency, persistence or authorization changes. Loading shells keep truthful unavailable-email fallback.
- **Identity:** Administración fallback and verified session email; do not fabricate a stored personal name. Keep logout once in the sidebar and existing password and peer-administration controls inside the account canvas.
- **Risk/recovery:** shared administrative presentation affects existing route consumers (item 3); preserve public shell props and contextual links. Revert only this increment, preserving unrelated dirty work.
- **Verification plan:** observe composition RED, focused regressions, full unit suite, lint, typecheck, production build, desktop/mobile real-markup geometry with mocked fictitious services, independent read-only review. No database resets, live account submissions, remote operations, commits or publication.
- **Observed verification:** 16 frame expectations observed RED before source edits. Node 24.16.0: 977/977 unit/component tests in 70 files; lint, typecheck, production build and diff-check pass. Offline Chromium proof: 160/160 geometries across 16 compositions, five viewport widths and both motion preferences; actual rendered JSX/CSS with fictitious services. Native disclosures expanded to verify complete forms; closed details initially produced false containment failures. Desktop account and mobile companies screenshots inspected. Existing jsdom Canvas and external-lockfile warnings remain. No live authentication/database proof or deployment claimed.
- **Review:** independent read-only verification found no functional blockers; 107/107 focused tests in six files and diff-check pass. Parent spot check repeats that command. Corrected this entry's ID to EXTRA-068 because EXTRA-067 already describes Home animation. Implemented and verified locally; human acceptance pending. No commit or publication. Risk: item 3 (existing administrative shell consumers), covered by regressions and independent review.

## EXTRA-066 — Shared candidate and company dashboard frame

- **Date/status:** 2026-10-24; recorded before implementation, explicitly requested by Maxi.
- **Request:** “Quiero hacer en el dashboard de empresas lo mismo que hicimos en el dashboard de usuarios: navbar, sidebar, lienzo en blanco, etc. Copia el formato pero con la información que hay en la cuenta de empresa.” Follow-up: “Ten en cuenta que si hago un cambio en el estilo de la sidebar de usuario quiero que se replique en la de empresa, lo mismo con los estilos del dashboard en general.”
- **Evidence/change:** company pages still use a horizontal navigation shell. Extract the existing candidate frame into one shared DashboardShell, retaining the same CSS module, navbar, sidebar primitives, logout and email treatment. Both roles consume it; company routes retain their existing content, forms and destinations, including company account settings.
- **Scope:** shared dashboard component; candidate/company presentation shells; company route identity props; company branch of account page; focused tests, visual proof and UI guide. No service, authorization, schema, dependency or persistence changes.
- **Identity:** persisted company legal name and verified login email, with truthful missing-profile fallback. Existing route guards remain unchanged; do not substitute editable contact email for session email.
- **Risk/recovery:** shared presentation affects both roles; preserve candidate DOM/classes and regressions. Revert only this increment if necessary, preserving the pre-existing dirty tree.
- **Verification:** failing company composition test first; company/candidate/navbar regression tests, lint, typecheck, production build, read-only desktop/mobile geometry fixtures. No fixture reset, account submissions, remote operation, commit or publishing.
- **Observed verification:** initial company frame RED: 6 failures (missing sidebar); account frame RED: 1 failure. Final suite: 962/962 tests in 70 files. Lint, typecheck, production build and diff-check pass. Chromium with real component markup/CSS and fictitious mocked services: company 70/70 geometries, candidate 50/50 (1440/1024/768/390/320px, normal/reduced motion). Desktop dashboard/mobile profile screenshots inspected; no live authentication, database submission or deployment proof claimed. Existing jsdom Canvas notices and external-lockfile build warning remain.
- **Review:** independent read-only shared-presentation review found no change-caused blockers; focused regression 74/74 in 6 files, repeated by parent with the same result; diff-check passes. Implemented and checked locally. No commit, publication or product acceptance implied. Risk: item 3 (shared presentation reused by both account roles), covered by own regressions, browser fixtures and independent review.

## EXTRA-065 — Candidate account sidebar section

- **User correction (current scope):** «Me confundí, quise decir el botón de "Cambiar contraseña", el botón de Cerrar sesión estaba bien en la sidebar». This supersedes the original placement recorded below: keep Cuenta, move the existing `/update-password` shortcut there and restore the unchanged logout form above sidebar identity. Three corrected expectations observed RED before source changes. Corrected placement passes 955 unit tests/70 files, lint, typecheck, build, diff-check and all 50 standalone visual combinations; both base paths and unchanged mocked logout invocation are covered. No live session mutations, commits or publication. Human review pending.
- **Authorization:** Maxi explicitly requested: «Quiero que crees una nueva opción en la sidebar llamada "Cuenta" y muevas el botón de "Cerrar sesión" ahí.»
- **Evidence and scope:** The candidate sidebar currently submits logout from its footer. Add `section=cuenta` to its existing section navigation and move the same logout form/action into that view. Preserve password access, identity, existing sections, default dashboard and company/admin behavior. No authentication, schema or session-service changes.
- **Affected files:** `candidate-account.tsx`, its scoped CSS, candidate component tests and `docs/UI_GUIDELINES.md`.
- **Risk and checks:** Presentation-only relocation; retain POST/server-action submission. RED observed: five failing assertions for the missing Cuenta section and outdated navigation, with 18 existing tests passing. Verify both `/account` and `/dashboard`, action invocation, existing sections, responsive layout, unit suite, lint, types and build. No live logout or acceptance database reset.
- **Status:** Implemented and verified. Both base paths render Cuenta and invoke the unchanged mocked logout action on form submission. All 23 focused tests and 955 unit tests/70 files pass; lint, typecheck, build and diff-check pass. Standalone browser proof passes 50 combinations of five sections, five viewport widths and two motion preferences, including logout placement, touch target and keyboard focus. Uses fictitious service fixtures, not a live authenticated session. Human review pending; no commit or publication. Existing non-blocking canvas-jsdom and external-lockfile warnings remain.

## EXTRA-064 — Ingresar vuelve al inicio completo de Home

- **Autorización:** pedido explícito de Maxi: «Revisa que cuando clickeas "Ingresar" en la navbar en Home no sube hasta arriba de todo. Arregla eso.»
- **Evidencia:** el enlace apunta a `#acceso`, que alinea el recuadro en lugar del comienzo del documento. Dos pruebas RED reproducen ese destino incorrecto.
- **Cambio mínimo:** utilizar el destino nativo `#contenido`, ya único y enfocable, también en Ingresar. Conservar Mi cuenta, los destinos por rol, Inicio, registros, movimiento reducido y comportamiento responsive de la navbar. El destino propio `#acceso` se conserva para otros enlaces.
- **Superficies:** `home-navbar.tsx`, pruebas de navbar/portada/navegación visual y guía visual.
- **Verificación:** implementado. Dos regresiones observadas en RED y luego 31 pruebas focalizadas y 950 pruebas/70 archivos aprobadas; lint, tipos, build y diff-check aprobados con Node 24. Navegador de producción propio: Ingresar vuelve a scrollY0 y enfoca main mediante clic y Enter repetidos a 1440/768/390/320px; 12 comprobaciones de formularios también aprobadas, sin solicitudes de mutación. Se esperó el final del scroll suave antes de la segunda activación para no interrumpirlo desde el runner. Servidor propio cerrado. Sin datos, commits ni publicación; revisión del usuario pendiente.

## EXTRA-062 — Etiqueta del acceso al panel según la cuenta activa

- **Fecha/autorización:** 2026-10-24; pedido explícito: «Cuando tengo la sesión iniciada como empresa y vuelvo a Home el botón que aparece en el recuadro de Login dice "Ir al panel de usuario" cuando debería decir "Ir al panel de empresa". Lo mismo pasará con admin. Arregla eso.»
- **Problema/evidencia:** `getSiteAccess` asigna a todos los roles `Panel de usuario` y el recuadro repite una etiqueta fija; seis pruebas RED reproducen el defecto para empresa y administración.
- **Cambio/justificación:** proyectar la etiqueta del panel desde el rol ya verificado y pasarla al recuadro: usuario, empresa o administración. Conservar destinos, estado de sesión, permisos, registros y estilo; no inferir la identidad a partir del selector de registro.
- **Archivos afectados:** `src/features/accounts/navigation.ts`, `src/app/(public)/page.tsx`, `home-access-panel.tsx`, pruebas de navegación/portada/recuadro, expectativa E2E y guía visual.
- **Verificación/riesgo:** comprobar los tres roles, etiquetas y destinos antes/después de cambiar de pestaña; mantener anonimato/cuentas no activas sin acceso y defaults de componentes. Es un cambio de presentación, no de autorización. No ejecutar el wrapper E2E que reinicia datos.
- **Estado/verificación:** implementado; 44 pruebas focalizadas y 929 pruebas/70 archivos de la suite completa aprobadas con Node 24. Lint, tipos, build y `git diff --check` aprobados. Se probaron etiquetas y destinos de los tres roles, retorno desde ambos registros, ausencia del acceso durante el registro y guardas existentes para cuentas no activas. Destinos y verificación de sesión sin cambios. Expectativa E2E actualizada, sin ejecutar el wrapper que reinicia datos ni iniciar sesiones reales. Avisos no bloqueantes existentes de Canvas/jsdom y lockfile externo. Sin commits ni publicación; revisión visual del usuario pendiente.

## EXTRA-058 — Navbar inferior en celular

- **Fecha/estado:** 2026-10-23; registrado antes de implementar, por pedido de Maxi.
- **Origen:** «Quiero que en vista de celular la navbar aparezca en la parte
  inferior de la pantalla en lugar de arriba».
- **Cambio mínimo:** por debajo de 768px, fijar la navbar compartida al borde
  inferior con espacio para el área segura del dispositivo. Mantener vidrio,
  enlaces y visibilidad móvil. Reservar espacio inferior en Home y el panel de
  cuenta; quitar sus reservas superiores obsoletas y adaptar el ancla de acceso.
  Escritorio y su espera de 2 segundos no cambian.
- **Superficies:** `home.module.css`, `account/account.module.css`, guía visual,
  comprobaciones visuales de navbar/acceso/layout y este registro.
- **Riesgos/recuperación:** CSS responsive acotado, sin datos, permisos o rutas
  nuevos. No extender la navbar a otros shells. Reversible en las media queries.
- **Verificación prevista:** RED/GREEN de geometría real a 320/390px y 768px,
  tres modos, anclas y espacio al final del documento; unitarias/lint/tipos/build.
  Sin envíos, reset, commit o publicación.

- **Resultado EXTRA-058:** implementado y verificado localmente. RED de navegador
  confirmó navbar arriba; GREEN a 320px y 390px en login y ambos registros,
  con clics reales en Ingresar/Inicio/ofertas y 24px libres entre el último
  contenido y la barra al final del scroll. A 768px vuelve arriba. Capturas
  móviles inspeccionadas; fixture con CSS real del workspace confirma reserva
  inferior móvil de 88px y padding superior desktop de 64px intacto. El código
  contempla safe-area, sin afirmar prueba física de notch/teclado iOS.
  Suite 864/864 en 64 archivos, lint/tipos/build/diff-check PASS; avisos de
  Canvas en jsdom y lockfile externo preexistentes. Servidor propio cerrado.
  Sin datos modificados, commit o publicación; revisión del usuario pendiente.

Registro de requisitos derivados y ajustes técnicos necesarios para cumplir tareas
aprobadas. No sustituye la constitución ni los artefactos de Spec Kit, y no convierte
una propuesta en una decisión municipal aprobada.

## EXTRA-057 — Avisos informativos azules en el acceso de Home

- **Ajuste solicitado antes de implementar:** «En lugar de un caracter unicode o ascii pon un ícono sacado de donde sacaste el resto de íconos. Y el color podría ser este #5758D6, anotalo en global.css como variable para mensajes informativos de este tipo». Se sustituye el prefijo generado por `Info` de `lucide-react`, dependencia existente, y se añade `--color-feedback-info: #5758D6` en `src/app/globals.css`. El icono es decorativo, solo con contenido informativo, sin modificar acciones ni defaults standalone. Pruebas nuevas observadas en RED: faltaban iconos SVG y token global.
- **Resultado del ajuste:** implementado en los tres formularios y el aviso de sesión activa, conservando textos, foco, regiones vivas y errores rojos; eliminado el prefijo Unicode del CSS. Los SVG heredan exactamente `#5758D6` mediante el token global. Nuevas pruebas de componentes: 15 casos; comprobación focalizada: 30 pruebas; suite completa: 864 pruebas/64 archivos. Lint, tipos, build y diff-check aprobados con Node 24. Navegador: seis fixtures de estilo y seis escenarios de validación aprobados, defaults standalone intactos y cero mutaciones; captura móvil inspeccionada. Sin altas reales, cambios de sesión, dependencias nuevas, commits ni publicación. Revisión visual del usuario pendiente. La verificación inicial descrita abajo corresponde a la versión anterior con glifo, reemplazada por este ajuste.

- **Fecha/autorización:** 2026-10-23, solicitud explícita de Maxi: «Quiero que los mensajes informativos al hacer click en "Registrarse" o "Ingresar" aparezcan de color azul con el icono típico "🛈". Por ejemplo el de "Si los datos son válidos, recibirás un enlace para verificar tu correo. Revisá también spam."».
- **Problema/evidencia:** los resultados informativos usan párrafos `role="status"`, pero el estilo local de Home les asigna el mismo color neutro que a las explicaciones estáticas.
- **Origen/alcance:** presentación de respuestas en el acceso existente; no cambia acciones, validación, sesiones ni la respuesta antienumeración.
- **Cambio propuesto/justificación:** aplicar azul e icono decorativo a los avisos no vacíos, conservando en rojo los errores y sin iconos en estados vacíos. Mantener textos, regiones vivas, foco y formularios de otras páginas.
- **Archivos/contratos afectados:** `src/app/(public)/home.module.css`, comprobación visual local y `docs/UI_GUIDELINES.md`; sin cambios de contratos o dependencias.
- **Riesgo/verificación:** comprobar estilos calculados de mensajes informativos, errores y estados vacíos en los tres modos, escritorio y móvil. Las muestras visuales son fixtures de DOM explícitos; no envían formularios ni simulan respuestas del proveedor.
- **Estado/verificación:** implementado exclusivamente en el CSS local de Home. RED de navegador reprodujo texto neutro en lugar de azul; GREEN aprobó seis combinaciones de modo/viewport con avisos azules, icono decorativo, foco/región viva preservados, errores rojos y estados vacíos ocultos. La comprobación independiente de marcadores también aprobó seis combinaciones y sus defaults standalone; ambas sin solicitudes de mutación. Se inspeccionó la captura del fixture móvil para confirmar que el símbolo no fuera un glifo ausente. Vitest: 849 pruebas/63 archivos; lint, tipos, build y `git diff --check` aprobados con Node 24. La suite emite avisos de Canvas en jsdom y el build conserva el aviso de lockfile externo, sin fallos. No se enviaron registros ni se validó correo contra el proveedor. Sin commits ni publicación; revisión visual del usuario pendiente.

## EXTRA-056 — Retirar rutas duplicadas de candidato y login

- **Fecha/autorización:** 2026-10-23, solicitud explícita de Maxi:
  «Está bien, haz eso eliminar las tres rutas de candidato, actualizar todos sus enlaces y destinos al panel, y dejar que las URLs anteriores den 404 y lo mismo con /login».
- **Problema/evidencia:** el panel reutiliza los renderizadores existentes, pero
  navegación, retornos de CV y pruebas todavía consumen rutas independientes.
  La redirección temporal de login mantiene una URL que ahora se pide retirar.
- **Cambio/justificación:** eliminar los tres entrypoints de candidato y la
  redirección de login; migrar enlaces, retornos y revalidaciones al panel o a
  la portada. Conservar componentes compartidos sin clonar contenido. Preservar
  selección de oferta y paginación al usar el destino del panel.
- **Origen/contratos:** FR-001, FR-010, FR-013, FR-030 y pedido anterior;
  reemplaza la compatibilidad de rutas de EXTRA-046 y EXTRA-051 (login), sin
  alterar permisos, estados, datos, `/ofertas` público ni otros roles de `/account`.
- **Archivos afectados:** rutas candidato, next.config.ts, navegación y acciones
  de cuentas/candidato, retorno de CV, feedback/revalidación, pruebas y contratos
  de navegación en specs y documentación visual/producto.
- **Riesgos:** ruptura de URLs explícitamente autorizada; preservar autorización,
  allowlist exacta de retorno de CV, respuestas JSON/303 y queries de selección.
- **Verificación prevista:** RED/GREEN, suite unit/component/tooling, lint,
  typecheck, build, HTTP 404 real sin Location y revisión independiente. No se
  autorizan resets, credenciales reales ni operaciones remotas.
- **Estado:** implementado; RED de cuatro rutas y destinos observada antes del
  cambio, más RED del retorno CV y selección de oferta al paginar. GREEN: 120
  pruebas focalizadas, suite de 846 pruebas/62 archivos, tooling 57/57, lint,
  tipos y build con Node 24.16.0 aprobados. Colección E2E: 98 casos/23 archivos.
  HTTP local: 32 combinaciones GET/HEAD/query responden 404 sin Location;
  Chromium confirma las cuatro URLs y portada/recuperación/retorno. Marcadores:
  seis escenarios desktop/móvil aprobados sin POST. El primer probe de navegador
  requería esperar la navegación; corregido el harness, pasó. Revisión técnica
  independiente aprobada: 120/120 pruebas en copia aislada y 32/32 probes HTTP,
  sin bloqueos funcionales. Se renumeró esta entrada de EXTRA-055 a EXTRA-056
  para evitar colisión con el trabajo concurrente de navbar, sin modificarlo.
  No se ejecutó el runner E2E completo porque resetea
  aceptación; no se usaron sesiones reales ni se verificó contra DB autenticada.
  Sin commits ni publicación.

## EXTRA-054 — Mostrar completa la siguiente pantalla al consultar ofertas

- **Fecha/autorización:** 2026-10-23; solicitud explícita de no dejar visible
  ninguna parte de Home al activar Ver ofertas disponibles.
- **Evidencia/cambio:** el destino conserva scroll-margin-top de 104px, dejando
  esa franja del hero. Retirar ese margen solo de la sección de ofertas; conservar
  desplazamiento nativo, foco, movimiento reducido y los demás offsets.
- **Archivos/riesgos:** home.module.css, pruebas visuales y guía visual. Cambio
  local de presentación, sin cambios de rutas, permisos o contenido.
- **Verificación prevista:** clic/teclado reales en desktop/móvil, tres modos y
  ambas preferencias de movimiento; destino alineado arriba y hero fuera de vista.
- **Estado:** implementado. RED reprodujo destino/hero a 104px; GREEN en 12
  escenarios desktop/móvil, tres modos, clic/teclado y movimiento reducido:
  destino arriba, hero fuera de vista y foco conservado. Suite de 828 pruebas,
  lint, tipos, build y diff-check aprobados; la transición horizontal previa
  conserva sus tres viewports aprobados. Build reintentado al terminar otro build,
  sin interrumpir procesos ajenos. La prueba visual general de estilo falla por
  el fondo translúcido de navbar/ofertas incorporado en paralelo, no por el salto;
  no se modifica ese cambio ajeno ni su expectativa de color en esta tarea.
  Sin cuentas reales, envíos, reseteos, commits ni operaciones remotas.

## EXTRA-053 — Acceso al panel dentro del login y desplazamiento de ofertas

- **Fecha:** 2026-10-23.
- **Origen/autorización:** pedido explícito de retirar Mi perfil del cuadrante
  izquierdo, añadir acceso al panel bajo el aviso de sesión y animar la posición
  de Ver ofertas disponibles al seleccionar o abandonar el registro de Empresa.
- **Evidencia/cambio necesario:** trasladar la entrada autenticada existente al
  recuadro, conservando su landmark de navegación y usando el destino de panel
  ya resuelto por rol. Actualizar la expectativa de portada en la prueba de
  navegación; ofertas y detalle conservan sus accesos al perfil. Añadir transición
  CSS de posición solo en escritorio, sin movimiento con preferencia reducida.
- **Archivos/contratos:** page/home-access-panel/home.module.css; pruebas de
  componentes, navegación por sesión y transición; especificación y guía visual.
  No se modifican permisos, sesiones, registros ni resolución de destinos.
- **Riesgos/verificación:** comprobar los tres roles, login anónimo y registros;
  medir posiciones intermedias en ambos sentidos, móvil y movimiento reducido;
  conservar teclado, navbar y flujo documental. Suite, lint, tipos y build.
  No se autorizan cuentas reales, reseteos ni operaciones remotas.
- **Estado:** implementado y verificado: RED de destinos/ubicación del enlace y
  ausencia de posiciones intermedias; GREEN de 29 pruebas focalizadas y suite de
  828 pruebas/62 archivos. Lint, tipos, build y diff-check aprobados con Node 24.
  Navegador sin POST: transición ida/vuelta y movimiento reducido a 1440/768/390px;
  15 estados responsive, 6 de estilo y 12 de navbar/validación aprobados.
  Expectativa E2E actualizada, sin ejecutar su runner que resetea datos. Sin
  cambios de autenticación, cuentas reales, commits ni operaciones remotas.
  Aceptación visual del usuario pendiente.

## EXTRA-052 — Navbar institucional, sesión activa y validación discreta

- **Fecha:** 2026-10-22.
- **Origen/autorización:** solicitud explícita de Maxi: trasladar la identidad a la
  navbar, conservar el enlace municipal y la visibilidad actual; ofrecer Ingresar
  o Mi cuenta; impedir otro login con sesión activa sin bloquear los registros;
  retirar “Completá este campo.” conservando líneas rojas y resumen de errores.
- **Evidencia:** la portada ya resuelve la sesión para navegación pero no para el
  recuadro; signIn autentica antes de comprobar la cuenta. Form/Field comparten
  el mapa de errores para mensajes, conteo, foco y aria-invalid.
- **Cambio necesario:** compartir la proyección verificada de sesión, comprobarla
  antes del login y añadir una política opcional que oculte únicamente mensajes
  de texto obligatorio vacío en los formularios de portada, sin borrar errores.
  El registro mantiene sus acciones y la verificación de correo existentes.
- **Archivos/contratos:** portada/navbar/panel/CSS; servicio y Action de login;
  Form/Field y opt-ins de formularios; pruebas, especificación y guía visual.
- **Riesgos:** autenticación y componentes compartidos. Conservar registros,
  destinos por rol, errores de formato/servidor y asociaciones ARIA válidas.
- **Verificación prevista:** RED/GREEN de sesión activa y login anónimo; navbar,
  registro disponible, faltantes/conteo/foco/ARIA/defaults; suite, lint, tipos,
  build, navegador local sin POST y verificación independiente de autenticación.
  No se autorizan reseteos de datos, cuentas reales ni operaciones remotas.
- **Estado:** implementado; verificación propia aprobada con Node 24.16:
  822 pruebas/61 archivos, lint, tipos, build y diff-check. Navegador sin POST:
  12 estados de navbar/validación, 15 responsive, 6 de estilo/movimiento,
  6 de teclado y 6 de asteriscos; capturas desktop/móvil revisadas.
  Sesión activa y login directo comprobados con pruebas aisladas, sin cuentas
  reales. E2E con reseteo de datos no ejecutado. Revisión técnica independiente
  de autenticación/contratos sin bloqueos: 90 pruebas en 6 archivos aislados.
  Contraprueba final: 25 pruebas de sesión/validación y diff-check aprobados.
  Aceptación visual del usuario pendiente; sin commits.

## EXTRA-051 — Unificar el acceso de portada sin romper `/login`

- **Fecha:** 2026-10-22.
- **Origen/autorización:** pedido del usuario de retirar enlaces duplicados del
  cuadrante izquierdo, ajustar asteriscos y eliminar la página de login duplicada.
- **Evidencia:** dos fuentes de asteriscos (Field y pseudo-elementos de portada);
  enlaces de ofertas, cierre de sesión y recuperación todavía usan `/login`.
- **Cambio necesario:** borrar la página duplicada y conservar su URL mediante
  redirección temporal a `/`, preservando queries. Una política opcional de Form
  permite indicadores de faltantes en login y grises/rojos en registro de portada;
  defaults compartidos y reglas de validación no cambian. Se conserva el acceso
  autenticado a Mi perfil/Mi cuenta y la navegación de ofertas fuera del duplicado.
- **Archivos/contratos:** next.config.ts; componentes Form/Field/validation;
  portada y formularios locales; pruebas, spec y guía visual relacionados.
- **Riesgos:** ruta pública consumida y componentes compartidos; errores de formato
  no deben confundirse con ausencia de valor ni activar asteriscos opcionales.
- **Verificación:** pruebas de markers/corrección/semántica/defaults y perfiles;
  navegador local sin POST, redirects/query strings, responsive, lint, tipos/build.
  No se autoriza resetear datasets ni realizar envíos reales de credenciales.
- **Estado:** implementado y verificado: 794 pruebas unitarias, lint, tipos,
  build y diff correctos; navegador con 6 estados de indicadores, 15 responsive
  y 6 de teclado, redirecciones 307 y queries preservadas, sin POST.
  Revisión independiente sin bloqueos: 46 pruebas focalizadas y repetición de
  controles de navegador correctas. Flujos autenticados y aceptación con reset
  de datos no ejecutados. Sin commit ni PR.

## EXTRA-023 — Estabilizar el escenario E2E de mantenimiento

- **Fecha/autorización:** 2026-10-18, Máximo: «Bueno, entonces encontramos un bug no? Bien, arreglalo».
- **Problema/evidencia:** los CI39179308511/39179314605 esperan dos derivaciones vencidas y obtienen745; el mantenimiento usa el reloj real sobre fixtures de septiembre. Main52fcae9 pasó el17 de octubre, antes del vencimiento18 de octubre12UTC; seed, mantenimiento y aserción no cambiaron.
- **Origen:** corrección necesaria para completar los controles de publicación de ofertas; se entrega como prerrequisito independiente, sin incluir slugs.
- **Cambio:** aislar los instantes del escenario en `tests/e2e/intermediation.spec.ts`, mantener activo el permiso inicial respecto del reloj real y conservar todas las expectativas exactas. Incluye el aislamiento pgTAP010 ya comprobado en los jobs de base de datos.
- **Límites/riesgo:** solo fixtures de prueba; sin cambios de seed, reglas, contratos ni datos alojados. Se mantiene la limitación cronológica preexistente entre consentimientos y derivaciones ficticias, sin ampliar este arreglo.
- **Verificación/recuperación:** RED remoto documentado; tipos/lint y CI completos del SHA corregido pendientes. Docker local apagado: no se atribuye una ejecución local. Reversión limitada a los fixtures; revisión independiente antes de integrar.
- **Corrección dependiente:** CI39181435054/39181499292/39181504654 detectó cuatro fallos en `tests/unit/maintenance-timezone.test.ts`, que exigía el literal anterior. Se actualiza el contrato al reloj inyectado, conservando todos los límites de Buenos Aires y agregando la comprobación del instante real del escenario. RED local reproducido antes del ajuste; no modifica el cálculo de producción.

## Autorización de trabajo

- **Responsable:** Mateo.
- **Fecha:** 2026-09-26.
- **Evidencia:** instrucción en este chat: «agrega a agents.md si considera que algún
  requisito extra sea necesario que lo agregue pero registralo en cambios-extra.md
  o algún nombre así».
- **Alcance:** incorporar extras necesarios para cumplir la tarea aprobada, con
  justificación y trazabilidad; los límites y controles están en `AGENTS.md`.
- **Revisión:** esta instrucción no acredita revisión de Máximo ni aceptación municipal.

## EXTRA-022 — Aislar el reloj de la prueba de vencimiento poscontratación

- **Origen/autorización:** entrega de slugs solicitada por Máximo, 2026-10-18; requisito técnico para completar CI sin cambiar el producto.
- **Evidencia:** Quality39178555606 falla en pgTAP010 casos97/110–112; maintenance(clock_timestamp()) vence derivaciones del seed de septiembre al llegar octubre. Archivo y reglas de mantenimiento no cambiaron respecto de52fcae9.
- **Cambio mínimo:** solo tres instantes del fixture poscontratación en `supabase/tests/010_intermediation_rls.test.sql`; usar el reloj histórico determinista del escenario. Conservar todas las expectativas, seed/hashes, permisos y reglas de producción.
- **Riesgo/recuperación:** aislamiento de pruebas; se revierte únicamente el fixture. No toca datos alojados ni cambia plazos de negocio.
- **Verificación:** RED observado en ambos jobs remotos; reproducción local bloqueada por Docker apagado. Recheck exacto por CI y revisión independiente pendientes antes del merge.

## EXTRA-001 — Evidencia histórica para métricas al cierre del período

- **Fecha de detección:** 2026-09-26.
- **Estado:** implementado y verificado localmente; pendiente de revisión por PR.
- **Origen:** FR-064 y tareas T079/T081 de
  `specs/001-municipal-employment-portal/`; fase 8 (US6).
- **Problema y evidencia:** las métricas deben reflejar el estado al cierre del
  período, pero los perfiles guardan valores actuales. Las funciones de mantenimiento
  reemplazan asociaciones de categorías y la auditoría no conserva todos los valores
  necesarios para reconstruir disponibilidad, confirmación y categorías anteriores.
  Ejemplos: `supabase/migrations/202609190019_candidate_self_service.sql` y
  `supabase/migrations/202609190030_company_self_service.sql` eliminan asociaciones
  previas de categorías; `202609190003_authorization_audit.sql` limita los metadatos
  de auditoría a identificadores de decisión, versión y conteo.
- **Cambio implementado:** conservar evidencia histórica mínima, protegida y transaccional
  de los atributos necesarios para calcular las métricas aprobadas. No copiar nombres,
  DNI, contactos, notas ni CV. Una instalación existente registra cobertura fiable
  desde la migración y rechaza períodos anteriores sin reconstrucciones supuestas.
- **Justificación:** es soporte técnico para un requisito ya aprobado, no una nueva
  funcionalidad municipal ni una solicitud de documentación oficial.
- **Archivos y contratos:** migraciones `202609190060_metrics.sql` y
  `202609190061_metrics_history_guard.sql`; `supabase/tests/060_metrics.test.sql`;
  servicio, validación, dashboard y exportación en `src/features/metrics/` y sus rutas;
  `plan.md`, `data-model.md` y `research.md`. Contratos definitivos, tablas privadas,
  errores y recuperación en `docs/validation/phase-8-metrics.md`. No se reescribieron
  migraciones aplicadas. `playwright.config.ts` ejecuta el proyecto de métricas antes
  de los recorridos que mutan el fixture; seed y manifiesto conservan conteos exactos.
- **Riesgos y límites:** historia previa irrecuperable, consistencia transaccional,
  exposición de datos y crecimiento del historial. No inventar antecedentes ni
  introducir purgas o retención no aprobadas. No cambiar las reglas de negocio.
- **Verificación realizada:** pruebas de cambios posteriores al período, categorías,
  disponibilidad, vigencia, consentimiento, acceso exclusivo administrativo y
  rollback; 54 aserciones SQL nuevas dentro de 466 correctas, 112 pruebas
  unitarias/componentes, E2E de métricas, typecheck, lint y build correctos.
- **Autorización y coordinación:** cubierto por la autorización general anterior
  como requisito técnico derivado. Se anunciaron el problema y el ajuste de configuración
  compartida al usuario. La revisión del diseño y de los archivos por Máximo sigue pendiente.
- **Resultado:** fase 8 implementada; evidencia y límites en el documento de validación.
  Esta entrada no acredita aprobación municipal, revisión humana ni merge.
- **Referencias:** implementación `1aea6be`, [PR #31](https://github.com/maximo-Pdev/funes-empleo/pull/31).

## EXTRA-002 — Paginación administrativa reproducible

- Fecha/responsable: 2026-09-27, Mateo autoriza fase 9; agente implementa bajo
  autorización general de extras necesarios. Revisión del compañero pendiente.
- Estado: implementado y verificado localmente; revisión del compañero pendiente.
- Origen: T089 / SC-008A y entradas aprobadas de `acceptance-manifest.json`.
- Evidencia: empresas no acepta filtro de estado y usa 20 filas; ofertas usa 20 por
  defecto sin exponer tamaño. Ambos ordenan solo por fecha, con empates en el seed.
- Cambio mínimo: empresas con filtro validado y página de 10 filas; ofertas solicita
  10 filas; ambas usan UUID como desempate. Se conservan RLS, roles y conteos aprobados.
- Archivos compartidos: páginas admin de empresas/ofertas y servicio de listado de
  ofertas, pruebas E2E y documentación. Se anunció al usuario antes de implementar.
- Riesgos: navegación/filtros y orden; verificar página 2, totales, estado inválido,
  no duplicación entre páginas y accesibilidad. Sin schema ni nuevos estados.
- Verificación: E2E falló primero por 20 filas en lugar de 10; tras la corrección
  pasó con 80 ofertas publicadas, 50 empresas activas, páginas de 10 filas disjuntas
  y rechazo de filtro inválido. Typecheck, lint y build correctos. Evidencia completa
  y límites de rendimiento alojado en `docs/validation/quality-gates.md`.
- Commit/PR: pendiente al registrar esta verificación; consultar historial de esta
  entrada y PR de `codex/temp-phase-9-quality`. No se acredita revisión ni merge.

## EXTRA-003 — Ejecución E2E completa y reproducible

- Fecha: 2026-09-27. Estado: implementado y verificado localmente; revisión humana pendiente.
- Origen: T088/T094/T095 y plan de CI de flujos críticos.
- Evidencia: el job application no inicia Supabase ni prepara variables, Mailpit o
  PDF; los tests privados usan skip si falta ese entorno. Un check verde no prueba
  los recorridos privados.
- Cambio: ejecutor local/CI que valida destino local, prepara el fixture, carga
  variables en memoria, compila y ejecuta E2E con un reporte que rechaza omisiones.
  Se añaden pruebas HTTP y SQL reales de autorización/auditoría.
- Archivos: workflow Quality, package.json, tests/quality, tests/e2e,
  supabase/tests y documentación de validación. Sin cambios funcionales previstos.
- Riesgos: reset de datos de prueba y exposición de credenciales en logs. Guard
  local estricto; no imprimir configuración, no publicar trazas autenticadas.
- Autorización: Máximo solicita cerrar todas las tareas ejecutables en esta rama.
  Ajuste de CI anunciado antes de editar; revisión compartida se realiza por PR.
- Verificación prevista: tipos, lint, Vitest, pgTAP, build y suite E2E completa;
  confirmar ejecución del workflow en GitHub antes de afirmar CI verificado.
- Resultado 2026-09-29: tipos/lint/build PASS, 376 Vitest, 855 pgTAP,
  57 E2E sin omisiones y dos carreras SQL PASS. CI remoto se registra en el PR.

## EXTRA-004 — Respuesta segura al archivar empresa sin permiso

- Fecha: 2026-09-27. Origen: T088/T094, errores públicos sin detalles internos.
- La prueba HTTP real descubrió que `archiveCompanyAction` propagaba ACCESS_DENIED
  como error 500. Se captura con el mismo traductor público que las otras acciones,
  conservando el redirect exitoso fuera del catch. No cambian permisos ni estados.
- Autorización: corrección necesaria para terminar las tareas solicitadas, anunciada
  antes de editar. Revisión del segundo desarrollador pendiente en PR.
- Verificación: matriz de acciones HTTP y suites de calidad de esta rama.
- Resultado: las siete combinaciones de actor/estado de la matriz HTTP y el
  recorrido positivo de archivo empresarial pasan. Revisión independiente pendiente.

## EXTRA-005 — Recurso no encontrado accesible y en español

- Fecha: 2026-09-28. Origen: T087/T088, NFR-002/NFR-008.
- Evidencia: al consultar una oferta ajena, Next muestra su 404 por defecto en
  inglés, sin `main#contenido`; el enlace global de salto queda sin destino.
- Cambio mínimo: `src/app/not-found.tsx` con mensaje genérico en español y navegación
  pública. No revela si un registro existe ni cambia autorización o contratos.
- Riesgo: preservar respuesta y contenido indistinguibles para ID ajeno/ausente.
- Autorización: requisito técnico necesario dentro del cierre solicitado; anunciado
  antes de implementar. Revisión humana pendiente.
- Verificación: E2E de propiedad/NOT_FOUND, tipos, lint y build.
- Resultado: ajeno/ausente con igual contenido, status compatible con streaming
  y noindex PASS; tipos/lint/build PASS. El skip link tiene destino `main#contenido`.

## EXTRA-006 — Descarga privada compatible con Storage alojado

- Fecha: 2026-09-28. Origen: T094/T089, CV privado autorizado en Vercel/Supabase.
- Evidencia: RPC de autorización correcto, objeto presente con hash/tamaño de fixture,
  pero descarga devuelve 400/404. Logs de Storage 1.77.5 identifican la operación
  `object.get_authenticated_info`, excluida por la política local de solo descarga.
- Cambio mínimo: permitir `object.get_authenticated_info` junto con
  `object.get_authenticated`, manteniendo bucket privado y el mismo control de
  dueño/derivación vigente. Nunca permitir listing, firma, overwrite ni delete.
- Archivos: nueva migración forward-only, pruebas de Storage y documentación.
- Riesgo: ampliar accidentalmente operaciones; verificar descarga por cada rol y
  denegación de objeto ajeno, anónimo, listado y URLs firmadas.
- Autorización: requisito técnico necesario del despliegue ficticio solicitado;
  comunicado antes de modificar la política compartida. Revisión humana pendiente.
- Recuperación: migración posterior que restaure el predicado anterior si fuese
  necesario; no reescribir historial. El síntoma sería denegación de CV en cloud.
- Resultado: migración aplicada en demo y reset local; seis actores de Storage
  alojado PASS (descarga según permiso, firma/listado denegados), cuatro roles
  de smoke Vercel PASS y 500 PDF verificados por SHA-256/tamaño tras reset alojado.
  Revisión del segundo desarrollador pendiente en el PR de esta rama.

## EXTRA-007 — Precondiciones ficticias para concurrencia de aceptación

- Fecha: 2026-09-29. Origen: T089 / SC-008A. Estado: implementado y verificado; revisión pendiente.
- Evidencia: el seed tiene 80 ofertas publicadas y ninguna pendiente; todas las
  participaciones están derivadas o finalizadas. No permite ejecutar las cuatro
  acciones de aceptación requeridas sin preparar sus estados iniciales.
- Cambio mínimo: helper SQL de pruebas que, después de un reset autorizado, prepara
  oferta 80 en `pending_review` y participación 775 en `under_review`, retirando
  únicamente su derivación ficticia. Conserva 500/50/100/1000 y los 500 PDF.
  No es una transición de producto ni una migración; su recibo identifica la variante.
- Archivos: `tests/fixtures/prepare-demo-concurrency.sql`, harness de rendimiento,
  manifiesto y documentación. No modifica contratos, permisos ni esquema compartidos.
- Riesgos: ejecutarlo fuera del fixture o ocultar su diferencia con el seed original.
  Exigir identidades/conteos/estados iniciales exactos, transacción y proyecto demo
  fijado en el transporte; conservar auditoría previa y registrar variante/baselines.
- Verificación: cuatro sesiones individuales, barrera común, éxito visible ≤5 s por
  acción y comprobación posterior de entidades, versiones y cuatro auditorías.
- Autorización: detalle necesario de la tarea aprobada, anunciado antes de editar;
  resets de esta demo autorizados expresamente por el usuario. Revisión pendiente
  en https://github.com/maximo-Pdev/funes-empleo/pull/33.
- Resultado: barrera común con cuatro admins distintos, inicio separado por menos
  de 1 ms; 891/891/891/906 ms, todos ≤5000 ms. SQL posterior comprobó las cuatro
  versiones y sus auditorías con actor/request ID; preselección conserva decisión
  privada justificada y evento `stage_skipped`. Dos fallos previos de preparación
  por selector exacto que ignoraba «obligatorio» no enviaron acciones ni midieron.
- El ejecutor mantiene cookies solo en memoria. Los errores del transporte Vercel
  se traducen a mensaje genérico para que un fallo no imprima encabezados de acceso.

### Referencias de la entrega

EXTRA-003/004/005/006 están en el commit `2974958b36aefeb603de4a3943c5da7585ab6370`
y PR #33. Los jobs application/database de GitHub Actions 36596663506 aprobaron
ese commit. EXTRA-007 y las mediciones posteriores se agregan en el mismo PR;
ninguna revisión humana ni aprobación municipal está acreditada por esos checks.

## EXTRA-008 — Parche mínimo de seguridad de dependencias (step 2)

- Fecha: 2026-10-06. Estado: parche dirigido implementado; instalación limpia y
  gates funcionales verificados por verificador independiente; audit con riesgo
  residual. Aceptación manual, comprobaciones DB y revisión pendientes.
- Origen: autorización explícita del usuario para step 2, seguridad de dependencias
  y versiones reproducibles de T001/T095; `odd/tasks/dependency-security.md`.
- Problema/evidencia de base aportada: npm audit informa 8 vulnerabilidades,
  1 crítica y 7 altas. Next 16.3.5 tiene GHSA-vcvr-r3jv-pc5j, corregido en
  16.3.8; source-map-js <1.2.2 tiene GHSA-68fv-2mgg-jv7q, corregido en 1.2.2.
  braces <=3.0.3 tiene GHSA-vfj7-8cjw-p6xm; latest 3.0.3 permanece sin parche
  estable según la investigación de base. No se promete audit cero.
- Cambio mínimo previsto: instalar Next y eslint-config-next 16.3.8 con pins
  exactos y actualizar source-map-js en el lockfile; sincronizar plan/research.
  Continuación autorizada: reparar también sharp <0.35.5 con `npm update sharp`,
  solo dentro del rango opcional de Next y sin dependencia directa ni override.
  Usar Node 24.21.0/npm 11.19.0 temporales en cache ignorada y verificar ambos
  ejecutables antes de instalar; preservar `.npmrc`, engines y packageManager.
- Justificación: corregir advisories con parches estables del stack aprobado,
  sin cambiar arquitectura, reglas de negocio ni ampliar dependencias directas.
- Archivos: `package.json`, `package-lock.json`, este registro,
  `specs/001-municipal-employment-portal/plan.md`, `research.md` del mismo
  directorio y `docs/validation/quality-gates.md`. No cambia contratos ni DB.
- Riesgos/límites: braces puede seguir propagando severidad alta por micromatch,
  fast-glob y la configuración ESLint de Next. No force, legacy-peer-deps,
  canary, downgrade mayor, vendoring, upgrades amplios ni debilitamiento de engines.
- Autorización: usuario autoriza este ajuste exacto y toolchain temporal, sin
  instalación global. Revisión del compañero/PR y aceptación manual pendientes.
- Verificación: versiones reales de runtime, instalación dirigida, `npm audit`
  y `npm ls` focalizado; instalación limpia y gates funcionales posteriores
  confirmados por el verificador independiente. Los resultados históricos de fase 9
  no se atribuyen al parche ni sustituyen las comprobaciones DB pendientes.
- Resultado observado: las tres instalaciones dirigidas finalizaron con exit 0;
  antes de cada una se observó Node v24.21.0/npm 11.19.0. `npm ls` focalizado
  exit 0 confirma Next/config/plugin 16.3.8 y source-map-js 1.2.2.
  Audit intermedio exit 1 informó 6 altas y 0 críticas, incluyendo sharp 0.35.4
  (GHSA-wq5f-xc86-pv6w). Con autorización posterior se comprobó en registry que
  Next 16.3.8 admite sharp `^0.35.4` y sharp 0.35.5 requiere Node >=20.9.0,
  compatible con el runtime exacto. `npm update sharp` exit 0 cambió 2 paquetes
  instalados; lockfile actualiza sharp/binarios a 0.35.5 y libvips a 1.3.4.
  `npm ls` exit 0 confirma sharp 0.35.5, sin nuevos pins directos ni overrides.
  Audit final exit 1 informa **5 altas, 0 críticas**, únicamente braces y cuatro
  dependientes ESLint; ya no enumera el advisory de sharp.
  Las instalaciones, incluida la actualización de sharp, advirtieron postinstall
  no cubierto por allowScripts para unrs-resolver 1.12.2;
  no se aprobó ni modificó esa política. Comandos exactos en quality-gates.md.
- Verificación independiente final aportada para este árbol: Node 24.21.0/npm
  11.19.0 exactos; `npm ci` exit 0; build exit 0; smoke público 1/1, exit 0;
  unitarias 378 pruebas en 23 archivos, exit 0; lint y typecheck exit 0.
  Audit exit 1: **5 altas, 0 críticas**, en braces/micromatch/fast-glob/
  @next/eslint-plugin-next/eslint-config-next. Los gates funcionales pasan;
  audit no pasa y no se afirma remediación completa.
  `npm ci` también advierte que el script de instalación de unrs-resolver 1.12.2
  no está en allowScripts. Política sin cambios; su postinstall no fue validado
  independientemente. Evidencia actual separada de la histórica e intermedia en
  `docs/validation/quality-gates.md`.
- Limitaciones/referencias: aceptación manual, comprobaciones DB/pgTAP y E2E
  privados completos del árbol parcheado pendientes; no se acredita aceptación
  ni revisión humana. Esta finalización solo documenta resultados aportados, sin
  volver a ejecutar comandos. No se creó commit/PR, no se hizo push ni reset de
  datos. Cambios previos preservados.

## EXTRA-009 — Evaluación de sustitución glob acotada al plugin ESLint de Next

- Fecha: 2026-10-06. Estado: ensayo autorizado por el usuario, rechazado por
  incompatibilidad verificada y reemplazo retirado; revisión del compañero pendiente.
  Origen: step 2 / T001/T095 y
  `odd/tasks/dependency-security.md`; eliminar la cadena vulnerable residual de EXTRA-008.
- Cambio propuesto: override anidado únicamente bajo `@next/eslint-plugin-next`,
  `fast-glob: npm:tinyglobby@0.2.17`, sin dependencia directa ni overrides globales.
  API inspeccionada: el plugin usa exclusivamente CommonJS `globSync(pattern,
  { onlyDirectories: true })` en `get-root-dirs`, convirtiendo barras Windows a `/`.
- Contrato: comparar conjuntos de rutas normalizadas (orden y barra final no
  significativos), raíces literales/glob/brace/absolutas, arrays y separadores Windows;
  excluir archivos y comprobar la regla real `no-html-link-for-pages` para enlaces
  internos incorrectos, externos y Next Link. No deshabilitar ni debilitar reglas.
- Riesgo observado antes de implementar: tinyglobby expone globSync CommonJS pero
  su `expandDirectories` predeterminado es true; Next no pasa false. La sustitución
  debe rechazarse si amplía raíces, aunque audit sea cero. No añadir adaptadores
  ni modificar el plugin para forzar compatibilidad.
- Archivos: package.json/lock, tests/unit/tooling/next-eslint-glob.test.ts,
  este registro, plan.md/research.md y docs/validation/quality-gates.md.
- Verificación prevista: RED con paquete original; instalación exacta con Node
  24.21.0/npm 11.19.0; GREEN y casos alternativos; npm audit y npm ls focalizados.
  Si hay incompatibilidad, retirar solo el override propio y reinstalar preservando
  el trabajo previo; documentar rechazo y riesgo residual. Gates completos pendientes.
- Mantenimiento: reevaluar API/opciones de ambos paquetes y estas pruebas en cada
  actualización de Next/tinyglobby; retirar el override cuando upstream repare la
  cadena. Audit cero no acredita equivalencia, mantenimiento futuro ni aceptación.
- Autorización: usuario autoriza expresamente correcciones/instalaciones necesarias
  para esta mitigación acotada. Revisión del compañero, aceptación y PR pendientes;
  sin commit/push, reset DB, cambios de runtime de aplicación ni instalación global.

- Resultado real: RED 1/22 (identidad fast-glob original), 21 contratos PASS.
  Con alias instalado: identidad PASS y audit 0, pero 10/22 fallan por raíces
  adicionales pages/src/src/nested, no por orden ni barras finales; los diez casos
  ESLint internos/externos/Link pasan. No hubo GREEN de la mitigación.
- Recuperación: retirado el override. La primera reinstalación conservó el alias
  en lockfile; se retiraron únicamente las tres entradas agregadas por el ensayo
  y se reinstaló de nuevo con runtime exacto. Árbol final restaurado a fast-glob
  3.3.1 → micromatch 4.0.8 → braces 3.0.3. Audit final exit 1: 5 altas,
  0 críticas. Pins Next/config 16.3.8, sharp 0.35.5 y source-map-js 1.2.2
  preexistentes preservados. Sin alias residual ni cambios funcionales.
- Pruebas retenidas como contrato de base y rechazo explícito del candidato:
  23/23 PASS tras recuperación; no afirman remediación ni audit cero. Fixtures
  temporales exclusivamente sintéticos, conservados para diagnóstico sin borrar.
  Gates completos/instalación limpia/revisión posteriores pendientes; comandos
  y evidencia del ensayo y recuperación en quality-gates.md. Sin commit/PR.

## EXTRA-010 — Adaptador privado de glob para ESLint de Next

- Fecha: 2026-10-06. Estado final: implementado con referencia npm a devDependency
  local raíz y entrada ESM síncrona index.mjs; verificación independiente final
  aportada: ci previo sobre mismo package.json/lockfile, ls --all, audits completo/
  producción, 403 pruebas/24 archivos (25 de compatibilidad), lint sin warnings,
  typecheck/build y smoke público Chromium 1/1 PASS, todos exit 0.
  Revisión del compañero, validación manual, DB y E2E privados completos pendientes.
  El intento inicial detenido y las continuaciones se conservan abajo como
  evidencia histórica, no como estado del árbol final.
- Origen: step 2 / T001/T095 y `odd/tasks/dependency-security.md`.
- Evidencia: EXTRA-009 rechaza el alias directo porque tinyglobby expande directorios;
  el consumidor real `get-root-dirs` requiere exclusivamente CommonJS
  `globSync(pattern, { onlyDirectories: true })`. La regla de enlaces usa esas raíces.
- Cambio mínimo autorizado: paquete local privado `next-eslint-glob-adapter`, dependencia
  exacta tinyglobby 0.2.17, expansión desactivada y normalización segura de cadenas/rutas;
  override solo `@next/eslint-plugin-next → fast-glob: file:./tools/next-eslint-glob-adapter`.
  No se modifica el plugin, las reglas, engines, scripts ni dependencias ajenas.
- Archivos: tools/next-eslint-glob-adapter/{package.json,index.mjs,README.md},
  tests/unit/tooling/next-eslint-glob.test.ts, package.json/lock, este registro,
  plan.md/research.md y docs/validation/quality-gates.md.
- Riesgos: subconjunto deliberado, no reemplazo general de fast-glob; validar API y defaults
  en cada actualización upstream, raíces de filesystem y rutas Windows/absolutas.
  Retirar override al repararse upstream; audit cero no acredita ausencia futura de riesgos.
- Verificación prevista: RED identidad antes de implementación, GREEN raíces y regla real,
  casos negativos/opciones no admitidas, instalación npm normal con runtime exacto,
  audit, árbol focalizado y diff --check. Si npm rechaza override local, detener sin
  modificar node_modules manualmente. Suites/build/browser/instalación limpia del nuevo
  árbol quedan al verificador padre; sin DB reset, commit ni push.
- Autorización: contrato explícito del usuario para esta continuación; no acredita revisión,
  aceptación ni merge. EXTRA-009 se conserva íntegro como ensayo histórico rechazado.
- Resultado observado: RED exit 1, identidad original fast-glob frente al adaptador;
  22/23 pruebas pasan. Instalación normal exit 0 con v24.21.0/npm 11.19.0,
  1 agregado/16 retirados y audit cero, pero el lockfile enlaza el override a
  `node_modules/@next/eslint-plugin-next/tools/next-eslint-glob-adapter` en lugar
  del paquete raíz. GREEN intentado exit 1: suite no carga por Cannot find module
  'fast-glob'; npm ls exit 1 (ELSPROBLEMS), fast-glob inválido. Audit exit 0 no
  acredita árbol usable ni remediación compatible. Advertencia allowScripts de
  unrs-resolver 1.12.2 conservada; no bypass ni cambio de política.
- Límite aplicado: detener ante override local no soportado, sin hack de node_modules
  ni rutas alternativas no autorizadas. Se entrega candidato/lockfile fallido como
  evidencia al padre, no como instalación funcional. Adaptador no ejecutado por las
  pruebas; normalización/raíces siguen sin verificación. Sin commit/PR/push/DB reset.

### Continuación autorizada de EXTRA-010 — resolución local portable

- El padre autoriza ensayar `file:../../../tools/next-eslint-glob-adapter` relativo
  al plugin y, si es necesario, devDependency raíz `file:tools/next-eslint-glob-adapter`
  con referencia override `$next-eslint-glob-adapter`. npm administra instalación,
  lockfile, enlaces y cache predeterminada fuera de node_modules; no hacks manuales,
  rutas absolutas, publicación, lockfile independiente ni bypass de scripts.
- Justificación: corregir el enlace inválido y resolver tinyglobby del paquete local
  desde el proyecto. Superficies y riesgos siguen siendo los de EXTRA-010.
- Verificación autorizada: toolchain temporal exacto, install, ci limpio, ls --all,
  pruebas focalizadas (incluidos fail-closed y enlace portable), audit y diff --check.
  Si ningún candidato funciona, restaurar con npm la cadena original funcional;
  suites completas/build/browser y revisión humana siguen pendientes.
- RED de esta continuación: suite no carga por módulo fast-glob ausente, exit 1,
  0 tests; reproduce el árbol roto recibido, no un fallo de comportamiento del adaptador.
- Resultado final: rechazado el spec relativo `file:../../../tools/...`: después
  de retirar únicamente las dos entradas inválidas del lockfile anterior, npm
  resolvió el enlace a tools y ci/25 pruebas pasaron, pero ls --all exit 1 lo marcó
  inválido. No se aceptó ese candidato pese a funcionar en las pruebas.
- Alternativa implementada: devDependency raíz
  `next-eslint-glob-adapter: file:tools/next-eslint-glob-adapter` y override anidado
  `fast-glob: $next-eslint-glob-adapter`. npm administra dos enlaces al mismo
  paquete tools y tinyglobby exacto 0.2.17 en el lockfile del proyecto; no se
  añadió tinyglobby como dependencia directa raíz ni lockfile independiente.
- Verificación final observada: install exit 0 (Node v24.21.0/npm 11.19.0), ci
  limpio exit 0 (464 paquetes), ls --all exit 0 sin inválidos; 25/25 pruebas
  focalizadas PASS y audit exit 0, cero vulnerabilidades. Pruebas amplían fail-closed,
  raíz literal, resolución de tinyglobby desde el adaptador y enlaces/spec portables.
  Se conserva implementación/API existente, expandDirectories false y reglas sin cambios.
- Cache predeterminada confirmada fuera de node_modules. Avisos ESLint no mantenido
  y unrs-resolver postinstall no cubierto por allowScripts conservados sin bypass.
  Sin rutas absolutas versionadas ni edición manual de node_modules; cambios previos
  ajenos preservados. Evidencia/comandos en quality-gates. Suites completas, lint,
  tipos, build, browser, DB y revisión humana del nuevo árbol siguen pendientes.
  Sin commit/PR/push/DB reset.

### Continuación autorizada de EXTRA-010 — ESM síncrono sin debilitar lint

- Evidencia de origen aportada por el padre: index.cjs contenía tres require imports
  rechazados por @typescript-eslint/no-require-imports. Se autoriza convertir solo
  sintaxis/entrada, no deshabilitar la regla ni excluir el paquete de lint.
- El padre renombró el artefacto propio index.cjs a index.mjs antes de esta ejecución.
  RED observado: lint exit 2 y suite focalizada sin cargar (0 tests) por main index.cjs
  obsoleto. No se atribuyen esos resultados a los tres errores originales informados.
- Implementación: imports ESM node:path/node:fs/tinyglobby y exportación nombrada
  globSync; main/exports apuntan a index.mjs, ./package.json accesible. Sin top-level
  await ni default export. Node 24.21.0 permite require(ESM) síncrono y Next recibe
  namespace.globSync; no cambian normalización, opciones, fail-closed ni API acotada.
- Pruebas: se conservan las 25, ampliando identidad con main/exports/resolución mjs.
  GREEN 25/25 antes y después de npm ci: diez variantes de raíces, diez casos con
  regla real, entradas/opciones negativas y contrato de instalación portable.
- Verificación real con npm exec Node 24.21.0/npm 11.19.0: install exit 0, ci exit 0
  (464 paquetes), lint exit 0 sin warnings, audit exit 0/cero vulnerabilidades y
  ls --all exit 0 sin inválidos. Comandos exactos en quality-gates.md. Se conservan
  avisos ESLint no mantenido y unrs-resolver postinstall sin allowScripts, sin bypass.
- Archivos de esta continuación: index.mjs, package.json del adaptador, README,
  test focalizado y este registro/plan/research/quality-gates. npm install no necesitó
  nuevos cambios del package.json ni lockfile raíz. Sin cambios de reglas ni DB.
- Límite: tipos, suite completa, build/browser/DB y revisión siguen pendientes del
  padre; no se afirma full build ni aceptación. Cambios ajenos preservados, sin
  commit/push/reset DB ni instalación global. Reevaluar require(ESM)/defaults ante
  cada actualización; retirar al repararse upstream.

### Finalización documental de EXTRA-010 — verificación independiente final

- Resultados aportados por el verificador independiente con Node 24.21.0 y npm
  11.19.0 exactos: npm ci previo exit 0 con el mismo package.json/lockfile;
  npm ls --all exit 0; audit completo y de producción exit 0, cero vulnerabilidades;
  suite completa 403 pruebas en 24 archivos, exit 0, incluidas las 25 de compatibilidad;
  lint exit 0 sin warnings; typecheck exit 0; build exit 0; smoke público Chromium
  1/1 exit 0. No se reconstruyen invocaciones completas no suministradas.
- Los errores de typecheck de guards exclusivamente de prueba fueron corregidos;
  los PASS finales superseden los fallos previos, que permanecen como historia.
  EXTRA-009 sigue rechazado: audit cero de aquel alias no acreditaba compatibilidad.
- La mitigación actual reemplaza realmente la cadena vulnerable mediante tinyglobby
  exacto 0.2.17, adaptador ESM síncrono y override limitado al plugin, con referencia
  a la devDependency local raíz; no es una supresión de audit ni de reglas.
- Aviso observado: lockfile externo del directorio padre ignorado, sin modificarlo.
  Aviso previo unrs-resolver/allowScripts sin cambios; política intacta y postinstall
  no validado independientemente. Sin actualización global de runtime.
- Límites: audit cero no garantiza mantenimiento futuro. Reevaluar consumidor/API/
  defaults en cada actualización y retirar adaptador/override al repararse upstream.
  Manual, DB/pgTAP, E2E privados completos, otras plataformas y revisión del compañero
  pendientes. Sin aceptación municipal, revisión humana completada, commit ni push.
- Esta finalización modifica solo documentación autorizada y registra evidencia
  aportada sin repetir gates; resultados actuales en quality-gates.md. Las notas
  anteriores de pendientes/fallos corresponden a sus etapas históricas.

## EXTRA-011 — Salto al contenido y regresión pública local

- Fecha: 2026-10-06. Responsable: agente bajo decisión arquitectónica del padre.
  Estado final: implementación verificada con pruebas y gates independientes más
  browser público live; revisión nativa/humana y aceptación pendientes.
  Las notas posteriores de build/browser pendientes son evidencia de la etapa inicial,
  supersedida por la finalización documental siguiente.
- Origen: FR-070 / SC-009, T020/T087 y `odd/tasks/public-browser-readiness.md`.
- Problema/evidencia: el diagnóstico del padre observa BODY tras activar el salto
  y enlaces del header de 36/38px. El header está dentro de main, por lo que agregar
  tabindex sin moverlo no omitiría la navegación.
- Cambio mínimo: header y main hermanos en un fragmento; main#contenido con
  tabindex=-1, comenzando en el hero; footer hermano conservando contenido/estilos.
  Enlaces Ofertas/Ingreso con inline-flex, items-center y min-h-11 (44px).
  Agregar aserciones de estructura y navegación de teclado y cobertura acotada
  de páginas públicas con servicios simulados, sin presentarla como integración real.
- Justificación: cumplir accesibilidad ya requerida sin cambiar reglas de negocio,
  navegación, textos, CSS compartido, datos, permisos ni dependencias.
- Archivos/contratos: `src/app/(public)/page.tsx`,
  `tests/components/setup/home.test.tsx`, `tests/components/setup/public-offers.test.tsx`,
  `tests/e2e/setup.spec.ts` y este registro. Sin cambios de contratos de datos.
- Riesgos/límites: estructura/estilo sticky y orden de foco requieren browser real;
  mocks no prueban Supabase. NVDA/zoom manual y recorridos privados fuera de alcance.
- Autorización/coordinación: padre autoriza explícitamente el cambio header/main
  local y estos tests. Revisión/aceptación municipal y commit/PR pendientes.
- Verificación realizada: comando exacto
  `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:unit -- tests/components/setup/home.test.tsx tests/components/setup/public-offers.test.tsx"`.
  RED exit 1: 2 fallos/3 PASS; primero tabindex ausente y clase min-h-11 ausente,
  segunda ejecución observa header aún dentro del main. GREEN final exit 0:
  13/13 en 2 archivos, incluyendo listado/detalle, vacíos/fuera de rango,
  opcionales, notFound y propagación de errores con mocks.
  Las pruebas opcionales de ofertas caracterizan comportamiento existente:
  no tienen RED de producto ni acreditan integración real.
- Checks ordinarios: `npm run lint` exit 0 sin warnings (antes y después de
  correcciones de tipos). `npm run typecheck` primero exit 2 por tres errores
  exclusivamente en tests nuevos (índice posiblemente undefined y opciones RTL);
  corregidos sin supresiones, repetición final exit 0.
- Limitaciones/resultados pendientes: E2E actualizado con Enter → main enfocado
  → Tab → CTA principal, reteniendo lang, título y axe; no ejecutado por este worker.
  Build/browser, NVDA/zoom manual y revisión independientes pendientes; sin commit/PR.

## EXTRA-012 — Compatibilidad de presentación de ofertas públicas

- Fecha: 2026-10-06. Estado final: implementación verificada con pruebas y gates
  independientes más browser público live; revisión nativa/humana y aceptación
  pendientes. Los pendientes de build/browser de la etapa inicial se superseden
  por la finalización documental siguiente.
- Origen: FR-024/FR-070, T045 y corrección display-only solicitada durante
  `odd/tasks/public-browser-readiness.md`; interfaz clara en español como restricción fija.
- Evidencia aportada: pantallas públicas muestran códigos legacy del seed `onsite`,
  `fixed_term` y fechas ISO sin formato de lectura local.
- Cambio mínimo: helper central de presentación para `onsite` → `Presencial` y
  `fixed_term` → `Plazo fijo`; desconocidos verbatim. Fechas calendario estrictas
  YYYY-MM-DD válidas → DD/MM/YYYY sin UTC ni offsets; entradas inválidas intactas.
  Aplicar a inicio/listado/detalle, conservando ISO en atributos time.dateTime.
- Justificación/límites: compatibilidad de presentación, NO catálogo municipal
  aprobado ni decisión legal. OQ-010/OQ-011 siguen abiertas; sin cambios a
  DeferredCatalog, formularios, validación de entrada, schema, RPC, auth o datos.
- Archivos: helper `src/features/openings/public-offer-display.ts`, tres páginas
  públicas, tests de helper y componentes setup, y este registro.
- Riesgos: traducir valores no observados o desplazar días por zona horaria;
  limitar traducción exacta y validar calendario sin objetos Date.
- Estrategia: RED con fixtures legacy y aserciones de etiquetas/fechas sobre páginas
  actuales; GREEN con helper, pruebas de bisiestos/invalidos/desconocidos, suite
  focalizada conjunta, lint y typecheck con toolchain temporal exacto autorizado.
- Autorización/coordinación: padre autoriza estas superficies exactas; preservados
  foco/estructura, pruebas y registro previos. Build/browser y revisión quedan al
  padre; sin commit/push ni aceptación municipal acreditada.
- Resultado observado con prefijo `npm exec --yes --package=node@24.21.0
  --package=npm@11.19.0 --call`: componentes RED exit 1 (4 fallos por modalidad
  cruda, 9 PASS); GREEN exit 0 (13/13), incluyendo contratación y todas las fechas
  visibles con dateTime ISO intacto. Helper 34/34 PASS; suite conjunta 47/47 PASS;
  `npm run lint` exit 0 sin warnings y `npm run typecheck` exit 0.
  Las pruebas del helper triangulan bisiestos (2000/2024 vs 1900/2100), días/meses
  inválidos, formato estricto y desconocidos verbatim; no tienen RED independiente.
  Mocks de páginas no prueban integración live, RLS ni Supabase.

### Finalización documental de EXTRA-011/012 — step 3

- Evidencia final aportada, sin repetir checks: verificador independiente fase 1
  con Node 24.21.0/npm 11.19.0 exactos; build, lint, typecheck y audit exit 0
  (0 vulnerabilidades), 447 pruebas/26 archivos exit 0 y setup Chromium reforzado
  1/1 PASS. Helper 34 y componentes públicos 13 son pruebas con mocks/dominio,
  distintas de la verificación live; no se suman otra vez al total.
- Browser final: seis rutas públicas en 360×800 y 1366×768, 12 capturas/contact
  sheets y `report.json` bajo `test-results/public-visual-review-final/` ignorado.
  Axe 0, overflow 0, idioma/H1/labels correctos. Inicio: main recibe foco tras
  salto, Tab sigue al CTA candidato; header ≥44px y hero sobre el pliegue.
- Supabase configurado local: health HTTP 200 y RPC published_offers funciona.
  Inicio 3 destacadas/listado 10/página 2 con 10/página 999 vacía; detalle live
  Presencial/Plazo fijo/31/12/2026, ISO machine-readable conservado. CTA anónimo
  lleva a sesión vencida. No se reparó configuración/datos; indisponibilidad
  anterior histórica, causa no confirmada.
- Malformado/desconocido: not-found español con HTTP 200 por streaming, no
  aserción 404. `page=0`/`page=abc`: error genérico seguro con reintento del
  boundary existente, no validación específica. Loading observado en desktop
  a DOMContentLoaded (44 ms), no timing mobile ni todos los estados.
- Formularios Auth no enviados y pending sin comprobar; sin reset DB. T087,
  NVDA, zoom real/matriz manual por rol, suite privada/DB actual y revisión
  nativa/humana siguen pendientes. No se acredita aceptación municipal ni merge.
- Archivos de esta finalización exclusivamente documental: este registro,
  `docs/validation/accessibility.md` y `docs/validation/quality-gates.md`.
  Se preservan evidencias históricas step 1/2 y cambios previos; sin source edits,
  commit ni push. Las invocaciones completas de gates no aportadas no se inventan.

## EXTRA-013 — Fixture de mantenimiento alineado con fecha de Buenos Aires

- **Fecha:** 2026-10-06. **Estado:** implementado; regresión/cobertura verificadas,
  gates locales incompletos y revisión pendiente.
- **Origen:** T034 y contrato `contracts/state-machines.md` de
  `specs/001-municipal-employment-portal/`: vencimiento a las 00:00 del día posterior
  a `closing_date` en `America/Buenos_Aires`, con ejecución idempotente.
- **Problema/evidencia:** el fixture de `tests/e2e/intermediation.spec.ts` usa
  `current_date - 1`; entre 00:00 y 03:00 UTC esa fecha aún no terminó en Buenos
  Aires. El diagnóstico de CI registra `closedOpenings: 0` en lugar de 1.
- **Cambio implementado:** derivar ayer de
  `(clock_timestamp() at time zone 'America/Buenos_Aires')::date - 1` y agregar
  `tests/unit/maintenance-timezone.test.ts`, vinculado a la expresión real del
  fixture con instantes deterministas 01:00, 02:59:59.999 y 03:00 UTC.
- **Justificación/límites:** reparación exclusiva de pruebas para satisfacer T034;
  conservar contadores e idempotencia. Sin cambios de producción, contratos ni
  aprobación inferida de la especificación Draft.
- **Autorización/coordinación:** usuario autoriza expresamente esta reparación y
  EXTRA-013; escritura delegada solo en los dos tests y este registro. El padre
  conserva el documento ODD, revisión y acciones Git; el escritor no hace commit/push.
- **Riesgos:** la comprobación estructural no ejecuta PostgreSQL; E2E completo
  pendiente de CI aislado porque Docker no está disponible. Node/npm locales
  24.16.0/11.13.0 difieren de los pins de CI 24.21.0/11.19.0.
- **Verificación observada:**
  - `npm run test:unit -- tests/unit/maintenance-timezone.test.ts`: RED, tres
    fallos con el source anterior (expresión, 01:00 y pre03); GREEN, cinco PASS
    tras corregir el fixture, incluido el límite exacto y caso negativo UTC.
  - `npm run test:coverage`: PASS, 24 archivos y 383 pruebas; resumen del runner
    100% de 18 statements/12 branches/3 functions/15 lines, no cobertura global.
  - `npm run lint`: FAIL (exit 2), dependencia `fast-glob` ausente al cargar
    `@next/eslint-plugin-next`. No se instaló ni modificó dependencia alguna.
  - `npm run typecheck` y `npm run build`: PASS en verificación independiente;
    carga normal de Next permitida sin inspeccionar ni mostrar valores de entorno.
  - Verificación independiente: regresión focalizada y `git diff --check` PASS;
    lint vuelve a fallar por instalación local incompleta (`fast-glob` existe en
    el lockfile pero falta en `node_modules`). No se ejecutó instalación.
  - `git diff --check`: PASS; sin errores de whitespace.
  - Sin resets, ejecución SQL/E2E, commits ni push; CI completo pendiente.
- **Archivos afectados:** los dos tests anteriores y `cambios-extra.md`; salidas
  generadas autorizadas únicamente en `.next/`, `coverage/`, `tsconfig.tsbuildinfo`.
- **Referencias:** tarea `odd/tasks/maintenance-e2e-timezone.md`; commit/PR de esta
  reparación y revisión independiente pendientes, no acreditados por este registro.

## EXTRA-014 — Presupuesto local del recorrido E2E de autogestión

- **Fecha:** 2026-10-06. **Estado:** registrado antes de editar el test e
  implementado; controles locales PASS, GREEN funcional de CI y revisión pendientes.
- **Origen:** US2, escenarios de aceptación 1–6, FR-005/010/016/030/054 y T040
  de `specs/001-municipal-employment-portal/`; recorrido existente de registro,
  perfil/CV, dos postulaciones, retiro, suspensión/reactivación y archivo/restauración.
- **Evidencia aportada:** Quality/application de PR #42, run `37680658309`,
  agota `Test timeout of 30000ms exceeded` en el helper de login (línea 17),
  llamado desde la línea 151 tras restaurar el perfil; otros 56 E2E pasan.
  El mismo test pasa en otros PR. Esto no demuestra un defecto de autenticación.
- **Cambio mínimo implementado:** `test.setTimeout(120_000)` como primera instrucción
  del único recorrido largo, igual al presupuesto del recorrido asistido.
  Sin cambios de producción/auth, timeout global, expectativas de URL (5 s),
  aserciones, skips ni retries; sin nuevas pruebas estructurales de fuente.
- **Archivos/contratos:** `tests/e2e/candidate-self-service.spec.ts` y este registro;
  sin modificaciones de contratos, esquema, permisos ni requisitos municipales.
- **Autorización/coordinación:** usuario autoriza este ajuste acotado sobre
  `fix/dependency-security` en `d5183b2`; el padre conserva revisión, ODD y entrega
  Git. Este escritor no cambia de rama ni hace commits/push.
- **Riesgos/límites:** el presupuesto mayor puede demorar la detección de un bloqueo;
  no acredita rendimiento ni corrige un defecto funcional probado. Docker/Supabase
  local ausente impide RED/GREEN E2E significativo; usar el RED de CI aportado y
  colección/controles locales, sin resets, installs ni lectura de secretos.
  Node/npm locales 24.16.0/11.13.0 difieren de CI 24.21.0/11.19.0.
- **Verificación prevista:** colección Playwright antes/después, typecheck, lint,
  cobertura, build y diff check; resultados observados se registrarán aquí.
  La colección no ejecuta el cuerpo ni prueba su timeout registrado.
- **Resultados observados:**
  - `npx playwright test tests/e2e/candidate-self-service.spec.ts --list`: PASS
    antes/después (exit 0), mismos 31 tests en 6 archivos con dependencias.
    El timeout dentro del cuerpo no se ejecuta en colección: no se afirma
    verificación de metadata registrada ni GREEN E2E por este resultado.
  - `npm run typecheck`: PASS (exit 0).
  - `npm run lint`: PASS (exit 0), sin warnings; no reaparece fast-glob ausente.
  - `npm run test:coverage`: PASS (exit 0), 408 pruebas en 25 archivos;
    100% de 18 statements/12 branches/3 functions/15 lines solo del módulo
    configurado `src/lib/env/schema.ts`, no cobertura global ni del recorrido.
  - `npm run build`: PASS (exit 0); aviso de lockfile externo ignorado conservado.
    Carga normal de entorno por Next, sin inspección ni exposición de valores.
  - `git diff --check`: PASS (exit 0), sin errores de whitespace.
  GREEN funcional y DB pendientes de CI aislado/PR #42; sin aceptación
  ni revisión humana acreditadas, sin referencia de commit nuevo.

### Cierre verificado de EXTRA-014

- Reparación: `f7ad322`; head publicado/verificado de PR #42: `98d8f4e`.
- CI [37686615198](https://github.com/maximo-Pdev/funes-empleo/actions/runs/37686615198):
  application y database PASS; recorrido del candidato 25,2 s; 57 E2E PASS.
  Vercel y Preview Comments PASS. No se reintentaron ni omitieron tests.
- Revisión nativa `review-6d2877daf500352c` aprobada y reconocida; observaciones
  informativas diferidas. Esto no acredita aprobación humana ni merge a main.
- El commit de este cierre solo modifica documentación; se observará su CI final.

## EXTRA-015 — Separación de credenciales locales y alojadas

- **Fecha:** 2026-10-07 (fecha observada del entorno). **Estado histórico de la etapa original:**
  fuente original verificada independientemente antes de bdd9362; no cubre la
  reducción posterior ni la reparación actual. Operaciones remotas se registran
  por el padre en PC2/PC4; revisión/publicación del candidato actual pendientes.
- **Origen:** PC1 de `odd/tasks/public-repository-credentials.md`, T003/T005/T021/T096
  y principios II/III/VI de la constitución: privacidad, identidades individuales
  y preservación del historial. No modifica comportamiento del producto.
- **Problema/evidencia:** scripts alojados reutilizan la contraseña versionada del
  seed local; el reset alojado incorpora el seed completo y elimina usuarios Auth.
  Los guards E2E por prefijo no verifican el destino de la aplicación.
- **Cambio necesario:** exigir variables privadas por identidad en CV/calidad
  alojados, resolverlas antes de transporte o navegador, centralizar fixtures E2E
  con validación estricta de ambos orígenes y bloquear reset MJS/SQL sin borrados.
- **Superficies:** helper/declaración/prueba Node en tests/fixtures y tests/unit/tooling;
  scripts CV/reset/calidad demo; ocho consumidores E2E incluido su helper;
  playwright.config.ts, package.json, workflow Quality, .env.example, quickstart,
  docs/operations/demo-credentials.md y este registro. Seed/manifiesto sin cambios.
- **Justificación/riesgos:** requisito de seguridad previo a una eventual publicación,
  no nueva función municipal. El reset alojado queda indisponible; una sustitución
  futura debe preservar identidades/contraseñas e historial y tener revisión propia.
  Bloquear código no invalida contraseñas ni funciones SQL ya instaladas: PC2/PC3
  siguen siendo necesarios. No se habilita producción ni visibilidad pública.
- **Autorización/coordinación:** usuario autoriza PC1 en el worktree aislado;
  checkout principal y cambios administrativos concurrentes intocables. El padre
  conserva tracker, revisión y entrega Git. Sin commits/push ni acciones remotas.
- **Verificación prevista:** RED/GREEN Node sin red, negativos de origen/credenciales,
  transporte simulado, guard SQL estructural y hashes; npm ci con lockfile existente,
  lint/typecheck/unit/build sin secretos ni Auth alojado. Runtime observado
  Node 24.16.0/npm 11.13.0 distinto de los pins; no debilitar engines.
- **Historia de verificación del escritor:**
  `node --test tests/unit/tooling/fixture-credentials.node.test.mjs`
  RED 12/12 fallos esperados (transporte alcanzado, generación SQL y destinos
  inseguros aceptados); GREEN inicial 20/20, triangulación final 28/28 PASS.
  Transporte/cliente/browser simulados, rechazo de la última identidad ausente,
  valores vacíos, URLs engañosas y errores de navegador sin credenciales en salida.
  Sintaxis de ocho .mjs, negativa SQL estructural y hashes normalizados de seed/
  manifiesto PASS; comparación inicial de bytes del manifiesto difería por CRLF.
  `npm ci` FAIL EBADENGINE con Node 24.16/npm 11.13 frente a 24.21/11.19:
  engines intactos, sin bypass ni cambios de lockfile. `npm run lint`,
  `npm run typecheck`, `npm run test:unit` y `npm run build` FAIL por ejecutables
  ausentes después de la instalación rechazada; no acreditan gates de aplicación.
  No se ejecutaron DB/E2E/reset/controles alojados reales ni se generó next-env.
  El RED fue presenciado por el escritor; no se atribuye al verificador independiente.
- **Verificación independiente vigente, registrada 2026-10-07:** evidencia
  aportada por el padre de gentle-ai-verify, con toolchain efímero mediante
  `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 -- …`.
  Node 24.21.0/npm 11.19.0 reales comprobados; `npm ci` PASS, 464 paquetes y
  audit 0; lint/typecheck PASS; `test:unit` PASS, 478 pruebas en 30 archivos;
  build PASS; tooling nativo PASS, 28/28 con Node exacto. Sin cambios generados
  rastreados. Estos PASS superseden la indisponibilidad inicial de los gates;
  se conserva EBADENGINE como historia, no como estado vigente. Este follow-up
  documental no repite comandos npm/tests ni acredita CI remoto o aceptación.
- **Prerrequisito operativo PC2, registrado 2026-10-07:** el intento de solo
  lectura con Supabase CLI oficial 2.117.0, `projects list --output-format json
  --log-level none`, falló por autenticación ausente. No hubo recuperación de
  proyecto/clave administrativa ni operación remota. El padre solicitará acceso
  seguro mediante login de la cuenta autorizada o `SUPABASE_ACCESS_TOKEN` en el
  proceso local, fuera del chat; nunca secretos en chat, archivos env ni argv.
  Tras autenticar y verificar alcance, la CLI soporta `projects api-keys` para
  capturar la clave solo en memoria y `db query` vía Management API para bloquear
  la función SQL ya instalada. Son capacidades disponibles, no acciones ejecutadas.
  El repositorio permanece privado hasta verificar invalidación remota, manejo
  de sesiones y bloqueo de la función instalada. El usuario acepta PDFs, documentos,
  fixtures sintéticos y metadatos Git para el objetivo público; esa autorización
  no sustituye los controles de seguridad pendientes.
- **Unicidad:** EXTRA-015 verificado frente a referencias locales main/origin,
  según evidencia aportada por el padre; no se afirma consulta del último remoto.
- **Límites de artefactos/revisión:** quickstart y guía operativa registran el bloqueo;
  las descripciones históricas de reset en plan/runbook requieren reconciliación
  por su propietario (fuera de las superficies delegadas). El slice PC1 informado
  antes de este follow-up documental tiene 550 líneas de diff, por encima de la
  previsión orientativa de 400; el padre decide entrega/revisión. No se omitieron
  pruebas para ajustar el presupuesto.
- **Revisión/aceptación y commit/PR:** pendientes; no acreditados por esta entrada.

## EXTRA-016 — Reducción del fixture demo a 10 identidades

- **Fecha:** 2026-10-08. **Estado histórico:** reducción de fuente bdd9362 incompleta,
  con checks application/database fallidos; no revisada ni aceptada como solución
  coherente. Supersedida por EXTRA-017: se conserva el demo pequeño, se rechazan
  variables por rol y la pérdida de cobertura de aceptación/concurrencia.
- **Origen:** autorización explícita del usuario para combinar la remediación de credenciales con la reducción del fixture demo; PC1 de `odd/tasks/public-repository-credentials.md` y principios II/III/VI de la constitución.
- **Problema y evidencia:** el fixture contenía 554 cuentas ficticias (4 admin / 500 candidate / 50 company) que el usuario considera innecesarias para la demo y que aumentan la superficie de credenciales a rotar/controlar.
- **Cambio implementado:** reducir el seed local y el manifiesto a 10 identidades ficticias (2 admin / 4 candidate / 4 company), con registros de negocio coherentes: 4 perfiles de candidato, 4 empresas, 8 ofertas y 8 participaciones. Conservar el password local determinista protegido por los guards de origen local. Reemplazar las ocho variables de entorno alojadas por tres variables por rol (`DEMO_ADMIN_PASSWORD`, `DEMO_CANDIDATE_PASSWORD`, `DEMO_COMPANY_PASSWORD`). Actualizar el resolver, test nativo, reset local, documentación y `.env.example`.
- **Justificación:** reduce la superficie de credenciales y cuentas de prueba mantenidas en el demo sin cambiar reglas de negocio ni habilitar producción/publicación.
- **Archivos y contratos afectados:** `supabase/seed.sql`, `tests/fixtures/acceptance-manifest.json`, `tests/fixtures/credentials.mjs`, `tests/fixtures/credentials.d.mts`, `tests/unit/tooling/fixture-credentials.node.test.mjs`, `tests/fixtures/reset-local.mjs`, `.env.example`, `docs/operations/demo-credentials.md`, `specs/001-municipal-employment-portal/quickstart.md`, `odd/tasks/public-repository-credentials.md` y este registro.
- **Riesgos y límites:** los tests E2E y pgTAP que esperaban 500/50/100/1000 quedan desactualizados para este PR; el fixture de concurrencia (`prepare-demo-concurrency.sql`) queda marcado como no soportado con 10 cuentas. No se ejecutaron resets ni operaciones remotas; el ajuste remoto (borrado de 544 cuentas sobrantes y actualización de la bóveda DPAPI) es parte de la continuación operativa PC2/PC3.
- **Autorización y coordinación:** usuario autoriza explícitamente la reducción a 10 cuentas y el PR único; el padre conserva revisión, ODD y acciones Git. Sin commits/push/merge por parte de este escritor.
- **Verificación prevista:** `node --test tests/unit/tooling/fixture-credentials.node.test.mjs`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`.
- **Resultados:** pendientes de ejecución en el worktree; se reportarán antes del handoff.
- **Limitaciones:** no se verifican E2E ni pgTAP en este ámbito; requieren actualización aparte o fixture de concurrencia revisado.

## EXTRA-017 — Reparación coherente de datasets y credenciales de PR #50

- **Fecha:** 2026-10-08. **Estado:** registrado antes de cambios; implementación/verificación pendientes, sin revisión acreditada.
- **Origen:** PC1 reconciliado, T021/T089/T095, FR-003 y SC-003/008/008A; autorización del usuario para corregir todos los checks en un único PR.
- **Evidencia:** bdd9362 reduce el seed pero no los contratos de pgTAP/E2E: métricas, referencias a admin3/4, FK de sesiones y rollback de auditoría fallan. Tres variables por rol contradicen las contraseñas únicas ya existentes. La revisión del código previo no cubre esa reducción.
- **Cambio mínimo previsto:** conservar seed interactivo 2/4/4; generar desde la misma plantilla SQL un fixture TEST-ONLY 4/500/50/100/1000, activado explícitamente solo por aceptación local aislada/CI. Manifiesto con datasets separados, hashes y expectativas. Resolver exactamente las diez identidades alojadas con variables individuales, sin fallback ni rotación. Ejecutar concurrencia de cuatro admins únicamente en aceptación local y diagnosticar la aserción de ofertas restauradas sin bajar expectativas.
- **Superficies:** seed, fixtures/generador/reset local, credenciales y pruebas tooling; runner local/CI/package; consumidores E2E/performance/demo; pruebas SQL y documentación operativa/quickstart. Solo tests/tooling/docs: no migraciones ni políticas de producto.
- **Riesgos/límites:** nunca cargar aceptación al demo alojado; exigir destinos exactos y propiedad del servicio aislado antes del reset. Ninguna operación alojada, bóveda, borrado Auth o aceptación municipal. Checks DB/E2E requieren servicio local propio o CI después del push del padre.
- **Autorización/coordinación:** padre autoriza superficies técnicas ampliadas en worktree aislado; conserva tracker, revisión y commit/push/merge. Checkout principal y sus servicios intactos. PR único; no se reduce el diff omitiendo checks.
- **Verificación prevista:** RED/GREEN nativo de identidades y datasets/entrypoints, negativos remotos, hashes/SQL generado; Node 24.21.0/npm 11.19.0 efímeros para tooling/lint/typecheck/unit/build. DB/E2E solo en entorno de propiedad verificada; reportar pendientes honestamente.
- **Supersede EXTRA-016:** la reducción interactiva sigue vigente, pero sus variables por rol y la declaración de concurrencia no soportada se rechazan. Los fallos de checks no se aceptan como limitación permanente. EXTRA-015 conserva evidencia histórica de la fuente anterior, no aprobación del candidato actual.
- **Implementación:** `supabase/seed.sql` sigue creando exactamente 10 identidades y 4/4/8/8 registros. El generador deriva SQL TEST-ONLY 4/500/50/100/1000 desde el mismo bloque parametrizado; manifiesto separado y hashes normalizados. `test:db` y el runner E2E seleccionan aceptación explícitamente. El último proyecto E2E hace reset frío y prueba cuatro admins/barrera/≤5 s/versiones/auditorías, sin crear admins alojados nuevos. Resolver exacto de diez variables individuales, controles CV interactivos de 4 candidatos y checks de demo sin atribuirles el benchmark grande.
- **Diagnóstico 030:** el seed pequeño da a company1 una oferta publicada y otra cerrada; esta última se excluye correctamente del archivo/restauración. Aceptación da dos publicadas (1 y 51), más la nueva oferta del test: la expectativa de tres borradores se conserva. Se agregaron precondiciones explícitas y una oferta terminal propia que debe permanecer cerrada/no archivada. Diagnóstico de fuente; confirmación SQL funcional pendiente, sin cambios de políticas.
- **RED observado:** `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:tooling"` exit 1, 20 PASS/15 FAIL contra comportamiento de bdd9362: variables individuales rechazadas, datasets/generador ausentes, flags de aceptación sin soporte. Dos ejecuciones intermedias 34/35 fallaron únicamente por hashes aún pendientes; no se presentan como GREEN.
- **GREEN y triangulación observados:** mismo comando exit 0, primero 35/35 y después de refactor/negativos adicionales 38/38. Cubre los entrypoints reales con transportes interceptados, exactamente diez identidades/variables vacías, rechazo admin3/4 alojados y fallback por rol, aceptación local de cuatro admins sin credenciales alojadas, rechazo de orígenes remotos y servicios sin propiedad, parámetros/conteos/outcomes, hash del PDF y equivalencia de SQL generado. Estos tests no ejecutan SQL real.
- **Gates observados:** cada comando ejecutado en foreground dos veces, ambas exit 0, con prefijo exacto `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call`: `"npm run lint"` sin warnings; `"npm run typecheck"`; `"npm run test:unit"` 478 pruebas/30 archivos; `"npm run build"`. `git diff --check` PASS. No cambió `next-env.d.ts`; no fue necesario restaurar artefactos rastreados.
- **Pendientes honestos:** `npm run test:db`, `npm run test:e2e:full` y concurrencia SQL no ejecutados: no se verificó un servicio local de propiedad exclusiva, y el servicio principal/concurrente no se toca. Requieren Quality/application y database del SHA que publique el padre. No afirmar DB/E2E PASS, checks de PR nuevos, aceptación humana o revisión. Sin stage/commit/push/merge, operaciones alojadas, lectura/cambio de bóveda ni cambios al tracker del padre. Referencias de commit/revisión siguen pendientes.

### Continuación funcional de EXTRA-017 — contrato SQL de conteos de aceptación

- **Origen/autorización:** reparación acotada solicitada por el padre después del push de `efd15f4e255f140db232b0a7d81ec608a499d5d3`; no operación de autoridad de revisión.
- **Evidencia aportada:** Quality `37760793365`: tooling 38 PASS; database 858 tests/10 fallos y application falla durante reset por los mismos diez conteos de `002_fixture_counts.test.sql`. Inspección de fuente: esa prueba aún exige el seed pequeño aunque el runner selecciona aceptación. Sus dos páginas también conservan limit/offset 2, que pueden pasar SQL sin comprobar el protocolo aprobado de 10 filas.
- **Cambio previsto antes de editar:** restaurar los 13 conteos/consultas estrictos de aceptación conforme a `aac526a` y al manifiesto explícito, incluyendo activos, contrataciones/cobertura y páginas. Agregar contrato nativo contra las consultas SQL reales para impedir nueva divergencia. No derivar expectativas de conteos observados ni cambiar seeds, manifiesto, políticas o cuatro administradores municipales.
- **Superficies:** `supabase/tests/002_fixture_counts.test.sql`, prueba nativa de datasets, guía de credenciales y esta entrada. Demo interactiva sigue separada y verificada por generador/manifiesto; `supabase test db` después de reset default pequeño no es el comando de aceptación.
- **Verificación prevista:** RED/GREEN tooling y lint/typecheck/unit/build con Node 24.21.0/npm 11.19.0 efímeros; whitespace. DB/E2E pendientes de nuevo CI: ningún reset de servicios compartidos. No stage/commit/push/merge, operaciones alojadas/bóveda ni manipulación de revisión/tracker.
- **RED observado:** `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:tooling"` exit 1: 40 PASS/12 FAIL. Diez fallos por conteos pequeños frente a aceptación, más dos fallos por limit/offset 2 en lugar de 10. La búsqueda de candidato siguió pasando. Esto caracteriza la fuente SQL real sin ejecutar PostgreSQL; los diez fallos funcionales de CI son evidencia aportada por el padre.
- **Implementación/GREEN:** restaurados los 13 `select is` y sus consultas a la versión estricta de `aac526a` (solo comentarios nuevos de separación). Mismo comando exit 0, 52/52 PASS. Contrato cubre queries/filtros/joins/literales y páginas, junto con los guards/hashes/generador previos. Seed default, fixture/manifiesto y regresión de oferta terminal de 030 intactos.
- **Gates observados de esta continuación:** con el mismo prefijo efímero exacto y comandos `"npm run lint"`, `"npm run typecheck"`, `"npm run test:unit"`, `"npm run build"`: todos exit 0; lint sin warnings, unit 478 pruebas/30 archivos. `git diff --check` exit 0; repetición final del comando tooling exit 0, 52/52 PASS. `next-env.d.ts` sin diff; ninguna restauración necesaria. No instalación ni cambio de dependencias.
- **Límites actuales:** no se ejecutan DB/E2E locales porque no hay destino de propiedad exclusiva disponible; ningún reset de servicios compartidos. Nuevo CI del próximo SHA publicado por el padre sigue pendiente. No se acredita CI PASS ni aprobación del candidato reparado; sin operaciones de autoridad de revisión, stage/commit/push/merge, hosted/vault ni tracker.

### Continuación funcional de EXTRA-017 — CV ajeno según dataset

- **Evidencia aportada por el padre:** HEAD `1f24db63ddda617d05d4eab781235565461b2720`, Actions `37782732227`: database PASS, application FAIL en el guard Storage de `reset-local.mjs`. No se atribuye ese resultado a una filtración alojada ni a una política defectuosa: candidate2 tiene derivaciones legítimas para company1 en aceptación (participaciones 2/502, ofertas 1/51).
- **Cambio previsto antes de editar:** seleccionar candidate11 como CV extranjero para company1 en aceptación y conservar candidate2 en interactivo. Mantener las dos descargas positivas y los cuatro rechazos estrictos (CV ajeno de company1, target de company2, URL firmada y anónimo), con diagnóstico separado. No cambiar RLS, migraciones, criterios ni identidades.
- **Prueba prevista:** RED/GREEN nativo enlazado a la selección real de `otherPath`; reconstruir independientemente derivaciones activas desde parámetros/fórmulas del seed para ambos datasets, verificando target autorizado y probe verdaderamente extranjero. Guards y hashes previos intactos. SQL/Storage real y E2E pendientes del nuevo CI, sin servicios compartidos, Docker o Auth alojado.
- **Superficies/autoridad:** solo reset local, test nativo, guía y esta entrada; padre conserva tracker, revisión y entrega. No stage/commit/push/merge ni operaciones de autoridad/bóveda. Gates con Node 24.21.0/npm 11.19.0 efímeros, sin afirmar E2E verde.
- **RED observado:** `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:tooling"` exit 1, 54 PASS/1 FAIL: el CV configurado para aceptación tiene una derivación activa a company1. El mismo contrato interactivo y la presencia de todos los probes pasan. Test de contrato sobre selección real y enumeración independiente de parámetros/fórmulas de SQL; no ejecución PostgreSQL/Storage.
- **GREEN observado:** mismo comando exit 0, 55/55 PASS tras seleccionar 11/2 según dataset. Target1 sigue legítimamente referido a company1 y no a company2; el CV negativo existe y está referido a company2 pero no a company1. Se mantienen dos descargas positivas exactas/hash y cuatro negativos estrictos, ahora con mensajes separados. No cambios de políticas, seeds, manifiesto ni ventana de acceso.
- **Gates observados:** con el mismo prefijo exacto, `"npm run lint"`, `"npm run typecheck"`, `"npm run test:unit"`, `"npm run build"` exit 0; lint sin warnings, unit 478/30 archivos. `git diff --check` exit 0; repetición final tooling 55/55 PASS. `next-env.d.ts` sin diff, sin restauración necesaria. No se ejecutó cobertura instrumentada adicional, DB/E2E, reset real, Docker o hosted/vault. Nuevo CI del siguiente SHA del padre pendiente: database PASS/application FAIL de `37782732227` es evidencia previa aportada, no verificación de esta reparación.

### Corrección acotada de EXTRA-017 — R3-E2E-SEED-MISMATCH

- **Propuesta previa a cambios:** hallazgo nativo aportado por el padre: `test:e2e` público invoca Playwright crudo contra 4/4/8/8, incompatible con T095/SC-003/008/008A (500/50/100/1000).
- **Cambio necesario:** reutilizar el runner local protegido de `test:e2e:full` y reenviar argumentos al CLI Playwright directo, sin recursión ni duplicar resets. Superficies: package.json, runner, test nativo, guía operativa y esta entrada; datasets/Auth/RLS intactos.
- **Autorización/límites:** padre autoriza esta corrección de fuente; revisión observada del candidato corregido pendiente, no aprobada. Reset solo local propio; nunca servicio compartido/alojado.
- **Verificación prevista:** RED/GREEN tooling, lint/typecheck/unit/build con Node 24.21.0/npm 11.19.0; DB/E2E reales pendientes de CI aislado tras corrección de puertos por el padre.
- **Resultado observado:** `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 --call "npm run test:tooling"`: RED 56 PASS/1 FAIL (entrypoint público); GREEN 57/57, sin skips, incluido rechazo de confirmación ausente antes del transporte simulado. Mismo prefijo con `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:unit` (478/30) y `npm run build`: exit 0; lint sin warnings. Build con placeholders públicos ficticios solo en memoria.
- **Límites:** sin DB/E2E/CI ni aprobación nativa acreditados; guards/datasets/concurrencia intactos. `next-env.d.ts` restaurado byte-idéntico a HEAD; lockfile sin cambios. Diff whitespace PASS; sin acciones Git de escritura. Avisos npm de ESLint sin soporte y postinstall unrs-resolver no autorizado conservados.

## EXTRA-018 — Confirmación y visibilidad de contraseña (A01)

- **Fecha/responsable/estado:** 2026-10-17, Mateo; registrado antes de implementar,
  ahora implementado y verificado localmente. Revisión del compañero pendiente.
- **Origen y autorización:** arreglos.txt, decisiones directas y solicitud de Mateo
  de comenzar en `feat/portal-functional-adjustments`; A01/T098–T101 y FR-001/010/020.
  Alcance confirmado incorporado a spec, plan, contratos y matriz. La autorización
  acotada no acredita aprobación retrospectiva del Draft global ni revisión del compañero.
- **Problema/evidencia:** ambos formularios de autorregistro carecen de confirmación
  y de control de visibilidad; sus esquemas servidor aceptan el alta con una única
  contraseña. La actualización ya compara dos campos, pero no permite mostrarlos.
- **Cambio mínimo:** esquema compartido de 6–128 caracteres y coincidencia exacta,
  validación de acciones y servicios previa a Auth, componente cliente reutilizable
  para mostrar/ocultar, confirmación en ambos registros y ajuste de sus recorridos.
- **Superficies:** validadores, acciones y componentes de accounts/candidates/companies;
  pruebas unitarias, componentes y E2E; página de registro candidato para corregir
  la indicación de cuatro campos; artefactos citados y este registro.
- **Contratos/modelo:** confirmación transitoria descartada antes de Auth/metadata;
  sin migración, secretos, paquetes, roles, RLS ni cambios al diseño visual global.
- **Coordinación:** Mateo toma las funciones y su compañero lo visual según la
  distribución informada. El componente conserva estilos existentes y no modifica
  cimientos globales. Revisión del otro desarrollador mediante PR pendiente.
- **Riesgos y recuperación:** el campo se vuelve obligatorio también en servidor;
  adaptar clientes de pruebas que registran cuentas. Recuperación por reversión del
  incremento sin operaciones de base. No alterar el comportamiento de sesiones en A01.
- **Verificación prevista:** RED/GREEN de ausencia, discordancia, tamaño, acciones y
  payload de Auth; mostrar/ocultar sin envío ni pérdida de valor; tests existentes,
  typecheck, lint, build y navegador con datos ficticios. Resultados pendientes.
- **Revisión, aceptación y commit/PR:** pendientes; no acreditados.

### Resultados locales finales de EXTRA-018

- RED inicial: 30 FAIL / 10 PASS; recuperación nativa: 2 FAIL / 7 PASS. GREEN
  final: 520 pruebas/32 archivos con `npm run test:unit -- --maxWorkers=4`.
- `npm run typecheck`, `npm run lint` y `npm run build`: exit 0, Node 24.21.0/npm
  11.19.0. Se corrigieron un acceso opcional de mock y claves JSX de la prueba;
  sin desactivar reglas. El build TypeScript final también pasó.
- Dos builds se detuvieron en compilación dentro del sandbox y se cancelaron;
  la ejecución ampliada del mismo comando compiló correctamente. Vitest usó
  TEMP/TMP en `test-results/auth-tmp` tras un ENOENT de temporales del sandbox.
  Solo variables de proceso; sin cambios de configuración ni secretos.
- Chromium final: 3/3 PASS con teclado Enter/Espacio, confirmación independiente,
  conservación de datos en validación nativa y rechazo servidor ante bypass.
  Axe sin violaciones en ambos registros, sin desbordes a 360×800. El primer
  intento tuvo ambigüedad entre el alert del formulario y el anunciador de Next;
  se acotó el selector al formulario. El flag CLI de captura no soportado se
  retiró; no se modificó la política de capturas/trazas de la suite.
- Revisión técnica propia con guía React realizada; no equivale a revisión del
  compañero. Sin dependencias, migraciones, secretos ni datos reales agregados.
  `git diff --check` PASS. No se ejecutaron pgTAP ni recorridos completos privados
  con Auth/correo/DB. El cambio autenticado de contraseña se cubre en componentes
  y validación, no con un usuario real en navegador.
- T098–T101 verificadas; detalle en `docs/implementation/functional-adjustments.md`.
  Entrega mediante el PR de `feat/portal-functional-adjustments`; revisión del
  compañero y aceptación siguen pendientes.

### Detalle necesario de A01 — ancho del control en AuthSurface

- **Evidencia previa a editar:** `auth-forms.module.css` asigna `width: 100%` a todos
  los botones del formulario. Aplicado al nuevo control junto al input, puede
  ocupar el ancho de la fila y comprimir el campo en actualización de contraseña.
- **Cambio mínimo:** acotar `width: auto` a botones `type=button` con `aria-controls`
  dentro de esa superficie. Es compatibilidad del control funcional, sin cambiar
  paleta, layout global ni propiedad del diseño. Cobertura: build, tipos y revisión
  del componente; recorrido autenticado de actualización con DB pendiente.

### Detalle necesario de A01 — prevenir reinicio ante discordancia

- **Evidencia previa a editar:** el recorrido Chromium muestra el mensaje servidor
  correcto, pero React reinicia los campos no controlados después de la acción.
  Agregar la confirmación vuelve frecuente ese error y obliga a recargar datos.
- **Cambio mínimo:** el control actualiza la validez nativa de confirmación al
  editar cualquiera de las dos contraseñas. El navegador impide enviar valores
  distintos sin reiniciar campos; el servidor conserva la misma validación ante
  bypass o ausencia de JavaScript. No se almacenan valores en React ni en storage.
- **RED observado:** prueba adicional de componentes, 7 PASS / 2 FAIL, porque la
  discordancia no establece `validity.customError`. Verificar recuperación por
  edición de cualquiera de los campos y bypass de `novalidate` en Chromium.

### Continuación de EXTRA-018 — fallos de application en PR #52

- **Fecha/origen/autorización:** 2026-10-17; Mateo solicita reparar el job
  application del PR #52, commit `9392144`, Quality `39055781126`, job
  `117463342954`. Database, typecheck, lint, tooling y coverage aprobaron.
- **Evidencia previa a editar:** el alta de reclamante en
  `tests/e2e/assisted-candidate.spec.ts:98` usa `getByLabel("Contraseña")`, que
  ahora coincide con cuatro controles, y no completa confirmación. La prueba
  `candidate-self-service.spec.ts:118` recibe experiencia concatenada en lugar
  de la corrección exacta; su guardado anterior se sigue inmediatamente de
  `reload`, sin esperar la confirmación de la acción. No se atribuye todavía
  la concatenación a una causa de producto demostrada.
- **Cambio mínimo previsto:** adaptar el registro restante a coincidencia exacta
  y confirmación; comprobar el valor editado antes de enviar y esperar mensaje
  de éxito y botón habilitado antes de recargar. Mantener intacta la aserción
  del texto persistido y todos los recorridos, sin sleeps, retries ni skips.
- **Superficies/contratos/riesgos:** solo los dos E2E y evidencia documental de
  A01/T100–T101. Sin código de producto, permisos, esquema, dependencias o datos
  reales. El nuevo CI determinará si queda un problema adicional; no debilitar
  las expectativas para obtener un PASS.
- **Verificación prevista:** lint, typecheck, suite unitaria y recolección de E2E;
  nuevo commit y push al mismo PR para ejecutar los jobs aislados completos.
  Docker local no está iniciado; no se realizan resets ni cambios alojados.
- **Resultado local:** ambos E2E corregidos según el alcance anterior; typecheck y
  lint exit 0; unitarias 520/32 PASS; Playwright descubre 61 pruebas/15 archivos;
  whitespace PASS. El código de producto y el build anterior permanecen intactos.
- **Entrega/verificación funcional:** continuación en el mismo PR #52. El resultado
  remoto del SHA de corrección se conserva en sus checks Quality; esta entrada
  registra los resultados locales previos al push y no los sustituye. Revisión
  del compañero y aceptación global siguen pendientes.

## EXTRA-019 — Persistencia de sesión y navegación por cuenta (A02/A03)

- **Fecha/estado:** 2026-10-17; registrado antes de implementar.
- **Origen/autorización:** Mateo solicita continuar A02/A03 tras el merge del PR
  #52, en `feat/session-persistence-profile-navigation`; T102–T105 y FR-001/004.
- **Problema/evidencia:** proxy solo cubre account/update-password; los Server
  Components no pueden persistir cookies renovadas. Tres headers públicos
  muestran login de forma incondicional. El callback setAll recrea la respuesta
  y omite cabeceras del SDK: 0.12.7 entrega cache headers solo en la primera
  escritura, que no debe perderse ante una segunda escritura.
- **Cambio mínimo:** matcher para páginas/handlers dinámicos y acumulación por
  request de cookies/cabeceras; función server-only de enlace por cuenta activa;
  tres headers con sus clases existentes; invalidación de layout al login/logout.
- **Justificación/contratos:** conservar sesión válida al navegar, sin cambiar
  duración de Auth ni eludir revocación, suspensión, archivo, guards o RLS.
  El header recibe href/label sin PII. Modelo persistido y variables sin cambios.
- **Archivos:** proxy, accounts/actions/navigation, tres páginas públicas,
  pruebas unitarias/componentes/E2E y artefactos de trazabilidad citados.
- **Coordinación:** Mateo conserva funcionalidad y su compañero lo visual;
  no se rediseña ni cambia UI global. Revisión del compañero mediante PR pendiente.
- **Riesgos/recuperación:** identidad/cookies no deben entrar a caché compartida;
  conservar opciones y chunks eliminados, respuesta final y controles de seguridad.
  Reversión del código, sin recuperación de base ni migraciones.
- **Verificación prevista:** RED/GREEN matcher real de Next, setAll múltiple,
  relectura por request, visibilidad por rol, logout explícito y caché; regresiones,
  typecheck/lint/build y E2E local ficticio por rol con expiración de metadata
  de sesión sin falsificar firma JWT ni registrar tokens.
- **Fuentes técnicas:** documentación oficial Supabase SSR y código/tipos
  instalados de @supabase/ssr 0.12.7; sin cambios de dependencia. Checklists
  requirements 16/16 y mvp-readiness 77/77, sin edición de sus marcas.
- **Implementación:** `src/proxy.ts` amplía matcher y conserva cookies/opciones y
  cabeceras entre callbacks; `accounts/actions.ts` invalida layout al login/logout;
  `accounts/navigation.ts` proyecta solo href/label después de validar sesión/cuenta.
  Inicio/listado/detalle consultan proyección y ofertas en paralelo. Sin cambios
  de esquema, permisos, Auth expiry, dependencias, secretos o estilos globales.
- **RED/GREEN:** 18 FAIL / 26 PASS con el comportamiento anterior; focalizado
  final 52/52. Regresión final: 559 pruebas/35 archivos PASS; tooling 57/57;
  typecheck/lint/build exit 0. El primer typecheck del E2E detectó propiedad
  expires_at de tipo unknown; se proyecta como número tras validarla, sin any.
- **Navegador/consulta real:** tres cuentas ficticias activas verificadas mediante
  un conteo SQL de solo lectura. Chromium contra Supabase local existente:
  10/10 PASS; seis escenarios de renovación en rutas públicas/privadas por rol,
  enlaces correctos, recarga, restauración de cookies y logout; tres de contraseña
  y smoke público. Repetición de los seis de sesión incluyendo reutilización de
  cookies en otra pestaña después del logout: 6/6 PASS, acceso revocado y header
  público sin enlace privado. No se falsifica JWT; solo expires_at local del SDK.
- **Entorno:** Docker Desktop iniciado desde su instalación por usuario; el intento
  de la ruta global inexistente falló sin efectos. Contenedores locales existentes
  consultados, sin reset, cambios de negocio, migraciones ni operaciones alojadas.
  Configuración publicable local capturada en memoria desde CLI; no se imprimen
  tokens o claves ni se crean archivos env. Servidor Next de Playwright finalizado;
  Docker y servicios existentes permanecen activos. Build requirió ejecución
  ampliada por la limitación de Turbopack del sandbox ya observada en A01.
- **Observaciones/límites:** avisos Next “destination stream closed early” durante
  navegación, sin fallos del runner; no se investiga ni cambia streaming en este
  bloque. Colección completa 67 pruebas/16 archivos, sin afirmar su ejecución:
  CI completo, pgTAP, revisión del compañero y aceptación global pendientes.
- **Trazabilidad:** T102–T105 verificadas localmente; matriz y estado de implementación
  actualizados. Entrega por PR desde `feat/session-persistence-profile-navigation`;
  revisión del compañero e integración a `main` pendientes.

### Corrección de CI del PR #53 — contrato semántico de caché

- **Fecha/autorización:** 2026-10-17; Mateo solicita solucionar `application`.
  Continuación de EXTRA-019/T105 en la misma rama y PR, sin ampliar el producto.
- **Evidencia:** Quality #86, run `39065451675`, job `117492041374`: typecheck,
  lint, tooling, cobertura y build PASS; pgTAP 858 PASS y job database PASS.
  El E2E de métricas exige literalmente `private, no-store`, pero el proxy
  entrega `private, no-cache, no-store, must-revalidate, max-age=0`.
  Dos E2E PASS, uno FAIL y 64 no ejecutados por dependencia; no es un PASS global.
- **Cambio propuesto antes de implementar:** comprobar directivas `private` y
  `no-store`, rechazando `public`, tanto en el rechazo anónimo como empresarial
  del CSV en `tests/e2e/admin-metrics.spec.ts`. Mantener 403 y ausencia de datos;
  no reducir cabeceras, controles de acceso ni expectativas para ocultar fallos.
- **Justificación/alcance:** el contrato exige privacidad y no almacenamiento,
  no un orden o cantidad exacta de directivas. No cambia spec, plan, permisos,
  datos, dependencias, variables ni arquitectura. Revisión del compañero pendiente.
- **Riesgos/recuperación:** evitar aceptar directivas parecidas o una respuesta
  pública; separar por comas y comparar tokens completos. Reversión del test,
  sin migración ni recuperación de datos.
- **Verificación prevista:** reproducir el E2E actual contra servicios locales
  existentes sin reset; repetir corregido, typecheck/lint y nueva ejecución
  completa de Quality mediante commit/push al mismo PR.
- **Resultado local:** RED reproducido con el mismo error de Quality #86;
  GREEN 1/1 contra Next de producción y Supabase local existente, sin reset.
  El test ahora comprueba rechazo, privacidad, no almacenamiento y ausencia
  de datos para ambos actores; el código de producto permanece intacto.
  Typecheck, lint y `git diff --check` PASS. Se entrega la corrección por el
  mismo PR #53; el resultado remoto se registra en sus checks, sin inferirlo
  del resultado focalizado ni acreditar revisión humana.

## EXTRA-020 — Slugs públicos al publicar ofertas (FR-024A)

- **Fecha/responsable:** Máximo autoriza el 2026-10-17; ratifica publicar nuestra implementación el 2026-10-18 tras cierre sin merge del PR #54.
- **Problema/origen:** UUID visibles en enlaces públicos; se requieren URLs legibles, compartibles y estables sin cambiar identidad ni permisos.
- **Cambio:** `job_openings.slug` único, asignado en primera publicación y protegido contra cambios; título normalizado y sufijo aleatorio con reintentos/bloqueo. Backfill de publicación histórica, consulta pública por slug y enlaces asociados; UUID interno y RPC existente conservados.
- **Superficies:** migración `20261018000000_opening_public_slugs.sql`, pgTAP021, servicio/validación/tipos, páginas públicas y selección del candidato, pruebas y artefactos FR-024A. Sin rediseños de portada/administración ni alteración de navegación por sesión de PR #53.
- **Riesgos/recuperación:** migración, privacidad y concurrencia; aplicar base antes que aplicación. Recuperación preferida: revertir app y conservar slugs/RPC; nunca resetear demo ni regenerar enlaces. Contratos: `docs/validation/public-offer-slugs.md`.
- **Verificación/estado:** evidencia previa local y nueva entrega separadas en `odd/tasks/public-offer-slugs.md`. Checks del candidato recuperado, revisión independiente, historial remoto, migración y publicación pendientes; no afirmar aceptación municipal ni despliegue antes de lectura de retorno.
- **Autorización:** sesiones existentes GitHub/Vercel/Supabase, destino demo exacto autorizado; sin reset alojado, secretos publicados ni producción municipal. Identificadores EXTRA020/021 reconciliados con los EXTRA018/019 ya integrados.

## EXTRA-021 — Node 24 LTS y recuperación reproducible del entorno

- **Fecha/responsable/origen:** Máximo autoriza reparación local y actualización del runtime el 2026-10-17, necesarias para verificar y publicar FR-024A.
- **Cambio/evidencia:** Node24.22.0 LTS/npm11.19.1 oficiales, checksum verificado; manifiestos, `.node-version`, CI y guías activas alineados. `npm ci --ignore-scripts` corrigió junctions del adaptador ESLint hacia la ubicación anterior, sin cambiar el grafo de dependencias ni instalar globalmente.
- **Riesgos/recuperación:** entorno/CI; conservar engine-strict, scripts no aprobados desactivados, versiones históricas documentadas y Node global. Reversión de pins posible sin cambio de datos.
- **Verificación/estado:** controles previos de aplicación correctos; comprobar nuevamente recuperación sobre main y CI del commit exacto. Publicación autorizada; resultados y referencias en el ledger de entrega.
- **Compatibilidad alojada (2026-10-18, propuesta previa):** preview `6dcff5d` rechazado con EBADENGINE: Vercel ofrece Node24.21.0/npm11.19.0 y solo permite seleccionar Node por mayor. Mantener `.node-version`24.22.0 y CI exactos; expresar Node24LTS como `24.x` en engines/lock y fijar npm11.19.1 antes de `npm ci` en installCommand de Vercel. Se conserva engine-strict y no cambia el grafo. Agregar regresión del contrato de configuración; verificar preview real antes del merge.

## EXTRA-022 — A07: búsqueda pública de ofertas

- **Fecha/estado:** 2026-10-19; registrado antes de implementar. Mateo solicita
  continuar y abrir PR desde main actualizado (`43b94a7`); rama
  `feat/public-offer-search`. A04 público de Máximo se conserva; PR #54 descartado.
- **Origen/evidencia:** A07 de la matriz confirma texto/rubro/localidad/modalidad.
  El listado actual solo pagina. A05/A06 requieren diseño propio de carga privada;
  este bloque independiente no los implementa ni reabre la solución de slugs.
- **Cambio propuesto:** GET `/ofertas?q=&rubro=&localidad=&modalidad=&page=`;
  texto literal en título/tareas/requisitos, sin distinguir mayúsculas pero sí
  tildes; rubro por código del catálogo actual (no UUID), localidad/modalidad por
  valor completo sin distinguir mayúsculas/espacios exteriores. Filtros combinan
  con AND, se aplican antes de contar/paginar, orden actual intacto.
- **Contrato técnico:** vista `private.public_offer_rows` sin grants cliente
  centraliza la proyección y los mismos predicados vigentes. RPC nueva de búsqueda
  y de opciones; `published_offers` conserva firma y delega en la misma consulta.
  Opciones solo derivadas de ofertas visibles (rubros activos); sin catálogo
  municipal nuevo ni datos privados. Slugs y lookup del compañero intactos.
- **Entrada/UI:** Zod en servidor y servicio; q120, rubro50, localidad200,
  modalidad100, página1–10000 y tamaño1–30. Duplicados/arrays y excesos se rechazan
  sin consultar ofertas; mensaje español y filtros seguros. Formulario nativo GET,
  reinicia página al buscar; paginación conserva filtros y limpiar vuelve a listado.
- **Archivos/contratos:** migración de lectura sin backfill/tablas nuevas, servicio,
  validación/utilidad de URL, formulario/listado, pruebas, spec/plan/tasks y matriz.
- **Coordinación:** Mateo funcional, compañero visual/revisor; controles mínimos
  con estilos existentes, sin rediseño global. Revisión independiente del SQL/PR
  pendiente; no se afirma aprobación municipal o cierre de gates históricos.
- **Riesgos/recuperación:** filtrar antes de paginar; opciones no deben revelar
  borradores/suspendidas. SQL parametrizado y texto literal, sin wildcard/inyección.
  Helpers/vista privados, grants explícitos solo RPC de proyección. Aplicar base
  antes de app; rollback de app conserva funciones compatibles, sin borrar datos.
- **Verificación prevista:** RED/GREEN validación, transporte y componentes;
  pgTAP de filtros, total/páginas, equivalencia de proyección, grants y privacidad;
  navegador público/teclado/empty/URL/slugs, regresiones, tipos, lint, build y CI.
  Solo datos ficticios y destinos locales; sin reset de base existente ni cambios
  alojados. No se reutiliza la migración local descartada del PR #54.
- **Análisis focalizado previo:** seis criterios (cuatro filtros combinables,
  paginación/URL, opciones públicas, validación, compatibilidad y privacidad),
  cubiertos por T106–T110; sin cambios al modelo persistido, slugs o transiciones.
  Prerrequisitos Spec Kit resueltos contra la feature existente. Checklists
  históricos sin alterar; revisión propia no equivale a revisión independiente.
  RED inicial del servicio: 10 FAIL/4 PASS, comportamiento anterior ignora filtros.
- **Prerrequisito local detectado:** CLI `migration up --local` rechaza el historial
  por `20261017204435`, residuo ya informado del PR #54 descartado. No se borra ni
  se marca revertido, ni se recupera su código. Para validar sin reset se aplican
  exclusivamente los SQL revisados `20261018000000` (base integrada del compañero)
  y `20261019124218` (lectura A07) con psql transaccional/ON_ERROR_STOP contra el
  contenedor local exacto; después se registran como applied con repair solo si
  finalizaron. Se compara checksum de versiones/fechas. Historial previo intacto;
  CI fresco verifica únicamente las migraciones rastreadas y no este residuo.
- **Colisión local adicional:** el primer intento transaccional del SQL integrado
  revirtió completo: la RPC `published_offer_by_slug(text)` del PR #54 ya existe.
  Se reemplaza únicamente esa definición descartada por la del compañero dentro
  de la misma transacción de instalación, después de comprobar columna/helper
  exclusivos del residuo y ausencia del nuevo `slug`. No se borran columnas,
  referencias, registros ni historial. El SQL rastreado del compañero no se edita.
- **Resultado local:** instalación de ambas migraciones y registro applied
  correctos; checksum ID/versión/updated_at de ofertas idéntico antes/después.
  La migración A07 por sí sola no escribe negocio; pgTAP usa rollback.
  La vista usa security_invoker/security_barrier como defensa adicional; solo
  las RPC definer de proyección autorizada pueden leerla. Sin nuevos grants.
- **Implementado/verificado:** servicio y Zod, vista/RPC, formulario servidor con
  labels explícitos y GET, URLs/filtros/paginación/limpiar, error y vacío seguro.
  RED10 FAIL/4 PASS; focal49/49 antes del endurecimiento final de arrays/booleanos;
  regresión final603/39 archivos, tooling57/57, tipos/lint/build PASS.
  SQL final951/14 archivos (38 nuevas) PASS y advisor security sin hallazgos.
  Navegador final9/9: tres A07 y seis sesiones; teclado, persistencia, slug12hex,
  axe sin violaciones y sin overflow360×800. Se recolectan70/17, no se afirma
  ejecución local completa. Avisos de streaming Next existentes sin fallo final.
- **Incidencias de validación:** SQL072 comparó snapshots mientras el navegador
  hacía login (dos fallos de snapshot); sin cambios SQL, repetición secuencial
  completa PASS. No se redujeron sus aserciones ni se reseteó la base. El primer
  E2E detectó labels implícitos ambiguos por incluir opciones; se separaron labels
  y selects mediante id/htmlFor, no se eludió la verificación. Se aisla el alert
  de validación del anunciador de rutas de Next y se eligen opciones reales del
  fixture en vez de suponer Funes. Un pipe Zod rechazado por TS se reemplazó por
  transformación explícita string/number; no se introdujo any ni dependencia.
  E2E A07 final repetido3/3 usando una combinación pública con más de diez
  resultados, no primeras opciones independientes que podrían no coincidir.
- **Entorno/privacidad:** Node24.22/npm11.19.1 portable oficial verificado por SHA;
  global intacto. Sin tokens/claves en código, capturas/trazas de sesión ni nuevos
  env. Consultas y Auth solo locales/ficticios. Docker permanece activo; servidor
  Next de pruebas finalizado. No se aplicó SQL ni se desplegó a servicios alojados.
- **Entrega/límites:** T106–T110 verificadas localmente; runbook/matriz/artefactos
  actualizados. PR desde feat/public-offer-search; CI completo del SHA y revisión
  independiente pendientes al entregar. No se acredita aceptación municipal ni
  se cierran gates históricos; A04 privado, A05, A06 y A08 conservan pendientes.

## EXTRA-023 — Continuidad visual de Mi cuenta administrativa

- **Fecha y autorización:** 2026-10-19, Mateo solicita que el recorrido Inicio →
  Mi cuenta de administración muestre el menú lateral, como las páginas de `(admin)`.
- **Problema/evidencia:** `getAccountAccess()` dirige administradores a `/account`,
  pero esa ruta compartida usa AuthShell y pierde la navegación administrativa.
- **Origen:** ajuste visual explícito del diseño administrativo, sin cambiar A03,
  roles, rutas, acceso ni las reglas de cuentas individuales.
- **Cambio mínimo propuesto:** elegir AdminShell exclusivamente para el rol admin
  en la presentación de `/account` y marcar Mi cuenta como sección activa. Los
  otros roles conservan AuthShell. Guardias, consulta de otros administradores,
  exclusión de la propia cuenta, acciones y confirmaciones permanecen intactas.
- **Archivos/contratos:** `src/app/(auth)/account/page.tsx`, AdminShell local,
  tests de cuenta y documentación de diseño. No cambia contrato ni esquema.
- **Riesgos y verificación prevista:** evitar dos H1, comprobar navegación activa,
  aislamiento por rol, exclusión propia y controles de suspensión/reactivación;
  revisar responsive/axe/foco con fixtures ficticios; lint, tipos, suite y build.
- **Estado:** implementado y verificado localmente en `codex/frontend-admin-design`;
  autorizado por la instrucción explícita; revisión independiente pendiente.
- **Resultados:** 27 pruebas focalizadas y suite completa 620/40 aprobadas;
  lint, tipos y build aprobados. Nueve vistas ficticias de Mi cuenta por rol
  a 360/768/1366 px sin hallazgos axe, desbordamientos ni pérdida de foco en
  el recorrido muestreado. Un H1 y menú activo solo para admin. No se acredita
  sesión real ni cambios de cuentas contra backend; T087 sigue pendiente.

## EXTRA-024 — A08: catálogo amplio y coincidencias por oferta

- **Fecha/autorización:** 2026-10-19. Mateo solicita implementar A08 en
  `feat/job-categories-matching`; catálogo y coincidencia por al menos un rubro
  aprobados en la matriz. No acredita aceptación del producto.
- **Evidencia:** el seed solo incluye DEMO-A/B; no existe consulta de coincidencias
  desde la oferta. Las asociaciones múltiples y la nominación municipal ya existen.
- **Cambio necesario:** insertar quince rubros en `job_categories`, versión 2,
  y una RPC administrativa paginada que cruza ocupaciones/intereses activos
  con rubros de la oferta. Reutilizar la evaluación/nominación vigente.
- **Integridad:** conservar códigos, IDs, estado y asociaciones previas; no inferir
  equivalencias entre categorías anteriores y rubros nuevos. El importador
  sintético v1 permanece intacto. El catálogo persistido sigue siendo fuente única.
- **Archivos/contratos:** migración nueva, servicio/validación de matching, detalle
  de oferta y componente, tipos SQL, pruebas SQL/unitarias/UI/E2E y artefactos A08.
- **Privacidad/riesgos:** solo administrador activo con sesión vigente; sin DNI,
  contactos, CV, notas, ranking ni escritura al consultar. La empresa no recibe
  acceso. Revalidar estados al nominar/derivar con comandos existentes.
- **Verificación prevista:** RED/GREEN; OR sin duplicados, consentimiento,
  vigencia, disponibilidad, cuentas, CV y oferta; total antes de página; catálogo
  sin pérdida de referencias; permisos negativos; tipos/lint/build y navegador.
- **Análisis focalizado:** requirements16/16 y mvp-readiness77/77 sin editar sus
  marcas. Spec/plan/modelo/contrato y T111–T115 consistentes. Constitución: solo
  lectura municipal, permisos servidor/SQL, historial preservado, interfaz
  accesible y stack actual sin dependencias ni excepciones. Revisión técnica
  propia React: Server Components, Suspense, sin hooks/cachés privados compartidos.
- **Estado:** implementado y verificado localmente. Migración
  `20261019203041_job_categories_matching.sql` aplicada en transacción sobre
  Docker local y registrada solo tras comprobar SQL. Sin reset, migración remota,
  cambios de variables ni reparación de historias anteriores.
- **Resultados:** RED SQL: dos fallos intencionales (RPC ausente y cero rubros v2).
  Final: 655 unitarias/componentes/42 archivos; tooling57; tipos/lint/build PASS;
  pgTAP986/15 archivos, incluidas35 nuevas; advisor security sin hallazgos.
  Navegador12/12: tres A08, tres búsqueda pública y seis sesiones por rol.
  Axe del bloque sin violaciones y sin overflow a360×800. Un primer selector
  E2E ambiguo incluía el anunciador de Next; se acotó al main sin relajar el texto.
- **Archivos reales adicionales:** matriz, OPEN_QUESTIONS, implementation-status y
  runbooks A08/A07 (evidencia posterior aportada por Mateo). No se modifican
  seed, importador, Auth, estilos globales ni código visual del compañero.
- **Entrega/límites:** colección73 E2E/18 archivos, no suite completa ejecutada.
  Cobertura configurada del proyecto100% solo para env/schema, no del nuevo
  matching. Commit/PR, CI completo, revisión y aceptación pendientes.
  Avisos de cierre temprano de stream de Next observados en navegación, sin fallos
  en los doce recorridos; no se atribuye una causa ni se cambia código ajeno.

## EXTRA-025 — A08: perfil modal y nominación desde la oferta

- **Fecha/autorización:** 2026-10-19, solicitud explícita de Mateo: perfil en popup,
  nominación a la oferta actual, ocultar personas ya nominadas y tarjetas compactas
  en dos columnas. Amplía A08; no autoriza derivación automática ni cambios de roles.
- **Evidencia:** el primer A08 obliga a salir al perfil, lista casos existentes y
  ocupa una sola columna en la mitad del detalle. Mateo ya aplicó/registró
  `20261019203041` en Supabase alojado, con catálogo15, función presente y anon
  bloqueado; captura de CLI y resultados aportados por el operador, no inspección
  remota del agente.
- **Cambio mínimo:** diálogo nativo accesible, consulta laboral administrativa
  bajo demanda y nominación explícita con el comando existente/versiones vigentes.
  Dos columnas desde md y doce fichas por página, una columna en móvil. Excluir
  antes de contar/paginar cualquier participación no archivada en esa oferta,
  también postulaciones: el comando existente prohíbe duplicarlas, sin importar
  origen/estado. Las participaciones siguen consultables en su pantalla propia.
- **Contrato/seguridad:** perfil laboral, rubros y CV vigente, sin DNI/contactos/
  notas; comprobar sesión/rol/aptitud/empresa/oferta y coincidencia al abrirlo.
  Nominar revalida cuenta, oferta, consentimiento y versiones transaccionalmente;
  no concede acceso empresarial. Carga/error/duplicado/conflicto, Escape, foco y
  solicitudes tardías cubiertos. Sin reintento automático de nominación tras
  refrescar versiones; actualizar la lista sí requiere revalidación/refresh.
- **Migración:** nueva forward-only para consultas; no editar SQL ya aplicado ni
  catálogo. Pool privado invocador compartido por lista y preview, sin permisos
  clientes. RPC pública de preview exige administrador; no nuevas tablas.
- **Archivos:** migración nueva, matching-service/validation/action, componentes
  de lista/diálogo, detalle de oferta, revalidación de nomination-actions, tipos,
  contratos/spec/plan/tareas y tests SQL/unitarios/UI/E2E/HTTP.
- **Verificación prevista:** RED exclusión; igualdad conteo/página, permisos y
  preview; nominación real con auditoría y no duplicación en SQL; navegador
  apertura/cierre/foco/columnas/nominar/desaparición/recarga y móvil/axe;
  tipos/lint/suites/build.
- **Estado/resultados:** implementado y verificado localmente; review pendiente.
  689 unitarias/componentes/43 archivos, tooling57, tipos/lint/build PASS;
  pgTAP1007/16 archivos (21 nuevos y35 de matching actualizados), advisor security
  sin hallazgos. Navegador13/13 (A08×4, A07×3, sesiones×6), autorización HTTP8/8
  PASS incluyendo preview. Colección74/18, no ejecución completa ni CI remoto.
  Cobertura configurada100% solo de env/schema, no del feature completo.
- **Verificación funcional:** popup bajo demanda, CV, Escape/foco, dos columnas,
  doce fichas, paginación, móvil360×800/axe; nominación real a la oferta actual,
  exclusión tras recarga, un único caso under_review/admin_nomination y cero
  derivaciones nuevas. SQL1007 se ejecutó primero; el navegador dejó después una
  participación ficticia adicional (1001 total), preservada con su auditoría.
- **Revisión técnica propia:** predicado SQL compartido, guards de actor/sesión y
  rol, ACL cerradas, validación de entradas/salidas, conflictos de versiones,
  sin caché privada compartida. Server Component bajo Suspense y cliente acotado,
  diálogo nativo, guardia de respuestas tardías y doble envío; sin nuevos any,
  dependencias ni cambios globales de estilo. No equivale a revisión independiente.
- **Operación:** migración20261019205940 aplicada/registrada solo localmente;
  primera A08 alojada según recibo del operador, ampliación alojada pendiente.
  Se cerró el next dev identificado con autorización expresa de Mateo y se usó
  build/servidor propio con destinos locales explícitos, sin editar `.env.local`.
  Servidor de pruebas cerrado al finalizar, puerto3000 libre y Docker conservado.
  Continúan avisos de stream de Next durante navegación pese a los recorridos
  PASS; sin atribuir causa ni corregir framework ajeno. Se restaura la variación
  generada dev de next-env que ya existía antes de la intervención.
- **Límites:** sin aplicar SQL remoto ni commit/PR en este paso. Preservar cambios
  anteriores de A08 y `next-env.d.ts`, modificado fuera de esta intervención.

## EXTRA-026 — A08: candidatos debajo de la oferta

- **Fecha/autorización:** 2026-10-19, Mateo solicita únicamente mover los candidatos
  debajo de la información de la oferta; informa que la migración anterior funciona.
- **Evidencia/origen:** A08/T119 coloca el bloque de coincidencias antes del detalle.
  El ajuste solicitado es de orden visual, no del contrato ni del flujo municipal.
- **Cambio mínimo:** mover el Suspense de coincidencias después del grid existente
  de información/moderación e historial. Conservar todo el ancho, dos columnas de
  fichas y el popup con nominación; no tocar SQL, servicios ni permisos.
- **Archivos:** página administrativa de oferta, test de orden en admin-pages,
  spec/plan y este registro. Sin nuevos estados, dependencias ni variables.
- **Riesgos/verificación:** proteger el orden DOM y ubicación fuera del grid con
  prueba de componente; comprobar regresión UI, tipos/lint/build y whitespace.
  Preservar cambios anteriores de la rama y next-env generado fuera del ajuste.
- **Estado/resultados:** implementado; RED1/17PASS del orden anterior y GREEN33/33
  de página/popup. Suite690/43 archivos, tipos/lint y whitespace PASS. Revisión
  propia: solo reordenamiento del Server Component, Suspense conservado, sin
  hooks, permisos ni datos adicionales. No se repiten SQL/E2E en este ajuste.
- **Límites:** build nuevo pendiente para no interferir con el next dev activo
  del usuario en puerto3000; no se detuvo ni reinició su proceso. El build previo
  no se acredita como nuevo. Revisión y PR pendientes; no acredita despliegue
  ni inspección remota del agente. next-env conserva sus imports dev previos.
- **Entrega posterior solicitada:** Mateo pide revisar/actualizar el PR. GitHub
  confirma PR60 mergeado, ningún PR abierto ni rama remota A08: corresponde crear
  uno nuevo, no modificar el PR60. Build final PASS con Node24.22/npm11.19.1,
  destinos loopback y clave publicable ficticia. Se verificó en el Next instalado
  que la limpieza de build conserva dev; no se detuvo el servidor del usuario.
  Este resultado reemplaza el pendiente de build anterior, no acredita CI remoto.
- **Referencia de entrega:** implementación `11be483`, publicada en
  [PR61](https://github.com/maximo-Pdev/funes-empleo/pull/61), abierto contra main.
  Incluye EXTRA024–026; próximo paso: checks del SHA publicado y revisión humana.
  Se conserva solo next-env generado como cambio local fuera del commit.

## EXTRA-027 — diagnóstico y reparación del registro/verificación

- **Fecha/autorización:** 2026-10-20. Mateo informa que dejó de funcionar el
  registro y que el correo abre una versión antigua; solicita limitar el arreglo
  a esos fallos y reemplazar la rama anterior.
- **Base/seguridad:** PR61 mergeado confirmado; main6607854 actualizado, rama
  anterior local/remota borrada tras verificar inclusión. Nueva rama
  codex/fix-registration-verification; next-env generado previo se conserva.
- **Evidencia inicial:** candidato/empresa ignoran el error devuelto por signUp
  y muestran respuesta genérica por diseño no enumerativo. Ambos usan
  NEXT_PUBLIC_APP_URL/auth/callback; callback también redirige a esa base.
  Configuración pública local: origen localhost3000 y Supabase alojado.
  Consulta pública de Auth confirma registro/email habilitados y confirmación
  exigida; no se enviaron correos ni crearon cuentas alojadas para diagnosticar.
  No se conoce todavía el error concreto ni URL final deseada del operador.
- **Propuesta/verificación:** reproducir registro y verificación de ambos roles
  en Supabase Docker/mailbox local, sin reset; contrastar el destino del correo,
  callback y sesión. Revisar configuración URL/allowlist/plantilla del entorno
  afectado con evidencia antes de modificarla. Preservar no enumeración, PKCE,
  confirmación obligatoria, roles y RLS; no desactivar controles ni eludir cuotas.
- **Archivos/contratos previstos:** pruebas de registro/callback, servicios Auth
  y documentación operativa según causa comprobada; sin autorizar cambios de
  campos o rediseño. Una modificación derivada se detalla aquí antes del código.
- **Riesgos/límites:** no recibir enlaces de correo con tokens ni datos reales;
  no inventar dominio nuevo ni inspección remota. No cambiar variables alojadas,
  SMTP ni datos compartidos sin diagnóstico y destino confirmado. Solo pruebas
  ficticias locales; build/tipos/lint y suites relevantes tras la corrección.
- **Estado:** diagnóstico en curso; causa y reparación aún no acreditadas.
- **Diagnóstico confirmado:** Mateo prueba https://funes-empleo.vercel.app y
  reporta ausencia de mensaje. Prueba publicada con datos ficticios inválidos
  devuelve el mensaje seguro esperado, sin alta ni correo. Callback público sin
  token redirige al mismo dominio actual (307/no-store), no al demo anterior.
  Dashboard Supabase con sesión del operador muestra Site URL del demo antiguo
  y solo sus dos callbacks permitidos; custom SMTP desactivado y plantillas
  predeterminadas. No se atribuye todavía el fallo de alta a una cuota concreta.
- **Cambio operativo propuesto:** Site URL al dominio actual y agregar callback
  de verificación/recuperación actual, conservando ambos anteriores. Pendiente
  confirmación específica solicitada antes de guardar destinos de autenticación.
  Sin tocar SMTP, confirmación, sesiones ni cuentas. Vercel conectado no expone
  este proyecto; no se realizaron cambios allí ni se intentó otro acceso.
- **Prueba local nueva:** registration-verification.spec.ts cubre ambos roles:
  alta, correo con destino exacto, bloqueo antes de verificar, callback, sesión,
  bootstrap del perfil y recarga. 2/2 PASS sin cambiar código de aplicación.
  Primera ejecución falló solo por esperar el texto antiguo de Rol; el correo y
  la sesión ya funcionaban. Se corrigió la expectativa al texto real, sin quitar
  comprobación del rol. Deja cuentas ficticias locales; no se borra ni resetea.
- **Respuesta posterior:** Mateo confirma URLs antiguas, informa que el formulario
  candidato borra los datos (empresa no probada) y que no tienen SMTP/remitente.
  Pregunta el motivo del cambio de URL: no constituye aprobación para guardarlo.
  Configuración alojada aún intacta. El registro público general queda limitado
  por SMTP integrado; no se elige proveedor ni se habilita Resend de oficio.
- **Verificación final del diagnóstico:**690 unitarias/43 archivos, tipos/lint y
  build PASS; E2E2/2 con reuso de enlace rechazado sin tokens en destino. Solo
  pruebas/documentación nuevas, código de aplicación intacto. El servidor propio
  quedó cerrado y puerto3000 libre; Docker e identidades ficticias conservados.
  Sin commit/PR ni nueva migración. Corregir el destino requiere confirmación y
  correo público requiere configuración SMTP; no se declara el incidente resuelto.

- **Autorización operativa posterior:** Mateo responde «cambialas entonces» el
  2026-10-20, confirmando Site URL actual y sus dos callbacks exactos propuestos.
  Se verificó nuevamente el proyecto y los valores antiguos antes de guardar;
  conservar ambos destinos anteriores. Esta autorización no incluye SMTP,
  envío de correos, alta de usuarios, cambio de credenciales ni despliegue.
- **Operación ejecutada/verificada:** guardado en dashboard Site URL
  https://funes-empleo.vercel.app; toast Successfully updated site URL. Agregados
  los callbacks exactos de verificación y recuperación actuales; toast Successfully
  added 2 URLs. Lectura posterior muestra Site URL actual y cuatro destinos:
  ambos anteriores conservados y ambos nuevos. Captura de evidencia guardada
  fuera del repositorio. Sin SMTP, nuevas cuentas, correos, SQL ni deploy.
  Queda corregida la configuración de destino; entrega real de correo y registro
  público general siguen pendientes de SMTP y prueba autorizada del entorno.

## EXTRA-028 — validación visible y conservación de formularios

- **Fecha/autorización:** 2026-10-20. Mateo pide en todos los formularios asterisco
  rojo para obligatorios, bordes rojos y explicación junto a cada campo incorrecto,
  instrucciones claras y conservar lo cargado ante cualquier error. Incluye
  registro, acceso, perfiles, empresa, administración, búsqueda y archivos.
- **Evidencia:** 29 archivos contienen formularios, con validación nativa, manual
  y Server Actions mezcladas. React reinicia inputs no controlados después de
  resolver una Action aunque su resultado informe error. TextField/SelectField
  muestran obligatorio como texto y muchos labels no tienen aviso ni error local.
- **Cambio mínimo compartido:** Form y Field declarativos con contexto de errores,
  asterisco accesible, mensajes españoles por restricción, foco al primer error,
  resumen y limpieza del error al corregir; no manipular DOM de React ni duplicar
  validadores del servidor. Integrar todos los forms/labels y componentes comunes.
  Evitar reset automático en fallo y permitirlo solo tras éxito explícito; datos
  y archivos permanecen en el DOM de esa página, nunca en storage/logs/URL nuevos.
- **Validación:** mantener opcionales y borradores incompletos existentes; reflejar
  requisitos condicionales/confirmaciones y grupos de al menos un contacto/fecha.
  Mantener mensajes no enumerativos y permisos/validación servidor. El color no
  es el único indicador: aria-invalid, descripciones y texto junto al control.
- **Archivo/CV:** evitar navegación destructiva en fallo de carga, mediante
  respuesta JSON opt-in del handler existente y cliente acotado. Mantener el
  POST/303 previo como compatibilidad, límites PDF y autorización intactos.
  La regresión completa detectó una carrera entre aviso de carga y refresh de
  versión del perfil: el éxito definitivo espera las props actualizadas, con
  prueba que retiene deliberadamente la respuesta RSC antes de activar. También
  se evitan refresh automáticos en conflictos y períodos invertidos de métricas.
- **Archivos/contratos:** componentes/forms, TextField/SelectField/PasswordField,
  29 consumidores, endpoint CV solo respuesta opt-in, estilos acotados, pruebas
  UI/E2E/unitarias y artefactos de especificación. Sin dependencias ni migración.
  Ajustar los dos selectores de hijos directos de formularios candidato/empresa
  para que el nuevo contenedor Field conserve el ancho completo de textareas;
  no cambiar columnas, tamaños ni dirección visual existentes.
- **Riesgos/verificación:** límites cliente/servidor, filtros GET, campos dinámicos,
  radio/checkbox/select, confirmación de contraseña, archivos, Enter/foco/lector,
  error servidor y doble envío. RED/GREEN, inventario sin forms aislados, suites,
  tipos/lint/build, navegador por rol y axe/responsive con datos ficticios locales.
- **Análisis/gates:** checklists requirements16/16 y mvp-readiness77/77 PASS,
  leídas sin cambiar marcas; sin hooks registrados. Constitución: simplicidad,
  privacidad, accesibilidad y controles servidor conservados. User autoriza el
  cambio transversal; no altera requisitos municipales ni diseño global ajeno.
- **Implementación real:** Form/Field/validation/identifier-fields y CSS común;
  TextField/SelectField/PasswordField; 40 usos de Form en 29 archivos de consumidores
  candidatos, empresas, acceso, administración, participaciones, derivaciones e
  importación; CvUploadForm y respuesta opt-in del handler. Dos selectores CSS
  conservan el ancho existente. Spec/plan/contrato/tareas y guía de formularios
  alineados; matriz A18 agregada. Sin dependencias, tablas o migración.
- **Verificación real:** RED inicial4/4; GREEN final729 tests/49 archivos,
  tooling57, typecheck/lint/build PASS. Inventario AST sin forms/labels aislados
  ni controles sin Field. Navegador20/20: validación por campo, corrección, foco,
  contraseña y registro real local, rechazo de Action/login, grupos, métricas,
  CSV/PDF retenidos, CV válido con RSC retenida y activación posterior, candidato
  y empresa completos, filtros y sesiones. HTTP privado8/8 aislado PASS. Axe sin
  violaciones en recorridos comprobados; teclado y móvil360×800 sin overflow.
  Revisión React: hooks en nivel superior, IDs/ayudas estables, sin any ni
  persistencia de datos personales, sin cambiar reglas de negocio o permisos.
- **Incidencias corregidas:** la prueba de carga/activación reveló aviso de éxito
  antes de refrescar versión; se agrega guardia y regresión determinista. Un
  intento de ejecutar HTTP y UI simultáneamente alteró el conteo global de
  auditoría de los tests HTTP; la repetición aislada8/8 pasa sin relajar aserciones.
  Mantener el orden de proyectos de Playwright; no mezclar con --no-deps.
- **Estado/límites:** implementado y verificado localmente; T121–T125 completos.
  Sin commit, PR, CI nuevo, revisión independiente, NVDA o aceptación acreditados.
  No se ejecutó la suite E2E completa ni se cerraron gates históricos. Pruebas
  solo contra Supabase local, sin reset; quedan datos y auditoría ficticios.
  Se conserva EXTRA027, la modificación previa de next-env y Docker activo.
  Este incremento no toca servicios alojados ni SMTP: el correo público continúa
  bloqueado por proveedor/remitente pendientes. Datos conservados solo mientras
  permanece la página abierta; límites CV5MiB y A06 pendiente se mantienen.

- **Ajuste de texto solicitado por Mateo, 2026-10-20:** quitar del resumen de
  errores la frase sobre conservación; mantener “Revisá el campo indicado.” o
  “Revisá los N campos indicados.” sin cambiar validación ni retención. Afecta
  Form y su regresión de texto exacto; 12 pruebas focalizadas, ESLint de ambos
  archivos y diff --check PASS. Solo cambia el aviso; conservación intacta.

## EXTRA-029 — registros compactos y tarjetas simétricas

- **Fecha/autorización:** 2026-10-20. Mateo pide simetría entre tarjetas de
  registro y evitar scroll innecesario en1920×1080, reduciendo componentes y
  espacios sobredimensionados sin ocultar contenido simple.
- **Evidencia:** ambas páginas duplican estructura, usan columnas0.95/1.05 con
  items-start, padding de40px, controles48px y otra tarjeta solo bajo el formulario.
  Esto produce alturas/anchos diferentes y exceso vertical, especialmente empresa.
- **Cambio propuesto:** layout servidor común solo para ambos registros, columnas
  iguales y stretch en escritorio, espacios/títulos más compactos, controles44px,
  campos distribuidos en dos columnas donde haya espacio y ayuda de verificación
  integrada en la tarjeta. Conservar todos los campos, mensajes, enlaces y avisos
  de intermediación/verificación documental. Sin alturas fijas, overflow oculto ni
  scroll interno; móvil, zoom y errores pueden extender la página naturalmente.
- **Origen/archivos:** solicitud directa, formularios EXTRA028; páginas de ambos
  registros, nuevo RegistrationLayout/CSS local, tests visuales/componentes y
  spec/plan/tareas/guía Auth. Sin tocar acciones, contratos de datos, permisos,
  catálogo, base, dependencias, SMTP o estilos de otros formularios.
- **Riesgos/verificación:** medir tarjetas y ausencia de scroll inicial1920×1080,
  controles≥44px, móvil360×800, ancho intermedio/zoom equivalente, errores completos,
  orden de teclado y axe; regresiones de registro, tipos/lint/build. Revertir solo
  layout/páginas/estilos restaura presentación anterior sin tocar datos.
- **Constitución/análisis:** reutiliza React/Next/Tailwind/tokens y SVG existentes;
  no añade servicios ni resuelve decisiones municipales. Cambios previos y rama
  dedicada se conservan; revisión visual autorizada por Mateo, sin requerir nueva
  aprobación del compañero para ejecutarla. Revisión/aceptación global pendientes.
- **Implementación real:** RegistrationLayout servidor con configuración por rol,
  registration.module.css y dos páginas consumidoras; se mantienen los componentes
  funcionales de registro sin modificarlos. Guía Auth/spec/plan/tareas alineados,
  matriz A19. Controles44px, gaps8px, columnas iguales y ayuda dentro de la tarjeta.
- **Verificación:** RED2/3 en regresión de estructura; GREEN732 pruebas/50 archivos,
  tipos/lint/build PASS. Navegador6/6: tarjetas de igual ancho/alto e inicio sin
  scroll1920×1080 y1920×960, controles≥44px, móvil360×800 y reflow960×540 sin
  overflow horizontal, campos/ayuda alcanzables, errores visibles y teclado de
  contraseña. Axe sin violaciones; capturas vacías de ambos registros revisadas.
  Primera medición requirió esperar visibilidad/clic estable antes de foco y
  reducir separación para el margen vertical960; no se ocultó contenido.
- **Estado/límites:** implementado y verificado localmente; T126–T128 completos.
  Servidor propio de pruebas en3001 para preservar el servidor ajeno en3000;
  sin altas, correos ni cambios alojados en este ajuste visual. No se repitieron
  recorridos Auth con envío real, suite E2E completa, NVDA o zoom real200%.
  No acredita aceptación global, CI, revisión independiente, commit ni PR.
  Sin migración, dependencias o variables persistidas nuevas. Presentación local
  a registros; contenido puede crecer con errores/móvil/zoom sin scroll interno.

## EXTRA-030 — alternar tipo de registro

- **Fecha/autorización:** 2026-10-20. Mateo solicita cambiar desde el registro de
  postulantes al de empresas y viceversa sin volver al inicio.
- **Problema/origen:** EXTRA029 comparte layout pero no ofrece navegación directa
  entre ambos tipos. Ajuste explícito de acceso a los registros existentes.
- **Cambio mínimo:** selector con enlaces “Soy postulante”/“Soy empresa” en la fila
  superior del layout, activo con aria-current. Navegación normal, sin enviar
  formulario ni compartir/persistir contraseñas o datos entre roles.
- **Archivos/riesgos:** RegistrationLayout, tests de páginas y navegador, guía Auth
  y artefactos. Conservar simetría y encaje1920×1080/960; envolver en móvil sin
  overflow, controles≥44px y teclado accesible. Sin acciones/Auth/SQL nuevos.
- **Verificación prevista:** destinos y estado activo por rol, cambio de ida/vuelta
  con campos del formulario destino, medidas/responsive/axe, tipos/lint/build.
- **Resultado:** implementado en el layout común; enlaces a ambas rutas y tipo
  activo, sin añadir estado cliente. Regresiones de páginas3/3, navegador7/7,
  tipos/lint/build PASS. Se probó ida/vuelta sin POST, encaje1920×1080/960,
  simetría, móvil/reflow, errores, teclado y axe. No se repitió la suite completa.
- **Estado:** verificado localmente; T129 completo. Cambiar de página puede
  descartar borradores; no implica conservación entre registros. Sin cambios
  alojados, datos, migración o dependencias. Commit/PR/revisión pendientes.

## EXTRA-031 — inicio de sesión compacto y acceso al registro arriba

- **Fecha/autorización:** 2026-10-20. Mateo pide subir la tarjeta “¿Todavía no
  tenés cuenta?” y aplicar al login la simetría y ausencia de scroll innecesario
  verificadas en los registros.
- **Evidencia:** login mantiene columnas0.95/1.05/items-start, paddings40px,
  controles48px y tarjeta de registro debajo, fuera del primer bloque de acceso.
- **Cambio mínimo:** tarjeta de registro de ancho completo antes del grid de
  información/acceso; debajo dos tarjetas iguales/stretch y contenido compacto.
  Reutilizar estilos locales de entrada, con variante login de una columna para
  credenciales. Conservar todos los accesos, mensajes, formulario y avisos.
- **Archivos/contratos:** login/page, módulo CSS de entrada, pruebas de página y
  navegador, guía Auth y spec/plan/tareas. Sin tocar AuthForm, acciones, contraseña,
  sesiones, permisos, contratos de datos, SQL, SMTP, dependencias o env persistido.
- **Riesgos/verificación:** no recortar contenido ni fijar alto/scroll interno;
  medir encaje1920×1080/960 y tarjetas simétricas, móvil360×800/reflow960×540,
  controles≥44px, orden DOM del registro, enlaces reales, errores/retención,
  teclado/axe y regresiones de registros; tipos/lint/build. Revertir presentación
  restaura el login anterior sin afectar datos ni autenticación.
- **Implementación:** tarjeta de registro superior de ancho completo y dos
  tarjetas principales iguales. Login reutiliza las bases compactas locales con
  credenciales en una columna. AuthForm/acciones intactos; estilos nuevos solo
  mediante clases específicas de login. Guía/spec/plan/tareas y matriz A21 al día.
- **Verificación:** RED1/3 por orden DOM; GREEN735 tests/51 archivos, tipos/lint/build
  PASS. Navegador11/11 (login4, registros7): orden/dimensiones, sin scroll inicial
  1920×1080/960, controles≥44px, móvil360×800/reflow960×540 sin overflow, teclado,
  axe y errores/retención, enlaces de alta reales. Captura vacía revisada. La
  medición excluye inputs ocultos internos de Actions; no se ocultaron controles.
- **Estado/límites:** implementado/verificado localmente, T130 completo. Pruebas
  visuales en3001 sin detener servidor ajeno; sin alta/envío/cambios alojados.
  No se repitió toda la suite E2E, Auth privado/HTTP, NVDA ni zoom real200%.
  Sin migración, dependencias, variables persistidas, commit o PR nuevos. Gates
  históricos, revisión independiente, CI y aceptación global siguen pendientes.

## EXTRA-032 — Login: aprovechar la altura disponible

- **Fecha/responsable/autorización:** 2026-10-20, Mateo; solicitud explícita de
  ampliar en altura ambas tarjetas principales del login, conservando lo aprobado.
- **Problema/evidencia/origen:** EXTRA031/T130 deja espacio libre bajo las tarjetas
  en escritorio1920×1080; el usuario pide aprovecharlo manteniendo su simetría.
- **Propuesta/justificación:** T131; distribuir la altura mínima de la página con
  flex y estirar la grilla solo en escritorio. Sin alturas fijas, recortes ni scroll
  interno; móvil y contenido largo conservan crecimiento natural.
- **Archivos/contratos/riesgos:** página login, CSS compartido con clases específicas
  de login, E2E de layout y documentación. Sin cambios de Auth, datos, dependencias,
  contratos o entorno. Evitar afectar los registros o esconder errores en pantallas bajas.
- **Verificación prevista:** medir crecimiento entre1080/960, simetría, ausencia de
  scroll innecesario, móvil/reflow/errores/teclado/axe y regresión de registros;
  tests unitarios, tipos, lint y build. Revertir las clases restaura la presentación.
- **Implementación/verificación:** clases de página/contenido/grilla exclusivas
  del login; tarjetas de817px en1080 y697px en960, mismo ancho/alto y sin scroll
  inicial.735 tests/51 archivos, tipos/lint/build y navegador11/11 PASS. Registros,
  móvil360×800, reflow960×540, escritorio bajo1280×540, errores/retención, teclado
  y axe sin regresiones. Captura1920×1080 revisada.
- **Estado/límites:** implementado y verificado localmente; T131 completo. Pruebas
  visuales en3001 sin detener servidor ajeno, sin alta/envío/cambios alojados ni
  reset de datos. No se repitió suite E2E privada, NVDA o zoom real. Sin commit/PR,
  revisión independiente, CI, aceptación nueva ni cierre de gates históricos.

## EXTRA-033 — Login: información a la izquierda, registro e ingreso a la derecha

- **Fecha/responsable/autorización:** 2026-10-20, Mateo; disposición solicitada
  mediante esquema adjunto. Sustituye la ubicación a todo el ancho de EXTRA031
  y la igualdad de altura entre tarjetas individuales de EXTRA032.
- **Problema/origen:** T132; el usuario prefiere una tarjeta informativa alta a
  la izquierda, junto a una columna con registro arriba e inicio de sesión debajo.
- **Refinamiento antes de verificar:** Mateo observa demasiado espacio vacío en
  la captura y solicita centrar el conjunto sin estirar las tarjetas. Sustituye
  el aprovechamiento forzado de altura de EXTRA032 y de la propuesta inicial.
- **Propuesta/justificación:** mover el registro a la grilla existente y definir
  áreas CSS locales; información ocupa ambas filas en escritorio, con bordes
  superior/inferior alineados con la columna derecha. Mantener anchos iguales,
  altura según contenido y conjunto centrado verticalmente cuando haya espacio,
  sin expandir la grilla al viewport. Estética actual y controles compactos. En móvil: registro,
  login e información, sin ocultar contenido ni scroll interno.
- **Archivos/contratos/riesgos:** página login, CSS Module de entrada, pruebas
  de componentes/E2E, spec/plan/tareas y guía/matriz/estado. Sin cambios de Auth,
  datos, contratos, dependencias o configuración. Evitar afectar los registros,
  el orden de teclado o la visibilidad de errores en pantallas pequeñas.
- **Verificación prevista:** estructura y medidas de las dos columnas y filas,
  encaje1920×1080/960, móvil/reflow/escritorio bajo, errores/retención, enlaces,
  teclado/axe, regresión de registros, tipos/lint/tests/build y captura revisada.
  Recuperación: revertir presentación sin cambios de datos.
- **Implementación/verificación:** registro dentro de la grilla, guía abarcando
  ambas filas; filas automáticas y conjunto centrado sin flex-grow de la grilla.
  Alturas estables entre1080/960, límites alineados y sin scroll inicial. RED1/3
  de estructura; GREEN735 tests/51 archivos, tipos/lint/build y navegador11/11
  PASS. Incluye móvil360×800/reflow960×540/escritorio bajo1280×540, errores y
  retención, teclado/axe/enlaces y regresión de registros. Captura1920×1080 revisada.
  Se corrigieron los accesos de prueba posiblemente undefined y la medición antes
  de visibilidad; tipos se repitió secuencialmente tras una colisión con el build.
- **Estado/límites:** implementado/verificado localmente, T132 completo. Solo
  presentación: sin migración, dependencias, env persistido, reset, alta/envío ni
  cambios alojados. Pruebas en3001 sin detener servidor ajeno; no se repitió suite
  E2E privada/HTTP, NVDA o zoom real. Entrega de EXTRA027–033: commit `1b93a9f`,
  [PR #62](https://github.com/maximo-Pdev/funes-empleo/pull/62), abierto sin merge.
  Revisión independiente, CI, aceptación global y cierre de gates históricos pendientes.

## EXTRA-034 — PR62: actualizar regresión de retiro al contrato de errores por campo

- **Fecha/responsable/autorización:** 2026-10-20, Mateo solicita corregir el check
  fallido del PR62; continuación de EXTRA028/T125, sin cambio funcional adicional.
- **Problema/evidencia:** Quality117/run39525712466, application falla en
  intermediation.spec.ts:335: espera el aviso general anterior al retiro. El
  selector de solicitud ahora es required y Form bloquea antes de onSubmit,
  mostrando “Elegí una opción.” junto al campo.94 E2E pasan,1 falla y1 no corre;
  database y controles previos de application pasan. No es fallo de despliegue.
- **Cambio/justificación:** T133; ajustar la aserción al error asociado al selector,
  foco, aria-invalid, motivo retenido y estado aún Derivada; conservar el resto
  del recorrido que registra contacto entrante y retira con evidencia. Añadir
  regresión de componente que prueba bloqueo sin callback y envío con contacto
  entrante válido. No quitar validación ni relajar reglas para pasar el CI.
- **Archivos/contratos/riesgos:** pruebas E2E/componente de intermediación,
  tareas/estado y este registro. Sin cambios de aplicación, SQL, entorno, roles
  o contratos; verificar asociación del mensaje y no ocultar un retiro sin prueba.
- **Verificación prevista:** componentes, suite unitaria/cobertura, tipos/lint,
  push al mismo PR y ejecución completa del CI aislado. No resetear datos locales
  existentes ni usar servicios alojados. Revertir solo tests/documentación.
- **Implementación/verificación local:** E2E ahora verifica el error asociado al
  selector, foco, motivo retenido y participación aún Derivada; el recorrido
  positivo con contacto entrante se conserva. Nueva regresión de componente
  comprueba bloqueo sin callback, exclusión de contactos salientes, corrección
  del campo y payload de retiro con evidencia. Componentes11/11, cobertura736
  tests/51 archivos, tipos/lint y diff-check PASS. Sin cambios de producción.
- **Estado:** corrección implementada/verificada localmente; pendiente CI completo
  en el mismo PR62. No reset local, cambios alojados, merge ni aceptación global.

## EXTRA-035 — Contratación y retiro de consentimiento: clarificación previa

- **Fecha/responsable/origen:** 2026-10-21, Mateo solicita retiro automático al
  confirmar contratación normal/tardía, atomicidad, auditoría y conservación de
  otras participaciones e historial; exige resolver alcance antes de implementar.
- **Evidencia:** `spec.md` Clarifications 2026-09-19/20/21, FR-036/037,
  `data-model.md/candidate_consents`, contratos de estados/autorización: un único
  consentimiento general; retiro manual cierra casos abiertos; contratación normal
  conserva acceso hasta720 horas y la tardía no revive permisos revocados.
  Servidor `adminParticipationAction` -> `confirmReportedOutcome` -> RPC
  `transition_participation` (`hire`/`late_hire`) confirma ambos resultados en DB.
  El RPC no retira consentimiento; `change_candidate_consent` sí lo retira pero
  también cierra otras participaciones, por lo que no se puede reutilizar sin más.
- **Decisión/autorización:** OQ-020 resuelta por Mateo el2026-10-21: confirma la
  primera opción original, retiro global y revocación a todas las empresas; descarta
  su comentario posterior sobre solo matching. Conserva estados de otros casos,
  como excepción al retiro manual. No se inventa consentimiento por oferta, aprobación
  municipal, cierre de otros casos ni reversión automática de consentimientos.
- **Propuesta técnica condicionada:** luego de responder, actualizar spec,
  plan/modelo/contratos, checklist/tareas y análisis antes del código. Migración
  forward-only que centralice en la transacción de contratación normal/tardía el
  evento append-only de retiro, actor/fecha/motivo y revocación aprobada; sin cambios
  parciales, cierre de otros casos ni reactivación por corrección/reconsentimiento.
  El alcance individual requiere distinguir revocación de acceso y consentimiento
  global; no implementar una segunda clase de consentimiento por inferencia.
- **Archivos/contratos previstos:** funciones SQL de transición/consentimiento y
  autorización, Server Actions/servicios de resultados si corresponde; tests SQL
  de flujo/RLS/auditoría/rollback, unitarios/servidor y E2E; Spec Kit y guía de
  despliegue/recuperación. No editar migraciones ya aplicadas ni usar service-role
  para operaciones ordinarias. Al registrar esta propuesta aún no se había
  creado/aplicado una migración; resultados de implementación al final de la entrada.
- **Riesgos/verificación prevista:** ventana720h y retiro manual global son reglas
  anteriores a reconciliar expresamente; bloqueo/orden de locks e idempotencia;
  actor y causa fieles (no fingir acción afirmativa del candidato); historial de
  consentimiento intacto y permisos jamás resucitados. Contratación normal/tardía,
  permisos de varias empresas, otros casos/finales inalterados, fallo forzado de
  auditoría con rollback integral, concurrencia, nueva aceptación explícita,
  roles negativos, tipos/lint/tests/build y recuperación sin restaurar permisos.
- **Diseño técnico mínimo autorizado:** reemplazar la función RPC de transición
  manteniendo firma y grants. Bloquear candidato antes de participación y sus
  permisos para serializar contratación con aceptación/retiro/derivación; no
  llamar al retiro manual que cierra otros casos. En `hire`/`late_hire`, agregar
  evento de retiro solo si el último consentimiento es accepted, copiar política/
  hash y atribuir al admin confirmante. Fuente nueva `hiring_workflow`, restringida
  a withdrawn (requisito técnico necesario para no fingir autoservicio/atención
  presencial); motivo `hired` en auditoría y decisión privada ligada a la
  participación. Revocar todos sus permisos activos, sin tocar otros casos.
  Perfil pasa a consent_withdrawn salvo si está archivado; versión se incrementa
  para impedir envíos obsoletos. No crear ventana720h nueva; conservar soporte
  para contrataciones históricas sin backfill ni restauración de permisos.
- **Recuperación:** migración correctiva posterior, nunca reaceptar ni reabrir
  permisos como rollback; copias previas e integridad revisadas en entorno alojado
  antes de despliegue. No reset de la base local existente para validar.
- **Evidencia local previa:** regresión nueva RED22/37 contra el RPC anterior.
  `migration up --local` se detiene por la versión local histórica20261017204435,
  ajena a este cambio y ausente del checkout. No se reparará/eliminará esa historia:
  aplicar exclusivamente el SQL nuevo por psql al contenedor local confirmado,
  registrando solo la nueva versión en la misma transacción y conservando las
  versiones previas. Documentar el bloqueo del CLI para quien despliegue.
- **Aislamiento de verificación:** local024 GREEN49/49 y unitarios741/52 PASS.
  Las suites010/072 requieren versiones iniciales de ofertas; en la base ya usada
  encuentran versiones9/estados draft y fallan por CONFLICT_STALE_DATA. No corregir
  esos datos ni resetearlos. Preparar una instancia Supabase efímera separada
  `funes-empleo-hiring-check` en puertos553xx dentro de test-results (ignorado),
  con copias de migraciones/tests y fixture ficticio de aceptación, sin .env.local.
  Solo para pruebas SQL; detener esa instancia al terminar, preservando la original.
- **Implementado:** migración20261021220623, constraint de fuente restringida,
  RPC atómico con bloqueo candidato primero, retiro/auditoría/revocación global
  y ninguna modificación de otros casos. feedback-service conserva un RPC e
  invalida vistas tras éxito. Tests SQL024, unitario hiring-consent y E2E propio;
  guía `docs/validation/hiring-consent.md`, especificación/modelo/contratos,
  plan/checklist/tasks y estado actualizados. EXTRA036 cubre fecha efectiva.
- **Verificado:** SQL55/55 y suite aislada1062/17 archivos, cobertura741 tests/52
  archivos, tooling57, tipos/lint/build, E2E13/13 (dos contrataciones con lock
  real más once regresiones Auth), advisor seguridad sin warn/error y diff-check
  PASS. Cobertura configurada solo para env/schema, no de toda la aplicación.
  Se repitió cobertura fuera del sandbox tras un ENOENT de archivos temporales
  del runner; no exigió cambios de código. Sin reset de la base original.
- **Gates/estado:** clarify aprobado por Mateo; spec/plan/modelo/contratos,
  checklist10/10, tareas y análisis acotados antes de implementar. Reanálisis
  final armoniza referencias antiguas720h como históricas; sin bloqueos de alcance
  o arquitectónicos nuevos, sin ampliar la arquitectura. Convergencia acotada
  T134–138 cubierta; no acredita revisión humana, CI, despliegue ni aceptación.
  PR62 mergeado; rama desde main15ec4e7 `codex/feat-withdraw-consent-on-hire`.
  Cambio local `next-env.d.ts` preservado, sin commit/PR nuevos ni cambios alojados.
  Ambas migraciones aplicadas solo localmente; rollout compartido pendiente.

## EXTRA-036 — Fecha efectiva de eventos de consentimiento

- **Fecha/origen/autorización:** 2026-10-21; requisito técnico derivado de
  EXTRA035/T138: nueva aceptación afirmativa válida después del retiro. Autorizado
  por la delegación de requisitos técnicos necesarios de AGENTS.md y el pedido.
- **Evidencia:** pgTAP024 pasa48/49; la aceptación asistida devuelve éxito pero
  current_consent sigue false dentro de la misma transacción. recorded_at usa
  now() (inicio de transacción), mientras el retiro automático usa reloj efectivo.
- **Cambio mínimo:** nueva migración forward-only cambia únicamente el default
  de candidate_consents.recorded_at a clock_timestamp(). No reescribe filas ni
  modifica la migración ya aplicada localmente20261021220623. Mantiene fecha
  efectiva coherente en eventos sucesivos; no simula una aceptación automática.
- **Archivos/contratos:** nueva migración, modelo/plan, pgTAP024 y guía de despliegue.
  Ninguna firma RPC ni permiso se amplía; fuentes, actores y afirmación explícita
  siguen iguales. Riesgo: orden temporal al insertar múltiples eventos; verificar
  retiro y reaceptación asistida con permisos revocados y perfil draft.
- **Verificación prevista:**49 pruebas SQL iniciales, suite de consentimiento, servidor,
  tipos/lint/build. Recuperación solo de default mediante otra migración, sin
  reordenar historia ni reactivar accesos. Propuesta registrada antes del SQL.
- **Implementación/verificación:** migración20261021221414 y default comprobado
  en ambas instancias locales. SQL final55/55 y suite completa1062 PASS, incluida
  aceptación asistida posterior en la misma transacción, perfil draft y permisos
  revocados; tipos/lint/build, cobertura741 y E2E13 PASS. Modelo/plan/guía alineados.
  Implementado/verificado localmente, no revisión humana ni despliegue alojado.

## EXTRA-037 — Aplicación alojada de las dos migraciones de contratación

- **Fecha/origen/autorización:** 2026-10-21, Mateo solicita expresamente
  “aplicalas” después de explicar EXTRA035/036. Alcance exclusivo: las versiones
  20261021220623 y20261021221414, sin backfill ni cambios de datos de negocio.
- **Evidencia previa:** CLI autenticado identifica el proyecto enlazado
  Funes-empleo/kyjycjojzhwggjuqjnki como ACTIVE_HEALTHY. El conector MCP no tiene
  acceso a ese proyecto; se usa la sesión CLI autorizada ya existente, sin pedir
  claves. Consulta de catálogo confirma función idéntica al cuerpo de la versión
  base, grants esperados, source self_service/assisted y default now(). Ambas
  versiones nuevas están ausentes. Snapshot de función/constraints/default/grants
  guardado en test-results/hiring-remote-before.json (ignorado, sin datos personales).
- **Obstáculo técnico:** migration list y db push --dry-run --skip-vault confirman
  versiones remotas históricas con timestamps distintos de los archivos locales.
  No reparar, revertir, renombrar ni volver a ejecutar esa historia para aplicar
  dos cambios nuevos; no se modifica Vault ni se ejecutan seeds o tests alojados.
- **Cambio mínimo propuesto:** ejecutar por CLI db query --linked únicamente el
  contenido revisado de ambas migraciones, en una transacción común con límites
  de espera/ejecución, guardia contra cambios concurrentes del cuerpo de función
  y registro de sus propias versiones/nombres/statements en la misma transacción.
  Los archivos de migración quedan intactos; no se registra éxito antes del DDL.
  El registro guarda ambos SQL originales para trazabilidad. No modifica versiones
  previas, configuración, datos de candidatos, permisos existentes ni resultados.
- **Riesgo/recuperación/verificación:** breves locks DDL; ante conflicto/timeout
  rollback total y revisar, sin bucles de reintento. Copia previa de definiciones,
  recuperación forward-only según guía, nunca restaurar consentimiento/permisos.
  Verificar cuerpos SQL/default/constraints/grants/versiones y advisors antes/
  después mediante consultas de catálogo sin PII; no crear contrataciones reales.
  Actualizar guía/estado con resultado real. Estado: procedimiento registrado
  antes de ejecutar el DDL alojado; no implica CI, PR, revisión ni aceptación.
- **Resultado alojado:** ambas migraciones aplicadas en una única transacción,
  incluidas sus versiones originales y SQL registrado. Verificación posterior:
  cuerpo remoto igual al archivo, ambos constraints correctos, default
  clock_timestamp(), SECURITY DEFINER/search_path y grants conservados (anon y
  service_role sin ejecución; authenticated sí). Hash de toda la historia previa
  idéntico antes/después y hashes del SQL registrado iguales a los archivos.
  Advisor remoto:52 WARN previos y52 posteriores, cero nuevos; no se declara
  resuelto ese backlog ni se relajan permisos. No se ejecutaron pruebas/fixtures,
  contrataciones ni backfill alojados. Evidencia técnica ignorada en test-results/
  hiring-remote-{before,apply,after}.json y logs de advisors. Guía y estado
  actualizados; reemplaza el pendiente de rollout alojado de EXTRA035/036.
  Sin commit/PR nuevo, despliegue de aplicación, CI ni revisión independiente.

## Entrega de EXTRA035–037 — 2026-10-21

Mateo solicita crear el PR. Commit funcional28c6a25, rama
codex/feat-withdraw-consent-on-hire desde main15ec4e7 actualizado:
[PR63](https://github.com/maximo-Pdev/funes-empleo/pull/63), abierto hacia main,
sin merge. Incluye las dos migraciones ya aplicadas/verificadas en Supabase
compartido, pruebas y trazabilidad de la decisión global. next-env.d.ts conserva
su modificación local y queda excluido; sin logs/fixtures privados/secretos.
Verificaciones previas consignadas en EXTRA035–037; cambios de esta entrega solo
documentales, diff-check PASS. CI/revisión independiente y aceptación pendientes.

## EXTRA-038 — PR63: aislar fixtures de contratación y matching

- **Fecha/origen/autorización:** 2026-10-21, Mateo solicita corregir el error de
  GitHub del PR63; derivado de T138 y de la obligación de regresión sin saltos.
- **Evidencia:** Quality121/run39688659768: database PASS; application falla
  exclusivamente en dos E2E de job-category-matching,95 pasan y1 no corre. Las
  dos contrataciones nuevas pasan, pero copian ofertas publicadas sin sus rubros.
  El selector de matching elige cualquier primera oferta pública por UUID: puede
  elegir una de esas ofertas aleatorias sin categorías y encontrar cero candidatos.
  No es fallo de migración ni razón para relajar consentimiento o matching.
- **Cambio mínimo propuesto:** ofertas de contratación ficticias en paused (los
  permisos de derivación admiten ese estado), aserción de que no aparecen en
  public_offer_rows, y selector del fixture de matching con categorías explícitas
  como precondición. Conservar expectativas de12 tarjetas/paginación/nominación,
  rechazo/ausencia de acceso, auditoría, locks y demás casos intactos.
- **Archivos/contratos/riesgos:** tests/e2e/hiring-consent.spec.ts,
  tests/e2e/job-category-matching.spec.ts, tareas/estado y este registro. Solo
  fixtures/selección de prueba; sin cambios de producto, arquitectura, migraciones,
  dependencias, configuración, permisos o datos alojados. No borrar/restablecer
  datos locales para forzar verde ni omitir pruebas.
- **Verificación prevista:** RED de aislamiento antes del fix, E2E de ambas
  contrataciones y matching, tipos/lint/tooling/cobertura/build, diff-check;
  publicar en el mismo PR y comprobar CI completo aislado. Autoriza el pedido y
  AGENTS.md para prerrequisito técnico; no implica nueva aceptación del producto.
- **Implementación/verificación local:** aserción de aislamiento RED (esperaba0
  ofertas públicas, recibía2) y GREEN tras usar paused. Helper de matching exige
  categorías, sin elegir por cantidad de coincidencias ni bajar expectativas.
  Navegador6/6 PASS ejecutando contratación antes de matching; ambas contrataciones
  y las cuatro regresiones de modal/paginación/nominación/roles se conservan.
  Cobertura741 tests/52 archivos, tooling57, tipos/lint/build y diff-check PASS.
  Docker/base existentes iniciados sin reset; solo se cerró el servidor de pruebas
  propio. next-env.d.ts mantiene el cambio local y se excluye del commit.
  Corrección en el mismo PR63, pendiente nueva ejecución CI completa/revisión.

## EXTRA-039 — Retirar autoarchivo de candidatos y empresas

- **Fecha/origen/autorización:** 2026-10-22, Mateo solicita eliminar archivar/
  eliminar cuenta en perfiles candidatos y empresas, tras merge de PR63. Alcance
  comunicado: autoservicio, manteniendo archivo/restauración administrativos y
  todo el historial; no elimina derechos legales ni decide OQ-001/002.
- **Evidencia/conflicto:** paneles CandidateProfilePanel/CompanyProfileForm y
  /account ofrecen archivo propio. FR-016/054 y contratos antiguos lo permiten;
  service changeAccountStatus y RPC público delegan incluso para titulares.
  Ocultar solo tarjetas dejaría la operación disponible por requests antiguos.
  La petición expresa sustituye ese permiso de autoservicio; no afecta archivo
  de ofertas propias, disponibilidad, retiro de postulaciones o consentimiento.
- **Cambio técnico mínimo necesario:** quitar formularios/estado/props/Actions/
  servicio exclusivo de autoarchivo; conservar comandos administrativos. Exigir
  admin activo en servicio común y wrapper público change_account_status, con
  nueva migración forward-only, misma firma/grants, sesión bloqueada y delegación
  privada/auditoría existentes. Sin nuevos estados, tablas, triggers o paquetes.
- **Archivos/contratos:** perfiles y /account, features/accounts/candidates/
  companies, validadores solo del flujo removido; spec/plan/modelo/contratos,
  tareas/checklist; pruebas UI, servidor/HTTP, SQL/RLS/rollback y E2E actuales.
- **Riesgos/recuperación:** no borrar cuentas/eventos, preservar recursos ya
  archivados y restauración administrativa. No reutilizar sesiones de titulares
  como si fueran admin en pruebas. No editar migraciones aplicadas. Recuperación
  forward-only sin reactivar permisos ni autoarchivo por rollback implícito.
  Aplicar SQL antes de app en el rollout; alojado no se modifica en esta tarea.
- **Gates/verificación prevista:** alinear artefactos y checklist/tareas/análisis
  acotados antes de implementar; RED UI/servicio/SQL, roles negativos y cero
  cambios ante denegación, archivo/restauración admin positivos con motivo e
  historial, consentimiento/edición/logout intactos; tipos/lint/pruebas/build y
  E2E ficticios sin reset local. Misma arquitectura/constitución, sin nueva
  decisión municipal ni aprobación/revisión independiente inferidas.
- **Rama/estado inicial:** main actualizado a a75bfc8 (PR63 mergeado), rama
  codex/feat-remove-profile-self-archival; anterior borrada local/remoto. Cambio
  local next-env.d.ts preservado. Quality122 del PR63 pasó application/database,
  98 E2E y carreras SQL, Vercel success. Esta entrada precede a la implementación.
- **Precisión detectada en pruebas:** el privado anterior rechaza archivar
  candidatos por admin, aunque sí permite archivo empresarial administrativo y
  restauración de candidatos. No se añade un permiso administrativo nuevo para
  sustituir el autoarchivo; se preserva exactamente ese alcance previo. Los tests
  de restauración preparan archivos candidatos históricos como propietario de la
  DB ficticia, nunca como permiso público nuevo. Artefactos ajustados a este límite.
- **Prerrequisitos de pruebas:** inventario Form pasa de41 usos a38 por retirar
  tres formularios; se actualiza su mínimo manteniendo el escaneo estricto de
  campos. En navegador local11/12 pasan inicialmente; el recorrido candidato
  encuentra cuatro ofertas ficticias anteriores con título idéntico. Seleccionar
  dos títulos únicos disponibles y ubicar sus textos exactos, sin reset/borrar
  fixtures ni cambiar lógica de postulaciones, para comprobar ambos casos nuevos.
  La ejecución siguiente conserva11/12 y encuentra concatenación del textarea al
  rellenarlo inmediatamente tras navegar; probar la sustitución con foco y
  selección total por teclado, manteniendo la aserción exacta y sin sleeps,
  reintentos de escritura, cambios de producto o resets.
- **Implementado:** sin tarjetas de archivo en ambos perfiles o /account; Actions
  exclusivas/servicio/validador/props retirados, guardia admin en servicio común y
  migración20261022202940 del wrapper público, misma firma/grants/locks. Archivo
  empresarial y restauraciones históricas siguen igual; ninguna habilitación de
  archivo administrativo candidato. Migración aplicada solo localmente, sin tocar
  la anterior historia local divergente ni editar archivos SQL ya aplicados.
- **Verificado:** UI/servidor RED7/33, SQL RED10/12; final unitarias/componentes/
  integración/cobertura730 tests/53 archivos, tooling57, SQL1072/18 archivos,
  navegador12/12 (incluye HTTP real8/8), tipos/lint/build, diff-check y advisor
  local sin warn/error PASS. Cobertura configurada mide env/schema, no toda la app.
  SQL073 final14 casos, snapshot sin cambios por denegación y sin nuevo permiso
  candidato; se conserva rollback administrativo y restauración de datos legados.
  React: hooks no condicionales, estado/props sin uso retirados, Form/Field y
  efectos/validación restantes conservados; edición, logout, teclado/axe y
  permisos comprobados en recorridos pertinentes. No son revisión externa/NVDA.
- **Gates/estado final:** spec→plan/modelo/contratos→checklist9/9→tareas→análisis
  acotado→implementación→verificación/convergencia del incremento. La precisión de
  permisos candidata descubierta en tests se alinea sin ampliar arquitectura o
  permisos; sin gaps construibles nuevos dentro de T140–143. No converge ni acepta
  globalmente el MVP. Guía docs/validation/profile-self-archival.md.
  Instancia SQL efímera detenida/descartada y servidor propio cerrado; base local
  original sin reset y next-env.d.ts preservado. Datos de prueba nuevos ficticios;
  sin cambios alojados, CI, revisión o aceptación acreditados.
  Commit funcional70ae1ea publicado en PR64:
  https://github.com/maximo-Pdev/funes-empleo/pull/64 (abierto, sin merge).
  Pendiente aplicar únicamente20261022202940 en Supabase compartido antes del
  despliegue de app y revisión mediante PR; gates históricos/OQ-001/002 intactos.

## EXTRA-040 — Claridad de consentimiento y activación del perfil candidato

- **Fecha/origen/autorización:** 2026-10-22, petición expresa de Mateo de aclarar
  consentimiento y colocar activación/indicador al principio. PR64 confirmado
  mergeado (5b15b24); rama codex/feat-candidate-consent-activation-ui desde main
  actualizado, anterior eliminada local/remoto. next-env.d.ts ajeno preservado.
- **Evidencia:** CandidateProfilePanel muestra el formulario de activación al
  final para cualquier estado distinto de active, incluso incompleto/archivado.
  El RPC activate_candidate de202609190019 exige draft/needs_update/unavailable/
  consent_withdrawn, disponibilidad available, localidad/resumen no vacíos,
  categoría, consentimiento accepted y CV válido. Workspace ya provee esos datos
  guardados y la ruta exige cuenta candidata activa. No hace falta otra consulta.
  CSS usa first-of-type/last-child y pinta de rojo la activación como si fuera
  destructiva; moverla sin revisar esos selectores puede deformar otras tarjetas.
- **Reglas/origen aprobado:** FR-010/015/036/038/055, OQ-020 resuelta y EXTRA035:
  consentimiento global, no por oferta; contratación normal/tardía confirmada
  retira el vigente y revoca todos sus accesos empresariales, sin alterar otros
  casos ni resultados. Nuevo consentimiento exige acción afirmativa y no revive
  permisos. Retiro manual conserva sus efectos propios. OQ-001/002 siguen abiertas.
- **Cambio mínimo propuesto antes de implementar:** primera tarjeta con estado,
  vigencia e indicador Perfil activo, o formulario Activar perfil solo si la
  proyección guardada satisface las condiciones actuales del RPC. Mostrar faltantes
  accionables para estados recuperables sin habilitar envíos imposibles; servidor
  mantiene la revalidación final ante concurrencia. Selectores CSS semánticos para
  datos laborales, eliminando estilos destructivos posicionales obsoletos.
  Explicación auxiliar de autorización municipal, derivación, datos visibles/no
  visibles, retiro global al contratar, historial y nueva aceptación explícita.
  Conservar íntegros policy_text/version/hash y aviso de política demo no aprobada.
- **Archivos/contratos afectados:** panel candidato, candidate-forms.module.css,
  pruebas de componente y navegador; spec/plan/tasks/estado y guía de interfaz.
  Sin nuevas Actions, RPC, migración, campos persistidos, entorno, dependencias
  ni cambios de autorización, activación, contratación, disponibilidad o política.
- **Riesgos/verificación prevista:** no confundir activo con aptitud para derivar,
  no afirmar cierre de otros casos por contratación ni eliminación de historia;
  no reemplazar política/hash con explicación auxiliar. RED de orden/estados,
  faltantes independientes y consentimiento; GREEN, regresiones de candidato,
  teclado/axe/móvil/escritorio, tipos/lint/tooling/cobertura/build. Usar solo
  fixtures locales ficticios sin reset ni cambios alojados. Análisis de coherencia
  acotado a este incremento; revisión humana/aceptación no inferidas.
- **Estado inicial:** propuesta registrada antes de cambios de producto; autorización
  expresa del solicitante, sin nueva arquitectura o decisión municipal/legal.
- **Ajuste visual necesario detectado:** captura local1920×1080 con el texto nuevo
  muestra consentimiento en media anchura y Contacto adicional estirado con un
  gran vacío por la fila compartida. Antes de corregir: usar ancho completo para
  ambos formularios directos del panel; conservar dos columnas internas en datos
  laborales y una en móvil. Solo CSS local, sin reordenar DOM o agregar componentes.
  Evidencia sintética ignorada test-results/profile-presentation-desktop.png;
  verificar nueva captura, axe, ausencia de overflow y regresión de formulario.
- **Implementación:** tarjeta inicial con estado/vigencia y formulario condicional,
  faltantes calculados sin efectos/estado duplicados, explicación global y retiro
  manual diferenciados. policy_text/version/hash y formulario afirmativo intactos.
  CSS semántico/ancho completo verificados visualmente con capturas sintéticas.
  Archivos reales: panel, CSS candidato, candidate-flow/profile-presentation y
  candidate-self-service, guía docs/product/candidate-profile-presentation.md,
  spec/plan/tasks/implementation-status y este registro. Ningún archivo de
  backend, autorización, contrato persistido o migración modificado.
- **Evidencia inicial de pruebas:** RED15/15 de presentación; la suite candidata
  adicional tuvo fallo de importación temporal en el sandbox de Vitest, no de
  producto. Reejecución fuera del sandbox GREEN28/28, sin modificar configuración
  o relajar aserciones. Tooling57/57, cobertura745/54, tipos/lint/build PASS.
  Cobertura configurada sigue limitada a env/schema, no toda la aplicación.
  Servidor next dev de Mateo detenido únicamente tras autorización expresa;
  puerto3000 reservado por Playwright y configuración de proceso solo local.
- **Verificación final:**745 pruebas/54 archivos y tooling57 PASS, tipos/lint/build
  y diff-check PASS. Navegador12/12 en una ejecución sin reintentos: autogestión,
  formularios9 y contratación normal/tardía2. Activación superior por teclado,
  indicador activo sin botón, faltantes, anchura de tarjetas, móvil360×800,
  escritorio1920×1080, sin overflow y axe PASS. Revisión visual de las dos capturas
  ficticias, sin NVDA o validación humana acreditada. Avisos previos de stream
  cerrado por navegación en logs Next no impidieron los recorridos; sin cambio
  ajeno para ocultarlos. No se volvió a ejecutar pgTAP completo: no cambia DB.
- **Análisis/convergencia acotados:** reglas UI trazadas a FR-010/015/036/038/055,
  consentimiento global a OQ-020/EXTRA035 y tareasT144–147. Sin hallazgos bloqueantes
  de duplicación/ambigüedad/contratos/constitución o gaps construibles dentro del
  incremento. Checklists previos4/4 sin ítems pendientes, sin modificarlos ni
  atribuir revisión independiente. Guía y estado actualizados; hooks de extensión
  no configurados. Revisión React: derivaciones simples en render, sin nuevo
  efecto/fetch/estado persistido, hooks incondicionales y claves estables.
  Servidor de pruebas cerrado automáticamente, base local sin reset, next-env.d.ts
  ajeno restaurado tras typegen/build. Sin migración, entorno alojado, commit/PR
  nuevo, CI, suite E2E completa o aceptación global. OQ-001/002 siguen pendientes.

## EXTRA-041 — Reorganizar teléfono, CV y aviso de consentimiento

- **Fecha/origen/autorización:** 2026-10-22, Mateo solicita retirar el cartel de
  política demo, integrar teléfono opcional en Datos laborales y personales y
  colocar CV antes del consentimiento. Misma rama, renombrada por pedido de Mateo
  a feat/candidate-consent-activation-ui; sin prefijo codex ni firmas/atribuciones
  automáticas en futuros commits. Cambios EXTRA040 y next-env.d.ts preservados.
- **Evidencia/necesidad:** teléfono y datos usan comandos/versiones separados.
  Encadenarlos desde la UI como si fueran un guardado atómico podría guardar solo
  una parte o enviar una versión vencida. El pedido es visual: no justifica un
  RPC/migración o modificar validación/autorización. El consentimiento registra
  versión/hash de policy_text demo; quitar toda posibilidad de consultar ese texto
  rompería la trazabilidad de lo mostrado respecto de lo aceptado.
- **Cambio mínimo propuesto antes de implementar:** una sola tarjeta de Datos
  laborales y personales con teléfono opcional y botón explícito Guardar teléfono,
  conservando dos formularios hermanos y sus comandos existentes, nunca anidados
  ni guardado parcial disfrazado de éxito conjunto. Eliminar tarjeta/título
  Contacto adicional. Mover el bloque CV completo antes del consentimiento.
  Quitar cartel amarillo de la vista inicial; política literal y versión siguen
  consultables en details/summary accesible, cerrado inicialmente. No cambiar
  política/hash, aceptación afirmativa, permisos ni su carácter demo. La petición
  no constituye aprobación legal ni habilitación de datos reales (OQ-001/002).
- **Archivos/contratos:** panel, CSS si fuera necesario, pruebas componentes/E2E
  de perfil y contacto derivado, spec/plan/tasks/guía/estado y este registro.
  Sin cambios backend, DB, migraciones, entorno, dependencias o contratos RPC.
- **Riesgos/verificación prevista:** evitar forms anidados y pérdida de otros
  campos al guardar teléfono; validar opcionalidad/errores/versión y persistencia.
  Orden CV→consentimiento real en DOM; política expandible por teclado y sin
  banner inicial; activación/consentimiento de EXTRA040 intactos. RED/GREEN de UI,
  pruebas/tipos/lint/tooling/build y navegador local ficticio, sin reset/alojado.
  Autoriza el solicitante; revisión/aceptación humana pendientes.
- **Implementación:** sección única de datos con formularios hermanos, sin
  anidamiento ni comandos nuevos; teléfono opcional y Guardar teléfono explícito.
  CV antes del consentimiento. Cartel amarillo retirado; política literal y
  advertencia solo en details/summary cerrado, con acceso por teclado. Actions,
  versiones, validación, hash y reglas permanecen. Regresión de contacto derivado
  actualiza solo el nombre del botón candidato, no las acciones municipales.
  RED2/16 y GREEN29/29 focales; cobertura746/54, tooling57, tipos/lint/build PASS.
- **Verificado/cierre acotado:** navegador11/11 PASS sin reintentos: candidato1,
  formularios9 y snapshot/contactos/consentimiento1. Teléfono inválido señalado,
  guardado/relectura y vaciado opcional correctos; guardar teléfono no borra ni
  guarda otras correcciones locales. Política inicialmente cerrada y expandible
  por teclado; CV antes del consentimiento, sin tarjeta Contacto adicional ni
  forms anidados. Capturas sintéticas y móvil/escritorio/axe revisados. Contacto
  actualizado visible a empresa ya derivada, CV instantáneo conservado y retiro/
  reaceptación sin devolver acceso. Fixture15 se consultó primero para comprobar
  precondiciones y luego se ejecutó el recorrido existente, sin reset local.
  Logs Next mantienen avisos previos de stream cerrado al navegar; recorridos
  completados sin ocultar errores de pruebas o cambiar producto ajeno.
- **Trazabilidad/límites:** T148–150 y guía/estado alineados, análisis de alcance
  sin arquitectura/contrato/permiso nuevo ni decisión legal inventada. React con
  hooks/Actions existentes y sin nuevos efectos/fetch. Diff-check PASS, sin hooks
  de extensión configurados. Servidor next dev cerrado tras nueva autorización
  de Mateo y servidores de prueba finalizados; next-env.d.ts ajeno restaurado.
  Sin migración, cambios alojados, commit/PR, CI, suite completa E2E/SQL o NVDA;
  OQ-001/002 y revisión humana permanecen abiertos. Policy/hash no modificados y
  retirar el cartel no acredita aprobación municipal o uso con datos reales.

## Entrega de EXTRA040–041 — 2026-10-22

Mateo solicita el PR. Commit funcionalc228d2c desde main5b15b24 actualizado,
rama feat/candidate-consent-activation-ui, sin firma GPG/sign-off/atribución
automática. PR65 abierto hacia main, sin merge:
https://github.com/maximo-Pdev/funes-empleo/pull/65.
Incluye interfaz, pruebas y artefactos del incremento; next-env.d.ts ajeno queda
fuera y sin añadir logs/capturas/secretos. Verificaciones locales consignadas en
EXTRA040–041; publicación no acredita CI, revisión o aceptación. Sin nuevas
migraciones ni cambios alojados. Documentación de entrega: diff-check PASS.

## EXTRA-042 — Referencia visual municipal compartida

- **Fecha/estado:** 2026-10-20; autorizado por Maxi en la rama visual, registrado
  antes de implementar. No acredita aceptación municipal ni revisión del compañero.
- **Origen:** solicitud explícita de guardar una guía en el repositorio y aplicar
  los colores, formularios y fuentes extraídos de `https://funes.gob.ar/`.
- **Problema/evidencia:** el portal combina Arial, primarios verdes distintos y
  controles azules. El tema municipal declara Be Vietnam/Sora, `#074A1F`,
  `#262b35` y `#868d98`; sus formularios usan borde inferior y etiquetas uppercase.
  AdminLTE pisa parte de la tipografía y elimina el foco: no se replica ese defecto.
- **Cambio mínimo/justificación:** guía permanente referenciada desde AGENTS,
  fuentes locales con licencias y procedencia, tokens y presentación compartida de
  formularios. Necesario para que otras sesiones mantengan la misma referencia.
- **Superficies:** `docs/UI_GUIDELINES.md`, `AGENTS.md`, `src/app/globals.css`,
  estilos de formularios de portada/autenticación, primitivas Button/TextField/
  SelectField, `public/fonts/funes/` y pruebas visuales/de componentes.
- **Límites/coordinación:** esta rama mantiene lo visual; no cambia acciones,
  permisos, datos, contratos de props, campos, textos funcionales ni navegación.
  Se preserva el trabajo previo sin confirmar y la composición de portada.
- **Riesgos/recuperación:** tokens y reglas de formulario compartidos afectan varias
  rutas. Revertir únicamente este diff; conservar errores, acciones peligrosas,
  checkboxes, radios, archivos y foco accesible. No hay migración ni cambios de env.
- **Verificación prevista:** RED/GREEN visual y de primitivas, pruebas unitarias,
  lint/typecheck/build, revisión independiente y navegador desktop/mobile sin
  enviar formularios ni resetear datos. Revisión humana y PR pendientes.
- **Implementación:** guía `docs/UI_GUIDELINES.md` enlazada desde AGENTS, nueve
  fuentes originales locales con licencias OFL, tokens municipales y controles
  compartidos implementados. Be Vietnam para texto/campos y Sora para títulos/
  botones. Se preservan la composición previa, bisel, sombras y cambios ajenos.
- **Resultados:** RED observado (dos pruebas de primitivas y fuente Arial en
  navegador); GREEN focalizado 32/32; regresión 559 pruebas/37 archivos PASS;
  lint, typecheck y build exit 0; detector visual sin hallazgos; diff-check PASS.
  Chromium de producción: login y ambos registros a 1440/390px PASS, sin envíos
  ni reset de datos. Inspección de capturas desktop/mobile realizada.
- **Revisión independiente:** 16 pruebas focalizadas y seis casos de navegador
  PASS; nueve hashes de fuentes coinciden con el inventario. Sin bloqueos.
  Advertencia no bloqueante: TextField sigue siendo un control textual, no debe
  usarse para checkbox/archivo; la guía delimita esa excepción. No se cambian sus
  contratos para corregir un uso que no existe entre sus consumidores actuales.
- **Entorno/límites:** el servidor previo 3000 presentó fallos de hidratación/HMR;
  la prueba usa producción separada en 3001, no acredita corregir aquel entorno.
  La primera comprobación de una fuente no usada se corrigió para cargar el peso
  explícitamente antes de verificarlo. Node observado 26.7.0, distinto del 24.21.0
  requerido; no se modifica el entorno. No se recorren exhaustivamente páginas
  privadas ni se ejecuta el E2E que resetea datos. Revisión humana/municipal y PR
  pendientes. Sin commit ni publicación en esta tarea.

## EXTRA-043 — Acceso a ofertas sin superposición al centrar Empresa

- **Fecha/estado:** 2026-10-21; implementado y verificado técnicamente; registrado
  antes de implementar como detalle necesario
  de la corrección visual solicitada por Maxi: «el recuadro de login y registro
  cuando selecciono Registrarse -> Empresa no está centrado verticalmente».
- **Evidencia:** la regla de registro usa `align-items: flex-start` y márgenes
  verticales asimétricos. Centrar Empresa con su altura natural hace coincidir la
  tarjeta ancha con el enlace inferior centrado en toda la pantalla.
- **Cambio mínimo/justificación:** centrar Empresa con 40px de espacio superior e
  inferior; solo en Empresa desktop, centrar el enlace inferior dentro del
  cuadrante izquierdo para preservar su acceso sin cubrir campos ni la tarjeta.
- **Superficies/contratos:** `src/app/(public)/home.module.css`,
  `tests/visual/home-responsive-layout-check.mjs`, `docs/UI_GUIDELINES.md`.
  Sin cambios de contratos, acciones, validación, datos ni estilos globales.
- **Riesgos/recuperación:** cambio local de composición; conservar los demás
  modos y celular. Formularios más altos que la pantalla mantienen scroll del
  documento. Revertir únicamente estas reglas locales si se rechaza el ajuste.
- **Autorización/revisión:** derivado de la corrección explícita y la autorización
  de detalles necesarios; informado al usuario. Revisión humana y PR pendientes.
- **Verificación:** RED observado por `flex-start` en Chromium; GREEN en 15 estados
  responsive y seis estados municipales, sin superposición ni scroll interno.
  Desviación de centrado de Empresa: 0px a 1440×900 y 1920×1080; tarjeta completa
  dentro del viewport y composición móvil preservada. Tres clics reales del
  enlace llegan al destino con el offset de navbar, usando la tolerancia de 2px
  existente para scroll suave y coordenadas fraccionarias, no igualdad exacta.
  Pasan 568 pruebas unitarias, lint, tipos, build y diff-check; capturas revisadas.
  Advertencia externa de lockfile conocida/no bloqueante. Sin cambios de datos,
  envíos de formularios, commit ni publicación. Revisión humana/PR pendientes.

## EXTRA-044 — Espacio de navbar para el SVG ampliado de portada

- **Fecha/estado:** 2026-10-21; registrado antes de implementar, revisión pendiente.
- **Origen:** pedido de Maxi de quitar el título de la portada y reemplazar el
  logo por el SVG adjunto, ampliándolo porque casi no se ve.
- **Problema/cambio mínimo:** el logo de 60px está limitado por una navbar de
  72px. En portada se mostrará a 96px dentro de una navbar de 104px, ajustando
  el espacio móvil y el offset del destino inferior para no ocultar contenido.
- **Superficies/contratos:** `home-navbar.tsx`, `home.module.css`, `page.tsx`,
  recurso en `public/brand/`, pruebas de portada y guía visual. La variante
  `alwaysVisible` reutilizada en cuenta conserva sus dimensiones de 72px/60px.
  No cambian enlaces, acciones, validaciones, datos ni contratos de props.
- **Riesgos/justificación:** evitar recortar el SVG o superponer la navbar con
  formularios. Cambio local de composición derivado del tamaño solicitado,
  informado mediante esta entrada; sin estilos globales ni cambios de permisos.
- **Verificación/estado:** RED observado para título y logo; previstos copia
  idéntica del SVG, geometría de imagen/navbar, enlace y offset de 104px,
  responsive desktop/mobile, variantes de cuenta y puertas de calidad.
  Implementado: SVG copiado sin modificar (hashes iguales), título y reglas de
  título retirados, imagen 96×96/navbar 104px en portada y espacio móvil 24px.
  Pasan 15 pruebas focalizadas, 569 unitarias, lint, tipos, build y diff-check;
  15 estados responsive y seis municipales en Chromium. SVG decodifica como
  353×353; geometría CSS compacta sigue en 72px/60px. Capturas desktop/mobile
  revisadas; enlace municipal y destino inferior de 104px verificados.
  Next/Image no emite `sizes` para este SVG no optimizado: la prueba incorrecta
  del atributo se sustituyó por geometría real, sin cambiar la aplicación para
  satisfacer esa suposición. Sin envíos de formularios ni cambios de datos.
  Advertencia de lockfile externa preexistente/no bloqueante. Sin commit/PR ni
  aceptación humana; revisión pendiente.

## EXTRA-045 — Integración local de Canvas Ribbons y restauración informativa

- **Fecha/estado:** 2026-10-21; registrado antes de implementar, revisión pendiente.
- **Origen:** pedido explícito de reemplazar el slideshow por `bsehovac/LQVzxJ`
  y restaurar la información de la captura; ZIP original adjuntado por Maxi.
- **Evidencia/prerrequisito:** el efecto utiliza Canvas 2D/JavaScript, no CSS solo.
  El ZIP incluye código completo, sin dependencias externas, y licencia MIT de
  Boris Šehovac. Conservar aviso/licencia es condición de reutilización.
- **Cambio mínimo:** adaptar las mismas curvas Bézier e historial de cintas a
  TypeScript/React, paleta municipal y fondo neutro oscuro; retirar estadísticas,
  globals y bucle sin limpieza del demo. Añadir resize, cancelación al desmontar,
  pausa fuera de vista/documento oculto y fotograma estático con movimiento reducido.
- **Superficies:** portada, módulo CSS local, componente de fondo, licencia en
  `public/brand/canvas-ribbons/`, guía y pruebas de portada. Texto restaurado desde
  `src/app/(auth)/login/page.tsx`, contrastado con la captura. Sin cambios en esa
  ruta, formularios, navbar, permisos, datos, paquetes ni servicios externos.
- **Límites/riesgos:** no ejecutar el HTML global del ZIP, no ocultar el scroll del
  documento y preservar móvil con tarjeta primero e información desktop oculta.
  Limitar densidad, FPS y resolución; verificar contraste, ciclo de vida y ausencia
  de superposición. No afirmar equivalencia sin usar la geometría del original.
- **Autorización:** solicitud explícita y detalles necesarios de integración local;
  revisión humana/PR pendientes. Sin commit ni publicación autorizados.
- **Verificación:** RED observado para contenido, reemplazo y ciclo de vida;
  previstos GREEN unitario, navegador (píxeles en movimiento/estáticos, resize,
  contenido y formularios), lint, tipos y build.
- **Implementado/verificado:** fondo local `home-ribbons.tsx`, información completa
  restaurada, slideshow retirado y licencia original MIT copiada sin alterar.
  Pasan 18 pruebas focalizadas, 572 unitarias/38 archivos, lint, tipos, build y
  diff-check. Chromium: 15 estados responsive y seis municipales PASS, píxeles
  que cambian en reproducción y se congelan con movimiento reducido, carga
  inicial reducida con fotograma visible y resize estático correctos; cero
  solicitudes a fotos y cero errores JS en 1440/768/390px. Capturas inspeccionadas.
- **Correcciones acotadas:** prueba real reprodujo que `isIntersecting` puede ser
  verdadero con área visible cero; se usa umbral/ratio explícito para pausar en
  el borde. La prueba móvil esperaba pausa antes de terminar de crecer la tarjeta:
  espera ahora sus transiciones antes de ir al final del documento. Pausa fuera
  de pantalla y reanudación verificadas. Sin cambios ajenos para satisfacer pruebas.
- **Límites finales:** assets fotográficos/procedencia originales preservados sin
  uso; navbar de 64px y márgenes existentes intactos. Sin cambios de datos,
  sesiones, paquetes, envíos reales, commit ni publicación. Advertencia de
  lockfile externa preexistente/no bloqueante; revisión humana/PR pendientes.

## EXTRA-046 — Retorno de CV y actualización del panel de cuenta

- **Fecha/estado:** 2026-10-21; implementado y verificado técnicamente;
  revisión humana pendiente. Prerrequisito registrado antes del cambio de retorno.
- **Origen:** solicitud explícita de integrar perfil, ofertas y postulaciones en
  `/account` mediante sidebar y retirar el archivo de cuenta de esta pantalla.
- **Problema/evidencia:** `src/app/api/candidate/cv/route.ts` devuelve todo resultado
  de candidato a `/candidato/perfil`; las acciones invalidan solo las rutas antiguas.
  Esto saca al usuario del panel después de cargar el CV o deja sus datos sin invalidar.
- **Cambio mínimo:** aceptar únicamente el valor exacto `/account?section=perfil`
  como contexto opcional de retorno de candidato y conservar destinos anteriores
  por defecto, administrativos y de sesión inválida. Añadir invalidación de `/account`
  a las acciones existentes; sin modificar validaciones, permisos ni persistencia.
- **Archivos/contratos:** ruta POST de CV, prop opcional/hidden del panel de perfil,
  acciones de perfil/consentimiento/postulación y pruebas de retorno/compatibilidad.
- **Riesgos/límites:** impedir redirecciones externas y preservar propiedad, versión,
  mensajes, status 303 y cabeceras privadas. No migraciones, nuevos proveedores,
  cambios de autenticación ni eliminación de rutas.
- **Autorización/coordinación:** detalle necesario de la integración solicitada;
  revisión humana del contrato compartido pendiente, sin publicación ni commit.
- **Verificación:** RED reproducido en retorno válido/inválido; previstos tests de
  allowlist, compatibilidad legacy/admin, acciones, UI integrada, lint, tipos y build.
- **Resultados:** 600 pruebas/40 archivos, lint, tipos, build y diff-check pasan.
  Verificación independiente en copia scratch: 49 pruebas focalizadas, incluidas
  variantes de redirección, cuenta ajena/archivada/desactualizada y sesiones
  inhabilitadas; sin defectos bloqueantes. Probes adversariales incorporados al repo.
  Navegador: seis vistas desktop/móvil de componentes reales con servicios ficticios,
  clics de las tres secciones, geometría sin superposición/desborde y logout encima
  de identidad verificados. No equivale a una sesión autenticada con base real.
- **Compatibilidad/límites:** los cargadores existentes ejecutan bootstrap/frescura;
  no se afirma que todos los GET de cuenta carezcan de efectos persistentes. Sin
  nuevas reglas de mutación, paquetes, datos personales, commits ni publicación.
  La sidebar local adapta la composición no colapsable de shadcn, no instala el
  registro completo ni cambia primitivas ajenas. Revisión humana/PR pendientes.

## EXTRA-047 — Componentes oficiales de shadcn con identidad municipal

- **Fecha/estado:** 2026-10-22; criterio solicitado por el usuario y documentado;
  migración de código, coordinación y revisión pendientes.
- **Origen:** solicitud explícita de usar componentes oficiales de shadcn y
  adaptarlos al estilo actual, incluidos los controles existentes de la landing.
- **Problema/evidencia:** `components.json` configura `base-nova`, pero las
  primitivas actuales son locales; la configuración no acredita integración
  oficial. La guía anterior solo pedía reutilizar dichas primitivas.
- **Cambio mínimo/justificación:** registrar la fuente oficial obligatoria para
  futuras implementaciones y migrar los controles de la landing sin rediseño,
  conservando contratos, acciones, validación, accesibilidad y estilos actuales.
- **Archivos/contratos:** política en `AGENTS.md` y `docs/UI_GUIDELINES.md`;
  implementación prevista en `src/components/ui`, utilidades, manifiesto/lockfile
  y consumidores de la landing. Revisar consumidores compartidos antes de editar.
- **Riesgos/límites:** dependencias y contratos compartidos; no ejecutar una
  instalación que sobrescriba componentes ni alterar pantallas ajenas.
- **Autorización/coordinación:** dirección autorizada por el usuario; no acredita
  coordinación del segundo desarrollador ni aprobación global de la spec Draft.
- **Verificación prevista:** regresiones de controles y formularios, suite, lint,
  tipos, build y comparación visual desktop/móvil. Por ahora solo documentación;
  no se afirma instalación, migración o verificación funcional. Sin commit/PR.

## EXTRA-063 — Complete local photo repair and unify candidate canvases

- **Date/status:** 2026-10-24; explicitly authorized; implemented and verified locally; user visual/product review pending.
- **Origin/evidence:** latest user authorizes local server-key setup and photo repair; requests static primary green, backgrounds beneath navbar, full-height sidebar and consistent960px white canvases for all four candidate sections. Real local photo POST rejects matching127.0.0.1 origin because internal Next URL useslocalhost; server-only key absent.
- **Change/rationale:** correct actual-host origin comparison without accepting foreign origins; configure existing local service key privately only in ignored.env.local. Share existing profile canvas styling across candidate sections; no animation or unrelated global/navbar behavior changes. See odd/tasks/candidate-panel-finalize.md S1-S4.
- **Surfaces/risks:** photo route/tests/environment/docs; account renderer/CSS/tests; security/config risk and responsive overlay clearance. No new schema, remote access, resets, dependency changes or commits. Parallel disjoint workers; parent owns integration/docs/git.
- **Checks:** current implementation preserved; 950 unit/component tests, lint, typecheck, production build and diff-check pass. Forty four-section desktop/mobile/motion geometry cases pass. Independent security inspection and 45 focused tests pass; first live harness failed an intentionally denied service_role metadata SELECT, not product persistence. Corrected scratch-only metadata probe, without new privileges: actual authenticated production upload/refresh/readback/replace/remove, anonymous denial, Storage byte equality and physical old/current deletion all passed. Owned test server stopped. Known fictitious test records are documented in the feature log; no real accounts/reset/remote operations. Product review remains pending.

## EXTRA-062 — Slower pure-CSS profile gradient

- **Status:** implemented and verified; recorded during implementation; user visual acceptance pending.
- **Origin:** supplied `pure-css-animated-gradient-background.zip` and “Además debe ser más lenta, que el movimiento sea sugerido.”
- **Design:** adapt actual Manuel Pinto pyBNzX MIT CSS: -45-degree four-stop green/darker-green gradient, 400% size, sixty-second ease cycle instead of the original fifteen seconds. Keep natural content height, white canvas and static reduced-motion fallback; no demo frameworks or global styles.
- **Files/checks:** account.module.css; updated profile-gradient-check.mjs; preserved source/license/provenance in public/brand/pure-css-animated-gradient-background/. Test assertion observed RED before replacing previous crossfade; four desktop/mobile motion/reduced-motion browser cases, wraparound pixels, 16 focused component tests, lint/types/build and diff-check passed. Previous exports retained unused.
- **Scope:** this visual request does not cancel the independently running photo upload verification. No further database or permission changes from the gradient.

## EXTRA-061 — Alternate endpoint-color gradient and photo availability repair

- **Status:** authorized implementation in progress; verification pending.
- **Origin:** user supplied `animated-background-gradient.zip` because the previous motion was too subtle, and requested fixing profile-photo upload.
- **Visual evidence/design:** Mario Klingemann's MIT CodePen AZedgK blends the two endpoint RGB colors, rather than moving a fixed gradient. With the requested primary-green/darker-green two-color palette, targets alternate. Reproduce this as an opacity blend between opposite horizontal gradients (five seconds each direction), without jQuery, interval loops, global body styles or dependencies. Preserve the white canvas, other sections and static reduced-motion mode.
- **Necessary addition:** preserve original script/style/license and provenance under `public/brand/animated-background-gradient/`. The former export remains unused, not deleted.
- **Photo scope:** diagnose actual runtime prerequisites; the prior optional-photo fallback is not a working upload fix. Apply only necessary, authorized local corrections; no unrelated migration batch, reset, remote deployment or credential reuse is implicitly authorized.
- **Risks/checks:** visual render/cycle/reduced-motion/interaction checks; photo requires actual persistence/readback and existing permission/version rules. Record the verified target and remaining deployment authority before database writes.

## EXTRA-060 — Animated gradient behind the profile canvas

- **Latest user revision:** replace the medium-gray stop with a dark derivative of the same primary green (20% primary / 80% black). The original SCSS subtracts 50 lightness points, which would produce black for this already-dark green. Preserve animation/white canvas/reduced-motion behavior. The updated dark-green browser assertion was observed RED, then all four browser cases, lint/types/build/diff-check passed GREEN.
- **Status:** implemented and locally verified; no commit or publication.
- **Origin:** user-provided `gradient-background-animation.zip` and request to cycle between the institutional primary green and medium gray behind the canvas.
- **Evidence/design:** supplied Andy Tran CodePen MaRqwd export uses a 45-degree CSS gradient, 200% background size and six-second 0/100/0 position loop. Adapt colors to existing municipal tokens; scope to `.profileWorkspace`, retain the white canvas and all other surfaces. Do not import its global body/html styles or external reset stylesheet.
- **Necessary addition:** preserve the supplied MIT notice and provenance under `public/brand/gradient-background-animation/`; no dependency or external runtime request. Add a static reduced-motion fallback.
- **Risks/recovery:** visual-only; restore the prior primary-green declaration to revert. No data, authorization, migration or form changes.
- **Verification:** all four CSS-browser cases passed (1440px/390px, normal/reduced motion): distinct midpoint pixels, identical start/end at six seconds, real elapsed autoplay, static reduced-motion pixels and white canvas preserved. Sixteen focused tests, lint, typecheck, build and diff-check passed. This is CSS-fixture proof, not authenticated application testing. No commit or publication authorized.

## EXTRA-059 — Rebuild candidate profile and persist private photos

- **Status:** implemented and verified in isolated local PostgreSQL/Storage; original application database rollout and developer review remain pending.
- **Origin:** current profile-canvas rebuild request, photo persistence confirmation, and explicit retention choice “Borrar el archivo anterior”. Extends EXTRA-047/048 for candidate photos only, not company logos.
- **Evidence:** the profile renderer and existing validated forms are preserved but disconnected; no candidate image bucket, image validation or photo mutation/read path exists.
- **Change:** restore profile forms inside the 960px canvas with official adapted Avatar/Attachment/Empty. Implement owner photo upload/replace/remove, private metadata and Storage, live owner/Office/current referral authorization, versions and cleanup. JPEG/PNG up to 5 MiB and 16 megapixels, orientation-aware re-encoding/metadata stripping and bounded output dimensions are technical safety defaults, not municipal requirements. A photo is not required to activate a profile.
- **Retention:** revoke old-photo access atomically on replacement/removal, then physically remove the old Storage object; surface failures as pending cleanup and keep a retryable record. Never erase the current image before a replacement is committed.
- **Files/contracts:** tracked in `odd/tasks/candidate-profile-rebuild.md`; photo services/handlers, additive SQL migration/RLS, typed database contracts, profile presentation, focused tests and recovery docs. Server-only validated ingestion needs an explicit narrow extension to the privileged-operation allowlist; browser writes remain forbidden. Existing admin-invitation behavior remains unchanged.
- **Authorization:** requesting developer explicitly approved functionality and physical deletion; their explicit request confirms coordination under AGENTS.md. No remote migration, reset, publish, commit or merge authorized. Existing consent text and legal policy remain unchanged.
- **Risks:** security, personal data, concurrency, physical object deletion and new dependencies. Tests must include stale/conflicting mutation, denied access/revocation, malformed images, failed replace/cleanup and legacy CV/form regressions. Independent verifier required. Apply SQL before application rollout; rollback application only, preserve data and use forward corrective SQL.
- **Verification:** corrected four independently reproduced blockers (audit constraint, owner-only mutation, originating session and cleanup-only retry). Current code passes 927 unit/component tests, lint, typecheck, build and diff-check; prior tooling57 tests and eight responsive fixtures pass. Actual isolated proof: shipped SQL27/27, additional live-permission14/14, real Storage upload/readback and physical file deletion, and independent competing-commit race with one winner/no loser audit. Seven migrations remain pending on the original local DB; none applied. No remote operations or commits. Do not run reset wrappers on existing data.

## EXTRA-048 — Foto de candidato y logo de empresa

- **Fecha/estado:** 2026-10-22; solicitud y privacidad del candidato registradas;
  diseño técnico, coordinación, implementación y revisión pendientes.
- **Origen:** solicitud de foto de perfil y logo empresarial con Avatar oficial.
  Confirmación textual del usuario: “Si, la foto del candidato debe seguir la misma restricción que su perfil completo, visible para la Oficina de Empleo y para una empresa únicamente cuando la Oficina le derive ese candidato.”
- **Problema/evidencia:** el avatar de cuenta es un placeholder; la persistencia
  existente admite CV PDF, no imágenes. Avatar solo presenta imagen/fallback.
- **Cambio propuesto/justificación:** flujo real de carga y lectura autorizadas,
  persistencia y presentación con Avatar, sin reutilizar implícitamente el bucket
  PDF ni hacer públicas las fotos. Preservar el acceso del propio candidato.
- **Archivos/contratos:** futuras migraciones Storage/metadatos/RLS, validación,
  handlers, servicios y formularios de candidatos/empresas; derivar rutas exactas
  al aprobar el diseño. Esta entrada no modifica dichos contratos.
- **Riesgos/límites:** datos personales, acceso entre empresas, caché y revocación
  de acceso. No URLs públicas de candidatos. La privacidad confirmada no resuelve
  visibilidad del logo, límites de archivo ni reglas de reemplazo/retención.
- **Autorización/coordinación:** solicitud funcional y privacidad del candidato
  confirmadas; coordinar esquema, permisos y contratos con el otro desarrollador
  y respetar las revisiones Spec Kit antes de implementarlos.
- **Verificación prevista:** carga/persistencia, archivos inválidos, acceso propio
  y administrativo, empresa derivada/no derivada, reemplazo fallido, caché y
  revocación según contrato aprobado; pruebas, lint, tipos, build y navegador.
  Aún no implementado ni probado; sin migraciones aplicadas, commit o PR.

## EXTRA-051 — Interfaz en español en todos los roles

- **Fecha/origen/autorización:** 2026-10-22, Mateo solicita revisar toda la web
  y todos los perfiles y traducir palabras/estados del sistema al español.
  PR65 confirmado mergeado (23ba5fa), main actualizado y rama
  feat/spanish-interface-labels; anterior eliminada local/remoto. next-env.d.ts
  ajeno preservado; sin prefijo codex ni firmas/atribuciones automáticas.
- **Evidencia:** ofertas/cuentas/perfiles muestran status crudo (active, draft,
  pending_review); historiales usan replaceAll sobre códigos ingleses. Canales,
  disponibilidad, entrevistas, motivos y feedback también filtran códigos a la
  vista. Hay etiquetas parciales duplicadas y fallbacks que devuelven el código.
  Capturas locales previas muestran Choose File/No file chosen del input nativo.
  Importación muestra available/unavailable en la edición y códigos de error;
  el CSV tiene encabezados exactos de un contrato técnico que debe conservarse.
- **Origen aprobado:** accesibilidad en español de spec, FR-056, constituciónIV
  y petición expresa. No es cambio de negocio, catálogo municipal o permisos.
- **Cambio mínimo propuesto antes de implementar:** catálogos de presentación
  tipados para estados existentes, acciones/motivos y canales; reutilizarlos en
  páginas/filtros/historiales por rol y usar fallback español sin filtrar códigos
  desconocidos. Reemplazar feedback por respuesta/informe empresarial en textos,
  conservando nombres internos/RPC/IDs/values/selectores técnicos. Traducir
  códigos legados conocidos de modalidad/contrato solo en presentación. Evitar
  alterar automáticamente contenido libre escrito por personas, nombres, emails,
  archivos, datos ya guardados, URLs, identificadores o formato de CSV.
  Selector de archivos compartido con textos españoles sin depender del idioma
  del navegador; conservar input real, Field, teclado, validación y retención.
- **Archivos/contratos afectados:** domain/presentation, adaptadores de etiquetas
  existentes, páginas/componentes públicos/candidatos/empresas/admin, selección
  CV/CSV, pruebas de etiquetas/componentes/E2E, spec/plan/tasks/guía/estado.
  Sin migración, backend de negocio, schema, auth, dependencias o contratos
  persistidos nuevos. Contenido libre y contratos técnicos no se traducen.
- **Riesgos/verificación prevista:** distinguir estados de cada entidad, cubrir
  todos los valores normativos, no traducir valores enviados ni inventar estados,
  conservar privacidad de proyecciones y auditoría. RED/GREEN de etiquetas y vistas,
  escaneo de JSX/códigos visibles y pruebas por rol/historial/selectores; teclado,
  móvil/axe, tipos/lint/tooling/cobertura/build y navegador ficticio local sin reset
  ni cambios alojados. Diálogos del SO/navegador ajenos al DOM quedan fuera.
  Autoriza la petición; revisión humana/aceptación/gates históricos pendientes.
- **Detalle técnico previo al ajuste del editor:** la oferta puede contener
  códigos legados onsite/fixed_term en campos de texto libre. Mostrar su etiqueta
  española no debe reescribirlos al guardar otro campo. Usar un input visible
  etiquetado y un hidden con el valor original; solo editar explícitamente ese
  input cambia su valor enviado. Sin normalización de datos, catálogo nuevo o
  cambios de servicio. Cubrir FormData original y valores visibles en pruebas.
- **Error cliente detectado antes de corregir:** ImportUpload muestra directamente
  Error.message del navegador, por ejemplo Failed to fetch en una caída de red.
  Mantener mensajes españoles devueltos por su API protegida y mostrar un mensaje
  español genérico para excepciones de transporte/parsing, conservando archivo y
  confirmación. Regresión de fetch rechazado sin tocar el handler o sus permisos.

- **Implementación/verificación real EXTRA051:** catálogos compartidos en
  src/domain/presentation/labels.ts y adaptadores; páginas/componentes de cuentas,
  candidatos, empresas, ofertas, participaciones, derivaciones, importación y
  métricas. FileInput/CSS compartido para CV/CSV; etiquetas legadas del editor con
  FormData original preservado. Mensajes de admin-participation-action y
  referral-feedback y textos de registro traducidos, sin cambiar validaciones.
  Guía docs/product/spanish-interface.md; spec/plan/tasks y estado alineados.
  RED inicial de módulo ausente, GREEN focal49/49 y editor/inventario7/7;
  regresión de transporte1/1. Inventario AST ampliado a frases de mensajes TS/TSX.
  Resultado final: tipos/lint/build/diff-check PASS;764 pruebas/58 archivos,
  tooling57/57 y navegador18/18 sin reintentos. Navegador público/tres roles con
  locale en-US, historial/filtros, guardado/moderación/permisos, PDF/CSV retenidos,
  móvil360×800, axe y capturas ficticias revisadas. Expectativas inglesas antiguas
  corregidas y sincronización de h1 antes de axe; no se omiten pruebas/reglas.
  Supabase local conservado sin reset ni cambios alojados; sin nuevas migraciones,
  dependencias o variables. Servidor de desarrollo cerrado con autorización,
  servidores de pruebas finalizados, next-env.d.ts ajeno restaurado.
  Cobertura instrumentada limitada al módulo de entorno, no al producto entero.
  Sin suite SQL/E2E completa, NVDA, CI remoto, commit/PR o revisión humana nueva;
  aceptación municipal, OQ-001/002 y gates históricos no se declaran resueltos.

- **Integración antes de publicar:** origin/main avanzó a8c1612b (PR66).
  Colisión del ID local EXTRA042 con el registro visual ya mergeado: esta entrada
  pasa a EXTRA051, conservando su origen y evidencia; no renumera entradas ajenas.
  Resolver CV conservando returnTo de main y FileInput español. Conservar sidebar,
  portada, tipografías y reglas visuales de main. Ajustar solo tokens de FileInput
  al tema compartido, sin nueva paleta ni migración de controles oficiales.
  Leídas AGENTS/UI_GUIDELINES actualizadas y documentación/registro oficial Input
  base-nova; esa migración (EXTRA047 de main) sigue independiente y no se declara
  implementada aquí. Verificación posterior: tipos/lint/pruebas/build, navegador
  por rol y formularios, cuenta candidata con sidebar, y chequeos visuales locales.
  Next-env.d.ts permanece excluido; commit93fbca6 sin firma/atribución guardó el
  trabajo antes de integrar main. Este párrafo registra el estado previo al merge.
- **Resultado posterior a integrar PR66:** ambos conflictos resueltos sin perder
  el retorno de CV ni el diseño. Conserva la cuenta candidata con sidebar y sus
  tres secciones; el recorrido español ahora las visita también. Guía visual y
  registros de main intactos. Tipos/lint/build PASS;807 pruebas/63 archivos y
  tooling57/57 PASS. Navegador18/18 sin reintentos:17 recorridos de español,
  candidato/empresa/validación y1 filtro municipal. Los tres scripts visuales
  municipal-style-check, home-responsive-layout-check y home-keyboard-navigation-check
  PASS. Solo servicios/datos ficticios locales, sin reset o cambios alojados.
  Un intento de Vitest en sandbox falló por caché temporal ENOENT; la ejecución
  final fuera de esa restricción aprobó completa, sin cambios de código ni omisiones.
  Diff del PR contra origin/main sin errores; el merge trae un espacio final ya
  existente en la licencia Sora de main, que se conserva sin modificar la licencia.
  Creación/push del commit de integración y PR solicitados; CI y revisión pendientes.
- **Entrega:** commit93fbca6 de implementación y4b83104 de integración publicados
  sin firma ni atribución automática en feat/spanish-interface-labels. PR67 abierto
  hacia main: https://github.com/maximo-Pdev/funes-empleo/pull/67.
  Next-env.d.ts ajeno excluido. No acredita CI, revisión, merge o aceptación.

- **Corrección CI de PR67, registrada antes de implementar (2026-10-22):**
  Mateo pide corregir el check fallido. Quality39887066823: database PASS,
  application falla únicamente en intermediation.spec.ts:581,100 recorridos PASS
  y1 no ejecutado por dependencia. El helper decide todavía espera rejected/
  published/closed/cancelled; la vista correctamente muestra Rechazada. RED local
  reproduce exactamente el mismo fallo. Además queda una expectativa literal
  cancelled al final del mismo recorrido, que quedaba oculta por el primer error.
  Origen: petición de español, constituciónIV y T152/T154 de esta entrada.
  Cambio mínimo: expectativas españolas explícitas por las cuatro decisiones,
  con unión de tipos que impida claves inesperadas; mantener selectOption en
  inglés y todas las aserciones de publicación, privacidad y casos independientes.
  Archivos: tests/e2e/intermediation.spec.ts y este registro/tasks/estado/guía.
  Sin cambiar producto, backend, contratos, schema, CI o dependencias; sin saltos
  de tests ni relajación de comprobaciones. Riesgo: que un primer fallo esconda
  otro estado; verificar el recorrido entero rechazo/publicación/cierre/cancelación,
  tipos/lint/unit/tooling/build y nueva ejecución remota. No reset local ni cambios
  alojados. Autorización: solicitud expresa; CI/revisión aún no aprobadas.
- **Resultado local de la corrección:** RED confirma rejected frente a Rechazada;
  GREEN del recorrido completo1/1 sin reintentos, incluidas publicación, privacidad,
  conservación del caso al cerrar y cancelación de su caso relacionado.807 pruebas
  en63 archivos, tooling57/57, tipos/lint/build y diff-check PASS. Sin modificar
  aplicación, fixtures, configuración CI o contratos; base local conservada sin
  reset. Se publica en el mismo PR67 sin firma/atribución; next-env.d.ts ajeno
  excluido. Nueva ejecución remota y revisión humana pendientes al publicar.
- **Segundo fallo oculto de CI, antes de implementar:** Quality39889638752
  confirma101 recorridos PASS, incluido el corregido, y falla solamente SC-008A.
  demo-performance.mjs:85 aún busca Estado: published; el estado visible aprobado
  es Estado: Publicada. Ese helper no se ejecutó antes por la dependencia fallida.
  Su escenario candidato también usa fill(available) sobre el nuevo select.
  Cambiar solo texto esperado y fill por selectOption(available); agregar prueba
  de contrato del helper en tests/unit/tooling/spanish-interface.test.ts. Mantener
  barrera común, cuatro administradores,5 segundos por acción y auditorías SQL,
  sin ampliar plazos, reintentos ni suprimir comprobaciones. T156 deriva de T154.
  No ejecutar acceptance-concurrency local porque resetea la base preexistente;
  verificar RED/GREEN de contrato, tipos/lint/unit/tooling/build y CI aislada que
  realiza el reset autorizado en su runner. Sin cambios de producto o SQL.
- **Verificación local del helper:** RED1/2 y GREEN incluido en808/808 pruebas
  de63 archivos; tooling57/57, tipos/lint/build/diff-check PASS. Diff de medición
  limitado a etiqueta y selectOption; plazos, barrera, auditorías y reset frío
  conservados. No se ejecutó el reset en la base local preexistente. Se actualiza
  el mismo PR67; nueva CI aislada pendiente al publicar, sin afirmar aprobación.

## EXTRA-052 — Referencias privadas en lugar de UUID visibles

- **Fecha/origen:**2026-10-23, Mateo solicita quitar UUID de todas las páginas y
  URLs por los cuatro tipos de acceso. A04 ya aprueba slugs públicos/códigos
  aleatorios privados. PR67 mergeado8d00f95; árbol limpio y main actualizado,
  rama feat/private-record-references; anterior eliminada local/remota.
- **Evidencia:** UUID en detalle/enlaces/actores admin, ofertas/derivaciones de
  empresa, CV, import/retry, filtros de categorías/participaciones y métricas/CSV.
  Slugs públicos funcionan y permanecen. Triggers bump_version y append_only
  impiden backfill inocuo por UPDATE en tablas de negocio.
- **Propuesta previa:** private.record_references con códigos aleatorios96bits
  estables, backfill INSERT y AFTER INSERT, sin cambiar UUID/versión/historia.
  RPCs por lote e inversa con sesión viva, autorización por entidad y grants
  mínimos; no son credenciales. UI resuelve/genera referencias en fronteras sin
  alterar comandos. Conservar stub empresarial revocado, CV reautorizado y slugs;
  no codificar UUID ni usar nombres/DNI/email como localizador privado.
- **Archivos/contratos:** migración nueva, lib de referencias, páginas/actions/API/
  componentes y pruebas afectadas; spec/plan/modelo/tasks y contrato
  private-record-references.md. Recuperación aditiva; SQL antes de app.
- **Riesgos/verificación:** IDOR, revocación, versiones, colisiones, URLs antiguas,
  filtros, revalidación, duplicados, scripts quality y exportaciones. SQL positivo/
  negativo, RED/GREEN, tipos/lint/unit/tooling/build y navegador cuatro accesos.
  Sin reset de la base local o cambios alojados no solicitados. Tokens Auth y
  datos internos/contenido libre no se convierten por estética.
- **Revisión:** análisis acotado de arquitectura/constitución y autorización por
  petición expresa; no nuevas decisiones legales ni aprobación municipal.
  Investigación delegada de solo lectura según speckit-plan; implementación,
  verificación local completadas; revisión humana pendiente.
- **Resultado2026-10-23:** T157–T161 implementadas/verificadas. SQL1125/19,
  unit/componentes844/65, tooling57, tipos/lint/build/diff-check, advisor security
  warn/error sin incidencias y navegador108/108 sin reintentos/omisiones; SC-008A
  conserva cuatro actores, barrera y cinco segundos. Dos carreras SQL adicionales
  de suspensión/revocación correctas. Lectura manual de cuenta, padrón, perfil,
  actores y participaciones con códigos, sin mutaciones de negocio.
  Base desechable funes-reference-check54331/54332, fixture/hashes intactos;
  no se reseteó ni migró la habitual54321/54322 ni el alojado. Guide/contrato,
  matriz y estado sincronizados. Migración antes de app; nuevos commit/PR,
  revisión independiente y rollout alojado no realizados.

### EXTRA-052 — Precisión técnica de la prueba de colisiones

El rol postgres local no es propietario de pgcrypto: la prueba no puede sustituir
extensions.gen_random_bytes (evidencia SQL,2026-10-23). Para comprobar reintentos y
rollback sin elevar privilegios ni modificar extensiones, se encapsulan solamente
los12 bytes en private.record_reference_entropy, sin EXECUTE para clientes.
Producción sigue usando pgcrypto; la prueba sustituye esa función propia dentro
de una transacción revertida. Afecta migración, contrato y prueba025. Riesgo:
exposición accidental, verificada mediante grants y pgTAP. Detalle necesario bajo
la autorización de EXTRA-052; revisión humana pendiente.

### EXTRA-052 — Aplicación alojada autorizada, 2026-10-23

Mateo solicita «hace la migracion» después de la validación aislada. Se comprobó
mediante CLI autenticado que el proyecto vinculado es Funes-empleo
(`kyjycjojzhwggjuqjnki`), activo, y que existen pgcrypto, el guard de sesión,
can_read_cv y deny_history_change. Tabla/RPCs/triggers/revisión20261023180306
todavía ausentes. El conector MCP no tiene permisos; el CLI sí accede al proyecto.
Se aplicará únicamente el SQL completo20261023180306 mediante Management API,
sin db push/reset ni reparación del historial anterior divergente. Luego se
verificarán backfill, permisos, metadatos y advisors y se registrará únicamente
esta versión como aplicada. Se compararán huellas agregadas de negocio antes y
después, sin extraer datos personales. La publicación de app y revisión por PR
siguen fuera de esta autorización.

Resultado: SQL completo aplicado, exit0, y solo20261023180306 registrado después
de verificar.3751 referencias; cero faltantes/huérfanas, nueve triggers, RLS,
grants restringidos y guard AUTH_REQUIRED comprobados. Huellas y conteos de las
nueve tablas de origen, consentimientos y auditoría intactos. Advisor alojado:
52 WARN previos y54 posteriores, cero ERROR; los dos nuevos0029 corresponden a
los RPC SECURITY DEFINER intencionales con autorización por recurso. No se
silencian ni se declaran inexistentes; detalle y enlaces en la guía de validación.
No se hizo db push/reset ni despliegue; historial anterior y base local habitual
intactos. Se preserva next-env.d.ts regenerado por el servidor existente.

Publicación posterior autorizada por Mateo: commit a22745d sin firma/coautorías,
[PR68](https://github.com/maximo-Pdev/funes-empleo/pull/68), rama
feat/private-record-references hacia main8d00f95. Tipos/lint,844 unitarias y57
tooling repetidos PASS; diff-check y escaneo de patrones de credenciales PASS.
CI/revisión humana, merge, despliegue y recorridos alojados siguen pendientes.

## EXTRA-053 — Retirar enlace global «Ir al contenido principal»

- **Fecha/origen/autoridad:**2026-10-23, Mateo solicita expresamente eliminar el
  enlace oculto repetido, conservando la navegación existente (A16). PR68 mergeado
  confirmado86b7de8; main actualizado, rama fix/remove-skip-link; anterior
  eliminada local/remotamente. next-env.d.ts ajeno se conserva sin incluirlo.
- **Problema/evidencia:** RootLayout agrega un anchor sr-only a todas las rutas.
  setup.spec.ts y home-keyboard-navigation-check.mjs exigen ese primer foco; A16
  estaba pendiente de comprobar alternativa accesible. UI_GUIDELINES conserva
  una indicación histórica contradictoria de ocultación solo en portada.
- **Cambio propuesto antes de implementar:** quitar solamente ese anchor del
  layout compartido; conservar main#contenido, tabIndex, títulos, regiones/nav
  identificadas, foco visible y enlace Inicio de portada. Actualizar regresiones
  de ausencia del enlace, primer control real y retorno Inicio mediante teclado.
  No reemplazarlo por otro enlace oculto, componente o atajo inventado.
- **Justificación/alcance:** constituciónIV, FR-070 y SC-009 exigen operabilidad
  por teclado, no ese texto/control concreto. Se conserva navegación semántica
  por landmarks (técnica W3C ARIA11) y controles operables; Inicio de portada no se
  presenta como sustituto universal del salto para todas las rutas. No se afirma
  que Tab sin tecnología de apoyo salte automáticamente las cabeceras.
- **Archivos/contratos:** layout raíz, tests de layout/portada/setup y chequeo
  visual de teclado; A16, spec/plan/tasks, guía UI y pauta manual de validación.
  Sin contratos de negocio, backend, schema, dependencias o migraciones.
- **Riesgos/verificación prevista:** regresión del primer foco, pérdida de
  destino/landmarks, navegación Inicio y aparición accidental del enlace.
  RED/GREEN de layout, teclado escritorio/móvil y páginas públicas, axe sin
  omisiones, tipos/lint/unitarias/tooling/build. Pruebas de lectura sin reset,
  login ni cambios de negocio. Revertir el diff recupera el enlace anterior.
- **Gate acotado:** solicitud explícita y análisis de consistencia A16/FR-070/
  SC-009/constituciónIV; sin arquitectura nueva o decisión municipal inferida.
  Modelo y contratos intactos. Implementación/verificación completadas; revisión
  humana pendiente, sin aprobación municipal o aceptación NVDA inferidas.
- **Resultado:** eliminado únicamente el anchor global de src/app/layout.tsx;
  main y enlaces Inicio intactos. RED2/2 en el layout y GREEN14/14 focalizadas.
  Tipos/lint,846 pruebas/66 archivos, tooling57 y build de producción PASS;
  diff-check PASS. Seis recorridos públicos de lectura con primer foco/landmarks
  y axe sin violaciones, más seis combinaciones de Inicio por teclado a1440/390px
  (ingreso/postulante/empresa) PASS. Sin omisiones ni reintentos.
- **Entorno/límites:** Node24.22.0; compilación en copia aislada ignorada y servidor
  propio3001, con configuración pública ficticia, sin copiar .env.local. Sin
  reset/SQL/login/envíos de formularios, ni tocar servidor3000 o su .next. Advertencia
  de múltiples lockfiles propia de la copia anidada; no se cambió next.config.
  Evidencias test-results/remove-skip-* ignoradas. No se repitió la batería privada
  ni se certificó lector de pantalla/zoom real. No hay migración.
- **Publicación autorizada posteriormente:** Mateo solicita el PR; commit9a899d3
  sin firma/coautorías, rama fix/remove-skip-link, [PR69](https://github.com/maximo-Pdev/funes-empleo/pull/69)
  abierto hacia main86b7de8. next-env.d.ts ajeno permanece sin incluirse. CI,
  revisión humana, merge y despliegue pendientes; no acredita aceptación global.
- **Fuente técnica:** [W3C ARIA11](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11).

## EXTRA-054 — CV vigente en el perfil administrativo del candidato

- **Fecha/origen:**2026-10-23, Mateo solicita sustituir «Cargar CV» por el CV
  vigente y acceso protegido, con mensaje si falta y sin cambiar autorización.
  PR69 mergeado08cd740 confirmado; main actualizado, nueva rama
  feat/admin-candidate-current-cv y anterior eliminada local/remotamente.
  next-env.d.ts local ajeno se conserva.
- **Evidencia:** detalle administrativo solo monta CvUploadForm; getAdminCandidate
  trae estados del CV, no metadatos/enlace. El handler /api/cv/[referencia] ya
  transmite attachment privado reautorizado por sesión, RPC y Storage. La carga
  del detalle es también el único acceso UI administrativo para perfiles asistidos
  (assisted-candidate.spec.ts). Retirarla sin alternativa rompería FR-013.
- **Cambio propuesto antes de implementar:** leer únicamente metadatos del CV
  status=valid y archived_at=null mediante sesión admin y RLS; mostrar nombre,
  tamaño y descarga por referencia opaca usando el handler existente. Sin CV,
  mensaje explícito y ningún enlace. No consultar ni mostrar versiones históricas
  como vigentes, rutas Storage, hashes o signed URLs. Conservar ocultación actual
  de la tarjeta en perfiles archivados y errores seguros ante fallos de consulta.
- **Adición necesaria/justificación:** mover el formulario existente a «Mantener
  perfil y atención presencial», sin cambiar su POST, validación, versión o
  permisos. Actualizar el texto del enlace asistido y el recorrido E2E para que
  la asistencia con PDF siga siendo realizable. No retirar la capacidad aprobada
  de carga/reemplazo administrativa ni modificar el autoservicio candidato.
- **Archivos/contratos:** search-service, páginas de detalle/mantenimiento admin,
  tests de consulta/UI/descarga y assisted-candidate; spec/plan/tasks y guía UI.
  Ampliación interna del resultado del servicio (currentCv); sin schema, nuevos
  RPC, endpoint, grants, dependencias o migración. Descarga attachment existente,
  no visor embebido ni nueva exposición inline del PDF.
- **Riesgos/verificación prevista:** CV reemplazado/archivado, error interpretado
  como ausencia, pérdida de carga asistida, URL UUID o IDOR. RED/GREEN de consulta
  y UI, permisos antes de consultar, ausencia/error, enlace vigente y endpoint
  reautorizado; tipos/lint/unit/tooling/build y navegador local ficticio.
- **Gate/análisis acotado:** petición expresa coordinada según AGENTS; conserva
  FR-004/013/070, constituciónII/III/IV, matriz de autorización y modelo CV.
  No cambia arquitectura o decisión legal. Implementación/verificación local
  completadas; revisión humana pendiente. Recuperación: revertir UI/consulta
  conservando archivos e historial.
- **Resultado:** ficha con nombre/tamaño y descarga vigente por referencia; estado
  vacío claro, sin selector de archivo. Carga/reemplazo trasladados al mantenimiento
  existente. RED6/28, GREEN66/66 focalizadas; tipos/lint,856 pruebas/67 archivos,
  tooling57 y build PASS. Diff-check PASS; endpoint/SQL/RLS/Storage originales
  intactos. Revisión React: componentes servidor, consulta paralela y mínima,
  enlace nativo sin prefetch, sin nuevas dependencias o caché compartida.
- **Navegador:** seis recorridos de referencias/roles/IDOR PASS sobre el respaldo
  desechable; dos recorridos asistidos completos PASS sobre instancia nueva,
  sin omisiones/reintentos. Incluyen ausencia de CV, dos cargas, enlace nuevo tras
  reemplazo, descarga PDF attachment/no-store, derivación, consentimiento, claim,
  duplicados e historial. Dos anchos1440/390px: descarga con Enter, sin overflow
  ni errores del navegador; capturas ficticias revisadas. Advisor local sin incidencias.
- **Límites:** no se ejecutó la batería completa E2E/SQL de aceptación; no se
  certifican NVDA, zoom real ni revisión municipal. No se tocó la base habitual
  ni alojada, .env.local o .next del usuario. Copia ignorada, Node24.22.0 y
  configuración local ficticia; diagnóstico del respaldo explicado debajo.
  Sin migración nueva; next-env.d.ts ajeno preservado.
- **Publicación posterior autorizada:** Mateo solicita el PR; commit aa139cc
  sin firma/coautorías y [PR70](https://github.com/maximo-Pdev/funes-empleo/pull/70)
  abierto desde feat/admin-candidate-current-cv hacia main08cd740. next-env.d.ts,
  copias, logs y credenciales locales excluidos. CI/revisión, merge y despliegue
  pendientes; no acredita aceptación municipal/global.

### EXTRA-054 — Diagnóstico del entorno de verificación

La prueba de lectura/descarga/roles pasó, pero la carga en el respaldo local
funes-reference-check falló: reserva correcta, Storage POST500/42P10. Se comprobaron
índices de storage.objects (solo únicos parciales/versionados) y StorageAPI1.72.1;
no se cambian índices del proveedor para hacer pasar la prueba. Se comprobará una
instancia desechable nueva funes-admin-cv-check54341/54342, sin resetear/modificar
la habitual o alojada. Es diagnóstico de infraestructura de pruebas, no una
migración ni cambio funcional o de seguridad del proyecto.

Resultado: instancia nueva cargó el mismo PDF correctamente. Su esquema generado
por Storage incluye bucketid_objname único(bucket_id,name), ausente en el respaldo;
se confirma incompatibilidad del respaldo, no del formulario trasladado. No se
añadieron índices ni se alteraron migraciones para silenciar42P10. Se recompiló
la copia contra54341 y se repitieron ambos recorridos asistidos completos2/2 PASS,
sin modificar límites, aserciones, timeouts o reintentos. Los seis controles de
referencias/roles del respaldo habían pasado; no se presentan como una batería
completa en un único dataset. Guardas/puertos/contenedor/buzón se adaptaron solo
en la copia ignorada, con destinos loopback exactos. Evidencias agregadas y logs
test-results/admin-current-cv-* ignorados; servicios de prueba se cierran al terminar.

## EXTRA-055 — Apartado administrativo de atención presencial

- **Ajuste solicitado antes de publicar,2026-10-24:** Mateo aclara que el apartado
  debe permitir crear perfiles y consultar los creados en la misma pantalla, no
  limitar el alta a un enlace a otra ruta. Propuesta previa a este ajuste:
  montar el AssistedProfileForm existente encima de filtros/listado, usando el
  catálogo activo ya consultado. Retirar el enlace de alta de esta pantalla;
  conservar la ruta anterior y el destino de mantenimiento al guardar por
  compatibilidad. Sin nuevo formulario, acción, consulta, contrato o permiso.
  Archivos afectados: página del apartado, pruebas de página/E2E y spec/plan/UI.
  Riesgos: confundir controles de ambos formularios, perder listado vacío o
  protección previa a consultas. Verificar alta desde la misma URL, validación,
  duplicados, listado/detalle, roles, tipos/lint/pruebas/build. Autorizado por el
  pedido explícito; implementado y verificado técnicamente, revisión pendiente.
  Resultado: formulario visible arriba y «Perfiles creados» con filtros/listado
  debajo, en /admin/atencion-presencial. Se conservan categorías ya consultadas,
  detección de duplicados, acción y destino de mantenimiento al guardar.
  RED2/26 por ausencia de alta integrada; GREEN35/35 focalizadas. Tipos (typegen y
  tsc), lint,873/873 unitarias/componentes,57/57 tooling, build y diff-check PASS.
  Cinco recorridos de navegador pasaron inicialmente, incluido el alta desde la
  misma URL. La regresión de claim falló por usar el buzón54324 habitual desde la
  copia aislada; se corrigió solo esa copia a54344 y el recorrido pasó1/1. Sin
  omisiones o aumento de timeouts. Copia aislada no apta para tests de rutas/guards
  de tooling: unitarias/tooling finales ejecutados sobre la raíz original, PASS.
  Una ejecución focalizada previa sufrió ENOENT de caché temporal del sandbox;
  ejecución con runtime autorizado PASS sin modificar pruebas para eludirlo.
  Axe sin violaciones en pantalla con ambos formularios; capturas1440/390px
  revisadas sin overflow ni pageerror. Mismos límites de aceptación que abajo.
- **Fecha/origen:**2026-10-23, Mateo solicita un apartado propio en el menú lateral
  con perfiles creados presencialmente y acceso a sus detalles, reutilizando
  registros/funciones sin modificar permisos o negocio. PR70 mergeado84a2ce6
  confirmado; main actualizado y rama feat/admin-assisted-candidates-section.
  Anterior eliminada local/remotamente; next-env.d.ts ajeno preservado.
- **Evidencia:** AdminShell solo ofrece Candidatos; /admin/candidates/assisted
  contiene el alta actual y /assisted/[referencia] su mantenimiento. El modelo
  ya conserva origin=assisted incluso después del claim; account_id nulo o un
  administrador gestor no identifican por sí solos ese origen. La búsqueda
  general predeterminada exige vigencia/aptitud, por lo que oculta borradores.
- **Propuesta previa:** menú «Atención presencial» a /admin/atencion-presencial,
  listado de los mismos candidate_profiles con origin=assisted fijo en servidor.
  Reutilizar búsqueda, filtros, paginación, estados españoles, enlaces opacos y
  controles existentes. Por defecto vigencia/aptitud «Todos» para mostrar también
  borradores, no disponibles, vinculados y archivados; aplicar filtros explícitos
  sin cambiar reglas de aptitud. Detalle general ya maneja archivo/historial y
  permite mantenimiento cuando corresponde. Conservar URL/formulario de alta.
- **Adiciones necesarias:** factorizar internamente el motor de búsqueda para
  fijar origen desde un wrapper servidor, no desde URL/cliente; añadir destino
  opcional al formulario compartido y reconocer categoryId por referencia en la
  nueva URL. Leer origin en detalle para conservar menú activo y regreso correcto.
  Sin nuevo registro, tabla, RPC, permisos, migración o componente global paralelo.
- **Archivos/contratos:** AdminShell, nueva página, páginas asistidas/detalle,
  search-service, CandidateSearchForm, reference-url, tests/Spec Kit/guía UI.
  La firma de búsqueda general conserva sus valores predeterminados. Origin es
  clasificación persistida, no una decisión nueva ni un filtro de autorización.
- **Riesgos/verificación prevista:** mezclar autoservicio/importados, esconder
  borradores/vinculados, duplicar perfiles al navegar, cambiar defaults generales,
  perder filtros o emitir UUID, saltarse guard/RLS y seleccionar dos menús activos.
  RED/GREEN de scope/menú/lista/empty/error/filtros/referencias y defaults, tipos,
  lint, unit/tooling/build y navegador ficticio de navegación/roles/claim/teclado.
- **Gate/análisis acotado:** petición coordinada según AGENTS, US4/FR-004/011/016/
  032/070 y constituciónI–V; mismo modelo/contratos de negocio y arquitectura.
  Documentar spec/plan/tasks antes de implementar. Sin decisiones municipales
  inferidas; implementación/verificación técnica completadas, revisión pendiente. Revertir UI/lectura
  conserva IDs, origen, datos e historial.
- **Resultado:** apartado implementado en los archivos previstos, con pruebas de
  origen fijo antes de conteo/paginación, defaults generales intactos, guard de
  administrador y navegación existente. El detalle conserva el menú presencial
  activo incluso con cuenta vinculada. Se actualizó la expectativa de navegación
  de Mi cuenta de siete a ocho opciones y se afirmó el destino de la nueva opción.
- **Verificación real:** RED7 fallos/8 pruebas iniciales; GREEN64/64 focalizadas;
  tipos y lint sin errores;873/873 unitarias/componentes en70 archivos,57/57 tooling,
  build de producción y diff-check PASS. Seis recorridos Chromium PASS sin omisiones
  ni reintentos: alta/mantenimiento/claim/historial presencial existentes, decisiones
  de duplicados, denegación anónimo/candidato/empresa y listado/filtros/paginación/
  detalle con origen invariable y sin duplicados por navegación. Axe sin violaciones
  en el listado; capturas ficticias revisadas a1440/390px, foco de menú y apertura
  de perfil con Enter, sin desborde horizontal ni errores de navegador. Advisor de
  seguridad local sin hallazgos. Revisión React: página de servidor, guard previo a
  lecturas, estado por solicitud, controles compartidos y referencias opacas.
- **Entorno/límites:** Node24.22.0, build y navegador en copia ignorada con .next
  propio, sin leer .env.local. Base ficticia aislada funes-admin-cv-check54341/54342;
  no se reseteó o modificó base habitual/alojada. Se cerró temporalmente next dev3000
  con autorización explícita de Mateo y se usó un servidor de prueba propio. No se
  repitió la suite E2E/SQL completa ni se certificó NVDA/zoom real. Sin migración,
  dependencias o configuración de producto nuevas. Pendientes: commit/PR si se
  solicitan, CI, revisión humana, merge/despliegue y gates históricos de aceptación.
  Servidor propio detenido y proyecto ficticio apagado con respaldo al terminar;
  puerto3000 libre. Next registró cierres anticipados de stream durante navegación
  automatizada; seis recorridos completados y revisión visual sin pageerror.

## EXTRA-056 — Alta presencial activa y aceptación expresa en una transacción

- **Fecha/origen/estado:**2026-10-24, Mateo solicita alta asistida activa inmediata
  y baja por contratación igual a otros perfiles. Aclara expresamente exigir los
  datos de activación y registrar aceptación presencial al crear. Coordinación
  cubierta por AGENTS; propuesta previa a implementación, revisión pendiente.
- **Evidencia:** save_assisted_candidate permite borradores (usado también por
  importación); assisted_candidate_command ya exige datos/contacto/disponibilidad
  y consentimiento para activar. La contratación normal/tardía ya retira el
  consentimiento global de cualquier origen, pasa a consent_withdrawn y revoca
  permisos preservando otros casos (20261021220623 y test024_hiring_consent).
- **Cambio propuesto/justificación:** comando create_active_assisted_candidate
  reutiliza guardar/aceptar/activar existentes en una transacción administrativa.
  UI de alta exige localidad, experiencia, al menos un rubro/interés, disponible
  y checkbox sin marcar que atestigua aceptación de la persona sobre política
  mostrada/versionada. Servidor y DB validan esos datos/confirmación/política.
  Duplicados/rechazo no crean consentimiento; usar/actualizar existente no acepta
  ni activa automáticamente. Mantenimiento/importación conservan contratos
  anteriores; sin backfill, aceptación implícita ni cambios al flujo de contratar.
- **Archivos/contratos afectados:** migración y recuperación, assisted-service/
  actions/forms, páginas de alta y apartado, validación; spec/plan/data-model/
  state-machines/tasks/UI; pruebas unit/componentes, SQL y E2E. Nuevo RPC con
  actor activo y permiso solo authenticated/admin real; search_path vacío.
  Incluir la firma nueva en src/lib/supabase/database.types.ts (contrato RPC
  tipado existente); contrastar con generación local sin sobrescribir ajustes
  de nulabilidad de los demás comandos ni regenerar contratos ajenos.
  Añadir invalidación de la nueva ruta presencial al confirmar contratación,
  para que una visita anterior no mantenga el indicador activo en la caché cliente.
  Afecta feedback-service y su prueba normal/tardía; no cambia la transición SQL.
- **Riesgos:** aceptar por defecto, activar duplicado previamente contratado,
  crear parcialmente ante fallo, permitir alta incompleta desde API, alterar
  importación o perder auditabilidad; CV sigue obligatorio para derivar, no para
  evaluación municipal. No es aprobación municipal para datos reales.
- **Verificación prevista:** RED/GREEN, roles, incompletos/política obsoleta/sin
  confirmación, duplicados/no reaceptación, auditoría/rollback; contratación normal
  y tardía asistida, tipos/lint/unit/tooling/build y navegador ficticio. Advisor
  y pruebas SQL en instancia aislada; no migrar base habitual/alojada en este paso.
- **Gates/recuperación:** alinear artefactos y analizar antes del código. Cambio
  aditivo dentro de arquitectura RPC/Next/Supabase aprobada; constituciónI–VI y
  FR011/014/015/017/037/070. Revertir aplicación y retirar solo nuevo RPC conserva
  datos/historial; nunca borrar altas o consentimientos ya registrados.
- **Resultado técnico:** implementado en los archivos previstos y contrato de
  tipos DB, sin reemplazar el RPC legado ni modificar contratación SQL. Alta y
  política protegidas por administrador; contacto/categorías/datos/checkbox
  exigidos; auditoría append-only y activación atómicas. Invalidación del nuevo
  apartado al guardar, consentir y contratar. Política y checkbox sin marcar
  visibles; edición de existentes conserva las condiciones anteriores.
- **Análisis:** check-prerequisites resolvió la feature vigente; no extensions.yml
  ni hooks. Seis criterios del delta cubiertos por T171–T173, cero críticos/altos
  abiertos en este alcance. Decisión de datos completos/aceptación afirmativa
  resuelta por Mateo antes de implementar; constitución/roles/privacidad intactos.
  Consultadas docs de funciones Supabase y changelog, fuente base-nova checkbox;
  se reutiliza el Field/control nativo actual sin otra imitación o dependencia.
- **Verificación real:** RED8 fallos/10 iniciales; GREEN44/44 focalizadas. Tipos
  next typegen/tsc, lint,884/884 unitarias/componentes en71 archivos,57/57 tooling,
  build producción y diff-check PASS. SQL04124/24,04065/65 y02455/55 (144
  aserciones) PASS; incluyen actor, datos, consentimiento/política, duplicados,
  historial, dos fallos de auditoría con rollback y contratación normal/tardía
  con permisos y otros casos intactos. Ocho E2E Chromium PASS sin omisiones/
  reintentos, incluidos alta activa desde el apartado y ruta anterior, duplicados,
  vinculación, roles y contratación con bloqueo concurrente por candidato.
  Axe sin violaciones; capturas de política/checkbox y ancho/foco a1440/390px
  revisadas, sin overflow ni pageerror. Advisor local sin hallazgos.
- **Diagnóstico/entorno:** copia ignorada con .next propio, Node24.22.0 y
  funes-admin-cv-check54341/54342. db query rechazó script multisentencia antes de
  ejecutar; aplicado por psql solo al contenedor aislado. Se habilitó pgTAP allí.
  Test024 requiere fixture candidato200 de aceptación completa; en copia se usó
  candidato4 disponible (mismo rol) para sesión/sub, sin cambiar aserciones.
  Tests originales no alterados por esa adaptación. Puertos/buzón/contenedor de
  navegador adaptados solo en copia. El build detectó contrato RPC faltante:
  tipo agregado, contrastado con gen types local, build repetido PASS. La suite
  detectó guard posterior a precondiciones nuevas: restaurado guard previo y
  242 pruebas de autorización incluidas en suite final PASS.
- **Límites/estado:** implementado/verificado técnicamente; revisión humana,
  commit/PR si se solicitan y CI/merge/despliegue pendientes. Migración
  20261024033056 probada solo en base ficticia, NO aplicada a Supabase alojado
  ni base habitual. No se leyó .env.local; next-env.d.ts ajeno preservado. Guía
  docs/operations/active-assisted-registration.md describe instalación/recuperación.
  Sin backfill, suite aceptación E2E/SQL completa o certificación NVDA/zoom real;
  no se cierran gates históricos ni se acredita aprobación municipal de la política.

## EXTRA-057 — Categorías laborales como única selección del candidato

- **Fecha/origen/estado:**2026-10-24, solicitud explícita de Mateo: eliminar
  Intereses laborales de todos los flujos, preservar datos y criterios restantes.
  Coordinación cubierta por AGENTS. Base84a2ce6 coincide con origin/main;
  rama feat/candidate-profile-categories conserva trabajo local EXTRA055/056 y
  next-env.d.ts ajeno. Copia de39 archivos previos en test-results/categories-before
  ignorada; sin reset, stash, commit o publicación. Propuesta antes de código.
- **Evidencia:** frontend asistido y fichas empresariales/preview distinguen tipos;
  autoservicio ya escribe solo occupation. Matching/búsqueda/activación consideran
  ambos tipos, sobre los mismos job_categories y regla OR. candidate_categories
  permite occupation/interest; seed demo/aceptación usa interest. Save asistido
  exige dos arrays y es reutilizado por CSV. El alta activa056 depende de ello.
- **Cambio propuesto:** única selección categories. Consolidar la unión exacta de
  IDs existentes como occupation sin duplicados (incluye categorías inactivas,
  perfiles archivados y cuentas vinculadas, sin reactivar catálogo o personas).
  Guardar cada relación interest original, created_at/updated_at,
  versión del perfil y versión de migración en historial privado append-only con
  RLS y sin grants de aplicación. La PK(candidate_id,category_id) ya garantiza
  unicidad: reclasificar kind in situ y verificar conservación de timestamps,
  sin insertar/borrar asociaciones; restringir kind a occupation. No borrar el historial
  original ni auditar la migración como acción de una persona ficticia.
- **Adiciones necesarias:** unificar límite de selección en40 (antes20 categorías
  más20 intereses) en comandos propios/asistidos para poder mantener toda unión
  histórica válida. CSV conserva su mapping/columnas; accepts interests:[] legado
  solo como compatibilidad vacía, rechaza valores no vacíos y confirmedFields
  obsoletos. Actualizar guardar asistido, alta activa y autoservicio en nueva
  migración; no editar migraciones históricas. Lecturas/matching mantienen OR,
  rubros activos, elegibilidad, exclusión por participación, orden y paginación.
- **Archivos/contratos afectados:** formularios/asistido/registro informativo,
  validación/proyecciones TS, tipos RPC si corresponde, seed y pruebas; migración
  nueva y recuperación. Spec/plan/data-model/contratos/tareas/checklist/UI y guías
  de importación/matching/validación/discovery. Historial documental previo se
  conserva como evidencia; interés por una oferta no es el campo que se elimina.
- **Riesgos:** pérdida de selecciones, duplicar coincidencias, ocultar únicos
  intereses, reactivar perfiles o renovar consentimiento por backfill, aceptar
  payload antiguo con pérdida silenciosa, romper CSV/duplicados y perder origen.
  Historial nuevo privado, sin exposición empresarial o nueva autorización.
- **Verificación prevista:** etapas de specify/clarificación (solicitud expresa,
  sin incertidumbre municipal nueva)/plan/checklist/tasks/análisis antes de código;
  RED/GREEN de UI/validación, SQL migración/igualdad de uniones/duplicados/datos
  históricos/rollback/privacidad y comandos propios/asistidos/CSV/matching;
  tipos/lint/unit/tooling/build y navegador candidato/admin/empresa, incluyendo
  consentimiento/contratación previa056. Solo base ficticia aislada, sin alojado.
- **Recuperación/gobernanza:** compatible hacia adelante; conservar originales en
  ledger y captura de definiciones previas de comandos. Reversión automática solo
  antes de cambios posteriores en perfiles; después revisión/recuperación selectiva
  sin borrar selecciones nuevas. No modifica principios constitucionalesI–VI ni
  privacidad/consentimiento/estados, solo FR012 y selección efectiva equivalente.
  Revisión humana/CI y aplicación alojada pendientes, no aceptación municipal.
- **Resultado:** campo y etiquetas retirados de alta/mantenimiento asistido,
  texto de registro, preview de oferta y ficha empresarial. Autoservicio conserva
  su selector único y ahora puede guardar la unión histórica40. Proyecciones
  aceptan solo occupation. Payload vacío anterior se descarta en la frontera
  técnica, nunca se convierte en un campo de producto; no vacío se rechaza.
  Importación permanece con una sola columna categorias y mapping v1. Migración
  nueva reclasifica filas in situ, sin borrar asociaciones, y guarda origen y
  timestamps en ledger privado inmutable. Guía operacional y semillas/hashes
  regenerados. Ningún criterio adicional de matching o regla de estados cambiado.
- **Gates/verificación real:** spec/clarificación expresa/plan/checklist/tasks y
  análisis del delta revisados antes de código; diez criterios de aceptación
  cubiertos por T174–T178, sin críticos/altos abiertos del delta. RED3/3 iniciales,
  GREEN21/21 focalizadas;887/887 unitarias/componentes en72 archivos,57 tooling,
  typegen/tsc, lint, build de producción y diff-check PASS. Prueba de migración
  sobre relaciones previas no vacías14/14 PASS: unión exacta, ambos timestamps,
  personas archivadas, categoría inactiva, perfiles/versiones/consentimientos/
  participaciones/auditoría/catálogo intactos y mismo matching real en3 páginas.
  Nuevo fixture042 y suite SQL completa21 archivos/1163 aserciones PASS, incluida
  importación, rollback, privacidad, perfiles, matching, derivación y contratación.
  Fixture500 candidatos/50 empresas/100 ofertas/1000 participaciones y500 CV
  ficticios cargados y permisos de Storage comprobados por runner existente.
  Dieciséis E2E PASS sin omisiones/reintentos: autoservicio/registro, asistido/claim,
  duplicados, roles, CSV y concurrencia/rollback, matching/modal/nominación y
  contratación normal/tardía. Categorías visibles y persistidas en candidato,
  admin y empresa; sin campo/etiquetas retiradas. Axe sin violaciones; capturas
  ficticias revisadas1440/390px, foco y ancho sin overflow/pageerror. Advisor local
  sin hallazgos. Revisión React: mismos controles compartidos, sin nuevo estado
  duplicado/efectos ni cambios de permisos o dependencies.
- **Entorno/diagnóstico:** Node24.22.0, build en copia ignorada/.next independiente,
  funes-admin-cv-check54341/54342. Docker estaba detenido y se inició oculto.
  Después de la prueba de migración se reconstruyó exclusivamente ese proyecto
  ficticio con runner de aceptación; guards de puerto/proyecto/contenedor/buzón
  adaptados solo en la copia, sin relajar guards de la raíz o usar destino alojado.
  SQL completo usa fixtures reales de aceptación sin sustituciones de identidad.
  La PK real es (candidate_id,category_id): se corrigió la propuesta preliminar
  de copiar/borrar por reclasificación in situ antes de aplicar; ninguna fila de
  asociación se borró por el backfill. Se mantiene evidencia de la migración
  y de la aceptación en test-results ignorado, sin secretos ni datos reales.
- **Convergencia/límites:** implementación del delta cubierta y verificada;
  T174–T178 no cierran gates históricos del MVP. Revisión humana/CI, commit/PR si
  se solicitan y despliegue pendientes. Migración20261024124316 probada únicamente
  local; no aplicada a Supabase alojado o base habitual. Recuperación selectiva
  documentada; no se ejecutó una reversión sobre datos compartidos. E2E relevante
  completo, sin certificar suite E2E global o NVDA/zoom real. Cambios previos y
  next-env.d.ts ajeno conservados (hash verificado); no .env.local ni publicación.

## EXTRA-058 — Retirar nominación desde el perfil candidato

- **Fecha/origen/estado:**2026-10-24, Mateo solicita eliminar la opción de nominar
  desde el perfil. Misma rama feat/candidate-profile-categories y cambios pendientes
  previos preservados; propuesta previa a implementar, revisión humana pendiente.
- **Evidencia:** detalle admin importa NominationForm y consulta
  listNominationOpenings para perfiles active; mantenimiento presencial enlaza al
  detalle anunciando nominación. La oferta ya permite nominar explícitamente desde
  su popup mediante el comando servidor existente.
- **Cambio mínimo:** retirar formulario/imports/consulta del detalle y referencia
  textual en enlace asistido; eliminar componente y consulta huérfanos. Mantener
  Ofertas, CV, notas, historial, participaciones y decisiones de cuenta. No
  modificar createAdminNominationAction/servicio de comando ni SQL/permisos.
- **Archivos/contratos:** página candidate detail, assisted detail, componente
  nomination-form y función listNominationOpenings; spec/plan/UI/tasks y tests.
  Derivado necesario: E2E existentes deben iniciar nominaciones desde una oferta;
  helper de prueba usa matching/popup actual y lectura ficticia para localizar la
  página y el caso creado. Datos de prueba deben coincidir en rubro y tener CV;
  el bloqueo de derivación sin CV sigue verificado por SQL, sin cambiar su regla.
- **Riesgos/verificación:** retirar solo esa entrada, no la nominación general;
  conservar datos/autorización y no consultar catálogo de ofertas al ver perfil.
  RED/GREEN de detalle activo/asistido/inactivo/archivado, regresión popup de oferta,
  flujo asistido y escenarios de intermediar/cancelar; tipos/lint/unit/tooling/build
  y navegador local ficticio. Sin nueva migración o configuración.
- **Gate/recuperación:** UI acotada autorizada; mismo contrato de comando y
  arquitectura, constituciónI–VI/FR031/034/070. Artefactos alineados antes de código.
  Revertir UI recupera entrada anterior sin tocar registros; no decisiones
  municipales nuevas ni revisión humana/aceptación declaradas.
- **Resultado:** se retiró NominationForm del detalle y su componente sin usos;
  listNominationOpenings eliminado junto con imports y consulta por perfil activo.
  Enlace asistido ahora «Consultar CV vigente, notas e historial». Comando de
  nominación y popup de oferta intactos; no nuevos permisos, tablas, estados,
  dependencias o migraciones. Misma rama y trabajo previo preservados.
- **Verificación real:** RED1 fallo/26 pruebas; GREEN30/30 de páginas,891/891
  unitarias/componentes en72 archivos,57 tooling, typegen/tsc, lint, build y
  diff-check PASS. Cuatro regresiones cubren activo propio/asistido, borrador y
  archivado sin selector/botón, con historial/Ofertas disponibles y sin catálogo
  de nominación. Ocho E2E PASS sin omisiones/reintentos: asistido/claim/duplicados,
  cuatro matching/popup y dos escenarios de intermediar/retiro/cierre/cancelación.
  Helper nuevo usa realmente la UI de oferta, solo lee DB ficticia para localizar
  página/caso. Candidato1 selecciona rubro A para sus ofertas2/3; caso de cancelación
  usa28 (rubro A), manteniendo los resultados independientes del escenario.
  CV de asistido se carga antes de acceder al matching, sin alterar reglas de DB;
  pruebas SQL anteriores conservan cobertura de derivación sin CV. Axe de los
  recorridos sin violaciones; capturas1440/390px de perfil revisadas, Ofertas con
  foco de teclado, sin overflow ni pageerror.
- **Diagnóstico/entorno:** servidor de usuario3000 se conservó; copia ignorada con
  .next propio y servidor de producción3001. Auth ficticio/guards/contextos/buzón
  adaptados estrictamente a3001/54341 solo en copia; raíz conserva configuración
  original. Fixture de aceptación reconstruido solo en funes-admin-cv-check para
  escenarios independientes (500/50/100/1000 y500 CV comprobados). Sin repetir
  SQL de negocio porque este cambio no lo modifica. Primer build detectó uso de
  opción exact de Playwright en Testing Library: corregido en dos selectores.
  Lint detectó variable de prueba huérfana: eliminada. Una captura de status
  coincidió con reinicio del fixture y el guard abortó antes de compilar; espera
  a completar fixture y build final PASS. No se relajaron aserciones ni timeouts.
- **Estado/límites:** implementado y verificado técnicamente; docs/spec/plan/UI/
  tareas alineados. No se tocó base habitual o alojada, .env.local, caché del
  usuario o migraciones anteriores pendientes. Commit/PR no solicitados; CI,
  revisión humana/merge/despliegue y gates globales pendientes. No certifica toda
  la suite E2E/SQL, NVDA/zoom real o aceptación municipal. No hay migración nueva.

## EXTRA-059 — Atención presencial dentro del perfil administrativo

- **Fecha/estado:** 2026-10-24; registrado antes de implementar, implementado y
  verificado técnicamente. Autorizado por solicitud explícita de Mateo; revisión
  humana y PR pendientes.
- **Problema/evidencia/origen:** el detalle ofrece otro enlace a «Mantener perfil
  y atención presencial», donde se duplican notas y navegación. Mateo pide las
  opciones al entrar al perfil, únicamente si fue creado presencialmente y aún
  no tiene cuenta vinculada. Deriva de FR-011/013/018 y EXTRA055/056/058.
  Aclaración posterior del mismo pedido: al vincular deben quedar las mismas
  opciones de gestión que en un perfil normal, según el estado de la cuenta.
- **Cambio mínimo:** reutilizar AssistedProfileForm, AssistedCommands, ClaimForm
  y CvUploadForm dentro del detalle administrativo, solo para origin=assisted,
  account_id nulo y perfil no archivado. Consultar workspace únicamente en ese
  caso y comprobar de nuevo su origen/vinculación. Conservar notas, CV e historial
  una sola vez. Alta/guardado navegan al detalle principal; ruta antigua redirige
  con autorización y referencia opaca, sin romper enlaces existentes.
- **Archivos/contratos:** páginas de detalle principal/antiguo, assisted-forms,
  search-service (leer archived_at), pruebas de páginas/flujo presencial,
  spec/plan/tasks/UI y guía presencial. No cambia RPC, DB, permisos, reglas de
  activación/consentimiento, comandos ni contratos de escritura.
- **Riesgos/recuperación:** controles obsoletos durante vinculación concurrente;
  conservar guard/versiones del servidor y volver a verificar workspace. Al
  refrescar tras vincular desaparecen edición/consentimiento/carga/vinculación;
  consulta, notas e historial permanecen. Revertir solo este delta de UI.
- **Análisis acotado:** constitución I–VI respetada; composición de componentes
  existentes sin nueva arquitectura ni decisiones municipales. El alcance
  solicitado confirma coordinación; no hay gates arquitectónicos nuevos.
- **Verificación prevista:** matriz asistido/vinculado/otros orígenes/archivo,
  lectura después de guard, redirección opaca; alta, edición, CV, consentimiento,
  claim y conservación de historial en navegador ficticio. Tipos, lint, unitarias,
  tooling y build. Sin mutaciones alojadas o migración adicional.
- **Archivos reales:** los dos detalles de candidates, search-service.ts,
  assisted-forms.tsx, admin-pages.test.tsx, E2E assisted-candidate/assisted-section/
  private-references, guía phase-6-assisted-service y artefactos/UI/este registro.
  Guard, versiones, RPC y reglas existentes se conservan; sin permisos nuevos.
- **Resultados:** RED3/38 inicial y RED específico de actualización tras claim;
  GREEN46/46 focales, incluidos cuatro estados de cuenta con controles idénticos
  para autogestionado/asistido vinculado, matriz de origen/archivo y ocultación
  concurrente. Suite completa903/72 PASS seguida de46/46 focales con cuatro casos
  nuevos por la aclaración posterior. Tooling57, lint sin warnings, tipos,
  build de producción y diff-check PASS en Node24.22.0. Dieciséis E2E PASS sin
  omisiones/reintentos: alta/edición/CV/reemplazo/consentimiento/retiro/aceptación/
  activación/claim/conflicto/historial, duplicados, listado, roles, matching y
  referencias privadas. Comparación del perfil vinculado verifica controles
  normales, CV e historial presentes y formularios asistidos ausentes.
- **Hallazgos corregidos:** E2E detectó una clave React duplicada entre edición
  y notas que dejaba el formulario al vincular. Prueba de rerender reprodujo el
  defecto y pasó con clave específica. La ruta antigua resuelve directamente
  el destino principal; prueba espera su URL final para no abortar un redirect
  en curso. No se relajaron aserciones ni timeouts. Vitest forks encontró archivos
  temporales ausentes; ejecución threads sin caché pasó, sin cambiar dependencias
  o configuración versionada. Script visual requirió contexto explícito de axe.
- **Entorno/límites:** build/.next y Supabase ficticio funes-admin-cv-check aislados,
  servidor3001, fixture500/50/100/1000 y500 CV comprobado. Revisión1440/390px con
  capturas, foco, secciones únicas, sin overflow/pageerror y axe sin violaciones.
  Se conserva aviso previo de streams RSC abortados en pruebas de navegación;
  no produjo fallas finales. Sin repetir SQL de negocio, migración nueva, datos
  alojados o base habitual; .env.local/caché/next-env del usuario preservados.
  No acredita suite E2E completa, NVDA/zoom real o aceptación municipal. Sin
  commit/PR por no estar solicitados en este cambio; revisión/CI/despliegue pendientes.

## EXTRA-060 — Orden de tarjetas en perfiles presenciales

- **Fecha/estado:** 2026-10-24; registrado antes de implementar, implementado y
  verificado técnicamente. Solicitud explícita
  de Mateo: CV inmediatamente debajo de Mantener perfil y resumen Perfil candidato
  encima de Participaciones recientes, en atención presencial.
- **Origen/evidencia:** composición de EXTRA059/T181–182 en detalle administrativo;
  CV estaba debajo de notas/resumen y el resumen en la columna opuesta a casos.
- **Cambio mínimo/justificación:** conservar un único bloque JSX para cada tarjeta,
  ubicarlos según origen assisted. CV después del formulario cuando exista y
  resumen justo antes de participaciones. Perfiles normales conservan su orden;
  asistidos vinculados conservan controles normales y origen histórico.
- **Archivos/contratos:** detalle candidates/[candidateId], aserciones existentes
  de admin-pages, spec/plan/tasks/UI y estado. Sin cambios de datos, RPC, acciones,
  autorización, validación o migraciones. No requiere gate arquitectónico nuevo.
- **Riesgos/recuperación:** duplicar tarjetas/ids o alterar visibilidad por mover
  JSX; reutilizar elementos únicos, conservar condiciones y comprobar orden en
  escritorio/móvil. Revertir solo este reordenamiento.
- **Verificación prevista:** pruebas existentes de estados, vinculación y opciones
  normales (comparar opciones, sin exigir idéntico orden visual de encabezados),
  tipos/lint/tooling/build y revisión ficticia1440/390px con foco/axe/orden.
- **Autorización/revisión:** petición directa confirma alcance/coordinación;
  revisión humana/PR/CI y aceptación global pendientes. Preservar trabajo local.
- **Resultados:**907 pruebas/72 archivos,46 focales de detalle,57 tooling, lint
  sin warnings, tipos, build y diff-check PASS en Node24.22.0. Se ajustaron
  aserciones existentes para comprobar vecindad de tarjetas y equivalencia de
  opciones sin imponer igual orden de encabezados entre orígenes. Revisión real
  de perfiles ficticios1440/390px: DOM y posición de CV/resumen correctos, secciones
  únicas, foco conservado, sin overflow/pageerror ni violaciones axe; capturas
  revisadas. Sin repetir flujos de escritura o SQL porque solo se movió JSX.
- **Entorno/límites:** copia/.next/servidor3001 y respaldo Supabase ficticio
  funes-admin-cv-check54341/54342; sin reset, migración o cambios alojados. Fuente
  previa, next-env.d.ts ajeno y entorno habitual preservados. Sin commit/PR
  solicitados; no acredita aceptación municipal, NVDA o E2E global.

## EXTRA-061 — Historial resumido de cuenta y perfil del candidato

- **Fecha/estado:** 2026-10-24; registrado antes de implementar, implementado y
  verificado técnicamente. Mateo identifica
  esta tarjeta con captura y decide evento por evento. Solo detalle administrativo
  de candidatos; otros historiales quedan fuera del alcance confirmado.
- **Decisiones autorizadas:** mostrar profile_activated, consent_accepted,
  consent_withdrawn (incluido retiro por contratación), availability_changed,
  account_suspended, account_reactivated, profile_linked y freshness_due. Ocultar
  creación/edición de perfil, creación/verificación de cuenta y archivo/restauración.
  Todas las clases siguen registrándose internamente. Evento y fecha/hora solamente,
  sin actor/código/estados/motivo. Reciente primero, cinco iniciales y Ver más.
- **Evidencia/origen:** FR-050/constituciónIII exige auditoría append-only; las
  respuestas confirman conservar registro interno completo. Consulta actual limita50
  antes del filtro: ocultar después perdería eventos visibles antiguos.
- **Adición técnica necesaria/propuesta:** catálogo único, filtro antes de limit,
  lotes5+1 y cursor fecha/id con desempate. Server Action de lectura incremental
  valida candidato/cursor, exige admin activo y reconstruye scope perfil/cuenta en
  servidor; RLS intacto. Seleccionar/enviar solo id técnico/acción/fecha. Cliente
  conserva eventos ante error, ofrece reintento, anuncia progreso y enfoca nuevos.
- **Archivos/contratos:** candidate-history/validación, search-service,
  history-actions, componente, detalle candidato y pruebas; spec/plan/contrato/UI/
  tasks/estado. Nuevo contrato de lectura paginada admin, sin RPC/schema/privilegios
  nuevos ni cambios de escritura/retención. Componentes municipales reutilizados.
- **Riesgos/recuperación:** cursor manipulado, empate de fecha, scope ajeno, sesiones
  suspendidas, eventos nuevos durante paginado, más de50 y vacíos. Validación,
  guard+RLS, orden estable y payload mínimo; revertir lectura/UI sin tocar datos.
- **Análisis/gates:** lectura Next/Supabase ya prevista en plan; no arquitectura
  nueva o cambio a FR-050. Artefactos alineados antes del código; constitución I–VI
  preservada. Sin decisiones legales. Petición directa confirma coordinación.
- **Verificación prevista:** ocho eventos/negativos, filtro antes de limit,
  cursor/empates/scope/errores/roles/sesiones y continuidad más de50; UI cinco/
  Ver más/foco/reintento/vacío, auditoría intacta, tipos/lint/unit/tooling/build y
  navegador ficticio1440/390px/axe. Revisión humana/PR/CI y aceptación pendientes.
- **Adición detectada en revisión visual, antes del ajuste:** Chromium convierte
  2031-01-01T00:00Z en «31/12/2030,09:00:00» con es-AR por defecto, sin período;
  hour12:false entrega21:00 correctamente. Fijar24h solo en la tarjeta nueva y
  agregar regresión de tarde, para cumplir fecha/hora clara. Sin cambiar otras
  fechas o zonas del producto; verificación en navegador/ts/unit/build prevista.
- **Archivos reales:** candidate-history.ts, validation/candidate-history.ts,
  search-service.ts, history-actions.ts, components/candidate-history.tsx y detalle
  administrativo; pruebas de servicio/componente/E2E nuevas, admin-current-cv y
  inventario transversal de Server Actions. Spec/plan/contrato/UI/tasks/estado y
  este registro actualizados. No se modificaron migraciones, RLS o escritores.
- **Resultados:** suite939/74 PASS y después24 focales postajuste24h PASS (un caso
  horario adicional). Tooling57, lint sin warnings, tipos y build final PASS en
  Node24.22.0. Nueve E2E sin omisiones/reintentos PASS antes del ajuste horario;
  recorrido de historial repetido tras24h PASS. Incluye80 eventos ocultos recientes,
  61 visibles antiguos con fecha empatada, continuación más allá de50, llegada de
  nuevo evento entre páginas, foco por teclado y comparación de huella de todas
  las filas antes/después de las lecturas: auditoría íntegra. Solo se agregaron
  eventos de prueba explícitamente ficticios en la instancia aislada.
- **UI/seguridad:**1440/390px revisados con capturas de cinco entradas y botón,
  fecha argentina24h correcta, sin overflow/pageerror y axe sin violaciones en
  tarjeta. Guard en cada llamada, casos negativos de rol/sesión/cursor/scope,
  payload mínimo, vacío, errores/reintento, bloqueo de doble carga y deduplicación
  cubiertos. Campos internos no se consultan ni envían para esta tarjeta.
- **Diagnósticos:** primer build detectó tipos opcionales en tests; corregidos sin
  cambiar aserciones. Verificación visual detectó hora12h ambigua, corregida como
  adición registrada arriba. Revisión automática de un comando falló por límite
  de uso antes de ejecutarse; tras «continua» se reintentó por el mismo mecanismo
  y build/tipos/lint/navegador finales pasaron. Sin bypass o instalación nueva.
  Aviso previo de streams RSC abortados en navegación no causó fallos finales.
- **Entorno/límites:** copia/.next/servidor3001, Supabase ficticio
  funes-admin-cv-check54341/54342, sin reset, migración nueva o cambios alojados.
  Fuente previa y next-env.d.ts ajeno preservados. No se repitieron SQL ni E2E
  globales; no acredita NVDA/zoom real o aceptación municipal. Sin commit/PR
  solicitados; revisión humana/CI/merge/despliegue y gates históricos pendientes.

### Publicación de EXTRA055–061 — 2026-10-24

A pedido de Mateo, commit sin firma ni trailers `0ad6e85` publicado en
`feat/candidate-profile-categories`. PR abierto para revisión, sin borrador:
[PR #71](https://github.com/maximo-Pdev/funes-empleo/pull/71).
Base `main` verificada en `84a2ce6`,80 archivos del trabajo autorizado; cambio
local previo de `next-env.d.ts` excluido y preservado. Se retiró una línea vacía
final de la migración de categorías al pasar diff-check, sin cambio semántico.
Descripción reúne alcance, pruebas y las dos migraciones que deben instalarse
antes del despliegue; no se aplicaron a Supabase alojado. CI/revisión humana/merge/
despliegue siguen pendientes. Esta publicación actualiza los estados históricos
de commit/PR pendientes de las entradas anteriores, sin acreditar aceptación.

## EXTRA-062 — Ofertas empresariales, derivaciones y moderación

- **Fecha/estado:**2026-10-24, registrado antes de implementar; implementado y
  verificado técnicamente en local. Mateo solicita cinco
  ajustes y confirma: derivaciones en la misma página empresarial; editar publicada
  vuelve a revisión; eliminar conserva la oferta visible Cancelada. PR71 mergeado,
  rama anterior borrada local/remota; feat/company-offer-management desde4da73c7,
  next-env.d.ts ajeno preservado.
- **Origen/evidencia:** FR-021/022/023/036/050/055, A09 y EXTRA035. Empresa solo edita
  draft/changes_requested y no cancela; admin lista borradores; derivaciones están
  separadas y el historial muestra todo. Al contratar desaparece el nombre.
- **Alcance autorizado:** R1 solo nombre del contratado confirmado normal/tardío
  en derivación propia, no basta feedback. Empresa/cuenta activas, oferta/caso/
  derivación no archivados; no padrón ni restitución de consentimiento/perfil/CV/
  contactos. R2 excluir draft antes de conteo/paginación en listados y filtro admin,
  incluido detalle empresarial; no cambiar permisos completos, métricas/restauración.
  R3 reunir derivaciones y moderación en oferta empresarial, conservando URL previa.
  R4 historial de ambos roles: cinco recientes y Ver más por5, privacidad por rol.
  R5 editar publicada exige datos completos y envía atómicamente a pending_review;
  no es pública hasta aprobarse, mantiene slug/casos/resultados/permisos existentes.
  R6 empresa cancela su oferta no final con motivo/confirmación: cierra casos abiertos
  y revoca sus accesos, conserva resultados/historial y se mantiene visible Cancelada.
- **Adiciones técnicas:** migración nueva reemplaza tres funciones con firmas/grants
  existentes: transition_opening, save_company_opening, company_referral. Guardado
  publicado llama al envío dentro de la misma transacción y devuelve estado real;
  dos escrituras/versiones y eventos, con rollback íntegro si falla. Nueva proyección
  JSON hiredCandidate{displayName,outcome:hired} mínima para propia contratación,
  independiente del permiso completo. No modificar can_company_read_referral/CV.
  Explicar excepción de nombre en consentimiento, sin alterar policy_text/hash/
  versión ni atribuir aprobación municipal/legal para datos reales. UI de historial
  limita presentación de datos ya entregados; controles compartidos, foco/errores.
- **Archivos/contratos:** SQL/tests/guía de recuperación; servicios/acciones/formulario
  oferta, composición empresarial/derivaciones, listados admin/referencias, información
  de consentimiento, catálogo/validación y tests; spec/plan/modelo/contratos/checklist/
  tasks/estado/UI. Sin roles, dependencias, servicios o infraestructura nuevos.
- **Riesgos/recuperación:** nombres ajenos/sin contratación, empresa inactiva, cambios
  de estado concurrentes, casos finales, datos incompletos, mensajes privados, URLs
  y versiones; probar guard/RLS/propiedad/rollback/preservación. Recuperar funciones
  previas sin eliminar datos/decisiones ni regenerar slugs. Solo entorno ficticio
  aislado; no aplicar alojado ni resetear base habitual.
- **Gates/verificación prevista:** actualizar especificación/clarificaciones, plan,
  contratos/checklist/tasks; análisis Spec Kit antes de código. SQL contratación
  normal/tardía, revocación/cancelación/casos finales/auditoría/atomicidad; formularios,
  filtros, historia5/Ver más, privacidad de roles; tipos/lint/unit/tooling/build y
  navegador ficticio1440/390px/axe. CI/PR/revisión humana pendientes; OQ municipales
  de datos reales/retención/producción continúan abiertas.

- **Adición EXTRA062 derivada antes de corregir integración:** E2E empresarial
  detectó que restauración deja perfil incomplete: puede consultar su borrador,
  pero el RPC de derivaciones exige empresa active. La composición conjunta no
  debe convertir esa restricción en404 de toda la oferta. Consultar workspace y
  mostrar aviso sin invocar derivaciones hasta completar perfil; conservar scope,
  permisos y SQL actuales. Archivos: página empresarial/artefactos y regresión UI/E2E.
  Riesgo: ocultar errores de autorización; se evita condicionando estado conocido,
  sin capturar genéricamente errores ni ampliar permisos. Verificar restauración,
  empresa activa y ajena. Autorizado por alcance necesario de R3 y AGENTS.
- **Adición visual necesaria previa:** CSS empresarial existente aplica verde a
  todos los botones y dos columnas al primer formulario, incluidos nuevos controles
  destructivos. Marcar el formulario de cancelación y adaptar solo ese selector para
  conservar rojo de peligro y una columna. Reutiliza tonos ya usados en el módulo;
  no modifica base global ni otros formularios. Archivos: formulario/CSS empresarial,
  prueba navegador de color/viewport/axe. Origen R6 y reglas UI de acción destructiva.
- **Adición de contrato de navegación previa:** las acciones de informe/entrevista
  revalidan solo la ruta antigua. Añadir el detalle empresarial actual a ambas
  invalidaciones conservando la anterior, para refrescar el contenido reunido por R3.
  Sin cambiar validación, permisos ni comandos; archivos feedback-actions/tests.
- **Resultado real:** migración20261024184354 de tres funciones, sin nuevas tablas
  ni alteración de datos históricos; prueba043 y ampliación024. Componentes nuevos:
  ModerationHistory, CompanyOpeningCancel, CompanyOpeningReferrals y política de
  estados empresariales; servicios/acciones/validación/formulario, composición y
  revalidaciones/ruta compatible, filtros admin, información de consentimiento y
  CSS empresarial acotado. Guía `docs/operations/company-offer-management.md`.
- **Verificación:** Node24.22.0,980 pruebas en77 archivos,283 focales finales tras
  revalidaciones,57 tooling; tipos/lint/build de producción/diff-check PASS. Supabase
  aislado funes-admin-cv-check54341/54342:1201 aserciones SQL/22 archivos PASS;
  ampliación de inactividad y repetición024/043:97 aserciones PASS. Fixture ficticio
  inicial500 candidatos/50 empresas/100 ofertas/1000 participaciones/500 PDF.
  Doce E2E (gestión, registro/restauración, contratación normal/tardía y referencias
  privadas/públicas/tres roles) PASS; un recorrido final adicional tras CSS/cache
  PASS con informe real pending_admin, validación sin perder valores, color rojo,
  edición/reaprobación/slug/cancelación/finales y capturas1440/390px/axe revisadas.
  Logs/capturas en test-results/extra062-* y snapshot aislado, ignorados por Git.
- **Diagnósticos corregidos:** mock de query thenable, tipo opcional de fixture,
  campos obligatorios de suspensión en test, esperas de navegación/canonicalización,
  estado esperado pending_admin y selector CSS Modules; no se debilitaron permisos
  ni verificaciones para resolverlos. Regresión de empresa incomplete corregida
  sin ampliar acceso. next-env.d.ts ajeno conserva SHA-256
  B8B3A344484B959AF5E4E3FC1A1609DAC3CB9ECE0CDEB6C145BE29BC4C491000.
- **Límites/entrega:** migración probada solo en local aislado; proyecto alojado,
  aplicación habitual y secretos no modificados. Sin commit/PR para este incremento;
  CI/revisión humana/merge/despliegue y aceptación/NVDA/zoom real pendientes. No se
  cierran OQ municipales ni gates históricos; checklist de revisión mantiene las
  casillas humanas pendientes. Rama feat/company-offer-management, sin prefijo
  codex; solicitud futura de commit respetará ausencia de firma/signoff/coautor.
- **Convergencia acotada:** speckit-converge sobre R1–R6/T186–191: seis requisitos,
  siete decisiones del plan y seis principios constitucionales contrastados con
  código/contratos/pruebas; cero brechas nuevas missing/partial/contradicts/unrequested,
  cero incidencias críticas/altas. No se agregaron tareas ni cabecera vacía;
  tasks.md permaneció byte a byte igual durante la evaluación (SHA-256
  8999218A2CAFB22EC3DB3BF16BFBDB6F26A99836C0CE3ACE40F12F8BE56490B4).
  Sin hooks de extensiones. La evaluación se limita a este incremento y no cierra
  tareas históricas, validación municipal, CI o revisión humana.

- **Ajuste de presentación R5 solicitado,2026-10-24 (antes de código):** Mateo pide
  que entrar a una oferta existente muestre su información y un botón «Editar
  oferta», en lugar del formulario abierto. Mostrar formulario tras esa acción,
  permitir cancelar edición y volver al detalle después de guardar una versión
  nueva. Oferta nueva conserva alta directa; botón solo en estados editables.
  Estado local de presentación ligado a versión, foco accesible y detalle completo
  con vacíos/fechas/códigos traducidos. Sin nuevos comandos, rutas, permisos ni SQL.
  Archivos: componente empresarial/detalle, tests/componentes/E2E, spec/plan/UI/tasks
  y guía. Riesgos: perder valores ante error, enviar sin guardar, edición fuera de
  estado o foco perdido. Verificar abrir/cancelar/guardar/error, estados y creación;
  tipos/lint/unit/build y navegador ficticio. Autorización explícita de Mateo.
- **Resultado del ajuste R5/T192:** implementado/verificado técnicamente. Nuevo
  CompanyOpeningDetails muestra campos, categorías, fechas y vacíos en consulta;
  CompanyOpeningForm abre editor por botón, permite cancelarlo, conserva estado
  ante validación fallida y cierra al recibir otra versión/registro. Foco al
  encabezado/botón, control bloqueado durante guardado/envío. Alta nueva directa,
  envío de borrador separado tras guardar. Formularios, servicios, comandos y
  permisos existentes preservados; sin nueva migración ni aplicación alojada.
  Artefactos/UI/guía/tests actualizados; consulta oficial de Button Base/registro
  base-nova y revisión React, sin nuevas dependencias/fundaciones.
  Verificación982 pruebas/77 archivos PASS,23 focales finales tras ligar editor a
  id/versión, tipos/lint/build final/diff-check PASS. Cuatro E2E empresariales PASS,
  incluyendo edición/cancelación/foco/validación sin borrar/guardado/reflejo en
  consulta/revisión/alta/restauración/cierre;1440/390px/axe y capturas revisadas.
  Supabase ficticio aislado reanudado sin reset, sin repetir SQL porque este ajuste
  no cambia contratos/BD; warning de stream abortado durante navegación registrado
  sin fallos finales. Logs extra062-editor-* ignorados. next-env.d.ts ajeno con
  misma huella; rama y cambios acumulados conservados. Contraste acotado contra R5,
  plan/T192 sin brechas nuevas; PR/CI/revisión humana y migración alojada previa
  continúan pendientes.

- **Entrega solicitada,2026-10-24:** Mateo pide publicar EXTRA062/T186–192 como
  PR. Base main remota comprobada sin commits nuevos; publicar la rama enfocada
  con commit sin firma/signoff/coautor, excluyendo next-env.d.ts ajeno. Incluir en
  el PR el alcance completo, evidencia local y migración alojada pendiente antes
  del despliegue. Solicitud de publicación no acredita CI/revisión/merge/aceptación.
- **Publicación realizada,2026-10-24:** commit `e2fd399` sin firma/signoff/coautor,
  48 archivos de EXTRA062/T186–192, publicado en feat/company-offer-management.
  [PR #72](https://github.com/maximo-Pdev/funes-empleo/pull/72) abierto hacia main,
  sin borrador, desde4da73c7; adjuntado a esta conversación. next-env.d.ts ajeno
  permanece solo local. Descripción contiene alcance, verificación y migración
  20261024184354 pendiente en alojado antes del despliegue. CI/revisión humana,
  merge/despliegue y aceptación siguen pendientes; no se aplicó SQL alojado.

- **Corrección CI del PR72 previa,2026-10-24:** application del commit de4e23f
  falla en candidate-history.test.tsx:29: tras aparecer la fila nueva todavía
  muestra «Cargando eventos anteriores…». React useTransition puede confirmar
  contenido y finalizar pending en commits distintos. La prueba asume sincronía
  entre ambos; no evidencia pérdida de datos o falla del comando. Esperar el
  anuncio final con waitFor antes de verificar el resultado, conservando las
  aserciones de cantidad, foco, cursor y botón. Origen T185/EXTRA061 y gate CI de
  EXTRA062; archivos test/log/tasks/estado. Sin cambios funcionales, permisos,
  datos o migración. Riesgo: ocultar falla real; se evita exigir el mismo texto
  final, sin sleeps, saltos ni retries. Verificar repeticiones focales, coverage
  completa, tipos/lint/build y nueva CI. Autorizado por pedido de corregir PR72.
- **Validación y entrega del arreglo CI:**982 pruebas/77 archivos con coverage
  PASS (100% del alcance configurado, src/lib/env/schema.ts), diez ejecuciones
  focales consecutivas con coverage PASS; tipos/lint/diff-check PASS. Un primer
  intento de coverage local se superpuso con las repeticiones y disputó su carpeta
  temporal; corregido al repetir la suite completa por separado. Build local
  encontró salida prematura del proceso PostCSS de Turbopack en el snapshot;
  se conserva diagnóstico y se prueba caché limpia, sin cambiar código productivo
  ni configuración para ocultarlo. Publicar en el mismo PR con commit sin firma,
  preservando next-env.d.ts; nueva ejecución completa de CI pendiente de comprobar.
- **Cierre local del arreglo CI:** build desde caché limpia PASS con configuración
  explícitamente ficticia, sin iniciar servicios ni cambiar el proyecto. El fallo
  PostCSS no se reprodujo en limpio. Commit `f852233` publicado sin firma en PR72;
  diez repeticiones y982/77 coverage/tipos/lint/build/diff-check PASS. La nueva CI
  completa se sigue en los checks del PR; no se atribuye su éxito antes del resultado.

- **Segundo diagnóstico CI72 previo a cambios,2026-10-24:** la nueva ejecución
  superó982 pruebas/coverage y database, pero su tanda completa terminó115 E2E
  aprobadas y tres fallidas (concurrencia dependiente no ejecutada): categorías de
  oferta y candidato ahora conviven en página, nombre contratado legado repetido
  con permiso completo aún vigente y helper español espera ruta antigua. Origen
  R1/R3/R5/T190. Acotar categorías al apartado de derivados; mostrar nombre una sola
  vez cuando ya aparece en perfil completo, conservando indicador Contratado y
  nombre mínimo al perder acceso; adaptar expectativa de mantenimiento/contratación
  tardía para conservar nombre y seguir denegando CV/perfil; canonicalizar helper
  E2E a detalle empresarial. Archivos panel, tests componentes/assisted/intermediation/
  helper referencias y artefactos. Sin cambiar autorización ni SQL. Riesgo de
  ocultar exposición: afirmar explícitamente ausencia de perfil/contactos/CV tras
  revocar. Verificar focos E2E, unitarias/tipos/lint/build y nueva CI sin skips/retries.
  Autorizado por corrección solicitada del PR y alcance técnico EXTRA062.
- **Precisión del fixture durante comprobación:** al vencer una derivación legada,
  la misma empresa aún puede tener otra derivación vigente del mismo CV (fixture21/
  521). La API de documento autoriza por cualquiera de sus permisos válidos, según
  can_read_cv existente. No exigir denegación global por caducar un permiso aislado:
  comprobar que ese detalle no devuelve perfil/contactos/enlace; tras contratación
  tardía con retiro global sí comprobar API403/404. No cambiar permisos ajenos ni
  reglas para satisfacer el test. Primera ejecución local coincidió con arranque
  del servidor; repetir después de Ready y restablecer solo el fixture aislado.
- **Resultado T194:** panel evita duplicar nombre legado sin cambiar su DTO ni
  permisos; categorías E2E se verifican en derivados; helper y recorrido de español
  esperan detalle empresarial canónico; mantenimiento conserva nombre mínimo y
  niega perfil/contactos/enlace CV, con API403/404 tras retiro global tardío.
  Nueva prueba de componente cubre nombre único y resultado con permiso completo.
 983 pruebas/77 archivos con coverage PASS; tipos/lint/build/diff-check PASS.
  Los tres E2E afectados PASS juntos en44.1s, sin skips/retries, tras Ready y reset
  exclusivo de funes-admin-cv-check54341/54342. No cambios de BD, hosted o base local
  habitual. next-env.d.ts ajeno conserva su huella; registro de interrupción de
  revisión automática por cuota resuelto al continuar por pedido de Mateo, sin
  eludir aprobación. Publicar en mismo PR72 con commit sin firma; nueva CI completa
  se confirma en los checks del PR, sin declarar aprobación antes de su resultado.

- **Preparación SC-008A/CI72, diagnóstico previo2026-10-24:** ejecución40141094918
  pasó983 pruebas/coverage, database y118 E2E; solo falló la preparación fría de
  concurrencia al agotarse180s (spawnSync status=null tras3m). En el mismo job,
  el reset inicial completo duró189s (23:06:04→23:09:13 UTC), incluidos1205 pgTAP
  en133s, migraciones/seed y500PDF. El límite auxiliar es menor que el costo medido
  del propio fixture, no se llegó a la barrera/medición. Origen T089/SC-008A y gate
  final de EXTRA062. Ampliar solo preparación acotada a300s y total del test a420s;
  mantener subprocess de medición90s, cuatro actores, umbral5000ms, dataset/hash,
  reset separado sin calentamiento y auditorías. Diagnóstico seguro por código de
  error, sin stdout/credenciales. Archivos test/protocolo/tasks/log, sin cambios de
  aplicación, permisos o BD. Riesgo de esconder lentitud: presupuesto solo prepara
  fixture, cada acción sigue fallando si excede5s y ningún gate se omite. Verificar
  preparación completa con SQL habilitado y prueba fría local aislada, tipos/lint/
  tooling y CI completa; autorización derivada del arreglo solicitado, AGENTS.
- **Resultado local T195:** aceptación fría completa PASS en2.7m en instancia
  funes-admin-cv-check54341/54342 con SQL habilitado (sin el atajo de UI del snapshot),
  fixture500/50/100/1000/500PDF, cuatro actores/barrera y cuatro mutaciones/auditorías.
  Mantiene cada operación≤5000ms y medición de proceso90s. Tipos/lint/diff-check y
  tooling57 PASS; aplicación no cambió respecto de la revisión que pasó118 E2E y
  build en CI. Protocolo actualizado en docs/validation/performance.md. Publicar en
  PR72 sin firma; nueva CI completa se verifica en checks, sin atribuir resultado
  anticipado. Base habitual/alojada y next-env.d.ts ajeno intactos.

## Formato para próximas entradas

Usar un ID consecutivo `EXTRA-NNN` y registrar:

1. Fecha, responsable y estado.
2. Problema, evidencia y requisito/tarea aprobada de origen.
3. Cambio mínimo necesario y justificación.
4. Archivos y contratos afectados, riesgos y límites.
5. Autorización y coordinación, distinguiendo decisiones pendientes de aprobadas.
6. Verificación prevista y resultados reales.
7. Limitaciones, revisión y referencias de commit/PR cuando existan.

## EXTRA-049 — Integración de la rama visual con `main` (40 commits)

- **Fecha/estado:** 2026-10-22; implementado y verificado técnicamente; revisión
  del compañero y PR pendientes. Registrado al resolver el merge.
- **Origen:** pedido explícito de Maxi de poner al día el proyecto con las ramas
  del compañero antes de publicar el trabajo visual.
- **Problema/evidencia:** la rama `feature/landing-page-visuals` partía de un
  `main` anterior y sus 7 commits no tenían equivalente remoto. Al sincronizar,
  14 archivos quedaron en conflicto, incluidos `src/app/(public)/page.tsx`,
  los formularios de registro, `CandidateProfilePanel` y la portada de pruebas.
  Ambos lados habían evolucionado en paralelo: el compañero creó los componentes
  compartidos `Form`/`Field` con validación inline, retiró el autoarchivo y unificó
  la ayuda de contraseña; esta rama extrajo los cuerpos de página a
  `candidato/_components/*-content.tsx`, agregó la variante de portada y el retorno
  de CV hacia `Mi cuenta`.
- **Cambio mínimo/justificación:** conservar ambos aportes donde son compatibles y
  preferir `main` en el comportamiento funcional ya publicado. Resoluciones:
  `TextField`/`SelectField` adoptan `Field` manteniendo las clases municipales y
  los ids de descripción que `Field` ya calcula; los formularios de registro
  conservan la validación inline del compañero y la variante `homepageLayout` de
  portada; `CandidateProfilePanel` mantiene el retiro del autoarchivo y recibe
  `cvReturnTo`, que se propaga a `CvUploadForm` como campo oculto para el envío sin
  JavaScript; las ofertas enlazan por `slug`; los radios de tipo de cuenta y el
  formulario de cierre de sesión usan los componentes compartidos que exige
  `form-inventory`; los botones llevan `type="submit"` explícito.
- **Decisiones que requieren revisión:** (1) la portada de esta rama no muestra la
  vista previa de ofertas que `main` mantiene; se conserva el rediseño aprobado y
  su enlace a `#ofertas-disponibles`, por lo que el PR debe confirmarlo; (2) se
  adoptó el texto unificado «Entre 6 y 128 caracteres. No compartas tu contraseña.»
  en los registros, revirtiendo su ausencia previa; (3) el autoarchivo sigue
  retirado, sin reintroducir `archiveAction`.
- **Superficies/contratos:** los 14 archivos en conflicto, `candidate-account.tsx`,
  `home-access-panel.tsx`, `cv-upload-form.tsx`, `home.module.css`,
  `docs/UI_GUIDELINES.md` y `tests/components/home-access-panel.test.tsx`.
  Las entradas de esta rama se renumeraron a EXTRA-040..EXTRA-046 porque `main`
  ya usaba EXTRA-020..EXTRA-039; las referencias en la guía visual se actualizaron.
- **Riesgos/recuperación:** los conflictos mezclan capa visual y comportamiento; la
  recuperación es revertir el merge y volver a resolverlo con este registro. No hay
  migraciones nuevas ni cambios de variables de entorno en esta resolución.
- **Verificación:** `npm run typecheck` exit 0, `npm run lint` exit 0 (sin warnings),
  `npm run test:unit` 773 pruebas en 58 archivos PASS, `npm run test:tooling`
  57 pruebas PASS, `npm run build` exit 0. Los 602 tests previos de la rama pasaron
  a 773 por la suite del compañero. No se ejecutó E2E ni el reset de datos.
- **Entorno:** Node observado 26.7.0, distinto del 24 LTS requerido; no se modifica
  el entorno local. Revisión visual en navegador de la portada tras el cambio de
  marcado de `Field` y aprobación del PR pendientes.

## EXTRA-050 — Cierre de brechas E2E detectadas por CI en el PR #66

- **Fecha/estado:** 2026-10-22; implementado y verificado localmente; CI y revisión
  del compañero pendientes. Registrado antes de implementar los ajustes.
- **Origen:** pedido explícito de Maxi de corregir los 12 E2E rojos del PR #66 con
  la opción elegida: arreglar los 44px, agregar el acceso a la cuenta en el navbar
  municipal y actualizar los specs que codificaban la UI anterior.
- **Problema/evidencia:** el job `application` de CI (run 39863097071) dio 85 E2E
  verdes y 12 rojos. Causas: (1) tokens de control a 38px contra el mínimo de 44px
  de `login-layout` y `registration-layout`; (2) la portada ocultaba el skip link
  global con una regla propia y no ofrecía acceso a la cuenta para sesiones
  activas, lo que rompía `session-navigation` en las seis combinaciones de rol y
  entrada; (3) `accounts`, `registration-verification` y `setup` esperaban el h1
  «Un puente claro…», el h1 «Mi cuenta» y la línea «Acceso individual activo», que
  el panel con sidebar reemplazó.
- **Cambio mínimo/justificación:** subir `--form-control-height` a 44px y recuperar
  el ritmo vertical solo en las páginas de registro mediante `@media (min-width:
  1024px) and (max-height: 1000px)` sobre la clase local `registrationPage`, sin
  tocar el gap de campos documentado; eliminar la ocultación del skip link;
  incorporar `HomeAccountNav` con `aria-label="Accesos principales"` y el enlace de
  cuenta resuelto en el servidor con `getAccountAccess`, manteniendo la portada
  como componente async igual que en `main`; alinear `setup`, `accounts` y
  `registration-verification` con el rediseño aprobado.
- **Superficies/contratos:** `src/app/globals.css`, `(public)/page.tsx`,
  `(public)/home-account-nav.tsx`, `(public)/home.module.css`,
  `(auth)/_components/registration-layout.tsx` y `registration.module.css`, los tres
  E2E y los tres chequeos visuales, más los tests de componentes de portada.
- **Riesgos/recuperación:** los encabezados y textos de los E2E son contrato de la
  suite; se actualizan solo los que el rediseño reemplazó, conservando las
  aserciones de accesibilidad, simetría y ausencia de scroll. Revertir este diff
  devuelve el estado rojo de CI.
- **Verificación local:** `typecheck`, `lint` sin warnings, 773 pruebas unitarias,
  57 de tooling y build PASS. Playwright local contra producción en 127.0.0.1:3001
  (puerto 3000 ocupado por otro servidor del usuario, no se tocó):
  `setup`, `login-layout` y `registration-layout` 12/12 PASS; además
  `home-responsive-layout-check`, `municipal-style-check` y
  `home-keyboard-navigation-check` PASS.
- **Pendiente:** CI completa (incluye `accounts`, `registration-verification` y
  `session-navigation`, que requieren Supabase local y solo corren en el runner),
  revisión del compañero y merge del PR. Node local 26.7.0, distinto del 24 LTS.

## EXTRA-051 — Panel de usuario (dashboard) accesible desde la navbar

- **Fecha/estado:** 2026-10-22; implementado y verificado localmente; revisión del
  compañero y PR pendientes. Se registra durante la implementación, no antes, por
  un desvío del orden previsto en `AGENTS.md`.
- **Origen:** pedido explícito de Maxi: la sesión iniciada debe ser visible en la
  navbar con un enlace «Panel de usuario», y ese panel —métricas de postulaciones
  en curso y cerradas— debe existir y figurar arriba de «Perfil» en la sidebar.
- **Problema/evidencia:** la navbar compartida solo ofrecía «Inicio» y «Ofertas»;
  una sesión activa no tenía un acceso directo al panel. Las postulaciones se
  consultaban en una lista plana sin resumen ni separación entre estados.
- **Cambio mínimo/justificación:** `getSiteAccess` resuelve acceso de cuenta y
  panel en una sola lectura de sesión; `HomeNavbar` acepta un enlace opcional
  `panel` que solo se renderiza con sesión activa; `/dashboard` reutiliza el panel
  candidato con `basePath` propio y redirige a empresa/administración según rol;
  se agrega la sección «Panel de usuario» como primera y predeterminada, con
  métricas, estado del perfil y listas de postulaciones en curso y cerradas.
- **Superficies/contratos:** `src/features/accounts/navigation.ts`,
  `(public)/home-navbar.tsx`, `(public)/page.tsx`, `(public)/home.module.css`,
  `(auth)/account/candidate-account.tsx`, `(auth)/account/dashboard-content.tsx`,
  `(auth)/account/account.module.css`, `(auth)/dashboard/page.tsx`,
  `api/candidate/cv/route.ts` (allowlist de retorno del CV) y las acciones de
  perfil, consentimiento y postulaciones (`revalidatePath("/dashboard")`).
- **Riesgos/recuperación:** el enlace de panel se resuelve en el servidor, por lo
  que no expone datos de sesión al cliente. El retorno del CV acepta únicamente
  la cadena exacta `/dashboard?section=perfil`, sin parámetros adicionales.
  Revertir el diff devuelve la navbar y el panel al estado anterior.
- **Verificación local:** `npm run typecheck` exit 0, `npm run lint` exit 0,
  `npm run test:unit` 803 pruebas en 59 archivos PASS, `npm run build` exit 0 con
  `/dashboard` registrada. No se ejecutó E2E ni el reset de datos.
- **Pendiente:** verificación visual en navegador, CI, revisión del compañero y
  merge. Node local 26.7.0, distinto del 24 LTS requerido.

## EXTRA-052 — Estado activo de la navbar

- **Fecha/estado:** 2026-10-23; registrado antes de implementar, autorizado por
  el pedido explícito de Maxi. Desde este pedido, la landing se denomina Home.
- **Origen/problema:** conservar en el enlace de la página actual el estilo de
  hover; en Home, «Inicio» debe permanecer verde y subrayado sin usar el mouse.
- **Cambio/justificación:** identificar la ruta actual en `HomeNavbar`, exponer
  `aria-current="page"` y reutilizar sus reglas de hover para el estado activo.
  Mantener destinos, anclas, visibilidad y estilo particular de «Mi cuenta».
- **Superficies:** `src/app/(public)/home-navbar.tsx`, `home.module.css`,
  `tests/components/home-navbar.test.tsx`, `docs/UI_GUIDELINES.md` y este registro.
- **Riesgos/recuperación:** presentación local, sin cambios de contratos,
  autenticación o datos. No extender la navbar a rutas que no la utilizan.
  Revertir únicamente este incremento restaura el estilo previo.
- **Verificación prevista:** RED/GREEN del enlace activo y navegación existente;
  suite unitaria, lint, tipos, build y comprobación visual desktop/mobile sin
  envíos ni reset de datos. Revisión humana y publicación pendientes.
- **Resultado:** implementado y verificado localmente. RED 5/6 fallos por ausencia
  de estado activo; GREEN 6/6. Se adaptó únicamente el mock `usePathname` de
  `tests/components/candidate/candidate-pages.test.tsx` al nuevo hook. Suite final
  828/828 en 62 archivos, lint, tipos, build y diff-check PASS. Navegador a 1440px
  y 390px confirma Inicio verde/subrayado sin hover, Ofertas sin estado activo y
  clic nativo que vuelve al inicio y enfoca `contenido`. Sin reset ni envíos.
  Capturas en scratch; servidor temporal propio cerrado. Sin commit ni publicación.

## EXTRA-053 — Navbar blanca con vidrio esmerilado sutil

- **Fecha/estado:** 2026-10-23; registrado antes de implementar, pedido explícito
  de Maxi para probar una navbar blanca semitranslúcida con contenido legible.
- **Cambio mínimo:** blanco al 90% y desenfoque de fondo de 16px solamente en
  navegadores con soporte; conservar blanco sólido como fallback. No aplicar
  opacidad o filtro a textos, logo o controles. Mantener navegación, dimensiones,
  borde, sombra, estado activo y reglas de visibilidad.
- **Superficies:** `src/app/(public)/home.module.css`, `docs/UI_GUIDELINES.md`
  y este registro; prueba visual temporal de solo lectura en scratch.
- **Riesgos/recuperación:** cambio visual acotado, reversible retirando la regla
  de soporte. Sin dependencias, datos o cambios de contratos.
- **Verificación prevista:** comparar fondo/desenfoque calculados antes/después;
  capturas desktop/mobile, legibilidad y anclas; unitarias, lint, tipos y build.
  Sin reset de datos, envíos, commit o publicación.
- **Resultado:** implementado y verificado localmente. Prueba visual RED sobre
  fondo blanco sólido; GREEN en producción a 1440px y 390px con alpha 0.9,
  `backdrop-filter: blur(16px)`, opacidad 1 y sin filtro de primer plano.
  Capturas inspeccionadas: contenido legible y sin recortes en la navbar;
  Inicio conserva el estado activo y el clic devuelve foco a `contenido`.
  Unitarias 828/828, lint, tipos, build y diff-check PASS. Build conserva aviso
  sobre lockfile externo al repositorio. Servidor propio cerrado; sin reset,
  envíos, commit o publicación. Evaluación visual del usuario pendiente.

## EXTRA-054 — Vidrio esmerilado en el acceso a ofertas de Home

- **Fecha/estado:** 2026-10-23; registrado antes de implementar, por pedido de Maxi.
- **Origen/cambio:** aplicar al fondo de «Ver ofertas disponibles» el mismo blanco
  al 90% y desenfoque de 16px de la navbar, reutilizando su regla de soporte y
  conservando el fallback sólido. Mantener el matiz de hover, también translúcido.
- **Superficies:** `src/app/(public)/home.module.css`, `docs/UI_GUIDELINES.md`
  y este registro. Sin cambios de markup, destinos, posición, texto o icono.
- **Riesgos/recuperación:** presentación local reversible, sin contratos o datos.
- **Verificación prevista:** RED/GREEN de estilos calculados; escritorio/móvil,
  hover y clic al destino existente; unitarias, lint, tipos, build y diff-check.
  Pruebas de solo lectura sin reset, envíos, commit ni publicación.
- **Resultado:** RED observado por blanco sólido previo; GREEN en navegador de
  producción a 1440px y 390px: fondo blanco alpha 0.9, blur 16px, texto verde
  opaco y nítido, hover tintado alpha 0.9. Capturas inspeccionadas y clic al
  destino existente con foco y alineación superior correctos. Suite 828/828,
  lint, tipos, build y diff-check PASS; aviso previo de lockfile externo persiste.
  Servidor temporal propio cerrado. Implementado/verificado localmente,
  sin commit o publicación; revisión visual del usuario pendiente.
- **Ajuste solicitado 2026-10-23 (antes de editar):** Maxi pide «quizás un 85%»
  para notar más transparencia. Bajar solamente el fondo del botón y su hover
  a 85% de opacidad; navbar permanece al 90%, blur de ambos permanece en 16px.
  Mismas superficies, riesgos y comprobaciones visuales; no cambia el contenido.
- **Verificación del ajuste:** RED por alpha previo 0.9; GREEN normal/hover a
  0.85 en 1440px y 390px, navbar confirmada en 0.9, blur 16px y texto sin filtro.
  Capturas inspeccionadas, clics/foco correctos. 828/828 tests, lint, tipos,
  build y diff-check PASS; sin commit, publicación o reset.
- **Corrección de alcance 2026-10-23:** Maxi aclara «Era lo mismo en la navbar».
  La interpretación anterior de limitar el 85% al botón fue incorrecta. Aplicar
  también 85% a la navbar, conservando blur, contenido y navegación. Registrado
  antes de editar; mismas verificaciones de estilos desktop/mobile.
- **Resultado de la corrección:** navbar con variable local al 85%; botón intacto
  al 85%. RED sobre producción previa al 90%; Chromium con CSS real en fixture
  aislado a 1440px/390px confirma alpha 0.85 y blur 16px en ambas superficies,
  sin opacidad/filtro de primer plano. Lint y diff-check PASS. Build/typecheck
  bloqueados por imports de páginas candidatas retiradas en trabajo concurrente;
  suite registra ese módulo no resuelto y dos expectativas desactualizadas de
  navegación/logout (815 PASS, 2 FAIL, 1 suite no cargada). No se modifican esas
  rutas o pruebas ajenas. No se afirma comprobación integral ni build PASS.

## EXTRA-055 — Permanencia temporal de la navbar al volver arriba

- **Fecha/estado:** 2026-10-23; registrado antes de implementar. Maxi solicita
  «unos 3 segundos desplegada» al volver arriba tras bajar, y mantenerla mientras
  el mouse esté encima. Implementación autorizada en Home, sin nuevos paquetes.
- **Cambio:** conservar el estado inicial oculto en escritorio; al pasar de
  scroll positivo a cero, retener 3000ms. Hover mantiene abierta la barra tras el
  vencimiento; salir la oculta si ya venció. Conservar foco de teclado mientras
  se usa la navegación. Cancelar timers al bajar, cambiar breakpoint o desmontar.
- **Superficies:** `home-navbar.tsx`, pruebas de navbar y Home, guía visual y este
  registro. Mantener móvil siempre visible, variante de cuenta y acabado de vidrio.
- **Riesgos/recuperación:** interacción visual local con temporizador cancelable;
  pruebas deterministas de reloj/eventos, sin datos o contratos cambiados.
- **Verificación prevista:** RED/GREEN de espera, hover/salida, scroll repetido,
  limpieza, teclado y móvil; suite, lint, tipos, build y navegador si disponible.
- **Resultado:** implementado con timer cancelable y retención independiente
  por hover/foco. RED 5 pruebas fallando por ocultamiento inmediato; GREEN
  29/29 pruebas de Home/navbar, incluida cancelación por breakpoint y desmontaje.
  `tests/visual/home-navbar-delay-check.mjs` agregado: navegador de producción
  confirma inicio oculto, espera al regresar, hover más allá de 3 segundos,
  salida y móvil visible, con y sin movimiento reducido. Servidor propio cerrado.
  Suite final 846/846 en 62 archivos, lint, tipos, build y diff-check PASS.
  Fallos intermedios de rutas concurrentes ya no aparecen en la suite final;
  no se editaron sus pruebas. Sin cambios de datos, commit o publicación.
- **Revisión solicitada 2026-10-23 (previa al cambio):** «3 segundos es mucho,
  reducelo a 2». Cambiar la espera a 2000ms, conservando hover/foco y las demás
  reglas; ajustar pruebas y guía en las mismas superficies.
- **Verificación de la revisión:** RED 2 fallos por espera de 3000ms; GREEN
  846/846 tests, lint, tipos, build y diff-check PASS. Navegador de producción
  confirma espera reducida, hover y móvil, con/sin movimiento reducido. Sin commit.

## EXTRA-067 — Cambio suave entre las introducciones de Home

- **Fecha/estado:** 2026-10-24; implementado y verificado. Maxi solicita «una
  animación suave de cambio» entre los textos del cuadrante izquierdo al
  alternar Iniciar sesión / Registrarse / Empresa.
- **Problema:** la introducción municipal se reemplazaba de golpe mientras la
  tarjeta animaba alto y ancho, lo que hacía el cambio de textos abrupto.
- **Cambio:** la introducción se remonta por vista (`key={view}`) y sus bloques
  directos entran con un fundido y un desplazamiento vertical de 8px en 420ms,
  con escalonado de 45ms hasta el quinto bloque. Sin cambios de texto, orden,
  estructura ni destinos. Movimiento reducido desactiva la animación.
- **Superficies:** `src/app/(public)/home-hero.tsx`,
  `src/app/(public)/home.module.css`, `docs/UI_GUIDELINES.md` y este registro.
- **Riesgos/recuperación:** animación puramente visual sobre nodos sin estado;
  sin cambios de datos, contratos, permisos ni formularios. Revertir el
  `key` y las reglas `introTextIn` restituye el comportamiento anterior.
- **Verificación:** `tests/components/setup/home.test.tsx` y
  `tests/components/home-access-panel.test.tsx` 33/33; suite completa 962/962
  en 70 archivos; lint, tipos, build y `git diff --check` PASS. Comprobación de
  navegador propia sobre producción local: fundido con fotogramas intermedios,
  textos finales correctos en login/postulante/empresa, asentamiento sin
  transform residual, movimiento reducido con `animation-name: none`, en
  1440px y 390px. Corredores existentes: responsive 15 estados y navbar 12
  estados PASS en dos pasadas (un primer intento falló por el retraso de
  hidratación de la navbar, ajeno a este cambio). Servidor propio cerrado.

## EXTRA-068 — Compatibilidad del perfil del candidato al nominar

- **Fecha/estado:** 2026-10-25; propuesto antes de implementar. Autorizado por
  Mateo al solicitar reparar «Ver perfil y nominar» en administración.
- **Evidencia:** el listado funciona pero el diálogo responde INTERNAL_ERROR.
  `openingCandidatePreviewSchema` exige kind=occupation en cada categoría,
  aunque el diálogo solo consume code/name. Lectura agregada de la base local:
  occupation30/interest500 y migración de consolidación20261024124316 ausente.
  El historial remoto consultado por CLI también carece de esa versión; esto no
  prueba los valores remotos. El conector SQL remoto denegó acceso, sin cambios.
- **Origen aprobado:** A08/FR-031/032/070, EXTRA057 (categorías únicas) y EXTRA058
  (nominación desde la oferta). No se recupera el campo Intereses ni se interpreta
  como nueva selección. El pool SQL ya usa las relaciones de ambas clases.
- **Cambio mínimo:** proyectar categorías de preview como code/name, descartando
  el metadato interno kind legado igual que otros campos fuera del contrato.
  Mantener validación de identidad, versiones, CV, disponibilidad y vigencia;
  conservar autorización, matching OR, exclusiones, comandos y auditoría.
- **Archivos/contratos:** src/validation/opening-matching.ts, fixture de preview,
  pruebas de matching/acciones y E2E; spec/plan/contracts/README/tasks y estado.
  Sin nuevo SQL, dependencias, permisos ni cambios visuales. Las migraciones
  anteriores pendientes conservan su propósito y no se aplican por este arreglo.
- **Riesgos/recuperación:** no relajar code/name ni otras precondiciones para
  ocultar respuestas inválidas. Revertir el cambio de proyección recupera el
  fallo con categorías legadas. No borrar/reclasificar datos como atajo.
- **Verificación prevista:** RED/GREEN con payload legado, mixto y actual,
  guard de roles, IDs cruzados, contrato mínimo sin campos privados; navegador
  ficticio con apertura/CV/nominación/exclusión, errores/reintento y foco;
  tipos, lint, suite relevante/global, tooling, build y diff-check.
- **Git:** PR72 confirmado mergeado; main actualizado a a2001e5, rama anterior
  local eliminada (remota ya eliminada), nueva fix/admin-candidate-preview.
  next-env.d.ts ajeno preservado (SHA256 B8B3A344484B959AF5E4E3FC1A1609DAC3CB9ECE0CDEB6C145BE29BC4C491000).
- **Revisión previa acotada:** cubre lectura y nominación ya aprobadas, sin nueva
  arquitectura o decisión municipal. Constitución I–VI y spec/plan/contrato
  compatibles; sin críticos/altos abiertos en este delta. Revisión humana,
  verificación y publicación pendientes; no se marca aceptación global.
- **Resultado:** implementado y verificado localmente. RED3/45 (INTERNAL_ERROR
  con interest y mezcla; occupation todavía exponía kind). GREEN1178 pruebas en89
  archivos, incluida cadena real Action/servicio/validador/referencia con RPC
  simulado, roles denegados, CV inaccesible e identidad cruzada. Lint, tooling57,
  tipos, build de producción y diff-check PASS con Node24.22.0.
- **Navegador/SQL:** cinco recorridos sin reintentos/omisiones PASS: cuatro de
  matching existentes y uno local adicional reconstruyendo clasificación interest
  solo en fixture propio. Abre/reintenta, CV200/PDF por referencia opaca, conserva
  conteos al consultar, nomina exactamente una vez, registra auditoría y excluye
  tras recarga. Capturas1440/390px revisadas, sin overflow, axe0 y Escape devuelve
  foco. La clasificación temporal y su constraint se restauraron en finally.
  pgTAP existentes023/024:35+21=56 aserciones PASS (transacciones con rollback).
- **Entorno/diagnósticos:** base funes-admin-cv-check54341/54342 reanudada con
  fixture ficticio500 personas, sin reset. Código actual copiado a test-results
  con guards locales conservados y sin .env.local. Dependencias aprobadas de main
  sincronizadas con npm ci --ignore-scripts; primer intento bloqueado por Next
  del proyecto, cerrado temporalmente según autorización. El intento intermedio
  npm install se detuvo y la instalación final usa exactamente el lockfile.
  Selector SQL del CLI falló al traducir rutas Windows; psql ejecutó pgTAP
  habilitado solo en fixture, comprobando plan, conteos y ausencia de not ok.
  No se modificaron manifiestos, umbrales, servicios alojados ni la base habitual.
- **Límites/entrega:** no hay migración nueva ni aplicación remota. El historial
  alojado también muestra pendientes20261022202940/20261024033056/
  20261024124316/20261024184354, con nombres históricos diferentes; no reparar
  masivamente ni aplicar migraciones antiguas por este arreglo. Esta corrección
  no reemplaza su rollout ni acredita que esos cambios estén desplegados.
  T196/T197 técnicamente completos; revisión humana, commit, PR, CI y despliegue
  pendientes. next-env.d.ts conserva la huella inicial. Convergencia acotada:
  sin brechas nuevas en lectura, permisos, privacidad y nominación aprobadas.
- **Publicación2026-10-25:** por pedido de Mateo, commit4d3922f publicado sin
  firma/signoff/coautor en fix/admin-candidate-preview y
  [PR74](https://github.com/maximo-Pdev/funes-empleo/pull/74) abierto hacia main,
  sin borrador y adjunto a esta conversación. next-env.d.ts ajeno excluido;
  no hay migración nueva. CI/revisión humana/merge/despliegue pendientes.

## EXTRA-069 — Nombre identificable en derivaciones empresariales

- **Fecha/estado:** 2026-10-25; propuesto antes de implementar, autorizado por
  Mateo. PR74 confirmado mergeado, main actualizado0bd10b1; nueva rama
  fix/company-referral-names, anterior local eliminada; next-env.d.ts preservado.
- **Problema/evidencia:** captura de empresa con acceso terminado, encabezado
  y lista muestran solo oferta/código; imposible identificar a quién informar.
  company_referral devuelve nombre solo con permiso completo o hired confirmado;
  company_referral_references nunca lo devuelve. FR039 original lo prohibía.
- **Decisión explícita:** consultado el conflicto, Mateo confirma «Sí, conservar
  solo el nombre en sus derivaciones», aun por retiro de consentimiento, falta
  de respuesta u otro cierre. Amplía la excepción062 a toda derivación propia
  no archivada; empresa/cuenta deben seguir activas. No autoriza datos reales,
  política municipal, retención definitiva ni acceso a candidatos no derivados.
- **Cambio propuesto:** company_referral añade candidateName mínimo antes del
  guard de perfil completo. RPC aditivo company_referral_summaries retorna las
  referencias propias con candidate_name; reutiliza el ámbito autorizado del RPC
  anterior sin cambiar su firma. UI usa nombre en lista y encabezado, con código
  secundario y fallback seguro para datos antiguos; mensaje de revocación claro.
  Conservar hiredCandidate y sus controles; no reactivar permisos o consentimiento.
- **Archivos/contratos:** migración nueva, database.types.ts, referrals/service.ts,
  componentes de derivaciones, explicación en perfil candidato y pruebas TS/SQL/
  E2E. Spec/plan/modelo/contratos/tasks/checklist, OQ020, guía operativa/UI y estado.
  Firma/grants anteriores, RLS/Storage y comandos de informe permanecen iguales.
- **Riesgos:** no exponer otras categorías/contactos/CV, referencias de candidatos
  ajenos o datos por cuenta empresarial inactiva. No hacer consultas N+1 ni
  persistir copias de nombres. Nombre actual del perfil, no snapshot nuevo.
  Recuperación restaura definición anterior de company_referral y retira solo
  RPC nuevo después de revertir aplicación; sin borrar registros/historia.
- **Verificación prevista:** roles/sesión/propiedad/archivos, activo/revocado/
  retirado/no respuesta/cancelado/contratado, mismo dato en lista/detalle,
  prohibición de PII/CV/Storage, consulta sin escrituras, informe tardío sin
  reactivación. Regresiones contratación normal/tardía, tipos/lint/unit/tooling/
  SQL/build y navegador móvil/escritorio/teclado/axe. Migración solo local aislada;
  aplicación alojada no forma parte de este pedido.
- **Gates:** actualización acotada de requisitos con aclaración humana anterior;
  luego plan/contratos, checklist/tasks y análisis antes de implementar. Estado
  propuesto no acredita implementación, verificación, revisión humana o aceptación.
- **Análisis previo:** speckit-analyze acotado N1–N6/T198–201, prerrequisitos
  satisfechos, sin hooks. Seis requisitos cubiertos100%, cuatro tareas, cero
  críticos/altos o tareas sin alcance. Constitución I–VI preservada; excepción
  humana explícita sustituye stub039 solo para nombre, OQ001/002 no cerradas.
- **Prerrequisito derivado antes del ajuste:** la proyección empresarial completa
  también exige kind=occupation aunque solo muestra name; con categorías legadas
  interest fallaría antes de mostrar el nombre, como EXTRA068. Proyectar solo
  name en esas categorías (sin reintroducir Intereses), preservando validación
  de contactos/CV/identidades. Agregar regresión del payload activo legado.
- **Prerrequisito HTTP detectado antes de corregir:** el primer navegador falló
  porque summaries STABLE llama require_workflow_actor, que bloquea la cuenta
  FOR SHARE. PostgREST ejecuta esa RPC en transacción read-only y responde25006.
  Declararla VOLATILE para admitir el guard vigente, sin DML propio; prueba SQL
  de volatilidad y nueva corrida completa HTTP desde fixture limpio. No quitar
  el bloqueo/guard ni ampliar permisos para evitar el error.
- **Implementado/verificado:** migración20261025135805 añade summaries y
  candidateName, mantiene firmas anteriores/hiredCandidate/grants mínimos y
  no cambia helper de perfil/CV/Storage o informes. Servicio valida DTO y pareja
  oferta/derivación; categorías legadas proyectan solo name. Lista y encabezado
  muestran nombre, código secundario y aviso de acceso terminado; explicación
  candidata alineada sin cambiar política/version/hash. Guía de recuperación en
  docs/operations/company-referral-names.md; archivos reales coinciden con el plan.
- **Pruebas finales:** Node24.22.0,1195 tests/90 archivos con coverage,57 tooling,
  tipos/lint/build/diff-check PASS. Fixture íntegro reconstruido solo en
  funes-admin-cv-check54341/54342:1275 pgTAP/24 archivos PASS, incluidos41 nuevos,
  contratación normal/tardía, rollback y acceso;500 PDF/volúmenes verificados.
  Diecisiete E2E finales PASS sin omisiones/reintentos en2.1m: nombre propio
  activo/revocado/contratado, CV404 sin permiso, informe/confirmación, retiro/
  reaceptación, suspensión/reactivación, mantenimiento y respuesta tardía.
  Advisor local security warn/error: sin incidencias. Revisión1440/390px,
  teclado/axe0 y capturas ficticias inspeccionadas; sin estado compartido o N+1.
- **Diagnósticos conservados:** RED inicial9/39; test nuevo de status requirió
  ámbito del panel porque la página tiene varios anuncios, sin cambios de producto.
  SQL suspendido ficticio exigió completar sus campos de trazabilidad, corregidos
  antes de la corrida íntegra. Primera tanda HTTP interrumpida por25006;
  VOLATILE corregido en migración aún no publicada y suite completa repetida
  desde fixture limpio, sin quitar guard o pruebas. Avisos previos de jsdom
  canvas y raíz Turbopack múltiple de la copia aislada no impidieron gates.
- **Convergencia/cierre local:** speckit-converge acotado N1–N6/T198–201: seis
  requisitos, siete decisiones y seis principios, cero brechas nuevas; tasks
  byte-idéntico durante evaluación. Revisión React sin hallazgos. La actualización
  posterior de casillas registra evidencia técnica, no aceptación humana.
  Rama anterior eliminada también remotamente tras comprobar su merge; rama
  actual fix/company-referral-names. next-env.d.ts conserva huella inicial.
  Base habitual y proyecto alojado sin cambios. Migración alojada, commit, PR,
  CI, revisión humana y despliegue pendientes; no se acredita aceptación municipal.
- **Aplicación alojada autorizada2026-10-25:** Mateo pide «aplica la migracion».
  Destino vinculado kyjycjojzhwggjuqjnki; aplicar únicamente20261025135805 tras
  preflight/historial y respaldo ignorado de definiciones/ACL. Conector MCP
  deniega consultas; fallback al CLI autenticado autorizado, sin .env.local ni
  credenciales expuestas. Verificar objetos/volatilidad/grants/guards y conteos,
  registrar solo esta versión si la transacción finaliza, comparar advisor.
  No ejecutar db push masivo ni reparar versiones anteriores. Estado: preparación.
- **Resultado alojado2026-10-25:** aplicada transacción del archivo exacto
  (SHA25690D8008A3057C54211AF6A3D3C294274669E4323BC881A476A0A620F90BBDC06)
  por CLI db query al proyecto vinculado. Ambos cuerpos remotos verificados por
  hash contra archivo, summaries VOLATILE/security definer/search_path vacío,
  EXECUTE solo authenticated; anon/service_role denegados. Hashes de helpers de
  perfil completo/CV y contrato anterior de referencias idénticos al respaldo.
  Prueba remota sin sesión deniega summaries y detalle, sin cuentas/datos reales.
  Solo20261025135805 registrada applied tras verificar SQL; nombre confirmado
  company_referral_names. No se aplicaron ni repararon versiones anteriores.
- **Respaldo/recuperación:** test-results/referral-names-remote-backup.json
  ignorado contiene definición/ACL realmente anteriores. El remoto todavía tenía
  la proyección original sin hiredCandidate de062; para recuperación remota usar
  ese respaldo exacto y no introducir cambios adicionales restaurando062 entera.
  Consulta inicial más amplia no llegó a completar: CLI28P01 del rol temporal;
  respaldo/consulta acotados secuenciales funcionaron sin solicitar/exponer claves.
  No se afirma comparación de conteos que esa consulta no produjo. SQL aplicado
  es DDL, sin escritura de negocio, reset o backfill.
- **Advisor remoto:**56 WARN previos/57 posteriores, cero ERROR en ambos. Único
  nuevo0029 para company_referral_summaries, ejecución authenticated SECURITY
  DEFINER intencional según contrato, guard de sesión/propiedad y grants
  verificados; avisos anteriores idénticos. Referencia técnica:
  https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
  Aplicación de migración completa; commit/PR/CI/revisión y despliegue de interfaz
  siguen pendientes. next-env.d.ts ajeno preservado.
- **Publicación2026-10-25:** por solicitud de Mateo, commit07751d0 publicado
  sin firma/signoff/coautor en fix/company-referral-names y
  [PR75](https://github.com/maximo-Pdev/funes-empleo/pull/75) abierto hacia main,
  sin borrador y adjunto a la conversación. Incluye27 archivos del incremento;
  next-env.d.ts ajeno y respaldos ignorados excluidos. Migración alojada ya
  aplicada/registrada; CI/revisión/merge/despliegue de interfaz pendientes.
- **CI PR75, preparación de corrección2026-10-25:** ejecución40203520389,
  head41f7047, application falla en authorization-boundaries.spec.ts:75. El
  candidato1 vuelve correctamente a /account, cuyo panel muestra su propio
  nombre; la prueba lo confunde con exposición ajena.29 E2E pasan y92 no corren
  por dependencia; database/Vercel PASS. Antes de editar: usar candidato2 para
  conservar prohibición de Persona ficticia001, verificar su propia identidad
  en la redirección y mantener URLs/roles/ausencia de PII. Sin cambios a producto,
  permisos, SQL o migración aplicada. Verificar RED/GREEN y los cuatro actores,
  tipos/lint/diff-check, publicar en mismo PR sin firma y seguir CI completa.
- **Corrección local PR75 verificada2026-10-25:** authorization-boundaries.spec.ts
  inicia candidato2 frente a recursos del candidato1 y espera su nombre propio
  antes de comprobar ausencia del ajeno. RED determinista en copia ficticia:
  candidato1 con espera de carga reproduce la aserción contradictoria de CI;
  la prueba original podía pasar antes de que llegara el contenido transmitido.
  GREEN cuatro actores, cero reintentos/omisiones (21s). Lint y diff-check PASS;
  tipos PASS en copia aislada de fuentes actuales. Typecheck raíz incluye
  snapshots históricos ignorados y falla por sus contratos antiguos; no se
  modifican esos snapshots ni tsconfig para ocultarlo. next typegen regeneró
  next-env.d.ts: restaurados sus bytes ajenos exactos por SHA256 previo
  B8B3A344484B959AF5E4E3FC1A1609DAC3CB9ECE0CDEB6C145BE29BC4C491000.
  Producto/build/SQL sin cambios respecto al head anterior, cuyos gates pasaron
  en CI. Pendiente publicación y nueva ejecución completa del mismo PR.
- **Segundo diagnóstico CI PR75, antes de editar2026-10-25:** commit044f40b,
  ejecución40205272342: frontera corregida PASS,119 E2E PASS, dos fallos en
  hiring-consent.spec.ts:99 y una dependencia sin ejecutar. Ambas variantes de
  contratación esperaban cero apariciones del nombre para la otra empresa con
  derivación propia revocada; contradicen la excepción mínima EXTRA069 aprobada.
  Propuesta: esperar nombre/listado y encabezado identificable también allí,
  añadir ausencia de perfil/contactos, conservar denegación de CV y todas las
  aserciones de consentimiento global, bloqueo transaccional y casos intactos.
  Solo prueba E2E; producto, SQL, permisos y migración sin cambios. Verificación:
  RED/GREEN normal+tardía, cuatro actores, tipos/lint/diff y nueva CI completa.
- **Segundo ajuste local verificado2026-10-25:** hiring-consent.spec.ts mantiene
  bloqueo/atomicidad, retiro global, acceso revocado en todas las derivaciones,
  caso ajeno byte a byte y CV403/404. Nombre/encabezado y distintivo Contratado
  se comprueban por separado según la presentación actual; ausencia de perfil
  laboral/contactos se exige también a la otra empresa con derivación propia.
  RED2/2 reproduce CI; GREEN6/6 normal/tardía/cuatro actores (34.2s), cero
  reintentos/omisiones; tipos aislados, lint y diff-check PASS. Se recorrieron
  expectativas de nombres revocados de E2E: los restantes119 casos pasaron en
  CI40205272342, pendiente nueva suite completa tras publicar este ajuste.
  T202 verificada también en CI; T203 implementada/verificada local. PR75
  permanece abierto sin merge y cambios ajenos excluidos; sin cambios alojados.

## EXTRA-070 — Perfil y CV antes de notas en el detalle administrativo

- **Fecha/origen/autorización:**2026-10-25, pedido explícito de Mateo; FR-010,
  FR-011, FR-013, FR-052 y FR-070. Cambio visual autorizado; revisión pendiente.
- **Evidencia:** el detalle normal coloca resumen/CV después de notas; el
  presencial separa el resumen en la otra columna. EXTRA060 fijaba ese orden,
  sustituido únicamente en su composición por esta solicitud posterior.
- **Propuesta mínima:** renderizar una vez Perfil candidato y luego CV PDF del
  candidato antes del formulario y listado de notas, en la primera columna.
  Mantener edición presencial antes de esas tarjetas y controles/participaciones
  en la segunda. En móvil conservar el mismo orden de lectura del DOM.
- **Archivos/contratos:** página admin/candidates/[candidateId], expectativas
  existentes de admin-pages, spec/plan/tasks y UI_GUIDELINES. Sin contratos de
  datos, consultas, permisos, formularios, dependencias o migraciones nuevos.
- **Riesgos:** duplicar tarjetas/IDs, cambiar visibilidad de CV archivado o
  mantenimiento presencial. Conservar condiciones y acciones sin modificarlas.
- **Verificación prevista:** pruebas existentes de normales/presenciales/vinculados/
  archivados y CV vigente/ausente; tipos/lint/unitarias/build, composición de
  navegador ficticia en escritorio/móvil. No reset ni datos alojados necesarios.
- **Git:** main actualizado a a3cd69f, PR75 confirmado mergeado; rama anterior
  eliminada local/remota y fix/admin-candidate-card-order creada. next-env.d.ts
  ajeno preservado. Estado: registrado antes de implementar; CI/revisión pendientes.
- **Implementación/verificación:** página coloca profileDetails/candidateCv una
  sola vez antes de InternalNoteForm y Notas internas. Mantiene guard, consultas,
  CV archivado oculto, carga asistida/vinculación y segunda columna intactos.
  Expectativas existentes actualizadas para orígenes/estados, sin pruebas nuevas
  redundantes. Spec/plan/UI alineados; análisis acotado: presentación sin nueva
  arquitectura, contrato o decisión municipal; sin gates arquitectónicos nuevos.
- **Resultados2026-10-25:**1195 pruebas/90 archivos y cobertura configurada PASS;
  57 pruebas del componente administrativo PASS. Lint, tipos y build PASS;
  tipos/build en copia aislada con todos los archivos src comparados por hash.
  Primera suite tuvo timeout del escaneo español con build/navegador simultáneos;
  repetición completa sin esa carga:1195 PASS en42.19s, límites sin alterar.
  Navegador con composición real y servicios ficticios: normal/presencial sin
  cuenta,1440/390px, cuatro escenarios PASS; orden geométrico perfil→CV→notas,
  controles contenidos y sin desborde horizontal. Capturas revisadas en
  test-results/admin-card-order-visual/admin-workspace-I2nc75 (ignorado).
  Esta prueba visual no acredita sesiones/datos vivos; no se tocaron servicios
  locales/hosted ni se ejecutaron resets. diff-check PASS; hash next-env.d.ts
  ajeno idéntico al inicial. T204 implementada/verificada; commit/PR/CI/revisión
  humana pendientes, sin afirmar aceptación municipal.

## EXTRA-071 — Mostrar u ocultar identificación en el perfil propio

- **Fecha/origen/autorización:**2026-10-25, Mateo solicita mostrar DNI/CUIT y
  aclara: candidato solo su DNI y empresa solo su CUIT, junto al campo oculto
  del formulario propio. FR-010/FR-020/FR-070; no amplía consulta administrativa.
- **Evidencia/propuesta:** CandidateProfilePanel y CompanyProfileForm usan
  input password sin forma de revelarlo. Componer Field/Input nativo y Button
  municipal con estado local oculto inicial, Mostrar/Ocultar DNI o CUIT, icono,
  nombre accesible, aria-controls/pressed y type=button. Conservar valor editado,
  validación nativa, errores y contrato de guardado; sin persistir visibilidad.
- **Justificación/archivos:** componente de formulario compartido mínimo y dos
  consumidores propios, expectativas existentes, spec/plan/tasks/UI. Sin
  migración, backend, nuevas consultas/permisos o dependencias. Mantener trabajo
  EXTRA070 y next-env.d.ts ajeno en fix/admin-candidate-card-order.
- **Fuente técnica:** documentación oficial Button e Input Group de shadcn Base
  y fuente registry/base-nova/ui/button.tsx consultada por HTTPS en
  https://ui.shadcn.com/r/styles/base-nova/button.json; reutilizar adaptación
  existente, sin sobrescribir primitivas. Revisión React según skill disponible.
- **Riesgos/verificación:** asociación etiqueta/error, envío accidental y pérdida
  de edición. Comprobar toggle/reocultado, valor/FormData, teclado, default
  oculto, validación, perfiles/privacidad existentes, tipos/lint/unitarias/build
  y navegador ficticio. Estado previo a implementación; revisión/CI pendientes.
- **Resultado:** IdentifierField compuesto con Field/input/Button se usa solo en
  CandidateProfilePanel y CompanyProfileForm. DNI/CUIT ocultos inicialmente;
  botón de ojo revela/reoculta conservando edición y contrato de guardado.
  Registro, datos de terceros y atención presencial permanecen sin esos botones.
  Sin consultas, backend, migraciones, almacenamiento de visibilidad o permisos.
- **Verificación2026-10-25:**1195 pruebas/90 archivos y cobertura configurada PASS;
  11 pruebas de formularios PASS tras ajustar selectores al tipo de Testing
  Library (nombre de rol ya es exacto; sin opción exact de Playwright). Primera
  corrida acotada encontró import faltante de fireEvent en la prueba, corregido
  antes de la suite completa. Lint, tipos/build aislados y diff-check PASS;
  archivos src de la copia de build comparados por hash con el trabajo actual.
- **Navegador:** componente real montado con React/Form/Button existentes y datos
  ficticios; cuatro combinaciones DNI/CUIT×1440/390 PASS, Enter/Espacio/foco,
  aria-controls/pressed, edición conservada, FormData correcto, sin submit por
  toggle y errores/corrección de patrón intactos; axe sin infracciones ni
  desborde horizontal. Capturas/harness ignorados en test-results/identifier-toggle-browser;
  emplea Vite ya instalado solo para verificación, sin cambios de dependencias.
  No acredita sesión/base viva: la autorización no se modifica. Harness axe
  requirió contexto de navegador explícito; corregido y repetido con éxito.
- **Revisión técnica:** guía React aplicada: estado booleano local, useId estable,
  actualización funcional, sin efectos/consultas/rerenders globales; controles
  con etiquetas y type=button fuera del label. Componentes compartidos existentes
  conservados. EXTRA070 y hash ajeno next-env.d.ts preservados. T205 verificada;
  commit/PR/CI/revisión humana pendientes; sin cambios alojados ni resets.

## EXTRA-072 — Consentimiento resumido y Más información

- **Fecha/origen/autorización:**2026-10-25, Mateo entrega los seis párrafos
  exactos y pide dos visibles, cuatro en Más información y retirar el apartado
  de política. Solicitud de presentación de Consentimiento de prueba propio;
  no constituye aprobación municipal de una política para datos reales.
- **Evidencia/cambio propuesto:** CandidateProfilePanel muestra seis párrafos
  abiertos y un details de política demo. Reubicar los cuatro párrafos indicados
  en ese details, cerrado inicialmente y rotulado Más información. Reemplazar el
  párrafo de contratación por el texto literal solicitado. Retirar texto/versión/
  aviso de política de esta vista, conservando su contrato técnico y las reglas
  de consentimiento, aceptación, retirada y contratación actuales.
- **Archivos/contratos:** panel, expectativas existentes de presentación/flujo y
  E2E candidato, spec/plan/tasks/UI_GUIDELINES. Sin acciones, queries, migración,
  permisos, persistencia, dependencia o cambios en atención presencial/empresa.
  Mantener EXTRA070/071 y next-env.d.ts ajeno de la rama actual.
- **Riesgos/verificación:** texto oculto inaccesible por teclado, pruebas E2E con
  referencias antiguas, pérdida de checkbox/estado/acción. Revisar los seis
  párrafos, dos fuera/cuatro dentro, ausencia del apartado de política, apertura/
  cierre por teclado y aceptación/retiro sin cambios. Tipos/lint/unitarias/build
  y navegador ficticio escritorio/móvil; sin acceder a base alojada ni reset.
- **Estado:** registrado antes de implementar; alcance visual autorizado,
  requisitos/arquitectura de negocio intactos, revisión/CI pendientes.
- **Implementado:** dos párrafos visibles y los cuatro restantes dentro del
  details existente, rotulado Más información y cerrado de inicio, con la copia
  solicitada. Retirados el contenido/versión/aviso de la política y su título de
  esta vista. Se conserva el contrato de props, política técnica del servidor,
  estado, checkbox, select, acción y lógica de aceptación/retiro/contratación.
- **Verificación2026-10-25:**1195 pruebas/90 archivos y cobertura configurada
  PASS; expectativas antiguas de política ajustadas también en E2E candidato
  para evitar regresión en CI. Tipos/build PASS en copia aislada, con archivos
  src comparados por hash; lint y diff-check PASS. Prueba real de navegador con
  composición de página y servicios ficticios a1440/390 PASS: dos textos visibles,
  cuatro ocultos/expandibles, Enter/foco/cierre, checkbox sin marcar/obligatorio,
  sin apartado de política, sin desborde y axe0. Capturas revisadas/harness
  ignorados en test-results/consent-information-browser.
- **Límites/estado:** no se ejecutó el recorrido E2E completo de registro y
  mutaciones con base; esta verificación prueba presentación/teclado, no una
  nueva aceptación persistida. No cambió backend ni se accedió a datos alojados,
  ni hubo reset/servidor del usuario detenido. EXTRA070/071 y next-env.d.ts ajeno
  preservados. T206 implementada/verificada; commit/PR/CI/revisión pendientes.
- **Preparación de entrega2026-10-25:** Mateo solicita el PR conjunto de
  EXTRA070/071/072. main remoto coincide con la base a3cd69f; diff-check y evidencias
  finales revisadas. Publicar en fix/admin-candidate-card-order sin firma,
  signoff ni coautor. Excluir next-env.d.ts ajeno (hash inicial preservado),
  capturas/harness/logs ignorados y cualquier configuración local. Verificación
  local completa según entradas anteriores; CI completa y revisión por PR siguen
  pendientes hasta evidencia del repositorio remoto.
- **Diagnóstico CI PR76 antes de editar2026-10-25:** ejecución40231016807,
  headb9ab97f: application falla en candidate-self-service.spec.ts:82 porque
  busca «tu consentimiento global vigente» mientras EXTRA072 exige «tu
  consentimiento vigente».120 E2E PASS, uno falla y uno no corre por dependencia;
  tipos/lint/tooling/cobertura/build/SQL y database/Vercel PASS. Propuesta mínima:
  alinear esa expectativa con el párrafo autorizado y mantener su comprobación
  de revocación a todas las empresas, sin cambios de producto ni reglas.
  Revisar el recorrido entero y otras expectativas del texto; RED/GREEN local
  aislado, tipos/lint/diff, misma rama/PR sin firma y nueva CI completa. T207.
- **Corrección PR76 verificada2026-10-25:** expectativa en
  candidate-self-service.spec.ts:82 alineada con la copia autorizada, incluyendo
  revocación de accesos de todas las empresas. RED original reproducido con la
  misma ausencia de texto; GREEN del recorrido candidato entero en27.9s
  (registro/correo/consentimiento/CV/activación/dos postulaciones/retiro/suspensión/
  reactivación/archivo/restauración), cero reintentos/omisiones. Resto de pruebas
  de texto revisado; no quedan expectativas positivas del texto eliminado.
  Build local con configuración real del fixture aislado, tipos y lint PASS.
  Reutilizado solo proyecto funes-admin-cv-check/54341/54342, sin reset, cambios
  alojados o servidor3000 detenido; servicios propios cerrados con respaldo.
  next-env.d.ts ajeno preservado; diff-check PASS. Cambian prueba y trazabilidad,
  producto/SQL/reglas intactos. T207 implementada/verificada; publicación/nueva
  CI completa y revisión pendientes.

## EXTRA-073 — Oferta administrativa y orden de candidatos coincidentes

- **Fecha/origen/autorización:**2026-10-25, Mateo pide Decisión municipal a la
  derecha de Oferta y empresa, acceso destacado a sus participaciones y orden
  nuevo/antiguo. Aclara: solo candidatos coincidentes de cada oferta, por última
  actualización del perfil. FR-023/031/032/034/070; coordinación autorizada por
  el pedido. PR76 mergeado confirmado; base main9569a88, rama
  feat/admin-opening-workspace; rama anterior eliminada local/remota.
- **Evidencia/propuesta antes de implementar:** página actual coloca decisión
  bajo información; enlace de participaciones es texto simple. Matching RPC
  existente ordena por nombre antes de paginar. Añadir RPC con nombre distinto
  que reutilice private.opening_candidate_pool y una candidate_profiles por PK
  para ordenar globalmente por updated_at asc/desc, desempate nombre/ID. Mantener
  RPC anterior, helper, aptitud, total y forma mínima de respuesta intactos.
- **Semántica:** updated_at ya representa la última modificación persistida del
  perfil; también cambia por notas/CV/foto/estado que tocan ese registro. No usar
  edad, created_at, última confirmación ni inventar un nuevo reloj. Predeterminar
  Más recientes primero; cambiar orden vuelve a página1 y paginación lo conserva.
- **Archivos/contratos:** detalle de oferta, componentes matching, validación/
  servicio/tipos RPC, migración nueva y pruebas; spec/plan/modelo/research/
  contratos/quickstart/checklist/tasks. Reusar SelectField con placeholder null
  opcional para ofrecer exactamente dos órdenes sin cambiar sus defaults en
  otros usos. LinkButton compone NextLink y variantes del Button compartido en
  cliente; evita invocar helpers cliente desde el servidor y conserva rol link.
- **Justificación técnica:** ordenar solo doce fichas en cliente sería incorrecto;
  descargar todo en varias RPC añadiría viajes y duplicación. RPC aditivo evita
  sobrecargas ambiguas/ruptura de clientes existentes. Orden CASE parametrizado,
  guard admin/sesión y grants authenticated restringidos; sin nuevo índice hasta
  evidencia de plan de consulta. Nueva migración necesaria, sin backfill ni DML.
- **Riesgos/verificación:** paginar antes de ordenar, empates, parámetros repetidos/
  inválidos, pérdida de orden en enlaces, cambios a aptitud/nominación, permisos,
  enlaces con UUID, responsive/foco/formularios. SQL para orden global/empates/
  roles/integridad/compatibilidad; unit/componentes/E2E para URL y UI; tipos/lint/
  build, SQL relevante y navegador ficticio. Migración antes de nueva app;
  recuperación revierte app y retira solo RPC nuevo, sin borrar datos.
- **Investigación:** subagente de lectura según fase0 speckit-plan confirma
  triggers de updated_at y pool/contrato compartidos, sin editar archivos. Guías
  oficiales shadcn Button/Native Select y sus fuentes base-nova consultadas;
  Supabase recomienda nombres RPC únicos y ACL explícitas. Registro previo,
  etapas incrementales en feature001 existente; revisión/CI/despliegue pendientes.
- **Gate previo:** spec/clarificaciones revisadas; setup-plan y setup-tasks
  resuelven feature001 sin sobrescribir plan ni archivos gestionados. Research
  documentado; plan/modelo/contrato/quickstart y calidad de requisitos alineados.
  Análisis de solo lectura: R1–R5 cubiertos por T208–211,100%, cero críticos/altos,
  tareas sin mapear o contradicciones nuevas con constitución I–VI. Casillas de
  revisión final EXTRA062 (incremento anterior) se conservan sin marcarlas como
  revisadas; no son requisitos previos de este alcance. No se ejecuta una nueva
  implementación global del MVP ni se cierran validaciones humanas históricas.
- **Adición necesaria detectada antes de corregir estilos:** la captura real de
  Chromium muestra el LinkButton sin texto legible. admin-workspace.module.css
  aplica color verde a todos los enlaces con mayor prioridad que text-white;
  regresión E2E RED confirma rgb(7,74,31) en lugar de blanco. Propuesta mínima:
  identificar LinkButton con data-slot y excluir solo ese componente de los
  overrides de color/hover del panel, sin cambiar los demás enlaces ni paleta.
  Afecta ese CSS, LinkButton y E2E; verificar contraste, foco, axe y capturas
  escritorio/móvil, build/lint/tipos. Deriva de R2 y autorización técnica AGENTS;
  sin cambio funcional ni permisos nuevos. Revisión humana pendiente.
- **Regresión necesaria de pruebas:** el helper E2E nominateFromOpening calcula
  la página de una persona por nombre; ese cálculo quedaría desalineado con el
  nuevo default. Actualizar solo tests/e2e/fixtures/nomination.ts para localizar
  por updated_at DESC/nombre/ID y pedir updated_desc explícito. Verificar sus
  consumidores presencial e intermediación; no cambia nominación ni fixtures
  persistidos de producto. Deriva de R4/R5/T211, autorizado dentro del alcance.
- **Sincronización de regresión E2E:** el consumidor intermediation.spec.ts inicia
  otra navegación antes de terminar la redirección UUID→referencia del perfil.
  Evidencia: page.goto interrupted by /admin/candidates/can-… en la primera
  corrida focalizada, mientras presencial y moderación pasan. Esperar explícitamente
  la URL canónica antes de llamar al helper; no agregar sleeps, reintentos ni
  cambios de producto. Verificar de nuevo el recorrido afectado.
- **Implementado/verificado localmente:** migración nueva
  20261025222811_admin_opening_candidate_order.sql y prueba045; catálogo/validación,
  servicio/tipos, navegación de matching, dos componentes, detalle de oferta,
  LinkButton/SelectField y CSS acotado. Artefactos actualizados y recuperación
  en docs/operations/admin-opening-workspace.md; helper E2E y espera canónica
  alineados. Ningún archivo de migración anterior, pool o RPC legado modificado.
- **Resultados:**1200 unitarias/componentes en90 archivos y57 tooling PASS;
  73 componentes pertinentes repetidos tras corrección de contraste PASS.
  pgTAP completo1314/25 archivos PASS desde migraciones frescas con fixture
  ficticio500 candidatos/50 empresas/100 ofertas/1000 participaciones/500PDF.
  Advisor security local sin incidencias. EXPLAIN ANALYZE del pool/orden con
  12 elegibles sobre500 perfiles:9.218ms, medición sintética sin promesa de SLO.
  Primer intento de medición usó helpers pgTAP fuera de su sesión y se corrigió
  el harness; no se cambió SQL de producto por ese diagnóstico.
- **Navegador final:**5 recorridos de job-category-matching PASS23.2s, cero
  reintentos/omisiones; orden global comparado contra consulta independiente,
  paginación/reload/reinicio por teclado, parámetros repetidos, referencia opaca,
  acceso filtrado a participaciones, popup/CV/nominación/exclusión, empresa
  denegada y geometría1440/390. Axe0 en matching/popup/sección informativa,
  contraste blanco normal/hover y foco comprobados. Tres consumidores adicionales
  del helper verificados: presencial21.7s, moderación20.6s y nominación completa
  21.4s tras corregir su carrera de redirección; sin reintentos automáticos.
- **Cierre técnico:** tipos, lint, build final y diff-check PASS; fuentes del
  snapshot verificadas por hash contra los11 archivos de producto del incremento.
  Revisión propia React: orden en servidor, DTO acotado, catálogo ligero, estado
  local/acciones vigentes y componentes compartidos; sin dependencias nuevas.
  Cotejo R1–R5 cubierto5/5, sin nuevo trabajo de implementación pendiente dentro
  del incremento; no se ejecuta converge global ni se cierran validaciones ajenas.
  Cobertura configurada100% corresponde solo a env/schema, no a todo el producto.
- **Límites/entrega:** pruebas en funes-admin-cv-check54341/54342/app3001; no
  modificar base habitual ni Supabase alojado. Migración alojada debe preceder
  despliegue de esta app; pendiente de autorización operativa. next-env.d.ts
  preexistente conserva hashB8B3A344484B959AF5E4E3FC1A1609DAC3CB9ECE0CDEB6C145BE29BC4C491000.
  No commit/PR/CI global/revisión humana/aceptación municipal realizados. Avisos
  previos de canvas-jsdom, lockfile externo y stream cerrado temprano de Next
  observados sin fallos funcionales en recorridos finales; sin cambios ajenos.
- **Aplicación alojada autorizada por Mateo:** solicitud posterior «hace la
  migracion». CLI vinculado a kyjycjojzhwggjuqjnki; conector sin acceso, CLI con
  acceso operativo verificado. Preflight guarda definiciones/ACL de pool, guard
  y RPC legado en test-results ignorado; función nueva ausente y updated_at
  compatible. Aplicar únicamente20261025222811 en transacción, comprobar cuerpo,
  ACL/guard y registrar esa versión con SQL exacto antes de commit. Conservar
  historial previo y todos los registros; verificar hashes anteriores después.
- **Resultado alojado:**20261025222811/admin_opening_candidate_order aplicada y
  registrada atómicamente el2026-10-25. Cuerpo normalizado9a948e68a1c754695a901d53580e180c;
  SQL del historialb1623b94ea78a2d9c5079b8a8600748a coincide con archivo. Grants,
  VOLATILE/definer/path y denegación AUTH_REQUIRED sin sesión PASS. Pool/guard/
  RPC legado conservan hash y ACL; ningún reset ni migración anterior aplicada.
  Guía operativa actualizada. Esta ejecución no publica interfaz ni acredita
  pruebas de usuario sobre el alojamiento; commit/PR/CI/revisión pendientes.
- **Advisor posterior:**57→58 WARN, cero ERROR; solo nuevo0029 del RPC autenticado
  SECURITY DEFINER, intencional y protegido por sesión/admin antes del pool,
  ACL y path fijados; enlace de diagnóstico en guía operativa. Primer intento
  falló por autenticación de cli_login_postgres; repetición serial completó en6s.
  Posible interferencia de credenciales temporales entre conexiones paralelas,
  sin atribución definitiva; no cambiar contraseñas/secretos ni repetir migración.
- **Ampliación visual posterior autorizada:** Mateo solicita cinco eventos
  iniciales en Historial de moderación y botón Mostrar más cuando haya otros.
  Evidencia: ModerationHistory compartido ya usa5 y revela5 por interacción;
  administración y empresa lo reutilizan. Cambio mínimo: conservar ese límite,
  orden, foco y anuncio accesible; renombrar Ver más a Mostrar más y ajustar
  expectativas/bordes0/1/5/12. Archivos: componente, pruebas de historial y
  expectativas E2E afectadas, spec/plan/tasks/guía. Sin backend, SQL, permisos
  ni borrado de eventos. Verificar componentes, tipos/lint/build y control real
  en navegador; revisión humana pendiente. Trabajo previo preservado en misma rama.
- **Cierre de ampliación visual:** el límite5 y el agregado por5 ya estaban
  implementados en el componente compartido. Solo se cambió el rótulo a Mostrar
  más y se alinearon expectativas de componentes/E2E, sin reemplazar controles.
  RED por rótulo previo observado; GREEN59 pruebas en2 archivos pertinentes.
  Casos0/1/5 sin botón,12 con5→10→12, foco y anuncio PASS. Chromium con componente/
  CSS reales y datos ficticios:8 escenarios0/5/6/12×1440/390, Enter/Espacio,
  ocultar al completar, foco, sin overflow y axe0 PASS; captura móvil inspeccionada.
  Tipos/lint/diff PASS. Build falló por worker CSS de Turbopack y reprodujo error
  cacheado aun fuera del sandbox; limpiar únicamente .next de la copia aislada
  resolvió y build limpio PASS. Sin cambios de configuración/código por ese fallo.
  Artefactos/guía/T212 alineados. Sin SQL nuevo ni migración adicional, commit/PR,
  revisión humana o despliegue. Auditoría completa y cambios previos preservados.
- **Publicación solicitada:** Mateo pide «hace el pr» tras la ampliación. Rama
  feat/admin-opening-workspace alineada con main9569a88 al preparar entrega;
  publicar solo este incremento y su evidencia, excluyendo next-env.d.ts y
  test-results/secretos. Commit sin firma, signoff ni coautoría; PR hacia main.
  No acredita revisión humana, merge, despliegue de interfaz ni CI completo.
- **Entrega publicada:** commit00f06cc sin firma/signoff/coautoría en
  feat/admin-opening-workspace y [PR77](https://github.com/maximo-Pdev/funes-empleo/pull/77)
  abierto hacia main, sin borrador, adjunto a la conversación. Incluye migración
  ya aplicada y ampliación del historial. next-env.d.ts y respaldos ignorados
  excluidos; CI/revisión/merge/despliegue de interfaz pendientes.

## EXTRA-081 — Localidad por combobox y horario de atención en el registro de empresa

- **Fecha:** 2026-10-26.
- **Origen:** listado "Cosas a implementar" (S3 localidad combobox múltiple; S12 popover de rango de horarios y días en el registro de empresa), aprobado por Maxi.
- **Problema/evidencia:** la localidad era texto libre y el registro no capturaba horario de atención; S3/S12 lo piden explícitamente. No existía un catálogo de localidades en el código.
- **Cambio:** `LocalityCombobox` (catálogo fijo de localidades del área, buscable) reemplaza el input de localidad; `SchedulePopover` (días de la semana + rango horario) agrega un campo nuevo opcional. Campo `schedule` (nullish) en el schema de registro, persistido como `company_schedule` en la metadata de Auth.
- **Justificación:** un catálogo evita ortografía divergente; el horario es un dato nuevo pedido para el registro.
- **Archivos/contratos:** `validation/company.ts`, `company-actions.ts`, `service.ts`, `company-registration-form.tsx`, `locality-combobox.tsx`, `schedule-popover.tsx`, `domain/catalogs/localities.ts`.
- **Limitación:** `company_schedule` se guarda solo en la metadata de Auth. `company_profiles` no tiene columna `schedule`; persistirlo en el perfil requiere una migración de base de datos (pendiente, no bloquea el registro).
- **Riesgos:** 2 (metadata de Auth, no PII sensible); el horario es texto serializado sin validación estructural fina.
- **Verificación:** typecheck, lint, unit 1219/1219, form-inventory. Falta e2e/browser.
- **Estado:** implementado y verificado (registrado durante implementación); revisión y deploy pendientes.
