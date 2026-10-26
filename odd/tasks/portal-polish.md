# Pulido integral del portal (listado "Cosas a implementar")

Objetivo: aplicar el listado completo de cambios pedido en `Cosas a implementar.txt`, respetando la prioridad marcada (URGENTE → MENOS URGENTE → ADMIN → EMPRESA).
Rama base: `main` (ya contiene el rescate del árbol sucio + los 25 fixes e2e). Estrategia de entrega: `ask-on-risk` (PRs por grupo, ~400 líneas autorales por slice). Runner: `npm run test:unit` + `LOCAL_ACCEPTANCE_PROJECT_OWNED=funes-empleo npm run test:e2e`.

## Specs

### URGENTE

- **S1 — /ofertas al diseño actual.** Adaptar `/ofertas` al diseño vigente (navbar, colores, estilos, etc.).
- **S2 — Breadcrumbs en admin.** Agregar breadcrumbs en los flujos de administración.
- **S3 — Localidad combobox múltiple.** Al registrarse, la localidad debe ser seleccionable con un Combobox múltiple (https://ui.shadcn.com/docs/components/base/combobox).
- **S4 — CUIT sin separadores.** Al registrarse, que el CUIT también verifique si se pone sin separadores.
- **S5 — Panel por rol al iniciar sesión.** Al iniciar sesión abrir el Panel de cada usuario (admin, empresa y postulante), no la sección "Cuenta".
- **S6 — Cursor manito.** Que todos los botones tengan el cursor manito.
- **S7 — Mensajes y barras de carga.** Mensajes y barras de carga para cada acción.
- **S8 — Quitar términos de programación.** Quitar términos de programación ("MVP" en Registro→empresa, variables en inglés en panel de admin, etc.).
- **S9 — Skeleton del nuevo diseño.** Cambiar la estructura de skeleton que quedó de la página original por la del nuevo diseño (https://ui.shadcn.com/docs/components/base/skeleton).
- **S10 — Quitar "Importaciones".** Quitar la sección y página "Importaciones" de admin, y retirar todas las reglas relacionadas (la oficina no carga CV físicos antiguos como MVP).
- **S11 — Renombrar "Atención presencial".** Cambiar el nombre de la sección "Atención presencial" del dashboard de Admin a "Perfil asistido".
- **S12 — Popover de horarios/días.** Implementar un popover de selección de rango de horarios y días en el registro de empresa.
- **S13 — Paginación aria en español.** Todo lo que lleve paginación hacerlo con https://ui.shadcn.com/docs/components/aria/pagination, en español.

### MENOS URGENTE

- **S14 — Botón de tutorial en Home.**
- **S15 — Testear flujos con ollama DeepHat.**
- **S16 — Páginas restantes de estilo.** Comprobar qué páginas quedan por cambiar de estilo (session-expired, 404, etc.).
- **S17 — FAVICON** para la pestaña del navegador.

### ADMIN › Candidatos

- **S18 — Sacar botón "Nueva atención presencial".** No corresponde en esta sección.
- **S19 — Rediseñar búsqueda de candidatos.** 1) aclarar qué significa "TÉRMINO"; 2) Habilidades es una categoría muy amplia y poco ilustrativa (difícil distinguir con errores de ortografía); 3) "LOCALIDAD" seleccionable como en S3; 4) quitar "Seleccioná una opción" de "APTITUD PARA DERIVACIÓN"; 5) "CATEGORÍA" con Combobox múltiple; 6) "DISPONIBILIDAD" y "VIGENCIA" parecen similares, eliminar una.
- **S20 — Ícono (i) con Hover Card.** Mostrar resumen de lo que significa cada campo en la búsqueda de candidatos; clickeable en celular (https://ui.shadcn.com/docs/components/aria/hover-card).
- **S21 — Barra de carga** al clickear "Buscar candidatos".
- **S22 — Data Table.** Cambiar tarjetas de postulantes por una Data Table (https://ui.shadcn.com/docs/components/aria/data-table#filtering) con sus campos.

### ADMIN › Atención presencial

- **S23 — Consentimiento solo al registrarse.** Eliminar "Consentimiento presencial"; aceptar consentimiento como "Términos y condiciones" solo al registrarse, que no pueda retirarse.
- **S24 — Solo perfiles de atención presencial.** Que los perfiles que aparezcan correspondan solo a la atención presencial y no archivados/desactualizados.
- **S25 — Rediseñar búsqueda** como en "Candidatos".
- **S26 — Categorías laborales por Combobox amplia.**

### ADMIN › Empresas

- **S27 — Data Table** en [Empresas→Empresa→Ofertas de la empresa→Candidatos con rubros coincidentes].

### ADMIN › Mi cuenta

- **S28 — Quitar "Continuar en el portal"** (redundante).
- **S29 — Renombrar "Mi cuenta" → "Cuenta"** (se pueden suspender otras cuentas de administrador).

### EMPRESA › Ofertas

- **S30 — Rediseñar "Nueva oferta"** al estilo de la búsqueda de candidatos. Campos "modalidad" (Presencial / Teletrabajo a distancia / Híbrido / Modalidades especiales o rotativas, con sus descripciones) y "horario" (Por tiempo indeterminado / A tiempo parcial / A plazo fijo / De temporada / Eventual, con sus descripciones) seleccionables.
- **S31 — Ícono (i) con Hover Card** con resumen de lo que significa cada campo al crear una nueva oferta; clickeable en celular.

## Tasks

| ID | Specs | Ruta | Estado |
|---|---|---|---|
| T1 | S1 | inline | ✅ `d90bfa1` |
| T2 | S2 S11 S29 | inline | ✅ `d90bfa1` + `5af46af` (S2 ya tenía navigation en admin-shell) |
| T3 | S3 S4 S12 | inline | ✅ `c32df95` (S3 localidad combobox, S12 horarios popover; S4 ya validado) |
| T4 | S5 S28 | inline | ✅ `d90bfa1` |
| T5 | S6 S7 S8 S9 | inline | parcial: S6 S8 S9 ✅; S7 pendiente |
| T6 | S10 S18 S23 S24 | inline | parcial: S10 ✅ `7890794`, S18 ✅ `d90bfa1`; S23 S24 pendiente |
| T7 | S13 S17 | inline | parcial: S17 ✅ `d90bfa1`; S13 pendiente |
| T8 | S19 S20 S21 S22 | inline | ✅ `7862687` + `80d5564` (S19) + `ac8c00a`/`7379c24` (S20 hover-card, S21 carga, S22 data table) |
| T9 | S25 S26 S27 | inline | ✅ `90e1e69` (S25 cubierto por form compartido de S19; S26 categorías combobox; S27 data table) |
| T10 | S30 S31 | inline | pendiente (requiere shadcn combobox/hover-card) |
| T11 | S14 S15 S16 | inline | pendiente |

## Log

- **L1 (pedido, verbatim):** «Tengo un amplio listado de cambios para que hagas» + adjunto `Cosas a implementar.txt` (1298 tokens, transcrito en los Specs de arriba sin resumir los fragmentos pedidos).
- **L2 (decisión):** «Pushear a origin/main ahora (dispara deploy a producción Vercel) y arrancar el listado nuevo». Rescate + fix + merge de PR #77 + push a `main` completados; `main` en `809aac5`.
- **L3 (progreso, tanda 1):** `d90bfa1` (S1 ofertas header, S5 panel por rol, S6 cursor, S8 sin "MVP", S11 "Perfil asistido"/"Cuenta", S17 favicon, S18 quitar "Continuar en el portal", S28 quitar "Nueva atención presencial", S29 "Mi cuenta"→"Cuenta"). S4 verificado ya resuelto en `validation/common.ts` (normaliza separadores).
- **L4 (progreso, tanda 2):** `7890794` (S10 retiro completo de Importaciones: rutas `(admin)/admin/imports`, `api/admin/imports`, `features/imports`, `validation/candidate-import`, tests + refs de nav/reference-url). `5af46af` (S11/S29 en breadcrumbs restantes + `accountAccess.admin.label`). Gates: typecheck ✅, lint ✅, unit 1219/1219 ✅.
- **L5 (progreso, tanda shadcn):** `dbd3085` (S13 paginación base-nova en español, 9 listas). `c32df95` (S3 localidad combobox, S12 popover horarios). `7862687` + `80d5564` (S19 rediseño búsqueda: "Búsqueda por palabra" en nombre/resumen/localidad, quitar "Habilidades" y "Vigencia", localidad combobox, categorías combobox múltiple, quitar "Seleccioná una opción" de aptitud). `ac8c00a`/`7379c24` (S20 hover-card informativo por campo, S21 barra de carga con `useTransition`, S22 data table de candidatos). `90e1e69` (S26 categorías laborales en combobox múltiple, S27 data table en candidatos con rubros coincidentes). Gates por cada tanda: typecheck ✅, lint ✅, unit 1219/1219 ✅, build ✅.
