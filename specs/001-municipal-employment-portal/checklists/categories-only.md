# Categorías únicas — EXTRA057,2026-10-24

Revisión de requisitos y plan previa a implementación (solicitud expresa de Mateo).

- [x] Una sola selección explícita; alcance incluye registro, propio/asistido,
  fichas, búsqueda/matching, derivaciones, CSV, DB, documentación y pruebas.
- [x] Regla de conservación definida: unión por ID, deduplicación, origen/fecha
  privado e inmutable; no inferir equivalencias ni activar filas/catálogos.
- [x] Compatibilidad definida: solo array legado vacío; rechazar no vacío y
  confirmedFields obsoleto sin perder datos silenciosamente.
- [x] Capacidad histórica20+20 preservada en máximo40; CSV conserva contrato.
- [x] Matching conserva OR, aptitud, rubros activos, exclusiones, orden/paginación;
  consentimiento/contratación/permisos no cambian.
- [x] Recuperación con precondiciones y sin borrar cambios posteriores; sin aplicar
  al entorno alojado como parte de pruebas.
- [x] Verificación contempla UI, contratos, SQL migración/comandos/paridad,
  rollback/privacidad, CSV, tipos/lint/unit/tooling/build y navegador por rol.

Checklist de requisitos revisado por el agente; no equivale a revisión humana,
aceptación municipal, CI o cierre de gates históricos del MVP.
