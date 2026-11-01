# Simetría de páginas y detalles — EXTRA115

Mateo señala un defecto real en el seguimiento: dos pilas independientes colocan
el aviso de caso finalizado encima de una sola columna. Registrar contacto empieza
más abajo que Historial de contactos y las tarjetas siguientes no comparten filas.
La revisión114 comprobaba listados; no demuestra aceptación visual de detalles.

## Criterio y corrección

Usar grillas planas con filas compartidas. Cada par ocupa dos columnas iguales
desde1024px y comparte borde superior/inferior según el mayor contenido natural.
Un aviso general o bloque sin par ocupa una fila completa. Sin alto de viewport,
recorte de texto, huecos ficticios, CSS order nuevo o JavaScript de medición.
El único panel de cada celda se estira; sus campos grid conservan altura natural.
Padding24px (20 móvil), con los tokens/controles existentes y significado de rojo.

- Seguimiento: acciones en fila completa; contacto/historial, preentrevistas/
  respuesta empresarial y cronología/notas son pares. Conservar feedback anterior,
  claves, estados, anclas, formulario, conversión horaria y todos los registros.
- Candidato administrativo: mantenimiento primero cuando corresponde; activación/
  vinculación pares; Perfil/CV pares antes de notas y participaciones; nota nueva/
  notas y cuenta-perfil/participaciones pares. Gestión de acceso ocupa fila propia.
  Si no existe CV por archivo, Perfil ocupa la fila completa, sin tarjeta vacía.
- Oferta administrativa: información izquierda y decisión derecha alineadas;
  historial en fila completa antes del matching. Cinco eventos/Mostrar más intactos.
- Empresa administrativa: decisiones de acceso pares; comando único por archivo
  ocupa toda la fila. Cursos: dos áreas enmarcadas con bordes alineados.
- Métricas: paneles de conteos y distribución iguales en ancho/alto; sin cambiar
  datos, indicadores, leyendas, filtros o exportaciones. Cuenta administrativa
  conserva controles, alineando encabezados y acceso de contraseña al pie.
- AuthSurface: recuperar/verificación/logout/cambio de contraseña usan columnas
  iguales y tarjetas alineadas; mínimos intrínsecos corregidos para320px. Home
  conserva su composición de acceso. Mantenimiento/alta presencial agrupan pares
  de campos existentes sin reordenarlos: nombre/DNI, teléfono/correo, detalle/domicilio.

## Inventario de las31 páginas

