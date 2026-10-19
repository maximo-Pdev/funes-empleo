# A08 — catálogo de rubros y coincidencias municipales

## Alcance

Migración `supabase/migrations/20261019203041_job_categories_matching.sql`.
La primera ya fue aplicada/registrada por Mateo en el proyecto alojado; no repetir.
Ampliación solicitada después: `20261019205940_opening_candidate_preview.sql`,
pendiente de aplicar allí. Mantener la primera inmutable; CI fresco ejecuta ambas.
Base: main `efdeff2`, que incluye A07 y los slugs del compañero. Sin dependencias,
variables nuevas, bucket ni cambios a roles, estados, importador v1 o derivaciones.

Inserta los quince rubros aprobados en `job_categories(version=2)`. La base es
la fuente única de las opciones en perfiles, búsquedas y ofertas; los formularios
ya permiten selección múltiple. Las categorías anteriores siguen disponibles:
no se borran ni se inventan equivalencias o asociaciones al catálogo nuevo.

Desde el detalle administrativo de oferta se consultan candidatos que comparten
al menos un rubro activo, sea ocupación o interés. Deben cumplir las condiciones
actuales de aptitud: perfil activo/disponible/vigente, consentimiento aceptado,
cuenta activa si está vinculada y CV válido. Incluye perfiles asistidos sin cuenta.
No hay ranking ni cambio de participación al consultar. La ampliación excluye
cualquier participación no archivada antes de contar/paginar, incluso postulaciones
y casos finalizados: no pueden nominarse otra vez con el comando vigente.
Dos columnas desde md, una en móvil y doce fichas por página. El popup carga perfil
laboral y CV bajo demanda, sin DNI/contactos/notas; permite nominar únicamente a
la oferta actual, con versiones verificadas. Escape/Cerrar devuelven foco, errores
no retiran fichas y éxito cierra/actualiza sin salir. Nominar no es derivar.
La empresa no puede consultar esta RPC, aunque conozca la referencia de oferta.

## Despliegue

1. Revisar commit, proyecto destino y migraciones/objetos reales con el operador.
2. Respaldo operativo disponible y migraciones previas revisadas. Aplicar únicamente
   la nueva migración transaccionalmente mediante el procedimiento autorizado.
3. Comprobar catálogo v2 (quince filas activas), referencias previas intactas y
   RPC `match_opening_candidates(uuid,integer,integer)` y
   `preview_opening_candidate(uuid,uuid)` con sesión administrativa. Verificar
   que un caso previo no aparezca en listado ni permita preview desde ese pool.
   Verificar denegación de empresa/candidato y ausencia de EXECUTE anónimo.
4. Registrar la migración solo después del éxito y comprobación. Desplegar app.
5. Verificar varias coincidencias, duplicados, página 2, recarga, error/vacío,
   popup/foco/Escape, nominación fija a la oferta y desaparición tras éxito;
   comprobar que consultar no crea participaciones/derivaciones y nominar solo
   crea una participación, nunca un permiso empresarial.

El historial alojado inicial usa versiones asignadas por MCP distintas de los
archivos; está documentado en demo-runbook. No ejecutar db push ni repair masivo
para esta entrega. No tratar una fila de historial como prueba de esquema.
Si el catálogo v2 ya existe o una función entra en conflicto, detenerse y revisar;
no agregar ON CONFLICT para ocultar diferencias ni borrar objetos compartidos.

## Recuperación y límites

Revertir app conserva el catálogo y función compatibles. Una corrección SQL va
en otra migración revisada; nunca borrar rubros referenciados, historial, perfiles,
ofertas ni reasignar categorías automáticamente. No resetear la base compartida.
Las asociaciones nuevas requieren selección explícita de usuarios o personal.
La validación local no acredita despliegue alojado, CI, review ni aceptación final.

## Verificación reproducible

