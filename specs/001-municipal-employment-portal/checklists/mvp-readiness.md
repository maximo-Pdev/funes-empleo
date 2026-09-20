# Checklist de preparación de requisitos: MVP del Portal Municipal de Empleo de Funes

**Purpose**: Evaluar si la especificación, el plan y sus contratos expresan requisitos completos,
claros, consistentes y medibles antes de generar tareas.
**Created**: 2026-09-19
**Feature**: [spec.md](../spec.md)

**Note**: Este checklist personalizado fue generado por `$speckit-checklist` a partir del contexto y
los requisitos de la característica.
**Review Ownership**: Este artefacto pertenece al revisor. Marcar `[x]` únicamente cuando el revisor
determine que el criterio de calidad de requisitos está satisfecho.
**Marker Semantics**: `[x]` significa que la calidad del requisito fue revisada y aprobada; no
significa que la implementación esté terminada.

## Completitud de requisitos

- [ ] CHK001 ¿Está documentado el ciclo completo de acceso para cada rol —registro permitido,
  verificación, inicio/cierre de sesión, recuperación, suspensión, reactivación y archivo— y se
  distinguen las operaciones públicas de las administrativas? [Completeness, Spec §FR-001–FR-006]
- [ ] CHK002 ¿Está completo el ciclo del candidato para autogestión y atención asistida, incluyendo
  alta, activación, vigencia, disponibilidad, consentimiento, CV, vinculación de cuenta, corrección y
  solicitud de eliminación? [Completeness, Spec §FR-010–FR-017]
- [ ] CHK003 ¿Están definidas todas las decisiones de moderación de empresa/oferta, sus motivos
  visibles e internos y el tratamiento de borrador, corrección, rechazo, pausa, reanudación, cierre,
  cancelación y reactivación? [Completeness, Spec §FR-020–FR-026; Plan §Integridad, estados y concurrencia]
- [ ] CHK004 ¿Está documentado el ciclo completo de participación tanto para postulación propia como
  para nominación administrativa, incluyendo preentrevista, preselección, derivación, entrevista,
  feedback, resultado, retiro, cancelación y falta de respuesta? [Completeness, Spec §FR-030–FR-041]
- [ ] CHK005 ¿Los requisitos identifican todas las acciones que deben dejar historia, el actor
  responsable —incluido `system`—, los motivos obligatorios y la información que nunca debe copiarse
  a auditoría? [Completeness, Spec §FR-050–FR-054; Plan §Integridad, estados y concurrencia]
- [ ] CHK006 ¿La importación, las métricas y la exportación tienen requisitos completos para
  previsualización, bloqueo, confirmación, recuperación, filtros, datos autorizados y trazabilidad,
  sin asumir el mapeo todavía ausente? [Completeness, Spec §FR-060–FR-067; Contract CSV]

## Claridad y precisión

- [ ] CHK007 ¿Se distingue sin ambigüedad qué datos permiten crear, activar, buscar internamente,
  postular y derivar un perfil, especialmente el caso asistido activo pero sin CV? [Clarity, Spec
  §FR-010–FR-011, FR-030, FR-034; Data Model §candidate_profiles]
- [ ] CHK008 ¿Está especificado cuáles contactos se comparten tras una derivación, cómo se eligen y
  si la persona puede excluir alguno, en lugar de usar el término genérico “datos de contacto”? 
  [Ambiguity, Spec §FR-036; Data Model §candidate_contacts]
- [ ] CHK009 ¿Está fijado de forma inequívoca desde qué evento se cuentan los 30 días sin respuesta y
  qué hechos, si alguno, reinician o suspenden ese plazo? [Clarity, Spec §FR-040; Plan §Automatización
  de falta de respuesta]
- [ ] CHK010 ¿El proceso de resolución de duplicados define resultados administrativos permitidos
  —rechazar, vincular, conservar separado o corregir— y la evidencia requerida para cada uno?
  [Gap, Spec §FR-014, FR-017, FR-061]
