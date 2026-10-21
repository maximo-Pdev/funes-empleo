# Registro y destino de verificación — diagnóstico 2026-10-20

## Entorno y evidencia

Página comunicada por Mateo: https://funes-empleo.vercel.app.
Proyecto Supabase inspeccionado en dashboard con su sesión: Funes-empleo,
ref kyjycjojzhwggjuqjnki. No se crearon cuentas ni enviaron correos alojados.
La consulta pública de Auth confirma email/registro habilitados y confirmación
exigida. El callback publicado sin token redirige al dominio actual, no al demo.
Una solicitud con DNI ficticio inválido muestra el error seguro del formulario.
Eso acredita respuesta de esa validación, no un alta real ni la entrega de correo.

Estado observado antes de cambios:

- Site URL: `https://funes-empleo-demo.vercel.app`.
- Redirect URLs: `https://funes-empleo-demo.vercel.app/auth/callback` y
  `https://funes-empleo-demo.vercel.app/auth/callback?next=/update-password`.
- SMTP propio desactivado; plantillas predeterminadas.

El destino actual solicitado no está permitido. Supabase usa Site URL como
fallback de un redirect no permitido: explica el salto al sitio anterior.
La aplicación configura emailRedirectTo desde NEXT_PUBLIC_APP_URL; el callback
también usa esa base. Verificar variables del entorno publicado, no sustituirlas
por `.env.local` ni inferirlas desde otro proyecto Vercel.

## Corrección operativa aplicada — 2026-10-20

Mateo confirmó «cambialas entonces». Se guardaron y verificaron en el dashboard:

1. Site URL: `https://funes-empleo.vercel.app`.
2. Agregados `https://funes-empleo.vercel.app/auth/callback` y
   `https://funes-empleo.vercel.app/auth/callback?next=/update-password`.
3. Destinos anteriores conservados, sin comodines globales; total cuatro URLs.
4. Toasts de guardado exitoso y lectura posterior con esos valores confirmados.
   Próxima prueba del operador: solicitar un correo nuevo y abrirlo
   desde el mismo navegador del registro para conservar el verificador PKCE.
   El cambio no reescribe enlaces ya enviados ni revive tokens vencidos/usados.

Recuperación: conservar estos valores previos para revertir solo la configuración
modificada si se detecta un problema. No resetear Auth ni borrar usuarios,
perfiles, historial o migraciones. No desactivar verificación de correo.

## Bloqueo del correo público

El ajuste posterior [de formularios](../product/form-validation.md), EXTRA-028,
conserva datos ante errores y respuestas genéricas, y mejora sus avisos visibles.
No resuelve por sí mismo el SMTP ni convierte una respuesta genérica en evidencia
de entrega de correo.

El SMTP integrado de Supabase solo envía a direcciones del equipo autorizado y
tiene cuota reducida (documentación consultada: dos mensajes/hora). No sirve para
autorregistro público general. Se necesita proveedor SMTP y remitente verificado,
pendientes de decisión/configuración; Resend no se habilita por inferencia.
No pedir credenciales en chat ni agregarlas al repositorio. El operador debe
configurarlas directamente en Supabase y comprobar remitente/dominio con el
proveedor. No aumentar permisos, invitar usuarios al equipo ni desactivar
confirmación para eludir esta restricción.

Los servicios actuales responden igual ante duplicados y errores de Auth para
no revelar cuentas existentes. El mensaje genérico no prueba envío ni alta.
No atribuir una cuota/error concreto al caso de Mateo sin su código o evidencia
sanitizada del intento. No recopilar correos reales, contraseñas o enlaces con token.

## Verificación local reproducible

`tests/e2e/registration-verification.spec.ts` usa solo destinos loopback y buzón
ficticio. Prueba candidato/empresa, creación, destino exacto del correo, bloqueo
sin confirmar, callback, rol, bootstrap de perfil y sesión tras recarga. La prueba
deja identidades ficticias locales; no es un reset ni una prueba de correo alojado.
Resultados y límites en EXTRA-027. No ejecutar estos tests contra Vercel ni con
variables de Supabase alojado.
Resultado local:690 unitarias/43 archivos, tipos/lint/build y E2E2/2 PASS,
incluido rechazo del enlace reutilizado sin tokens en la página destino.
Configuración alojada de URLs guardada y verificada tras la confirmación de Mateo.
No se enviaron correos ni crearon cuentas alojadas para esta operación. Sigue
sin SMTP/remitente; no se declara resuelto el registro público ni entrega real.

Fuentes: [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls),
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp) y
[cuotas](https://supabase.com/docs/guides/auth/rate-limits).
