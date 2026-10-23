# A04 — Referencias privadas sin UUID visibles

Solicitud de Mateo,2026-10-23. Rama `feat/private-record-references`, desde
main `8d00f95`. PR67 estaba mergeado; su rama anterior se eliminó local/remotamente.
Árbol inicial limpio. No hay nuevos commits ni PR para esta rama. La migración
alojada se aplicó posteriormente por solicitud expresa de Mateo; evidencia abajo.
No acredita revisión independiente ni aceptación municipal.

## Comportamiento

- Público: conserva exactamente los slugs existentes de las ofertas.
- Candidatos: descarga CV por referencia; UUID de perfil/CV permanece interno.
- Empresas: oferta y derivación por códigos; solo sus recursos y el permiso CV
  vigente. Una derivación revocada conserva únicamente su referencia no personal.
- Administración: candidatos/asistidos, empresas, ofertas, participaciones,
  importaciones/reintentos, actores e informes dejan de mostrar o enlazar UUID.
- Filtros GET de categoría/oferta/candidato/derivación usan referencias. El CSV
  conserva columnas, cifras, escape y protección contra fórmulas, pero sus códigos
  de categoría/oferta ya no son UUID.
- Nuevos registros reciben códigos aleatorios estables en la misma transacción.
  Los UUID siguen siendo PK/FK y valores de comandos, formularios internos y RPC.
  No se transforma contenido libre ni tokens/códigos/cookies del proveedor Auth.

Las URL UUID privadas antiguas se redirigen solo después de autorizar el recurso,
conservando los filtros admitidos. Un código no sustituye el control de acceso.
CV mantiene streaming, `private,no-store`, `nosniff`, `Vary:Cookie` y nombre
`cv.pdf`; no se entrega Storage path ni una URL firmada. Todos los comandos y
servicios vuelven a comprobar sus permisos originales.

## Diseño y revisión acotada

Contrato: `specs/001-municipal-employment-portal/contracts/private-record-references.md`.
La tabla privada evita actualizar filas con triggers de versión/historial durante
el backfill. No se cambian estados, consentimientos, contratación o participaciones.
La entropía usa pgcrypto (96 bits), no una codificación del UUID ni datos personales.
La caché y agrupación de lookups son por request, nunca compartidas entre sesiones.

Análisis de spec/plan/modelo/contrato/tasks frente a constitución1.0.0: A04 y la
solicitud cubren la presentación y navegación; T157–T161 cubren persistencia,
autorización, consumidores, revalidación y verificación. Sin conflicto de stack,
intermediación, historial o decisión legal pendiente para este alcance. La
revisión humana por PR sigue pendiente; las cuestiones municipales abiertas y
los gates históricos no se dan por cerrados. EXTRA052 se registró antes de los
cambios de producto y se amplió antes de introducir el helper privado de entropía.

## Aplicación y recuperación

1. Revisar la migración completa
   `supabase/migrations/20261023180306_private_record_references.sql` y comprobar
   el proyecto destino. No usar `db reset` en una base compartida o alojada.
   Comprobar que `select to_regprocedure('extensions.gen_random_bytes(integer)');`
   no devuelve null. Si falta pgcrypto en esa ubicación, revisar la configuración
   del proyecto antes de aplicar; no reubicar extensiones existentes a ciegas.
2. Aplicar esta migración antes de publicar la aplicación. Es una transacción:
   crea tabla privada, backfill, triggers y RPC con grants mínimos. No ejecutar
   solo fragmentos ni cambiar UUID/fechas/estados para resolver el historial CLI.
3. En SQL Editor con permisos administrativos se pueden comprobar objetos y
   conteos sin exponer identificadores o datos personales:

   ```sql
   select to_regprocedure('public.get_record_references(text,uuid[])'),
          to_regprocedure('public.resolve_record_reference(text,text)');
   select kind,count(*) from private.record_references group by kind order by kind;
   ```

   La ejecución DDL correcta puede indicar `Success. No rows returned`. Los RPC
   requieren sesión Auth vigente: llamarlos sin JWT desde SQL Editor no es una
   prueba válida de acceso de candidato/empresa/admin.
4. Si el historial remoto y los archivos locales no coinciden, detener `db push`
   y reconciliar primero con evidencia. No marcar una versión como aplicada si su
   SQL no se ejecutó y verificó. Esta tarea no repara historial remoto anterior.
5. Publicar la app y comprobar navegación por los tres roles, filtros, descarga,
   reintento de importación y denegación de referencias ajenas/revocadas.

Recuperación preferida: revertir la aplicación conservando la migración aditiva,
los códigos y los triggers; corregir SQL hacia adelante. No borrar/regenerar
referencias ni historial. La app anterior vuelve a usar sus URL UUID; no resuelve
los códigos nuevos hasta reintroducir esta versión.

## Verificación

Pruebas SQL: generación/backfill, estabilidad e inmutabilidad, permisos directos,
sesión/suspensión, IDOR por tipo/propiedad, CV vigente/revocado y stub empresarial;
colisiones forzadas con reintento y rollback de alta sin elevar privilegios.
La sustitución de entropía existe solamente dentro de la transacción de prueba.

Pruebas unitarias/componentes: formatos, lookup acotado, respuestas inválidas,
errores seguros, UUID legado autorizado, filtros y canonicalización; CV vuelve a
autorizar tanto en RPC como Storage; CSV conserva precisión sin UUID.
Navegador: recorridos completos existentes y cuatro casos nuevos que inspeccionan
texto, enlaces y URL por público/candidato/empresa/admin, compatibilidad CV e IDOR.

