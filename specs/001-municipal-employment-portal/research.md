# Investigación técnica: MVP del Portal Municipal de Empleo de Funes

**Fecha**: 2026-09-19  
**Alcance**: decisiones necesarias para completar el plan técnico; no modifica requisitos de producto.

## 1. Versiones reproducibles del stack

**Decisión**: usar Node.js 24.21.0 LTS con npm 11.19.0, Next.js 16.3.5, React/React DOM
19.3.0, TypeScript 6.0.3, Tailwind CSS y `@tailwindcss/postcss` 4.3.3, ESLint 9.39.5,
`eslint-config-next` 16.3.5, Supabase CLI 2.117.0 y `csv-parse` 7.0.2. Fijar dependencias directas y
commitear `package-lock.json`; CI instala con `npm ci`.

Corrección de implementación del 2026-09-22: la versión inicialmente prevista de ESLint 10.10.0
falló al cargar `react/display-name` por la retirada de `context.getFilename`. El paquete resuelto
`eslint-plugin-react` 7.37.5 declara peers hasta ESLint 9. Se verificó en npm y se fijó 9.39.5,
admitido por `eslint-config-next` 16.3.5 (`eslint >=9`). Se conserva el conjunto de reglas completo.
Limitación: npm marca ESLint 9.39.5 como no mantenido. Es una fijación temporal por compatibilidad;
se debe reevaluar al publicarse soporte de ESLint 10 en el plugin de React. No se silencia el aviso,
ni se interpreta un audit sin vulnerabilidades como garantía de seguridad futura.

**Fundamento**: respeta la capacitación, usa parches estables vigentes y evita variación entre
desarrolladores y CI. TypeScript 6.0.3 se prefiere temporalmente a 7.0.2 porque Next 16.3 todavía
integra el nuevo compilador mediante una vía experimental y se han reportado incompatibilidades en
`next build`.

**Alternativas consideradas**: TypeScript 7.0.2 se reevaluará cuando Next lo soporte sin flags ni
fallos conocidos; versiones canary quedan excluidas; rangos flexibles sin lockfile se descartan por
falta de reproducibilidad.

