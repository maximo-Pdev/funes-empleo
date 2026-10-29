# Portal de Empleo de Funes — borrador de términos de uso y aviso de privacidad

Estado: propuesta para revisión municipal y jurídica. No aprobado para producción ni para el tratamiento de datos reales. Versión de trabajo: demo-terms-draft-1. Este documento no constituye asesoramiento jurídico ni acredita cumplimiento normativo.

## Aviso para la demostración

Esta versión del portal corresponde a un proyecto académico de demostración. Debe utilizarse exclusivamente con datos ficticios y archivos de prueba. No cargue DNI, contactos, fotografías, CV ni otros datos personales reales. La aceptación de este borrador no habilita el uso de datos reales ni sustituye la aprobación municipal.

## 1. Finalidad del portal

El portal permite demostrar la gestión de perfiles laborales, empresas, ofertas de trabajo, postulaciones y seguimiento por parte de una Oficina de Empleo. La Oficina actúa como intermediaria: revisa las ofertas y las postulaciones y decide las derivaciones a empresas. El registro, una sugerencia de oferta, una postulación o una derivación no garantizan una entrevista ni una contratación.

## 2. Cuentas y uso permitido

Cada persona debe utilizar su propia cuenta y mantener su contraseña en reserva. En la demostración, los datos y documentos utilizados deben ser ficticios y coherentes con los escenarios de prueba. Las cuentas de empresa deben utilizarse para gestionar sus propias ofertas y las derivaciones que les correspondan.

No se permite suplantar identidades, acceder a información ajena, eludir restricciones de acceso, utilizar información para fines discriminatorios o de acoso, ni cargar contenido ilícito o archivos maliciosos. Los permisos de cada rol siguen siendo exigibles con independencia de la aceptación de estos términos.

## 3. Datos utilizados y finalidad

Según el rol y la operación, el sistema utiliza información de registro e identificación, datos de contacto y localidad, antecedentes laborales, categorías de interés, CV, fotografía opcional y registros de ofertas, postulaciones, derivaciones, resultados y acciones administrativas. Estos datos se utilizan para los recorridos de intermediación laboral y su trazabilidad, no para vender bases de datos ni para habilitar la consulta indiscriminada de perfiles.

Los formularios identifican los campos obligatorios. La omisión o invalidez de los datos necesarios puede impedir completar la operación correspondiente. No deben cargarse datos sensibles ni documentos de terceras personas fuera de un procedimiento expresamente autorizado. En esta demostración todos los datos deben ser ficticios.

## 4. Acceso a la información y derivaciones

La Oficina accede a la información necesaria para gestionar los perfiles y los procesos. Las empresas no tienen acceso libre al padrón de postulantes. Solo pueden consultar la información autorizada de candidatos derivados a sus propias ofertas, dentro de las restricciones vigentes del sistema. No acceden al DNI, domicilio ni notas internas del postulante.

Las empresas deben utilizar la información disponible únicamente para la selección vinculada a la derivación y no divulgarla ni reutilizarla para otros fines.

La aceptación de términos de uso no equivale a una derivación, no cambia los estados de una postulación y no sustituye la base jurídica que deba establecerse para el tratamiento o la comunicación de datos personales.

## 5. Privacidad y derechos

La versión de producción deberá informar quién es el responsable del tratamiento, su domicilio, las finalidades y destinatarios, los campos obligatorios y sus consecuencias, y el canal para ejercer los derechos de acceso, rectificación, actualización y supresión cuando correspondan. La Ley 25.326 y la información de la AAIP se incluyen como referencias para esa revisión.

No se declara aprobado un responsable, domicilio o canal de atención mediante este borrador. Tampoco se fija un plazo de conservación ni se promete un borrado inmediato: esas decisiones deben definirse antes del uso con datos reales, de acuerdo con las obligaciones aplicables y la trazabilidad necesaria. La existencia de un historial técnico no permite desconocer los derechos legales de las personas.

## 6. Archivos, seguridad y servicios técnicos

El portal utiliza servicios de autenticación, base de datos y almacenamiento para sus funciones. El despliegue previsto utiliza Supabase y Vercel. La identificación de sus entidades contratantes, ubicaciones de tratamiento, posibles transferencias internacionales y garantías aplicables debe validarse antes de producción. Este documento no afirma que dicha validación ya se haya realizado.

Las personas usuarias deben proteger sus credenciales y utilizar los mecanismos de recuperación previstos. El texto no garantiza seguridad absoluta ni elimina las responsabilidades legales que correspondan.

## 7. Enlaces a cursos y sitios externos

Los enlaces externos tienen finalidad informativa. Debe verificarse su procedencia antes de publicarlos. Visitar un enlace no implica inscripción a un curso, derivación municipal ni garantía de una vacante. El sitio de destino puede tener sus propias condiciones y aviso de privacidad.

