# Contrato de autorización y visibilidad

EXTRA106/108: /ofertas adapta únicamente su CTA al rol activo verificado con
getSiteAccess servidor por request. No modifica permisos ni autorregistro; ocultar
enlaces no es un control de seguridad. Home/login conservan el comportamiento previo.

EXTRA099,2026-10-28: cada cuenta activa con sesión viva consulta/abre únicamente
sus avisos, también para los cuatro admins. No hay bandeja común ni parámetros
de destinatario. RLS propia, sin escritura directa; RPC de apertura actualiza
solo read_at propio. Destinos revalidados al abrir y en la página final.
Excepción acotada a FR053: titular conoce nominación/preentrevista/derivación por
aviso; agenda municipal propia expone scheduled_at/held_at/channel únicamente.
No publica resumen, recomendación, motivos, notas, documentos de identidad o
perfiles ajenos; feedback empresarial no confirmado solo avisa a administración.
Sin cambios de consentimiento, disponibilidad ni permisos de empresas. Contrato
detallado: notifications.md. Sin backfill ni aviso de entrevista empresarial.

EXTRA069,2026-10-25: excepción ampliada a toda derivación propia. Cuenta/empresa
activas y oferta/caso/derivación no archivados reciben solo candidateName actual
en company_referral y candidate_name en company_referral_summaries. No exige
consentimiento/permiso completo para ese nombre; el resto de la información
sigue dependiendo del helper vigente. No revela datos a otras empresas, roles
no autorizados o sesiones revocadas. Foto/CV/contactos/perfil no se restablecen.

EXTRA062: empresa/cuenta activas pueden leer hiredCandidate{displayName,outcome:hired}
en su propia derivación/caso/oferta no archivados con contratación confirmada. Sin
permiso completo no se devuelven perfil/contactos/CV/entrevistas; casos ajenos
no se entregan. EXTRA069 permite nombre propio aunque el resultado todavía no
esté confirmado; hiredCandidate sigue exigiendo contratación confirmada.
No se modifica RLS de datos candidatos.
Empresa activa edita propia publicada y la envía a revisión atómicamente; cancela
propia no final con motivo, conservando auditoría/casos finales. Sin facultad de
moderar; actor/propiedad/versión se revalidan transaccionalmente. Admin no lista
draft, pero conserva su rol/autorizaciones operativas y métricas actuales.

## Candidate photo authorization exception — EXTRA-059

Owner mutations require an active candidate session, exact profile ownership and expected version. Read current images only for the owner, active Office administrator or currently authorized referred company; Storage RLS independently recomputes permission. Anonymous, suspended, foreign and stale operations are denied. No public/signed URLs or company metadata-table browsing.

The earlier privileged-operation restriction below gains one narrow exception: server-only validated candidate-photo ingestion/physical cleanup, never a general interactive client. Trusted SQL independently checks the explicit session actor against active accounts/profile ownership and locks versions. Authenticated/anonymous grants cannot ingest or write objects; reads never use service role. Physical deletion failure remains pending and visible, not falsely successful. See `../../../docs/implementation/candidate-profile-photos.md`.

## Actores

EXTRA061: lectura incremental de historial candidato exige admin activo en cada
llamada. Entrada candidateId/cursor fecha/id validada; scope perfil/cuenta actual
resuelto por servidor. No acepta entidades, cuenta, filtros o sort del cliente.
Solo devuelve eventos visibles id técnico/acción/fecha y cursor. Anónimo/candidato/
empresa/admin inactivo se rechazan antes de leer datos. Auditoría íntegra sin cambios.

- **Público**: sin sesión.
- **Candidato**: cuenta activa asociada a un perfil propio.
- **Empresa**: cuenta activa asociada a una empresa propia.
- **Administrador**: una de las cuatro cuentas individuales activas.
- **Sistema**: función programada acotada; no es una sesión interactiva.

Una cuenta suspendida equivale a denegación para toda acción privada. Archivar preserva historia y
también deniega acceso interactivo.

## Fuentes de autorización por superficie

