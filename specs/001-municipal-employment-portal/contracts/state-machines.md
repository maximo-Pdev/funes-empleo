# Contratos de comandos y estados

Cada comando es atómico: valida actor, versión, estado y precondiciones; modifica el agregado e
inserta el evento de historial dentro de la misma transacción.

Este contrato es la fuente normativa operativa de estados y transiciones del MVP, subordinada a los
requisitos de `spec.md`. `data-model.md` define persistencia y puede resumir estas máquinas, pero no
agrega estados ni transiciones ejecutables. Las tablas siguientes cubren cuenta, perfil empresarial,
perfil candidato, oferta, participación, permiso de derivación, consentimiento, CV e importación.
Toda transición usa la versión esperada, registra actor/fecha/estado anterior/nuevo y exige motivo
solo cuando la fila lo indica. Los errores y conflictos se resuelven por la sección final de este
contrato.

## Cuenta

| Comando | Actor | Desde | Hacia | Motivo | Precondiciones y efecto |
| --- | --- | --- | --- | --- | --- |
| Aprovisionar administrador | Operador autorizado del entorno | inexistente | `pending_verification` | No | Fuera del registro público, identidad individual confirmada y acción auditada; en producción el operador permanece bloqueado por OQ-006. |
| Aceptar invitación administrativa | Persona invitada + Sistema/Auth | `pending_verification` | `active` | No | Token vigente; conserva rol `admin` no editable y nunca usa elevación pública. |
| Verificar autorregistro | Sistema/Auth | `pending_verification` | `active` | No | Token vigente de candidato o empresa; habilita sesión privada y conserva perfil `draft` o `incomplete`. |
| Suspender candidato/empresa | Admin | `active` | `suspended` | Obligatorio | Acción destacada y confirmada; bloquea operaciones privadas y aplica los efectos relacionados de suspensión. |
| Reactivar candidato | Admin | `suspended` | `active` | Obligatorio | Revalida vigencia; el perfil candidato conserva su estado y no reabre relaciones ni permisos. |
| Reactivar empresa | Admin | `suspended` | `active` | Obligatorio | Perfil empresarial a `incomplete`; ofertas y permisos no se reactivan. |
| Suspender administrador | Otro admin activo | `active` | `suspended` | Obligatorio | Confirmación; prohíbe autosuspensión y dejar cero administradores activos. |
| Reactivar administrador | Otro admin activo | `suspended` | `active` | Obligatorio | Conserva identidad y atribución histórica. |
| Archivar candidato | Candidato titular | `active` | `archived` | No | Solicitud confirmada; archiva cuenta/perfil, bloquea actividad y revoca accesos sin borrar historia. |
| Archivar empresa propia | Empresa titular | `active` | `archived` | No | Archiva cuenta/perfil y ofertas no finales; revoca permisos y conserva casos/resultados. |
| Archivar empresa administrativamente | Admin | `active`, `suspended` | `archived` | Obligatorio | Mismos efectos del archivo propio, con actor y motivo administrativos. |
| Restaurar candidato | Admin | `archived` | `active` | Obligatorio | Sin conflictos/duplicados; perfil a `draft`, sin reabrir relaciones ni permisos. |
| Restaurar empresa | Admin | `archived` | `active` | Obligatorio | Sin conflictos; perfil a `incomplete` y ofertas a `draft`, sin reabrir relaciones ni permisos. |

El autorregistro nunca crea `admin`; las cuentas administrativas no tienen transición a `archived`
en el MVP. Cerrar sesión no cambia `accounts.status`; recuperación de acceso conserva la cuenta y el
rol y no constituye una transición de negocio.

## Perfil empresarial

