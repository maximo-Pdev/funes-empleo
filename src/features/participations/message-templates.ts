export const MESSAGE_TEMPLATES = {
  follow_up: "Hola. Nos comunicamos desde la Oficina de Empleo de Funes para dar seguimiento a la búsqueda laboral. ¿Podés comunicarte con la Oficina para informarnos las novedades? Gracias.",
  appointment: "Hola. Desde la Oficina de Empleo de Funes queremos coordinar una instancia de atención. Por favor, comunicate con la Oficina para acordar día y horario. Gracias.",
} as const;
export function messageTemplate(kind: keyof typeof MESSAGE_TEMPLATES): string { return MESSAGE_TEMPLATES[kind]; }
