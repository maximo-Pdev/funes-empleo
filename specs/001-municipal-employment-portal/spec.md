# Feature Specification: MVP del Portal Municipal de Empleo de Funes

**Feature Branch**: `spec/municipal-employment-portal-mvp`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Crear una única especificación integral para el MVP del Portal
Municipal de Empleo de Funes, manteniendo a la Oficina de Empleo como intermediaria y cubriendo
los flujos completos de candidatos, empresas y administradores."

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
3. **Given** un candidato preseleccionado cuyo interés fue confirmado cuando corresponde, **When**
   un administrador lo deriva, **Then** la empresa de esa oferta puede ver únicamente la
   información autorizada de ese candidato y ninguna del padrón general.
4. **Given** una derivación con entrevista o seguimiento posterior, **When** se informa un resultado,
   **Then** el administrador puede confirmarlo y queda un historial con fechas, actores y cambios de
   estado.

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

1. **Given** una persona sin cuenta, **When** completa el registro y verifica su acceso, **Then** puede
   iniciar y cerrar sesión y recuperar su acceso de forma segura.
2. **Given** un candidato autenticado, **When** completa o actualiza su perfil, categorías,
   disponibilidad y CV, **Then** solo modifica su propia información y el personal ve la vigencia del
   perfil.
3. **Given** un perfil que cumple los requisitos aprobados para postularse, **When** el candidato
   elige dos ofertas publicadas, **Then** puede crear una postulación independiente para cada una.
4. **Given** una postulación activa, **When** el candidato decide retirarla o desactivar su
   disponibilidad, **Then** el cambio queda registrado sin eliminar su historia laboral.

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

1. **Given** una empresa registrada y autenticada, **When** mantiene sus datos y guarda un borrador
   de oferta, **Then** puede editarlo sin publicarlo directamente.
2. **Given** un borrador completo, **When** la empresa lo envía a revisión, **Then** conoce su estado
   de moderación y no puede hacerlo público por sí misma.
3. **Given** una solicitud municipal de correcciones, **When** la empresa actualiza y reenvía la
   oferta, **Then** el nuevo envío vuelve a revisión y conserva el historial anterior.
4. **Given** candidatos derivados a una oferta propia, **When** la empresa consulta la búsqueda,
   **Then** accede solo a esos perfiles y puede comunicar el resultado de sus entrevistas sin ver
   notas internas.

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
   **Then** el sistema comprueba posibles duplicados antes de guardar información nueva.
2. **Given** un perfil asistido válido, **When** el administrador actualiza categorías,
   disponibilidad, CV o contactos, **Then** cada acción queda asociada al administrador responsable.
3. **Given** un perfil asistido que luego deba vincularse a una cuenta personal, **When** se ejecute el
   proceso aprobado para reclamarlo, **Then** no se crea un candidato duplicado ni se pierde su
   historial.

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

### Edge Cases

- Un registro o importación coincide por DNI o correo con un candidato existente; debe detenerse la
  consolidación automática y quedar disponible para resolución administrativa.
- Una cuenta de candidato o empresa está suspendida; no puede realizar acciones privadas mientras
  conserva los registros necesarios para auditoría.
- Una empresa intenta publicar directamente, ver el padrón general o consultar una derivación de
  otra empresa; la acción debe rechazarse sin revelar datos.
- Una oferta deja de estar publicada mientras existen postulaciones activas; deja de recibir nuevas
  postulaciones y las existentes conservan su historia para tratamiento administrativo.
- Un candidato actualiza su perfil o CV mientras participa en varias búsquedas; cada búsqueda debe
  conservar una trazabilidad comprensible de las decisiones tomadas.
- Un perfil supera el período aprobado de vigencia sin confirmación; no se elimina y deja de aparecer
  por defecto entre candidatos activos hasta que se actualice.
- Un candidato se retira después de ser preseleccionado o derivado; el retiro se registra y la
  empresa solo conserva el acceso que autoricen las reglas pendientes de privacidad y retención.
- Una empresa no comunica un resultado; el caso queda identificable para seguimiento municipal sin
  inventar un resultado final.
