# Contratos del MVP

Estos contratos describen fronteras verificables del producto. No publican una API de terceros ni
autorizan integraciones nuevas.

- [authorization-matrix.md](./authorization-matrix.md): quién puede leer o cambiar cada recurso y
  qué campos quedan ocultos.
- [state-machines.md](./state-machines.md): comandos, precondiciones, efectos e historial de los
  flujos críticos.
- [csv-import.md](./csv-import.md): contrato de archivo y protocolo de previsualización/confirmación.

## Enlaces públicos de ofertas

FR-024A / EXTRA-020: `/ofertas/{slug}` resuelve un slug persistido de título más sufijo
aleatorio; no acepta UUID como localizador público. El enlace de selección del candidato
usa el mismo slug y la postulación conserva el UUID interno. `published_offers` mantiene
su firma y agrega `slug` a los resultados; `published_offer_by_slug(p_slug text)` retorna
el mismo sobre paginado, limitado a una oferta y con las mismas reglas de visibilidad.
Contrato detallado y recuperación: [public-offer-slugs](../../../docs/validation/public-offer-slugs.md).

## A08 — coincidencias administrativas por rubro

`match_opening_candidates(p_opening uuid,p_page integer=1,p_page_size integer=20)`
requiere sesión vigente y cuenta administrativa activa, incluso por RPC directa.
Entrada: UUID, página 1–10000, tamaño 1–50; nulos/ilegales rechazados.
Resultado `{available,total,page,pageSize,items}`; items:
`{id,displayName,locality,matchedCategories:[{code,name}],participationId}`.
Oferta inexistente/archivada: NOT_FOUND. Oferta no publicada/pausada o vencida,
empresa/cuenta inactiva: available=false sin candidatos. Oferta vigente sin
rubros/coincidencias: available=true y lista vacía. Cruce OR de rubros activos de
ambas clases del perfil, candidatos aptos, orden nombre/ID y total antes de página.
Ampliación de Mateo 2026-10-19: participaciones no archivadas quedan excluidas
antes de contar/paginar; participationId se conserva null por compatibilidad.
`preview_opening_candidate(p_opening uuid,p_candidate uuid)` exige admin/sesión
y pertenencia al mismo pool elegible/sin participación. Devuelve perfil laboral,
rubros, CV actual, versiones de candidato y oferta/título; sin DNI/contactos/notas.
Inexistencia, inaptitud o participación previa responde NOT_FOUND. Se consulta
bajo demanda mediante Server Action sin escrituras. Nominar usa el comando
existente con ambas versiones; éxito revalida detalle y quita ficha, nunca deriva.
No amplía acceso empresarial
ni sustituye comandos municipales, sus bloqueos optimistas o su auditoría.

## Validación de formularios — 2026-10-20

Errores de entrada se asocian a los controles con texto/aria-describedby y
aria-invalid, asterisco para requisitos vigentes y resumen con foco al primer
error. No se llama la mutación si la validación cliente falla; servidor revalida
siempre. Resultado fallido no reinicia controles ni archivos. Solo conservar en
la página actual; nunca serializar contraseñas de vuelta o guardar PII en storage.
POST /api/candidate/cv mantiene 303 para navegación nativa. Con Accept
application/json responde JSON `{status}`: ok/200, invalid/422, conflict/409 o
denied/403 para cliente que conserva el archivo en error, con private, no-store
y misma autorización. El aviso de éxito espera la versión actualizada del perfil.

## Convenciones compartidas

### Consulta pública A07 / FR-024B

`GET /ofertas` recibe q (120 caracteres), rubro (código50), localidad (200),
modalidad (100) y page (entero1–10000). Ausencia/vacío desactiva un filtro.
Todos combinan con AND; texto literal en título/tareas/requisitos, insensible a
mayúsculas y sensible a tildes; localidad/modalidad exactas tras trim/lower.
Se filtra antes del conteo/paginación (tamaño1–30, default10), orden previo.
Opciones solo de ofertas públicas actuales, rubros activos del catálogo vigente.
Las RPC `search_published_offers` y `public_offer_filter_options` no amplían
datos públicos ni conceden acceso a tablas; `published_offers` conserva contrato.
URLs de paginación conservan filtros codificados y no agregan UUID. Arrays,
longitudes excesivas o página inválida no se convierten en búsqueda ampliada;
UI devuelve error claro. Sin cambios a FR-024A ni aceptación del catálogo A08.

### Confirmación de contraseña (A01, 2026-10-17)

Los autorregistros de candidato, empresa y cuenta genérica reciben `password` y
`confirmation` iguales, de 6 a 128 caracteres, además de sus campos vigentes.
La acción servidor y el servicio rechazan entradas inválidas antes de invocar Auth.
Un error de confirmación devuelve un mensaje español sin consultar si la cuenta
existe; el alta válida conserva la respuesta externa genérica ante duplicados o
fallos del proveedor. `confirmation` no forma parte del payload de Supabase Auth,
metadata, logs ni esquema persistido. La actualización de contraseña reutiliza
esta validación sin cambiar sus controles de sesión y revocación existentes.

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