Primera entrega local A08, antes de la ampliación modal, 2026-10-19:
Node24.22.0/npm11.19.1 portable, sin cambiar globales.
655 pruebas unitarias/componentes en42 archivos, tooling57, tipos/lint/build PASS.
pgTAP986/15 archivos, incluidas35 A08; advisor security local sin hallazgos.
Navegador12/12: 3 A08, 3 A07 y 6 de sesión; teclado, recarga, paginación, rechazo
empresarial, multiselección, sin mutaciones al consultar. Axe del bloque sin
violaciones y sin overflow a360×800. Colección73/18, no suite completa ejecutada.
Cobertura configurada100% de env/schema exclusivamente, no cobertura total A08.
SQL y Auth de navegador se ejecutaron secuencialmente; no reset ni SQL alojado.
Migración registrada applied solo en la base local después de los tests.
CI completo, review, commit/PR y aceptación siguen pendientes.
El servidor registró avisos `The destination stream closed early` durante la
navegación; los doce recorridos finalizaron PASS. No se atribuye una causa ni se
considera que estas pruebas acrediten ausencia de avisos de streaming en Next.

### Ampliación modal y nominación

Verificación local posterior: 689 unitarias/componentes en43 archivos, tooling57,
tipos/lint/build PASS; pgTAP1007/16 archivos (21 nuevos de preview y35 de matching
actualizados), advisor security sin hallazgos. SQL completo antes de navegador.
Navegador13/13 (A08×4, A07×3, sesiones×6) y autorización HTTP8/8 PASS,
incluida la nueva Server Action protegida. Colección74/18, no suite completa.
Los cuatro recorridos A08 pasan: grid/paginación, popup/foco/Escape, móvil/axe,
errores/vacíos, nominación real y exclusión persistida, rechazo empresarial.
La prueba de nominación deja intencionalmente una participación ficticia local
adicional (1001 frente a1000 del fixture original), con su auditoría y sin nuevas
derivaciones. No borrarla ni resetear para volver a pasar un conteo de fixture.
Repetir toda la suite requiere el entorno aislado del runner/CI, no esta base
que se quiso conservar. No se ejecutó la suite E2E completa.

`20261019205940` aplicada y registrada solo localmente; pendiente en alojado.
El recibo de Mateo acredita ejecución/verificación/registro de `20261019203041`
alojada: quince rubros v2, matching presente y EXECUTE anónimo denegado. No es
inspección remota del agente ni acredita Vercel o la migración modal posterior.
Sin dependencias, variables nuevas ni cambios a `.env.local`. Commit/PR, CI,
revisión independiente y aceptación humana siguen pendientes.
Luego del ajuste de posición bajo información/historial:690 pruebas/43 archivos,
tipos/lint y build final PASS. Mateo informa funcionamiento contra su entorno
tras el procedimiento manual; sin recibo adicional del registro ni inspección
remota del agente. Antes de desplegar comprobar esquema e historial reales.
Entrega `11be483` en [PR61](https://github.com/maximo-Pdev/funes-empleo/pull/61),
abierto contra main. Actualiza el pendiente de commit/PR previo; CI del SHA,
revisión independiente, despliegue y aceptación continúan pendientes.
Al finalizar se cerró el servidor propio de pruebas y se comprobó puerto3000
libre; Docker se conserva. Persistieron avisos de stream de Next durante las
navegaciones, sin fallos en los recorridos; no se atribuye causa ni se ocultan.

`supabase/tests/023_job_category_matching.test.sql` usa rollback y fixture ficticio.
Tests unitarios en `tests/unit/candidates/matching.test.ts`, UI en
`tests/components/intermediation/opening-matches.test.tsx` y navegador en
`tests/e2e/job-category-matching.spec.ts`. Los tests privados solo admiten Supabase
Docker local y app loopback; no cambiar `.env.local` para apuntarlos al demo.
Ejecutar SQL completo y tests de navegador secuencialmente para evitar interferir
con snapshots de sesiones en 072. No usar los runners de reset sobre un servicio
que se quiera conservar; CI tiene su propia instancia y fixture de aceptación.
