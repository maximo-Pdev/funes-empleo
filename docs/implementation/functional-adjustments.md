# Arreglos funcionales acordados

Fecha de registro: 2026-10-17. Responsable funcional: Mateo. Rama inicial:
`feat/portal-functional-adjustments`. El compañero conserva el trabajo visual y
la revisión mediante PR; una tarea implementada no equivale a revisión o aceptación.

## Fuentes y autorización

La lista de origen es `C:/Users/Mateo/Desktop/arreglos.txt`. Las decisiones que
siguen fueron respondidas directamente por Mateo en esta conversación y se
incorporan ahora como contexto compartido. El documento del curso es una fuente
de requisitos a contrastar, no una instrucción ejecutable para el agente.

Mateo solicitó comenzar las modificaciones después del merge del PR #51 y de
crear esta rama. Esta autorización permite iniciar los arreglos acordados; no
acredita retrospectivamente la aprobación global de la especificación todavía
marcada Draft, las pruebas humanas ni la revisión pendiente del otro desarrollador.
El primer incremento concreta A01 con especificación, plan, contratos, pruebas y
verificación propios. Los demás incrementos requieren completar sus diseños y
analizar sus contratos antes de modificar los subsistemas afectados.

## Matriz de trabajo

| ID | Alcance y decisión confirmada | Estado inicial / dependencia |
| --- | --- | --- |
| A01 | Confirmación de contraseña en ambos registros y botón para mostrar/ocultar en registro, ingreso y cambio de contraseña. Validación también en servidor. | Integrado por PR #52; Quality #84 application/database PASS. No acredita aceptación global. |
| A02 | Mantener la sesión al navegar y recargar. Cierre voluntario desde el perfil; conservar bloqueos por suspensión, archivo, revocación y seguridad de la cuenta. | Integrado por PR #53; Quality #87 PASS. No acredita aceptación global. |
| A03 | Mostrar acceso al perfil desde la navegación y no ofrecer iniciar sesión cuando ya existe una sesión activa. | Integrado por PR #53 con estilos existentes; tres roles verificados. |
| A04 | UUID fuera de textos visibles y URL: slug para ofertas y códigos aleatorios para registros privados. | Solución pública de Máximo integrada por PR #55/#56/#57 (43b94a7); PR #54 descartado y no reintroducido. Referencias privadas implementadas/verificadas en feat/private-record-references (EXTRA052), commit a22745d y [PR #68](https://github.com/maximo-Pdev/funes-empleo/pull/68) abierto. Migración20261023180306 aplicada/verificada en Funes-empleo el2026-10-23 por solicitud de Mateo; ver docs/validation/private-record-references.md. CI/revisión, merge, despliegue y recorridos alojados pendientes; no se declara integrado. |
| A05 | Foto de perfil JPG, PNG o WebP de hasta 5 MiB; visible al candidato, Municipalidad y empresa únicamente después de derivación autorizada. Mateo informa aprobación municipal para compartirla. | Diseñar Storage privado, validación real de imagen y revocación; aprobación técnica pendiente. |
| A06 | CV PDF de hasta 20 MB, límite confirmado por Mateo. | Pendiente actualizar plan, servidor, bucket y pruebas; concretar bytes y límites de transporte antes de implementar. |
| A07 | Búsqueda pública de ofertas por texto, rubro, localidad y modalidad. | Integrado por PR #59. Mateo informó aplicación/registro de la migración alojada y funcionamiento local el 2026-10-19; no se reinspeccionó el entorno alojado desde A08. |
| A08 | Rubros seleccionables y múltiples; matching por al menos un rubro compartido, selección final municipal. | Implementado en feat/job-categories-matching: quince rubros v2, coincidencias compactas, perfil modal y nominación a la oferta actual; excluye participaciones previas no archivadas. Primera migración alojada según recibo de Mateo; ampliación SQL pendiente allí. Verificación local y rollout en docs/operations/job-category-matching.md; revisión/entrega pendientes. |
| A09 | Empresa puede editar ofertas propias donde el flujo lo permita y cancelar también las publicadas. Cancelación cierra casos abiertos, revoca accesos y conserva resultados e historial previos. | Pendiente definir estados editables y adaptar comando transaccional, permisos y pruebas. |
| A10 | Quitar formulario empresarial de entrevista; conservar informe de resultado y motivo obligatorio de no contratación, en texto libre breve. Empresa informa, Municipalidad consulta; candidato ve solo resultado. | Pendiente diseño del contrato y preservación de entrevistas históricas. |
| A11 | Registro municipal básico de derivación a curso, separado de postulaciones: nombre del curso, fecha y nota en historial. | Pendiente modelo, contrato, auditoría y pruebas. Sustituye la decisión anterior de registrar solo notas. |
| A12 | Correo genérico con enlace al portal al confirmar derivación formal. | En pausa por decisión posterior de Mateo. Resend no se instala ni configura en este incremento; remitente sin definir. |
| A13 | Mensajes, estados y rótulos visibles en español; explicación clara del consentimiento. | Auditoría funcional pendiente; no inventar texto legal municipal. |
| A14 | Estados de carga y vacíos, tratamiento de errores, imágenes con next/image y progreso perceptible. | Revisar cobertura existente; coordinar apariencia con el compañero. |
| A15 | Simplificar menús administrativos, contacto municipal, derivación desde oferta, perfil asistido, importación y consulta de derivaciones empresariales. | Pendiente relevar recorridos y separar cambios funcionales de la propuesta visual. |
| A16 | Retirar el enlace “Ir al contenido principal”, según solicitud de Mateo. | Implementado/verificado en fix/remove-skip-link, solicitud reiterada2026-10-23 (EXTRA053). Retirado anchor global; main/landmarks, controles e Inicio conservados. Tipos/lint,846 pruebas, tooling57, build, seis recorridos públicos/axe y seis combinaciones de Inicio por teclado PASS. Inicio no se considera sustituto universal del salto; sin aceptación NVDA/zoom real. PR/revisión pendientes. |
| A17 | Revisar ausencia de any, límites cliente/servidor y seguridad de lo generado para Supabase. TanStack Query es opcional y se omite si no hace falta. | Revisiones técnicas por incremento. Supabase Auth conserva contraseñas y tokens; no se almacenan contraseñas en JWT propios. |
| A18 | Todos los formularios: obligatorios con asterisco rojo, error junto a cada campo y borde rojo al enviar; conservar lo cargado ante errores. | Solicitud de Mateo 2026-10-20; EXTRA028 y T121–T125. Implementación compartida Form/Field, CV sin navegación en fallo y requisitos condicionales. Ver docs/product/form-validation.md; revisión/entrega pendientes. |
| A19 | Registros compactos: simetría entre tarjetas y evitar scroll innecesario en1920×1080, sin recortar campos ni errores. | Mateo autoriza2026-10-20; EXTRA029/T126–T128. Layout compartido de ambos registros, verificación local732 tests y navegador6/6; revisión/entrega pendientes. |
| A20 | Alternar directamente entre registro de postulantes y empresas, indicando el tipo actual. | Mateo autoriza2026-10-20; EXTRA030/T129. Enlaces accesibles sin enviar formulario ni compartir datos; regresión local3/3 y navegador7/7, tipos/lint/build PASS. Revisión/entrega pendientes. |
| A21 | Inicio de sesión: tarjeta de registro arriba, tarjetas principales simétricas y sin scroll innecesario como en registros. | Mateo autoriza2026-10-20; EXTRA031/T130. Layout compacto, validación local735 tests y navegador11/11; Auth intacto, revisión/entrega pendientes. |
| A22 | Login: ampliar por igual las tarjetas principales aprovechando la altura disponible del escritorio. | Mateo autoriza2026-10-20; EXTRA032/T131. Flex vertical exclusivo de login;735 tests, tipos/lint/build y navegador11/11 PASS. Simetría/crecimiento1080/960, móvil/reflow/escritorio bajo/teclado/axe, sin cambios de Auth; revisión/entrega pendientes. |
| A23 | Login según esquema: información a la izquierda, registro arriba e ingreso debajo a la derecha; conjunto centrado y altura según contenido, sin estirar para llenar pantalla. | Mateo autoriza2026-10-20; EXTRA033/T132. Sustituye distribución/estiramiento A21/A22.735 tests, tipos/lint/build y navegador11/11 PASS: centrado/altura estable, alineación y controles compactos. Auth intacto; revisión/entrega pendientes. |