EXTRA094: contratación administrativa normal/tardía cambia disponibilidad y
conserva consentimiento, permisos ajenos y estados de otras participaciones.
El admin confirmante es actor de disponibilidad; no se simula consentimiento.
El permiso propio todavía activo conserva acceso720h; revoked nunca revive.
Nueva aceptación afirmativa no restaura un permiso revocado. No cambia el
flujo manual de retiro, que sigue cerrando los casos abiertos.

A02/A03 (2026-10-17): la navegación pública obtiene href/label en servidor desde
Auth y la cuenta de aplicación activa. Candidato: `/dashboard?section=perfil`; empresa:
`/empresa/perfil`; administrador: `/account`. Cuenta ausente, bloqueada o identidad
no verificable: `/` (login de portada). Esta proyección no contiene nombres, IDs, tokens ni
datos privados, y el enlace nunca sustituye autorización al acceder al destino.
Las respuestas de navegación personalizadas y renovación de cookies no se
comparten en caché. El proxy renueva en páginas y handlers dinámicos; no extiende
sesiones revocadas ni levanta suspensión/archivo. Login/logout invalidan enlaces
anteriores; el cierre de seguridad por cambio de contraseña se conserva.

| Superficie | Fuente y reevaluación obligatoria |
| --- | --- |
| Página y layout protegidos | Sesión validada en servidor contra Auth y cuenta de aplicación vigente; comprueban rol y estado en cada petición, sin caché privada compartida. El layout no reemplaza los controles de acción ni RLS. |
| Server Action | Deriva actor de la sesión vigente, vuelve a consultar rol/estado, propiedad y versión esperada; la función de negocio verifica precondiciones en la transacción y RLS restringe los datos. Una suspensión concurrente impide la mutación. |
| Route Handler privado | Revalida sesión, rol, estado y propiedad en cada llamada. CV exige permiso `active` no vencido tras contratación, consentimiento, oferta propia y `cv_document_id` exacto; importación y exportación exigen administrador activo; el callback de Auth no otorga rol desde entrada pública. |
| Data API y funciones SQL | RLS/grants usan identidad autenticada y estado/rol de `accounts`, propiedad del recurso y, para proyección empresarial, derivación y consentimiento vigentes más plazo de 720 horas aún no vencido tras contratación. Funciones de transición vuelven a validar antes de escribir; la clave publicable no elude RLS. |
| Storage privado | Políticas restringen propietario, administrador activo o permiso empresarial de derivación todavía vigente. La descarga pasa por handler que reautoriza cada solicitud; no se entrega URL reutilizable. |
| Exportación | Handler y consulta protegida reevaluan administrador activo y filtros autorizados; no usa caché pública ni acepta un propietario enviado por cliente. |
| Proceso programado | Función SQL privada invocada por Supabase Cron, sin sesión interactiva; solo cierra ofertas vencidas y derivaciones sin respuesta y materializa la revocación de accesos poscontratación vencidos, con actor `system` e idempotencia. La autorización temporal niega la lectura desde el vencimiento aunque la tarea aún no corra. |

La credencial que elude RLS se limita a invitación/aprovisionamiento individual de administradores,
suspensión de usuario en Auth y mantenimiento programado protegido cuando realmente requiere ese
privilegio. Ninguna operación administrativa ordinaria o solicitud interactiva utiliza esa credencial;
cada acción iniciada por una persona conserva su cuenta como actor y `system` solo identifica los
dos cierres programados y el vencimiento programado del acceso poscontratación. Los intentos sobre
recursos ajenos responden `NOT_FOUND` cuando revelar su
existencia expondría información.

## Matriz de recursos