- Un CV tiene tipo o tamaño no admitido, está dañado o intenta contener contenido ejecutable; se
  rechaza con un mensaje claro sin sustituir el CV vigente.
- Un CSV contiene encabezados desconocidos, filas incompletas, categorías sin mapear o una mezcla de
  filas válidas e inválidas; la previsualización debe explicar el impacto antes de confirmar.
- Una acción falla después de que el usuario la solicita; el sistema evita estados parciales ocultos
  y muestra un mensaje en español que no revela datos personales ni detalles internos.
- Dos administradores actúan sobre el mismo caso; el historial debe conservar quién realizó cada
  cambio y permitir detectar el estado vigente.

## Requirements *(mandatory)*

### Functional Requirements

#### Acceso y permisos

- **FR-001**: El sistema DEBE permitir que candidatos y empresas se registren con cuentas
  individuales, verifiquen su acceso, inicien y cierren sesión.
- **FR-002**: El sistema DEBE permitir la recuperación segura de acceso para candidatos, empresas y
  administradores.
- **FR-003**: El sistema DEBE admitir cuatro cuentas administrativas individuales, con los mismos
  permisos completos, creadas fuera del registro público y sin credenciales compartidas.
- **FR-004**: Cada acción y registro privado DEBE ser accesible únicamente para los roles y
  propietarios autorizados, incluso cuando alguien intente acceder fuera de la navegación normal.
- **FR-005**: Los administradores DEBEN poder suspender y reactivar cuentas de candidatos y empresas
  sin destruir su historial.
- **FR-006**: Las personas no autenticadas DEBEN poder consultar únicamente información pública y
  ofertas vigentes publicadas; postularse DEBE requerir una cuenta de candidato.

#### Perfiles de candidatos

- **FR-010**: Un candidato DEBE poder crear y mantener únicamente su propio perfil estructurado con
  el conjunto mínimo de datos que apruebe la Oficina de Empleo.
- **FR-011**: Un administrador DEBE poder crear y mantener un perfil asistido para una persona
  atendida presencialmente, identificándose como responsable de sus acciones.
- **FR-012**: Un candidato DEBE poder seleccionar múltiples categorías ocupacionales e intereses
  laborales de un catálogo controlado y registrar habilidades según las reglas aprobadas.
- **FR-013**: Un candidato o administrador autorizado DEBE poder incorporar y reemplazar un CV en el
  formato aprobado, sujeto a validación de tipo, tamaño e integridad antes de aceptarlo.
- **FR-014**: El sistema DEBE detectar coincidencias potenciales por DNI y correo y derivarlas a una
  resolución administrativa, sin sobrescribir ni fusionar registros silenciosamente.
- **FR-015**: Los administradores DEBEN poder conocer la disponibilidad y vigencia del perfil; los
  perfiles sin confirmar o actualizar durante seis meses DEBEN marcarse para actualización y quedar
  fuera de los resultados activos predeterminados sin ser eliminados.
- **FR-016**: El sistema DEBE permitir que un candidato retire una postulación activa, desactive su
  disponibilidad y solicite corrección o eliminación de sus datos, conservando el tratamiento
  recuperable exigido mientras no exista una política de retención aprobada.
- **FR-017 (Should)**: El sistema DEBERÍA permitir vincular un perfil asistido con la cuenta personal
  del mismo candidato mediante un proceso aprobado que evite duplicados y preserve todo el
  historial.

#### Empresas y ofertas

- **FR-020**: Una empresa DEBE poder registrar y mantener su propio perfil con los datos de contacto
  y operación aprobados, sin exigir verificación documental en el MVP.
- **FR-021**: Una empresa DEBE poder crear, guardar y editar borradores de ofertas con requisitos,
  ubicación, condiciones, vacantes, categorías e información de cierre.
- **FR-022**: Una empresa DEBE enviar una oferta a revisión municipal y consultar su estado, pero no
  DEBE poder publicarla directamente.
- **FR-023**: Un administrador DEBE poder aprobar, solicitar correcciones, rechazar, pausar, cerrar o
  cancelar una oferta, registrando la decisión y su responsable.
