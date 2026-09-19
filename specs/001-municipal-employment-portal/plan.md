# Plan de implementación: MVP del Portal Municipal de Empleo de Funes

**Rama**: `spec/municipal-employment-portal-mvp` | **Fecha**: 2026-09-19 | **Especificación**: [spec.md](./spec.md)

**Entrada**: Especificación integral del MVP en `specs/001-municipal-employment-portal/spec.md`.

## Resumen

El MVP será una aplicación web única con tres experiencias protegidas —candidato, empresa y
administración municipal— y una consulta pública limitada a ofertas aprobadas. La Oficina de Empleo
mantiene la intermediación: modera ofertas, evalúa y preselecciona personas, decide derivaciones y
confirma los resultados finales. Las empresas nunca acceden al padrón general y solo ven datos
laborales, contacto y CV de una persona derivada a una oferta propia.

La solución se construirá como una aplicación Next.js con App Router, React, TypeScript y Tailwind
CSS, desplegada en Vercel para la demostración. Supabase aportará Auth, PostgreSQL, Row Level
Security, Storage privado y la tarea diaria que cierra derivaciones sin respuesta. Las mutaciones
sensibles se validarán en servidor y se respaldarán con RLS, funciones transaccionales e historial
inmutable. El plan no define operación productiva municipal ni cierra las decisiones legales o de
datos que siguen asignadas a sus responsables.

## Contexto técnico

**Lenguaje y runtime**: TypeScript 6.0.3 en modo estricto; Node.js 24.21.0 LTS con npm 11.19.0; SQL
PostgreSQL para migraciones, políticas, funciones y pruebas de base de datos.

**Dependencias principales**: Next.js 16.3.5, React y React DOM 19.3.0, Tailwind CSS y
`@tailwindcss/postcss` 4.3.3, `@supabase/supabase-js` 2.116.0, `@supabase/ssr` 0.12.7, Zod 4.6.5 y
`csv-parse` 7.0.2. Herramientas: Supabase CLI 2.117.0, ESLint 10.10.0 y `eslint-config-next`
16.3.5. Todas las versiones directas se fijarán exactamente en `package.json` y el árbol
reproducible quedará en `package-lock.json`; no se usarán rangos `^` o `~` para dependencias directas.

**Persistencia**: Supabase PostgreSQL para datos relacionales, RLS, funciones transaccionales,
auditoría y vistas de métricas; Supabase Storage en bucket privado para CV; Supabase Auth para
identidad. No habrá otra base de datos, proveedor de autenticación ni almacenamiento.

**Pruebas**: Vitest 5.0.1 para dominio y validadores, React Testing Library 16.3.3 para componentes,
pgTAP mediante Supabase CLI para esquema/funciones/RLS, Playwright 1.63.0 para recorridos críticos y
`@axe-core/playwright` 4.13.0 como apoyo automatizado de accesibilidad. La validación manual de
teclado, foco, zoom, responsive y mensajes en español sigue siendo obligatoria.

**Plataforma objetivo**: navegadores modernos con diseño mobile-first y ejecución servidor en
Vercel; Supabase administrado para la demostración. La operación productiva municipal permanece
fuera de este plan hasta resolver OQ-006.

**Tipo de proyecto**: aplicación web full-stack única. Next.js entrega UI, renderizado servidor,
Server Actions y Route Handlers; no se agrega un backend independiente.

**Objetivos de rendimiento**: consultas administrativas y exportación listas en menos de 30
segundos de interacción; navegación con estados de carga inmediatos; listados paginados en servidor;
búsquedas sobre campos normalizados e indexados. No se fija un SLA productivo ni una capacidad de
concurrencia no respaldada por evidencia.

**Restricciones**: interfaz en español, responsive y operable con teclado; cuatro administradores
individuales con igual permiso; autorización en servidor y base; CV PDF privado de hasta 5 MiB para
la demostración; datos exclusivamente ficticios o anonimizados; ningún borrado irreversible mientras
OQ-001 siga abierto; sin contacto directo, IA de matching, verificación documental empresarial ni
formatos oficiales de informes no suministrados.

**Escala y alcance**: un municipio, tres roles, cuatro administradores iniciales y seis recorridos
funcionales de la especificación. La arquitectura usa paginación e índices para crecer sin adoptar
infraestructura distribuida; el dimensionamiento productivo se pospone junto con OQ-006.

