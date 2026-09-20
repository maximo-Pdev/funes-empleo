# Feature Specification: MVP del Portal Municipal de Empleo de Funes

**Feature Branch**: `spec/municipal-employment-portal-mvp`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Crear una única especificación integral para el MVP del Portal
Municipal de Empleo de Funes, manteniendo a la Oficina de Empleo como intermediaria y cubriendo
los flujos completos de candidatos, empresas y administradores."

## Clarifications

### Session 2026-09-19

- Q: Después de una derivación municipal, ¿qué información del candidato podrá ver la empresa? →
  A: Perfil laboral, todos los contactos vigentes y CV; excluye DNI, domicilio y notas internas.
- Q: ¿Cuándo debe registrar el sistema el consentimiento del candidato para tratar sus datos y
  compartirlos con una empresa? → A: Un único consentimiento al activar el perfil cubre todas las
  derivaciones futuras.
- Q: ¿Qué conjunto mínimo de datos debe exigirse para activar un perfil de candidato? → A: El
  autorregistro inicial requiere nombre, DNI, correo verificado y contraseña; después del registro,
  el candidato completa desde su panel los datos laborales estructurados antes de activar el perfil.
- Q: ¿Qué datos deben ser obligatorios para habilitar una empresa y enviar una oferta a revisión
  municipal? → A: La empresa informa nombre, CUIT, responsable, contacto, actividad y localidad; la
  oferta informa título, tareas, categorías, vacantes, ubicación, modalidad, horario, contratación,
  requisitos y fecha de cierre.
- Q: ¿Quién debe tener autoridad para confirmar el resultado final de una derivación? → A: Solo un
  administrador registra el resultado final según lo comunicado por la empresa.
- Q: Cuando un administrador identifica a un candidato adecuado que no se postuló, ¿en qué momento
  debe confirmar su interés? → A: El consentimiento general vigente del perfil permite asociarlo y
  derivarlo sin una confirmación específica por oferta.
- Q: ¿Qué nivel de detalle deben ver candidatos y empresas sobre el avance de una participación? →
  A: El candidato ve recepción y resultado final; la empresa ve la moderación de sus ofertas y los
  candidatos derivados; las notas administrativas sobre postulantes permanecen ocultas.
- Q: ¿Qué debe ocurrir cuando una empresa no informa el resultado de una derivación? → A: Después de
  30 días desde la derivación se cierra automáticamente como sin respuesta empresarial; ninguna
  entrevista, contacto ni seguimiento modifica el plazo, y un administrador puede cambiar ese
  estado si la empresa responde más tarde.
- Q: ¿En qué momento debe ser obligatorio el CV PDF para un perfil creado mediante atención
  presencial? → A: El perfil asistido puede crearse sin PDF, pero debe incorporarlo antes de una
  derivación empresarial.
- Q: ¿Cómo deben representarse las capacitaciones asociadas a candidatos dentro del MVP? → A: Como
  una nota de texto libre dentro del perfil del candidato.
- Q: Después de una derivación, ¿qué contactos del candidato debe poder ver la empresa? → A: Todos
  los contactos vigentes del candidato se comparten automáticamente con la empresa derivada.
- Q: Si el candidato reemplaza su CV después de ser derivado, ¿qué versión debe seguir viendo la
  empresa en esa derivación? → A: La versión asociada a la derivación; el CV nuevo se usa solo en
  derivaciones posteriores.
- Q: ¿Desde qué evento deben contarse los 30 días sin respuesta empresarial y qué acciones deben
  modificar ese plazo? → A: Se cuentan desde la derivación; ninguna entrevista, contacto ni
  seguimiento pausa o reinicia el plazo.
- Q: Cuando se detecta un posible duplicado por DNI o correo, ¿qué decisiones debe poder registrar
  el administrador? → A: Usar o actualizar el perfil existente, corregir los datos y crear un perfil
  separado, o rechazar el alta; siempre con motivo e historial y nunca mediante fusión automática.
- Q: ¿Qué debe pasar con ofertas, postulaciones, derivaciones y acceso a CV cuando se suspende una
  cuenta de candidato o empresa? → A: Se bloquean la cuenta, las nuevas operaciones y el acceso
  empresarial a perfiles y CV; los casos existentes quedan para gestión administrativa y no se
  reactivan automáticamente. La acción debe estar destacada y exigir confirmación explícita.
- Q: ¿Debe exigirse correo electrónico para que candidatos y empresas se registren por su cuenta? →
  A: Sí; el autorregistro exige correo verificado y contraseña. El teléfono y otros contactos son
  adicionales, y los candidatos sin correo utilizan la atención presencial asistida.
- Q: ¿Qué debe ocurrir automáticamente cuando una oferta publicada alcanza su fecha de cierre? →
  A: Se cierra automáticamente, deja de ser pública y no acepta nuevas postulaciones; las
  participaciones existentes continúan para gestión administrativa y el cierre queda registrado.
- Q: ¿Cómo debe gestionarse la solicitud de un candidato para corregir o eliminar sus datos mientras
  la política de retención sigue pendiente? → A: Las correcciones se aplican directamente y una
  solicitud de eliminación archiva o desactiva el perfil de inmediato, sin revisión administrativa
  ni borrado permanente.
- Q: ¿Quién debe poder restaurar un perfil, empresa u oferta archivada y en qué estado debe quedar
  después de restaurarla? → A: Solo un administrador, registrando el motivo; el registro vuelve
  inactivo o en borrador y no reactiva automáticamente ofertas, accesos ni participaciones relacionadas.
- Q: ¿Cómo deben definirse “candidato activo” y “tiempo de cobertura” en las métricas del MVP? → A:
  Un candidato activo tiene perfil activo, está disponible, mantiene consentimiento vigente y fue
  actualizado en los últimos seis meses. Se miden por separado los días desde la publicación hasta
  la primera contratación confirmada y hasta completar todas las vacantes solicitadas; la cobertura
  total permanece pendiente mientras no se confirme ese número de contrataciones.
- Q: ¿Qué etapas puede omitir un administrador al avanzar una participación hacia la derivación? →
  A: Puede omitir revisión, preentrevista o preselección, respetando el orden de las etapas que sí
  realice y registrando el motivo de cada salto; la derivación nunca puede omitirse.
