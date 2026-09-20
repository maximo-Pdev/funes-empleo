# Investigación técnica: MVP del Portal Municipal de Empleo de Funes

**Fecha**: 2026-09-19  
**Alcance**: decisiones necesarias para completar el plan técnico; no modifica requisitos de producto.

## 1. Versiones reproducibles del stack

**Decisión**: usar Node.js 24.21.0 LTS con npm 11.19.0, Next.js 16.3.5, React/React DOM
19.3.0, TypeScript 6.0.3, Tailwind CSS y `@tailwindcss/postcss` 4.3.3, ESLint 10.10.0,
`eslint-config-next` 16.3.5, Supabase CLI 2.117.0 y `csv-parse` 7.0.2. Fijar dependencias directas y
commitear `package-lock.json`; CI instala con `npm ci`.

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
autenticada. Si se usa URL firmada, se emite después de autorizar y dura como máximo 60 segundos.
Para demo: solo PDF hasta 5 MiB, validado por extensión, MIME, firma y lectura básica.

**Fundamento**: el bucket privado evita URLs permanentes. La autorización por derivación debe
evaluarse en cada acceso; el nombre físico nunca revela identidad. Versionar conserva trazabilidad y
permite que un rechazo no sustituya el CV vigente.

**Alternativas consideradas**: bucket público, nombres con DNI/email o URLs firmadas de larga vida se
descartan. Almacenamiento binario en PostgreSQL agrega carga sin beneficio. El límite técnico de 5 MiB
requiere ratificación municipal antes de datos reales.

**Fuentes**: [buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[descargas](https://supabase.com/docs/guides/storage/serving/downloads),
[control de acceso](https://supabase.com/docs/guides/storage/security/access-control).

## 7. Migraciones, pruebas de base y recuperación

**Decisión**: versionar SQL en `supabase/migrations`, adoptar Supabase CLI y Docker para
`db reset`, pgTAP y validación local. Migraciones forward-only, patrón expand/contract y script de
recuperación para cambios riesgosos; `db push --dry-run` y respaldo antes de una migración destructiva.

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
registra actor `system` en la misma transacción.

**Fundamento**: el trabajo solo afecta datos y su historia, por lo que ejecutarlo dentro de
PostgreSQL evita HTTP y secretos adicionales. Cron conserva historial de ejecución. Una respuesta
tardía agrega otra transición administrativa y no reescribe la anterior.

**Alternativas consideradas**: Vercel Cron requeriría Route Handler, `CRON_SECRET`, tolerancia a
solapamientos y entregas duplicadas. Es contingencia válida si Supabase Cron no está disponible. Como
Supabase Cron sigue en beta, debe reevaluarse antes de producción.

**Fuentes**: [Supabase Cron](https://supabase.com/docs/guides/cron),
[Vercel Cron](https://vercel.com/docs/cron-jobs),
[gestión de Vercel Cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

## 10. Importación y exportación CSV

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
y la identidad visual municipal.

**Fundamento**: son decisiones legales, operativas o de contenido cuyo dueño no es el equipo técnico.
El diseño proporciona límites seguros y puntos de configuración sin fingir aprobación.

**Alternativas consideradas**: inventar retención, catálogo, columnas históricas, operación
productiva o formatos oficiales violaría la especificación y la constitución.

## 15. Proyección empresarial de contactos y CV

**Decisión**: una derivación activa expone todos los contactos vigentes del candidato y guarda como
evidencia la versión exacta del CV compartida. Reemplazar el CV cambia únicamente las derivaciones
futuras; los contactos no se congelan y la empresa ve los que permanezcan vigentes mientras conserve
acceso a esa derivación.

**Fundamento**: aplica literalmente las aclaraciones de FR-036. El `cv_document_id` convierte el
documento compartido en una evidencia reproducible, mientras que eliminar una marca de selección por
contacto evita una regla ya descartada por producto.

**Alternativas consideradas**: compartir solo un contacto principal, seleccionar contactos por
derivación, mostrar siempre el CV más reciente o exponer todas sus versiones fueron rechazadas en
clarificación.

## 16. Suspensión, archivo, eliminación y restauración

**Decisión**: las transiciones se ejecutan mediante funciones atómicas y auditadas. Suspender bloquea
acciones nuevas y revoca acceso empresarial sin cerrar participaciones. La eliminación solicitada
por un candidato archiva de inmediato cuenta/perfil, sin revisión administrativa ni borrado físico.
Solo un administrador restaura, con motivo, dejando perfiles/empresas inactivos y ofertas en borrador;
ninguna relación se reactiva automáticamente.

**Fundamento**: separa control de acceso, estado laboral e historial. Mantener Auth y registros evita
destrucción irreversible mientras OQ-001 siga abierta y permite cumplir la restauración recuperable.

**Alternativas consideradas**: borrar el usuario o sus relaciones, conservar accesos empresariales,
cancelar automáticamente participaciones o restaurar el estado previo completo se descartaron por
privacidad, pérdida de trazabilidad y contradicción con la especificación.

## 17. Automatización de vencimientos y saltos de evaluación

**Decisión**: el mantenimiento diario idempotente cierra tanto ofertas publicadas vencidas como
derivaciones sin respuesta a 30 días desde `referred_at`. Revisión, preentrevista y preselección son
etapas omitibles solo hacia adelante por un administrador, con motivo; la derivación explícita nunca
es omitible.

**Fundamento**: una única frontera programada conserva actor `system`, evita ofertas vencidas y
reutiliza el patrón transaccional ya elegido. Los saltos autorizados reducen trabajo innecesario sin
debilitar la intermediación municipal.

**Alternativas consideradas**: cierre manual de ofertas, reinicio del plazo por contactos, etapas
internas siempre obligatorias o saltos sin motivo fueron rechazados durante aclaración.

## 18. Definiciones y validación reproducible de métricas

**Decisión**: candidato activo significa perfil activo, disponible, con consentimiento vigente y
confirmado en los últimos seis meses. Se calculan dos duraciones desde `published_at`: hasta la
primera contratación confirmada y hasta que las contrataciones confirmadas alcancen `vacancies`; la
segunda permanece nula mientras falten vacantes. La aceptación administrativa usa fixtures de
500 candidatos, 50 empresas, 100 ofertas y 1.000 participaciones.

**Fundamento**: las fórmulas dependen de hechos auditables y el dataset fijo vuelve comparables las
mediciones de búsqueda, conteos y exportación.

**Alternativas consideradas**: contar todo perfil no archivado, medir desde el borrador o primera
derivación, considerar cualquier feedback como contratación o probar con volúmenes variables se
descartaron por producir resultados no comparables.

## 19. Protocolo de aceptación y accesibilidad

**Decisión**: candidato y empresa se miden en 10 ejecuciones por rol con al menos cinco personas
distintas, datos ficticios preparados, conexión estable y sin ayuda. Accesibilidad se verifica en
360×800 y 1366×768, zoom 100 %/200 %, teclado completo y un recorrido por rol con NVDA. Los usuarios
representativos deben completar al menos cuatro de las cinco tareas de SC-010 en primer intento, sin
ayuda externa ni reinicio; corregir mediante mensajes de la interfaz está permitido.

**Fundamento**: fija muestra, condiciones, comienzo/fin y criterio de éxito, complementando axe con
pruebas humanas de teclado y lector de pantalla.

**Alternativas consideradas**: medir solo a los desarrolladores, aceptar muestras variables,
reemplazar usuarios por E2E o usar únicamente axe fueron descartadas porque no validan usabilidad
real ni accesibilidad completa.
