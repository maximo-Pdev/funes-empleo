# CV general y CV por postulación

EXTRA096,2026-10-28. Se admiten PDF, JPG/JPEG y PNG de hasta5 MiB por archivo.
WebP, GIF, SVG, video e imágenes animadas no se admiten. Las imágenes deben tener
hasta16 megapíxeles: el servidor las orienta, elimina metadatos y convierte a PDF,
sin recortar, con el mismo límite5 MiB de salida. No requiere paquetes ni variables
de entorno nuevas. Las fotos de perfil conservan su política independiente.

Al postularse, se puede desplegar «Usar otro CV para esta oferta». Sin archivo se
fija el CV general vigente; con archivo se fija ese documento solo para esa oferta.
No sustituye el general ni la elección de otras postulaciones. Ante error se conserva
la selección. Si se pierde la respuesta, consultar postulaciones antes de reintentar.

La Oficina ve el archivo elegido desde el caso y la persona desde sus postulaciones.
La empresa recibe acceso únicamente al CV fijado en su derivación autorizada.
Todos los enlaces mantienen el proxy autenticado, PDF inline, nueva pestaña y
revalidación del permiso; sin URLs públicas de Storage. Un navegador configurado
para descargar PDF puede preferir descargar: eso depende del visor del dispositivo.

## Despliegue y compatibilidad

1. Aplicar `supabase/migrations/20261028210445_application_cv_documents.sql` antes
   del código. Es una transacción aditiva, sin backfill ni borrado. Usa firmas nuevas
   para evitar sobrecargas de PostgREST y mantiene los comandos públicos anteriores.
2. Verificar scope nullable, FK compuesta titular/documento, índice parcial de CV
   general y RPC autenticados. Los tipos nuevos provienen del esquema local real;
   se conservan las anotaciones existentes de nullabilidad de otros RPC.
3. Desplegar el código. Perfil, matching, activación y commit general filtran
   opening_id NULL. Una postulación específica no vuelve apto un perfil incompleto.
4. Comprobar con datos ficticios general + dos ofertas, derivación, empresa ajena,
   revocación y apertura. Nunca reiniciar el proyecto compartido para instalarla.

Los casos anteriores y nominaciones conservan selección NULL y usan el general
vigente al derivar. Las nuevas postulaciones conservan su elección aunque luego el
general pase a superseded. Los archivos y el historial anteriores permanecen.

## Recuperación

Antes del despliegue, guardar definiciones y respaldo normal de la base. Si falla
la migración, toda la transacción revierte. Después de confirmarla, preferir una
migración correctiva hacia adelante: no eliminar columnas, metadatos o archivos,
ni reconstruir el índice antiguo (ya permite varios valid separados por oferta).

No desplegar clientes antiguos que consulten CV valid sin filtrar opening_id: pueden
confundir documentos. Si se debe suspender temporalmente la nueva carga, mantener
el esquema y los lectores de scope correctos y retirar solo el control de archivo
opcional. Los wrappers de postulación anteriores siguen fijando el general.

Una reserva/upload que falla queda rejected/upload_pending, privada y no compartible;
no se promueve a valid ni deja una participación parcial. No hay purga automática
ni nueva política de retención. El commit SQL revalida versiones, propiedad, oferta,
consentimiento, disponibilidad, CV general y objeto Storage después de transferirlo.

2026-10-28: migración aplicada y registrada por pedido posterior de Mateo en el
proyecto compartido. EXTRA097 acredita cuerpos/ACL/RLS/FK/índices/triggers e
historial exacto, sin cambios en los recuentos de negocio ni otras migraciones.
No se probó escribiendo postulaciones alojadas. La publicación y despliegue de la
interfaz dependen del PR; aplicar SQL no publica la UI. OQ-001/OQ-017 y la
aprobación para datos reales conservan sus pendientes anteriores.
