# Oferta administrativa y orden de candidatos coincidentes

EXTRA-073; alcance autorizado el 2026-10-25. Solo el detalle administrativo de cada
oferta incorpora el orden por última actualización del perfil. El directorio de
candidatos conserva su comportamiento actual.

## Comportamiento y contrato

En escritorio, Oferta y empresa queda a la izquierda; Decisión municipal e Historial
de moderación quedan a la derecha. En celular se apilan en ese orden. El enlace
Ver participaciones de esta oferta usa el botón institucional y conserva la
referencia opaca de la oferta y el filtro del listado de participaciones.
El historial muestra cinco eventos al abrir y ofrece Mostrar más únicamente
si hay otros; cada pulsación revela hasta cinco adicionales. El historial
completo se conserva y el foco pasa al primer evento agregado.

El selector Última actualización del perfil ofrece Más recientes primero
(`updated_desc`, predeterminado) y Más antiguos primero (`updated_asc`). Cambiarlo
regresa a la primera página. Los enlaces de paginación conservan `matchOrder`;
la segunda página, por ejemplo, usa `?matchOrder=updated_asc&matchPage=2#opening-matches`.
Valores desconocidos o repetidos se rechazan con un mensaje en español.

`public.match_opening_candidates_ordered(uuid,text,integer,integer)` reutiliza
`private.opening_candidate_pool` y ordena **todo** el conjunto apto antes de paginar.
Desempata por nombre y UUID interno ascendente, sin exponer ese UUID ni fechas
adicionales en la tarjeta. El total no depende del orden. No modifica postulaciones,
derivaciones, versiones ni auditoría. El RPC anterior conserva su orden alfabético.

La fecha es `candidate_profiles.updated_at`, mantenida por el trigger existente:
incluye las operaciones actuales que actualizan esa fila (también estado, CV,
foto o notas). No se inventa una fecha exclusiva de edición por el candidato.
Las reglas de consentimiento, vigencia, disponibilidad, categorías, cuenta,
CV y participación previa siguen en el pool compartido.

## Despliegue

Aplicar **antes de desplegar la aplicación**:
`supabase/migrations/20261025222811_admin_opening_candidate_order.sql`.
No requiere variables nuevas, backfill, tablas, índices ni reemplazar el RPC
legado. El archivo revoca permisos por defecto, concede ejecución a
`authenticated` y mantiene el guard de sesión y administrador activo. Incluye
la recarga del esquema de PostgREST.

Para una base vinculada con historial alineado, revisar primero
`npx --no-install supabase db push --dry-run --linked`. Solo ejecutar el push
real al autorizar el despliegue y confirmar que la lista pendiente es correcta.
Si el historial alojado difiere del local, reconciliarlo con evidencia; no marcar
migraciones aplicadas o revertidas para saltar errores. Si se aplica desde SQL
Editor, ejecutar el contenido exacto dentro de una transacción y registrar la
versión como aplicada **después** de comprobar el resultado.

Comprobar con una sesión administrativa real del entorno de destino: selector,
primera/segunda página en ambos órdenes, popup, nominación y exclusión posterior.
La consulta anónima no debe ejecutarse y empresa/candidato deben recibir denegación.

## Recuperación

Volver a la versión anterior de la aplicación es compatible: el RPC legado sigue
disponible. Se puede dejar el RPC nuevo sin uso. Si se decide retirarlo, hacerlo
después de revertir la aplicación mediante una nueva migración correctiva que
revoque y elimine únicamente
`public.match_opening_candidates_ordered(uuid,text,integer,integer)` y recargue
PostgREST. No borrar perfiles ni historial, no modificar el pool compartido ni
editar una migración ya aplicada.

## Verificación

Pruebas SQL: `supabase/tests/045_admin_opening_candidate_order.test.sql` (orden
global en tres páginas, empates, DTO, compatibilidad, ACL/roles/sesión,
validación, conservación de datos y exclusiones). Regresiones existentes del
pool, preview y nominación se mantienen. Pruebas de servicio/componentes y
`tests/e2e/job-category-matching.spec.ts` cubren query, reinicio de página,
persistencia de orden, teclado, diseño y nominación. Ver evidencia final en
`cambios-extra.md`, EXTRA-073. La verificación local no implica migración alojada
ni aceptación municipal.

## Estado alojado — 2026-10-25

Por solicitud posterior de Mateo, migración `20261025222811` aplicada y registrada
como `admin_opening_candidate_order` en el proyecto vinculado
`kyjycjojzhwggjuqjnki`. Se ejecutó únicamente ese archivo en una transacción con
precondiciones, verificación y registro del SQL exacto. Cuerpo y SQL del historial
comparados por hash contra el archivo local; VOLATILE, SECURITY DEFINER,
search_path vacío y permisos restringidos comprobados. Una invocación sin sesión
devuelve AUTH_REQUIRED. Pool, guard y RPC legado conservan definición y ACL.

Respaldo de definiciones/ACL previas y evidencia en
`test-results/admin-opening-remote-preflight.json` y archivos
`admin-opening-remote-*` ignorados. No se aplicaron otras versiones ni se
reinició la base. El despliegue de la interfaz y su comprobación alojada siguen
pendientes; las pruebas del recorrido completo corresponden al entorno local.

Advisor alojado:57 WARN antes/58 después, sin ERROR. Único aviso nuevo:
[0029: RPC autenticado SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
Es intencional para este contrato: ACL restringida, sesión vigente y rol admin
activo se comprueban antes de consultar el pool; empresas/candidatos se deniegan
en las pruebas SQL y servidor. No se amplían permisos sobre tablas privadas.
El primer diagnóstico posterior falló al autenticar el rol temporal del CLI;
repetido sin conexiones de CLI paralelas completó correctamente. No se cambió
ninguna contraseña ni configuración de Auth para resolverlo.