- [ ] CHK011 ¿Los términos `active`, `needs_update`, `unavailable`, consentimiento vigente y
  `referral_eligible` tienen definiciones únicas y consecuencias explícitas en búsqueda, postulación
  y derivación? [Clarity, Spec §FR-015–FR-016, FR-030–FR-034; Data Model §Máquinas de estado]
- [ ] CHK012 ¿Están definidos los campos públicos exactos de una oferta y el efecto de alcanzar su
  fecha de cierre sobre visibilidad, nuevas postulaciones y participaciones existentes? [Gap, Spec
  §FR-021, FR-024; Spec §Edge Cases]

## Consistencia entre artefactos

- [ ] CHK013 ¿Se resolvió expresamente el conflicto entre la aclaración que elimina la confirmación
  por oferta y OQ-012, que todavía indica confirmar interés antes de derivar? [Conflict, Spec
  §Clarifications, FR-031; Open Questions §OQ-012]
- [ ] CHK014 ¿Se armonizó la aclaración de capacitación como nota libre interna con OQ-019 y la
  discovery baseline, que todavía hablan de registro, enlace u oportunidad de capacitación?
  [Conflict, Spec §Clarifications, FR-042; Open Questions §OQ-019]
- [ ] CHK015 ¿La decisión técnica de exigir email/contraseña para autorregistro es consistente con el
  requisito de “al menos un contacto”, y está claro que no se admite autorregistro solo con teléfono?
  [Consistency, Spec §FR-001, FR-010, FR-020; Plan §Identidad, sesión y cuentas]
- [ ] CHK016 ¿Los artefactos coinciden sobre qué versión del CV ve una empresa cuando el candidato lo
  reemplaza después de ser derivado: la asociada a la derivación o siempre la vigente? [Ambiguity,
  Spec §Edge Cases; Data Model §cv_documents y §referrals]
- [ ] CHK017 ¿La posibilidad del contrato de omitir etapas administrativas está reconciliada con el
  requisito de distinguir recepción, revisión, preentrevista, preselección y derivación, indicando
  qué saltos siguen preservando la intermediación? [Consistency, Spec §FR-037; Contract States
  §Participación y derivación]
- [ ] CHK018 ¿La revocación predeterminada del acceso empresarial después de retiro o cierre se
  presenta consistentemente como límite seguro provisional y no como una política de retención ya
  aprobada? [Consistency, Spec §Edge Cases, OQ-001; Data Model §referrals]

## Calidad de criterios de aceptación

- [ ] CHK019 ¿SC-001 y SC-002 definen población, tamaño de muestra, inicio/fin del cronómetro,
  condiciones de red y qué cuenta como completar en el primer intento? [Measurability, Spec
  §SC-001–SC-002]
- [ ] CHK020 ¿SC-003 identifica el tamaño y composición del conjunto de demostración, la preparación
  permitida al administrador y el punto exacto de finalización de la tarea? [Measurability, Spec
  §SC-003]
- [ ] CHK021 ¿SC-008 define volumen de datos, entorno y alcance de la exportación necesarios para que
  el umbral de 30 segundos sea repetible? [Measurability, Spec §SC-008; Plan §Objetivos de rendimiento]
- [ ] CHK022 ¿SC-009 especifica los tamaños móviles/escritorio, nivel de zoom, tecnologías de apoyo y
  criterio de aprobación para navegación solo con teclado? [Measurability, Spec §SC-009, FR-070;
  Quickstart §Verificación manual]
- [ ] CHK023 ¿SC-010 enumera las cinco tareas críticas, define “primer intento” y caracteriza a los
  usuarios representativos para que el resultado 4 de 5 sea reproducible? [Gap, Spec §SC-010]

## Cobertura de escenarios

- [ ] CHK024 ¿Los escenarios principales cubren de extremo a extremo las tres experiencias, la
  atención presencial y la frontera exacta donde la Oficina de Empleo autoriza la entrega de datos?
  [Coverage, Spec §User Stories 1–4]
- [ ] CHK025 ¿Están especificados los flujos alternativos y de excepción de autenticación —correo no
  verificado, enlace vencido, recuperación inválida, sesión revocada y cuenta suspendida— sin revelar
  existencia de cuentas? [Gap, Spec §FR-001–FR-005, FR-056]
