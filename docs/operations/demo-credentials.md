# Credenciales de prueba: local y demo alojada

Los scripts alojados exigen contraseñas privadas por rol. No tienen fallback
al seed local ni una contraseña compartida. El reset alojado está bloqueado;
esta reparación de código no rota contraseñas ni habilita publicar el repositorio.

El fixture actual cuenta con **10 identidades ficticias**: 2 administradores,
4 candidatos y 4 empresas. Los scripts alojados resuelven la contraseña de cada
identidad a partir de tres variables por rol.

## Configuración segura

1. El operador autorizado suministra las variables por un canal privado seguro,
   en el entorno del proceso Node. Los scripts no leen archivos `.env`.
2. Usar las identidades ficticias existentes del fixture; no introducir correos ni
   datos personales reales. Las etiquetas siguientes identifican esas cuentas.
3. Resolver todas las variables requeridas antes de acceder a Supabase, Vercel o
   un navegador. Una variable ausente o vacía rechaza el control genéricamente.
   No registrar valores, encabezados, cookies, traces ni `storageState`.

| Control alojado | Variables requeridas | Identidades usadas |
| --- | --- | --- |
| Carga y verificación CV | `DEMO_ADMIN_PASSWORD` | `admin1` |
| Smoke | `DEMO_ADMIN_PASSWORD`, `DEMO_CANDIDATE_PASSWORD`, `DEMO_COMPANY_PASSWORD` | `admin1`, `candidate1`, `company1` |
| Storage | las tres anteriores | `admin1`, `candidate1`, `candidate2`, `company1`, `company2` |
| Rendimiento individual | `DEMO_ADMIN_PASSWORD` | `admin1` |
| Cuatro administradores concurrentes | `DEMO_ADMIN_PASSWORD` | `admin1`, `admin2`, `admin3`, `admin4` |

`.env.example` contiene únicamente valores vacíos. Estas variables son exclusivas
de herramientas Node, nunca `NEXT_PUBLIC_*` ni configuración cliente del portal.
La clave publicable Supabase no sustituye una contraseña. Cada cuenta mantiene
su identidad individual; la variable de rol solo simplifica la configuración
operativa para el fixture reducido.

## Reset alojado: no ejecutar el procedimiento anterior

`acceptance:reset-demo` aborta sin generar SQL. `reset-demo.sql` reemplaza la función
histórica por una negativa incondicional, sin borrar Auth ni ejecutar el seed.
No ejecutar archivos SQL preparados anteriormente ni instalar/copiar el seed local
al proyecto alojado. Aplicar la negativa a una función ya instalada requiere
una operación separada autorizada; modificar este repositorio no cambia el servidor.

Un reset futuro requiere revisión propia, conservación de identidades/credenciales,
alcance ficticio verificable y recibo de integridad. Hasta entonces, las mediciones
que requieren un reset frío siguen pendientes. La invalidación de credenciales y
sesiones históricas y la verificación previa a publicación pertenecen a PC2/PC3,
no a esta reparación ni a una aprobación municipal.

## Acceso administrativo: prerrequisito pendiente

Estado registrado el 2026-10-07 con evidencia aportada por el padre: Supabase CLI
oficial 2.117.0 no pudo completar `projects list --output-format json --log-level
none` por falta de autenticación. No se recuperaron claves administrativas ni se
realizaron operaciones remotas.

El padre solicitará login seguro de la cuenta autorizada o `SUPABASE_ACCESS_TOKEN`
en el entorno del proceso local, fuera del chat. Nunca copiar secretos al chat,
archivos env ni argumentos de comandos. Autenticar no demuestra por sí solo acceso
al proyecto demo: comprobar autorización y aislamiento antes de continuar.

La CLI soporta `projects api-keys` para capturar la clave solo en memoria después
de autenticar y verificar el destino. `db query` vía Management API permite bloquear
la función SQL instalada. Estas capacidades no fueron ejecutadas en este paso;
requieren la operación autorizada y comprobación posterior de PC2/PC3.

El repositorio permanece privado hasta verificar invalidación de credenciales
históricas, manejo de sesiones y bloqueo de la función instalada. El objetivo público
y la aceptación del usuario de PDFs, documentos, fixtures sintéticos y metadatos Git
no sustituyen esos controles ni acreditan revisión o aceptación de la implementación.

## E2E exclusivamente local

El resolver local valida ambos destinos antes de entregar el fixture determinista:
HTTP, hostname exacto `127.0.0.1` o `localhost`, Supabase :54321 y app :3000.
Rechaza userinfo, prefijos engañosos, puertos diferentes, destinos remotos y rutas
adicionales (salvo `/`). Playwright valida también en modo servidor externo.
El operador debe usar un build local preparado con esos mismos destinos, no un
build anterior que conserve configuración pública alojada. El seed y sus hashes
permanecen intactos; `reset-local.mjs` conserva su guard local existente.

## Comprobación sin acceso alojado

`npm run test:tooling` usa el runner nativo Node y transportes simulados, sin red,
Auth ni SQL real. CI ejecuta este gate aparte de Vitest, que no recoge `.mjs`.
### Evidencia vigente de fuente, registrada 2026-10-07

Verificación independiente gentle-ai-verify aportada por el padre, con toolchain
efímero `npm exec --yes --package=node@24.21.0 --package=npm@11.19.0 -- …` y
versiones reales comprobadas:

| Gate | Resultado observado |
| --- | --- |
| `npm ci` | PASS, 464 paquetes, audit 0 |
| Lint y typecheck | PASS |
| `test:unit` | PASS, 478 pruebas en 30 archivos |
| Build | PASS |
| Tooling nativo con Node exacto | PASS, 28/28 |
| Archivos generados rastreados | Sin cambios |

Estos resultados superseden la indisponibilidad inicial por EBADENGINE del escritor,
conservada como historia en EXTRA-015. El RED inicial solo fue presenciado por el
escritor; no se atribuye al verificador. No se repitieron tests en este follow-up
pasivo ni se acredita ejecución de gates remotos.

### Reducción a 10 identidades

La fuente fue actualizada a un fixture de 10 cuentas ficticias (2 admin / 4 candidate
/ 4 company) como parte de este PR. El manifiesto y el hash del seed reflejan los
nuevos conteos. Las variables de entorno alojadas se redujeron a tres por rol.

Estado: implementado y fuente verificada; revisión, rotación/ajuste remota,
publicación, integración y aceptación pendientes. EXTRA-016 registra el cambio.

Referencia y autorización: EXTRA-015 y EXTRA-016 en `cambios-extra.md` y PC1/PC2 en
`odd/tasks/public-repository-credentials.md`. El padre conserva el tracker y la entrega.
