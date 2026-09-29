# Rendimiento y aceptación — T089

Actualización 2026-09-29: **siete casos técnicos medidos; aceptación humana pendiente**.
Resultados y recibos se registran abajo. Registro histórico 2026-09-28: existía una demo protegida en
https://funes-empleo-demo.vercel.app con el fixture y 500 PDF verificados; el smoke
funcional no acredita tiempos fríos ni el protocolo de reset por medición.
Los tests de `tests/performance/acceptance.test.ts` validan protocolo, hashes y
rechazo de evidencia insuficiente; sus ejemplos `example.invalid` no son resultados
humanos ni mediciones. pgTAP 071 verifica existencia de índices, no asegura que el
planificador los elija ni sustituye EXPLAIN/latencia.

## Entradas versionadas

Fuente: `tests/fixtures/acceptance-manifest.json`, fixture `funes-demo-v1`, seed SHA-256
`ae11e0374459bd64f5f6a7803223d3f74a56fc80966c066be69e13a47eadb7d7`.
500 candidatos, 50 empresas, 100 ofertas, 1.000 participaciones; cuatro admins.

| Caso frío | Entrada | Resultado esperado | Límite |
| --- | --- | --- | --- |
| Candidato | `Persona ficticia 001`, DEMO-B, available | 1 resultado | ≤3 s |
| Ofertas | published, página 2, tamaño 10 | 80 total, 10 filas | ≤3 s |
| Empresas | active, página 2, tamaño 10 | 50 total, 10 filas | ≤3 s |
| CV autorizado | candidato 1, PDF del manifiesto | 1426 bytes y hash esperado | ≤10 s |
| Preview CSV | 1.000 filas sintéticas únicas, mapping demo | Resumen de 1.000 filas, sin altas | ≤30 s |
| Confirmación | Lote anterior válido | Terminal/conteos íntegros + auditoría | ≤60 s |
| Cuatro admins | Moderar/preseleccionar/contactar/confirmar resultado en registros distintos | Cuatro cambios/eventos íntegros | ≤5 s cada uno |
| SC-003 | Búsqueda→preentrevista→preselección | Preselección guardada | <5 min |
| SC-008 | Filtros→conteos→CSV completo | Valores/filtrado correctos | <30 s |

Antes de medir, comprobar que la UI aplica tamaño/página/estado exactamente como el
manifiesto; no cambiar expectativas para acomodar un resultado. Capturar EXPLAIN
sanitizado de consultas reales con rol/sesión administrativos y medir render estable;
la existencia del índice no basta. No promediar ni calentar: una medición por caso,
reset separado previamente, cualquier exceso falla. En paginación, medir desde cambio
de página hasta filas y conteo estables, sin indicador de carga. CV: solicitud hasta
archivo completo, luego tamaño/hash. CSV: envío hasta resumen completo; confirmación
hasta terminal visible; integridad/auditoría se comprueban fuera del reloj.

Validación local de entradas: `tests/e2e/pagination.spec.ts` comprueba los totales,
estado, páginas 1/2 de diez filas y ausencia de duplicados. Detectó y permitió corregir
20 filas sin filtro empresarial (EXTRA-002). Su duración no acredita latencia alojada.

Concurrencia: preparar cuatro sesiones individuales y cuatro registros distintos,
sin ejecutar antes la acción. Liberarlas con una barrera común; registrar duración
de cada acción hasta éxito visible y comprobar después las cuatro entidades, versiones
y eventos. No reutilizar un mismo registro para representar cuatro operaciones.

## Protocolo humano administrativo

Un único administrador sin capacitación ni práctica previa recibe solo descripción
de tarea. SC-003 y SC-008 deben usar el mismo despliegue demo/conexión estable y fixture
restablecido antes de cada tarea, sin calentamiento. No reemplazar por un desarrollador
que ya conoce el recorrido ni por Playwright. Registrar seudónimo, no nombre real.

Por medición: fecha, commit/URL de despliegue, versión/hash fixture, comprobante de
reset y conteos, navegador, dispositivo, conexión, participante, límites inicio/fin,
duración, resultado y fallo. Guardar cada ejecución, incluso fallida; no elegir solo
el mejor resultado. El evaluador puro rechaza resets reutilizados/entornos distintos.

## Mediciones técnicas alojadas — 2026-09-29

