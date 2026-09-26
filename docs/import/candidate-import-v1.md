# Importación candidata: contrato de demostración v1

## Decisión y límites

El 2026-09-25 Mateo aprobó en este chat la opción A: desarrollar y probar US5 con
un formato provisional y datos ficticios, sin esperar el Excel municipal. Esta
autorización es del proyecto, no de la Oficina de Empleo. OQ-018 y T069 siguen
pendientes para el padrón histórico; OQ-010 sigue pendiente para categorías reales.

Versión permitida: `demo-candidates-v1`. No es una inferencia del archivo municipal.
Solo se habilita en local, preview y demo ficticia. No se acepta ninguna versión
histórica hasta incorporar muestra anonimizada y mapeo aprobado con responsable,
fecha y referencia de aprobación. Nunca cargar personas reales para probarlo.

## Encabezados exactos y orden

`nombre,dni,email,telefono,localidad,categorias,experiencia,disponibilidad,referencia`

Todos los encabezados son obligatorios, aunque algunos valores puedan estar vacíos.
UTF-8 con BOM opcional, coma, comillas dobles, CRLF/LF. Sin cast de números/fechas.
Máximo 5 MiB, 10.000 filas y 64 KiB por registro. CSV vacío y encabezado sin datos
se rechazan. No se guardan archivo bruto ni nombre del archivo.

| Columna | Destino y transformación |
| --- | --- |
| nombre | `display_name`: NFC, trim, 2–200 caracteres. |
| dni | `dni_normalized`: solo dígitos y separadores punto/espacio; 7–8 dígitos normalizados. Se conserva como texto. |
| email | Contacto email: trim y minúsculas, formato válido, máximo 320; opcional si hay teléfono. |
| telefono | Contacto teléfono: trim, caracteres de teléfono, 6–50; opcional si hay email. |
| localidad | `locality`: NFC, trim, máximo 150; vacío permitido para borrador. |
| categorias | Códigos separados por `\|`, sin repetidos, máximo 20; solo `DEMO-A` y `DEMO-B` activos, versión numérica 1 del seed ficticio; no catálogo oficial. Vacío permitido para borrador. |
| experiencia | Resumen laboral: NFC, trim, máximo 5.000; vacío permitido. |
| disponibilidad | `available` o `unavailable`, exactos; sin inferencia ni valor predeterminado. |
| referencia | Código ficticio no personal `[A-Za-z0-9_-]`, 1–100 caracteres, para trazabilidad de origen; nunca ruta o nombre de persona. |

Todos los perfiles nuevos quedan `origin=imported`, `status=draft`, sin cuenta,
consentimiento, CV ni derivaciones. No se simula activación por importar.

## Resoluciones y recuperación

La previsualización solo escribe staging e historial del lote. Enmascara DNI y
contactos, muestra errores, coincidencias y cambios previstos. La confirmación
revalida datos, categorías, duplicados, hash, versión de mapeo y versión del lote.
Coincidencias por DNI/email dentro del CSV o con la base bloquean la confirmación.

Administración puede resolver con motivo: usar/actualizar un perfil existente
(solo campos marcados expresamente), corregir un falso positivo y crear separado
(revalidación obligatoria), o rechazar la fila. El rechazo no crea un estado nuevo:
se conserva como decisión explícita y se excluye de las filas aceptadas. Una fila
inválida o categoría desconocida se corrige y revalida antes de confirmar.
Si no queda ninguna fila aceptable, la confirmación permanece bloqueada.

Un error durante la materialización revierte todo el negocio y conserva el lote
`failed` con código seguro. Requiere nueva carga y preview en lote nuevo vinculado,
nunca reanudar el fallido. Un hash ya completado se rechaza para evitar duplicación.

## Aceptación

T070–T078 pueden verificarse contra esta versión por la excepción aprobada. Eso
no completa T069 ni implica aceptación municipal de US5. Pruebas: parser estricto,
RLS, resoluciones, concurrencia/doble confirmación, rollback y recorrido de interfaz.

## Funciones SQL para integración

Todas derivan actor de Auth/cuenta activa y exigen administrador, sin service-role.
Las funciones privadas no tienen permiso de ejecución para roles de aplicación.

| Función pública | Argumentos | Resultado |
| --- | --- | --- |
| `preview_candidate_import` | `p_hash text`, `p_mapping text`, `p_rows jsonb`, `p_retry uuid?` | UUID de lote; solo escribe staging. |
| `import_batch_preview` | `p_batch uuid` | JSON de conteos, estado, versión/hash, filas enmascaradas y coincidencias autorizadas. |
| `resolve_import_row` | `p_batch uuid`, `p_version integer`, `p_row uuid`, `p_decision text`, `p_reason text`, `p_data jsonb?`, `p_candidate uuid?`, `p_candidate_version integer?`, `p_fields text[]` | Sin cuerpo; guarda decisión e historial y recalcula bloqueos. |
| `confirm_candidate_import` | `p_batch uuid`, `p_version integer`, `p_hash text`, `p_mapping text` | `completed`, `failed` o `blocked`; nunca alta parcial. |

Errores comunes: `AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`,
`INVALID_TRANSITION`, `CONFLICT_STALE_DATA`. El fallo de materialización conserva
un código sanitizado; jamás devuelve el mensaje original de PostgreSQL.
`p_data` solo se acepta para corregir y crear, e incluye nuevamente los nueve
campos canónicos. Para usar existente se confirma qué campos del CSV aplicar;
lista vacía conserva el perfil sin tocarlo. El servidor compara versión del perfil
y del lote. Los motivos quedan en historial privado; la auditoría lleva referencias
opacas, actor, fecha, estados y conteo, nunca filas o contactos.

## Recuperación técnica

Migraciones 050–053 forward-only. 052 corrige una ambigüedad de variable detectada
en pgTAP y conserva campos no seleccionados; 053 amplía la proyección laboral
sin exponer identificadores/contactos y agrega índices de duplicados internos.
No se deshacen eliminando candidatos o historial. Preparar una migración correctiva
si falla un despliegue. Solo el entorno local ficticio puede reconstruirse desde
migraciones/seed. No se agregan variables ni paquetes; `APP_ENV` sigue limitado a
local/preview/demo y el origen de solicitudes HTTP se valida contra
`NEXT_PUBLIC_APP_URL`, no contra un Host suministrado por cliente.
