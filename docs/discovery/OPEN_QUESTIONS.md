# Open questions and validation backlog

These questions must not be silently answered by implementation. Defaults listed here are temporary assumptions for discussion, not stakeholder approval.

## Must be resolved before the first production release

| ID | Question | Current safe position | Decision owner |
|---|---|---|---|
| OQ-001 | What retention period applies to candidate profiles, CVs, contact history, and audit records? | Archive; do not permanently delete automatically. | Municipality / authorized legal or data owner |
| OQ-002 | What exact consent and privacy notice must candidates accept? | Explicit consent for employment processing and post-referral sharing. | Municipality |
| OQ-003 | Which fields are legally and operationally required for a candidate? | Minimize collection; retain only fields justified by the workflow. | Employment Office |
| OQ-004 | Which candidate data may a referred company view and download? | Minimum necessary profile and CV only after referral. | Employment Office / Municipality |
| OQ-005 | What are the required provincial or municipal report formats? | Provide internal metrics and generic CSV export first. | Employment Office |
| OQ-006 | Where will the production system be hosted and who owns operations, backups, and incident response? | Undecided; address during technical planning. | Beex / Municipality |

## Must be resolved during specification and clarification

### OQ-020 — Retiro automático del consentimiento al contratar (2026-10-21)

Actualización2026-10-25, EXTRA069: ante la imposibilidad de identificar a quién
informar, Mateo confirma conservar el nombre también en toda derivación propia
con acceso terminado (retiro/falta de respuesta/otro cierre), con empresa/cuenta
activas y oferta/caso/derivación no archivados. No restituye perfil/contactos/foto/
CV, consentimiento o permisos; reemplaza la prohibición de nombre del stub039.
Decisiones anteriores quedan como evidencia, no aprobación legal de datos reales.

Actualización2026-10-24, EXTRA062: Mateo solicita conservar únicamente el nombre
para la empresa de una contratación confirmada propia, con cuenta/empresa activas
y oferta/caso/derivación no archivados. Excepción de proyección mínima, sin reactivar
consentimiento, perfiles, contactos o CV. La decisión anterior y sus accesos
dependientes siguen abajo como evidencia; datos reales/política municipal no se aprueban.

**Resuelta para el cambio solicitado:** Mateo, 2026-10-21, confirma expresamente
la primera opción original: retiro del consentimiento **global** y revocación de
todos los accesos empresariales. Descarta su comentario posterior sobre limitar
el objetivo al matching. No acredita aprobación municipal para datos reales.

Solicitud nueva: al confirmar `hired` —normal o tardío— retirar el consentimiento
vigente y los permisos que dependan de él atómicamente, con actor/fecha/motivo e
historial, sin alterar otros resultados ni participaciones y sin reaceptación
automática posterior. Alcance confirmado: global, no consentimiento por oferta.

Reglas aprobadas previas que deben preservarse como evidencia del conflicto:

- `spec.md`, Clarifications 2026-09-19 y `data-model.md/candidate_consents`: único
  consentimiento general por candidato, no uno por derivación.
- Clarifications 2026-09-21 y contrato de estados: retirar ese consentimiento cierra
  todas sus participaciones abiertas y revoca los accesos; reconsentir no los repone.
- FR-036/FR-037 y contratos: contratación normal conserva un permiso todavía activo
  hasta720 horas; contratación tardía no revive permisos revocados.

Alternativas consultadas (histórico): **A**, retirar el consentimiento global y revocar los accesos
de todas las empresas, impidiendo nuevas derivaciones hasta consentimiento afirmativo;
o **B**, revocar solo el acceso de la derivación contratada sin retirar el global
(no existe actualmente un consentimiento individual por derivación).
En ambos casos la solicitud exige preservar estados de las demás participaciones:
la opción A confirmada es una excepción explícita al cierre por retiro global manual,
no autorización para cambiar silenciosamente ese flujo existente.

La contratación normal/tardía realizada tras la nueva migración reemplaza la
ventana720h por retiro y revocación inmediatos, conservando las otras participaciones.
El retiro manual mantiene su cierre de casos abiertos. Sin backfill automático
de contrataciones anteriores ni reaceptación implícita por corregir un resultado.

| ID | Question | Current safe position | Decision owner |
|---|---|---|---|
| OQ-010 | What is the final controlled category and occupation catalog? | Start from the existing catalog, remove duplicates, and allow multiple selections. | Employment Office |
| OQ-011 | What exact fields and evidence are required in a company profile and opening? | No documents in MVP; collect only contact and operational opening data. | Employment Office |
| OQ-013 | Which status changes are visible to candidates and companies? | Expose useful progress; hide internal notes and sensitive reasons. | Employment Office |
| OQ-014 | Who records the company interview outcome: company, administrator, or both? | Company may submit; administrator confirms the final state. | Employment Office |
| OQ-015 | What should happen when a company never reports an outcome? | Allow staff follow-up and an explicit `awaiting_feedback` condition. | Employment Office |
| OQ-016 | Is a PDF CV mandatory for every referral, including staff-assisted records? | Required before external referral; staff may help create or digitize it. | Employment Office |
| OQ-017 | Which file-size limit and document formats are acceptable? | PDF only for MVP; exact size decided in planning. | Technical plan / Municipality |
| OQ-018 | What is the complete mapping of the existing Excel workbook? | Require an anonymized sample and written mapping before importer implementation. | Employment Office |

## Resolved by the MVP clarifications of 2026-09-19

### A08 — actualización acotada de OQ-010, 2026-10-19

Mateo confirmó aprobación municipal para los quince rubros amplios de
`docs/implementation/functional-adjustments.md` y solicita implementarlos.
Se incorporan como catálogo v2; no se infieren equivalencias con categorías
anteriores ni se reasignan candidatos/ofertas. OQ-010 permanece abierta para
ocupaciones más específicas y mapeo histórico; no impide usar la lista amplia
expresamente aprobada. El importador sintético v1 y OQ-018 siguen separados.

| ID | Previous provisional position | Clarified MVP decision | Source |
|---|---|---|---|
| OQ-012 | Confirm candidate interest before each referral. | Administrators may nominate and refer a candidate without offer-specific confirmation while the candidate profile is active and the general consent remains valid; the municipal referral decision is still mandatory. | `specs/001-municipal-employment-portal/spec.md` — Clarifications, FR-031 and FR-037 |
| OQ-019 | Begin with a referenced training record. | Training and guidance are recorded as an internal free-text note on the candidate; no course catalog, enrollment or recommendation feature is included in the MVP. | `specs/001-municipal-employment-portal/spec.md` — Clarifications and FR-042 |

## Technical decisions intentionally deferred to `$speckit-plan`

- Frontend framework and application architecture.
- Backend language and framework.
- Database and migration tooling.
- Authentication provider or library.
- File-storage provider.
- Email provider.
- Hosting and deployment platform.
- Observability, backup, and recovery tooling.
- CI pipeline and test frameworks.

## Evidence that still needs collection

Project exception, 2026-09-25: Mateo approved implementing/testing US5 with a
synthetic demo mapping (`docs/import/candidate-import-v1.md`). This is not Office
approval: OQ-018/T069 remain open for the historical workbook, and OQ-010 remains
open for the official catalog. No real data may be imported under this exception.

- An anonymized copy of the current Excel column structure.
- The current form fields and category list exported in a usable format.
- Examples of real company requests, anonymized.
- Examples of reports requested by the municipality or province.
- Confirmation of the four intended administrator users and how their accounts will be provisioned.
- Municipal visual identity and accessibility requirements.
