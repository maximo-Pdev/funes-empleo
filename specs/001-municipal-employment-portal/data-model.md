# Modelo de datos: MVP del Portal Municipal de Empleo de Funes

## Course links and independent referrals — EXTRA-086

Here EXTRA-086 means “Mejoras finales del portal y recorridos del PDF de Beex”,
not the main carousel entry; title-qualified identities are mapped in EXTRA102.

Add `municipal_courses` (UUID, title, HTTPS URL, publication flag, creation actor/time)
and `course_referrals` (UUID, existing candidate/course references, immutable course
title/URL snapshot, referral actor/time). Foreign keys restrict deletion; referral
history is append-only even for privileged SQL. Index candidate/time/ID for stable
history pagination. Public reads expose published link metadata only, never staff
attribution or candidate history. Only active administrators can create/maintain links
or record referrals through session-bound commands. The course referral has no job
opening or participation foreign key and creates no company access. SQL migration
`20261027233000_course_referrals.sql` is the executable schema; no existing data is reset
or transformed. Historical training-guidance notes remain unchanged.

## Notification, agenda and derived export additions

Registration terms use separate append-only `private.registration_terms_receipts`
for account/role/version/time under `20261028013000_registration_terms.sql`.
No legal receipt populates `candidate_consents`, activates referral permission or
backfills existing accounts. Operational controls live in Cuenta > Privacidad,
with explicit manual withdrawal and no repeated accepted-to-accepted submission.
Chart-first reporting adds no persisted metric entities: overview and metrics use
the same real rows, labels, snapshot/event definitions and CSV/PDF/XLSX exports.

EXTRA099: account_notifications agrega id UUID interno, reference aviso-24hex
UNIQUE, recipient_account_id→accounts y source_event_id→audit_events RESTRICT,
kind cerrado, resource_id interno, created_at y read_at nullable. UNIQUE(recipient,
source,kind), índice cronológico por destinatario e índice parcial unread. Sin
PII, cuerpo libre, URL, snapshots, estado de lectura compartido o backfill. Solo
RPC dueño con sesión activa puede marcar lectura; fuente/identidad inmutables.
RLS destinatario activo, sin acceso general por ser administrador. Proyección de
agenda derivada de preinterviews: solo fechas/canal para titular del caso vigente.

EXTRA085: sin entidades o persistencia nuevas. PDF/XLSX derivan de los mismos
MetricsFilters/MetricRow/as_of de CSV, null/0 y referencias opacas. No almacenar
archivos/contenido en logs o auditoría; el evento actual acredita solicitud
autorizada, no recepción completa. Home usa published_at, filtros usan GET/URL.


**Fecha**: 2026-09-19  
**Fuente**: [spec.md](./spec.md), [plan.md](./plan.md) y [research.md](./research.md).

EXTRA073: sin nuevas entidades/campos/índices ni escrituras. El RPC administrativo
ordenado usa candidate_profiles.updated_at existente (nonnull, mantenido por
trigger de cambios del perfil) exclusivamente como clave de orden. No lo añade
a la proyección del candidato. Comparte IDs/pool/aptitud con el RPC previo;
total y privacidad se conservan. Desempate nombre e ID; sin snapshot de fechas.

EXTRA069: sin tablas/campos persistidos nuevos ni backfill. company_referral
agrega candidateName y el RPC aditivo company_referral_summaries agrega
candidate_name a cada referencia autorizada, leyendo el display_name actual
del perfil relacionado. No copias/historial de nombres, cambios de estado,
versiones, consentimiento, permisos, referencias o auditoría por la consulta.

EXTRA062: no agrega tablas/campos. Publicada editada pasa a pending_review dentro
del guardado/envío; historial audita ambas acciones/versiones, manteniendo slug,
casos/resultados/permisos. Cancelación empresarial no final reutiliza el cierre
existente, conserva finales y queda Cancelada. Proyección de propia contratación
hiredCandidate/displayName/outcome mínima, sin restituir acceso completo o consentimiento.

## Candidate photos — EXTRA-059

Add private metadata/current-photo and durable cleanup records in the additive `202610240001_candidate_photos.sql` migration; SQL is the exact executable schema. Objects use opaque immutable keys in a separate private candidate-photos bucket. Mutations lock and advance the existing candidate profile version, keep one current photo, attribute the authenticated actor in audit and revoke obsolete reads before physical object cleanup. Only current photos can be read using live full-profile authorization. No original filename, public URL, photo requirement or change to CV retention is added. Current photo bytes are permanently removed on owner replacement/removal, per explicit user decision; committed audit is not erased. Design: `../../docs/implementation/candidate-profile-photos.md`.

## A08 — catálogo y proyección administrativa (2026-10-19)

EXTRA057,2026-10-24 sustituye los dos tipos operativos: candidate_categories
conserva kind únicamente occupation. Unión histórica consolidada sin duplicados;
private.legacy_candidate_interests conserva filas originales, created_at,
updated_at original, versión del perfil y versión de migración, con RLS,
append-only y sin grants a roles de aplicación. Definiciones anteriores de los
tres comandos se conservan en private.category_command_recovery. No cambian
IDs de personas/categorías, estados, versiones o consentimientos. Hasta40
categorías por perfil mantiene la capacidad combinada20+20 previa. Matching y
lecturas consumen las mismas relaciones efectivas, ahora categorías únicas.

