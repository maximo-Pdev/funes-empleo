# Modelo de datos: MVP del Portal Municipal de Empleo de Funes

**Fecha**: 2026-09-19  
**Fuente**: [spec.md](./spec.md), [plan.md](./plan.md) y [research.md](./research.md).

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
| `archived_at`, `archived_by` | Archivo recuperable; en autogestión puede iniciarlo el titular. |
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
- La solicitud de eliminación del candidato archiva inmediatamente cuenta y perfil; no elimina el
  usuario de Auth. Solo administración restaura con motivo y sin reactivar relaciones.
- Una empresa puede archivar su propia cuenta/perfil y un administrador puede archivarlos con motivo.
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

- Requiere localidad, una o más categorías, resumen laboral, disponibilidad, al menos un contacto y
  consentimiento general vigente.
- En autogestión, activar además requiere CV PDF válido, según FR-010.
- Un perfil asistido puede quedar `active` para búsqueda y evaluación municipal sin CV, pero
  `referral_eligible` permanece falso y toda derivación se bloquea hasta incorporar un PDF válido.
- Un perfil `needs_update`, `unavailable`, `consent_withdrawn` o archivado no aparece por defecto en
  búsqueda de candidatos activos.
- La métrica `active_candidate` usa la misma vigencia de seis meses, pero no exige CV: estado activo,
  disponibilidad activa, consentimiento vigente y `last_confirmed_at` dentro del período.
- El titular corrige sus datos directamente. Solicitar eliminación archiva cuenta/perfil en la misma
  operación; restaurar exige administración, motivo y devuelve el perfil a `draft`.
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
| `recorded_at` | Fecha efectiva. |
| `source` | `self_service` o `assisted`. |

El consentimiento vigente es el último evento aceptado no seguido por retiro. Su retiro bloquea
nuevas derivaciones y tratamientos que dependan de él, cierra como `withdrawn` con motivo
`consent_withdrawn` todas las participaciones aún no finales y revoca en la misma transacción el
acceso de todas las derivaciones vigentes, sin borrar historia legítima ni alterar resultados ya
finales. Una aceptación posterior no reactiva automáticamente participaciones ni derivaciones.

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

Solo un CV `valid` vigente por candidato. La empresa solo lo descarga si existe derivación autorizada
a una oferta propia. Reemplazar no borra la versión anterior.

### `job_categories` y `candidate_categories`

`job_categories`: `id`, `code`, `name`, `description`, `version`, `active`, timestamps. Código y nombre
son únicos dentro de la versión. `candidate_categories`: par único candidato/categoría más
`kind` (`occupation` o `interest`) y timestamps.

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
| `id`, `company_id` | Identidad y propietario. |
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

Unifica postulación propia y asociación administrativa; existe como máximo una participación no
archivada por candidato/oferta.

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
| `post_hire_access_until` | Nulo hasta confirmar `hired` con permiso todavía activo; luego instante de confirmación administrativa +720 horas. No se rellena para un permiso revocado ni se reinicia por corrección tardía. |
| `access_changed_at` | Fecha del último cambio de autorización. |
| `access_changed_actor_type` | `account` o `system`; coherente con el evento que cambió el acceso. |
| `access_changed_by_account_id` | Cuenta responsable; nula únicamente para actor `system`. |
| `access_change_reason` | `referral_created`, `application_withdrawn`, `consent_withdrawn`, `not_selected`, `process_cancelled`, `no_company_response`, `candidate_suspended`, `company_suspended`, `candidate_archived`, `company_archived`, `post_hire_window_ended` o `policy_expired`. |

La autorización de la empresa exige que su empresa sea dueña de la oferta, las cuentas y registros
no estén suspendidos ni archivados, exista consentimiento vigente, `access_status = active`, el
plazo `post_hire_access_until` no haya vencido cuando exista y el recurso solicitado sea
la proyección permitida. La proyección incluye todos los contactos vigentes y exactamente
`cv_document_id`, aunque el candidato haya reemplazado después su CV. El acceso posterior a `hired`
se deniega desde el instante exacto `post_hire_access_until`, aun si la tarea programada todavía no
materializó `revoked` y el evento de auditoría; esa tarea registra actor `system`, plazo y ejecución
sin copiar datos personales. El límite de acceso de 720 horas no elimina ni purga datos. Retiro de postulación o
consentimiento, no selección, cancelación, falta de respuesta, suspensión o archivo cambian el acceso
a `revoked` de forma atómica y auditada. Confirmar `hired` lo mantiene solo durante esa ventana; una corrección tardía desde
`no_company_response` a `hired` no vuelve a activarlo, porque la contratación solo conserva un
permiso que no había sido revocado. Reactivar una cuenta, restaurar un registro o aceptar nuevamente
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
- `hired` mantiene `referrals.access_status = active` cuando ya estaba activo y no existe otro
  bloqueo, con `post_hire_access_until` fijado a confirmación +720 horas. La autorización deniega
  nuevas lecturas desde ese instante aunque la materialización del estado ocurra después; el
  vencimiento pasa el permiso a `revoked` y conserva historia.
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
