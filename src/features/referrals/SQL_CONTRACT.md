# Contrato SQL de US1 para servicios paralelos

Este documento describe las firmas implementadas en las migraciones `202609190010`–`012`.
Los RPC `public` se invocan con la sesión Supabase del usuario (`authenticated`), jamás con
`service_role` desde una acción interactiva. El actor, rol, propiedad y estado se derivan en la
base; no deben enviarse desde el formulario. Los motivos libres quedan en `private.workflow_decisions`;
la auditoría guarda solo un `decision_id` opaco. Ninguna operación expone DNI, domicilio o notas a
empresa. Una excepción técnica aprobada se describe abajo para feedback append-only.

## T028: moderación de ofertas

`transition_opening(p_opening uuid, p_expected_version integer, p_command text,
p_reason text default null, p_company_message text default null) -> integer`

Devuelve la nueva versión de `job_openings`. Comandos: `submit` (solo empresa titular),
`approve`, `request_changes`, `reject`, `pause`, `resume`, `close`, `suspend`,
`restore_to_draft`, `cancel` (solo administrador). `request_changes` y `reject` requieren
`p_company_message` accionable; `reject`, `pause`, `close`, `suspend`, `restore_to_draft` y
`cancel` requieren `p_reason` interno. No enviar mensaje empresarial para otros comandos.
`approve`/`resume` no requieren motivo. `cancel` finaliza solo las participaciones abiertas y
revoca sus permisos en la misma transacción; `pause` y `close` no las finalizan.

En caso de error, `CONFLICT_STALE_DATA` exige recargar la versión; `INVALID_TRANSITION` indica
estado o precondición no vigente; `INVALID_INPUT` indica motivo/mensaje inválido; `NOT_FOUND`
oculta oferta ajena; `FORBIDDEN` niega acción por rol; `AUTH_REQUIRED` niega sesión inactiva.
La UI debe traducir el código sin mostrar SQL ni motivo interno.

## T025/T030/T035: participación y evaluación municipal

`create_participation(p_candidate uuid, p_candidate_version integer, p_opening uuid,
p_opening_version integer, p_origin text) -> uuid`: `self_application` exige titular, CV válido,
consentimiento y oferta publicada vigente; `admin_nomination` exige administrador y no requiere
confirmación específica por oferta. Ambos orígenes excluyen perfiles con una cuenta vinculada
suspendida. Devuelve el ID nuevo.

`transition_participation(p_participation uuid, p_expected_version integer, p_command text,
p_reason text default null, p_candidate_request uuid default null, p_feedback uuid default null,
p_contact uuid default null) -> integer`: devuelve versión nueva. Comandos administrativos:
`review`, `preinterview`, `preselect`, `refer`, `interview`, `await_feedback`, `hire`,
`not_select`, `cancel`, `late_hire`, `late_not_selected`, `late_cancel`.
`withdraw` lo puede ejecutar el titular de una participación abierta de cualquier origen; si lo
ejecuta administración, `p_candidate_request` debe señalar un `contact_event` entrante,
fechado y vinculado a esa participación. `cancel` exige motivo operativo y no cancela la oferta.
Si `cancel` recibe `p_feedback`, este debe pertenecer a la misma derivación y comunicar
`process_cancelled`; queda aceptado en la misma transacción.
Un salto desde una etapa previa que omita revisión, preentrevista o preselección requiere
`p_reason`; `refer` nunca se omite y fija CV y consentimiento exactos. `hire`/`not_select`
aceptan `p_feedback`, `p_contact` o motivo administrativo. La corrección `late_*` solo parte de
`no_company_response`, requiere motivo y `p_feedback` compatible o contacto municipal
vinculado, fechado y registrado por un administrador. El permiso revocado no se reabre.

`record_preinterview(p_participation uuid, p_expected_version integer, p_channel text,
p_scheduled_at timestamptz, p_held_at timestamptz, p_summary text,
p_recommendation text, p_skip_reason text default null) -> integer`: escribe preentrevista,
participación y auditoría atómicamente. `p_channel` admite `phone|email|whatsapp|in_person|video`;
`p_recommendation` admite `pending|preselect|do_not_preselect`. Si el caso está `received`,
`p_skip_reason` es obligatorio por omitir revisión.

