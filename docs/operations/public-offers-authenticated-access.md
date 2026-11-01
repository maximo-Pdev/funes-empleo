# Acceso desde ofertas públicas

EXTRA106/108, 29/10/2026. Mateo conserva solo el ajuste de /ofertas y descarta los
cambios del inicio/login, cuyo diseño y comportamiento vuelven al estado previo.

Actualización EXTRA-112, 31/10/2026: se eliminan las dos tarjetas laterales y
el acceso duplicado al perfil del encabezado de /ofertas. El listado ocupa todo
el ancho disponible. Se conserva la lectura de sesión verificada en servidor:

- Candidato, empresa o administración: «Mi cuenta» en la navegación principal
  conserva el destino de cuenta correspondiente al rol.
- Visitante: «Inicio» permite volver a Home para ingresar o registrarse.
- EXTRA-113: el detalle también usa la misma navbar compartida. Sus tarjetas
  laterales se retiran y la postulación queda al final de toda la información,
  conservando el destino de candidato y el identificador público de la oferta.

No requiere migración, variables nuevas, dependencias ni configuración de
Supabase/Vercel. No cambia registro, recuperación, permisos ni reglas de sesión.
Se usa una lectura por request para la navbar, sin estado global entre personas.

Verificación: public-offers.test.tsx y session-navigation.spec.ts para los tres
roles, visitante, navegación y cierre de sesión. El inicio conserva sus pruebas
previas. Requiere PR/publicación para verse en Vercel.
