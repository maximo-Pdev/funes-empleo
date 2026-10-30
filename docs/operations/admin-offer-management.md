# Gestión administrativa de ofertas y cuentas — EXTRA109

## Comportamiento

Desde Administración → Ofertas, una oferta pendiente de revisión permite
**Aprobar**, **Rechazar** o **Solicitar correcciones**. Se conservan los mensajes,
motivos, confirmaciones y control de versión del flujo existente. Otros estados
mantienen sus acciones de ciclo de vida: esta reducción no impide pausar o cerrar
una oferta publicada.

El enlace **Ver perfil de la empresa** lleva a su ficha administrativa mediante
una referencia opaca. La ficha de solo lectura muestra razón social, CUIT,
responsable, correo, teléfono, actividad y localidad; los valores ausentes se
indican con **Sin informar**. El guard de administrador activo y las políticas
existentes siguen aplicándose antes de leer los datos.

El listado general y las ofertas dentro de la ficha empresarial muestran diez
registros por página. La consulta, conteo y orden se resuelven en servidor;
los borradores permanecen excluidos. La ficha empresarial ya no trunca en50.
Una página fuera de rango permite volver a la primera, conservando el filtro
del listado general. Solo PGRST103 se recupera mediante un conteo bajo los mismos
filtros y permisos; los demás errores mantienen su tratamiento existente.

El historial de moderación conserva su componente compartido: cinco eventos al
abrir y **Mostrar más** para revelar los siguientes cinco. No se borran eventos;
se mantienen el foco por teclado y el anuncio accesible de la cantidad visible.

Se retiran **Plantillas para el personal** y su generador. El formulario de
contacto municipal, canales, notas y cronología siguen disponibles.

Reactivar una empresa, una cuenta de candidato o una cuenta administrativa utiliza
el botón institucional verde. Suspender y archivar conservan el rojo. Motivo,
confirmación, mensajes, auditoría y permisos no cambian. La restauración de una
cuenta archivada conserva su presentación y reglas previas.

## Protección de administradores

No se añade otra regla paralela: se verifica la protección existente de
`change_account_status` y su implementación privada. El bloqueo transaccional
precede la revalidación del actor y del destino; se impiden autosuspensión,
archivo de administradores y suspensión del último administrador activo. El rol
autenticado tampoco tiene permiso DELETE sobre cuentas.

La prueba concurrente abre dos conexiones reales. La segunda suspensión espera
el bloqueo de la primera; después del commit, el actor suspendido es rechazado.
Se comprueban versiones, otros administradores y el evento de auditoría único.
La cuenta ficticia se reactiva mediante el mismo flujo auditado al terminar;
la prueba conserva esos eventos y elimina únicamente sus sesiones temporales.

## Verificación realizada

- 1.387 pruebas unitarias/de componentes en112 archivos y60 pruebas de tooling.
- 1.463 aserciones SQL en28 archivos sobre instancia local aislada recién creada;
  incluye último administrador, permisos, versiones, auditoría y atomicidad.
- Prueba concurrente de administradores con bloqueo advisory observado: PASS.
- E2E de contactos cronológicos sin plantillas: PASS, sin reintentos u omisiones.
- Navegador con datos ficticios: las tres decisiones guardadas, siete campos
  empresariales, páginas1/2/6 y recuperación fuera de rango, historial5→6 con
  teclado, tres reactivaciones verdes y suspensiones rojas, confirmación requerida
  sin perder motivo y acceso a la ficha denegado para candidato y empresa.
- Diez vistas a1440/390px: axe sin violaciones y sin desbordamiento horizontal.
- Tipos, lint, build de producción y comprobación de whitespace: PASS.

Las pruebas se ejecutaron en una copia ignorada con proyecto Supabase propio
`funes-admin-cv-check`, API54341/DB54342 y aplicación3001. No se restableció la base
habitual ni se operó sobre Supabase alojado. Las capturas y el resumen JSON quedan
como evidencia local ignorada en `test-results/portal-followups-check/test-results`.

Para repetir la prueba concurrente en un entorno aislado previamente preparado:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54341'
$env:NEXT_PUBLIC_APP_URL = 'http://127.0.0.1:3001'
$env:LOCAL_ACCEPTANCE_PROJECT_OWNED = 'funes-admin-cv-check'
node tests/quality/admin-account-concurrency.mjs
```

Ejecutar desde la copia cuyo `supabase/config.toml` declara ese proyecto, con el
fixture ficticio vigente, Docker disponible y los administradores1/2 activos.
El helper debe validar los puertos de esa copia. El script rechaza destinos
alojados, falta de propiedad explícita, otro contenedor o usuarios no ficticios;
no eliminar estas barreras para ejecutarlo sobre una base compartida.

## Prerrequisitos técnicos encontrados

EXTRA110 corrige únicamente el fixture SQL de reintentos: utiliza el día de Funes
en lugar de `current_date` UTC. La suite completa pasó en la frontera donde esos
días difieren; las aserciones y funciones de producto no se modificaron.

EXTRA111 oscurece el único token compartido de texto ámbar a #805900 sobre el
mismo fondo #fcf3db. El contraste pasa de4.24:1 a5.67:1. Se verifican los seis
pares semánticos sin cambiar estados, etiquetas o identidad principal.

## Recuperación y límites

Este incremento no necesita migración, variables nuevas, dependencias ni cambios
de permisos. La recuperación consiste en revertir el cambio de aplicación por PR;
no ejecutar SQL de borrado ni revertir auditorías o datos de negocio. Los cambios
SQL de este incremento son exclusivamente pruebas.

AD1–AD7 quedan cubiertos por implementación y evidencia; no se detectaron tareas
faltantes dentro de ese alcance. Esto no cierra los pendientes históricos de
aceptación, las dos casillas de revisión de gestión empresarial ni revisión
humana, CI o despliegue. Mateo solicitó publicar este incremento mediante PR;
la referencia y el estado de publicación se registran en implementation-status.
