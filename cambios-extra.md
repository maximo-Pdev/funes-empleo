# Cambios extra necesarios

Registro de requisitos derivados y ajustes técnicos necesarios para cumplir tareas
aprobadas. No sustituye la constitución ni los artefactos de Spec Kit, y no convierte
una propuesta en una decisión municipal aprobada.

## Autorización de trabajo

- **Responsable:** Mateo.
- **Fecha:** 2026-09-26.
- **Evidencia:** instrucción en este chat: «agrega a agents.md si considera que algún
  requisito extra sea necesario que lo agregue pero registralo en cambios-extra.md
  o algún nombre así».
- **Alcance:** incorporar extras necesarios para cumplir la tarea aprobada, con
  justificación y trazabilidad; los límites y controles están en `AGENTS.md`.
- **Revisión:** esta instrucción no acredita revisión de Máximo ni aceptación municipal.

## EXTRA-001 — Evidencia histórica para métricas al cierre del período

- **Fecha de detección:** 2026-09-26.
- **Estado:** implementado y verificado localmente; pendiente de revisión por PR.
- **Origen:** FR-064 y tareas T079/T081 de
  `specs/001-municipal-employment-portal/`; fase 8 (US6).
- **Problema y evidencia:** las métricas deben reflejar el estado al cierre del
  período, pero los perfiles guardan valores actuales. Las funciones de mantenimiento
  reemplazan asociaciones de categorías y la auditoría no conserva todos los valores
  necesarios para reconstruir disponibilidad, confirmación y categorías anteriores.
  Ejemplos: `supabase/migrations/202609190019_candidate_self_service.sql` y
  `supabase/migrations/202609190030_company_self_service.sql` eliminan asociaciones
  previas de categorías; `202609190003_authorization_audit.sql` limita los metadatos
  de auditoría a identificadores de decisión, versión y conteo.
- **Cambio implementado:** conservar evidencia histórica mínima, protegida y transaccional
  de los atributos necesarios para calcular las métricas aprobadas. No copiar nombres,
  DNI, contactos, notas ni CV. Una instalación existente registra cobertura fiable
  desde la migración y rechaza períodos anteriores sin reconstrucciones supuestas.
- **Justificación:** es soporte técnico para un requisito ya aprobado, no una nueva
  funcionalidad municipal ni una solicitud de documentación oficial.
- **Archivos y contratos:** migraciones `202609190060_metrics.sql` y
  `202609190061_metrics_history_guard.sql`; `supabase/tests/060_metrics.test.sql`;
  servicio, validación, dashboard y exportación en `src/features/metrics/` y sus rutas;
  `plan.md`, `data-model.md` y `research.md`. Contratos definitivos, tablas privadas,
  errores y recuperación en `docs/validation/phase-8-metrics.md`. No se reescribieron
  migraciones aplicadas. `playwright.config.ts` ejecuta el proyecto de métricas antes
  de los recorridos que mutan el fixture; seed y manifiesto conservan conteos exactos.
- **Riesgos y límites:** historia previa irrecuperable, consistencia transaccional,
  exposición de datos y crecimiento del historial. No inventar antecedentes ni
  introducir purgas o retención no aprobadas. No cambiar las reglas de negocio.
- **Verificación realizada:** pruebas de cambios posteriores al período, categorías,
  disponibilidad, vigencia, consentimiento, acceso exclusivo administrativo y
  rollback; 54 aserciones SQL nuevas dentro de 466 correctas, 112 pruebas
  unitarias/componentes, E2E de métricas, typecheck, lint y build correctos.
- **Autorización y coordinación:** cubierto por la autorización general anterior
  como requisito técnico derivado. Se anunciaron el problema y el ajuste de configuración
  compartida al usuario. La revisión del diseño y de los archivos por Máximo sigue pendiente.
- **Resultado:** fase 8 implementada; evidencia y límites en el documento de validación.
  Esta entrada no acredita aprobación municipal, revisión humana ni merge.
- **Referencias:** implementación `1aea6be`, [PR #31](https://github.com/maximo-Pdev/funes-empleo/pull/31).

## EXTRA-002 — Paginación administrativa reproducible

- Fecha/responsable: 2026-09-27, Mateo autoriza fase 9; agente implementa bajo
  autorización general de extras necesarios. Revisión del compañero pendiente.
- Estado: implementado y verificado localmente; revisión del compañero pendiente.
- Origen: T089 / SC-008A y entradas aprobadas de `acceptance-manifest.json`.
- Evidencia: empresas no acepta filtro de estado y usa 20 filas; ofertas usa 20 por
  defecto sin exponer tamaño. Ambos ordenan solo por fecha, con empates en el seed.
- Cambio mínimo: empresas con filtro validado y página de 10 filas; ofertas solicita
  10 filas; ambas usan UUID como desempate. Se conservan RLS, roles y conteos aprobados.
- Archivos compartidos: páginas admin de empresas/ofertas y servicio de listado de
  ofertas, pruebas E2E y documentación. Se anunció al usuario antes de implementar.
- Riesgos: navegación/filtros y orden; verificar página 2, totales, estado inválido,
  no duplicación entre páginas y accesibilidad. Sin schema ni nuevos estados.
- Verificación: E2E falló primero por 20 filas en lugar de 10; tras la corrección
  pasó con 80 ofertas publicadas, 50 empresas activas, páginas de 10 filas disjuntas
  y rechazo de filtro inválido. Typecheck, lint y build correctos. Evidencia completa
  y límites de rendimiento alojado en `docs/validation/quality-gates.md`.
- Commit/PR: pendiente al registrar esta verificación; consultar historial de esta
  entrada y PR de `codex/temp-phase-9-quality`. No se acredita revisión ni merge.

## Formato para próximas entradas

Usar un ID consecutivo `EXTRA-NNN` y registrar:

1. Fecha, responsable y estado.
2. Problema, evidencia y requisito/tarea aprobada de origen.
3. Cambio mínimo necesario y justificación.
4. Archivos y contratos afectados, riesgos y límites.
5. Autorización y coordinación, distinguiendo decisiones pendientes de aprobadas.
6. Verificación prevista y resultados reales.
7. Limitaciones, revisión y referencias de commit/PR cuando existan.
