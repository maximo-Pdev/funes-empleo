# EXTRA099 — Análisis previo al código,2026-10-28

Etapas revisadas individualmente: specify matriz N1–N6; clarify dos respuestas
expresas; plan/investigación/modelo/contratos; calidad de requisitos; tareas.

| Requisito | Diseño/contrato | Tareas | Verificación prevista |
| --- | --- | --- | --- |
| N1 | Cuenta destinataria/RLS/read propio | T241,T242,T243 | Dos admins, ID ajeno, suspensión/sesión |
| N2 | Eventos confirmados vs feedback pendiente | T241,T243 | Normal/tardío, sin aviso de resultado prematuro |
| N3 | Agenda mínima y lista cerrada | T241,T243 | Ausencia de notas/recomendación/entrevista empresarial |
| N4 | Proyección vigente y rutas opacas | T241,T242,T243 | Archivo/revocación/propiedad/POST/anchors |
| N5 | Trigger y clave de idempotencia | T241 | Rollback de negocio/fanout y reintento de mismo hecho |
| N6 | Campana/lista paginada/estados españoles | T243,T244 | Teclado/móvil/axe/error/contador |

Sin brechas críticas/altas nuevas ni cambios de consentimiento/disponibilidad/
matching/contratación. FR053 anterior queda acotado por excepción explícita N3,
sin publicar evaluación interna. Feedback no cambia confirmación municipal.
Recuperación conserva auditoría/fila; retención legal continúa abierta. Checklist
anterior2 pendientes no se resuelve con este análisis: Mateo autoriza proseguir.
Esto es análisis técnico, no revisión humana ni aprobación legal del producto.

## Convergencia de implementación

N1–N6 cubiertos por migración20261028235316, servicios/contratos/GET/POST,
campana/lista por rol y agenda/ancla propia.57 SQL focales y26 E2E cubren hechos,
normal/tardío, lectura por cuenta, permisos/archivo/suspensión, rollback y navegación.
1346 unit/componentes,57 tooling, tipos/lint/build y suite SQL1416 verificados;
axe390/1440 sin violaciones tras ajustar CSS de filas. Catálogo de canales/etiquetas
reutilizado del dominio. Sin necesidad de tareas nuevas por comportamiento no
implementado del incremento. Actualización posterior EXTRA100: migración alojada
aplicada por pedido de Mateo y verificada sin backfill o cambios de negocio.
PR/CI y revisión humana conservan su seguimiento independiente; no cierran gates
históricos ni equivalen a aceptación jurídica.