- Q: ¿Qué protocolo debe usarse para medir si candidatos y empresas completan sus recorridos en
  menos de 10 minutos? → A: Diez ejecuciones por rol, con datos ficticios preparados, conexión
  estable y al menos cinco personas distintas por rol; se mide sin ayuda técnica desde que se abre
  el registro hasta la postulación o el envío de la oferta.
- Q: ¿Qué conjunto de datos y puntos de inicio y fin deben usarse para medir la búsqueda
  administrativa y la generación de métricas y exportaciones? → A: Un conjunto ficticio de 500
  candidatos, 50 empresas, 100 ofertas y 1.000 participaciones. La búsqueda se mide desde abrir la
  pantalla hasta guardar la preselección; métricas y exportación, desde aplicar filtros hasta ver
  los conteos y completar la descarga.
- Q: ¿Con qué tamaños, zoom y tecnologías de apoyo debe comprobarse que los flujos críticos son
  accesibles? → A: En 360×800 y 1366×768, con zoom de 100 % y 200 %, usando solo teclado y exigiendo
  foco visible, ausencia de bloqueos y acceso a controles, validaciones y mensajes; además, un
  recorrido representativo por rol se verifica con NVDA.
- Q: ¿Cuáles son las cinco tareas críticas de usabilidad y qué debe contar como “primer intento”? →
  A: Completar perfil y postularse; crear y enviar una oferta; moderar una oferta; buscar,
  preseleccionar y derivar; y registrar el resultado final. Primer intento significa hacerlo sin
  ayuda externa ni reiniciar, aunque se permite corregir errores usando solo los mensajes de la interfaz.

### Session 2026-09-20

- Q: Si un candidato retira una postulación después de ser derivado o retira su consentimiento
  general, ¿cuándo debe perder la empresa el acceso al perfil, los contactos y el CV? → A: El acceso
  empresarial se revoca inmediatamente en ambos casos, se conserva el historial administrativo y
  no se restaura automáticamente.
- Q: ¿Cómo debe evaluarse el criterio “4 de 5 tareas en el primer intento” con usuarios
  representativos? → A: Con cohortes por rol de al menos cinco candidatos, cinco representantes de
  empresas y los cuatro administradores previstos o personal municipal equivalente; cada persona
  realiza solo tareas de su rol, cada tipo de tarea exige al menos 80 % de éxito en el primer intento
  y el criterio global aprueba cuando cumplen al menos cuatro de los cinco tipos de tarea.
- Q: ¿Quiénes deben ejecutar las mediciones administrativas de SC-003 y SC-008 y qué preparación
  pueden recibir antes del cronómetro? → A: Un único administrador de prueba, sin capacitación ni
  práctica previa, que recibe solamente la descripción de la tarea antes de cada medición.
- Q: ¿En qué condiciones debe ejecutarse el cronómetro de SC-003 y SC-008 para que los resultados
  administrativos sean comparables? → A: En el mismo entorno de demostración, con el conjunto
  ficticio restablecido, conexión estable, sin recorridos de calentamiento y registrando las
  condiciones de la ejecución.
- Q: Cuando una participación finaliza por contratación, no selección, cancelación o falta de
  respuesta empresarial, ¿qué debe ocurrir con el acceso de la empresa al perfil, los contactos y
  el CV del candidato? → A: El acceso se mantiene si se confirma la contratación y se revoca
  inmediatamente en los demás resultados finales; el acceso conservado sigue sujeto al retiro de
  consentimiento, la suspensión, el archivo y la política de retención pendiente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Intermediación municipal de una búsqueda laboral (Priority: P1)

Como integrante de la Oficina de Empleo, necesito gestionar una búsqueda desde que una oferta se
presenta para revisión hasta que se confirma su resultado, para preseleccionar perfiles adecuados,
decidir qué candidatos se derivan y poder explicar qué ocurrió en cada caso.

**Why this priority**: La intermediación municipal es el propósito central del producto y evita que
el portal se convierta en un mercado directo de datos personales.

**Independent Test**: Puede probarse con una empresa, una oferta y varios perfiles ficticios,
verificando que el personal modere la oferta, busque candidatos, registre una preentrevista, derive
solo los seleccionados y confirme un resultado con historial completo.

**Acceptance Scenarios**:

1. **Given** una empresa con una oferta enviada a revisión, **When** un administrador solicita
   correcciones, la aprueba o la rechaza, **Then** la oferta adopta el estado correspondiente,
   registra la decisión y solo se publica cuando fue aprobada.
2. **Given** una oferta publicada y candidatos activos, **When** un administrador filtra perfiles y
   registra su evaluación, **Then** puede identificar una preselección sin exponer esos perfiles a
   la empresa.
3. **Given** un candidato preseleccionado con perfil activo y consentimiento general vigente,
   **When** un administrador lo deriva aunque no exista una postulación previa, **Then** la empresa
   de esa oferta puede ver el perfil laboral, todos los contactos vigentes y la versión del CV
   asociada a esa derivación, pero no su DNI, domicilio, notas internas ni datos del padrón general.
4. **Given** una derivación con entrevista o seguimiento posterior, **When** la empresa comunica un
   resultado, **Then** solo un administrador puede registrar el estado final y queda un historial
   con fechas, actores y cambios de estado.
5. **Given** una participación que no requiere todas las etapas internas, **When** un administrador
   omite revisión, preentrevista o preselección, **Then** registra el motivo, conserva el orden de las
   etapas realizadas y efectúa siempre una derivación explícita antes de exponer datos a la empresa.

---

### User Story 2 - Autogestión del candidato (Priority: P1)

Como persona que busca empleo, necesito registrarme, mantener un perfil con varias categorías,
presentar mi CV y postularme a ofertas publicadas, para participar en distintas búsquedas sin perder
el acompañamiento de la Oficina de Empleo.

**Why this priority**: Organizar perfiles y postulaciones reduce la fragmentación actual y permite
que candidatos antiguos sigan siendo localizables.

**Independent Test**: Puede probarse registrando un candidato ficticio, completando su perfil,
seleccionando varias categorías, cargando un CV válido y postulándose a dos ofertas publicadas.

**Acceptance Scenarios**:

1. **Given** una persona con correo que no tiene cuenta, **When** registra su nombre, DNI, correo y
   contraseña y verifica el correo, **Then** puede iniciar sesión y acceder a su panel aunque su
   perfil laboral todavía no esté activo.
