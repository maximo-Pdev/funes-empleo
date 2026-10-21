# Diseño de las páginas de acceso restantes

La rama `codex/frontend-auth-design` aplica la identidad municipal del login y
registros a nueve pantallas: recuperación, recuperación inválida, verificación
pendiente, verificación vencida, sesión vencida, acceso suspendido, actualización
de contraseña, cierre de sesión y cuenta.

Login y los registros de candidatos y empresas no se modifican. La presentación
común y los estilos de formularios son locales a `(auth)`, reutilizan Card, SVG,
Lucide y tokens existentes y no cambian componentes funcionales ni estilos globales.

Los campos, acciones, mensajes no enumeradores, guardias y consulta de pares de
administración se conservan. Mi cuenta mantiene los accesos según rol, cierre de
sesión, archivo recuperable con confirmación para candidato/empresa y gestión de
otros administradores sin archivo propio. Las acciones sensibles mantienen énfasis
rojo y confirmación. No se cambia autenticación, autorización, RLS ni base de datos.

Verificación del 2026-10-07: lint, TypeScript, build y 393 pruebas aprobados.
Diez regresiones nuevas verifican formularios, contraseña y confirmación, guardia,
acciones por rol, exclusión del propio administrador y mensajes seguros.
Revisión visual a 360, 768 y 1366 px de las nueve pantallas y tres variantes de
cuenta, con componentes reales renderizados y servicios/cuentas ficticios: sin
hallazgos axe ni desbordamientos, con foco visible. No se acredita envío de correo,
sesión real, transiciones contra backend, NVDA ni zoom real al 200%; T087 sigue abierto.

## Registros compactos — solicitud de Mateo, 2026-10-20

El alcance anterior es histórico. EXTRA029 modifica ahora únicamente los dos
registros con RegistrationLayout servidor y CSS Module local. Tarjetas de igual
ancho/alto en escritorio, espacios y títulos compactos, controles de al menos
44px y campos en dos columnas cuando hay espacio. La ayuda de verificación se
integra en la tarjeta del formulario, manteniendo enlaces y todos los avisos.
No se cambian acciones, reglas, campos, contraseñas, permisos ni mensajes de
validación/conservación EXTRA028. Login y otros formularios mantienen su diseño.

Objetivo: sin scroll inicial en1920×1080; verificar también1920×960 para margen
de navegador. No usar alturas fijas ni ocultar overflow para lograrlo: errores,
móvil y zoom pueden extender el documento. Estilos y estructura compartidos
mantienen simetría sin duplicar dos versiones que diverjan con futuros cambios.

Pruebas: `tests/components/accounts/registration-pages.test.tsx` conserva campos,
accesos y avisos; `tests/e2e/registration-layout.spec.ts` comprueba dimensiones,
scroll, controles≥44px, teclado, axe, móvil360×800 y ancho960×540 equivalente a
reflow, no zoom real/NVDA. La variable opcional `REGISTRATION_LAYOUT_BASE_URL`
acepta únicamente loopback3000/3001 para esta prueba visual; no usarla como
alternativa a las guardias de tests privados ni para altas o correos alojados.
Resultados finales en EXTRA029/estado de implementación. Sin migración ni
dependencias; revisión independiente y aceptación global siguen pendientes.

EXTRA030 (Mateo, 2026-10-20): la fila superior permite alternar “Soy postulante”
y “Soy empresa”, con enlaces a ambos registros e indicación aria-current del tipo
actual. No envía formularios ni comparte datos o contraseñas entre roles. Como
navegación normal, puede descartar datos todavía no enviados al cambiar de página.
Se mantiene la comprobación de simetría y encaje; login/recuperación no cambian.

## Inicio de sesión compacto — solicitud de Mateo, 2026-10-20

EXTRA031/T130 amplía la presentación al login: “¿Todavía no tenés cuenta?” aparece
arriba, a todo el ancho, antes de las tarjetas principales de información/acceso.
Estas tienen igual ancho y alto, reutilizan las bases CSS compactas de los registros
y mantienen controles≥44px. La variante login conserva credenciales en una columna,
AuthForm y todos los accesos de recuperación, verificación y alta sin modificarlos.
No se ocultan contenidos/errores ni se fija alto o scroll interno.

735 tests/51 archivos, tipos/lint/build PASS; navegador11/11 (login4+registros7)
comprueba orden, simetría, ausencia de scroll inicial1920×1080/960, enlaces de alta,
errores/retención, teclado y axe, móvil360×800/reflow960×540. Captura vacía revisada.
Son pruebas visuales/validación cliente en servidor local3001, sin alta, envío o
prueba de Auth privado repetida, NVDA/zoom real o aceptación. No migración ni
dependencias nuevas; otros formularios de acceso conservan su presentación.

EXTRA032/T131 (Mateo, 2026-10-20): ambas tarjetas principales aprovechan la altura
disponible del escritorio, conservando simetría y registro arriba. Flex vertical
solo en login de escritorio; sin alturas fijas, recortes ni scroll interno. En
móvil o ante contenido más alto, el documento sigue creciendo naturalmente.

Verificado localmente:735 tests/51 archivos, tipos/lint/build y navegador11/11
PASS. Ambas tarjetas miden817px de alto en1080 y697px en960, sin scroll inicial;
registros intactos. Móvil360×800, reflow960×540 y escritorio bajo1280×540 conservan
accesos/teclado/axe; errores y datos conservados. Captura1920×1080 revisada. Sin
alta/envío, cambios alojados ni suite privada/NVDA/zoom real repetidos.

## Disposición vigente del login — esquema de Mateo, 2026-10-20

EXTRA033/T132 sustituye la disposición anterior de EXTRA031/032: en escritorio,
la información municipal ocupa toda la columna izquierda; la derecha apila la
tarjeta “¿Todavía no tenés cuenta?” y el inicio de sesión. Las columnas tienen
igual ancho y comparten límites superior/inferior. Último refinamiento de Mateo:
centrar el conjunto en el espacio libre, sin expandirlo para llenar la pantalla;
las alturas se determinan por el contenido y no cambian al aumentar el viewport.
La tarjeta de ingreso no tiene que igualar por sí sola la altura de la guía.
En móvil se apilan registro, login e información. Grilla con áreas CSS locales,
sin alturas fijas/recortes/scroll interno ni cambios de campos, Auth o enlaces.
Los resultados previos conservan valor histórico. Esta nueva disposición pasa735
tests/51 archivos, tipos/lint/build y navegador11/11: centrado y alturas estables
entre1080/960, sin scroll inicial, disposición y extremos alineados, móvil/reflow/
escritorio bajo, errores/retención/teclado/axe/enlaces y regresión de registros.
Captura1920×1080 revisada. Sin cambios alojados, altas/envíos, reset ni Auth
privado/HTTP/NVDA/zoom real repetidos; revisión/CI/aceptación siguen pendientes.
