# Home public metrics and demo offers
Objective: replace Home role cards with real anonymous-safe totals and add six fictitious hosted demo offers.
Branch: feature/status-badges; route: inline implementation plus independent security/remote-write review. Delivery: local source only; no commit/push/application deployment authorized. Runtime: Node 24.22.0/npm 11.19.1.

## Specs
- S1 — «Reemplaza en Home "Cada perfil entra por el camino correcto" por métricas del portal como había en la página original (postulantes registrados, empresas registradas y cantidad de ofertas de trabajo)». Replace only this section; preserve hero, process, carousel, FAQ and closing shortcuts.
- S2 — «Claro, que muestre cantidades reales Además agrega algunas ofertas de prueba para que el carrusel de Home se vea más completo». Use real database aggregates, not old demo constants or carousel item counts. Genuine zero and unavailable are distinct.
- S3 — Target: «En la demo publicada». User answered «Si» to using the existing Supabase CLI session to add fictitious offers without deleting/replacing current data. Authorized target: kyjycjojzhwggjuqjnki, verified CLI project Funes-empleo. Add six clearly fictitious public offers to the two existing active manual-test companies, preserving current records/accounts/storage.
- S4 — Approved counting/schema proposal: «Propongo contar perfiles de postulantes y empresas no archivados —incluidos asistidos, incompletos o suspendidos— y ofertas públicas vigentes. Para eso necesito agregar en Supabase una función que devuelva únicamente esos tres totales, sin exponer datos personales. ¿Autorizás aplicarla en la demo con ese criterio?» User: «Acepto la propuesta. Si autorizo». Public RPC returns only candidates/companies/offers; no table grants or private records. Public offers reuse the existing eligibility view, independent of pagination and vacancies.
- S5 — Verification derived from S1-S4: focused service/Home tests, permission/aggregate SQL checks, exact remote readback, existing-row preservation, production-browser desktop/mobile proof. No fixture reset or mutation-based E2E wrapper. No application publication without separate authorization.

## Tasks
- T1 [S1,S2,S4,S5] inline — pending — public aggregate migration, service, Home section, tests/documentation; Risk items 2/3 (public privileged aggregate boundary); commit: not requested.
- T2 [S3,S5] inline — pending — reviewed additive hosted migration/offer transaction, preservation checks, readback and carousel proof; Risk items 1/2/3 (remote additions and public SQL boundary); commit: not requested.

## Log
- L1 — Original request: «Reemplaza en Home "Cada perfil entra por el camino correcto" por métricas del portal como había en la página original (postulantes registrados, empresas registradas y cantidad de ofertas de trabajo)».
- L2 — Clarification: «Claro, que muestre cantidades reales Además agrega algunas ofertas de prueba para que el carrusel de Home se vea más completo»; target «En la demo publicada»; CLI authorization «Si»; aggregate-definition/schema authorization «Acepto la propuesta. Si autorizo».
- L3 — Original af7b9aa Home contained fixed 500/50/100 demo figures. No public aggregate RPC exists in the reviewed repository. Existing public_offer_rows already centralizes eligible published offers. Do not weaken admin_metrics authorization or expose private data.
- L4 — Read-only hosted preflight matched Funes-empleo/kyjycjojzhwggjuqjnki. Observed seven accounts, four candidate profiles, three company profiles, three openings/two public. Two documented fictitious active companies and one active fictitious admin resolved; no credentials were read. Final transaction will recheck these preconditions; never replace current records.
- L5 — Mapping delegation deleg_90485479 returned path evidence, safe aggregate boundary and workflow/audit constraints. Parent owns all writes. Estimated authored source/test change approximately 250 lines plus fixture/verification SQL; no automatic publication.