| Página | Revisión de simetría |
| --- | --- |
| `/` | Tres modos de acceso y sesión; conservar centrado natural. Proceso, cifras y carrusel ya comparten geometría por grupo. |
| `/ofertas` | Tarjetas de la misma fila mantienen encabezado/categorías/cierre alineados; aside es contenido auxiliar, no una oferta par. |
| `/ofertas/[openingId]` | Secciones de contenido de ancho común; CTA auxiliar no se fuerza como par de requisitos. |
| `/cursos` | Enlaces de formación, ancho común y contenido completo; sin pares artificiales. |
| `/terminos` | Lectura única con ancho legible, sin tarjeta vacía. |
| `/dashboard` | Siete secciones: resumen, perfil, postulaciones, ofertas, cursos, cuenta y notificaciones. Grupos pares de114 conservados. |
| `/account` | Candidato/empresa/admin; alias y encabezados/acciones administrativas revisados. |
| `/empresa` | Dos resúmenes iguales y acciones al pie; ofertas recientes conservan filas. |
| `/empresa/perfil` | Un formulario, sin pareja ficticia; campos/toggles intactos. |
| `/empresa/ofertas` | Listado por filas, títulos/estados y páginas intactos. |
| `/empresa/ofertas/nueva` | Formulario único y controles actuales; ancho común. |
| `/empresa/ofertas/[openingId]` | Consulta/edición e historial; navegación de derivaciones se verifica separada del lector. |
| `/empresa/notificaciones` | Lista cronológica de ancho común; sin dividir el orden. |
| `/admin` | Paneles de gráficos con columnas/bordes alineados. |
| `/admin/candidates` | Tabla/filtros de ancho disponible; no convertir filas en tarjetas. |
| `/admin/candidates/[candidateId]` | Grilla plana; digital, presencial sin cuenta, vinculado y estados disponibles. |
| `/admin/atencion-presencial` | Alta con pares de campos y listado debajo; sin duplicar registros. |
| `/admin/candidates/assisted` | Alias al apartado presencial, sin pantalla alternativa. |
| `/admin/empresas` | Tabla/filtros, ancho disponible y filas legibles. |
| `/admin/empresas/[companyId]` | Datos, decisiones de acceso pares y ofertas paginadas. |
| `/admin/openings` | Tabla/filtros/paginación; estados y exclusión de borradores intactos. |
| `/admin/openings/[openingId]` | Información/decisión pares e historial completo debajo, antes del matching. |
| `/admin/participations` | Tabla/lista/filtros, sin cambiar estados o páginas. |
| `/admin/participations/[participationId]` | Corrección de la captura: pares por fila incluso con caso finalizado o vacío. |
| `/admin/courses` | Gestión de enlaces y candidato/historial con marcos alineados; con/sin selección. |
| `/admin/metrics` | Paneles pares y filtros/exportación conservados. |
| `/admin/notificaciones` | Cronología de ancho común; sin reordenar avisos. |
| `/recover` | Tarjetas iguales en PC, columna explícita y texto adaptable a320. |
| `/verification-expired` | Mismo AuthSurface, incluyendo título largo. |
| `/update-password` | Mismo acabado para los tres roles; controles/validación intactos. |
| `/logout` | Mismo AuthSurface; prueba solo consulta, sin enviar cierre. |

Loading/error/404 se revisan como estados, sin añadir contenido para llenar espacio.
La matriz histórica113 documenta anchos;115 sustituye su decisión de conservar
pilas independientes en detalles. Los contratos de permisos/negocio no cambian.

## Excepciones de navegación verificadas

La sidebar general tiene264px y el contenido usa el espacio restante. El aside
público mide304px y la navegación de derivaciones hasta320px, con24px de separación
respecto del lector. Son navegación/contenido, no dos tarjetas de datos pares.
Comprobar inicios, separación, límites y apilado móvil, sin exigirles igual ancho.
La auditoría inicial aplicó erróneamente la comparación de pares a esa navegación;
se conserva el resultado y se reemplaza por estas comprobaciones explícitas.
No hay excepción genérica para tarjetas con funciones distintas.

## Verificación

Instancia local ficticia propia funes-admin-cv-check, API54341/DB54342/app3001;
sin restablecer la base habitual, migración o escritura alojada. La auditoría lee
los estados existentes y mide el panel enmarcado real, no solo su wrapper.
Los resultados finales y limitaciones se registran al terminar en cambios-extra.md
y implementation-status.md. Evidencia local ignorada: extra115-before-final.json,
extra115-final-*.json y capturas. No constituyen aceptación humana o publicación.

Resultado final:59 variantes × cinco anchos =295 vistas, sin overflow/errores de
cliente;95 medidas de detalles reales y30 de AuthSurface.78 barridos axe PASS.
1608 unit/componentes,60 tooling, tipos/lint/build frío/diff y12 E2E finales PASS.
Las pruebas de navegador cubren los estados disponibles del fixture; los estados
archivados/vinculados/suspendidos adicionales se verifican en componentes. Solo
Chromium medido, sin afirmar validación de otros motores. Se conserva la auditoría
inicial que detectó los desbordamientos; las correcciones pasan en la repetición.

Pruebas persistentes en tests/e2e/detail-card-layout.spec.ts: caso abierto referido
y contratado, alineación antes/después del error de contacto y retención del texto,
apilado móvil, además de recuperación/verificación/logout a1920/320. No envían
registros incompletos al servidor ni modifican resultados. Las aserciones unitarias
de orden mantienen Perfil/CV antes de notas; ya no exigen las pilas DOM retiradas.

Recuperación por revert del cambio visual, conservando datos y auditoría.
