// Catálogo fijo de localidades del área para el registro de empresa y la búsqueda.
// Es una referencia de UI, no reemplaza la validación libre del campo `locality`.
export const LOCALITIES = [
  "Funes",
  "Roldán",
  "San Lorenzo",
  "Granadero Baigorria",
  "Ibarlucea",
  "Pérez",
  "Zavalla",
  "Rosario",
  "Villa Gobernador Gálvez",
  "Capitán Bermúdez",
  "Puerto General San Martín",
  "Carcarañá",
  "Fray Luis Beltrán",
  "Ricardone",
  "Álvarez",
  "Soldini",
  "Acebal",
  "Pujato",
] as const;

export type Locality = (typeof LOCALITIES)[number];
