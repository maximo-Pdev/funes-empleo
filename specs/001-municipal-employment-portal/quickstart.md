# Guía de validación: MVP del Portal Municipal de Empleo de Funes

Esta guía define cómo deberá comprobarse la implementación. En la etapa actual el repositorio aún no
contiene la aplicación, por lo que los comandos son el contrato operativo para las fases de tareas e
implementación, no una afirmación de que ya puedan ejecutarse.

## Prerrequisitos

- Git.
- Node.js 24.21.0 LTS con npm 11.19.0.
- Docker Desktop activo y Supabase CLI instalado como dependencia de desarrollo del proyecto.
- Acceso individual al repositorio, al proyecto Supabase de demostración y a Vercel.
- Solo datos y archivos ficticios o correctamente anonimizados.

No usar credenciales, DNI, teléfonos, domicilios, CUIT, CV ni exportaciones reales. Producción no se
habilita hasta resolver OQ-001, OQ-006 y las demás dependencias del plan.

## Preparación local prevista

```powershell
npm ci
npx supabase start
npx supabase db reset
Copy-Item .env.example .env.local
npm run dev
```

Completar `.env.local` solo con credenciales del entorno local generado. Nunca copiar claves de demo
o producción a un archivo versionado ni a una conversación.

Resultado esperado:

- migraciones y seed ficticio aplicados sin intervención manual;
- bucket privado y políticas creados por migración;
- aplicación disponible en `http://localhost:3000`;
- emails de prueba capturados localmente, sin enviar a personas reales;
- cuatro identidades administrativas ficticias y separadas para validación.

Para SC-003 y SC-008 se utilizará el entorno alojado de demostración, no el entorno local. Antes de
cada medición se ejecutará el comando previsto `npm run acceptance:reset-demo`, que debe abortar si
el entorno no es `demo`, si el identificador de proyecto no coincide con el configurado o si falta
confirmación explícita. El reset transaccional aplica únicamente el fixture ficticio versionado,
verifica los conteos 500/50/100/1.000 y muestra su versión/hash sin imprimir PII. Nunca puede aceptar
un proyecto productivo.

## Gates automatizados previstos

```powershell
npm run typecheck
npm run lint
npm run test:unit
npm run test:db
npm run build
npm run test:e2e
```

Todos deben terminar con código cero. `test:db` debe reiniciar una base aislada y ejecutar pgTAP;
`test:e2e` debe usar fixtures ficticios y conservar trazas/capturas solo cuando falle.

Cobertura mínima por riesgo:

- autenticación, verificación, recuperación y suspensión;
- corrección directa, archivo inmediato solicitado por candidato y restauración administrativa segura;
- RLS positiva y negativa para público, candidato, empresa y admin;
- moderación y cierre automático de oferta vencida;
- postulación y nominación administrativa;
- preentrevista, preselección y derivación;
- vista empresarial limitada a todos los contactos vigentes y a la versión de CV de la derivación;
- feedback empresarial y resultado final administrativo;
- cierre automático a 30 días y corrección tardía;
- previsualización CSV, duplicados y rollback total;
- historial append-only y conflicto entre dos administradores.

## Escenario 1: candidato autogestionado

1. Registrar `Ana Prueba` con DNI, email y contraseña ficticios.
2. Confirmar el email desde el buzón local e iniciar sesión.
3. Verificar que el panel está disponible pero el perfil todavía no está activo.
4. Completar localidad, al menos dos categorías, resumen, disponibilidad, consentimiento y PDF válido.
5. Activar el perfil y postularse a dos ofertas publicadas.
6. Corregir un dato del perfil y comprobar que se aplica directamente con historial.
7. Retirar una postulación y desactivar disponibilidad.

Esperado:

- solo modifica su perfil;
- la empresa no obtiene datos antes de derivación;
- cada oferta tiene seguimiento independiente;
- candidato ve recepción y resultado final, no evaluación interna;
- retiro/desactivación conservan historial.
- la corrección no crea una solicitud administrativa pendiente.

## Escenario 2: empresa y moderación