- **FR-024**: Solo las ofertas aprobadas y publicadas DEBEN ser visibles públicamente y aceptar nuevas
  postulaciones.
- **FR-025**: Los administradores DEBEN poder suspender o reactivar empresas y ofertas abusivas,
  engañosas, ilegales, duplicadas o inapropiadas, conservando su historial.
- **FR-026**: La empresa DEBE ver exclusivamente sus propios perfiles, ofertas, estados de
  moderación y candidatos derivados a una oferta propia.

#### Postulaciones, preselección y derivación

- **FR-030**: Un candidato autenticado con el perfil y CV exigidos DEBE poder postularse a múltiples
  ofertas publicadas, con un seguimiento independiente por oferta.
- **FR-031**: Un administrador DEBE poder asociar un candidato activo con una oportunidad aunque no
  exista una postulación previa; antes de derivarlo DEBE quedar registrada la confirmación de interés
  que establezca la regla aprobada.
- **FR-032**: Los administradores DEBEN poder buscar y filtrar candidatos por categorías,
  habilidades, disponibilidad, ubicación y vigencia del perfil.
- **FR-033**: Los administradores DEBEN poder registrar preentrevistas, contactos, notas internas,
  evaluaciones y decisiones de preselección.
- **FR-034**: Solo un administrador DEBE poder decidir y registrar la derivación de un candidato a
  una empresa para una oferta concreta.
- **FR-035**: Una empresa NO DEBE poder explorar el padrón general ni ver información completa de un
  candidato antes de una derivación municipal a una oferta propia.
- **FR-036**: Tras una derivación, la empresa DEBE ver únicamente los datos y documentos que aprueben
  la Oficina de Empleo y la Municipalidad para esa búsqueda.
- **FR-037**: La progresión de cada participación DEBE distinguir recepción, revisión,
  preentrevista, preselección, derivación, entrevista empresarial y los resultados finales
  aprobados, sin permitir transiciones que contradigan el proceso de intermediación.
- **FR-038**: Los resultados finales DEBEN distinguir como mínimo contratación, no selección,
  retiro y cancelación; cualquier estado adicional requiere aprobación durante la aclaración.
- **FR-039**: La empresa DEBE poder comunicar un resultado y el administrador DEBE poder revisarlo y
  confirmar el estado final conforme a la regla que apruebe la Oficina de Empleo.
- **FR-040**: Cuando no exista respuesta empresarial, el personal DEBE poder registrar seguimientos
  y distinguir el caso como pendiente de respuesta sin asignar un resultado no confirmado.
- **FR-041**: Un candidato no seleccionado DEBE poder continuar activo y participar en otras
  búsquedas.
- **FR-042 (Should)**: El personal DEBERÍA poder asociar una referencia de capacitación a un
  candidato cuando corresponda, sin generar recomendaciones automáticas.

#### Historial, contactos y privacidad

- **FR-050**: Cada cambio material de estado o acción administrativa DEBE conservar fecha, actor,
  estado anterior, estado nuevo y motivo cuando lo exija la regla aprobada.
- **FR-051**: El personal DEBE poder registrar contactos por teléfono, correo, WhatsApp y atención
  presencial sin requerir integración directa con servicios de mensajería.
- **FR-052**: Las notas internas y razones sensibles DEBEN ser visibles solo para administradores.
- **FR-053**: Los candidatos y empresas DEBEN ver únicamente los estados y explicaciones que apruebe
  la Oficina de Empleo para su rol.
- **FR-054**: Los registros de negocio DEBEN archivarse o desactivarse de forma recuperable y NO
  DEBEN eliminarse permanentemente de manera automática mientras la Municipalidad no apruebe una
  política de retención.
- **FR-055**: Antes de tratar datos laborales o compartir un perfil derivado, el sistema DEBE
  presentar y registrar el consentimiento o aviso aprobado por la Municipalidad.
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
  retiros, filtrados al menos por período y por categoría cuando corresponda.
- **FR-065**: Los administradores DEBEN poder exportar a CSV los datos operativos autorizados y
  filtrados; las exportaciones NO DEBEN estar disponibles públicamente.
