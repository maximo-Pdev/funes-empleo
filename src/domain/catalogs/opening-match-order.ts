export const OPENING_MATCH_ORDERS = ["updated_desc", "updated_asc"] as const;
export type OpeningMatchOrder = (typeof OPENING_MATCH_ORDERS)[number];
export const DEFAULT_OPENING_MATCH_ORDER: OpeningMatchOrder = "updated_desc";
export const openingMatchOrderOptions = [
  { value: OPENING_MATCH_ORDERS[0], label: "Más recientes primero" },
  { value: OPENING_MATCH_ORDERS[1], label: "Más antiguos primero" },
] as const;
