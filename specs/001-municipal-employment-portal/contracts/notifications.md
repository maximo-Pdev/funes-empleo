# EXTRA099 — Avisos privados del portal

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
same-origin, sin URL aportada por cliente; éxito303 a ruta conocida por rol o a
lista con aviso de recurso no disponible. Anónimo401, suspendido403, inválido422,
ajeno404, error500 genérico; nunca exponer mensaje SQL. Vary Cookie en respuestas.

Destinos: admin empresa/oferta/caso; empresa oferta+derivación; candidato sección
postulaciones con referencia de caso y ancla. En todos, el destino vuelve a aplicar
sus guardas. Sin permiso completo, la empresa conserva únicamente las proyecciones
que ya autorizaban las reglas vigentes; el aviso no extiende permisos ni ventanas.