| Comando | Actor | Desde | Hacia | Motivo | Precondiciones y efecto |
| --- | --- | --- | --- | --- | --- |
| Crear perfil | Empresa verificada | inexistente | `incomplete` | No | Asocia una sola empresa a su cuenta. |
| Completar/habilitar | Empresa titular | `incomplete` | `active` | No | Nombre, CUIT único, responsable, contacto, actividad y localidad completos; no exige verificación documental. |
| Suspender por cuenta | Admin | `active`, `incomplete` | `suspended` | Obligatorio | Ocurre con suspensión de cuenta; bloquea ofertas nuevas y revoca permisos sin fabricar resultados. |
| Reactivar cuenta | Admin | `suspended` | `incomplete` | Obligatorio | Requiere volver a completar/verificar datos; no reactiva ofertas ni permisos. |
| Archivar | Empresa titular o admin | `active`, `incomplete`, `suspended` | `archived` | Solo si actúa admin | Ocurre atómicamente con la cuenta y ofertas no finales; preserva historia. |
| Restaurar | Admin | `archived` | `incomplete` | Obligatorio | Cuenta a `active`, ofertas a `draft`; no reactiva participaciones, derivaciones ni permisos. |

## Oferta laboral

| Comando | Actor | Desde | Hacia | Precondiciones y efecto |
| --- | --- | --- | --- | --- |
| Guardar borrador | Empresa propia/admin | `draft`, `changes_requested` | igual | Valida campos presentes sin publicar. |
| Enviar a revisión | Empresa propia | `draft`, `changes_requested` | `pending_review` | Cuenta y perfil empresarial activos, todos los campos obligatorios, categoría activa y fecha futura. |
| Aprobar/publicar | Admin | `pending_review` | `published` | Registra actor, fecha y estados sin exigir motivo; recién entonces acepta postulaciones. |
| Solicitar cambios | Admin | `pending_review` | `changes_requested` | Mensaje accionable a empresa obligatorio; motivo interno opcional y oculto. |
| Rechazar | Admin | `pending_review` | `rejected` | Motivo interno obligatorio y mensaje accionable a empresa; no se publica el motivo interno. |
| Pausar | Admin | `published` | `paused` | Motivo interno obligatorio; empresa ve estado sin motivo. Sale de consulta pública y no recibe postulaciones nuevas. |
| Reanudar | Admin | `paused` | `published` | Sigue completa y dentro de vigencia; registra actor/fecha/estados sin exigir motivo. |
| Cerrar | Admin | `published`, `paused` | `closed` | Motivo interno obligatorio; empresa ve estado sin motivo. Conserva participaciones para seguimiento. |
| Cerrar por vencimiento | Sistema | `published` al alcanzar las 00:00 del día posterior a `closing_date` en `America/Buenos_Aires` | `closed` | Sale del público, bloquea postulaciones y conserva participaciones; ejecución idempotente. |
| Suspender por cuenta | Admin | cualquier no final | `suspended` | Motivo interno y confirmación explícita; empresa ve solo estado. Revoca operaciones nuevas y conserva casos. |
| Devolver suspendida a borrador | Admin | `suspended` | `draft` | Decisión municipal separada de la reactivación de la cuenta; motivo interno y control de vigencia; empresa ve solo el estado. |
| Restaurar archivada | Admin | Registro con `archived_at` | `draft` | Motivo interno y control de conflictos; limpia el marcador de archivo, la empresa ve el estado sin motivo y nunca recupera automáticamente el estado previo. |
| Cancelar | Admin | cualquier no final | `cancelled` | Motivo interno obligatorio; empresa ve estado sin motivo. Cierra atómicamente como `cancelled` participaciones no finales, revoca sus permisos empresariales, conserva historia y resultados ya finales. |

La empresa nunca ejecuta publicar, aprobar, rechazar, pausar, suspender, reactivar, restaurar, cerrar
o cancelar.

## Perfil candidato