- [ ] CHK026 ¿Están documentadas las consecuencias de suspender una empresa o candidato sobre ofertas
  publicadas, postulaciones activas, derivaciones, feedback pendiente y acceso a CV? [Gap, Spec
  §FR-005, FR-025]
- [ ] CHK027 ¿Las fallas parciales y concurrentes tienen requisitos explícitos de resultado visible,
  reintento seguro y preservación de historial para transiciones, archivos, importaciones y acciones
  simultáneas de administradores? [Coverage, Spec §Edge Cases; Plan §Integridad, estados y concurrencia]
- [ ] CHK028 ¿Los requisitos de estados vacíos, carga y error están aplicados a los recorridos
  críticos —búsqueda sin candidatos, oferta sin postulaciones, métricas sin datos e importación sin
  filas válidas— y no solo expresados de forma transversal? [Coverage, Spec §FR-056, FR-070]
- [ ] CHK029 ¿Existen requisitos de recuperación para archivo/restauración de registros y para
  migraciones fallidas que definan autoridad, conflictos posibles y evidencia a conservar?
  [Recovery, Spec §FR-054; Constitution §III; Plan §Métricas, logs y recuperación]

## Cobertura de casos límite

- [ ] CHK030 ¿El caso de una oferta que deja de estar publicada distingue con claridad pausa,
  vencimiento, cierre y cancelación, y el tratamiento de postulaciones/derivaciones ya existentes?
  [Edge Case, Spec §Edge Cases, FR-023–FR-024]
- [ ] CHK031 ¿El retiro del consentimiento define el efecto sobre nuevas acciones, participaciones en
  curso, derivaciones ya entregadas, acceso empresarial y datos que deben conservarse mientras OQ-001
  siga abierta? [Edge Case, Spec §FR-054–FR-055; Spec §Edge Cases]
- [ ] CHK032 ¿La respuesta empresarial tardía define qué evidencia admite el administrador, qué
  resultados puede registrar y cómo se presenta el cierre anterior sin confundirlo con el resultado
  final vigente? [Edge Case, Spec §FR-039–FR-040]
- [ ] CHK033 ¿Los requisitos CSV cubren archivo vacío, codificación inválida, encabezados repetidos,
  exceso de límites, duplicados dentro del mismo lote, doble confirmación y categorías desactivadas?
  [Coverage, Contract CSV; Spec §FR-060–FR-063]

## Requisitos no funcionales

- [ ] CHK034 ¿Los requisitos de privacidad cubren de forma explícita UI, respuestas de error, caché,
  URLs firmadas, logs, trazas, capturas, exportaciones, archivos temporales y entornos de preview?
  [Completeness, Spec §FR-052–FR-056, FR-071–FR-073; Plan §Autorización y privacidad]
- [ ] CHK035 ¿La matriz de autorización define requisitos positivos y negativos para cada recurso,
  rol, propiedad, estado suspendido y actor sistema, incluyendo la respuesta que evita revelar la
  existencia de recursos ajenos? [Coverage, Contract Authorization; Spec §FR-004, FR-026, FR-035–FR-036]
- [ ] CHK036 ¿Los requisitos de accesibilidad, español y responsive son suficientemente específicos
  para formularios, tablas, filtros, diálogos, cargas, errores, foco y atención asistida? [Coverage,
  Spec §FR-070; Constitution §IV]
- [ ] CHK037 ¿Los objetivos de rendimiento y escala cubren búsquedas administrativas, listados,
  descarga de CV, previsualización/importación y concurrencia, o están deliberadamente excluidos con
  una justificación documentada? [Gap, Spec §SC-003, SC-008; Plan §Objetivos de rendimiento]

## Dependencias, supuestos y conflictos abiertos

- [ ] CHK038 ¿Cada OQ conservada identifica dueño, límite seguro, etapa de bloqueo y evidencia de
  aprobación, y ninguna decisión técnica —incluidos 5 MiB, revocación de acceso o demo— se presenta
  como aprobación municipal? [Dependency, Spec §Open Questions; Plan §Dependencias externas]
