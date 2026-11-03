# EXTRA099 — Avisos privados del portal

## EXTRA-121 amendment (2026-11-02)

Use only the shared navbar's adapted Base Popover, placed after Mi cuenta. Dedicated notification sidebar entries, candidate dashboard section and admin/company pages are retired. Preview/pagination stays GET-only without marking read, with five items per popup page and access to older pages. Individual POST opens retain all authorization and reference checks below. The API `listHref` now identifies the verified role panel (`/dashboard`, `/empresa`, `/admin`), never a retired list; an inaccessible-resource POST returns there with `?unavailable=1`, explained in the Popover. Earlier references to a separate notification list are superseded by this popup presentation, not changes to recipient isolation, data minimization or event generation.

Lista cerrada de eventos/destinatarios: spec.md matriz EXTRA099. Se generan solo
por eventos posteriores a migración; transacción de negocio y aviso son atómicas.
Empresa entrevista excluida. Lecturas no emiten nuevos hechos de negocio.

`list_my_notifications(p_page integer=1,p_page_size integer=20) -> jsonb`:
sesión viva/cuenta activa; page1..10000,size1..20, orden created_at/id descendente.
Respuesta `{items,total,unread,page,pageSize}`. Item `{reference,kind,createdAt,
readAt,available,subject,target}`. Target contiene kind/ref opacos y opcional
referral; ningún UUID, contacto, CV, razón interna o URL arbitraria. Subject es
título/razón social solo si recurso sigue autorizado; unavailable devuelve null.
No parámetro de cuenta, ni lectura de avisos de otros administradores.

`open_my_notification(p_reference text) -> jsonb`: misma autorización, solo
destinatario; marca read_at una vez, devuelve proyección vigente. Referencia ajena
o inválida equivale a NOT_FOUND. Recurso archivado no devuelve target/subject.

`my_candidate_preinterview_agenda() -> jsonb`: solo candidato titular activo,
casos no archivados, preentrevistas no archivadas; reference de participación,
scheduledAt/heldAt/channel. No summary_internal/recommendation/actor/metadatos.

GET `/api/notifications?page=…&size=…`: consulta autorizada/no-store, sin marcar
lectura. POST `/api/notifications/open`: referencia única en formulario acotado,
same-origin, sin URL aportada por cliente; éxito303 a ruta conocida por rol o al
panel con aviso de recurso no disponible en el Popover. Anónimo401, suspendido403, inválido422,
ajeno404, error500 genérico; nunca exponer mensaje SQL. Vary Cookie en respuestas.

Destinos: admin empresa/oferta/caso; empresa oferta+derivación; candidato sección
postulaciones con referencia de caso y ancla. En todos, el destino vuelve a aplicar
sus guardas. Sin permiso completo, la empresa conserva únicamente las proyecciones
que ya autorizaban las reglas vigentes; el aviso no extiende permisos ni ventanas.