Quince filas nuevas en `job_categories(version=2)`; IDs generados en servidor,
códigos estables y nombres del catálogo de la matriz. No nuevas tablas ni cambios
a relaciones existentes. Se conservan v1 y sus referencias, sin equivalencias
inferidas. El cruce original admitía ambos tipos; desde EXTRA057 se usan solo
categorías occupation, con los mismos category_id activos y coincidencias.
Proyección: id, displayName, locality, matchedCategories (code/name),
participationId null por compatibilidad: se excluyen participaciones no archivadas
antes del total/paginación. Sin listas persistidas ni puntajes o selecciones.
Ampliación modal: pool privado de lectura compartido por lista y preview, sin
permisos cliente. Preview laboral incorpora experiencia, disponibilidad/vigencia,
rubros, ID del CV vigente y versiones de candidato/oferta; no incorpora DNI,
contactos ni notas. Nominación sigue creando una participación bajo el comando
transaccional y auditoría existentes, sin tablas nuevas ni derivación implícita.

## Referencias de presentación A04 — EXTRA052

private.record_references agrega kind,entity_id,reference única y created_at.
No sustituye identidades UUID; ver contrato private-record-references.md. Backfill
INSERT aislado y triggers de creación, sin incrementar versiones de negocio.

## Convenciones

- Identificadores: UUID generados por servidor.
- Fechas: `timestamptz` en UTC; la interfaz presenta zona `America/Buenos_Aires`.
- Registros mutables: `created_at`, `updated_at` y `version` para bloqueo optimista.
- Archivo recuperable: `archived_at` y `archived_by`; no se borra historia por cascada.
- Texto visible: límites explícitos, normalización Unicode y recorte de espacios.
- Datos sensibles: tablas/proyecciones separadas y RLS; no se copian a auditoría ni logs.
- Actores: una cuenta autenticada o el actor reservado `system` para procesos programados.
- Catálogos y estados: valores centralizados; no se duplican cadenas libres entre UI y base.

## Diagrama lógico resumido

```text
auth.users ── 1:1 ── accounts
                      ├── 0:1 candidate_profiles ── 1:1 candidate_private_data
                      │        ├── * candidate_contacts
                      │        ├── * candidate_categories ── * job_categories
                      │        ├── * candidate_consents
                      │        └── * cv_documents
                      └── 0:1 company_profiles ── * job_openings
                                                     └── * opening_categories ── * job_categories

candidate_profiles ── * participations * ── job_openings
                              ├── * preinterviews
                              ├── 0:1 referrals
                              │       ├── * company_feedback
                              │       └── * company_interviews
                              ├── * contact_events
                              └── * internal_notes

all material aggregates ── * audit_events
import_batches ── * import_rows
candidate/import staging ── * duplicate_reviews
```

## Identidad y acceso

### `accounts`

Representa la identidad de aplicación vinculada a Supabase Auth.

| Campo | Regla |
| --- | --- |
| `id` | UUID primario. |
| `auth_user_id` | UUID único, FK a `auth.users`; no nulo. |
| `role` | `candidate`, `company` o `admin`; inmutable salvo procedimiento administrativo auditado. |
| `status` | `pending_verification`, `active`, `suspended` o `archived`. |
| `suspended_reason` | Solo administración; obligatorio cuando `status = suspended`. |
| `suspended_at`, `suspended_by` | Completos juntos. |
| `archived_at`, `archived_by` | Marcas recuperables históricas. Desde EXTRA039, nuevos archivos empresariales solo por admin; sin autoarchivo ni archivo administrativo candidato nuevo. |
| `last_sign_in_at` | Referencia operativa; no reemplaza datos de Auth. |
| `created_at`, `updated_at`, `version` | Auditoría técnica y concurrencia. |

Reglas:

- Registro público solo crea `candidate` o `company`, con email verificado y contraseña administrada
  por Auth. Un candidato sin email solo puede ingresar mediante atención asistida sin cuenta.
- `admin` se crea fuera del registro público; habrá cuatro cuentas individuales con igual permiso.
- Solo otro administrador activo puede suspender o reactivar una cuenta `admin`, con motivo,
  confirmación y evento auditable; se rechaza autosuspensión o suspensión del último administrador
  activo. Reactivar conserva la misma cuenta y su atribución histórica. `accounts.status = archived`
  no es una transición permitida para `admin` durante el MVP.
- Una cuenta suspendida no puede ejecutar acciones privadas aunque sus registros permanezcan. La
  suspensión revoca además todo acceso empresarial interactivo a datos y CV de candidatos.
- Reactivar una cuenta candidata cambia solo `accounts.status` a `active`: ni la suspensión ni la
  reactivación modifican por sí mismas `candidate_profiles.status`, que conserva el estado anterior.
  Cada operación posterior revalida estado, frescura, disponibilidad, consentimiento y CV cuando
  corresponda; no se reactivan ofertas, participaciones, derivaciones ni permisos relacionados.
- Administración restaura cuentas/perfiles candidatos históricos con motivo y confirmación;
  no elimina el usuario de Auth ni reactiva relaciones. Sin autoarchivo desde EXTRA039
  ni nuevo permiso administrativo de archivo candidato.
- Solo un administrador puede archivar cuenta/perfil empresarial con motivo y confirmación.
  La operación registra actor y fecha, bloquea acceso, marca con archivo recuperable las ofertas no
  finales y revoca permisos empresariales sin borrar historial ni resultados. Solo administración
  restaura con motivo: cuenta a `active`, perfil empresarial a `incomplete` y ofertas a `draft`, sin
  reactivar relaciones.
- El email de acceso reside en Auth; no se duplica en eventos de auditoría.

## Candidatos

### `candidate_profiles`

Contiene el perfil laboral y su estado, separado de identidad restringida.