2. **Given** un candidato autenticado, **When** completa desde su panel la localidad, categorías e
   intereses, habilidades o experiencia resumida, disponibilidad y CV y acepta el consentimiento
   aprobado, **Then** se activa su perfil, queda registrada la aceptación para el tratamiento
   laboral y futuras derivaciones, y solo modifica su propia información.
3. **Given** un perfil que cumple los requisitos aprobados para postularse, **When** el candidato
   elige dos ofertas publicadas, **Then** puede crear una postulación independiente para cada una.
4. **Given** una postulación activa, **When** el candidato decide retirarla o desactivar su
   disponibilidad, **Then** el cambio queda registrado sin eliminar su historia laboral.
5. **Given** una participación en curso, **When** el candidato consulta su estado, **Then** ve la
   recepción y, cuando exista, el resultado final, pero no las etapas de evaluación ni las notas
   internas.
6. **Given** un candidato autenticado, **When** corrige sus datos propios o solicita la eliminación
   de su perfil, **Then** la corrección se aplica directamente o el perfil se archiva de inmediato,
   respectivamente, sin borrar su historial de manera permanente.

---

### User Story 3 - Gestión de empresa y ofertas (Priority: P1)

Como representante de una empresa, necesito registrar la organización, presentar ofertas y recibir
únicamente los perfiles derivados por el municipio, para cubrir vacantes dentro de un proceso
controlado y trazable.

**Why this priority**: Las ofertas originan la demanda laboral, pero requieren moderación para
preservar la confianza, la privacidad y el rol municipal.

**Independent Test**: Puede probarse registrando una empresa ficticia, creando un borrador,
enviándolo a revisión, respondiendo a una solicitud de cambios y consultando solo una derivación
autorizada.

**Acceptance Scenarios**:

1. **Given** una empresa registrada mediante correo verificado y contraseña, y autenticada con
   nombre, CUIT, responsable, contacto, actividad y localidad, **When** guarda un borrador de oferta,
   **Then** puede editarlo sin publicarlo directamente.
2. **Given** un borrador completo, **When** la empresa lo envía a revisión, **Then** conoce su estado
   de moderación y no puede hacerlo público por sí misma.
3. **Given** una solicitud municipal de correcciones, **When** la empresa actualiza y reenvía la
   oferta, **Then** el nuevo envío vuelve a revisión y conserva el historial anterior.
4. **Given** candidatos derivados a una oferta propia, **When** la empresa consulta la búsqueda,
   **Then** accede solo a esos perfiles y puede comunicar el resultado de sus entrevistas sin ver
   notas internas ni modificar directamente el estado final.
5. **Given** una oferta publicada que alcanza su fecha de cierre, **When** finaliza esa fecha,
   **Then** la oferta se cierra automáticamente, deja de mostrarse públicamente y no acepta nuevas
   postulaciones, sin cerrar las participaciones existentes.

---

### User Story 4 - Atención presencial asistida (Priority: P2)

Como administrador que atiende a una persona presencialmente, necesito crear y mantener su perfil y
acompañarla en el proceso, para que la falta de acceso o habilidades digitales no la excluya.

**Why this priority**: La inclusión presencial es una restricción constitucional y conserva un
canal de atención que ya utiliza la comunidad.

**Independent Test**: Puede probarse creando un perfil asistido sin credenciales públicas,
detectando un posible duplicado y gestionando su participación con la misma privacidad e historial
que un perfil autogestionado.

**Acceptance Scenarios**:

1. **Given** una persona atendida en la oficina, **When** un administrador intenta crear su perfil,
   **Then** el sistema comprueba posibles duplicados antes de guardar información nueva y exige una
   resolución administrativa con motivo cuando encuentra una coincidencia.
2. **Given** un perfil asistido válido, **When** el administrador actualiza categorías,
   disponibilidad, CV o contactos, **Then** cada acción queda asociada al administrador responsable.
3. **Given** un perfil asistido que luego deba vincularse a una cuenta personal, **When** se ejecute el
   proceso aprobado para reclamarlo, **Then** no se crea un candidato duplicado ni se pierde su
   historial.
4. **Given** un perfil asistido sin CV PDF, **When** el personal lo guarda o actualiza, **Then** puede
   continuar la atención interna, pero no puede derivarlo a una empresa hasta incorporar un PDF
   válido.

---

### User Story 5 - Importación controlada del padrón existente (Priority: P2)

Como administrador, necesito importar candidatos desde un CSV revisado, para incorporar el padrón
histórico sin reescribirlo manualmente ni introducir datos inválidos o duplicados sin control.

**Why this priority**: La información histórica es necesaria para que el nuevo sistema resuelva el
problema operativo desde su adopción, pero su calidad exige controles previos.

**Independent Test**: Puede probarse con un CSV completamente ficticio que contenga filas válidas,
errores y duplicados, verificando la previsualización y que ninguna escritura parcial quede oculta.

**Acceptance Scenarios**:

1. **Given** un archivo basado en el mapeo aprobado, **When** un administrador lo previsualiza,
   **Then** ve qué filas serían aceptadas, rechazadas o marcadas como posibles duplicados antes de
   confirmar.
2. **Given** un archivo con errores, **When** la validación finaliza, **Then** se muestran errores
   accionables sin incorporar silenciosamente filas inválidas.
3. **Given** una importación confirmada, **When** ocurre un fallo, **Then** el resultado completo es
   atómico o queda en un estado recuperable y auditable.

---

### User Story 6 - Seguimiento operativo y métricas básicas (Priority: P3)

Como administrador, necesito consultar actividad, contactos, estados y métricas básicas, para dar
seguimiento a las búsquedas y responder solicitudes operativas sin contar planillas manualmente.

**Why this priority**: Consolida la información que hoy está dispersa y permite evaluar el trabajo
de la oficina, después de asegurar los flujos transaccionales centrales.

**Independent Test**: Puede probarse con datos ficticios de varios períodos y categorías,
verificando los conteos, filtros y una exportación administrativa que no sea pública.

**Acceptance Scenarios**:

1. **Given** actividad registrada en un período, **When** un administrador consulta el panel,
   **Then** obtiene conteos coherentes de candidatos, empresas, ofertas, postulaciones,
   preentrevistas, derivaciones y resultados.
2. **Given** contactos por teléfono, correo, WhatsApp o atención presencial, **When** el personal
   revisa un caso, **Then** puede reconstruir la secuencia de seguimiento sin exponer notas internas
   a candidatos o empresas.