| Comando | Actor | Desde | Hacia | Motivo | Precondiciones y efecto |
| --- | --- | --- | --- | --- | --- |
| Registrar autogestionado | Persona | inexistente | `draft` | No | Email verificable, nombre, DNI y contraseña; cuenta `pending_verification`; duplicado potencial bloquea consolidación. |
| Crear asistido | Admin | inexistente | `draft` | No | Nombre, DNI y contacto; no exige cuenta ni CV; registra responsable. |
| Activar | Titular/admin asistente | `draft` | `active` | No | Datos, categorías, disponibilidad y consentimiento completos; autogestión exige CV válido; fija vigencia de seis meses. |
| Vencer vigencia | Candidato/admin cuya solicitud invoca la función protegida | `active` | `needs_update` | Código `freshness_due` | `refresh_due_at <= now()`; reevaluación idempotente al consultar/operar, sale de búsquedas activas y nuevas derivaciones sin borrar casos. No es una tarea Cron ni usa actor `system`. |
| Confirmar/actualizar | Titular/admin | `needs_update` | `active` | No | Datos y condiciones válidos; actualiza `last_confirmed_at` y `refresh_due_at`. |
| Corregir datos | Titular/admin autorizado | Cualquier estado salvo `archived` | igual | No | Aplica entrada válida directamente y registra historia; no crea solicitud pendiente. |
| Desactivar disponibilidad | Titular/admin | `active`, `needs_update` | `unavailable` | No | No borra participaciones ni revoca por sí sola un permiso de contratación confirmado. |
| Reactivar disponibilidad | Titular/admin | `unavailable` | `active` | No | Revalida datos, frescura y consentimiento; actualiza confirmación cuando corresponde. |
| Retirar consentimiento | Titular/admin autorizado | Cualquier estado salvo `archived`, `consent_withdrawn` | `consent_withdrawn` | No | Cierra abiertas como `withdrawn`, revoca permisos y preserva finales/historia. |
| Aceptar nuevo consentimiento | Titular/admin autorizado | `consent_withdrawn` | `active` | No | Política vigente y demás condiciones de activación válidas; no reabre participaciones ni permisos previos. |
| Solicitar eliminación | Titular | Cualquier estado propio salvo `archived` | `archived` | No | Archiva cuenta/perfil inmediatamente; revoca actividad/accesos sin borrar historia. |
| Restaurar | Admin | `archived` | `draft` | Obligatorio | Ausencia de conflicto; cuenta utilizable, sin reactivar participaciones, CV ni derivaciones. |
| Vincular cuenta | Admin + candidato | igual | igual | No | Correo verificado y DNI exhibido/comprobado presencialmente sin copia; resuelve conflictos, conserva ID/origen/consentimiento/estado/historia y asigna `account_id`. |

## Participación y derivación

Estados internos: `received`, `under_review`, `preinterview`, `preselected`, `referred`,
`company_interview`, `awaiting_feedback`, `hired`, `not_selected`, `withdrawn`, `cancelled`,
`no_company_response`.

| Comando | Actor | Precondiciones | Efecto |
| --- | --- | --- | --- |
| Postular | Candidato | Perfil activo, consentimiento/CV vigentes, oferta publicada y sin participación existente | Crea `received`, origen `self_application`; candidato ve recepción. |
| Nominar | Admin | Candidato activo, consentimiento vigente, oferta tratable | Crea `under_review`, origen `admin_nomination`; no exige confirmación por oferta. |
| Iniciar revisión | Admin | `received` | `under_review`. |
| Registrar preentrevista | Admin | Participación no final | Agrega preentrevista; puede pasar a `preinterview`. |
| Preseleccionar | Admin | Evaluación suficiente y participación no final | `preselected`; sigue oculta a empresa. |
| Avanzar omitiendo etapa | Admin | Destino posterior a revisión, preentrevista o preselección y anterior/igual a derivación | Avanza solo hacia adelante; motivo obligatorio; no permite saltar la derivación. |
| Derivar | Admin | Candidato activo, consentimiento vigente, CV PDF válido, oferta propia de la empresa y no final | Crea derivación, guarda el `cv_document_id` exacto, fija fecha límite +30 días y habilita todos los contactos vigentes. |
| Registrar entrevista | Empresa propia o admin | Derivación activa | Agrega entrevista; estado puede pasar a `company_interview`. |
| Comunicar feedback | Empresa propia | Derivación propia existente, aunque su permiso de datos esté revocado, y sin resultado real confirmado | Agrega feedback `pending_admin`; no fija resultado final ni habilita perfil/contactos/CV. |
| Marcar espera | Admin | Participación derivada sin resultado final | `awaiting_feedback`; no altera fecha límite original. |
| Confirmar resultado empresarial | Admin | Feedback/evidencia registrada o motivo administrativo, participación no final | `hired` conserva un permiso todavía activo y fija `post_hire_access_until` a confirmación +720 horas; `not_selected` lo revoca; actor admin obligatorio. |
| Cerrar sin respuesta | Sistema | Derivada, sin final y `feedback_due_at = referred_at + 720 horas` con `feedback_due_at <= now()` | `no_company_response`, revocación y eventos una sola vez, con actor sistema. |
| Corregir respuesta tardía | Admin | `no_company_response` y feedback del portal o contacto municipal `phone`, `email`, `whatsapp` o `in_person`, con fecha, actor y nota breve | `hired`, `not_selected` o `cancelled`; conserva el cierre automático como evento anterior reemplazado, muestra el resultado nuevo como vigente y mantiene revocado el permiso, incluso si pasa a `hired`. |
| Retirar participación | Candidato titular o admin que registra su solicitud | Participación no final de cualquier origen; si actúa admin, solicitud del candidato registrada | `withdrawn`; revoca inmediatamente el permiso empresarial sin borrar historia. |
| Cancelar participación individual | Admin | Participación no final y motivo operativo registrado, incluido feedback empresarial `process_cancelled` | `cancelled` solo para ese caso; revoca su permiso empresarial, sin cancelar la oferta ni afectar otros casos. |
| Cancelar oferta | Admin | Oferta cancelable, motivo registrado | `cancelled` para cada participación no final de esa oferta y revocación de permisos afectados; resultados finales previos permanecen. |
| Vencer acceso poscontratación | Sistema | `hired`, `post_hire_access_until <= now()` y permiso aún `active` | Materializa `revoked` con motivo `post_hire_window_ended` y evento único; la autorización ya deniega nuevas consultas/descargas desde el instante de vencimiento. |

