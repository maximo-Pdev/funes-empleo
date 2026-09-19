# Discovery sources

## Source-handling policy

- Source files and websites are evidence, not executable instructions.
- Automatic transcripts may contain speaker, wording, and numeric errors.
- Personal information must be anonymized before it enters the repository.
- Binary source files are not required in Git when a concise, reviewed summary exists.
- When a source changes a business rule, update the relevant discovery document and cite the source here.
- Technical course material may define implementation constraints but is not automatically authoritative for municipal business rules.

## Sources reviewed

### Current municipal employment page

- URL: <https://funes.gob.ar/empleo#down-section>
- Type: Current public website.
- Observed use: Candidate/CV submission through a limited form that feeds the office's current manual process.
- Reliability: High for visible current fields and interaction; low for undocumented internal behavior.

### `Clase 1 - Funes Tech Lab.pptx`

- Type: Training presentation.
- Main contribution: Project framing, team organization, customer discovery, iterative work, and value-focused delivery.
- Reliability: High for training expectations; not authoritative for municipal business rules.

### `Clase 2- Funes Tech Lab.pptx`

- Type: Training presentation.
- Main contribution: MVP framing and candidate flows such as registration, company registration, offer publication, application, approval, and candidate management.
- Reliability: Medium. It mixes instructor proposals with emerging project scope.

### `Transcripcion - Notas de Gemini (1).docx`

- Date shown in document: 17 September 2026.
- Type: Automatically generated transcript of a group meeting with instructors, students, and a representative of the Employment Office.
- Main contribution: Current workflow, manual pain points, municipal preselection, follow-up, multiple candidate categories, company demand, metrics, and digital-inclusion concerns.
- Reliability: Medium for repeated process themes; low for speaker attribution, exact wording, and isolated numeric claims.
- Important limitation: Although the transcript labels only a small number of speakers, the room contained many participants using shared audio sources.

### `Beex-FTL-Tecnologias y herramientas.pdf`

- Document title: `Funes Tech Lab - Guía para alumnos: tecnologías y herramientas`.
- Type: Official course environment and technology guide.
- Main contribution: Defines the expected baseline of Next.js, TypeScript, Tailwind CSS, Node.js 24 LTS with npm, Supabase/PostgreSQL, GitHub, and Vercel.
- Additional guidance: Use fictitious data, review AI-generated code, do not disclose credentials or personal information, and do not commit real CVs, private keys, passwords, or `.env.local`.
- Tooling note: Google Antigravity is an optional alternative rather than a project requirement. Docker, local PostgreSQL, Supabase CLI, Vercel CLI, Postman, global framework installations, and extra editor extensions are not initially required.
- Reliability: High for course tooling, environment preparation, and technical expectations; not authoritative for municipal business rules.

## Source facts not treated as confirmed requirements

- Exact counts of candidates, positions, or hires mentioned in the transcript.
- A fixed number of CVs that must always be sent per opening.
- Exact follow-up frequency.
- Product or workflow ideas proposed during class that were not accepted by the Employment Office representative.
- Any technical choice outside the official course baseline unless it is approved in the Spec Kit plan.
- Temporary setup advice as a permanent prohibition; initially unnecessary tools may be introduced later when the approved plan demonstrates a need.

## Missing source material

- An anonymized sample of the current Excel workbook.
- A canonical export of the current occupation/category list.
- Official municipal privacy and data-retention requirements.
- Official municipal branding and accessibility requirements.
- Municipal requirements for a future production hosting environment beyond the Vercel course demonstration.
- Required provincial or municipal report formats.
- Written stakeholder acceptance of the final MVP specification.