| Campo | Regla |
| --- | --- |
| `id` | UUID primario. |
| `account_id` | UUID único nullable; nulo para perfil asistido sin cuenta. |
| `origin` | `self_service`, `assisted` o `imported`. |
| `managed_by_admin_id` | Admin responsable; obligatorio para perfiles asistidos/importados sin cuenta. |
| `display_name` | Nombre para administración y presentación autorizada; obligatorio. |
| `locality` | Obligatoria para activar. |
| `skills_experience_summary` | Texto laboral limitado; obligatorio para activar. |
| `availability` | Valor controlado y detalle opcional; obligatorio para activar. |
| `status` | `draft`, `active`, `needs_update`, `unavailable`, `consent_withdrawn` o `archived`. |
| `referral_eligible` | Proyección calculada: activo, disponible, consentimiento vigente, confirmación menor o igual a seis meses y CV válido; no se edita directamente. |
| `last_confirmed_at` | Fecha de confirmación del perfil. |
| `refresh_due_at` | `last_confirmed_at + 6 meses`; al vencer pasa a `needs_update`. |
| `activated_at` | Primera activación válida. |
| `created_at`, `updated_at`, `version`, archivo | Convenciones generales. |

Reglas de activación y uso:

- EXTRA056,2026-10-24: alta presencial interactiva crea y activa atómicamente con
  datos completos y evento de aceptación presencial explícita sobre política
  vigente. No acepta/activa por resolver un duplicado existente; no modifica
  importación, mantenimiento ni perfiles históricos. Contratar aplica EXTRA035.
- Requiere localidad, una o más categorías, resumen laboral, disponibilidad, al menos un contacto y
  consentimiento general vigente.
- En autogestión, activar además requiere CV PDF válido, según FR-010.
- Un perfil asistido puede quedar `active` para búsqueda y evaluación municipal sin CV, pero
  `referral_eligible` permanece falso y toda derivación se bloquea hasta incorporar un PDF válido.
- Un perfil `needs_update`, `unavailable`, `consent_withdrawn` o archivado no aparece por defecto en
  búsqueda de candidatos activos.
- La métrica `active_candidate` usa la misma vigencia de seis meses, pero no exige CV: estado activo,
  disponibilidad activa, consentimiento vigente y `last_confirmed_at` dentro del período.
- El titular corrige sus datos directamente, sin autoarchivo/eliminación de cuenta.
  Restaurar registros históricos exige administración y motivo; devuelve el perfil a `draft`.
- Suspender o reactivar la cuenta vinculada no modifica por sí mismo `candidate_profiles.status`: al
  reactivar, el perfil conserva el estado anterior y sus condiciones vigentes se vuelven a validar
  antes de cada operación. La reactivación no repone participaciones, derivaciones ni permisos.
- La vinculación de un perfil asistido con una cuenta personal exige DNI exhibido y comprobado
  presencialmente por un administrador, sin copia almacenada, y correo verificado en la cuenta. Una
  coincidencia durante el alta deja pendiente la vinculación y no crea un segundo perfil. Conflictos
  de cuenta, DNI o correo se bloquean para la resolución de duplicados; no hay fusión automática.
  La vinculación conserva `candidate_profile.id`, `origin`, consentimiento, estados y relaciones,
  asigna `account_id` una sola vez y registra actor y fecha sin copiar DNI o documento a auditoría.
- Las capacitaciones/orientaciones se registran en `internal_notes` con tipo
  `training_guidance`; no se duplican como campo ni crean un catálogo de cursos.

### `candidate_private_data`

Datos que una empresa nunca puede consultar.

| Campo | Regla |
| --- | --- |
| `candidate_id` | PK/FK a candidato. |
| `dni_normalized` | Solo dígitos; requerido; índice único para impedir alta silenciosa duplicada. |
| `dni_display` | Representación validada para el candidato/admin; en UI se enmascara por defecto. |
| `address` | Opcional; no se incluye en proyecciones empresariales. |

La previsualización de registro/importación compara DNI antes de insertar. Una coincidencia bloquea
el alta hasta una resolución administrativa y nunca fusiona ni sobrescribe automáticamente.

### `duplicate_reviews`

Registra la resolución explícita de una coincidencia detectada durante alta asistida, vinculación o
importación, sin fusionar datos automáticamente.

| Campo | Regla |
| --- | --- |
| `id` | UUID primario. |
| `source_type`, `source_id` | `self_registration`, `assisted_registration`, `account_link` o `import_row` y referencia de staging/correlación sin PII. |
| `matched_candidate_id` | Candidato existente que originó la alerta. |
| `match_basis` | `dni`, `email` o ambos; código sin copiar el valor sensible. |
| `status` | `pending` o `resolved`. |
| `decision` | `use_or_update_existing`, `correct_and_create` o `reject`; nulo hasta resolver. |
| `reason`, `resolved_by`, `resolved_at` | Obligatorios al resolver; visibles solo a administración. |

`correct_and_create` exige corregir primero el dato que produjo el falso positivo y volver a validar
las restricciones únicas. La revisión conserva la decisión y su actor, pero no copia DNI o contacto
a auditoría.

### `candidate_contacts`

| Campo | Regla |
| --- | --- |
| `id`, `candidate_id` | Identidad y propietario. |
| `kind` | `email`, `phone` u `other_approved`. |
| `value`, `normalized_value` | Valor validado y forma para búsqueda de duplicados. |
| `is_primary`, `verified_at` | Solo un primario por tipo; email de autorregistro debe estar verificado en Auth. |
| archivo y timestamps | Recuperables. |

Debe existir al menos un contacto para registro. Las coincidencias por email se marcan para revisión;
no producen fusión automática. Mientras `referrals.access_status = active` y las demás condiciones
de autorización sigan vigentes, la empresa recibe todos los contactos no archivados vigentes; no
existe selección individual por contacto.

### `candidate_consents`

Registro append-only del consentimiento general.

| Campo | Regla |
| --- | --- |
| `id`, `candidate_id` | Identidad y titular. |
| `policy_version` | Versión exacta del texto aprobado. |
| `policy_hash` | Huella del texto presentado. |
| `status` | `accepted` o `withdrawn`. |
| `recorded_by` | Cuenta candidata o admin responsable de atención asistida. |
| `recorded_at` | Fecha efectiva, default clock_timestamp(); no fecha de inicio de transacción. |
| `source` | `self_service`, `assisted` o `hiring_workflow` (solo withdrawn histórico de EXTRA035; sin nuevos retiros por contratación desde EXTRA094). |

