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
| `last_sign_in_at` | Referencia operativa; no reemplaza datos de Auth. |
| `created_at`, `updated_at`, `version` | Auditoría técnica y concurrencia. |

Reglas:

- Registro público solo crea `candidate` o `company`.
- `admin` se crea fuera del registro público; habrá cuatro cuentas individuales con igual permiso.
- Una cuenta suspendida no puede ejecutar acciones privadas aunque sus registros permanezcan.
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
| `referral_eligible` | Proyección calculada: activo, consentimiento vigente y CV válido; no se edita directamente. |
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
- La vinculación de un perfil asistido con una cuenta personal verifica identidad y duplicados,
  conserva el mismo `candidate_profile.id` y registra evento; nunca copia la historia a otro perfil.
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
| `correction_requested_at` | Solicitud de corrección/eliminación pendiente. |
| `correction_request_note` | Visible solo a admin y al titular cuando corresponda. |

La previsualización de registro/importación compara DNI antes de insertar. Una coincidencia crea una
observación administrativa en lugar de fusionar o sobrescribir.

### `candidate_contacts`

| Campo | Regla |
| --- | --- |
| `id`, `candidate_id` | Identidad y propietario. |
| `kind` | `email`, `phone` u `other_approved`. |
| `value`, `normalized_value` | Valor validado y forma para búsqueda de duplicados. |
| `is_primary`, `verified_at` | Solo un primario por tipo; email de autorregistro debe estar verificado en Auth. |
| `share_after_referral` | Verdadero solo para contactos que la empresa puede recibir después de derivación. |
| archivo y timestamps | Recuperables. |

Debe existir al menos un contacto para registro. Las coincidencias por email se marcan para revisión;
no producen fusión automática.

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
nuevas derivaciones y tratamientos que dependan de él sin borrar historia legítima.

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
| `moderation_message_public` | Motivo accionable visible a la empresa; sin nota sensible. |
| timestamps, `version`, archivo | Convenciones generales. |

`opening_categories` relaciona muchas categorías con una oferta, con par único
oferta/categoría. Una oferta debe tener al menos una antes de revisión.

### `opening_moderation_events`

Append-only: `id`, `opening_id`, `decision` (`submitted`, `approved`, `changes_requested`, `rejected`,
`paused`, `resumed`, `closed`, `cancelled`), `previous_status`, `new_status`, `company_message`,
`internal_reason`, `actor_account_id`, `created_at`.

La empresa solo ve `company_message`; `internal_reason` es administrativo.

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
| `final_outcome_at`, `final_outcome_by` | Solo admin para resultados finales reales. |
| `withdrawal_reason` | Opcional y protegido. |
| timestamps, `version`, archivo | Convenciones generales. |

Precondiciones:

- Postulación propia: oferta publicada/vigente, candidato activo, consentimiento vigente y CV válido.
- Nominación admin: candidato activo y consentimiento vigente; no requiere postulación ni aceptación
  específica por oferta.
- Derivación: admin, oferta propia publicada o en tratamiento válido, consentimiento vigente y CV
  válido. Crear derivación no expone DNI, domicilio ni notas.
- Solo admin registra el resultado final. Feedback de empresa es una comunicación pendiente.
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
| `id`, `participation_id` | Una derivación activa por participación. |
| `referred_by`, `referred_at` | Siempre admin. |
| `access_status` | `active`, `revoked` o `expired_by_policy`. |
| `consent_event_id`, `cv_document_id` | Evidencia vigente al derivar. |
| `feedback_due_at` | Exactamente 30 días desde `referred_at`. |
| `revoked_at`, `revoked_by`, `revocation_reason` | Recuperable y auditado. |

La autorización de la empresa exige que su empresa sea dueña de la oferta, la derivación esté activa
y el recurso solicitado sea la proyección permitida. La retención del acceso después de retiro o
cierre no se amplía hasta que OQ-001 sea resuelta; por defecto se revoca acceso interactivo y se
conserva evidencia solo para administración.

### `company_feedback`

Append-only: `id`, `referral_id`, `reported_outcome` (`hired`, `not_selected`, `candidate_withdrew`,
`process_cancelled`, `other`), `message`, `reported_by`, `reported_at`, `review_status`
(`pending_admin`, `accepted`, `superseded`). No cambia por sí mismo el resultado final.

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
| `reason_code`, `reason_text` | Motivo limitado; obligatorio para rechazo, suspensión, cancelación y override tardío. |
| `actor_type` | `account` o `system`. |
| `actor_account_id` | Obligatorio si `actor_type = account`. |
| `occurred_at`, `request_id` | Fecha y correlación. |
| `metadata_safe` | JSON con lista permitida; nunca PII, notas ni contenido de archivos. |

