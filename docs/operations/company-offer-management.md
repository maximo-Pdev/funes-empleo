# Gestión empresarial de ofertas — EXTRA062

## Migración y despliegue

La migración `20261024184354_company_offer_management.sql` reemplaza tres
funciones existentes, conservando sus firmas y permisos de ejecución:
`save_company_opening`, `transition_opening` y `company_referral`. No elimina
tablas, columnas, consentimientos, documentos ni registros históricos.

Aplicar primero la migración en el proyecto correcto y luego desplegar la
aplicación. Revisar previamente el destino y el historial remoto: este proyecto
tiene versiones históricas remotas con nombres diferentes de sus archivos
locales. No ejecutar reparaciones masivas ni volver a aplicar migraciones antiguas
para resolver esa diferencia. Si el SQL se aplica manualmente, registrar como
aplicada únicamente esta versión, después de verificar sus funciones y grants.

Comandos para un entorno enlazado cuyo historial ya esté alineado:

```powershell
npx --no-install supabase migration list --linked
npx --no-install supabase db push --linked --dry-run
npx --no-install supabase db push --linked
```

El ensayo debe enumerar solo las migraciones pendientes esperadas; el envío debe
terminar sin errores. No publicar el resultado de `status -o json` ni claves.
La ejecución de DDL puede indicar «Success. No rows returned»; eso confirma la
ejecución, pero también hay que verificar los flujos siguientes.

## Comportamiento y verificación

- Entrar a una oferta existente muestra su información; «Editar oferta» revela
  el formulario en los estados editables. «Cancelar edición» vuelve al detalle
  sin guardar los cambios. Guardado correcto devuelve al detalle actualizado;
  error conserva campos/valores. Alta de oferta nueva mantiene formulario directo.
  Este ajuste es de presentación y no agrega otra migración.

- Empresa activa propietaria: edita borrador, correcciones o publicada. Guardar
  una publicada valida todos los campos y categorías y la deja `pending_review`
  en una transacción. Guardado y envío generan dos incrementos de versión y sus
  eventos. Si falla cualquiera, se conservan todos los datos anteriores.
- La oferta sale de la búsqueda pública hasta una nueva aprobación municipal.
  Su slug, participaciones, resultados y permisos existentes no se regeneran.
  No se admiten nuevas derivaciones mientras está pendiente de revisión.
- Empresa activa propietaria: «Eliminar oferta» pide motivo y confirmación.
  Cancela borrador, pendiente, correcciones, publicada, pausada o suspendida.
  Continúa visible como «Cancelada». Conserva resultados finales y auditoría;
  cancela solo casos abiertos y revoca sus accesos. No elimina físicamente datos.
- Administración: los listados de ofertas y los del detalle de empresa excluyen
  borradores antes de paginar. No se cambian RLS, métricas ni la restauración.
- La página empresarial de oferta reúne moderación y derivados. El enlace
  anterior `/company/openings/<referencia>/referrals` redirige al detalle,
  conservando el selector autorizado. Los identificadores privados siguen opacos.
  Una empresa restaurada con perfil incompleto conserva el detalle de su oferta;
  recibe un aviso para completar su perfil sin consultar ni recuperar derivaciones.
- Historial de moderación: cinco eventos recientes, «Ver más» agrega cinco.
  La empresa recibe únicamente mensajes públicos; el administrador conserva
  motivos y actores. El registro completo no se reduce.
- Una contratación confirmada por administración, normal o tardía, permite a la
  empresa contratante activa ver solo nombre y resultado. No restituye el
  consentimiento retirado, el perfil completo, contactos, CV ni permisos de
  otras participaciones. Un informe empresarial pendiente no habilita esa excepción.

Automatización: `supabase/tests/043_company_offer_management.test.sql`, ampliación
de `024_hiring_consent.test.sql`, componentes/unidades y E2E
`company-offer-management.spec.ts` y `hiring-consent.spec.ts`.
Todas las pruebas de base de datos y navegador deben usar exclusivamente el
fixture local ficticio, nunca datos reales ni el proyecto hospedado.

## Recuperación

Antes de aplicar, conservar copia de las tres definiciones actuales y sus grants.
Si se necesita volver atrás, coordinar primero el rollback de la aplicación y
restaurar únicamente esas definiciones mediante una nueva migración revisable.
Las versiones previas están en `202609190010_workflow_functions.sql`
(`transition_opening`), `202609190030_company_self_service.sql`
(`save_company_opening`) y `202609190011_referral_projection.sql`
(`company_referral`). No ejecutar completos esos archivos históricos.

Conservar el estado y versión actual de las ofertas, sus categorías, slugs,
decisiones, participaciones y revocaciones. No volver a publicar ofertas ni
reactivar consentimientos/permisos como parte de un rollback. Después restaurar
los grants autenticados y ejecutar `notify pgrst, 'reload schema';`.