- **FR-066**: Los formatos oficiales adicionales de informes NO DEBEN considerarse definidos hasta
  que la Oficina de Empleo o la Municipalidad entregue y apruebe sus requisitos.
- **FR-067 (Should)**: Las métricas DEBERÍAN incluir tendencias por categoría y tiempo aproximado de
  cobertura cuando los datos disponibles permitan calcularlos de manera comprensible.

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
  administrador, con rol, estado de acceso y referencias de recuperación.
- **Perfil de candidato**: Información laboral estructurada, categorías, habilidades,
  disponibilidad, vigencia, origen autogestionado o asistido y relación con su CV.
- **CV**: Documento laboral protegido, con vigencia, validaciones y relación con el candidato; su
  visibilidad externa depende de una derivación y de las reglas aprobadas.
- **Perfil de empresa**: Organización y contactos responsables de sus ofertas; no implica
  verificación documental en el MVP.
- **Categoría u ocupación**: Entrada del catálogo controlado utilizada para clasificar candidatos y
  ofertas, cuya versión final requiere validación de la Oficina de Empleo.
- **Oferta laboral**: Necesidad de contratación con requisitos y condiciones, perteneciente a una
  empresa y sujeta a moderación, publicación, pausa y cierre municipal.
- **Postulación o participación**: Relación entre candidato y oferta, iniciada por el candidato o por
  una asociación administrativa autorizada, con estado e historial propios.
- **Preentrevista y preselección**: Evaluación municipal previa a cualquier entrega de datos a una
  empresa, con notas y decisión interna.
- **Derivación**: Autorización municipal que vincula un candidato con una oferta y habilita a la
  empresa correspondiente a consultar el subconjunto aprobado de información.
- **Entrevista y resultado**: Información comunicada por la empresa o registrada por el personal y
  estado final confirmado por la autoridad definida.
- **Evento de contacto**: Registro de una comunicación telefónica, por correo, WhatsApp o presencial
  asociada a un caso y a su responsable.
- **Evento de historial o auditoría**: Evidencia inalterada de una acción o transición material, con
  actor, fecha, estado anterior, estado nuevo y motivo cuando corresponda.
- **Lote de importación**: Operación controlada sobre un CSV, con mapeo, previsualización,
  validaciones, duplicados, resultado y responsable.
- **Referencia de capacitación**: Asociación simple entre un candidato y una oportunidad o
  recomendación de formación, pendiente de definición funcional más detallada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Durante pruebas de aceptación, al menos el 90 % de candidatos de prueba puede
  registrarse, completar un perfil válido y postularse a una oferta publicada en menos de 10
  minutos, sin ayuda técnica.
- **SC-002**: Durante pruebas de aceptación, al menos el 90 % de representantes de empresas puede
  registrar su organización, preparar una oferta completa y enviarla a revisión en menos de 10
  minutos.
- **SC-003**: Un administrador capacitado puede localizar candidatos mediante los filtros definidos,
  registrar una preentrevista y formar una preselección en menos de 5 minutos sobre el conjunto de
  demostración acordado.
- **SC-004**: El 100 % de las ofertas no aprobadas permanece fuera de la consulta pública y no acepta
  postulaciones durante las pruebas de permisos.
- **SC-005**: El 100 % de los intentos de una empresa por consultar el padrón general, otra empresa o
  candidatos no derivados es rechazado sin exponer información personal.
- **SC-006**: El 100 % de las transiciones y acciones administrativas críticas probadas conserva un
  historial identificable de actor, fecha y cambio realizado.
- **SC-007**: En archivos de prueba, el 100 % de filas CSV inválidas o potencialmente duplicadas se
  identifica antes de confirmar, y ningún fallo de importación deja datos parciales ocultos.
- **SC-008**: Un administrador puede obtener los conteos operativos básicos y una exportación
  filtrada en menos de 30 segundos de interacción una vez seleccionado el período.
- **SC-009**: Los flujos críticos de candidato, empresa y administración pueden completarse solo con
  teclado en los tamaños móviles y de escritorio incluidos en la aceptación.
