# EXTRA096 — Documentos de postulación

- Entradas CV: PDF/JPG/JPEG/PNG,5 MiB, una imagen estática de hasta16MP; WebP no.
  Servidor devuelve PDF validado5 MiB. Mismo proxy privado inline/nueva pestaña.
- reserve_application_cv(p_opening,p_candidate_version,p_cv,p_path,p_name,p_size,
  p_sha256): candidato activo dueño, aptitud vigente, oferta pública y sin caso
  no archivado; reserva rejected/upload_pending scope oferta. No cambia general.
- apply_to_opening_with_cv(p_opening,p_candidate_version,p_cv default NULL): UUID
  de participación. NULL usa general actual; UUID exige reserva propia del mismo
  destino y objeto Storage. Validación/documento/alta/auditoría atómicas; revalida
  versiones, perfil, consentimiento, disponibilidad y oferta. Códigos existentes.
- Wrappers create_participation/apply_to_opening anteriores conservan firmas;
  nominación no selecciona archivo, postulación por cualquier wrapper fija general.
  Helper privado no ejecutable por public/anon/authenticated/service_role.
- POST /api/candidate/applications: multipart openingId,candidateVersion y cv
  opcional. Cuenta candidata activa, límites y formato antes de subir; JSON seguro
  con message/success, estados400/401/403/409/422/500 según causa, no-store. No actor
  o propietario recibidos del formulario. Fallo/red conserva elección en UI.
- my_candidate_participations_with_cv: proyección antigua + cv_document_id/cv_name
  de casos propios, sin etapas/PII ajenas; UUID se convierte a referencia en servidor.
- Oficina lee selección en su caso. Referir copia exactamente ese documento;
  legado/admin NULL usa general vigente. Empresa solo consulta ese referral válido,
  nunca CV de otro caso/empresa. Reemplazo general no cambia elecciones o permisos.

Despliegue: migración antes de UI, recuperar hacia adelante; no borrar archivos,
reaceptar consentimiento o reiniciar base compartida. Sin env/dependencias nuevas.