Una transición administrativa puede omitir `under_review`, `preinterview` o `preselected` cuando el
caso lo justifique, siempre hacia adelante y con motivo. Nunca puede entregar datos empresariales sin
una derivación explícita y auditada.

Los orígenes y destinos normativos son: postulación `∅ -> received`; nominación
`∅ -> under_review`; revisión `received -> under_review`; preentrevista desde `received` o
`under_review` hacia `preinterview`; preselección desde cualquier etapa anterior abierta hacia
`preselected`; derivación desde `received`, `under_review`, `preinterview` o `preselected` hacia
`referred`; entrevista desde `referred` o `awaiting_feedback` hacia `company_interview`; espera desde
`referred` o `company_interview` hacia `awaiting_feedback`; resultado administrativo desde
`referred`, `company_interview` o `awaiting_feedback` hacia `hired` o `not_selected`; cierre por falta
de respuesta desde esos mismos estados hacia `no_company_response`; corrección tardía desde
`no_company_response` hacia `hired`, `not_selected` o `cancelled`; y retiro/cancelación desde
cualquier estado no final hacia `withdrawn`/`cancelled`. No existen transiciones ejecutables desde
un resultado final salvo la corrección tardía indicada.

La revocación funciona como un enclavamiento: `revoked` no vuelve a `active` por reconsentimiento,
reactivación, restauración o corrección tardía. `expired_by_policy` no tiene transición ejecutable
hasta que se resuelva OQ-001. Cada cambio de participación, acceso y auditoría es transaccional.
Reconsentir tampoco reabre participaciones cerradas por retiro del consentimiento.
Las 720 horas son solo una ventana de acceso posterior a contratación, no retención o purga de
perfil, CV e historial. Una corrección tardía a `hired` no fija una nueva ventana si el permiso ya
había sido revocado.

## Permiso de derivación

