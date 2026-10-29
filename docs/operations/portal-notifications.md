# Notificaciones privadas del portal

EXTRA099,2026-10-28. La campana aparece en el encabezado de las cuentas de
candidatos, empresas y administración. Muestra pendientes y cinco avisos recientes;
«Ver todas las notificaciones» abre la sección propia con20 por página y «Ver más».
Abrir un aviso lo marca leído y navega al recurso. Cada administrador conserva su
lectura independiente. Se actualiza al abrir, al volver a la pestaña y cada30
segundos mientras sea visible. No hay correos ni push externos.

## Matriz

| Cuenta | Avisos |
| --- | --- |
| Candidato | Nominación municipal, preentrevista registrada, derivación, contratación/no selección confirmadas por la Oficina, incluidas correcciones tardías |
| Empresa | Nueva derivación propia, oferta aprobada/publicada o rechazada |
| Cada administrador activo | Oferta enviada/reenviada a revisión, postulación propia del candidato, informe empresarial de contratación/no selección pendiente de confirmar, registro empresarial completo |

La postulación propia no avisa al mismo candidato. El informe empresarial todavía
no es resultado final. Otras etapas, disponibilidad, notas, ediciones y entrevista
empresarial quedan fuera de la matriz. Se conserva el formulario empresarial
existente. La preentrevista propia muestra fecha programada/realizada y canal;
nunca evaluaciones, resúmenes, motivos o recomendaciones. Las participaciones
propias tienen ancla opaca estable, incluidas las antiguas del listado completo.

Un perfil asistido sin cuenta no tiene destinatario personal. Se notifican hechos
futuros después de vincular una cuenta, sin avisos retroactivos. El alta empresarial
notificada es el perfil completo tras verificar el correo, no una cuenta sin
verificar ni una nueva aprobación obligatoria.

## Privacidad y consistencia

Se almacenan tipo, recurso interno, destinatario, fuente y fechas. No hay cuerpos
libres ni copias personales. Lista/apertura consultan propiedad y archivo actuales.
Un aviso no restaura perfil, contacto, foto o CV, ni modifica la proyección mínima
ya autorizada a empresas. No se muestran UUID ni se aceptan destinos del navegador.

RLS por destinatario, sin excepción de lectura general para administradores;
sin escrituras directas de aplicación. RPCs con cuenta activa y sesión viva.
Lectura por POST same-origin, idempotente; GET no marca leído. Respuestas privadas
no-store/Vary Cookie. Un fallo de carga se informa, no se presenta como cero.

El fanout participa en la transacción del evento de auditoría. Si falla un aviso,
revierte el hecho de negocio. UNIQUE por fuente/tipo/destinatario evita entregar
dos veces el mismo hecho. Consentimiento, disponibilidad y permisos se conservan.

## Instalación y recuperación

1. Respaldar según el procedimiento habitual y revisar el historial de migraciones.
2. Aplicar `supabase/migrations/20261028235316_portal_notifications.sql` antes de
   la UI. Transacción aditiva; no reinstalar la base compartida. Si el historial
   está desalineado, revisar/aplicar exclusivamente este archivo y registrar esa
   versión según el procedimiento existente; no reparar versiones masivamente ni
   ejecutar un push con migraciones desconocidas.
3. Verificar tabla/RLS/ACL, trigger audit_notification_fanout y tres RPC públicos;
   comprobar roles, dos administradores y recursos ajenos con datos ficticios.
4. Publicar la aplicación y comprobar campana/lista/destinos. No requiere nuevas
   variables, paquetes o proveedores. Solo eventos insertados desde la migración
   producen avisos; no se recorre la auditoría anterior.

La verificación local no aplica esta migración alojada, publica la UI ni aprueba
el tratamiento de datos reales.

Actualización2026-10-28,EXTRA100: aplicada y registrada20261028235316 en el Supabase
vinculado por pedido posterior de Mateo. Verificación independiente de historial,
seis funciones/ACL, RLS/política/índices/FK/trigger y smoke público PASS. Datos
anteriores conservados, sin backfill ni casos de prueba alojados. La interfaz
todavía requiere publicación por PR; aplicar SQL no despliega el código.

Un fallo de migración revierte toda la transacción. Después, preferir corrección
hacia adelante. Para suspender avisos, un operador autorizado puede deshabilitar
solo audit_notification_fanout y ocultar campana; conservar filas y fuentes, sin
desactivar otros triggers. Reactivarlo no genera backfill. No borrar auditoría ni
inventar una purga: la retención legal sigue pendiente.