3. **Given** un conjunto filtrado de datos administrativos, **When** un administrador solicita una
   exportación genérica, **Then** recibe un CSV coherente con los filtros y no accesible al público.
4. **Given** una oferta publicada con una o más vacantes, **When** un administrador consulta sus
   tiempos, **Then** ve por separado los días hasta la primera contratación confirmada y, únicamente
   cuando se cubren todas las vacantes solicitadas, los días hasta la cobertura total.

### Edge Cases

- Un registro o importación coincide por DNI o correo con un candidato existente; se bloquea el alta
  hasta que un administrador, dejando motivo e historial, decida usar o actualizar el perfil
  existente, corregir los datos y crear uno separado por tratarse de un falso positivo, o rechazar
  el alta. El sistema nunca fusiona perfiles automáticamente.
- Una cuenta de candidato está suspendida; no puede realizar acciones privadas, queda excluida de
  búsquedas activas y de nuevas postulaciones o derivaciones, y se revoca temporalmente el acceso
  empresarial a sus perfiles y CV ya derivados. Una empresa suspendida tampoco puede realizar
  acciones privadas; sus ofertas dejan de admitir nuevas postulaciones o derivaciones y pierde el
  acceso a perfiles y CV derivados. En ambos casos, las participaciones existentes permanecen para
  gestión administrativa y conservan su historial sin convertirse automáticamente en un resultado
  final. La reactivación de la cuenta no reactiva por sí sola ofertas, derivaciones ni otros registros.
- Una empresa intenta publicar directamente, ver el padrón general o consultar una derivación de
  otra empresa; la acción debe rechazarse sin revelar datos.
- Una oferta alcanza su fecha de cierre mientras existen postulaciones activas; se cierra
  automáticamente, deja de estar publicada y de recibir nuevas postulaciones, pero las existentes
  conservan su historia y continúan para tratamiento administrativo.
- Un candidato actualiza su perfil o CV mientras participa en varias búsquedas; cada derivación
  conserva la versión del CV compartida originalmente y el documento nuevo solo se usa en
  derivaciones posteriores.
- Un perfil supera el período aprobado de vigencia sin confirmación; no se elimina y deja de aparecer
  por defecto entre candidatos activos hasta que se actualice.
- Un candidato se retira después de ser preseleccionado o derivado; el retiro se registra y la
  empresa pierde inmediatamente el acceso al perfil, los contactos y el CV de esa derivación. La
  revocación conserva el historial administrativo y no se revierte automáticamente.
- Un candidato retira el consentimiento general; se impiden nuevos tratamientos y derivaciones que
  dependan de ese consentimiento y se revoca inmediatamente todo acceso empresarial vigente a su
  perfil, contactos y CV, sin borrar el historial que deba conservarse legítimamente ni restaurar
  el acceso de forma automática.
- Un candidato solicita eliminar sus datos; el perfil se archiva o desactiva inmediatamente sin
  revisión administrativa, deja de participar en nuevas búsquedas, postulaciones y derivaciones, y
  conserva de forma recuperable el historial sujeto a la política de retención pendiente.
- Un administrador restaura un perfil, empresa u oferta archivada; debe registrar el motivo y el
  registro vuelve inactivo o en borrador para revisión, sin reactivar automáticamente ofertas,
  accesos empresariales ni participaciones relacionadas.
- Una empresa no comunica un resultado; el caso permanece pendiente durante 30 días exactos desde
  la derivación y luego se cierra automáticamente como sin respuesta empresarial, sin registrarlo
  como contratación o no selección. Entrevistas, contactos y seguimientos no pausan ni reinician el
  plazo y el acceso empresarial al perfil, los contactos y el CV se revoca al producirse el cierre.
  Si la empresa responde más tarde, puede comunicar el resultado sin recuperar ese acceso y un
  administrador puede registrar el resultado real sin eliminar el cierre anterior del historial.
- Una participación finaliza como no seleccionada o cancelada; se revoca inmediatamente el acceso
  empresarial al perfil, los contactos y el CV. Si finaliza con una contratación confirmada, la
  empresa conserva el acceso mientras no se retire el consentimiento ni se suspenda o archive una
  cuenta o registro relacionado, sujeto además a la política de retención pendiente.
- Un CV tiene tipo o tamaño no admitido, está dañado o intenta contener contenido ejecutable; se
  rechaza con un mensaje claro sin sustituir el CV vigente.
- Un perfil asistido todavía no tiene CV PDF; puede mantenerse y evaluarse internamente, pero todo
  intento de derivación empresarial debe bloquearse hasta incorporar un documento válido.
- Un candidato no dispone de correo electrónico o no puede completar el autorregistro; el personal
  puede crear y mantener un perfil asistido sin credenciales públicas, conservando las mismas reglas
  de consentimiento, privacidad, duplicados e historial.
- Un CSV contiene encabezados desconocidos, filas incompletas, categorías sin mapear o una mezcla de
  filas válidas e inválidas; la previsualización debe explicar el impacto antes de confirmar.
- Una acción falla después de que el usuario la solicita; el sistema evita estados parciales ocultos
  y muestra un mensaje en español que no revela datos personales ni detalles internos.
- Dos administradores actúan sobre el mismo caso; el historial debe conservar quién realizó cada
  cambio y permitir detectar el estado vigente.
- Un administrador omite una etapa interna de evaluación; el sistema exige un motivo, impide volver
  a una etapa anterior incompatible y nunca permite exponer datos empresariales sin una derivación
  explícita posterior.

## Requirements *(mandatory)*

### Functional Requirements

#### Acceso y permisos

- **FR-001**: El sistema DEBE permitir que candidatos y empresas se registren por su cuenta mediante
  correo electrónico verificado y contraseña, inicien y cierren sesión. El teléfono y otros datos de
  contacto PUEDEN agregarse, pero NO DEBEN sustituir el correo como credencial de autorregistro.
- **FR-002**: El sistema DEBE permitir la recuperación segura de acceso para candidatos, empresas y
  administradores.
- **FR-003**: El sistema DEBE admitir cuatro cuentas administrativas individuales, con los mismos
  permisos completos, creadas fuera del registro público y sin credenciales compartidas.
- **FR-004**: Cada acción y registro privado DEBE ser accesible únicamente para los roles y
  propietarios autorizados, incluso cuando alguien intente acceder fuera de la navegación normal.