Una medición por caso, siete resets distintos, en el mismo despliegue protegido
`dpl_Bj7YxDaYcCydVayNAh4GW9kQnHNC`. El despliegue se creó con el árbol todavía sin
commit: su ID inmutable identifica la versión; no se atribuye a main ni a un SHA
limpio. Chromium 153.0.8010.12, 1366×768, Windows 10.0.26200, i5-11400F/16 GiB,
conexión del operador sin throttling artificial. No se certificó el ancho de banda
ni la caché física del proveedor. Cada caso inició una sesión nueva sin ensayo de
la operación; integridad de los 500 PDF comprobada antes, fuera del cronómetro.

| Caso | Milisegundos | Límite | Reset |
| --- | ---: | ---: | --- |
| Candidato | 887,72 | 3000 | 87048071-7ffd-46f9-9970-d8bf0df97d53 |
| Ofertas | 302,37 | 3000 | aac4f1ae-fee7-4035-a010-b75769d1b542 |
| Empresas | 382,49 | 3000 | a8252271-885a-4300-9e7d-47f128d07e41 |
| CV completo | 1543,25 | 10000 | 3fd00cf0-aa18-4ed6-b51f-31b48926c138 |
| Preview 1000 filas | 5960,01 | 30000 | cb43f563-11f9-4762-b9b6-71ef94db039b |
| Confirmación 1000 filas | 9925,08 | 60000 | 5c207d7d-5f0a-44fa-aed4-1fa5c4128c7e |
| Cuatro admins | 891,42 / 891,17 / 891,14 / 906,49 | 5000 cada uno | 28a63d01-5cf1-47ab-be3b-3c38a7ee1b1d |

[Evidencia JSON](evidence/2026-09-29-performance.json) conserva fecha, versión,
hash, condiciones y tiempos individuales, sin cookies. No se promediaron resultados.
Listas: 10 filas y página 2 estables, distintas de página 1. CV: 1426 bytes/hash.
Preview: 1000 válidas, 0 inválidas/duplicadas, 0 altas y 500 candidatos originales.
Confirmación: lote `f89fa3b8-6c37-4273-9f5e-1820b9ff9f90` completed, 1000 filas
imported y 1000 perfiles distintos; total 1500, todos los nuevos en draft sin cuenta,
consentimiento ni CV; dos auditorías del lote y 1000 de creación con actor correcto.

Concurrencia usa la variante explícita `funes-demo-v1-concurrency-v1`, preparada con
`tests/fixtures/prepare-demo-concurrency.sql` después del reset (EXTRA-007), sin
cambiar los conteos 500/50/100/1000. Oferta 80 pending_review/version 2; participación
775 under_review/version 2 sin derivación; contactos/resultados usan casos 765/755
referred/version 1. La barrera libera cuatro sesiones individuales en menos de 1 ms.
SQL posterior: oferta publicada/version 3, preselección/version 3, contacto/version 2,
contratación/version 2; cuatro auditorías con actor/request ID. La preselección omitió
preentrevista con motivo privado y evento `stage_skipped`; no se confundió con un
evento `participation_advanced`. El historial previo se conserva.

Incidencias previas al reloj, conservadas en logs ignorados: ejecución Windows usó
npm.ps1 bloqueado (corregido a npm.cmd); una verificación PDF recibió 504 en el CV
442 y la revisión completa posterior pasó; dos preparaciones concurrentes buscaron
un label exacto sin el sufijo «obligatorio», sin enviar acciones. No son mediciones
fallidas descartadas para elegir el mejor tiempo.

EXPLAIN de consultas PostgREST reales, con parámetros públicos del fixture y rol
authenticated/sesión admin vigente, después de las mediciones y dentro de ROLLBACK:
candidatos 297,268 ms, usa candidate_search y los índices de joins; ofertas 53,33 ms
y empresas 19,70 ms. Los listados pequeños eligen Seq Scan (80/50 filas), con índice
company_profiles_pkey en el join. No se forzó un índice ni se cambió esquema.
[Planes sanitizados](evidence/2026-09-29-query-plans.json) y SQL reproducible en
`tests/performance/queries/`; estos tiempos de diagnóstico no sustituyen los del navegador.

## Pendiente antes de aceptar

Demo separada y reset alojado transaccional con guard de entorno/project-ref,
confirmación/bloqueo/hash/conteos verificados (runbook). `demo-performance.mjs`
ejecutó los siete casos técnicos anteriores. Faltan SC-003 y SC-008 con el
administrador humano sin práctica, y revisar las condiciones/recibos de aceptación.
T089 permanece sin marcar: la automatización no acredita comprensión ni tiempos humanos.
No se evalúa carga por encima de cuatro administradores ni SLA productivo (OQ-006).
