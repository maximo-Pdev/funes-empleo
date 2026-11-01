# Acceso desde ofertas públicas

EXTRA112,31/10/2026: catálogo y detalle comparten ahora HomeNavbar y getSiteAccess
por request. Mi cuenta abre el panel del rol y la campana solo se monta con panel
verificado. El detalle tampoco ofrece registro a personas ya autenticadas y solo
candidato/visitante conservan postulación; otros roles reciben su propio panel.
Sin cambiar guards, sesión o permisos. Ver public-offers-presentation.md.

EXTRA106/108, 29/10/2026. Mateo conserva solo el ajuste de /ofertas y descarta los
cambios del inicio/login, cuyo diseño y comportamiento vuelven al estado previo.

En /ofertas, la tarjeta lateral usa la sesión activa verificada en servidor:

- Candidato, empresa o administración: enlace a su panel, sin «Crear cuenta» ni
  «Iniciá sesión».
- Visitante: «Crear cuenta» abre /?registro=candidato; «Iniciá sesión» abre /.

No requiere migración, variables nuevas, dependencias ni configuración de
Supabase/Vercel. No cambia registro, recuperación, permisos ni reglas de sesión.
Se usa una lectura por request para header y CTA, sin estado global entre personas.

Verificación: public-offers.test.tsx y session-navigation.spec.ts para los tres
roles, visitante, navegación y cierre de sesión. El inicio conserva sus pruebas
previas. Requiere PR/publicación para verse en Vercel.
