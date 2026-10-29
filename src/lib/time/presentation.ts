const TIME_ZONE = "America/Buenos_Aires";

/** A calendar date is not an instant: never shift it through UTC. */
export function formatCalendarDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.length !== 10) return value;
  const year = Number(value.slice(0, 4)), month = Number(value.slice(5, 7)), day = Number(value.slice(8, 10));
  if (year < 1 || month < 1 || month > 12 || day < 1) return value;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const maximum = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (maximum === undefined || day > maximum) return value;
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIME_ZONE, hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit",
});
function instant(value: string): Date | null {
  // Require an explicit offset so server and browser cannot disagree.
  if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}
function dateText(value: Date): string {
  const parts = dateFormat.formatToParts(value);
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === name)!.value;
  return `${part("day")}/${part("month")}/${part("year").padStart(4, "0")}`;
}
export function formatFunesDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatCalendarDate(value);
  const date = instant(value);
  return date ? dateText(date) : "Fecha no disponible";
}
export function formatFunesDateTime(value: string, { seconds = true }: { seconds?: boolean } = {}): string {
  const date = instant(value);
  if (!date) return "Fecha no disponible";
  const time = timeFormat.format(date);
  return `${dateText(date)}, ${seconds ? time : time.slice(0, 5)}`;
}