El consentimiento vigente es el último evento aceptado no seguido por retiro. Su retiro bloquea
nuevas derivaciones y tratamientos que dependan de él, cierra como `withdrawn` con motivo
`consent_withdrawn` todas las participaciones aún no finales y revoca en la misma transacción el
acceso de todas las derivaciones vigentes, sin borrar historia legítima ni alterar resultados ya
finales. EXTRA094: contratar no escribe ningún consentimiento; cambia disponibilidad
atómicamente. Los retiros hiring_workflow de EXTRA035 se conservan como historial
legado, sin backfill ni reaceptación. Una aceptación
posterior no reactiva automáticamente participaciones ni derivaciones.

### `cv_documents`

| Campo | Regla |
| --- | --- |
| `id`, `candidate_id` | Identidad y titular. |
| `storage_path` | Ruta opaca única en bucket privado. |
| `original_name_safe` | Nombre saneado solo para UI autorizada; nunca se usa como ruta. |
| `mime_type` | `application/pdf`. |
| `byte_size` | Mayor que cero y máximo 5 MiB para demo. |
| `sha256` | Integridad/detección de repetición; no se expone. |
| `status` | `valid`, `superseded`, `rejected` o `archived`. |
| `validation_result` | Código controlado; nunca contenido del archivo. |
| `uploaded_by`, `created_at`, `superseded_at` | Trazabilidad. |

Solo un CV general `valid` vigente por candidato (`opening_id IS NULL`); EXTRA096
permite documentos específicos independientes por oferta. La empresa solo consulta
el documento exacto de una derivación autorizada a una oferta propia. Reemplazar
el general no borra versiones ni cambia selecciones previas de postulaciones.

### `job_categories` y `candidate_categories`

`job_categories`: `id`, `code`, `name`, `description`, `version`, `active`, timestamps. Código y nombre
son únicos dentro de la versión. `candidate_categories`: par único candidato/categoría más
`kind` (solo `occupation` desde EXTRA057) y timestamps. Los antiguos `interest`
se preservan en el historial privado descrito arriba y se consolidan por ID.

El modelo permite multiselección y desactivar entradas sin romper historia. El seed final está
bloqueado hasta resolver OQ-010; tests usan categorías ficticias.

## Empresas y ofertas

### `company_profiles`

| Campo | Regla |
| --- | --- |
| `id`, `account_id` | UUID; una empresa por cuenta en MVP. |
| `legal_name` | Obligatorio. |
| `cuit_normalized`, `cuit_display` | CUIT validado y único; no implica verificación documental. |
| `responsible_name` | Obligatorio. |
| `email`, `phone` | Al menos un contacto; email de acceso verificado para autorregistro. |
| `activity`, `locality` | Obligatorios. |
| `status` | `incomplete`, `active`, `suspended` o `archived`. |
| `suspension_reason`, actor/fecha | Solo admin cuando corresponda. |
| timestamps, `version`, archivo | Convenciones generales. |

No existen documentos de identidad empresarial ni estado “verificado” en el MVP.

Restaurar una empresa archivada exige administración y motivo, y la devuelve a `incomplete`.
La propia empresa puede archivar atómicamente su cuenta y perfil; un administrador también puede
hacerlo con motivo. En ambos casos las ofertas no finales se marcan con archivo recuperable, se
bloquean operaciones empresariales y se revocan permisos de derivación sin borrar casos, resultados
ni historial. La restauración administrativa deja la cuenta `active`, este perfil `incomplete` y las
ofertas en `draft`, sin reactivar relaciones.
Reactivar una cuenta empresarial suspendida cambia esa cuenta a `active` y, en la misma decisión,
devuelve el perfil empresarial a `incomplete`; no reactiva ofertas, participaciones ni accesos
relacionados. La empresa debe completar de nuevo los campos requeridos antes de que el perfil
pueda volver a `active`.

### `job_openings`

| Campo | Regla |
| --- | --- |
| `id`, `company_id` | Identidad UUID interna y propietario; no se sustituyen por el slug. |
| `slug` | Identificador público único: título normalizado más sufijo aleatorio; nulo antes de la primera publicación, obligatorio al publicarse e inmutable después de asignarlo. Las ofertas ya publicadas reciben slug mediante migración aditiva. FR-024A / EXTRA-020. |
| `title`, `tasks`, `requirements` | Textos obligatorios y limitados. |
| `vacancies` | Entero positivo. |
| `location`, `modality`, `schedule` | Obligatorios; modalidad controlada. |
| `contract_type` | Catálogo controlado. |
| `closing_date` | Fecha futura al enviar a revisión. |
| `salary`, `benefits` | Opcionales; texto saneado. |
| `status` | Estado de la máquina definida más abajo. |
| `published_at`, `closed_at` | Coherentes con estado. |
| `moderation_message_public` | Explicación accionable visible solo para `changes_requested` o `rejected`; sin nota sensible. Para otros estados la empresa ve solo el estado. |
| timestamps, `version`, archivo | Convenciones generales. |

`opening_categories` relaciona muchas categorías con una oferta, con par único
oferta/categoría. Una oferta debe tener al menos una antes de revisión.

Una oferta publicada se cierra automáticamente cuando finaliza `closing_date`; deja de ser pública y
de aceptar postulaciones, sin alterar participaciones existentes. Al suspender una empresa, sus
ofertas no finales pasan a `suspended`; una reactivación no las devuelve automáticamente al estado
anterior y administración debe reabrirlas a un estado seguro.
El archivo empresarial no agrega otro estado a la máquina: establece `archived_at` en cada oferta no
final y la excluye de toda operación y proyección pública o empresarial. La restauración
administrativa limpia ese marcador y establece `status = draft`, sin recuperar el estado previo ni
reactivar participaciones, derivaciones o permisos.
La pausa y el cierre ordinario tampoco finalizan participaciones existentes. Cancelar una oferta
finaliza atómicamente como `cancelled` todas sus participaciones aún abiertas y revoca los accesos
empresariales afectados, sin alterar resultados finales previos ni borrar eventos.

