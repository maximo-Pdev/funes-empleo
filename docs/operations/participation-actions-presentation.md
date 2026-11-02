# Acciones de la participación y entrevistas — EXTRA122

02/11/2026, pedido de Mateo. En el detalle administrativo, Caso y Acciones están
en una fila de dos columnas desde1024px; en móvil se apilan, primero Caso. El
enlace «Ir a la acción disponible» conserva su destino case-actions y foco.

Para casos recibidos o en revisión se ofrecen Registrar preentrevista, Derivar
a la empresa y Cancelar solo este caso. Los motivos obligatorios y las reglas de
derivación/cancelación no cambian. Las fases posteriores conservan sus acciones
y evidencias, incluido el retiro solicitado por candidato cuando se ofrece.
La simplificación no elimina comandos de API ni el historial de etapas previas.

Registrar preentrevista y Registrar entrevista de empresa muestran únicamente
Fecha programada como fecha obligatoria. Conservan el calendario nativo y la
conversión horaria de Funes. No se agrega una fecha realizada oculta o automática:
heldAt/heldAtLocal no salen de estos formularios. Las columnas, contratos y fechas
realizadas anteriores se conservan; otros clientes autorizados siguen usando los
contratos compatibles actuales. No requiere migración.

Recuperación: revertir composición y controles de presentación; no modificar
entrevistas, estados, permisos o auditoría. Referencias: participation-action-form,
referral-forms, página administrativa, admin-workflow/interview-date/admin-pages
y recorridos E2E intermediation/assisted-candidate. La documentación no acredita
revisión humana, aprobación municipal o despliegue.
