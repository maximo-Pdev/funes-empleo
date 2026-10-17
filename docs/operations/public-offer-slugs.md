# A04: despliegue y recuperación de slugs públicos

## Alcance

Primera etapa de A04: referencias de ofertas públicas y selección desde candidato.
Los UUID internos, FK y comandos no cambian. No implementa códigos privados.

Migración: `supabase/migrations/20261017204435_opening_public_slugs.sql`.
Agrega `job_openings.public_slug`, índice único, validación, helpers privados y
trigger; amplía la proyección existente y agrega `published_offer_by_slug(text)`.
No concede SELECT anónimo ni cambia los guards/RLS de negocio.

## Orden de entrega

1. Revisar y aprobar el SQL y su PR; comprobar migraciones previas pendientes.
2. El operador del entorno aplica migraciones por el procedimiento autorizado.
   Este PR no ejecuta cambios sobre Supabase alojado, Vercel ni datos reales.
3. Verificar referencias no nulas/únicas, trigger `version_row` habilitado y
   RPC por slug disponible. En local puede usarse
   `node node_modules/supabase/dist/supabase.js migration up --local` después de
   revisar **todas** las migraciones pendientes; no usar `--linked` por analogía.
4. Desplegar aplicación; comprobar inicio/listado/detalle, enlace antiguo UUID,
   oferta no pública y selección de oferta desde candidato. Un preview con DB
   anterior a la migración no verifica este incremento.

El backfill mantiene `version`, `updated_at` y estados. La suspensión temporal
del trigger de versión está dentro de una transacción y bajo bloqueo de tabla;
una falla revierte tanto datos como DDL. Nuevas ofertas siempre reciben un slug
del servidor, incluso si se intenta proporcionar otro. Editar título no lo cambia.

## Recuperación

Si falla la aplicación, volver a la versión anterior de aplicación conservando
columna, referencias y RPC. `published_offers(integer,integer,uuid)` conserva su
firma; la propiedad JSON adicional es compatible con consumidores anteriores.
No regenerar ni borrar slugs: son enlaces persistentes. No borrar ofertas,
historial, FK ni ejecutar resets en entornos compartidos para recuperar este cambio.
Una colisión impide la transacción por el índice único, sin sobrescribir otra oferta.

## Pruebas

- `supabase/tests/021_public_offer_slugs.test.sql`: pruebas transaccionales con rollback.
- `tests/unit/openings/public-service.test.ts`: formato, resolución y errores.
- Componentes públicos/candidato: enlaces, redirecciones y UUID solo en comandos.
- `tests/e2e/public-offer-slugs.spec.ts`: navegación real, compatibilidad y rechazo.

Next puede emitir `permanentRedirect` como meta refresh después de comenzar
streaming y NOT_FOUND con HTTP 200 más noindex; las pruebas comprueban destino,
URL final, ausencia de redirección no autorizada y metadatos, no solo status.
Fuentes: [permanentRedirect](https://nextjs.org/docs/app/api-reference/functions/permanentRedirect),
[notFound](https://nextjs.org/docs/app/api-reference/functions/not-found).
