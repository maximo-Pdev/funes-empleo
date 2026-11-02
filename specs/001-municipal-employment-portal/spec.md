# Feature Specification: MVP del Portal Municipal de Empleo de Funes

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


## EXTRA-116 — Consistent navigation by session

Maxi explicitly requests the same navbar across normal pages for each session
state. Anonymous visitors see Inicio, Ofertas and Ingresar; authenticated users
see Inicio, Ofertas, notifications and Mi cuenta to their role panel. Apply the
shared navbar to auth lifecycle and terms pages too. Preserve Home desktop scroll
visibility, mobile visibility, existing guarded dashboards and form behavior.
This replaces the earlier offers-navbar profile/account target and omission of
anonymous Ingresar; it does not change offer application links or permissions.

> Preserved main branch wording; historical wherever superseded by EXTRA-120 above. Compatible requirements remain effective.


## EXTRA119 — Retiro operativo de categorías ficticias

Mateo,01/11/2026: eliminar A/B quitando asignaciones y conservando respaldo.

- **DC1:** retirar del catálogo activo DEMO-A/DEMO-B v1; conservar sus IDs/filas.
- **DC2:** respaldar íntegramente sus asignaciones candidatas/de ofertas antes de
  quitarlas, con actor, fecha, motivo y versión; sin exponer el respaldo a roles app.
- **DC3:** sin equivalencias automáticas; registros solo A/B quedan sin categoría.
  No modificar estados, versiones, consentimiento, participaciones o historia previa.
- **DC4:** operación atómica, serializada con mutaciones concurrentes, recuperable;
  otras categorías/asignaciones intactas. Abortado equivale a ningún cambio.
- **DC5:** verificar respaldo/permisos/rollback/recuperación e impacto antes y
  después en local y vinculado. Fixtures sintéticas de aceptación siguen aisladas;
  no declarar revisión humana, reset o despliegue a partir de tests.

El selector de métricas omite únicamente A/B v1 retiradas; conserva otras categorías
inactivas para historia. No cambia resultados/exportación ni borra categorías de
hechos históricos; A/B activas solo en fixtures mantienen sus pruebas deterministas.

Sustituye únicamente la conservación activa de esas dos categorías de A08.
OQ-010 sigue abierta para equivalencias históricas y ocupaciones no aprobadas.

> **Historical main decision — superseded by EXTRA-120.** Keep the following approval, intent and verification evidence verbatim; do not implement its no-Hero composition.

## EXTRA118 — Inicio autenticado en ofertas

- **HN1:** con sesión activa verificada, omitir todo el hero/acceso inicial y
  comenzar Home en Ofertas disponibles, sin reservar su altura ni desplazar vía JS.
- **HN2:** conservar navbar visible, destinos por rol y un h1 para ofertas;
  el título no queda detrás de la navbar fija. Carrusel/vacío y resto de Home iguales.
- **HN3:** sin panel activo verificado, mantener acceso/registro y avisos vigentes.
  Query registro/acceso no cambia la decisión de sesión; no alterar autorización.
- **HN4:** comprobar tres roles, invitado, errores/suspensión, recarga, logout,
  móvil/escritorio, sesión renovada y checks de calidad. Sustituye solo el hero
  activo conservado en deltas anteriores; las demás reglas de acceso siguen vigentes.

Integración PR89: su refinamiento de31/10 permanece en HomeAccessPanel reutilizable
(mensaje gris y sin pestañas si se monta autenticado). No repone ese componente
en la ruta Home con sesión activa; HN1 sigue omitiendo el hero completo.

## EXTRA117 — Pie del menú sin superposición

- **SB1:** Cuenta y demás enlaces no quedan tapados por Cerrar sesión o identidad.
- **SB2:** si la altura no alcanza, el menú puede desplazarse; el pie conserva su
  espacio y se puede alcanzar el último enlace mediante teclado.
- **SB3:** conservar navegación, logout autorizado, identidad y menú móvil
  expandido/contraído en todos los roles, sin modificar páginas o permisos.

## EXTRA116 — Colecciones paginadas, 01/11/2026

Mateo confirma5 para historiales/notas y10 para perfiles/ofertas/empresas.

- **PG1:** inventariar todas las colecciones visibles por rol; mantener listados
  principales de10 y resúmenes recientes con límite explícito/enlace a lista completa.
- **PG2:** historiales y notas muestran5 inicialmente, con acceso a los restantes
  mediante Mostrar más o páginas. No eliminar, recortar silenciosamente a50 ni
  perder eventos por el límite de respuesta de tablas.
- **PG3:** conservar GET/filtros y orden estable, contenido completo y todos los
  destinos. Notificación/hash o derivación seleccionada fuera del bloque inicial
  debe poder mostrarse sin obligar a recorrer páginas manualmente.
- **PG4:** paginar presentación no altera permisos, formularios, selección de
  evidencia, cálculos, contadores o exportaciones. Catálogos funcionales y gráficos
  agregados mantienen su alcance; no confundirlos con registros de un historial.
- **PG5:** navegación por teclado, foco en contenido nuevo, anuncio/contador,
  vacío/error/rango y última página correctos; conservar simetría y móvil.
- **PG6:** verificar todas las superficies, umbrales5/10 y acceso más allá de50,
  permisos/orden/errores y checks técnicos. Identificar consultas completas frente
  a paginación SQL real; no afirmar optimización de contratos RPC no modificados.

## EXTRA115 — Filas compartidas en detalles, 31/10/2026

Corrige la cobertura limitada de114 tras la captura aportada por Mateo.

- **SY1:** revisar las31 páginas y variantes por rol/estado; medir tarjetas reales,
  no limitarse a listados o a ausencia de overflow.
- **SY2:** tarjetas pares de detalles comparten columnas iguales, inicio y final
  de fila. Avisos generales no desplazan solo una columna. Sin pilas independientes.
- **SY3:** contacto/historial y los demás grupos de seguimiento funcionan tanto
  en casos abiertos como finales y con/sin registros. Perfil digital/presencial,
  oferta, empresa, cursos, métricas y cuentas usan el mismo criterio por fila.
- **SY4:** conservar todos los controles/estados/IDs/anclas/acciones y restricciones
  de privacidad; Perfil/CV antes de notas y participaciones. Móvil respeta orden
  DOM por filas, sin CSS order, recorte, altura de viewport o relleno artificial.
- **SY5:** verificar alineación por fila, contenido real extenso, vacíos, cambios
  dinámicos/errores, navegación/teclado/axe y checks técnicos; documentar cobertura
  y excepciones concretas de navegación lateral y lecturas/formularios únicos.

SM3 anterior queda acotado: las funciones distintas no excluyen pares de detalles
de la simetría solicitada. No se obliga a convertir navegación en una tarjeta par.

## EXTRA114 — Tarjetas simétricas,31/10/2026

- **SM1:** tarjetas equivalentes de una fila comparten ancho, altura y alineación
  de encabezado, contenido y cierre aun con títulos/mensajes de distinta longitud.
- **SM2:** conservar texto completo, orden DOM, información y acciones/formularios;
  no truncar ni imponer altura fija común a todo el sitio o a distintas filas.
- **SM3:** móvil mantiene altura natural por tarjeta; grupos distintos como
  información/decisión o formularios no se estiran para igualarlos artificialmente.
- **SM4:** revisar catálogo, candidato y empresa, recomendaciones/resúmenes y grupos
  ya equilibrados de Home/cuentas; verificar geometría, teclado, a11y y regresiones.

Se conserva el ancho/columnas113 y la navegación112. Sin cambio de negocio o datos.

## EXTRA113 — Escritorio aprovechado,31/10/2026

Pedido de Mateo amplía el alcance visual de112 a todas las páginas actuales.

- **SP1:** revisar31 páginas y variantes por rol/sección/detalle, identificando
  topes artificiales y límites intencionales de lectura; documentar cobertura.
- **SP2:** paneles privados utilizan el ancho disponible después de sidebar y
  márgenes; páginas públicas con listas/secciones amplias aprovechan escritorio
  1920/2560 con máximo1800 desde1440, conservando composición en anchos menores.
- **SP3:** listados de tarjetas distribuyen más columnas cuando hay espacio,
  conservando orden, contenido, acciones y paginación. Datos empresariales simples
  aprovechan tercera columna. No forzar alturas para llenar el viewport.
- **SP4:** formularios breves, textos legales, errores y vacíos siguen legibles y
  proporcionados; no agrandar campos/fuentes o inventar datos para llenar espacio.
- **SP5:** sin scroll horizontal, solapamientos o regresiones en1366/1920/2560 y
  móvil320/390; preservar accesibilidad, navegación112, todos los contratos y reglas.

La ampliación permite ajustar anchos de Home/cursos/paneles, antes excluidos de112;
no autoriza cambiar su contenido, interacción o identidad visual por otro motivo.

## EXTRA112 — Ofertas públicas coherentes,31/10/2026

Pedido visual de Mateo, sin modificar negocio o contratos:

- **PO1:** /ofertas y /ofertas/{slug} comparten la navegación institucional vigente,
  siempre visible. Sesión activa muestra Mi cuenta con el panel correcto y campana;
  visitante no consulta notificaciones privadas. Sin navbar/logo alternativos.
- **PO2:** ambas vistas siguen el lienzo blanco sobre verde, tipografía Sora/Be
  Vietnam y controles municipales actuales. Catálogo mantiene tarjetas equilibradas,
  filtros y paginación; detalle conserva todos los campos y opcionales registrados.
- **PO3:** candidato mantiene acción de postular por slug; visitante conserva
  acceso y registro. Empresa/admin acceden a su propio panel, sin CTA candidata ni
  registro redundante. Visibilidad no sustituye autorización servidor/SQL.
- **PO4:** filtros GET, orden, límites, fechas, slugs y consultas públicas actuales
  permanecen intactos; vacío, filtros inválidos, errores y oferta no disponible
  conservan respuestas. No modificar Home, paneles, cursos o reglas de sesión.
- **PO5:** teclado, foco, contraste, móvil320/390 y escritorio1440/1920, textos
  largos y barra fija sin tapar encabezados o acciones. Sin scroll horizontal.

Clarificación resuelta por repositorio: reutilizar HomeNavbar y tokens existentes,
sin nueva navegación global o decisión de privacidad. Permisos/reglas no cambian.

## EXTRA109 — Gestión administrativa, 29/10/2026

Pedido autorizado de Mateo, dentro de la intermediación y permisos existentes.
Historia prioritaria: la Oficina revisa una oferta, consulta a su empresa y opera
sus cuentas sin perder historial ni dejar el sistema sin administradores.

- **AD1:** Para una oferta pendiente de revisión, «Decisión» ofrece exactamente
  Aprobar, Rechazar y Solicitar correcciones. Aprobar conserva su publicación;
  rechazo/correcciones conservan mensajes/motivos requeridos. Las acciones de
  ciclo de vida disponibles en otros estados mantienen las reglas actuales.
- **AD2:** Desde el detalle de oferta hay un enlace al perfil administrativo de
  su empresa. Ese perfil muestra razón social, CUIT, responsable, email, teléfono,
  actividad y localidad registrados, o «Sin informar»; solo administrador activo,
  sin dar permisos nuevos a otros roles o editar el perfil en nombre de la empresa.
- **AD3:** El historial muestra cinco eventos más recientes inicialmente y cinco
  adicionales por «Mostrar más». El botón desaparece al agotarse; conserva foco,
  anuncio, fecha, actor y detalle municipal. No se elimina auditoría.
- **AD4:** No se permite autosuspender ni archivar administradores. Ninguna
  operación autorizada del portal puede dejar cero administradores activos,
  incluso con decisiones concurrentes. Rechazos no producen cambios ni auditoría
  de éxito. Se conservan las cuentas individuales y el flujo de recuperación.
- **AD5:** Retirar «Plantillas para el personal» y su generador de mensajes.
  Mantener registro e historial de contactos, notas y preentrevistas. FR057 queda
  fuera del alcance vigente por pedido explícito, sin envío automático nuevo.
- **AD6:** Ofertas administrativas generales y de la ficha empresarial se
  consultan en páginas de diez, con conteo y orden estable en servidor. Conservar
  filtros, excluir borradores según reglas actuales y no truncar a cincuenta.
  Parámetros inválidos no amplían consultas; página fuera de rango ofrece regreso
  a la primera página conservando filtros y empresa.
- **AD7:** Reactivar empresa/cuenta candidata usa botón verde; suspensión y
  archivo conservan rojo. Motivo, confirmación, validación, feedback, versiones
  y efectos existentes siguen intactos. No se recuperan accesos revocados.

Clarificaciones resueltas por evidencia: AD1 corresponde a la revisión pendiente;
AD3/AD4 y paginación general ya están implementados y requieren verificación, no
otra regla. AD6 incluye la lista de ofertas dentro de empresa actualmente sin
páginas. Sin cambio de modelo o arquitectura ni migración prevista.

## EXTRA106/108 — CTA de ofertas públicas, 29/10/2026

> Preserved local branch wording; historical wherever superseded by EXTRA-120 above. Compatible requirements remain effective.

EXTRA-113, revisión explícita de Maxi 31/10/2026: también se retiran del detalle
las tarjetas "Tu próxima oportunidad" y "Con acompañamiento municipal". El botón
"Postularme con mi cuenta" aparece después de toda la información, conservando
su destino. El detalle usa HomeNavbar, lienzo blanco con exterior verde y estilos
compartidos, más breadcrumbs shadcn Inicio / Ofertas / título actual. Esto
sustituye las referencias anteriores a conservar la tarjeta/header del detalle;
no cambia datos públicos, elegibilidad, postulación ni permisos.

> **Historical presentation wording:** any conflicting Hero, aside, CTA, width or navigation-target clause in this preserved paragraph is superseded by the current EXTRA-120 contract above; unrelated privacy and business restrictions remain unchanged.

Revisión EXTRA-112 autorizada por Maxi, 31/10/2026: en el catálogo /ofertas se
eliminan las dos tarjetas laterales y el acceso duplicado al perfil del header.
La navbar conserva «Mi cuenta» y su destino verificado; «Inicio» sigue disponible
para visitantes. La composición anterior del párrafo siguiente queda como
antecedente, no como requisito vigente del catálogo. El detalle no cambia.
La paginación muestra todos los números usando el componente compartido shadcn,
con filtros preservados y página actual identificada. Los rubros muestran íconos
decorativos semánticos junto a su texto; las opciones nativas mantienen texto.

Mateo conserva únicamente el ajuste de /ofertas y descarta los cambios de inicio/
login. Con sesión activa verificada de candidato, empresa o administración,
la tarjeta lateral de ofertas muestra acceso al panel correspondiente, sin
«Crear cuenta» ni «Iniciá sesión». Sin sesión conserva esos enlaces y sus destinos.
No cambia el inicio, registro, recuperación, autorización ni las reglas de sesión.

## EXTRA102 — Fechas y nueva postulación,2026-10-29

Corrección EXTRA105 solicitada29/10 sustituye104: conservar exactamente el selector
original de Registrar contacto municipal, datetime-local con calendario y edición
nativos. Mateo elige conservarlo tras conocer que el orden visible depende de la
región del navegador. No entrada libre ni calendario de aplicación. Mantener
validación/foco/retención, occurredAtLocal ISO y conversión Funes/servidor actuales;
declarar idioma español sin garantizar que fuerce orden en todos los navegadores.

Pedido explícito de Mateo; reemplaza la prohibición de segundo caso únicamente
para postulación propia cuando todos los casos anteriores no archivados están
retirados. No modifica las reglas de nominación/matching administrativos.

- **R1:** Fechas mostradas en portal, PDF y Excel: DD/MM/YYYY con año de cuatro
  dígitos; conservar hora donde ya existe, con zona America/Buenos_Aires. Una
  fecha calendario mantiene su día. Datos ISO y CSV técnico se conservan. Los
  selectores actuales se conservan, incluido el contacto municipal según EXTRA105.
- **R2:** Titular puede enviar una nueva postulación tras retirar una anterior,
  si oferta/perfil/consentimiento/disponibilidad/CV siguen habilitados. Crear
  otro caso recibido, con selección de CV independiente y auditoría/avisos normales.
  Conservar el anterior retirado, documentos, eventos y accesos revocados. No
  reactivar permisos ni reabrir casos; no permitir duplicados concurrentes o si
  existe cualquier caso no archivado en otro estado, incluidos finales.
- **R3:** Participaciones Retirada y Cancelada usan indicador rojo con texto
  español existente; los demás estados y dominios conservan su presentación.

Aceptación: postular→retirar→postular genera dos casos; segundo envío duplicado
rechazado; nuevo retiro permite otro intento; fallo de auditoría revierte alta y
promoción de CV. Caso referido retirado mantiene permiso revocado. Otros casos y
resultados no se alteran. Fecha de calendario/instante/padding/hora y todos los
roles/descargas se verifican. El retiro municipal a pedido no amplía nominaciones.


## EXTRA099 — Avisos navegables por perfil,2026-10-28

Pedido explícito de Mateo. Avisos privados dentro del portal, con pendientes/leídos
por cuenta y enlaces al recurso indicado. No introduce correo ni mensajería externa.

### Matriz solicitada

