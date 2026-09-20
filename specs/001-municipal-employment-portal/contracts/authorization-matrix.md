# Contrato de autorización y visibilidad

## Actores

- **Público**: sin sesión.
- **Candidato**: cuenta activa asociada a un perfil propio.
- **Empresa**: cuenta activa asociada a una empresa propia.
- **Administrador**: una de las cuatro cuentas individuales activas.
- **Sistema**: función programada acotada; no es una sesión interactiva.

Una cuenta suspendida equivale a denegación para toda acción privada. Archivar preserva historia y
también deniega acceso interactivo.

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
| Oferta: crear/editar borrador | No | No | Solo propia | Puede mantener/moderar | No |
| Oferta: publicar/moderar | No | No | Nunca | Sí | No |
| Postulación propia | No | Crear/retirar propia | No | Consultar/gestionar | No |
| Nominación sin postulación | No | No | No | Sí | No |
| Preentrevista/preselección | No | No | No | Sí | No |
| Derivación | No | No | Consultar las recibidas | Solo admin crea/revoca | No |
| Feedback de empresa | No | No | Crear sobre derivación propia, incluso tardío, sin recuperar datos revocados | Consultar/aceptar | No |
| Resultado final | Solo si la oferta sigue pública, sin personas | Solo resultado propio | Consultar derivado propio | Solo admin confirma/corrige | Cierra solo falta de respuesta |
| Notas/motivos internos | No | Nunca | Nunca | Sí | No |
| Contactos de seguimiento | No | No | No | Sí | No |
| Auditoría completa | No | No | No | Sí, lectura | Solo insertar evento acotado |
| Importación, métricas, exportación | No | No | No | Sí | No |
| Suspender/reactivar cuentas | No | No | No | Sí | No |
| Cerrar oferta vencida | No | No | No | Puede consultar historial | Solo oferta publicada vencida |

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
  pero no confirmar estado final.
- Administrador: estado completo e historial.

Una empresa cuyo permiso fue revocado conserva únicamente los metadatos no personales mínimos para
identificar una derivación propia y comunicar feedback tardío. Esa vista no incluye nombre, perfil,
contactos, CV ni ningún dato de otras participaciones. `hired` conserva un permiso todavía activo;
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
- Retirar postulación o consentimiento revoca inmediatamente todos los permisos afectados; aceptar
  nuevamente o restaurar no los repone.
- `hired` conserva acceso si seguía activo; `not_selected`, `withdrawn`, `cancelled` y
  `no_company_response` lo revocan atómicamente. El feedback tardío sigue permitido sin datos y no
  reactiva el acceso, incluso si luego el resultado real se corrige a `hired`.
- La consulta empresarial de CV se reautoriza en cada solicitud y no entrega una URL reutilizable.
- Administrador suspendido no actúa.
- Clave publicable no elude RLS; clave secreta nunca aparece en cliente.
- Toda política tiene prueba positiva y negativa pgTAP y al menos un recorrido E2E crítico.
