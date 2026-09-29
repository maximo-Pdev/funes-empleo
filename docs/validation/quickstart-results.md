# Resultados quickstart — T092

Fecha: 2026-09-27. Entorno: local ficticio, Node 24.21.0/npm 11.19.0.
Actualización 2026-09-28: main `481b9f0`, rama `codex/temp-mvp-completion`.
Demo protegida desplegada y smoke por cuatro roles aprobado; cohortes pendientes.
Pasos humanos en [la guía](human-validation-guide.md). El correo/Auth alojado aún
requiere configuración y verificación; cuentas precreadas no prueban autorregistro.
Los resultados de comandos finales se registran en `quality-gates.md`.

| Escenario | Evidencia automática ejecutable | Resultado humano |
| --- | --- | --- |
| 1 candidato | candidate-self-service, SQL 020 | Pendiente |
| 2 empresa/moderación | company-offers, intermediation, SQL 010/030 | Pendiente |
| 3 intermediación/privacidad | intermediation, SQL 010, Storage reset-local | Pendiente |
| 4 feedback/vencimientos | intermediation, SQL 010, tests de transiciones | Pendiente |
| 5 asistido | assisted-candidate, SQL 040 | Pendiente; comprobación de DNI solo simulada |
| 6 importación | candidate-import, SQL 050, parser | Demo sintética; histórico bloqueado T069 |
| 7 métricas | admin-metrics, SQL 060 | SC-003/008 alojados pendientes |
| 8 suspensión/archivo/restauración | intermediation, candidate/company, SQL 001/020/030 | Pendiente |

La ejecución automática de un escenario no prueba comprensión de personas sin
entrenamiento. El usuario confirmó que esa evidencia todavía no existe.

## Registros humanos listos para completar

SC-001/002: dos series separadas de **10 ejecuciones**, al menos **5 personas** distintas
por rol, datos ficticios preparados y conexión estable. Registrar
`rol | ejecución | seudónimo | fecha | despliegue/commit | navegador/dispositivo |
inicio | confirmación final | segundos totales | reinicios | ayuda | resultado`.
Inicio primera apertura del registro, final postulación/envío confirmado. Se permiten
reinicios **sin reiniciar el reloj**. Exigir 9/10 <600 s sin ayuda técnica por rol.

SC-010, registro separado: candidatos ≥5, empresas ≥5, cuatro admins previstos o personal
municipal equivalente; cada persona solo tareas de su rol. Cinco tipos: perfil/postular,
oferta/enviar, moderar, buscar/preseleccionar/derivar, confirmar resultado. Por tipo:
`participantes elegibles | éxito sin ayuda/reinicio | porcentaje | aprobado ≥80%`.
Global: ≥4/5 tipos aprobados. Con cuatro admins hacen falta cuatro éxitos por tipo.
Corrección guiada por mensajes de interfaz no invalida primer intento; ayuda externa
o reinicio sí. No mezclar esta regla con el cronómetro continuo de SC-001/002.

SC-003/008 y SC-008A usan el protocolo de `performance.md`; accesibilidad usa
`accessibility.md`. No inventar filas aprobadas ni usar tiempos E2E como tiempos humanos.
T092 permanece pendiente hasta completar y revisar esos registros.
