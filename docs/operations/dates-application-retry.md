# Fechas y nueva postulación tras retiro

EXTRA102,2026-10-29. Fechas visibles en DD/MM/YYYY, con día/mes de dos cifras y
año completo. Historiales conservan hora y segundos; notificaciones y fecha de
derivación conservan precisión de minutos. Instantes se muestran en Funes; fechas
calendario conservan su día. PDF/Excel usan el mismo formato. Selectores nativos,
atributos dateTime, contratos/URLs ISO y CSV técnico se conservan.

EXTRA105,29/10/2026 sustituye104: «Registrar contacto municipal» conserva el
selector original datetime-local, con calendario y edición nativos, por decisión
expresa de Mateo. El orden de día/mes/año mostrado depende de la configuración
regional del navegador/sistema; lang es-AR declara idioma pero no lo fuerza en
todos los navegadores. Servidor recibe ISO local y convierte a UTC desde Funes.
Se conservan validación y datos ante errores; no requiere otra migración.

El candidato puede volver a postularse a la misma oferta después de retirar su
participación, si sigue cumpliendo los requisitos del perfil y la oferta. Se crea
otra participación recibida; puede usar su CV general o elegir otro específico.
La retirada anterior conserva CV, auditoría y permisos revocados. Una postulación
nueva no crea derivación ni devuelve acceso a la empresa. Las métricas cuentan
cada participación, incluidos los intentos anteriores, como ya cuentan los casos.

No se permiten nuevos intentos mientras exista un caso no archivado en otro
estado, incluidos resultados finales. Cancelación municipal no equivale a retiro
voluntario. Nominación y matching administrativos conservan su bloqueo previo;
no hay renominación automática. Retirada y Cancelada se muestran en rojo.

## Aplicación y recuperación

Aplicar `supabase/migrations/20261029180304_candidate_application_retry.sql` antes
del código. Transacción: reemplaza índice único parcial y dos funciones, sin
columnas, eliminación, backfill, cambio de firmas o grants. Conserva todos los
controles de actor, versión, aptitud, vigencia, CV y locks existentes.

Actualización29/10/2026,EXTRA103: aplicada y registrada20261029180304 en el Supabase
vinculado por pedido de Mateo. Verificación independiente de índice/funciones/ACL,
historial exacto, contadores de negocio y búsqueda/filtros públicos PASS. No se
crearon casos de prueba alojados; cero nuevas alertas de seguridad y cero ERROR.
No volver a ejecutarla ni reparar migraciones anteriores. La aplicación del SQL
no despliega la interfaz; los cambios de página todavía requieren su PR/publicación.

Para suspender reintentos, una migración correctiva puede restituir ambas guardas
de existencia anteriores. Conservar índice compatible e historia: no reconstruir
el índice antiguo si ya hay pares con varias retiradas; no archivar o borrar casos
para forzarlo. La UI anterior solo dejaría de ofrecer nuevos intentos; no afecta
los ya registrados. Aplicación alojada e integración por PR requieren pedido.

Pruebas de referencia: `075_application_retry.test.sql`, `z-application-retry.spec.ts`,
`application-retry.test.tsx`, `date-presentation.test.ts` y archivos de métricas.
