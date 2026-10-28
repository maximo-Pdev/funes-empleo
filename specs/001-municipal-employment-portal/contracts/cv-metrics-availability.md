# EXTRA094 — contratos y recuperación

GET /api/cv/:reference conserva sesión activa, referencia opaca, authorized_cv_path
y Storage RLS,404 privado para acceso inexistente,401 sin sesión. Éxito PDF200,
Content-Disposition inline; filename="cv.pdf", private/no-store/nosniff/Vary Cookie.
Enlaces target=_blank y rel noopener noreferrer sin atributo download.

Métricas conserva RPC/DTO/fechas/categoría/as_of/exportaciones completos. Solo
presentación: seis claves exactas active_candidates,companies_active,
openings_published,applications,referrals,hired. Sin sumar por categoría. Gráficos
resultados hired/not_selected/withdrawn/cancelled/no_company_response y filas
category_hired. Ausencia/null no se convierten en cero, desglose solapado explicado.

transition_participation(uuid,int,text,text,uuid,uuid,uuid) misma firma/ACL/códigos,
evidencia y versiones. Nueva rama hired cambia availability a unavailable, status
solo active→unavailable y audita cuando cambie; conserva consentimientos/historia.
Acceso propio720h únicamente si ya active/autorizado; revoked nunca regresa.
Otras participaciones, permisos y consentimientos no sufren escrituras.
No backfill ni reaceptación. Retiro manual y períodos históricos no cambian.

Recuperación: migración correctiva hacia adelante tras revisar causa; rollback de
código no restaura consentimiento o permisos. No ejecutar migraciones antiguas ni
reaplicar retiro global retroactivamente. Validar identidad de migración/cuerpo/
ACL, prueba de contratación y frontera720h antes de publicar UI. No requiere env.