| Destinatario | Hecho que genera el aviso | Destino esperado |
| --- | --- | --- |
| Candidato titular | La Oficina lo nomina/incorpora a una oferta | Su participación en esa oferta |
| Candidato titular | Administración registra una preentrevista real | Su participación y aviso de preentrevista |
| Candidato titular | La Oficina confirma una derivación a la empresa | Su participación |
| Candidato titular | La Oficina confirma contratación o no selección, normal o tardía | Su participación y resultado vigente |
| Empresa titular | La Oficina deriva a un candidato a una oferta propia | Oferta y derivación propia |
| Empresa titular | La Oficina aprueba/publica o rechaza su oferta enviada a revisión | Oferta propia y moderación visible |
| Cada administrador | Una oferta se envía o vuelve a revisión | Oferta y decisión municipal |
| Cada administrador | Un candidato se postula a una oferta | Participación administrativa |
| Cada administrador | Una empresa informa contratación o no selección | Participación y respuesta pendiente de revisión |
| Cada administrador | Se completa el registro del perfil empresarial | Perfil administrativo de esa empresa |

N1: cada aviso pertenece a una cuenta; leerlo no lo marca leído para otros
administradores. No mezclar cuentas ni permitir lectura/escritura ajena por ID.
N2: candidato recibe resultados únicamente tras confirmación municipal. Informes
de empresa pendientes notifican a administración, sin adelantar un resultado final.
N3: el aviso de nominación/preentrevista/derivación amplía puntualmente FR-053 por
pedido expreso. No publica preselección, recomendaciones, notas, motivos internos,
DNI, CUIT, contactos o CV ni habilita a empresas a navegar el padrón.
N4: pulsar un aviso lleva al caso/oferta/perfil correspondiente, con autorización
vigente y URL opaca. Un aviso no revive permisos revocados ni evita suspensión.
Recurso ya inaccesible debe tener respuesta clara sin revelar información ajena.
N5: avisos de hechos futuros confirmados, sin backfill de auditoría. Un error o
rollback del negocio no deja avisos falsos; reintentos no duplican el mismo hecho.
N6: contador de pendientes, listado cronológico, lectura al abrir y acceso a más
avisos; español, teclado/móvil, vacío/cargando/error claros. Fallo de carga no debe
presentarse como cero notificaciones. Perfiles asistidos sin cuenta no reciben
avisos personales hasta tener una cuenta; no convertirlos en mensajes externos.

### Clarificaciones resueltas por Mateo,2026-10-28

- Se omite por ahora el aviso de entrevista empresarial; no cambiar su formulario.
  La pregunta inicial lo describía como retirado, pero company-referral-panel.tsx
  actual sí renderiza InterviewForm. Se conserva esa implementación sin cambios;
  la respuesta autoriza omitir el aviso, no retirar el flujo existente.
- El candidato puede consultar fecha programada/realizada y canal de una
  preentrevista registrada. Resumen, recomendación y evaluaciones siguen privados.

Aceptación: un hecho genera solo los destinatarios de la
matriz; cuatro admins leen independientemente; enlaces llevan al recurso correcto;
usuarios ajenos/suspendidos no reciben contenido; rollback/reintento no produce
avisos falsos/duplicados; modificación de disponibilidad y consentimiento no cambia.

## EXTRA096 — CV por postulación y formatos de entrada2026-10-28

Mateo confirma CV general o específico sin reemplazar general,5 MiB; corrige
WebP no. Este incremento sustituye la restricción de entrada exclusivamente PDF,
no las reglas de privacidad, activación, consentimiento o contratación.

- C1: cargas de CV propio/asistido/postulación aceptan PDF, JPG/JPEG y PNG hasta
  5 MiB por archivo. Rechazar WebP, video, SVG, GIF/animación, formato falso,
  vacío/dañado o excesivo. Imágenes convertidas a PDF para visor protegido; entrada
  y documento final respetan límite. Un rechazo no reemplaza ningún CV vigente.
- C2: candidato apto elige CV general actual o carga opcional de uno específico
  al postular. Se fija un documento para esa postulación, sin reemplazar general
  ni afectar otras ofertas; el CV elegido no se cambia después de enviar.
- C3: Oficina ve ese CV en el caso y comparte exactamente ese documento al derivar.
  Reemplazar general después no cambia selección anterior. Nominaciones y casos
  legados sin selección conservan CV vigente al derivar; sin backfill de historia.
- C4: titular/administración ven documento; empresa únicamente tras derivación
  propia con permiso vigente. Archivo/retirada/suspensión/vencimiento conservan
  efectos, sin restaurar permisos. No acceder a CV específicos de otras ofertas.
- C5: upload fallido o estado/versión inválidos no crean participación ni documento
  válido asociado parcialmente. Alta/documento/auditoría transaccionales. No cambiar
  obligatoriedad del CV general para activar/postular, duplicados o matching.
- C6: interfaz española aclara opción y formatos/límite; conservar selección y
  demás datos al rechazar, mensaje de resultado incierto ante red fallida; nueva
  pestaña/URL opaca/scroll/foco/accesibilidad y pantalla móvil preservados.

Clarificaciones: opción y5 MiB confirmados por Mateo; WebP excluido por corrección
posterior expresa. Un archivo por carga; sin edición posterior de CV de un caso,
constructor de CV, importación de archivos, retención nueva o despliegue automático.

Aceptación: aplicar a dos ofertas con documentos distintos conserva general y
ambos archivos; cambiar general mantiene selecciones; empresa recibe solo el CV
del caso derivado y pierde acceso ante revocación. Probar PDF/JPG/PNG reales y
rechazos/WebP/animación/5 MiB, errores de Storage/DB/auditoría, roles, versiones,
legado y capacidad de consultar documento propio sin filtrar etapas internas.

## EXTRA094 — Ajuste autorizado2026-10-28 (precedencia sobre EXTRA035)

Mateo confirma este cambio de alcance; no ratifica política municipal de datos reales.

- R1: todos los enlaces de CV abren PDF autorizado en pestaña nueva; respuesta
  inline, sin descarga forzada. Conservar autorización por solicitud, privacidad,
  versiones y URL opaca; sin CV vigente o sin acceso siguen mensajes actuales.
- R2 (S2/L36, EXTRA102): métricas y paneo inicial de `/admin` comparten gráficos
  visibles de barras y dona, sin las seis tarjetas resumen ni esconder el reemplazo
  bajo Ver detalle. Conservar candidatos activos, empresas activas, ofertas publicadas,
  participaciones, derivaciones, contrataciones confirmadas y todos los demás
  indicadores. La dona usa estados de oferta mutuamente excluyentes, nunca categorías
  superpuestas. Valores textuales, español, móvil y acceso sin depender solo del color.
  PDF/Excel/CSV conservan datos completos y filtros; definiciones bajo Más información,
  sin cambiar cálculo ni presentar una foto de estado como tendencia histórica.
- R3: contratar normal o tardíamente cambia disponibilidad a unavailable y un
  perfil active a unavailable, atómicamente con el resultado y auditoría de actor/
  fecha/causa. Conserva consentimiento y todos sus eventos; no altera estados ni
  resultados de otras participaciones o permisos de otras derivaciones. No aparece
  en matching ni admite nuevas derivaciones mientras siga No disponible.
- R4: consentimiento general aceptado no vuelve a solicitarse por contratación,
  navegación o actualización. Mostrar estado aceptado en lugar de checkbox/botón.
  Ausencia o retiro exige acción afirmativa vigente; no reaceptar automáticamente.
  Retiro manual conserva revocación global y cierre de casos abiertos. Datos
  anteriores no se reconsienten ni recuperan por migración o corrección de resultado.
  Los controles operativos viven en Cuenta > Privacidad, fuera de Perfil, con retiro
  manual explícito; aceptación de términos en registro no concede ese consentimiento.
- R5: contratación normal conserva permiso previamente activo de la derivación
  contratada hasta confirmación +720h, sujeto a demás guardas/revocaciones. Al
  alcanzar el límite se deniega lectura aunque Cron aún no materialice revoked.
  Contratación tardía no revive acceso revocado. Otras derivaciones conservan sus
  reglas/vencimientos. Este cambio no autoriza empresa a explorar el padrón.

### Clarifications2026-10-28

- Consentimiento una vez: Mateo elige conservarlo y pasar a No disponible, en
  reemplazo del retiro global por contratación de EXTRA035; retiro manual intacto.
- Métricas (histórico, sustituido en presentación por S2/L36 de 2026-10-29):
  confirma resumen de seis, dos gráficos y detalle desplegable, exportaciones
  completas; no eliminar indicadores históricos o del contrato. La decisión posterior
  de Maxi exige gráficos visibles en lugar de las tarjetas; cálculos/exports intactos.
- Acceso tras contratar: confirma perfil/contactos/foto/CV30 días, sin restaurar
  permisos revocados (la opción elegida conserva, no concede otro acceso).

Aceptación: abrir CV desde cuatro contextos mantiene página origen y devuelve PDF
inline solo a actor autorizado; gráficos visibles en paneo y métricas reflejan
exactamente los filtros, cero/null distinguibles y equivalentes textuales accesibles;
sin seis tarjetas ni reemplazo gráfico oculto bajo Ver detalle; hire/late_hire preservan
último consentimiento y otros casos, auditan disponibilidad y rechazan referencia/
versión/actor indebidos; error de auditoría revierte toda la transacción. No hay
backfill ni aceptación/activación/restauración automática. Artefactos anteriores
describen comportamiento histórico donde se contradigan con este incremento.

## EXTRA085 — Portal,2026-10-27

- P1: EXTRA088: Home muestra hasta10 ofertas públicas vigentes, ordenadas por
  publicación DESC/ID DESC antes de limitar en servidor. Carrusel circular: última/
  penúltima a izquierda de primera, primera/segunda a derecha de última; flechas
  atraviesan ambos extremos. Conservar diseño3D/móvil, enlaces y vacío/error/
  elegibilidad actuales, sin duplicar registros para llenar huecos con pocos datos.
  EXTRA087 sustituye EXTRA086: avanzar automáticamente cada3s, volver a la primera
  al terminar y conservar solo flechas, sin botón Pausar/Reanudar. Hover/foco
  pausan mientras dura la interacción y luego vuelve automáticamente; respetar
  reduced-motion y pestaña oculta. No modificar orden ni elegibilidad.
- P2: administración descarga PDF y Excel .xlsx reales del período/categoría
  filtrados, foto as_of, indicadores españoles y datos autorizados actuales.
  Conservar permisos/auditoría, precisión/cero/null pendiente y referencias opacas;
  sin PII nueva o contenido activo. CSV compatible; no informe oficial/OQ005.
- P3: preview Ver perfil y nominar bloquea solo scroll del documento de fondo,
  conserva posición y scroll interior móvil. Cerrar/Escape/éxito/desmontaje
  restablecen scroll y foco; no cambia nominación ni autorización.
- P4: composición de filtros y consulta en servidor con GET/URL como fuente de
  estado; islas cliente necesarias para combobox/validación/foco. Filtrar/contar/
  paginar con validación y permisos servidor. Reiniciar página al cambiar filtro,
  mantener selección múltiple OR/refs opacas/localidad opcional/defaults/asistidos.

Mateo confirma explícitamente ambas descargas y bloqueo de fondo con scroll
interno permitido. No se cambia retención, reglas municipales o criterios de matching.

## Authorized public metrics increment — EXTRA-079

On 2026-10-25 Maxi requested replacing Home's “Cada perfil entra por el camino
correcto” section with real counts, and approved counting candidate/company
profiles that are not archived (including assisted, incomplete and suspended
profiles) plus currently public eligible job openings. Only the three aggregate
totals are public; existing personal-data and administrator-metric protections
remain unchanged. Count openings independently of vacancies and pagination.
Show unavailable rather than fabricated zero when the data cannot be read.
Maxi also authorized six explicitly fictitious offers in the existing hosted demo
through the current Supabase CLI session, without deleting/replacing data, and
approved the additive aggregate function there. This does not authorize an
application publication, account replacement or municipal production changes.

## Authorized profile increment — EXTRA-059

**Canvas revision, 2026-10-25 (EXTRA-071):** Maxi approved increasing the shared
candidate/company/administrator canvas maximum to 1280px, preserving flexible
width, centering, desktop/mobile gutters and existing content. This supersedes
the original 960px dimension below, not the profile functionality or privacy scope.

The requesting developer authorized rebuilding Perfil inside its existing 960px canvas and persisted candidate-photo upload/change/removal. Previous photo bytes must be physically deleted on replacement/removal; metadata/audit may remain. Access follows full-profile privacy (owner, active Office staff, company only through a live authorized referral); photos are optional for profile activation. Preserve all existing profile fields, phone/CV transports, consent text and effects, roles and intermediary policy. Company logos, new legal wording, unrelated page redesign and remote deployment are excluded. Full acceptance checks and user strings: `../../odd/tasks/candidate-profile-rebuild.md`; design/recovery: `../../docs/implementation/candidate-profile-photos.md`. Implementation/review status is tracked separately, not automatically accepted.

**Feature Branch**: `spec/municipal-employment-portal-mvp`

**Created**: 2026-09-19

**Status**: Approved

**Routing amendment authorized by Maxi, 2026-10-23 (EXTRA-056):**
«Está bien, haz eso eliminar las tres rutas de candidato, actualizar todos sus enlaces y destinos al panel, y dejar que las URLs anteriores den 404 y lo mismo con /login».
Candidate profile, offers and participations use `/dashboard?section=perfil`,
`/dashboard?section=ofertas` and `/dashboard?section=postulaciones`. Retired
`/candidato/perfil`, `/candidato/ofertas`, `/candidato/postulaciones` and `/login`
return HTTP 404 without redirects, including query variants. Login is at `/`.
Existing content, validation, role guards, CV feedback and selected-offer queries
are preserved. Public `/ofertas` and other-role `/account` behavior remain intact.

**Approval record**: Máximo approved the current scope and business rules on 2026-10-17.
This approval does not establish final product acceptance, close open questions or pending
validation tasks, or constitute municipal approval.

**Ajuste acotado autorizado, 2026-10-17**: Mateo solicita comenzar los arreglos
funcionales registrados en [la matriz](../../docs/implementation/functional-adjustments.md).
El primer incremento A01 exige confirmar la contraseña en ambos autorregistros
y permite mostrar/ocultar cada contraseña en registro, ingreso y actualización.
El servidor rechaza contraseñas ausentes o distintas antes de llamar a Auth;
la confirmación no se persiste ni se envía al proveedor. Se conservan los límites
vigentes de 6 a 128 caracteres y las respuestas que no revelan cuentas existentes.
Esta autorización es específica del incremento y no ratifica retroactivamente
el estado global Draft ni acredita revisión del segundo desarrollador.

**Input**: User description: "Crear una única especificación integral para el MVP del Portal
Municipal de Empleo de Funes, manteniendo a la Oficina de Empleo como intermediaria y cubriendo
los flujos completos de candidatos, empresas y administradores."

**Continuación autorizada, A02/A03, 2026-10-17**: después del merge del PR #52,
Mateo solicita implementar persistencia de sesión y acceso al perfil. Navegar,
recargar y renovar tokens conserva una sesión válida; suspensión, archivo,
revocación y cambio de contraseña conservan sus efectos de seguridad. Los headers
de inicio y ofertas públicas reemplazan Iniciar sesión por Mi perfil de candidato
o empresa activa, o Mi cuenta de administrador activo, sin exponer datos personales.
Login/logout actualizan esos accesos sin compartir la respuesta entre usuarios.
Aceptación y límites: A02/A03 en la matriz; sin aprobar retrospectivamente el Draft.

## Ajuste de acceso y navegación autorizado — 2026-10-22

Máximo solicita trasladar “Oficina de Empleo” / “Municipalidad de Funes” y el
emblema del hero a la navbar en escritorio, conservando el enlace al sitio oficial
de Funes y la visibilidad inicial actual. La navbar ofrece Ingresar hacia el
recuadro existente o Mi cuenta hacia el panel correspondiente si hay sesión activa.
El hero conserva el contenido restante y el fondo animado.

> Preserved local branch wording; historical wherever superseded by EXTRA-120 above. Compatible requirements remain effective.

Con sesión activa verificada, el modo Iniciar sesión muestra “Ya tenés la sesión
iniciada” sin otro formulario de login. El servidor impide otro inicio de sesión
antes de autenticar credenciales nuevas. La solicitud de Máximo del 2026-10-27
reemplaza la disponibilidad anterior de autorregistro con sesión: Home oculta
el registro y sus accesos cuando hay una sesión activa verificada, incluso ante
selectores de URL o eventos de registro. Sin sesión, ambos autorregistros mantienen
sus reglas de confirmación existentes. Los campos vacíos de estos formularios
de portada mantienen las líneas rojas y el resumen “Revisá los x campos indicados.”,
sin repetir “Completá este campo.”. Se conservan errores útiles de formato,
confirmación y servidor, validaciones y semántica accesible. Trazabilidad EXTRA-052.

**Refinamiento autorizado de portada, 2026-10-23:** Máximo solicita retirar Mi
perfil del cuadrante izquierdo y colocar “Ir al panel de usuario” debajo de
“Ya tenés la sesión iniciada”. El destino usa el panel vigente por rol y conserva
la entrada de navegación accesible dentro del recuadro; ofertas y detalle no
cambian. Ver ofertas disponibles se desplaza suavemente al cuadrante izquierdo
al seleccionar Registrarse → Empresa y vuelve al salir de ese modo, sin movimiento
horizontal móvil ni animación con movimiento reducido. Trazabilidad EXTRA-053.

> Preserved main branch wording; historical wherever superseded by EXTRA-120 above. Compatible requirements remain effective.

