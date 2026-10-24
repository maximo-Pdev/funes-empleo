# Alta presencial activa — EXTRA056

La migración `20261024033056_active_assisted_registration.sql` agrega solamente
el RPC administrativo `create_active_assisted_candidate`. Instalarla antes de
desplegar la aplicación que lo llama. No hace backfill ni activa perfiles previos.
La base alojada no se modifica automáticamente al cambiar el código.

El alta interactiva requiere datos de activación completos, persona disponible
y atestación expresa de aceptación presencial de la política mostrada. Reutiliza
guardar, registrar aceptación y activar en una transacción. Sin CV puede
evaluarse internamente; derivar sigue requiriendo PDF válido. Duplicados/rechazo
no crean aceptación; utilizar un existente nunca lo reactiva ni renueva su
consentimiento. RPC legado de borradores/importación/mantenimiento sin cambios.
Contratación normal/tardía conserva retiro global y revocación de EXTRA035.

Verificar en una base ficticia con tests SQL041/040/024 y E2E asistidos/contratación.
Antes de aplicar en otro entorno comprobar proyecto, respaldo e historial de
migraciones; este cambio no resuelve diferencias históricas de versiones.

Recuperación: volver a la versión anterior de la aplicación y luego, si se
requiere retirar el RPC aditivo, ejecutar en una transacción:

```sql
begin;
drop function public.create_active_assisted_candidate(jsonb,boolean,text,text,integer,uuid,text,text,text[]);
notify pgrst, 'reload schema';
commit;
```

No borrar perfiles, aceptaciones ni eventos registrados mientras estuvo vigente.
Si se retira la migración, conciliar su historial por separado y con evidencia;
no reejecutar a ciegas migraciones anteriores ni resetear una base compartida.
