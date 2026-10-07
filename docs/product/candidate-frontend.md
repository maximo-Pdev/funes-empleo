# Diseño del área de candidatos

Las páginas `/candidato/perfil`, `/candidato/ofertas` y `/candidato/postulaciones`
usan la identidad municipal de las pantallas públicas y de registro: logos existentes,
verde institucional, superficies claras, tarjetas, iconos Lucide y foco visible.

La cabecera y navegación son locales a `(candidate)`. Los estilos de formularios están
encapsulados en un módulo CSS de ese grupo y usan los tokens existentes. No modifican
RoleShell, estilos globales, componentes funcionales ni las vistas de otros roles.

- Perfil: datos personales/laborales, contacto, consentimiento de prueba, CV,
  activación y archivo conservan sus formularios y confirmaciones. El archivo
  mantiene énfasis rojo y el consentimiento conserva el aviso de texto no aprobado.
- Ofertas: tarjetas y oferta seleccionada; se conservan los bloqueos de postulación,
  la prevención de otra postulación y la paginación existente.
- Participaciones: recepción y resultados finales del catálogo existente; retiro
  únicamente para recepción y con confirmación obligatoria.
- Carga y error: esqueletos y tarjeta de recuperación con foco y reintento existentes.

Verificación del 2026-10-07: lint, TypeScript y build aprobados; suite completa y
regresiones focalizadas comprobadas. Las capturas y axe usan HTML renderizado desde
los componentes reales con servicios simulados y datos ficticios, a 360, 768 y 1366 px.
Comprueban presentación, reflujo y foco; no acreditan sesión real, cargas de CV,
transiciones contra el backend, NVDA ni zoom real al 200%. T087 permanece pendiente.