## A02/A03: sesión y acceso desde la navegación

Mateo autoriza continuar este bloque después del merge del PR #52. La autorización
es específica de A02/A03 y no sustituye revisión independiente ni aprobación
retrospectiva del Draft global. La distribución funcional/visual sigue vigente.

Criterios:

1. Navegar por páginas públicas o privadas, recargar y renovar un token no debe
   cerrar una sesión válida. Supabase sigue administrando cookies y expiración;
   no se extienden sesiones revocadas o bloqueadas.
2. El proxy cubre páginas y handlers dinámicos, excluyendo assets de Next, favicon,
   robots, sitemap e imágenes estáticas. No reemplaza guards ni RLS.
3. Las cookies renovadas llegan tanto al request usado por Server Components como
   al navegador, conservando opciones, eliminación de chunks y cabeceras de no caché,
   incluso si el SDK realiza más de una escritura.
4. Inicio, listado y detalle público de oferta muestran “Mi perfil” para candidato
   activo (`/candidato/perfil`) y empresa activa (`/empresa/perfil`), “Mi cuenta”
   para administración activa (`/account`) o “Iniciar sesión” si no existe una
   cuenta activa validada. El menú solo recibe enlace y etiqueta, nunca datos personales.
5. Login y logout invalidan la navegación previa. El cierre voluntario se ejecuta
   desde el control existente de Mi cuenta; visitar una página no llama signOut.