`record_contact(p_participation uuid, p_expected_version integer, p_channel text,
p_direction text, p_occurred_at timestamptz, p_summary text,
p_next_action_at timestamptz default null) -> integer`: inserción append-only con nueva versión
de participación. Canal: `phone|email|whatsapp|in_person`; dirección: `inbound|outbound`.
Un contacto `inbound` puede servir como evidencia de retiro solicitado; un contacto municipal
de cualquier canal permitido puede fundamentar una corrección tardía.

`record_internal_note(p_candidate uuid, p_expected_version integer, p_participation uuid,
p_kind text, p_body text, p_supersedes uuid default null) -> uuid`: nota nueva, nunca
reescritura de la anterior. `p_participation` puede ser `null`; `p_kind` es `applicant` o
`training_guidance`. El control de versión corresponde a `candidate_profiles`.

`admin_workflow_timeline(p_entity_type text, p_entity_id uuid)` devuelve evento, acción,
estados, actor, fecha, código y motivo privado asociado para una entidad de US1; solo lo puede
consultar administración activa. La empresa/candidato no reciben este motivo.

Errores habituales: `CONFLICT_STALE_DATA`, `INVALID_TRANSITION`, `INVALID_INPUT`,
`CONSENT_REQUIRED`, `VALID_CV_REQUIRED`, `NOT_FOUND`, `FORBIDDEN`, `AUTH_REQUIRED`.
Para resultado/cancelación, el servicio debe volver a leer la versión después de otra acción.

## T031–T036: proyección, CV y feedback

`company_referral_references(p_opening uuid)` devuelve filas con `referral_id`, `opening_id`,
`opening_title` y `referred_at`, únicamente de oferta propia para empresa activa.
`company_referral(p_referral uuid) -> jsonb` devuelve esos cuatro campos. Solo si la derivación
mantiene acceso efectivo añade `candidate` (perfil laboral, todos los contactos vigentes,
`cvDocumentId` exacto), entrevistas, feedback y versión de participación para registrar
entrevista. Después de revocación o vencimiento, el JSON conserva **solo** los cuatro campos
de referencia; no se entrega versión, resultado individual ni dato personal.

`authorized_cv_path(p_cv uuid) -> text` reautoriza titular, administrador o empresa con
derivación propia vigente y CV exacto. Solo el Route Handler privado consume la ruta; Storage
revalida con RLS al descargar. No se entrega enlace firmado reutilizable.

`submit_company_feedback(p_referral uuid, p_reported_outcome text,
p_message text default null) -> uuid` permite a empresa activa informar también después de
revocación o `no_company_response`, siempre que todavía no exista un resultado real confirmado.
Resultados: `hired|not_selected|candidate_withdrew|`
`process_cancelled|other`. Es la **excepción aprobada** a la versión esperada: la inserción
append-only bloquea y revalida participación/propiedad/estado en la transacción, no cambia el
estado final ni exige una versión que agregaría un quinto dato a la referencia revocada.

`submit_company_interview(p_referral uuid, p_expected_version integer, p_status text,
p_scheduled_at timestamptz, p_held_at timestamptz,
p_company_message text default null) -> uuid` requiere permiso de derivación vigente y al menos
una fecha. Estados `scheduled|completed|cancelled|no_show`. La función registra entrevista,
avance de participación cuando corresponde e historial en una sola transacción.

La función privada `run_daily_employment_maintenance(p_now timestamptz)` está programada una vez
al día mediante Supabase Cron; **no** se invoca con la sesión interactiva. Cierra ofertas al
final de su fecha local, casos sin respuesta a 720 horas exactas desde la derivación y
materializa vencimientos de permiso a 720 horas desde contratación confirmada. Repetirla no
duplica eventos. La autorización de lectura verifica el instante exacto aun antes de Cron.

## Recuperación y límites

Las migraciones son forward-only. En local/demo con datos ficticios, ante un error se conserva
el diagnóstico sanitizado, se prepara una migración correctiva y, si corresponde, se reconstruye
desde migraciones y seed ficticio. No editar una migración ya aplicada ni usar datos reales.
Las rutas de CV impiden nuevas descargas al revocar; no pueden recuperar copias ya descargadas.
OQ-001 (retención) permanece abierta; las 720 horas son solo límite de acceso.
