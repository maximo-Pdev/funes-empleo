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
| DNI/domicilio candidato | No | Solo propio | Nunca | Sí | No |
| Contacto y perfil laboral | No | Solo propio | Solo derivado a oferta propia | Sí | No |
| CV: cargar/reemplazar | No | Solo propio | No | Sí, sobre perfil atendido | No |
| CV: descargar | No | Solo propio | Solo derivación activa propia | Sí | No |
| Padrón/búsqueda de candidatos | No | No | Nunca | Sí | No |
| Consentimiento | No | Consultar/aceptar/retirar propio | No | Registrar asistido y consultar | No |
| Perfil empresa | No | No | Solo propio | Sí | No |
| Oferta: crear/editar borrador | No | No | Solo propia | Puede mantener/moderar | No |
| Oferta: publicar/moderar | No | No | Nunca | Sí | No |
| Postulación propia | No | Crear/retirar propia | No | Consultar/gestionar | No |
| Nominación sin postulación | No | No | No | Sí | No |
| Preentrevista/preselección | No | No | No | Sí | No |
| Derivación | No | No | Consultar las recibidas | Solo admin crea/revoca | No |
| Feedback de empresa | No | No | Crear sobre derivación propia | Consultar/aceptar | No |
| Resultado final | Solo si la oferta sigue pública, sin personas | Solo resultado propio | Consultar derivado propio | Solo admin confirma/corrige | Cierra solo falta de respuesta |
| Notas/motivos internos | No | Nunca | Nunca | Sí | No |
| Contactos de seguimiento | No | No | No | Sí | No |
| Auditoría completa | No | No | No | Sí, lectura | Solo insertar evento acotado |
| Importación, métricas, exportación | No | No | No | Sí | No |
| Suspender/reactivar cuentas | No | No | No | Sí | No |

## Proyección empresarial de candidato derivado

La empresa puede ver, únicamente en el contexto de su oferta:

- nombre de presentación;
- localidad laboral;
- categorías/intereses;
- resumen de habilidades y experiencia;
- disponibilidad;
- contactos marcados para compartir;
- CV vigente asociado a la derivación;
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

## Controles obligatorios de prueba

- Intento anónimo sobre toda ruta privada devuelve rechazo sin datos.
- Candidato A no lee ni muta candidato B.
- Empresa A no lee empresa/oferta B ni ninguna persona no derivada a una oferta A.
- Empresa no lee DNI, domicilio o notas aun con derivación válida.
- Empresa no registra resultado final.
- Administrador suspendido no actúa.
- Clave publicable no elude RLS; clave secreta nunca aparece en cliente.
- Toda política tiene prueba positiva y negativa pgTAP y al menos un recorrido E2E crítico.
