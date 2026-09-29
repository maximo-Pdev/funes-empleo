# Fase 7: importación ficticia controlada

Fecha: 2026-09-25. Rama: `codex/temp-phase-7-csv-import`.
Base: `main` actualizado, `c1c7547` (PR #29, fase 6 integrada).

## Alcance y autoridad

Mateo aprobó la opción A: implementar el formato provisional de demostración sin
esperar el Excel municipal. Mapeo y decisión en `docs/import/candidate-import-v1.md`.
T070–T078 completadas para esa demo; T069 permanece pendiente de muestra anonimizada
y aprobación de la Oficina. OQ-018/OQ-010 siguen abiertas. No importar datos reales.

Parser UTF-8/BOM estricto, sin cast, encabezados exactos y límites 5 MiB / 10.000
filas / 64 KiB; preview sin altas, campos sensibles enmascarados, validaciones,
duplicados internos/contra base, impacto y páginas de 50 filas. Resoluciones
motivadas: usar/actualizar solo campos seleccionados, corregir y crear, o rechazar.
Confirmación SQL revalida versión/hash/mapeo/catálogo y serializa escrituras; un fallo
revierte negocio y conserva lote auditable. Recuperación mediante nueva carga y lote
vinculado. Páginas privadas dinámicas, guards servidor/SQL/RLS, origen HTTP validado
y carga limitada en memoria sin archivo bruto persistido.

Nuevos perfiles: importados, borradores, sin cuenta/consentimiento/CV. Sin paquetes
ni variables nuevas. En navegación de candidatos solo se agrega el enlace; tipos
SQL ampliados. No se cambian búsqueda ni autenticación compartidas.

## Evidencia local

Entorno exclusivamente ficticio, Node **24.21.0**, npm **11.19.0**.

| Verificación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto, cero advertencias |
| `npm run test:unit` | 100 pruebas en 18 archivos correctas |
| `npm run test:db` | Reset local completo; 412 pgTAP correctas, 47 de importación |
| `npm run build` | Correcto |
| `npx playwright test tests/e2e/candidate-import.spec.ts --workers=1` | 3 recorridos correctos, sin skips |
| `git diff --check` | Correcto |
| axe/captura móvil | Sin incidencias axe en pantallas probadas; 360×800 revisado sin desbordamiento |

E2E: preview sin alta, confirmación, rechazo de duplicado interno, dos confirmaciones
simultáneas (una aceptada y una rechazada sin duplicar), fallo forzado en segunda fila
con cero altas, error sanitizado y nueva carga vinculada con recuperación completa.
pgTAP también cubre roles negativos, sesión suspendida, grants, categorías desactivadas,
las tres resoluciones, campos no elegidos intactos y conflictos de versión/hash.

Las primeras pruebas fallaron por parser/RPC inexistentes. La verificación detectó
ambigüedad SQL (corregida en 052), páginas estáticas (hechas dinámicas) y origen HTTP
interno de Next (se compara con URL pública configurada). pgTAP repetido después de
E2E detectó perfiles ficticios adicionales: se restableció el seed con `test:db`,
sin alterar conteos esperados. Configuración local cargada en memoria sin imprimir
claves ni modificar `.env.local`. Capturas/resultados ignorados por Git.

## Migraciones y recuperación

050: staging y RPC administrativas. 051: confirmación e índice de hash completado.
052: corrección forward-only de variable ambigua y preservación de campos no elegidos.
053: detalle laboral seguro en preview e índices de duplicados internos.

Solo aplicadas en Supabase local. El error de 050 apareció dentro de una prueba
revertida y no dejó negocio parcial. Mantener migraciones aplicadas y corregir hacia
adelante; no borrar perfiles/lotes como rollback. Solo se reconstruyen entornos
ficticios, conservando evidencia segura. El segundo desarrollador debe revisar este
registro y las migraciones antes de integrar el PR.

## Pendiente y límites

- T069, catálogo/mapeo municipal y demás OQ: no resueltos.
- Revisión del segundo desarrollador y CI remoto: no se afirman realizados.
- No se ejecutó aquí la suite E2E completa de otras fases.
- Actualización 2026-09-29: preview alojado de 1.000 filas 5,96 s, confirmación
  9,93 s y SQL de integridad/auditoría correctos; evidencia en performance.md.
  NVDA y protocolo humano siguen pendientes; automatización no sustituye aceptación municipal.
- El formato demo y la confirmación de datos ficticios no son un detector de PII;
  el operador nunca debe cargar personas reales.

Constitución: intermediación intacta, autorización en servidor/SQL, datos ficticios,
historial y atomicidad, UI española, mismo stack y rama dedicada. Sin merge automático.