- **FR-005**: Los administradores DEBEN poder suspender y reactivar cuentas de candidatos y empresas
  sin destruir su historial. La acción de suspensión DEBE presentarse de forma visualmente destacada
  y requerir una confirmación explícita. Una cuenta suspendida NO DEBE realizar acciones privadas ni
  participar en nuevas postulaciones o derivaciones; además, se DEBE revocar mientras dure la
  suspensión cualquier acceso empresarial a perfiles y CV relacionados. Los casos existentes DEBEN
  permanecer disponibles para gestión administrativa, sin adoptar automáticamente un resultado
  final, y reactivar la cuenta NO DEBE reactivar automáticamente los registros relacionados.
- **FR-006**: Las personas no autenticadas DEBEN poder consultar únicamente información pública y
  ofertas vigentes publicadas; postularse DEBE requerir una cuenta de candidato.

#### Perfiles de candidatos

- **FR-010**: El autorregistro inicial de un candidato DEBE solicitar nombre completo, DNI, correo
  electrónico, contraseña y verificación del correo; una vez autenticado, el candidato DEBE completar
  desde su panel la localidad, múltiples categorías e intereses, habilidades o experiencia resumida,
  disponibilidad y CV antes de activar su perfil laboral. Los candidatos sin correo DEBEN poder ser
  atendidos mediante un perfil asistido creado por un administrador.
- **FR-011**: Un administrador DEBE poder crear y mantener un perfil asistido para una persona
  atendida presencialmente, identificándose como responsable de sus acciones, aunque todavía no
  tenga un CV PDF.
- **FR-012**: Un candidato DEBE poder seleccionar múltiples categorías ocupacionales e intereses
  laborales de un catálogo controlado y registrar habilidades según las reglas aprobadas.
- **FR-013**: Un candidato o administrador autorizado DEBE poder incorporar y reemplazar un CV en el
  formato aprobado, sujeto a validación de tipo, tamaño e integridad antes de aceptarlo.
- **FR-014**: El sistema DEBE detectar coincidencias potenciales por DNI y correo y bloquear el alta
  hasta una resolución administrativa. El administrador DEBE poder usar o actualizar el perfil
  existente, corregir los datos y crear uno separado cuando documente un falso positivo, o rechazar
  el alta; cada decisión DEBE conservar actor, fecha y motivo, y el sistema NO DEBE fusionar perfiles
  automáticamente.
- **FR-015**: Los administradores DEBEN poder conocer la disponibilidad y vigencia del perfil; los
  perfiles sin confirmar o actualizar durante seis meses DEBEN marcarse para actualización y quedar
  fuera de los resultados activos predeterminados sin ser eliminados.
- **FR-016**: El sistema DEBE permitir que un candidato retire una postulación activa, desactive su
  disponibilidad y corrija directamente sus propios datos. Cuando solicite la eliminación, el
  sistema DEBE archivar o desactivar su perfil de inmediato y sin revisión administrativa, impedir
  nuevas búsquedas, postulaciones y derivaciones, y conservar el historial de forma recuperable
  mientras no exista una política de retención aprobada. Si la postulación retirada ya tenía una
  derivación, el sistema DEBE revocar inmediatamente el acceso empresarial al perfil, los contactos
  y el CV, conservar el historial administrativo y NO DEBE restaurar ese acceso automáticamente.
- **FR-017 (Should)**: El sistema DEBERÍA permitir vincular un perfil asistido con la cuenta personal
  del mismo candidato mediante un proceso aprobado que evite duplicados y preserve todo el
  historial.

#### Empresas y ofertas

- **FR-020**: Una empresa DEBE autorregistrarse con correo electrónico verificado y contraseña, y
  registrar y mantener nombre, CUIT, persona responsable, al menos un dato de contacto, actividad y
  localidad para habilitar su perfil, sin presentar documentación de respaldo ni pasar por
  verificación documental en el MVP.
- **FR-021**: Una empresa DEBE poder crear, guardar y editar borradores de ofertas con título,
  tareas, categorías, cantidad de vacantes, ubicación, modalidad, horario, tipo de contratación,
  requisitos y fecha de cierre; salario y beneficios PUEDEN informarse de manera opcional. Al
  finalizar la fecha de cierre de una oferta publicada, el sistema DEBE cerrarla automáticamente y
  registrar el cambio con actor de sistema y fecha.
- **FR-022**: Una empresa DEBE enviar una oferta a revisión municipal y consultar su estado, pero no
  DEBE poder publicarla directamente.
- **FR-023**: Un administrador DEBE poder aprobar, solicitar correcciones, rechazar, pausar, cerrar o
  cancelar una oferta, registrando la decisión y su responsable.
- **FR-024**: Solo las ofertas aprobadas, publicadas y no vencidas DEBEN ser visibles públicamente y
  aceptar nuevas postulaciones. El cierre automático NO DEBE cerrar ni eliminar las participaciones
  existentes, que continúan disponibles para gestión administrativa.
- **FR-025**: Los administradores DEBEN poder suspender o reactivar empresas y ofertas abusivas,
  engañosas, ilegales, duplicadas o inapropiadas, conservando su historial. La suspensión de una
  empresa DEBE impedir nuevas postulaciones y derivaciones en sus ofertas y revocar temporalmente su
  acceso a perfiles y CV ya derivados; la reactivación de la empresa NO DEBE reactivar sus ofertas
  ni demás registros relacionados de manera automática.
- **FR-026**: La empresa DEBE ver exclusivamente sus propios perfiles, ofertas, estados de
  moderación y candidatos derivados a una oferta propia.

#### Postulaciones, preselección y derivación

- **FR-030**: Un candidato autenticado con el perfil y CV exigidos DEBE poder postularse a múltiples
  ofertas publicadas, con un seguimiento independiente por oferta.
- **FR-031**: Un administrador DEBE poder asociar y derivar a un candidato activo con una
  oportunidad aunque no exista una postulación previa, siempre que su consentimiento general
  continúe vigente; no se requiere una confirmación específica de interés para cada oferta.
- **FR-032**: Los administradores DEBEN poder buscar y filtrar candidatos por categorías,
  habilidades, disponibilidad, ubicación y vigencia del perfil.
- **FR-033**: Los administradores DEBEN poder registrar preentrevistas, contactos, notas internas,
  evaluaciones y decisiones de preselección.
