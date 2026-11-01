# Catálogo y detalle públicos — EXTRA112

Pedido de Mateo del31/10/2026. Ambas vistas públicas reutilizan HomeNavbar y un
contenedor servidor local: fondo verde, lienzo blanco, encabezado compacto,
tipografía municipal y tarjetas con bordes y espaciado consistentes. El detalle
mantiene condiciones, tareas, requisitos y salario/beneficios cuando existen.

La navbar está siempre visible y marca Ofertas como sección actual, también en
un detalle. Se eliminan el header/logo alternativos y el segundo acceso de cuenta.
Con sesión activa, Mi cuenta lleva al panel del rol y se muestra la campana;
sin sesión, no se consultan avisos privados. HomeNavbar no se modifica: solo se
reutiliza con su contrato existente. Bajo359px se ajustan espacios exclusivamente
dentro de estas páginas, conservando todos los enlaces, el emblema y la campana.

En el detalle, candidato y visitante conservan Postularme con mi cuenta y el
destino por slug. Registrate aparece únicamente sin sesión activa. Empresa y
administración reciben el acceso a su propio panel; no acciones de candidato.
Esto es presentación: los guards, consultas y políticas siguen autorizando cada
destino en servidor y base de datos.

## Contratos preservados

- Filtros de texto, rubro, localidad y modalidad con GET; valores, validación,
  búsqueda/orden/paginación en servidor y reinicio de página al buscar.
- Slugs persistidos, fechas DD/MM/AAAA y elegibilidad pública por estado/vigencia.
- Vacíos, filtros inválidos, errores técnicos y oferta no disponible/404.
- Autenticación, renovación/cierre de sesión, privacidad y postulación existentes.
- Todos los campos del detalle y sus secciones opcionales; texto completo con
  saltos de línea y ajuste de palabras extensas.

No requiere migración, variable nueva, dependencia o cambios en Supabase/Vercel.
No modifica Home, cursos, dashboards o componentes compartidos. LinkButton aplica
las variantes del botón dentro de su límite cliente; las páginas y las consultas
permanecen en servidor. No llamar buttonVariants desde un módulo RSC.

## Revisión manual

1. Como visitante, abrir /ofertas, buscar con los cuatro filtros, ir a otra página,
   recargar y limpiar. Revisar vacío y parámetros repetidos/incorrectos.
2. Abrir una oferta por su slug; comparar campos y opcionales con el registro
   ficticio y navegar con Volver a ofertas. Un slug no disponible no revela datos.
3. Repetir como candidato, empresa y administrador: Mi cuenta abre su panel,
   campana consulta avisos propios y no se ofrece otro registro. Solo el candidato
   conserva la acción para postularse desde el detalle.
4. Revisar320/390/1440/1920px: sin desplazamiento horizontal, navbar y heading
   separados, logo e Inicio con al menos8px y aside debajo del header fijo.
   Probar títulos/cuerpo largos, navegación por teclado y foco visible.

Los recorridos automatizados están en public-offer-search.spec.ts y
session-navigation.spec.ts. Se conserva la renovación real, reapertura del contexto,
cierre explícito e invalidación de las sesiones anteriores. El segundo incluye
mediciones geométricas a320px, además de comprobar el destino de cada rol.

## Entorno y recuperación

Verificaciones:1608 pruebas unitarias/componentes (133 archivos),66 focales
finales y60 tooling PASS; tipos/lint/build/diff PASS. Nueve E2E finales sin
reintentos/omisiones,20 vistas con axe0/overflow0 y separación geométrica>=8px;
consulta de avisos solo en sesiones activas, textos largos, teclado, opcionales
y no disponible/noindex sin postulación comprobados en navegador real.

El navegador detectó un intento de llamar una utilidad cliente desde RSC que
los tests de componentes no detectaban: se corrigió reutilizando LinkButton.
El primer ajuste móvil tampoco cumplía la separación; se conservó el umbral y
se corrigió CSS antes de repetir build y todos los recorridos finales.

Verificación ejecutada en copia ignorada con proyecto ficticio propio
funes-admin-cv-check, API54341/DB54342 y aplicación3001. Se aplicaron a esa copia
las tres migraciones ya mergeadas de main que faltaban en su respaldo; ninguna
es nueva para este incremento. Base habitual y Supabase alojado intactos.

Capturas y resumen locales quedan en
test-results/portal-followups-check/test-results/extra112-*. Se agregó una oferta
ficticia independiente con título/cuerpo largos y opcionales para esa revisión,
sin cambiar ofertas del fixture ni borrar auditorías. No reutilizar estos datos
o credenciales de prueba en entornos alojados.

Recuperar mediante revert del cambio de presentación en un PR; no ejecutar SQL
de borrado o restauración de consentimientos/casos. Evidencia final y limitaciones
en cambios-extra.md e implementation-status.md. No implica aceptación humana,
CI, despliegue o cierre de gates históricos.
