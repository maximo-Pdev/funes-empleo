# Contrato de importación CSV

## Estado del contrato

La gramática y el flujo quedan definidos, pero el listado final de columnas y mapeos permanece
**bloqueado por OQ-018**. No se implementará inferencia automática ni un mapeo supuesto. La Oficina
de Empleo debe entregar una muestra anonimizada y aprobar una versión escrita antes de considerar el
importador terminado.

## Sobre del archivo

- Codificación UTF-8; BOM permitido.
- Separador coma; comillas dobles según CSV estándar; fin de línea CRLF o LF.
- Primera fila obligatoria con encabezados exactos del `mapping_version` aprobado.
- No se aceptan encabezados desconocidos, faltantes o duplicados.
- Conteo de columnas estricto; no se relaja por fila.
- Sin cast automático de números, fechas o booleanos.
- Límite técnico inicial: 5 MiB, 10.000 filas y 64 KiB por registro. Estos límites protegen la demo y
  pueden reducirse al conocer la muestra; ampliarlos requiere revisión técnica.
- El archivo bruto es temporal y se elimina al terminar el procesamiento; no se guarda en Git, logs
  ni auditoría.

## Campos canónicos esperados

El mapeo aprobado deberá resolver, como mínimo, estos conceptos sin exigir esos nombres de columna:

| Concepto | Regla canónica |
| --- | --- |
| Nombre completo | Requerido, texto normalizado. |
| DNI | Requerido, solo dígitos tras normalizar; se usa para duplicados. |
| Contacto | Al menos email o teléfono válido. |
| Localidad | Puede quedar pendiente de completitud según decisión de mapeo. |
| Categorías/intereses | Cada valor debe mapear a categoría canónica aprobada. |
| Habilidades/experiencia | Texto laboral limitado. |
| Disponibilidad | Valor controlado o advertencia pendiente de revisión. |
| Referencia de origen | Código no sensible para trazabilidad; no ruta local. |

No se incluyen CV binarios, cuentas, contraseñas, consentimientos inventados ni derivaciones. Un
perfil importado no se considera consentido ni listo para derivación por el mero hecho de importar.

## Fase 1: previsualización

Entrada:

- CSV;
- `mapping_version` aprobado;
- sesión de administrador.

Proceso:

1. Validar tamaño, codificación, estructura y encabezados.
2. Calcular hash y rechazar reintento accidental ya completado salvo acción explícita.
3. Normalizar cada campo según el contrato, sin cast tolerante.
4. Comparar DNI y email con base y dentro del archivo.
5. Resolver categorías solo contra catálogo activo aprobado.
6. Clasificar cada fila sin escribir perfiles.

Estados por fila:

- `valid`: puede importarse.
- `warning`: requiere aceptación administrativa según regla aprobada, sin ocultar el efecto.
- `invalid`: dato obligatorio o formato inválido.
- `potential_duplicate`: coincidencia por DNI/email; no se fusiona automáticamente.
- `unmapped_category`: se trata como bloqueo hasta resolver el mapeo.

Salida visible:

- conteos totales por estado;
- número de fila;
- códigos/mensajes de error en español;
- valores enmascarados cuando sean sensibles;
- impacto previsto: nuevos perfiles y observaciones;
- botón de confirmar deshabilitado mientras haya bloqueos.

## Fase 2: confirmación

Entrada: `batch_id`, `file_sha256`, `mapping_version`, `version` esperada y decisiones administrativas
permitidas sobre advertencias.

Precondiciones:

- mismo archivo y mapeo que la previsualización;
- admin activo;
- cero filas inválidas, duplicadas sin resolver o categorías sin mapear;
- lote no confirmado previamente.

Efecto:

- vuelve a validar en servidor;
- una función PostgreSQL crea todos los perfiles asistidos/importados, contactos, categorías,
  observaciones e historial dentro de una transacción;
- si una fila falla, revierte todo y marca el lote `failed` con código sanitizado;
- si termina, marca filas `imported`, conteos finales y lote `completed`.

## Seguridad y auditoría

- Solo administrador puede cargar, previsualizar, confirmar o consultar lotes.
- Nunca se registran filas, DNI, contactos o contenido completo en logs.
- Auditoría conserva responsable, fecha, hash, mapping version, conteos, resultado y request ID.
- Las exportaciones anteponen apóstrofo a celdas de texto que comiencen con `=`, `+`, `-`, `@`,
  tabulador o retorno de carro, evitando evaluación como fórmula.
- Tests deben cubrir encabezado desconocido, columnas irregulares, fila demasiado grande, duplicados,
  categorías sin mapear, carrera de doble confirmación y rollback total.