> **Historical presentation wording:** any conflicting Hero, aside, CTA, width or navigation-target clause in this preserved paragraph is superseded by the current EXTRA-120 contract above; unrelated privacy and business restrictions remain unchanged.

El componente de acceso reutilizable, si se monta con sesión activa verificada,
muestra “Tu sesión está activa. Continuá desde
tu panel.” en gris, sin el contenedor de pestañas de acceso ni otro formulario de
login (refinamiento solicitado por Máximo el 2026-10-31, EXTRA-112 de PR89).
EXTRA118 sustituye su montaje en Home autenticada por la sección de ofertas.
El servidor impide otro inicio de sesión
antes de autenticar credenciales nuevas. La solicitud de Máximo del 2026-10-27
reemplaza la disponibilidad anterior de autorregistro con sesión: Home oculta
el registro y sus accesos cuando hay una sesión activa verificada, incluso ante
selectores de URL o eventos de registro. Sin sesión, ambos autorregistros mantienen
sus reglas de confirmación existentes. Los campos vacíos de estos formularios
de portada mantienen las líneas rojas y el resumen “Revisá los x campos indicados.”,
sin repetir “Completá este campo.”. Se conservan errores útiles de formato,
confirmación y servidor, validaciones y semántica accesible. Trazabilidad EXTRA-052.

**Refinamiento autorizado de portada, 2026-10-23:** Máximo solicita retirar Mi
perfil del cuadrante izquierdo y colocar “Ir al panel de usuario” debajo del
mensaje de sesión activa (texto actualizado en EXTRA-112). El destino usa el panel vigente por rol y conserva
la entrada de navegación accesible dentro del recuadro; ofertas y detalle no
cambian. Ver ofertas disponibles se desplaza suavemente al cuadrante izquierdo
al seleccionar Registrarse → Empresa y vuelve al salir de ese modo, sin movimiento
horizontal móvil ni animación con movimiento reducido. Trazabilidad EXTRA-053.

## Incremento A08 autorizado — 2026-10-19

Mateo solicita implementar el catálogo amplio de quince rubros registrado en la
matriz, cuya aprobación municipal fue informada por él. Categorías laborales
del candidato y categorías de ofertas son multiselección (EXTRA057 unificó las
dos selecciones anteriores del candidato). Desde una
oferta publicada o pausada y vigente de una empresa activa, solo administración
puede consultar candidatos aptos para derivación con al menos un rubro activo
compartido (OR, no todos). Mostrar rubros coincidentes, sin puntaje, y paginar
después de filtrar/contar y del orden global. El RPC legado conserva nombre/ID;
EXTRA073 permite en esta vista ordenar por última actualización. No duplicar candidatos por
múltiples coincidencias. No crear nominaciones ni derivaciones al consultar.

Ampliación solicitada por Mateo el 2026-10-19: excluir antes del total/paginación
cualquier participación no archivada en la oferta (incluye nominación/postulación
previa, cualquiera sea su estado); sus casos siguen en Participaciones. La revisión
posterior S27 de `odd/tasks/portal-polish.md` sustituye las fichas compactas en dos
columnas por una Data Table de candidatos con rubros coincidentes; conserva doce
resultados por página, orden global, perfil modal y nominación explícita. El bloque de
candidatos se ubica debajo de la información/moderación e historial de la oferta,
conservando todo el ancho (ajuste solicitado por Mateo el 2026-10-19). Abrir el perfil
laboral en diálogo accesible sin abandonar la oferta y nominar explícitamente a
esa misma oferta desde allí, sin selector de otra búsqueda. Preview autorizado
bajo demanda, con rubros, experiencia, localidad, disponibilidad, vigencia y enlace
al CV actual, sin DNI, contactos ni notas. Mostrar la oferta destino; conservar
versiones de candidato/oferta y revalidación transaccional del comando existente.
Éxito cierra diálogo, retira la ficha y actualiza total/página sin redirigir.
Conflicto/error no crea otra participación y permite recargar el perfil. Cerrar
con botón o Escape devuelve foco; no mostrar datos de una respuesta tardía tras
cerrar/cambiar de candidato. Nominación nunca equivale a derivación empresarial.

Aptitud: perfil activo, disponible, no archivado, vigente, cuenta activa si está
vinculada, último consentimiento aceptado y CV válido no archivado. La consulta
no altera estados ni sustituye la revalidación transaccional de las mutaciones.
El catálogo v2 se incorpora sin borrar/desactivar categorías previas ni reasignar
personas u ofertas. No inferir equivalencias; importación sintética v1 sin cambios.
OQ-010 solo se resuelve para el catálogo amplio aprobado, no para equivalencias
históricas o un catálogo exhaustivo de ocupaciones; OQ-018 permanece abierta.

### Oferta administrativa y orden de coincidencias — EXTRA073,2026-10-25

- R1: en escritorio, Decisión municipal aparece a la derecha de Oferta y empresa;
  Historial de moderación permanece en esa columna debajo de la decisión. En
  móvil se apilan información, decisión e historial, antes del matching completo.
- R2: Ver participaciones de esta oferta se presenta como acción primaria visible,
  de altura mínima44px y foco visible con los tokens compartidos; conserva
  semántica de enlace y filtro a esa oferta mediante referencia opaca.
- R3: solo Candidatos con rubros coincidentes ofrece Más recientes primero y Más
  antiguos primero, según última actualización persistida del perfil. No es edad
  ni fecha de creación; predeterminado recientes. No cambia el listado general.
- R4: ordenar todo el conjunto elegible antes de paginar; empates por nombre/ID,
  total independiente del orden. Cambiar orden reinicia página1, enlaces de
  paginación y regreso lo conservan. Valores desconocidos o repetidos se rechazan.
- R5: conservar aptitud, exclusión de participaciones, permisos, popup/nominación,
  moderación, auditoría y respuesta mínima. No expone fechas ni datos privados
  nuevos ni crea o cambia registros al consultar.
- R6 (ampliación posterior): Historial de moderación muestra inicialmente hasta
  cinco eventos; solo si quedan otros ofrece Mostrar más y revela cinco por
  interacción hasta agotar el historial, conservando orden, foco y eventos.

Clarificación de Mateo: «En los candidatos coincidentes dentro de cada oferta»;
«Última actualización del perfil». Se usa el reloj existente del registro, que
incluye cambios de datos/estado, CV, foto y notas que actualizan el perfil.

### Compatibilidad de preview,2026-10-25 (EXTRA068)

Las categorías laborales del popup se presentan como código/nombre. El tipo
interno histórico de la relación no es requisito de lectura ni campo visible;
su presencia en respuestas legadas no impide abrir el perfil. No reintroduce
Intereses, no cambia aptitud/matching/nominación y no reemplaza la consolidación
segura de datos prevista en EXTRA057.

## Perfil candidato — presentación autorizada 2026-10-22 (EXTRA040)

EXTRA071,2026-10-25: el DNI en el formulario de perfil propio y el CUIT en el
perfil propio de empresa permanecen ocultos inicialmente y ofrecen un botón
Mostrar/Ocultar. Alternar conserva edición/validación y no envía el formulario.
Solo presentación de datos ya autorizados: no agrega acceso a datos de terceros,
administración, registros públicos o formularios presenciales.

La primera tarjeta del perfil presenta estado y vigencia. Si el estado guardado
es active muestra Perfil activo y nunca el botón de activación. En draft,
needs_update, unavailable o consent_withdrawn, Activar perfil solo aparece si los
datos guardados satisfacen las reglas actuales de activación: localidad/resumen,
una categoría, disponibilidad available, consentimiento accepted y CV válido.
En caso contrario explica qué completar/guardar; archived u otro estado no
ofrecen activación. Servidor y DB siguen revalidando sin cambios. No confundir
estado active con elegibilidad para una derivación concreta.

Historial de presentación EXTRA040/041/072: los párrafos siguientes conservan
la disposición y copia anteriores, no el contrato vigente. Desde S12/S18 y EXTRA102,
Cuenta > Privacidad reemplaza ese bloque de Perfil y aplica EXTRA094: conserva
consentimiento al contratar, No disponible y permiso propio autorizado hasta30 días,
sin revivir revocados. Aceptado muestra estado y retiro explícito, no otra aceptación;
ausencia/retiro permite confirmación afirmativa. Términos legales viven en registro.

Consentimiento explica el uso laboral por la Oficina y la entrega de perfil,
contactos y CV únicamente tras derivación municipal a una empresa, sin DNI,
domicilio o notas internas. Explicita que una contratación normal o tardía
confirmada retira el consentimiento global vigente y revoca todos los accesos
empresariales dependientes, conservando otras participaciones, resultados e
historial. Nueva aceptación siempre afirmativa, sin revivir accesos anteriores.
El retiro manual conserva sus efectos actuales. Es explicación de reglas
vigentes, no reemplazo de policy_text/version/hash ni aprobación municipal de
la política demo; OQ-001/002 permanecen abiertas. Sin cambios de lógica o schema.

### Reorganización solicitada 2026-10-22 (EXTRA041)

Teléfono opcional pasa a la misma tarjeta de Datos laborales y personales,
sin tarjeta Contacto adicional. Mantiene guardado explícito independiente y las
reglas actuales, sin prometer una transacción conjunta con los demás campos.
La carga de CV se coloca antes del consentimiento en el orden real de lectura.
EXTRA072,2026-10-25 sustituye la presentación de política de EXTRA041: se
retiran su texto/versión/aviso de esta vista. Consentimiento de prueba muestra
los dos párrafos aportados por Mateo sobre autorización general y retiro al
contratar. Más información, cerrado inicialmente y accesible por teclado,
contiene los otros cuatro sobre datos compartidos, nombre retenido, nueva
aceptación y retiro manual. Copia literal solicitada en CandidateProfilePanel;
no cambia política técnica, versión/hash, aceptación o reglas de negocio ni
implica aprobación municipal. Atención presencial queda fuera del cambio.

## Atención presencial integrada, solicitud2026-10-24 (EXTRA059)

### Identificación en derivaciones — EXTRA069,2026-10-25

Mateo confirma que la empresa conserve únicamente el nombre de presentación de
la persona en sus derivaciones propias aunque termine el permiso por retiro del
consentimiento, falta de respuesta u otro cierre. Nombre visible en listado y
encabezado del detalle/informe; no habilita perfil laboral, contactos, foto o CV
revocados. Cuenta y empresa activas; oferta, caso y derivación no archivados.
No expone nombres a empresas ajenas ni de personas sin derivación. Conserva
resultados, consentimiento, auditoría y precondiciones del informe tardío.
El nombre se lee del perfil existente; no crea snapshots o historial de nombres.
Sustituye la prohibición de nombre del stub de FR039 y amplía R1 de EXTRA062.

### Ajustes empresariales confirmados2026-10-24 — EXTRA062

R1 (ampliado por EXTRA069 a toda derivación propia): propia empresa activa conserva solo el nombre de su contratado confirmado
normal/tardío en derivación/oferta/caso no archivados, aun revocado el permiso.
Es una excepción explícita a la ocultación total: no restituye consentimiento,
perfil, CV o contactos, no muestra contratados ajenos y no basta feedback empresarial.
R2: excluir draft antes de contar/paginar en bandeja/filtro de ofertas admin y
listado del detalle empresarial administrativo; no altera rol, métricas/restauración.
R3/R4: oferta empresarial incluye derivaciones y moderación en la misma página;
empresa restaurada con perfil incompleto conserva su oferta, con aviso y sin
consultar derivaciones hasta completar el perfil; no se restablecen accesos.
enlaces previos funcionan. Historia empresa/admin: cinco recientes y Mostrar más por5,
conservando privacidad de mensajes públicos y motivos internos según rol.
R5: editar propia publicada exige campos completos y la devuelve atómicamente a
pending_review, sin publicación hasta aprobación. Mantiene slug, casos, resultados
y permisos existentes; sin nuevas derivaciones en revisión. Draft/correcciones
conservan guardado parcial y envío separado.
La oferta existente abre en consulta; «Editar oferta» abre el formulario solo en
estados editables. Cancelar edición vuelve al detalle; guardar correctamente vuelve
al detalle actualizado. El alta de oferta nueva abre directamente el formulario.
R6: cancelar propia oferta no final exige motivo/confirmación, cierra casos abiertos
y revoca sus accesos, conserva resultados finales/historial y sigue visible Cancelada.

EXTRA061, decisiones explícitas2026-10-24: «Historial de cuenta y perfil» del detalle
administrativo de candidatos muestra solo activación, aceptación/retiro del
consentimiento, disponibilidad, suspensión/reactivación de cuenta, vinculación y
pendiente de actualización. Creación, ediciones comunes, verificación y archivo/
restauración se conservan internamente sin mostrarse en esta tarjeta. Evento y
fecha/hora únicamente, reciente primero, cinco iniciales y Ver más por lotes de
cinco sin tope50. FR-050, auditoría completa y permisos permanecen intactos.
No aplica estas preferencias a los historiales de otros recursos.

El detalle administrativo muestra directamente edición, consentimiento/activación,
carga de CV y vinculación presencial solo para perfiles de origen assisted sin
cuenta vinculada y no archivados. Tras vincular desaparecen estos controles;
consulta de CV, notas, participaciones e historial se conservan. Al vincular,
los controles administrativos son los mismos que en un perfil autogestionado
con igual estado de cuenta, sin borrar el origen o historial. La ruta antigua
de mantenimiento conduce al mismo detalle autorizado. No modifica reglas ni
permisos de los comandos existentes ni reintroduce nominación desde el perfil.

EXTRA070,2026-10-25 (sustituye el orden visual EXTRA060): en el detalle
administrativo de todo candidato, Perfil candidato y después CV PDF del candidato
aparecen antes del formulario y listado de notas internas, en la primera columna.
Mantener perfil, cuando corresponda, sigue primero; participaciones y controles
restantes conservan su columna. El orden de lectura móvil es el mismo.
Se conservan visibilidad, datos y controles aprobados, sin tarjetas duplicadas.

## Categorías laborales únicas, decisión2026-10-24 (EXTRA057)

EXTRA058,2026-10-24: el detalle administrativo de candidato y el mantenimiento
presencial no ofrecen ni anuncian la nominación a una oferta. Esta acción de UI
se conserva en el popup del matching de la oferta. Detalle mantiene CV, notas,
historial, participaciones y enlace Ofertas. Sin cambiar comandos/permisos,
elegibilidad o participaciones existentes y sin deshabilitar la nominación general.

Se elimina el campo independiente Intereses laborales de registro, perfil propio
y asistido, mantenimiento, fichas empresariales y preview municipal. La selección
del candidato es únicamente categorías laborales (multiselección). Los intereses
existentes se consolidan por sus mismos IDs en categorías, sin duplicados y con
historial privado recuperable de origen/fecha; no se descartan datos o se infieren
equivalencias de catálogo. Categorías inactivas permanecen almacenadas sin
reactivarse. No cambian matching OR, criterios de aptitud, consentimiento,
contratación, autorización, orden, paginación o exclusiones existentes.

La unión histórica permite hasta40 selecciones (20+20 anteriores), sin perder
capacidad de editar/guardar. CSV conserva columnas/mapping. Nuevos comandos no
guardan intereses; clientes anteriores solo pueden enviar el array legado vacío,
y se rechaza expresamente un array no vacío. Resolver duplicados conserva los
campos no autorizados y nunca reactiva ni acepta consentimientos por este cambio.
Aceptación: ausencia del campo en todos los roles; conservación de la unión y
origen históricos; paridad de resultados/paginación antes/después; persistencia
de categorías por autoservicio, administración e importación; seguridad y rollback.
Sustituye las menciones funcionales anteriores de ocupaciones/intereses como dos
selecciones. No elimina el concepto de interés de una persona por una oferta.

## Alta presencial activa, decisión2026-10-24 (EXTRA056)

El alta presencial interactiva exige datos completos de activación (nombre/DNI,
contacto, localidad, experiencia, disponible y categorías laborales) y aceptación
presencial expresa registrada por el administrador sobre la política vigente.
Crear, aceptar y activar ocurren atómicamente; no requiere PDF para evaluación
interna, pero sí para derivar. No hay alta interactiva incompleta o aceptación
por defecto. Duplicados/rechazo no aceptan consentimiento; usar/actualizar un
existente conserva su estado y consentimiento sin reactivarlos. Importación y
mantenimiento conservan sus reglas. No se activa retroactivamente ningún perfil.
Contratación normal/tardía aplica EXTRA094: consentimiento conservado, disponibilidad
unavailable y perfil active a unavailable, otros casos intactos. Permiso propio
previamente activo/autorizado hasta720h; revocados nunca reviven ni hay reaceptación
implícita. La regla EXTRA035 previa queda documentada en la clarificación histórica.

## Apartado de atención presencial, solicitud2026-10-23 (EXTRA055)

El menú administrativo incluye «Atención presencial», con listado exclusivo de
perfiles cuyo origen persistido es assisted y acceso al detalle existente. Incluye
por defecto estados no aptos/borrador y perfiles que vincularon cuenta, sin
alterar elegibilidad ni origen. El mismo apartado muestra el formulario existente
para crear perfiles arriba y el listado con sus filtros debajo; no exige salir
a otra pantalla para comenzar el alta. Filtros/paginación conservan el ámbito;
las rutas de alta y mantenimiento existentes continúan disponibles. No duplica perfiles ni cambia
autorización, historial o reglas de claim. Los archivados abren el detalle de
consulta vigente sin habilitar mantenimiento nuevo.

