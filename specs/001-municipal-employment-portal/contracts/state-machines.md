# Contratos de comandos y estados

Cada comando es atómico: valida actor, versión, estado y precondiciones; modifica el agregado e
inserta el evento de historial dentro de la misma transacción.

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
| Restaurar | Admin | `suspended` o `archived` | `draft` | Motivo interno y control de conflictos; empresa ve estado sin motivo y nunca recupera automáticamente el estado previo. |
| Cancelar | Admin | cualquier no final | `cancelled` | Motivo interno obligatorio; empresa ve estado sin motivo. Cierra atómicamente como `cancelled` participaciones no finales, revoca sus permisos empresariales, conserva historia y resultados ya finales. |

La empresa nunca ejecuta publicar, aprobar, rechazar, pausar, suspender, reactivar, restaurar, cerrar
o cancelar.

## Perfil candidato

| Comando | Actor | Precondiciones | Resultado |
| --- | --- | --- | --- |
| Registrar autogestionado | Persona | Email verificable, nombre, DNI, contraseña | Cuenta pendiente y perfil `draft`; duplicado potencial bloquea consolidación. |
| Crear asistido | Admin | Nombre, DNI, un contacto | Perfil `draft` sin exigir cuenta ni CV; actor registrado. |
| Activar | Titular/admin asistente | Datos laborales completos, categorías, disponibilidad y consentimiento vigente; autogestión exige CV válido | `active`, fija vigencia seis meses; asistido sin CV queda no derivable. |
| Confirmar/actualizar | Titular/admin | Datos válidos | Actualiza `last_confirmed_at` y `refresh_due_at`; puede volver de `needs_update`. |
| Corregir datos | Titular/admin autorizado | Perfil no archivado y entrada válida | Aplica el cambio directamente y registra historia; no crea solicitud pendiente. |
| Desactivar disponibilidad | Titular/admin | Perfil no archivado | `unavailable`; no borra participaciones. |
| Retirar consentimiento | Titular/admin autorizado | Consentimiento vigente | `consent_withdrawn`; bloquea nuevas derivaciones, cierra como `withdrawn` y con motivo `consent_withdrawn` todas las participaciones no finales, y revoca atómicamente todos los permisos empresariales activos; preserva resultados finales e historial. |
| Solicitar eliminación | Titular | Perfil propio no archivado | Archiva cuenta/perfil inmediatamente; revoca actividad y accesos sin borrar historia. |
| Restaurar | Admin | Perfil archivado, motivo y ausencia de conflicto | Devuelve cuenta utilizable y perfil a `draft`; no reactiva participaciones ni derivaciones. |
| Vincular cuenta | Admin + candidato con correo verificado | Comprobación presencial del DNI exhibido sin guardar copia; cuenta candidata sin otro perfil; coincidencias de DNI/correo y conflictos de cuenta resueltos por FR-014 | Conserva ID, origen, consentimiento, estados e historial del perfil asistido, asigna `account_id` y audita administrador/fecha; nunca fusiona ni crea otro perfil. |

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
| Corregir respuesta tardía | Admin | `no_company_response` y feedback posterior | Resultado real final nuevo, incluido `cancelled` si se canceló solo ese proceso; conserva evento automático y permiso revocado, incluso si pasa a `hired`. |
| Retirar participación | Candidato titular o admin que registra su solicitud | Participación no final de cualquier origen; si actúa admin, solicitud del candidato registrada | `withdrawn`; revoca inmediatamente el permiso empresarial sin borrar historia. |
| Cancelar participación individual | Admin | Participación no final y motivo operativo registrado, incluido feedback empresarial `process_cancelled` | `cancelled` solo para ese caso; revoca su permiso empresarial, sin cancelar la oferta ni afectar otros casos. |
| Cancelar oferta | Admin | Oferta cancelable, motivo registrado | `cancelled` para cada participación no final de esa oferta y revocación de permisos afectados; resultados finales previos permanecen. |
| Vencer acceso poscontratación | Sistema | `hired`, `post_hire_access_until <= now()` y permiso aún `active` | Materializa `revoked` con motivo `post_hire_window_ended` y evento único; la autorización ya deniega nuevas consultas/descargas desde el instante de vencimiento. |

Una transición administrativa puede omitir `under_review`, `preinterview` o `preselected` cuando el
caso lo justifique, siempre hacia adelante y con motivo. Nunca puede entregar datos empresariales sin
una derivación explícita y auditada.

La revocación funciona como un enclavamiento: `revoked` no vuelve a `active` por reconsentimiento,
reactivación, restauración o corrección tardía. `expired_by_policy` no tiene transición ejecutable
hasta que se resuelva OQ-001. Cada cambio de participación, acceso y auditoría es transaccional.
Reconsentir tampoco reabre participaciones cerradas por retiro del consentimiento.
Las 720 horas son solo una ventana de acceso posterior a contratación, no retención o purga de
perfil, CV e historial. Una corrección tardía a `hired` no fija una nueva ventana si el permiso ya
había sido revocado.

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
- Reactivar cuenta candidata: admin, motivo y controles de vigencia; no reactiva automáticamente
  derivaciones ni permisos. El estado exacto de retorno del perfil candidato sigue pendiente de
  aclaración.
- Archivar por solicitud del candidato: efecto inmediato y recuperable; no requiere aprobación ni
  borra relaciones, CV o auditoría.
- Restaurar: solo admin, valida conflictos/duplicados, registra motivo y devuelve perfil/empresa a
  estado inactivo y ofertas a `draft`.

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
  revisar el lote antes de intentar una confirmación válida nuevamente.