**Clarificaciones técnicas resueltas**: no quedan marcadores `NEEDS CLARIFICATION`. Las dependencias
externas OQ-001, OQ-005, OQ-006, OQ-010, OQ-017 y OQ-018 permanecen visibles y no se consideran
decisiones aprobadas por el plan.

## Verificación de la constitución

*PUERTA: evaluada antes de la investigación y nuevamente después del diseño de Fase 1.*

| Principio o control | Resultado previo | Evidencia de diseño posterior |
| --- | --- | --- |
| I. Misión e intermediación municipal | Cumple | La autorización y los contratos impiden el padrón empresarial; solo una derivación administrativa habilita la vista mínima del candidato. |
| II. Privacidad y seguridad desde el diseño | Cumple | Cuentas individuales, SSR seguro, RLS, bucket privado, validación de archivos, secretos solo en servidor y fixtures ficticios. |
| III. Trazabilidad e integridad | Cumple | Transiciones transaccionales, eventos append-only, actor sistema identificable, bloqueo optimista y archivo recuperable. |
| IV. Accesibilidad e inclusión | Cumple | Diseño mobile-first, español, teclado, pruebas axe y manuales, y perfiles asistidos con la misma protección. |
| V. Especificaciones, simplicidad y calidad | Cumple | Monolito modular sin backend adicional, estados y catálogos centralizados, cobertura automatizada de flujos críticos. |
| VI. Uso responsable de IA | Cumple | No se usan datos reales; todo artefacto generado requiere revisión, pruebas y PR. |
| Stack técnico obligatorio | Cumple | Next.js, React, TypeScript, Tailwind, Node 24/npm, Supabase/PostgreSQL/Auth, GitHub y Vercel. |
| Flujo de trabajo y gates | Cumple | Rama dedicada, PR, revisión del segundo desarrollador y `typecheck`, `lint`, pruebas y `build` antes de terminar. |

No se solicitan excepciones constitucionales. Supabase CLI y Docker se incorporan solo como
herramientas de desarrollo para migraciones y pruebas locales reproducibles de RLS; no agregan una
capa productiva y responden a una exigencia explícita de integridad y autorización.

## Arquitectura y límites

### Aplicación y rutas

- App Router con Server Components por defecto. Los Client Components se limitan a interacción que
  realmente necesita estado del navegador.
- Grupos de rutas separados para páginas públicas, autenticación, candidato, empresa y
  administración. Los layouts protegidos validan sesión, rol y estado, pero no sustituyen RLS.
- Server Actions para formularios y transiciones originadas en la UI; Route Handlers para descargas
  protegidas, carga de archivos, importaciones, exportaciones y el callback de Auth.
- Los Server Components consultan la capa de datos directamente; no llaman Route Handlers internos.
- Toda entrada cruza un esquema Zod en servidor. Los mensajes al usuario usan códigos de error
  estables traducidos al español y nunca devuelven detalles internos ni datos sensibles.
- Las lecturas autenticadas son dinámicas y no se comparten en caché. Las ofertas públicas pueden
  cachearse y revalidarse únicamente si la consulta excluye datos privados.
- No se activan React Compiler, Cache Components, Instant Navigations ni integración experimental de
  TypeScript 7: no son necesarias para los requisitos del MVP.

### Identidad, sesión y cuentas

- El autorregistro de candidatos y empresas usa email y contraseña; el email verificado cuenta como
  el contacto mínimo del flujo autogestionado. La verificación y recuperación usan Supabase Auth.
- `@supabase/ssr` mantiene sesión en cookies. La autorización servidor valida claims o usuario
  vigente; nunca confía en `getSession()` ni en metadatos editables por el usuario.
- Una tabla de cuentas de aplicación contiene rol y estado. El registro público solo puede crear
  `candidate` o `company`; `admin` se aprovisiona mediante invitación controlada y acción auditada.
- Las cuatro cuentas administrativas son individuales. Una suspensión se aplica inmediatamente en
  la tabla de aplicación y, cuando corresponda, mediante Auth Admin desde un módulo `server-only`.
- La clave publicable puede llegar al navegador. La clave secreta solo existe en variables seguras y
  se limita a aprovisionamiento, suspensión Auth y trabajos del sistema que realmente deban eludir
  RLS. Las acciones normales de administradores usan su propia sesión y RLS.
- El SMTP integrado se considera suficiente solo para pruebas controladas. Usuarios reales,
  dominio remitente y SMTP productivo quedan bloqueados hasta una decisión operativa autorizada.

### Autorización y privacidad de datos

