# Gates externos de entrega

T091 — 2026-09-27. **Todos los gates de esta tabla continúan abiertos** salvo evidencia
explícita posterior. Actualización 2026-09-28: demo y reset alojado creados/verificados;
Actualización 2026-09-29: siete mediciones técnicas alojadas dentro de sus límites;
faltan resultados humanos/NVDA/revisión de fase 9. El propietario habilitó GitHub–Vercel
y se verificó el enlace; todavía falta validar el preview Git y la entrega tras merge.
No exigir un documento oficial adicional si existe evidencia rastreable:
PR, issue, acta, correo o mensaje capturado en repositorio con decisión, responsable y
fecha es suficiente. No incorporar PII o secretos al registrar esa evidencia.

| Gate | Responsable | Límite seguro | Etapa bloqueada | Evidencia necesaria |
| --- | --- | --- | --- | --- |
| OQ-001 retención | Municipalidad / responsable legal o de datos | Archivo recuperable, sin purga/TTL; 720 h limita acceso, no retención | Datos reales, producción y eliminación permanente | Política, alcance y aprobación identificada |
| OQ-002 consentimiento | Municipalidad | Texto `demo-not-approved`, solo ficticio | Aceptación con datos reales | Texto/version/hash aprobado y responsable/fecha |
| OQ-003 datos requeridos | Oficina | Campos MVP de spec, sin atribuir validación legal | Adopción real | Ratificación de necesidad y minimización |
| OQ-004 datos derivados | Oficina / Municipalidad | Proyección mínima aprobada en spec; nunca DNI/domicilio/notas | Validación municipal real | Ratificación de visibilidad/descarga y aviso |
| OQ-005 informes | Oficina | Métricas internas + CSV genérico | Informes oficiales adicionales | Ejemplo y formato aprobado |
| OQ-006 operación | Beex / Municipalidad | Local/preview/demo ficticios separados | Producción | Operador, hosting, región, backups/restauración, incidentes, SMTP y presupuesto aprobados |
| OQ-010 catálogo | Oficina | DEMO-A/B ficticias y modelo versionable | Catálogo final y su aceptación | Catálogo canónico versionado aprobado |
| OQ-017 CV | Plan técnico / Municipalidad | PDF 1..5 MiB para demo | CV reales y límite municipal | Formatos/tamaño ratificados |
| OQ-018/T069 CSV | Oficina | Solo `demo-candidates-v1`, no inferir Excel | Importación histórica definitiva | Muestra anonimizada y mapeo/version/aprobación |
| Cuatro identidades admin | Oficina / operador | Cuatro usuarios ficticios individuales | Aprovisionamiento municipal | Identidades confirmadas por canal privado y constancia sanitizada; sin claves |
| SMTP/remitente | Operador / Municipalidad | Mailpit local; correo integrado solo pruebas controladas | Entrega real de invitaciones/recuperación | Proveedor, dominio, remitente y responsable verificados; secretos fuera del repo |
| Visual/accesibilidad municipal | Municipalidad | Español, responsive, teclado y pruebas según spec | Aceptación institucional | Identidad visual y requisitos municipales confirmados |
| Mediciones alojadas | Desarrolladores / titular de proyectos | Siete casos técnicos medidos; tiempos humanos pendientes | SC-003/008 y aceptación global T089 | Administrador sin práctica, recibos/condiciones revisados y registros completos |
| GitHub–Vercel/T097 | Propietario de ambas cuentas | Enlace Git confirmado, SSO/forks protegidos, variables solo Preview | Verificación del preview Git y entrega desde main tras merge | Preview del PR/SHA verificado y destino demo configurado tras aprobación/merge |
| Cohortes y NVDA | Equipo coordinador / usuarios por rol | Automatización es apoyo, no sustituto | SC-001/002/003/008/009/010 | Registros seudónimos según protocolo, sin inventar participantes |
| Segundo desarrollador | Máximo | PR sin merge automático | Integración/aprobación final | Comentarios/hallazgos y resolución rastreables de esta fase |

La aprobación de una fase técnica no cierra otra. Las aclaraciones funcionales de
spec.md tienen prioridad sobre posiciones antiguas de discovery; no se reabren por
esta tabla. AGENTS/PROJECT_CONTEXT conservan descripciones iniciales obsoletas de
ratificación: la constitución vigente es 1.0.0 ratificada 2026-09-19. No se atribuye
aprobación municipal por una etiqueta de estado de un artefacto.

## Cómo cerrar un gate

Registrar ID, decisión exacta, responsable autorizado, fecha, enlace/evidencia
sanitizada, alcance (demo o real), archivos afectados y verificación. Revisar por PR
antes de cambiar un límite. Para un correo o mensaje, guardar solo la decisión
necesaria, no listas de personas, CV ni credenciales. Sin evidencia, conservar abierto.
