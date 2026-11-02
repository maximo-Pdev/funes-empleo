# Portal Municipal de Empleo de Funes

MVP de intermediación laboral: la Oficina de Empleo modera ofertas, evalúa
postulaciones y decide qué candidatos deriva a las empresas. Las empresas no
pueden consultar el padrón de candidatos.

## Entrega del curso

- **Aplicación Vercel:** [funes-empleo.vercel.app](https://funes-empleo.vercel.app/).
- **GitHub:** [maximo-Pdev/funes-empleo](https://github.com/maximo-Pdev/funes-empleo).
- **Recorrido y controles de entrega:** [guía de evaluación](docs/operations/course-delivery.md).

| Rol | Usuario de demostración | Panel después de ingresar |
| --- | --- | --- |
| Postulante | `postulante1@prueba.com` | `/dashboard` |
| Empresa | `empresa1@prueba.com` | `/empresa` |
| Municipalidad | `admin1@prueba.com` | `/admin` |

Las contraseñas de demostración se entregan **por un canal privado al evaluador**;
no están en Git ni se deben reutilizar contraseñas personales. Cada administrador
debe tener una identidad individual: no repartir la misma cuenta municipal a
varios evaluadores simultáneamente. El acceso autenticado debe comprobarse antes
de la entrega; esta actualización documental no prueba los logins.

El portal es una **demostración con datos ficticios**, sin habilitar operación
municipal con datos reales. Inicio, catálogo y repositorio respondieron HTTP 200
el 02/11/2026; eso no acredita el commit desplegado ni los recorridos privados.
Ver [estado de implementación](specs/001-municipal-employment-portal/implementation-status.md)
y [validaciones pendientes](docs/validation/release-gates.md).

## Tecnologías

Versiones declaradas en [package.json](package.json), con resolución fijada en
[package-lock.json](package-lock.json):

| Área | Tecnología |
| --- | --- |
| Aplicación y servidor | Next.js 16.3.8, React 19.3.0, TypeScript 6.0.3 |
| Interfaz | Tailwind CSS 4.3.3, shadcn/ui con Base UI 1.9.0, Lucide |
| Entorno | Node.js 24.22.0 LTS y npm 11.19.1 |
| Datos, acceso y archivos privados | Supabase: PostgreSQL, Auth y Storage; supabase-js 2.116.0 y SSR 0.12.7 |
| Validación y documentos | Zod, Sharp, PDFKit y write-excel-file |
| Pruebas | Vitest, Testing Library, Playwright, axe y pgTAP |
| Colaboración y publicación | Git, GitHub Actions y Vercel |

## Funciones principales

- Postulantes: perfil, categorías laborales, consentimiento, disponibilidad, CV,
  postulaciones, seguimiento y notificaciones.
- Empresas: perfil, ofertas sujetas a moderación, candidatos derivados a sus
  propias ofertas, entrevistas, informes de resultados y notificaciones.
- Municipalidad: padrón y atención presencial, empresas, moderación de ofertas,
  participaciones, preentrevistas, derivaciones, confirmación de resultados,
  cursos, historial, notas internas, importación controlada y métricas con
  exportación CSV, PDF y Excel.

Solo una derivación municipal con permiso vigente habilita el perfil, contactos,
foto y CV autorizados para la empresa correspondiente. Al terminar el permiso,
puede conservar únicamente el nombre para identificar su derivación y comunicar
resultados, según las reglas aprobadas.

## Desarrollo local

Requisitos: Git, Node.js **24.22.0**, npm **11.19.1** y Docker Desktop activo.
La CLI de Supabase ya es dependencia local; no hace falta instalarla globalmente
ni ejecutar `supabase init` en este repositorio.

```powershell
git clone https://github.com/maximo-Pdev/funes-empleo.git
Set-Location funes-empleo
npm ci
npx supabase start
# Crear solo si no existe; no sobrescribir una configuración previa.
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Completar `.env.local` **privadamente** con la configuración de Supabase local.
Consultar `npx supabase status` en la terminal local sin copiar su salida a Git,
capturas, chat o informes. La configuración requerida es:

| Variable | Valor o finalidad local |
| --- | --- |
| `APP_ENV` | `local` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable del servicio **local**; nunca service-role/secret |
| `CONSENT_POLICY_VERSION` | `demo-not-approved`, texto ficticio sin aprobación jurídica |

Las demás variables y sus límites están en [.env.example](.env.example) y en el
[manual de operación](docs/operations/demo-runbook.md). El arranque normal no
requiere `SUPABASE_SECRET_KEY` ni contraseñas `DEMO_*` en el navegador.

Para cargar un CV se admiten PDF, JPG/JPEG y PNG, hasta **5 MiB** por archivo.
Las imágenes se normalizan a PDF privado. No se admiten WebP ni videos.

```powershell
npm run dev
```

Abrir [localhost:3000](http://localhost:3000). Para ejecutar el build local:

```powershell
npm run build
npm run start
```

El seed interactivo local tiene **2 administradores, 4 postulantes y 4 empresas**
ficticios. Usa identidades `@example.invalid`, distintas de las cuentas alojadas
de la tabla de entrega. La preparación de CV de prueba y el reset protegido se
explican en el [manual](docs/operations/demo-runbook.md#preparación-local-y-controles).
No ejecutar un reset sobre el servicio compartido de otro desarrollador.

## Verificaciones

```powershell
npm run typecheck
npm run lint
npm run test:tooling
npm run test:unit
npm run build
```

Los gates siguientes **reinician los datos** y requieren Supabase local de
propiedad exclusiva o CI aislado. No ejecutarlos contra datos de trabajo ni
proyectos alojados. Revisar primero [preparación, variables y autorización local](docs/operations/demo-runbook.md#preparación-local-y-controles):

```powershell
npm run test:db
npm run test:e2e -- --workers=1
```

Estos gates usan el dataset TEST-ONLY de **4 administradores / 500 candidatos /
50 empresas / 100 ofertas / 1.000 participaciones**. El gate E2E carga además los
CV ficticios y exige todos los recorridos sin omisiones. No confundirlo con el
seed interactivo ni copiarlo al servidor. El reset alojado permanece bloqueado.

## Documentación y límites

- [Inicio rápido](specs/001-municipal-employment-portal/quickstart.md) y
  [manual local/preview/demo y recuperación](docs/operations/demo-runbook.md).
- [Acceso privado y separación de credenciales](docs/operations/demo-credentials.md).
- [Calidad](docs/validation/quality-gates.md), [autorización](docs/validation/authorization.md),
  [auditoría](docs/validation/audit-matrix.md), [accesibilidad](docs/validation/accessibility.md)
  y [revisión final](docs/validation/final-review.md).

La importación usa el mapeo sintético `demo-candidates-v1`, no el Excel municipal.
SMTP, validaciones humanas y decisiones municipales pendientes deben revisarse
en los gates; no asumir que un registro nuevo o la recuperación por correo
funcionan para cualquier destinatario. No cargar datos reales, CV reales,
contraseñas personales ni claves de Supabase/Vercel en la demostración.

Trabajar en ramas enfocadas y presentar PR; nunca implementar directamente en
`main`. Leer [AGENTS.md](AGENTS.md) y los artefactos aprobados antes de cambiar el
producto. Registrar agregados necesarios en [cambios-extra.md](cambios-extra.md).
