# Matriz de auditoría — T093 / FR-050 / SC-006

2026-09-28. Las clases siguientes tienen ejecución SQL e inyección de fallos en
`072_audit_rollback_matrix.test.sql`: 51 casos de seis aserciones más cuatro controles
de importación fallida (310 aserciones). Resultado de la suite completa: 855 PASS.
Tests 070 comprueban invariantes generales, inmutabilidad,
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

## Matriz ejecutable añadida (072)

Cada llamada `pg_temp.audit_case` identifica el caso en el TAP. Ejecuta el comando
real, comprueba evento/actor/fecha/request ID/estados cuando corresponden y metadata
segura, revierte el caso positivo, luego repite con una falla dirigida al evento
esperado. Compara snapshots de todas las tablas public/private y Auth users,
identities y sessions para demostrar ausencia de cambios parciales. La comparación
es de estado transaccional; no demuestra rollback de un correo externo ya enviado.

| Clase | Etiquetas de casos 072 (PASS) |
| --- | --- |
| Cuenta | Aprovisionamiento individual, Verificación cuenta, Suspensión, Reactivación, Archivo empresarial/propio, Restauración empresa/candidato |
| Perfil y asistencia | Alta asistida, Corrección perfil, Contacto candidato, Vinculación presencial, Disponibilidad, Activación perfil |
| Consentimiento | Retiro consentimiento, Aceptación consentimiento |
| Versiones de CV | CV nueva versión, CV reemplazo anterior |
| Duplicados | Las tres decisiones de vincular, corregir/crear y rechazar |
| Ofertas | Envío empresarial; aprobación, correcciones, rechazo, pausa, reanudación, cierre, suspensión, restauración y cancelación |
| Participaciones | Nominación, Postulación propia, retiro/cancelación, preentrevista, salto justificado, preselección y derivación |
| Seguimiento | Contacto municipal, Nota interna, Entrevista empresarial, Feedback empresarial, contratación/no selección y Corrección tardía |
| Importación | Importación confirmada; falla en evento final conserva lote fallido y revierte altas; 050 añade falla tras primera fila |
| Exportación | CSV filtrado; 060 comprueba filtros y ausencia de contenido en auditoría |
| Automatizaciones | Cron cierre oferta, Cron sin respuesta, Cron 720 horas; actor system sin cuenta |

Los motivos obligatorios, permisos append-only y restricción del actor system se
comprueban además en 001/010/040/050/070/071. La matriz no sustituye las pruebas de
Storage real, HTTP ni SMTP: cubre la transacción de base y sus efectos auditables.
La revisión independiente de estos tests sigue pendiente en T096.
