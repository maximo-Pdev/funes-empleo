# Validaciones humanas pendientes — guía de ejecución

Fecha: 2026-09-28. Usar exclusivamente datos ficticios. Esta guía no acredita
pruebas realizadas ni aprobación municipal. Registrar también los intentos fallidos.

## Preparar la sesión

1. Abrir <https://funes-empleo-demo.vercel.app>. El preview conserva protección de
   Vercel: el propietario entra con su propia cuenta. Para evaluadores, compartir
   acceso desde el despliegue en Vercel; no compartir credenciales del propietario.
2. Comprobar el despliegue/commit indicado en `docs/operations/demo-runbook.md`.
   No medir mientras se cambie el despliegue o alguien altere sus datos.
3. Para exploración técnica, usar cuentas ficticias `candidate1@example.invalid`,
   `company1@example.invalid` y `admin1@example.invalid` a `admin4@example.invalid`.
   La contraseña ficticia está en `supabase/seed.sql`; nunca usarla en cuentas reales.
   Asignar un administrador distinto a cada evaluador, sin sesión compartida.
4. Los registros nuevos necesitan correos de prueba y verificación. El correo local
   se recibe en Mailpit. La demo alojada tiene URLs de Auth configuradas y remitente
   integrado limitado a miembros del equipo. Verificar entrega/recuperación con el
   buzón controlado del propietario; usar SMTP propio antes de medir con cohortes.
   Las cuentas precreadas **no** sustituyen el escenario de autorregistro.
5. Preparar `tests/fixtures/cv-fictitious.pdf`, datos ficticios únicos y una planilla
   de resultados con seudónimos (C01, E01, A01), nunca nombres/DNI/contactos reales.
6. Antes de medir aceptación, exigir el comprobante del reset alojado verificado:
   500 candidatos, 50 empresas, 100 ofertas, 1.000 participaciones, 500 PDF y hash
   del manifiesto. Un reset local o una demo con esos conteos sin integridad no basta.
   Hay un reset verificado en el runbook, pero cada medición necesita uno nuevo.
   Ejecutar T089 antes de registrar buzones externos al fixture: el reset aborta
   ante esas identidades para evitar borrar una cuenta del evaluador.

## T087: teclado, zoom y NVDA

1. Registrar versión de navegador y NVDA, fecha, despliegue y seudónimo evaluador.
2. Configurar 360×800; después repetir en 1366×768. En cada tamaño ejecutar al 100%
   y al 200% usando el zoom real del navegador. No sustituirlo por CSS zoom.
3. Desconectar el mouse durante cada recorrido. Usar Tab/Shift+Tab, Enter, Espacio,
   flechas y Escape. Seguir cada fila de `accessibility.md`, desde la entrada hasta
   la confirmación, incluyendo error corregible, vacío y carga.
4. Comprobar que el foco se vea, siga orden lógico y no quede atrapado; que todo
   control sea alcanzable; que campos y errores tengan nombre; que ningún texto o
   botón quede oculto al ampliar; y que el foco continúe en un lugar comprensible
   después de enviar. Anotar la pantalla y pasos exactos de cada defecto.
5. Activar NVDA y completar un recorrido por rol: candidato perfil→postulación;
   empresa borrador→envío; administración búsqueda→preselección→derivación→resultado.
   Verificar anuncios de títulos, campos, errores y confirmaciones sin depender de
   la vista o del color. No contabilizar una pasada de axe como prueba de NVDA.
6. Guardar una fila por flujo/combinación en el formato de `accessibility.md`.
   Corregir y repetir únicamente las combinaciones afectadas; conservar el fallo
   original y la repetición. Cerrar T087 cuando no queden combinaciones pendientes.

## T089: tiempos humanos y rendimiento de la demo

1. Elegir un único administrador sin práctica ni entrenamiento previo. No usar al
   desarrollador que conoce las pantallas. Darle solamente la descripción de tarea.
2. Con el fixture alojado recién restablecido, pedir: «Encontrá el candidato del
   caso, registrá su preentrevista y dejalo preseleccionado». Medir desde el inicio
   de la búsqueda hasta la preselección guardada. Exigir menos de 5 minutos.
3. Restablecer nuevamente el fixture en el mismo despliegue y conexión estable.
   Pedir: «Consultá los indicadores del período y categoría indicados y descargá
   el CSV correspondiente». Medir desde aplicar filtros hasta recibir el archivo
   completo y correcto. Exigir menos de 30 segundos.
