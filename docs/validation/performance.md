# Rendimiento y aceptación — T089

Estado 2026-09-27: **no medido en demo**. No existe despliegue alojado confirmado.
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

## Pendiente antes de aceptar

Demo separada, reset alojado transaccional con guard de entorno/project-ref,
confirmación/bloqueo/hash/conteos; harness end-to-end para todos los casos SC-008A,
EXPLAIN real, mediciones frías y concurrencia con barrera. El reset local existente
no cumple el requisito alojado. Sin estas condiciones T089 permanece sin marcar.
No se evalúa carga por encima de cuatro administradores ni SLA productivo (OQ-006).