## CV vigente administrativo, solicitud2026-10-23 (EXTRA054)

La ficha administrativa del candidato muestra el CV válido no archivado y una
descarga protegida por referencia opaca, en lugar del formulario de carga. Sin
CV vigente presenta un mensaje claro y no ofrece descarga. El mantenimiento
presencial conserva la carga/reemplazo autorizada de FR-013 y sus validaciones;
no se cambia el autoservicio ni permisos, versiones históricas o retención.

## A16 — Retirar enlace global de salto, solicitud2026-10-23 (EXTRA053)

Eliminar «Ir al contenido principal» del layout raíz en todas las rutas, sin
sustituirlo por otro control oculto. Conservar los landmarks main/nav, títulos,
destino main#contenido y foco visible/operabilidad de los controles existentes.
El enlace Inicio de portada conserva su retorno y foco en main; no se considera
equivalente universal de un skip link. FR-070 y SC-009 permanecen vigentes.

## A04 — UUID fuera de la interfaz, solicitud2026-10-23 (EXTRA052)

Textos, enlaces y URLs generados por el portal para cualquier rol no muestran UUID
de negocio. Conservar slugs públicos; usar nombres o códigos aleatorios estables
en registros privados, incluidos CV, filtros e importaciones. Identidades internas,
permisos, historia y comandos siguen intactos. La referencia no habilita acceso:
resolver y revalidar titularidad, rol y permiso vigentes también en descargas.
Compatibilidad y verificación en contracts/private-record-references.md.

## Español transversal — solicitud 2026-10-22 (EXTRA051)

Todas las vistas públicas y de candidatos, empresas y administradores presentan
en español los estados, canales, acciones, motivos y mensajes generados por el
sistema; no deben mostrar códigos ingleses crudos ni reemplazar sus guiones por
espacios como traducción. Valores desconocidos tienen fallback español sin
exponer el código. Respuesta/informe empresarial sustituye feedback en etiquetas.
Selector de archivos usa textos españoles en el DOM, conservando accesibilidad,
validación y retención. Se conservan valores enviados, estados/identificadores
persistidos, permisos, URLs y contratos técnicos (por ejemplo encabezados CSV).
Contenido libre de personas y diálogos externos del navegador/OS no se traducen
automáticamente. No agrega catálogos municipales, reglas o migraciones.

## Formularios — ajuste autorizado 2026-10-20

Los formularios conservan semántica required. En la portada unificada, el login
no muestra asteriscos inicialmente: aparecen rojos al enviar campos obligatorios
vacíos. Los registros muestran un único asterisco gris por obligatorio, rojo
cuando falta el valor tras enviar y gris de nuevo al completarlo. Otros formularios
conservan asteriscos rojos. Enviar incompletos/incorrectos marca cada campo, explica en español
cómo corregirlo, anuncia un resumen y enfoca el primer error. Al corregir se
actualizan los errores. Incluye inputs, selects, textareas, confirmaciones,
grupos requeridos y archivos; opcionales y borradores conservan sus reglas.
Un fallo de validación, servidor o red no borra los valores ni archivos elegidos
de la página actual. No persistir datos sensibles en storage, logs o URLs para
conservarlos; no reenviar contraseñas en respuestas. Solo reiniciar tras éxito
explícito o decisión del usuario. Mantener validación/autorización servidor y
respuestas que no revelan cuentas existentes. No promete conservar una página
cerrada/recargada ni restaurar archivos después de una navegación.

### Registro compacto — ajuste autorizado 2026-10-20

Mateo pide tarjetas simétricas y formularios de registro compactos. En escritorio
las tarjetas informativa y de registro tendrán el mismo ancho y alto; el estado
inicial de ambos registros cabe sin scroll en1920×1080. Mantener controles legibles
y operables, todos los campos/avisos y errores visibles. Móvil, zoom y errores
pueden extender el documento; no ocultar contenido ni forzar scroll interno.
El criterio de simetría/compacidad guía estas pantallas, no autoriza rediseñar
otras páginas ni cambiar campos, validación, registro o autenticación.

Mateo amplía este ajuste con navegación directa entre registro de postulantes y
de empresas (2026-10-20). Ambos destinos se muestran como enlaces con tipo actual
identificado, sin enviar el formulario ni mezclar datos/contraseñas entre roles.

Mateo aplica el mismo criterio al inicio de sesión (2026-10-20), refinado con el
esquema de EXTRA033: información de la Oficina en la columna izquierda; a la
derecha, “¿Todavía no tenés cuenta?” con destinos candidato/empresa arriba del
inicio de sesión. Columnas de igual ancho y extremos superior/inferior alineados:
la tarjeta informativa ocupa la altura del conjunto de las dos tarjetas derechas.
Esta disposición sustituye el registro de ancho completo de EXTRA031 y la igualdad
de altura entre tarjetas individuales de EXTRA032. Último refinamiento de Mateo:
el conjunto queda centrado verticalmente en el espacio disponible, con altura
determinada por el contenido, sin estirar las tarjetas para llenar la página.
Formulario compacto, sin scroll inicial1920×1080; en móvil,
registro, login e información en una columna. La página crece si es necesario,
sin recortar errores/contenido o forzar scroll interno. No cambiar credenciales,
autenticación, sesiones ni recuperación.

## Clarifications

### Session 2026-10-22 — sin autoarchivo de perfiles (EXTRA039)

Mateo solicita quitar archivar/eliminar cuenta en candidatos y empresas. Se
retira del autoservicio (perfiles y Mi cuenta) y se rechaza también en servidor/
DB. Administración conserva archivo empresarial y restauración de registros
históricos con motivo/confirmación; no se añade archivo administrativo candidato.
No afecta archivo de ofertas propias, edición, disponibilidad, consentimiento,
postulaciones ni cierre de sesión. No borra datos ni modifica registros archivados.
Esta decisión sustituye las aclaraciones históricas de autoarchivo y las partes
correspondientes de FR-016/054; no resuelve políticas legales OQ-001/002 ni añade
un flujo alternativo de solicitudes de eliminación.

### Session 2026-10-21 — contratación y consentimiento (EXTRA035, histórico)

Superseded by EXTRA094 (2026-10-28): the following decision and its 720-hour
restriction are preserved as history, not executable current policy. Hiring now
retains consent and changes availability; manual withdrawal remains a separate action.

- Q: ¿El retiro automático por contratación afecta solo una derivación o el consentimiento global? → A: Mateo confirma el global y todos sus accesos empresariales, descartando la alternativa de solo matching. La transacción administrativa normal o tardía registra el retiro append-only con actor/fecha/causa, revoca todos los permisos activos y conserva los estados y resultados de las demás participaciones. El retiro manual sigue cerrando casos abiertos. No hay aceptación automática por corregir resultados; cualquier aceptación posterior exige el flujo afirmativo vigente y no revive permisos. Aplica a nuevas confirmaciones tras migración, sin backfill de contrataciones previas.

Esta decisión sustituye la conservación720h para nuevas contrataciones de FR-036/
FR-038 y la generalización del cierre de otros casos al retiro global automático.
Las aclaraciones previas quedan como evidencia histórica: la ventana720h solo
se conserva para permisos históricos que no hayan sido revocados.

### Session 2026-09-19

- Q: Después de una derivación municipal, ¿qué información del candidato podrá ver la empresa? →
  A: Perfil laboral, todos los contactos vigentes y CV; excluye DNI, domicilio y notas internas.
- Q: ¿Cuándo debe registrar el sistema el consentimiento del candidato para tratar sus datos y
  compartirlos con una empresa? → A: Un único consentimiento al activar el perfil cubre todas las
  derivaciones futuras.
- Q: ¿Qué conjunto mínimo de datos debe exigirse para activar un perfil de candidato? → A: El
  autorregistro inicial requiere nombre, DNI, correo verificado y contraseña; después del registro,
  el candidato completa desde su panel los datos laborales estructurados antes de activar el perfil.
- Q: ¿Qué datos deben ser obligatorios para habilitar una empresa y enviar una oferta a revisión
  municipal? → A: La empresa informa nombre, CUIT, responsable, contacto, actividad y localidad; la
  oferta informa título, tareas, categorías, vacantes, ubicación, modalidad, horario, contratación,
  requisitos y fecha de cierre.
- Q: ¿Quién debe tener autoridad para confirmar el resultado final de una derivación? → A: Solo un
  administrador registra el resultado final según lo comunicado por la empresa.
- Q: Cuando un administrador identifica a un candidato adecuado que no se postuló, ¿en qué momento
  debe confirmar su interés? → A: El consentimiento general vigente del perfil permite asociarlo y
  derivarlo sin una confirmación específica por oferta.
- Q: ¿Qué nivel de detalle deben ver candidatos y empresas sobre el avance de una participación? →
  A: El candidato ve recepción y resultado final; la empresa ve la moderación de sus ofertas y los
  candidatos derivados; las notas administrativas sobre postulantes permanecen ocultas.
- Q: ¿Qué debe ocurrir cuando una empresa no informa el resultado de una derivación? → A: Después de
  30 días desde la derivación se cierra automáticamente como sin respuesta empresarial; ninguna
  entrevista, contacto ni seguimiento modifica el plazo, y un administrador puede cambiar ese
  estado si la empresa responde más tarde.
- Q: ¿En qué momento debe ser obligatorio el CV PDF para un perfil creado mediante atención
  presencial? → A: El perfil asistido puede crearse sin PDF, pero debe incorporarlo antes de una
  derivación empresarial.
- Q: ¿Cómo deben representarse las capacitaciones asociadas a candidatos dentro del MVP? → A: Como
  una nota de texto libre dentro del perfil del candidato.
- Q: Después de una derivación, ¿qué contactos del candidato debe poder ver la empresa? → A: Todos
  los contactos vigentes del candidato se comparten automáticamente con la empresa derivada.
- Q: Si el candidato reemplaza su CV después de ser derivado, ¿qué versión debe seguir viendo la
  empresa en esa derivación? → A: La versión asociada a la derivación; el CV nuevo se usa solo en
  derivaciones posteriores.
- Q: ¿Desde qué evento deben contarse los 30 días sin respuesta empresarial y qué acciones deben
  modificar ese plazo? → A: Se cuentan desde la derivación; ninguna entrevista, contacto ni
  seguimiento pausa o reinicia el plazo.
- Q: Cuando se detecta un posible duplicado por DNI o correo, ¿qué decisiones debe poder registrar
  el administrador? → A: Usar o actualizar el perfil existente, corregir los datos y crear un perfil
  separado, o rechazar el alta; siempre con motivo e historial y nunca mediante fusión automática.
- Q: ¿Qué debe pasar con ofertas, postulaciones, derivaciones y acceso a CV cuando se suspende una
  cuenta de candidato o empresa? → A: Se bloquean la cuenta, las nuevas operaciones y el acceso
  empresarial a perfiles y CV; los casos existentes quedan para gestión administrativa y no se
  reactivan automáticamente. La acción debe estar destacada y exigir confirmación explícita.
- Q: ¿Debe exigirse correo electrónico para que candidatos y empresas se registren por su cuenta? →
  A: Sí; el autorregistro exige correo verificado y contraseña. El teléfono y otros contactos son
  adicionales, y los candidatos sin correo utilizan la atención presencial asistida.
- Q: ¿Qué debe ocurrir automáticamente cuando una oferta publicada alcanza su fecha de cierre? →
  A: Se cierra automáticamente, deja de ser pública y no acepta nuevas postulaciones; las
  participaciones existentes continúan para gestión administrativa y el cierre queda registrado.
- Q: ¿Cómo debe gestionarse la solicitud de un candidato para corregir o eliminar sus datos mientras
  la política de retención sigue pendiente? → A: Las correcciones se aplican directamente y una
  solicitud de eliminación archiva o desactiva el perfil de inmediato, sin revisión administrativa
  ni borrado permanente.
- Q: ¿Quién debe poder restaurar un perfil, empresa u oferta archivada y en qué estado debe quedar
  después de restaurarla? → A: Solo un administrador, registrando el motivo; el perfil candidato
  vuelve a `draft`, el perfil empresarial a `incomplete` y la oferta a `draft`. La restauración no
  reactiva automáticamente ofertas, accesos, derivaciones ni participaciones relacionadas.
- Q: ¿Cómo deben definirse “candidato activo” y “tiempo de cobertura” en las métricas del MVP? → A:
  Un candidato activo tiene perfil activo, está disponible, mantiene consentimiento vigente y fue
  actualizado en los últimos seis meses. Se miden por separado los días desde la publicación hasta
  la primera contratación confirmada y hasta completar todas las vacantes solicitadas; la cobertura
  total permanece pendiente mientras no se confirme ese número de contrataciones.
- Q: ¿Qué etapas puede omitir un administrador al avanzar una participación hacia la derivación? →
  A: Puede omitir revisión, preentrevista o preselección, respetando el orden de las etapas que sí
  realice y registrando el motivo de cada salto; la derivación nunca puede omitirse.
- Q: ¿Qué protocolo debe usarse para medir si candidatos y empresas completan sus recorridos en
  menos de 10 minutos? → A: Diez ejecuciones por rol, con datos ficticios preparados, conexión
  estable y al menos cinco personas distintas por rol; se mide sin ayuda técnica desde que se abre
  el registro hasta la postulación o el envío de la oferta.
- Q: ¿Qué conjunto de datos y puntos de inicio y fin deben usarse para medir la búsqueda
  administrativa y la generación de métricas y exportaciones? → A: Un conjunto ficticio de 500
  candidatos, 50 empresas, 100 ofertas y 1.000 participaciones. La búsqueda se mide desde abrir la
  pantalla hasta guardar la preselección; métricas y exportación, desde aplicar filtros hasta ver
  los conteos y completar la descarga.
- Q: ¿Con qué tamaños, zoom y tecnologías de apoyo debe comprobarse que los flujos críticos son
  accesibles? → A: En 360×800 y 1366×768, con zoom de 100 % y 200 %, usando solo teclado y exigiendo
  foco visible, ausencia de bloqueos y acceso a controles, validaciones y mensajes; además, un
  recorrido representativo por rol se verifica con NVDA.
- Q: ¿Cuáles son las cinco tareas críticas de usabilidad y qué debe contar como “primer intento”? →
  A: Completar perfil y postularse; crear y enviar una oferta; moderar una oferta; buscar,
  preseleccionar y derivar; y registrar el resultado final. Primer intento significa hacerlo sin
  ayuda externa ni reiniciar, aunque se permite corregir errores usando solo los mensajes de la interfaz.

### Session 2026-09-20

- Q: Si un candidato retira una postulación después de ser derivado o retira su consentimiento
  general, ¿cuándo debe perder la empresa el acceso al perfil, los contactos y el CV? → A: El acceso
  empresarial se revoca inmediatamente en ambos casos, se conserva el historial administrativo y
  no se restaura automáticamente.
- Q: ¿Cómo debe evaluarse el criterio “4 de 5 tareas en el primer intento” con usuarios
  representativos? → A: Con cohortes por rol de al menos cinco candidatos, cinco representantes de
  empresas y los cuatro administradores previstos o personal municipal equivalente; cada persona
  realiza solo tareas de su rol, cada tipo de tarea exige al menos 80 % de éxito en el primer intento
  y el criterio global aprueba cuando cumplen al menos cuatro de los cinco tipos de tarea.
- Q: ¿Quiénes deben ejecutar las mediciones administrativas de SC-003 y SC-008 y qué preparación
  pueden recibir antes del cronómetro? → A: Un único administrador de prueba, sin capacitación ni
  práctica previa, que recibe solamente la descripción de la tarea antes de cada medición.
- Q: ¿En qué condiciones debe ejecutarse el cronómetro de SC-003 y SC-008 para que los resultados
  administrativos sean comparables? → A: En el mismo entorno de demostración, con el conjunto
  ficticio restablecido, conexión estable, sin recorridos de calentamiento y registrando las
  condiciones de la ejecución.
- Q: Cuando una participación finaliza por contratación, no selección, cancelación o falta de
  respuesta empresarial, ¿qué debe ocurrir con el acceso de la empresa al perfil, los contactos y
  el CV del candidato? → A: El acceso se mantiene si se confirma la contratación y se revoca
  inmediatamente en los demás resultados finales; el acceso conservado sigue sujeto al retiro de
  consentimiento, la suspensión, el archivo y la política de retención pendiente.

### Session 2026-09-21

- Q: ¿Qué campos de una oferta aprobada puede ver cualquier visitante? → A: Todos los campos
  laborales de FR-021, incluidos salario y beneficios cuando se informen, más el nombre de la
  empresa. No se publican CUIT, persona responsable ni contactos privados de la empresa.
- Q: En SC-001 y SC-002, ¿un reinicio invalida el recorrido cronometrado? → A: No; se permiten
  reinicios, pero el cronómetro continúa desde la primera apertura del formulario. El criterio de
  “primer intento” de SC-010 se evalúa por separado y no se aplica a estas mediciones de tiempo.
- Q: ¿Qué referencia conserva la empresa para enviar feedback tardío cuando ya no puede ver al
  candidato? → A: Solo el identificador de derivación, el identificador y título de su propia oferta
  y la fecha de derivación; no conserva acceso a datos personales del candidato.
