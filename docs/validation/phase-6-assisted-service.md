# Validación local de fase 6 — 2026-09-25

Rama: `codex/temp-phase-6-assisted-service`, creada desde `main` actualizado, commit base
`8b9ff68`. Alcance: T061–T068 de US4. Los checklists de entrada estaban completos
(`mvp-readiness.md` 77/77 y `requirements.md` 16/16) y no se modificaron. No existe
`.specify/extensions.yml`, por lo que no hubo hooks previos ni posteriores.

## Comportamiento implementado

- `/admin/candidates/assisted` permite crear una ficha sin cuenta pública, correo ni PDF,
  siempre con nombre, DNI y al menos un contacto. La sesión determina el administrador responsable.
- El mantenimiento permite corregir datos, contactos, categorías e intereses, disponibilidad,
  consentimiento presencial y notas internas de orientación. Reutiliza la carga privada de CV y
  el historial de la ficha. El perfil asistido puede activarse para evaluación interna sin PDF;
  la derivación sigue exigiendo consentimiento vigente y CV válido dentro de la transacción SQL.
- Las coincidencias por DNI o correo bloquean el alta y generan revisiones persistidas. Las
  decisiones son usar/actualizar el existente, corregir el falso positivo y crear otro, o rechazar.
  Exigen motivo y conservan administrador y fecha. Usar el existente modifica únicamente campos
  seleccionados; también preserva las fechas de categorías no seleccionadas. No hay fusión.
- La cuenta candidata se registra y verifica su correo. Una coincidencia asistida deja pendiente
  su vinculación. Solo administración puede vincular después de comprobar presencialmente el DNI
  exhibido, sin copiar el documento. Conflictos de cuenta, DNI o correo permanecen en revisión;
  resolverlos exige motivo. El perfil conserva ID, origen, estado, consentimiento, CV, casos y notas.
- Las empresas siguen limitadas a la proyección de perfiles expresamente derivados. La revisión
  encontró y corrigió comparaciones SQL con `NULL` en las funciones existentes de reserva/confirmación
  de CV y postulación: una ficha sin `account_id` nunca pertenece a otro candidato.

## Migraciones y recuperación

Se incorporaron migraciones forward-only:

| Migración | Propósito |
| --- | --- |
| `202609190040_claim_assisted_profile.sql` | Comandos protegidos de alta, duplicados, mantenimiento, consentimiento y vinculación. |
| `202609190041_assisted_explicit_updates.sql` | No tocar identidad/versiones al usar una ficha sin seleccionar campos; rechazar comandos nulos. |
| `202609190042_assisted_claim_audit.sql` | Usar el evento normativo `profile_linked` y registrar motivos internos sin PII en auditoría. |
| `202609190043_assisted_field_preservation.sql` | Preservar relaciones no seleccionadas; exigir motivo para resolver conflictos, sin imponerlo a vínculos sin conflicto. |
| `202609190044_assisted_null_ownership.sql` | Negar CV y postulación a candidatos ajenos cuando la ficha no tiene cuenta. |

Las correcciones se generaron después de aplicar las migraciones previas en la base local y no
reescriben ese historial. El incidente de auditoría se detectó mediante pgTAP: un nombre de evento
no incluido en el catálogo causaba rollback. La correctiva utiliza el nombre ya aprobado. Los
defectos de propiedad nula se reprodujeron con pruebas negativas antes de corregirlos.

Ante una falla en otro entorno, detener el despliegue, conservar evidencia sanitizada, verificar
la transacción y `schema_migrations`, y preparar otra migración correctiva. No revertir a los
predicados inseguros ni eliminar fichas/historial. El entorno local exclusivamente ficticio se
reconstruyó desde todas las migraciones y el seed mediante
`node tests/fixtures/reset-local.mjs --confirm-local-reset`.

No se añadieron dependencias ni variables de entorno. Los tipos generados incorporan las nuevas
funciones y conservan los ajustes de nulabilidad de las RPC existentes.

## Evidencia

| Verificación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto. |
| `npm run lint` | Correcto, sin advertencias de ESLint. |
| `npm run test:unit` | 86 pruebas en 16 archivos. |
| Supabase pgTAP tras reset completo | 365 pruebas en 7 archivos; 65 corresponden a US4. |
| `npm run build` | Compilación de producción correcta. |
| Playwright completo, un worker | 23 correctas; 1 omisión ambiental preexistente del recorrido de recuperación de contraseña. |
| Playwright US4 | 2 recorridos correctos: atención/derivación/vinculación y las tres decisiones de duplicados. |
| Axe | Sin violaciones detectadas en alta y mantenimiento del recorrido US4. |
| Revisión visual | Capturas locales revisadas a 360×800 y 1366×768; sin desbordamiento horizontal móvil. Primer foco de teclado: enlace para saltar al contenido. |

Las primeras pruebas unitarias fallaron por módulos inexistentes y las primeras pgTAP por funciones
ausentes. Las pruebas posteriores reprodujeron el defecto de propiedad nula antes de su corrección.
Los selectores de navegador se ajustaron para distinguir el anuncio de ruta de Next y etiquetas
compartidas; el flujo completo final pasó sobre el fixture recién reconstruido.

Fixture: `funes-demo-v1`, 500 candidatos, 50 empresas, 100 ofertas, 1.000 participaciones y 500 CV
ficticios. SHA-256 del seed:
`d476c662ffcdd5474db44717a878689f5e56e658e945b897288161a1ce14c209`.

Entorno observado: Windows, Node **24.16.0** y npm **11.13.0**. El repositorio sigue fijando Node
24.21.0/npm 11.19.0; no se cambiaron sus versiones ni se presenta esta ejecución local como prueba
con esas versiones exactas. Playwright utilizó el build en `127.0.0.1:3000` con
`PLAYWRIGHT_EXTERNAL_SERVER=1`; Supabase y el correo de prueba fueron exclusivamente locales.

## Límites y revisión

La implementación respeta intermediación municipal, cuentas individuales, autorización servidor/SQL,
auditoría, datos ficticios y ausencia de borrado de negocio. Quedan pendientes revisión humana e
integración por PR, CI con las versiones fijadas, NVDA/zoom y aceptación con usuarios de la fase 9.
No se efectuó despliegue remoto ni se resolvieron decisiones municipales pendientes sobre consentimiento,
retención, catálogo o datos reales. Las capturas temporales están en `test-results/`, ignorado por Git.
