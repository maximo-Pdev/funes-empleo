# Checklist de requisitos — EXTRA035, 2026-10-21

Validación de definición del cambio, no evidencia de implementación/aceptación.

- [x] Mateo confirma explícitamente alcance global; OQ-020 preserva el conflicto y su decisión.
- [x] Contratación normal y tardía comparten punto transaccional en servidor/DB.
- [x] Retiro append-only conserva política/hash, fecha, actor y causa trazable.
- [x] Revoca todos los permisos, incluso los de otras ofertas/empresas; no modifica estados/resultados de otros casos.
- [x] No simula retiro manual ni aceptación del candidato; nueva fuente solo permite withdrawn.
- [x] No duplica retiro si no hay aceptación vigente ni reactiva permisos/consentimiento por correcciones.
- [x] Bloqueo por candidato, versiones y fallo de auditoría tienen pruebas de atomicidad/concurrencia previstas.
- [x] No hay backfill ni restauración destructiva; permisos históricos y retiro manual quedan explícitamente separados.
- [x] Sin nuevo proveedor, dependencias, servicio privilegiado o relajación de sesión/rol/RLS.
- [x] Pruebas SQL, negativas, servidor y E2E, tipos/lint/build y recuperación están previstas en tareas.