- Q: ¿Qué evidencia admite una corrección por respuesta empresarial tardía y cómo se presenta? → A:
  El administrador puede basarse en feedback enviado por la empresa desde el portal o en un contacto
  municipal registrado por teléfono, correo, WhatsApp o atención presencial, siempre con fecha,
  canal, administrador y nota breve sin datos sensibles innecesarios. Puede registrar `hired`,
  `not_selected` o `cancelled`. La interfaz destaca el resultado vigente y conserva
  `no_company_response` como cierre automático anterior, con fecha y señal de que fue reemplazado por
  una corrección tardía; la corrección no reactiva el permiso empresarial.
- Q: ¿Qué ocurre con las participaciones abiertas si el candidato retira su consentimiento general?
  → A: Se cierran de inmediato como retiradas, se conserva el historial y se revocan los accesos
  empresariales; una aceptación posterior no las reabre.
- Q: ¿Qué ocurre con las participaciones abiertas si un administrador cancela una oferta? → A: Se
  cierran de inmediato como canceladas y se revocan los accesos empresariales afectados, conservando
  el historial; los resultados que ya eran finales no cambian.
- Q: ¿Quién suspende y reactiva cuentas administrativas? → A: Otro administrador activo desde el
  panel, con motivo, confirmación y auditoría; no se permite suspender al último administrador
  activo ni ejecutar la suspensión sobre la propia cuenta.
- Q: ¿Se archivan cuentas administrativas en el MVP? → A: No. Solo se suspenden o reactivan; una
  baja permanente requiere una política o procedimiento municipal posterior.
- Q: ¿Cómo puede una persona reclamar el perfil que la Oficina creó durante la atención presencial?
  → A: La vinculación se hace presencialmente: un administrador comprueba el DNI exhibido sin
  conservar copia, la cuenta personal usa correo verificado y el perfil asistido conserva su ID e
  historial. Una coincidencia o conflicto de cuenta, DNI o correo bloquea la vinculación y pasa por
  la resolución administrativa de duplicados; no hay reclamo remoto automático.
- Q: ¿Qué motivos de moderación debe ver la empresa? → A: Una solicitud de corrección o un rechazo
  de oferta muestra una explicación accionable. Pausa, suspensión de cuenta u oferta, cancelación y
  cierre muestran solo el estado; sus motivos quedan para administración. Aprobación y reanudación
  muestran el cambio de estado sin exigir motivo; un cierre automático registra código de sistema.
- Q: ¿A qué estado vuelve el perfil empresarial al reactivar una cuenta de empresa suspendida? → A:
  En la misma decisión, la cuenta recupera acceso y su perfil vuelve a `incomplete` para completarse
  de nuevo. Las ofertas, participaciones y permisos empresariales anteriores no se reactivan.
- Q: ¿A qué estado vuelve el perfil candidato al reactivar una cuenta de candidato suspendida? → A:
  La suspensión y la reactivación no cambian por sí mismas el estado del perfil: al volver la cuenta
  a `active`, el perfil conserva el estado anterior. Las operaciones posteriores vuelven a validar
  su estado y las condiciones vigentes de frescura, disponibilidad, consentimiento y CV; ofertas,
  participaciones, derivaciones y permisos anteriores no se reactivan.
- Q: ¿Quién puede archivar una cuenta y perfil empresarial? → A: La empresa puede archivar los
  propios desde su sesión y un administrador también puede hacerlo, en este caso con motivo. Ambas
  operaciones son recuperables, conservan historial y bloquean el acceso; solo administración puede
  restaurar, dejando la cuenta activa, el perfil `incomplete` y las ofertas en `draft`, sin reactivar
  participaciones, derivaciones ni permisos.
- Q: ¿Quién puede retirar o cancelar una participación abierta? → A: El candidato puede retirar
  tanto una postulación propia como una nominación administrativa; un administrador solo registra
  un retiro si el candidato lo solicitó. La Oficina puede cancelar un caso individual por un motivo
  operativo, sin cancelar las demás participaciones ni la oferta. Ambos cierres conservan historial
  y revocan el acceso empresarial afectado.
- Q: Si la empresa informa que se canceló el proceso de un candidato, ¿debe cancelarse la oferta?
  → A: No. El administrador puede confirmar la cancelación de esa participación individual sin
  cancelar la oferta ni alterar otras participaciones, incluso ante una respuesta tardía.
- Q: ¿Qué contiene la exportación CSV genérica del MVP? → A: Solo el resumen de métricas que ve el
  administrador con los filtros aplicados, incluidos los tiempos de contratación cuando se puedan
  calcular. Estos dos tiempos se exportan por oferta, identificada por su código y título; no se
  incluyen filas de personas ni listados operativos o datos personales.
- Q: ¿Cómo se aplica el filtro de período y categoría en las métricas? → A: Candidatos activos,
  empresas y ofertas por estado representan una foto al cierre del período; postulaciones,
  preentrevistas, derivaciones y resultados cuentan los eventos ocurridos dentro de él. Para
  candidatos se usa su categoría; para ofertas y casos, la categoría de la oferta. El conteo de
  empresas no se filtra por categoría.
- Q: ¿Qué ofertas incluye el filtro de período para los tiempos hasta primera contratación y
  cobertura total? → A: Las publicadas dentro del período seleccionado; se sigue esa cohorte aunque
  la contratación se confirme después del intervalo, y la cobertura no alcanzada queda pendiente.
- Q: ¿Cuánto tiempo conserva una empresa el acceso a una derivación tras contratar? → A: Si el
  permiso seguía vigente, durante 30 días exactos (720 horas) desde que un administrador confirma
  `hired`. Al vencer se impiden nuevas consultas y descargas, o antes ante retiro de consentimiento,
  suspensión o archivo. Esta ventana de acceso no aprueba ni sustituye la política de retención de
  perfiles, CV e historial pendiente en OQ-001; una corrección tardía de `no_company_response` a
  `hired` no revive un permiso ya revocado.

## User Scenarios & Testing *(mandatory)*

### Project decision 2026-09-25: synthetic import demonstration

Mateo authorized implementation and testing of US5 with a written provisional
mapping and exclusively fictitious data, because the municipal workbook is not
available. `docs/import/candidate-import-v1.md` records that mapping and evidence.
This exception permits a demonstration, not historical-data acceptance: FR-060,
OQ-018 and T069 still require the Office's sample and written approval for real imports.
No consent, real categories or municipal approval may be inferred from this decision.

### User Story 1 - Intermediación municipal de una búsqueda laboral (Priority: P1)

Como integrante de la Oficina de Empleo, necesito gestionar una búsqueda desde que una oferta se
presenta para revisión hasta que se confirma su resultado, para preseleccionar perfiles adecuados,
decidir qué candidatos se derivan y poder explicar qué ocurrió en cada caso.

**Why this priority**: La intermediación municipal es el propósito central del producto y evita que
el portal se convierta en un mercado directo de datos personales.

**Independent Test**: Puede probarse con una empresa, una oferta y varios perfiles ficticios,
verificando que el personal modere la oferta, busque candidatos, registre una preentrevista, derive
solo los seleccionados y confirme un resultado con historial completo.

**Acceptance Scenarios**:

1. **Given** una empresa con una oferta enviada a revisión, **When** un administrador solicita
   correcciones, la aprueba o la rechaza, **Then** la oferta adopta el estado correspondiente,
   registra la decisión y solo se publica cuando fue aprobada.
2. **Given** una oferta publicada y candidatos activos, **When** un administrador filtra perfiles y
   registra su evaluación, **Then** puede identificar una preselección sin exponer esos perfiles a
   la empresa.
3. **Given** un candidato preseleccionado con perfil activo y consentimiento general vigente,
   **When** un administrador lo deriva aunque no exista una postulación previa, **Then** la empresa
   de esa oferta puede ver el perfil laboral, todos los contactos vigentes y la versión del CV
   asociada a esa derivación, pero no su DNI, domicilio, notas internas ni datos del padrón general.
4. **Given** una derivación con entrevista o seguimiento posterior, **When** la empresa comunica un
   resultado, **Then** solo un administrador puede registrar el estado final y queda un historial
   con fechas, actores y cambios de estado.
5. **Given** una participación que no requiere todas las etapas internas, **When** un administrador
   omite revisión, preentrevista o preselección, **Then** registra el motivo, conserva el orden de las
   etapas realizadas y efectúa siempre una derivación explícita antes de exponer datos a la empresa.
6. **Given** varias participaciones abiertas para una oferta, **When** la Oficina cancela solo el
   proceso de un candidato por motivo operativo, incluso tras feedback empresarial de cancelación,
   **Then** únicamente esa participación queda cancelada, se revoca su acceso empresarial y las
   demás participaciones y la oferta continúan sin cambios.

---

### User Story 2 - Autogestión del candidato (Priority: P1)

Como persona que busca empleo, necesito registrarme, mantener un perfil con varias categorías,
presentar mi CV y postularme a ofertas publicadas, para participar en distintas búsquedas sin perder
el acompañamiento de la Oficina de Empleo.

**Why this priority**: Organizar perfiles y postulaciones reduce la fragmentación actual y permite
que candidatos antiguos sigan siendo localizables.

**Independent Test**: Puede probarse registrando un candidato ficticio, completando su perfil,
seleccionando varias categorías, cargando un CV válido y postulándose a dos ofertas publicadas.

**Acceptance Scenarios**:

1. **Given** una persona con correo que no tiene cuenta, **When** registra su nombre, DNI, correo y
   contraseña y verifica el correo, **Then** puede iniciar sesión y acceder a su panel aunque su
   perfil laboral todavía no esté activo.
2. **Given** un candidato autenticado, **When** completa desde su panel la localidad, categorías
   laborales, habilidades o experiencia resumida, disponibilidad y CV y acepta el consentimiento
   aprobado, **Then** se activa su perfil, queda registrada la aceptación para el tratamiento
   laboral y futuras derivaciones, y solo modifica su propia información.
3. **Given** un perfil que cumple los requisitos aprobados para postularse, **When** el candidato
   elige dos ofertas publicadas, **Then** puede crear una postulación independiente para cada una.
4. **Given** una postulación activa, **When** el candidato decide retirarla o desactivar su
   disponibilidad, **Then** el cambio queda registrado sin eliminar su historia laboral.
5. **Given** una participación en curso, **When** el candidato consulta su estado, **Then** ve la
   recepción y, cuando exista, el resultado final, pero no las etapas de evaluación ni las notas
   internas.
6. **Given** un candidato autenticado, **When** corrige sus datos propios, **Then** la corrección
   se aplica directamente; no se ofrece ni permite archivar/eliminar su cuenta por autoservicio.
   La restauración administrativa de registros históricos conserva el historial.
7. **Given** una participación todavía abierta creada por postulación o nominación administrativa,
   **When** el candidato la retira directamente o pide al personal registrar su retiro, **Then**
   queda `withdrawn`, se revoca el acceso empresarial de esa derivación y se conserva su historia.

---

### User Story 3 - Gestión de empresa y ofertas (Priority: P1)

Como representante de una empresa, necesito registrar la organización, presentar ofertas y recibir
únicamente los perfiles derivados por el municipio, para cubrir vacantes dentro de un proceso
controlado y trazable.

**Why this priority**: Las ofertas originan la demanda laboral, pero requieren moderación para
preservar la confianza, la privacidad y el rol municipal.

**Independent Test**: Puede probarse registrando una empresa ficticia, creando un borrador,
enviándolo a revisión, respondiendo a una solicitud de cambios, consultando solo una derivación
autorizada y recorriendo el archivo exclusivamente administrativo más la restauración administrativa sin
reactivar ofertas, participaciones ni accesos relacionados.

**Acceptance Scenarios**:

1. **Given** una empresa registrada mediante correo verificado y contraseña, y autenticada con
   nombre, CUIT, responsable, contacto, actividad y localidad, **When** guarda un borrador de oferta,
   **Then** puede editarlo sin publicarlo directamente.
2. **Given** un borrador completo, **When** la empresa lo envía a revisión, **Then** conoce su estado
   de moderación y no puede hacerlo público por sí misma.
3. **Given** una solicitud municipal de correcciones, **When** la empresa actualiza y reenvía la
   oferta, **Then** el nuevo envío vuelve a revisión y conserva el historial anterior.
4. **Given** candidatos derivados a una oferta propia, **When** la empresa consulta la búsqueda,
   **Then** accede solo a esos perfiles y puede comunicar el resultado de sus entrevistas sin ver
   notas internas ni modificar directamente el estado final.
5. **Given** una oferta publicada que alcanza su fecha de cierre, **When** finaliza esa fecha,
   **Then** la oferta se cierra automáticamente, deja de mostrarse públicamente y no acepta nuevas
   postulaciones, sin cerrar las participaciones existentes.
6. **Given** una empresa con cuenta/perfil y ofertas no finales, **When** la empresa archiva sus
   propios registros o un administrador los archiva con motivo, **Then** cuenta, perfil y ofertas no
   finales quedan archivados de forma recuperable, se bloquea el acceso empresarial y se revocan los
   permisos de derivación sin borrar casos, resultados ni historia; **When** un administrador los
   restaura con motivo, **Then** la cuenta queda `active`, el perfil `incomplete` y las ofertas en
   `draft`, sin reactivar participaciones, derivaciones ni permisos.

---

### User Story 4 - Atención presencial asistida (Priority: P2)

Como administrador que atiende a una persona presencialmente, necesito crear y mantener su perfil y
acompañarla en el proceso, para que la falta de acceso o habilidades digitales no la excluya.

**Why this priority**: La inclusión presencial es una restricción constitucional y conserva un
canal de atención que ya utiliza la comunidad.

**Independent Test**: Puede probarse creando un perfil asistido sin credenciales públicas,
detectando un posible duplicado y gestionando su participación con la misma privacidad e historial
que un perfil autogestionado.

**Acceptance Scenarios**:

1. **Given** una persona atendida en la oficina, **When** un administrador intenta crear su perfil,
   **Then** el sistema comprueba posibles duplicados antes de guardar información nueva y exige una
   resolución administrativa con motivo cuando encuentra una coincidencia.
2. **Given** un perfil asistido válido, **When** el administrador actualiza categorías,
   disponibilidad, CV o contactos, **Then** cada acción queda asociada al administrador responsable.
3. **Given** un perfil asistido que luego deba vincularse a una cuenta personal, **When** la persona
   presenta su DNI en la Oficina, un administrador comprueba su identidad sin conservar copia y se
   verifica el correo de la cuenta personal, **Then** se vincula esa cuenta al mismo perfil e
   historial, sin crear un perfil nuevo. Un conflicto de cuenta, DNI o correo bloquea la operación
   hasta la resolución administrativa de duplicados.
4. **Given** un perfil asistido sin CV PDF, **When** el personal lo guarda o actualiza, **Then** puede
   continuar la atención interna, pero no puede derivarlo a una empresa hasta incorporar un PDF
   válido.

---

### User Story 5 - Importación controlada del padrón existente (Priority: P2)

Como administrador, necesito importar candidatos desde un CSV revisado, para incorporar el padrón
histórico sin reescribirlo manualmente ni introducir datos inválidos o duplicados sin control.

**Why this priority**: La información histórica es necesaria para que el nuevo sistema resuelva el
problema operativo desde su adopción, pero su calidad exige controles previos.

**Independent Test**: Puede probarse con un CSV completamente ficticio que contenga filas válidas,
errores y duplicados, verificando la previsualización y que ninguna escritura parcial quede oculta.

**Acceptance Scenarios**:

1. **Given** un archivo basado en el mapeo aprobado, **When** un administrador lo previsualiza,
   **Then** ve qué filas serían aceptadas, rechazadas o marcadas como posibles duplicados antes de
   confirmar.
2. **Given** un archivo con errores, **When** la validación finaliza, **Then** se muestran errores
   accionables sin incorporar silenciosamente filas inválidas.
3. **Given** una importación confirmada, **When** ocurre un fallo, **Then** el resultado completo es
   atómico o queda en un estado recuperable y auditable.

---

### User Story 6 - Seguimiento operativo y métricas básicas (Priority: P3)

Como administrador, necesito consultar actividad, contactos, estados y métricas básicas, para dar
seguimiento a las búsquedas y responder solicitudes operativas sin contar planillas manualmente.

**Why this priority**: Consolida la información que hoy está dispersa y permite evaluar el trabajo
de la oficina, después de asegurar los flujos transaccionales centrales.

**Independent Test**: Puede probarse con datos ficticios de varios períodos y categorías,
verificando los conteos, filtros y una exportación administrativa que no sea pública.

**Acceptance Scenarios**:

1. **Given** actividad registrada en un período, **When** un administrador consulta el panel,
   **Then** obtiene conteos coherentes de candidatos, empresas, ofertas, postulaciones,
   preentrevistas, derivaciones y resultados.
2. **Given** contactos por teléfono, correo, WhatsApp o atención presencial, **When** el personal
   revisa un caso, **Then** puede reconstruir la secuencia de seguimiento sin exponer notas internas
   a candidatos o empresas.
3. **Given** un conjunto filtrado de datos administrativos, **When** un administrador solicita una
   exportación genérica, **Then** recibe un CSV coherente con los filtros y no accesible al público.
4. **Given** una oferta publicada con una o más vacantes, **When** un administrador consulta sus
   tiempos, **Then** ve por separado los días hasta la primera contratación confirmada y, únicamente
   cuando se cubren todas las vacantes solicitadas, los días hasta la cobertura total.

### Edge Cases

- Un registro o importación coincide por DNI o correo con un candidato existente; se bloquea el alta
  hasta que un administrador, dejando motivo e historial, decida usar o actualizar el perfil
  existente, corregir los datos y crear uno separado por tratarse de un falso positivo, o rechazar
  el alta. El sistema nunca fusiona perfiles automáticamente.