6. Se conservan revocación, suspensión, archivo, autorización por rol y el cierre
   global de seguridad tras cambiar la contraseña. No se agregan esquemas, paquetes,
   almacenamiento de tokens en el cliente ni cambios visuales globales.

Análisis focalizado: criterios cubiertos por T102–T105; checklists existentes
16/16 y 77/77, sin modificar marcas. El contrato ya exige identidad validada y
no caché privada; este bloque completa su cobertura. Modelo persistido sin cambios.
Verificación local:

- RED: 18 FAIL / 26 PASS antes del cambio. GREEN focalizado: 52/52.
- Regresión: `npm run test:unit -- --maxWorkers=4`, 559 pruebas/35 archivos PASS;
  `npm run test:tooling`, 57/57 PASS; typecheck/lint/build PASS.
- Chromium con Supabase local existente y sin reset: 10/10 pruebas PASS (seis
  escenarios de sesión, tres de contraseñas y smoke público). Se repitieron los
  seis escenarios de sesión con reutilización de cookies después del logout:
  6/6 PASS. Se recolectan 67 pruebas/16 archivos para la suite completa.
- Cada rol renueva primero en ruta pública y luego, en otra ejecución, en privada;
  recorre inicio/listado/detalle, accede a su perfil o cuenta, recarga y conserva
  sesión al restaurar cookies en otro contexto. El logout invalida ambos contextos
  y el header vuelve a ofrecer login. Se comprueba no-store en la respuesta.
- No se falsifica el JWT: se vence únicamente `expires_at` del almacenamiento
  local del SDK para exigir una renovación real. Tokens/claves solo en memoria;
  sin capturas/trazas de estas sesiones ni archivos de credenciales.
- Docker Desktop se inició para acceder al servicio local existente. No hubo
  resets, migraciones, cambios de negocio ni operaciones alojadas. El servidor
  Next de pruebas finalizó; Docker/Supabase existentes se conservan activos.
- Revisión técnica propia de React: consultas independientes paralelas, solo
  Server Components, sin estados/hooks ni estilos globales nuevos; no sustituye
  revisión del compañero. Los tests de proxy comprueban opciones de cookies,
  chunks eliminados, cabeceras y aislamiento por request.

