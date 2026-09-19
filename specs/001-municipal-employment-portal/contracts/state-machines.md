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
| Cancelar | Admin | cualquier no final | `cancelled` | Motivo obligatorio; conserva historia. |

La empresa nunca ejecuta publicar, aprobar, rechazar, pausar, cerrar o cancelar.

## Perfil candidato

| Comando | Actor | Precondiciones | Resultado |
| --- | --- | --- | --- |
| Registrar autogestionado | Persona | Email verificable, nombre, DNI, contraseña | Cuenta pendiente y perfil `draft`; duplicado potencial bloquea consolidación. |
| Crear asistido | Admin | Nombre, DNI, un contacto | Perfil `draft` sin exigir cuenta ni CV; actor registrado. |
| Activar | Titular/admin asistente | Datos laborales completos, categorías, disponibilidad y consentimiento vigente; autogestión exige CV válido | `active`, fija vigencia seis meses; asistido sin CV queda no derivable. |
| Confirmar/actualizar | Titular/admin | Datos válidos | Actualiza `last_confirmed_at` y `refresh_due_at`; puede volver de `needs_update`. |
| Desactivar disponibilidad | Titular/admin | Perfil no archivado | `unavailable`; no borra participaciones. |
| Retirar consentimiento | Titular/admin autorizado | Consentimiento vigente | `consent_withdrawn`; bloquea nuevas derivaciones. |
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
| Derivar | Admin | Candidato activo, consentimiento vigente, CV PDF válido, oferta propia de la empresa y no final | Crea derivación, `referred`, fecha límite +30 días y acceso empresarial mínimo. |
| Registrar entrevista | Empresa propia o admin | Derivación activa | Agrega entrevista; estado puede pasar a `company_interview`. |
| Comunicar feedback | Empresa propia | Derivación activa, sin resultado real confirmado | Agrega feedback `pending_admin`; no fija resultado final. |
| Marcar espera | Admin | Derivación activa sin final | `awaiting_feedback`; no altera fecha límite original. |
| Confirmar resultado | Admin | Feedback/evidencia registrada o motivo administrativo | `hired`, `not_selected`, `withdrawn` o `cancelled`; actor admin obligatorio. |
| Cerrar sin respuesta | Sistema | Derivada, sin final y `feedback_due_at <= now()` | `no_company_response`, una vez, con actor sistema. |
| Corregir respuesta tardía | Admin | `no_company_response` y feedback posterior | Resultado real final nuevo; conserva evento automático anterior. |
| Retirar postulación | Candidato/admin | Estado no final | `withdrawn`; revoca acceso empresarial interactivo según límite seguro. |

Una transición administrativa puede omitir una etapa de evaluación cuando el caso lo justifique, pero
nunca puede entregar datos empresariales sin una derivación explícita y auditada.

## Suspensión y archivo

- Suspender candidato/empresa: admin, motivo obligatorio, estado anterior preservado en historial.
- Reactivar: admin, motivo y controles de vigencia; no reactiva automáticamente ofertas o perfiles.
- Archivar: marca recuperable; no borra relaciones ni auditoría.
- Restaurar: admin, valida conflictos/duplicados y registra evento.

## Errores y concurrencia

- Versión distinta: `CONFLICT_STALE_DATA`, sin escritura.
- Estado no permitido: `INVALID_TRANSITION`, sin revelar nota interna.
- Consentimiento o CV faltante: `CONSENT_REQUIRED` o `VALID_CV_REQUIRED`.
- Recurso ajeno: `NOT_FOUND` cuando revelar existencia sería sensible.
- Fallo de evento o entidad: rollback total y mensaje español `INTERNAL_ERROR` con request ID.