- Una cuenta de candidato está suspendida; no puede realizar acciones privadas, queda excluida de
  búsquedas activas y de nuevas postulaciones o derivaciones, y se revoca de forma persistente el acceso
  empresarial a sus perfiles y CV ya derivados. Una empresa suspendida tampoco puede realizar
  acciones privadas; sus ofertas dejan de admitir nuevas postulaciones o derivaciones y pierde el
  acceso a perfiles y CV derivados. En ambos casos, las participaciones existentes permanecen para
  gestión administrativa y conservan su historial sin convertirse automáticamente en un resultado
  final. El feedback ya recibido permanece pendiente de revisión administrativa. Una empresa
  suspendida no puede enviar nuevo feedback; si solo el candidato está suspendido, una empresa aún
  activa puede informar sobre su derivación mediante la referencia y el nombre mínimo de FR-039, sin
  recuperar datos del candidato. Al reactivar una cuenta candidata, la cuenta vuelve a `active` y el
  perfil conserva el estado anterior porque ni la suspensión ni la reactivación lo cambian por sí
  mismas; cada operación posterior revalida las condiciones vigentes. La reactivación de cualquier
  cuenta no reactiva por sí sola ofertas, participaciones, derivaciones, permisos ni otros registros.
- Una empresa intenta publicar directamente, ver el padrón general o consultar una derivación de
  otra empresa; la acción debe rechazarse sin revelar datos.
- Un correo todavía no verificado no habilita acciones privadas y recibe instrucciones para
  verificarlo. Si el enlace de verificación venció, puede solicitar otro sin confirmar si existe la
  cuenta. Una solicitud de recuperación devuelve el mismo mensaje seguro exista o no el correo; un
  enlace inválido o vencido no cambia la contraseña y ofrece solicitar uno nuevo. Una sesión
  revocada exige iniciar sesión otra vez; una cuenta suspendida mantiene bloqueadas las acciones
  privadas aunque conserve una cookie. Ninguna respuesta revela a terceros la existencia de una
  cuenta, un recurso ajeno, notas internas o credenciales.
- Una oferta alcanza su fecha de cierre mientras existen postulaciones activas; se cierra
  automáticamente, deja de estar publicada y de recibir nuevas postulaciones, pero las existentes
  conservan su historia y continúan para tratamiento administrativo.
- Pausar una oferta suspende visibilidad y nuevas postulaciones sin finalizar participaciones;
  reanudarla solo procede si sigue vigente. Cerrar una oferta manualmente o por vencimiento también
  deja las participaciones existentes para gestión administrativa. Cancelarla, en cambio, cierra de
  inmediato como `cancelled` todas las participaciones aún abiertas y revoca sus accesos
  empresariales, sin cambiar resultados ya finales ni borrar historial.
- Un candidato actualiza su perfil o CV mientras participa en varias búsquedas; cada derivación
  conserva la versión del CV compartida originalmente y el documento nuevo solo se usa en
  derivaciones posteriores.
- Un perfil supera el período aprobado de vigencia sin confirmación; no se elimina y deja de aparecer
  por defecto entre candidatos activos hasta que se actualice.
- Un candidato se retira después de ser preseleccionado o derivado; el retiro se registra y la
  empresa pierde inmediatamente el acceso al perfil, los contactos y el CV de esa derivación. La
  revocación conserva el historial administrativo y no se revierte automáticamente. Bloquea nuevas
  consultas y descargas desde el portal, pero no puede retirar respuestas ya recibidas ni una copia
  de CV que la empresa descargó antes; ese límite técnico no decide la retención pendiente de OQ-001.
- Un candidato retira el consentimiento general; se impiden nuevos tratamientos y derivaciones que
  dependan de ese consentimiento y se revoca inmediatamente todo acceso empresarial vigente a su
  perfil, contactos y CV. Sus participaciones todavía abiertas se cierran como `withdrawn` en la
  misma operación, con motivo `consent_withdrawn`; las ya finalizadas conservan su resultado e
  historial. Ni participaciones ni accesos se reabren automáticamente al aceptar de nuevo.
- Un candidato o empresa intenta archivar/eliminar su cuenta por un formulario antiguo o un RPC
  directo; se rechaza sin cambiar datos, sesiones, accesos o historial. Solo un administrador
  activo puede archivar una empresa de forma recuperable con motivo y confirmación;
  no se agrega un comando administrativo nuevo para archivar candidatos.
- Un administrador archiva cuenta/perfil empresarial con motivo; la
  operación bloquea inmediatamente el acceso empresarial, marca sus ofertas no finales como
  archivadas de forma recuperable y revoca sus permisos de derivación, sin borrar ni convertir casos
  existentes en resultados finales. Solo un administrador puede restaurar esos registros.
- Un administrador restaura un perfil, empresa u oferta archivada; debe registrar el motivo y el
  perfil candidato vuelve a `draft`, el perfil empresarial a `incomplete` y la oferta a `draft` para
  revisión, sin reactivar automáticamente ofertas, accesos empresariales, derivaciones ni
  participaciones relacionadas.
- Una empresa no comunica un resultado; el caso permanece pendiente durante 30 días exactos desde
  la derivación y luego se cierra automáticamente como sin respuesta empresarial, sin registrarlo
  como contratación o no selección. Entrevistas, contactos y seguimientos no pausan ni reinician el
  plazo y el acceso empresarial al perfil, los contactos y el CV se revoca al producirse el cierre.
  Si la empresa responde más tarde, puede comunicar el resultado sin recuperar ese acceso. Un
  administrador puede usar ese feedback o un contacto municipal registrado por teléfono, correo,
  WhatsApp o atención presencial —con fecha, canal, actor y nota breve— para corregir el resultado a
  `hired`, `not_selected` o `cancelled`. La vista muestra el resultado vigente y conserva
  `no_company_response` como antecedente automático reemplazado, sin eliminarlo del historial.
- Una participación finaliza como no seleccionada o cancelada; se revoca inmediatamente el acceso
  empresarial al perfil, los contactos y el CV. Una nueva contratación confirmada, normal o tardía,
  cambia disponibilidad a No disponible y conserva consentimiento y demás participaciones/
  permisos. El permiso propio todavía activo conserva acceso hasta720 horas desde la
  confirmación administrativa, salvo revocación previa; al vencer no permite
  nuevas consultas o descargas. Ese límite no es una política de retención aprobada:
  el plazo de conservación de los datos continúa pendiente en OQ-001.
- Un CV tiene tipo o tamaño no admitido, está dañado o intenta contener contenido ejecutable; se
  rechaza con un mensaje claro sin sustituir el CV vigente.
- Un perfil asistido todavía no tiene CV PDF; puede mantenerse y evaluarse internamente, pero todo
  intento de derivación empresarial debe bloquearse hasta incorporar un documento válido.
- Un candidato no dispone de correo electrónico o no puede completar el autorregistro; el personal
  puede crear y mantener un perfil asistido sin credenciales públicas, conservando las mismas reglas
  de consentimiento, privacidad, duplicados e historial.
- Un CSV contiene encabezados desconocidos, filas incompletas, categorías sin mapear o una mezcla de
  filas válidas e inválidas; la previsualización debe explicar el impacto antes de confirmar.
- Una acción falla después de que el usuario la solicita; el sistema evita estados parciales ocultos
  y muestra un mensaje en español que no revela datos personales ni detalles internos. Para una
  transición o archivo/restauración fallidos, no queda cambio de entidad, permiso o evento parcial y
  el usuario puede recargar y reintentar sin duplicar historial. Si otra persona cambió antes el
  registro, se indica conflicto de versión y se exige recargar el estado vigente antes de decidir de
  nuevo. En importación, la doble confirmación no duplica filas; una falla conserva el lote y un
  código de resultado recuperable sin candidatos incorporados parcialmente.
- Dos administradores actúan sobre el mismo caso; el historial debe conservar quién realizó cada
  cambio y permitir detectar el estado vigente.
- Un administrador omite una etapa interna de evaluación; el sistema exige un motivo, impide volver
  a una etapa anterior incompatible y nunca permite exponer datos empresariales sin una derivación
  explícita posterior.

## Requirements *(mandatory)*

### Functional Requirements

#### Acceso y permisos

- **FR-001**: El sistema DEBE permitir que candidatos y empresas se registren por su cuenta mediante
  correo electrónico verificado y contraseña, inicien y cierren sesión. El teléfono y otros datos de
  contacto PUEDEN agregarse, pero NO DEBEN sustituir el correo como credencial de autorregistro.
- **FR-002**: El sistema DEBE permitir la recuperación segura de acceso para candidatos, empresas y
  administradores. La solicitud DEBE responder sin revelar si existe la cuenta. Un enlace inválido
  o vencido NO DEBE cambiar credenciales y DEBE permitir solicitar uno nuevo con el mismo mensaje
  seguro. El correo sin verificar NO DEBE habilitar acciones privadas; un enlace de verificación
  vencido DEBE poder renovarse sin enumerar cuentas.
- **FR-003**: El sistema DEBE admitir cuatro cuentas administrativas individuales, con los mismos
  permisos completos, creadas fuera del registro público y sin credenciales compartidas. Un
  administrador activo DEBE poder suspender o reactivar a otro administrador, con motivo,
  confirmación explícita e historial; NO DEBE suspenderse a sí mismo ni dejar cero administradores
  activos. Las cuentas administrativas NO DEBEN archivarse en el MVP; cualquier baja permanente
  queda pendiente de un procedimiento municipal posterior. No existe autorregistro ni elevación
  pública al rol administrador. Actualización autorizada por Máximo el 2026-10-27:
  desde Cuenta, un administrador activo puede invitar otras cuentas individuales,
  con correo válido y confirmación explícita de permisos completos. Las cuatro
  cuentas iniciales no constituyen un máximo. La invitación conserva su reserva,
  atribución e ingreso individual con definición de contraseña; los errores de envío
  no se presentan como éxito ni se expone el cliente privilegiado al navegador.
- **FR-004**: Cada acción y registro privado DEBE ser accesible únicamente para los roles y
  propietarios autorizados, incluso cuando alguien intente acceder fuera de la navegación normal.
- **FR-005**: Los administradores DEBEN poder suspender y reactivar cuentas de candidatos y empresas
  sin destruir su historial. La acción de suspensión DEBE presentarse de forma visualmente destacada
  y requerir una confirmación explícita. Una cuenta suspendida NO DEBE realizar acciones privadas ni
  participar en nuevas postulaciones o derivaciones; además, se DEBE revocar al suspender la cuenta
  cualquier acceso empresarial a perfiles y CV relacionados, sin restaurarlo de forma
  automática al reactivar la cuenta. Los casos existentes DEBEN
  permanecer disponibles para gestión administrativa, sin adoptar automáticamente un resultado
  final, y reactivar la cuenta NO DEBE reactivar automáticamente ofertas, participaciones,
  derivaciones ni permisos relacionados. Al reactivar una cuenta candidata, la cuenta DEBE volver a
  `active` y el perfil candidato DEBE conservar el estado anterior: suspensión y reactivación NO
  DEBEN cambiarlo por sí mismas. Cada operación posterior DEBE volver a validar el estado y las
  condiciones vigentes de frescura, disponibilidad, consentimiento y CV cuando corresponda. Para la
  empresa, en cambio, la reactivación de su cuenta DEBE poner el perfil empresarial en `incomplete`,
  sin habilitarlo hasta que vuelva a completar los datos requeridos. El
  feedback ya recibido DEBE permanecer pendiente de revisión administrativa; la empresa suspendida
  NO DEBE enviar nuevo feedback. Si solo el candidato está suspendido, una empresa activa PUEDE
  informar sobre una derivación propia usando la referencia y el nombre mínimo de FR-039.
- **FR-006**: Las personas no autenticadas DEBEN poder consultar únicamente información pública y
  ofertas vigentes publicadas; postularse DEBE requerir una cuenta de candidato.

#### Perfiles de candidatos

- **FR-010**: El autorregistro inicial de un candidato DEBE solicitar nombre completo, DNI, correo
  electrónico, contraseña y verificación del correo; una vez autenticado, el candidato DEBE completar
  desde su panel la localidad, múltiples categorías laborales, habilidades o experiencia resumida,
  disponibilidad y CV antes de activar su perfil laboral. Los candidatos sin correo DEBEN poder ser
  atendidos mediante un perfil asistido creado por un administrador.
- **FR-011**: Un administrador DEBE poder crear y mantener un perfil asistido para una persona
  atendida presencialmente, identificándose como responsable de sus acciones, aunque todavía no
  tenga un CV PDF.
- **FR-012**: Un candidato DEBE poder seleccionar múltiples categorías laborales de un catálogo
  controlado y registrar habilidades según las reglas aprobadas. No existe un campo separado
  de intereses laborales; sus selecciones históricas se conservan según EXTRA057.
- **FR-013**: Un candidato o administrador autorizado DEBE poder incorporar y reemplazar un CV en el
  formato aprobado, sujeto a validación de tipo, tamaño e integridad antes de aceptarlo.
  EXTRA096 admite PDF/JPG/JPEG/PNG hasta5 MiB y normaliza imágenes estáticas a PDF
  protegido; WebP excluido. Un CV por oferta no sustituye el general.
- **FR-014**: El sistema DEBE detectar coincidencias potenciales por DNI y correo y bloquear el alta
  de un perfil nuevo hasta una resolución administrativa. Si la coincidencia corresponde a un perfil
  asistido que la persona desea reclamar, puede existir una cuenta candidata con correo verificado,
  pero no se crea otro perfil ni se habilita la vinculación sin la comprobación presencial de
  FR-017. El administrador DEBE poder usar o actualizar el perfil
  existente, corregir los datos y crear uno separado cuando documente un falso positivo, o rechazar
  el alta; cada decisión DEBE conservar actor, fecha y motivo, y el sistema NO DEBE fusionar perfiles
  automáticamente.
- **FR-015**: Los administradores DEBEN poder conocer la disponibilidad y vigencia del perfil; los
  perfiles sin confirmar o actualizar durante seis meses DEBEN marcarse para actualización y quedar
  fuera de los resultados activos predeterminados sin ser eliminados.
- **FR-016**: El sistema DEBE permitir que un candidato retire una postulación activa, desactive su
  disponibilidad y corrija directamente sus propios datos. No DEBE ofrecer ni permitir el
  autoarchivo/eliminación de cuenta o perfil. Los registros ya archivados conservan el historial
  de forma recuperable mientras no exista una política de retención aprobada. Si la postulación retirada ya tenía una
  derivación, el sistema DEBE revocar inmediatamente el acceso empresarial al perfil, los contactos
  y el CV, conservar el historial administrativo y NO DEBE restaurar ese acceso automáticamente.
  EXTRA102: el titular PUEDE crear otra postulación propia cuando todos los casos
  no archivados previos para esa oferta estén retirados y siga cumpliendo FR-030;
  es un caso nuevo y nunca restaura la participación o el permiso anterior.
- **FR-017 (Should)**: El sistema DEBERÍA permitir vincular un perfil asistido con la cuenta personal
  del mismo candidato exclusivamente mediante atención presencial. Un administrador DEBE comprobar
  el DNI exhibido sin conservar copia y exigir que la cuenta personal tenga correo verificado antes
  de completar la vinculación. Si el alta de esa cuenta coincide con un perfil asistido existente,
  NO DEBE crear automáticamente otro perfil: la vinculación queda pendiente de la comprobación
  presencial. Un conflicto de cuenta, DNI o correo DEBE bloquearla y seguir la resolución
  administrativa de duplicados de FR-014. Al vincular, DEBEN conservarse el identificador, origen,
  consentimiento, estados e historial del perfil asistido, y registrarse el administrador, fecha y
  decisión sin copiar el DNI ni una imagen del documento a auditoría. NO DEBE existir reclamo remoto
  automático en el MVP.

#### Empresas y ofertas

- **FR-020**: Una empresa DEBE autorregistrarse con correo electrónico verificado y contraseña, y
  registrar y mantener nombre, CUIT, persona responsable, al menos un dato de contacto, actividad y
  localidad para habilitar su perfil, sin presentar documentación de respaldo ni pasar por
  verificación documental en el MVP.
- **FR-021**: Una empresa DEBE poder crear, guardar y editar borradores de ofertas con título,
  tareas, categorías, cantidad de vacantes, ubicación, modalidad, horario, tipo de contratación,
  requisitos y fecha de cierre; salario y beneficios PUEDEN informarse de manera opcional. Al
  finalizar la fecha de cierre de una oferta publicada —a las 00:00 del día siguiente en la zona
  `America/Buenos_Aires`—, el sistema DEBE cerrarla automáticamente y registrar el cambio con actor
  de sistema y fecha.
- **FR-022**: Una empresa DEBE enviar una oferta a revisión municipal y consultar su estado, pero no
  DEBE poder publicarla directamente.
- **FR-023**: Un administrador DEBE poder aprobar, solicitar correcciones, rechazar, pausar, cerrar o
  cancelar una oferta, registrando la decisión y su responsable. Cancelar DEBE cerrar en la misma
  operación como `cancelled` todas sus participaciones no finales y revocar los accesos empresariales
  afectados; los resultados finales preexistentes y el historial DEBEN conservarse. Solicitar
  correcciones o rechazar DEBE incluir una explicación accionable visible a la empresa; el rechazo
  también exige un motivo interno. Pausa, cierre administrativo y cancelación DEBEN registrar motivo
  interno, pero la empresa solo ve el estado. Aprobación y reanudación DEBEN registrar actor, fecha y
  estados anterior/nuevo sin exigir motivo. El cierre automático DEBE registrar un código de sistema
  y no un motivo humano. Los motivos internos NO DEBEN mostrarse a la empresa.
