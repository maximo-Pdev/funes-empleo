# Preparación de la sesión manual local

Fecha de referencia verificada: **2026-10-06T23:00:20Z** (reloj Node del coordinador).
Rama: `docs/status-handoff`. HEAD comprobado:
`5d6a51ea0ea2fc253fd3e2e86bf8a4e4d6395f44` (step 3).
La tabla registra evidencia técnica aportada por el coordinador, no aceptación humana.
Los documentos previos de step 4 y el código se conservan sin cambios.

## Disponibilidad observada

| Control | Evidencia de preparación | Estado / límite |
| --- | --- | --- |
| Entorno | `.env.local` existe; no se leyó su contenido ni se modificó configuración. | Existencia solamente; no acredita conexión ni secretos válidos. |
| Runtime | Global: Node 24.16 / npm 11.13, distintos de los pins del plan. Node **24.21.0** verificado en la cache offline indicada abajo; npm 11.19 disponible en cache de la verificación anterior. | Usar Node cacheado directamente; el arranque no necesita npm ni descarga. No se cambió el runtime global. |
| Build fresco | Next 16.3.8 compiló, comprobó TypeScript y generó 14 páginas estáticas con Node 24.21.0; HEAD/código sin cambios y sin escrituras tracked del build. | Correcto para esta preparación, no inferido de la existencia de `.next`. Aviso no bloqueante: lockfile externo `C:/Users/maxim/package-lock` ignorado; no se modificó. |
| Inicio `/` | GET HTTP 200; encabezado «Un puente claro entre personas que buscan trabajo y empresas de Funes.». | Render público comprobado; teclado/zoom humanos pendientes. |
| Ingreso `/login` | GET HTTP 200; encabezado «Iniciar sesión». | Render comprobado; sin envío ni login. |
| Registro `/registro/candidato` | GET HTTP 200; encabezado «Registro de candidatos». | Render comprobado; sin envío. |
| Registro `/registro/empresa` | GET HTTP 200; encabezado «Registro de empresas». | Render comprobado; sin envío. |
| Ofertas / detalle vigente | El render anterior de ofertas devolvió HTTP 200 sin H1 ni enlaces; puerto 54321 inaccesible y `docker version` no pudo conectar al pipe Linux. | Bloqueados en el entorno actual; HTTP 200 no es éxito semántico. La evidencia live de step 3 no acredita disponibilidad actual. |
| Navegadores | Chrome 154.0.8037.98 y Edge 154.0.4258.53 instalados; Playwright 1.63 y Chromium disponibles. | Registrar el navegador realmente usado por la persona; automatización no sustituye sesión humana. |
| NVDA | No localizado en rutas comunes, búsqueda de ejecutable ni procesos comprobados. | Disponibilidad sin verificar; no prueba ausencia. Recorridos NVDA pendientes. |
| Servidor local | El servidor propio de producción fue detenido; puerto 3000 confirmado cerrado al terminar la comprobación. | **Actualmente detenido**: la persona debe iniciarlo para la sesión. |

## Arranque humano sin instalación ni descarga

Desde PowerShell, en la raíz `C:\Users\maxim\Desktop\funes-empleo`, ejecutar:

```powershell
& "C:\Users\maxim\AppData\Local\npm-cache\_npx\44b80b128286abb3\node_modules\node\bin\node.exe" ".\node_modules\next\dist\bin\next" start --hostname 127.0.0.1 --port 3000
```

Mantener esa terminal abierta y visitar <http://127.0.0.1:3000> en un navegador
normal. Si el puerto está ocupado, informar y detener la preparación: **no terminar
procesos ajenos**. Para detener solo este servidor, usar **Ctrl+C en su propia
terminal**. Si falta el ejecutable o el build, informar; no instalar ni descargar.

## Controles pendientes y siguiente paso

- Inicio, ingreso y registros anónimos son elegibles ahora para navegación por
  teclado y zoom real, sin backend, cuentas ni envío de formularios. Comenzar solo
  por el primer caso de [registro de sesión](manual-session-record.md#primer-caso-guiado-inicio-anónimo).
- La persona debe abrir Docker Desktop si desea recuperar el backend. El daemon
  está actualmente inaccesible; no se deduce una causa ni un apagado histórico.
  Solo después de confirmar salud live podrá prepararse una futura comprobación
  semántica de ofertas/listado/detalle. No ejecutar reset, descargas `npx`, migraciones
  ni comandos Supabase que impriman claves durante esta preparación.
- Confirmar disponibilidad/versión de NVDA con la persona antes de un recorrido.
  El registro conserva informes humanos preliminares favorables sobre home: primer
  recorrido al 100 % confirmado y respuesta favorable al solicitado al 200 %, con
  metadatos y confirmación explícita del segundo porcentaje pendientes. No acreditan
  aceptación completa. Los recorridos restantes están **pausados por decisión del
  usuario hasta definir el nuevo estilo**; NVDA y los gates humanos siguen pendientes.
- No se repitieron suites completas unitarias, lint, DB/pgTAP ni flujos privados;
  esta preparación no cierra T069, T087, T089, T092, T096 ni T097 ni gates del MVP.

## Protocolos y evidencia de referencia

Los criterios siguen en la [guía humana](human-validation-guide.md), la
[matriz de accesibilidad](accessibility.md#matriz-manual-obligatoria),
[quickstart](../../specs/001-municipal-employment-portal/quickstart.md) y su
[registro](quickstart-results.md), [rendimiento](performance.md),
[gates técnicos](quality-gates.md), [revisión final](final-review.md) y
[gates de entrega](release-gates.md). Esta preparación local no autoriza ejecutar
los comandos de instalación/reset de otros protocolos ni extrapolar evidencia
histórica al HEAD actual.
