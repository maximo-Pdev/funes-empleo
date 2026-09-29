# Validaciones humanas pendientes — guía de ejecución

Fecha: 2026-09-29. Usar exclusivamente datos ficticios. Esta guía no acredita
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
2. El coordinador restablece/verifica el fixture y prepara la variante documentada
   con `tests/fixtures/prepare-demo-concurrency.sql`, fuera del reloj. El caso 775
   queda en revisión para Persona ficticia 275 y Oferta ficticia 078; no ejecutar
   sus acciones antes de la prueba. Dar solo esta consigna al participante:
   «Buscá Persona ficticia 275, categoría ficticia B, disponible; registrá una
   preentrevista y dejala preseleccionada para Oferta ficticia 078». Medir desde el inicio
   de la búsqueda hasta la preselección guardada. Exigir menos de 5 minutos.
3. Restablecer nuevamente el fixture en el mismo despliegue y conexión estable.
   No preparar la variante concurrente para este caso. Dar solo la consigna:
   «Consultá los indicadores del 01/09/2026 al 20/09/2026, categoría ficticia A,
   y descargá el CSV correspondiente». El coordinador comprueba 200 candidatos
   activos, 50 empresas, 500 postulaciones y 25 contrataciones, filtros iguales en
   el CSV y ausencia de datos personales; son los inputs ya probados en admin-metrics.
   Medir desde aplicar filtros hasta recibir el archivo
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
6. Los siete casos técnicos ya fueron medidos (performance.md). Para una nueva
   versión, repetir la serie con nuevos recibos; conservar la evidencia anterior.
   Esta guía es del coordinador: no dar instrucciones de navegación ni práctica
   previa al participante que debe completar SC-003/SC-008 sin ayuda.

## Correo alojado: verificación y recuperación controladas

1. Realizar esta prueba después de las mediciones que necesitan reset. Una cuenta
   con un buzón ajeno al fixture hace que el reset aborte; no borrar esa cuenta
   silenciosamente para recuperar la posibilidad de reset.
2. El propietario abre la demo con su acceso de Vercel y entra a
   `/registro/candidato`. Usa nombre/DNI ficticios únicos y el buzón controlado que
   aportó por canal privado, permitido por el remitente integrado como miembro del
   equipo de Supabase. No registrar contactos reales de postulantes.
3. El propietario introduce una contraseña exclusiva de prueba y envía el registro
   personalmente. No compartirla con Codex ni usar la contraseña pública del seed.
4. Revisar bandeja y spam. Abrir el enlace de verificación en el mismo navegador
   que inició el registro, conservando PKCE. Confirmar acceso al panel; registrar
   únicamente entrega/resultado/fecha, sin dirección real ni enlace/token.
5. Cerrar sesión, abrir `/recover`, introducir ese mismo correo y solicitar el
   enlace. Abrirlo en el navegador de origen y completar personalmente la nueva
   contraseña. Comprobar login con la nueva y rechazo de la anterior.
6. Probar enlace utilizado/vencido y solicitar uno nuevo: debe explicar el problema
   sin mostrar claves ni detalles internos. Conservar el fallo si el correo no llega;
   no contar un mensaje genérico de solicitud como entrega exitosa.
7. Para las cohortes, el remitente integrado no alcanza. El propietario elige un
   proveedor SMTP/remitente con dominio verificado y configura sus secretos en
   Supabase → Authentication → SMTP Settings. Después repetir entrega/verificación/
   recuperación con buzones controlados de cada evaluador. No enviar claves por chat.

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

## T097: conexión GitHub–Vercel

1. El propietario abre el proyecto `funes-empleo` en el equipo
   `pantherium-8487s-projects` de Vercel, Settings → Git.
2. Conecta su cuenta de GitHub y habilita el acceso de la integración al repositorio
   `maximo-Pdev/funes-empleo`. Revisar los permisos pedidos y seleccionar ese
   repositorio cuando el proveedor permita limitar el alcance.
3. Conectar ese repositorio al proyecto existente; no crear otro por el error del CLI.
   El propietario resolvió el acceso el 29/09; la API confirma el enlace al repositorio.
   No repetir la conexión ni crear otro proyecto. El rechazo previo es histórico.
4. El PR #33 ya generó el preview Git `0e84bb0`, READY y cuatro roles PASS; recibo
   y URL exacta en el runbook. Para un commit nuevo, comprobar nuevamente SHA y
   configuración antes de atribuirle pruebas anteriores. Usar variables demo
   separadas, acceso protegido y sin cliente secreto.
5. Antes de publicar desde main, completar revisión/aprobación y confirmar merge;
   configurar solo el destino de demo. Esto no habilita producción municipal.