- **FR-034**: Solo un administrador DEBE poder decidir y registrar la derivación de un candidato a
  una empresa para una oferta concreta; un perfil asistido NO DEBE poder derivarse hasta que cuente
  con un CV PDF válido.
- **FR-035**: Una empresa NO DEBE poder explorar el padrón general ni ver información completa de un
  candidato antes de una derivación municipal a una oferta propia.
- **FR-036**: Tras una derivación, la empresa DEBE ver el perfil laboral, todos los contactos
  vigentes del candidato y la versión del CV asociada a esa derivación; los contactos se comparten
  automáticamente y reemplazar el CV solo afecta derivaciones posteriores. La empresa NO DEBE ver
  su DNI, domicilio ni notas internas. El acceso DEBE revocarse inmediatamente si el resultado final
  es no selección, cancelación o falta de respuesta empresarial. Si un administrador confirma una
  contratación, el acceso DEBE mantenerse sujeto al consentimiento vigente, al estado activo de
  las cuentas y registros relacionados entendido como ausencia de suspensión o archivo, y a la
  política de retención pendiente. La indisponibilidad laboral o la necesidad de actualizar el
  perfil NO DEBEN revocar por sí solas el acceso de una contratación confirmada.
- **FR-037**: La progresión de cada participación DEBE distinguir recepción, revisión,
  preentrevista, preselección, derivación, entrevista empresarial y los resultados finales
  aprobados. Un administrador PUEDE omitir revisión, preentrevista o preselección al avanzar, siempre
  que respete el orden de las etapas realizadas y registre el motivo de cada salto. La derivación
  DEBE ser siempre explícita, solo administrativa y anterior a cualquier acceso empresarial a los
  datos del candidato.
- **FR-038**: Los resultados finales DEBEN distinguir contratación, no selección, retiro,
  cancelación y cierre por falta de respuesta empresarial. El retiro, la no selección, la
  cancelación y la falta de respuesta DEBEN revocar inmediatamente el acceso empresarial a los
  datos derivados; únicamente la contratación confirmada DEBE conservarlo bajo las condiciones de
  FR-036.
- **FR-039**: La empresa DEBE poder comunicar el resultado de una entrevista, pero solo un
  administrador DEBE poder registrar el estado final de la participación según esa comunicación.
- **FR-040**: Cuando no exista respuesta empresarial, el caso DEBE permanecer pendiente durante 30
  días contados desde la derivación y luego cerrarse automáticamente como sin respuesta empresarial,
  sin asignar contratación ni no selección. Entrevistas, contactos y seguimientos NO DEBEN pausar ni
  reiniciar el plazo. Si llega una respuesta posterior, un administrador DEBE poder cambiar el
  estado al resultado real, conservando ambas transiciones en el historial.
- **FR-041**: Un candidato no seleccionado DEBE poder continuar activo y participar en otras
  búsquedas.
- **FR-042 (Should)**: El personal DEBERÍA poder registrar una nota interna de texto libre sobre
  capacitaciones u orientaciones vinculadas con un candidato, sin catálogo, inscripciones ni
  recomendaciones automáticas.

#### Historial, contactos y privacidad

- **FR-050**: Cada cambio material de estado o acción administrativa DEBE conservar fecha, actor,
  estado anterior, estado nuevo y motivo cuando lo exija la regla aprobada.
- **FR-051**: El personal DEBE poder registrar contactos por teléfono, correo, WhatsApp y atención
  presencial sin requerir integración directa con servicios de mensajería.
- **FR-052**: Los administradores DEBEN poder escribir notas internas sobre postulantes; esas notas y
  cualquier razón sensible DEBEN ser visibles solo para administradores.
- **FR-053**: El candidato DEBE ver la recepción y el resultado final de su participación, pero no
  las etapas internas de evaluación. La empresa DEBE ver el estado de moderación de sus propias
  ofertas y los candidatos derivados a ellas, pero no las notas ni razones internas.
- **FR-054**: Los registros de negocio DEBEN archivarse o desactivarse de forma recuperable y NO
  DEBEN eliminarse permanentemente de manera automática mientras la Municipalidad no apruebe una
  política de retención. La solicitud de eliminación de un candidato DEBE archivar o desactivar su
  perfil inmediatamente, sin revisión administrativa, y conservar el historial relacionado. Solo
  un administrador DEBE poder restaurar un registro archivado, registrando el motivo; el registro
  restaurado DEBE quedar inactivo o en borrador para revisión y NO DEBE reactivar automáticamente
  ofertas, accesos empresariales ni participaciones relacionadas.
- **FR-055**: Al activar un perfil de candidato, incluido un perfil asistido, el sistema DEBE
  presentar y registrar el consentimiento aprobado para el tratamiento laboral de sus datos y su
  entrega en futuras derivaciones municipales; no se requiere una aceptación adicional para cada
  derivación mientras ese consentimiento continúe vigente. Retirar el consentimiento DEBE impedir
  nuevos tratamientos y derivaciones dependientes de él, revocar inmediatamente el acceso
  empresarial vigente al perfil, los contactos y el CV y conservar el historial administrativo sin
  restaurar ese acceso automáticamente.
- **FR-056**: Los errores y rechazos DEBEN comunicarse en español de forma accionable sin revelar
  credenciales, datos personales, notas internas ni detalles operativos sensibles.
- **FR-057 (Should)**: La interfaz DEBERÍA ofrecer plantillas de mensaje o enlaces seguros para
  facilitar contactos iniciados por el personal, sin enviar mensajes mediante una integración
  directa.

#### Importación y reportes

- **FR-060**: Los administradores DEBEN poder importar candidatos desde un CSV construido según un
  mapeo escrito y aprobado del archivo histórico.
- **FR-061**: Antes de confirmar una importación, el sistema DEBE mostrar una previsualización con
  filas aceptables, errores de validación, categorías sin mapear y posibles duplicados.
- **FR-062**: Una importación confirmada DEBE completarse íntegramente o dejar un resultado
  explícitamente recuperable; nunca DEBE ocultar escrituras parciales.
- **FR-063**: Cada importación DEBE conservar el responsable, la fecha, el archivo o referencia de
  origen, el resultado y un resumen de filas aceptadas, rechazadas y observadas.