- RLS se habilita en toda tabla expuesta a la Data API. Tablas y funciones internas viven en un
  esquema privado o tienen grants explícitos mínimos.
- Candidato: sus datos, CV, postulaciones y la proyección pública permitida de sus estados.
- Empresa: su perfil y ofertas; tras una derivación vigente, la proyección laboral, contactos y CV
  de esa persona para esa oferta. DNI, domicilio, notas y motivos internos se excluyen por diseño.
- Administrador activo: operación municipal completa, siempre con actor identificado.
- Anónimo: solo ofertas publicadas vigentes y campos expresamente públicos.
- DNI y otros datos identificatorios se separan de la proyección laboral, se normalizan para detectar
  duplicados, se enmascaran en UI y jamás se escriben en logs. Supabase aporta cifrado administrado
  en reposo; este MVP no añade criptografía de aplicación que impida las búsquedas necesarias.

### CV y archivos

- Un único bucket privado `candidate-cvs`; claves opacas con UUID, nunca nombres, DNI o email.
- Para la demostración se acepta únicamente PDF de hasta 5 MiB. Se validan extensión, MIME declarado,
  firma `%PDF-`, tamaño y lectura básica antes de reemplazar el CV vigente. Un rechazo no lo sustituye.
- La descarga pasa por un Route Handler autenticado que vuelve a comprobar propietario, rol o
  derivación. Si se emite URL firmada, dura como máximo 60 segundos y no se persiste ni registra.
- Los metadatos y versiones quedan en PostgreSQL; reemplazar archiva la versión anterior. No hay
  eliminación automática hasta que exista una política de retención aprobada.
- El límite de 5 MiB resuelve la configuración técnica de la demostración, pero OQ-017 continúa
  requiriendo ratificación municipal antes de tratar documentos reales.

### Integridad, estados y concurrencia

- Roles, catálogos y estados se definen una sola vez en el dominio y se reflejan con constraints o
  tablas controladas en PostgreSQL.
- Las transiciones críticas llaman funciones PostgreSQL transaccionales que verifican precondición,
  rol, estado vigente, consentimiento y CV, actualizan el agregado e insertan el historial.
- Los registros mutables incluyen `version` o `updated_at` esperado. Una acción sobre una versión
  obsoleta devuelve conflicto y obliga a recargar, evitando que dos administradores pisen decisiones.
- El historial es append-only. Incluye actor de cuenta o actor de sistema, fecha, entidad, acción,
  estado anterior/nuevo y motivo obligatorio cuando corresponda.
- Los registros se archivan con `archived_at` y `archived_by`; no se ejecutan cascadas destructivas
  sobre historial, derivaciones, importaciones o auditoría.

### Automatización de falta de respuesta

- Supabase Cron ejecuta diariamente una función SQL idempotente. Toma participaciones derivadas sin
  resultado final cuyo `feedback_due_at` —fijado a 30 días desde la derivación— ya venció, las cierra
  como `no_company_response` e inserta un evento con actor `system` en la misma transacción.
- Una ejecución repetida no genera eventos duplicados. Una respuesta tardía crea feedback nuevo y un
  administrador registra el resultado real como otra transición, sin borrar el cierre automático.
- Supabase Cron está en beta y debe reevaluarse antes de producción. Vercel Cron queda documentado
  como alternativa de contingencia, no se implementan ambos mecanismos.

### Importación y exportación CSV

- Flujo de dos fases: previsualización sin escrituras de negocio y confirmación transaccional. El
  servidor vuelve a validar el lote confirmado; cualquier fallo revierte todas las filas.
- Se aceptará CSV UTF-8 con BOM opcional, encabezados exactos de un contrato versionado, conteo y
  tamaño acotados, columnas consistentes y sin conversión automática permisiva.
- El archivo histórico bruto no se conserva por defecto. Se guardan referencia segura, hash,
  responsable, fecha, contrato de mapeo, conteos y errores sanitizados, nunca filas completas en logs.
- Todo valor exportado que pueda iniciar una fórmula se neutraliza. Las exportaciones se generan en
  servidor, requieren administrador y aplican los mismos filtros y permisos que la pantalla.
- OQ-018 bloquea la implementación definitiva y la aceptación del importador hasta que la Oficina
  entregue una muestra anonimizada y apruebe el mapeo escrito. No se inferirán columnas.

### Métricas, logs y recuperación

- Vistas o funciones SQL protegidas calculan conteos y tendencias sobre datos autorizados. No hay
  analítica pública ni formatos oficiales adicionales mientras OQ-005 siga abierto.
