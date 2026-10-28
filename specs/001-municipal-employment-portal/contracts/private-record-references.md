# A04 — Referencias privadas sin UUID visibles

EXTRA091: canonicalización idempotente. Reescribir query solo al sustituir realmente
un UUID; si ya contiene referencias opacas, conservar encoding, orden y parámetros
repetidos. Espacios equivalentes '+'/%20 no deben provocar una redirección nueva.
No modifica validación ni autorización de la página/handler receptor.

Solicitud de Mateo,2026-10-23. Revisión técnica acotada; no acredita aceptación
municipal ni altera permisos. UUID sigue siendo PK/FK y contrato de comandos.

## Alcance

No generar UUID en texto, enlaces, Location, rutas o parámetros GET del portal,
incluidas descargas CV, filtros, importaciones y CSV de métricas. Usar nombres
cuando identifican el registro; en otro caso, referencia aleatoria estable.
Slugs públicos existentes permanecen intactos. Contenido libre, claves React,
hidden de comandos, datos internos y tokens de Auth no se transforman por estética.

## Persistencia

Tabla private.record_references(kind,entity_id,reference,created_at), PK(kind,entity_id),
reference única e inmutable. Tipos cerrados: account,candidate,company,opening,
participation,referral,cv,import,category. Prefijo por tipo y24 hex aleatorios
(96 bits independientes del UUID), sin nombres, DNI o correo. Reintento acotado
por colisión. INSERT de backfill y triggers AFTER INSERT; no UPDATE de registros
de negocio, versiones o historial. La entropía usa pgcrypto a través de
private.record_reference_entropy, privada y sin EXECUTE cliente; permite probar
colisiones sin modificar extensiones. Sin acceso directo de clientes/service_role;
RLS sin policies públicas y funciones privadas sin EXECUTE cliente.

## Resolución

RPC get_record_references(p_kind text,p_ids uuid[]) devuelve pares id/reference
autorizados, máximo1000. RPC resolve_record_reference(p_kind,p_reference) devuelve
UUID o null; ajeno/inexistente iguales. Actor derivado de sesión vigente mediante
require_workflow_actor. SQL estático, search_path vacío y grants authenticated.

Admin: recursos ya accesibles. Candidato: cuenta/perfil/CV/participaciones propios
y categorías activas. Empresa: cuenta/perfil/ofertas/derivaciones propios, CV solo
con can_read_cv vigente. Resolver derivación propia revocada permite únicamente
el stub que ya devuelve company_referral; no concede candidato ni CV. Categorías
históricas siguen disponibles a admin y diferenciadas por referencia/version.
La referencia NO es credencial: servicios, comandos y Storage reautorizan siempre.

## Navegación y compatibilidad

Fronteras page/API/query resuelven referencia antes de servicios UUID existentes.
Enlaces nuevos emiten referencias. Enlaces UUID privados previos se canonicalizan
solo tras autorización, conservando filtros; desconocidos/ajenos se rechazan sin
revelar existencia. No se reintroduce lookup público de ofertas por UUID.
Revalidación por patrones dinámicos o referencia, no por ruta UUID obsoleta.
Descarga CV conserva streaming,no-store,nosniff,Vary:Cookie y nombre cv.pdf;
nunca entrega rutas Storage/signed URLs. No modificar tokens del proveedor Auth.

## Verificación y recuperación

SQL: generación/backfill/inmutabilidad/colisiones/actores/suspensión/IDOR,
estabilidad, versiones/historial intactos y stub revocado sin CV. Unit/componentes:
formatos, lookup, errores, enlaces/textos, filtros, redirecciones e invalidación.
Navegador: público/candidato/empresa/admin, permisos/CV/retry/paginación y scripts
quality completos, sin cambiar umbrales o fixtures por esconder fallos.

Aplicar SQL antes que aplicación. No aplicar alojado sin solicitud posterior.
Recuperación: revertir app conservando tabla/triggers/códigos y corregir hacia
adelante; no resetear base, regenerar referencias ni borrar historial.
