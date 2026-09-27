# Portal Municipal de Empleo de Funes

MVP de intermediación: la Oficina modera ofertas, preselecciona y deriva candidatos.
No es un padrón público ni un mercado de contacto directo.

## Estado y límites

Fases 1–8 integradas; fase 9 en validación. Solo datos ficticios. La importación usa
`demo-candidates-v1`, no el Excel municipal. Producción, catálogo oficial, consentimiento
y otras aprobaciones siguen bloqueados: [gates](docs/validation/release-gates.md).
Las pruebas automatizadas no sustituyen aceptación humana ni revisión del compañero.

## Desarrollo local

Node **24.21.0**, npm **11.19.0**, Git y Docker Desktop activo. Supabase CLI es dependencia
local; no instalar otro gestor. Ver [quickstart](specs/001-municipal-employment-portal/quickstart.md).

```powershell
npm ci
npx supabase start
node tests/fixtures/reset-local.mjs --confirm-local-reset
# Solo si no existe .env.local; nunca sobrescribirlo.
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Completar `.env.local` privadamente con valores de Supabase **local**, sin pegarlos al chat.
Abrir `http://localhost:3000`. Las cuentas y datos del seed son ficticios; nunca
reutilizar sus contraseñas en un entorno con personas reales. El reset destruye solo
datos locales de prueba y valida 500 candidatos/50 empresas/100 ofertas/1.000 casos.

## Calidad

```powershell
npm run typecheck
npm run lint
npm run test:unit
npm run test:db
npm run build
# Cargar blobs y validar fixture antes de E2E; test:db no carga archivos de Storage.
node tests/fixtures/reset-local.mjs --confirm-local-reset
npm run test:e2e -- --workers=1
```

Los E2E necesitan variables locales cargadas en el proceso, URL `127.0.0.1:54321`
y build. `metrics-fixture` se ejecuta primero; luego `quality-boundaries` y los
recorridos que mutan datos. No repetir contra el fixture alterado sin restablecerlo.
Recuperación requiere además `LOCAL_MAILPIT_URL`; una omisión no acredita cobertura.

## Operación y revisión

- [Manual local/preview/demo y recuperación](docs/operations/demo-runbook.md).
- [Calidad](docs/validation/quality-gates.md), [autorización](docs/validation/authorization.md),
  [auditoría](docs/validation/audit-matrix.md), [accesibilidad](docs/validation/accessibility.md).
- [Aceptación y rendimiento](docs/validation/performance.md),
  [resultados quickstart](docs/validation/quickstart-results.md), [revisión final](docs/validation/final-review.md).

Rama dedicada, PR y revisión del segundo desarrollador; nunca implementar en `main`.
Leer `AGENTS.md` y artefactos aprobados antes de cambiar producto. Registrar extras
necesarios en `cambios-extra.md`; no cerrar decisiones municipales por inferencia.
