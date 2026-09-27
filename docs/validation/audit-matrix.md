# Matriz de auditoría — T093 / FR-050 / SC-006

2026-09-27. Estado: consolidación parcial; no se afirma todavía el 100% de clases
con falla inyectada individual. Tests 070 comprueban invariantes generales, inmutabilidad,
grants, actor y metadata. `tests/integration/audit/audit-events.test.ts` comprueba
que las suites vinculadas existen y son transaccionales; **no ejecuta sus comandos SQL**.
La ejecución SQL real se hace mediante `npm run test:db` y consta en quality-gates.

| Clase de FR-050 | Evidencia de comandos / suite SQL | Verificación adicional para cierre exhaustivo |
| --- | --- | --- |
| Aprovisionamiento/activación cuenta | 001, trigger Auth/invitación reservada 005 | Reserva→Auth/invitación→actor real en entorno controlado |
| Suspensión/reactivación | 001, change_account_status | Concurrencia de dos admins y cada efecto relacionado |
| Archivo/restauración cuenta/perfil/oferta | 001/020/030 | Falla de evento para cada agregado/permiso |
| Activación/corrección/disponibilidad | 020 | Actor/antes/después/request ID por clase |
| Vinculación asistida | 040 y corrección 042 | Historial conservado y conflicto sin efectos |
| Consentimiento | 020/010 | Aceptación/retiro, cierre de abiertas y revocación atómica |
| Incorporación/reemplazo CV | 020, reset-local Storage, E2E intermediation | Evento de cada versión y falla antes de consolidar metadata |
| Duplicados | 040/050 | Las tres decisiones, motivo privado enlazado y no copia de PII |
| Envío/moderación | 010/030 | Estados y mensaje público separado; rollback de pausa ya cubierto |
| Postulación/nominación | 010/020 | Origen/actor y rechazo independiente por propiedad |
| Revisión/salto/preentrevista/preselección | 010 | Estado/actor y motivo de cada salto |
| Derivación/acceso | 010 | Fallo de auditoría revierte estado y revocación; CV exacto |
| Entrevista/feedback/resultado/corrección tardía | 010 | Confirmación municipal, antecedente automático preservado |
| Contactos/notas/orientación | 010/040 | Metadata solo referencia; cuerpo fuera de audit |
| Importación y resultado | 050 | Falla tras primera fila revierte negocio y conserva lote fallido |
| CSV métricas | 060 | Actor/fecha/filtros vía metrics_exports; falla de audit revierte evidencia |
| Cierre oferta/sin respuesta/vencimiento acceso | 010 + 012 | Idempotencia, actor system solo desde función programada |

## Invariantes y ejecución

`audit_events` exige entidad/acción/fecha/request ID, actor de cuenta identificado o
system acotado; anteriores/nuevos estados cuando corresponden. Metadata admite solo
`decision_id`, `version`, `count`; motivos libres permanecen en evidencia privada
enlazada, no `reason_text` de audit. Los filtros de descarga están en `metrics_exports`
privado y audit referencia su ID, no almacena contenido CSV.

Los roles anon/authenticated/service_role no insertan ni reescriben audit directamente;
triggers impiden UPDATE/DELETE incluso en mantenimiento ordinario. Las funciones
transaccionales mantienen entidad, permiso e historia juntas. Los tests 010 y 060
inyectan fallo al insertar auditoría y comprueban rollback; 050 fuerza error tras una
primera fila. El test 070 se ejecuta en BEGIN/ROLLBACK y no altera el fixture persistente.

Para completar T093, convertir cada fila en comprobación explícita de campos y falla
inyectada aplicable, no solo presencia de un archivo o inspección de una función.
Registrar assertion/test ID y resultado por fila. No marcar SC-006 por el porcentaje
de cobertura del código ni porque los eventos presentes en el seed sean válidos.
