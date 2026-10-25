export const registrationContent = {
  candidate: {
    label: "Cuenta de postulante", title: "Registro de candidatos", guide: "Tu próximo paso laboral empieza acá.",
    introduction: "Creá tu cuenta y prepará tu perfil para postularte a las ofertas del portal.",
    description: "Completá tus datos de acceso y confirmá la contraseña. Tu perfil laboral se completa después.",
    steps: [
      ["Creá tu cuenta", "Completá tus datos de acceso en este formulario."],
      ["Verificá tu correo", "Seguí el enlace que recibirás por email."],
      ["Completá tu perfil laboral", "Después de ingresar, agregá tu experiencia, intereses y CV desde tu panel."],
    ],
    privacy: "La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.",
  },
  company: {
    label: "Cuenta de empresa", title: "Registro de empresas", guide: "Encontrá talento para tu empresa.",
    introduction: "Gestioná tus búsquedas laborales con el acompañamiento de la Oficina de Empleo de Funes.",
    description: "Completá los datos de tu empresa y de acceso. Todos los campos son obligatorios, salvo el teléfono.",
    steps: [
      ["Creá tu cuenta", "Registrá tu empresa y verificá tu correo para ingresar."],
      ["Prepará tu oferta", "Guardá un borrador y envialo a revisión municipal antes de su publicación."],
      ["Recibí perfiles derivados", "La Oficina preselecciona y deriva candidatos para tus ofertas."],
    ],
    privacy: "Las empresas acceden únicamente a los candidatos derivados por la Oficina a sus propias ofertas.",
  },
} as const;