La función de transición escribe entidad y evento en la misma transacción. El actor sistema solo puede
usarse desde funciones programadas protegidas.

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

El archivo bruto es temporal y se descarta después de previsualizar/confirmar salvo política futura.

### `import_rows`

Staging protegido: `id`, `batch_id`, `row_number`, `status` (`valid`, `warning`, `invalid`,
`potential_duplicate`, `imported`), `normalized_payload` JSON acotado, `error_codes` array,
`matched_candidate_id` nullable, `created_candidate_id` nullable.

Reglas:

- Solo administradores acceden; nunca se envía a logs.
- No puede confirmar un lote con inválidos, categorías sin mapear o duplicados sin resolución.
- La confirmación vuelve a validar `mapping_version`, hash y estados dentro de una transacción.
- Si cualquier inserción falla, el lote termina `failed` y no quedan candidatos parciales.
- Campos definitivos permanecen pendientes de OQ-018 y del contrato versionado.

## Métricas y exportaciones

No se crean tablas agregadas para el MVP. Vistas o funciones protegidas calculan:

- candidatos activos;
- empresas por estado;
- ofertas por estado;
- participaciones/postulaciones;
- preentrevistas;
- derivaciones;
- contrataciones, no selecciones, retiros, cancelaciones y falta de respuesta;
- tendencias por categoría y tiempo de cobertura cuando los datos sean suficientes.

Filtros mínimos: período y categoría cuando corresponda. Las vistas respetan RLS y solo admin puede
consultarlas/exportarlas. Los formatos oficiales adicionales quedan fuera hasta resolver OQ-005.

## Máquinas de estado

### Cuenta

```text
pending_verification -> active -> suspended -> active
                               \-> archived
```

Archivo no elimina registros relacionados. Solo admin suspende/reactiva.

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
          archived
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
published/paused --admin--> closed
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

cualquier estado no final -> withdrawn (candidato/admin según origen)
cualquier estado no final -> cancelled (admin por cierre justificado)
no_company_response -> hired | not_selected | withdrawn | cancelled (admin, respuesta tardía)
```

- Las etapas se pueden omitir solo mediante transición administrativa permitida y auditada; nunca se
  omite la derivación para dar acceso a la empresa.
- `hired`, `not_selected`, `withdrawn`, `cancelled` y `no_company_response` son finales para la vista
  del candidato. El override de respuesta tardía conserva el evento anterior.
- La empresa comunica feedback, pero no ejecuta la transición final.

## Índices y restricciones esenciales

- Único: `accounts.auth_user_id`, `candidate_private_data.dni_normalized`,
  `company_profiles.cuit_normalized`, categoría `(version, code)`, relación candidato/categoría,
  oferta/categoría y participación activa `(candidate_id, opening_id)`.
- Índices: estados/fechas de oferta; candidato por estado, localidad, vigencia y disponibilidad;
  tablas puente por categoría; participación por oferta/estado; derivación por empresa implícita vía
  oferta; `feedback_due_at`; auditoría por entidad/fecha; importación por lote/fila.
- Checks: vacantes positivas, fecha de cierre coherente, CV 1..5 MiB, tipos/estados válidos, actor
  coherente, fechas de archivo y suspensión completas.
- FKs de historia usan `RESTRICT` o referencias preservadas; ningún cascade borra evidencia.

## Reglas RLS mínimas verificables

- Anónimo: `SELECT` solo sobre proyección de ofertas `published` y vigentes.
- Candidato: su cuenta/perfil/privados/contactos/consentimientos/CV; sus participaciones con proyección
  limitada; nunca notas, preentrevistas o motivos internos.
- Empresa: su perfil/ofertas/moderación visible; feedback propio; proyección de candidatos y CV solo
  para derivaciones activas de ofertas propias.
- Admin activo: operación autorizada completa; auditoría sigue siendo inmutable.
- Cuenta suspendida: ninguna acción privada, incluso si conserva sesión.
- Secret/system: solo funciones acotadas, nunca navegador.

La matriz completa está en [contracts/authorization-matrix.md](./contracts/authorization-matrix.md).