- **SC-010**: Al menos 4 de 5 tareas críticas son completadas en el primer intento por usuarios de
  prueba representativos, y cualquier fallo produce un mensaje en español que permite corregirlo.

## Assumptions

- El MVP está destinado inicialmente a cuatro empleados de la Oficina de Empleo con iguales
  permisos administrativos y cuentas individuales.
- La demostración y las pruebas utilizan únicamente información ficticia o anonimizada; incorporar
  datos municipales reales requiere autorizaciones y políticas todavía pendientes.
- La verificación documental de empresas, el ranking automático, la inteligencia artificial de
  emparejamiento, la integración directa con WhatsApp, el constructor completo de CV, las
  recomendaciones automáticas de cursos, los roles administrativos adicionales y la analítica
  pública avanzada permanecen fuera del MVP.
- Los tiempos de los criterios de éxito se medirán con usuarios de prueba que cuenten con los datos
  necesarios y una conexión estable; no establecen acuerdos de disponibilidad productiva.
- La asociación administrativa de un candidato con una oportunidad no equivale a una derivación:
  la Oficina de Empleo conserva la decisión y debe cumplir la confirmación de interés aprobada.
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

Las siguientes decisiones continúan abiertas. Esta especificación no adopta como aprobada ninguna
posición temporal y debe pasar por `$speckit-clarify` antes de `$speckit-plan`.

| ID | Decisión pendiente | Límite seguro aplicado al borrador | Responsable |
| --- | --- | --- | --- |
| OQ-001 | Plazos de retención de perfiles, CV, contactos y auditoría | Archivar; no eliminar permanentemente de forma automática | Municipalidad / responsable legal o de datos |
| OQ-002 | Texto exacto de consentimiento y privacidad | Exigir texto aprobado antes de tratar y compartir datos | Municipalidad |
| OQ-003 | Campos obligatorios del candidato | Minimizar y usar solo campos justificados y aprobados | Oficina de Empleo |
| OQ-004 | Datos que una empresa puede ver o descargar | Mostrar el mínimo aprobado solo después de la derivación | Oficina de Empleo / Municipalidad |
| OQ-005 | Formatos oficiales de reportes | Limitar el MVP a métricas internas y CSV genérico | Oficina de Empleo |
| OQ-006 | Hosting productivo y responsables operativos | No definir producción; la demostración no resuelve operación municipal | Beex / Municipalidad |
| OQ-010 | Catálogo final de categorías y ocupaciones | Requiere un catálogo canónico depurado y multiselección | Oficina de Empleo |
| OQ-011 | Campos y evidencias de empresa y oferta | No pedir documentos; usar solo datos operativos aprobados | Oficina de Empleo |
| OQ-012 | Nominación sin postulación propia | Registrar iniciador y confirmar interés antes de derivar | Oficina de Empleo |
| OQ-013 | Estados visibles para candidatos y empresas | Mostrar progreso útil; ocultar notas y razones sensibles | Oficina de Empleo |
| OQ-014 | Quién registra y confirma el resultado empresarial | Permitir comunicación empresarial; reservar confirmación según decisión | Oficina de Empleo |
| OQ-015 | Falta de respuesta de la empresa | Permitir seguimiento y distinguir pendiente de respuesta | Oficina de Empleo |
| OQ-016 | Obligatoriedad del PDF para perfiles asistidos | Exigir el documento aprobado antes de una derivación externa | Oficina de Empleo |
| OQ-017 | Tamaño y formatos de archivo aceptados | PDF como posición inicial; límite pendiente de planificación y aprobación | Plan técnico / Municipalidad |
| OQ-018 | Mapeo completo del Excel histórico | Bloquear la implementación del importador hasta contar con muestra anonimizada y mapeo escrito | Oficina de Empleo |
| OQ-019 | Representación de cursos | Mantener una referencia simple hasta que se apruebe mayor alcance | Oficina de Empleo |

Además, la validación del MVP depende de recibir una muestra anonimizada de la planilla, el catálogo
actual, ejemplos anonimizados de pedidos y reportes, confirmación del aprovisionamiento de las cuatro
cuentas administrativas y requisitos municipales de identidad visual y accesibilidad.
