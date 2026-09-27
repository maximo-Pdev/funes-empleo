# Contratos del MVP

Estos contratos describen fronteras verificables del producto. No publican una API de terceros ni
autorizan integraciones nuevas.

- [authorization-matrix.md](./authorization-matrix.md): quién puede leer o cambiar cada recurso y
  qué campos quedan ocultos.
- [state-machines.md](./state-machines.md): comandos, precondiciones, efectos e historial de los
  flujos críticos.
- [csv-import.md](./csv-import.md): contrato de archivo y protocolo de previsualización/confirmación.

## Convenciones compartidas

- Toda operación privada requiere sesión vigente, cuenta `active`, rol y propiedad autorizados.
- Las acciones de UI se implementarán como Server Actions salvo archivos, descargas, exportaciones y
  callbacks, que requieren Route Handlers.
- Cada mutación recibe la `version` esperada del agregado. Si cambió, responde `CONFLICT_STALE_DATA`
  y no escribe nada.
- Excepción aprobada para feedback empresarial append-only: el envío tardío recibe la referencia de
  derivación, bloquea y revalida propiedad/estado dentro de la transacción, e inserta un evento nuevo
  sin sobrescribir el agregado ni exigir una versión adicional a la empresa. Así la referencia
  revocada conserva exactamente los cuatro campos no personales de FR-039.
- Éxito: resultado mínimo necesario, nueva versión y mensaje en español cuando corresponda.
- Error esperado: código estable y mensaje accionable en español; no contiene stack, SQL, existencia
  de cuentas ajenas, PII, notas internas ni secretos.
- Códigos comunes: `AUTH_REQUIRED`, `ACCOUNT_SUSPENDED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`,
  `INVALID_TRANSITION`, `CONFLICT_STALE_DATA`, `CONSENT_REQUIRED`, `VALID_CV_REQUIRED`,
  `OPENING_NOT_PUBLIC`, `POTENTIAL_DUPLICATE`, `IMPORT_BLOCKED`, `RESTORE_CONFLICT`,
  `INTERNAL_ERROR`.
- Una respuesta `NOT_FOUND` reemplaza `FORBIDDEN` cuando confirmar la existencia revelaría datos.
- Ninguna operación acepta un rol, actor o propietario enviado por el cliente; se deriva de sesión y
  relaciones persistidas.
- Suspensión o archivo invalida el acceso privado en servidor y RLS. Restaurar nunca repone de forma
  implícita ofertas, derivaciones, participaciones ni permisos empresariales anteriores.
- Toda transición que termina acceso empresarial actualiza la participación, el permiso de la
  derivación y la auditoría en una sola transacción. Un permiso `revoked` no vuelve implícitamente a
  `active`; una contratación solo conserva durante 720 horas desde su confirmación un permiso que
  todavía estaba activo. La autorización deniega nuevas lecturas desde el vencimiento aunque el
  estado materializado y su evento se registren en la siguiente ejecución programada.

## Contratos de archivo HTTP

Los siguientes Route Handlers constituyen las únicas interfaces binarias/streaming requeridas:

| Método y ruta lógica | Actor | Entrada/salida | Regla principal |
| --- | --- | --- | --- |
| `POST /api/candidate/cv` | Candidato o admin autorizado | `multipart/form-data` con PDF; metadata segura | Valida antes de reemplazar; máximo demo 5 MiB. |
| `GET /api/cv/{cvId}` | Titular, admin o empresa con permiso de derivación activo | Stream PDF privado, `private, no-store` | Autoriza en cada solicitud y exige coincidencia exacta de `cv_document_id`; no entrega URL reutilizable. |
| `POST /api/admin/imports/preview` | Admin | CSV UTF-8; resumen y errores | No escribe entidades de negocio. |
| `POST /api/admin/imports/{id}/confirm` | Admin | ID, hash, mapping version y version esperada | Una transacción all-or-nothing. |
| `GET /api/admin/exports/operations.csv` | Admin | Filtros de período/categoría; CSV | Solo datos autorizados, neutraliza fórmulas. |
| `GET /auth/callback` | Flujo Auth | Código PKCE | Intercambia código y redirige sin registrar tokens. |

No se define una REST API pública para perfiles, empresas o administración. Las páginas servidor y
Server Actions consumen directamente la capa de aplicación y RLS.

Contratos SQL de fase 8 (`admin_metrics`, `export_admin_metrics`,
`record_metrics_export`, `metrics_history_start`), límites temporales, filas y errores:
[validación y contratos de métricas](../../../docs/validation/phase-8-metrics.md).
