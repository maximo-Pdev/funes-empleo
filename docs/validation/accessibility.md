# Accesibilidad — T087 / SC-009

2026-09-27. Estado: automatización preparada; **aceptación manual/NVDA pendiente**.
`tests/e2e/accessibility.spec.ts` recorre perfil/ofertas/postulaciones del candidato,
perfil/listado/editor de empresa y búsqueda/atención asistida/moderación/empresas/
seguimiento/importación/métricas de administración en 360×800 y 1366×768. Comprueba
axe, h1, ausencia de desbordamiento y llegada de foco por Tab al 100%.
No equivale a completar un flujo con teclado ni a un lector de pantalla. No se usa
CSS zoom ni emulación de escala para afirmar zoom real del navegador al 200%.

## Matriz manual obligatoria

Para **cada fila**, repetir las cuatro combinaciones 360×800/1366×768 × 100%/200%
mediante zoom real del navegador. Usar datos ficticios y solo teclado: Tab/Shift+Tab,
Enter/Espacio, flechas y Escape cuando corresponda. No pulsar con mouse para rescatar
un control. Registrar fallo, punto exacto y reproducción antes de corregir.

| Flujo | Controles/estados a verificar | Estado |
| --- | --- | --- |
| Acceso, recuperación y verificación | Labels, enlace vencido, renovación, error no enumerador | Pendiente |
| Candidato perfil/CV/consentimiento | Multiselección, archivo rechazado, corrección, carga y confirmación | Pendiente |
| Postulación/retiro/archivo | Dos ofertas, final visible, confirmación destructiva recuperable | Pendiente |
| Empresa perfil/oferta | Borrador, enviar, corrección/reenvío, pausa, cierre y vacío | Pendiente |
| Derivación/feedback empresarial | Contactos/CV autorizados, revocación, feedback tardío sin PII | Pendiente |
| Moderación municipal | Motivos internos/mensaje público, suspensión destacada, restauración | Pendiente |
| Búsqueda y evaluación | Filtros/paginación/vacío, preentrevista, salto, preselección y derivación | Pendiente |
| Resultado y seguimiento | Contacto, nota, resultado y corrección tardía conservando historia | Pendiente |
| Atención asistida | Duplicados y sus tres decisiones, sin PDF, vinculación presencial | Pendiente |
| Importación | Carga, errores por fila, decisiones, bloqueo, confirmación y recuperación | Pendiente |
| Métricas | Filtros, cero/pendiente, descarga, error de cobertura temporal | Pendiente |

En cada combinación comprobar: foco visible y orden lógico; sin trampas; etiquetas y
mensajes asociados programáticamente; contraste; landmarks; validación, error,
loading, vacío y éxito en español; contenido/controles íntegros a 200%; foco tras error
y actualización. Una pasada de axe sin hallazgos no permite omitir esta lista.

## NVDA

En Windows con versión registrada de NVDA/navegador, ejecutar al menos un recorrido
completo por rol: candidato perfil→postulación; empresa borrador→envío; administrador
búsqueda→preselección→derivación→resultado. Comprobar anuncios de estructura, nombres,
estado, errores y confirmación sin depender del color ni vista. No hay resultados
NVDA aportados, y esta sesión no los simula.

## Registro a completar

`fecha | commit/despliegue | evaluador seudónimo | rol/flujo | navegador/NVDA |
resolución | zoom real | teclado/foco/controles/mensajes | resultado | incidencia`.
Conservar capturas solo ficticias y sin tokens; un fallo deja abierta la combinación.
Resultados automatizados exactos se consolidan en `quality-gates.md`.