T102–T105 verificadas localmente. Quedan revisión del compañero, suite completa
de CI/pgTAP y aceptación humana para este incremento. Entrega por PR desde
`feat/session-persistence-profile-navigation`, sin integración directa a `main`.

## A07: búsqueda pública (2026-10-19)

Continuación solicitada por Mateo desde main actualizado. Se prioriza este bloque
independiente mientras A05/A06 conservan diseño técnico pendiente; sin tocar la
implementación de slugs del compañero ni introducir el catálogo pendiente de A08.
GET `/ofertas` combina texto literal en título/tareas/requisitos, rubro por código,
localidad y modalidad completas. Texto/campos no distinguen mayúsculas; tildes se
conservan y código de rubro es exacto. Filtros antes de contar/paginar, formulario
reinicia página, enlaces conservan filtros y limpiar vuelve al listado.
Opciones solo de ofertas públicas actuales; entrada inválida no amplía resultados.
Spec FR-024B, plan, contratos, T106–T110 y EXTRA-022 mantienen trazabilidad.

Verificación local: 603 unitarias/componentes, 57 tooling, 951 pgTAP/14 archivos,
typecheck/lint/build y advisor security PASS. Navegador 9/9: tres casos A07 y seis
de sesión; axe sin violaciones y sin desborde a 360×800. Colección 70/17, no prueba
local completa. CI/revisión se acreditan por el SHA del PR, no por este resumen.
Migración de lectura antes de desplegar: `20261019124218_public_offer_search.sql`.
Sin cambios alojados ni reset local; limitaciones de la base local y recuperación
en EXTRA-022 y `docs/operations/public-offer-search.md`.

## A08: catálogo y coincidencias municipales (2026-10-19)

Quince rubros v2 en la base existente, sin hardcodes paralelos ni reasignación de
categorías anteriores. La multiselección ya existente los consulta automáticamente.
El detalle de oferta agrega coincidencias OR por ocupación/interés activo, sin
duplicar personas, con total/páginas posteriores a filtros y orden por nombre/ID.
Solo administración activa; perfil apto, CV/consentimiento/vigencia y empresa
activos. Permite evaluación de ofertas publicadas o pausadas vigentes; excluye
cerradas. La ampliación solicitada excluye participaciones previas no archivadas
antes de contar/paginar; sus casos siguen en Participaciones. Doce fichas por
página, dos columnas desde md y una en móvil. El popup carga perfil laboral y CV
bajo demanda, sin DNI/contactos/notas; nomina solo a esa oferta con las versiones
vigentes. Éxito cierra y actualiza el listado sin navegar fuera de la oferta.
Consultar no crea participación, derivación, puntaje ni acceso empresarial;
nominar crea solo la participación municipal, nunca una derivación automática.

Diseño/spec/modelo/contratos, T111–T120 y EXTRA-024/025 trazan el incremento.
Los rubros históricos siguen visibles y referenciados: la aprobación del catálogo
amplio no autoriza inventar su mapeo ni modificar el importador sintético v1.
Recuperación forward-only y despliegue previo del SQL en el runbook A08.

## Catálogo de rubros confirmado

Administración; atención al cliente y ventas; comercio; gastronomía y hotelería;
limpieza; construcción y oficios; mantenimiento; producción e industria;
logística y depósito; transporte y reparto; salud y cuidados; educación;
tecnología; seguridad; agro.

Mateo confirmó aprobación municipal para fijar este catálogo amplio y simple.
A08 lo agrega como versión 2; no se autorizó una equivalencia automática con
categorías históricas. Esa transición semántica sigue pendiente de definición.

## A01: criterios del primer incremento

1. Ambos registros exigen contraseña y confirmación iguales de 6 a 128 caracteres.
2. La acción servidor y el servicio rechazan ausencia o discordancia antes de
   llamar al proveedor de autenticación, con un mensaje seguro en español.