`closing_date` es una fecha calendario local: su límite exclusivo es las 00:00 del día siguiente en
`America/Buenos_Aires`, convertido a UTC para comparar con el instante actual. Para una derivación,
`feedback_due_at = referred_at + 720 horas`; el cierre por falta de respuesta aplica al alcanzar o
superar ese instante, no antes.

La proyección pública de una oferta vigente incluye `company_profiles.legal_name`, `title`, `tasks`,
categorías, `vacancies`, `location`, `modality`, `schedule`, `contract_type`, `requirements` y
`closing_date`, más `salary` y `benefits` solo si se informaron. Excluye CUIT, responsable y contactos
privados de la empresa, así como candidatos, participaciones y resultados individuales.

### `opening_moderation_events`

Append-only: `id`, `opening_id`, `decision` (`submitted`, `approved`, `changes_requested`, `rejected`,
`paused`, `resumed`, `closed`, `auto_closed`, `suspended`, `restored_to_draft`, `cancelled`),
`previous_status`, `new_status`, `company_message`, `internal_reason`, `actor_type`,
`actor_account_id`, `created_at`. `actor_account_id` es nulo únicamente para `actor_type = system`.

`company_message` es obligatorio únicamente para solicitud de cambios o rechazo y visible solo a la
empresa dueña; en las demás decisiones no se publica un motivo. `internal_reason` es administrativo
y obligatorio para rechazo, pausa, cierre administrativo, cancelación, suspensión y restauración;
aprobación y reanudación conservan actor, fecha y estados sin exigir motivo. El cierre automático
usa actor `system` y código controlado, no un motivo humano.

## Participaciones e intermediación

### `participations`

Unifica postulación propia y asociación administrativa. EXTRA102: existe como
máximo una participación no archivada cuyo estado no sea withdrawn por
candidato/oferta. Pueden coexistir varios retirados históricos. Solo una nueva
postulación propia puede ignorarlos; nominación administrativa conserva bloqueo
por cualquier caso no archivado. Cada intento conserva ID/CV/eventos/permisos.

| Campo | Regla |
| --- | --- |
| `id`, `candidate_id`, `opening_id` | Relación principal. |
| `origin` | `self_application` o `admin_nomination`. |
| `created_by` | Candidato o admin según origen. |
| `status` | Estado interno completo. |
| `feedback_due_at` | Nulo hasta derivación; luego `referred_at + 30 días`. |
| `final_outcome_at`, `final_outcome_by` | Admin para resultados comunicados por empresa y cancelación individual; candidato o admin a su pedido para retiro; sistema para falta de respuesta. |
| `withdrawal_reason` | Opcional y protegido. |
| timestamps, `version`, archivo | Convenciones generales. |

Precondiciones:

- Postulación propia: oferta publicada/vigente, candidato activo, consentimiento vigente y CV válido.
- Nominación admin: candidato activo y consentimiento vigente; no requiere postulación ni aceptación
  específica por oferta.
- Derivación: admin, oferta propia publicada o en tratamiento válido, consentimiento vigente y CV
  válido. Crear derivación guarda el `cv_document_id` exacto y no expone DNI, domicilio ni notas.
- Revisión, preentrevista y preselección pueden omitirse únicamente al avanzar, con motivo
  administrativo; nunca se omite la derivación.
- Solo admin confirma `hired` o `not_selected` y registra la cancelación individual; el candidato
  puede retirar cualquier participación propia abierta y el admin solo registra un retiro a su
  pedido. Feedback de empresa es una comunicación pendiente; `process_cancelled` puede referirse a
  una sola participación y no cancela por sí mismo la oferta.
- Confirmar `hired` conserva el acceso de la derivación si todavía está `active` y consentimiento,
  cuentas y registros siguen vigentes, pero solo hasta 720 horas después de la confirmación.
  `not_selected`, `withdrawn`, `cancelled` y
  `no_company_response` revocan ese acceso en la
  misma transacción que cambia el resultado.
- La vista del candidato calcula una proyección de `status`: muestra `received` mientras el caso está
  abierto y el resultado final cuando existe; no guarda un segundo estado mutable.

### `preinterviews`

`id`, `participation_id`, `scheduled_at`, `held_at`, `channel` (`phone`, `email`, `whatsapp`,
`in_person`, `video`), `summary_internal`, `recommendation` (`pending`, `preselect`, `do_not_preselect`),
`recorded_by`, timestamps, archivo.

Todo contenido es interno. Puede haber varias instancias y el historial no se sobrescribe.

### `referrals`

| Campo | Regla |
| --- | --- |
| `id`, `participation_id` | Una derivación por participación; el permiso tiene ciclo propio. |
| `referred_by`, `referred_at` | Siempre admin. |
| `access_status` | `active` permite la proyección empresarial solo si también se cumple el plazo poscontratación; `revoked` la deniega de forma persistente; `expired_by_policy` queda reservado a OQ-001. |
| `consent_event_id`, `cv_document_id` | Evidencia vigente al derivar. |
| `feedback_due_at` | Exactamente 30 días desde `referred_at`. |
| `post_hire_access_until` | Confirmación administrativa +720 horas solo si el permiso propio sigue active y autorizado (EXTRA094). Nunca restaura revoked; límite estricto aun antes de Cron. |
| `access_changed_at` | Fecha del último cambio de autorización. |
| `access_changed_actor_type` | `account` o `system`; coherente con el evento que cambió el acceso. |
| `access_changed_by_account_id` | Cuenta responsable; nula únicamente para actor `system`. |
| `access_change_reason` | `referral_created`, `application_withdrawn`, `consent_withdrawn`, `not_selected`, `process_cancelled`, `no_company_response`, `candidate_suspended`, `company_suspended`, `candidate_archived`, `company_archived`, `post_hire_window_ended` o `policy_expired`. |