## 8. Versiones y aceptación

La interfaz debe permitir consultar el texto completo antes de aceptar y no debe mostrar la casilla premarcada. La aceptación debe corresponder a una versión identificable. No se deben atribuir aceptaciones a cuentas existentes ni aceptar en nombre de usuarios por una migración.

Texto propuesto para la demostración:

“He leído y acepto los términos de uso de la demostración y he leído el aviso de privacidad. Entiendo que solo debo utilizar datos ficticios.”

Esta aceptación no debe activar automáticamente permisos de derivación ni modificar registros de consentimiento existentes. Si para producción corresponde solicitar consentimiento para tratar o comunicar datos, deberá presentarse de forma expresa y diferenciada, con la información y posibilidad de revocación que resulten aplicables.

## Pendientes antes de publicar una versión legal definitiva

- Aprobar la identidad y el domicilio del responsable y un canal efectivo para ejercer derechos.
- Definir con la Municipalidad la base jurídica del tratamiento y de las comunicaciones a empresas; no inferirla de un checkbox genérico.
- Validar destinatarios, proveedores, transferencias internacionales, conservación y procedimientos de atención y supresión.
- Resolver las condiciones de participación por edad, sin imponer un límite inventado en este borrador.
- Revisar el texto con el área jurídica y aprobar una versión de producción.
- Mantener separado el registro de aceptación de términos del consentimiento operativo existente hasta aprobar su cambio funcional y verificar los controles de privacidad.

## Implementation and verification boundary

- Public text: `/terminos`, available without authentication, version `demo-terms-draft-1`. Both registration forms require an initially unchecked native checkbox; registration acceptance does not grant candidate consent. Switching forms preserves the existing independent data drafts, but never prechecks a remounted legal acceptance field.
- Both registration actions and services validate explicit acceptance and the exact current version before creating an Auth client or calling signup. The generic, non-enumerative provider response is unchanged.
- The legacy generic `registerAccountAction` / `registerAccount` entrypoints enforce the same versioned acceptance and persist the same metadata; they are not a bypass around the candidate/company registration guards.
- Migration `20261028013000_registration_terms.sql` adds `private.registration_terms_receipts`, keyed by persisted account ID, role, terms version and database timestamp. This is a separate append-only receipt, not a claim that mutable Auth metadata is an audit log. No IP, user-agent, password or personal document is copied to receipts.
- Existing `portal_auth_insert` / `private.on_auth_user` still creates accounts and validates administrator invitations. The alphabetically later INSERT-only receipt trigger reads that persisted role. Existing email-verification and account lifecycle triggers remain unchanged. Auth metadata is captured only on insertion; editing it or verifying email cannot fabricate, replace or duplicate a receipt.
- Normal Auth API database sessions must supply valid terms. Explicitly trusted database provisioning sessions (`postgres` / `supabase_admin`) may omit both metadata fields for fixtures/assisted provisioning, with **no receipt**; malformed supplied fields still fail. This exception is not selectable through user metadata. Verify actual Auth connection identity and signup behavior in an isolated Supabase target before deployment; mocked application tests do not prove this boundary.
- Existing accounts are not forced to accept retroactively and no migration invents historical acceptance. Administrator invitations are not public registrations and do not receive candidate/company receipts.
- `Cuenta > Privacidad` owns operational permission controls: pending/withdrawn permission requires fresh confirmation, while accepted permission offers intentional withdrawal, never duplicate accepted-to-accepted submission. Automatic withdrawal on hiring and explicit global withdrawal semantics remain distinct and unchanged. Existing version checks, server-side policy loading, path revalidation and router refresh remain in use. Perfil and blocked offers link to Cuenta for this action.
- Recovery is forward-only: retain receipts; if rollout must be paused, review disabling the signup receipt trigger during maintenance rather than deleting or fabricating records. Roll out database and application together. A version bump requires archiving the exact prior text and updating the application validator and SQL version validator together.
- Focused application TDD has been executed locally. PostgreSQL pgTAP, real Auth signup, browser layout and deployment remain pending the parent integration gates. Do not interpret this implementation as municipal legal approval.

## Fuentes consultadas

1. Argentina.gob.ar, Términos y condiciones: https://www.argentina.gob.ar/terminos-y-condiciones
   Referencia de estructura, no texto trasladado como política municipal. No se adoptan sus autoridades, domicilios, jurisdicción, declaraciones de inscripción ni servicios ajenos al proyecto.
2. Ley 25.326, texto actualizado, especialmente artículos 4, 5, 6, 9, 10, 11, 12, 14 y 16: https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm
3. AAIP, derechos sobre datos personales: https://www.argentina.gob.ar/aaip/datospersonales/derechos
