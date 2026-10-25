# Interfaz en español

Petición de Mateo, 2026-10-22, EXTRA051; rama feat/spanish-interface-labels.
Alcance: presentación pública, candidato, empresa y Oficina de Empleo. No cambia
negocio, transiciones, permisos, datos persistidos ni contratos técnicos.

## Etiquetas y vocabulario

Fuente de etiquetas: src/domain/presentation/labels.ts. Los estados se tipan
contra src/domain/states y los canales/decisiones contra domain/catalogs, sin
crear catálogos de negocio paralelos. Cubre cuentas, perfiles, ofertas,
participaciones, consentimiento, acceso empresarial, CV e importaciones. Acciones
de auditoría, motivos, canales y entrevistas tienen presentación española.
Los adaptadores anteriores conservan sus exports para evitar romper consumidores.

Ejemplos: active → Activa/Activo según entidad; draft → Borrador;
pending_review → Pendiente de revisión; changes_requested → Correcciones
solicitadas; in_person → Presencial; no_show → No se presentó.
Respuesta empresarial sustituye Feedback en encabezados y formularios.

Fallbacks españoles no devuelven códigos desconocidos ni propiedades heredadas:
Estado no reconocido, Evento registrado, Motivo registrado o Canal no informado.
El evento, su actor, fecha, orden y detalle autorizado siguen en el historial.
No se traducen ni modifican notas, nombres, experiencia u otro contenido libre.

## Formularios y compatibilidad

Los selectores muestran etiquetas españolas y siguen enviando los mismos value.
Disponibilidad usa Disponible/No disponible con available/unavailable; un filtro
anterior no reconocido conserva su valor sin exponerlo como etiqueta.
Edición de importación usa opciones españolas, no pide escribir códigos ingleses.

Modalidades/contratos legados conocidos tienen etiquetas de presentación. En el
editor empresarial, el input visible muestra la etiqueta y un hidden conserva el
original. Guardar otro campo no transforma onsite/fixed_term ni provoca backfill;
solo una edición explícita modifica ese dato libre. No se impone un nuevo catálogo.

FileInput compartido mantiene el input real y Field con nombre, required,
validación, error, foco visible y archivo nativo. El DOM muestra Seleccionar
archivo/Ningún archivo seleccionado y el nombre elegido, independientemente del
idioma del navegador. Fallar no borra archivo ni confirmación; un reset permitido
reinicia el texto. Excepciones de transporte de importación usan mensaje español,
no Error.message del navegador. Se conservan respuestas españolas de su API.

## Límites deliberados

- No traduce automáticamente contenido libre o nombres de archivos de personas.
- No cambia URLs, IDs, RPC, enums/valores guardados o enviados, ni claves internas.
- Encabezados exactos del CSV y códigos de su contrato conservan su formato.
- No modifica política/hash de consentimiento ni convierte una demo en aprobación.
- Diálogos de selección de archivos, calendarios y mensajes propios del navegador
  o sistema operativo fuera del DOM dependen de su configuración de idioma.
- No requiere migración, nuevas dependencias o variables, ni cambios alojados.

## Verificación

Pruebas de cobertura de enums, acciones auditadas normativas y fallbacks; escaneo
AST de JSX para impedir estados crudos o vocabulario inglés del sistema;
FormData de editor conserva valores originales; selector de archivos español y
error de red conserva CSV/confirmación. Regresiones existentes mantienen guards,
mutaciones y validación; expectativas de texto pasan a español sin cambiar los
selectOption técnicos.

Resultados locales del 2026-10-22: tipos, lint, build y diff-check PASS;
764 pruebas en 58 archivos y tooling57/57 PASS. La cobertura configurada sigue
acotada al esquema de entorno; no equivale a cobertura completa del producto.

Navegador18/18 PASS sin reintentos: español transversal4, recorrido candidato1,
ofertas empresariales3, validación9 y filtro municipal de disponibilidad1.
Público y tres roles con locale en-US; listas, detalles, historiales, filtros y
archivos; axe y ancho360×800 sin overflow, capturas ficticias inspeccionadas.
Guardados/decisiones/autorización y retención PDF/CSV siguen funcionando.
La primera ejecución detectó expectativas inglesas antiguas y una medición axe
antes de aparecer el h1; se actualizaron las expectativas y se espera el contenido,
sin desactivar reglas axe ni omitir recorridos. Ejecución final completa PASS.

Node24 y Supabase local; sin reset de la base existente, migración o cambios
alojados. Servidor next dev cerrado con autorización; servidores de prueba
finalizados. next-env.d.ts preexistente preservado. Los logs/capturas son locales
ignorados por Git. Next mantiene avisos preexistentes de stream cerrado durante
navegaciones abortadas; no provocaron fallos finales ni se modificaron para esto.
No ejecuta suite SQL/E2E completa, NVDA o aceptación con personas. CI/revisión
humana, aprobación municipal y tareas históricas siguen sin acreditarse.

## Integración para publicar el PR

main avanzó a8c1612b (PR66) después de la primera verificación. Se preservaron la
portada y el sidebar del compañero, las tres secciones de /account, cvReturnTo y
su hidden returnTo. El selector usa ahora los tokens compartidos de superficie,
texto y foco. La migración oficial de componentes registrada en main sigue
independiente; este incremento no la declara implementada ni agrega dependencias.
EXTRA042 era un ID local no publicado que colisionó con la entrada visual de main;
la traducción se identifica ahora como EXTRA051, sin renumerar registros ajenos.

Revalidación integrada:807/807 pruebas en63 archivos, tooling57/57, tipos/lint/build
y diff contra main PASS. Navegador18/18 sin reintentos, incluyendo las secciones
perfil/ofertas/postulaciones del nuevo /account. Los tres scripts visuales de main
municipal-style-check, home-responsive-layout-check y home-keyboard-navigation-check
PASS. Sin reset local ni cambios alojados; mismos límites de revisión/aceptación.

Corrección de CI de PR67: el helper de moderación del recorrido de intermediación
también espera Publicada/Rechazada/Cerrada/Cancelada; conserva los selectOption
ingleses y verifica privacidad y participaciones independientes sin saltar etapas.
RED local idéntico al check y GREEN del recorrido completo1/1 sin reintentos.
Tipos/lint/build,807 pruebas y tooling57 PASS; sin modificar producto o pipeline.
La nueva ejecución remota se distingue de esta verificación local.

El helper de medición SC-008A también espera Estado: Publicada; el filtro de
disponibilidad usa selectOption con el value available. Prueba de contrato RED/GREEN
añadida:808 pruebas, tooling57, tipos/lint/build PASS. No cambia los límites de
rendimiento, actores, barrera, datos o auditorías. El reset frío solo se ejecuta
en CI aislada, nunca sobre la base local existente para este arreglo.