| Comando | Actor | Desde | Hacia | Motivo/código | Precondiciones y efecto |
| --- | --- | --- | --- | --- | --- |
| Crear permiso | Admin al derivar | inexistente | `active` | `referral_created` | Consentimiento y CV vigentes; fija `consent_event_id`, `cv_document_id`, `referred_at` y límite de feedback. |
| Revocar por retiro | Candidato o admin autorizado | `active` | `revoked` | `application_withdrawn` | Ocurre atómicamente con el retiro. |
| Revocar por consentimiento | Candidato o admin autorizado | `active` | `revoked` | `consent_withdrawn` | Revoca todos los permisos afectados y cierra participaciones abiertas. |
| Revocar por resultado/cancelación | Admin o sistema según resultado | `active` | `revoked` | `not_selected`, `process_cancelled` o `no_company_response` | Ocurre con el resultado final y conserva historial. |
| Revocar por suspensión/archivo | Admin o titular autorizado | `active` | `revoked` | `candidate_suspended`, `company_suspended`, `candidate_archived` o `company_archived` | Deniega nuevas consultas/descargas sin borrar evidencia. |
| Conservar tras contratación | Admin | `active` | `active` | Confirmación `hired` | Solo si seguía activo; fija `post_hire_access_until` a confirmación +720 horas. |
| Vencer acceso poscontratación | Sistema | `active` | `revoked` | `post_hire_window_ended` | Al alcanzar el límite; autorización ya deniega desde ese instante y la materialización es idempotente. |

`revoked` es terminal y nunca vuelve a `active`. `expired_by_policy` está reservado e inalcanzable
mientras OQ-001 continúe abierta; no existe un comando que lo produzca en el MVP.

## Consentimiento candidato

| Comando | Actor | Desde | Hacia | Motivo | Precondiciones y efecto |
| --- | --- | --- | --- | --- | --- |
| Aceptar | Candidato o admin en atención asistida | inexistente, `withdrawn` | `accepted` | No | Registra versión/hash de política, actor y fecha; una nueva aceptación no reabre casos ni permisos. |
| Retirar | Candidato o admin autorizado | `accepted` | `withdrawn` | No | Cierra participaciones abiertas como `withdrawn` con código `consent_withdrawn`, revoca permisos y conserva resultados finales. |

Los eventos son append-only: una nueva aceptación crea otro evento y nunca modifica el anterior.

## CV

| Comando | Actor | Desde | Hacia | Motivo/código | Precondiciones y efecto |
| --- | --- | --- | --- | --- | --- |
| Validar carga aceptada | Candidato o admin autorizado + validador | inexistente | `valid` | No | PDF de `1..5 MiB` en demo, firma/estructura legibles y controles aprobados; solo uno vigente por candidato. |
| Rechazar carga | Validador | inexistente | `rejected` | Código sanitizado | Tipo, tamaño, firma o estructura inválidos; no sustituye el CV válido anterior. |
| Reemplazar | Candidato o admin autorizado + validador | `valid` anterior | anterior `superseded`; nuevo `valid` | No | Transición atómica; derivaciones previas conservan su `cv_document_id`. |
| Archivar con perfil | Candidato titular | `valid`, `superseded`, `rejected` | `archived` | Archivo de perfil | Conserva metadatos/objeto bajo OQ-001 y bloquea uso nuevo. |

Restaurar el perfil no vuelve un CV `archived` a `valid`; se requiere una nueva carga válida. Los CV
`superseded`, `rejected` y `archived` no admiten transición de regreso.

## Importación

| Comando | Actor | Desde | Hacia | Motivo/código | Precondiciones y efecto |
| --- | --- | --- | --- | --- | --- |
| Cargar lote | Admin | inexistente | `uploaded` | No | Archivo ficticio/anonimizado, hash y referencia segura; no crea candidatos. |
| Generar previsualización | Admin | `uploaded`, `blocked` | `preview_ready` o `blocked` | Códigos por fila | Normaliza y clasifica filas; cualquier inválido, categoría sin mapear o duplicado sin resolver deja `blocked`. |
| Confirmar | Admin | `preview_ready` | `confirming` | No | Revalida versión de mapeo, hash, estados y versión esperada; una segunda confirmación no duplica. |
| Completar | Admin que confirmó | `confirming` | `completed` | No | Todas las filas aceptadas se materializan y auditan atómicamente. |
| Fallar confirmación | Admin que confirmó | `confirming` | `failed` | Código sanitizado | Rollback de cambios de negocio; conserva lote/evidencia, sin filas parciales. |
| Crear intento corregido | Admin | nuevo lote vinculado a uno `failed` | `uploaded` | No | Requiere nueva carga, previsualización y confirmación; el lote fallido no se reanuda. |