La autorización de la empresa exige que su empresa sea dueña de la oferta, las cuentas y registros
no estén suspendidos ni archivados, exista consentimiento vigente, `access_status = active`, el
plazo `post_hire_access_until` no haya vencido cuando exista y el recurso solicitado sea
la proyección permitida. La proyección incluye todos los contactos vigentes y exactamente
`cv_document_id`, aunque el candidato haya reemplazado después su CV. El acceso histórico posterior a `hired`
se deniega desde el instante exacto `post_hire_access_until`, aun si la tarea programada todavía no
materializó `revoked` y el evento de auditoría; esa tarea registra actor `system`, plazo y ejecución
sin copiar datos personales. El límite de acceso de 720 horas no elimina ni purga datos. Retiro de postulación o
consentimiento, no selección, cancelación, falta de respuesta, suspensión o archivo cambian el acceso
a `revoked` de forma atómica y auditada. Históricamente EXTRA035 retiraba
consentimiento y revocaba permisos al contratar; EXTRA094 sustituye ese efecto:
confirmar `hired` normal o tardío conserva consentimiento, cambia disponibilidad a
unavailable y no altera otros casos/permisos. Solo el permiso propio previamente
active y autorizado conserva acceso hasta confirmación+720h; revoked nunca revive.
Reactivar una cuenta, restaurar un registro o aceptar nuevamente
el consentimiento tampoco repone acceso automáticamente. El
valor `expired_by_policy` queda reservado y no se usa hasta resolver OQ-001; la evidencia histórica
permanece disponible solo para administración. `unavailable` y `needs_update` afectan nuevas
búsquedas/derivaciones, pero no revocan por sí solos una contratación confirmada.

### `company_feedback`

Append-only: `id`, `referral_id`, `reported_outcome` (`hired`, `not_selected`, `candidate_withdrew`,
`process_cancelled`, `other`), `message`, `reported_by`, `reported_at`, `review_status`
(`pending_admin`, `accepted`, `superseded`). No cambia por sí mismo el resultado final. Una empresa
activa puede registrar feedback tardío sobre una derivación propia aunque `access_status` ya no sea
`active`; esa autorización limitada solo permite ver el identificador de derivación, el identificador
y título de la oferta propia y `referred_at`, sin consultar nombre, perfil, contactos ni CV.

Una corrección tardía puede usar como evidencia este feedback o un `contact_event` administrativo
relacionado con la participación, de canal `phone`, `email`, `whatsapp` o `in_person`, con fecha,
administrador y resumen breve. El resultado corregido solo puede ser `hired`, `not_selected` o
`cancelled`; `no_company_response` permanece como evento histórico reemplazado y el permiso revocado
no vuelve a `active`.

### `company_interviews`

`id`, `referral_id`, `scheduled_at`, `held_at`, `status` (`scheduled`, `completed`, `cancelled`,
`no_show`), `company_message`, `internal_note`, `recorded_by`, timestamps. La empresa no ve
`internal_note`.

### `contact_events`

Registro append-only: `id`, `candidate_id` nullable, `company_id` nullable, `opening_id` nullable,
`participation_id` nullable, `channel` (`phone`, `email`, `whatsapp`, `in_person`), `direction`,
`occurred_at`, `summary_internal`, `next_action_at`, `recorded_by` admin.

Debe referenciar al menos una entidad de negocio. No integra ni envía mensajes.

### `internal_notes`

`id`, `candidate_id` nullable, `participation_id` nullable, `note_kind`, `body`, `created_by`,
`created_at`, `supersedes_note_id` nullable, `archived_at`. Solo administración. Las correcciones
crean nueva versión o evento; no se reescribe silenciosamente la nota original.

## Auditoría y concurrencia

### `audit_events`

EXTRA061 no modifica este modelo append-only. La tarjeta administrativa de cuenta
y perfil del candidato usa una proyección de ocho acciones, id técnico y fecha,
paginada5 con cursor fecha/id. Actores, estados, motivos y eventos ocultos siguen
persistidos íntegramente; la proyección no define retención ni elimina eventos.

Append-only y sin `UPDATE`/`DELETE` para roles de aplicación.

| Campo | Regla |
| --- | --- |
| `id` | UUID. |
| `entity_type`, `entity_id` | Agregado afectado. |
| `action` | Código controlado. |
| `previous_state`, `new_state` | Estados controlados; nullable para acciones sin transición. |
| `reason_code`, `reason_text` | Motivo limitado; obligatorio para rechazo, suspensión, cancelación, salto de etapa, restauración, resolución de duplicado y corrección de resultado tardío. El mensaje accionable visible a la empresa se conserva separado del motivo interno; ninguno debe copiar datos personales a auditoría. |
| `actor_type` | `account` o `system`. |
| `actor_account_id` | Obligatorio si `actor_type = account`. |
| `occurred_at`, `request_id` | Fecha y correlación. |
| `metadata_safe` | JSON con lista permitida; nunca PII, notas ni contenido de archivos. |

La función de transición escribe entidad y evento en la misma transacción. El actor sistema solo puede
usarse desde funciones programadas protegidas para cierres automáticos de ofertas y derivaciones, y
para materializar el vencimiento del acceso empresarial posterior a una contratación confirmada.
El catálogo controlado de `action` cubre las clases enumeradas en FR-050; eventos no aplicables a
una transición usan estados nulos, pero conservan entidad, acción, actor y fecha. El permiso de
lectura de auditoría es administrativo; los roles de aplicación no pueden modificar ni borrar
eventos anteriores. Una falla al insertar el evento revierte también el cambio de entidad y permiso.

