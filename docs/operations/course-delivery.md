# Entrega del Portal de Empleo — curso Funes Tech Lab

Preparación documental del **02/11/2026**, solicitada por Mateo. Esta guía permite
entregar y recorrer la demo; no acredita aceptación municipal ni habilita datos reales.

## Enlaces para entregar

| Elemento | Enlace |
| --- | --- |
| Aplicación Vercel | [funes-empleo.vercel.app](https://funes-empleo.vercel.app/) |
| Catálogo | [ofertas](https://funes-empleo.vercel.app/ofertas) |
| Repositorio | [maximo-Pdev/funes-empleo](https://github.com/maximo-Pdev/funes-empleo) |
| Instrucciones y tecnologías | [README](../../README.md) |

La rama de esta preparación es `feat/course-delivery`, desde `main` en `681adea`
(PR92 mergeado). La documentación nueva estará disponible en `main` después de
su propio PR, revisión y merge. Registrar en la entrega el SHA final y el
despliegue que lo contiene; no identificar un preview antiguo como build actual.

## Usuarios y entrega privada del acceso

Mateo proporcionó estos correos como usuarios de prueba para la entrega:

| Rol | Correo | Destino esperado |
| --- | --- | --- |
| Postulante | `postulante1@prueba.com` | `/dashboard` |
| Empresa | `empresa1@prueba.com` | `/empresa` |
| Municipalidad | `admin1@prueba.com` | `/admin` |

Las contraseñas **no se incluyen en este documento ni en el README**. El operador
entrega a cada evaluador su acceso mediante el canal privado del curso, separado
del repositorio público, con una contraseña exclusiva de demostración. No entregar
claves API, cuentas personales de GitHub/Vercel/Supabase, cookies, tokens o enlaces
de recuperación. No reutilizar contraseñas personales ni publicar las de la demo
en issues, PR, capturas o logs.

La cuenta municipal debe asignarse a una sola persona durante la evaluación. Si
evalúan varios administradores simultáneamente, el operador prepara cuentas
individuales mediante el flujo autorizado de invitación; no habilitar registro
público municipal ni compartir `admin1` entre personas. Esta tarea documental no
crea, modifica ni rota cuentas.

Estas identidades alojadas **no reemplazan** las identidades `@example.invalid`
de fixtures/scripts. No cambiar el resolver `DEMO_*`, el seed ni los checks para
apuntar a estas cuentas. Los scripts alojados históricos están fijados al dominio
anterior y no son un comando de verificación del destino actual.

## Recorrido de demostración

Usar perfiles de navegador separados o cerrar sesión entre roles. Todas las
personas, documentos, contactos y ofertas de la evaluación deben ser ficticios.
Elegir una oferta vigente y personas habilitadas según sus estados actuales;
los datos cambian al operar y no se restablecen automáticamente.

1. **Postulante:** ingresar desde Inicio, comprobar perfil, categorías,
   consentimiento, disponibilidad y CV. Abrir una oferta publicada y postularse
   con CV del perfil o específico. Revisar la participación y sus notificaciones.
2. **Empresa:** ingresar con su propia cuenta, revisar perfil, crear una oferta
   ficticia y enviarla a revisión. Comprobar que no se publique automáticamente.
3. **Municipalidad:** ingresar con su cuenta individual, revisar la empresa,
   moderar la oferta y consultar sus participaciones. Ver un perfil coincidente,
   nominarlo o revisar la postulación, registrar una preentrevista si corresponde
   y derivarlo a esa empresa. La nominación sola no comparte datos.
4. **Empresa:** abrir la derivación propia, identificar al candidato, abrir el CV
   autorizado e informar resultado. No puede acceder al padrón ni a derivaciones
   de otra empresa. El resultado informado queda sujeto a confirmación municipal.
5. **Municipalidad y postulante:** confirmar el resultado, revisar historial y
   notificación. Una contratación cambia la disponibilidad a No disponible y
   conserva el consentimiento; no restaura permisos revocados ni altera otras
   participaciones. Consultar métricas y exportaciones CSV/PDF/Excel con filtros.

Los resultados y permisos dependen de las reglas vigentes; no prometer un perfil
completo si el permiso ya terminó. La empresa conserva únicamente el nombre para
identificar su derivación cuando el acceso a perfil/contactos/foto/CV finaliza.

## Control previo y evidencia

| Control | Evidencia al 02/11/2026 | Pendiente antes de enviar |
| --- | --- | --- |
| Inicio, ofertas y GitHub | HTTP 200 sin autenticación | Reabrir desde el navegador del evaluador |
| Correos de los tres roles | Proporcionados por Mateo | Confirmar login y rol en el destino exacto |
| Contraseñas de demo | No solicitadas, leídas ni guardadas por esta tarea | Entrega individual del operador por canal privado |
| Commit desplegado | Base main681adea; HTTP no identifica el build | Verificar SHA final en GitHub y Vercel después del merge |
| Funcionalidad alojada | Sin recorridos privados nuevos en esta tarea | Ejecutar el recorrido anterior y registrar resultado sin secretos |
| Registro/recuperación | Documentación histórica con límites SMTP | Comprobar destinatarios, Site URL y callbacks si se evalúa correo |
| Revisión/publicación | Rama documental local preparada | PR, revisión y merge; conservar gates de aceptación pendientes |

El conector Vercel de esta sesión no mostró proyectos: no acredita configuración
o SHA. No se desactivó ninguna protección para obtener HTTP 200. Si el evaluador
encuentra protección Vercel, el propietario concede acceso por los mecanismos de
la plataforma, sin compartir su propia cuenta.

Si se evalúa el correo, el dominio canónico esperado es
`https://funes-empleo.vercel.app`, con callbacks `/auth/callback` y
`/auth/callback?next=/update-password`. **Es un valor a comprobar**, no una
afirmación de que esta tarea cambió o inspeccionó Auth. Las cuentas precreadas
permiten evaluar los roles sin depender de un alta por correo nuevo.

Para el acta final anotar fecha, SHA, URL/despliegue, rol, recorrido y resultado
sanitizado, sin contraseña, tokens, datos reales o capturas de claves.
Los procedimientos de [operación](demo-runbook.md),
[credenciales técnicas](demo-credentials.md) y
[gates pendientes](../validation/release-gates.md) siguen vigentes.