`archived` queda reservado para una futura política de retención y no tiene transición ejecutable
mientras OQ-001 siga abierta. Las filas usan `valid`, `warning`, `invalid`, `potential_duplicate`,
`unmapped_category` e `imported`: solo una confirmación completada cambia filas aceptadas a
`imported`; los demás estados se recalculan durante una nueva previsualización sin crear negocio.

## Suspensión y archivo

- Suspender/reactivar una cuenta administrativa: solo otro administrador activo, con motivo,
  confirmación y evento; no se permite autosuspensión ni dejar cero administradores activos. La
  reactivación conserva la identidad y todo historial del administrador afectado. Archivar una
  cuenta administrativa está fuera del MVP; su baja permanente requiere un procedimiento municipal
  posterior.
- Suspender candidato/empresa: admin, acción destacada, confirmación explícita y motivo obligatorio;
  bloquea operaciones nuevas y revoca acceso empresarial interactivo sin fabricar resultados finales.
  Una empresa suspendida ve el estado de su cuenta, no el motivo interno.
  El feedback recibido queda pendiente para administración. Una empresa suspendida no envía feedback
  nuevo; si solo el candidato está suspendido, una empresa activa aún puede informar sobre su
  derivación con la referencia no personal, sin ver perfil, contactos ni CV.
- Reactivar cuenta empresarial: admin, motivo y controles de vigencia; cuenta a `active` y perfil
  empresarial a `incomplete` en la misma decisión. La empresa vuelve a completar sus datos; ofertas,
  participaciones, derivaciones y permisos anteriores no se reactivan.
- Reactivar cuenta candidata: admin, motivo y controles de vigencia; la cuenta vuelve a `active` y el
  perfil conserva el estado anterior porque ni la suspensión ni la reactivación modifican por sí
  mismas su estado. Cada operación posterior revalida estado, frescura, disponibilidad,
  consentimiento y CV cuando corresponda; no reactiva ofertas, participaciones, derivaciones ni
  permisos.
- Archivar por solicitud del candidato: efecto inmediato y recuperable; no requiere aprobación ni
  borra relaciones, CV o auditoría.
- Archivar cuenta/perfil empresarial: puede ejecutarlo la propia empresa autenticada sobre sus
  registros o un administrador, que debe indicar motivo. La operación es atómica y recuperable:
  archiva cuenta/perfil, establece `archived_at` en las ofertas no finales sin crear otro estado de
  workflow, bloquea acciones empresariales y revoca permisos de derivación sin borrar casos,
  resultados ni auditoría.
- `Reactivar cuenta` significa cambiar `accounts.status` de `suspended` a `active`; `restaurar`
  significa recuperar un registro de negocio `archived`. Son operaciones distintas.
- Restaurar: solo admin, valida conflictos/duplicados, registra motivo y devuelve perfil candidato a
  `draft`; para empresa devuelve cuenta a `active`, perfil empresarial a `incomplete` y ofertas a
  `draft`.

## Errores y concurrencia

- Versión distinta: `CONFLICT_STALE_DATA`, sin escritura.
- Estado no permitido: `INVALID_TRANSITION`, sin revelar nota interna.
- Consentimiento o CV faltante: `CONSENT_REQUIRED` o `VALID_CV_REQUIRED`.
- Recurso ajeno: `NOT_FOUND` cuando revelar existencia sería sensible.
- Fallo de evento o entidad: rollback total y mensaje español `INTERNAL_ERROR` con request ID.
- Ante conflicto o error en transición, archivo o restauración, la interfaz muestra el estado
  recuperable, exige recargar antes de repetir y no duplica eventos ni permisos. El cambio de
  entidad, relaciones, acceso y auditoría se confirma junto o no se confirma.
- Una segunda confirmación del mismo lote importado no crea filas nuevas. Si falla la confirmación,
  el lote conserva un resultado `failed` con código sanitizado, sin perfiles parciales, y requiere
  corregir el archivo o las decisiones, cargarlo otra vez y obtener una nueva previsualización en un
  lote nuevo vinculado al fallido; el lote anterior no se reanuda ni se confirma nuevamente.
