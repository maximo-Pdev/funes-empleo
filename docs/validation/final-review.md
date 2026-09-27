# Revisión final — T096

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
