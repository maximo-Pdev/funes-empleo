// Presentation compatibility only, not an input or approved municipal catalog.
export function publicModalityLabel(value: string): string {
  return value === "onsite" ? "Presencial" : value;
}

export function publicContractTypeLabel(value: string): string {
  return value === "fixed_term" ? "Plazo fijo" : value;
}

// Calendar arithmetic avoids parsing a date-only value as a timezone-dependent instant.
export function formatPublicClosingDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.length !== 10) return value;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1 || month < 1 || month > 12 || day < 1) return value;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maximumDay = daysInMonth[month - 1];
  if (maximumDay === undefined || day > maximumDay) return value;
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}