- **FR-064**: Los administradores DEBEN poder consultar conteos de candidatos activos, empresas,
  ofertas por estado, postulaciones, preentrevistas, derivaciones, contrataciones, no selecciones y
  retiros, filtrados al menos por período y por categoría cuando corresponda. Para estas métricas,
  un candidato activo DEBE tener el perfil activo, estar disponible, mantener consentimiento vigente
  y haber confirmado o actualizado su perfil durante los últimos seis meses.
- **FR-065**: Los administradores DEBEN poder exportar a CSV los datos operativos autorizados y
  filtrados; las exportaciones NO DEBEN estar disponibles públicamente.
- **FR-066**: Los formatos oficiales adicionales de informes NO DEBEN considerarse definidos hasta
  que la Oficina de Empleo o la Municipalidad entregue y apruebe sus requisitos.
- **FR-067 (Should)**: Las métricas DEBERÍAN incluir tendencias por categoría y dos tiempos por
  oferta: días desde su publicación hasta la primera contratación confirmada por un administrador y
  días desde su publicación hasta que las contrataciones confirmadas igualen la cantidad de vacantes
  solicitadas. La cobertura total DEBE permanecer pendiente o no calculable mientras no se complete
  ese número de contrataciones.

#### Experiencia y protección transversal

- **FR-070**: Todos los flujos principales DEBEN poder completarse en interfaces responsive, con
  teclado y con etiquetas, instrucciones, validaciones, estados vacíos y errores claros en español.
- **FR-071**: Las acciones privadas DEBEN rechazar accesos no autorizados sin depender únicamente de
  que un control visual esté oculto.
- **FR-072**: Los archivos cargados DEBEN validarse antes de ser aceptados y NO DEBEN poder ejecutarse
  como parte del producto.
- **FR-073**: Los datos usados en desarrollo, pruebas, demostraciones y capturas DEBEN ser ficticios o
  estar correctamente anonimizados.

### Key Entities *(include if feature involves data)*

- **Cuenta**: Identidad individual de acceso para candidato, representante de empresa o
  administrador, con rol, estado de acceso y referencias de recuperación; el autorregistro de
  candidatos y empresas utiliza correo verificado y contraseña.
- **Perfil de candidato**: Información laboral estructurada, categorías, habilidades,
  disponibilidad, localidad, vigencia, origen autogestionado o asistido y relación con su CV; se
  completa desde el panel personal después del registro inicial.
- **CV**: Documento laboral protegido y versionado, con vigencia, validaciones y relación con el
  candidato; cada derivación conserva la versión que habilita para la empresa correspondiente.
- **Perfil de empresa**: Organización identificada por nombre y CUIT, con persona responsable,
  contacto, actividad y localidad; no implica verificación documental en el MVP.
- **Categoría u ocupación**: Entrada del catálogo controlado utilizada para clasificar candidatos y
  ofertas, cuya versión final requiere validación de la Oficina de Empleo.
- **Oferta laboral**: Necesidad de contratación con título, tareas, categorías, vacantes, ubicación,
  modalidad, horario, tipo de contratación, requisitos y fecha de cierre; pertenece a una empresa y
  está sujeta a moderación, publicación, pausa, cierre municipal y cierre automático por vencimiento.
- **Postulación o participación**: Relación entre candidato y oferta, iniciada por el candidato o por
  una asociación administrativa autorizada, con estado e historial propios.
- **Preentrevista y preselección**: Evaluación municipal previa a cualquier entrega de datos a una
  empresa, con notas y decisión interna.
- **Derivación**: Autorización municipal que vincula un candidato con una oferta y habilita a la
  empresa correspondiente a consultar su perfil laboral, todos sus contactos vigentes y la versión
  de CV asociada a esa derivación, excluyendo DNI, domicilio y notas internas.
  El retiro posterior de la postulación o del consentimiento general revoca inmediatamente ese
  acceso sin borrar el historial administrativo ni permitir su restauración automática. La no
  selección, cancelación o falta de respuesta también lo revocan; una contratación confirmada debe
  conservarlo mientras se mantengan las condiciones de FR-036.
- **Entrevista y resultado**: Información comunicada por la empresa o recabada por el personal; solo
  un administrador registra el estado final de la participación.
- **Evento de contacto**: Registro de una comunicación telefónica, por correo, WhatsApp o presencial
  asociada a un caso y a su responsable.
- **Evento de historial o auditoría**: Evidencia inalterada de una acción o transición material, con
  actor, fecha, estado anterior, estado nuevo y motivo cuando corresponda.
- **Lote de importación**: Operación controlada sobre un CSV, con mapeo, previsualización,
  validaciones, duplicados, resultado y responsable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En 10 ejecuciones de aceptación realizadas por al menos 5 personas distintas como
  candidatos, con datos ficticios preparados y conexión estable, al menos 9 DEBEN registrarse,
  completar un perfil válido y postularse a una oferta publicada en menos de 10 minutos sin ayuda
  técnica. El cronómetro comienza al abrir el formulario de registro y termina al confirmarse la
  postulación.
- **SC-002**: En 10 ejecuciones de aceptación realizadas por al menos 5 personas distintas como
  representantes de empresas, con datos ficticios preparados y conexión estable, al menos 9 DEBEN
  registrar su organización, preparar una oferta completa y enviarla a revisión en menos de 10
  minutos sin ayuda técnica. El cronómetro comienza al abrir el formulario de registro y termina al
  confirmarse el envío de la oferta.
- **SC-003**: Sobre un conjunto reproducible de 500 candidatos, 50 empresas, 100 ofertas y 1.000
  participaciones ficticias, un único administrador de prueba, sin capacitación ni práctica previa
  y habiendo recibido solamente la descripción de la tarea, DEBE localizar candidatos mediante los
  filtros definidos, registrar una preentrevista y guardar una preselección en menos de 5 minutos.
  La medición DEBE realizarse en el mismo entorno de demostración, con el conjunto ficticio
  restablecido, conexión estable, sin recorridos de calentamiento y registrando las condiciones de
  ejecución. El cronómetro comienza al abrir la pantalla de búsqueda y termina al confirmarse la
  preselección.
- **SC-004**: El 100 % de las ofertas no aprobadas permanece fuera de la consulta pública y no acepta
  postulaciones durante las pruebas de permisos.
- **SC-005**: El 100 % de los intentos de una empresa por consultar el padrón general, otra empresa o
  candidatos no derivados es rechazado sin exponer información personal.