- [ ] CHK039 ¿Están documentados como gates verificables la muestra anonimizada, el mapeo CSV, el
  catálogo canónico, el texto/versionado del consentimiento, las cuatro identidades admin, SMTP e
  identidad visual/accesibilidad municipal? [Dependency, Spec §Open Questions; Plan §Dependencias
  externas y gates de aceptación]
- [ ] CHK040 ¿Las exclusiones del MVP permanecen consistentes en especificación, plan y contratos,
  especialmente IA de matching, verificación documental, mensajería directa, constructor de CV,
  recomendaciones automáticas, roles adicionales y analítica pública? [Scope, Spec §Explicitly
  excluded; Constitution §V]

## Notes

- Marcar `[x]` solo después de que la revisión determine que el criterio de calidad del requisito
  está satisfecho.
- Dejar sin marcar todo ítem que requiera aclaración, corrección o evaluación del revisor.
- `$speckit-implement` lee el estado de los checklists como gate y no debe modificar sus marcadores.
- `checklists/requirements.md` conserva su ciclo separado administrado por `$speckit-specify` y
  `$speckit-clarify`.
- Registrar hallazgos y decisiones junto al ítem correspondiente, enlazando el artefacto actualizado.
- Este checklist evalúa la redacción y coherencia de requisitos; no prueba la implementación.

## Revisión incremental posterior a la replanificación — 2026-09-20

### Completitud de ciclos y decisiones aclaradas

- [ ] CHK041 ¿El ciclo de corrección, solicitud de eliminación, archivo inmediato y restauración
  administrativa está especificado para cuenta y perfil, con autoridad, motivo, estado seguro de
  retorno y relaciones que no deben reactivarse? [Completeness, Spec §FR-016, FR-054; Plan
  §Suspensión, archivo y restauración]
- [ ] CHK042 ¿Los requisitos de suspensión cubren de manera completa candidato, empresa, ofertas,
  operaciones nuevas, casos existentes y acceso empresarial a perfiles/CV, además de exigir una
  acción destacada y confirmación explícita? [Completeness, Spec §FR-005, FR-025; Contract States
  §Suspensión y archivo]
- [ ] CHK043 ¿El cierre automático por vencimiento está definido como una transición idempotente con
  actor de sistema, salida de la consulta pública, bloqueo de nuevas postulaciones y continuidad de
  las participaciones existentes? [Completeness, Spec §FR-021, FR-024; Plan §Automatizaciones diarias]
- [ ] CHK044 ¿La resolución de duplicados documenta para autorregistro, atención asistida e
  importación las tres decisiones permitidas —usar o actualizar, corregir y crear separado, o
  rechazar— junto con motivo, historial y prohibición de fusión automática? [Completeness, Spec
  §FR-014, FR-061; Data Model §duplicate_reviews; Contract CSV §Fase 2]
- [ ] CHK045 ¿La proyección empresarial especifica conjuntamente todos los contactos vigentes, la
  versión exacta del CV fijada en la derivación y las condiciones que revocan el acceso sin exponer
  DNI, domicilio, otras participaciones o notas internas? [Completeness, Spec §FR-035–FR-036;
  Contract Authorization §Proyección empresarial]

### Claridad de estados, métricas y transiciones

- [ ] CHK046 ¿Se distingue con términos y estados inequívocos reactivar una cuenta suspendida de
  restaurar un perfil, empresa u oferta archivada, incluyendo que perfil vuelve a `draft`, empresa a
  `incomplete` y oferta a `draft`? [Clarity, Spec §FR-005, FR-025, FR-054; Data Model §Máquinas de estado]
- [ ] CHK047 ¿Los requisitos enumeran exactamente qué etapas puede omitir un administrador, exigen
  avance solo hacia adelante y motivo por salto, y mantienen la derivación como frontera obligatoria
  antes del acceso empresarial? [Clarity, Spec §FR-037; Contract States §Participación y derivación]
- [ ] CHK048 ¿La definición de candidato activo para métricas está separada de
  `referral_eligible`, dejando claro que exige estado activo, disponibilidad, consentimiento y
  actualización en seis meses, pero no necesariamente CV? [Clarity, Spec §FR-064; Data Model
  §candidate_profiles]