- **FR-024**: Solo las ofertas aprobadas, publicadas y no vencidas DEBEN ser visibles públicamente y
  aceptar nuevas postulaciones. La vista pública DEBE mostrar exactamente el nombre de la empresa,
  título, tareas, categorías, cantidad de vacantes, ubicación, modalidad, horario, tipo de
  contratación, requisitos y fecha de cierre, además de salario y beneficios solo cuando la empresa
  los haya informado. NO DEBE mostrar CUIT, persona responsable, contactos privados de la empresa,
  candidatos, participaciones ni resultados individuales. El cierre automático NO DEBE cerrar ni
  eliminar las participaciones existentes, que continúan disponibles para gestión administrativa.
- **FR-024A**: Cada oferta DEBE recibir un slug público único al publicarse por primera vez,
  formado por su título normalizado y un sufijo aleatorio. El slug NO DEBE cambiar al editar el
  título ni en transiciones posteriores. Los enlaces públicos y el enlace hacia la selección de
  oferta del candidato DEBEN usar ese slug, conservando UUID como identidad interna. Las ofertas
  ya publicadas DEBEN recibir slug sin eliminar datos. No se exige conservar las URLs públicas
  anteriores basadas en UUID. Las reglas de visibilidad de FR-024 siguen aplicándose. Cambio
  autorizado por Máximo el 2026-10-17; trazabilidad en EXTRA-020.
- **FR-024B**: A07, continuación solicitada por Mateo el 2026-10-19: el listado
  público DEBE permitir combinar texto, rubro, localidad y modalidad. Texto busca
  literalmente en título/tareas/requisitos sin distinguir mayúsculas; localidad
  y modalidad coinciden completas sin mayúsculas/espacios exteriores; rubro usa
  código del catálogo activo actual. Tildes se conservan. Filtros se aplican
  antes de contar/paginar y se conservan en URL y paginación; nueva búsqueda
  comienza en página uno y limpiar restablece el listado. Solo ofertas y opciones
  actualmente públicas según FR-024; no se revelan datos de ofertas ocultas.
  Entrada inválida muestra error español sin ejecutar búsqueda ampliada. No se
  cambia el catálogo municipal pendiente de A08 ni los slugs de FR-024A.
- **FR-025**: Los administradores DEBEN poder suspender o reactivar empresas y ofertas abusivas,
  engañosas, ilegales, duplicadas o inapropiadas, conservando su historial. La suspensión de una
  empresa DEBE impedir nuevas postulaciones y derivaciones en sus ofertas y revocar su
  acceso a perfiles y CV ya derivados; esa revocación NO DEBE revertirse automáticamente. La
  reactivación de la cuenta empresarial DEBE dejar su perfil en `incomplete`, pero NO DEBE reactivar
  sus ofertas, participaciones ni permisos empresariales anteriores. Suspender una cuenta empresarial o una
  oferta DEBE exigir motivo interno; la empresa solo ve el estado suspendido, no ese motivo. La
  reactivación DEBE conservar su motivo interno e historial, sin revelar razones sensibles.
- **FR-026**: La empresa DEBE ver exclusivamente sus propios perfiles, ofertas, estados de
  moderación y candidatos derivados a una oferta propia.

#### Postulaciones, preselección y derivación

- **FR-030**: Un candidato autenticado con el perfil y CV exigidos DEBE poder postularse a múltiples
  ofertas publicadas, con un seguimiento independiente por oferta.
  Puede usar el CV general o cargar uno específico; la selección se fija al crear
  la participación y se conserva aunque reemplace el general. Los casos anteriores
  y nominaciones sin selección usan el CV general vigente al derivar.
- **FR-031**: Un administrador DEBE poder asociar y derivar a un candidato activo con una
  oportunidad aunque no exista una postulación previa, siempre que su consentimiento general
  continúe vigente; no se requiere una confirmación específica de interés para cada oferta.
- **FR-032**: Los administradores DEBEN poder buscar y filtrar candidatos por categorías,
  habilidades, disponibilidad, ubicación y vigencia del perfil.
- **FR-033**: Los administradores DEBEN poder registrar preentrevistas, contactos, notas internas,
  evaluaciones y decisiones de preselección.
- **FR-034**: Solo un administrador DEBE poder decidir y registrar la derivación de un candidato a
  una empresa para una oferta concreta; un perfil asistido NO DEBE poder derivarse hasta que cuente
  con un CV PDF válido.
- **FR-035**: Una empresa NO DEBE poder explorar el padrón general ni ver información completa de un
  candidato antes de una derivación municipal a una oferta propia.
- **FR-036**: Tras una derivación, la empresa DEBE ver el perfil laboral, todos los contactos
  vigentes del candidato y la versión del CV asociada a esa derivación; los contactos se comparten
  automáticamente y reemplazar el CV solo afecta derivaciones posteriores. La empresa NO DEBE ver
  su DNI, domicilio ni notas internas. El acceso DEBE revocarse inmediatamente si el resultado final
  es no selección, cancelación o falta de respuesta empresarial. Si un administrador confirma una
  contratación (normal o tardía), DEBE cambiarse la disponibilidad a No disponible
  atómicamente con resultado/auditoría, conservando consentimiento e historial
  (EXTRA094). Las demás participaciones y permisos no cambian por ese hecho.
  La empresa contratante conserva únicamente un permiso todavía activo hasta30 días
  exactos (720 horas) desde la confirmación, sujeto al consentimiento vigente y a la ausencia de
  suspensión o archivo de cuentas y registros relacionados. Al cumplirse el plazo DEBEN denegarse
  de inmediato nuevas consultas y descargas y quedar registrada la expiración; nunca se repone un
  permiso revocado. Este plazo solo limita el acceso empresarial y NO define la retención o purga
  de datos pendiente en OQ-001. La indisponibilidad laboral o la necesidad de actualizar el
  perfil NO DEBEN revocar por sí solas el acceso de una contratación confirmada. La revocación
  inmediata DEBE impedir nuevas consultas y descargas desde el portal, sin caché privada compartida
  ni enlaces de CV reutilizables. No puede recuperar respuestas previamente recibidas ni archivos
  ya descargados por terceros; ese límite no equivale a una política de retención aprobada.
- **FR-037**: La progresión de cada participación DEBE distinguir recepción, revisión,
  preentrevista, preselección, derivación, entrevista empresarial y los resultados finales
  aprobados. Un administrador PUEDE omitir revisión, preentrevista o preselección al avanzar, siempre
  que respete el orden de las etapas realizadas y registre el motivo de cada salto. La derivación
  DEBE ser siempre explícita, solo administrativa y anterior a cualquier acceso empresarial a los
  datos del candidato.
- **FR-038**: Los resultados finales DEBEN distinguir contratación, no selección, retiro,
  cancelación y cierre por falta de respuesta empresarial. El retiro, la no selección, la
  cancelación y la falta de respuesta DEBEN revocar inmediatamente el acceso empresarial a los
  datos derivados. La contratación confirmada conserva el consentimiento global
  y cambia disponibilidad a No disponible según FR-036, sin cerrar otros casos;
  una aceptación afirmativa posterior nunca revive permisos revocados. El candidato DEBE poder retirar cualquier
  participación propia todavía abierta, sea
  postulación o nominación administrativa. Un administrador solo DEBE registrar un retiro a pedido
  del candidato; PUEDE cancelar una participación individual abierta con motivo operativo, sin
  cancelar la oferta ni alterar otras participaciones. Cancelar una oferta sigue cerrando todas sus
  participaciones abiertas conforme a FR-025; cada vía conserva el historial.
- **FR-039**: La empresa DEBE poder comunicar el resultado de una entrevista, pero solo un
  administrador DEBE poder confirmar el resultado final según esa comunicación; el retiro efectuado
  por el candidato es una excepción explícita. Si informa `not_selected`, DEBE indicar un motivo
  no vacío, según el PDF confirmado por Máximo
  (EXTRA-086). El informe queda pendiente de confirmación municipal; el detalle sigue siendo
  opcional para los demás resultados. No se completan motivos de informes históricos.
  Si la empresa informa `process_cancelled` para un
  candidato, la Oficina PUEDE cerrar solo esa participación como cancelada, sin cancelar la oferta.
  Después de revocado el acceso a los datos del candidato, una empresa activa solo DEBE conservar
  para ese feedback tardío el identificador de su derivación, el identificador y título de su propia
  oferta, la fecha de derivación y únicamente el nombre del candidato (EXTRA069).
  NO DEBE recuperar perfil, contactos, foto ni CV revocados. La empresa/cuenta
  deben estar activas y la oferta, participación y derivación no archivadas.
- **FR-040**: Cuando no exista respuesta empresarial, el caso DEBE permanecer pendiente durante 30
  días exactos (720 horas) contados desde el instante de la derivación y luego cerrarse
  automáticamente como sin respuesta empresarial,
  sin asignar contratación ni no selección. Entrevistas, contactos y seguimientos NO DEBEN pausar ni
  reiniciar el plazo. Si llega una respuesta posterior, un administrador DEBE poder cambiar el
  estado a `hired`, `not_selected` o `cancelled` usando como evidencia el feedback empresarial del
  portal o un contacto municipal registrado por teléfono, correo, WhatsApp o atención presencial,
  con fecha, canal, administrador y nota breve sin datos sensibles innecesarios. La presentación
  DEBE destacar el resultado final vigente y mostrar `no_company_response` como cierre automático
  anterior reemplazado por la corrección tardía, conservando ambas transiciones en el historial y
  sin reactivar el permiso empresarial revocado.
- **FR-041**: Un candidato no seleccionado DEBE poder continuar activo y participar en otras
  búsquedas.
- **FR-042 (Must, actualización autorizada 2026-10-27)**: El personal DEBE poder
  publicar enlaces informativos a cursos y registrar una derivación de un postulante
  a un curso, con fecha, cuenta responsable e historial independiente de las
  postulaciones y derivaciones laborales. Los enlaces publicados se pueden consultar
  públicamente; los antecedentes individuales quedan restringidos a administración.
  Las notas libres de orientación existentes se conservan como complemento, no como
  sustituto del registro estructurado. No se incluyen inscripciones, gestión académica
  ni recomendaciones automáticas de cursos. Máximo confirmó el requisito del PDF
  `Beex_Funes_Tech_Lab_Proyecto_Final.pdf`; sustituye el alcance anterior de nota libre.

#### Historial, contactos y privacidad

- **FR-050**: Cada cambio material de estado o acción administrativa DEBE conservar fecha, actor,
  estado anterior, estado nuevo y motivo cuando lo exija la regla aprobada. El conjunto auditable
  incluye aprovisionamiento, suspensión, reactivación y archivo/restauración de cuentas y registros;
  activación, corrección, disponibilidad y vinculación de perfiles; aceptación o retiro de
  consentimiento; incorporación o reemplazo de CV; decisiones de duplicados; envío y decisiones de
  moderación de ofertas; postulación o nominación, avance y salto de etapas, preentrevista,
  preselección, derivación y cambio de su permiso; entrevista, feedback y resultado final, incluido
  el cambio tardío; contactos/notas administrativas; confirmación y resultado de importación;
  descarga de métricas filtradas; cierres automáticos de ofertas o derivaciones; y vencimiento del
  acceso de 720 horas posterior a contratación. El actor `system` DEBE limitarse a estas acciones
  programadas. Rechazo, suspensión, cancelación, salto de etapa, restauración, resolución de
  duplicado y corrección tardía DEBEN conservar un motivo obligatorio. El mensaje accionable
  visible a la empresa DEBE permanecer separado del motivo interno; la auditoría NO DEBE copiar
  DNI, CUIT, contactos, notas, credenciales, tokens ni contenido de CV o filas CSV.
- **FR-051**: El personal DEBE poder registrar contactos por teléfono, correo, WhatsApp y atención
  presencial sin requerir integración directa con servicios de mensajería.
- **FR-052**: Los administradores DEBEN poder escribir notas internas sobre postulantes; esas notas y
  cualquier razón sensible DEBEN ser visibles solo para administradores.
- **FR-053**: El candidato DEBE ver la recepción y el resultado final de su participación, pero no
  las etapas internas de evaluación. La empresa DEBE ver el estado de moderación de sus propias
  ofertas y los candidatos derivados a ellas, así como la explicación accionable de una solicitud de
  corrección o rechazo, pero no las notas ni razones internas de moderación o suspensión.
- **FR-054**: Los registros de negocio DEBEN archivarse o desactivarse de forma recuperable y NO
  DEBEN eliminarse permanentemente de manera automática mientras la Municipalidad no apruebe una
  política de retención. Candidatos y empresas NO DEBEN archivar/eliminar sus propias cuentas
  o perfiles por autoservicio. Se conserva el archivo empresarial exclusivo de
  administrador activo, con motivo y confirmación, sin añadir archivo administrativo candidato.
  El archivo empresarial DEBE marcar sus ofertas no finales
  como archivadas de forma recuperable, sin crear un estado alternativo de desactivación, bloquear el
  acceso empresarial y revocar los permisos de derivación, sin borrar historial ni alterar
  resultados finales. Solo un administrador DEBE poder restaurar un registro
  archivado, registrando el motivo; el registro restaurado DEBE quedar en un estado seguro para
  revisión: perfil candidato en `draft`, cuenta empresarial en `active`, perfil empresarial en
  `incomplete` y oferta en `draft`. Restaurar un registro archivado es una operación distinta de
  reactivar una cuenta suspendida y NO DEBE reactivar automáticamente ofertas, accesos empresariales
  ni participaciones relacionadas.
- **FR-055**: Al activar un perfil de candidato, incluido un perfil asistido, el sistema DEBE
  presentar y registrar el consentimiento aprobado para el tratamiento laboral de sus datos y su
  entrega en futuras derivaciones municipales; no se requiere una aceptación adicional para cada
  derivación mientras ese consentimiento continúe vigente. Retirar el consentimiento DEBE impedir
  nuevos tratamientos y derivaciones dependientes de él, revocar inmediatamente el acceso
  empresarial vigente al perfil, los contactos y el CV y conservar el historial administrativo sin
  restaurar ese acceso automáticamente. En la misma operación DEBE cerrar como `withdrawn`, con
  motivo `consent_withdrawn`, todas las participaciones todavía abiertas de ese candidato; las que
  ya tengan resultado final conservan ese resultado. Una aceptación posterior NO DEBE reabrir
  participaciones ni permisos revocados.
- **FR-056**: Los errores y rechazos DEBEN comunicarse en español de forma accionable sin revelar
  credenciales, datos personales, notas internas ni detalles operativos sensibles.
- **FR-057 (retirado por EXTRA109, Mateo, 29/10/2026)**: Se quitan las plantillas
  de mensajes para el personal; se conserva el registro de contactos de FR-051.
  No se agrega envío automático ni se elimina el historial existente.

#### Importación y reportes

- **FR-060**: Los administradores DEBEN poder importar candidatos desde un CSV construido según un
  mapeo escrito y aprobado del archivo histórico.
- **FR-061**: Antes de confirmar una importación, el sistema DEBE mostrar una previsualización con
  filas aceptables, errores de validación, categorías sin mapear y posibles duplicados.
- **FR-062**: Una importación confirmada DEBE completarse íntegramente o dejar un resultado
  explícitamente recuperable; nunca DEBE ocultar escrituras parciales. Si falla, el lote DEBE
  quedar identificado como fallido sin altas o cambios parciales; el administrador DEBE poder
  consultar el error sanitizado, corregir el archivo o las decisiones y volver a cargarlo para
  obtener una nueva previsualización antes de una nueva confirmación. El intento anterior y el nuevo
  DEBEN conservarse separados y vinculados para trazabilidad; no habrá reintento automático ni se
  reutilizará un archivo temporal ya descartado.
- **FR-063**: Cada importación DEBE conservar el responsable, la fecha, el archivo o referencia de
  origen, el resultado y un resumen de filas aceptadas, rechazadas y observadas.
- **FR-064**: Los administradores DEBEN poder consultar conteos de candidatos activos, empresas,
  ofertas por estado, postulaciones, preentrevistas, derivaciones, contrataciones, no selecciones y
  retiros, filtrados al menos por período y por categoría cuando corresponda. Candidatos activos,
  empresas y ofertas por estado DEBEN contarse según su estado al cierre del período seleccionado;
  postulaciones, preentrevistas, derivaciones y resultados DEBEN contarse por la fecha de su evento
  dentro del período. El filtro de categoría DEBE usar la categoría del candidato para candidatos y
  la de la oferta para ofertas y casos; las empresas NO DEBEN filtrarse por categoría. Para estas métricas,
  un candidato activo DEBE tener el perfil activo, estar disponible, mantener consentimiento vigente
  y haber confirmado o actualizado su perfil durante los últimos seis meses.