## Importaciones

Implementación demo autorizada por Mateo el 2026-09-25: únicamente
`demo-candidates-v1` de `docs/import/candidate-import-v1.md`. No es el mapeo histórico
pendiente de OQ-018/T069. En staging, `decision`, `decision_id` (historial privado
append-only), `target_candidate_id`, `target_version` y `confirmed_fields` conservan
la resolución explícita y la precondición de actualización. Rechazar excluye esa fila
de las aceptadas sin agregar un estado de workflow. Nuevos perfiles quedan borradores
importados, sin cuenta, consentimiento, CV ni confirmación de vigencia inventados.

### `import_batches`

| Campo | Regla |
| --- | --- |
| `id`, `created_by` | Lote y admin responsable. |
| `status` | `uploaded`, `preview_ready`, `blocked`, `confirming`, `completed`, `failed`, `archived`. |
| `mapping_version` | Contrato aprobado aplicado; obligatorio para confirmar. |
| `source_reference_safe` | Referencia sin ruta local ni PII. |
| `file_sha256` | Integridad; no contenido. |
| `total_rows`, `valid_rows`, `warning_rows`, `invalid_rows`, `duplicate_rows` | Conteos coherentes. |
| `confirmed_by`, `confirmed_at`, `completed_at` | Solo para fases respectivas. |
| `failure_code` | Código sanitizado; no fila ni dato personal. |
| `retry_of_batch_id` | Referencia opcional al lote fallido anterior; permite reconstruir intentos sin sobrescribir su resultado. |

El archivo bruto es temporal y se descarta después de previsualizar/confirmar salvo política futura.
Un lote fallido no deja cambios de negocio parciales y no se reanuda: el administrador vuelve a
cargar un archivo corregido, obtiene otra previsualización y confirma un lote nuevo vinculado al
anterior; ambos resultados siguen consultables.

### `import_rows`

Staging protegido: `id`, `batch_id`, `row_number`, `status` (`valid`, `warning`, `invalid`,
`potential_duplicate`, `unmapped_category`, `imported`), `normalized_payload` JSON acotado, `error_codes` array,
`matched_candidate_id` nullable, `created_candidate_id` nullable.

Reglas:

- Solo administradores acceden; nunca se envía a logs.
- No puede confirmar un lote con inválidos, categorías sin mapear o duplicados sin resolución.
- La confirmación vuelve a validar `mapping_version`, hash y estados dentro de una transacción.
- Si cualquier inserción falla, el lote termina `failed` y no quedan candidatos parciales.
- Campos definitivos permanecen pendientes de OQ-018 y del contrato versionado.

## Métricas y exportaciones

Soporte implementado de FR-064 (`EXTRA-001`, 2026-09-26): tablas privadas
`metrics_history`, `metrics_outcomes`, `metrics_coverage` y `metrics_exports`
conservan evidencia mínima y filtros de descarga, no agregados ni datos personales
duplicados. Triggers transaccionales append-only capturan estados/categorías para
consultas históricas; RLS limita lectura a administración. Una base preexistente
solo tiene cobertura desde su línea base, nunca desde fechas inferidas.
Detalle y funciones en `docs/validation/phase-8-metrics.md`.

No se crean tablas agregadas para el MVP. Vistas o funciones protegidas calculan:

- candidatos activos: perfil `active`, disponible, con consentimiento vigente y confirmado dentro de
  los últimos seis meses;
- empresas por estado;
- ofertas por estado;
- participaciones/postulaciones;
- preentrevistas;
- derivaciones;
- contrataciones, no selecciones, retiros, cancelaciones y falta de respuesta;
- tendencias por categoría;
- días desde `published_at` hasta la primera contratación confirmada por administración;
- días desde `published_at` hasta que las contrataciones confirmadas alcanzan `vacancies`, nulo y
  presentado como pendiente mientras falten vacantes.

Filtros mínimos: período y categoría cuando corresponda. Candidatos activos, empresas y ofertas
por estado son una foto al cierre del período; postulaciones, preentrevistas, derivaciones y
resultados usan el instante de su evento dentro del período. La categoría se toma del candidato
para el conteo de candidatos y de la oferta para ofertas y casos; empresas no usan filtro de
categoría. Las vistas respetan RLS y solo admin puede consultarlas/exportarlas. La exportación
genérica contiene solo las filas de métricas visibles con esos filtros: período, categoría
aplicable, indicador, valor, unidad y estado calculado/pendiente; las filas de los dos tiempos de
contratación incluyen además código y título de su oferta. Los dos tiempos por oferta usan como
cohorte las ofertas publicadas dentro del período, incluso cuando sus contrataciones ocurren
después; la categoría se toma de la oferta y las coberturas aún incompletas se muestran pendientes.
No descarga padrones ni listados operativos individuales ni datos personales. La auditoría de
descarga conserva administrador, fecha y filtros, nunca el CSV. Los formatos oficiales adicionales
quedan fuera hasta resolver OQ-005.

## Máquinas de estado

Esta sección resume la persistencia. La fuente normativa de estados, actores, transiciones,
precondiciones, motivos, efectos y errores es `contracts/state-machines.md`; ningún estado definido
solo en este modelo o en `tasks.md` es ejecutable.

### Cuenta

```text
pending_verification -> active -> suspended -> active
                               \-> archived
```

Archivo no elimina registros relacionados. Solo admin suspende/reactiva/restaura; la restauración no
reactiva perfiles, empresas, ofertas ni accesos relacionados. Reactivar una cuenta candidata mueve
solo la cuenta de `suspended` a `active` y conserva sin cambios el estado del perfil candidato;
restaurar un registro archivado es una operación distinta y lo devuelve a su estado seguro.

