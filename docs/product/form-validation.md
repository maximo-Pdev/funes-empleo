# Formularios: requisitos, errores y conservación

Solicitud de Mateo del 2026-10-20, EXTRA-028 y T121–T125. Aplica al registro,
acceso/recuperación, perfiles, empresa/ofertas, administración, participaciones,
derivaciones, importación y filtros. No cambia los requisitos municipales ni
convierte un borrador incompleto en un formulario obligatorio para guardar.

## Comportamiento

- `*` rojo junto a cada campo obligatorio; los requisitos alternativos tienen
  una instrucción con asterisco (por ejemplo, correo **o** teléfono).
- Al enviar, borde rojo y explicación junto a cada campo incorrecto, resumen
  anunciado y foco al primer error. No se depende solamente del color.
- Al corregir, se recalculan los errores. Se comprueban los controles habilitados,
  formato, longitud, rango, confirmaciones, grupos y orden de fechas declarado.
- Un error de cliente, servidor, red o versión no limpia el formulario ni provoca
  una recarga automática. Se conservan texto, selecciones, checks y archivos.
- Se permite limpiar después de un éxito explícito. Registro, recuperación y
  reenvío conservan los datos incluso ante su respuesta pública genérica:
  esa respuesta no garantiza alta/envío y evita revelar cuentas existentes.
- Los datos solo permanecen en los controles de la página abierta. No se guardan
  contraseñas, archivos ni perfiles en localStorage, sessionStorage, logs o nuevas
  URLs para conservarlos. Recargar/cerrar/navegar manualmente puede descartarlos.

## Mantenimiento

Usar `Form` en lugar de `form` y `Field` alrededor de cada input/select/textarea
visible. `TextField`, `SelectField` y `PasswordField` ya integran `Field`.
Conservar atributos `required`, `minLength`, `maxLength`, `min`, `max`, `pattern`,
`title` y `accept` según el contrato existente. Los IDs, etiquetas y ayudas se
asocian con `aria-labelledby`, `aria-describedby` y `aria-invalid`.

Pasar `result` de `useActionState` directamente a `Form`; no envolver el dispatcher
en una promesa ni asumir que resolver significa éxito. `preserveOnSuccess` se usa
para las respuestas no enumerables de Auth. `requirements` declara alternativas
por `name` o una regla `date-order`. Los archivos usan `data-max-bytes` y un mensaje
de límite; los patrones compartidos de DNI/CUIT/teléfono reflejan el servidor.

Los mensajes de servidor que no identifican un campo siguen siendo generales y
seguros; no atribuir errores de permisos, duplicados o servicio a un input al
azar ni exponer errores internos. La validación cliente es ayuda, no autorización.
Servidor, Zod, RLS y validación real de archivos siguen siendo obligatorios.

El inventario automatizado revisa todo `src`: 40 usos estáticos de `Form` en
29 archivos, sin formularios/labels nativos aislados ni controles visibles fuera
de `Field`. Incluye formularios generados por listas y estados condicionales.

## CV y CSV

`CvUploadForm` envía multipart a `POST /api/candidate/cv` con
`Accept: application/json`. Recibe solo `{ status }`: `ok`/200, `invalid`/422,
`conflict`/409 o `denied`/403, siempre `private, no-store`. El archivo se conserva
ante un fallo; un éxito limpia y actualiza el perfil. El aviso de éxito definitivo
espera la nueva versión del perfil, para no invitar a activar con una versión
anterior; mientras tanto se indica actualización y se bloquea otra carga.
Un fallo de red puede haber
ocurrido después de guardar: revisar el CV vigente antes de reintentar.

Sin opt-in, el endpoint mantiene su respuesta 303 anterior. Se conservan sesión,
rol/propiedad, archivo no archivado, versión, PDF real, reserva/subida/commit y
límite vigente de **5 MiB**. A06 (20 MB) sigue pendiente; este cambio no lo aplica.
El CSV también conserva archivo y confirmación ante fallo, con error junto al
archivo. Rechazar una fila no exige completar datos de corrección; usar un perfil
existente exige seleccionarlo. No se habilita importación histórica sin T069.

## Entrega y recuperación

No hay migración, dependencia, variable de entorno ni cambio alojado para este
ajuste. Desplegar UI y handler CV juntos; revertir el incremento completo restaura
el flujo previo sin tocar datos, permisos ni historial. Pruebas locales y límites
quedan registrados en EXTRA-028 y el estado de implementación. Esto no acredita
CI, revisión independiente, NVDA ni aceptación municipal.
