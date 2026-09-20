# Contratos de comandos y estados

Cada comando es atómico: valida actor, versión, estado y precondiciones; modifica el agregado e
inserta el evento de historial dentro de la misma transacción.

## Oferta laboral

| Comando | Actor | Desde | Hacia | Precondiciones y efecto |
| --- | --- | --- | --- | --- |
| Guardar borrador | Empresa propia/admin | `draft`, `changes_requested` | igual | Valida campos presentes sin publicar. |
| Enviar a revisión | Empresa propia | `draft`, `changes_requested` | `pending_review` | Todos los campos obligatorios, categoría activa y fecha futura. |
| Aprobar/publicar | Admin | `pending_review` | `published` | Registra decisión y fecha; recién entonces acepta postulaciones. |
| Solicitar cambios | Admin | `pending_review` | `changes_requested` | Mensaje accionable a empresa obligatorio. |
| Rechazar | Admin | `pending_review` | `rejected` | Motivo administrativo y mensaje a empresa. |
| Pausar | Admin | `published` | `paused` | Sale de consulta pública y no recibe postulaciones nuevas. |
| Reanudar | Admin | `paused` | `published` | Sigue completa y dentro de vigencia. |
| Cerrar | Admin | `published`, `paused` | `closed` | Conserva participaciones para seguimiento. |
| Cerrar por vencimiento | Sistema | `published` con `closing_date` finalizada | `closed` | Sale del público, bloquea postulaciones y conserva participaciones; ejecución idempotente. |
| Suspender por cuenta | Admin | cualquier no final | `suspended` | Motivo y confirmación explícita; revoca operaciones nuevas y conserva casos. |
| Restaurar | Admin | `suspended` o `archived` | `draft` | Motivo y control de conflictos; nunca recupera automáticamente el estado previo. |
| Cancelar | Admin | cualquier no final | `cancelled` | Motivo obligatorio; conserva historia. |

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
| Retirar consentimiento | Titular/admin autorizado | Consentimiento vigente | `consent_withdrawn`; bloquea nuevas derivaciones y revoca atómicamente todos los permisos empresariales activos del candidato. |
| Solicitar eliminación | Titular | Perfil propio no archivado | Archiva cuenta/perfil inmediatamente; revoca actividad y accesos sin borrar historia. |
| Restaurar | Admin | Perfil archivado, motivo y ausencia de conflicto | Devuelve cuenta utilizable y perfil a `draft`; no reactiva participaciones ni derivaciones. |
| Vincular cuenta | Admin + candidato autenticado | Verificación aprobada y sin duplicado | Conserva el mismo perfil/historial y asigna `account_id`. |

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
| Confirmar resultado | Admin | Feedback/evidencia registrada o motivo administrativo | `hired` conserva un permiso todavía activo; `not_selected`, `withdrawn` o `cancelled` lo revocan; actor admin obligatorio. |
| Cerrar sin respuesta | Sistema | Derivada, sin final y `feedback_due_at <= now()` | `no_company_response`, revocación y eventos una sola vez, con actor sistema. |
| Corregir respuesta tardía | Admin | `no_company_response` y feedback posterior | Resultado real final nuevo; conserva evento automático y permiso revocado, incluso si pasa a `hired`. |
| Retirar postulación | Candidato/admin | Estado no final | `withdrawn`; revoca inmediatamente el permiso empresarial sin borrar historia. |

Una transición administrativa puede omitir `under_review`, `preinterview` o `preselected` cuando el
caso lo justifique, siempre hacia adelante y con motivo. Nunca puede entregar datos empresariales sin
una derivación explícita y auditada.

La revocación funciona como un enclavamiento: `revoked` no vuelve a `active` por reconsentimiento,
reactivación, restauración o corrección tardía. `expired_by_policy` no tiene transición ejecutable
hasta que se resuelva OQ-001. Cada cambio de participación, acceso y auditoría es transaccional.

## Suspensión y archivo

- Suspender candidato/empresa: admin, acción destacada, confirmación explícita y motivo obligatorio;
  bloquea operaciones nuevas y revoca acceso empresarial interactivo sin fabricar resultados finales.
- Reactivar: admin, motivo y controles de vigencia; deja perfil/empresa inactivo y no reactiva
  automáticamente ofertas, derivaciones o accesos.
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