3. Registro, ingreso y cambio de contraseña permiten mostrar y volver a ocultar
   cada campo por separado, manteniendo su valor y sin enviar el formulario.
4. Los controles son botones con nombre accesible, foco visible y relación con
   su campo. Las contraseñas comienzan ocultas y conservan autocomplete correcto.
5. La confirmación es transitoria: no se envía a Auth, metadata, logs, tablas ni
   almacenamiento del navegador. Se conserva la respuesta no enumerativa del alta.
6. No se agregan dependencias, migraciones, cambios de roles ni de permisos.
7. La validación nativa impide enviar contraseñas distintas sin borrar los otros
   campos y se recupera al editar cualquiera de las dos; el servidor rechaza también
   un envío que eluda las validaciones del navegador.

## Verificación y revisión

### Análisis focalizado previo a implementación

Requisitos A01 contrastados con spec, plan, contratos y T098–T101. Checklists
existentes: requirements 16/16, mvp-readiness 77/77; no se modificaron sus marcas.
Cada criterio tiene cobertura de validadores, acciones/servicios, componentes o
navegador. El modelo persistido y la autorización no cambian. La especificación
histórica Draft y sus gates no se consideran aprobados por este análisis; se
ejecuta únicamente el incremento solicitado y autorizado por Mateo.

### Evidencia de A01, 2026-10-17

- RED inicial: 30 fallos / 10 PASS en las 40 pruebas nuevas contra el comportamiento
  anterior. RED de recuperación de validación nativa: 2 fallos / 7 PASS.
- GREEN final: `npm run test:unit -- --maxWorkers=4`, 520 pruebas en 32 archivos.
  Incluye acciones y servicios reales con transporte de Auth simulado; no es
  evidencia de creación real de cuentas, correo ni PostgreSQL.
- `npm run typecheck`, `npm run lint` y `npm run build`: exit 0, Node 24.21.0 y
  npm 11.19.0. Build con destinos públicos locales y clave publicable ficticia.
- Chromium: `npx playwright test tests/e2e/password-controls.spec.ts --project=chromium --no-deps --workers=1`,
  3/3 PASS. Registros candidato/empresa e ingreso: Enter/Espacio, visibilidad
  independiente, conservación de datos al impedir el envío, rechazo servidor al
  eludir validez nativa y foco en el mensaje. Los dos registros pasan axe y no
  desbordan horizontalmente en 360×800.
- Se aplicó la guía de revisión React: estado de visibilidad aislado, IDs únicos,
  etiquetas y botones nativos, límites cliente/servidor intactos y sin nuevos any.
- `git diff --check`: PASS. Sin dependencias, migraciones, cambios de entorno
  persistentes ni operaciones remotas. Los recorridos completos de registro con
  Auth/correo/DB y el cambio autenticado de contraseña no se ejecutaron en esta
  sesión; sus tests existentes se adaptaron al nuevo campo obligatorio.

T098–T101 completadas como implementación/verificación de A01. La revisión del
compañero, aceptación humana y T069/T087/T089/T092/T096/T097 siguen separadas.
Entrega de A01 mediante el PR de `feat/portal-functional-adjustments`; revisión
del compañero y aceptación pendientes. Próximo bloque: A02/A03 (persistencia
de sesión y acceso al perfil), con su análisis y trazabilidad antes de editar.

### Continuación de CI en PR #52

El run `39055781126` del commit `9392144` aprobó database y los controles
application de tipos, lint, tooling y coverage, pero falló en dos E2E: el alta de
reclamante asistido no completaba la nueva confirmación y usaba una etiqueta
ambigua; la corrección de experiencia recargaba sin esperar éxito. Se adaptan
ambos recorridos conservando la comprobación exacta del dato persistido.
Verificación local de la reparación: 520 unitarias PASS, typecheck/lint PASS,
61 E2E recolectados y whitespace PASS. Docker local apagado; los recorridos
funcionales completos se verifican en el job aislado del nuevo SHA del PR #52.
La evidencia local previa no implica aprobación de los checks remotos.