4. No dar pistas, practicar antes, reiniciar el reloj ni elegir el mejor tiempo.
   Registrar fecha, URL/commit, hash y comprobante de cada reset, navegador,
   dispositivo, conexión, seudónimo, inicio/fin, segundos y resultado.
5. Los casos técnicos SC-008A se ejecutan aparte: lecturas/paginación ≤3 s,
   CV ≤10 s, preview CSV de 1.000 filas ≤30 s, confirmación ≤60 s y cuatro
   administradores simultáneos ≤5 s por operación. Usar todas las entradas y
   fronteras de `performance.md`, reset separado, una medición fría, sin promedio.
   El operador prepara la barrera común; luego verifica las cuatro mutaciones y
   auditorías. No sustituir estos resultados por la duración de un test local.

## T092: registro, recorridos y comprensión

1. Primero ejecutar los ocho escenarios completos de `specs/001-municipal-employment-portal/quickstart.md`.
   Registrar resultado y defecto por escenario; usar los datos y precondiciones
   ficticios indicados. Simular la comprobación presencial de DNI, sin pedir documentos reales.
2. Para SC-001, organizar 10 ejecuciones de candidato con al menos 5 personas distintas.
   Cada una abre el registro, verifica el correo, completa el perfil/CV/consentimiento
   y confirma una postulación. Cronometrar desde la primera apertura del registro.
3. Para SC-002, organizar otras 10 ejecuciones empresariales con al menos 5 personas.
   Cada una se registra, verifica correo, completa empresa, crea y envía una oferta.
4. En ambas series usar datos preparados, conexión estable y ninguna ayuda técnica.
   Si alguien reinicia, el reloj original sigue corriendo. Exigir por separado
   9 de 10 ejecuciones por debajo de 10 minutos. No descartar intentos fallidos.
5. Evaluar SC-010 en un registro separado: al menos 5 candidatos, 5 representantes
   empresariales y los 4 empleados municipales previstos o personal equivalente.
   Cada persona ejecuta solo tareas de su rol. Los cinco tipos son: perfil/postular,
   oferta/enviar, moderar, buscar/preseleccionar/derivar y confirmar resultado.
6. Contar éxito en el primer intento, sin ayuda externa ni reinicio. Corregir un
   campo siguiendo el mensaje de la propia interfaz sigue siendo el mismo intento.
   Exigir ≥80% de éxito en cada tipo y al menos 4 de los 5 tipos aprobados.
   Para una tarea con cuatro administradores, los cuatro deben completarla.
7. Completar las tablas de `quickstart-results.md` y vincular las incidencias.
   Los bots y cuentas ficticias prueban el sistema, pero no reemplazan a las personas.

## T069: planilla histórica y mapeo

1. Solicitar a la Oficina una copia anonimizada que conserve encabezados, formatos,
   variantes y casos difíciles, sin DNI, contactos o CV reales.
2. Comparar columna por columna con `docs/import/candidate-import-v1.md`.
3. Registrar transformaciones, campos faltantes y correspondencias del catálogo.
   No asumir que DEMO-A/DEMO-B son categorías municipales.
4. Obtener aprobación escrita del responsable de la Oficina, con fecha y versión.
   Hasta entonces, usar únicamente el mapeo sintético; no importar el archivo histórico.

## T096: revisión del segundo desarrollador

1. Abrir el PR de esta rama y leer problema, cambios, pruebas y limitaciones.
2. Revisar diff, migraciones y recuperación, RLS/Storage, uso del cliente secreto,
   dependencias, `.env.example`, fixtures y archivos que se pretenda adjuntar.
3. Confirmar que no haya datos reales, credenciales, cookies o trazas sensibles;
   que las excepciones consten en `cambios-extra.md`; y que cada tarea cerrada tenga evidencia.
4. Reproducir los flujos críticos y revisar los checks de CI del commit exacto.
   Documentar observaciones propias en `final-review.md` o en el PR, con resultado.
5. Pedir correcciones donde corresponda. Registrar la aprobación real; una revisión
   de Codex no sustituye la del compañero. Aprobar no equivale a fusionar el PR.

## Responsables que no puede sustituir la automatización

La Oficina debe aportar el mapeo histórico y decisiones de datos. Personas evaluadoras
deben aportar teclado/NVDA, comprensión y tiempos sin entrenamiento. El segundo
desarrollador debe revisar el PR. Las decisiones municipales de privacidad, retención,
catálogo, informes y operación productiva siguen en `docs/discovery/OPEN_QUESTIONS.md`.