| Recurso/acción | Público | Candidato | Empresa | Administrador | Sistema |
| --- | --- | --- | --- | --- | --- |
| Oferta publicada vigente: consultar | Sí, campos públicos | Sí | Sí | Sí | No |
| Oferta no publicada: consultar | No | No | Solo propia | Sí | No |
| Perfil candidato: crear/editar | No | Solo propio | No | Sí, asistido/autorizado | No |
| Cuenta/perfil candidato: archivar/restaurar | No | No | No | Restaura registros históricos con motivo y confirmación; no se añade archivo | No |
| DNI/domicilio candidato | No | Solo propio | Nunca | Sí | No |
| Contacto y perfil laboral | No | Solo propio | Solo con permiso de derivación `active` sobre oferta propia | Sí | No |
| CV: cargar/reemplazar | No | Solo propio | No | Sí, sobre perfil atendido | No |
| CV: consultar | No | Solo propio | Solo con permiso `active` y `cv_document_id` exacto | Sí | No |
| Padrón/búsqueda de candidatos | No | No | Nunca | Sí | No |
| Consentimiento | No | Consultar/aceptar/retirar propio | No | Registrar asistido y consultar | No |
| Perfil empresa | No | No | Solo propio | Sí | No |
| Cuenta/perfil empresa: archivar/restaurar | No | No | No | Archiva con motivo; restaura con motivo | No |
| Oferta: crear/editar borrador | No | No | Solo propia | Puede mantener/moderar | No |
| Oferta: publicar/moderar | No | No | Nunca | Sí | No |
| Postulación propia | No | Crear/retirar propia | No | Consultar; registrar retiro solicitado por candidato; cancelar caso con motivo | No |
| Nominación sin postulación | No | Retirar participación propia abierta | No | Crear/gestionar; registrar retiro solicitado por candidato; cancelar caso con motivo | No |
| Preentrevista/preselección | No | No | No | Sí | No |
| Derivación | No | No | Consultar las recibidas | Solo admin crea/revoca | No |
| Feedback de empresa | No | No | Crear sobre derivación propia, incluso tardío, sin recuperar datos revocados | Consultar/aceptar | No |
| Resultado final | No | Consultar el propio; retirar cualquier participación abierta propia | Consultar derivado propio | Confirma/corrige resultado; registra retiro solicitado o cancelación motivada de caso individual | Cierra solo falta de respuesta |
| Notas/motivos internos | No | Nunca | Nunca | Sí | No |
| Contactos de seguimiento | No | No | No | Sí | No |
| Auditoría completa | No | No | No | Sí, lectura | Solo insertar evento acotado |
| Importación, métricas, exportación | No | No | No | Sí | No |
| Suspender/reactivar cuentas | No | No | No | Sí; una cuenta admin solo por otro admin activo y nunca si deja cero admins activos | No |
| Cerrar oferta vencida | No | No | No | Puede consultar historial | Solo oferta publicada vencida |

EXTRA056: create_active_assisted_candidate exige administrador activo y una
confirmación expresa de aceptación presencial sobre política vigente para cada
alta nueva. Solo authenticated puede invocarlo y la función revalida el rol real;
empresa/candidato/anónimo no crean perfiles mediante este comando. No cambia
la matriz de lectura ni acepta/reactiva perfiles existentes al resolver duplicados.

## Proyección pública de oferta

La proyección pública de una oferta `published` y vigente contiene solo nombre de la empresa,
título, tareas, categorías, vacantes, ubicación, modalidad, horario, tipo de contratación,
requisitos y fecha de cierre, con salario y beneficios si se informaron. No contiene CUIT, persona
responsable, contactos privados de la empresa, candidatos, participaciones ni resultados
individuales. Al cerrar por vencimiento deja de estar disponible públicamente y no recibe nuevas
postulaciones; las participaciones previas continúan para gestión municipal.

## Proyección empresarial de candidato derivado

La empresa puede ver, únicamente en el contexto de su oferta y mientras el permiso persistido de la
derivación esté `active`, el consentimiento continúe vigente y las cuentas/registros estén activos:

- nombre de presentación;
- localidad laboral;
- categorías laborales (selección única multivalor desde EXTRA057);
- resumen de habilidades y experiencia;
- disponibilidad;
- todos los contactos vigentes y no archivados;
- la versión exacta de CV registrada al crear la derivación, aunque luego sea reemplazada;
- información visible de entrevista/feedback de esa derivación.

La empresa nunca recibe:

