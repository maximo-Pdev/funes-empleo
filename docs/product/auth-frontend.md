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
