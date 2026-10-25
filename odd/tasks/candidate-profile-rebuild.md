# Candidate profile rebuild
Objective: restore the requested profile UI inside its existing 960px canvas and implement private persisted photo upload/replacement/removal. Branch: fix/landing-unified-access; preserve all unrelated dirty work; no commits or remote operations authorized.
Delivery: local implementation; forecast exceeds 400 authored lines; no publication/PR planned. Runner: Vitest, lint, typecheck, production build, isolated database proof if available without resetting existing data.

## Specs
- S1 — User: “Bien a partir de ahora las cosas que te digo quiero que queden dentro de ese lienzo.” Preserve the 960px profile canvas, surrounding navbar/sidebar and other sections.
- S2 — User: “Quiero empezar al principio con un círculo para el avatar https://ui.shadcn.com/docs/components/base/avatar que al lado estén dos botones: uno para cambiar o subir la foto y otro para eliminarla.” User confirmed: “Si, quiero que subir/cambiar/eliminar la foto funcione y quede guardado. Implementa ese flujo.” Retention decision: “Borrar el archivo anterior”. Actual private persistence, server validation, authorization, stale-version safety, observable cleanup errors; no public candidate image URLs. Photo is not an activation requirement. Use current photo and live full-profile authorization, not historical referral permission. Technical defaults: JPEG/PNG input, maximum 5 MiB, bounded decode 16 megapixels, normalized resized raster with EXIF stripped; document these defaults and existing service-key requirement.
- S3 — User: “Debajo de eso el estados del perfil con un circulo de color correspondiendo al estado: verde activo, amarillo si falta información”. Preserve truthful labels and distinct meanings for existing unavailable/withdrawn/archived states; no invented active state.
- S4 — User fields verbatim: “Nombre y apellido”, “DNI (campo tipo password, con la aclaración «oculto en pantalla»)”, “Localidad laboral”, “Habilidades y experiencia (textarea)”, “Disponibilidad (Disponible / No disponible)”, “Detalle de disponibilidad”, “Domicilio privado (opcional)”, “Categorías laborales (checkboxes, selección múltiple)”, “Teléfono — Formulario separado con botón «Guardar teléfono».” Preserve server actions, validation, versions, activation rules, feedback and stored data; no archive control.
- S5 — User: “Debajo iría la carga de CV en PDF basándote en este componente https://ui.shadcn.com/docs/components/base/attachment.” Preserve CV transport, exact return allowlist, file constraints and download authorization; Attachment changes presentation, not CV retention.
- S6 — User: “Debajo el consentimiento de prueba (a modificar luego).” Preserve complete current text/confirmation and all existing consent effects, not new municipal/legal copy.
- S7 — User: “Estado vacío para avisar que no hay algo subido o faltan datos: https://ui.shadcn.com/docs/components/base/empty” and “Debajo el aviso o texto de cierre.” Reuse official base-nova sources for Avatar, Attachment and Empty, adapted to existing municipal tokens. Keep accessible empty/bootstrap/loading/error states, responsive layout and one main landmark.

## Tasks
- T1 | S2 | delegated (parallel independent backend/UI edit surfaces) | verified in isolated SQL/Storage; competing commits passed | backend photo validator, private metadata/storage/migration, trusted ingestion/read/mutation services/routes, typed contracts and tests; no remote DB writes.
- T2 | S1,S3-S7 | delegated (parallel independent backend/UI edit surfaces) | implemented; focused UI tests and eight desktop/mobile fixture cases passed | official adapted components, photo controls using agreed API, existing profile forms/CV/consent UI; self-verify focused tests.
- T3 | S1-S7 | inline integration + independent high-risk verification | verified locally: actual production photo flow and physical deletion passed | dependency setup, server renderer/canvas integration, documentation/contracts, regression gates and isolated proof. Commit: not authorized; leave local changes.

## Latest local rollout

User renewed authorization: “Además no puedo subir fotos de perfil, arregla eso.” Diagnosis verified the built public endpoint is local127.0.0.1:54321, photo schema is missing, and the photo migration is independent of the six unrelated pending migrations. Applied only202610240001 atomically with its real SQL ledger contents, audit-action preservation precheck and schema reload. Exact readback verified table/RPCs/private bucket/no direct authenticated mutation; old ledger entries unchanged. No existing data reset or remote operation. Actual application upload/readback is checking; do not substitute disabled-controls fallback or an absent shell variable for runtime proof.

## Current runtime correction