- [ ] CHK049 ¿Las dos métricas temporales están definidas con el mismo origen `published_at`, con
  contratación confirmada por administración como evento y cobertura total pendiente hasta igualar
  la cantidad de vacantes? [Measurability, Spec §FR-067; Plan §Métricas, logs y recuperación]
- [ ] CHK050 ¿Está expresado de manera consistente que los contactos se consultan en su estado
  vigente mientras el CV permanece congelado por derivación, evitando interpretar que ambos se
  versionan o que ambos cambian dinámicamente? [Clarity, Spec §FR-036; Research §15; Data Model
  §candidate_contacts y §referrals]

### Consistencia con contratos y desglose de tareas

- [ ] CHK051 ¿La tarea de proyección empresarial está alineada con “todos los contactos vigentes” y
  `cv_document_id`, sin conservar el concepto anterior de contactos seleccionados para compartir ni
  del CV más reciente? [Conflict, Spec §FR-036; Plan §Autorización y privacidad; Tasks §T031]
- [ ] CHK052 ¿El desglose de tareas representa las dos automatizaciones diarias —ofertas vencidas y
  derivaciones sin respuesta— con sus transiciones, auditoría, idempotencia y escenarios de
  aceptación respectivos? [Coverage, Plan §Automatizaciones diarias; Quickstart §Escenarios 2 y 4;
  Tasks §T034]
- [ ] CHK053 ¿Las tareas incluyen requisitos explícitos para corrección directa, archivo inmediato
  solicitado por el candidato, suspensión con confirmación destacada y restauración administrativa
  sin reactivación implícita? [Coverage, Spec §FR-005, FR-016, FR-054; Quickstart §Escenario 8;
  Tasks §US2 y §T060]
- [ ] CHK054 ¿Las tareas de duplicados y de importación conservan las tres resoluciones aprobadas,
  la corrección previa del falso positivo y la evidencia de actor, fecha y motivo, en lugar de una
  resolución administrativa genérica? [Consistency, Spec §FR-014; Contract CSV §Fase 2; Tasks
  §T064, T071 y T076]
- [ ] CHK055 ¿Las tareas de métricas distinguen explícitamente tiempo hasta primera contratación y
  tiempo hasta cobertura total, incluida la condición pendiente cuando no se cubrieron todas las
  vacantes? [Consistency, Spec §FR-067; Data Model §Métricas y exportaciones; Tasks §T079 y T081]
- [ ] CHK056 ¿Las tareas y la guía de validación conservan los protocolos completos de SC-001,
  SC-002, SC-003, SC-008, SC-009 y SC-010 —muestras, dataset, cronómetros, tamaños, zoom, teclado,
  NVDA y cuatro de cinco tareas— sin reducirlos a una verificación genérica? [Traceability, Spec
  §SC-001–SC-003, SC-008–SC-010; Quickstart §Protocolo de aceptación; Tasks §T087, T089 y T092]

### Dependencias y límites de aprobación

- [ ] CHK057 ¿El límite de 5 MiB permanece identificado como decisión técnica para la demostración
  sujeta a OQ-017, y la implementación definitiva del importador continúa bloqueada por muestra y
  mapeo aprobados de OQ-018? [Dependency, Spec §Open Questions; Plan §CV y archivos y §Importación;
  Tasks §T044 y T069]
- [ ] CHK058 ¿La documentación deja claro que esta replanificación obliga a revisar y, si
  corresponde, regenerar el desglose de tareas y el análisis antes de implementar, sin considerar
  aprobado automáticamente ningún artefacto generado previamente? [Governance, Constitution §V y
  §Development Workflow; AGENTS §Spec Kit collaboration]

### Notas de esta ejecución

- Los ítems CHK041–CHK058 se agregaron sin alterar ni aprobar CHK001–CHK040.
- Esta revisión incremental evalúa la calidad y trazabilidad de requisitos posteriores a la nueva
  planificación; los conflictos señalados no modifican `tasks.md` durante `$speckit-checklist`.