1. Registrar una empresa ficticia con email, contraseña, nombre, CUIT, responsable, contacto,
   actividad y localidad; verificar email e iniciar sesión.
2. Crear un borrador completo con dos categorías y salario opcional vacío.
3. Enviar a revisión; confirmar que no se publica directamente.
4. Como admin, solicitar correcciones con mensaje visible.
5. Como empresa, corregir y reenviar.
6. Como admin, aprobar y publicar; luego pausar y reanudar.
7. Llevar `closing_date` al pasado con reloj de prueba y ejecutar la automatización dos veces.

Esperado:

- solo `published` aparece públicamente y acepta postulaciones;
- cada decisión conserva actor, fecha, estado previo/nuevo y mensaje;
- empresa solo ve su propia organización/ofertas;
- pausa bloquea nuevas postulaciones sin perder existentes.
- el vencimiento cierra una sola vez, quita la oferta del público y preserva participaciones.

## Escenario 3: intermediación y privacidad

1. Como admin, filtrar candidatos por categoría, habilidad, disponibilidad, localidad y vigencia.
2. Registrar preentrevista, contacto y nota interna sobre una participación; en otro caso, avanzar
   omitiendo revisión/preentrevista/preselección con motivo y sin omitir la derivación.
3. Preseleccionar y derivar a un candidato con consentimiento/CV vigentes.
4. Reemplazar el CV del candidato después de derivarlo y agregar o actualizar un contacto vigente.
5. Como empresa de la oferta, consultar el candidato y descargar el CV.
6. Intentar consultar el DNI, domicilio, nota interna, otra participación y un candidato no derivado.
7. Sobre una derivación, retirar la postulación; sobre otra, retirar el consentimiento general.
8. Como empresa, intentar volver a consultar ambos perfiles, contactos y CV; luego registrar un nuevo
   consentimiento y comprobar que no restaura el acceso anterior.

Esperado:

- empresa ve solo perfil laboral, todos los contactos vigentes y el CV exacto guardado en la
  derivación, no el reemplazo posterior;
- todos los intentos adicionales son rechazados sin confirmar datos;
- empresa nunca explora el padrón;
- candidato no ve preentrevista, preselección ni nota.
- retirar postulación o consentimiento revoca inmediatamente cada permiso afectado y la autorización
  se vuelve a comprobar en cada solicitud de CV, sin URL reutilizable;
- reconsentir no reactiva derivaciones anteriores y administración conserva la historia.
- la prueba verifica que no puedan iniciarse nuevas consultas o descargas después de revocar; una
  copia ya descargada no puede retirarse técnicamente y queda sujeta al aviso y a OQ-001.

## Escenario 4: feedback, resultado y falta de respuesta

1. Como empresa, registrar una entrevista y comunicar `hired` para una derivación.
2. Verificar que el feedback queda pendiente y no cambia el resultado final.
3. Como admin, confirmar contratación.
4. Confirmar que la empresa conserva acceso al perfil/contactos/CV porque el permiso seguía activo.
5. Crear otras derivaciones para confirmar `not_selected` y `cancelled`; verificar revocación
   inmediata en ambas.
6. Crear otra derivación con reloj de prueba vencido más de 30 días y ejecutar la función programada.
7. Confirmar `no_company_response` y la revocación; como empresa, comunicar feedback tardío sin poder
   recuperar los datos y corregir como admin a `hired`.

Esperado:

- solo admin fija el resultado real;
- el job es idempotente y atribuye el evento a `system`;
- la corrección conserva el cierre anterior;
- `hired` conserva únicamente un permiso que seguía activo; no selección, cancelación y falta de
  respuesta lo revocan;
- feedback tardío no devuelve datos y corregir `no_company_response` a `hired` no reactiva el permiso;
- candidato no seleccionado sigue activo para otras búsquedas.

## Escenario 5: atención presencial

1. Como admin, crear un perfil asistido ficticio con nombre, DNI y teléfono, sin PDF.
2. Registrar disponibilidad, categorías, contacto, consentimiento atendido y nota de capacitación.
3. Intentar derivarlo sin CV.
4. Cargar un PDF válido y derivar.
5. Vincularlo a una cuenta personal ficticia mediante el proceso aprobado.

