import { AppError } from "@/lib/errors/public-error";

// Convert an HTML datetime-local value in the municipal timezone to an ISO UTC
// instant. Re-rendering the candidate instant catches invalid and nonexistent
// wall times if local timezone rules ever change.
export function funesLocalToIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new AppError("VALIDATION_ERROR");
  const naive = Date.parse(`${value}:00Z`);
  if (Number.isNaN(naive)) throw new AppError("VALIDATION_ERROR");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Buenos_Aires", hourCycle: "h23", year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const local = (utc: number) => {
    const parts = formatter.formatToParts(new Date(utc));
    const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}`;
  };
  let utc = naive + 3 * 60 * 60 * 1000;
  for (let index = 0; index < 3; index++) {
    const rendered = local(utc);
    if (rendered === value) return new Date(utc).toISOString();
    utc += naive - Date.parse(`${rendered}:00Z`);
  }
  throw new AppError("VALIDATION_ERROR");
}
