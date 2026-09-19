# Guía de validación: MVP del Portal Municipal de Empleo de Funes

Esta guía define cómo deberá comprobarse la implementación. En la etapa actual el repositorio aún no
contiene la aplicación, por lo que los comandos son el contrato operativo para las fases de tareas e
implementación, no una afirmación de que ya puedan ejecutarse.

## Prerrequisitos

- Git.
- Node.js 24.21.0 LTS con npm 11.19.0.
- Docker Desktop activo y Supabase CLI instalado como dependencia de desarrollo del proyecto.
- Acceso individual al repositorio, al proyecto Supabase de demostración y a Vercel.
- Solo datos y archivos ficticios o correctamente anonimizados.

No usar credenciales, DNI, teléfonos, domicilios, CUIT, CV ni exportaciones reales. Producción no se
habilita hasta resolver OQ-001, OQ-006 y las demás dependencias del plan.

## Preparación local prevista

```powershell
npm ci
npx supabase start
npx supabase db reset
Copy-Item .env.example .env.local
npm run dev
```

Completar `.env.local` solo con credenciales del entorno local generado. Nunca copiar claves de demo
o producción a un archivo versionado ni a una conversación.

Resultado esperado:

- migraciones y seed ficticio aplicados sin intervención manual;
- bucket privado y políticas creados por migración;
- aplicación disponible en `http://localhost:3000`;
- emails de prueba capturados localmente, sin enviar a personas reales;
- cuatro identidades administrativas ficticias y separadas para validación.

## Gates automatizados previstos

```powershell
npm run typecheck
npm run lint
npm run test:unit
npm run test:db
npm run build
npm run test:e2e
```

Todos deben terminar con código cero. `test:db` debe reiniciar una base aislada y ejecutar pgTAP;
`test:e2e` debe usar fixtures ficticios y conservar trazas/capturas solo cuando falle.

Cobertura mínima por riesgo:

- autenticación, verificación, recuperación y suspensión;
- RLS positiva y negativa para público, candidato, empresa y admin;
- moderación de oferta;
- postulación y nominación administrativa;
- preentrevista, preselección y derivación;
- vista empresarial limitada y descarga de CV;
- feedback empresarial y resultado final administrativo;
- cierre automático a 30 días y corrección tardía;
- previsualización CSV, duplicados y rollback total;
- historial append-only y conflicto entre dos administradores.

## Escenario 1: candidato autogestionado

1. Registrar `Ana Prueba` con DNI, email y contraseña ficticios.
2. Confirmar el email desde el buzón local e iniciar sesión.
3. Verificar que el panel está disponible pero el perfil todavía no está activo.
4. Completar localidad, al menos dos categorías, resumen, disponibilidad, consentimiento y PDF válido.
5. Activar el perfil y postularse a dos ofertas publicadas.
6. Retirar una postulación y desactivar disponibilidad.

Esperado:

- solo modifica su perfil;
- la empresa no obtiene datos antes de derivación;
- cada oferta tiene seguimiento independiente;
- candidato ve recepción y resultado final, no evaluación interna;
- retiro/desactivación conservan historial.

## Escenario 2: empresa y moderación

1. Registrar una empresa ficticia con nombre, CUIT, responsable, contacto, actividad y localidad.
2. Crear un borrador completo con dos categorías y salario opcional vacío.
3. Enviar a revisión; confirmar que no se publica directamente.
4. Como admin, solicitar correcciones con mensaje visible.
5. Como empresa, corregir y reenviar.
6. Como admin, aprobar y publicar; luego pausar y reanudar.

Esperado:

- solo `published` aparece públicamente y acepta postulaciones;
- cada decisión conserva actor, fecha, estado previo/nuevo y mensaje;
- empresa solo ve su propia organización/ofertas;
- pausa bloquea nuevas postulaciones sin perder existentes.

## Escenario 3: intermediación y privacidad

1. Como admin, filtrar candidatos por categoría, habilidad, disponibilidad, localidad y vigencia.
2. Registrar preentrevista, contacto y nota interna sobre una participación.
3. Preseleccionar y derivar a un candidato con consentimiento/CV vigentes.
4. Como empresa de la oferta, consultar el candidato y descargar el CV.
5. Intentar consultar el DNI, domicilio, nota interna, otra participación y un candidato no derivado.

Esperado:

