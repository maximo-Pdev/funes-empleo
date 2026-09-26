# Fase 8 — Seguimiento y métricas

Fecha: 2026-09-26. Rama: `codex/temp-phase-8-metrics`.
Base: `main` actualizado, `4f422cf` (PR #30 integrada).

## Alcance

T079–T086: métricas administrativas en `/admin/metrics`, CSV en
`/api/admin/exports/operations.csv`, historial cronológico de contactos con próximo
seguimiento en cada participación y plantillas editables exclusivas del personal.
No hay envío integrado, informes oficiales nuevos, dependencias ni variables nuevas.

## EXTRA-001: soporte histórico

La autorización de Mateo y el motivo están en `cambios-extra.md`. Las migraciones
060 y 061 incorporan evidencia mínima append-only en el esquema privado:

- `metrics_history`: cambios de estado, disponibilidad normalizada, confirmación,
  archivo y asociaciones de categorías, con UUID, instante y secuencia determinista.
- `metrics_outcomes`: eventos finales, preservando falta de respuesta y contratación
  posterior como eventos diferentes. Las duraciones usan contrataciones confirmadas
  por cuentas administrativas y una sola contratación por participación.
- `metrics_coverage`: inicio de cobertura fiable. Una instalación existente comienza
  al aplicar la migración; no se retrofechan valores mutables actuales. Se rechazan
  intervalos anteriores con `METRICS_HISTORY_UNAVAILABLE`, sin devolver ceros falsos.
- `metrics_exports`: actor, período, categoría, fecha y request ID. La auditoría
  enlaza esta evidencia por UUID; no guarda CSV ni títulos o datos personales.

No son tablas de agregados ni una segunda fuente editable de negocio. Los triggers
se ejecutan en la transacción original; el historial y los resultados tienen RLS y
solo lectura administrativa. Las funciones de consulta usan `security invoker`.
Los pequeños comandos `security definer` validan sesión/rol vigente y solo registran
evidencia permitida; no utilizan el cliente secreto ni aceptan actores arbitrarios.

El seed ficticio fija explícitamente la fecha inicial de las asociaciones de
categorías para reconstruir el fixture histórico. Se actualizó su hash en
`tests/fixtures/acceptance-manifest.json`, sin cambiar los conteos 500/50/100/1.000.
No se usa esta técnica para inventar historia de una instalación existente.

## Contratos de consulta

| Función SQL | Argumentos | Resultado |
| --- | --- | --- |
| `admin_metrics` | `p_from date`, `p_to date`, `p_category uuid = null` | JSON: `as_of`, `history_from`, `rows` |
| `export_admin_metrics` | Los mismos | El mismo JSON; registra evidencia de exportación atómicamente |
| `record_metrics_export` | Los mismos | Evidencia de descarga; sin contenido |
| `metrics_history_start` | Ninguno | Instante fiable o null para instalación nueva con historia desde creación |

Cada fila: `indicator`, `value`, `unit` (`count|days`), `state`
(`calculated|pending`), `category_id`, `category_name`, `opening_id`, `opening_title`.
Solo las dos duraciones contienen identificador/título de oferta. Sin filas de
candidatos, empresas ni participaciones. La descarga vuelve a calcular con los mismos
filtros; operaciones concurrentes pueden modificar el valor entre consultas.

Fechas inclusivas del calendario argentino: `[desde 00:00, hasta+1 día 00:00)`.
La foto de hoy se limita al instante de consulta; se rechazan fechas finales futuras,
intervalos invertidos, categorías inexistentes y parámetros desconocidos/repetidos.
Preentrevistas: fecha de registro del evento. Participaciones: fecha de alta, ambos
orígenes. Derivaciones: fecha de derivación. Resultados: fecha de confirmación/cierre.
Los eventos usan la categoría de la oferta en su instante; las existencias usan las
categorías al cierre. Empresas no reciben filtro de categoría. Los tiempos siguen
la cohorte publicada y las confirmaciones disponibles hasta la consulta, aunque
ocurran después del período. Días = segundos / 86.400, sin redondear en CSV; UI hasta
dos decimales. Categorías múltiples no duplican totales; desgloses no sumables.

Errores: `AUTH_REQUIRED`, `FORBIDDEN`, `INVALID_INPUT`,
`METRICS_HISTORY_UNAVAILABLE`, traducidos sin SQL ni detalles sensibles. El handler
deniega sin sesión/rol admin, aplica `private, no-store` y `nosniff`. Todas las celdas
CSV se entrecomillan/escapan; prefijos `= + - @ TAB CR` reciben apóstrofo. La auditoría
registra autorización/generación de la descarga, no acredita que el navegador haya
guardado el archivo completo si se corta la conexión.

## Verificación

- Node 24.21.0 / npm 11.19.0; typecheck, lint y build de producción correctos.
- 112 pruebas unitarias/componentes correctas. `test:coverage` pasa los umbrales
  configurados; su alcance limitado no representa cobertura del 100% de la aplicación.
- Reset ficticio verificado: 500 candidatos, 50 empresas, 100 ofertas, 1.000
  participaciones y 500 PDF ficticios; 466 aserciones pgTAP correctas, 54 nuevas.
- Tres E2E de fase 8 correctos: filtros/CSV dentro de 30 segundos, denegación de
  acceso y seguimiento por cuatro canales. Axe sin infracciones detectadas, revisión
  de captura móvil a 360 px y ausencia de desbordamiento horizontal.
- Regresión completa: 29 E2E correctos en 2,2 minutos, una omisión ambiental en
  recuperación de contraseña por falta de `LOCAL_MAILPIT_URL`. El recorrido completo
  de métricas tardó 7,8 segundos, con aserción independiente del límite de 30 segundos.
  Next emitió avisos `The destination stream closed early` durante otros recorridos;
  no fallaron aserciones. Su causa no se atribuye ni se considera resuelta aquí.

TDD: unitarias fallaron por módulos inexistentes, SQL por RPC inexistentes y E2E
por la página ausente. El primer E2E integrado encontró un selector de prueba que
no localizaba la categoría; se corrigió a rol `combobox`, sin relajar el requisito.
La regresión posterior detectó contaminación del fixture por recorridos previos
(103 ofertas/1.007 participaciones). Se conserva la aserción exacta y se separa
`metrics-fixture` como proyecto previo del que depende `chromium`. Ejecutar la suite
local sobre el fixture recién restablecido; no volver a ejecutar contra datos mutados.
Comandos: `node tests/fixtures/reset-local.mjs --confirm-local-reset` y luego
`npx playwright test --workers=1` con las variables locales de Supabase cargadas
según quickstart, sin imprimir sus claves. Para ejecutar solo fase 8, usar
`npx playwright test --project=metrics-fixture --workers=1` tras el mismo reset.

Revisión de coherencia de artefactos limitada a fase 8: 12 requisitos relacionados,
8 tareas con cobertura, sin contradicciones nuevas ni conflictos constitucionales
detectados. No sustituye la revisión del segundo desarrollador.

## Recuperación y límites

Migraciones solo aplicadas en Supabase local ficticio. 061 es un endurecimiento
forward-only: normaliza el valor histórico de disponibilidad, optimiza la evaluación
RLS y expone el inicio fiable para mensajes accionables. No se reescribe 060 aplicada.
Ante fallo, detener el despliegue, conservar evidencia sanitizada y corregir hacia
adelante; solo reconstruir entornos ficticios. No borrar historia como rollback.

Quedan pendientes revisión de Máximo, CI remoto, aceptación humana SC-008 en demo
alojada sin entrenamiento, NVDA y controles transversales de fase 9. E2E local con
límite de 30 segundos no sustituye ese protocolo humano. OQ-005 sigue abierta para
informes oficiales y las demás OQ no se cierran con esta implementación.

Constitución: intermediación intacta, stack existente, autorización servidor/RLS,
datos ficticios, historia transaccional, español y controles accesibles. Sin merge.