Esperado:

- el alta sin PDF es posible, la derivación no;
- acciones identifican al admin;
- nota de capacitación es libre e interna;
- vinculación preserva ID e historial y no crea duplicado.
- una persona sin email puede ser atendida por este flujo, pero no por autorregistro.

## Escenario 6: duplicados e importación

Este escenario queda bloqueado hasta contar con muestra anonimizada y `mapping_version` aprobado.
Una vez disponible:

1. Previsualizar un CSV ficticio con fila válida, DNI duplicado, email coincidente, categoría sin
   mapear, campo faltante y encabezado desconocido en archivos separados.
2. Comprobar que no existan perfiles nuevos después de previsualizar.
3. Resolver cada duplicado eligiendo explícitamente `use_or_update_existing`, `correct_and_create` o
   `reject`, con motivo; para un falso positivo, corregir el dato y volver a validar.
4. Forzar un error en una fila dentro de la transacción.

Esperado:

- todas las anomalías aparecen antes de confirmar;
- no hay fusión automática;
- cada resolución conserva decisión, motivo y actor, sin sobrescribir silenciosamente un perfil;
- lote válido importa completo;
- fallo revierte todas las filas y deja resultado explícito recuperable;
- logs no contienen datos de filas.

## Escenario 7: métricas y exportación

1. Usar un único administrador de prueba sin capacitación ni práctica previa y entregarle solamente
   la descripción de cada tarea; no realizar recorridos de calentamiento.
2. En el mismo entorno de demostración, restablecer los fixtures reproducibles: 500 candidatos, 50
   empresas, 100 ofertas y 1.000 participaciones. Registrar commit/despliegue, versión/hash, reset,
   fecha, navegador, dispositivo, conexión e identificador seudónimo del participante.
3. Seleccionar período y categoría e iniciar cronómetro al aplicar filtros.
4. Comparar conteos con los fixtures conocidos y descargar el CSV; detener al completar la descarga.
5. Restablecer nuevamente el mismo fixture y registrar la nueva confirmación antes de SC-003.
6. Medir una búsqueda desde que abre la pantalla administrativa hasta registrar una preentrevista y
   guardar la preselección.
7. Para ofertas preparadas, comparar días desde publicación hasta primera contratación y hasta cubrir
   todas las vacantes; comprobar que la segunda métrica queda pendiente si faltan contrataciones.
8. Incluir en fixtures un valor que comience con `=` o `+`.
9. Intentar descargar la exportación sin sesión y como empresa.

Esperado:

- conteos de candidatos, empresas, ofertas, postulaciones, preentrevistas, derivaciones y resultados
  coinciden con la base;
- candidato activo exige estado activo, disponibilidad, consentimiento y confirmación dentro de seis
  meses, sin depender de que tenga CV;
- búsqueda y preselección se guardan en menos de 5 minutos;
- conteos y exportación terminan dentro de 30 segundos desde que se aplican los filtros;
- las dos métricas de contratación permanecen separadas y la cobertura total no se anticipa;
- valores peligrosos están neutralizados;
- solo admin accede.

## Escenario 8: suspensión, eliminación y restauración

1. Como admin, iniciar suspensión de candidato y empresa; comprobar que la opción esté destacada y
   cancelar una vez antes de confirmar con motivo.
2. Verificar bloqueo de acciones nuevas y revocación del acceso empresarial a perfiles/CV, sin
   convertir casos existentes en resultados finales.
3. Reactivar y comprobar que ofertas, derivaciones y accesos no vuelven automáticamente; restaurar
   después una oferta con motivo y verificar que regresa a `draft`.
4. Como candidato activo, solicitar eliminación y confirmar la acción.
5. Comprobar archivo inmediato y ausencia de borrado físico; como admin, restaurar con motivo.

Esperado:

- toda transición identifica actor, estado previo/nuevo, fecha y motivo;
- el candidato no espera aprobación para quedar archivado;
- el perfil restaurado queda `draft`, la empresa inactiva y sus ofertas restauradas en `draft`;
- participaciones, resultados y evidencias históricas se conservan sin reactivarse.