Entorno de validación: Supabase desechable `funes-reference-check`, API54331,
DB54332, correo54334; no se reseteó ni migró `funes-empleo` habitual54321/54322.
El fixture conserva sus hashes/conteos. El snapshot de pruebas adapta únicamente
nombre de contenedor/puertos locales y lee la compilación real; no relaja permisos,
assertions, plazos o umbrales. Ningún control se dirige a Supabase/Vercel alojados.

Revisión manual de lectura con navegador integrado: cuenta administrativa ficticia,
padrón y perfil muestran códigos cta/can/cas, navegación asistida y actores del
historial sin UUID; no se enviaron cambios de negocio. Sesión de prueba cerrada.

Consulta técnica: documentación oficial de funciones/RPC y changelog de Supabase
revisados. Los cambios anunciados sobre cifrados PGP heredados, pinning de
extensiones y TLS no requieren cambiar este diseño: no se usan esos cifrados ni
se cambian versiones o TLS. Esta conclusión es una revisión técnica acotada,
no un diagnóstico del proyecto alojado. Referencias:
[funciones](https://supabase.com/docs/guides/database/functions),
[PostgreSQL/pgcrypto](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes),
[extensiones](https://supabase.com/changelog/extension-version-pinning-ignored),
[TLS](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).

Resultados finales:

- SQL1125 aserciones/19 archivos PASS,53 de referencias; fixture intacto y500 CV
  ficticios. Incluye colisiones forzadas, límite de cinco intentos y rollback.
- Unitarias/componentes844/65 PASS; tooling57/57 PASS.
- Tipos, lint, build de producción y diff-check PASS. Cobertura configurada de
  env/schema100% (ejecución de843 casos antes del último caso adicional de UI;
  no es cobertura global de la aplicación).
- Navegador108/108 PASS, cero omitidos/fallidos/inestables y sin reintentos;
  incluye seis pruebas A04, flujos anteriores y SC-008A de cuatro administradores,
  barrera común, cinco segundos por acción y auditorías verificadas.
- Dos carreras SQL adicionales PASS: suspensión/revocación impiden una escritura
  concurrente tras observar el bloqueo real. Advisor security a nivel warn/error:
  sin incidencias. No se interpretan los checks como aceptación municipal.

Dos fallos intermedios de navegador quedaron resueltos: una expectativa antigua
de UUID en CV y un selector nuevo que incluía el anunciador accesible de Next.js.
La batería completa final se repitió sin omisiones ni ampliación de umbrales.

## Aplicación alojada — 2026-10-23

Mateo autorizó «hace la migracion». CLI autenticado confirmó el único proyecto
vinculado Funes-empleo (`kyjycjojzhwggjuqjnki`), activo. MCP no tenía permisos;
se usó `db query --linked --file` mediante Management API, no credenciales de app.
Prerrequisitos presentes y objetos/versión ausentes antes de ejecutar. Se aplicó
el archivo completo en su transacción, exit0/rows vacío:
`20261023180306_private_record_references.sql`, SHA256
`4864E8534DDB9348367752BFDF75DF1F1E28A71C0D2511208FC09B10E36DB159`.

Verificación posterior:3751 referencias, cero faltantes/huérfanas, formato válido,
nueve triggers de alta y uno de inmutabilidad, RLS habilitado. Cero privilegios
directos de tabla o EXECUTE privado para anon/authenticated/service_role. Los dos
RPC solo permiten authenticated y ambos rechazan falta de sesión con AUTH_REQUIRED;
las seis funciones tienen search_path vacío. Importaciones existentes:0.
Huellas agregadas y conteos de las nueve tablas de origen, candidate_consents y
audit_events coinciden exactamente antes/después; no se extrajeron datos personales.

Después de verificar el SQL, `migration repair 20261023180306 --status applied
--linked` registró exclusivamente esta versión. Consulta final: nombre
private_record_references, versión20261023180306 y26 statements. No se ejecutaron
db push/reset, ni se repararon versiones previas divergentes. Base local habitual
sin migrar ni resetear; next-env.d.ts regenerado por el servidor ajeno se conserva.

Advisor security alojado:52 WARN previos,54 posteriores, cero ERROR. Los dos nuevos
son avisos0029 de RPC SECURITY DEFINER ejecutables por authenticated; corresponden
al contrato explícito, con guard de sesión y autorización por recurso, grants
restringidos y tabla privada. No se eliminan controles para silenciar el advisor.
Los52 avisos previos incluyen protección de contraseñas filtradas deshabilitada;
su resolución no forma parte de esta migración. Referencias:
[0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Evidencia agregada sin secretos en test-results/reference-hosted-* (ignorado).

## Publicación para revisión — 2026-10-23

A pedido de Mateo se publicó el commit a22745d, sin firma ni coautorías, en
feat/private-record-references y se abrió
[PR68](https://github.com/maximo-Pdev/funes-empleo/pull/68) hacia main8d00f95.
Antes del commit se repitieron tipos, lint,844 unitarias/componentes y57 tooling:
todos PASS. Se conservaron las evidencias previas de build/SQL/E2E, sin repetir
resets ni detener el servidor del usuario. Diff-check y escaneo de patrones de
credenciales PASS; next-env.d.ts quedó fuera del commit y se preservó en el árbol.

Pendientes: CI del PR, revisión independiente, publicación de la app y recorridos
alojados con sesiones reales. No se hizo merge ni despliegue. Los gates históricos
siguen abiertos. El entorno temporal de validación ya quedó cerrado.