- DNI ni domicilio;
- coincidencias o alertas de duplicado;
- notas internas, capacitaciones/orientaciones internas o preentrevistas municipales;
- motivos internos de moderación, suspensión o decisión;
- participaciones en otras ofertas;
- datos de candidatos no derivados;
- datos de otra empresa.

## Proyección de estado

- Candidato: `received` desde el alta de participación y solo el resultado final cuando exista. No
  recibe preentrevista, preselección, derivación ni espera interna como etapas detalladas.
- Empresa: moderación visible de ofertas propias y candidatos derivados. Puede comunicar feedback,
  pero no confirmar estado final. Solo ve explicación de correcciones solicitadas o rechazo; para
  pausa, suspensión, cierre y cancelación ve el estado sin motivo interno.
- Administrador: estado completo e historial.

Una empresa activa cuyo permiso fue revocado conserva únicamente el identificador de la derivación,
el identificador y título de su propia oferta y la fecha de derivación para comunicar feedback
tardío, junto con el nombre mínimo autorizado por EXTRA069. Esa vista no incluye
perfil, contactos, foto, CV ni ningún dato de otras participaciones.
Las confirmaciones `hired` conservan consentimiento y pasan a No disponible;
solo el permiso propio todavía activo conserva acceso hasta720 horas desde confirmar.
`not_selected`, `withdrawn`, `cancelled` y `no_company_response` lo revocan. Una corrección tardía a
`hired`, un consentimiento posterior, una reactivación o una restauración no revierten la revocación.

## Controles obligatorios de prueba

- Intento anónimo sobre toda ruta privada devuelve rechazo sin datos.
- Candidato A no lee ni muta candidato B.
- Empresa A no lee empresa/oferta B ni ninguna persona no derivada a una oferta A.
- Empresa no lee DNI, domicilio o notas aun con derivación válida.
- Empresa no registra resultado final.
- Suspender o archivar candidato/empresa revoca inmediatamente el acceso empresarial a perfil y CV;
  reactivar no lo restablece automáticamente.
- El archivo empresarial exclusivamente administrativo bloquea la cuenta/perfil y las ofertas no
  finales, preservan historial y resultados y no permiten restauración por la empresa; solo un
  administrador restaura con motivo a cuenta `active`, perfil `incomplete` y ofertas `draft`.
- Reactivar una cuenta candidata vuelve la cuenta a `active` sin cambiar el estado anterior del
  perfil; cada operación posterior revalida estado, frescura, disponibilidad, consentimiento y CV,
  y no repone ofertas, participaciones, derivaciones ni permisos relacionados.
- Retirar postulación o consentimiento revoca inmediatamente todos los permisos afectados; aceptar
  nuevamente o restaurar no los repone.
- `hired` cambia disponibilidad y conserva consentimiento/permisos ajenos/otros casos.
  Se comprueba límite720h del permiso propio: aun antes de que la tarea materialice
  `revoked`, se deniega toda lectura vencida. Nunca se restaura un permiso revocado.
  `not_selected`, `withdrawn`, `cancelled` y
  `no_company_response` lo revocan atómicamente. El feedback tardío sigue permitido sin datos y no
  reactiva el acceso, incluso si luego el resultado real se corrige a `hired`.
- La consulta empresarial de CV se reautoriza en cada solicitud y no entrega una URL reutilizable.
- Administrador suspendido no actúa.
- Clave publicable no elude RLS; clave secreta nunca aparece en cliente.
- Toda política tiene prueba positiva y negativa pgTAP y al menos un recorrido E2E crítico.
# Override EXTRA094,2026-10-28 — prevalece sobre retiro automático EXTRA035

Contratar no retira consentimiento global. No disponible impide matching/nuevas
derivaciones, sin revocar permisos ajenos. Empresa contratante con permiso propio
todavía active conserva perfil/contactos/foto/CV hasta confirmación+720h y demás
condiciones vigentes. Consentimiento retirado, sesión/cuenta/archivo/suspensión o
revocación previa deniegan. Contratación tardía nunca restaura revoked. Retiro
manual mantiene revocación global/cierre de participaciones abiertas.