- **FR-065**: Los administradores DEBEN poder exportar a CSV únicamente el resumen de métricas
  visibles con los mismos filtros de período y categoría aplicados al panel. Cada fila DEBE
  identificar el período, la categoría cuando corresponda, el indicador, el valor, su unidad y si
  está calculado o pendiente; los tiempos de primera contratación y cobertura total solo aparecen
  con valor cuando se puedan calcular. Para esos dos indicadores, cada fila DEBE identificar el
  código y título de la oferta correspondiente. El archivo NO DEBE incluir listados operativos ni
  registros individuales de candidatos, empresas o participaciones, ni DNI, contactos, CV, notas o
  motivos internos.
  La exportación NO DEBE estar disponible públicamente ni para candidatos o empresas; la descarga
  DEBE dejar trazabilidad del administrador, fecha y filtros, sin guardar el contenido exportado en
  la auditoría.
- **FR-066**: Los formatos oficiales adicionales de informes NO DEBEN considerarse definidos hasta
  que la Oficina de Empleo o la Municipalidad entregue y apruebe sus requisitos.
- **FR-067 (Should)**: Las métricas DEBERÍAN incluir tendencias por categoría y dos tiempos por
  oferta: días desde su publicación hasta la primera contratación confirmada por un administrador y
  días desde su publicación hasta que las contrataciones confirmadas igualen la cantidad de vacantes
  solicitadas. La cobertura total DEBE permanecer pendiente o no calculable mientras no se complete
  ese número de contrataciones. Para estos dos tiempos, el filtro de período DEBE seleccionar las
  ofertas publicadas dentro del intervalo, aunque sus contrataciones se confirmen después; el
  filtro de categoría se aplica a la categoría de la oferta.

#### Experiencia y protección transversal

- **FR-070**: Todos los flujos principales DEBEN poder completarse en interfaces responsive, con
  teclado y con etiquetas, instrucciones, validaciones, estados vacíos y errores claros en español.
  Formularios, tablas, filtros, diálogos de confirmación y acciones de atención presencial asistida
  DEBEN conservar orden y foco visibles, controles operables sin mouse, mensajes asociados a los
  campos pertinentes y estados de carga comprensibles. Una búsqueda administrativa sin candidatos
  DEBE indicar que no hubo resultados para esos filtros; una oferta sin postulaciones DEBE mostrar
  ese estado sin simular participaciones; las métricas sin datos DEBEN distinguir cero de valor no
  calculable; y una importación sin filas válidas DEBE explicar el bloqueo y no ofrecer confirmación.
- **FR-071**: Las acciones privadas DEBEN rechazar accesos no autorizados sin depender únicamente de
  que un control visual esté oculto.
- **FR-072**: Los archivos cargados DEBEN validarse antes de ser aceptados y NO DEBEN poder ejecutarse
  como parte del producto.
- **FR-073**: Los datos usados en desarrollo, pruebas, demostraciones y capturas DEBEN ser ficticios o
  estar correctamente anonimizados.

### Key Entities *(include if feature involves data)*

- **Cuenta**: Identidad individual de acceso para candidato, representante de empresa o
  administrador, con rol, estado de acceso y referencias de recuperación; el autorregistro de
  candidatos y empresas utiliza correo verificado y contraseña.
- **Perfil de candidato**: Información laboral estructurada, categorías, habilidades,
  disponibilidad, localidad, vigencia, origen autogestionado o asistido y relación con su CV; se
  completa desde el panel personal después del registro inicial.
- **CV**: Documento laboral protegido y versionado, con vigencia, validaciones y relación con el
  candidato; cada derivación conserva la versión que habilita para la empresa correspondiente.
- **Perfil de empresa**: Organización identificada por nombre y CUIT, con persona responsable,
  contacto, actividad y localidad; no implica verificación documental en el MVP.
- **Categoría u ocupación**: Entrada del catálogo controlado utilizada para clasificar candidatos y
  ofertas, cuya versión final requiere validación de la Oficina de Empleo.
- **Oferta laboral**: Necesidad de contratación con título, tareas, categorías, vacantes, ubicación,
  modalidad, horario, tipo de contratación, requisitos y fecha de cierre; pertenece a una empresa y
  está sujeta a moderación, publicación, pausa, cierre municipal y cierre automático por vencimiento.
- **Postulación o participación**: Relación entre candidato y oferta, iniciada por el candidato o por
  una asociación administrativa autorizada, con estado e historial propios.
- **Preentrevista y preselección**: Evaluación municipal previa a cualquier entrega de datos a una
  empresa, con notas y decisión interna.
- **Derivación**: Autorización municipal que vincula un candidato con una oferta y habilita a la
  empresa correspondiente a consultar su perfil laboral, todos sus contactos vigentes y la versión
  de CV asociada a esa derivación, excluyendo DNI, domicilio y notas internas.
  El retiro posterior de la postulación o del consentimiento general revoca inmediatamente ese
  acceso sin borrar el historial administrativo ni permitir su restauración automática. La no
  selección, cancelación o falta de respuesta también lo revocan. Una nueva contratación confirmada
  conserva el consentimiento y cambia disponibilidad, sin alterar otros casos o
  permisos ajenos. La ventana720h de FR-036 solo conserva un permiso propio activo,
  nunca restaura uno revocado; EXTRA094 sustituye el retiro automático de EXTRA035.
  Ese límite de acceso no define cuánto tiempo se conservan perfil, CV o historial.
- **Entrevista y resultado**: Información comunicada por la empresa o recabada por el personal; solo
  un administrador confirma el resultado comunicado por la empresa, con excepción del retiro
  directo del candidato o asistido a su pedido.
- **Evento de contacto**: Registro de una comunicación telefónica, por correo, WhatsApp o presencial
  asociada a un caso y a su responsable.
- **Evento de historial o auditoría**: Evidencia inalterada de una acción o transición material, con
  actor, fecha, estado anterior, estado nuevo y motivo cuando corresponda.
- **Lote de importación**: Operación controlada sobre un CSV, con mapeo, previsualización,
  validaciones, duplicados, resultado y responsable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En 10 ejecuciones de aceptación realizadas por al menos 5 personas distintas como
  candidatos, con datos ficticios preparados y conexión estable, al menos 9 DEBEN registrarse,
  completar un perfil válido y postularse a una oferta publicada en menos de 10 minutos sin ayuda
  técnica. El cronómetro comienza al abrir el formulario de registro y termina al confirmarse la
  postulación. Se permiten reinicios dentro de una ejecución, pero el cronómetro nunca se reinicia;
  la ejecución solo aprueba si la postulación queda confirmada dentro del plazo total. El criterio
  de primer intento de SC-010 es independiente.
- **SC-002**: En 10 ejecuciones de aceptación realizadas por al menos 5 personas distintas como
  representantes de empresas, con datos ficticios preparados y conexión estable, al menos 9 DEBEN
  registrar su organización, preparar una oferta completa y enviarla a revisión en menos de 10
  minutos sin ayuda técnica. El cronómetro comienza al abrir el formulario de registro y termina al
  confirmarse el envío de la oferta. Se permiten reinicios dentro de una ejecución, pero el
  cronómetro nunca se reinicia; la ejecución solo aprueba si el envío queda confirmado dentro del
  plazo total. El criterio de primer intento de SC-010 es independiente.
- **SC-003**: Sobre un conjunto reproducible de 500 candidatos, 50 empresas, 100 ofertas y 1.000
  participaciones ficticias, un único administrador de prueba, sin capacitación ni práctica previa
  y habiendo recibido solamente la descripción de la tarea, DEBE localizar candidatos mediante los
  filtros definidos, registrar una preentrevista y guardar una preselección en menos de 5 minutos.
  La medición DEBE realizarse en el mismo entorno de demostración, con el conjunto ficticio
  restablecido, conexión estable, sin recorridos de calentamiento y registrando las condiciones de
  ejecución. El cronómetro comienza al abrir la pantalla de búsqueda y termina al confirmarse la
  preselección.
- **SC-004**: El 100 % de las ofertas no aprobadas permanece fuera de la consulta pública y no acepta
  postulaciones durante las pruebas de permisos.
- **SC-005**: El 100 % de los intentos de una empresa por consultar el padrón general, otra empresa o
  candidatos no derivados es rechazado sin exponer información personal.
- **SC-006**: El 100 % de las clases de acción enumeradas en FR-050 DEBE superar una prueba con
  fixtures ficticios que compruebe entidad, acción, actor individual o `system` autorizado, fecha,
  estado anterior/nuevo cuando corresponda, motivo obligatorio y metadatos sin datos personales.
  Para las transiciones que cambian entidad y acceso, una falla forzada al escribir el evento DEBE
  dejar ambos sin cambio; los roles de aplicación NO DEBEN poder actualizar o eliminar eventos ya
  registrados. Cada clase se considera aprobada solo si cumple estas verificaciones aplicables.
- **SC-007**: En archivos de prueba, el 100 % de filas CSV inválidas o potencialmente duplicadas se
  identifica antes de confirmar, y ningún fallo de importación deja datos parciales ocultos.
- **SC-008**: Sobre el mismo conjunto reproducible, un único administrador de prueba, sin
  capacitación ni práctica previa y habiendo recibido solamente la descripción de la tarea, DEBE
  obtener los conteos operativos básicos y completar una exportación filtrada en menos de 30
  segundos. La medición DEBE utilizar el mismo entorno de demostración y las mismas condiciones
  definidas en SC-003, con el conjunto ficticio restablecido antes de comenzar. El cronómetro
  comienza al aplicar los filtros de período y categoría y termina cuando los conteos están visibles
  y la descarga finalizó.
- **SC-008A**: En el entorno de demostración con el conjunto ficticio de SC-003, las búsquedas,
  filtros y listados administrativos DEBEN responder en hasta 3 segundos; la descarga autorizada de
  un CV válido de hasta 5 MiB DEBE completarse en hasta 10 segundos con conexión estable; la
  previsualización de un CSV sintético de 1.000 filas DEBE completarse en hasta 30 segundos y su
  confirmación válida en hasta 60 segundos. Cuatro sesiones administrativas concurrentes DEBEN
  completar, sobre registros ficticios distintos, la moderación de una oferta, el guardado de una
  preselección, el registro de un contacto y la confirmación de un resultado en hasta 5 segundos por
  operación, salvo importación/exportación, sin estados parciales ni pérdida de auditoría. Cada caso
  se mide una vez después de un restablecimiento separado y sin calentamiento; no se promedian
  resultados y cualquier exceso incumple el criterio. Los casos de lectura son: buscar candidatos
  con el término ficticio y los filtros de categoría/disponibilidad fijados por el fixture; filtrar
  ofertas por estado y cambiar a la página fijada; y filtrar empresas por estado y cambiar a la
  página fijada. El fixture versionado DEBE registrar entradas y conteos esperados para los tres. El
  cronómetro va desde enviar la consulta, aplicar el filtro o cambiar de página hasta mostrar filas y
  conteo o paginación actualizados sin indicador de carga; para CV, desde solicitar la descarga hasta
  recibir el archivo completo; para CSV, desde enviar el archivo hasta mostrar el resumen de las
  1.000 filas y desde confirmar hasta mostrar el lote terminal con sus conteos. En concurrencia, las
  cuatro acciones comienzan mediante una barrera común, terminan al mostrar su confirmación y luego
  se comprueba que las cuatro mutaciones y sus eventos de auditoría quedaron completos. Las pruebas
  de carga por encima de cuatro administradores y los SLA productivos quedan excluidos hasta resolver
  OQ-006.
- **SC-009**: Los recorridos críticos de candidato, empresa y administración DEBEN completarse en
  tamaños de 360×800 y 1366×768, con zoom de 100 % y 200 %, usando únicamente teclado, foco visible y
  sin bloqueos, con todos los controles, validaciones y mensajes disponibles. Además, al menos un
  recorrido representativo de cada rol DEBE verificarse con NVDA.
- **SC-010**: Usuarios de prueba representativos DEBEN completar al menos 4 de estas 5 tareas en el
  primer intento: completar un perfil de candidato y postularse; crear y enviar una oferta; moderar
  una oferta; buscar, preseleccionar y derivar un candidato; y registrar el resultado final. Primer
  intento significa completar la tarea sin ayuda externa ni reiniciarla; corregir un error usando
  únicamente los mensajes de la interfaz continúa siendo parte del mismo intento. Todo error DEBE
  presentar un mensaje claro en español que permita corregirlo. La evaluación DEBE incluir cohortes
  separadas de al menos cinco candidatos, cinco representantes de empresas y los cuatro
  administradores previstos o personal municipal equivalente. Cada participante DEBE realizar
  únicamente las tareas correspondientes a su rol. Un tipo de tarea se considera aprobado cuando
  al menos el 80 % de su cohorte lo completa en el primer intento, y SC-010 se considera cumplido
  cuando aprueban al menos cuatro de los cinco tipos de tarea.

## Assumptions

- El MVP está destinado inicialmente a cuatro empleados de la Oficina de Empleo con iguales
  permisos administrativos y cuentas individuales.
- La demostración y las pruebas utilizan únicamente información ficticia o anonimizada; incorporar
  datos municipales reales requiere autorizaciones y políticas todavía pendientes.
- La verificación documental de empresas, el ranking automático, la inteligencia artificial de
  emparejamiento, la integración directa con WhatsApp, el constructor completo de CV, las
  recomendaciones automáticas de cursos, los roles administrativos adicionales y la analítica
  pública avanzada permanecen fuera del MVP.
- Los tiempos de los criterios de éxito se medirán con usuarios de prueba, datos ficticios preparados
  y una conexión estable según el protocolo indicado en cada criterio; no establecen acuerdos de
  disponibilidad productiva.
- La asociación administrativa de un candidato con una oportunidad no equivale por sí sola a una
  derivación: la Oficina de Empleo conserva la decisión, pero puede derivarlo sin una confirmación
  específica por oferta mientras el perfil esté activo y su consentimiento general siga vigente.
- Las posiciones seguras de `docs/discovery/OPEN_QUESTIONS.md` limitan riesgos mientras se decide,
  pero no representan aprobación del stakeholder ni pueden convertirse en reglas definitivas sin
  aclaración.

## Scope Boundaries

### Included in this MVP

- Acceso por roles y recuperación de cuenta.
- Gestión autogestionada y asistida de candidatos, CV, categorías y disponibilidad.
- Perfiles de empresa y ciclo completo de ofertas con moderación municipal.
- Postulaciones, búsqueda, preentrevista, preselección, derivación, entrevistas, resultados y
  seguimiento.
- Historial de estados, auditoría, contactos y tratamiento recuperable de registros.
- Importación controlada desde CSV, métricas administrativas básicas y exportación CSV.

### Explicitly excluded

- Navegación empresarial del padrón general o contacto no mediado con candidatos.
- Verificación documental de empresas.
- Ranking, selección o emparejamiento automático mediante inteligencia artificial.
- Integración directa con servicios de mensajería.
- Constructor completo de CV y recomendaciones automáticas de capacitación.
- Roles administrativos adicionales, analítica pública avanzada y formatos oficiales de reportes no
  suministrados.

## Open Questions and Validation Dependencies

Las siguientes decisiones continúan abiertas por depender de definiciones legales, material
municipal o decisiones propias de `$speckit-plan`. Esta especificación no adopta como aprobada
ninguna posición temporal; la planificación puede tratarlas como dependencias explícitas, pero no
pueden cerrarse ni implementarse definitivamente hasta que responda el responsable indicado.

| ID | Decisión pendiente | Límite seguro aplicado al borrador | Responsable | Etapa bloqueada | Evidencia para cerrar |
| --- | --- | --- | --- | --- | --- |
| OQ-001 | Plazos de retención de perfiles, CV, contactos y auditoría | Archivar; no eliminar permanentemente de forma automática | Municipalidad / responsable legal o de datos | Uso de datos reales, producción y cualquier purga/TTL | Política y aprobación escrita rastreable del responsable |
| OQ-005 | Formatos oficiales de reportes | Limitar el MVP a métricas internas y CSV genérico | Oficina de Empleo | Informes oficiales adicionales; no bloquea métricas/CSV del demo | Ejemplo de formato y aprobación escrita rastreable |
| OQ-006 | Hosting productivo y responsables operativos | No definir producción; la demostración no resuelve operación municipal | Beex / Municipalidad | Configuración y despliegue productivo | Plan operativo escrito con hosting, responsables, región, backups, incidentes y SMTP |
| OQ-010 | Catálogo final de categorías y ocupaciones | Modelo versionable y multiselección; fixtures ficticios sin declararlos oficiales | Oficina de Empleo | Seed final y aceptación del catálogo municipal | Archivo canónico versionado y aprobación escrita rastreable |
| OQ-017 | Tamaño y formatos de archivo aceptados | EXTRA096: PDF/JPG/JPEG/PNG, máximo5 MiB y normalización a PDF para demo | Plan técnico / Municipalidad | Uso de CV reales y aceptación municipal de límites de archivo | Ratificación escrita rastreable de formatos y tamaño |
| OQ-018 | Mapeo completo del Excel histórico | No inferir columnas; bloquear importador definitivo | Oficina de Empleo | Implementación/aceptación definitiva del importador histórico | Muestra anonimizada, mapeo versionado y aprobación escrita rastreable |

La evidencia escrita puede ser un PR, issue, acta, correo o mensaje incorporado al repositorio; no
requiere un documento formal separado, pero debe identificar decisión, responsable y fecha. Los
límites técnicos de demo —incluidos 5 MiB, Vercel/Supabase de demostración y datos ficticios— no son
aprobaciones municipales ni cierran las OQ.

Además, la validación del MVP depende de recibir una muestra anonimizada de la planilla, el catálogo
actual, ejemplos anonimizados de pedidos y reportes, confirmación del aprovisionamiento de las cuatro
cuentas administrativas y requisitos municipales de identidad visual y accesibilidad.