- Un logger servidor con lista permitida registra código de evento, request ID, rol, UUID interno,
  duración y resultado. Prohíbe nombres, DNI, CUIT, contactos, notas, nombres/contenido de archivos,
  filas CSV, cookies, tokens y secretos.
- Vercel Runtime Logs y Supabase Logs/Cron cubren la demostración; la auditoría de negocio permanece
  separada en PostgreSQL. No se agrega un tercer proveedor de observabilidad.
- Migraciones SQL versionadas y forward-only, con patrón expand/contract. Antes de cambios
  destructivos: `db push --dry-run`, respaldo lógico y procedimiento de recuperación documentado.
  Backups/PITR productivos dependen de OQ-006 y del nivel de servicio que apruebe la Municipalidad.

### Entornos y entrega

- Local: Supabase CLI y Docker, esquema reiniciable y seed exclusivamente ficticio.
- Preview de Vercel: nunca usa producción; emplea un entorno Supabase de prueba aislado o pruebas sin
  datos persistentes. No se entregan secretos a PR no confiables.
- Demostración: proyecto Supabase y proyecto Vercel separados, con identidades ficticias controladas.
- Producción municipal: no se crea ni configura hasta resolver hosting, responsables, región,
  backups, incidentes, SMTP, retención y datos reales.
- GitHub Actions en cada PR ejecuta instalación desde lockfile, typecheck, lint, Vitest, pgTAP,
  build y Playwright de flujos críticos. Sus permisos son de solo lectura salvo necesidad explícita.
- Vercel se integra con GitHub; los PR generan previews y `main` publica la demostración solo tras
  aprobación y merge. Vercel CLI no es requisito inicial.

## Estructura del proyecto

### Documentación de esta característica

```text
specs/001-municipal-employment-portal/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── authorization-matrix.md
│   ├── state-machines.md
│   └── csv-import.md
└── tasks.md                  # Se generará únicamente con $speckit-tasks
```

### Código fuente previsto en la raíz

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (candidate)/
│   ├── (company)/
│   ├── (admin)/
│   ├── api/
│   └── auth/callback/
├── components/
│   ├── ui/
│   ├── forms/
│   └── layouts/
├── features/
│   ├── accounts/
│   ├── candidates/
│   ├── companies/
│   ├── openings/
│   ├── participations/
│   ├── referrals/
│   ├── imports/
│   └── metrics/
├── domain/
│   ├── catalogs/
│   ├── states/
│   ├── transitions/
│   └── permissions/
├── lib/
│   ├── auth/
│   ├── supabase/
│   ├── files/
│   ├── logging/
│   └── errors/
└── validation/

supabase/
├── migrations/
├── seed.sql
└── tests/

tests/
├── unit/
├── components/
├── integration/
└── e2e/

.github/workflows/
└── quality.yml
```

**Decisión de estructura**: monolito modular Next.js. `src/domain` contiene reglas puras y estados;
`src/features` orquesta casos de uso por área; `src/lib` encapsula infraestructura. Las políticas,
funciones e integridad residen como migraciones revisables en `supabase/`. No se crean paquetes,
microservicios ni un backend separado para el MVP.

## Dependencias externas y gates de aceptación

| ID | Tratamiento en este plan | Gate antes de datos reales o aceptación |
| --- | --- | --- |
| OQ-001 | Archivo recuperable, sin purga automática | Política de retención aprobada por responsable legal/de datos. |
| OQ-005 | Métricas internas y CSV genérico | Ejemplos y aprobación para cualquier informe oficial adicional. |
| OQ-006 | Solo local, preview y demo ficticia | Operador, hosting, región, backups, incidentes y SMTP definidos. |
| OQ-010 | Modelo de catálogo versionable y multiselección | Catálogo canónico depurado y aprobado por Oficina de Empleo. |
| OQ-017 | PDF, máximo técnico de demo 5 MiB | Ratificación municipal antes de CV reales. |
| OQ-018 | Flujo y contrato versionado, sin inferencia | Muestra anonimizada y mapeo escrito aprobado antes del importador definitivo. |

También se requiere confirmar las cuatro identidades administrativas, la política/versión exacta del
texto de consentimiento y los requisitos visuales municipales antes de la aceptación con usuarios.

## Seguimiento de complejidad

No hay violaciones constitucionales que justificar. Las herramientas adicionales están acotadas a
validación local y CI; la arquitectura productiva mantiene únicamente Next.js, Vercel y Supabase.