**Fuentes**: [Node 24](https://nodejs.org/en/download/archive/v24),
[Next.js 16.3](https://nextjs.org/blog/next-16-3),
[Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16),
[React 19.3](https://react.dev/blog/2026/09/09/react-19-3),
[TypeScript releases](https://github.com/microsoft/TypeScript/releases),
[integración TS 7 de Next](https://github.com/vercel/next.js/discussions/95633),
[Tailwind 4.3](https://tailwindcss.com/blog/tailwindcss-v4-3),
[Supabase CLI](https://www.npmjs.com/package/supabase),
[CSV Parse](https://www.npmjs.com/package/csv-parse).

## 2. Arquitectura de aplicación Next.js

### Complemento de dependencias auxiliares (2026-09-22)

Para materializar las herramientas ya elegidas se fijan `@types/node` 24.13.6,
`@types/react`/`@types/react-dom` 19.3.0 (tipado), `jsdom` 30.1.1 (DOM en Vitest),
`@testing-library/dom` 10.4.2 (peer requerido por React Testing Library),
`@vitest/coverage-v8` 5.0.1 (cobertura) y `server-only` 0.0.1 (barrera de módulos privados).
Se usa `@playwright/test` 1.63.0 como paquete del runner ya previsto. Se verificaron versiones,
engines y peers mediante `npm view`: jsdom admite Node 24.21.0 y el peer `@vitest/browser` del
proveedor de cobertura es opcional; no se añade ese paquete ni canvas. PostCSS llega mediante el
plugin de Tailwind; no se agrega como dependencia directa sin un uso propio.
Esto concreta herramientas existentes, no modifica decisiones funcionales ni cierra OQ. Queda
sujeto a la revisión normal del PR; no se afirma aprobación del segundo desarrollador.

**Decisión**: App Router en `src/app`, Server Components por defecto, Server Actions para
mutaciones de formularios y Route Handlers solo para interfaces HTTP reales: Auth callback,
archivos, importaciones, exportaciones y descargas. Los módulos privilegiados se marcan
`server-only`.

**Fundamento**: una aplicación full-stack única es la forma más simple de satisfacer el MVP, reduce
JavaScript cliente y mantiene consultas y secretos en servidor. Cada Server Action se trata como un
endpoint público y repite validación, autenticación y autorización.

**Alternativas consideradas**: Pages Router, SPA cliente y backend REST separado se descartan por
duplicar capas sin requisito. Exportación estática no admite sesiones ni mutaciones. React Compiler,
Cache Components e Instant Navigations no se habilitan inicialmente porque son optativos.

**Fuentes**: [Server y Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components),
[mutaciones](https://nextjs.org/docs/app/getting-started/mutating-data),
[Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers),
[Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend),
[autenticación](https://nextjs.org/docs/app/guides/authentication).

## 3. Sesiones y autenticación Supabase

**Decisión**: `@supabase/ssr` con cookies y PKCE; clientes separados de navegador y servidor.
Validar identidad mediante `getClaims()` y, para operaciones sensibles o comprobación de revocación,
`getUser()`. El autorregistro usa email/contraseña con verificación; recuperación mediante email.

**Fundamento**: es el patrón SSR oficial. `getSession()` no valida por sí solo la autenticidad de la
sesión en servidor. La separación de clientes limita el uso de credenciales a su contexto correcto.

**Alternativas consideradas**: los Auth Helpers antiguos están deprecados; autorización basada en
estado cliente o en `getSession()` se descarta. SMS/phone auth agregaría proveedor, costo y decisiones
no requeridas; el perfil presencial cubre a quien no tenga acceso digital.

**Fuentes**: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side),
[cliente SSR para Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager),
[contraseñas](https://supabase.com/docs/guides/auth/passwords),
[URLs de redirección](https://supabase.com/docs/guides/auth/redirect-urls).

## 4. Roles, suspensión y aprovisionamiento administrativo

**Decisión**: tabla de cuenta de aplicación con rol fijo (`candidate`, `company`, `admin`) y estado.
El registro público solo admite candidato o empresa. Los cuatro administradores se invitan de forma
individual y reciben rol mediante una operación controlada y auditada. La suspensión actualiza el
estado de aplicación y, cuando deba impedir acceso completo, usa Auth Admin.

**Fundamento**: `user_metadata` es editable por la persona y no debe autorizar. Una fuente de roles
en base permite RLS inmediata y evita credenciales compartidas. Cambiar solo un claim JWT demoraría
hasta la renovación del token.

**Alternativas consideradas**: rol en `user_metadata`, cuenta admin compartida o registro público de
administradores se descartan. Custom Claims puede evaluarse si el volumen demuestra que consultar la
tabla de roles es un problema.

**Fuentes**: [RBAC y Custom Claims](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac),
[usuarios e invitaciones](https://supabase.com/docs/guides/auth/users),
[Auth Admin](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid).

## 5. Autorización en profundidad

**Decisión**: comprobar sesión, rol, propiedad y estado en Server Actions/Route Handlers y repetir la
restricción con grants mínimos y RLS en PostgreSQL/Storage. Las tablas internas viven fuera del
esquema expuesto. Las vistas de métricas usan invocador y políticas seguras.

**Fundamento**: ocultar botones no protege datos. RLS contiene accesos directos o fallos de la capa
web; la comprobación servidor entrega errores controlados y reglas de negocio comprensibles.

**Alternativas consideradas**: solo middleware, solo UI o cliente secreto usado para todas las
operaciones se descartan. La clave secreta queda limitada a Auth Admin y trabajos de sistema.

**Fuentes**: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Data API segura](https://supabase.com/docs/guides/api/securing-your-api),
[API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 6. Almacenamiento protegido de CV

**Decisión**: bucket privado, rutas opacas por UUID, metadatos versionados en PostgreSQL y descarga
autenticada mediante streaming desde un Route Handler que revalida el permiso en cada solicitud y
responde `private, no-store`; no se entrega una URL firmada reutilizable. Para demo: solo PDF hasta
5 MiB, validado por extensión, MIME, firma y lectura básica.

**Fundamento**: el bucket privado evita URLs permanentes. La autorización por derivación debe
evaluarse en cada acceso; el nombre físico nunca revela identidad. Versionar conserva trazabilidad y
permite que un rechazo no sustituya el CV vigente.

**Alternativas consideradas**: bucket público, nombres con DNI/email y URLs firmadas reutilizables se
descartan porque no permiten cortar nuevos accesos inmediatamente. Almacenamiento binario en
PostgreSQL agrega carga sin beneficio. El límite técnico de 5 MiB requiere ratificación municipal
antes de datos reales.

**Fuentes**: [buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[descargas](https://supabase.com/docs/guides/storage/serving/downloads),
[control de acceso](https://supabase.com/docs/guides/storage/security/access-control).

## 7. Migraciones, pruebas de base y recuperación

**Decisión**: versionar SQL en `supabase/migrations`, adoptar Supabase CLI y Docker para
`db reset`, pgTAP y validación local. Migraciones forward-only, patrón expand/contract y script de
recuperación para cambios riesgosos; `db push --dry-run` y respaldo antes de una migración destructiva.
Si una migración falla en local, preview o demo, cualquiera de los dos desarrolladores puede detener
ese despliegue, diagnosticar y preparar sin consulta previa una nueva migración forward-only en su
rama y entorno aislado; luego informa al otro en el PR o comentario asociado. No se reescribe una
migración aplicada. La evidencia mínima es entorno, actor/fecha, commit/migración, error sanitizado,
estado de `schema_migrations`, posible estado parcial, verificaciones de integridad y respaldo cuando
exista. Un entorno solo ficticio puede reconstruirse tras conservar esa evidencia; producción queda
fuera hasta resolver OQ-006.

**Fundamento**: la constitución exige migraciones revisables, recuperación y autorización probada en
base. El entorno local reproducible justifica herramientas que la capacitación no exigía al inicio.
Supabase no ofrece rollback automático general de migraciones.

**Alternativas consideradas**: cambios manuales desde Dashboard no son auditables. Probar RLS solo
contra demo arriesga datos compartidos. Supabase Branching queda opcional porque puede depender del
plan contratado.

**Fuentes**: [migraciones](https://supabase.com/docs/guides/deployment/database-migrations),
[pruebas](https://supabase.com/docs/guides/local-development/testing/overview),
[backups](https://supabase.com/docs/guides/platform/backups),
[flujo local](https://supabase.com/docs/guides/local-development/cli-workflows).

## 8. Modelo de transiciones y auditoría

**Decisión**: transiciones críticas mediante funciones PostgreSQL transaccionales; catálogo de
estados centralizado, precondiciones explícitas y evento append-only en la misma transacción. Usar
versión esperada para detectar escrituras concurrentes.

**Fundamento**: una sola frontera atómica evita estados parciales y garantiza actor/fecha/estado
anterior/nuevo. El bloqueo optimista hace visible que dos administradores actuaron sobre una versión
distinta sin mantener locks largos.

**Alternativas consideradas**: escribir entidad e historial en llamadas separadas se descarta por
riesgo parcial; triggers genéricos solos no conocen todos los motivos de negocio. El borrado físico se
descarta mientras OQ-001 continúe abierto.

**Fuentes**: [transacciones PostgreSQL](https://www.postgresql.org/docs/current/tutorial-transactions.html),
[funciones PostgreSQL en Supabase](https://supabase.com/docs/guides/database/functions).

## 9. Cierre automático a los 30 días

**Decisión**: Supabase Cron invoca diariamente una función SQL idempotente. La función cierra como
`no_company_response` derivaciones sin resultado cuyo vencimiento sea 30 días después de derivar y
registra actor `system` y revoca el acceso empresarial a los datos derivados en la misma transacción.

**Fundamento**: el trabajo solo afecta datos, autorización y su historia, por lo que ejecutarlo
dentro de PostgreSQL evita HTTP y secretos adicionales. Cron conserva historial de ejecución. La
empresa puede comunicar una respuesta tardía sobre su referencia sin recuperar perfil/contactos/CV;
la transición administrativa no reescribe el cierre anterior. Un resultado tardío `hired` no
reactiva un permiso ya revocado: la contratación solo conserva una autorización que seguía activa.

**Alternativas consideradas**: Vercel Cron requeriría Route Handler, `CRON_SECRET`, tolerancia a
solapamientos y entregas duplicadas. Es contingencia válida si Supabase Cron no está disponible. Como
Supabase Cron sigue en beta, debe reevaluarse antes de producción.

**Fuentes**: [Supabase Cron](https://supabase.com/docs/guides/cron),
[Vercel Cron](https://vercel.com/docs/cron-jobs),
[gestión de Vercel Cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

## 10. Importación y exportación CSV

Complemento de proyecto (2026-09-25): Mateo autorizó construir y verificar la demo
con `demo-candidates-v1` sin esperar el Excel municipal. La versión se documenta en
`docs/import/candidate-import-v1.md`; el SQL admite solo esa versión y categorías
ficticias del seed. Las funciones administrativas existentes se reutilizan dentro de
la transacción del lote. Esto no agrega dependencias ni resuelve OQ-010/OQ-018/T069.

**Decisión**: dos fases. La previsualización analiza CSV UTF-8 con BOM opcional, encabezados exactos,
límites estrictos y reporte de errores sin escribir negocio. La confirmación vuelve a validar y llama
una función PostgreSQL all-or-nothing. El mapeo final queda bloqueado por OQ-018.

**Fundamento**: `csv-parse` permite límites por registro y rechazo de columnas inconsistentes. La
transacción evita importaciones parciales. El archivo bruto no se conserva por defecto; se registran
hash, contrato, responsable, conteos y resultado.

**Alternativas consideradas**: inferencia automática de columnas, cast permisivo, importación fila a
fila y conservar indefinidamente el archivo se descartan. Exportaciones neutralizan valores que
puedan ejecutar fórmulas.

**Fuentes**: [opciones de CSV Parse](https://csv.js.org/parse/options/),
[transacciones PostgreSQL](https://www.postgresql.org/docs/current/tutorial-transactions.html),
[OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection).

## 11. Estrategia de pruebas y accesibilidad

**Decisión**: Vitest para dominio y validación; React Testing Library para UI; pgTAP para schema,
funciones y matriz RLS; Playwright para flujos completos; axe como apoyo. Mantener prueba manual de
teclado, foco, zoom, lector de pantalla, responsive y mensajes en español.

**Fundamento**: cada capa prueba el riesgo en su frontera. Las pruebas RLS positivas y negativas son
obligatorias; la automatización de accesibilidad no encuentra todos los problemas.

**Alternativas consideradas**: solo E2E sería lento y poco preciso; solo unitarias no prueba permisos
reales; una meta global de cobertura no sustituye casos explícitos para cada regla crítica.

**Fuentes**: [Vitest Coverage](https://vitest.dev/guide/coverage),
[Testing Library](https://testing-library.com/docs/react-testing-library/intro/),
[pgTAP en Supabase](https://supabase.com/docs/guides/database/extensions/pgtap),
[Playwright](https://playwright.dev/docs/intro),
[accesibilidad con Playwright](https://playwright.dev/docs/accessibility-testing).

## 12. CI, despliegue y entornos

**Decisión**: GitHub Actions en PR con permisos mínimos ejecuta `npm ci`, typecheck, ESLint, Vitest,
pgTAP, build y Playwright. Vercel se conecta a GitHub, produce preview por PR y despliega `main` solo
después del merge. Local, preview, demo y eventual producción no comparten secretos ni datos.

**Fundamento**: `setup-node` y `npm ci` respetan el lockfile; los previews mejoran revisión sin usar
CLI manual. La separación de entornos protege producción y permite fixtures ficticios.

**Alternativas consideradas**: despliegue manual con Vercel CLI, secretos productivos en PR o usar el
mismo proyecto Supabase para todo se descartan. Producción no se habilita hasta resolver OQ-006.

**Fuentes**: [GitHub Actions para Node](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs),
[seguridad de Actions](https://docs.github.com/en/actions/reference/security/secure-use),
[Vercel y Git](https://vercel.com/docs/git),
[entornos Vercel](https://vercel.com/docs/deployments/environments).

## 13. Logs y observabilidad

**Decisión**: logger servidor con campos permitidos; Vercel Runtime Logs, Supabase Logs y detalle de
Cron para el demo. Auditoría funcional separada en PostgreSQL. No agregar un proveedor externo.

**Fundamento**: cubre diagnóstico básico con el stack obligatorio y evita procesar PII en terceros.
Los logs contienen código, request ID, rol, UUID interno imprescindible, duración y resultado, nunca
cuerpos de solicitud ni datos personales.

**Alternativas consideradas**: Sentry u otro SaaS no está justificado para el MVP; `console.log` de
objetos arbitrarios se descarta porque Vercel conserva esa salida.

**Fuentes**: [Vercel Runtime Logs](https://vercel.com/docs/logs/runtime),
[Supabase Observability](https://supabase.com/docs/guides/observability).

## 14. Preguntas que el plan conserva abiertas

**Decisión**: no resolver OQ-001, OQ-005, OQ-006, OQ-010 ni OQ-018. OQ-017 recibe un límite técnico
de demostración de 5 MiB, pero sigue pendiente de aprobación municipal antes de CV reales. También
quedan como gates el SMTP real, las cuatro identidades admin, el texto/versionado del consentimiento
y la identidad visual municipal. Mientras OQ-001 siga abierta, no existe TTL de datos, purga ni
transición automática a `expired_by_policy`. El acceso conservado por contratación tiene una
ventana operativa de 720 horas desde su confirmación administrativa; autorización y retención se
mantienen como conceptos separados.

**Fundamento**: son decisiones legales, operativas o de contenido cuyo dueño no es el equipo técnico.
El diseño proporciona límites seguros y puntos de configuración sin fingir aprobación.

**Alternativas consideradas**: inventar retención, catálogo, columnas históricas, operación
productiva o formatos oficiales violaría la especificación y la constitución.

## 15. Proyección empresarial de contactos y CV

**Decisión**: un permiso de derivación `active` expone todos los contactos vigentes del candidato y guarda como
evidencia la versión exacta del CV compartida. Reemplazar el CV cambia únicamente las derivaciones
futuras; los contactos no se congelan y la empresa ve los que permanezcan vigentes mientras conserve
acceso a esa derivación. El permiso se recalcula en cada lectura y termina ante retiro de la
postulación o del consentimiento, no selección, cancelación, falta de respuesta, suspensión o
archivo. Una contratación confirmada conserva el acceso solo si el permiso todavía está `active`,
por un máximo de 720 horas desde la confirmación administrativa y mientras no exista otro bloqueo.
Ese vencimiento limita la consulta empresarial, no la retención o purga de datos aún abierta en
OQ-001. La autorización temporal se verifica en cada lectura aunque la tarea que materializa
`revoked` corra después.

**Fundamento**: aplica literalmente las aclaraciones de FR-036. El `cv_document_id` convierte el
documento compartido en una evidencia reproducible, mientras que eliminar una marca de selección por
contacto evita una regla ya descartada por producto. Separar la capacidad de comunicar feedback de
la proyección de datos permite recibir respuestas tardías sin reabrir información personal. El
permiso funciona como un enclavamiento: las condiciones vigentes pueden denegarlo y una revocación
persistida no vuelve a `active` por una transición posterior.

**Alternativas consideradas**: compartir solo un contacto principal, seleccionar contactos por
derivación, mostrar siempre el CV más reciente, exponer todas sus versiones, mantener acceso tras
cualquier resultado o exigir revocación manual fueron rechazadas en clarificación.

## 16. Suspensión, archivo, eliminación y restauración

**Decisión**: las transiciones se ejecutan mediante funciones atómicas y auditadas. Suspender bloquea
acciones nuevas y revoca acceso empresarial sin cerrar participaciones. La eliminación solicitada
por un candidato archiva de inmediato cuenta/perfil, sin revisión administrativa ni borrado físico.
Retirar una postulación derivada o el consentimiento general revoca todos los permisos afectados en
la misma transacción; reconsentir no los restaura.
Solo un administrador restaura, con motivo, dejando perfiles/empresas inactivos y ofertas en borrador;
ninguna relación se reactiva automáticamente.

**Fundamento**: separa control de acceso, estado laboral e historial. Mantener Auth y registros evita
destrucción irreversible mientras OQ-001 siga abierta y permite cumplir la restauración recuperable.

**Alternativas consideradas**: borrar el usuario o sus relaciones, conservar accesos empresariales,
cancelar automáticamente participaciones o restaurar el estado previo completo se descartaron por
privacidad, pérdida de trazabilidad y contradicción con la especificación.

## 17. Automatización de vencimientos y saltos de evaluación

**Decisión**: el mantenimiento diario idempotente cierra ofertas publicadas vencidas, cierra
derivaciones sin respuesta a 30 días desde `referred_at` y materializa como `revoked` los permisos
posteriores a contratación cuya ventana de 720 horas terminó. El cierre sin respuesta revoca el
permiso empresarial en la misma transacción; cada una de las tres acciones registra actor `system`
sin duplicar eventos. La autorización deniega nuevas lecturas desde el instante exacto del
vencimiento poscontratación aunque la materialización se ejecute después. El feedback tardío se
admite sin datos personales y no restaura el permiso, incluso si administración corrige el resultado
a `hired`. Revisión, preentrevista y preselección son etapas omitibles solo hacia adelante por un
administrador, con motivo; la derivación explícita nunca es omitible.

**Fundamento**: una única frontera programada conserva actor `system`, evita ofertas vencidas y
reutiliza el patrón transaccional ya elegido. Los saltos autorizados reducen trabajo innecesario sin
debilitar la intermediación municipal.

**Alternativas consideradas**: cierre manual de ofertas, reinicio del plazo por contactos, etapas
internas siempre obligatorias o saltos sin motivo fueron rechazados durante aclaración.

## 18. Definiciones y validación reproducible de métricas

Complemento 2026-09-26 (`EXTRA-001`): las columnas mutables y la auditoría anterior
no bastan para reconstruir fotos históricas de categorías/disponibilidad. Se agrega
evidencia mínima privada, append-only y transaccional, no snapshots de PII ni tablas
de agregados. Se descartan usar valores actuales como si fueran pasados y retrofechar
la línea base de instalaciones existentes. La consulta usa invocador/RLS; la evidencia
de filtros de descarga se enlaza a auditoría sin ampliar su lista de metadatos.

**Decisión**: candidato activo significa perfil activo, disponible, con consentimiento vigente y
confirmado en los últimos seis meses. Se calculan dos duraciones desde `published_at`: hasta la
primera contratación confirmada y hasta que las contrataciones confirmadas alcancen `vacancies`; la
segunda permanece nula mientras falten vacantes. La aceptación administrativa usa fixtures de
500 candidatos, 50 empresas, 100 ofertas y 1.000 participaciones y restablece ese mismo conjunto
antes de cada medición SC-003 y SC-008.

**Fundamento**: las fórmulas dependen de hechos auditables y el dataset fijo vuelve comparables las
mediciones de búsqueda, conteos y exportación. Un reset separado antes de cada cronómetro impide que
la primera tarea altere las condiciones de la segunda.

**Alternativas consideradas**: contar todo perfil no archivado, medir desde el borrador o primera
derivación, considerar cualquier feedback como contratación o probar con volúmenes variables se
descartaron por producir resultados no comparables.

## 19. Protocolo de aceptación y accesibilidad

**Decisión**: candidato y empresa se miden en 10 ejecuciones por rol con al menos cinco personas
distintas, datos ficticios preparados, conexión estable y sin ayuda. SC-003 y SC-008 usan un único
administrador de prueba sin capacitación ni práctica previa, que recibe solo la descripción de la
tarea; ambas mediciones se realizan en el mismo entorno de demostración, con el dataset
500/50/100/1.000 restablecido, sin calentamiento y registrando las condiciones. Accesibilidad se
verifica en 360×800 y 1366×768, zoom 100 %/200 %, teclado completo y un recorrido por rol con NVDA.
SC-010 usa cohortes separadas de al menos cinco candidatos, cinco representantes de empresa y los
cuatro administradores previstos o personal municipal equivalente. Cada persona realiza solo tareas
de su rol; cada tipo de tarea requiere 80 % de éxito en primer intento y el criterio global aprueba
cuando cumplen al menos cuatro de los cinco tipos. No se permite ayuda externa ni reinicio; corregir
mediante mensajes de la interfaz está permitido.

El entorno alojado se restablece mediante una operación servidor transaccional, versionada y
exclusiva de demo. Debe verificar entorno e identificador de proyecto, exigir confirmación explícita,
bloquear ejecución concurrente, negarse a operar sobre producción, aplicar solo datos ficticios y
emitir la versión/hash y los conteos esperados sin PII. La evidencia de cada medición registra
commit/despliegue, fixture/reset, navegador, dispositivo, conexión e identificador seudónimo del
participante.

**Fundamento**: fija muestra, preparación, entorno, condiciones, comienzo/fin y criterio de éxito,
complementando axe con pruebas humanas de teclado y lector de pantalla. Restablecer el mismo entorno
y evitar calentamiento reduce variaciones no atribuibles al producto.

**Alternativas consideradas**: capacitar o permitir práctica al administrador, medir en local o en
entornos variables, hacer que cada persona pruebe roles ajenos, usar una sola ejecución por tarea,
medir solo a los desarrolladores, reemplazar usuarios por E2E o usar únicamente axe fueron
descartadas porque reducen comparabilidad o no validan usabilidad real y accesibilidad completa.
