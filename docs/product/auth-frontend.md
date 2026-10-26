# Diseño de las páginas de acceso restantes

## Datos conservados entre ingreso y registro — 2026-10-25 (EXTRA-080)

Pedido de Maxi: «si completo mail o contraseña en login que se mantenga si
selecciono "Registrarse" y lo mismo al revés». El recuadro de acceso lee el
formulario montado antes de cada cambio de pestaña, de rol o de envío y lo
restituye como `defaultValue` en el formulario siguiente.

- Correo, contraseña y confirmación son una sola identidad: viajan entre ingreso,
  postulante y empresa. Los demás campos pertenecen a su formulario, así que
  volver a la pestaña anterior conserva nombre, DNI, CUIT y demás datos sin
  mezclar roles.
- La copia compartida pisa a la copia vieja de cada formulario: lo último escrito
  es lo que aparece. Vaciar un campo lo vacía en todas las pestañas.
- Vive solo en memoria del componente y se pierde al recargar. No usa
  `localStorage`, cookies ni el servidor, y no altera validación, acciones,
  autenticación ni autorización.
- Después de una confirmación de registro, el correo registrado queda disponible
  al volver a cualquiera de las dos pestañas.
- Solo se monta un formulario a la vez: mantener el otro oculto duplicaba
  etiquetas y rompía la accesibilidad y las consultas por etiqueta.
- Verificado con 4 pruebas nuevas de persistencia (`tests/components/accounts/access-form-persistence.test.tsx`)
  en ambos sentidos, entre roles y conservando los campos propios de cada
  formulario.

## Reenvío del correo de confirmación — 2026-10-25 (EXTRA-075)

Después de un registro enviado, la tarjeta deja de ser un formulario: muestra un
estado de confirmación compacto con el título «Revisá tu correo electrónico», la
respuesta segura, el reenvío con su espera y un acceso para volver a iniciar
sesión. El selector de tipo de cuenta, el formulario y la nota de campos
obligatorios se retiran juntos, de modo que la tarjeta se reduce (738 px → 372 px
medidos a 1440×900) en lugar de empujar el hero más allá de la pantalla. El
formulario enviado queda montado pero oculto, así que volver a «Registrarse» —o
pasar por la pestaña de ingreso y regresar— conserva todos los datos ingresados y
registrarse de nuevo es un solo clic. «Volver a iniciar sesión» cambia la tarjeta
al ingreso y limpia la URL.

El reenvío usa la acción existente `verificationAction` con su respuesta no
enumeradora, apunta al correo capturado en el envío del alta —no al campo
editable— y queda deshabilitado durante 30 segundos con una cuenta regresiva
visible; al reenviar muestra el mensaje seguro en una región `status` y reinicia
la espera. Es una guía de interfaz del lado del cliente, no un control de
seguridad: no agrega acciones, endpoints ni superficies de enumeración, y no
cambia autenticación, autorización ni datos.

## Avisos de ciclo de cuenta dentro de Home — 2026-10-25 (EXTRA-073)

Los estados de cuenta que antes tenían pantalla propia se muestran ahora en el
recuadro de acceso de Home. `/account-suspended`, `/recovery-invalid`,
`/session-expired` y `/verification-pending` se retiran: responden HTTP 404 sin
redirección ni `Location`, también con parámetros de consulta. Sus consumidores
—`requireActiveAccount`, `loginAction` y `/auth/callback`— redirigen a un único
estado validado: `/?acceso=suspendido`, `/?acceso=sesion-vencida` o
`/?acceso=recuperacion-invalida`.

Solo los valores exactos y únicos seleccionan el aviso; valores ausentes, no
admitidos o repetidos muestran el ingreso normal. Una sesión verificada activa
conserva su panel y no muestra avisos. La suspensión muestra el mensaje de
contacto con la Oficina sin formulario de ingreso, porque el envío no puede
prosperar; la sesión vencida muestra el aviso sobre el formulario de ingreso; el
enlace de recuperación inválido muestra el aviso sobre el formulario de
recuperación y un acceso para volver al ingreso.

`/verification-expired` conserva su URL y su formulario «Reenviar verificación» y
adopta la superficie de Home: campo verde principal, tarjeta blanca con el mismo
bisel, tipografía y controles compartidos. La verificación pendiente no necesita
pantalla: el recuadro de registro ya informa que se enviará un enlace.

El aviso compartido vive en `src/features/accounts/components/access-notice.tsx`
y reutiliza los tokens existentes, el rojo de error ya establecido y la
tipografía municipal, sin paleta nueva; el catálogo de estados y sus destinos
viven en `src/features/accounts/access-notices.ts`. No se modifican
autenticación, autorización, RLS ni base de datos.

Las secciones siguientes conservan decisiones y resultados históricos, incluida
la lista de nueve pantallas con armazón propio, que ya no es la arquitectura
vigente para los estados enumerados arriba.

## Navegación vigente de registro en Home — 2026-10-25 (EXTRA-072)

Home (`/`) reúne ingreso y ambos autorregistros. Las rutas
`/registro/candidato` y `/registro/empresa` se retiran: deben responder HTTP 404
sin redirección ni cabecera `Location`, también con parámetros de consulta.
Los formularios, acciones, validaciones, ayuda de verificación y avisos por rol
se conservan; no se retira la funcionalidad de registro.

Los accesos de registro dentro de Home, incluidos “Registrarme como postulante”
y “Registrar empresa” al pie, seleccionan el formulario correspondiente en el
recuadro existente sin cambiar URL ni abandonar la página. Devuelven el documento
a `scrollY=0` y enfocan `#acceso` sin que el foco provoque otro desplazamiento.
La introducción y el selector muestran el mismo rol; repetir clic o activación
por teclado vuelve a realizar la selección, el retorno y el foco. Respetar
movimiento reducido, sin desplazamiento suave en ese caso.

Desde otras páginas, nuevos contextos o sin JavaScript, los enlaces canónicos son
`/?registro=candidato` y `/?registro=empresa`. Solo esos valores exactos y únicos
seleccionan registro; valores no admitidos, ausentes o repetidos (arrays) muestran
ingreso. No usar un fragmento como sustituto de la selección de rol.

Las secciones siguientes conservan decisiones y resultados históricos.
RegistrationLayout, navegación entre páginas y simetría de tarjetas separadas
no son la arquitectura vigente. El diseño de Home se rige por UI_GUIDELINES.md.
La verificación funcional actual de EXTRA-072 se registra por separado; los PASS
anteriores no acreditan este retiro ni su comportamiento de foco/desplazamiento.

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

## Disposición histórica del login — esquema de Mateo, 2026-10-20

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