### Candidato

```text
draft -> active -> needs_update -> active
             |        |
             v        v
        unavailable -> active
             |
             v
    consent_withdrawn -> active (solo con nuevo consentimiento)
             |
             v
          archived --admin/motivo--> draft
```

El proceso de seis meses marca `needs_update`; nunca elimina.

### Oferta

```text
draft -> pending_review -> published -> paused -> published
             |       |          |          |
             |       |          +--------> closed
             |       +-------------------> rejected
             +-> changes_requested -> pending_review

cualquier estado no final --admin--> cancelled
published --system al vencer--> closed
published/paused --admin--> closed
cualquier estado no final --suspensión empresa--> suspended --admin--> draft
```

Solo `published` es pública y recibe postulaciones.

### Participación

```text
received/admin_nomination -> under_review -> preinterview -> preselected -> referred
                                                                      -> company_interview
                                                                      -> awaiting_feedback
                                                                      -> hired
                                                                      -> not_selected
                                                                      -> no_company_response

cualquier estado no final -> withdrawn (candidato, cualquier origen; admin solo a su pedido)
cualquier estado no final -> cancelled (admin, caso individual motivado u oferta cancelada)
no_company_response -> hired | not_selected | cancelled (admin, respuesta tardía con evidencia)
```

- `under_review`, `preinterview` y `preselected` se pueden omitir solo hacia adelante mediante una
  transición administrativa permitida y auditada con motivo; nunca se omite la derivación para dar
  acceso a la empresa.
- `hired`, `not_selected`, `withdrawn`, `cancelled` y `no_company_response` son finales para la vista
  del candidato. El override de respuesta tardía conserva el evento anterior.
- Confirmar `hired` normal/tardío cambia disponibilidad a unavailable y conserva consentimiento
  y demás casos/permisos. Solo el permiso propio todavía activo recibe ventana720h.
  La autorización deniega nuevas lecturas desde
  `post_hire_access_until` aunque la materialización del estado ocurra después; el vencimiento
  pasa el permiso a `revoked` y conserva historia.
  `not_selected`, `withdrawn`, `cancelled` y `no_company_response` lo cambian a `revoked` dentro de la
  misma transacción. Corregir tardíamente `no_company_response` a `hired` conserva la revocación y el
  evento automático previo.
- La empresa comunica feedback, pero no ejecuta la transición final. El feedback
  `process_cancelled` permite al administrador cancelar solo ese caso sin cancelar la oferta; toda
  corrección tardía requiere conservar el cierre previo.

## Índices y restricciones esenciales

- Único: `accounts.auth_user_id`, `candidate_private_data.dni_normalized`,
  `company_profiles.cuit_normalized`, categoría `(version, code)`, relación candidato/categoría,
  oferta/categoría y participación activa `(candidate_id, opening_id)`.
- Índices: estados/fechas de oferta; candidato por estado, localidad, vigencia y disponibilidad;
  tablas puente por categoría; participación por oferta/estado; derivación por empresa implícita vía
  oferta y por `access_status`; `feedback_due_at` y `post_hire_access_until`; auditoría por
  entidad/fecha; importación por lote/fila.
- Checks: vacantes positivas, fecha de cierre coherente, CV 1..5 MiB, tipos/estados válidos, actor
  coherente, cambio de acceso con actor/fecha/motivo completos, fechas de archivo y suspensión completas.
- FKs de historia usan `RESTRICT` o referencias preservadas; ningún cascade borra evidencia.

## Reglas RLS mínimas verificables

- Anónimo: `SELECT` solo sobre proyección de ofertas `published` y vigentes.
- Candidato: su cuenta/perfil/privados/contactos/consentimientos/CV; sus participaciones con proyección
  limitada; nunca notas, preentrevistas o motivos internos.
- Empresa: su perfil/ofertas/moderación visible; puede crear feedback propio incluso tardío sin leer
  datos del candidato; la proyección y el CV requieren oferta propia, `access_status = active`,
  consentimiento vigente y cuentas/registros activos.
- Admin activo: operación autorizada completa; auditoría sigue siendo inmutable.
- Cuenta suspendida: ninguna acción privada, incluso si conserva sesión.
- Secret/system: solo funciones acotadas, nunca navegador.

La matriz completa está en [contracts/authorization-matrix.md](./contracts/authorization-matrix.md).
# Override EXTRA094,2026-10-28

Para confirmaciones posteriores a esta migración, reemplaza retiro automático
EXTRA035: candidate_consents no cambia; candidate_profiles.availability pasa a
unavailable y status active a unavailable, conservando otros estados y vigencia.
Auditoría availability_changed con admin/fecha/motivo hired. No nuevos campos.
referrals.post_hire_access_until fija confirmación+720h solo en permiso propio
previamente active y autorizado; revoked sigue terminal. Otras derivaciones y
participaciones no cambian. Historial previo permanece sin backfill/reconsentir.
Se conserva source hiring_workflow únicamente como historial legado.
## EXTRA096 — Extensión de documentos por postulación

cv_documents.opening_id nullable FK a oferta: NULL solo CV general, no NULL reserva/
documento específico de esa oferta. cv_current único valid no archivado solo para
general. Específicos no se reemplazan al editar general y scope no puede cambiar.
participations.application_cv_document_id nullable FK compuesta documento/titular,
constraint de scope igual a oferta o general. Se fija en inserción propia incluso
al usar general actual. Documento valid/superseded, no rechazado/archivado al compartir.
Casos existentes/admin nomination sin selección siguen NULL, sin backfill. Bytes
inmutables/versionados y permisos exactos de referral.cv_document_id preservados.
Entrada JPG/PNG se normaliza a PDF, por lo que mime_type/path/bucket siguen PDF.