- empresa ve solo perfil laboral, contactos autorizados y CV de la derivación propia;
- todos los intentos adicionales son rechazados sin confirmar datos;
- empresa nunca explora el padrón;
- candidato no ve preentrevista, preselección ni nota.

## Escenario 4: feedback, resultado y falta de respuesta

1. Como empresa, registrar una entrevista y comunicar `hired` para una derivación.
2. Verificar que el feedback queda pendiente y no cambia el resultado final.
3. Como admin, confirmar contratación.
4. Crear otra derivación con reloj de prueba vencido más de 30 días y ejecutar la función programada.
5. Confirmar `no_company_response`; luego registrar feedback tardío y corregir como admin a
   `not_selected`.

Esperado:

- solo admin fija el resultado real;
- el job es idempotente y atribuye el evento a `system`;
- la corrección conserva el cierre anterior;
- candidato no seleccionado sigue activo para otras búsquedas.

## Escenario 5: atención presencial

1. Como admin, crear un perfil asistido ficticio con nombre, DNI y teléfono, sin PDF.
2. Registrar disponibilidad, categorías, contacto, consentimiento atendido y nota de capacitación.
3. Intentar derivarlo sin CV.
4. Cargar un PDF válido y derivar.
5. Vincularlo a una cuenta personal ficticia mediante el proceso aprobado.

Esperado:

- el alta sin PDF es posible, la derivación no;
- acciones identifican al admin;
- nota de capacitación es libre e interna;
- vinculación preserva ID e historial y no crea duplicado.

## Escenario 6: duplicados e importación

Este escenario queda bloqueado hasta contar con muestra anonimizada y `mapping_version` aprobado.
Una vez disponible:

1. Previsualizar un CSV ficticio con fila válida, DNI duplicado, email coincidente, categoría sin
   mapear, campo faltante y encabezado desconocido en archivos separados.
2. Comprobar que no existan perfiles nuevos después de previsualizar.
3. Resolver bloqueos permitidos y confirmar un lote totalmente válido.
4. Forzar un error en una fila dentro de la transacción.

Esperado:

- todas las anomalías aparecen antes de confirmar;
- no hay fusión automática;
- lote válido importa completo;
- fallo revierte todas las filas y deja resultado explícito recuperable;
- logs no contienen datos de filas.

## Escenario 7: métricas y exportación

1. Como admin, seleccionar período y categoría.
2. Comparar conteos con los fixtures conocidos.
3. Exportar CSV y abrirlo como texto.
4. Incluir en fixtures un valor que comience con `=` o `+`.
5. Intentar descargar la exportación sin sesión y como empresa.

Esperado:

- conteos de candidatos, empresas, ofertas, postulaciones, preentrevistas, derivaciones y resultados
  coinciden con la base;
- exportación termina dentro de 30 segundos de interacción;
- valores peligrosos están neutralizados;
- solo admin accede.

## Verificación manual de accesibilidad y experiencia

Ejecutar los escenarios críticos en ancho móvil y escritorio:

- navegación completa solo con teclado, orden de foco visible y sin trampas;
- zoom 200 % sin pérdida de controles o contenido esencial;
- labels, instrucciones, errores, loading, vacíos y confirmaciones en español;
- mensajes asociados programáticamente a campos inválidos;
- foco movido al resumen de error o contenido actualizado cuando corresponda;
- contraste y landmarks revisados; axe sin violaciones graves conocidas;
- prueba con lector de pantalla de registro, oferta, postulación y derivación.

## Validación de Pull Request

Antes de considerar terminada una implementación:

1. Confirmar rama dedicada y working tree sin secretos/PII.
2. Adjuntar resultados de los seis comandos de calidad.
3. Documentar migraciones, variables nuevas y recuperación.
4. Incluir evidencia manual de los flujos críticos y accesibilidad.
5. Declarar limitaciones y OQ todavía abiertas.
6. Obtener revisión del segundo desarrollador; aprobación no equivale a merge.

## Variables previstas

El `.env.example` futuro documentará nombres sin secretos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` — solo servidor, si las operaciones acotadas la requieren
- `NEXT_PUBLIC_APP_URL`
- identificadores/configuración no sensible del consentimiento aprobado

No se incorpora una variable SMTP productiva ni secretos de cron mientras sus decisiones sigan
pendientes o el trabajo se ejecute dentro de Supabase Cron.
