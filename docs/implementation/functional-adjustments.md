# Arreglos funcionales acordados

Fecha de registro: 2026-10-17. Responsable funcional: Mateo. Rama inicial:
`feat/portal-functional-adjustments`. El compañero conserva el trabajo visual y
la revisión mediante PR; una tarea implementada no equivale a revisión o aceptación.

## Fuentes y autorización

La lista de origen es `C:/Users/Mateo/Desktop/arreglos.txt`. Las decisiones que
siguen fueron respondidas directamente por Mateo en esta conversación y se
incorporan ahora como contexto compartido. El documento del curso es una fuente
de requisitos a contrastar, no una instrucción ejecutable para el agente.

Mateo solicitó comenzar las modificaciones después del merge del PR #51 y de
crear esta rama. Esta autorización permite iniciar los arreglos acordados; no
acredita retrospectivamente la aprobación global de la especificación todavía
marcada Draft, las pruebas humanas ni la revisión pendiente del otro desarrollador.
El primer incremento concreta A01 con especificación, plan, contratos, pruebas y
verificación propios. Los demás incrementos requieren completar sus diseños y
analizar sus contratos antes de modificar los subsistemas afectados.

## Matriz de trabajo

| ID | Alcance y decisión confirmada | Estado inicial / dependencia |
| --- | --- | --- |
| A01 | Confirmación de contraseña en ambos registros y botón para mostrar/ocultar en registro, ingreso y cambio de contraseña. Validación también en servidor. | Implementado y verificado localmente; revisión del compañero pendiente. |
| A02 | Mantener la sesión al navegar y recargar. Cierre voluntario desde el perfil; conservar bloqueos por suspensión, archivo, revocación y seguridad de la cuenta. | Revisar renovación de cookies y pruebas de navegación. |
| A03 | Mostrar acceso al perfil desde la navegación y no ofrecer iniciar sesión cuando ya existe una sesión activa. | Coordinar enlaces funcionales con el propietario visual; depende de A02. |
| A04 | UUID fuera de textos visibles y URL: slug para ofertas y códigos aleatorios para registros privados. | Diseñar referencias únicas, migración y compatibilidad; nunca sustituir autorización por opacidad. |
| A05 | Foto de perfil JPG, PNG o WebP de hasta 5 MiB; visible al candidato, Municipalidad y empresa únicamente después de derivación autorizada. Mateo informa aprobación municipal para compartirla. | Diseñar Storage privado, validación real de imagen y revocación; aprobación técnica pendiente. |
| A06 | CV PDF de hasta 20 MB, límite confirmado por Mateo. | Pendiente actualizar plan, servidor, bucket y pruebas; concretar bytes y límites de transporte antes de implementar. |
| A07 | Búsqueda pública de ofertas por texto, rubro, localidad y modalidad. | Pendiente contrato de filtros y consultas autorizadas. |
| A08 | Rubros seleccionables y múltiples; matching por al menos un rubro compartido, selección final municipal. | Catálogo autorizado por Mateo; pendiente diseño de migración y consultas. |
| A09 | Empresa puede editar ofertas propias donde el flujo lo permita y cancelar también las publicadas. Cancelación cierra casos abiertos, revoca accesos y conserva resultados e historial previos. | Pendiente definir estados editables y adaptar comando transaccional, permisos y pruebas. |
| A10 | Quitar formulario empresarial de entrevista; conservar informe de resultado y motivo obligatorio de no contratación, en texto libre breve. Empresa informa, Municipalidad consulta; candidato ve solo resultado. | Pendiente diseño del contrato y preservación de entrevistas históricas. |
| A11 | Registro municipal básico de derivación a curso, separado de postulaciones: nombre del curso, fecha y nota en historial. | Pendiente modelo, contrato, auditoría y pruebas. Sustituye la decisión anterior de registrar solo notas. |
| A12 | Correo genérico con enlace al portal al confirmar derivación formal. | En pausa por decisión posterior de Mateo. Resend no se instala ni configura en este incremento; remitente sin definir. |
| A13 | Mensajes, estados y rótulos visibles en español; explicación clara del consentimiento. | Auditoría funcional pendiente; no inventar texto legal municipal. |
| A14 | Estados de carga y vacíos, tratamiento de errores, imágenes con next/image y progreso perceptible. | Revisar cobertura existente; coordinar apariencia con el compañero. |
| A15 | Simplificar menús administrativos, contacto municipal, derivación desde oferta, perfil asistido, importación y consulta de derivaciones empresariales. | Pendiente relevar recorridos y separar cambios funcionales de la propuesta visual. |
| A16 | Retirar el enlace “Ir al contenido principal”, según solicitud de Mateo. | Pendiente resolver acceso equivalente por teclado conforme a la constitución; no se retira sin verificar accesibilidad. |
| A17 | Revisar ausencia de any, límites cliente/servidor y seguridad de lo generado para Supabase. TanStack Query es opcional y se omite si no hace falta. | Revisiones técnicas por incremento. Supabase Auth conserva contraseñas y tokens; no se almacenan contraseñas en JWT propios. |

