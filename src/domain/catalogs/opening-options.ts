// Opciones seleccionables de modalidad y tipo de contratación para la creación
// de ofertas (listado "Cosas a implementar", EMPRESA › Ofertas).
export type OpeningOption = { value: string; label: string; description: string };

export const OPENING_MODALITY_OPTIONS: readonly OpeningOption[] = [
  { value: "onsite", label: "Presencial", description: "El trabajador cumple sus funciones de forma física en el establecimiento o sucursal del empleador." },
  { value: "remote", label: "Remoto", description: "Las tareas se desarrollan total o parcialmente fuera del establecimiento, usando tecnologías de la información (Ley N° 27.555)." },
  { value: "hybrid", label: "Híbrido", description: "Combina días de trabajo presencial en la oficina con jornadas de teletrabajo." },
  { value: "special", label: "Especial", description: "Esquemas particulares según el convenio colectivo: turnos rotativos, esquemas 3x3 u otros acuerdos de disponibilidad." },
];

export const OPENING_CONTRACT_OPTIONS: readonly OpeningOption[] = [
  { value: "indefinite", label: "Por tiempo indeterminado", description: "Regla general del contrato laboral en Argentina. Sin fecha de finalización; incluye un período de prueba inicial de hasta 6 meses." },
  { value: "part_time", label: "A tiempo parcial", description: "La prestación se realiza en una cantidad de horas inferior a dos tercios de la jornada habitual de la actividad." },
  { value: "fixed_term", label: "A plazo fijo", description: "Duración determinada con causa objetiva y un máximo de 5 años. Requiere preaviso de 1 a 2 meses antes de su vencimiento." },
  { value: "seasonal", label: "De temporada", description: "Se aplica a actividades cíclicas o estacionales que se repiten en determinadas épocas del año." },
  { value: "eventual", label: "Eventual", description: "Destinado a satisfacer necesidades extraordinarias y transitorias de la empresa." },
];
