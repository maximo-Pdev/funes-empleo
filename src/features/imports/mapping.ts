/** Synthetic project contract only. Never infer historical municipal columns. */
export const IMPORT_MAPPING = "demo-candidates-v1";
export const IMPORT_HEADERS = ["nombre", "dni", "email", "telefono", "localidad", "categorias", "experiencia", "disponibilidad", "referencia"] as const;
export const IMPORT_LIMITS = { bytes: 5 * 1024 * 1024, rows: 10_000, record: 64 * 1024 } as const;
export const IMPORT_FIELDS = ["name", "dni", "email", "phone", "locality", "categories", "summary", "availability"] as const;
export const IMPORT_MESSAGES: Record<string, string> = {
  INVALID_ROW: "Revisá nombre, DNI, contacto, disponibilidad y límites de texto.",
  UNMAPPED_CATEGORY: "Usá únicamente códigos de categorías ficticias activas DEMO-A o DEMO-B.",
  POTENTIAL_DUPLICATE: "Existe una coincidencia por DNI o correo: registrá una decisión con motivo.",
  INTRA_FILE_DUPLICATE: "Hay otra fila con el mismo DNI o correo: corregí o rechazá una de ellas.",
  STALE_CANDIDATE: "El perfil existente cambió. Revisá la decisión y su versión.",
};
