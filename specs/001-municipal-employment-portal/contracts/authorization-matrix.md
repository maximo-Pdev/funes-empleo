# Contrato de autorización y visibilidad

## Actores

- **Público**: sin sesión.
- **Candidato**: cuenta activa asociada a un perfil propio.
- **Empresa**: cuenta activa asociada a una empresa propia.
- **Administrador**: una de las cuatro cuentas individuales activas.
- **Sistema**: función programada acotada; no es una sesión interactiva.

Una cuenta suspendida equivale a denegación para toda acción privada. Archivar preserva historia y
también deniega acceso interactivo.

## Fuentes de autorización por superficie

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
| Perfil candidato: solicitar eliminación | No | Archiva el propio de inmediato | No | Puede restaurar con motivo | No |
| DNI/domicilio candidato | No | Solo propio | Nunca | Sí | No |
| Contacto y perfil laboral | No | Solo propio | Solo con permiso de derivación `active` sobre oferta propia | Sí | No |
| CV: cargar/reemplazar | No | Solo propio | No | Sí, sobre perfil atendido | No |
| CV: consultar | No | Solo propio | Solo con permiso `active` y `cv_document_id` exacto | Sí | No |
| Padrón/búsqueda de candidatos | No | No | Nunca | Sí | No |
| Consentimiento | No | Consultar/aceptar/retirar propio | No | Registrar asistido y consultar | No |
| Perfil empresa | No | No | Solo propio | Sí | No |
| Cuenta/perfil empresa: archivar/restaurar | No | No | Archiva los propios; no restaura | Archiva con motivo; restaura con motivo | No |
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
- categorías/intereses;
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
tardío. Esa vista no incluye nombre, perfil, contactos, CV ni ningún dato de otras participaciones.
`hired` conserva un permiso todavía activo solo hasta 720 horas desde la confirmación administrativa;
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
- El archivo empresarial propio y el administrativo bloquean la cuenta/perfil y las ofertas no
  finales, preservan historial y resultados y no permiten restauración por la empresa; solo un
  administrador restaura con motivo a cuenta `active`, perfil `incomplete` y ofertas `draft`.
- Reactivar una cuenta candidata vuelve la cuenta a `active` sin cambiar el estado anterior del
  perfil; cada operación posterior revalida estado, frescura, disponibilidad, consentimiento y CV,
  y no repone ofertas, participaciones, derivaciones ni permisos relacionados.
- Retirar postulación o consentimiento revoca inmediatamente todos los permisos afectados; aceptar
  nuevamente o restaurar no los repone.
- `hired` conserva acceso si seguía activo, por un máximo de 720 horas desde la confirmación;
  incluso antes de que la tarea materialice `revoked`, toda lectura posterior al plazo se deniega.
  `not_selected`, `withdrawn`, `cancelled` y
  `no_company_response` lo revocan atómicamente. El feedback tardío sigue permitido sin datos y no
  reactiva el acceso, incluso si luego el resultado real se corrige a `hired`.
- La consulta empresarial de CV se reautoriza en cada solicitud y no entrega una URL reutilizable.
- Administrador suspendido no actúa.
- Clave publicable no elude RLS; clave secreta nunca aparece en cliente.
- Toda política tiene prueba positiva y negativa pgTAP y al menos un recorrido E2E crítico.