## Protocolo de aceptación de tiempos y tareas

- Candidato y empresa: ejecutar 10 recorridos por rol con al menos cinco personas distintas por rol,
  datos ficticios ya preparados, conexión estable y sin ayuda externa. Para candidato, medir desde la
  apertura del formulario de registro hasta la postulación confirmada; para empresa, desde la
  apertura del formulario de registro hasta el envío a revisión confirmado. Al menos 9 de 10
  ejecuciones de cada rol deben terminar en menos de 10 minutos.
- Administración: un único administrador de prueba, sin capacitación ni práctica previa, recibe solo
  la descripción de cada tarea. Usar el mismo entorno de demostración y restablecer separadamente el
  dataset reproducible antes de SC-003 y antes de SC-008, con conexión estable y sin calentamiento.
  Medir búsqueda desde la apertura de la pantalla hasta guardar la preselección, y
  métricas/exportación desde aplicar los filtros hasta ver conteos y completar la descarga. Registrar
  para cada ejecución commit/despliegue, versión/hash y confirmación del reset, fecha, navegador,
  dispositivo, conexión e identificador seudónimo del participante.
- Primer intento: no hubo ayuda externa ni reinicio del recorrido. Corregir un error mediante los
  mensajes de la propia interfaz no invalida el intento.
- Las cinco tareas de éxito son: candidato completa perfil y se postula; empresa crea y envía una
  oferta; admin modera una oferta; admin busca, preselecciona y deriva; admin registra el resultado
  final. SC-010 usa cohortes separadas de al menos cinco candidatos, cinco representantes de empresa
  y los cuatro administradores previstos o personal municipal equivalente. Cada persona realiza solo
  tareas de su rol. Para cada tipo se registra participantes elegibles, éxitos de primer intento,
  porcentaje y resultado; aprueba con al menos 80 %. SC-010 aprueba cuando cumplen al menos cuatro de
  los cinco tipos de tarea; con cinco participantes se requieren cuatro éxitos y con exactamente
  cuatro administradores se requieren cuatro.

## Verificación manual de accesibilidad y experiencia

Ejecutar los recorridos críticos de candidato, empresa y administración en 360×800 y 1366×768, tanto
a 100 % como a 200 % de zoom. Completarlos solo con teclado y repetir al menos uno representativo por
rol con NVDA:

- navegación completa solo con teclado, orden de foco visible y sin trampas;
- zoom 200 % sin pérdida de controles o contenido esencial;
- labels, instrucciones, errores, loading, vacíos y confirmaciones en español;
- mensajes asociados programáticamente a campos inválidos;
- foco movido al resumen de error o contenido actualizado cuando corresponda;
- contraste y landmarks revisados; axe sin violaciones graves conocidas;
- NVDA anuncia estructura, nombres, estados, errores y confirmaciones del recorrido sin depender de
  información visual.

## Validación de Pull Request

Antes de considerar terminada una implementación:

1. Confirmar rama dedicada y working tree sin secretos/PII.
2. Adjuntar resultados de los seis comandos de calidad.
3. Documentar migraciones, variables nuevas y recuperación.
4. Incluir evidencia manual de los flujos críticos y accesibilidad.
5. Declarar limitaciones y OQ todavía abiertas.
6. Obtener revisión del segundo desarrollador; aprobación no equivale a merge.

## Variables previstas

El `.env.example` futuro documentará nombres sin secretos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` — solo servidor, si las operaciones acotadas la requieren
- `NEXT_PUBLIC_APP_URL`
- `APP_ENV` — valor controlado `local`, `preview` o `demo`; nunca se asume `demo`
- `ACCEPTANCE_DEMO_PROJECT_REF` — identificador no secreto usado por el guard del reset alojado
- identificadores/configuración no sensible del consentimiento aprobado

No se incorpora una variable SMTP productiva ni secretos de cron mientras sus decisiones sigan
pendientes o el trabajo se ejecute dentro de Supabase Cron.
