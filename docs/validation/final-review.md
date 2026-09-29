# Revisión final — T096

## Actualización de cierre técnico — 2026-09-29

Rama `codex/temp-mvp-completion`, desde main `481b9f0` (PR #32 integrada).
La revisión independiente continúa pendiente; el texto siguiente del 27/09 es histórico.

- Evidencia actual: 376 Vitest, 855 pgTAP, 57 E2E sin omisiones y dos carreras SQL;
  typecheck/lint/build correctos. Refuerzo posterior de handlers: focalizado PASS.
- T088/T093/T094 se cierran por evidencia HTTP/SQL/Storage y matriz de rollback;
  ninguna casilla acredita aceptación municipal ni revisión del compañero.
- EXTRA-003 asegura fixture y rechaza skips en CI (application/database PASS en
  Actions 36596663506, commit `2974958`).
  EXTRA-004 captura errores públicos de archivo empresarial; EXTRA-005 añade
  NOT_FOUND accesible; EXTRA-006 permite la operación de metadatos necesaria para
  descargar CV en Storage alojado conservando permisos y prohibiendo firma/listado.
- Demo protegida y nuevo preview comprobados con cuatro roles. Reset privado de
  datos ficticios y 500 PDF con hash verificados. Scripts y límites en runbook.
- Auth usa el dominio canónico y dos callbacks exactos. SMTP integrado limitado;
  entrega a buzón controlado y aceptación por cohortes todavía pendientes.
- Sin cambios de dependencias, secretos ni correo real versionados. La función de
  reset solo está instalada en demo, fuera de migraciones de producto y sin grants
  para anon/authenticated/service_role; revisar especialmente ese mantenimiento.
- T069 requiere mapeo real anonimizado aprobado; T087 requiere teclado/zoom/NVDA;
  T089 tiene siete mediciones técnicas correctas y necesita tiempos humanos;
  T092 necesita cohortes y
  correo verificado; T096 exige revisión independiente. La guía humana contiene pasos.
- Persisten advertencias Next de stream cerrado durante navegación, sin fallo de
  aserciones. No se atribuye una causa ni se afirma una corrección sin evidencia.
- EXTRA-007 prepara dos estados ficticios para las cuatro acciones concurrentes,
  mantiene conteos y documenta expresamente la variante; revisar su uso solo en demo.
- Convergencia: el propietario resolvió el acceso GitHub/Vercel el 29/09 y la API
  confirma el enlace al repositorio correcto, main como rama de publicación y
  protección SSO/forks. T097 todavía exige preview Git del SHA exacto y entrega
  desde main tras aprobación/merge; no se atribuye al despliegue manual.
- Avisos Supabase del 29/09: 2 funciones públicas anon y 41 funciones authenticated
  SECURITY DEFINER esperadas por la allowlist/RPC con controles internos; no se
  quitaron permisos para silenciar avisos. Protección de contraseñas filtradas
  desactivada en el plan Free; decisión futura de operación permanece pendiente.
  Referencias: [funciones públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
  [funciones autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
  [contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Registro histórico de la fase 9 inicial

2026-09-27. **Revisión automatizada/técnica parcial; revisión de Máximo pendiente**.
No atribuir al segundo desarrollador resultados de esta sesión. Mateo confirmó que no
hay evidencia de revisión humana para fase 9.

## Comprobaciones de esta rama

- Rama desde main con PR #31 integrada; no cambios iniciales ajenos.
- `git ls-files` muestra solo `.env.example` como archivo env; no claves privadas,
  backups o trazas versionadas en los patrones inspeccionados. No se leyó `.env.local`.
- Fixtures y nuevas pruebas usan datos sintéticos/example.invalid. Reset conserva
  hash y conteos de manifiesto; no se sustituyen por datos municipales.
- Sin nuevas dependencias ni migraciones de producto en esta fase. `npm audit --json`
  informó 0 vulnerabilidades el 2026-09-27; esto no certifica ausencia de riesgos.
- Cliente secreto aislado server-only con única exportación/consumidor de invitaciones;
  no URLs firmadas de CV en src. Logging usa allowlist, no request body.
- Nuevos E2E desactivan trazas/capturas con sesiones; artefactos de prueba permanecen
  ignorados. Revisar antes de compartir cualquier salida de Auth/recuperación.
- RLS/grants/Storage y mantenimiento privado verificados mediante tests 001–071.
- EXTRA-002 corrige paginación/filtro exigidos por SC-008A, sin ampliar roles ni datos.

## Hallazgos / límites abiertos

1. No hay demo, reset alojado, cohortes ni NVDA: no cerrar aceptación.
2. Cobertura HTTP/SQL de Server Actions y auditoría por cada clase aún no es exhaustiva;
   ver authorization.md/audit-matrix.md. Tests fuente no sustituyen tests de ejecución.
3. Búsqueda de candidatos carga lotes y filtra/pagina en servidor de aplicación;
   verificar planes/latencia real antes de afirmar SC-008A. Existencia de índices no basta.
4. Next registra `The destination stream closed early` en algunos recorridos existentes,
   sin fallar aserciones. Causa no diagnosticada; no se declara corregida.
5. Hay textos de estado inicial obsoletos en AGENTS/PROJECT_CONTEXT y `Status: Draft`
   en spec. La constitución ratificada y artefactos específicos rigen; confirmar con
   el propietario del stage cómo registrar revisión sin inventar aprobación municipal.
6. El job `application` de `.github/workflows/quality.yml` no levanta Supabase ni
   carga el fixture/variables de los E2E privados. La suite local de 45 recorridos
   no queda acreditada por un check verde de ese job; el job database sí ejecuta SQL.
   Ampliar CI requiere coordinar ese archivo compartido y verificar su ejecución.

## Registro del segundo desarrollador

Pendiente. Completar por PR: `revisor | fecha | commit revisado | hallazgo/severidad |
archivo/línea | corrección o decisión | evidencia de cierre`. Revisar especialmente
configuración de pruebas, páginas administrativas compartidas, aislamiento del fixture,
RLS/cliente secreto, seguridad de artefactos y límites de aceptación. Aprobación no
equivale a merge. T096 permanece sin marcar hasta contar con esa revisión.
