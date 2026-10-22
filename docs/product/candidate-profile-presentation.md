# Perfil candidato: activación y consentimiento

Petición de Mateo, 2026-10-22, EXTRA040. Ajuste de presentación, no de reglas.
Fuentes: FR-010/015/036/038/055, OQ-020 resuelta y EXTRA035; RPC existente
activate_candidate en202609190019_candidate_self_service.sql.

## Primera tarjeta

Estado y vigencia al principio del perfil, antes de datos laborales y personales.

| Estado guardado | Presentación |
| --- | --- |
| active | Indicador Perfil activo; nunca botón Activar perfil. No afirma aptitud para una oferta concreta. |
| draft, needs_update, unavailable, consent_withdrawn | Botón solo si los datos guardados satisfacen las condiciones actuales de activación. |
| archived u otro estado | No ofrece activación. Se conserva la etiqueta de estado actual. |

Para mostrar el botón deben existir localidad y resumen laboral no vacíos, al
menos una categoría seleccionada, disponibilidad available, último consentimiento
accepted y CV válido. Workspace ya devuelve solo CV válido no archivado y la ruta
exige cuenta candidata activa. No se añade una consulta, RPC ni permiso nuevo.

Si faltan condiciones, la tarjeta enumera los pasos para completarlas y guardarlas
en las secciones inferiores. Escribir sin guardar no habilita la acción. No se
activa automáticamente ni se fuerza disponibilidad o consentimiento; la Action y
la DB mantienen sus controles de sesión, propiedad, versión y transición. Una
pantalla antigua puede recibir conflicto o rechazo si cambian las condiciones.

El estilo de datos laborales usa data-profile-details, no la posición del primer
formulario; se eliminan estilos destructivos del último form. La activación no
es una acción de eliminación. Se conserva una columna en móvil y la estructura
de datos laborales en dos columnas de escritorio, sin reordenar visualmente el DOM.
Desde EXTRA041 el teléfono opcional comparte la tarjeta Datos laborales y
personales, sin una tarjeta Contacto adicional. Mantiene botón Guardar teléfono
y formulario propio dentro de la misma tarjeta, hermano del formulario de datos,
nunca anidado. Guardar correcciones guarda los datos; Guardar teléfono guarda o
vacía solo ese contacto. Un fallo en cualquiera conserva lo escrito y guardar el
teléfono no envía ni reinicia otras correcciones todavía no guardadas. No se
encadenan dos comandos como si fueran una transacción conjunta.

La carga y consulta de CV aparecen después de la tarjeta de datos y antes del
consentimiento, en el orden real de lectura y teclado.

## Explicación del consentimiento

La Oficina puede registrar y usar los datos para acompañar la búsqueda y gestionar
derivaciones futuras. El consentimiento es general, no uno por oferta. Una empresa
solo ve el perfil laboral, contactos vigentes y CV asociado a su derivación cuando
la Oficina lo deriva a una oferta propia y el permiso sigue vigente. No ve DNI,
domicilio ni notas internas ni explora el padrón.

Una contratación normal o tardía **confirmada por la Oficina** retira el
consentimiento global vigente y revoca todos los accesos empresariales dependientes.
No cambia otras participaciones ni sus resultados y conserva el historial. Corregir
un resultado no devuelve consentimiento; aceptarlo de nuevo exige una acción
afirmativa y no reabre participaciones ni accesos revocados.

Se distingue el retiro manual: bloquea nuevas derivaciones, revoca los accesos y
cierra las participaciones abiertas, conservando finales e historial. Nada cambia
en esas operaciones. No se amplía el retiro a otros usos de datos o su eliminación.

La explicación acompaña, **no sustituye**, policy_text/version/hash devueltos por
el servidor. Por solicitud de Mateo en EXTRA041 se quita el cartel amarillo
inicial: el texto de política demo, versión y advertencia se consultan mediante
Ver política de consentimiento, un desplegable accesible cerrado inicialmente.
La política sigue íntegra y no se falsea la evidencia aceptada.
OQ-001/002 siguen pendientes para usuarios/datos reales;
este ajuste no constituye un aviso legal aprobado ni modifica consentimiento previo.

## Verificación y entrega

Regresiones de componente cubren orden inicial, cuatro estados recuperables,
active sin aptitud completa, estados no permitidos, cada requisito faltante y
texto/confirmación explícita/política íntegra. Navegador conserva el recorrido
real de registro, guardado, consentimiento, CV, activación y gestión de casos,
agregando posición, teclado, indicador activo, móvil y axe.

Resultados y límites de ejecución en EXTRA040 e implementation-status.md.
Sin migraciones, dependencias o variables nuevas, cambios alojados ni reset local.
Publicar solo la aplicación por el flujo habitual de revisión/PR; este incremento
no ejecuta ni acredita el rollout SQL pendiente de EXTRA039.