- **SC-006**: El 100 % de las transiciones y acciones administrativas críticas probadas conserva un
  historial identificable de actor, fecha y cambio realizado.
- **SC-007**: En archivos de prueba, el 100 % de filas CSV inválidas o potencialmente duplicadas se
  identifica antes de confirmar, y ningún fallo de importación deja datos parciales ocultos.
- **SC-008**: Sobre el mismo conjunto reproducible, un único administrador de prueba, sin
  capacitación ni práctica previa y habiendo recibido solamente la descripción de la tarea, DEBE
  obtener los conteos operativos básicos y completar una exportación filtrada en menos de 30
  segundos. La medición DEBE utilizar el mismo entorno de demostración y las mismas condiciones
  definidas en SC-003, con el conjunto ficticio restablecido antes de comenzar. El cronómetro
  comienza al aplicar los filtros de período y categoría y termina cuando los conteos están visibles
  y la descarga finalizó.
- **SC-009**: Los recorridos críticos de candidato, empresa y administración DEBEN completarse en
  tamaños de 360×800 y 1366×768, con zoom de 100 % y 200 %, usando únicamente teclado, foco visible y
  sin bloqueos, con todos los controles, validaciones y mensajes disponibles. Además, al menos un
  recorrido representativo de cada rol DEBE verificarse con NVDA.
- **SC-010**: Usuarios de prueba representativos DEBEN completar al menos 4 de estas 5 tareas en el
  primer intento: completar un perfil de candidato y postularse; crear y enviar una oferta; moderar
  una oferta; buscar, preseleccionar y derivar un candidato; y registrar el resultado final. Primer
  intento significa completar la tarea sin ayuda externa ni reiniciarla; corregir un error usando
  únicamente los mensajes de la interfaz continúa siendo parte del mismo intento. Todo error DEBE
  presentar un mensaje claro en español que permita corregirlo. La evaluación DEBE incluir cohortes
  separadas de al menos cinco candidatos, cinco representantes de empresas y los cuatro
  administradores previstos o personal municipal equivalente. Cada participante DEBE realizar
  únicamente las tareas correspondientes a su rol. Un tipo de tarea se considera aprobado cuando
  al menos el 80 % de su cohorte lo completa en el primer intento, y SC-010 se considera cumplido
  cuando aprueban al menos cuatro de los cinco tipos de tarea.

## Assumptions

- El MVP está destinado inicialmente a cuatro empleados de la Oficina de Empleo con iguales
  permisos administrativos y cuentas individuales.
- La demostración y las pruebas utilizan únicamente información ficticia o anonimizada; incorporar
  datos municipales reales requiere autorizaciones y políticas todavía pendientes.
- La verificación documental de empresas, el ranking automático, la inteligencia artificial de
  emparejamiento, la integración directa con WhatsApp, el constructor completo de CV, las
  recomendaciones automáticas de cursos, los roles administrativos adicionales y la analítica
  pública avanzada permanecen fuera del MVP.
- Los tiempos de los criterios de éxito se medirán con usuarios de prueba, datos ficticios preparados
  y una conexión estable según el protocolo indicado en cada criterio; no establecen acuerdos de
  disponibilidad productiva.
- La asociación administrativa de un candidato con una oportunidad no equivale por sí sola a una
  derivación: la Oficina de Empleo conserva la decisión, pero puede derivarlo sin una confirmación
  específica por oferta mientras el perfil esté activo y su consentimiento general siga vigente.
- Las posiciones seguras de `docs/discovery/OPEN_QUESTIONS.md` limitan riesgos mientras se decide,
  pero no representan aprobación del stakeholder ni pueden convertirse en reglas definitivas sin
  aclaración.

## Scope Boundaries

### Included in this MVP

- Acceso por roles y recuperación de cuenta.
- Gestión autogestionada y asistida de candidatos, CV, categorías y disponibilidad.
- Perfiles de empresa y ciclo completo de ofertas con moderación municipal.
- Postulaciones, búsqueda, preentrevista, preselección, derivación, entrevistas, resultados y
  seguimiento.
- Historial de estados, auditoría, contactos y tratamiento recuperable de registros.
- Importación controlada desde CSV, métricas administrativas básicas y exportación CSV.

### Explicitly excluded

- Navegación empresarial del padrón general o contacto no mediado con candidatos.
- Verificación documental de empresas.
- Ranking, selección o emparejamiento automático mediante inteligencia artificial.
- Integración directa con servicios de mensajería.
- Constructor completo de CV y recomendaciones automáticas de capacitación.
- Roles administrativos adicionales, analítica pública avanzada y formatos oficiales de reportes no
  suministrados.

## Open Questions and Validation Dependencies

Las siguientes decisiones continúan abiertas por depender de definiciones legales, material
municipal o decisiones propias de `$speckit-plan`. Esta especificación no adopta como aprobada
ninguna posición temporal; la planificación puede tratarlas como dependencias explícitas, pero no
pueden cerrarse ni implementarse definitivamente hasta que responda el responsable indicado.

| ID | Decisión pendiente | Límite seguro aplicado al borrador | Responsable |
| --- | --- | --- | --- |
| OQ-001 | Plazos de retención de perfiles, CV, contactos y auditoría | Archivar; no eliminar permanentemente de forma automática | Municipalidad / responsable legal o de datos |
| OQ-005 | Formatos oficiales de reportes | Limitar el MVP a métricas internas y CSV genérico | Oficina de Empleo |
| OQ-006 | Hosting productivo y responsables operativos | No definir producción; la demostración no resuelve operación municipal | Beex / Municipalidad |
| OQ-010 | Catálogo final de categorías y ocupaciones | Requiere un catálogo canónico depurado y multiselección | Oficina de Empleo |
| OQ-017 | Tamaño y formatos de archivo aceptados | PDF como posición inicial; límite pendiente de planificación y aprobación | Plan técnico / Municipalidad |
| OQ-018 | Mapeo completo del Excel histórico | Bloquear la implementación del importador hasta contar con muestra anonimizada y mapeo escrito | Oficina de Empleo |

Además, la validación del MVP depende de recibir una muestra anonimizada de la planilla, el catálogo
actual, ejemplos anonimizados de pedidos y reportes, confirmación del aprovisionamiento de las cuatro
cuentas administrativas y requisitos municipales de identidad visual y accesibilidad.
