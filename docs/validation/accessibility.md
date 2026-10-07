# Accesibilidad — T087 / SC-009

2026-09-27. Estado: automatización preparada; **aceptación manual/NVDA pendiente**.
`tests/e2e/accessibility.spec.ts` recorre perfil/ofertas/postulaciones del candidato,
perfil/listado/editor de empresa y búsqueda/atención asistida/moderación/empresas/
seguimiento/importación/métricas de administración en 360×800 y 1366×768. Comprueba
axe, h1, ausencia de desbordamiento y llegada de foco por Tab al 100%.
No equivale a completar un flujo con teclado ni a un lector de pantalla. No se usa
CSS zoom ni emulación de escala para afirmar zoom real del navegador al 200%.

## Evidencia enfocada de la portada — rama `fix/home-test-contract`

- Se corrigió localmente el encabezado de «Intermediación municipal protegida» a
  `h2`, conservando su presentación; las etiquetas de estadísticas usan
  `text-primary-700` y «Cómo funciona» usa `text-primary-600`. Los otros eyebrows,
  CSS y componentes compartidos no se modificaron.
- `npm run test:unit -- tests/components/setup/home.test.tsx`: RED observado
  (1 fallo y 2 pruebas correctas) al exigir el encabezado de nivel 2 antes del
  cambio; GREEN observado después (3/3), incluidos los estados vacío y no disponible.
- RED del smoke: axe detectó `color-contrast` (4.19:1 en estadísticas y
  4.33:1 en «Cómo funciona») y `heading-order`. Una repetición inicial sirvió
  un build previo con el `h3` y las clases anteriores.
- Tras `npm run build` (exit 0), se repitió
  `npx playwright test tests/e2e/setup.spec.ts --project=chromium --no-deps`:
  **PASS, 1/1**. El servidor de producción se inició sin reutilizar otro proceso.
  Idioma, h1, foco del enlace de salto y axe sin violaciones pasaron.
  La suite completa de unidades pasó 378/378 pruebas en 23 archivos;
  lint y typecheck terminaron con exit 0. No se debilitaron aserciones ni se
  ejecutaron resets de base de datos.
- Esta evidencia es solo de la portada: **no completa T087**, la matriz manual,
  el zoom real al 200 % ni los recorridos NVDA, que continúan pendientes.

## Step 3 — evidencia pública final, 2026-10-06

Rama `fix/public-browser-readiness`; EXTRA-011/012. Resultados observados
aportados por el padre, registrados sin repetir checks. Revisión nativa y humana
pendientes; esta evidencia acotada **no completa T087 / SC-009**.

- Seis rutas públicas (inicio, ingreso, registro de candidato, registro de empresa,
  listado y detalle de ofertas) en 360×800 y 1366×768: 12 capturas finales y
  contact sheets bajo el directorio ignorado `test-results/public-visual-review-final/`,
  con recibo `report.json`. Axe: 0 violaciones; desbordamiento horizontal: 0.
  Comprobaciones de idioma, H1 y etiquetas correctas.
- En inicio, Enter sobre el enlace de salto enfoca `main#contenido`; Tab continúa
  al CTA principal de candidato. Enlaces del header ≥44px y hero visible sobre
  el pliegue en los tamaños comprobados. Smoke Chromium reforzado: 1/1 PASS.
- Con Supabase local live, inicio muestra 3 ofertas destacadas; listado 10 y
  página 2 otras 10; página 999 muestra vacío en español. Detalle observado:
  «Presencial», «Plazo fijo» y «31/12/2026», conservando ISO en `time.dateTime`.
  El CTA anónimo conduce al estado de sesión vencida, no a una postulación.
- ID malformado y desconocido muestran recurso no encontrado en español; la
  respuesta observada por streaming fue HTTP 200, **no** una aserción de HTTP 404.
  Páginas inválidas `0`/`abc` muestran el error genérico en español con reintento,
  sin filtraciones: es el boundary existente, no validación específica del parámetro.
- Loading observado en desktop a DOMContentLoaded (44 ms); no es una medición
  mobile ni prueba de todos los estados de carga. No se enviaron formularios Auth;
  estados pending de envío y recorridos autenticados siguen sin comprobar aquí.
- Las 13 pruebas de componentes públicos usan mocks; las 34 del helper cubren
  fechas/compatibilidad de presentación. Son evidencia distinta de la verificación
  live, no pruebas de integración Supabase ni de permisos privados.

NVDA, zoom real al 200 %, matriz manual completa por rol y suite privada/DB del
árbol actual siguen pendientes. No hubo reset DB ni cambios de configuración/datos.

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