## Catálogo de rubros confirmado

Administración; atención al cliente y ventas; comercio; gastronomía y hotelería;
limpieza; construcción y oficios; mantenimiento; producción e industria;
logística y depósito; transporte y reparto; salud y cuidados; educación;
tecnología; seguridad; agro.

Mateo confirmó aprobación municipal para fijar este catálogo amplio y simple.
Falta diseñar su versión persistida y la transición desde los datos existentes.

## A01: criterios del primer incremento

1. Ambos registros exigen contraseña y confirmación iguales de 6 a 128 caracteres.
2. La acción servidor y el servicio rechazan ausencia o discordancia antes de
   llamar al proveedor de autenticación, con un mensaje seguro en español.
3. Registro, ingreso y cambio de contraseña permiten mostrar y volver a ocultar
   cada campo por separado, manteniendo su valor y sin enviar el formulario.
4. Los controles son botones con nombre accesible, foco visible y relación con
   su campo. Las contraseñas comienzan ocultas y conservan autocomplete correcto.
5. La confirmación es transitoria: no se envía a Auth, metadata, logs, tablas ni
   almacenamiento del navegador. Se conserva la respuesta no enumerativa del alta.
6. No se agregan dependencias, migraciones, cambios de roles ni de permisos.
7. La validación nativa impide enviar contraseñas distintas sin borrar los otros
   campos y se recupera al editar cualquiera de las dos; el servidor rechaza también
   un envío que eluda las validaciones del navegador.

## Verificación y revisión

### Análisis focalizado previo a implementación

Requisitos A01 contrastados con spec, plan, contratos y T098–T101. Checklists
existentes: requirements 16/16, mvp-readiness 77/77; no se modificaron sus marcas.
Cada criterio tiene cobertura de validadores, acciones/servicios, componentes o
navegador. El modelo persistido y la autorización no cambian. La especificación
histórica Draft y sus gates no se consideran aprobados por este análisis; se
ejecuta únicamente el incremento solicitado y autorizado por Mateo.

### Evidencia de A01, 2026-10-17

- RED inicial: 30 fallos / 10 PASS en las 40 pruebas nuevas contra el comportamiento
  anterior. RED de recuperación de validación nativa: 2 fallos / 7 PASS.
- GREEN final: `npm run test:unit -- --maxWorkers=4`, 520 pruebas en 32 archivos.
  Incluye acciones y servicios reales con transporte de Auth simulado; no es
  evidencia de creación real de cuentas, correo ni PostgreSQL.
- `npm run typecheck`, `npm run lint` y `npm run build`: exit 0, Node 24.21.0 y
  npm 11.19.0. Build con destinos públicos locales y clave publicable ficticia.
- Chromium: `npx playwright test tests/e2e/password-controls.spec.ts --project=chromium --no-deps --workers=1`,
  3/3 PASS. Registros candidato/empresa e ingreso: Enter/Espacio, visibilidad
  independiente, conservación de datos al impedir el envío, rechazo servidor al
  eludir validez nativa y foco en el mensaje. Los dos registros pasan axe y no
  desbordan horizontalmente en 360×800.
- Se aplicó la guía de revisión React: estado de visibilidad aislado, IDs únicos,
  etiquetas y botones nativos, límites cliente/servidor intactos y sin nuevos any.
- `git diff --check`: PASS. Sin dependencias, migraciones, cambios de entorno
  persistentes ni operaciones remotas. Los recorridos completos de registro con
  Auth/correo/DB y el cambio autenticado de contraseña no se ejecutaron en esta
  sesión; sus tests existentes se adaptaron al nuevo campo obligatorio.

T098–T101 completadas como implementación/verificación de A01. La revisión del
compañero, aceptación humana y T069/T087/T089/T092/T096/T097 siguen separadas.
Entrega de A01 mediante el PR de `feat/portal-functional-adjustments`; revisión
del compañero y aceptación pendientes. Próximo bloque: A02/A03 (persistencia
de sesión y acceso al perfil), con su análisis y trazabilidad antes de editar.