User reported `Runtime Error: PHOTO_READ_FAILED` from `getCandidatePhoto` at `photo-service.ts:9`, via `renderCandidateProfileContent` and `renderCandidateAccount`. Local schema-only inspection confirmed the photo table is absent. Two deterministic reproductions covered current-photo and cleanup-query failures; both originally crashed the whole page. The profile renderer now contains only optional photo-read failures, renders an explicit unavailable notice and disables photo controls while preserving existing forms/CV/consent. No schema, permissions or data changed. GREEN:26 focused tests; full929tests70files, lint/typecheck/build/diff-check pass. Original deployment decision remains pending.

## Log
L1 — Original requested scope (verbatim):
Bien a partir de ahora las cosas que te digo quiero que queden dentro de ese lienzo.

Quiero empezar al principio con un círculo para el avatar @url:`https://ui.shadcn.com/docs/components/base/avatar` que al lado estén dos botones: uno para cambiar o subir la foto y otro para eliminarla.

Debajo de eso el estados del perfil con un circulo de color correspondiendo al estado: verde activo, amarillo si falta información
Y debajo los campos para rellenar:
Nombre y apellido
DNI (campo tipo password, con la aclaración «oculto en pantalla»)
Localidad laboral
Habilidades y experiencia (textarea)
Disponibilidad (Disponible / No disponible)
Detalle de disponibilidad
Domicilio privado (opcional)
Categorías laborales (checkboxes, selección múltiple)
Teléfono — Formulario separado con botón «Guardar teléfono».

Debajo iría la carga de CV en PDF basándote en este componente @url:`https://ui.shadcn.com/docs/components/base/attachment`.

Debajo el consentimiento de prueba (a modificar luego).

Estado vacío para avisar que no hay algo subido o faltan datos: @url:`https://ui.shadcn.com/docs/components/base/empty`

Debajo el aviso o texto de cierre.
L2 — Photo persistence clarification: “Si, quiero que subir/cambiar/eliminar la foto funcione y quede guardado. Implementa ese flujo.”
L3 — Retention clarification: “Borrar el archivo anterior”.
L4 — Existing code inspected: profile renderer disconnected, original fields/actions intact. No direct image-decoder/Base UI/CVA dependencies; sharp is only transitive. Existing secret key is provisioned for admin invitations only; photo trusted ingestion requires documented narrowly scoped server-only extension. Existing DB/E2E wrappers reset fixtures and must not run against the current instance. Independent verifier required for storage/RLS/concurrency/dependency effects.
L5 — Parent integration RED: two expected failures for missing profile fields/pending warning; GREEN: 97 focused tests in nine files. Restored profile renderer inside canvas, one workspace load; parent connected durable cleanup-pending signal to the photo form. Node24 and exact npm11.19.1 used for dependency install after default Node26 was rejected; added Base1.9.0/CVA0.7.1/sharp0.35.5. Full regression/browser and independent SQL/security actors dispatched. No existing database has been reset or migrated; schema-only check confirms local photo table is absent.
L6 — Independent review found four blockers: missing audit action check extension; administrator mutation beyond owner-only contract; originating-session logout window in trusted ingestion; cleanup retry sending remove for the new current photo. Corrected in one batch, added UI/service/SQL regressions, fixed invalid referral-revocation reason fixture. Parent fresh full checks after corrections: 927 tests in70files, lint/typecheck/build/diff-check pass. Tooling57tests and responsive fixture8cases passed in prior independent run.
L7 — Provider429 interrupted the final reviewer response, not the saved checks. On resume, parent recovered photo-recheck-20261024 artifacts and verified SHA256 equality against current migration/test/service/storage/form/route. Shipped SQL27/27 and independent permissions14/14 passed; focused snapshot51tests passed. Actual Storage HTTP/file-backend proof confirms byte-exact upload/readback, failed replacement preserves old photo, successful replacement, two HTTP200 deletes with disk absence/read denial, cleanup-only preserving current, and all four audit actions. Parent recheck16tests3files passed. A final isolated successful competing-commit race is checking; no existing database reset/migration or remote operation.

L8 — Recovered final race-proof.json despite reviewer response failure: two independent Auth sessions and PostgreSQL backends; B observed waiting on lock, then rejected CONFLICT_STALE_DATA. Final profile version1->2, exactly one current photo, winner audit1/loser audit0; disposable container removed. Together with recovered27SQL/14permission/physical Storage proofs, all four original blockers are verified corrected. Current original DB still has seven pending migrations (six earlier + photo). Local application deployment and configuration/readback remain pending; request authorization before applying the unrelated earlier migrations, no reset. Final source diff-check clean; no commits or remote changes.

