# Registro de sesión manual guiada

Estado: **Pausado por decisión del usuario hasta definir el nuevo estilo; validación preliminar favorable conservada**. El usuario confirmó el primer recorrido al 100 % y respondió favorablemente al recorrido solicitado al 200 %. Navegador y resolución siguen pendientes; el porcentaje del segundo recorrido no fue reconfirmado explícitamente. No acredita aceptación completa. Al retomar, confirmar el entorno y repetir las comprobaciones afectadas por el nuevo diseño.
Preparación técnica y arranque: [session-readiness.md](session-readiness.md).
Referencia de preparación: 2026-10-06; rama `docs/status-handoff`, HEAD
`5d6a51ea0ea2fc253fd3e2e86bf8a4e4d6395f44`. No es fecha de ejecución humana.

## Registro a completar

Formato exacto de [accesibilidad](accessibility.md#registro-a-completar).
Las filas pendientes son reservas de casos, no ejecuciones. La fecha registrada en el primer caso corresponde a la recepción del informe, no a una medición cronometrada. Confirmar commit/despliegue realmente usado; no atribuirle automáticamente la referencia de preparación. Resolución, zoom y navegador también requieren confirmación humana.

| fecha | commit/despliegue | evaluador seudónimo | rol/flujo | navegador/NVDA | resolución | zoom real | teclado/foco/controles/mensajes | resultado | incidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-06 | Entorno local de la sesión; identidad exacta pendiente de reconfirmar | E01 | Visitante / inicio, teclado | Pendiente | Pendiente | 100 %, confirmado por el usuario | Informe del usuario: «Se ve y enfoca todo bien»; confirma «Sí» al primer recorrido al 100 %. No detalló controles individuales. | Observación favorable; registro incompleto | Ninguna informada; metadatos pendientes |
| 2026-10-06 | Entorno local de la sesión; identidad exacta pendiente de reconfirmar | E01 | Visitante / inicio, teclado; repetición solicitada al 200 % | Pendiente | Pendiente | Solicitado 200 %; porcentaje real pendiente de confirmación explícita | Informe del usuario: «Se ven bien» y «Se ve perfecto» tras la guía al 200 %. Sin detalle individual sobre foco, recortes o desplazamiento horizontal. | Observación favorable; registro incompleto | Ninguna informada; metadatos pendientes |
| Pendiente | Pendiente | Pendiente | Visitante / ingreso, navegación sin enviar | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Pendiente | Pendiente | Pendiente | Visitante / registro de candidato, navegación sin enviar | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Pendiente | Pendiente | Pendiente | Visitante / registro de empresa, navegación sin enviar | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

Registrar solo lo que la persona informe explícitamente. Si hay un fallo, conservar
la fila y su reproducción; agregar una fila para la repetición, sin sobrescribir el
intento original. Usar seudónimo, no nombres ni datos reales; excluir contraseñas,
cookies, tokens, enlaces de verificación y contenido de archivos de cualquier recibo.
GETs, encabezados y build son evidencia técnica separada, nunca un PASS manual.

## Primer caso guiado: inicio anónimo

Este es el primer intercambio de la sesión, no una lista para completar todos los
flujos de una vez. Con el servidor propio iniciado según la preparación:

1. Abrir <http://127.0.0.1:3000> sin iniciar sesión, en Chrome o Edge normal.
   Restablecer el zoom real a **100 % con Ctrl+0**. No usar emulación de viewport
   o escala como prueba de zoom real. Apartar el mouse durante el recorrido.
2. Desde la página recién abierta, pulsar **Tab** para revelar el enlace de salto,
   **Enter** para ir al contenido principal y luego **Tab**. El destino esperado
   es `main#contenido` y el siguiente control esperado es el CTA principal de
   registro de candidato. Son expectativas a comprobar, no observaciones humanas.
   Anotar qué recibió realmente el foco, si se vio y si hubo bloqueo; no activar
   el registro ni enviar formularios.
3. Detenerse y pedir este informe breve antes de avanzar:
   - ¿Qué navegador y versión usaste, con qué resolución y qué zoom mostró el navegador?
   - ¿Apareció el enlace de salto con Tab y dónde quedó el foco después de Enter?
   - ¿Qué control quedó enfocado con el siguiente Tab, se veía el foco y hubo contenido oculto o bloqueo?

El coordinador asignará un seudónimo y registrará las respuestas reales. Solo después
se propondrá repetir el mismo caso usando **el menú de zoom del navegador al 200 %**,
confirmando el porcentaje visible. No sustituirlo por CSS zoom, viewport emulado ni
Playwright. Las filas de ingreso/registros siguen pendientes para intercambios
posteriores; esta sesión no pide login, recuperación ni envío de formularios.

## Alcance y continuidad

Este recorrido anónimo guiado no mide tiempos ni éxito sin ayuda, no representa una
cohorte y no aporta evidencia administrativa o NVDA. Ofertas/detalle y backend
siguen sujetos a [disponibilidad live](session-readiness.md); los recorridos por
roles, mensajes de validación/envío y combinaciones restantes quedan pendientes.
No cierra T087, T089, T092 ni aceptación del MVP, aprobación municipal o revisión
por el segundo desarrollador.

Continuar con los criterios originales, sin duplicarlos aquí:
[guía humana](human-validation-guide.md),
[matriz obligatoria y NVDA](accessibility.md#matriz-manual-obligatoria),
[quickstart](../../specs/001-municipal-employment-portal/quickstart.md),
[resultados de quickstart](quickstart-results.md), [rendimiento](performance.md),
[revisión final](final-review.md) y [gates de entrega](release-gates.md).
La verificación documental independiente se realiza después de esta preparación;
no está acreditada por este registro vacío.
